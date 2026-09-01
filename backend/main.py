from datetime import date
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .data_loader import load_data
from .models import DataBundle, HealthResponse, OptimizationInput, OptimizationRequest, OptimizationResponse
from .optimizer import optimize
from .validator import validate_dataset, validate_request, resolve_section_id, _value, _duration
from .window_finder import find_windows


def _find(items: list[dict], *keys: str, value: str) -> dict | None:
    return next((item for item in items if _value(item, *keys) == value), None)


def _test_validation(data: DataBundle, request: dict, section: dict | None, resource: dict | None, trains: list[dict]) -> dict:
    report = validate_dataset(data)
    errors = list(report.errors)
    warnings = list(report.warnings)
    if request is None:
        errors.append("maintenance request REQ-001 was not found in maintenance.json")
    if section is None:
        errors.append("section SEC-001 was not found in the loaded section dataset")
    if request and resource is None:
        errors.append("required resource for REQ-001 was not found in resources.json")
    if request and _duration(request.get("duration", request.get("duration_minutes"))) is None:
        errors.append("REQ-001 has no valid positive duration")
    if request and not _value(request, "priority"):
        errors.append("REQ-001 has no priority")
    if request and not _value(request, "execution_deadline", "deadline"):
        errors.append("REQ-001 has no execution deadline")
    if section and not trains:
        warnings.append("no trains matched section_id SEC-001")
    return {"valid": not errors, "errors": sorted(set(errors)), "warnings": sorted(set(warnings))}

app = FastAPI(title="RailOpt AI Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

@app.get("/health", response_model=HealthResponse)
def health(): return HealthResponse(status="ok", optimizer="Google OR-Tools CP-SAT")

@app.get("/optimization/test-window/{section_id}/{request_id}")
def test_window(section_id: str, request_id: str, request: Request):
    print(f"[v0] REQUEST URL={request.url} METHOD={request.method} PATH PARAMETERS={{'section_id': '{section_id}', 'request_id': '{request_id}'}}")
    data = load_data()
    canonical_section_id = resolve_section_id(section_id, data)
    result = find_windows(data, canonical_section_id, request_id, date.today())
    request = _find(data.maintenance_requests, 'request_id', 'id', value=request_id)
    section = _find(data.sections, 'section_id', 'id', 'section', value=canonical_section_id)
    report = _test_validation(data, request, section, result.get('required_resource_record'), result.get('relevant_trains', []))
    result['validation'] = report
    result.pop('required_resource_record', None)
    print(f"[v0] VALIDATION ERROR={report.get('errors', [])} FULL BACKEND RESPONSE BODY={result}")
    if report.get('errors'):
        print(f"[v0] DATASET COUNTS maintenance={len(data.maintenance_requests)} sections={len(data.sections)} trains={len(data.trains)} resources={len(data.resources)}")
    return result

@app.get("/optimization/test/{section_id}/{request_id}")
def test_single_maintenance_request(section_id: str, request_id: str):
    data = load_data()
    maintenance = _find(data.maintenance_requests, "request_id", "id", value=request_id)
    section = _find(data.sections, "section_id", "id", "section", value=section_id)
    resource_id = _value(maintenance or {}, "required_resource", "required_resource_id", "resource_id", "resource")
    resource = _find(data.resources, "resource_id", "id", "resource", value=resource_id) if resource_id else None
    canonical_section_id = resolve_section_id(section_id, data)
    trains = [train for train in data.trains if _value(train, "section_id", "section") == canonical_section_id]
    return {
        "maintenance_request": maintenance,
        "matching_section": section,
        "required_resource": resource,
        "relevant_trains": trains,
        "validation": _test_validation(data, maintenance, section, resource, trains),
    }

@app.get("/optimization/validate")
def validate_optimization_data():
    return validate_dataset(load_data()).model_dump()

@app.post("/optimization/validate")
def validate_supplied_data(data: DataBundle):
    return validate_dataset(data).model_dump()

@app.post("/optimization/run", response_model=OptimizationResponse)
def run_optimization(request: OptimizationRequest):
    data = load_data()
    validate_request(request, data)
    payload = request.model_dump()
    payload["section_id"] = resolve_section_id(request.section_id, data)
    return optimize(OptimizationInput(**payload, data=data))
