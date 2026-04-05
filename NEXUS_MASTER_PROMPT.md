# NEXUS Smart City Emergency Management System — Master Rebuild Prompt

---

## PROJECT OVERVIEW

Rebuild the **NEXUS Smart City EMS** as a complete, fully functional, production-grade web application. This is not a prototype — every feature must work end-to-end. The system manages three emergency services (Ambulance, Police, Fire) for **Pune city**, with real-time data powered by **Supabase**, an interactive city map, and a clean multi-page React architecture.

---

## TECH STACK

- **Frontend**: React 19 + Vite + React Router v6 (multi-page)
- **Styling**: Tailwind CSS + custom CSS variables (glassmorphism system)
- **Animations**: GSAP (ScrollTrigger), Framer Motion
- **3D Background**: Three.js (particle system)
- **Real-time DB**: Supabase (PostgreSQL + real-time subscriptions)
- **HTTP Client**: Axios
- **Backend**: Express.js (Node) on port 3001 — algorithm computation API
- **Map**: Custom interactive SVG map (Pune locations, NOT Google Maps)

---

## ARCHITECTURE — MULTI-PAGE WITH REACT ROUTER

```
/ → LandingPage (Home)
/ambulance → AmbulancePage
/police → PolicePage
/fire → FirePage
/dashboard → CommandDashboard
/simulation → SimulationPage
```

Each route is a standalone full-screen page. Use `<BrowserRouter>` with `<Routes>` and `<Route>` in `App.jsx`. Navigation via React Router `<Link>` and `useNavigate`.

---

## GLOBAL DESIGN SYSTEM (MUST NOT CHANGE ACROSS PAGES)

### Glassmorphism System (universal)
All panels/cards across every page must use this exact glass style:
```css
background: rgba(10, 10, 30, 0.55);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
```

### Animation System (universal — same across all pages)
- GSAP entrance animations: fade + translate on scroll
- Framer Motion: spring transitions for panels appearing/disappearing (`type: 'spring', damping: 20`)
- Three.js particle background: fixed, always present on every page
- Animated counters (AnimatedCounter component) everywhere numbers appear
- Processing pipeline step indicators with spinners → checkmarks
- Vehicle icon hopping along map path (800ms per node)

### Font
```css
font-family: 'JetBrains Mono', monospace; /* all UI labels, data */
font-family: 'Space Grotesk', sans-serif; /* headings */
```

### Three.js Particle Background
- 600 particles, neon green/blue/purple colors
- Continuous movement with wrap-around bounds
- Dynamic connection lines between nearby particles (distance threshold 12)
- Mouse parallax on camera
- **CRITICAL FIX**: Reduce particle opacity to 0.35 (from 0.6) and add a dark overlay `rgba(5, 5, 20, 0.65)` between the canvas and page content so the glassmorphism panels are clearly readable. The particles must still animate — just dimmed behind content.

### Color Themes Per Page (only accent/neon color changes, everything else stays identical)

| Page | Primary Neon | Secondary | Glow |
|------|-------------|-----------|------|
| Landing | `#39ff8f` (green) | `#8b5cf6` | green |
| Ambulance | `#3d8fff` (blue) | `#39ff8f` | blue |
| Police | `#ff2d55` (red) | `#3d8fff` | red |
| Fire | `#ffb800` (amber) | `#ff2d55` | amber |
| Dashboard | `#39ff8f` (green) | all three | green |
| Simulation | `#39ff8f` (green) | all three | green |

CSS variable `--city-neon` changes per page. Everything referencing `--city-neon` automatically themes correctly.

---

## PAGE 1 — LANDING PAGE (`/`)

### Hero Section
- Large heading: "NEXUS" + "Smart City Emergency System"
- Typing text cycling: "Protecting Pune, 24/7", "AI-Powered Dispatch", "Real-time Resource Tracking"
- **Live city status badge**: pulls from Supabase `system_status` table — shows "ALL CLEAR" (green) or "ACTIVE EMERGENCY" (red pulsing) based on current open incidents
- Scroll indicator arrow

### Real-Time Stats Bar (from Supabase — NOT dummy data)
Four live metric cards pulling real counts:
1. **Active Incidents** — count of open incidents in `incidents` table
2. **Units Deployed** — count of units where `status = 'deployed'` in `units` table
3. **Avg Response Time** — computed average from `incidents` table `response_time_seconds` column
4. **Beds Available** — sum of `beds_available` across all hospitals in `hospitals` table

