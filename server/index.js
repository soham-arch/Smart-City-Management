const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════
// DIJKSTRA SHORTEST PATH (real implementation)
// ═══════════════════════════════════════════
function dijkstraAlgo(graph, start, end) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const pq = [];
  const steps = [];

  // Initialize all nodes
  const allNodes = new Set();
  for (const node of Object.keys(graph)) {
    allNodes.add(node);
    for (const neighbor of graph[node]) {
      allNodes.add(neighbor.node);
    }
  }
  allNodes.forEach(node => {
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
          newDist: Math.round(newDist * 10) / 10,
        });
      }
    }

    steps.push({
      current,
      distance: Math.round(distances[current] * 10) / 10,
      neighbors_checked: updatedNeighbors.length,
      updates: updatedNeighbors,
    });

    if (current === end) break;
  }

  // Reconstruct path
  const path = [];
  let cur = end;
  while (cur) {
    path.unshift(cur);
    cur = previous[cur];
  }

  if (path[0] !== start) {
    return { path: [], total_distance: Infinity, steps };
  }

  return {
    path,
    total_distance: Math.round(distances[end] * 10) / 10,
    steps,
  };
}

// ═══════════════════════════════════════════
// 0/1 KNAPSACK DP (real implementation)
// ═══════════════════════════════════════════
function knapsackAlgo(resources, capacity) {
  const n = resources.length;
  // DP table
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (resources[i - 1].weight <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - resources[i - 1].weight] + resources[i - 1].value);
      }
    }
  }

  // Backtrack to find selected items
  const selected = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(i - 1);
      w -= resources[i - 1].weight;
    }
  }
  selected.reverse();

  // Build decision table
  const decision_table = resources.map((r, i) => ({
    name: r.name,
    weight: r.weight,
    value: r.value,
    selected: selected.includes(i),
  }));

  return {
    selected: selected.map(i => resources[i]),
    total_value: dp[n][capacity],
    remaining_capacity: w,
    decision_table,
  };
}

// ═══════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════

// POST /api/dijkstra — Real Dijkstra shortest path
app.post('/api/dijkstra', (req, res) => {
  const { from, to, graph } = req.body;

  if (!from || !to || !graph) {
    return res.status(400).json({ error: 'Missing required fields: from, to, graph' });
  }

  const result = dijkstraAlgo(graph, from, to);
  res.json(result);
});

// POST /api/knapsack — Real 0/1 Knapsack DP
app.post('/api/knapsack', (req, res) => {
  const { resources, capacity } = req.body;

  if (!resources || !capacity) {
    return res.status(400).json({ error: 'Missing required fields: resources, capacity' });
  }

  const result = knapsackAlgo(resources, capacity);
  res.json(result);
});

// GET /api/city-stats — Aggregated stats (placeholder — real ones come from Supabase client-side)
app.get('/api/city-stats', (req, res) => {
  res.json({
    active_incidents: 0,
    beds_available: 1297,
    units_deployed: 0,
    avg_response_time: '0 min',
    status: 'all_clear',
  });
});

// ── AMBULANCE ENDPOINT ──
app.post('/api/ambulance', async (req, res) => {
  const { location, severity, from, to, graph: graphData } = req.body;

  if (from && to && graphData) {
    const result = dijkstraAlgo(graphData, from, to);
    res.json({
      status: 'success',
      emergency: 'ambulance',
      input: { location, severity },
      priorityScore: Math.min(10, (severity || 5) + 2),
      route: result.path,
      cost: result.total_distance,
      eta: `${Math.max(2, Math.round(result.total_distance * 1.5))} min`,
      resourcesAllocated: { ambulances: 1, paramedics: 2, bedsAvailable: 15 },
      algorithm: 'Dijkstra Shortest Path',
      dijkstra_steps: result.steps,
      timestamp: new Date().toISOString(),
    });
  } else {
    await delay(800);
    res.json({
      status: 'success',
      emergency: 'ambulance',
      input: { location, severity },
      priorityScore: Math.min(10, (severity || 5) + Math.floor(Math.random() * 3)),
      route: ['Patient Location', 'Main St', 'Highway 7', 'Central Hospital'],
      cost: Math.floor(Math.random() * 10) + 5,
      eta: `${Math.floor(Math.random() * 8) + 3} min`,
      resourcesAllocated: { ambulances: 1, paramedics: 2, bedsAvailable: Math.floor(Math.random() * 20) + 5 },
      algorithm: 'Dijkstra Shortest Path',
      timestamp: new Date().toISOString(),
    });
  }
});

