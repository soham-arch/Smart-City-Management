/* eslint-env node */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readTable, writeTable, insertRow, updateRow, deleteRow, DB_DIR } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const BIN_DIR = path.join(__dirname, 'bin');
const CPP_BINARIES = {
  dijkstra: path.join(BIN_DIR, 'native_dijkstra.exe'),
  knapsack: path.join(BIN_DIR, 'native_knapsack.exe'),
  sorting: path.join(BIN_DIR, 'native_sorting.exe'),
  priority: path.join(BIN_DIR, 'native_priority.exe'),
  ward_knapsack: path.join(BIN_DIR, 'native_ward_knapsack.exe'),
  crime_priority_queue: path.join(BIN_DIR, 'native_crime_priority_queue.exe'),
};

// ─── Injury Type Table ───────────────────────────────────────────────
const INJURY_TYPES = {
  cardiac:  { healing_days: 8,  resource_weight: 3, initial_severity_bonus: 3 },
  stroke:   { healing_days: 10, resource_weight: 3, initial_severity_bonus: 3 },
  trauma:   { healing_days: 6,  resource_weight: 2, initial_severity_bonus: 2 },
  accident: { healing_days: 5,  resource_weight: 2, initial_severity_bonus: 2 },
  other:    { healing_days: 3,  resource_weight: 1, initial_severity_bonus: 0 },
};
// ─── Hospital Seed Data ──────────────────────────────────────────────
const HOSPITAL_SEED = [
  { name: 'Ruby Hall Clinic', location: 'Shivajinagar', map_node_id: 'ruby_hall', beds_total: 650, beds_available: 650, icu_beds_total: 40, icu_beds_available: 40, ambulances_stationed: 6, ambulances_available: 6 },
  { name: 'KEM Hospital', location: 'Rasta Peth', map_node_id: 'kem_hospital', beds_total: 1200, beds_available: 1200, icu_beds_total: 80, icu_beds_available: 80, ambulances_stationed: 8, ambulances_available: 8 },
  { name: 'Sahyadri Hospital Kothrud', location: 'Kothrud', map_node_id: 'sahyadri_kothrud', beds_total: 350, beds_available: 350, icu_beds_total: 28, icu_beds_available: 28, ambulances_stationed: 4, ambulances_available: 4 },
  { name: 'Deenanath Mangeshkar Hospital', location: 'Erandwane', map_node_id: 'deenanath', beds_total: 750, beds_available: 750, icu_beds_total: 60, icu_beds_available: 60, ambulances_stationed: 7, ambulances_available: 7 },
  { name: 'Jupiter Hospital', location: 'Baner', map_node_id: 'jupiter_baner', beds_total: 300, beds_available: 300, icu_beds_total: 20, icu_beds_available: 20, ambulances_stationed: 3, ambulances_available: 3 },
  { name: 'Poona Hospital', location: 'Sadashiv Peth', map_node_id: 'poona_hospital', beds_total: 400, beds_available: 400, icu_beds_total: 25, icu_beds_available: 25, ambulances_stationed: 3, ambulances_available: 3 },
  { name: 'Jehangir Hospital', location: 'Camp', map_node_id: 'jehangir', beds_total: 500, beds_available: 500, icu_beds_total: 35, icu_beds_available: 35, ambulances_stationed: 5, ambulances_available: 5 },
  { name: 'Noble Hospital', location: 'Hadapsar', map_node_id: 'noble_hadapsar', beds_total: 280, beds_available: 280, icu_beds_total: 18, icu_beds_available: 18, ambulances_stationed: 2, ambulances_available: 2 },
  { name: 'Aditya Birla Hospital', location: 'Wakad', map_node_id: 'aditya_birla', beds_total: 450, beds_available: 450, icu_beds_total: 30, icu_beds_available: 30, ambulances_stationed: 4, ambulances_available: 4 },
  { name: 'Symbiosis Hospital', location: 'Lavale', map_node_id: 'symbiosis_hospital', beds_total: 200, beds_available: 200, icu_beds_total: 15, icu_beds_available: 15, ambulances_stationed: 2, ambulances_available: 2 },
];

// ─── Seed hospitals on startup if empty ──────────────────────────────
function seedHospitals() {
  const hospitals = readTable('hospitals');
  if (hospitals.length === 0) {
    console.log('[DB] Seeding hospitals.txt with 10 Pune hospitals...');
    HOSPITAL_SEED.forEach((h) => {
      insertRow('hospitals', h);
    });
    console.log('[DB] Hospitals seeded successfully.');
  }
}

seedHospitals();

// ─── Crime Type Taxonomy ─────────────────────────────────────────────
const CRIME_TYPES = {
  murder_assault:   { label: 'Murder / Assault in Progress', base_priority: 10, units_needed: 3, sla_minutes: 3,  auto_ambulance: true,  default_injury: 'trauma'   },
  robbery:          { label: 'Robbery in Progress',          base_priority: 9,  units_needed: 2, sla_minutes: 4,  auto_ambulance: false                              },
  hit_and_run:      { label: 'Hit and Run',                  base_priority: 8,  units_needed: 1, sla_minutes: 5,  auto_ambulance: true,  default_injury: 'accident'  },
  burglary:         { label: 'Burglary in Progress',         base_priority: 7,  units_needed: 2, sla_minutes: 7,  auto_ambulance: false                              },
  accident:         { label: 'Road Accident',                base_priority: 6,  units_needed: 1, sla_minutes: 8,  auto_ambulance: true,  default_injury: 'accident'  },
  domestic_dispute: { label: 'Domestic Dispute',             base_priority: 5,  units_needed: 2, sla_minutes: 10, auto_ambulance: false                              },
  theft_reported:   { label: 'Theft (Reported After)',       base_priority: 3,  units_needed: 1, sla_minutes: 20, auto_ambulance: false                              },
  noise_complaint:  { label: 'Noise Complaint',              base_priority: 1,  units_needed: 1, sla_minutes: 30, auto_ambulance: false                              },
};

// ─── Police Station Seed Data ────────────────────────────────────────
const POLICE_STATION_SEED = [
  { name: 'Shivajinagar PS',    map_node_id: 'shivajinagar_ps', units_total: 12, units_available: 8,  officers_total: 45, officers_on_duty: 30, vehicles_available: 6 },
  { name: 'Deccan PS',          map_node_id: 'deccan_ps',       units_total: 10, units_available: 7,  officers_total: 38, officers_on_duty: 25, vehicles_available: 5 },
  { name: 'Swargate PS',        map_node_id: 'swargate_ps',     units_total: 8,  units_available: 5,  officers_total: 30, officers_on_duty: 20, vehicles_available: 4 },
  { name: 'Hadapsar PS',        map_node_id: 'hadapsar_ps',     units_total: 6,  units_available: 4,  officers_total: 22, officers_on_duty: 15, vehicles_available: 3 },
  { name: 'Kothrud PS',         map_node_id: 'kothrud_ps',      units_total: 8,  units_available: 6,  officers_total: 28, officers_on_duty: 20, vehicles_available: 4 },
  { name: 'Warje PS',           map_node_id: 'warje_ps',        units_total: 5,  units_available: 3,  officers_total: 18, officers_on_duty: 12, vehicles_available: 3 },
  { name: 'Chandni Chowk PS',   map_node_id: 'chandni_ps',      units_total: 7,  units_available: 5,  officers_total: 25, officers_on_duty: 18, vehicles_available: 4 },
  { name: 'Bavdhan PS',         map_node_id: 'bavdhan_ps',      units_total: 5,  units_available: 3,  officers_total: 16, officers_on_duty: 10, vehicles_available: 2 },
  { name: 'Katraj PS',          map_node_id: 'katraj_ps',       units_total: 6,  units_available: 4,  officers_total: 20, officers_on_duty: 14, vehicles_available: 3 },
  { name: 'Karve Nagar PS',     map_node_id: 'karvenagar_ps',   units_total: 7,  units_available: 5,  officers_total: 24, officers_on_duty: 16, vehicles_available: 3 },
];