These update in real-time via Supabase subscriptions (`.on('postgres_changes', ...)`)

### Report Emergency Section
Below the hero, a prominent "REPORT EMERGENCY" panel with three large clickable cards:

```
[ 🚑 AMBULANCE ]   [ 🚓 POLICE ]   [ 🚒 FIRE ]
  Medical Crisis     Crime / Safety    Fire Hazard
  Click to report    Click to report   Click to report
```

Each card:
- Glassmorphism panel with the service's accent color
- Hover: scale up + neon glow border
- Click: `navigate('/ambulance')` etc. via React Router

### Recent Incidents Feed
Live list of last 8 dispatches from Supabase `incidents` table, ordered by `created_at DESC`:
- Each row: `[icon] [type] — [location_name] — [time ago] — [status badge]`
- Real-time updates: new row slides in from top when a new incident is created
- Status badges: "Dispatched" (blue), "En Route" (amber), "Resolved" (green)

---

## PAGE 2 — AMBULANCE PAGE (`/ambulance`)

### Theme: Blue (`#3d8fff`)

### Layout: Two columns (map left, controls right)

### Interactive Pune Map (LEFT — full height)
This is the most critical component. Build a custom interactive SVG map:

**Pune Locations to include (with approximate relative coordinates):**

Hospitals (multiple — each is a selectable destination node):
- Ruby Hall Clinic (Shivajinagar)
- KEM Hospital (Rasta Peth)
- Sahyadri Hospital (Kothrud)
- Deenanath Mangeshkar Hospital (Erandwane)
- Jupiter Hospital (Baner)

Landmark/Incident Nodes (selectable as incident origin):
- Kothrud Depot
- Bhumgaon
- Chandni Chowk
- Warje
- Paud Road
- Karve Nagar
- Bavdhan
- Shivajinagar
- Deccan Gymkhana
- Swargate
- Katraj
- Hadapsar

Road/Junction Nodes (intermediate, non-selectable):
- Paud Rd Junction
- Mumbai-Bangalore Highway
- Symbiosis Junction
- Karve Road
- University Road

**Map edges (roads connecting nodes):**
Define edges between logically connected nodes with:
- `distance_km` (numeric label shown on edge midpoint)
- Edges rendered as SVG lines, labeled with distance
- Active path edges: dashed animated neon stroke
- Inactive edges: dim gray, 0.4 opacity

**Map Interactivity:**
- Click any incident node → sets as "Incident Location" (pulses red, shows label)
- Click any hospital node → sets as "Destination" (pulses blue/green)
- If both selected, highlight the shortest path immediately (client-side Dijkstra preview)
- Show total distance on the path
- Vehicle icon animates along highlighted path after dispatch
- Zoom: scroll wheel scales the SVG viewBox
- Drag: pan the map

**Hospital Node Info Popup:**
Click a hospital → small glassmorphism tooltip appears:
```
🏥 Ruby Hall Clinic
Beds Available: [live from Supabase]
ICU Beds: [live]
Ambulances Stationed: [live]
Distance: X.X km
```
All values real-time from Supabase `hospitals` table.

### Control Panel (RIGHT)

**Emergency Input:**
- Location: auto-filled from map click (with override dropdown showing all nodes)
- Patient Severity: 1–10 slider with color gradient (green→yellow→red)
- Patient condition dropdown: Cardiac, Trauma, Stroke, Accident, Other
- Auto-compute: priority score shown live as severity changes

**Processing Pipeline (on dispatch):**
Three animated steps:
1. Priority Queue Analysis (1000ms)
2. Resource Allocation (1000ms)
3. Route Computation — Dijkstra (API call)

**Dispatch Result Panel:**
- Priority score (animated counter)
- ETA (from API)
- Total route distance in km
- Optimal route: node chips with arrows
- Resources allocated: beds, paramedics, ambulances (live from Supabase)
- Progress bars for bed availability per hospital

**Incident Logging:**
Every dispatch saves to Supabase `incidents` table:
```sql
{
  type: 'ambulance',
  location_name: string,
  severity: number,
  priority_score: number,
  route: jsonb,
  eta: string,
  distance_km: number,
  status: 'dispatched',
  created_at: timestamp
}
```

---

## PAGE 3 — POLICE PAGE (`/police`)

### Theme: Red (`#ff2d55`)

### Same layout as Ambulance (map left, controls right)

