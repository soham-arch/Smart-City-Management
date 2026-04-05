# NEXUS Smart City Emergency Management System — Master Rebuild Prompt V2

---

## PROJECT OVERVIEW

Rebuild the **NEXUS Smart City EMS** as a complete, fully functional, production-grade web application. This is not a prototype — every feature must work end-to-end. The system manages three emergency services (Ambulance, Police, Fire) for **Pune city**, with real-time data powered by **Supabase**, an interactive city map, and a clean multi-page React architecture. Performance must be smooth and lag-free on all pages.

---

## TECH STACK

- **Frontend**: React 19 + Vite + React Router v6 (multi-page)
- **Styling**: Tailwind CSS + custom CSS variables (glassmorphism system)
- **Animations**: GSAP (ScrollTrigger), Framer Motion
- **3D Background**: Three.js (particle system)
- **Real-time DB**: Supabase (PostgreSQL + real-time subscriptions)
- **HTTP Client**: Axios
- **Backend**: Express.js (Node) on port 3001 — algorithm computation API
- **Map**: Custom interactive SVG map (Pune locations, NOT Google Maps or Leaflet)

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

## GLOBAL DESIGN SYSTEM — DARK THEME (MUST NOT CHANGE ACROSS PAGES)

### Base Background
```css
body, #root {
  background: #050510;
  min-height: 100vh;
}
```
Every page must render on a **pure near-black background**. There must be no grey, white, or washed-out backgrounds anywhere — not on any page, not on any card, not at any breakpoint.

### Z-Index Layer Stack (strict — must be followed on every page)
```
z-index: 0   → Three.js particle canvas (fixed, full screen)
z-index: 1   → DarkOverlay div (fixed, full screen)
z-index: 2+  → All page content, panels, nav, modals
```

### DarkOverlay Component (mandatory on EVERY page)
```jsx
// src/components/DarkOverlay.jsx
export default function DarkOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5, 5, 20, 0.72)',
      zIndex: 1,
      pointerEvents: 'none'
    }} />
  );
}
```
This must be rendered immediately after `<ParticleBackground />` and before ALL page content on every single page. Without this, the particle background washes out the entire UI.

### Glassmorphism System (universal — all panels/cards on all pages)
```css
background: rgba(10, 10, 30, 0.65);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
```

### Text Contrast Rules (non-negotiable)
```css
/* Primary text — headings, values, counts */
color: rgba(255, 255, 255, 1.0);

/* Body text — descriptions, paragraphs */
color: rgba(255, 255, 255, 0.9);   /* MINIMUM — never below this */

/* Secondary / label text */
color: rgba(255, 255, 255, 0.6);   /* MINIMUM — never below this */

/* Disabled / placeholder text */
color: rgba(255, 255, 255, 0.35);  /* only for truly inactive elements */
```
Never use `rgba(255,255,255,0.3)` or lower for any readable content.

### Animation System (universal — same across all pages)
- GSAP entrance animations: fade + translate on scroll
- Framer Motion: spring transitions for panels appearing/disappearing (`type: 'spring', damping: 20`)
- Three.js particle background: fixed, always present on every page — keep the movement, dimmed behind content
- Animated counters (`AnimatedCounter` component) everywhere numbers appear
- Processing pipeline step indicators with spinners → checkmarks
- Vehicle icon hopping along map path (800ms per node)
- All animations must be performant — use `will-change: transform` on animated elements, `requestAnimationFrame` for counters, and avoid layout thrash

### Font
```css
font-family: 'JetBrains Mono', monospace;  /* all UI labels, data, mono text */
font-family: 'Space Grotesk', sans-serif;  /* headings */
```

### Three.js Particle Background — CRITICAL IMPLEMENTATION
```jsx
// src/components/ParticleBackground.jsx
// KEEP the animated movement — only fix visibility
const canvas = canvasRef.current;
// Particle count: 600
// Colors: neon green (#39ff8f), blue (#3d8fff), purple (#8b5cf6)
// Continuous movement with wrap-around bounds
// Dynamic connection lines between nearby particles (distance threshold 12)
// Mouse parallax on camera
// Tab visibility check — pause animation when tab is hidden (battery saving)
// 60fps cap using lastTimestamp delta check (ts - lastT < 16)

// CRITICAL: Canvas opacity MUST be 0.35 — not 0.6, not 0.5, not 0.55
canvas.style.opacity = '0.35';
canvas.style.position = 'fixed';
canvas.style.zIndex = '0';
canvas.style.pointerEvents = 'none';
```
The particle movement is a feature — keep it. Only the opacity and the missing dark overlay are problems.

### Color Themes Per Page (only accent neon color changes — everything else identical)

| Page | Primary Neon (`--city-neon`) | Secondary | Glow |
|------|-------------|-----------|------|
| Landing | `#39ff8f` (green) | `#8b5cf6` | green |
| Ambulance | `#3d8fff` (blue) | `#39ff8f` | blue |
| Police | `#ff2d55` (red) | `#3d8fff` | red |
| Fire | `#ffb800` (amber) | `#ff2d55` | amber |
| Dashboard | `#39ff8f` (green) | all three | green |
| Simulation | `#39ff8f` (green) | all three | green |

CSS variable `--city-neon` changes per page via a `style` prop on the page root div. Everything referencing `var(--city-neon)` automatically themes correctly.

---

## CRITICAL FIXES — RESOLVE FIRST BEFORE ANY NEW FEATURES

