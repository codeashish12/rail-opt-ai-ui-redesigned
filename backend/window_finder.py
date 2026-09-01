from __future__ import annotations

from datetime import date, datetime, time, timedelta
import re

from .models import DataBundle
from .validator import _duration, _value


def _time(value: object, day: date) -> datetime | None:
    text = str(value or '').strip()
    for fmt in ('%H:%M', '%H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%dT%H:%M'):
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed.replace(year=day.year, month=day.month, day=day.day) if '%Y' in fmt else datetime.combine(day, parsed.time())
        except ValueError:
            continue
    return None


def find_windows(data: DataBundle, section_id: str, request_id: str, planning_day: date, horizon_minutes: int = 24 * 60) -> dict:
    request = next((item for item in data.maintenance_requests if _value(item, 'request_id', 'id') == request_id), None)
    section = next((item for item in data.sections if _value(item, 'section_id', 'id', 'section') == section_id), None)
    duration = _duration((request or {}).get('duration', (request or {}).get('duration_minutes'))) or 0
    resource_value = _value(request or {}, 'required_resource_equipment', 'required_resource', 'required_resource_id', 'resource_id', 'resource')
    resource = next((item for item in data.resources if _value(item, 'resource_id', 'id', 'resource') and _value(item, 'resource_id', 'id', 'resource') in resource_value), None)
    trains = [item for item in data.trains if _value(item, 'section_id', 'section') == section_id]
    start = datetime.combine(planning_day, time.min)
    horizon_end = start + timedelta(minutes=horizon_minutes)
    deadline = _time(_value(request or {}, 'execution_deadline', 'deadline'), planning_day)
    effective_end = min(horizon_end, deadline) if deadline else horizon_end
    occupied: list[tuple[datetime, datetime]] = []
    for train in trains:
        arrival = _time(_value(train, 'arrival', 'start_time'), planning_day)
        departure = _time(_value(train, 'departure', 'end_time'), planning_day)
        if arrival and departure and departure > start and arrival < effective_end:
            occupied.append((max(arrival, start), min(departure, effective_end)))
    occupied.sort()
    cursor = start
    windows = []
    for block_start, block_end in occupied + [(effective_end, effective_end)]:
        if block_start > cursor and (block_start - cursor).total_seconds() >= duration * 60:
            windows.append({'start': cursor.isoformat(), 'end': (cursor + timedelta(minutes=duration)).isoformat(), 'duration_minutes': duration, 'deadline_respected': bool(deadline and cursor + timedelta(minutes=duration) <= deadline) if deadline else True})
        cursor = max(cursor, block_end)
    return {'request_id': request_id, 'section_id': section_id, 'maintenance_request': request, 'section': section, 'duration_minutes': duration, 'required_resource': resource_value, 'required_resource_record': resource, 'relevant_trains': trains, 'candidate_windows': windows}