### Pune Map (same base map, different node types highlighted):
- Police Stations shown as blue building icons:
  - Kothrud Police Station
  - Deccan Police Station
  - Swargate Police Station
  - Shivajinagar Police Station
  - Warje-Malwadi Police Station
- Crime Zone nodes: same incident nodes as ambulance map
- Edges: same road network with distances

**Police Station Info Popup:**
```
🏛 Kothrud Police Station
Units Available: [live from Supabase]
Officers On Duty: [live]
Response Vehicles: [live]
Distance: X.X km
```

### Control Panel:
- Crime Type dropdown: Armed Robbery, Assault, Burglary, Traffic Accident, Suspicious Activity, Vandalism
- Location: map click or dropdown
- Severity: 1–10 slider
- Crowd Size: Small / Medium / Large (affects resource allocation)

**Processing Pipeline:**
1. Crime Analysis (800ms)
2. Priority Ranking (800ms)
3. Unit Deployment — Dijkstra routing (API call)

**Alert Flash Effect:** Full-screen brief red flash overlay on dispatch (existing — keep this)

**Dispatch Result:**
- Units deployed, officers, backup availability
- Route with distances
- Response time estimate
- Saves to Supabase `incidents` table

---

## PAGE 4 — FIRE PAGE (`/fire`)

### Theme: Amber (`#ffb800`)

### Same layout (map left, controls right)

### Pune Map with:
- Fire Stations:
  - Karve Nagar Fire Station
  - Kothrud Fire Station
  - Swargate Fire Station
  - Shivajinagar Fire Station
- Fire Risk Zones (same incident nodes)
- Edges: same road network

**Fire Station Info Popup:**
```
🚒 Karve Nagar Fire Station
Fire Trucks: [live from Supabase]
Firefighters On Duty: [live]
Water Tankers: [live]
Distance: X.X km
```

### Control Panel:
- Fire Intensity: 1–10 slider (bar graph visualization, color shifts orange→red)
- Fire Type: Structural, Vehicle, Forest, Industrial, Electrical
- Location: map click or dropdown
- Building Type: Residential, Commercial, Industrial, Open Area
- Estimated spread radius shown live: `intensity × 15m`

**Fire Rings Animation:** Expanding concentric rings during Spread Simulation step (existing — keep)

**Processing Pipeline:**
1. Fire Detection & Analysis (800ms)
2. Spread Simulation (1200ms) — rings animate during this
3. Resource Allocation — Knapsack (800ms)
4. Route Optimization — Dijkstra (API call)

**Dispatch Result:**
- Trucks, firefighters, water tanks
- Spread radius
- Route with distances
- Saves to Supabase `incidents`

---

## PAGE 5 — COMMAND DASHBOARD (`/dashboard`)

### Theme: Green (multi-service overview)

**Overview Stats Row (live from Supabase):**
- Total Active Incidents
- Ambulance Units Deployed
- Police Units Deployed
- Fire Units Deployed
- Average ETA across all active incidents
- Total Beds Available across all hospitals

**Three Service Status Panels (side by side):**
Each shows:
- Service name + icon
- Active incidents count
- Units available vs deployed (progress bar)
- Last incident: location + time ago
- Status: OPERATIONAL / DEGRADED / CRITICAL based on resource availability

**Live Incident Feed:**
Full-width real-time table of ALL incidents, all types:
- Columns: Type | Location | Severity | Status | ETA | Time
- Color-coded rows: blue (ambulance), red (police), amber (fire)
- New rows slide in from top via Framer Motion
- Click a row → expand to show full dispatch details

**Resource Heatmap (SVG):**
Same Pune map but showing resource density:
- Node color intensity = resource availability (green = full, yellow = low, red = depleted)
- Hover node → tooltip with resource counts
- This is read-only (no dispatch from dashboard)

**Algorithm Performance Stats:**
- Avg Dijkstra path cost
- Avg priority queue processing time
- Knapsack allocation efficiency %
- (These can be computed from stored incident data)

---

## PAGE 6 — SIMULATION PAGE (`/simulation`)

Keep existing SimulationSection logic but upgrade:

**Full Pipeline Visualization (horizontal scrolling cards, existing pattern):**
1. Priority Queue — sort incoming emergencies by severity (animated reorder)
2. Resource Sorting — sort by proximity + availability
3. Knapsack Allocation — progress bars showing optimal allocation
4. Dijkstra Routing — path computation with node relaxation animation