### Fix 1 — Blank Screen / White Background
**Root cause:** Missing `.env` variables or auth loading state not handled.
```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
export default supabase;
```
`.env` file (must exist at project root):
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
If using auth, always handle the loading state:
```jsx
const [loading, setLoading] = useState(true);
useEffect(() => {
  supabase.auth.getSession().then(() => setLoading(false));
}, []);
if (loading) return <div style={{background:'#050510',height:'100vh'}} />;
```

### Fix 2 — Particle Canvas Making Background White
Add `DarkOverlay` on every page (z-index 1) and set canvas opacity to 0.35. See Global Design System section above. This is the #1 cause of the washed-out white/grey appearance in the screenshots.

### Fix 3 — Dashboard Real-Time Values Stuck at 0
```js
// src/pages/DashboardPage.jsx
const fetchAllStats = async () => {
  const { count: incidentCount } = await supabase
    .from('incidents').select('*', { count: 'exact', head: true })
    .in('status', ['dispatched', 'en_route']);

  const { count: ambCount } = await supabase
    .from('units').select('*', { count: 'exact', head: true })
    .eq('service_type', 'ambulance').eq('status', 'deployed');

  const { count: polCount } = await supabase
    .from('units').select('*', { count: 'exact', head: true })
    .eq('service_type', 'police').eq('status', 'deployed');

  const { count: fireCount } = await supabase
    .from('units').select('*', { count: 'exact', head: true })
    .eq('service_type', 'fire').eq('status', 'deployed');

  const { data: hospitals } = await supabase
    .from('hospitals').select('beds_available');
  const totalBeds = hospitals?.reduce((s, h) => s + (h.beds_available || 0), 0) ?? 0;

  const { data: resolved } = await supabase
    .from('incidents').select('response_time_seconds')
    .not('response_time_seconds', 'is', null);
  const avgEta = resolved?.length
    ? Math.round(resolved.reduce((s, r) => s + r.response_time_seconds, 0) / resolved.length / 60)
    : 0;

  setStats({ incidents: incidentCount ?? 0, ambUnits: ambCount ?? 0,
    polUnits: polCount ?? 0, fireUnits: fireCount ?? 0, beds: totalBeds, avgEta });
};

useEffect(() => {
  fetchAllStats();
  const channels = ['incidents','units','hospitals'].map(table =>
    supabase.channel(`dashboard_${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchAllStats())
      .subscribe()
  );
  return () => channels.forEach(c => supabase.removeChannel(c));
}, []);
```
Also verify in Supabase Dashboard that RLS policies allow SELECT for all tables, or disable RLS on `incidents`, `units`, `hospitals` for public read.

### Fix 4 — Map Node Overlapping (ALL pages)
The SVG viewBox and node coordinate system must be completely rebuilt. See the **MAP IMPLEMENTATION DETAIL** section below for the corrected coordinate system with proper spacing. The root cause is nodes placed too close together in the seed data and insufficient SVG canvas size.

### Fix 5 — Layout Overflow
```css
/* Each page root */
.page-root { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
/* Map container */
.map-container { height: calc(100vh - 60px); overflow: hidden; }
/* Control panel */
.control-panel { height: calc(100vh - 60px); overflow-y: auto; }
```

---

## MAP IMPLEMENTATION DETAIL — COMPLETE REWRITE

### CRITICAL: All maps across all pages use the same base coordinate system
The existing map has severe node overlap. The following is the corrected implementation.

### SVG ViewBox
```
viewBox="0 0 1100 750"
```
Wider canvas to give all nodes breathing room.

### Node Rendering Rules (prevents overlap)
```jsx
// Each node group structure — strict layering
<g key={node.id} className="map-node" onClick={() => handleNodeClick(node)}>
  {/* 1. Edge connection lines — rendered FIRST (bottom layer) */}
  
  {/* 2. Node circle */}
  <circle
    cx={node.x} cy={node.y}
    r={node.type === 'hospital' ? 16 : node.type === 'junction' ? 5 : 10}
    fill={getNodeFill(node)}
    stroke={getNodeStroke(node)}
    strokeWidth={2}
  />
  
  {/* 3. Service icon (emoji/SVG icon) — centered on node */}
  <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="10">{getIcon(node.type)}</text>
  
  {/* 4. Label — positioned BELOW node with enough offset to not overlap */}
  <text
    x={node.x} y={node.y + (node.type === 'hospital' ? 34 : 26)}
    textAnchor="middle"
    fontSize="9"
    fill="rgba(255,255,255,0.85)"
    style={{ pointerEvents: 'none', userSelect: 'none' }}
  >{node.label}</text>
</g>

{/* 5. Edge distance labels — rendered in a SEPARATE pass AFTER all nodes */}
{edges.map(edge => (
  <text
    key={`label-${edge.id}`}
    x={(getNode(edge.from).x + getNode(edge.to).x) / 2}
    y={(getNode(edge.from).y + getNode(edge.to).y) / 2 - 8}
    textAnchor="middle" fontSize="8"
    fill="rgba(255,255,255,0.45)"
    style={{ pointerEvents: 'none' }}
  >{edge.distance_km}km</text>
))}
```

**RENDER ORDER (critical for no overlap):**
1. Grid background (optional, very dim)
2. All edge lines
3. All edge distance labels
4. All node circles
5. All node icons
6. All node labels
7. Active path highlight (on top of everything)
8. Selected node pulse rings
9. Vehicle animation icon (topmost)

### Corrected Node Coordinates (viewBox 0 0 1100 750) — proper spacing
Minimum 80px between any two adjacent node centers for readability.

| id | label | type | x | y |
|----|-------|------|---|---|
| bhumgaon | Bhumgaon | incident | 80 | 420 |
| bavdhan | Bavdhan | incident | 110 | 280 |
| lavale | Lavale | incident | 200 | 170 |
| paud_road | Paud Road | incident | 160 | 360 |
| mumbai_highway | Mumbai-Hwy Jn | junction | 140 | 210 |
| paud_rd_junction | Paud Rd Jn | junction | 240 | 310 |
| symbiosis_jn | Symbiosis Jn | junction | 310 | 220 |
| chandni_chowk | Chandni Chowk | incident | 300 | 310 |
| kothrud_depot | Kothrud Depot | incident | 340 | 390 |
| karve_nagar | Karve Nagar | incident | 380 | 460 |
| warje | Warje | incident | 260 | 510 |
| karve_road | Karve Road Jn | junction | 460 | 400 |
| erandwane | Erandwane | incident | 480 | 310 |
| deccan | Deccan Gymkhana | incident | 530 | 360 |
| university_road | University Rd Jn | junction | 560 | 240 |
| shivajinagar | Shivajinagar | incident | 600 | 270 |
| baner | Baner | incident | 500 | 160 |
| swargate | Swargate | incident | 590 | 460 |
| katraj | Katraj | incident | 580 | 570 |
| hadapsar | Hadapsar | incident | 780 | 460 |
| aditya_birla | Aditya Birla Hospital | hospital | 160 | 120 |
| symbiosis_hospital | Symbiosis Hospital | hospital | 290 | 165 |
| jupiter_baner | Jupiter Hospital | hospital | 520 | 110 |
| ruby_hall | Ruby Hall Clinic | hospital | 650 | 240 |
| deenanath | Deenanath Mangeshkar | hospital | 510 | 270 |
| sahyadri_kothrud | Sahyadri Hospital | hospital | 370 | 350 |
| poona_hospital | Poona Hospital | hospital | 560 | 380 |
| kem_hospital | KEM Hospital | hospital | 650 | 390 |
| jehangir | Jehangir Hospital | hospital | 660 | 440 |
| noble_hadapsar | Noble Hospital | hospital | 800 | 430 |
| kothrud_ps | Kothrud Police Stn | police_station | 355 | 405 |
| deccan_ps | Deccan Police Stn | police_station | 540 | 370 |
| swargate_ps | Swargate Police Stn | police_station | 600 | 470 |
| shivajinagar_ps | Shivajinagar Police | police_station | 610 | 260 |
| warje_ps | Warje-Malwadi Police | police_station | 250 | 525 |
| chandni_ps | Chandni Chowk Chowky | police_station | 310 | 295 |
| bavdhan_ps | Bavdhan Police | police_station | 100 | 290 |
| katraj_ps | Katraj Police Stn | police_station | 590 | 580 |
| hadapsar_ps | Hadapsar Police Stn | police_station | 790 | 470 |
| karvenagar_ps | Karve Nagar Chowky | police_station | 390 | 475 |
| karvenagar_fs | Karve Nagar Fire Stn | fire_station | 400 | 450 |
| kothrud_fs | Kothrud Fire Stn | fire_station | 330 | 375 |
| swargate_fs | Swargate Fire Stn | fire_station | 615 | 455 |
| shivajinagar_fs | Shivajinagar Fire Stn | fire_station | 625 | 255 |
| hadapsar_fs | Hadapsar Fire Stn | fire_station | 810 | 450 |
| baner_fs | Baner Fire Stn | fire_station | 510 | 145 |
| katraj_fs | Katraj Fire Stn | fire_station | 565 | 560 |

### Node Offset Rules (prevent service icons stacking)
When multiple service nodes exist near the same incident node (e.g. police station + fire station in Kothrud), offset them:
- Incident node: exact coordinate
- Hospital: +0px x, +0px y (they are distinct locations, not co-located)
- Police station near incident: shift +15px x, +15px y from the incident node
- Fire station near incident: shift -15px x, +15px y from the incident node
- Labels: always below node, with 26px offset for small nodes, 34px for hospitals

### Map Per Page — Which Node Types to Show
Each page shows only relevant node types to reduce clutter:

| Page | Shows |
|------|-------|
| Ambulance | incident nodes + hospital nodes + junctions |
| Police | incident nodes + police station nodes + junctions |
| Fire | incident nodes + fire station nodes + junctions |
| Dashboard (heatmap) | all node types, read-only |
| Simulation | all node types |

### Map Interactivity (Ambulance, Police, Fire pages)
- Scroll wheel: zoom (scale SVG viewBox, min 0.5x, max 3x)
- Click + drag: pan the map
- Click incident node: highlight in accent color with pulsing ring
- Click service node (hospital/police stn/fire stn): show ResourceTooltip with live Supabase data
- After dispatch: vehicle icon animates along path nodes at 800ms per node

### Active Path Rendering
```jsx
// Active path: dashed animated neon stroke
<line
  x1={fromNode.x} y1={fromNode.y}
  x2={toNode.x} y2={toNode.y}
  stroke={`var(--city-neon)`}
  strokeWidth={3}
  strokeDasharray="8 4"
  style={{ animation: 'dash 0.8s linear infinite' }}
/>
// @keyframes dash { to { stroke-dashoffset: -12; } }

// Inactive edges
stroke="rgba(255,255,255,0.12)"
strokeWidth={1}
```

---

## ALGORITHM LOGIC — AUTOMATIC DISPATCH (NO MANUAL STATION SELECTION)

### IMPORTANT CHANGE: All three emergency pages remove manual station/hospital selection dropdowns

The dispatch flow is **fully automatic**:
1. User selects incident location on map (or from dropdown)
2. User sets severity/type/condition
3. User clicks DISPATCH
4. System runs the algorithm pipeline automatically
5. Result is shown — user never manually picks a destination

### Ambulance Dispatch Algorithm

```
Step 1 — Dijkstra: Run from incident location to ALL hospitals simultaneously
         → Get shortest path + distance to each hospital

Step 2 — Knapsack Resource Scoring: For each hospital, compute a score:
         Input items = hospitals, each with:
           weight = distance_km (rounded to integer)
           value  = (beds_available × 2) + (icu_beds_available × 5) + (ambulances_available × 3)
         Capacity = 20 (normalized distance budget)
         Run 0/1 knapsack → select optimal hospital that maximizes value within distance budget

Step 3 — Auto-assign: the hospital selected by knapsack becomes the destination
         Show: hospital name, distance, beds available, ETA, full route path
```

```js
// src/algorithms/ambulanceDispatch.js
export function selectOptimalHospital(incidentNode, hospitals, dijkstraResults) {
  // dijkstraResults: { hospitalId: { distance, path } }
  const items = hospitals.map(h => ({
    id: h.id,
    name: h.name,
    weight: Math.ceil(dijkstraResults[h.map_node_id]?.distance ?? 999),
    value: (h.beds_available * 2) + (h.icu_beds_available * 5) + (h.ambulances_available * 3),
    path: dijkstraResults[h.map_node_id]?.path ?? [],
    distance: dijkstraResults[h.map_node_id]?.distance ?? 999
  })).filter(item => item.distance < 999);

  const capacity = 20;
  const n = items.length;
  // Build DP table
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i-1][w];
      if (items[i-1].weight <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i-1][w - items[i-1].weight] + items[i-1].value);
      }
    }
  }
  // Traceback to find selected hospital
  let w = capacity;
  let selected = null;
  for (let i = n; i >= 1; i--) {
    if (dp[i][w] !== dp[i-1][w]) {
      selected = items[i-1];
      w -= items[i-1].weight;
      break; // take only the best single hospital
    }
  }
  return selected ?? items.sort((a, b) => b.value - a.value)[0];
}
```

### Police Dispatch Algorithm

```
Step 1 — Dijkstra: Run from crime location to ALL police stations
         → Get shortest path + distance to each station