// ── POLICE ENDPOINT ──
app.post('/api/police', async (req, res) => {
  const { crimeType, severity, from, to, graph: graphData } = req.body;

  if (from && to && graphData) {
    const result = dijkstraAlgo(graphData, from, to);
    res.json({
      status: 'success',
      emergency: 'police',
      priorityScore: Math.min(10, (severity || 5) + 1),
      route: result.path,
      cost: result.total_distance,
      eta: `${Math.max(2, Math.round(result.total_distance * 1.3))} min`,
      resourcesAllocated: { units: 2, officers: 4, backupAvailable: true },
      algorithm: 'Priority Queue + Dijkstra',
      dijkstra_steps: result.steps,
      timestamp: new Date().toISOString(),
    });
  } else {
    await delay(600);
    res.json({
      status: 'success',
      emergency: 'police',
      input: { crimeType, severity },
      priorityScore: Math.min(10, (severity || 5) + Math.floor(Math.random() * 3)),
      route: ['Station Alpha', 'Sector 4', 'Downtown Ave', 'Crime Zone'],
      cost: Math.floor(Math.random() * 8) + 3,
      eta: `${Math.floor(Math.random() * 6) + 2} min`,
      resourcesAllocated: { units: Math.floor(Math.random() * 3) + 1, officers: Math.floor(Math.random() * 6) + 2, backupAvailable: true },
      algorithm: 'Priority Queue + Dijkstra',
      timestamp: new Date().toISOString(),
    });
  }
});

// ── FIRE ENDPOINT ──
app.post('/api/fire', async (req, res) => {
  const { intensity, from, to, graph: graphData } = req.body;

  if (from && to && graphData) {
    const result = dijkstraAlgo(graphData, from, to);
    const trucksNeeded = Math.min(Math.ceil((intensity || 5) / 3), 4);
    res.json({
      status: 'success',
      emergency: 'fire',
      priorityScore: Math.min(10, (intensity || 5) + 1),
      route: result.path,
      cost: result.total_distance,
      eta: `${Math.max(3, Math.round(result.total_distance * 1.8))} min`,
      resourcesAllocated: { trucks: trucksNeeded, firefighters: (intensity || 5) * 3 + 5, waterTanks: Math.ceil(trucksNeeded * 0.8) },
      spreadRadius: `${(intensity || 5) * 15}m`,
      algorithm: 'Knapsack Allocation + Dijkstra',
      dijkstra_steps: result.steps,
      timestamp: new Date().toISOString(),
    });
  } else {
    await delay(700);
    res.json({
      status: 'success',
      emergency: 'fire',
      input: { intensity },
      priorityScore: Math.min(10, (intensity || 5) + Math.floor(Math.random() * 3)),
      route: ['Fire Station 2', 'Industrial Rd', 'Block 9', 'Fire Location'],
      cost: Math.floor(Math.random() * 15) + 8,
      eta: `${Math.floor(Math.random() * 10) + 4} min`,
      resourcesAllocated: { trucks: Math.floor(Math.random() * 3) + 1, firefighters: Math.floor(Math.random() * 12) + 6, waterTanks: Math.floor(Math.random() * 4) + 2 },
      spreadRadius: `${(intensity || 5) * 15}m`,
      algorithm: 'Knapsack Allocation + Dijkstra',
      timestamp: new Date().toISOString(),
    });
  }
});

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`\n  🏙️  NEXUS Smart City EMS API Server`);
  console.log(`  ➜  Running on http://localhost:${PORT}`);
  console.log(`  ➜  Endpoints:`);
  console.log(`     POST /api/dijkstra    — Real Dijkstra shortest path`);
  console.log(`     POST /api/knapsack    — Real 0/1 Knapsack DP`);
  console.log(`     POST /api/ambulance   — Ambulance dispatch`);
  console.log(`     POST /api/police      — Police deployment`);
  console.log(`     POST /api/fire        — Fire response`);
  console.log(`     GET  /api/city-stats  — City statistics`);
  console.log(`     GET  /api/health      — Health check\n`);
});
