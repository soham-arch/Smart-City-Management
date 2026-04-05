import { dijkstraAll } from './dijkstra';

/**
 * Police Dispatch — Automatic Station Selection
 * 
 * Step 1: Dijkstra from crime location to ALL police stations
 * Step 2: Filter stations with available units
 * Step 3: Pick nearest available station (speed is priority)
 * Step 4: Compute resource allocation based on severity + crowd size
 */
export function selectNearestPoliceStation(crimeNodeId, policeStations, graph) {
  // Step 1: Dijkstra from crime location to all nodes
  const { getPath } = dijkstraAll(graph, crimeNodeId);

  // Step 2: Build candidates with paths and filter available
  const candidates = policeStations
    .map(ps => {
      const result = getPath(ps.map_node_id);
      return {
        id: ps.id,
        nodeId: ps.map_node_id,
        name: ps.name || ps.map_node_id,
        path: result.path,
        distance: result.distance,
        units_available: ps.units_available || 0,
        officers_on_duty: ps.officers_on_duty || 0,
        vehicles_available: ps.vehicles_available || 0,
      };
    })
    .filter(c => c.distance < 999 && c.path.length > 0 && c.units_available > 0);

  if (candidates.length === 0) {
    // Fallback: try all stations regardless of availability
    const allCandidates = policeStations
      .map(ps => {
        const result = getPath(ps.map_node_id);
        return {
          id: ps.id,
          nodeId: ps.map_node_id,
          name: ps.name || ps.map_node_id,
          path: result.path,
          distance: result.distance,
          units_available: ps.units_available || 0,
          officers_on_duty: ps.officers_on_duty || 0,
          vehicles_available: ps.vehicles_available || 0,
        };
      })
      .filter(c => c.distance < 999 && c.path.length > 0);

    if (allCandidates.length === 0) return null;
    allCandidates.sort((a, b) => a.distance - b.distance);
    return { station: allCandidates[0], allStations: allCandidates };
  }

  // Step 3: Pick nearest
  candidates.sort((a, b) => a.distance - b.distance);
  return {
    station: candidates[0],
    allStations: candidates,
  };
}

/**
 * Compute police resource allocation based on severity and crowd size.
 */
export function computePoliceResources(severity, crowdSize) {
  let vehicles, officers, backup;

  if (severity <= 3) {
    vehicles = 1;
    officers = 2;
    backup = false;
  } else if (severity <= 6) {
    vehicles = 2;
    officers = 4;
    backup = false;
  } else {
    vehicles = Math.min(severity - 4, 5);
    officers = Math.max(6, severity);
    backup = true;
  }

  // Crowd size multiplier
  const crowdMultiplier = crowdSize === 'Large' ? 1.5 : crowdSize === 'Medium' ? 1.2 : 1;
  vehicles = Math.ceil(vehicles * crowdMultiplier);
  officers = Math.ceil(officers * crowdMultiplier);

  return { vehicles, officers, backup };
}

export default selectNearestPoliceStation;