Step 2 — Auto-select nearest station WITH available units:
         Filter: stations where units_available > 0
         Pick: station with minimum Dijkstra distance among filtered stations
         (Police does NOT use knapsack — speed is priority, nearest available wins)

Step 3 — Resource allocation based on severity + crowd size:
         severity 1-3: 1 vehicle, 2 officers
         severity 4-6: 2 vehicles, 4 officers
         severity 7-10: 3+ vehicles, 6+ officers, backup flag

Step 4 — Show: station name, distance, units deployed, ETA, route
```

### Fire Dispatch Algorithm

```
Step 1 — Dijkstra: Run from fire location to ALL fire stations
         → Get shortest path + distance to each station

Step 2 — Knapsack Resource Scoring: For each fire station, compute score:
         Input items = fire stations, each with:
           weight = distance_km (rounded to integer)
           value  = (trucks_available × 4) + (firefighters_on_duty × 1) + (water_tankers_available × 3)
         Capacity = (fire_intensity × 2) + 10  ← intensity affects how far we'll reach
         Run 0/1 knapsack → select optimal station

Step 3 — Resources needed (based on intensity + building type):
         intensity 1-3:  1 truck, 5 firefighters, 1 tanker
         intensity 4-6:  2 trucks, 10 firefighters, 2 tankers
         intensity 7-9:  3 trucks, 15 firefighters, 3 tankers
         intensity 10:   ALL available trucks, max firefighters, all tankers