**NEW: Dijkstra Step-by-Step Visualization:**
- Show the Pune map on the left
- On the right: step-by-step table of node relaxations
- "Current node", "Neighbors checked", "Distance updated" — one row per step
- Animate: highlight the current node being processed on the map in real-time
- Speed control: Slow / Normal / Fast

**NEW: Knapsack Decision Table:**
Show WHY resources were allocated:
```
Resource      | Weight | Value | Selected?
Ambulance A   |   2    |   9   |    ✓
Ambulance B   |   2    |   7   |    ✓
Ambulance C   |   3    |   6   |    ✗  (capacity exceeded)
```

**Run All Three Simultaneously:**
Button "SIMULATE FULL CITY EMERGENCY" — triggers all three (ambulance + police + fire) at once, all pipelines run in parallel, map shows all three routes animated simultaneously.

**Save to Supabase:** Each simulation run saves aggregate results.

---

## SUPABASE SCHEMA (complete)

### Table: `hospitals`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name text NOT NULL
location_name text NOT NULL  -- e.g. 'Kothrud'
map_node_id text NOT NULL    -- matches SVG node id
beds_total integer
beds_available integer
icu_beds_total integer
icu_beds_available integer
ambulances_stationed integer
ambulances_available integer
lat numeric
lng numeric
created_at timestamptz DEFAULT now()
```

### Table: `police_stations`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name text NOT NULL
location_name text
map_node_id text
units_total integer
units_available integer
officers_total integer
officers_on_duty integer
response_vehicles integer
vehicles_available integer
```

### Table: `fire_stations`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name text NOT NULL
location_name text
map_node_id text
trucks_total integer
trucks_available integer
firefighters_total integer
firefighters_on_duty integer
water_tankers_total integer
water_tankers_available integer
```

### Table: `incidents`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
type text CHECK (type IN ('ambulance', 'police', 'fire'))
location_name text
map_node_id text
severity integer
priority_score integer
route jsonb             -- array of node ids
route_distance_km numeric
eta text
resources_allocated jsonb
algorithm_used text
status text DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'en_route', 'resolved'))
response_time_seconds integer
created_at timestamptz DEFAULT now()
resolved_at timestamptz
```

### Table: `units`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
service_type text CHECK (service_type IN ('ambulance', 'police', 'fire'))
unit_name text
status text DEFAULT 'available'
incident_id uuid REFERENCES incidents(id)
station_id uuid
```

### Table: `system_status`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
status text DEFAULT 'all_clear' CHECK (status IN ('all_clear', 'active_emergency', 'critical'))
active_incident_count integer DEFAULT 0
last_updated timestamptz DEFAULT now()
```

### Table: `map_nodes`
```sql
id text PRIMARY KEY   -- e.g. 'kothrud_depot'
label text
type text CHECK (type IN ('incident', 'hospital', 'police_station', 'fire_station', 'junction'))
x numeric             -- SVG coordinate
y numeric             -- SVG coordinate
service_id uuid       -- FK to hospitals/police_stations/fire_stations
```