// ─── Patrol Unit Seed Generator ──────────────────────────────────────
const OFFICER_NAMES = [
  'Officer Singh', 'Officer Patil', 'Officer Sharma', 'Officer Deshmukh',
  'Officer Kulkarni', 'Officer Joshi', 'Officer Pawar', 'Officer More',
  'Officer Jadhav', 'Officer Shinde', 'Officer Chavan', 'Officer Bhosale',
  'Officer Gaikwad', 'Officer Kale', 'Officer Deshpande', 'Officer Rane',
  'Officer Mane', 'Officer Thorat', 'Officer Sawant', 'Officer Nikam',
  'Officer Tambe', 'Officer Phadke', 'Officer Ghate', 'Officer Lele',
  'Officer Gokhale', 'Officer Wagh', 'Officer Datar', 'Officer Bapat',
  'Officer Panse', 'Officer Sathe',
];
const VEHICLE_TYPES = ['patrol_car', 'patrol_car', 'armed_response', 'motorcycle'];

function generatePatrolUnits(stations) {
  const units = [];
  let unitNum = 1;
  stations.forEach((station) => {
    for (let i = 0; i < 3; i++) {
      units.push({
        unit_name: `P-${String(unitNum).padStart(2, '0')}`,
        station_id: station.id,
        station_map_node_id: station.map_node_id,
        status: 'available',
        current_incident_id: null,
        officer_name: OFFICER_NAMES[(unitNum - 1) % OFFICER_NAMES.length],
        vehicle_type: VEHICLE_TYPES[(unitNum - 1) % VEHICLE_TYPES.length],
        dispatched_at: null,
        eta_minutes: null,
      });
      unitNum++;
    }
  });
  return units;
}

// ─── Seed police stations + patrol units on startup if empty ─────────
function seedPoliceStations() {
  const stations = readTable('police_stations');
  if (stations.length === 0) {
    console.log('[DB] Seeding police_stations.txt with 10 Pune police stations...');
    POLICE_STATION_SEED.forEach((s) => {
      insertRow('police_stations', s);
    });
    console.log('[DB] Police stations seeded successfully.');
  }
}

function seedPatrolUnits() {
  const units = readTable('patrol_units');
  if (units.length === 0) {
    const stations = readTable('police_stations');
    if (stations.length === 0) return;
    console.log('[DB] Seeding patrol_units.txt with 3 units per station...');
    const seedUnits = generatePatrolUnits(stations);
    seedUnits.forEach((u) => {
      insertRow('patrol_units', u);
    });
    console.log(`[DB] ${seedUnits.length} patrol units seeded successfully.`);
  }
}

// ─── Fire Station Seed Data ─────────────────────────────────────────
const FIRE_STATION_SEED = [
  { name: 'Karve Nagar Fire Station',   map_node_id: 'karvenagar_fs',   trucks_total: 4, trucks_available: 4, firefighters_total: 30, firefighters_on_duty: 20, water_tankers_total: 3, water_tankers_available: 3 },
  { name: 'Kothrud Fire Station',       map_node_id: 'kothrud_fs',      trucks_total: 3, trucks_available: 3, firefighters_total: 25, firefighters_on_duty: 18, water_tankers_total: 2, water_tankers_available: 2 },
  { name: 'Swargate Fire Station',      map_node_id: 'swargate_fs',     trucks_total: 5, trucks_available: 5, firefighters_total: 35, firefighters_on_duty: 25, water_tankers_total: 4, water_tankers_available: 4 },
  { name: 'Shivajinagar Fire Station',  map_node_id: 'shivajinagar_fs', trucks_total: 4, trucks_available: 4, firefighters_total: 28, firefighters_on_duty: 20, water_tankers_total: 3, water_tankers_available: 3 },
  { name: 'Hadapsar Fire Station',      map_node_id: 'hadapsar_fs',     trucks_total: 3, trucks_available: 3, firefighters_total: 22, firefighters_on_duty: 15, water_tankers_total: 2, water_tankers_available: 2 },
  { name: 'Baner Fire Station',         map_node_id: 'baner_fs',        trucks_total: 3, trucks_available: 3, firefighters_total: 20, firefighters_on_duty: 14, water_tankers_total: 2, water_tankers_available: 2 },
  { name: 'Katraj Fire Station',        map_node_id: 'katraj_fs',       trucks_total: 3, trucks_available: 3, firefighters_total: 18, firefighters_on_duty: 12, water_tankers_total: 2, water_tankers_available: 2 },
];

function seedFireStations() {
  const stations = readTable('fire_stations');
  if (stations.length === 0) {
    console.log('[DB] Seeding fire_stations.txt with 7 Pune fire stations...');
    FIRE_STATION_SEED.forEach((s) => {
      insertRow('fire_stations', s);
    });
    console.log('[DB] Fire stations seeded successfully.');
  }
}

seedPoliceStations();
seedPatrolUnits();
seedFireStations();


// ─── Utility Functions ───────────────────────────────────────────────

function sanitizeField(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\t/g, ' ')
    .trim();
}

function roundDistance(value) {
  return Math.round(Number(value) * 10) / 10;
}

function buildGraph(edges) {
  const graph = {};

  edges.forEach((edge) => {
    if (!graph[edge.from]) graph[edge.from] = [];
    if (!graph[edge.to]) graph[edge.to] = [];
    graph[edge.from].push({ node: edge.to, weight: Number(edge.distance_km) });
    graph[edge.to].push({ node: edge.from, weight: Number(edge.distance_km) });
  });

  return graph;
}

function dijkstraAllJs(edges, start) {
  const graph = buildGraph(edges);
  const distances = {};
  const previous = {};
  const visited = new Set();
  const pq = [];

  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
    previous[node] = null;
  });

  distances[start] = 0;
  pq.push({ node: start, dist: 0 });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: current } = pq.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    for (const neighbor of graph[current] || []) {
      const newDist = distances[current] + neighbor.weight;
      if (newDist < distances[neighbor.node]) {
        distances[neighbor.node] = newDist;
        previous[neighbor.node] = current;
        pq.push({ node: neighbor.node, dist: newDist });
      }
    }
  }

  return { distances, prev: previous };
}

