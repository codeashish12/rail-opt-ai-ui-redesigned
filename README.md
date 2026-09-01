# 🚆 RailOpt AI

> Intelligent railway maintenance planning and scenario optimization platform.

RailOpt AI helps railway operations teams plan maintenance work while considering train movements, section constraints, resource availability, operational scenarios, and maintenance priorities.

The platform combines a modern Next.js dashboard with a Python FastAPI optimization service powered by Google OR-Tools CP-SAT.

---

## 🎯 Problem

Railway maintenance planning is difficult because maintenance windows must be coordinated with:

- 🚆 Train movements and protected/high-priority operations
- 🛠️ Maintenance requests and deadlines
- 🧰 Shared resources and equipment
- 🛤️ Route sections
- 🌦️ Operational restrictions and weather conditions
- 🚨 Emergency maintenance requirements
- 📈 Changes in traffic and train delays

A small planning decision can affect maintenance completion, operational conflicts, asset availability, and total maintenance hours.

## 💡 Solution

RailOpt AI converts selected maintenance requests and operational conditions into an optimized maintenance schedule.

The optimization engine:

1. Reads the selected maintenance requests.
2. Builds a planning horizon.
3. Applies section and resource constraints.
4. Protects high-priority/protected train windows.
5. Considers scenario-specific buffers and restrictions.
6. Optimizes maintenance timing using CP-SAT.
7. Returns schedule blocks, conflicts, and operational metrics.
8. Presents the result through an interactive dashboard.

---

## ✨ Key Features

### 🧠 Optimization Engine
- Constraint-based maintenance scheduling
- OR-Tools CP-SAT optimization
- Deadline/lateness minimization
- Section-level no-overlap constraints
- Resource-level no-overlap constraints
- Protected/high-priority train protection

### 🔬 What-if Scenario Simulation
Evaluate operational changes such as:

- Normal / increased traffic
- Minor / major train delays
- Reduced resources
- Emergency maintenance
- Weather restrictions

### 📊 Operational Dashboard

The dashboard provides:

- Block hours
- Number of maintenance blocks
- Train conflicts
- Maintenance completion
- Asset availability
- Scenario impact
- AI recommendation

### 🔎 Scenario Impact

The system compares a simulated plan against the current plan and highlights changes in:

- Blocks
- Block hours
- Train conflicts
- Completion
- Asset availability

---

## 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │   RailOpt AI UI      │
                    │   Next.js / React    │
                    └──────────┬───────────┘
                               │
                               │ HTTP POST
                               ▼
                    ┌──────────────────────┐
                    │   FastAPI Backend    │
                    │ /optimization/run    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ OR-Tools CP-SAT       │
                    │ Optimization Engine   │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          Maintenance       Trains        Resources
           Requests        Operations      / Assets