### Table: `map_edges`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
from_node text REFERENCES map_nodes(id)
to_node text REFERENCES map_nodes(id)
distance_km numeric
road_name text
```

**Enable Realtime on:** `hospitals`, `police_stations`, `fire_stations`, `incidents`, `system_status`

---

## COMPLETE SEED DATA (Pune — realistic values)

### Hospitals (seed into `hospitals` table)

| name | location_name | map_node_id | beds_total | beds_available | icu_beds_total | icu_beds_available | ambulances_stationed | ambulances_available |
|------|--------------|-------------|------------|----------------|----------------|-------------------|---------------------|---------------------|
| Ruby Hall Clinic | Shivajinagar | ruby_hall | 650 | 142 | 40 | 8 | 6 | 4 |
| KEM Hospital | Rasta Peth | kem_hospital | 1200 | 310 | 80 | 18 | 8 | 5 |
| Sahyadri Hospital Kothrud | Kothrud | sahyadri_kothrud | 350 | 87 | 28 | 6 | 4 | 3 |
| Deenanath Mangeshkar Hospital | Erandwane | deenanath | 750 | 198 | 60 | 12 | 7 | 5 |
| Jupiter Hospital | Baner | jupiter_baner | 300 | 74 | 20 | 5 | 3 | 2 |
| Aditya Birla Memorial Hospital | Chinchwad | aditya_birla | 650 | 155 | 50 | 11 | 5 | 4 |
| Poona Hospital | Sadashiv Peth | poona_hospital | 400 | 93 | 30 | 7 | 4 | 3 |
| Jehangir Hospital | Sassoon Road | jehangir | 550 | 121 | 45 | 9 | 6 | 4 |
| Noble Hospital | Hadapsar | noble_hadapsar | 280 | 66 | 18 | 4 | 3 | 2 |
| Symbiosis Hospital | Lavale | symbiosis_hospital | 200 | 51 | 14 | 3 | 2 | 2 |

---

### Police Stations (seed into `police_stations` table)

| name | location_name | map_node_id | units_total | units_available | officers_total | officers_on_duty | response_vehicles | vehicles_available |
|------|--------------|-------------|-------------|----------------|----------------|-----------------|------------------|-------------------|
| Kothrud Police Station | Kothrud | kothrud_ps | 8 | 5 | 60 | 38 | 6 | 4 |
| Deccan Police Station | Deccan Gymkhana | deccan_ps | 10 | 7 | 75 | 52 | 8 | 6 |
| Swargate Police Station | Swargate | swargate_ps | 12 | 8 | 90 | 61 | 10 | 7 |
| Shivajinagar Police Station | Shivajinagar | shivajinagar_ps | 15 | 11 | 110 | 78 | 12 | 9 |
| Warje-Malwadi Police Station | Warje | warje_ps | 6 | 4 | 45 | 30 | 5 | 3 |
| Chandani Chowk Chowky | Chandni Chowk | chandni_ps | 4 | 3 | 28 | 19 | 3 | 2 |
| Bavdhan Police Chowky | Bavdhan | bavdhan_ps | 4 | 2 | 25 | 16 | 3 | 2 |
| Katraj Police Station | Katraj | katraj_ps | 7 | 5 | 52 | 35 | 6 | 4 |
| Hadapsar Police Station | Hadapsar | hadapsar_ps | 9 | 6 | 68 | 46 | 7 | 5 |
| Karve Nagar Chowky | Karve Nagar | karvenagar_ps | 5 | 3 | 35 | 23 | 4 | 3 |

---

### Fire Stations (seed into `fire_stations` table)

| name | location_name | map_node_id | trucks_total | trucks_available | firefighters_total | firefighters_on_duty | water_tankers_total | water_tankers_available |
|------|--------------|-------------|-------------|-----------------|-------------------|---------------------|--------------------|-----------------------|
| Karve Nagar Fire Station | Karve Nagar | karvenagar_fs | 5 | 3 | 40 | 26 | 4 | 3 |
| Kothrud Fire Station | Kothrud | kothrud_fs | 4 | 2 | 32 | 21 | 3 | 2 |
| Swargate Fire Station | Swargate | swargate_fs | 6 | 4 | 48 | 33 | 5 | 4 |
| Shivajinagar Fire Station | Shivajinagar | shivajinagar_fs | 8 | 6 | 64 | 44 | 6 | 5 |
| Hadapsar Fire Station | Hadapsar | hadapsar_fs | 4 | 3 | 30 | 20 | 3 | 2 |
| Baner Fire Station | Baner | baner_fs | 3 | 2 | 24 | 16 | 2 | 2 |
| Katraj Fire Station | Katraj | katraj_fs | 4 | 3 | 32 | 22 | 3 | 2 |

---

### Map Nodes (seed into `map_nodes` table — SVG coords for viewBox 0 0 900 600)

| id | label | type | x | y |
|----|-------|------|---|---|
| kothrud_depot | Kothrud Depot | incident | 280 | 300 |
| bhumgaon | Bhumgaon | incident | 160 | 340 |
| chandni_chowk | Chandni Chowk | incident | 320 | 260 |
| warje | Warje | incident | 230 | 380 |
| paud_road | Paud Road | incident | 200 | 280 |
| karve_nagar | Karve Nagar | incident | 310 | 350 |
| bavdhan | Bavdhan | incident | 140 | 270 |
| shivajinagar | Shivajinagar | incident | 490 | 220 |
| deccan | Deccan Gymkhana | incident | 450 | 280 |
| swargate | Swargate | incident | 500 | 360 |
| katraj | Katraj | incident | 480 | 450 |
| hadapsar | Hadapsar | incident | 640 | 380 |
| erandwane | Erandwane | incident | 400 | 270 |
| baner | Baner | incident | 380 | 150 |
| lavale | Lavale | incident | 240 | 160 |
| paud_rd_junction | Paud Rd Junction | junction | 260 | 240 |
| karve_road | Karve Road | junction | 380 | 310 |
| university_road | University Road | junction | 460 | 200 |
| symbiosis_jn | Symbiosis Junction | junction | 340 | 200 |
| mumbai_highway | Mumbai-Bangalore Hwy | junction | 180 | 200 |
| ruby_hall | Ruby Hall Clinic | hospital | 500 | 210 |
| kem_hospital | KEM Hospital | hospital | 540 | 310 |
| sahyadri_kothrud | Sahyadri Hospital | hospital | 300 | 320 |
| deenanath | Deenanath Mangeshkar | hospital | 420 | 260 |
| jupiter_baner | Jupiter Hospital | hospital | 400 | 140 |
| aditya_birla | Aditya Birla Hospital | hospital | 180 | 120 |
| poona_hospital | Poona Hospital | hospital | 470 | 300 |
| jehangir | Jehangir Hospital | hospital | 520 | 340 |
| noble_hadapsar | Noble Hospital | hospital | 650 | 370 |
| symbiosis_hospital | Symbiosis Hospital | hospital | 250 | 155 |
| kothrud_ps | Kothrud Police Station | police_station | 270 | 315 |
| deccan_ps | Deccan Police Station | police_station | 445 | 285 |
| swargate_ps | Swargate Police Station | police_station | 505 | 365 |
| shivajinagar_ps | Shivajinagar Police Stn | police_station | 495 | 215 |
| warje_ps | Warje-Malwadi Police Stn | police_station | 225 | 385 |
| chandni_ps | Chandani Chowk Chowky | police_station | 325 | 255 |
| bavdhan_ps | Bavdhan Police Chowky | police_station | 135 | 265 |
| katraj_ps | Katraj Police Station | police_station | 475 | 455 |
| hadapsar_ps | Hadapsar Police Station | police_station | 645 | 385 |
| karvenagar_ps | Karve Nagar Chowky | police_station | 315 | 355 |
| karvenagar_fs | Karve Nagar Fire Station | fire_station | 305 | 345 |
| kothrud_fs | Kothrud Fire Station | fire_station | 275 | 295 |
| swargate_fs | Swargate Fire Station | fire_station | 510 | 355 |
| shivajinagar_fs | Shivajinagar Fire Station | fire_station | 485 | 205 |
| hadapsar_fs | Hadapsar Fire Station | fire_station | 635 | 375 |
| baner_fs | Baner Fire Station | fire_station | 390 | 145 |
| katraj_fs | Katraj Fire Station | fire_station | 470 | 445 |

---

### Map Edges (seed into `map_edges` table)

| from_node | to_node | distance_km | road_name |
|-----------|---------|-------------|-----------|
| bhumgaon | bavdhan | 2.1 | Bhumgaon-Bavdhan Rd |
| bavdhan | mumbai_highway | 3.4 | Mumbai-Bangalore Hwy |
| bavdhan | paud_road | 4.2 | Paud Road |
| paud_road | paud_rd_junction | 1.8 | Paud Road |
| paud_rd_junction | chandni_chowk | 1.2 | Paud Road |
| paud_rd_junction | lavale | 3.5 | Lavale Road |
| chandni_chowk | kothrud_depot | 2.3 | Kothrud Main Road |
| chandni_chowk | symbiosis_jn | 2.8 | Chandni Chowk Road |
| kothrud_depot | karve_nagar | 1.4 | Karve Road |
| kothrud_depot | sahyadri_kothrud | 0.6 | Kothrud Road |
| karve_nagar | warje | 2.2 | Warje Road |
| karve_nagar | karve_road | 1.1 | Karve Road |
| karve_road | erandwane | 1.5 | Karve Road |
| karve_road | deccan | 2.0 | Karve Road |
| karve_road | swargate | 3.2 | Satara Road |
| erandwane | deenanath | 0.5 | Erandwane Road |
| erandwane | deccan | 1.3 | Law College Road |
| deccan | shivajinagar | 2.1 | Jangli Maharaj Road |
| deccan | university_road | 1.6 | University Road |
| shivajinagar | ruby_hall | 0.8 | Sassoon Road |
| shivajinagar | university_road | 1.2 | University Road |
| university_road | baner | 4.0 | Baner Road |
| baner | jupiter_baner | 0.4 | Baner Road |
| baner | lavale | 3.2 | Lavale-Baner Road |
| symbiosis_jn | baner | 3.8 | Symbiosis Road |
| symbiosis_jn | deenanath | 3.1 | Karve Road |
| swargate | kem_hospital | 2.4 | Nana Peth Road |
| swargate | katraj | 4.5 | Satara Road |
| swargate | jehangir | 2.1 | Sassoon Road |
| katraj | hadapsar | 7.2 | Katraj-Hadapsar Bypass |
| hadapsar | noble_hadapsar | 0.5 | Hadapsar Road |
| kem_hospital | jehangir | 1.8 | Sassoon Road |
| kem_hospital | poona_hospital | 2.0 | Sadashiv Peth Road |
| mumbai_highway | aditya_birla | 5.1 | Mumbai-Bangalore Hwy |
| lavale | symbiosis_hospital | 1.2 | Lavale Road |
| warje | swargate | 4.8 | Warje-Swargate Road |

---

## NAVIGATION COMPONENT (global)

Fixed right-side dot navigation (existing pattern) with:
- Dots for each section/page
- Shows current page name on hover
- On landing page: dots for hero, report section, recent incidents
- On emergency pages: dots for map, controls, results
- On dashboard: dots for stats, feed, heatmap
- Clicking dot navigates to that anchor (same page) or route (cross-page)

**Top navbar (new):** Fixed top bar with:
- NEXUS logo (left)
- Links: Home | Dashboard | Simulation (center)
- City status indicator (right) — live from Supabase

---

## BACKEND API (Express — `server/index.js`)

Keep all existing endpoints. Add:

### `POST /api/dijkstra`
```json
Input: { "from": "kothrud_depot", "to": "ruby_hall", "graph": {...} }
Output: { "path": [...], "total_distance": 4.2, "steps": [...] }
```
Actual Dijkstra implementation in Node.js — not mock. Returns step-by-step relaxation for simulation page.

### `POST /api/knapsack`
```json
Input: { "resources": [...], "capacity": 10 }
Output: { "selected": [...], "total_value": 24, "decision_table": [...] }
```
Actual 0/1 knapsack DP implementation. Returns decision table for simulation page.

### `GET /api/city-stats`
Aggregates from Supabase:
```json
{ "active_incidents": 3, "beds_available": 142, "units_deployed": 7, "avg_response_time": "4.2 min" }
```

---

## COMPONENT LIBRARY (reusable across all pages)

- `GlassPanel` — universal glassmorphism card (variant prop: default/blue/red/amber)
- `NeonButton` — CTA button (variant matches page theme)
- `NodeMap` — interactive SVG map (receives nodes/edges from Supabase, handles click events)
- `AnimatedCounter` — number count-up animation
- `ProgressBar` — resource utilization bar (variant prop)
- `ProcessingPipeline` — animated step tracker
- `DispatchResult` — result card shown after API response
- `IncidentFeed` — real-time incident list (Supabase subscription)
- `ResourceTooltip` — popup on map node hover/click showing live counts
- `StatusBadge` — "Dispatched" / "En Route" / "Resolved" colored pill
- `Navigation` — right-side dot nav (existing, adapted per page)
- `TopNav` — fixed top bar with links + city status
- `ParticleBackground` — Three.js canvas (fixed, z-index 0, dimmed)
- `DarkOverlay` — semi-transparent layer between particles and content

---

## CRITICAL FIXES (must resolve before new features)

1. **Particle opacity**: Reduce to 0.35 + add `rgba(5, 5, 20, 0.65)` dark overlay div between canvas and content. Content must be clearly readable at all times.

2. **Map not loading**: NodeMap SVG viewBox must be set correctly with valid coordinates. All nodes must have x/y values within the viewBox bounds. Edges must reference valid node IDs. Test with hardcoded data first, then switch to Supabase.

3. **Glass panel contrast**: Increase text contrast — all body text must be `rgba(255,255,255,0.9)` minimum. Labels must be `rgba(255,255,255,0.6)` minimum. Never use `rgba(255,255,255,0.3)` for readable text.

4. **Layout overflow**: Each section must not overflow its container. Map and control panel must fit within viewport height on large screens. Use `overflow: hidden` on section, `overflow-y: auto` on control panel.

---

## MAP IMPLEMENTATION DETAIL

The map is a custom SVG — NOT Google Maps or Leaflet. Here is the coordinate system:

ViewBox: `0 0 900 600` (wide landscape for Pune west area)

All node positions are Pune-relative, scaled to fit the viewBox. Kothrud/Bhumgaon area is the focal center (~x:300-600, y:200-400).

Each node renders as:
```svg
<g class="node" data-id="kothrud_depot" onclick="selectNode('kothrud_depot')">
  <circle cx={x} cy={y} r={type === 'hospital' ? 14 : 8} />
  <text x={x} y={y+24}>{label}</text>
  <!-- distance labels on edges midpoint -->
