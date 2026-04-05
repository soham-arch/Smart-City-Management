import { dijkstraAll } from './dijkstra';

/**
 * Ambulance Dispatch — Automatic Hospital Selection
 * 
 * Step 1: Dijkstra from incident to ALL hospitals
 * Step 2: 0/1 Knapsack to select optimal hospital (maximizes resource value within distance budget)
 * Step 3: Return selected hospital with path, distance, and resource details
 */
export function selectOptimalHospital(incidentNodeId, hospitals, graph) {
  // Step 1: Dijkstra from incident to all nodes
  const { getPath } = dijkstraAll(graph, incidentNodeId);

  // Build items for knapsack: each hospital is an item
  const items = hospitals
    .map(h => {
      const result = getPath(h.map_node_id);
      return {
        id: h.id,
        nodeId: h.map_node_id,
        name: h.name || h.map_node_id,
        weight: Math.ceil(result.distance),
        value: ((h.beds_available || 0) * 2) + ((h.icu_beds_available || 0) * 5) + ((h.ambulances_available || 0) * 3),
        path: result.path,
        distance: result.distance,
        beds_available: h.beds_available || 0,
        icu_beds_available: h.icu_beds_available || 0,
        ambulances_available: h.ambulances_available || 0,
      };
    })
    .filter(item => item.distance < 999 && item.path.length > 0);

  if (items.length === 0) return null;

  // Step 2: 0/1 Knapsack
  const capacity = 20;
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

  // Traceback — select the best single hospital
  let w = capacity;
  let selected = null;
  for (let i = n; i >= 1; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected = items[i - 1];
      break; // take only the best single hospital
    }
  }

  // Fallback: if knapsack didn't select any (all weights > capacity), pick highest value
  if (!selected) {
    selected = items.sort((a, b) => b.value - a.value)[0];
  }

  return {
    hospital: selected,
    reason: `Best resource score: ${selected.value} — ${selected.beds_available} beds, ${selected.icu_beds_available} ICU available`,
    allHospitals: items,
  };
}

export default selectOptimalHospital;
