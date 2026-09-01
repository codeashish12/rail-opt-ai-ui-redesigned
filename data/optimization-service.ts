import type { MaintenanceRequest, Resource, Train } from "./types";

export type ScenarioParameters = {
  traffic: string;
  train_delay: string;
  resources_reduced: boolean;
  emergency_maintenance: boolean;
  weather_restriction: boolean;
};

export type OptimizationData = {
  maintenance_requests?: unknown[];
  trains?: unknown[];
  resources?: unknown[];
  sections?: unknown[];
  scenarios?: unknown[];
};

export type OptimizationInput = {
  planningDate: string;
  sectionId: string;
  maintenanceRequestIds: string[];
  planningWindow: string;

  scenarioId?: string | null;
  scenarioParameters?: ScenarioParameters | null;

  data?: OptimizationData;

  // Backward-compatible fields
  maintenanceRequests?: MaintenanceRequest[];
  trainMovements?: Train[];
  resources?: Resource[];
  sections?: unknown[];
  scenarios?: unknown[];
};

export type OptimizationResponse = {
  status: "optimal" | "feasible" | "infeasible" | string;
  blocks: Array<Record<string, unknown>>;
  conflicts: Array<Record<string, unknown>>;
  metrics: Record<string, number>;
  explanation: string;
};

const getApiBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

const getApiUrl = (): string => {
  const apiBase = getApiBaseUrl();

  return apiBase
    ? `${apiBase}/optimization/run`
    : "/api/optimization/run";
};

const normalizeDate = (value: string): string => {
  const text = String(value ?? "").trim();

  if (!text) {
    return new Date().toISOString().slice(0, 10);
  }

  return text.slice(0, 10);
};

const uniqueIds = (values: string[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );

const arrayOrEmpty = <T>(value: T[] | undefined): T[] =>
  Array.isArray(value) ? value : [];

export async function runOptimization(
  input: OptimizationInput,
): Promise<OptimizationResponse> {
  const sectionId = String(input.sectionId ?? "").trim();

  if (!sectionId) {
    throw new Error(
      "Optimization requires a railway section.",
    );
  }

  const maintenanceRequestIds = uniqueIds(
    input.maintenanceRequestIds,
  );

  if (!maintenanceRequestIds.length) {
    throw new Error(
      "Optimization requires at least one maintenance request.",
    );
  }

  /*
   * Prefer the new normalized `data` object.
   * Fall back to the older fields so existing screens continue working.
   */

  const maintenanceRequests =
    arrayOrEmpty(input.data?.maintenance_requests).length > 0
      ? arrayOrEmpty(input.data?.maintenance_requests)
      : arrayOrEmpty(input.maintenanceRequests);

  const trains =
    arrayOrEmpty(input.data?.trains).length > 0
      ? arrayOrEmpty(input.data?.trains)
      : arrayOrEmpty(input.trainMovements);

  const resources =
    arrayOrEmpty(input.data?.resources).length > 0
      ? arrayOrEmpty(input.data?.resources)
      : arrayOrEmpty(input.resources);

  const sections =
    arrayOrEmpty(input.data?.sections).length > 0
      ? arrayOrEmpty(input.data?.sections)
      : arrayOrEmpty(input.sections);

  const scenarios =
    arrayOrEmpty(input.data?.scenarios).length > 0
      ? arrayOrEmpty(input.data?.scenarios)
      : arrayOrEmpty(input.scenarios);

  /*
   * IMPORTANT:
   *
   * Always send resources to the backend.
   *
   * The backend calculates asset availability from this dataset.
   * This keeps scenario calculations deterministic and prevents
   * accidental empty-resource fallback values.
   */

  const payload = {
    planning_date: normalizeDate(input.planningDate),

    section_id: sectionId,

    maintenance_request_ids: maintenanceRequestIds,

    planning_window:
      input.planningWindow?.trim() || "24 hours",

    scenario_id:
      input.scenarioId ?? null,

    scenario_parameters:
      input.scenarioParameters ?? null,

    data: {
      maintenance_requests: maintenanceRequests,
      trains,
      resources,
      sections,
      scenarios,
    },
  };

  const response = await fetch(
    getApiUrl(),
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify(payload),

      cache: "no-store",
    },
  );

  const raw = await response.text();

  let body: unknown = {};

  try {
    body = raw
      ? JSON.parse(raw)
      : {};
  } catch {
    throw new Error(
      [
        `Optimization API returned non-JSON (${response.status}).`,
        raw || "(empty response)",
      ].join("\n"),
    );
  }

  if (!response.ok) {
    throw new Error(
      [
        `Optimization API failed (${response.status}).`,
        JSON.stringify(body, null, 2),
      ].join("\n"),
    );
  }

  /*
   * Basic response validation.
   * This catches HTML/error responses or malformed API responses
   * before they reach the dashboard.
   */

  if (
    !body ||
    typeof body !== "object" ||
    !("status" in body) ||
    !("metrics" in body)
  ) {
    throw new Error(
      "Optimization API returned an invalid response. Expected `status` and `metrics`.",
    );
  }

  return body as OptimizationResponse;
}

export type {
  MaintenanceRequest,
  Resource,
  Train,
};