Step 4 — Show: station name, trucks deployed, firefighters, spread radius, ETA, route
```

---

## PAGE 1 — LANDING PAGE (`/`)

### Hero Section
- Large heading: "NEXUS" + "Smart City Emergency System"
- Typing text cycling: "Protecting Pune, 24/7", "AI-Powered Dispatch", "Real-time Resource Tracking"
- **Live city status badge**: pulls from Supabase `system_status` table — shows "ALL CLEAR" (green) or "ACTIVE EMERGENCY" (red pulsing)
- Scroll indicator arrow
- Background: `#050510` + `DarkOverlay` + particles at 0.35 opacity
- All text white on dark — heading pure white, subtitle `rgba(255,255,255,0.85)`

### Real-Time Stats Bar (from Supabase — NOT dummy data, NOT 0s)
Four live metric cards:
1. **Active Incidents** — count of open incidents (`status IN ('dispatched','en_route')`)
2. **Units Deployed** — count of units where `status = 'deployed'`
3. **Avg Response Time** — avg `response_time_seconds` / 60 from resolved incidents
4. **Beds Available** — sum of `beds_available` across all hospitals

Real-time via Supabase subscriptions on `incidents`, `units`, `hospitals`.

### Report Emergency Section
Three large glassmorphism cards:
```
[ 🚑 AMBULANCE ]   [ 🚓 POLICE ]   [ 🚒 FIRE ]
```
Hover: scale 1.04 + neon glow border. Click: navigate to respective page.

### Recent Incidents Feed
Live last 8 incidents from Supabase, real-time slide-in animation.

---

## PAGE 2 — AMBULANCE PAGE (`/ambulance`)

### Theme: `--city-neon: #3d8fff` (blue)

### Layout: Two columns — map left (55%), controls right (45%)

