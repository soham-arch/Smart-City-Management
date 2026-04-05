import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import AnimatedCounter from '../components/AnimatedCounter';
import ProcessingPipeline from '../components/ProcessingPipeline';
import { puneNodes, incidentNodes } from '../data/puneNodes';
import { puneEdges, buildGraph, dijkstra } from '../data/puneEdges';
import supabase from '../lib/supabase';
import axios from 'axios';

const SimulationPage = () => {
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simResults, setSimResults] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [dijkstraSteps, setDijkstraSteps] = useState([]);
  const [currentDijkstraStep, setCurrentDijkstraStep] = useState(-1);
  const [knapsackTable, setKnapsackTable] = useState([]);
  const [speed, setSpeed] = useState('normal');

  // For full city simulation
  const [fullSimRunning, setFullSimRunning] = useState(false);
  const [fullSimPaths, setFullSimPaths] = useState({ ambulance: [], police: [], fire: [] });
  const [fullSimResults, setFullSimResults] = useState(null);

  const graph = useMemo(() => buildGraph(puneEdges), []);

  const speedMs = speed === 'slow' ? 800 : speed === 'fast' ? 100 : 400;

  // Run Dijkstra step-by-step visualization
  const runDijkstraVisualization = async (from, to) => {
    const distances = {};
    const previous = {};
    const visited = new Set();
    const pq = [];
    const steps = [];

    Object.keys(graph).forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
    });
    distances[from] = 0;
    pq.push({ node: from, dist: 0 });

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
            label: puneNodes.find(n => n.id === neighbor.node)?.label || neighbor.node,
            oldDist: 'INF',
            newDist: Math.round(newDist * 10) / 10,
          });
        }
      }

      steps.push({
        current,
        currentLabel: puneNodes.find(n => n.id === current)?.label || current,
        distance: Math.round(distances[current] * 10) / 10,
        neighbors: updatedNeighbors,
      });

      if (current === to) break;
    }

    // Reconstruct path
    const path = [];
    let cur = to;
    while (cur) { path.unshift(cur); cur = previous[cur]; }

    return { steps, path, totalDistance: Math.round(distances[to] * 10) / 10 };
  };

  // Run the simulation
  const handleRunSimulation = async () => {
    setSimRunning(true);
    setSimStep(0);
    setSimResults(null);
    setDijkstraSteps([]);
    setCurrentDijkstraStep(-1);
    setKnapsackTable([]);
    setActivePath([]);

    // Pick random from/to
    const from = incidentNodes[Math.floor(Math.random() * incidentNodes.length)].id;
    const hospitalNodes = puneNodes.filter(n => n.type === 'hospital');
    const to = hospitalNodes[Math.floor(Math.random() * hospitalNodes.length)].id;

    // Step 1: Priority Queue
    setSimStep(1);
    await new Promise(r => setTimeout(r, speedMs));

    // Step 2: Resource Sorting
    setSimStep(2);
    await new Promise(r => setTimeout(r, speedMs));

    // Step 3: Knapsack
    setSimStep(3);
    // Generate knapsack table
    const resources = [
      { name: 'Ambulance A', weight: 2, value: 9 },
      { name: 'Ambulance B', weight: 2, value: 7 },
      { name: 'Ambulance C', weight: 3, value: 6 },
      { name: 'Paramedic Team 1', weight: 1, value: 8 },
      { name: 'Paramedic Team 2', weight: 1, value: 5 },
      { name: 'ICU Van', weight: 4, value: 10 },
    ];
    const capacity = 8;

    // Solve knapsack
    const n = resources.length;
    const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= capacity; w++) {
        dp[i][w] = dp[i - 1][w];
        if (resources[i - 1].weight <= w) {
          dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - resources[i - 1].weight] + resources[i - 1].value);
        }
      }
    }
    // Backtrack
    const selected = [];
    let w = capacity;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selected.push(i - 1);
        w -= resources[i - 1].weight;
      }
    }
    const kTable = resources.map((r, i) => ({
      ...r,
      selected: selected.includes(i),
    }));
    setKnapsackTable(kTable);
    await new Promise(r => setTimeout(r, speedMs));

    // Step 4: Dijkstra
    setSimStep(4);
    const result = await runDijkstraVisualization(from, to);
    setDijkstraSteps(result.steps);

    // Animate through steps
    for (let i = 0; i < result.steps.length; i++) {
      setCurrentDijkstraStep(i);
      // Build partial path to current node
      const partial = result.path.slice(0, result.path.indexOf(result.steps[i].current) + 1);
      setActivePath(partial.length > 0 ? partial : [result.steps[i].current]);
      await new Promise(r => setTimeout(r, speedMs));
    }

    setActivePath(result.path);
    setSimResults({
      from: puneNodes.find(n => n.id === from)?.label || from,
      to: puneNodes.find(n => n.id === to)?.label || to,
      path: result.path.map(id => puneNodes.find(n => n.id === id)?.label || id),
      totalDistance: result.totalDistance,
      totalSteps: result.steps.length,
      knapsackValue: dp[n][capacity],
    });

    setSimRunning(false);
  };

  // Full city simulation
  const handleFullSimulation = async () => {
    setFullSimRunning(true);
    setFullSimResults(null);

    const randomIncident = () => incidentNodes[Math.floor(Math.random() * incidentNodes.length)].id;
    const randomHospital = () => puneNodes.filter(n => n.type === 'hospital')[Math.floor(Math.random() * 10)].id;
    const randomPS = () => puneNodes.filter(n => n.type === 'police_station')[Math.floor(Math.random() * 10)].id;
    const randomFS = () => puneNodes.filter(n => n.type === 'fire_station')[Math.floor(Math.random() * 7)].id;

    const ambFrom = randomIncident(), ambTo = randomHospital();
    const polFrom = randomIncident(), polTo = randomPS();
    const fireFrom = randomIncident(), fireTo = randomFS();

    const [ambResult, polResult, fireResult] = await Promise.all([
      dijkstra(graph, ambFrom, ambTo),
      dijkstra(graph, polTo, polFrom),
      dijkstra(graph, fireTo, fireFrom),
    ]);

    setFullSimPaths({
      ambulance: ambResult.path,
      police: polResult.path,
      fire: fireResult.path,
    });

    setFullSimResults({
      ambulance: { from: puneNodes.find(n => n.id === ambFrom)?.label, to: puneNodes.find(n => n.id === ambTo)?.label, distance: ambResult.totalDistance },
      police: { from: puneNodes.find(n => n.id === polFrom)?.label, to: puneNodes.find(n => n.id === polTo)?.label, distance: polResult.totalDistance },
      fire: { from: puneNodes.find(n => n.id === fireFrom)?.label, to: puneNodes.find(n => n.id === fireTo)?.label, distance: fireResult.totalDistance },
    });

    // Save to Supabase
    for (const [type, path] of [['ambulance', ambResult], ['police', polResult], ['fire', fireResult]]) {
      await supabase.from('incidents').insert({
        type,
        location_name: 'Simulation',
        severity: Math.floor(Math.random() * 5) + 5,
        priority_score: Math.floor(Math.random() * 3) + 7,
        route: path.path,
        route_distance_km: path.totalDistance,
        eta: `${Math.round(path.totalDistance * 1.5)} min`,
        algorithm_used: 'Full City Simulation',
        status: 'dispatched',
      }).catch(() => {});
    }

    setFullSimRunning(false);
  };

  const simPipelineSteps = [
    { label: 'Priority Queue — Sort emergencies by severity', done: simStep >= 2 },
    { label: 'Resource Sorting — Sort by proximity + availability', done: simStep >= 3 },
    { label: 'Knapsack Allocation — Optimal resource selection', done: simStep >= 4 },
    { label: 'Dijkstra Routing — Path computation', done: simResults !== null },
  ];

  return (
    <section className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            <span className="text-white">Algorithm </span>
            <span className="neon-text">Simulation</span>
          </h1>
          <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
            Visualize Priority Queue, Knapsack Allocation, and Dijkstra Routing step by step
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <NeonButton onClick={handleRunSimulation} variant="neon" loading={simRunning} disabled={simRunning}>
            ▶ Run Simulation
          </NeonButton>
          <NeonButton onClick={handleFullSimulation} variant="blue" loading={fullSimRunning} disabled={fullSimRunning}>
            ⚡ Simulate Full City Emergency
          </NeonButton>
          <div className="flex items-center gap-2 ml-auto">
            {['Slow', 'Normal', 'Fast'].map(s => (
              <button key={s} onClick={() => setSpeed(s.toLowerCase())}
                style={{
                  padding: '6px 16px',
                  background: speed === s.toLowerCase() ? 'var(--city-neon)' : 'rgba(255,255,255,0.05)',
                  color: speed === s.toLowerCase() ? '#050510' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${speed === s.toLowerCase() ? 'var(--city-neon)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '8px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Map */}
          <GlassPanel className="relative overflow-hidden" style={{ minHeight: 450 }}>
            <h3 className="text-sm font-mono text-[#39ff8f] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
              Pune Map — Live Visualization
            </h3>
            <NodeMap
              nodes={puneNodes}
              edges={puneEdges}
              activePath={activePath}
              variant="neon"
              readOnly={true}
              serviceData={{}}
            />
          </GlassPanel>

          {/* Right: Step-by-step */}
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {/* Pipeline */}
            <AnimatePresence mode="wait">
              {simStep > 0 && (
                <GlassPanel>
                  <h3 className="text-sm font-mono text-[#39ff8f] mb-4 uppercase tracking-wider">Pipeline Status</h3>
                  <ProcessingPipeline steps={simPipelineSteps} currentStep={simStep} variant="neon" />
                </GlassPanel>
              )}
            </AnimatePresence>

            {/* Knapsack Decision Table */}
            <AnimatePresence>
              {knapsackTable.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassPanel>
                    <h3 className="text-sm font-mono text-[#39ff8f] mb-3 uppercase tracking-wider">
                      Knapsack Decision Table
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="text-[rgba(255,255,255,0.5)]">
                            <th className="text-left py-2 px-2">Resource</th>
                            <th className="text-center py-2 px-2">Weight</th>
                            <th className="text-center py-2 px-2">Value</th>
                            <th className="text-center py-2 px-2">Selected?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {knapsackTable.map((row, i) => (
                            <motion.tr
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className={`border-t border-white/5 ${row.selected ? 'bg-[#39ff8f]/5' : ''}`}
                            >
                              <td className="py-2 px-2 text-[rgba(255,255,255,0.8)]">{row.name}</td>
                              <td className="py-2 px-2 text-center text-[#ffb800]">{row.weight}</td>
                              <td className="py-2 px-2 text-center text-[#3d8fff]">{row.value}</td>
                              <td className="py-2 px-2 text-center">
                                {row.selected ? (
                                  <span className="text-[#39ff8f]">✓</span>
                                ) : (
                                  <span className="text-[#ff2d55]">✗</span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dijkstra Step-by-Step */}
            <AnimatePresence>
              {dijkstraSteps.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassPanel>
                    <h3 className="text-sm font-mono text-[#39ff8f] mb-3 uppercase tracking-wider">
                      Dijkstra Step-by-Step ({currentDijkstraStep + 1}/{dijkstraSteps.length})
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {dijkstraSteps.slice(0, currentDijkstraStep + 1).map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-2 rounded text-xs font-mono ${i === currentDijkstraStep ? 'bg-[#39ff8f]/10 border border-[#39ff8f]/20' : 'bg-white/5'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#39ff8f] font-bold">→ {step.currentLabel}</span>
                            <span className="text-[rgba(255,255,255,0.3)]">dist: {step.distance}km</span>
                          </div>
                          {step.neighbors.length > 0 && (
                            <div className="mt-1 pl-4 text-[10px] text-[rgba(255,255,255,0.4)]">
                              Updated: {step.neighbors.map(n => `${n.label}(${n.newDist}km)`).join(', ')}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {simResults && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <GlassPanel glow>
                    <h3 className="text-sm font-mono text-[#39ff8f] mb-3 uppercase tracking-wider">Simulation Result</h3>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-[#39ff8f]"><AnimatedCounter value={simResults.totalDistance} suffix=" km" /></div>
                        <div className="text-[10px] font-mono text-[rgba(255,255,255,0.4)]">Total Distance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[#3d8fff]"><AnimatedCounter value={simResults.totalSteps} /></div>
                        <div className="text-[10px] font-mono text-[rgba(255,255,255,0.4)]">Dijkstra Steps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[#ffb800]"><AnimatedCounter value={simResults.knapsackValue} /></div>
                        <div className="text-[10px] font-mono text-[rgba(255,255,255,0.4)]">Knapsack Value</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-[rgba(255,255,255,0.5)]">
                      Route: {simResults.path.join(' → ')}
                    </div>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full City Simulation Results */}
            <AnimatePresence>
              {fullSimResults && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassPanel glow>
                    <h3 className="text-sm font-mono text-[#39ff8f] mb-3 uppercase tracking-wider">
                      🏙️ Full City Emergency Results
                    </h3>
                    {['ambulance', 'police', 'fire'].map((type) => {
                      const r = fullSimResults[type];
                      const colors = { ambulance: '#3d8fff', police: '#ff2d55', fire: '#ffb800' };
                      const icons = { ambulance: '🚑', police: '🚓', fire: '🚒' };
                      return (
                        <div key={type} className="mb-3 p-3 rounded-lg border" style={{ borderColor: `${colors[type]}20`, background: `${colors[type]}05` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{icons[type]}</span>
                            <span className="text-xs font-mono font-semibold uppercase" style={{ color: colors[type] }}>{type}</span>
                            <span className="ml-auto text-xs font-mono" style={{ color: colors[type] }}>{r.distance} km</span>
                          </div>
                          <div className="text-[10px] font-mono text-[rgba(255,255,255,0.4)]">
                            {r.from} → {r.to}
                          </div>
                        </div>
                      );
                    })}
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SimulationPage;
