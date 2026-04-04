const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock delay to simulate processing
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── AMBULANCE ENDPOINT ───
app.post('/api/ambulance', async (req, res) => {
  const { location, severity } = req.body;
  await delay(800);
  res.json({
    status: 'success',
    emergency: 'ambulance',
    input: { location, severity },
    priorityScore: Math.min(10, (severity || 5) + Math.floor(Math.random() * 3)),
    route: ['Patient Location', 'Main St', 'Highway 7', 'Central Hospital'],
    cost: Math.floor(Math.random() * 10) + 5,
    eta: `${Math.floor(Math.random() * 8) + 3} min`,
    resourcesAllocated: {
      ambulances: 1,
      paramedics: 2,
      bedsAvailable: Math.floor(Math.random() * 20) + 5
    },
    algorithm: 'Dijkstra Shortest Path',
    timestamp: new Date().toISOString()
  });
});

// ─── POLICE ENDPOINT ───
app.post('/api/police', async (req, res) => {
  const { crimeType, severity } = req.body;
  await delay(600);
  res.json({
    status: 'success',
    emergency: 'police',
    input: { crimeType, severity },
    priorityScore: Math.min(10, (severity || 5) + Math.floor(Math.random() * 3)),
    route: ['Station Alpha', 'Sector 4', 'Downtown Ave', 'Crime Zone'],
    cost: Math.floor(Math.random() * 8) + 3,
    eta: `${Math.floor(Math.random() * 6) + 2} min`,
    resourcesAllocated: {
      units: Math.floor(Math.random() * 3) + 1,
      officers: Math.floor(Math.random() * 6) + 2,
      backupAvailable: true
    },
    algorithm: 'Priority Queue + Dijkstra',
    timestamp: new Date().toISOString()
  });
});

// ─── FIRE ENDPOINT ───
app.post('/api/fire', async (req, res) => {
  const { intensity } = req.body;
  await delay(700);
  res.json({
    status: 'success',
    emergency: 'fire',
    input: { intensity },
    priorityScore: Math.min(10, (intensity || 5) + Math.floor(Math.random() * 3)),
    route: ['Fire Station 2', 'Industrial Rd', 'Block 9', 'Fire Location'],
    cost: Math.floor(Math.random() * 15) + 8,
    eta: `${Math.floor(Math.random() * 10) + 4} min`,
    resourcesAllocated: {
      trucks: Math.floor(Math.random() * 3) + 1,
      firefighters: Math.floor(Math.random() * 12) + 6,
      waterTanks: Math.floor(Math.random() * 4) + 2
    },
    spreadRadius: `${(intensity || 5) * 15}m`,
    algorithm: 'Knapsack Allocation + Dijkstra',
    timestamp: new Date().toISOString()
  });
});

// ─── HEALTH CHECK ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`\n  🏙️  Smart City EMS API Server`);
  console.log(`  ➜  Running on http://localhost:${PORT}`);
  console.log(`  ➜  Endpoints: /api/ambulance, /api/police, /api/fire\n`);
});
