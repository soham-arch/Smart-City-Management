/**
 * Client-side Dijkstra — runs from a source to ALL reachable nodes.
 * Returns distances and paths to every node (not just one target).
 */
export function dijkstraAll(graph, start) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const pq = [];
  const steps = [];

  Object.keys(graph).forEach(node => {
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
          newDist: Math.round(newDist * 10) / 10,
        });
      }
    }

    steps.push({
      current,
      distance: Math.round(distances[current] * 10) / 10,
      neighbors: updatedNeighbors,
    });
  }

  // Reconstruct path to any target
  function getPath(target) {
    const path = [];
    let cur = target;
    while (cur) {
      path.unshift(cur);
      cur = previous[cur];
    }
    if (path[0] !== start) return { path: [], distance: Infinity };
    return {
      path,
      distance: Math.round(distances[target] * 10) / 10,
    };
  }

  return { distances, previous, steps, getPath };
}

/**
 * Dijkstra from source to a single target (shortcut).
 */
export function dijkstraSingle(graph, start, end) {
  const { getPath, steps } = dijkstraAll(graph, start);
  const result = getPath(end);
  return { ...result, steps };
}

export default dijkstraAll;