### Map (LEFT)
- Shows: incident nodes + hospital nodes + road junctions
- Click incident node → selected as emergency location (red pulse ring)
- Click hospital → show ResourceTooltip (live beds/ICU/ambulances from Supabase) — for info only, NOT for manual selection
- After dispatch: ambulance icon animates along computed path

### Control Panel (RIGHT)
- **Incident Location**: auto-filled from map click; dropdown fallback showing all incident nodes
- **Patient Severity**: 1–10 slider, color gradient green→yellow→red
- **Patient Condition**: Cardiac, Trauma, Stroke, Accident, Other
- **Live Priority Score**: computed live from `severity × condition_weight`
- **NO "Destination Hospital" field** — this is removed entirely; hospital is auto-selected by algorithm
- **DISPATCH AMBULANCE** button

### Processing Pipeline (after dispatch click)
```
Step 1: Priority Queue Analysis      [spinner → ✓]  ~800ms
Step 2: Knapsack Resource Allocation [spinner → ✓]  ~800ms
Step 3: Dijkstra Route Computation   [spinner → ✓]  ~API call
```

### Dispatch Result Panel
- Auto-selected hospital name + reason (e.g. "Best resource score: 47 — 12 beds, 3 ICU available")
- Total route distance
- ETA
- Route path chips: `Kothrud Depot → Karve Road → Erandwane → Deenanath ✓`
- Resources: beds, ICU, ambulances allocated (decrement from Supabase after dispatch)
- Save to Supabase `incidents` table

---

## PAGE 3 — POLICE PAGE (`/police`)

### Theme: `--city-neon: #ff2d55` (red)

### Layout: Same two-column layout as Ambulance

### Map (LEFT)
- Shows: incident nodes + police station nodes + road junctions
- Click incident → selected as crime location (red pulse ring)
- Click police station → ResourceTooltip (units, officers, vehicles from Supabase) — info only
- After dispatch: police vehicle icon animates along route
- **NO manual station selection** — removed entirely

### Control Panel (RIGHT)
- **Crime Type**: Armed Robbery, Assault, Burglary, Traffic Accident, Suspicious Activity, Vandalism
- **Crime Location**: map click or dropdown
- **Severity**: 1–10 slider
- **Crowd Size**: Small / Medium / Large (buttons, affects resource count)
- **NO "Deploy From Station" field** — removed entirely; station is auto-selected by Dijkstra
- **DISPATCH POLICE** button

### Processing Pipeline
```
Step 1: Crime Analysis               [spinner → ✓]  ~800ms
Step 2: Priority Ranking             [spinner → ✓]  ~800ms
Step 3: Dijkstra Unit Deployment     [spinner → ✓]  ~API call
```

### Dispatch Result
- Auto-selected police station name + distance
- Units deployed, officers, vehicles
- Route path chips
- Alert flash: brief full-screen red flash overlay on dispatch (keep existing)
- Save to Supabase `incidents`

---

## PAGE 4 — FIRE PAGE (`/fire`)

### Theme: `--city-neon: #ffb800` (amber)

### Layout: Same two-column layout

### Map (LEFT)
- Shows: incident nodes + fire station nodes + road junctions
- Click incident → selected as fire location (amber pulse ring)
- Click fire station → ResourceTooltip (trucks, firefighters, tankers from Supabase) — info only
- After dispatch: fire truck icon animates along route
- **NO "Deploy From Station" field** — removed entirely; station auto-selected by Dijkstra + Knapsack

### Control Panel (RIGHT)
- **Fire Intensity**: 1–10 slider (bar visualization, color shifts orange→red as value increases)
- **Est. Spread**: `intensity × 15m` shown live below slider
- **Fire Type**: Structural, Vehicle, Forest, Industrial, Electrical
- **Fire Location**: map click or dropdown
- **Building Type**: Residential, Commercial, Industrial, Open Area
- **NO "Deploy From Station" field** — removed entirely
- **DEPLOY FIRE UNITS** button

### Processing Pipeline
```
Step 1: Fire Detection & Analysis    [spinner → ✓]  ~800ms
Step 2: Spread Simulation            [spinner → ✓]  ~1200ms (fire rings animate here)
Step 3: Knapsack Resource Allocation [spinner → ✓]  ~800ms
Step 4: Dijkstra Route Optimization  [spinner → ✓]  ~API call
```

### Dispatch Result
- Auto-selected fire station name + reason (e.g. "Optimal resource score: trucks×4 + tankers×3")
- Trucks, firefighters, tankers deployed
- Spread radius
- Route path chips
- Save to Supabase `incidents`

---

## PAGE 5 — COMMAND DASHBOARD (`/dashboard`)

### Theme: `--city-neon: #39ff8f` (green, multi-service)

### Background: `#050510` + `DarkOverlay` + particles

### Overview Stats Row — ALL LIVE FROM SUPABASE (no zeros, no dummy data)
6 stat cards using the `fetchAllStats` + subscription pattern from Critical Fix 3:
- Total Active Incidents
- Ambulance Units Deployed
- Police Units Deployed
- Fire Units Deployed
- Average ETA
- Total Beds Available

### Three Service Status Panels
Each glassmorphism card shows:
- Service icon + name
- Active incident count (live)
- Units available vs deployed (ProgressBar)
- Last incident: location + time ago
- Status badge: OPERATIONAL / DEGRADED / CRITICAL

### Live Incident Feed
Full-width table, all incident types, color-coded rows:
- Blue row: ambulance, Red row: police, Amber row: fire
- New rows slide in from top (Framer Motion)
- Click row → expand with full dispatch details

### Resource Heatmap
Same SVG Pune map (corrected coordinates), read-only:
- Node color = resource availability: green (>70%), yellow (30-70%), red (<30%)
- Hover → ResourceTooltip

