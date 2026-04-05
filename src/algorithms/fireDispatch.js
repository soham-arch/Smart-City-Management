import { dijkstraAll } from './dijkstra';

/**
 * Fire Dispatch — Automatic Station Selection via Knapsack
 * 
 * Step 1: Dijkstra from fire location to ALL fire stations
 * Step 2: 0/1 Knapsack to select optimal station (resource value within intensity-scaled budget)
 * Step 3: Compute resources needed based on intensity + building type
 */
export function selectOptimalFireStation(fireNodeId, fireStations, graph, intensity = 5) {
  // Step 1: Dijkstra from fire location to all nodes
  const { getPath } = dijkstraAll(graph, fireNodeId);

  // Build items for knapsack
  const items = fireStations
    .map(fs => {
      const result = getPath(fs.map_node_id);
      return {
        id: fs.id,
        nodeId: fs.map_node_id,
        name: fs.name || fs.map_node_id,
        weight: Math.ceil(result.distance),
        value: ((fs.trucks_available || 0) * 4) + ((fs.firefighters_on_duty || 0) * 1) + ((fs.water_tankers_available || 0) * 3),
        path: result.path,
        distance: result.distance,
        trucks_available: fs.trucks_available || 0,
        firefighters_on_duty: fs.firefighters_on_duty || 0,
        water_tankers_available: fs.water_tankers_available || 0,
      };
    })
    .filter(item => item.distance < 999 && item.path.length > 0);

  if (items.length === 0) return null;

  // Step 2: 0/1 Knapsack — capacity scales with fire intensity
  const capacity = (intensity * 2) + 10;
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (items[i - 1].weight <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - items[i - 1].weight] + items[i - 1].value);
      }
    }
  }

  // Traceback — select the best single station
  let w = capacity;
  let selected = null;
  for (let i = n; i >= 1; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected = items[i - 1];
      break;
    }
  }

  // Fallback
  if (!selected) {
    selected = items.sort((a, b) => b.value - a.value)[0];
  }

  return {
    station: selected,
    reason: `Optimal resource score: trucks×${selected.trucks_available} + tankers×${selected.water_tankers_available}`,
    allStations: items,
  };
}

/**
 * Compute fire resources needed based on intensity and building type.
 */
export function computeFireResources(intensity, buildingType) {
  let trucks, firefighters, tankers;

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
    // Intensity 10 — max everything
    trucks = 5;
    firefighters = 25;
    tankers = 5;
  }

  // Building type modifier
  if (buildingType === 'industrial' || buildingType === 'commercial') {
    trucks = Math.ceil(trucks * 1.3);
    firefighters = Math.ceil(firefighters * 1.2);
    tankers = Math.ceil(tankers * 1.3);
  }

  return { trucks, firefighters, tankers, spreadRadius: intensity * 15 };
}

export default selectOptimalFireStation;
