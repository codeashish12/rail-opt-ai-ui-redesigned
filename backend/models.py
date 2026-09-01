from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class OptimizationRequest(BaseModel):
    planning_date: date
    section_id: str = Field(min_length=1)
    maintenance_request_ids: list[str] = Field(min_length=1)
    planning_window: str = Field(default="24 hours", min_length=1)
    scenario_id: str | None = None
    scenario_parameters: dict[str, Any] | None = None


class ValidationReport(BaseModel):
    valid: bool
    errors: list[str] = []
    warnings: list[str] = []


class OptimizationResponse(BaseModel):
    status: str
    blocks: list[dict]
    conflicts: list[dict]
    metrics: dict[str, int | float]
    explanation: str


class HealthResponse(BaseModel):
    status: str
    optimizer: str


class DataBundle(BaseModel):
    maintenance_requests: list[dict] = []
    sections: list[dict] = []
    trains: list[dict] = []
    resources: list[dict] = []
    scenarios: list[dict] = []


class OptimizationInput(OptimizationRequest):
    data: DataBundle