```

---

## 🛠️ Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Modern component-based UI

### Backend

- Python
- FastAPI
- Uvicorn
- Google OR-Tools CP-SAT

### Data

The application currently works with JSON-based operational datasets, including:

- Maintenance requests
- Route sections
- Train operations
- Resources
- Scenarios

---

## 📁 Project Structure

```text
rail-opt-ai-ui-redesigned/
│
├── app/                       # Next.js application
├── components/                # Dashboard and UI components
├── data/                      # Application data/types
├── lib/                       # Shared frontend utilities
├── public/
│   └── data/                  # JSON operational datasets
│
├── backend/
│   ├── main.py                # FastAPI application
│   ├── optimizer.py           # CP-SAT optimization logic
│   └── ...                    # Backend models/services
│
├── package.json
├── pnpm-lock.yaml
├── requirements.txt
├── pyproject.toml
├── next.config.mjs
├── vercel.json
└── README.md
```

---

## ⚙️ Local Development

### 1. Install frontend dependencies

Using pnpm:

```bash
pnpm install
```

### 2. Install backend dependencies

Create/activate your Python environment and install:

```bash
pip install -r requirements.txt
```

Make sure Google OR-Tools is installed because the optimization engine depends on it.

### 3. Start the backend

From the project root:

```bash
python -m uvicorn backend.main:app --reload --port 8000
```

The API should be available at:

```text
http://localhost:8000
```

### 4. Start the frontend

In another terminal:

```bash
pnpm dev
```

The dashboard should be available at:

```text
http://localhost:3000
```

---

## 🔌 Optimization API

The frontend sends optimization requests to:

```text
POST /optimization/run
```

The request includes information such as:

```json
{
  "planning_date": "2026-01-01",
  "section_id": "SECTION-001",
  "maintenance_request_ids": [],
  "planning_window": "24 hours",
  "scenario_id": null,
  "scenario_parameters": {
    "traffic": "Normal",
    "train_delay": "None",
    "resources_reduced": false,
    "emergency_maintenance": false,
    "weather_restriction": false
  }
}
```

The backend returns:

- Optimization status
- Schedule blocks
- Conflicts
- Operational metrics
- Explanation

---

## 🔬 Example Scenarios

### Scenario 1 — Normal Operations

Expected behavior:

- Full maintenance feasibility
- No additional operational restrictions
- High asset availability

### Scenario 2 — Increased Traffic / Minor Delay

The optimizer accounts for additional operational buffers while protecting critical train windows.

### Scenario 3 — High Traffic / Major Delay / Reduced Resources / Emergency / Weather

This represents a stressed operational environment.

The dashboard can expose the resulting reduction in asset availability and recommend operational review before accepting the plan.

---

## 🧮 Optimization Logic

The CP-SAT model uses constraints including:

### Section constraints

Maintenance tasks assigned to the same section cannot overlap.

### Resource constraints

Maintenance tasks requiring the same resource/equipment cannot overlap.

### Train protection

Protected/high-priority train windows are protected from maintenance overlap.

### Deadline handling

The optimizer penalizes maintenance lateness heavily so that deadline violations are minimized.

### Scenario impact

Operational scenario parameters influence scheduling buffers and asset-availability calculations.

---

## 📊 Key Metrics

The dashboard tracks:

| Metric | Meaning |
|---|---|
| Block Hours | Total scheduled maintenance duration |
| Number of Blocks | Number of generated maintenance schedule blocks |
| Train Conflicts | Protected/high-priority train overlaps |
| Maintenance Completion | Percentage of selected requests scheduled |
| Asset Availability | Estimated available asset/resource capacity |
| Blocks Changed | Difference between current and simulated plan |
| Block Hours Change | Change in total scheduled hours |
| Completion Change | Change in maintenance completion |
| Asset Availability Change | Scenario effect on asset availability |

---

## 🏆 Hackathon Value

RailOpt AI is designed around a real operational decision-making problem rather than simply displaying data.

The core value is:

> **Turn complex railway maintenance constraints into an explainable, scenario-aware optimization decision.**

The platform demonstrates:

- Constraint optimization
- Operational simulation
- Decision support
- Scenario analysis
- Explainable recommendations
- Full-stack engineering

---

## 🚀 Deployment

The frontend can be deployed on Vercel.

Because the optimization engine is a Python/FastAPI service using OR-Tools, the backend should be deployed separately on a Python-compatible hosting platform.

Production architecture:

```text
User
 │
 ▼
Vercel
Next.js Frontend
 │
 │ HTTPS
 ▼
Python Backend
FastAPI + OR-Tools
 │
 ▼
Optimization Engine
```

Set the frontend API base URL using:

```text
NEXT_PUBLIC_API_BASE_URL
```

For production, this value should point to the deployed backend URL rather than `localhost`.

---

## 🔐 Environment & Security

Do not commit secrets, API keys, private credentials, or local environment files containing sensitive values.

Recommended practice:

```text
.env.local
```

should remain local and be excluded from Git when it contains secrets.

---

## 🧪 Pre-Demo Checklist

Before a hackathon demo:

- [ ] Frontend builds successfully
- [ ] Backend starts successfully
- [ ] OR-Tools is installed
- [ ] `/optimization/run` returns `200 OK`
- [ ] Normal scenario works
- [ ] Increased traffic scenario works
- [ ] Stress scenario works
- [ ] No `NaN` metrics appear
- [ ] No train conflicts appear unexpectedly
- [ ] Asset availability behaves consistently
- [ ] Production API URL is configured
- [ ] GitHub repository is up to date
- [ ] Vercel deployment is tested

---

## 🎥 Demo Story

A strong demo flow is:

```text
Current Plan
     ↓
Select Maintenance Requests
     ↓
Run Optimization
     ↓
Show New Plan
     ↓
Change Operational Scenario
     ↓
Run What-if Simulation
     ↓
Compare Impact
     ↓
Explain Recommendation
```

This makes the system's decision-making value visible to judges instead of only showing technical implementation.

---

## 👥 Team

**Project:** RailOpt AI

Built as a hackathon-focused intelligent railway operations optimization platform.

Add your final team member names, roles, institution, and hackathon details here before publishing the repository.

---

## 📄 License

Add the project's final license here before public release.

---

## ⭐ Why RailOpt AI?

Railway operations require decisions under constraints.

RailOpt AI demonstrates how optimization and scenario simulation can help operations teams answer:

> **“If the operating conditions change, what maintenance plan should we accept — and what will it cost us?”**