### Supabase Subscription Pattern for Dashboard
```js
useEffect(() => {
  fetchAllStats();
  const tables = ['incidents', 'units', 'hospitals', 'police_stations', 'fire_stations'];
  const channels = tables.map(table =>
    supabase.channel(`dash_${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchAllStats())
      .subscribe()
  );
  return () => channels.forEach(c => supabase.removeChannel(c));
}, []);
```

---

## PAGE 6 — SIMULATION PAGE (`/simulation`)

### Theme: `--city-neon: #39ff8f` (green)

### Layout: Two columns — map left (50%), controls/visualization right (50%)

### Background: `#050510` + `DarkOverlay` + particles
The right half of the simulation page must NOT be an empty washed-out space. The DarkOverlay and dark background must cover the full viewport.

### Map (LEFT — full height, corrected coordinates)
- Shows ALL node types (hospitals, police stations, fire stations, incident nodes)
- Color coding: hospital = blue circle, police = red circle, fire = amber circle, incident = white dot
- During simulation: animated vehicle icons on computed paths, color-coded per service
- Speed control applies to animation speed (not to algorithm computation)

### Speed Control Buttons (TOP RIGHT of map or above map)
Three styled glassmorphism toggle buttons — properly styled, NOT plain HTML:
```jsx
<div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
  {['Slow','Normal','Fast'].map(s => (
    <button key={s}
      onClick={() => setSpeed(s)}
      style={{
        padding: '6px 16px',
        background: speed === s ? 'var(--city-neon)' : 'rgba(255,255,255,0.05)',
        color: speed === s ? '#050510' : 'rgba(255,255,255,0.7)',
        border: `1px solid ${speed === s ? 'var(--city-neon)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '8px',
        fontFamily: 'JetBrains Mono',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >{s}</button>
  ))}
</div>
```

### Action Buttons
Both buttons: glassmorphism style, neon border, loading state on click:
- **▶ RUN SIMULATION** — runs single emergency simulation (ambulance only, user-configurable)
- **⚡ SIMULATE FULL CITY EMERGENCY** — runs all three services simultaneously

### Right Panel — Pipeline Visualization
Full height scrollable panel showing:

**1. Priority Queue Visualization**
Animated list of incoming emergencies sorted by severity — reorder animation using Framer Motion layoutId

**2. Dijkstra Step-by-Step**
- Current node highlighted on map in real-time
- Step table on right:
  ```
  Step | Node Visited     | Distance | Via
  1    | kothrud_depot    | 0        | start
  2    | karve_nagar      | 1.4      | kothrud_depot
  3    | sahyadri_kothrud | 0.6      | kothrud_depot
  ...
  ```
- One row appears per step, synchronized with map highlight
- Speed control: Slow=800ms/step, Normal=400ms/step, Fast=100ms/step

**3. Knapsack Decision Table**
```
Resource           | Weight | Value | Selected
Sahyadri Hospital  |   1    |  42   |    ✓
Ruby Hall Clinic   |   8    |  78   |    ✓
KEM Hospital       |  12    |  95   |    ✗ (over budget)
Jupiter Hospital   |   6    |  31   |    ✗
```
Table rows animate in one by one. Selected rows highlight in green, rejected in dim red.

**4. Full City Emergency Mode**
All three pipelines run in parallel, displayed in three side-by-side mini-columns:
- Left mini-col: Ambulance (blue theme)
- Center mini-col: Police (red theme)
- Right mini-col: Fire (amber theme)
Each shows its own step-by-step progress. Map shows all three animated routes simultaneously, color-coded.

---

## PERFORMANCE REQUIREMENTS — LAG-FREE EXPERIENCE

These are mandatory for a smooth user experience:

### Three.js Particle Optimizations
```js
// Tab visibility check — MUST implement
let tabActive = true;
document.addEventListener('visibilitychange', () => { tabActive = !document.hidden; });

// 60fps cap — MUST implement
let lastT = 0;
function animate(ts) {
  requestAnimationFrame(animate);
  if (!tabActive || ts - lastT < 16) return;
  lastT = ts;
  // ... render
}

// Pixel ratio cap
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

// Mobile: reduce particles
const N = window.innerWidth <= 768 ? 250 : 600;

