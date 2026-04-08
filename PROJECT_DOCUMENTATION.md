# NEXUS Smart City Emergency Management System — Project Documentation

## How to Run

```bash
# Terminal 1 — Backend (C++ Dispatch Server)
cd server
node cppServer.js
# Server starts on http://localhost:3001

# Terminal 2 — Frontend (Vite + React)
npm run dev
# Dev server starts on http://localhost:5173
```

> **Note:** The backend must be running before the frontend can dispatch emergencies.
> Hospital data auto-seeds on first startup if `server/db/hospitals.txt` is empty.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  LandingPage │ AmbulancePage │ PolicePage │ FirePage │ ...  │
│                        ↓ HTTP API calls                     │
├────────────────────────────────────────────────────────────┤
│                 BACKEND (Express.js — cppServer.js)         │
│        Thin orchestration layer — NO algorithmic logic       │
│                        ↓ child_process.spawnSync             │
├────────────────────────────────────────────────────────────┤
│               C++ BINARIES (9 algorithms)                   │
│  dijkstra │ knapsack │ sorting │ priority │ ward_knapsack   │
│  crime_priority_queue │ bed_manager │ hospital_selector │    │
│  fire_resource_calc                                         │
├────────────────────────────────────────────────────────────┤
│              DATABASE (JSONL text files)                     │
│  server/db/hospitals.txt │ patients.txt │ incidents.txt │... │
└────────────────────────────────────────────────────────────┘
```

---

## File Map — Every File Explained

### Frontend: `src/`

| File | Purpose |
|------|---------|
| `main.jsx` | App entry point. Mounts React into DOM with ErrorBoundary + BrowserRouter. |
| `App.jsx` | Root layout: particle background, TopNav, Navigation, route definitions, footer. |
| `index.css` | Global CSS: design tokens, glass-panel styles, neon effects, animations. |

### Pages: `src/pages/`

| File | Purpose |
|------|---------|
| `LandingPage.jsx` | Home page. Hero title, live stats, emergency cards, incident feed. |
| `AmbulancePage.jsx` | 4-step ambulance dispatch: location → processing → result → patient admit. |
| `PolicePage.jsx` | 5-step police dispatch: crime report → heap viz → Dijkstra → casualties → board. |
| `FirePage.jsx` | Fire dispatch with spread simulation, auto station selection, resource allocation. |
| `DashboardPage.jsx` | Overview dashboard: 12-stat grid, service panels, incident feed, resource heatmap. |
| `HospitalPage.jsx` | Hospital management: bed tracking, patient list, healing tick, ICU rebalance. |
| `SimulationPage.jsx` | (Legacy) Graph/algorithm simulation playground. |

### Components: `src/components/`

| File | Purpose |
|------|---------|
| `AnimatedCounter.jsx` | Smooth counting number animation. Re-animates on value change (real-time). |
| `IncidentFeed.jsx` | Scrollable incident list with click-to-expand detail cards. |
| `NodeMap.jsx` | SVG city map renderer: nodes, edges, animated vehicle paths, service tooltips. |
| `GlassPanel.jsx` | Reusable glass-morphism container panel with accent variants. |
| `NeonButton.jsx` | Glowing neon-styled button with loading spinner. |
| `StatusBadge.jsx` | Small colored badge for dispatch status (dispatched, resolved, etc.). |
| `ProgressBar.jsx` | Horizontal progress bar with label and variant colors. |
| `ProcessingPipeline.jsx` | Step-by-step algorithm processing animation. |
| `DispatchResult.jsx` | Formatted dispatch result display (route, ETA, resources, algorithm stack). |
| `ParticleBackground.jsx` | Three.js floating particles background (z-0 layer). |
| `TopNav.jsx` | Top navigation bar with route links and NEXUS branding. |
| `Navigation.jsx` | Right-side dot navigation for scrolling between sections. |
| `ScrollIndicator.jsx` | Animated scroll-down indicator on landing page. |
| `TypingText.jsx` | Typewriter effect text rotation for hero subtitle. |
| `ErrorBoundary.jsx` | React error boundary to catch crashes without blank screen. |
| `DarkOverlay.jsx` | Subtle dark gradient overlay for background depth. |
| `AlgorithmStack.jsx` | Displays algorithm badge chips. |
| `ResourceTooltip.jsx` | Tooltip popup for service nodes on the map. |

### Hooks: `src/hooks/`

| File | Purpose |
|------|---------|
| `usePolling.js` | Generic data polling hook. Fetches from `/api/db/<table>` every N ms. |
| `useCityStats.js` | Aggregated real-time city stats from all 7 tables. Polls every 3 seconds. |

### Lib: `src/lib/`

| File | Purpose |
|------|---------|
| `cppDispatchApi.js` | Frontend API client. Named fetch wrappers for all backend dispatch endpoints. |
| `resourceCalculators.js` | JS fallback for fire/police resource computation. |

### Data: `src/data/`

| File | Purpose |
|------|---------|
| `puneNodes.js` | 61 city map nodes (15 incident locations, 10 hospitals, 10 police, 7 fire, 5 junctions). |
| `puneEdges.js` | 62 road edges with distances (km). Also contains client-side Dijkstra function. |

---

### Backend: `server/`

| File | Purpose |
|------|---------|
| `cppServer.js` | Express HTTP server. Routes API calls, invokes C++ binaries, manages JSONL DB. |
| `db.js` | JSONL database engine: readTable, writeTable, insertRow, updateRow, deleteRow. |

### Database: `server/db/`

| File | Contents |
|------|----------|
| `hospitals.txt` | 10 Pune hospitals with bed counts, ICU, ambulances. |
| `incidents.txt` | All dispatch incidents (ambulance, fire, police). |
| `patients.txt` | Patient records (injury, severity, ward, healing status). |
| `wards.txt` | Ward knapsack snapshot results. |
| `police_stations.txt` | 10 police stations with unit counts. |
| `patrol_units.txt` | Individual patrol unit assignments. |
| `crime_queue.txt` | Crime priority queue entries. |
| `crime_incidents.txt` | Resolved crime history. |
| `fire_stations.txt` | 7 fire stations with truck/firefighter counts. |

---

### C++ Algorithms: `cpp/native/`

| File | Algorithm | Time Complexity | Used By |
|------|-----------|----------------|---------|
| `dijkstra.cpp` | Dijkstra's Shortest Path | O(E log V) | All 3 dispatch endpoints |
| `knapsack.cpp` | 0/1 Knapsack DP | O(n × capacity) | Ambulance + Fire dispatch |
| `sorting.cpp` | Merge Sort | O(n log n) | Ambulance + Fire dispatch |
| `priority.cpp` | Priority Scoring | O(1) | All dispatch endpoints |
| `ward_knapsack.cpp` | Ward Allocation (0/1 Knapsack) | O(n × capacity) | Hospital ICU rebalance |
| `crime_priority_queue.cpp` | Max-Heap Priority Queue | O(n log n) | Police dispatch |
| `bed_manager.cpp` | Bed Counting | O(1) | Ward knapsack, healing tick |
| `hospital_selector.cpp` | Hospital Scoring/Selection | O(n) | Ambulance + Police dispatch |
| `fire_resource_calc.cpp` | Fire Resource Calculator | O(1) | Fire dispatch |

### Compiled Binaries: `server/bin/`

All C++ files compile to `native_<name>.exe` in this directory (e.g., `native_dijkstra.exe`).

---

## Event-to-Code Mapping

### "User dispatches an ambulance"

1. **Frontend:** `AmbulancePage.jsx` → calls `requestAmbulanceDispatch()` from `cppDispatchApi.js`
2. **Backend:** `cppServer.js` → `POST /api/ambulance-dispatch` handler
3. **C++ calls (in order):**
   - `priority.cpp` → compute priority score
   - `dijkstra.cpp` → shortest paths from incident to all hospitals
   - `knapsack.cpp` → select best hospitals under distance budget
   - `sorting.cpp` → sort candidates by distance
   - `hospital_selector.cpp` → pick the single best hospital
4. **DB writes:** Inserts incident into `incidents.txt`, decrements ambulance in `hospitals.txt`
5. **Frontend response:** Shows route on map, ETA, hospital name, algorithm stack

### "User admits a patient (from ambulance result)"

1. **Frontend:** `AmbulancePage.jsx` → POST to `/api/db/patients`, then POST to `/api/ward-knapsack`
2. **Backend:** `cppServer.js` → creates patient record, then runs ward knapsack
3. **C++ calls:**
   - `ward_knapsack.cpp` → decide ICU vs General for all patients
   - `bed_manager.cpp` → count patients, compute beds_available (1 patient = 1 bed)
4. **DB writes:** Patient row in `patients.txt`, updated beds in `hospitals.txt`

### "User reports a crime"

1. **Frontend:** `PolicePage.jsx` → calls `requestPoliceDispatch()` from `cppDispatchApi.js`
2. **Backend:** `cppServer.js` → `POST /api/police-dispatch` handler
3. **C++ calls (in order):**
   - `crime_priority_queue.cpp` → insert into max-heap, get sorted queue + bubble-up steps
   - `dijkstra.cpp` → shortest paths from crime to all police stations
   - `sorting.cpp` → sort stations by distance
   - (If casualties) `dijkstra.cpp` + `knapsack.cpp` + `hospital_selector.cpp` for ambulance
4. **DB writes:** Crime in `crime_queue.txt`, incident in `incidents.txt`, units in `patrol_units.txt`

### "User dispatches fire resources"

1. **Frontend:** `FirePage.jsx` → calls `requestFireDispatch()` from `cppDispatchApi.js`
2. **Backend:** `cppServer.js` → `POST /api/fire-dispatch` handler
3. **C++ calls:**
   - `priority.cpp` → compute fire priority
   - `dijkstra.cpp` → shortest paths from fire to all fire stations
   - `fire_resource_calc.cpp` → recommended trucks/firefighters/tankers
   - `knapsack.cpp` → select best stations under resource budget
   - `sorting.cpp` → sort by distance
4. **DB writes:** Incident in `incidents.txt`

### "Healing tick (hospital page)"

1. **Frontend:** `HospitalPage.jsx` → POST to `/api/healing-tick`
2. **Backend:** `cppServer.js` → increments days_admitted, discharges healed patients
3. **C++ calls:** `bed_manager.cpp` → recalculate beds after discharge

---

## What's in cppServer.js?

`cppServer.js` is the **Express.js HTTP server** that acts as a thin orchestration layer:

1. **API routing** — Defines all REST endpoints (ambulance, fire, police, hospital, DB CRUD)
2. **C++ binary invocation** — Uses `child_process.spawnSync()` to call compiled C++ binaries, passing data via stdin (tab-separated) and reading JSON from stdout
3. **Database I/O** — Reads/writes JSONL files via `db.js` helper functions
4. **Hospital seeding** — Auto-seeds 10 Pune hospitals on first startup
5. **Error handling** — Logs errors, returns meaningful HTTP status codes

**It does NOT contain any algorithmic logic.** All computations (Dijkstra, Knapsack, Priority Queue, etc.) run in the C++ binaries.

---

## Database Schema

### hospitals.txt
```json
{ "id": "...", "name": "Ruby Hall Clinic", "location": "Shivajinagar",
  "map_node_id": "ruby_hall", "beds_total": 18, "beds_available": 18,
  "icu_beds_total": 8, "icu_beds_available": 8,
  "ambulances_stationed": 3, "ambulances_available": 3 }
```

### patients.txt
```json
{ "id": "...", "hospital_id": "ruby_hall", "name": "Patient Name",
  "injury_type": "trauma", "severity": 7, "resource_weight": 3,
  "ward": "icu", "status": "admitted", "days_admitted": 2,
  "healing_duration": 5, "admitted_at": "2026-04-08T..." }
```

### incidents.txt
```json
{ "id": "...", "type": "ambulance", "location_name": "Baner",
  "map_node_id": "baner", "severity": 7, "priority_score": 9,
  "route": ["baner", "jupiter_baner"], "route_distance_km": 0.4,
  "eta": "2 min", "hospital_name": "Jupiter Hospital",
  "algorithm_used": "C++ Dijkstra + Knapsack", "status": "dispatched" }
```

---

## Bed Allocation Model

**1 patient = exactly 1 bed consumed.**

- General ward patient: uses 1 from `beds_available`
- ICU patient: uses 1 from `icu_beds_available` AND 1 from `beds_available`
- On discharge: beds are freed in reverse

Current bed ranges: **10-20 general, 5-10 ICU** (reduced for easy testing).
