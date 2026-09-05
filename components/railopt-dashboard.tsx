"use client";
import DashboardHomeRedesigned from "@/components/DashboardHomeRedesigned";
import { useEffect, useMemo, useState } from "react";
import { RailKpi } from "@/components/railopt-design-system";
import {
  blockPlanningTasks,
  resources,
  sections,
  stations,
  trains,
  scenarios,
  activeTrains,
  activeConflicts,
  assetAvailability,
  maintenanceCompletion,
  plannedBlocks,
  totalBlockHours,
  totalMaintenanceRequests,
  totalResources,
  trainConflicts,
} from "@/data";
import { useMaintenanceRequests } from "@/data/use-maintenance-requests";
import {
  runOptimization,
  type OptimizationResponse,
} from "@/data/optimization-service";
import {
  normalizeOptimizationResult,
  useOptimizationResult,
} from "@/data/optimization-results";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleGauge,
  ClipboardList,
  Clock3,
  Gauge,
  LayoutDashboard,
  Map,
  Menu,
  Network,
  Radar,
  Route,
  Search,
  Settings2,
  Sparkles,
  TrainFront,
  TriangleAlert,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Maintenance Request", icon: ClipboardList },
  { label: "Train Operations", icon: TrainFront },
  { label: "Railway Network", icon: Network },
  { label: "Resources", icon: Users },
  { label: "Block Planning", icon: Route },
  { label: "Optimized Block Plan", icon: Check },
  { label: "AI Optimization", icon: Sparkles },
  { label: "What-if Simulation", icon: Radar },
  { label: "Reports", icon: Gauge },
];

const priorityClass: Record<string, string> = {
  Urgent: "bg-destructive/10 text-destructive",
  High: "bg-accent/15 text-accent",
  Medium: "bg-primary/10 text-primary",
  Low: "bg-muted text-muted-foreground",
};