// Use low-power preference
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, powerPreference: 'low-power' });
```

### React Performance
- Memoize all map components: `React.memo(NodeMap)`, `useMemo` for node/edge arrays
- `useCallback` on all event handlers passed to NodeMap
- Supabase subscriptions: single channel per page, not one per table where possible
- AnimatedCounter: use `requestAnimationFrame`, not `setInterval`
- SVG map: use `transform` for pan/zoom, never re-render all nodes on every mouse move
- Framer Motion: use `layoutId` for list reorders, `AnimatePresence` for enter/exit

### Supabase
- Always cleanup subscriptions in useEffect return function
- Batch initial fetches with `Promise.all` — don't fetch sequentially
- Use `.select('column1, column2')` — never `select('*')` unless all columns needed

---

## NAVIGATION COMPONENT (global)

### Top Navbar (fixed, every page)
```
[● NEXUS]    [HOME]  [DASHBOARD]  [SIMULATION]    [● ALL CLEAR]
```
- NEXUS logo left — `Space Grotesk`, neon green dot pulse
- Center links — `JetBrains Mono`, active link has neon background pill
- Right: city status badge from Supabase `system_status` — green "● ALL CLEAR" or red pulsing "● ACTIVE EMERGENCY"
- Background: `rgba(5, 5, 20, 0.85)` + `backdrop-filter: blur(12px)`
- z-index: 900

### Right-Side Dot Navigation (every page)
- Dots for each section/anchor on current page
- Active dot: larger, neon color, label on hover
- z-index: 800

---

## BACKEND API (Express — `server/index.js`)

### `POST /api/dijkstra`
```json
Input:  { "from": "kothrud_depot", "graph": { "node_id": { "neighbor_id": distance_km } } }
Output: { "distances": { "hospital_id": 4.2 }, "paths": { "hospital_id": ["node1","node2"] }, "steps": [...] }
```
Full Dijkstra implementation — returns ALL distances from source to all nodes in one call. Steps array for simulation visualization.

### `POST /api/knapsack`
```json
Input:  { "items": [{ "id": "ruby_hall", "weight": 8, "value": 78 }], "capacity": 20 }
Output: { "selected": ["ruby_hall"], "total_value": 78, "decision_table": [...] }
```
Full 0/1 knapsack DP — returns decision table for simulation page display.

### `GET /api/city-stats`
Aggregates from Supabase — returns live counts for all services.

---

## COMPONENT LIBRARY

- `GlassPanel` — glassmorphism card (variant: default/blue/red/amber)
- `NeonButton` — styled button with loading state (variant matches page `--city-neon`)
- `NodeMap` — interactive SVG map (memoized, accepts nodes/edges/onNodeClick/activePath)
- `AnimatedCounter` — rAF-based count-up animation
- `ProgressBar` — resource utilization bar
- `ProcessingPipeline` — animated step tracker (spinner → checkmark per step)
- `DispatchResult` — result card after API response
- `IncidentFeed` — real-time incident list with Framer Motion slide-in
- `ResourceTooltip` — glassmorphism popup on node click with live Supabase data
- `StatusBadge` — "Dispatched" (blue) / "En Route" (amber) / "Resolved" (green) pill
- `Navigation` — right-side dot nav
- `TopNav` — fixed top bar with links + city status
- `ParticleBackground` — Three.js canvas (opacity 0.35, z-index 0, fixed)
- `DarkOverlay` — `rgba(5,5,20,0.72)` fixed layer, z-index 1, every page
- `SpeedControl` — Slow/Normal/Fast toggle (simulation page)
- `DijkstraTable` — step-by-step relaxation table (simulation page)
- `KnapsackTable` — decision table display (simulation page)

---

## SUPABASE SCHEMA (complete)

### Table: `hospitals`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name text NOT NULL
location_name text NOT NULL
map_node_id text NOT NULL
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
route jsonb
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
id text PRIMARY KEY
label text
type text CHECK (type IN ('incident', 'hospital', 'police_station', 'fire_station', 'junction'))
x numeric
y numeric
service_id uuid
```

