from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from .models import OptimizationInput, OptimizationResponse


def _id(item: dict, *keys: str) -> str:
    for key in keys:
        value = item.get(key)
        if value is not None and str(value).strip():
            return str(value)
    return ""


def _duration(item: dict) -> int:
    value = item.get("duration_minutes", item.get("duration", 60))

    if isinstance(value, (int, float)):
        return max(1, int(value))

    text = str(value).strip().lower()

    hours = 0
    minutes = 0

    if "h" in text:
        try:
            hours = int(text.split("h", 1)[0].split()[-1])
        except (ValueError, IndexError):
            pass

    if "m" in text:
        try:
            after_h = text.split("h", 1)[-1]
            minutes = int(after_h.split("m", 1)[0].split()[-1])
        except (ValueError, IndexError):
            pass

    if hours or minutes:
        return max(1, hours * 60 + minutes)

    try:
        return max(1, int(float(text)))
    except ValueError:
        return 60


def _dt(value: Any, fallback: datetime) -> datetime:
    if not value:
        return fallback

    text = str(value).strip().replace("Z", "+00:00")

    parsers = (
        lambda x: datetime.fromisoformat(x),
        lambda x: datetime.strptime(x, "%Y-%m-%d %H:%M"),
        lambda x: datetime.strptime(x, "%Y-%m-%dT%H:%M:%S"),
    )

    for parser in parsers:
        try:
            result = parser(text)
            if result.tzinfo is not None:
                result = result.replace(tzinfo=None)
            return result
        except (ValueError, TypeError):
            continue

    return fallback


def _empty(explanation: str, total_tasks: int = 0) -> OptimizationResponse:
    return OptimizationResponse(
        status="infeasible",
        blocks=[],
        conflicts=[],
        metrics={
            "total_blocks": 0,
            "total_block_hours": 0,
            "completed_tasks": 0,
            "total_tasks": total_tasks,
            "train_conflicts": 0,
            "resource_conflicts": 0,
            "late_tasks": 0,
            "maintenance_completion_percent": 0,
            "asset_availability": 0,
        },
        explanation=explanation,
    )

def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _resource_availability(
    resources: list[dict],
    planning_date: Any,
) -> float:
    """
    Calculate baseline asset/resource availability.

    Supports multiple dataset formats:
    - availability_percent / availability_percentage
    - utilization
    - available / total quantities
    - availability / status / state fields
    """

    if not resources:
        return 0.0

    # ---------------------------------------------------------
    # 1. Explicit percentage fields
    # ---------------------------------------------------------
    percentages: list[float] = []

    for resource in resources:
        for key in (
            "availability_percent",
            "availability_percentage",
            "asset_availability",
            "availability_pct",
        ):
            value = resource.get(key)

            if value is not None:
                number = _number(value, -1)

                if number >= 0:
                    percentages.append(
                        max(0.0, min(100.0, number))
                    )
                    break

    if percentages:
        return round(
            sum(percentages) / len(percentages),
            2,
        )

    # ---------------------------------------------------------
    # 2. Utilization-based availability
    # ---------------------------------------------------------
    utilizations: list[float] = []

    for resource in resources:
        for key in (
            "utilization",
            "utilization_percent",
            "utilization_percentage",
        ):
            value = resource.get(key)

            if value is not None:
                number = _number(value, -1)

                if number >= 0:
                    utilizations.append(
                        max(0.0, min(100.0, number))
                    )
                    break

    if utilizations:
        return round(
            100.0
            - (
                sum(utilizations)
                / len(utilizations)
            ),
            2,
        )

    # ---------------------------------------------------------
    # 3. Quantity / capacity based calculation
    # ---------------------------------------------------------
    total_quantity = 0.0
    available_quantity = 0.0

    for resource in resources:
        total = _number(
            resource.get(
                "total",
                resource.get(
                    "capacity",
                    resource.get(
                        "quantity",
                        resource.get(
                            "count",
                            1,
                        ),
                    ),
                ),
            ),
            1.0,
        )

        total = max(1.0, total)

        available = resource.get(
            "available",
            resource.get(
                "available_quantity",
                resource.get(
                    "available_count",
                ),
            ),
        )

        if available is not None:
            available_number = max(
                0.0,
                min(
                    total,
                    _number(
                        available,
                        total,
                    ),
                ),
            )

            total_quantity += total
            available_quantity += available_number
            continue

        # -----------------------------------------------------
        # 4. Status/state/availability based calculation
        # -----------------------------------------------------
        state = str(
            resource.get(
                "availability",
                resource.get(
                    "status",
                    resource.get(
                        "state",
                        resource.get(
                            "condition",
                            "",
                        ),
                    ),
                ),
            )
        ).strip().lower()

        total_quantity += total

        if state in {
            "available",
            "active",
            "ready",
            "operational",
            "free",
            "idle",
            "in service",
            "in_service",
        }:
            available_quantity += total

        elif state in {
            "busy",
            "partial",
            "partially_available",
            "partially available",
            "maintenance",
            "under maintenance",
        }:
            # Partially usable / occupied asset.
            available_quantity += total * 0.5

        elif state in {
            "unavailable",
            "offline",
            "down",
            "blocked",
            "out of service",
            "out_of_service",
        }:
            available_quantity += 0.0

        else:
            # Unknown state:
            # do not force the entire dataset to 0%.
            # Treat the asset as available unless explicit
            # evidence says otherwise.
            available_quantity += total

    if total_quantity > 0:
        return round(
            available_quantity
            / total_quantity
            * 100.0,
            2,
        )

    return 0.0

