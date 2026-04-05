// Pune road network edges with distances
// Each edge connects two map_node IDs with a distance in km

export const puneEdges = [
  { from: 'bhumgaon', to: 'bavdhan', distance_km: 2.1, road: 'Bhumgaon-Bavdhan Rd' },
  { from: 'bavdhan', to: 'mumbai_highway', distance_km: 3.4, road: 'Mumbai-Bangalore Hwy' },
  { from: 'bavdhan', to: 'paud_road', distance_km: 4.2, road: 'Paud Road' },
  { from: 'paud_road', to: 'paud_rd_junction', distance_km: 1.8, road: 'Paud Road' },
  { from: 'paud_rd_junction', to: 'chandni_chowk', distance_km: 1.2, road: 'Paud Road' },
  { from: 'paud_rd_junction', to: 'lavale', distance_km: 3.5, road: 'Lavale Road' },
  { from: 'chandni_chowk', to: 'kothrud_depot', distance_km: 2.3, road: 'Kothrud Main Road' },
  { from: 'chandni_chowk', to: 'symbiosis_jn', distance_km: 2.8, road: 'Chandni Chowk Road' },
  { from: 'kothrud_depot', to: 'karve_nagar', distance_km: 1.4, road: 'Karve Road' },
  { from: 'kothrud_depot', to: 'sahyadri_kothrud', distance_km: 0.6, road: 'Kothrud Road' },
  { from: 'karve_nagar', to: 'warje', distance_km: 2.2, road: 'Warje Road' },
  { from: 'karve_nagar', to: 'karve_road', distance_km: 1.1, road: 'Karve Road' },
  { from: 'karve_road', to: 'erandwane', distance_km: 1.5, road: 'Karve Road' },
  { from: 'karve_road', to: 'deccan', distance_km: 2.0, road: 'Karve Road' },
  { from: 'karve_road', to: 'swargate', distance_km: 3.2, road: 'Satara Road' },
  { from: 'erandwane', to: 'deenanath', distance_km: 0.5, road: 'Erandwane Road' },
  { from: 'erandwane', to: 'deccan', distance_km: 1.3, road: 'Law College Road' },
  { from: 'deccan', to: 'shivajinagar', distance_km: 2.1, road: 'Jangli Maharaj Road' },
  { from: 'deccan', to: 'university_road', distance_km: 1.6, road: 'University Road' },
  { from: 'shivajinagar', to: 'ruby_hall', distance_km: 0.8, road: 'Sassoon Road' },
  { from: 'shivajinagar', to: 'university_road', distance_km: 1.2, road: 'University Road' },
  { from: 'university_road', to: 'baner', distance_km: 4.0, road: 'Baner Road' },
  { from: 'baner', to: 'jupiter_baner', distance_km: 0.4, road: 'Baner Road' },
  { from: 'baner', to: 'lavale', distance_km: 3.2, road: 'Lavale-Baner Road' },
  { from: 'symbiosis_jn', to: 'baner', distance_km: 3.8, road: 'Symbiosis Road' },
  { from: 'symbiosis_jn', to: 'deenanath', distance_km: 3.1, road: 'Karve Road' },
  { from: 'swargate', to: 'kem_hospital', distance_km: 2.4, road: 'Nana Peth Road' },
  { from: 'swargate', to: 'katraj', distance_km: 4.5, road: 'Satara Road' },
  { from: 'swargate', to: 'jehangir', distance_km: 2.1, road: 'Sassoon Road' },
  { from: 'katraj', to: 'hadapsar', distance_km: 7.2, road: 'Katraj-Hadapsar Bypass' },
  { from: 'hadapsar', to: 'noble_hadapsar', distance_km: 0.5, road: 'Hadapsar Road' },
  { from: 'kem_hospital', to: 'jehangir', distance_km: 1.8, road: 'Sassoon Road' },
  { from: 'kem_hospital', to: 'poona_hospital', distance_km: 2.0, road: 'Sadashiv Peth Road' },
  { from: 'mumbai_highway', to: 'aditya_birla', distance_km: 5.1, road: 'Mumbai-Bangalore Hwy' },
  { from: 'lavale', to: 'symbiosis_hospital', distance_km: 1.2, road: 'Lavale Road' },
  { from: 'warje', to: 'swargate', distance_km: 4.8, road: 'Warje-Swargate Road' },

  // ── Police Station Edges ──
  { from: 'kothrud_ps', to: 'kothrud_depot', distance_km: 0.5, road: 'Kothrud Local' },
  { from: 'deccan_ps', to: 'deccan', distance_km: 0.3, road: 'Deccan Local' },
  { from: 'swargate_ps', to: 'swargate', distance_km: 0.4, road: 'Swargate Local' },
  { from: 'shivajinagar_ps', to: 'shivajinagar', distance_km: 0.6, road: 'Shivajinagar Local' },
  { from: 'warje_ps', to: 'warje', distance_km: 0.5, road: 'Warje Local' },
  { from: 'chandni_ps', to: 'chandni_chowk', distance_km: 0.2, road: 'Chandni Local' },
  { from: 'bavdhan_ps', to: 'bavdhan', distance_km: 0.4, road: 'Bavdhan Local' },
  { from: 'katraj_ps', to: 'katraj', distance_km: 0.3, road: 'Katraj Local' },
  { from: 'hadapsar_ps', to: 'hadapsar', distance_km: 0.5, road: 'Hadapsar Local' },
  { from: 'karvenagar_ps', to: 'karve_nagar', distance_km: 0.4, road: 'Karvenagar Local' },

  // ── Fire Station Edges ──
  { from: 'karvenagar_fs', to: 'karve_nagar', distance_km: 0.6, road: 'Karvenagar Local' },
  { from: 'kothrud_fs', to: 'kothrud_depot', distance_km: 0.5, road: 'Kothrud Local' },
  { from: 'swargate_fs', to: 'swargate', distance_km: 0.4, road: 'Swargate Local' },
  { from: 'shivajinagar_fs', to: 'shivajinagar', distance_km: 0.5, road: 'Shivajinagar Local' },
  { from: 'hadapsar_fs', to: 'hadapsar', distance_km: 0.7, road: 'Hadapsar Local' },
  { from: 'baner_fs', to: 'baner', distance_km: 0.8, road: 'Baner Local' },
  { from: 'katraj_fs', to: 'katraj', distance_km: 0.5, road: 'Katraj Local' },
];