### Table: `map_edges`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
from_node text REFERENCES map_nodes(id)
to_node text REFERENCES map_nodes(id)
distance_km numeric
road_name text
```

**Enable Realtime on:** `hospitals`, `police_stations`, `fire_stations`, `incidents`, `system_status`, `units`

**RLS Policies:** Add `FOR SELECT USING (true)` on all tables for public read, or disable RLS on these tables.

---

## SEED DATA

### Hospitals
| name | map_node_id | beds_total | beds_available | icu_total | icu_available | amb_stationed | amb_available |
|------|-------------|------------|----------------|-----------|---------------|---------------|---------------|
| Ruby Hall Clinic | ruby_hall | 650 | 142 | 40 | 8 | 6 | 4 |
| KEM Hospital | kem_hospital | 1200 | 310 | 80 | 18 | 8 | 5 |
| Sahyadri Hospital | sahyadri_kothrud | 350 | 87 | 28 | 6 | 4 | 3 |
| Deenanath Mangeshkar | deenanath | 750 | 198 | 60 | 12 | 7 | 5 |
| Jupiter Hospital | jupiter_baner | 300 | 74 | 20 | 5 | 3 | 2 |
| Aditya Birla Hospital | aditya_birla | 650 | 155 | 50 | 11 | 5 | 4 |
| Poona Hospital | poona_hospital | 400 | 93 | 30 | 7 | 4 | 3 |
| Jehangir Hospital | jehangir | 550 | 121 | 45 | 9 | 6 | 4 |
| Noble Hospital | noble_hadapsar | 280 | 66 | 18 | 4 | 3 | 2 |
| Symbiosis Hospital | symbiosis_hospital | 200 | 51 | 14 | 3 | 2 | 2 |

### Police Stations
| name | map_node_id | units_total | units_available | officers_total | officers_on_duty | vehicles | vehicles_available |
|------|-------------|-------------|----------------|----------------|-----------------|----------|-------------------|
| Kothrud Police Station | kothrud_ps | 8 | 5 | 60 | 38 | 6 | 4 |
| Deccan Police Station | deccan_ps | 10 | 7 | 75 | 52 | 8 | 6 |
| Swargate Police Station | swargate_ps | 12 | 8 | 90 | 61 | 10 | 7 |
| Shivajinagar Police Station | shivajinagar_ps | 15 | 11 | 110 | 78 | 12 | 9 |
| Warje-Malwadi Police Station | warje_ps | 6 | 4 | 45 | 30 | 5 | 3 |
| Chandni Chowk Chowky | chandni_ps | 4 | 3 | 28 | 19 | 3 | 2 |
| Bavdhan Police Chowky | bavdhan_ps | 4 | 2 | 25 | 16 | 3 | 2 |
| Katraj Police Station | katraj_ps | 7 | 5 | 52 | 35 | 6 | 4 |
| Hadapsar Police Station | hadapsar_ps | 9 | 6 | 68 | 46 | 7 | 5 |
| Karve Nagar Chowky | karvenagar_ps | 5 | 3 | 35 | 23 | 4 | 3 |

### Fire Stations
| name | map_node_id | trucks_total | trucks_available | fighters_total | fighters_on_duty | tankers_total | tankers_available |
|------|-------------|-------------|-----------------|----------------|-----------------|---------------|------------------|
| Karve Nagar Fire Station | karvenagar_fs | 5 | 3 | 40 | 26 | 4 | 3 |
| Kothrud Fire Station | kothrud_fs | 4 | 2 | 32 | 21 | 3 | 2 |
| Swargate Fire Station | swargate_fs | 6 | 4 | 48 | 33 | 5 | 4 |
| Shivajinagar Fire Station | shivajinagar_fs | 8 | 6 | 64 | 44 | 6 | 5 |
| Hadapsar Fire Station | hadapsar_fs | 4 | 3 | 30 | 20 | 3 | 2 |
| Baner Fire Station | baner_fs | 3 | 2 | 24 | 16 | 2 | 2 |
| Katraj Fire Station | katraj_fs | 4 | 3 | 32 | 22 | 3 | 2 |

### Map Edges
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

## FILE STRUCTURE

```
smart-city-ems/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── .env                          ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── server/
│   ├── index.js                  (Express — Dijkstra + Knapsack, real implementations)
│   └── package.json
└── src/
    ├── main.jsx
    ├── App.jsx                   (BrowserRouter + Routes)
    ├── index.css                 (CSS variables, glassmorphism classes, dark theme)
    ├── lib/
    │   └── supabase.js
    ├── algorithms/
    │   ├── dijkstra.js           (client-side Dijkstra for live path preview)
    │   ├── ambulanceDispatch.js  (Dijkstra → Knapsack hospital selection)
    │   ├── policeDispatch.js     (Dijkstra → nearest available station)
    │   └── fireDispatch.js       (Dijkstra → Knapsack fire station + resources)
    ├── hooks/
    │   ├── useRealtime.js        (generic Supabase realtime hook)
    │   └── useCityStats.js       (aggregated stats with subscriptions)
    ├── components/
    │   ├── ParticleBackground.jsx  (opacity 0.35, z-index 0, 60fps cap, tab-pause)
    │   ├── DarkOverlay.jsx         (rgba(5,5,20,0.72), z-index 1, every page)
    │   ├── Navigation.jsx
    │   ├── TopNav.jsx
    │   ├── GlassPanel.jsx
    │   ├── NeonButton.jsx          (with loading state)
    │   ├── NodeMap.jsx             (memoized SVG map, corrected coords)
    │   ├── AnimatedCounter.jsx     (rAF-based)
    │   ├── ProgressBar.jsx
    │   ├── ProcessingPipeline.jsx
    │   ├── DispatchResult.jsx
    │   ├── IncidentFeed.jsx
    │   ├── ResourceTooltip.jsx
    │   ├── StatusBadge.jsx
    │   ├── SpeedControl.jsx
    │   ├── DijkstraTable.jsx
    │   └── KnapsackTable.jsx
    ├── data/
    │   ├── puneNodes.js            (corrected x/y coords, viewBox 0 0 1100 750)
    │   ├── puneEdges.js
    │   └── seedData.js
    └── pages/
        ├── LandingPage.jsx
        ├── AmbulancePage.jsx       (no manual hospital select)
        ├── PolicePage.jsx          (no manual station select)
        ├── FirePage.jsx            (no manual station select)
        ├── DashboardPage.jsx       (live stats with subscriptions)
        └── SimulationPage.jsx      (full-screen, both halves filled)
```

---

## QUALITY REQUIREMENTS

- Pure `#050510` background everywhere — no grey, no white, no washed-out panels
- `DarkOverlay` on every page — zero exceptions
- Particle background: movement kept, opacity 0.35 — never obscures content
- All text meets minimum contrast ratios (body ≥ 0.9, labels ≥ 0.6)
- No manual hospital/station selection on any dispatch page — all fully automatic
- Dijkstra + Knapsack run on every dispatch — not mocked, real algorithms
- Dashboard stats load from Supabase on mount AND update via real-time subscriptions
- Map nodes never overlap — minimum 80px separation, corrected viewBox 1100×750
- Render order: edges → edge labels → nodes → node labels → active path → vehicle icon
- Each page only renders relevant node types (ambulance=hospitals, police=police stations, fire=fire stations)
- Simulation right panel is never empty — fully filled with pipeline visualization
- Speed control buttons properly styled as glassmorphism toggles
- All animations smooth and lag-free: rAF, tab-pause, 60fps cap, memoized components
- Mobile responsive: map stacks above controls, min touch target 44px
- RLS policies allow public SELECT on all data tables

---

## DEFINITION OF DONE

A feature is complete only when:
1. UI renders without errors on `#050510` dark background
2. `DarkOverlay` visible — particles dim behind all content
3. All text clearly readable (white/near-white on dark glass panels)
4. Supabase data loads on mount with `Promise.all` batching
5. Real-time stats update in under 2 seconds via subscription
6. Dispatch flow: incident click → algorithm runs → auto-assigns station/hospital → saves to DB → appears in feed
7. Map: no overlapping nodes/labels, all nodes clickable, vehicle animates along path
8. No manual station/hospital dropdowns on ambulance/police/fire pages
9. Simulation page: both halves filled, speed control works, Dijkstra steps visualized, Knapsack table shown
10. Lag-free: 60fps particle background, memoized map, rAF counters