def _scenario_asset_availability(
    baseline: float,
    traffic: str,
    delay: str,
    resources_reduced: bool,
    emergency: bool,
    weather: bool,
) -> float:
    value = float(baseline)

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

def optimize(input_data: OptimizationInput) -> OptimizationResponse:
    try:
        from ortools.sat.python import cp_model
    except ImportError:
        return _empty(
            "OR-Tools is not installed in the active Python environment."
        )

    data = input_data.data
    scenario = input_data.scenario_parameters or {}

    traffic = str(scenario.get("traffic", "Normal"))
    delay = str(scenario.get("train_delay", "None"))
    resources_reduced = bool(
        scenario.get("resources_reduced", False)
    )
    emergency = bool(
        scenario.get("emergency_maintenance", False)
    )
    weather = bool(
        scenario.get("weather_restriction", False)
    )

    print("SCENARIO TRAFFIC:", traffic)
    print("SCENARIO PARAMETERS:", scenario)
    print(
        "REQUESTED MAINTENANCE COUNT:",
        len(input_data.maintenance_request_ids),
    )

    selected_ids = {
        str(value)
        for value in input_data.maintenance_request_ids
        if str(value).strip()
    }

    tasks = [
        task
        for task in data.maintenance_requests
        if _id(task, "id", "request_id") in selected_ids
    ]

    if not tasks:
        return _empty(
            "None of the requested maintenance IDs exist in the backend dataset.",
            0,
        )

    planning_window = str(input_data.planning_window)

    if "48" in planning_window:
        horizon = 48 * 60
    elif "12" in planning_window:
        horizon = 12 * 60
    else:
        horizon = 24 * 60

    traffic_buffer = {
        "+20%": 5,
        "+40%": 10,
    }.get(traffic, 0)

    delay_buffer = {
        "Minor": 5,
        "Major": 15,
    }.get(delay, 0)

    weather_buffer = 15 if weather else 0
    resource_penalty = 10 if resources_reduced else 0

    scenario_buffer = (
        traffic_buffer
        + delay_buffer
        + weather_buffer
    )

    model = cp_model.CpModel()

    starts: list[Any] = []
    ends: list[Any] = []
    intervals: list[Any] = []
    durations: list[int] = []

    for index, task in enumerate(tasks):
        duration = min(
            horizon,
            _duration(task)
            + scenario_buffer
            + resource_penalty,
        )

        durations.append(duration)

        start_var = model.new_int_var(
            0,
            max(0, horizon - duration),
            f"start_{index}",
        )

        end_var = model.new_int_var(
            duration,
            horizon,
            f"end_{index}",
        )

        interval = model.new_interval_var(
            start_var,
            duration,
            end_var,
            f"interval_{index}",
        )

        starts.append(start_var)
        ends.append(end_var)
        intervals.append(interval)

    # Same section = no overlapping maintenance.
    section_intervals: dict[str, list[Any]] = {}

    for index, task in enumerate(tasks):
        section = (
            _id(task, "section_id", "section")
            or input_data.section_id
        )

        section_intervals.setdefault(
            section,
            [],
        ).append(intervals[index])

    for section_list in section_intervals.values():
        if len(section_list) > 1:
            model.add_no_overlap(section_list)

    # Same resource = no overlapping assignments.
    resource_intervals: dict[str, list[Any]] = {}

    for index, task in enumerate(tasks):
        resource = _id(
            task,
            "required_resource_equipment",
            "required_resource",
            "resource_id",
            "resource",
        )

        if resource:
            resource_intervals.setdefault(
                resource,
                [],
            ).append(intervals[index])

    for resource_list in resource_intervals.values():
        if len(resource_list) > 1:
            model.add_no_overlap(resource_list)

    base = datetime.combine(
        input_data.planning_date,
        datetime.min.time(),
    )

    # Protected/high-priority trains.
    train_buffer = traffic_buffer

    for index, task in enumerate(tasks):
        task_section = (
            _id(task, "section_id", "section")
            or input_data.section_id
        )

        for train in data.trains:
            if (
                _id(train, "section_id", "section")
                != task_section
            ):
                continue

            priority = str(
                train.get("priority", "")
            ).lower()

            if priority not in {
                "protected",
                "high",
            }:
                continue

            arrival = _dt(
                train.get(
                    "arrival",
                    train.get("start_time"),
                ),
                base,
            )

            departure = _dt(
                train.get(
                    "departure",
                    train.get("end_time"),
                ),
                arrival + timedelta(minutes=1),
            )

            before_end = int(
                (
                    arrival - base
                ).total_seconds()
                // 60
            ) - train_buffer

            after_start = int(
                (
                    departure - base
                ).total_seconds()
                // 60
            ) + train_buffer

            before_end = max(
                0,
                min(horizon, before_end),
            )

            after_start = max(
                0,
                min(horizon, after_start),
            )

            before = model.new_bool_var(
                f"before_train_{index}_{abs(before_end)}"
            )

            after = model.new_bool_var(
                f"after_train_{index}_{abs(after_start)}"
            )

            model.add(
                ends[index] <= before_end
            ).only_enforce_if(before)

            model.add(
                starts[index] >= after_start
            ).only_enforce_if(after)

            model.add(
                before + after == 1
            )

    # Lateness.
    late_vars: list[Any] = []

    for index, task in enumerate(tasks):
        deadline_value = task.get(
            "execution_deadline",
            task.get("deadline"),
        )

        if not deadline_value:
            late_vars.append(
                model.new_int_var(
                    0,
                    0,
                    f"late_{index}",
                )
            )
            continue

        deadline = _dt(
            deadline_value,
            base,
        )

        deadline_minute = int(
            (
                deadline - base
            ).total_seconds()
            // 60
        )

        deadline_minute = max(
            0,
            min(
                horizon,
                deadline_minute,
            ),
        )

        late = model.new_int_var(
            0,
            horizon,
            f"late_{index}",
        )

        model.add(
            late
            >= ends[index] - deadline_minute
        )

        model.add(late >= 0)

        late_vars.append(late)

    model.minimize(
        sum(late_vars) * 10000
        + sum(starts)
        + (
            0
            if emergency
            else sum(durations)
        )
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10
    solver.parameters.num_search_workers = 8

    status = solver.solve(model)

    if status not in (
        cp_model.OPTIMAL,
        cp_model.FEASIBLE,
    ):
        return _empty(
            "No feasible schedule satisfies the selected "
            "maintenance, section, resource, and "
            "protected-train constraints.",
            len(tasks),
        )

    blocks: list[dict] = []
    late_count = 0

    for index, task in enumerate(tasks):
        start_minute = solver.value(
            starts[index]
        )

        end_minute = solver.value(
            ends[index]
        )

        late_count += solver.value(
            late_vars[index]
        )

        task_section = (
            _id(
                task,
                "section_id",
                "section",
            )
            or input_data.section_id
        )

        resource = _id(
            task,
            "required_resource_equipment",
            "required_resource",
            "resource_id",
            "resource",
        )

        start_dt = (
            base
            + timedelta(minutes=start_minute)
        )

        end_dt = (
            base
            + timedelta(minutes=end_minute)
        )

        blocks.append(
            {
                "block_id": (
                    f"BLK-{index + 1:03d}"
                ),
                "section_id": task_section,
                "start_time": start_dt.isoformat(
                    timespec="minutes"
                ),
                "end_time": end_dt.isoformat(
                    timespec="minutes"
                ),
                "maintenance_request_ids": [
                    _id(
                        task,
                        "id",
                        "request_id",
                    )
                ],
                "resource_ids": (
                    [resource]
                    if resource
                    else []
                ),
                "explanation": (
                    "Solver-selected maintenance "
                    "window. "
                    f"Traffic={traffic}, "
                    f"delay={delay}, "
                    f"resources_reduced="
                    f"{resources_reduced}, "
                    f"emergency={emergency}, "
                    f"weather={weather}."
                ),
            }
        )

    # Validate protected train conflicts.
    train_conflicts = 0

    for block in blocks:
        block_section = block["section_id"]

        block_start = datetime.fromisoformat(
            block["start_time"]
        )

        block_end = datetime.fromisoformat(
            block["end_time"]
        )

        for train in data.trains:
            if (
                _id(
                    train,
                    "section_id",
                    "section",
                )
                != block_section
            ):
                continue

            arrival = _dt(
                train.get("arrival"),
                base,
            )

            departure = _dt(
                train.get("departure"),
                arrival + timedelta(minutes=1),
            )

            overlaps = (
                block_start < departure
                and block_end > arrival
            )

            protected = (
                str(
                    train.get(
                        "priority",
                        "",
                    )
                ).lower()
                in {"protected", "high"}
            )

            if overlaps and protected:
                train_conflicts += 1

    # Validate resource conflicts.
    resource_windows: dict[
        str,
        list[tuple[datetime, datetime]],
    ] = {}

    for block in blocks:
        for resource in block["resource_ids"]:
            resource_windows.setdefault(
                resource,
                [],
            ).append(
                (
                    datetime.fromisoformat(
                        block["start_time"]
                    ),
                    datetime.fromisoformat(
                        block["end_time"]
                    ),
                )
            )

    resource_conflicts = 0

    for windows in resource_windows.values():
        for left in range(len(windows)):
            for right in range(
                left + 1,
                len(windows),
            ):
                a_start, a_end = windows[left]
                b_start, b_end = windows[right]

                if (
                    a_start < b_end
                    and a_end > b_start
                ):
                    resource_conflicts += 1

    total_minutes = sum(
        (
            datetime.fromisoformat(
                block["end_time"]
            )
            - datetime.fromisoformat(
                block["start_time"]
            )
        ).total_seconds()
        / 60
        for block in blocks
    )

    completed = len(blocks)

    baseline_asset_availability = (
        _resource_availability(
            data.resources,
            input_data.planning_date,
        )
    )

    asset_availability = (
        _scenario_asset_availability(
            baseline=baseline_asset_availability,
            traffic=traffic,
            delay=delay,
            resources_reduced=resources_reduced,
            emergency=emergency,
            weather=weather,
        )
    )

    print(
        "ASSET AVAILABILITY:",
        baseline_asset_availability,
        "->",
        asset_availability,
    )

    final_status = (
        "optimal"
        if status == cp_model.OPTIMAL
        else "feasible"
    )

    return OptimizationResponse(
        status=final_status,
        blocks=blocks,
        conflicts=[],
        metrics={
            "total_blocks": completed,
            "total_block_hours": round(
                total_minutes / 60,
                2,
            ),
            "completed_tasks": completed,
            "total_tasks": len(tasks),
            "train_conflicts": train_conflicts,
            "resource_conflicts": resource_conflicts,
            "late_tasks": late_count,
            "maintenance_completion_percent": round(
                completed
                / max(1, len(tasks))
                * 100,
                2,
            ),
            "asset_availability": asset_availability,
        },
        explanation=(
            "CP-SAT generated the schedule from "
            "the selected maintenance IDs. "
            "Same-section and same-resource "
            "overlaps are constrained, and "
            "protected/high-priority train "
            "windows are protected."
        ),
    )


def run_optimization(
    input_data: OptimizationInput,
) -> OptimizationResponse:
    return optimize(input_data)