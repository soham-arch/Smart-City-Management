# NEXUS 🏙️
A Smart City Emergency Management System that simulates real-time emergency dispatch across Pune's Kothrud area using classical DAA algorithms.

## Features
- 🚑 **Ambulance Dispatch** - Dijkstra-powered shortest path routing with 0/1 Knapsack-based ICU bed allocation
- 🚔 **Police Dispatch** - Crime priority queue using max-heap with SLA breach tracking
- 🔥 **Fire Response** - Resource-optimal unit dispatching across fire stations
- 📊 **Hospital Dashboard** - Live ICU/general ward bed status with patient lifecycle simulation
- 🗺️ **Interactive Map** - Custom SVG of Pune's Kothrud area with real location nodes and road edges
- ⚙️ **C++ Algorithm Core** - All DAA logic runs in compiled C++ binaries bridged via Node.js

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS + Three.js (particle animations)
- **Backend**: Node.js + Express (port 3001)
- **Database**: Local JSONL file-based system via Node.js `fs` module
- **Algorithms**: C++ binaries (Dijkstra, 0/1 Knapsack, Priority Queue, Sorting)
- **Map**: Custom SVG — Kothrud, Pune

## Algorithms Implemented
| Algorithm | Module | Purpose |
|---|---|---|
| Dijkstra's Shortest Path | All services | Optimal route from station to incident |
| 0/1 Knapsack (DP) | Ambulance / Hospital | ICU bed allocation by injury type & severity |
| Max-Heap Priority Queue | Police | Crime priority scoring with time-bonus |
| Merge / Quick Sort | All | Unit ranking by availability and proximity |

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/soham-arch/Smart-City-Management.git
cd Smart-City-Management
git checkout v2
```

### 2. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Compile C++ binaries
```bash
cd server/algorithms

g++ -O2 -o dijkstra dijkstra.cpp
g++ -O2 -o ward_knapsack ward_knapsack.cpp
g++ -O2 -o crime_priority_queue crime_priority_queue.cpp
```

### 4. Configure environment variables

**Server** (`server/.env`):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
```

> No external API keys required — the system runs fully offline with local file storage.

### 5. Run the application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure
```
Smart-City-Management/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # AmbulancePage, PolicePage, FirePage, HospitalPage
│   │   ├── components/      # Map SVG, dispatch panels, algorithm visualizers
│   │   └── hooks/           # usePolling, useDispatch
├── server/                  # Node.js + Express backend
│   ├── algorithms/          # C++ source files + compiled binaries
│   ├── db/                  # JSONL file-based database (incidents, hospitals, units)
│   └── routes/              # REST API endpoints per emergency service
```

## How It Works

1. **Incident Reported** — User selects an incident location on the Kothrud SVG map
2. **Dijkstra Runs** — C++ binary finds the shortest path from nearest available unit
3. **Resources Allocated** — Knapsack DP assigns ICU beds (ambulance) or heap scores priority (police)
4. **Dispatch Visualized** — Step-by-step animation shows algorithm execution in the UI
5. **State Persisted** — Incident and bed status written to local JSONL files

## DAA Course Alignment

This project was built as part of a Design and Analysis of Algorithms (DAA) course. Every algorithm is implemented from scratch in C++ and directly drives the simulation logic — not used as a black box.

- Dijkstra: `O((V + E) log V)` with binary heap
- 0/1 Knapsack: `O(n × W)` DP table, displayed step-by-step in UI
- Max-Heap: custom implementation, not STL `priority_queue`
- Sorting: merge sort for unit ranking, quick sort for incident history

## Disclaimer

NEXUS is an academic simulation project. It does not represent real emergency infrastructure and should not be used for actual emergency response.

## License
MIT