</g>
```

Edge distance label appears at midpoint of edge line:
```svg
<text x={(x1+x2)/2} y={(y1+y2)/2 - 6} class="edge-label">{distance_km}km</text>
```

Selected node (incident origin): red pulsing ring animation
Selected node (destination): neon pulsing ring animation
Active path edge: dashed animated stroke in page accent color
Inactive edge: `stroke: rgba(255,255,255,0.15)`

---

## REAL-TIME SUPABASE INTEGRATION PATTERN

```js
// In each page component:
useEffect(() => {
  // Initial fetch
  const fetchData = async () => {
    const { data } = await supabase.from('hospitals').select('*');
    setHospitals(data);
  };
  fetchData();

  // Real-time subscription
  const channel = supabase
    .channel('hospitals_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'hospitals' },
      (payload) => {
        // Update local state with changed row
        setHospitals(prev => prev.map(h => 
          h.id === payload.new.id ? payload.new : h
        ));
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

Apply same pattern for: `police_stations`, `fire_stations`, `incidents`, `system_status`.

---

## SUPABASE CLIENT SETUP

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
export default supabase;
```

`.env` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## FILE STRUCTURE

```
smart-city-ems/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── .env
├── server/
│   ├── index.js          (Express API — Dijkstra + Knapsack implemented)
│   └── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx           (BrowserRouter + Routes)
│   ├── index.css         (global styles, CSS variables, glassmorphism classes)
│   ├── lib/
│   │   └── supabase.js
│   ├── hooks/
│   │   ├── useRealtime.js      (generic Supabase realtime hook)
│   │   └── useCityStats.js     (aggregated stats hook)
│   ├── components/
│   │   ├── ParticleBackground.jsx
│   │   ├── DarkOverlay.jsx
│   │   ├── Navigation.jsx
│   │   ├── TopNav.jsx
│   │   ├── GlassPanel.jsx
│   │   ├── NeonButton.jsx
│   │   ├── NodeMap.jsx         (interactive SVG map)
│   │   ├── AnimatedCounter.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── ProcessingPipeline.jsx
│   │   ├── DispatchResult.jsx
│   │   ├── IncidentFeed.jsx
│   │   ├── ResourceTooltip.jsx
│   │   ├── StatusBadge.jsx
│   │   └── ScrollIndicator.jsx
│   ├── data/
│   │   ├── puneNodes.js        (map node definitions with x/y coords)
│   │   ├── puneEdges.js        (edge definitions with distance_km)
│   │   └── seedData.js         (Supabase seed script)
│   └── pages/
│       ├── LandingPage.jsx
│       ├── AmbulancePage.jsx
│       ├── PolicePage.jsx
│       ├── FirePage.jsx
│       ├── DashboardPage.jsx
│       └── SimulationPage.jsx
```

---

## QUALITY REQUIREMENTS

- No dummy/hardcoded data on the landing page stats — all from Supabase
- All dispatch actions must save to Supabase `incidents` table
- Map must show real Pune west-area locations (Kothrud, Bhumgaon, Chandni Chowk, Warje, Paud Road, etc.)
- Distance labels visible on all map edges
- Hospital tooltips show live bed counts
- Police/fire station tooltips show live unit counts
- Particle background visible but never obscuring content
- All pages: same glassmorphism, same animation system, only accent color changes
- Mobile responsive: map stacks above controls on small screens
- Each emergency dispatch saves to DB and appears in dashboard + landing page incident feed instantly
- Supabase realtime subscriptions active on every page that shows live data

---

## DEFINITION OF DONE

A feature is complete only when:
1. The UI renders without errors
2. Supabase data loads on mount
3. Real-time updates reflect in under 2 seconds
4. The dispatch flow works end-to-end (input → API → save to DB → result shown → appears in feed)
5. The interactive map accepts clicks and animates paths
6. All three emergency pages follow identical layout/animation patterns
7. The dashboard shows live data from all three services simultaneously