function Shell({
  active,
  setActive,
  sidebarOpen,
  setSidebarOpen,
  children,
}: {
  active: string;
  setActive: (s: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground lg:flex">
      <button
        aria-label="Close navigation"
        className={`fixed inset-0 z-20 bg-foreground/30 transition-opacity duration-300 lg:hidden ${sidebarOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        aria-hidden={!sidebarOpen}
        className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out will-change-transform lg:static lg:translate-x-0 lg:duration-0 ${sidebarOpen ? "translate-x-0 shadow-2xl" : ""}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrainFront className="size-5" />
          </div>
          <div>
            <div className="font-mono text-sm font-bold tracking-tight text-sidebar-foreground">
              RailOpt <span className="text-primary">AI</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Operations platform
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </p>
          <nav className="flex flex-col gap-1" aria-label="Main navigation">
            {nav.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActive(label);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs transition-colors duration-200 ${active === label ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
                {label === "AI Optimization" && (
                  <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                    NEW
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-4 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" /> Prototype
            workspace
          </div>
          <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent">
            <Settings2 className="size-4" /> Workspace settings
          </button>
          <div className="mt-3 flex items-center gap-3 border-t border-sidebar-border pt-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold">
              AK
            </div>
            <div>
              <p className="text-xs font-medium text-sidebar-foreground">
                Ashish Kumar
              </p>
              <p className="text-[10px] text-muted-foreground">
                Network planner
              </p>
            </div>
            <ChevronDown className="ml-auto size-3 text-muted-foreground" />
          </div>
        </div>
      </aside>
      <section className="min-w-0 w-full flex-1 overflow-hidden">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card/70 px-3 py-3 sm:px-4 md:h-20 md:flex-nowrap md:px-8 md:py-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              className="rounded-md p-2 transition-colors duration-200 hover:bg-muted lg:hidden"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                Network Control Center / {active}
              </p>
              <h1 className="truncate font-mono text-base font-semibold tracking-tight sm:text-lg">
                {active}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground sm:flex">
              <CalendarDays className="size-3.5" />
              Today, 18 Jun 2024
              <ChevronDown className="size-3" />
            </button>
            <button className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground md:flex">
              <Map className="size-3.5" />
              Northern Division
              <ChevronDown className="size-3" />
            </button>
            <div className="hidden items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[10px] font-medium text-primary lg:flex">
              <span className="size-1.5 rounded-full bg-primary" />
              Prototype dataset
            </div>
            <button
              aria-label="Notifications"
              className="relative rounded-md border border-border p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted"
            >
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" />
            </button>
            <div className="hidden size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:flex">
              AS
            </div>
          </div>
        </header>
        <div className="relative mx-auto max-w-[1500px] p-3 sm:p-4 md:p-8">
          {children}
          <div className="fixed bottom-4 right-4 z-10 flex flex-col gap-2">
            <button
              aria-label="Scroll up"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="rounded-full border border-border bg-card/95 p-2 text-muted-foreground shadow-lg transition duration-200 motion-safe:hover:-translate-y-0.5 hover:text-foreground motion-safe:active:scale-95"
            >
              <ChevronDown className="size-4 rotate-180" />
            </button>
            <button
              aria-label="Scroll down"
              onClick={() =>
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: "smooth",
                })
              }
              className="rounded-full border border-border bg-card/95 p-2 text-muted-foreground shadow-lg transition duration-200 motion-safe:hover:translate-y-0.5 hover:text-foreground motion-safe:active:scale-95"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardMetrics() {
  const { maintenanceRequests, isLoading } = useMaintenanceRequests();
  const metrics = [
    {
      label: "Maintenance Requests",
      value: isLoading ? "—" : String(maintenanceRequests.length),
      change: "Live maintenance records",
      status: "default" as const,
    },
    {
      label: "Train Operations",
      value: String(trains.length),
      change: "Current train records",
      status: "default" as const,
    },
    {
      label: "Sections",
      value: String(sections.length),
      change: "Route sections tracked",
      status: "default" as const,
    },
    {
      label: "Resources",
      value: String(resources.length),
      change: "Resource records tracked",
      status: "success" as const,
    },
    {
      label: "Planned Blocks",
      value: "—",
      change: "No optimized blocks yet",
      status: "default" as const,
    },
    {
      label: "Active Conflicts",
      value: "—",
      change: "Conflict analysis pending",
      status: "default" as const,
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric) => (
        <RailKpi
          key={metric.label}
          label={metric.label}
          value={metric.value}
          change={metric.change}
          status={metric.status}
          className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        />
      ))}
    </div>
  );
}

function DashboardHome() {
  const [simulated, setSimulated] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const generate = () => {
    setOptimizing(true);
    window.setTimeout(() => setOptimizing(false), 1600);
  };
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> DATASET
            OVERVIEW
          </div>
          <h2 className="text-balance font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Good morning, Aarav
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Review your network readiness and generate an optimized maintenance
            plan for the next operating window.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSimulated(!simulated)}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium transition duration-200 hover:bg-muted motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98]"
          >
            <Radar className="size-3.5" />
            {simulated ? "Simulation active" : "Run what-if simulation"}
          </button>
          <button
            onClick={generate}
            disabled={optimizing}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:transform-none"
          >
            <Sparkles
              className={`size-3.5 ${optimizing ? "motion-safe:animate-pulse" : ""}`}
            />
            {optimizing ? "Optimizing network…" : "Generate Optimized Plan"}
          </button>
        </div>
      </div>
      <DashboardMetrics />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="rounded-lg border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          <div className="border-b border-border p-5">
            <h3 className="font-mono text-sm font-semibold">
              Block utilization
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Network occupancy across the next 24 hours
            </p>
          </div>
          <div className="p-3 sm:overflow-x-auto sm:p-5">
            <div className="w-full sm:min-w-[620px]">
              {[
                "Section A",
                "Section B",
                "Section C",
                "Section D",
                "Section E",
              ].map((s, i) => (
                <div key={s} className="mb-2 flex items-center gap-3">
                  <span className="w-24 text-right font-mono text-[11px] text-muted-foreground">
                    {s}
                  </span>
                  <div className="relative h-8 flex-1 rounded bg-muted/60">
                    <div
                      className={`absolute top-1.5 h-5 rounded-sm ${i === 2 ? "bg-accent" : "bg-primary"}`}
                      style={{
                        left: `${[8, 31, 51, 22, 68][i]}%`,
                        width: `${[22, 27, 19, 32, 21][i]}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="border-b border-border p-5">
            <h3 className="font-mono text-sm font-semibold">
              Optimization readiness
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Inputs available to the engine
            </p>
          </div>
          <div className="p-5">
            <div className="mb-5">
              <span className="font-mono text-4xl font-semibold">92</span>
              <span className="ml-1 text-sm text-muted-foreground">/ 100</span>
            </div>
            {[
              "Maintenance requests",
              "Train timetable",
              "Resource availability",
              "Constraints checked",
            ].map((x, i) => (
              <div
                key={x}
                className="flex items-center justify-between border-b border-border/70 py-3 text-xs"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className={`flex size-4 items-center justify-center rounded-full ${i === 2 ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}
                  >
                    {i === 2 ? (
                      <AlertTriangle className="size-2.5" />
                    ) : (
                      <Check className="size-2.5" />
                    )}
                  </span>
                  {x}
                </span>
                <span className="font-medium">
                  {i === 0
                    ? "18 / 18 synced"
                    : i === 1
                      ? "Updated 4 min ago"
                      : i === 2
                        ? "2 warnings"
                        : "All validated"}
                </span>
              </div>
            ))}
            <button
              onClick={generate}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 py-2.5 text-xs font-semibold text-primary shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.98]"
            >
              <Zap className="size-3" /> Start optimization engine
            </button>
          </div>
        </section>
      </div>
      {simulated && (
        <div
          role="status"
          className="mt-4 flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4 text-xs motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
        >
          <Radar className="size-4 text-primary" />
          <div>
            <p className="font-semibold">What-if simulation active</p>
            <p className="mt-1 text-muted-foreground">
              Testing a 30-minute extended maintenance window. Estimated
              disruption remains below 2%.
            </p>
          </div>
          <button
            aria-label="Close simulation"
            className="ml-auto"
            onClick={() => setSimulated(false)}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function MaintenanceRequests() {
  const { maintenanceRequests, isLoading, error } = useMaintenanceRequests();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [section, setSection] = useState("All sections");
  const [priority, setPriority] = useState("All priorities");
  const [status, setStatus] = useState("All statuses");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const selected =
    maintenanceRequests.find((request) => request.id === selectedId) ??
    maintenanceRequests[0] ??
    null;
  useEffect(() => {
    if (!maintenanceRequests.length) {
      setSelectedId(null);
      return;
    }
    const activeTaskIds = maintenanceRequests
      .filter((request) => request.status !== "Completed")
      .map((request) => request.id);
    if (!activeTaskIds.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !activeTaskIds.includes(selectedId)) {
      setSelectedId(activeTaskIds[0]);
    }
  }, [maintenanceRequests, selectedId]);
  const filtered = useMemo(
    () =>
      maintenanceRequests.filter(
        (r) =>
          (!query ||
            Object.values(r)
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (department === "All departments" || r.department === department) &&
          (section === "All sections" || r.section === section) &&
          (priority === "All priorities" || r.priority === priority) &&
          (status === "All statuses" || r.status === status),
      ),
    [maintenanceRequests, query, department, section, priority, status],
  );
  const select = (r: (typeof maintenanceRequests)[number]) => {
    setSelectedId(r.id);
    setModal(true);
  };
  const selectClass =
    "rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground";
  if (error)
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        Unable to load maintenance requests.
      </div>
    );
  if (isLoading && !maintenanceRequests.length)
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        Loading maintenance requests...
      </div>
    );
  if (!maintenanceRequests.length)
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        No maintenance requests are available.
      </div>
    );
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> WORK
            MANAGEMENT
          </div>
          <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Maintenance Request
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Coordinate track access, crews, and approvals before assigning work
            to the operating plan.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
          <ClipboardList className="size-3.5" /> Add request
        </button>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RailKpi
          label="Open maintenanceRequests"
          value="18"
          change="6 urgent or high"
          status="warning"
        />
        <RailKpi
          label="Overdue"
          value="02"
          change="Requires action"
          status="error"
        />
        <RailKpi
          label="Approved"
          value="11"
          change="61% of maintenanceRequests"
          status="success"
        />
        <RailKpi
          label="Resource conflicts"
          value="02"
          change="Needs reassignment"
          status="error"
        />
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <input
            aria-label="Search maintenance maintenanceRequests"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID, activity, section, or resource"
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
        <select
          aria-label="Department filter"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={selectClass}
        >
          <option>All departments</option>
          {[
            ...new globalThis.Set(maintenanceRequests.map((r) => r.department)),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Section filter"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className={selectClass}
        >
          <option>All sections</option>
          {[
            ...new globalThis.Set(maintenanceRequests.map((r) => r.section)),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Priority filter"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={selectClass}
        >
          <option>All priorities</option>
          {["Urgent", "High", "Medium", "Low"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Status filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={selectClass}
        >
          <option>All statuses</option>
          <option>Approved</option>
          <option>Pending</option>
        </select>
      </div>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="font-mono text-sm font-semibold">
              Maintenance work register
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtered.length} maintenanceRequests matching current filters
            </p>
          </div>
          <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="size-2 rounded-full bg-destructive" /> Urgent{" "}
            <span className="size-2 rounded-full bg-accent" /> High
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {[
                  "Request ID",
                  "Department",
                  "Section ID",
                  "Activity",
                  "Duration",
                  "Priority",
                  "Execution deadline",
                  "Required resource",
                  "Approval status",
                ].map((x) => (
                  <th
                    key={x}
                    className="px-4 py-3 font-medium first:pl-5 last:pr-5"
                  >
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => select(r)}
                  className={`cursor-pointer border-t border-border/70 transition-colors duration-150 hover:bg-muted/40 ${selected?.id === r.id ? "bg-primary/5" : ""}`}
                >
                  <td className="px-4 py-4 pl-5 font-mono font-semibold text-primary">
                    {r.id}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {r.department}
                  </td>
                  <td className="px-4 py-4 font-mono">{r.section}</td>
                  <td className="px-4 py-4 font-medium">{r.activity}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {r.duration}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priorityClass[r.priority]}`}
                    >
                      {r.priority}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-4 font-mono ${r.overdue ? "font-semibold text-destructive" : "text-muted-foreground"}`}
                  >
                    {r.overdue && (
                      <TriangleAlert className="mr-1 inline size-3" />
                    )}
                    {r.deadline}
                    {r.overdue && (
                      <span className="ml-1 text-[10px]">OVERDUE</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-2">
                      <Users className="size-3 text-primary" />
                      {r.resource}
                    </span>
                  </td>
                  <td className="px-4 py-4 pr-5">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-medium ${r.status === "Approved" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Select a request to inspect work scope, conflicts, and approval history.
      </p>
      {modal && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-foreground/25"
          onClick={() => setModal(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${selected.id}`}
            className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-primary">{selected.id}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.department} . Section {selected.section}
                </p>
              </div>
              <button
                aria-label="Close details"
                onClick={() => setModal(false)}
                className="rounded-md p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-6 flex gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityClass[selected.priority]}`}
              >
                {selected.priority} priority
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${selected.status === "Approved" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}
              >
                {selected.status}
              </span>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4">
              {[
                ["Duration", selected.duration],
                ["Deadline", selected.deadline],
                ["Resource", selected.resource],
                ["Section", `Section ${selected.section}`],
              ].map(([a, b]) => (
                <div
                  key={a}
                  className="rounded-md border border-border bg-muted/30 p-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {a}
                  </p>
                  <p className="mt-2 text-sm font-medium">{b}</p>
                </div>
              ))}
            </div>
            <div
              className={`mt-5 flex gap-3 rounded-md border p-4 text-xs ${selected.overdue ? "border-destructive/25 bg-destructive/5" : "border-primary/20 bg-primary/5"}`}
            >
              <Clock3
                className={`mt-0.5 size-4 shrink-0 ${selected.overdue ? "text-destructive" : "text-primary"}`}
              />
              <div>
                <p className="font-semibold">
                  {selected.overdue
                    ? "Execution deadline passed"
                    : "Execution window scheduled"}
                </p>
                <p className="mt-1 leading-5 text-muted-foreground">
                  {selected.overdue
                    ? "This request is overdue and should be escalated before the next plan run."
                    : "The request can be considered for the next available possession window."}
                </p>
              </div>
            </div>
            {selected.conflict && (
              <div className="mt-4 flex gap-3 rounded-md border border-accent/25 bg-accent/5 p-4 text-xs">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold">Section conflict detected</p>
                  <p className="mt-1 leading-5 text-muted-foreground">
                    {selected.conflict}. Review the block plan before approval.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-8 border-t border-border pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Planner actions
              </p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-md border border-border py-2 text-xs font-medium hover:bg-muted">
                  Assign resource
                </button>
                <button className="flex-1 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground">
                  Open in planner
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function TrainOperations() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All sections");
  const [type, setType] = useState("All train types");
  const [priority, setPriority] = useState("All priorities");
  const filtered = useMemo(
    () =>
      trains.filter(
        (train) =>
          (!query ||
            Object.values(train)
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (section === "All sections" || train.section === section) &&
          (type === "All train types" || train.service === type) &&
          (priority === "All priorities" || train.priority === priority),
      ),
    [query, section, type, priority],
  );
  const selectClass =
    "rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground";
  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> LIVE MOVEMENT
            PLAN
          </div>
          <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Train operations
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review train movements across the network and identify safe windows
            for maintenance blocks.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted">
          <CalendarDays className="size-3.5" /> 18 Jun 2024{" "}
          <ChevronDown className="size-3" />
        </button>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <div className="flex min-w-52 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search train ID, number, service..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            aria-label="Search trains"
          />
        </div>
        <select
          aria-label="Section"
          className={selectClass}
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          <option>All sections</option>
          {Array.from(new globalThis.Set(trains.map((t) => t.section))).map(
            (value) => (
              <option key={value}>{value}</option>
            ),
          )}
        </select>
        <select
          aria-label="Train type"
          className={selectClass}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>All train types</option>
          <option>Passenger</option>
          <option>Freight</option>
        </select>
        <select
          aria-label="Priority"
          className={selectClass}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>All priorities</option>
          <option>Protected</option>
          <option>High</option>
          <option>Standard</option>
        </select>
      </div>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-mono text-sm font-semibold">
              Movement timeline
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Protected movements are highlighted in red. Gaps indicate
              available maintenance windows.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-destructive" /> Protected
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-primary" /> Standard
            </span>
          </div>
        </div>
        <div className="overflow-x-auto p-5">
          <div className="min-w-[760px]">
            <div className="ml-40 flex justify-between border-b border-border pb-2 text-[10px] text-muted-foreground">
              {[
                "00:00",
                "04:00",
                "08:00",
                "12:00",
                "16:00",
                "20:00",
                "24:00",
              ].map((time) => (
                <span key={time}>{time}</span>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-4">
              {filtered.map((train) => (
                <div key={train.id} className="flex items-center gap-3">
                  <div className="w-37 shrink-0">
                    <p className="font-mono text-[11px] font-semibold">
                      {train.id} . {train.number}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {train.type}
                    </p>
                  </div>
                  <div className="relative h-10 flex-1 rounded-sm bg-muted/40">
                    <div
                      className={`absolute top-1.5 h-7 rounded-sm ${train.color} ${train.priority === "Protected" ? "ring-2 ring-destructive/30" : ""}`}
                      style={{
                        left: `${((Number(train.arrival.slice(0, 2)) * 60 + Number(train.arrival.slice(3))) / 1440) * 100}%`,
                        width: `${Math.max(2.5, ((Number(train.departure.slice(0, 2)) * 60 + Number(train.departure.slice(3)) - (Number(train.arrival.slice(0, 2)) * 60 + Number(train.arrival.slice(3)))) / 1440) * 100)}%`,
                      }}
                      title={`${train.id}: ${train.arrival}-${train.departure}`}
                    >
                      <span className="sr-only">
                        {train.arrival} to {train.departure}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 shrink-0 text-right text-[10px] text-muted-foreground">
                    {train.arrival}-{train.departure}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-mono text-sm font-semibold">
            Train movement register
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {filtered.length} movements matched . arrival and departure windows
            by section
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-muted/25 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                {[
                  "Train ID",
                  "Train number",
                  "Service type",
                  "Section",
                  "Arrival",
                  "Departure",
                  "Priority",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((train) => (
                <tr
                  key={train.id}
                  className="text-xs transition-colors duration-150 hover:bg-muted/20"
                >
                  <td className="px-5 py-3 font-mono font-semibold">
                    {train.id}
                  </td>
                  <td className="px-5 py-3 font-mono">{train.number}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{train.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {train.service}
                    </p>
                  </td>
                  <td className="px-5 py-3 font-mono text-muted-foreground">
                    {train.section}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {train.arrival}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {train.departure}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-semibold ${train.priority === "Protected" ? "bg-destructive/10 text-destructive" : train.priority === "High" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}
                    >
                      {train.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ResourceManagement() {
  const { maintenanceRequests, isLoading } = useMaintenanceRequests();
  const { setResult } = useOptimizationResult();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All resources");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationError, setOptimizationError] = useState("");
  const [optimizationStatus, setOptimizationStatus] = useState<
    "optimal" | "feasible" | "infeasible" | ""
  >("");

  const filtered = useMemo(
    () =>
      resources.filter(
        (resource) =>
          (!query ||
            Object.values(resource)
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (filter === "All resources" || resource.availability === filter),
      ),
    [query, filter],
  );

  const selectClass =
    "rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground";
  const availabilityStyle = (availability: string) =>
    availability === "Available"
      ? "bg-primary/10 text-primary"
      : availability === "Conflict"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent/15 text-accent";

  const utilizationBars = resources.map((resource) => resource.utilization);
  const resourceUnits = resources.reduce(
    (total, resource) => total + resource.quantity,
    0,
  );
  const availableUnits = resources
    .filter((resource) => resource.availability === "Available")
    .reduce((total, resource) => total + resource.quantity, 0);
  const busyUnits = resources
    .filter((resource) => resource.availability === "Busy")
    .reduce((total, resource) => total + resource.quantity, 0);
  const conflictCount = resources.filter(
    (resource) => resource.conflict,
  ).length;
  const averageUtilization = resources.length
    ? Math.round(
        resources.reduce((total, resource) => total + resource.utilization, 0) /
          resources.length,
      )
    : 0;

  const optimizeAssignments = async () => {
    if (optimizing || isLoading) return;

    setOptimizing(true);
    setOptimizationError("");
    setOptimizationStatus("");

    try {
      if (!maintenanceRequests.length) {
        throw new Error(
          "No maintenance requests are available for optimization.",
        );
      }

      const targetSectionId = sections[0]?.id ?? "";
      if (!targetSectionId) {
        throw new Error("No railway section is available for optimization.");
      }

      // Optimize only the maintenance work belonging to the selected section.
      // Sending every request at once makes the 24-hour CP-SAT model infeasible.
      const sectionIdMap: Record<string, string> = {
        "A-14": "SEC-001",
        "B-07": "SEC-002",
        "C-22": "SEC-003",
        "D-03": "SEC-004",
        "E-18": "SEC-005",
      };

      const backendSectionId = sectionIdMap[targetSectionId] ?? targetSectionId;

      const sectionRequests = maintenanceRequests.filter(
        (request) => request.section === backendSectionId,
      );

      if (!sectionRequests.length) {
        throw new Error(
          `No maintenance request is available for section ${targetSectionId} (${backendSectionId}).`,
        );
      }

      const result = await runOptimization({
        planningDate: getTodayDateString(),
        sectionId: backendSectionId,
        maintenanceRequestIds: sectionRequests.map((request) => request.id),
        planningWindow: "24 hours",
      });

      const normalized = normalizeOptimizationResult(
        result,
        maintenanceRequests,
      );
      setResult(normalized);
      setOptimizationStatus(
        result.status === "optimal" ||
          result.status === "feasible" ||
          result.status === "infeasible"
          ? result.status
          : "",
      );
    } catch (error) {
      setResult(null);
      setOptimizationError(
        error instanceof Error
          ? error.message
          : "Optimization failed. Please check the backend.",
      );
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> RESOURCE
            CONTROL
          </div>
          <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Resource management
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track scarce crews, machines, and vehicles so the optimizer never
            assigns one resource to overlapping maintenance work.
          </p>
        </div>

        <button
          type="button"
          onClick={optimizeAssignments}
          disabled={optimizing || isLoading || !maintenanceRequests.length}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:transform-none"
        >
          {optimizing ? (
            <Clock3 className="size-3.5 motion-safe:animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {optimizing ? "Optimizing assignments…" : "Optimize assignments"}
        </button>
      </div>

      {optimizationError && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-xs"
        >
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                Optimization failed
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-5 text-muted-foreground">
                {optimizationError}
              </p>
            </div>
          </div>
        </div>
      )}

      {optimizationStatus && !optimizationError && (
        <div
          role="status"
          className={`mb-5 rounded-lg border p-4 text-xs motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 ${
            optimizationStatus === "infeasible"
              ? "border-destructive/25 bg-destructive/5"
              : "border-primary/25 bg-primary/5"
          }`}
        >
          <div className="flex items-center gap-3">
            {optimizationStatus === "infeasible" ? (
              <TriangleAlert className="size-4 shrink-0 text-destructive" />
            ) : (
              <Check className="size-4 shrink-0 text-primary" />
            )}
            <div>
              <p className="font-semibold">
                {optimizationStatus === "optimal"
                  ? "Optimization completed"
                  : optimizationStatus === "feasible"
                    ? "Feasible assignments generated"
                    : "No feasible assignment found"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {optimizationStatus === "infeasible"
                  ? "The optimizer could not produce a feasible plan. Review the conflicts and constraints."
                  : 'The optimizer result has been saved. Open "Optimized Block Plan" to inspect the generated blocks and conflicts.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RailKpi
          label="Resources tracked"
          value={String(resourceUnits)}
          change={`${resources.length} resource records`}
          status="default"
        />
        <RailKpi
          label="Available now"
          value={String(availableUnits)}
          change="Available units in dataset"
          status="success"
        />
        <RailKpi
          label="Busy resources"
          value={String(busyUnits)}
          change={`${averageUtilization}% average utilization`}
          status="warning"
        />
        <RailKpi
          label="Active conflicts"
          value={String(conflictCount).padStart(2, "0")}
          change={
            conflictCount
              ? "Dataset conflicts flagged"
              : "No conflicts recorded"
          }
          status={conflictCount ? "error" : "default"}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="font-mono text-sm font-semibold">
                Resource utilization
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Current load by operating window . 18 Jun 2024
              </p>
            </div>
            <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
              73% network average
            </span>
          </div>
          <div className="p-5">
            <div className="flex h-44 items-end gap-2 border-b border-l border-border px-3 pb-0 pt-4">
              {utilizationBars.map((value, index) => (
                <div
                  key={index}
                  className="group flex h-full flex-1 flex-col justify-end"
                >
                  <div
                    className={`relative rounded-t-sm ${value >= 85 ? "bg-accent" : "bg-primary/70"}`}
                    style={{ height: `${value}%` }}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {value}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="ml-3 flex justify-between pt-2 text-[10px] text-muted-foreground">
              {[
                "06:00",
                "08:00",
                "10:00",
                "12:00",
                "14:00",
                "16:00",
                "18:00",
              ].map((time) => (
                <span key={time}>{time}</span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-primary" /> Available
                capacity
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-accent" /> High utilization
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-mono text-sm font-semibold">
              Resource conflict alerts
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Assignments the optimizer should resolve first
            </p>
          </div>
          <div className="flex flex-col gap-3 p-5">
            {resources
              .filter((resource) => resource.conflict)
              .map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-md border border-destructive/20 bg-destructive/5 p-3"
                >
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-xs font-semibold">
                          {resource.id}
                        </p>
                        <span className="text-[10px] font-semibold text-destructive">
                          Conflict
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-foreground">
                        {resource.conflict}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">
                        {resource.tasks.join(" . ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <div className="flex min-w-52 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resource ID, type, department..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            aria-label="Search resources"
          />
        </div>
        <select
          aria-label="Resource availability"
          className={selectClass}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All resources</option>
          <option>Available</option>
          <option>Busy</option>
          <option>Conflict</option>
        </select>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-mono text-sm font-semibold">
              Resource register
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtered.length} resources matched . assignment-aware inventory
            </p>
          </div>
          <div className="hidden gap-3 text-[10px] text-muted-foreground sm:flex">
            <span>Available</span>
            <span>Busy</span>
            <span>Conflict</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-muted/25 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                {[
                  "Resource ID",
                  "Resource type",
                  "Department",
                  "Availability",
                  "Quantity",
                  "Current utilization",
                  "Assigned maintenance tasks",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((resource) => (
                <tr
                  key={resource.id}
                  className="text-xs transition-colors duration-150 hover:bg-muted/20"
                >
                  <td className="px-5 py-4 font-mono font-semibold text-primary">
                    {resource.id}
                  </td>
                  <td className="px-5 py-4 font-medium">{resource.type}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {resource.department}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-semibold ${availabilityStyle(resource.availability)}`}
                    >
                      {resource.availability}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono">{resource.quantity}</td>
                  <td className="px-5 py-4">
                    <div className="flex min-w-32 items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${resource.utilization >= 85 ? "bg-accent" : "bg-primary"}`}
                          style={{ width: `${resource.utilization}%` }}
                        />
                      </div>
                      <span className="w-8 font-mono text-[10px]">
                        {resource.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex max-w-72 flex-col gap-1">
                      {resource.tasks.map((task) => (
                        <span
                          key={task}
                          className="truncate text-[10px] text-muted-foreground"
                        >
                          {task}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function RailwayNetwork() {
  const [stationQuery, setStationQuery] = useState("");
  const [sectionQuery, setSectionQuery] = useState("");
  const [selected, setSelected] = useState(sections[0]);
  const filteredStations = useMemo(
    () =>
      stations.filter((s) =>
        Object.values(s)
          .join(" ")
          .toLowerCase()
          .includes(stationQuery.toLowerCase()),
      ),
    [stationQuery],
  );
  const filteredSections = useMemo(
    () =>
      sections.filter((s) =>
        Object.values(s)
          .join(" ")
          .toLowerCase()
          .includes(sectionQuery.toLowerCase()),
      ),
    [sectionQuery],
  );
  const statusStyle = (status: string) =>
    status === "Available" || status === "Operational"
      ? "bg-primary/10 text-primary"
      : status === "Restricted"
        ? "bg-accent/15 text-accent"
        : "bg-destructive/10 text-destructive";
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> NETWORK
            INVENTORY
          </div>
          <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Railway network
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor station readiness and section availability across the
            Northern Division operating network.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted">
          <Map className="size-3.5" /> Focus: Northern Division{" "}
          <ChevronDown className="size-3" />
        </button>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RailKpi
          label="Stations tracked"
          value="126"
          change="124 operational"
          status="success"
        />
        <RailKpi
          label="Sections"
          value="84"
          change="5 under restriction"
          status="warning"
        />
        <RailKpi
          label="Network availability"
          value="96.2%"
          change="+1.8% this week"
          status="success"
        />
        <RailKpi
          label="Active corridors"
          value="18"
          change="2 in maintenance"
          status="default"
        />
      </div>
      <section className="mb-6 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center">
          <div>
            <h3 className="font-mono text-sm font-semibold">
              Operational network view
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Schematic corridor view . select a section to inspect its
              operating profile
            </p>
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-primary" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-accent" /> Restricted
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-destructive" /> Maintenance
            </span>
          </div>
        </div>
        <div className="overflow-x-auto p-6">
          <div className="relative min-w-[760px] py-8">
            <div className="absolute left-12 right-12 top-1/2 h-1 -translate-y-1/2 bg-border" />
            <div className="relative flex items-center justify-between">
              {stations.map((station, index) => (
                <div
                  key={station.code}
                  className="flex w-28 flex-col items-center gap-3"
                >
                  <button
                    onClick={() => {
                      const next =
                        sections[Math.min(index, sections.length - 1)];
                      setSelected(next);
                    }}
                    className={`relative z-10 flex size-12 items-center justify-center rounded-full border-4 border-card bg-background font-mono text-[10px] font-bold shadow-sm ring-1 ${station.status === "Operational" ? "ring-primary text-primary" : station.status === "Restricted" ? "ring-accent text-accent" : "ring-destructive text-destructive"}`}
                    aria-label={`Select ${station.name}`}
                  >
                    {station.code}
                  </button>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold">{station.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {station.division} . {station.zone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between px-10">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelected(section)}
                  className={`rounded-md px-3 py-1.5 font-mono text-[10px] font-semibold transition-colors ${selected.id === section.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {section.id} . {section.distance}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-semibold">Stations</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {filteredStations.length} stations in current view
                </p>
              </div>
              <div className="flex w-44 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                <Search className="size-3.5 text-muted-foreground" />
                <input
                  value={stationQuery}
                  onChange={(e) => setStationQuery(e.target.value)}
                  placeholder="Search stations..."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  aria-label="Search stations"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-muted/25 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  {["Code", "Station name", "Division", "Zone", "Status"].map(
                    (h) => (
                      <th key={h} className="px-5 py-3 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStations.map((station) => (
                  <tr
                    key={station.code}
                    className="text-xs transition-colors duration-150 hover:bg-muted/20"
                  >
                    <td className="px-5 py-3 font-mono font-semibold text-primary">
                      {station.code}
                    </td>
                    <td className="px-5 py-3 font-medium">{station.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {station.division}
                    </td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">
                      {station.zone}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-semibold ${statusStyle(station.status)}`}
                      >
                        {station.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-mono text-sm font-semibold">Section details</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selected.id} . {selected.from} to {selected.to}
            </p>
          </div>
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {selected.utilization}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Current utilization
                </p>
              </div>
              <span
                className={`rounded px-2 py-1 text-[10px] font-semibold ${statusStyle(selected.status)}`}
              >
                {selected.status}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${selected.utilization}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-border p-3">
                <p className="text-muted-foreground">Distance</p>
                <p className="mt-1 font-mono font-semibold">
                  {selected.distance}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-muted-foreground">Daily movements</p>
                <p className="mt-1 font-mono font-semibold">
                  {selected.trains} trains
                </p>
              </div>
              <div className="col-span-2 rounded-md border border-border p-3">
                <p className="text-muted-foreground">Track & traction</p>
                <p className="mt-1 font-mono font-semibold">
                  {selected.traction}
                </p>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">
                Availability note:{" "}
              </span>
              {selected.status === "Available"
                ? "Section is clear for block planning within approved operating windows."
                : selected.status === "Restricted"
                  ? "Capacity is constrained. Review conflict windows before allocating maintenance access."
                  : "Engineering possession is active. Through movements require approved diversion authority."}
            </div>
          </div>
        </section>
      </div>
      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-semibold">Sections</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Track sections and traction profile
              </p>
            </div>
            <div className="flex w-44 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={sectionQuery}
                onChange={(e) => setSectionQuery(e.target.value)}
                placeholder="Search sections..."
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                aria-label="Search sections"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-muted/25 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                {[
                  "Section ID",
                  "From station",
                  "To station",
                  "Distance",
                  "Track & traction",
                  "Availability",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSections.map((section) => (
                <tr
                  key={section.id}
                  onClick={() => setSelected(section)}
                  className={`cursor-pointer text-xs transition-colors duration-150 hover:bg-muted/20 ${selected.id === section.id ? "bg-primary/5" : ""}`}
                >
                  <td className="px-5 py-3 font-mono font-semibold text-primary">
                    {section.id}
                  </td>
                  <td className="px-5 py-3 font-mono">{section.from}</td>
                  <td className="px-5 py-3 font-mono">{section.to}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {section.distance}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {section.traction}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-semibold ${statusStyle(section.status)}`}
                    >
                      {section.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AIOptimization({ setActive }: { setActive?: (s: string) => void }) {
  const steps = [
    "Loading maintenance requests",
    "Loading train operations",
    "Checking resource availability",
    "Detecting conflicts",
    "Finding compatible maintenance tasks",
    "Optimizing block windows",
    "Validating feasibility",
    "Calculating operational impact",
  ];
  const { maintenanceRequests, isLoading } = useMaintenanceRequests();
  const { setResult } = useOptimizationResult();
  const [completed, setCompleted] = useState(steps.length);
  const [running, setRunning] = useState(false);
  const [optimizationError, setOptimizationError] = useState("");
  const start = async () => {
    if (running || isLoading) return;

    setRunning(true);
    setCompleted(0);
    setOptimizationError("");
    let progressTimer: ReturnType<typeof window.setInterval> | undefined;

    try {
      const activeRequests = maintenanceRequests.filter(
        (request) => request.status !== "Completed",
      );
      const selectedSection = activeRequests[0]?.section;

      if (!activeRequests.length || !selectedSection) {
        throw new Error(
          "No maintenance requests are available for optimization.",
        );
      }

      const animationComplete = new Promise<void>((resolve) => {
        progressTimer = window.setInterval(() => {
          setCompleted((current) => {
            const next = Math.min(current + 1, steps.length);
            if (next === steps.length && progressTimer) {
              window.clearInterval(progressTimer);
              resolve();
            }
            return next;
          });
        }, 420);
      });

      const resultPromise = runOptimization({
        planningDate: getTodayDateString(),
        sectionId: selectedSection,
        maintenanceRequestIds: activeRequests.map((request) => request.id),
        planningWindow: "24 hours",
      });
      const result = await resultPromise;
      await animationComplete;
      setResult(normalizeOptimizationResult(result, maintenanceRequests));
    } catch (error) {
      if (progressTimer) window.clearInterval(progressTimer);
      setResult(null);
      setCompleted(0);
      setOptimizationError(
        error instanceof Error
          ? error.message
          : "Optimization failed. Please check the backend.",
      );
    } finally {
      setRunning(false);
    }
  };
  const done = completed === steps.length && !running;
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> OPTIMIZATION
            ENGINE
          </div>
          <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            AI optimization
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Constraint-aware planning is running across maintenanceRequests,
            movements, resources, and block windows.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          <span
            className={`size-2 rounded-full ${running ? "motion-safe:animate-pulse bg-accent" : "bg-primary"}`}
          />{" "}
          {running
            ? "Processing constraints"
            : done
              ? "Plan ready"
              : "Engine paused"}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-semibold">
                  Optimization workflow
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Railway constraints are evaluated in sequence
                </p>
              </div>
              <span className="font-mono text-xs text-primary">
                {completed}/{steps.length} checks
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completed / steps.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 p-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center gap-3 rounded-md px-3 py-3 ${index < completed ? "bg-primary/5" : index === completed && running ? "bg-accent/10" : ""}`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${index < completed ? "border-primary/40 bg-primary/10 text-primary" : index === completed && running ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
                >
                  {index < completed ? <Check className="size-3" /> : index + 1}
                </span>
                <span
                  className={`text-xs ${index < completed ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {step}
                </span>
                {index < completed && (
                  <span className="ml-auto text-[10px] font-medium text-primary">
                    Complete
                  </span>
                )}
                {index === completed && running && (
                  <span className="ml-auto text-[10px] font-medium text-accent">
                    Evaluating
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Constraint evaluation
            </p>
            <div className="mt-4 flex items-center justify-center rounded-md border border-border bg-background p-6">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex flex-col gap-2">
                  <span className="rounded border border-primary/30 bg-primary/10 px-3 py-2 text-primary">
                    Train paths
                  </span>
                  <span className="rounded border border-accent/30 bg-accent/10 px-3 py-2 text-accent">
                    Resources
                  </span>
                </div>
                <div className="flex items-center text-primary">
                  <span className="h-px w-8 bg-primary" />
                  <Zap className="size-4" />
                  <span className="h-px w-8 bg-primary" />
                </div>
                <span className="rounded border border-primary bg-primary/15 px-3 py-4 font-mono font-semibold text-primary">
                  Block windows
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded border border-border p-3">
              <p className="font-mono text-lg font-semibold">18</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Requests</p>
            </div>
            <div className="rounded border border-border p-3">
              <p className="font-mono text-lg font-semibold">42</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Movements
              </p>
            </div>
            <div className="rounded border border-border p-3">
              <p className="font-mono text-lg font-semibold">06</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Conflicts
              </p>
            </div>
          </div>
          <button
            onClick={start}
            disabled={running}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:transform-none"
          >
            {running ? (
              <>
                <Clock3 className="size-3.5 motion-safe:animate-spin" />{" "}
                Processing constraints…
              </>
            ) : done ? (
              <>
                <Check className="size-3.5" /> Re-run optimization
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" /> Run optimization
              </>
            )}
          </button>
          {optimizationError && (
            <p className="text-[10px] leading-4 text-destructive">
              {optimizationError}
            </p>
          )}
        </section>
      </div>

      {done && (
        <section className="mt-6 flex flex-col justify-between gap-4 rounded-lg border border-primary/40 bg-primary/10 p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Check className="size-4" />
              <h3 className="font-mono text-sm font-semibold">
                Optimized Plan Generated
              </h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              All feasible block windows validated. The plan avoids resource
              overlaps and protects scheduled train movements.
            </p>
          </div>
          <button
            onClick={() => setActive?.("Block Planning")}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.98]"
          >
            View Optimized Plan <Route className="size-3.5" />
          </button>
        </section>
      )}
    </div>
  );
}

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function BlockPlanning({ setActive }: { setActive?: (s: string) => void }) {
  const { maintenanceRequests, isLoading } = useMaintenanceRequests();
  const { setResult } = useOptimizationResult();
  const [generated, setGenerated] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedTask, setSelectedTask] = useState("");
  const [planningDate, setPlanningDate] = useState<string>(() =>
    getTodayDateString(),
  );
  const [sectionId, setSectionId] = useState("");
  const [planningWindow, setPlanningWindow] = useState("24 hours");
  const [scenarioId, setScenarioId] = useState("");
  const [windowResult, setWindowResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [windowError, setWindowError] = useState("");
  const [windowLoading, setWindowLoading] = useState(false);

  useEffect(() => {
    if (!maintenanceRequests.length) {
      setSelectedTask("");
      return;
    }

    const activeTaskIds = maintenanceRequests
      .filter((request) => request.status !== "Completed")
      .map((request) => request.id);

    if (!activeTaskIds.length) {
      setSelectedTask("");
      return;
    }

    if (!selectedTask || !activeTaskIds.includes(selectedTask)) {
      setSelectedTask(activeTaskIds[0]);
    }
  }, [maintenanceRequests, selectedTask]);

  const runWindowTest = async () => {
    setWindowLoading(true);
    setWindowError("");
    try {
      if (!selected)
        throw new Error("No maintenance request is available to test.");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(
        /\/$/,
        "",
      );
      const requestId = selected.id;
      const apiSectionId = selected.section || sectionId;
      const testWindowPath = `/optimization/test-window/${encodeURIComponent(apiSectionId)}/${encodeURIComponent(requestId)}`;
      const url = apiBaseUrl
        ? `${apiBaseUrl}${testWindowPath}`
        : `/api${testWindowPath}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const raw = await response.text();
      let body: Record<string, unknown> = {};
      try {
        body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        throw new Error(
          `Status: ${response.status}\nBackend response (non-JSON):\n${raw || "(empty response)"}`,
        );
      }
      if (!response.ok)
        throw new Error(
          `Status: ${response.status}\nBackend validation:\n${JSON.stringify(body, null, 2)}`,
        );
      setWindowResult(body);
    } catch (error) {
      setWindowResult(null);
      setWindowError(error instanceof Error ? error.message : String(error));
    } finally {
      setWindowLoading(false);
    }
  };
  const tasks = maintenanceRequests
    .filter((request) => request.status !== "Completed")
    .map((request) => ({
      ...request,
      title: request.activity,
      detail: `${request.section} . ${request.department}`,
      color: priorityClass[request.priority],
    }));
  const selected =
    tasks.find((task) => task.id === selectedTask) ?? tasks[0] ?? null;
  const canonicalSectionId = selected?.section || sectionId;

  useEffect(() => {
    if (selected?.section) {
      setSectionId(selected.section);
    }
  }, [selected?.section]);

  const selectedTrainMovements = trains.filter(
    (train) => train.section === canonicalSectionId,
  );
  const movements = selectedTrainMovements.map(
    (train) =>
      [
        train.arrival,
        train.departure,
        train.id,
        `${train.section} . ${train.type}`,
        train.color,
      ] as const,
  );
  const requiredResources = selected
    ? resources.filter((resource) =>
        selected.resource.toLowerCase().includes(resource.type.toLowerCase()),
      )
    : [];
  const conflicts = selectedTrainMovements.filter(
    (train) => train.priority === "Protected",
  );
  const submitOptimization = async () => {
    if (!selected) return;
    setProcessing(true);
    setGenerated(false);
    try {
      const backendSectionId = selected.section || sectionId;
      const backendPlanningDate = planningDate.slice(0, 10);
      const result = await runOptimization({
        planningDate: backendPlanningDate,
        sectionId: backendSectionId,
        maintenanceRequestIds: [selected.id],
        planningWindow,
        scenarioId: scenarioId || undefined,
      });

      const normalized = normalizeOptimizationResult(
        result,
        maintenanceRequests,
      );
      setResult(normalized);

      if (result.status === "optimal" || result.status === "feasible") {
        setGenerated(true);
        setActive?.("Optimized Block Plan");
      } else {
        setGenerated(false);
      }
    } catch (error) {
      setGenerated(false);
      setResult(null);
      window.alert(
        error instanceof Error
          ? error.message
          : "Optimization failed. Please review the backend logs and try again.",
      );
    } finally {
      setProcessing(false);
    }
  };
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> PLANNING
            WORKSPACE
          </div>
          <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Block planning
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Coordinate train movements, engineering possessions, and scarce
            resources in one conflict-aware planning view.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          <Sparkles className="size-3.5" /> AI planning ready
        </div>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="rounded-lg border border-border bg-card p-4">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Planning date
          </span>
          <span className="mt-2 flex items-center gap-2">
            <CalendarDays className="size-3.5 text-primary" />
            <input
              type="date"
              value={planningDate}
              onChange={(event) => setPlanningDate(event.target.value)}
              className="w-full bg-transparent font-mono text-sm font-semibold outline-none"
            />
          </span>
        </label>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Division
          </p>
          <p className="mt-2 font-mono text-sm font-semibold">Northern</p>
        </div>
        <label className="rounded-lg border border-border bg-card p-4">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Section
          </span>
          <select
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            className="mt-2 w-full bg-transparent font-mono text-sm font-semibold outline-none"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.id} . {section.from} → {section.to}
              </option>
            ))}
          </select>
        </label>
        <label className="rounded-lg border border-border bg-card p-4">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Planning window
          </span>
          <select
            value={planningWindow}
            onChange={(event) => setPlanningWindow(event.target.value)}
            className="mt-2 w-full bg-transparent font-mono text-sm font-semibold outline-none"
          >
            <option>8 hours</option>
            <option>12 hours</option>
            <option>24 hours</option>
          </select>
        </label>
        <label className="rounded-lg border border-border bg-card p-4">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Optional scenario
          </span>
          <select
            value={scenarioId}
            onChange={(event) => setScenarioId(event.target.value)}
            className="mt-2 w-full bg-transparent font-mono text-sm font-semibold outline-none"
          >
            <option value="">None</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="mb-5 rounded-lg border border-accent/40 bg-accent/5 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-accent">
              Developer test panel
            </p>
            <h3 className="mt-1 font-mono text-sm font-semibold">
              Optimization Engine Test
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tests the real feasible-window API for the selected section and
              maintenance request.
            </p>
          </div>
          <button
            onClick={runWindowTest}
            disabled={windowLoading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground disabled:opacity-60"
          >
            {windowLoading ? (
              <>
                <Clock3 className="size-3.5 animate-spin" />
                Analyzing train movements...
              </>
            ) : (
              "Test Feasible Windows"
            )}
          </button>
        </div>
        {windowError && (
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span className="whitespace-pre-line">{windowError}</span>
            <button
              onClick={runWindowTest}
              className="rounded border border-destructive/40 px-3 py-1.5 font-semibold"
            >
              Retry
            </button>
          </div>
        )}
        {windowResult && (
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Maintenance Request", windowResult.request_id],
              ["Section", windowResult.section_id],
              ["Required Resource", windowResult.required_resource],
              [
                "Duration",
                windowResult.duration_minutes
                  ? `${windowResult.duration_minutes} minutes`
                  : "—",
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded border border-border bg-card p-3"
              >
                <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {String(label)}
                </p>
                <p className="mt-1 break-words font-mono font-semibold">
                  {String(value ?? "—")}
                </p>
              </div>
            ))}
            <div className="rounded border border-border bg-card p-3 sm:col-span-2 lg:col-span-4">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Relevant Trains
              </p>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
                {JSON.stringify(windowResult.relevant_trains ?? [], null, 2)}
              </pre>
            </div>
            <div className="rounded border border-border bg-card p-3 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Candidate Maintenance Windows
              </p>
              {Array.isArray(windowResult.candidate_windows) &&
              windowResult.candidate_windows.length > 0 ? (
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[10px] text-primary">
                  {JSON.stringify(windowResult.candidate_windows, null, 2)}
                </pre>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  No feasible maintenance window found.
                </p>
              )}
            </div>
            <div className="rounded border border-border bg-card p-3 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Validation status
              </p>
              <p className="mt-2 font-semibold">
                {String(
                  (
                    windowResult.validation as
                      | Record<string, unknown>
                      | undefined
                  )?.valid ?? "—",
                )}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Errors / Warnings
              </p>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
                {JSON.stringify(
                  {
                    errors:
                      (
                        windowResult.validation as
                          | Record<string, unknown>
                          | undefined
                      )?.errors ?? [],
                    warnings:
                      (
                        windowResult.validation as
                          | Record<string, unknown>
                          | undefined
                      )?.warnings ?? [],
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </section>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[250px_minmax(520px,1fr)_270px]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-semibold">
                  Pending tasks
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tasks.length} tasks . live maintenance dataset
                </p>
              </div>
              <span className="rounded bg-accent/15 px-2 py-1 text-[10px] font-semibold text-accent">
                Unplanned
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-3">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className={`rounded-md border p-3 text-left transition-colors ${selectedTask === task.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${task.color}`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{task.title}</p>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {task.detail}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {task.id} . {task.duration}
                      </span>
                      <span className="text-[10px] font-semibold text-accent">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center">
            <div>
              <h3 className="font-mono text-sm font-semibold">
                Railway timeline
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Train paths and available block windows . source dataset
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-sm bg-primary/70" /> Train movement
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-sm bg-accent" /> Maintenance
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-sm bg-muted-foreground/30" />{" "}
                Available block
              </span>
            </div>
          </div>
          <div className="overflow-x-auto p-5">
            <div className="min-w-[680px]">
              <div className="mb-4 ml-24 flex justify-between text-[10px] font-mono text-muted-foreground">
                {["05:00", "08:00", "11:00", "14:00", "17:00", "20:00"].map(
                  (time) => (
                    <span key={time}>{time}</span>
                  ),
                )}
              </div>
              <div className="flex flex-col gap-3">
                {movements.map(([start, end, train, route, color]) => (
                  <div key={train} className="flex items-center gap-3">
                    <div className="w-21 shrink-0">
                      <p className="font-mono text-[10px] font-semibold text-primary">
                        {train}
                      </p>
                      <p className="truncate text-[9px] text-muted-foreground">
                        {route}
                      </p>
                    </div>
                    <div className="relative h-9 min-w-0 flex-1 rounded bg-muted/35">
                      <div
                        className={`absolute inset-y-1 left-[18%] w-[24%] rounded ${color}`}
                      />
                      <div className="absolute inset-y-1 left-[52%] w-[13%] rounded bg-muted-foreground/20" />
                      <div className="absolute inset-y-1 left-[72%] w-[18%] rounded bg-accent/80" />
                      <span className="absolute left-[20%] top-1/2 -translate-y-1/2 text-[9px] font-semibold text-primary-foreground">
                        {start}-{end}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-md border border-accent/40 bg-accent/10 p-3">
                <AlertTriangle className="size-4 shrink-0 text-accent" />
                <div>
                  <p className="text-xs font-semibold text-accent">
                    Conflict window detected . 09:00-10:30
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    MR-2847 overlaps protected movement IC 204. AI will seek the
                    next safe possession window.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-4">
            <h3 className="font-mono text-sm font-semibold">Selected task</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ready for plan assignment
            </p>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div>
              {selected ? (
                <>
                  <p className="text-xs font-semibold">{selected.title}</p>
                  <p className="mt-1 font-mono text-[10px] text-primary">
                    {selected.id}
                  </p>
                </>
              ) : (
                <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
                  <p className="text-xs font-semibold">
                    No maintenance task available
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Maintenance requests are still loading or could not be
                    loaded.
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded border border-border p-2">
                <p className="text-muted-foreground">Resources</p>
                <p className="mt-1 font-semibold">
                  {selected
                    ? `${requiredResources.length || 1} resource match${requiredResources.length === 1 ? "" : "es"}`
                    : "—"}
                </p>
              </div>
              <div className="rounded border border-border p-2">
                <p className="text-muted-foreground">Duration</p>
                <p className="mt-1 font-mono font-semibold">
                  {selected?.duration ?? "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Required resources
              </p>
              <div className="flex flex-col gap-2 text-xs">
                {selected ? (
                  requiredResources.length ? (
                    requiredResources.map((resource) => (
                      <span
                        key={resource.id}
                        className="flex items-center justify-between rounded bg-muted/35 px-2 py-2"
                      >
                        {resource.type}
                        <span className="text-primary">
                          {resource.availability}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="flex items-center justify-between rounded bg-muted/35 px-2 py-2">
                      {selected.resource || "Resource request"}
                      <span className="text-primary">Pending match</span>
                    </span>
                  )
                ) : (
                  <span className="flex items-center justify-between rounded bg-muted/35 px-2 py-2">
                    No task selected<span className="text-primary">—</span>
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <TriangleAlert className="size-3.5" /> Conflict analysis pending
              </div>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                The optimization engine has not generated a validated conflict
                result for this request.
              </p>
            </div>
            <div className="mt-1 flex flex-col gap-2">
              <button
                onClick={submitOptimization}
                disabled={!selected || isLoading || processing}
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="size-3.5" />{" "}
                {generated
                  ? "Optimized plan generated"
                  : "Generate Optimized Plan"}
              </button>
              <button
                onClick={() => setGenerated(false)}
                className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-xs font-semibold hover:bg-muted"
              >
                <Clock3 className="size-3.5" /> Run Baseline Plan
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function OptimizedBlockPlan() {
  const { result } = useOptimizationResult();
  const [approved, setApproved] = useState(false);
  const [scenario, setScenario] = useState(false);

  const blocks = result?.blocks ?? [];
  const conflicts = Array.isArray(result?.conflicts) ? result.conflicts : [];
  const metrics = result?.metrics ?? {
    totalBlocks: 0,
    blockHours: 0,
    trainConflicts: 0,
    resourceConflicts: 0,
    maintenanceCompletion: 0,
    assetAvailability: 0,
    lateTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
  };

  const hasResult = Boolean(result && blocks.length);
  const statusTone =
    result?.status === "optimal"
      ? "text-primary"
      : result?.status === "feasible"
        ? "text-accent"
        : "text-destructive";
  const totalConflictCount = Math.max(
    0,
    metrics.trainConflicts + metrics.resourceConflicts,
  );
  const conflictStatusText = result
    ? totalConflictCount === 0
      ? "No conflicts detected"
      : `${totalConflictCount} conflict${totalConflictCount === 1 ? "" : "s"} detected`
    : "No optimizer result";

  const assetAvailabilityText = result
    ? `${metrics.assetAvailability}% (verified resource assignment)`
    : "0%";

  const parseTime = (value: string | null | undefined) => {
    if (!value) return 0;
    const timePart = value.includes("T") ? value.split("T")[1] : value;
    const [hours = "0", minutes = "0"] = String(timePart).split(":");
    return Number(hours) * 60 + Number(minutes);
  };

  const ganttBlocks = blocks.map((block) => {
    const start = parseTime(block.time.split("→")[0]?.trim() ?? "");
    const end = parseTime(block.time.split("→")[1]?.trim() ?? "");
    const safeStart = Number.isFinite(start) ? start : 0;
    const safeEnd =
      Number.isFinite(end) && end > safeStart ? end : safeStart + 60;
    return {
      ...block,
      left: (safeStart / 1440) * 100,
      width: Math.max(((safeEnd - safeStart) / 1440) * 100, 6),
    };
  });

  const rationaleDetails = result
    ? [
        `optimization status = ${result.status}`,
        `maintenance task completed = ${metrics.completedTasks}/${Math.max(metrics.totalTasks || metrics.completedTasks, 1)}`,
        `train conflicts = ${metrics.trainConflicts}`,
        `resource conflicts = ${metrics.resourceConflicts}`,
        `assigned resource = ${blocks.flatMap((block) => block.resources.split(", ").filter(Boolean)).join(", ") || "none"}`,
        `selected window = ${blocks[0]?.time ?? "not available"}`,
      ]
    : ["No optimizer result available"];

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            {hasResult
              ? "OPTIMIZED PLAN . LIVE ENGINE RESULT"
              : "NO OPTIMIZED PLAN YET"}
          </div>
          <h2 className="text-balance font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Optimized block plan
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {hasResult
              ? "Live optimizer output from the backend constraint solver."
              : "No optimized plan has been generated yet. Run the optimizer from Block Planning to populate this plan."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setScenario(true)}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-xs font-semibold transition duration-200 hover:bg-muted motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98]"
          >
            <Radar className="size-3.5" />
            {scenario ? "Scenario active" : "Run what-if scenario"}
          </button>
          <button
            onClick={() => setApproved(true)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.98] ${approved ? "bg-primary/15 text-primary" : "bg-primary text-primary-foreground"}`}
          >
            <Check className="size-3.5" />{" "}
            {approved ? "Plan approved" : "Approve plan"}
          </button>
        </div>
      </div>

      {result &&
        result.status !== "optimal" &&
        result.status !== "feasible" && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold">
              Optimization status: {result.status}
            </p>
            <p className="mt-1 text-xs leading-5 text-destructive/90">
              {result.explanation}
            </p>
          </div>
        )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          [
            "Total blocks",
            String(metrics.totalBlocks),
            hasResult
              ? "Generated by backend optimizer"
              : "No optimized blocks yet",
          ],
          [
            "Block hours",
            String(metrics.blockHours),
            hasResult ? "Planner output hours" : "No optimized blocks yet",
          ],
          [
            "Train conflicts",
            String(metrics.trainConflicts),
            conflictStatusText,
          ],
          [
            "Maintenance completion",
            `${metrics.maintenanceCompletion}%`,
            hasResult
              ? "Returned by optimizer metrics"
              : "Dataset metric pending",
          ],
          [
            "Asset availability",
            assetAvailabilityText,
            hasResult
              ? "Derived from assigned backend resource IDs"
              : "Dataset metric pending",
          ],
        ].map(([label, value, change], index) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold">{value}</p>
            <p
              className={`mt-1 text-[10px] ${index === 2 ? "text-primary" : "text-muted-foreground"}`}
            >
              {change}
            </p>
          </div>
        ))}
      </div>

      {!hasResult ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            No optimized plan generated yet
          </p>
          <p className="mt-2">
            Generate an optimized plan from the Block Planning page to populate
            this view.
          </p>
        </section>
      ) : (
        <div className="grid gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center">
              <div>
                <h3 className="font-mono text-sm font-semibold">
                  Interactive railway Gantt
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generated block windows from the optimizer result
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-sm bg-primary" /> Train movement
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-sm bg-accent" /> Optimized block
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-sm bg-muted-foreground/30" />{" "}
                  Available window
                </span>
              </div>
            </div>
            <div className="overflow-x-auto p-5">
              <div className="min-w-[820px]">
                <div className="mb-4 ml-40 flex justify-between font-mono text-[10px] text-muted-foreground">
                  {[
                    "05:00",
                    "08:00",
                    "11:00",
                    "14:00",
                    "17:00",
                    "20:00",
                    "23:00",
                  ].map((time) => (
                    <span key={time}>{time}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {ganttBlocks.map((block) => (
                    <div key={block.id} className="flex items-center gap-3">
                      <div className="w-37 shrink-0">
                        <p className="font-mono text-[10px] font-semibold">
                          {block.section}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {block.id}
                        </p>
                      </div>
                      <div className="relative h-14 flex-1 rounded bg-muted/35">
                        <div className="absolute inset-y-2 left-[6%] w-[12%] rounded bg-primary/70" />
                        <div className="absolute inset-y-2 left-[24%] w-[14%] rounded bg-muted-foreground/25" />
                        <div
                          className="absolute inset-y-1 rounded bg-accent ring-1 ring-accent/40"
                          style={{
                            left: `${block.left}%`,
                            width: `${block.width}%`,
                          }}
                        >
                          <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 truncate text-[9px] font-semibold text-primary-foreground">
                            {block.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-primary">
                Plan rationale
              </p>
              <h3 className="mt-1 font-mono text-sm font-semibold">
                Why this plan?
              </h3>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Optimization status
                </p>
                <p
                  className={`mt-1 font-mono text-lg font-semibold ${statusTone}`}
                >
                  {result?.status ?? "unknown"}
                </p>
              </div>
              {result?.explanation ? (
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Explanation
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                    {result.explanation}
                  </p>
                </div>
              ) : null}
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Conflicts
                </p>
                <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                  {result ? conflictStatusText : "No optimizer result"}
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Plan rationale
                </p>
                <ul className="mt-2 space-y-1 text-[10px] leading-4 text-muted-foreground">
                  {rationaleDetails.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}

      {hasResult && (
        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-mono text-sm font-semibold">
              Optimized block assignments
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Backend-generated windows with sections, resource references, and
              explanations
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-muted/25 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  {[
                    "Block",
                    "Section",
                    "Window",
                    "Tasks",
                    "Departments",
                    "Affected trains",
                    "Resources",
                  ].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {blocks.map((block) => (
                  <tr
                    key={block.id}
                    className="text-xs transition-colors duration-150 hover:bg-muted/20"
                  >
                    <td className="px-5 py-3 font-mono font-semibold text-accent">
                      {block.id}
                    </td>
                    <td className="px-5 py-3 font-mono">{block.section}</td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">
                      {block.time}
                    </td>
                    <td className="max-w-52 px-5 py-3">{block.tasks}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {block.departments}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {block.trains || "No affected trains"}
                    </td>
                    <td className="px-5 py-3 font-mono text-[10px] text-muted-foreground">
                      {block.resources}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-xs font-semibold transition duration-200 hover:bg-muted motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98]">
          <ClipboardList className="size-3.5" /> Export plan
        </button>
        <button
          onClick={() => setScenario(!scenario)}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2.5 text-xs font-semibold transition duration-200 hover:bg-muted motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98]"
        >
          <Radar className="size-3.5" /> Run what-if scenario
        </button>
        <button
          onClick={() => setApproved(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.98]"
        >
          <Check className="size-3.5" />{" "}
          {approved ? "Plan approved" : "Approve plan"}
        </button>
      </div>
    </div>
  );
}

function readScenarioString(
  record: Record<string, unknown> | undefined,
  ...keys: string[]
): string {
  if (!record) return "";

  for (const key of keys) {
    const value = record[key];

    if (value !== null && value !== undefined) {
      const text = String(value).trim();
      if (text) return text;
    }
  }

  return "";
}

function safeMetricNumber(value: unknown, fallback: number): number {
  const safeFallback = Number.isFinite(fallback) ? fallback : 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : safeFallback;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/%/g, "").replace(/,/g, "").trim());

    return Number.isFinite(parsed) ? parsed : safeFallback;
  }

  return safeFallback;
}

function WhatIfSimulation() {
  const { maintenanceRequests, isLoading } = useMaintenanceRequests();

  const [traffic, setTraffic] = useState("+20%");
  const [delay, setDelay] = useState("Minor");
  const [resourcesReduced, setResourcesReduced] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [weather, setWeather] = useState(false);
  const [scenarioResult, setScenarioResult] =
    useState<OptimizationResponse | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState("");

  const selectClass =
    "rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground";

  const controls: Array<{
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
  }> = [
    {
      label: "Traffic",
      value: traffic,
      options: ["Normal", "+20%", "+40%"],
      onChange: setTraffic,
    },
    {
      label: "Train delay",
      value: delay,
      options: ["None", "Minor", "Major"],
      onChange: setDelay,
    },
  ];

  /*
   * Keep the scenario component independent from the exact JSON type used
   * by the data hooks. The API boundary already accepts unknown[] records.
   * This avoids TS inference turning request/section into `unknown`.
   */
  type JsonRecord = Record<string, unknown>;

  const asRecords = (value: unknown): JsonRecord[] =>
    Array.isArray(value)
      ? value.filter(
          (item): item is JsonRecord =>
            !!item && typeof item === "object" && !Array.isArray(item),
        )
      : [];

  const requestRecords = useMemo(
    () => asRecords(maintenanceRequests),
    [maintenanceRequests],
  );

  const activeRequests = useMemo(
    () =>
      requestRecords.filter(
        (request) => String(request.status ?? "") !== "Completed",
      ),
    [requestRecords],
  );

  /*
   * Deduplicate by id/request_id. Do not use Map inference directly on
   * MaintenanceRequest | string arrays; that was the source of the TS2345
   * errors in the previous version.
   */
  const scenarioRequests = useMemo(() => {
    // `Map` is also imported above as a Lucide icon, so explicitly use the
    // built-in collection constructor here.
    const unique = new globalThis.Map<string, JsonRecord>();

    for (const request of activeRequests) {
      const id = readScenarioString(request, "id", "request_id");

      if (id && !unique.has(id)) {
        unique.set(id, request);
      }
    }

    return Array.from(unique.values());
  }, [activeRequests]);

  const sectionRecords = useMemo(() => asRecords(sections), []);

  const scenarioSectionId = useMemo(() => {
    const firstRequest = scenarioRequests[0];

    const requestSection = readScenarioString(
      firstRequest,
      "section",
      "section_id",
    );

    if (requestSection) {
      return requestSection;
    }

    return readScenarioString(sectionRecords[0], "id", "section_id", "section");
  }, [scenarioRequests, sectionRecords]);

  const scenarioTrains = useMemo(() => asRecords(trains), []);

  const scenarioResources = useMemo(() => asRecords(resources), []);

  const scenarioSections = useMemo(() => asRecords(sections), []);

  const scenarioScenarios = useMemo(() => asRecords(scenarios), []);

  /*
   * CURRENT PLAN is the real dataset baseline.
   * It must not use the last optimizer result because that result represents
   * an optimized plan and can make the scenario delta misleading.
   */
  const baselineNumbers = {
    blockHours: safeMetricNumber(totalBlockHours, 31.8),
    blocks: safeMetricNumber(plannedBlocks, 14),
    trainConflicts: safeMetricNumber(trainConflicts, 2),
    completion: safeMetricNumber(maintenanceCompletion, 94),
    assetAvailability: safeMetricNumber(assetAvailability, 96.8),
  };

  const scenarioNumbers = scenarioResult
    ? {
        blockHours: safeMetricNumber(
          scenarioResult.metrics?.total_block_hours,
          baselineNumbers.blockHours,
        ),
        blocks: safeMetricNumber(
          scenarioResult.metrics?.total_blocks,
          baselineNumbers.blocks,
        ),
        trainConflicts: safeMetricNumber(
          scenarioResult.metrics?.train_conflicts,
          baselineNumbers.trainConflicts,
        ),
        completion: safeMetricNumber(
          scenarioResult.metrics?.maintenance_completion_percent,
          baselineNumbers.completion,
        ),
        assetAvailability: safeMetricNumber(
          scenarioResult.metrics?.asset_availability,
          baselineNumbers.assetAvailability,
        ),
      }
    : null;

  const currentValues = [
    `${baselineNumbers.blockHours.toFixed(2)} h`,
    String(Math.round(baselineNumbers.blocks)),
    String(Math.round(baselineNumbers.trainConflicts)).padStart(2, "0"),
    `${baselineNumbers.completion.toFixed(2)}%`,
    `${baselineNumbers.assetAvailability.toFixed(2)}%`,
  ];

  const scenarioValues = scenarioNumbers
    ? [
        `${scenarioNumbers.blockHours.toFixed(2)} h`,
        String(Math.round(scenarioNumbers.blocks)),
        String(Math.round(scenarioNumbers.trainConflicts)).padStart(2, "0"),
        `${scenarioNumbers.completion.toFixed(2)}%`,
        `${scenarioNumbers.assetAvailability.toFixed(2)}%`,
      ]
    : ["—", "—", "—", "—", "—"];

  const scenarioImpact = scenarioNumbers
    ? {
        blocksChanged: Math.round(
          scenarioNumbers.blocks - baselineNumbers.blocks,
        ),
        blockHoursChanged: Number(
          (scenarioNumbers.blockHours - baselineNumbers.blockHours).toFixed(2),
        ),
        trainConflictsChanged: Math.round(
          scenarioNumbers.trainConflicts - baselineNumbers.trainConflicts,
        ),
        completionChanged: Number(
          (scenarioNumbers.completion - baselineNumbers.completion).toFixed(2),
        ),
        assetAvailabilityChanged: Number(
          (
            scenarioNumbers.assetAvailability -
            baselineNumbers.assetAvailability
          ).toFixed(2),
        ),
      }
    : null;

  const recommendation = scenarioResult
    ? (() => {
        const assetChange = scenarioImpact?.assetAvailabilityChanged ?? 0;
        const conflictChange = scenarioImpact?.trainConflictsChanged ?? 0;
        const completionChange = scenarioImpact?.completionChanged ?? 0;

        if (scenarioResult.status === "infeasible") {
          return {
            title: "Reject scenario",
            message:
              "The scenario is infeasible and does not satisfy the required operational constraints.",
            tone: "critical" as const,
          };
        }

        if (conflictChange > 0) {
          return {
            title: "Review required",
            message: `Train conflicts increase by ${conflictChange}. Review the affected operating windows before acceptance.`,
            tone: "warning" as const,
          };
        }

        if (assetChange <= -10) {
          return {
            title: "Review required",
            message: `Asset availability decreases by ${Math.abs(assetChange)}%. Review resource capacity before acceptance.`,
            tone: "warning" as const,
          };
        }

        if (completionChange < -5) {
          return {
            title: "Review required",
            message: `Maintenance completion decreases by ${Math.abs(completionChange)}%. Review the workload before acceptance.`,
            tone: "warning" as const,
          };
        }

        if (assetChange < 0) {
          return {
            title: "Recommended",
            message: `The scenario remains feasible with zero additional train conflicts. Asset availability changes only ${assetChange}%, which is within the acceptable operating range.`,
            tone: "positive" as const,
          };
        }

        return {
          title: "Recommended",
          message:
            "The scenario remains feasible with no critical operational regression detected.",
          tone: "positive" as const,
        };
      })()
    : null;

  const runScenario = async () => {
    if (scenarioLoading || isLoading) return;

    if (!scenarioRequests.length) {
      setScenarioError("No active maintenance requests are available.");
      setScenarioResult(null);
      return;
    }

    if (!scenarioSectionId) {
      setScenarioError("No railway section is available for this scenario.");
      setScenarioResult(null);
      return;
    }

    setScenarioLoading(true);
    setScenarioError("");
    setScenarioResult(null);

    try {
      const ids = scenarioRequests
        .map((request) => readScenarioString(request, "id", "request_id"))
        .filter(Boolean);

      console.log("RUN SCENARIO CLICKED");
      console.log("SCENARIO MAINTENANCE COUNT:", ids.length);
      console.log("SCENARIO MAINTENANCE IDS:", ids);
      console.log("SCENARIO SECTION:", scenarioSectionId);

      const result = await runOptimization({
        planningDate: getTodayDateString(),
        sectionId: scenarioSectionId,
        maintenanceRequestIds: ids,
        planningWindow: "24 hours",
        scenarioId: "WHAT_IF",
        scenarioParameters: {
          traffic,
          train_delay: delay,
          resources_reduced: resourcesReduced,
          emergency_maintenance: emergency,
          weather_restriction: weather,
        },
        data: {
          maintenance_requests: scenarioRequests,
          trains: scenarioTrains,
          resources: scenarioResources,
          sections: scenarioSections,
          scenarios: scenarioScenarios,
        },
      });

      console.log("SCENARIO RESULT:", result);
      setScenarioResult(result);
    } catch (error) {
      console.error("SCENARIO ERROR:", error);
      setScenarioError(
        error instanceof Error ? error.message : "Scenario simulation failed.",
      );
    } finally {
      setScenarioLoading(false);
    }
  };

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            SCENARIO LAB · CONSTRAINT ANALYSIS
          </div>

          <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            What-if simulation
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Stress-test the active maintenance workload against changing
            operating conditions before committing a plan.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
          <Radar className="size-3.5" />
          Scenario engine ready
        </div>
      </div>

      <section className="mb-6 rounded-lg border border-border bg-card p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-primary">
              Scenario controls
            </p>
            <h3 className="mt-1 font-mono text-sm font-semibold">
              Change operating conditions
            </h3>
          </div>

          <span className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
            {scenarioRequests.length} maintenance requests in scenario
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {controls.map((control) => (
            <label key={control.label} className="flex flex-col gap-2 text-xs">
              <span className="font-medium">{control.label}</span>
              <select
                className={selectClass}
                value={control.value}
                onChange={(event) => {
                  control.onChange(event.target.value);
                  setScenarioResult(null);
                  setScenarioError("");
                }}
              >
                {control.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="flex flex-col gap-2 text-xs">
            <span className="font-medium">Resources reduced</span>
            <button
              type="button"
              onClick={() => {
                setResourcesReduced((value) => !value);
                setScenarioResult(null);
                setScenarioError("");
              }}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98] ${
                resourcesReduced
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-card"
              }`}
            >
              <span>{resourcesReduced ? "Reduced" : "Normal"}</span>
              <span
                className={`size-2 rounded-full ${
                  resourcesReduced ? "bg-accent" : "bg-primary"
                }`}
              />
            </button>
          </label>

          <label className="flex flex-col gap-2 text-xs">
            <span className="font-medium">Emergency maintenance</span>
            <button
              type="button"
              onClick={() => {
                setEmergency((value) => !value);
                setScenarioResult(null);
                setScenarioError("");
              }}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98] ${
                emergency
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border bg-card"
              }`}
            >
              <span>{emergency ? "ON" : "OFF"}</span>
              <span
                className={`size-2 rounded-full ${
                  emergency ? "bg-destructive" : "bg-muted-foreground"
                }`}
              />
            </button>
          </label>

          <label className="flex flex-col gap-2 text-xs">
            <span className="font-medium">Weather restriction</span>
            <button
              type="button"
              onClick={() => {
                setWeather((value) => !value);
                setScenarioResult(null);
                setScenarioError("");
              }}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98] ${
                weather
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-card"
              }`}
            >
              <span>{weather ? "ON" : "OFF"}</span>
              <span
                className={`size-2 rounded-full ${
                  weather ? "bg-accent" : "bg-muted-foreground"
                }`}
              />
            </button>
          </label>
        </div>

        {scenarioError && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive"
          >
            {scenarioError}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            The engine will re-check train paths, resources, conflicts, and
            block feasibility for all selected maintenance IDs.
          </p>

          <button
            type="button"
            onClick={runScenario}
            disabled={scenarioLoading || isLoading || !scenarioRequests.length}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none"
          >
            {scenarioLoading ? (
              <Clock3 className="size-4 motion-safe:animate-spin" />
            ) : (
              <Zap className="size-4" />
            )}
            {scenarioLoading ? "Running..." : "Run scenario"}
          </button>
        </div>
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <PlanComparison
          title="CURRENT PLAN"
          values={currentValues}
          tone="primary"
        />

        <PlanComparison
          title="NEW PLAN"
          values={
            scenarioResult
              ? [
                  `${scenarioResult.metrics.total_block_hours ?? 0} h`,
                  String(scenarioResult.metrics.total_blocks ?? 0),
                  String(scenarioResult.metrics.train_conflicts ?? 0).padStart(
                    2,
                    "0",
                  ),
                  `${scenarioResult.metrics.maintenance_completion_percent ?? 0}%`,
                  `${scenarioResult.metrics.asset_availability ?? 0}%`,
                ]
              : ["—", "—", "—", "—", "—"]
          }
          tone={scenarioResult ? "accent" : "muted"}
        />
      </div>

      {scenarioResult && (
        <section className="rounded-lg border border-border bg-card p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Scenario Impact
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Change versus current plan
              </p>
            </div>

            {scenarioResult && (
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                  scenarioResult.status === "optimal"
                    ? "bg-primary/10 text-primary"
                    : scenarioResult.status === "feasible"
                      ? "bg-accent/15 text-accent"
                      : "bg-destructive/10 text-destructive"
                }`}
              >
                {scenarioResult.status.toUpperCase()}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-1">
            <div className="rounded-md border border-border p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
              <p className="text-[10px] text-muted-foreground">
                Block count change
              </p>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  scenarioImpact
                    ? scenarioImpact.blocksChanged > 0
                      ? "text-accent"
                      : scenarioImpact.blocksChanged < 0
                        ? "text-primary"
                        : "text-foreground"
                    : ""
                }`}
              >
                {scenarioImpact
                  ? `${scenarioImpact.blocksChanged >= 0 ? "+" : ""}${scenarioImpact.blocksChanged}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-md border border-border p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
              <p className="text-[10px] text-muted-foreground">Block hours</p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {scenarioImpact
                  ? `${scenarioImpact.blockHoursChanged >= 0 ? "+" : ""}${scenarioImpact.blockHoursChanged} h`
                  : "—"}
              </p>
            </div>

            <div className="rounded-md border border-border p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
              <p className="text-[10px] text-muted-foreground">
                Train conflicts
              </p>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  scenarioImpact
                    ? scenarioImpact.trainConflictsChanged < 0
                      ? "text-primary"
                      : scenarioImpact.trainConflictsChanged > 0
                        ? "text-destructive"
                        : "text-foreground"
                    : ""
                }`}
              >
                {scenarioImpact
                  ? `${scenarioImpact.trainConflictsChanged >= 0 ? "+" : ""}${scenarioImpact.trainConflictsChanged}`
                  : "—"}
              </p>
            </div>

            <div className="rounded-md border border-border p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
              <p className="text-[10px] text-muted-foreground">Completion</p>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  scenarioImpact
                    ? scenarioImpact.completionChanged >= 0
                      ? "text-primary"
                      : "text-destructive"
                    : ""
                }`}
              >
                {scenarioImpact
                  ? `${scenarioImpact.completionChanged >= 0 ? "+" : ""}${scenarioImpact.completionChanged}%`
                  : "—"}
              </p>
            </div>

            <div className="rounded-md border border-border p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
              <p className="text-[10px] text-muted-foreground">
                Asset availability
              </p>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  scenarioImpact
                    ? scenarioImpact.assetAvailabilityChanged >= 0
                      ? "text-primary"
                      : "text-destructive"
                    : ""
                }`}
              >
                {scenarioImpact
                  ? `${scenarioImpact.assetAvailabilityChanged >= 0 ? "+" : ""}${scenarioImpact.assetAvailabilityChanged}%`
                  : "—"}
              </p>
            </div>
          </div>
        </section>
      )}

      {scenarioResult && (
        <section className="mt-5 rounded-lg border border-border bg-card p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    recommendation?.tone === "critical"
                      ? "bg-destructive"
                      : recommendation?.tone === "warning"
                        ? "bg-accent"
                        : "bg-primary"
                  }`}
                />
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  AI RECOMMENDATION
                </p>
              </div>

              <h3
                className={`mt-2 font-mono text-sm font-semibold ${
                  recommendation?.tone === "critical"
                    ? "text-destructive"
                    : recommendation?.tone === "warning"
                      ? "text-accent"
                      : "text-primary"
                }`}
              >
                {recommendation?.title ?? "Evaluating scenario"}
              </h3>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                {recommendation?.message ??
                  "Run the scenario to generate an operational recommendation."}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Reports() {
  const { maintenanceRequests, isLoading } = useMaintenanceRequests();
  const approved = maintenanceRequests.filter(
    (request) => request.status === "Approved",
  ).length;
  const completed = maintenanceRequests.filter(
    (request) => request.status === "Completed",
  ).length;
  const highPriority = maintenanceRequests.filter(
    (request) => request.priority === "Urgent" || request.priority === "High",
  ).length;
  const reportRows = [
    [
      "Maintenance requests",
      isLoading ? "—" : String(maintenanceRequests.length),
      "Loaded from maintenance dataset",
    ],
    [
      "Approved requests",
      isLoading ? "—" : String(approved),
      "Current approval status",
    ],
    [
      "Completed requests",
      isLoading ? "—" : String(completed),
      "Current completion status",
    ],
    [
      "High-priority requests",
      isLoading ? "—" : String(highPriority),
      "Urgent and high priority",
    ],
    ["Train records", String(trains.length), "Loaded from train dataset"],
    [
      "Resource records",
      String(resources.length),
      "Loaded from resource dataset",
    ],
  ];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> DATASET
            REPORTING
          </div>
          <h2 className="text-balance font-mono text-2xl font-semibold tracking-tight md:text-3xl">
            Reports
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A clear operational summary built only from the records currently
            loaded into RailOpt AI.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted">
          <CalendarDays className="size-3.5" /> Dataset summary
        </button>
      </div>
      <DashboardMetrics />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-mono text-sm font-semibold">
              Operational summary
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Current counts and source context
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-muted/25 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Measure</th>
                  <th className="px-5 py-3 font-medium">Value</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportRows.map(([label, value, source]) => (
                  <tr
                    key={label}
                    className="text-xs transition-colors duration-150 hover:bg-muted/20"
                  >
                    <td className="px-5 py-4 font-medium">{label}</td>
                    <td className="px-5 py-4 font-mono text-lg font-semibold text-primary">
                      {value}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <CircleGauge className="size-4" />
            <h3 className="font-mono text-sm font-semibold">Report status</h3>
          </div>
          <div className="mt-5 rounded-md border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold">Dataset-backed report</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              No optimized blocks, conflicts, or performance improvements are
              reported until the optimizer returns a validated result.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs">
            <span className="text-muted-foreground">Sections tracked</span>
            <span className="font-mono font-semibold">{sections.length}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Stations tracked</span>
            <span className="font-mono font-semibold">{stations.length}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function PlanComparison({
  title,
  values,
  tone,
}: {
  title: string;
  values: string[];
  tone: "primary" | "accent" | "muted";
}) {
  const labels = [
    "Block Hours",
    "Number of Blocks",
    "Train Conflicts",
    "Maintenance Completion",
    "Asset Availability",
  ];
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p
          className={`text-[10px] font-semibold tracking-[0.14em] ${tone === "accent" ? "text-accent" : tone === "primary" ? "text-primary" : "text-muted-foreground"}`}
        >
          {title}
        </p>
        {tone === "accent" && (
          <span className="rounded bg-accent/15 px-2 py-1 text-[9px] text-accent">
            SIMULATED
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {labels.map((label, index) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-border/70 pb-2 text-xs last:border-0 last:pb-0"
          >
            <span className="text-muted-foreground">{label}</span>
            <span
              className={`font-mono font-semibold ${tone === "accent" ? "text-accent" : ""}`}
            >
              {values[index]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RailOptDashboard() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <Shell
      active={active}
      setActive={setActive}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      {active === "Maintenance Request" ? (
        <MaintenanceRequests />
      ) : active === "Train Operations" ? (
        <TrainOperations />
      ) : active === "Railway Network" ? (
        <RailwayNetwork />
      ) : active === "Resources" ? (
        <ResourceManagement />
      ) : active === "Block Planning" ? (
        <BlockPlanning setActive={setActive} />
      ) : active === "AI Optimization" ? (
        <AIOptimization setActive={setActive} />
      ) : active === "Optimized Block Plan" ? (
        <OptimizedBlockPlan />
      ) : active === "What-if Simulation" ? (
        <WhatIfSimulation />
      ) : active === "Reports" ? (
        <Reports />
      ) : (
        <DashboardHomeRedesigned setActive={setActive} />
      )}
    </Shell>
  );
}
export default RailOptDashboard;