/**
 * Build an adjacency list graph from edges for Dijkstra
 */
export function buildGraph(edges) {
  const graph = {};
  edges.forEach(edge => {
    if (!graph[edge.from]) graph[edge.from] = [];
    if (!graph[edge.to]) graph[edge.to] = [];
    graph[edge.from].push({ node: edge.to, weight: edge.distance_km });
    graph[edge.to].push({ node: edge.from, weight: edge.distance_km });
  });
  return graph;
}

/**
 * Client-side Dijkstra shortest path (for preview before API call)
 */
export function dijkstra(graph, start, end) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const pq = []; // simple priority queue

  // Initialize
  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
  });
  distances[start] = 0;
  pq.push({ node: start, dist: 0 });

  while (pq.length > 0) {
    // Get minimum distance node
    pq.sort((a, b) => a.dist - b.dist);
    const { node: current } = pq.shift();

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === end) break;

    if (!graph[current]) continue;

    for (const neighbor of graph[current]) {
      if (visited.has(neighbor.node)) continue;
      const newDist = distances[current] + neighbor.weight;
      if (newDist < distances[neighbor.node]) {
        distances[neighbor.node] = newDist;
        previous[neighbor.node] = current;
        pq.push({ node: neighbor.node, dist: newDist });
      }
    }
  }

  // Reconstruct path
  const path = [];
  let current = end;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  if (path[0] !== start) return { path: [], totalDistance: Infinity };

  return {
    path,
    totalDistance: Math.round(distances[end] * 10) / 10,
  };
}

export default puneEdges;
