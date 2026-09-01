# RailOpt AI — Dashboard UI Redesign

This package contains a presentation-layer redesign for the **DashboardHome** screen.

## What it changes

It keeps the existing data sources and optimizer state intact, while changing the dashboard hierarchy to a Railway Operations Control Center style:

- KPI strip
- Network Overview / schematic
- Recommended Block Summary
- Block Plan Timeline
- Upcoming High Priority Blocks
- Alerts & Notifications
- Optimization Impact
- What-if Simulator quick actions

The component reads the existing:
- `useMaintenanceRequests()`
- `useOptimizationResult()`
- `sections`
- `stations`
- `trains`
- `resources`

## Important

Do NOT replace the entire `railopt-dashboard.tsx` blindly.

This is intentionally a separate component because the original file also contains:
- Maintenance Requests
- Train Operations
- Railway Network
- Resources
- Block Planning
- AI Optimization
- Optimized Block Plan
- What-if Simulation
- Reports

Those flows should remain untouched.

## Integration

1. Put `DashboardHomeRedesigned.tsx` in `components/`.
2. In `components/railopt-dashboard.tsx`, import:

```tsx
import DashboardHomeRedesigned from '@/components/DashboardHomeRedesigned'
```

3. Change the dashboard route from:

```tsx
:<DashboardHome/>
```

to:

```tsx
:<DashboardHomeRedesigned setActive={setActive}/>
```

The safest approach is to replace only that final fallback expression in `RailOptDashboard()`.

## Notes

The component uses the existing Tailwind theme tokens (`bg-card`, `bg-background`, `text-primary`, etc.), so it should inherit the current RailOpt design system.

If TypeScript reports a field mismatch around optimizer metrics, keep the existing `OptimizationResult` type/normalizer as the source of truth rather than changing backend contracts just for the UI.
