from __future__ import annotations

import re
from datetime import datetime
from fastapi import HTTPException
from .models import DataBundle, OptimizationRequest, ValidationReport


def _value(item: dict, *keys: str) -> str:
    for key in keys:
        value = item.get(key)
        if value not in (None, ""):
            return str(value).strip()
    return ""


def _parse_time(value: str) -> bool:
    if not value:
        return False
    candidates = (value.replace("Z", "+00:00"),)
    for candidate in candidates:
        try:
            datetime.fromisoformat(candidate)
            return True
        except ValueError:
            pass
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%H:%M", "%H:%M:%S"):
        try:
            datetime.strptime(value, fmt)
            return True
        except ValueError:
            pass
    return False


def _duration(value: object) -> int | None:
    if isinstance(value, (int, float)):
        return int(value) if value > 0 else None
    text = str(value or "").lower()
    match = re.fullmatch(r"\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*", text)
    if not match or not any(match.groups()):
        return None
    return int(match.group(1) or 0) * 60 + int(match.group(2) or 0) or None

def _resource_id(item: dict) -> str:
    raw = _value(
        item,
        "required_resource_id",
        "resource_id",
        "required_resource_equipment",
        "required_resource",
        "resource",
    )

    match = re.search(r"\bRES-\d+\b", raw)
    return match.group(0) if match else raw


def _duplicates(items: list[dict], *keys: str) -> list[str]:
    ids = [_value(item, *keys) for item in items]
    return sorted({item for item in ids if item and ids.count(item) > 1})


def validate_dataset(data: DataBundle) -> ValidationReport:
    errors: list[str] = []
    warnings: list[str] = []
    sections = {_value(item, "section_id", "id", "section") for item in data.sections}
    resources = {_value(item, "resource_id", "id", "resource") for item in data.resources}

    for label, items, keys in (("maintenance", data.maintenance_requests, ("request_id", "id")), ("sections", data.sections, ("section_id", "id", "section")), ("trains", data.trains, ("train_id", "id")), ("resources", data.resources, ("resource_id", "id", "resource"))):
        for duplicate in _duplicates(items, *keys):
            errors.append(f"duplicate {label} ID: {duplicate}")

    for item in data.maintenance_requests:
        item_id = _value(item, "request_id", "id") or "<unknown>"
        section_id = _value(item, "section_id", "section")
        resource_id = _resource_id(item)

        if not section_id: errors.append(f"maintenance {item_id}: missing section_id")
        elif section_id not in sections: errors.append(f"maintenance {item_id}: missing section ID {section_id}")
        if not resource_id: errors.append(f"maintenance {item_id}: missing required_resource")
        elif resource_id not in resources: errors.append(f"maintenance {item_id}: missing resource ID {resource_id}")
        if not _value(item, "priority"): errors.append(f"maintenance {item_id}: missing priority")
        deadline = _value(item, "execution_deadline", "deadline")
        if not deadline: errors.append(f"maintenance {item_id}: missing deadline")
        elif not _parse_time(deadline): errors.append(f"maintenance {item_id}: invalid deadline {deadline}")
        duration = item.get("duration", item.get("duration_minutes"))
        if _duration(duration) is None: errors.append(f"maintenance {item_id}: invalid duration")

    for item in data.trains:
        item_id = _value(item, "train_id", "id") or "<unknown>"
        section_id = _value(item, "section_id", "section")
        if section_id and section_id not in sections: errors.append(f"train {item_id}: missing section ID {section_id}")
        for field in ("arrival", "departure", "start_time", "end_time"):
            if field in item and item[field] not in (None, "") and not _parse_time(str(item[field])):
                errors.append(f"train {item_id}: invalid time value in {field}")

    if not data.maintenance_requests: warnings.append("maintenance dataset is empty")
    if not data.resources: warnings.append("resource dataset is empty")
    return ValidationReport(valid=not errors, errors=errors, warnings=warnings)


# Frontend uses a presentation ID for the first network section (A-14),
# while the backend master dataset uses canonical IDs (SEC-001, SEC-002, ...).
# Keep the UI ID accepted at the API boundary instead of forcing the UI to know
# the backend's internal section-code scheme.
SECTION_ID_ALIASES = {
    "A-14": "SEC-001",
}


def resolve_section_id(section_id: str, data: DataBundle) -> str:
    candidate = str(section_id or "").strip()
    canonical = SECTION_ID_ALIASES.get(candidate, candidate)
    section_ids = {_value(item, "section_id", "id", "section") for item in data.sections}
    return canonical if canonical in section_ids else candidate


def validate_request(request: OptimizationRequest, data: DataBundle) -> ValidationReport:
    report = validate_dataset(data)
    section_ids = {_value(item, "section_id", "id", "section") for item in data.sections}
    resolved_section_id = resolve_section_id(request.section_id, data)
    if resolved_section_id not in section_ids:
        report.errors.append(f"request: unknown section_id {request.section_id}")
    request_ids = {_value(item, "request_id", "id") for item in data.maintenance_requests}
    for item in request.maintenance_request_ids:
        if item not in request_ids:
            report.errors.append(f"request: unknown maintenance_request_id {item}")
    report.valid = not report.errors
    if not report.valid:
        raise HTTPException(status_code=422, detail=report.model_dump())
    return report
