"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  Map,
  Radar,
  Sparkles,
  TrainFront,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { RailKpi } from "@/components/railopt-design-system";
import { resources, sections, stations, trains } from "@/data";
import { useMaintenanceRequests } from "@/data/use-maintenance-requests";
import { useOptimizationResult } from "@/data/optimization-results";

type Props = {
  setActive?: (screen: string) => void;
};

const statusClass = (status: string) => {
  if (status === "Operational" || status === "Available") {
    return "bg-primary/10 text-primary";
  }
  if (status === "Restricted" || status === "Busy") {
    return "bg-accent/15 text-accent";
  }
  return "bg-destructive/10 text-destructive";
};

const formatBlockTime = (value: string) => {
  const parts = value.split("→").map((part) => part.trim());

  if (parts.length !== 2) return value;

  const start = new Date(parts[0]);
  const end = new Date(parts[1]);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return value;
  }

  const date = start.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = `${start.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} → ${end.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;

  return `${date} · ${time}`;
};
const timeToMinutes = (value: string) => {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
};

export function DashboardHomeRedesigned({ setActive }: Props) {
  const { maintenanceRequests, isLoading } = useMaintenanceRequests();
  const { result } = useOptimizationResult();
  const [selectedSection, setSelectedSection] = useState(sections[0]?.id ?? "");
  const [simulated, setSimulated] = useState(false);

  const activeRequests = maintenanceRequests.filter(
    (request) => request.status !== "Completed",
  );
  const urgentRequests = maintenanceRequests.filter(
    (request) => request.priority === "Urgent" || request.priority === "High",
  );

  const resultMetrics = result?.metrics;
  const blocks = result?.blocks ?? [];
  const totalBlocks = resultMetrics?.totalBlocks ?? blocks.length;
  const maintenanceJobs = resultMetrics?.totalTasks ?? activeRequests.length;
  const blockHours = resultMetrics?.blockHours ?? 0;
  const trainConflicts = resultMetrics?.trainConflicts ?? 0;
  const maintenanceCompletion =
    resultMetrics?.maintenanceCompletion ??
    (maintenanceRequests.length
      ? Math.round(
          (maintenanceRequests.filter(
            (request) => request.status === "Approved",
          ).length /
            maintenanceRequests.length) *
            100,
        )
      : 0);
  const assetAvailability =
    resultMetrics?.assetAvailability ??
    (resources.length
      ? Math.round(
          (resources.filter((resource) => resource.availability === "Available")
            .length /
            resources.length) *
            100,
        )
      : 0);

  const selected =
    sections.find((section) => section.id === selectedSection) ?? sections[0];

  const selectedTrains = useMemo(
    () => trains.filter((train) => train.section === selected?.id),
    [selected?.id],
  );

  const recommendedRequest = activeRequests[0];
  const recommendedSection =
    sections.find((section) => section.id === recommendedRequest?.section) ??
    selected;

  const upcomingBlocks = blocks.length
    ? blocks.slice(0, 3).map((block) => ({
        id: block.id,
        section: block.section,
        time: block.time,
        tasks: block.tasks,
        resources: block.resources,
      }))
    : [
        {
          id: "BLK-DEMO",
          section: recommendedSection?.id ?? "A-14",
          time: "02:10–03:25",
          tasks: recommendedRequest ? recommendedRequest.id : "Maintenance",
          resources: recommendedRequest?.resource ?? "Resource pending",
        },
      ];

  const timelineRows = sections.map((section, index) => {
    const sectionTrains = trains.filter(
      (train) => train.section === section.id,
    );
    const first = sectionTrains[0];
    const start = first ? timeToMinutes(first.arrival) : 60 + index * 70;
    const duration = Math.max(
      55,
      first
        ? timeToMinutes(first.departure) - timeToMinutes(first.arrival)
        : 75,
    );
    return {
      section,
      start,
      duration,
      label: `${section.from} — ${section.to}`,
      trainCount: sectionTrains.length,
    };
  });

  return (
    <div
      data-dashboard-page
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
    >
      {/* Hero */}
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Network Control Center
          </div>
          <h2 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            Dashboard
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Real-time view of rolling block planning, maintenance readiness,
            train movements, conflicts, and optimizer recommendations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSimulated((value) => !value);
              setActive?.("What-if Simulation");
            }}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-xs font-semibold shadow-sm transition duration-200 hover:bg-muted motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-[0.98]"
          >
            <Radar className="size-3.5" />
            {simulated ? "Scenario active" : "New Scenario / What-if"}
          </button>

          <button
            onClick={() => setActive?.("Block Planning")}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md motion-safe:active:scale-[0.98]"
          >
            <Sparkles className="size-3.5" />
            Generate Optimized Plan
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <RailKpi
          label="Maintenance Requests"
          value={isLoading ? "—" : String(maintenanceRequests.length)}
          change={`${urgentRequests.length} urgent / high priority`}
          status={urgentRequests.length ? "warning" : "default"}
          className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        />
        <RailKpi
          label="Blocks Scheduled"
          value={String(totalBlocks)}
          change={
            result ? "Live optimizer result" : "Generate a plan to populate"
          }
          status={result ? "success" : "default"}
          className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        />
        <RailKpi
          label="Block Utilization"
          value={`${selected?.utilization ?? 0}%`}
          change="Across tracked sections"
          status={
            selected && selected.utilization >= 85 ? "warning" : "success"
          }
          className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        />
        <RailKpi
          label="Train Conflicts"
          value={String(trainConflicts)}
          change={trainConflicts ? "Requires review" : "No optimizer conflicts"}
          status={trainConflicts ? "error" : "success"}
          className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        />
        <RailKpi
          label="Maintenance Jobs"
          value={String(activeRequests.length)}
          change={`${maintenanceCompletion}% approved`}
          status="default"
          className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        />
        <RailKpi
          label="Asset Availability"
          value={`${assetAvailability}%`}
          change={`${resources.length} resources tracked`}
          status={assetAvailability >= 80 ? "success" : "warning"}
          className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        />
      </div>

      {/* Main control-center grid */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        {/* Network overview */}
        <section className="overflow-hidden rounded-xl border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Map className="size-4 text-primary" />
                <h3 className="font-mono text-sm font-semibold">
                  Network Overview
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Schematic operating view · select a section to inspect it.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
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

          <div className="overflow-x-auto px-5 py-8">
            <div className="relative min-w-[720px]">
              <div className="absolute left-10 right-10 top-[44px] h-1 rounded-full bg-border" />
              <div className="relative flex items-start justify-between">
                {stations
                  .slice(0, Math.max(5, sections.length + 1))
                  .map((station, index) => {
                    const section =
                      sections[index % Math.max(1, sections.length)];
                    const isSelected = section?.id === selectedSection;

                    return (
                      <div
                        key={station.code}
                        className="flex w-28 flex-col items-center"
                      >
                        <button
                          onClick={() =>
                            section && setSelectedSection(section.id)
                          }
                          className={`relative z-10 flex size-12 items-center justify-center rounded-full border-4 border-card bg-background font-mono text-[10px] font-bold shadow-sm ring-1 transition duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md motion-safe:active:scale-95 ${
                            station.status === "Operational"
                              ? "text-primary ring-primary"
                              : station.status === "Restricted"
                                ? "text-accent ring-accent"
                                : "text-destructive ring-destructive"
                          } ${isSelected ? "scale-110 shadow-lg" : ""}`}
                          title={
                            section
                              ? `${section.from} → ${section.to}`
                              : station.name
                          }
                        >
                          {station.code}
                        </button>

                        <p className="mt-3 text-center font-mono text-[10px] font-semibold">
                          {station.name}
                        </p>
                        <p className="mt-1 text-[9px] text-muted-foreground">
                          {station.status}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {selected && (
            <div className="border-t border-border bg-muted/20 px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Section
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold">
                    {selected.id}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Corridor
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    {selected.from} → {selected.to}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Trains
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold">
                    {selected.trains}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Utilization
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold">
                    {selected.utilization}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Recommendation hero */}
        <section className="overflow-hidden rounded-xl border border-primary/25 bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="border-b border-border px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Recommended Block Summary
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Highest-value work for the next operating window
            </p>
          </div>

          <div className="p-5">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Next Recommended Block
                </p>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold text-accent">
                  {recommendedRequest?.priority ?? "High"}
                </span>
              </div>

              <p className="mt-4 font-mono text-3xl font-semibold tracking-tight">
                {upcomingBlocks[0]?.time
                  ? formatBlockTime(upcomingBlocks[0].time)
                  : "—"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Location
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {recommendedSection?.from ?? "—"} —{" "}
                    {recommendedSection?.to ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Block Type
                  </p>
                  <p className="mt-1 text-xs font-semibold">Maintenance</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [
                  "Jobs",
                  String(
                    Math.max(
                      1,
                      activeRequests.length
                        ? Math.min(4, activeRequests.length)
                        : 1,
                    ),
                  ),
                  Wrench,
                ],
                ["Utilization", `${selected?.utilization ?? 0}%`, Gauge],
                ["Conflicts", String(trainConflicts), AlertTriangle],
                ["Resources", String(resources.length), Users],
              ].map(([label, value, Icon]) => (
                <div
                  key={String(label)}
                  className="rounded-md border border-border bg-background p-3"
                >
                  <Icon className="size-3.5 text-primary" />
                  <p className="mt-3 font-mono text-lg font-semibold">
                    {String(value)}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    {String(label)}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActive?.("Optimized Block Plan")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-xs font-semibold text-primary-foreground shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md motion-safe:active:scale-[0.98]"
            >
              View Block Plan
              <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </section>
      </div>

      {/* Timeline + side rail */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="font-mono text-sm font-semibold">
                Block Plan Timeline
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Train movements and maintenance possessions across the next 24
                hours.
              </p>
            </div>
            <button
              onClick={() => setActive?.("Train Operations")}
              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
            >
              View timetable <ChevronRight className="size-3" />
            </button>
          </div>

          <div className="overflow-x-auto p-5">
            <div className="min-w-[820px]">
              <div className="ml-40 flex justify-between border-b border-border pb-2 text-[9px] text-muted-foreground">
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

              <div className="mt-4 space-y-3">
                {timelineRows.map((row, index) => {
                  const left = Math.min(94, (row.start / 1440) * 100);
                  const width = Math.max(6, (row.duration / 1440) * 100);

                  return (
                    <div
                      key={row.section.id}
                      className="flex items-center gap-3"
                    >
                      <div className="w-37 shrink-0">
                        <p className="font-mono text-[10px] font-semibold">
                          {row.label}
                        </p>
                        <p className="mt-1 text-[9px] text-muted-foreground">
                          {row.section.id} · {row.trainCount} trains
                        </p>
                      </div>

                      <div className="relative h-10 flex-1 rounded bg-muted/40">
                        <div className="absolute inset-y-2 left-0 right-0 border-t border-dashed border-border/70" />
                        <div
                          className={`absolute top-1.5 h-7 rounded ${
                            index === 2 ? "bg-accent" : "bg-primary/80"
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-sm bg-primary" /> Planned
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-sm bg-accent" /> Maintenance
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-sm bg-destructive" /> Protected /
                  conflict
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-sm font-semibold">
                    Upcoming High Priority Blocks
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Work requiring planner attention
                  </p>
                </div>
                <CalendarDays className="size-4 text-primary" />
              </div>
            </div>

            <div className="divide-y divide-border">
              {upcomingBlocks.map((block, index) => (
                <div key={`${block.id}-${index}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold">
                        {block.section}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {block.time}
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {block.tasks}
                      </p>
                    </div>
                    <span className="rounded-full bg-accent/15 px-2 py-1 text-[9px] font-semibold text-accent">
                      {index === 0 ? "High" : "Medium"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-mono text-sm font-semibold">
                Alerts & Notifications
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Signals that can affect the plan
              </p>
            </div>

            <div className="space-y-3 p-4">
              {resources
                .filter((resource) => resource.conflict)
                .slice(0, 3)
                .map((resource) => (
                  <div
                    key={resource.id}
                    className="flex gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold">
                        {resource.id} resource conflict
                      </p>
                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        {resource.conflict}
                      </p>
                    </div>
                  </div>
                ))}

              {!resources.some((resource) => resource.conflict) && (
                <div className="flex gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <CheckCircle2 className="mt-0.5 size-3.5 text-primary" />
                  <p className="text-[10px] text-muted-foreground">
                    No resource conflicts are currently flagged.
                  </p>
                </div>
              )}

              <div className="flex gap-3 rounded-md border border-border bg-muted/20 p-3">
                <Bell className="mt-0.5 size-3.5 text-primary" />
                <p className="text-[10px] text-muted-foreground">
                  {activeRequests.length} active maintenance requests are
                  waiting for scheduling.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Impact + quick actions */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <section className="rounded-xl border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-mono text-sm font-semibold">
                  Optimization Impact
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Compare the current optimizer result against manual planning
                  assumptions.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-semibold text-primary">
                {result?.status ?? "Awaiting optimizer"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 xl:grid-cols-6">
            {[
              [
                "Blocks Required",
                String(totalBlocks),
                result ? "Live result" : "Pending",
              ],
              [
                "Maintenance Jobs",
                String(maintenanceJobs),
                result ? "Optimizer output" : "Active work",
              ],
              [
                "Block Hours",
                `${blockHours}h`,
                result ? "Solver output" : "Pending",
              ],
              [
                "Train Conflicts",
                String(trainConflicts),
                trainConflicts ? "Review" : "Clear",
              ],
              [
                "Asset Availability",
                `${assetAvailability}%`,
                "Resource status",
              ],
              [
                "Plan Readiness",
                result ? "Ready" : "Not generated",
                result ? "Validated" : "Run optimizer",
              ],
            ].map(([label, value, caption]) => (
              <div key={label} className="p-4">
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 font-mono text-lg font-semibold">{value}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  {caption}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-mono text-sm font-semibold">
              What-if Simulator · Quick Actions
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Stress-test the plan before approval.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4">
            {[
              ["Train Delay", "What-if", Clock3],
              ["Increase Priority", "Scenario", Zap],
              ["Reduce Duration", "Scenario", Wrench],
              ["Resource Unavailable", "Scenario", Users],
            ].map(([label, caption, Icon]) => (
              <button
                key={String(label)}
                onClick={() => setActive?.("What-if Simulation")}
                className="group rounded-lg border border-border p-3 text-left transition duration-200 hover:border-primary/40 hover:bg-primary/5 motion-safe:hover:-translate-y-0.5 hover:shadow-sm motion-safe:active:scale-[0.98]"
              >
                <Icon className="size-4 text-primary transition duration-200 motion-safe:group-hover:-translate-y-0.5" />
                <p className="mt-3 text-[10px] font-semibold">
                  {String(label)}
                </p>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  {String(caption)}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {simulated && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          <Radar className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-xs font-semibold">What-if scenario opened</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Use the What-if Simulation page to change traffic, train delays,
              resource availability, emergency maintenance, and weather
              restrictions.
            </p>
          </div>
          <button
            onClick={() => setActive?.("What-if Simulation")}
            className="ml-auto shrink-0 rounded-md border border-accent/30 px-3 py-1.5 text-[10px] font-semibold text-accent transition duration-200 motion-safe:hover:-translate-y-0.5 hover:bg-accent/10 hover:shadow-sm motion-safe:active:scale-[0.98]"
          >
            Open
          </button>
        </div>
      )}
    </div>
  );
}

export default DashboardHomeRedesigned;
