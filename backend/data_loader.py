import json
from pathlib import Path

from .models import DataBundle


ROOT = Path(__file__).resolve().parents[1]


def _read(name: str) -> list[dict]:
    candidates = [
        ROOT / "public" / "data" / name,
        ROOT / "data" / name,
    ]

    for path in candidates:
        if not path.exists():
            continue

        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"Failed to read {path}: {exc}")
            return []

        def find_list(value):
            if isinstance(value, list):
                return value

            if isinstance(value, dict):
                for child in value.values():
                    result = find_list(child)
                    if result:
                        return result

            return []

        result = find_list(raw)

        if result:
            print(f"Loaded {len(result)} records from {path}")
            return result

        print(f"No list data found in {path}")

    print(f"File not found: {name}")
    return []


def load_data() -> DataBundle:
    return DataBundle(
        maintenance_requests=_read("maintenance_requests.json"),
        sections=_read("route_sections.json"),
        trains=_read("train_operations.json"),
        resources=_read("resources.json"),
        scenarios=_read("scenarios.json"),
    )