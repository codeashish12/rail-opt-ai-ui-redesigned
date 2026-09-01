
from pathlib import Path
import re
import shutil
from datetime import datetime

PROJECT = Path.cwd()
TARGET = PROJECT / "backend" / "optimizer.py"

if not TARGET.exists():
    raise SystemExit(
        f"Could not find {TARGET}. "
        "Run this script from your project root (the folder containing backend/)."
    )

source = TARGET.read_text(encoding="utf-8-sig")

fixed_helpers = """
def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _resource_availability(
    resources: list[dict],
    planning_date: Any,
) -> float:
    # Supports several common resource-dataset schemas.
    if not resources:
        return 0.0

    explicit_percentages: list[float] = []

    percentage_keys = (
        "availability_percent",
        "availability_percentage",
        "availability_pct",
        "available_percent",
        "available_percentage",
    )

    for resource in resources:
        found = False

        for key in percentage_keys:
            raw = resource.get(key)
            if raw is not None:
                explicit_percentages.append(
                    max(0.0, min(100.0, _number(raw)))
                )
                found = True
                break

        if found:
            continue

        # Some datasets store availability directly as a numeric percentage.
        raw_availability = resource.get("availability")
        if isinstance(raw_availability, (int, float)):
            explicit_percentages.append(
                max(0.0, min(100.0, float(raw_availability)))
            )

    if explicit_percentages:
        return round(
            sum(explicit_percentages) / len(explicit_percentages),
            2,
        )

    utilization_values: list[float] = []

    for resource in resources:
        raw = resource.get("utilization_percent")
        if raw is None:
            raw = resource.get("utilization")

        if raw is not None:
            utilization_values.append(
                max(0.0, min(100.0, _number(raw)))
            )

    if utilization_values:
        return round(
            100.0 - (
                sum(utilization_values) / len(utilization_values)
            ),
            2,
        )

    # Quantity/capacity based datasets.
    quantity_pairs: list[tuple[float, float]] = []

    for resource in resources:
        total_raw = resource.get(
            "total_quantity",
            resource.get(
                "capacity",
                resource.get("quantity"),
            ),
        )

        available_raw = resource.get(
            "available_quantity",
            resource.get(
                "available_count",
                resource.get("available"),
            ),
        )

        if (
            total_raw is not None
            and isinstance(available_raw, (int, float))
        ):
            total = max(1.0, _number(total_raw, 1.0))
            available = max(
                0.0,
                min(total, _number(available_raw)),
            )
            quantity_pairs.append((available, total))

    if quantity_pairs:
        available = sum(pair[0] for pair in quantity_pairs)
        total = sum(pair[1] for pair in quantity_pairs)

        return (
            round(available / total * 100.0, 2)
            if total
            else 0.0
        )

    # Status/state based datasets.
    available_units = 0.0
    total_units = 0.0
    recognized_state = False

    for resource in resources:
        quantity = max(
            1.0,
            _number(
                resource.get(
                    "quantity",
                    resource.get("count", 1),
                ),
                1.0,
            ),
        )

        total_units += quantity

        raw_state = resource.get("status")
        if raw_state is None:
            raw_state = resource.get("state")
        if raw_state is None:
            raw_state = resource.get("condition")
        if raw_state is None:
            raw_state = resource.get("availability")

        if isinstance(raw_state, bool):
            recognized_state = True
            if raw_state:
                available_units += quantity
            continue

        state = str(raw_state or "").strip().lower()

        if state in {
            "available",
            "free",
            "ready",
            "operational",
            "active",
            "idle",
            "in_service",
            "in service",
        }:
            recognized_state = True
            available_units += quantity

        elif state in {
            "busy",
            "partial",
            "partially_available",
            "partially available",
            "limited",
        }:
            recognized_state = True
            available_units += quantity * 0.5

        elif state in {
            "unavailable",
            "offline",
            "maintenance",
            "blocked",
            "out_of_service",
            "out of service",
        }:
            recognized_state = True

    if recognized_state and total_units:
        return round(
            available_units / total_units * 100.0,
            2,
        )

    # Safety fallback: resources exist, but the dataset has no recognized
    # availability signal. Do not incorrectly report 0%.
    return 100.0


def _scenario_asset_availability(
    baseline: float,
    traffic: str,
    delay: str,
    resources_reduced: bool,
    emergency: bool,
    weather: bool,
) -> float:
    value = max(0.0, min(100.0, float(baseline)))

    value -= {
        "+20%": 2.5,
        "+40%": 5.0,
    }.get(traffic, 0.0)

    value -= {
        "Minor": 1.0,
        "Major": 3.0,
    }.get(delay, 0.0)

    if resources_reduced:
        value -= 12.0

    if weather:
        value -= 5.0

    if emergency:
        value += 1.0

    return round(
        max(0.0, min(100.0, value)),
        2,
    )
"""

pattern = re.compile(
    r"def _number\(value: Any, default: float = 0\.0\) -> float:.*?"
    r"(?=\ndef optimize\()",
    re.DOTALL,
)

match = pattern.search(source)

if not match:
    raise SystemExit(
        "Could not locate the helper section from _number through "
        "_scenario_asset_availability. No file was changed."
    )

backup = TARGET.with_suffix(
    TARGET.suffix + f".backup-{datetime.now():%Y%m%d-%H%M%S}"
)
shutil.copy2(TARGET, backup)

patched = (
    source[:match.start()]
    + fixed_helpers.strip("\n")
    + "\n\n"
    + source[match.end():]
)

TARGET.write_text(patched, encoding="utf-8")

print(f"FIXED: {TARGET}")
print(f"BACKUP: {backup}")
print("Asset availability helper logic has been replaced.")