function knapsackJs(items, capacity) {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i += 1) {
    for (let w = 0; w <= capacity; w += 1) {
      dp[i][w] = dp[i - 1][w];
      if (items[i - 1].weight <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - items[i - 1].weight] + items[i - 1].value);
      }
    }
  }

  const selectedIds = [];
  let w = capacity;
  for (let i = n; i > 0; i -= 1) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedIds.push(items[i - 1].id);
      w -= items[i - 1].weight;
    }
  }

  return {
    selected_ids: selectedIds.reverse(),
    total_value: dp[n][capacity],
  };
}

function sortByDistanceJs(candidates) {
  return [...candidates].sort((a, b) => a.distance - b.distance);
}

function computePriorityJs(type, severity) {
  let base = severity;
  if (type === 'fire') base += 3;
  if (type === 'ambulance') base += 2;
  if (type === 'police') base += 1;
  return Math.min(base, 10);
}

function reconstructPath(prev, start, end) {
  const path = [];
  let current = end;

  while (current) {
    path.unshift(current);
    current = prev[current];
  }

  return path[0] === start ? path : [];
}

function runCppBinary(binaryName, input) {
  const executable = CPP_BINARIES[binaryName];
  const result = spawnSync(executable, [], {
    input,
    encoding: 'utf-8',
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${binaryName} failed`);
  }

  return JSON.parse(result.stdout);
}

function runDijkstraAll(edges, start) {
  const payload = [
    'all',
    sanitizeField(start),
    '',
    String(edges.length),
    ...edges.map((edge) => [sanitizeField(edge.from), sanitizeField(edge.to), Number(edge.distance_km)].join('\t')),
  ].join('\n');

  try {
    return { ...runCppBinary('dijkstra', payload), engine: 'cpp' };
  } catch (error) {
    return { ...dijkstraAllJs(edges, start), engine: 'js-fallback', warning: error.message };
  }
}

function runKnapsack(items, capacity) {
  const payload = [
    String(capacity),
    String(items.length),
    ...items.map((item) => [
      sanitizeField(item.id),
      sanitizeField(item.name),
      Number(item.weight),
      Number(item.value),
    ].join('\t')),
  ].join('\n');

  try {
    return { ...runCppBinary('knapsack', payload), engine: 'cpp' };
  } catch (error) {
    return { ...knapsackJs(items, capacity), engine: 'js-fallback', warning: error.message };
  }
}

function runSorting(candidates) {
  const payload = [
    String(candidates.length),
    ...candidates.map((candidate) => [
      sanitizeField(candidate.id),
      sanitizeField(candidate.name),
      Number(candidate.distance),
    ].join('\t')),
  ].join('\n');

  try {
    return { ...runCppBinary('sorting', payload), engine: 'cpp' };
  } catch (error) {
    return { ordered: sortByDistanceJs(candidates), engine: 'js-fallback', warning: error.message };
  }
}

function runPriority(type, severity) {
  const payload = [sanitizeField(type), String(severity)].join('\n');

  try {
    return { ...runCppBinary('priority', payload), engine: 'cpp' };
  } catch (error) {
    return {
      priority_score: computePriorityJs(type, severity),
      engine: 'js-fallback',
      warning: error.message,
    };
  }
}

function runWardKnapsack(patients, resourceCapacity) {
  const payload = [
    String(resourceCapacity),
    String(patients.length),
    ...patients.map((p) => [
      sanitizeField(p.id),
      sanitizeField(p.injury_type),
      Number(p.severity),
      Number(p.days_admitted),
      Number(p.healing_duration),
    ].join('\t')),
  ].join('\n');

  try {
    return { ...runCppBinary('ward_knapsack', payload), engine: 'cpp' };
  } catch (error) {
    // JS fallback for ward knapsack
    const n = patients.length;
    const W = resourceCapacity;
    const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

    const effectiveSeverities = patients.map((p) => {
      let eff = p.severity;
      if (p.days_admitted >= p.healing_duration) eff = Math.max(1, eff - 3);
      const it = INJURY_TYPES[p.injury_type];
      if (it) eff += it.initial_severity_bonus;
      return eff;
    });

    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= W; w++) {
        dp[i][w] = dp[i - 1][w];
        const rw = patients[i - 1].resource_weight || 1;
        if (rw <= w) {
          dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - rw] + effectiveSeverities[i - 1]);
        }
      }
    }

    const selected = [];
    let ww = W;
    for (let i = n; i > 0; i--) {
      if (dp[i][ww] !== dp[i - 1][ww]) {
        selected.push(i - 1);
        ww -= patients[i - 1].resource_weight || 1;
      }
    }

    const icuSet = new Set(selected);
    return {
      icu_admitted: patients.filter((_, i) => icuSet.has(i)).map((p) => p.id),
      general_ward: patients.filter((_, i) => !icuSet.has(i)).map((p) => p.id),
      evicted_from_icu: [],
      total_severity_served: dp[n][W],
      dp_table_snapshot: dp,
      engine: 'js-fallback',
      warning: error.message,
    };
  }
}

function selectBestKnapsackItem(items, selectedIds) {
  const selectedSet = new Set(selectedIds);
  const pool = items.filter((item) => selectedSet.has(item.id));
  const candidates = pool.length > 0 ? pool : items;

  // Use distance-weighted composite score: value / distance ratio
  // This ensures nearby hospitals with good resources are preferred
  // over distant high-capacity ones (fixes KEM-always-selected bug)
  return [...candidates].sort((a, b) => {
    const scoreA = a.value / Math.max(a.distance, 0.1);
    const scoreB = b.value / Math.max(b.distance, 0.1);
    if (Math.abs(scoreB - scoreA) > 0.01) return scoreB - scoreA;
    return a.distance - b.distance; // tiebreaker: closer first
  })[0] ?? null;
}

function computeFireResources(intensity, buildingType) {
  let trucks;
  let firefighters;
  let tankers;

  if (intensity <= 3) {
    trucks = 1;
    firefighters = 5;
    tankers = 1;
  } else if (intensity <= 6) {
    trucks = 2;
    firefighters = 10;
    tankers = 2;
  } else if (intensity <= 9) {
    trucks = 3;
    firefighters = 15;
    tankers = 3;
  } else {
    trucks = 5;
    firefighters = 25;
    tankers = 5;
  }

  if (buildingType === 'industrial' || buildingType === 'commercial') {
    trucks = Math.ceil(trucks * 1.3);
    firefighters = Math.ceil(firefighters * 1.2);
    tankers = Math.ceil(tankers * 1.3);
  }

  return { trucks, firefighters, tankers, spreadRadius: intensity * 15 };
}

// ─── Database Polling Endpoint ───────────────────────────────────────

app.get('/api/db/:table', (req, res) => {
  const { table } = req.params;
  const allowed = ['hospitals', 'incidents', 'patients', 'wards', 'police_stations', 'patrol_units', 'crime_queue', 'crime_incidents', 'fire_stations'];
  if (!allowed.includes(table)) {
    return res.status(400).json({ error: `Invalid table: ${table}. Allowed: ${allowed.join(', ')}` });
  }
  const rows = readTable(table);
  res.json(rows);
});

app.post('/api/db/:table', (req, res) => {
  const { table } = req.params;
  const allowed = ['hospitals', 'incidents', 'patients', 'wards', 'police_stations', 'patrol_units', 'crime_queue', 'crime_incidents', 'fire_stations'];
  if (!allowed.includes(table)) {
    return res.status(400).json({ error: `Invalid table: ${table}` });
  }
  const row = insertRow(table, req.body);
  res.status(201).json(row);
});

app.patch('/api/db/:table/:id', (req, res) => {
  const { table, id } = req.params;
  const allowed = ['hospitals', 'incidents', 'patients', 'wards', 'police_stations', 'patrol_units', 'crime_queue', 'crime_incidents', 'fire_stations'];
  if (!allowed.includes(table)) {
    return res.status(400).json({ error: `Invalid table: ${table}` });
  }
  const updated = updateRow(table, id, req.body);
  if (!updated) {
    return res.status(404).json({ error: `Row ${id} not found in ${table}` });
  }
  res.json(updated);
});

app.delete('/api/db/:table/:id', (req, res) => {
  const { table, id } = req.params;
  const allowed = ['hospitals', 'incidents', 'patients', 'wards', 'police_stations', 'patrol_units', 'crime_queue', 'crime_incidents', 'fire_stations'];
  if (!allowed.includes(table)) {
    return res.status(400).json({ error: `Invalid table: ${table}` });
  }
  const deleted = deleteRow(table, id);
  if (!deleted) {
    return res.status(404).json({ error: `Row ${id} not found in ${table}` });
  }
  res.json({ success: true });
});

// Also support PATCH /api/hospitals/:id for convenience
app.patch('/api/hospitals/:id', (req, res) => {
  const updated = updateRow('hospitals', req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: `Hospital ${req.params.id} not found` });
  }
  res.json(updated);
});

// ─── Injury Types Endpoint ───────────────────────────────────────────

app.get('/api/injury-types', (req, res) => {
  res.json(INJURY_TYPES);
});

// ─── Health Check ────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  const tables = ['hospitals', 'incidents', 'patients', 'wards'];
  const dbFiles = {};
  tables.forEach((t) => {
    const filePath = path.join(DB_DIR, `${t}.txt`);
    const exists = fs.existsSync(filePath);
    dbFiles[t] = {
      exists,
      rows: exists ? readTable(t).length : 0,
    };
  });

  const binaries = Object.fromEntries(
    Object.entries(CPP_BINARIES).map(([name, executable]) => [name, fs.existsSync(executable)]),
  );

  res.json({ status: 'ok', uptime: process.uptime(), dbFiles, binaries });
});

app.get('/api/cpp-status', (req, res) => {
  const binaries = Object.fromEntries(
    Object.entries(CPP_BINARIES).map(([name, executable]) => [name, fs.existsSync(executable)]),
  );
  res.json({ binaries });
});

// ─── Ward Knapsack Endpoint ──────────────────────────────────────────

app.post('/api/ward-knapsack', (req, res) => {
  const { hospital_id } = req.body;
  if (!hospital_id) {
    return res.status(400).json({ error: 'hospital_id is required' });
  }

  // Get hospital
  const hospitals = readTable('hospitals');
  const hospital = hospitals.find((h) => h.map_node_id === hospital_id || h.id === hospital_id);
  if (!hospital) {
    return res.status(404).json({ error: `Hospital not found: ${hospital_id}` });
  }

  // Get patients for this hospital that are admitted
  const allPatients = readTable('patients');
  const patients = allPatients.filter(
    (p) => (p.hospital_id === hospital_id || p.hospital_id === hospital.map_node_id) && p.status !== 'discharged'
  );

  if (patients.length === 0) {
    return res.json({
      icu_admitted: [],
      general_ward: [],
      evicted_from_icu: [],
      total_severity_served: 0,
      dp_table_snapshot: [[0]],
      hospital_id,
    });
  }

  // Resource capacity = icu_beds_total * 2
  const resourceCapacity = (hospital.icu_beds_total || 16) * 2;

  // Run ward knapsack
  const result = runWardKnapsack(patients, resourceCapacity);

  // Determine evictions (patients previously in ICU but now in general)
  const evicted = [];
  const icuSet = new Set(result.icu_admitted);
  const generalSet = new Set(result.general_ward);

  // Update patient wards in patients.txt
  const updatedPatients = readTable('patients');
  updatedPatients.forEach((p) => {
    if (icuSet.has(p.id)) {
      if (p.ward === 'icu') { /* stays */ }
      else { /* promoted to ICU */ }
      p.ward = 'icu';
    } else if (generalSet.has(p.id)) {
      if (p.ward === 'icu') {
        evicted.push(p.id);
      }
      p.ward = 'general';
    }
  });
  writeTable('patients', updatedPatients);

  // Update hospital bed counts
 const currentPatients = updatedPatients.filter(
  (p) => (p.hospital_id === hospital_id || p.hospital_id === hospital.map_node_id) && p.status !== 'discharged'
);

// ✅ ICU resource usage (NOT patient count)
const icuResourceUsed = currentPatients
  .filter((p) => p.ward === 'icu')
  .reduce((sum, p) => sum + (p.resource_weight || 1), 0);

// Optional: General ward can still be simple count OR also weighted
const generalCount = currentPatients.filter((p) => p.ward === 'general').length;

// 🔥 Capacity = ICU beds * 2 (same as your knapsack)
const icuCapacity = (hospital.icu_beds_total || 0) * 2;

updateRow('hospitals', hospital.id, {
  // Now this reflects REAL usage
  icu_beds_available: Math.max(0, icuCapacity - icuResourceUsed),

  // Keep general beds simple (or upgrade later)
  beds_available: Math.max(0, (hospital.beds_total || 0) - generalCount),
});

  // Save ward snapshot
  insertRow('wards', {
    hospital_id: hospital.map_node_id || hospital_id,
    timestamp: new Date().toISOString(),
    icu_patients: result.icu_admitted,
    general_patients: result.general_ward,
    icu_resource_used: currentPatients.filter((p) => p.ward === 'icu').reduce((s, p) => s + (p.resource_weight || 1), 0),
    icu_resource_capacity: resourceCapacity,
    knapsack_total_value: result.total_severity_served,
  });

  result.evicted_from_icu = evicted;
  result.hospital_id = hospital_id;

  res.json(result);
});

// ─── Healing Tick Endpoint ───────────────────────────────────────────

app.post('/api/healing-tick', (req, res) => {
  const { hospital_id } = req.body || {};
  const allPatients = readTable('patients');
  const changes = { healed: [], recovering: [], discharged: [] };
  const affectedHospitals = new Set();

  allPatients.forEach((p) => {
    // Filter by hospital if specified
    if (hospital_id && p.hospital_id !== hospital_id) return;
    if (p.status === 'discharged') return;

    // Increment days_admitted
    if (p.status === 'admitted' || p.status === 'recovering') {
      p.days_admitted = (p.days_admitted || 0) + 1;
    }

    // Check healing thresholds
    if (p.days_admitted >= (p.healing_duration || 5) + 2 && p.status !== 'discharged') {
      // Discharge
      p.status = 'discharged';
      changes.discharged.push(p.id);
      affectedHospitals.add(p.hospital_id);
    } else if (p.days_admitted >= (p.healing_duration || 5) && p.status === 'admitted') {
      // Start recovering
      p.status = 'recovering';
      p.severity = Math.max(1, (p.severity || 5) - 3);
      changes.recovering.push(p.id);
      affectedHospitals.add(p.hospital_id);
    }
  });

  writeTable('patients', allPatients);

  // Update bed counts for discharged patients
  changes.discharged.forEach((pid) => {
    const patient = allPatients.find((p) => p.id === pid);
    if (!patient) return;

    const hospitals = readTable('hospitals');
    const hospital = hospitals.find((h) => h.map_node_id === patient.hospital_id || h.id === patient.hospital_id);
    if (!hospital) return;

    const patch = {
      beds_available: Math.min(hospital.beds_total, (hospital.beds_available || 0) + 1),
    };
    if (patient.ward === 'icu') {
      patch.icu_beds_available = Math.min(hospital.icu_beds_total, (hospital.icu_beds_available || 0) + 1);
    }
    updateRow('hospitals', hospital.id, patch);
  });

  // Re-run ward knapsack for each affected hospital
  const rebalanceResults = {};
  affectedHospitals.forEach((hid) => {
    try {
      const hospitals = readTable('hospitals');
      const hospital = hospitals.find((h) => h.map_node_id === hid || h.id === hid);
      if (!hospital) return;

      const patients = readTable('patients').filter(
        (p) => p.hospital_id === hid && p.status !== 'discharged'
      );
      if (patients.length === 0) return;

      const resourceCapacity = (hospital.icu_beds_total || 16) * 2;
      const result = runWardKnapsack(patients, resourceCapacity);

      // Update wards
      const allP = readTable('patients');
      const icuSet = new Set(result.icu_admitted);
      allP.forEach((p) => {
        if (icuSet.has(p.id)) p.ward = 'icu';
        else if (result.general_ward.includes(p.id)) p.ward = 'general';
      });
      writeTable('patients', allP);

      rebalanceResults[hid] = result;
    } catch (e) {
      console.error(`[HEAL] Rebalance failed for ${hid}:`, e.message);
    }
  });

  res.json({
    changes,
    affectedHospitals: [...affectedHospitals],
    rebalanceResults,
  });
});

// ─── Ambulance Dispatch ──────────────────────────────────────────────

app.post('/api/ambulance-dispatch', (req, res) => {
  const {
    origin,
    severity = 5,
    hospitals = [],
    edges = [],
    prioritySeverity = severity,
  } = req.body;

  if (!origin || hospitals.length === 0 || edges.length === 0) {
    return res.status(400).json({ error: 'origin, hospitals, and edges are required' });
  }

  const routeResult = runDijkstraAll(edges, origin);
  const priorityResult = runPriority('ambulance', prioritySeverity);

  const items = hospitals
    .map((hospital) => {
      const distance = routeResult.distances[hospital.map_node_id];
      const pathArr = reconstructPath(routeResult.prev, origin, hospital.map_node_id);
      const dist = Number.isFinite(distance) ? roundDistance(distance) : Infinity;

      // Value formula: resource score normalized by distance
      // Closer hospitals get a proximity bonus to prevent always picking the largest
      const resourceScore = ((hospital.beds_available || 0) * 2) + ((hospital.icu_beds_available || 0) * 5) + ((hospital.ambulances_available || 0) * 3);
      const proximityBonus = Number.isFinite(dist) && dist > 0 ? Math.round(100 / dist) : 0;
      const compositeValue = resourceScore + proximityBonus;

      return {
        ...hospital,
        id: hospital.id,
        nodeId: hospital.map_node_id,
        path: pathArr,
        distance: dist,
        weight: Math.max(1, Math.ceil(dist || 1)),
        value: compositeValue,
      };
    })
    .filter((item) => Number.isFinite(item.distance) && item.path.length > 0);

  if (items.length === 0) {
    return res.status(404).json({ error: 'No reachable hospitals found' });
  }

  // Dynamic knapsack capacity — use median distance so not all items fit
  const sortedDists = items.map(i => i.weight).sort((a, b) => a - b);
  const medianDist = sortedDists[Math.floor(sortedDists.length / 2)] || 10;
  const knapsackCapacity = Math.max(5, Math.ceil(medianDist * 1.5));
  const knapsackResult = runKnapsack(items, knapsackCapacity);
  const selected = selectBestKnapsackItem(items, knapsackResult.selected_ids || []);

  // Build dijkstra steps for visualization
  const graph = buildGraph(edges);
  const dijkstraSteps = [];
  {
    const distances = {};
    const previous = {};
    const visited = new Set();
    const pq = [];

    Object.keys(graph).forEach((node) => {
      distances[node] = Infinity;
      previous[node] = null;
    });
    distances[origin] = 0;
    pq.push({ node: origin, dist: 0 });

    while (pq.length > 0) {
      pq.sort((a, b) => a.dist - b.dist);
      const { node: current } = pq.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = graph[current] || [];
      const updatedNeighbors = [];

      for (const neighbor of neighbors) {
        if (visited.has(neighbor.node)) continue;
        const newDist = distances[current] + neighbor.weight;
        if (newDist < distances[neighbor.node]) {
          distances[neighbor.node] = newDist;
          previous[neighbor.node] = current;
          pq.push({ node: neighbor.node, dist: newDist });
          updatedNeighbors.push({
            node: neighbor.node,
            oldDist: 'INF',
            newDist: roundDistance(newDist),
          });
        }
      }

      dijkstraSteps.push({
        current,
        distance: roundDistance(distances[current]),
        neighbors: updatedNeighbors,
      });
    }
  }

  res.json({
    priorityScore: priorityResult.priority_score,
    hospital: selected,
    reason: `Best resource score: ${selected.value} with ${selected.beds_available || 0} beds and ${selected.icu_beds_available || 0} ICU beds`,
    allHospitals: items,
    dijkstraSteps,
    algorithms: {
      route: routeResult.engine,
      knapsack: knapsackResult.engine,
      priority: priorityResult.engine,
    },
  });
});

// ─── Fire Dispatch ───────────────────────────────────────────────────

app.post('/api/fire-dispatch', (req, res) => {
  const {
    origin,
    intensity = 5,
    buildingType = 'residential',
    fireStations = [],
    edges = [],
  } = req.body;

  if (!origin || fireStations.length === 0 || edges.length === 0) {
    return res.status(400).json({ error: 'origin, fireStations, and edges are required' });
  }

  const routeResult = runDijkstraAll(edges, origin);
  const priorityResult = runPriority('fire', intensity);

  const items = fireStations
    .map((station) => {
      const distance = routeResult.distances[station.map_node_id];
      const pathArr = reconstructPath(routeResult.prev, origin, station.map_node_id);

      return {
        ...station,
        id: station.id,
        nodeId: station.map_node_id,
        path: pathArr,
        distance: Number.isFinite(distance) ? roundDistance(distance) : Infinity,
        weight: Math.ceil(distance || 0),
        value: ((station.trucks_available || 0) * 4) + ((station.firefighters_on_duty || 0) * 1) + ((station.water_tankers_available || 0) * 3),
      };
    })
    .filter((item) => Number.isFinite(item.distance) && item.path.length > 0);

  if (items.length === 0) {
    return res.status(404).json({ error: 'No reachable fire stations found' });
  }

  const capacity = (intensity * 2) + 10;
  const knapsackResult = runKnapsack(items, capacity);
  const selected = selectBestKnapsackItem(items, knapsackResult.selected_ids || []);
  const resources = computeFireResources(intensity, buildingType);

  res.json({
    priorityScore: priorityResult.priority_score,
    station: selected,
    reason: `Optimal resource score: ${selected.value} from ${selected.name}`,
    allStations: items,
    recommendedResources: resources,
    algorithms: {
      route: routeResult.engine,
      knapsack: knapsackResult.engine,
      priority: priorityResult.engine,
    },
  });
});

// ─── Crime Types Endpoint ─────────────────────────────────────────────

app.get('/api/crime-types', (req, res) => {
  res.json(CRIME_TYPES);
});

// ─── Crime Priority Queue C++ Runner ─────────────────────────────────

function runCrimeQueue(crimes) {
  if (!crimes || crimes.length === 0) {
    return { sorted_queue: [], heap_insertion_steps: [], total_pending: 0 };
  }

  const payload = [
    String(crimes.length),
    ...crimes.map((c) => [
      sanitizeField(c.id),
      sanitizeField(c.crime_type),
      String(c.severity || 5),
      String(c.units_needed || 1),
      String(Math.floor(new Date(c.reported_at || c.created_at).getTime() / 1000)),
    ].join('\t')),
  ].join('\n');

  try {
    return { ...runCppBinary('crime_priority_queue', payload), engine: 'cpp' };
  } catch (error) {
    // JS fallback — simple sort by priority
    const scored = crimes.map((c) => {
      const ct = CRIME_TYPES[c.crime_type];
      const base = ct ? ct.base_priority : 5;
      const timeBonusSec = Math.max(0, (Date.now() - new Date(c.reported_at || c.created_at).getTime()) / 1000);
      const timeBonus = Math.min(3, Math.floor(timeBonusSec / 60));
      const score = Math.min(10, base + Math.floor((c.severity || 5) / 3) + timeBonus);
      return { crime_id: c.id, crime_type: c.crime_type, priority_score: score, severity: c.severity || 5, units_needed: c.units_needed || 1, heap_position: 0 };
    });
    scored.sort((a, b) => b.priority_score - a.priority_score);
    scored.forEach((s, i) => { s.heap_position = i; });
    return {
      sorted_queue: scored,
      heap_insertion_steps: [{ step: 1, action: 'insert', crime_id: crimes[crimes.length - 1]?.id, position: 0, swapped_with: null }],
      total_pending: scored.length,
      engine: 'js-fallback',
      warning: error.message,
    };
  }
}

// ─── Unit Assignment Logic ───────────────────────────────────────────

function assignUnitsToQueue(edges) {
  const queue = readTable('crime_queue').filter((c) => c.status === 'pending');
  const allUnits = readTable('patrol_units');
  const availableUnits = allUnits.filter((u) => u.status === 'available');

  if (queue.length === 0 || availableUnits.length === 0) return;

  // Sort queue by priority_score descending
  queue.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  // Get edges for dijkstra from the request or use a default set
  // We compute distances once from each crime location
  const usedUnitIds = new Set();

  for (const crime of queue) {
    const needed = crime.units_needed || 1;
    const alreadyAssigned = (crime.assigned_unit_ids || []).length;
    const stillNeeded = needed - alreadyAssigned;
    if (stillNeeded <= 0) continue;

    // Get distances from crime location to all nodes
    let routeResult;
    if (edges && edges.length > 0) {
      routeResult = runDijkstraAll(edges, crime.map_node_id);
    } else {
      // If no edges provided, skip distance-based sorting
      routeResult = null;
    }

    // Score available units by distance from crime
    const candidateUnits = availableUnits
      .filter((u) => !usedUnitIds.has(u.id))
      .map((u) => {
        let distance = Infinity;
        if (routeResult) {
          distance = routeResult.distances[u.station_map_node_id];
          if (!Number.isFinite(distance)) distance = Infinity;
        }
        return { ...u, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const toAssign = candidateUnits.slice(0, stillNeeded);
    if (toAssign.length === 0) continue;

    const assignedIds = [...(crime.assigned_unit_ids || [])];
    const now = new Date().toISOString();

    toAssign.forEach((unit) => {
      usedUnitIds.add(unit.id);
      assignedIds.push(unit.id);

      // Compute ETA
      const eta = Number.isFinite(unit.distance) ? Math.max(2, Math.round(unit.distance * 1.3)) : null;

      // Update patrol unit
      updateRow('patrol_units', unit.id, {
        status: 'dispatched',
        current_incident_id: crime.id,
        dispatched_at: now,
        eta_minutes: eta,
      });

      // Decrement station availability
      const stations = readTable('police_stations');
      const station = stations.find((s) => s.map_node_id === unit.station_map_node_id);
      if (station) {
        updateRow('police_stations', station.id, {
          units_available: Math.max(0, (station.units_available || 1) - 1),
        });
      }
    });

    // Update crime
    const updates = { assigned_unit_ids: assignedIds };
    if (assignedIds.length >= needed) {
      updates.status = 'active';
      updates.dispatched_at = now;
    }
    updateRow('crime_queue', crime.id, updates);
  }
}

// ─── Crime Queue Endpoints ───────────────────────────────────────────

// GET /api/crime-queue — returns sorted queue with fresh priority scores
app.get('/api/crime-queue', (req, res) => {
  const pending = readTable('crime_queue').filter((c) => c.status === 'pending' || c.status === 'active');
  const queueResult = runCrimeQueue(pending);

  // Write updated scores back
  if (queueResult.sorted_queue) {
    const scoreMap = {};
    queueResult.sorted_queue.forEach((sq) => { scoreMap[sq.crime_id] = sq.priority_score; });
    pending.forEach((c) => {
      if (scoreMap[c.id] !== undefined && scoreMap[c.id] !== c.priority_score) {
        updateRow('crime_queue', c.id, { priority_score: scoreMap[c.id] });
      }
    });
  }

  // Return full queue data (including resolved for display)
  const allQueue = readTable('crime_queue');
  res.json({
    ...queueResult,
    full_queue: allQueue,
  });
});

// POST /api/crime-queue/insert — add crime, run C++ queue, assign units
app.post('/api/crime-queue/insert', (req, res) => {
  const { crime_type, location_name, map_node_id, severity, has_casualties, casualty_count, casualty_injury_type, edges } = req.body;

  const ct = CRIME_TYPES[crime_type];
  if (!ct) {
    return res.status(400).json({ error: `Invalid crime_type: ${crime_type}` });
  }

  // Insert crime into queue
  const now = new Date().toISOString();
  const crime = insertRow('crime_queue', {
    crime_type,
    location_name: location_name || map_node_id,
    map_node_id,
    severity: severity || ct.base_priority,
    priority_score: 0,
    units_needed: ct.units_needed,
    status: 'pending',
    assigned_unit_ids: [],
    linked_incident_id: null,
    has_casualties: has_casualties || false,
    casualty_count: casualty_count || 0,
    casualty_injury_type: casualty_injury_type || null,
    linked_ambulance_incident_id: null,
    reported_at: now,
    dispatched_at: null,
    resolved_at: null,
    response_time_seconds: null,
    sla_target_minutes: ct.sla_minutes,
    sla_met: null,
  });

  // Run C++ priority queue on all pending crimes
  const allPending = readTable('crime_queue').filter((c) => c.status === 'pending' || c.status === 'active');
  const queueResult = runCrimeQueue(allPending);

  // Write updated scores back
  if (queueResult.sorted_queue) {
    queueResult.sorted_queue.forEach((sq) => {
      updateRow('crime_queue', sq.crime_id, { priority_score: sq.priority_score });
    });
  }

  // Assign units
  if (edges) {
    assignUnitsToQueue(edges);
  }

  // Re-read crime to get updated state
  const updatedCrime = readTable('crime_queue').find((c) => c.id === crime.id) || crime;

  res.json({
    crime: updatedCrime,
    ...queueResult,
  });
});

// POST /api/crime-queue/resolve/:crimeId — resolve a crime
app.post('/api/crime-queue/resolve/:crimeId', (req, res) => {
  const { crimeId } = req.params;
  const queue = readTable('crime_queue');
  const crime = queue.find((c) => c.id === crimeId);

  if (!crime) {
    return res.status(404).json({ error: `Crime ${crimeId} not found in queue` });
  }

  const now = new Date();
  const reportedAt = new Date(crime.reported_at || crime.created_at);
  const responseTimeSec = Math.round((now - reportedAt) / 1000);
  const slaMet = responseTimeSec <= (crime.sla_target_minutes || 10) * 60;

  // Update crime in queue
  updateRow('crime_queue', crimeId, {
    status: 'resolved',
    resolved_at: now.toISOString(),
    response_time_seconds: responseTimeSec,
    sla_met: slaMet,
  });

  // Copy to crime_incidents (permanent log)
  const resolvedCrime = readTable('crime_queue').find((c) => c.id === crimeId);
  if (resolvedCrime) {
    insertRow('crime_incidents', { ...resolvedCrime, original_queue_id: crimeId });
  }

  // Free assigned units
  const assignedUnitIds = crime.assigned_unit_ids || [];
  assignedUnitIds.forEach((unitId) => {
    const unit = readTable('patrol_units').find((u) => u.id === unitId);
    if (unit) {
      updateRow('patrol_units', unitId, {
        status: 'available',
        current_incident_id: null,
        dispatched_at: null,
        eta_minutes: null,
      });

      // Increment station availability
      const stations = readTable('police_stations');
      const station = stations.find((s) => s.map_node_id === unit.station_map_node_id);
      if (station) {
        updateRow('police_stations', station.id, {
          units_available: Math.min(station.units_total || 10, (station.units_available || 0) + 1),
        });
      }
    }
  });

  // Delete from queue (keep only in crime_incidents)
  deleteRow('crime_queue', crimeId);

  // Re-assign freed units to next pending crimes
  assignUnitsToQueue(req.body.edges || []);

  // Return updated queue
  const remaining = readTable('crime_queue');
  const pendingActive = remaining.filter((c) => c.status === 'pending' || c.status === 'active');
  const freshQueue = runCrimeQueue(pendingActive);

  res.json({
    resolved: resolvedCrime,
    response_time_seconds: responseTimeSec,
    sla_met: slaMet,
    ...freshQueue,
    full_queue: remaining,
  });
});

// ─── Police Dispatch (New Flow) ──────────────────────────────────────

app.post('/api/police-dispatch', (req, res) => {
  const {
    origin,
    crime_type = 'robbery',
    severity = 6,
    has_casualties = false,
    casualty_count = 0,
    casualty_injury_type = null,
    edges = [],
  } = req.body;

  if (!origin || edges.length === 0) {
    return res.status(400).json({ error: 'origin and edges are required' });
  }

  const ct = CRIME_TYPES[crime_type] || CRIME_TYPES.robbery;

  // 1. Run Dijkstra from crime location
  const routeResult = runDijkstraAll(edges, origin);

  // 2. Get police stations from DB
  const policeStations = readTable('police_stations');
  const candidates = policeStations
    .map((station) => {
      const distance = routeResult.distances[station.map_node_id];
      const pathArr = reconstructPath(routeResult.prev, origin, station.map_node_id);
      return {
        ...station,
        nodeId: station.map_node_id,
        path: pathArr,
        distance: Number.isFinite(distance) ? roundDistance(distance) : Infinity,
      };
    })
    .filter((s) => Number.isFinite(s.distance) && s.path.length > 0);

  if (candidates.length === 0) {
    return res.status(404).json({ error: 'No reachable police stations found' });
  }

  // 3. Sort by distance
  const availableStations = candidates.filter((s) => (s.units_available || 0) > 0);
  const sortable = availableStations.length > 0 ? availableStations : candidates;
  const sortingResult = runSorting(sortable);
  const orderedStations = (sortingResult.ordered || []).map((o) =>
    sortable.find((s) => s.id === o.id)).filter(Boolean);

  const bestStation = orderedStations[0] || sortable[0];

  // 4. Run priority
  const priorityResult = runPriority('police', severity);

  // 5. Insert crime into queue + run C++ priority queue
  const now = new Date().toISOString();
  const locationName = req.body.location_name || origin;
  const crimeRow = insertRow('crime_queue', {
    crime_type,
    location_name: locationName,
    map_node_id: origin,
    severity,
    priority_score: 0,
    units_needed: ct.units_needed,
    status: 'pending',
    assigned_unit_ids: [],
    linked_incident_id: null,
    has_casualties,
    casualty_count,
    casualty_injury_type,
    linked_ambulance_incident_id: null,
    reported_at: now,
    dispatched_at: null,
    resolved_at: null,
    response_time_seconds: null,
    sla_target_minutes: ct.sla_minutes,
    sla_met: null,
  });

  // Also write to crime_incidents as active log
  insertRow('crime_incidents', {
    crime_type,
    location_name: locationName,
    map_node_id: origin,
    severity,
    priority_score: priorityResult.priority_score,
    status: 'active',
    reported_at: now,
    type: 'police',
  });

  const allPending = readTable('crime_queue').filter((c) => c.status === 'pending' || c.status === 'active');
  const queueResult = runCrimeQueue(allPending);

  // Update scores
  if (queueResult.sorted_queue) {
    queueResult.sorted_queue.forEach((sq) => {
      updateRow('crime_queue', sq.crime_id, { priority_score: sq.priority_score });
    });
  }

  // 6. Assign units
  assignUnitsToQueue(edges);

  // Re-read to get current state
  const updatedCrime = readTable('crime_queue').find((c) => c.id === crimeRow.id) || crimeRow;
  const assignedUnits = readTable('patrol_units').filter((u) => u.current_incident_id === crimeRow.id);

  // Build dijkstra steps for visualization
  const graph = buildGraph(edges);
  const dijkstraSteps = [];
  {
    const distances = {};
    const previous = {};
    const visited = new Set();
    const pq = [];

    Object.keys(graph).forEach((node) => {
      distances[node] = Infinity;
      previous[node] = null;
    });
    distances[origin] = 0;
    pq.push({ node: origin, dist: 0 });

    while (pq.length > 0) {
      pq.sort((a, b) => a.dist - b.dist);
      const { node: current } = pq.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = graph[current] || [];
      const updatedNeighbors = [];

      for (const neighbor of neighbors) {
        if (visited.has(neighbor.node)) continue;
        const newDist = distances[current] + neighbor.weight;
        if (newDist < distances[neighbor.node]) {
          distances[neighbor.node] = newDist;
          previous[neighbor.node] = current;
          pq.push({ node: neighbor.node, dist: newDist });
          updatedNeighbors.push({
            node: neighbor.node,
            oldDist: 'INF',
            newDist: roundDistance(newDist),
          });
        }
      }

      dijkstraSteps.push({
        current,
        distance: roundDistance(distances[current]),
        neighbors: updatedNeighbors,
      });
    }
  }

  // 7. Handle casualties — linked ambulance dispatch
  let ambulanceDispatch = null;
  if (has_casualties && casualty_count > 0) {
    try {
      const injuryType = casualty_injury_type || ct.default_injury || 'trauma';
      const ambSeverity = Math.min(7, severity);

      // Use same routeResult (dijkstra from crime location)
      const hospitals = readTable('hospitals');
      const hospitalItems = hospitals
        .map((h) => {
          const distance = routeResult.distances[h.map_node_id];
          const pathArr = reconstructPath(routeResult.prev, origin, h.map_node_id);
          return {
            ...h,
            nodeId: h.map_node_id,
            path: pathArr,
            distance: Number.isFinite(distance) ? roundDistance(distance) : Infinity,
            weight: Math.ceil(distance || 0),
            value: ((h.beds_available || 0) * 2) + ((h.icu_beds_available || 0) * 5) + ((h.ambulances_available || 0) * 3),
          };
        })
        .filter((h) => Number.isFinite(h.distance) && h.path.length > 0);

      if (hospitalItems.length > 0) {
        const knapsackResult = runKnapsack(hospitalItems, 20);
        const selectedHospital = selectBestKnapsackItem(hospitalItems, knapsackResult.selected_ids || []);

        if (selectedHospital) {
          // Write ambulance incident
          const ambIncident = insertRow('incidents', {
            type: 'ambulance',
            location_name: locationName,
            map_node_id: origin,
            severity: ambSeverity,
            priority_score: Math.min(10, ambSeverity + 2),
            route: selectedHospital.path,
            route_distance_km: selectedHospital.distance,
            eta: `${Math.max(2, Math.round(selectedHospital.distance * 1.5))} min`,
            hospital_id: selectedHospital.map_node_id,
            hospital_name: selectedHospital.name,
            algorithm_used: 'C++ Dijkstra + Knapsack (auto-linked from police)',
            status: 'dispatched',
            linked_crime_id: crimeRow.id,
          });

          // Decrement hospital beds
          const ward = ambSeverity >= 7 ? 'icu' : 'general';
          const bedPatch = ward === 'icu'
            ? { icu_beds_available: Math.max(0, (selectedHospital.icu_beds_available || 1) - 1), beds_available: Math.max(0, (selectedHospital.beds_available || 1) - 1) }
            : { beds_available: Math.max(0, (selectedHospital.beds_available || 1) - 1) };
          updateRow('hospitals', selectedHospital.id, bedPatch);

          // Create patient records
          const injuryInfo = INJURY_TYPES[injuryType] || INJURY_TYPES.other;
          for (let ci = 0; ci < Math.min(casualty_count, 5); ci++) {
            insertRow('patients', {
              hospital_id: selectedHospital.map_node_id,
              name: `Casualty #${Date.now().toString().slice(-4)}-${ci + 1}`,
              injury_type: injuryType,
              severity: ambSeverity,
              resource_weight: injuryInfo.resource_weight,
              ward,
              status: 'admitted',
              days_admitted: 0,
              healing_duration: injuryInfo.healing_days,
              admitted_at: now,
              incident_id: ambIncident.id,
              linked_crime_id: crimeRow.id,
            });
          }

          // Update crime with linked ambulance ID
          updateRow('crime_queue', crimeRow.id, {
            linked_ambulance_incident_id: ambIncident.id,
          });

          // Run ward knapsack
          try {
            const currentHospital = readTable('hospitals').find((h) => h.id === selectedHospital.id);
            if (currentHospital) {
              const patients = readTable('patients').filter(
                (p) => p.hospital_id === selectedHospital.map_node_id && p.status !== 'discharged'
              );
              if (patients.length > 0) {
                const resourceCap = (currentHospital.icu_beds_total || 16) * 2;
                runWardKnapsack(patients, resourceCap);
              }
            }
          } catch (e) {
            console.error('[POLICE] Ward knapsack after ambulance link failed:', e.message);
          }

          ambulanceDispatch = {
            incident_id: ambIncident.id,
            hospital: selectedHospital,
            route: selectedHospital.path,
            totalDistance: selectedHospital.distance,
            eta: `${Math.max(2, Math.round(selectedHospital.distance * 1.5))} min`,
            casualties: casualty_count,
            injury_type: injuryType,
            ward,
          };
        }
      }
    } catch (err) {
      console.error('[POLICE] Linked ambulance dispatch failed:', err.message);
    }
  }

  // 8. Build response
  const route = bestStation.path ? [...bestStation.path].reverse() : [];

  res.json({
    priorityScore: priorityResult.priority_score,
    assignedStation: bestStation,
    assignedUnits: assignedUnits,
    route,
    totalDistance: bestStation.distance,
    crimeQueue: queueResult,
    crimeId: crimeRow.id,
    slaCritical: (priorityResult.priority_score || 0) >= 8,
    slaTargetMinutes: ct.sla_minutes,
    ambulanceDispatch,
    dijkstraSteps,
    allStations: orderedStations,
    algorithms: {
      route: routeResult.engine,
      sorting: sortingResult.engine,
      priority: priorityResult.engine,
      queue: queueResult.engine || 'cpp',
    },
  });
});

// ─── Start Server ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('\n  Smart City Management C++ Dispatch Server');
  console.log(`  Running on http://localhost:${PORT}`);
  console.log('  Endpoints:');
  console.log('     POST /api/ambulance-dispatch');
  console.log('     POST /api/fire-dispatch');
  console.log('     POST /api/police-dispatch');
  console.log('     POST /api/ward-knapsack');
  console.log('     POST /api/healing-tick');
  console.log('     POST /api/crime-queue/insert');
  console.log('     POST /api/crime-queue/resolve/:crimeId');
  console.log('     GET  /api/crime-queue');
  console.log('     GET  /api/crime-types');
  console.log('     GET  /api/db/:table');
  console.log('     POST /api/db/:table');
  console.log('     PATCH /api/db/:table/:id');
  console.log('     GET  /api/injury-types');
  console.log('     GET  /api/cpp-status');
  console.log('     GET  /api/health\n');
});
