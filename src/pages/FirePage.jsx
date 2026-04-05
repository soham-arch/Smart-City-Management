import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import ProcessingPipeline from '../components/ProcessingPipeline';
import DispatchResult from '../components/DispatchResult';
import { puneNodes, incidentNodes } from '../data/puneNodes';
import { puneEdges, buildGraph } from '../data/puneEdges';
import { useRealtime } from '../hooks/useRealtime';
import { selectOptimalFireStation, computeFireResources } from '../algorithms/fireDispatch';
import supabase from '../lib/supabase';

const fireTypes = [
  { value: 'structural', label: 'Structural' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'forest', label: 'Forest' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'electrical', label: 'Electrical' },
];

const buildingTypes = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'open', label: 'Open Area' },
];

const FirePage = () => {
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [fireType, setFireType] = useState('structural');
  const [buildingType, setBuildingType] = useState('residential');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0);
  const [showFireRings, setShowFireRings] = useState(false);
  const [autoSelectedStation, setAutoSelectedStation] = useState(null);

  const { data: fireStations } = useRealtime('fire_stations');

  const serviceData = useMemo(() => {
    const map = {};
    fireStations.forEach(f => { map[f.map_node_id] = f; });
    return map;
  }, [fireStations]);

  const graph = useMemo(() => buildGraph(puneEdges), []);

  const spreadRadius = intensity * 15;

  // Node click — only incident nodes as fire location
  const handleNodeClick = (node) => {
    if (node.type === 'incident') {
      setSelectedOrigin(node.id);
    }
    // Fire station clicks just show tooltip (info only, no manual selection)
  };

  // AUTOMATIC DISPATCH — No manual station selection
  const handleDispatch = async () => {
    if (!selectedOrigin) return;

    setLoading(true);
    setStep(1);
    setResult(null);
    setShowVehicle(false);
    setAutoSelectedStation(null);
    setActivePath([]);

    // Step 1: Fire Detection & Analysis
    await new Promise(r => setTimeout(r, 800));
    setStep(2);

    // Step 2: Spread Simulation with fire rings
    setShowFireRings(true);
    await new Promise(r => setTimeout(r, 1200));
    setShowFireRings(false);
    setStep(3);

    // Step 3: Knapsack Resource Allocation
    await new Promise(r => setTimeout(r, 800));
    setStep(4);

    // Step 4: Dijkstra Route Optimization + Auto Station Selection
    const stationData = fireStations.length > 0
      ? fireStations
      : puneNodes.filter(n => n.type === 'fire_station').map(n => ({
          id: n.id,
          map_node_id: n.id,
          name: n.label,
          trucks_available: 3,
          firefighters_on_duty: 20,
          water_tankers_available: 2,
        }));

    const dispatchResult = selectOptimalFireStation(selectedOrigin, stationData, graph, intensity);

    if (!dispatchResult || !dispatchResult.station) {
      setLoading(false);
      setStep(0);
      return;
    }

    const selected = dispatchResult.station;
    setAutoSelectedStation(selected);

    // Path goes FROM station TO fire (station dispatches to fire)
    const pathForDisplay = [...selected.path].reverse();
    const routeLabels = pathForDisplay.map(id => puneNodes.find(n => n.id === id)?.label || id);

    const resources = computeFireResources(intensity, buildingType);

    const resultData = {
      priorityScore: Math.min(10, intensity + 1),
      eta: `${Math.max(3, Math.round(selected.distance * 1.8))} min`,
      totalDistance: selected.distance,
      route: routeLabels,
      spreadRadius: `${spreadRadius}m`,
      station: selected.name,
      reason: dispatchResult.reason,
      resourcesAllocated: {
        trucks: Math.min(resources.trucks, selected.trucks_available),
        firefighters: Math.min(resources.firefighters, selected.firefighters_on_duty),
        waterTanks: Math.min(resources.tankers, selected.water_tankers_available),
      },
    };

    setResult(resultData);
    setActivePath(pathForDisplay);
    setShowVehicle(true);

    // Save to Supabase
    await supabase.from('incidents').insert({
      type: 'fire',
      location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
      map_node_id: selectedOrigin,
      severity: intensity,
      priority_score: Math.min(10, intensity + 1),
      route: pathForDisplay,
      route_distance_km: selected.distance,
      eta: resultData.eta,
      resources_allocated: resultData.resourcesAllocated,
      algorithm_used: 'Knapsack + Dijkstra (Auto Station)',
      status: 'dispatched',
    }).catch(() => {});

    setLoading(false);
  };

  const reset = () => {
    setStep(0); setResult(null); setActivePath([]); setShowVehicle(false);
    setSelectedOrigin(null); setAutoSelectedStation(null);
  };

  const pipelineSteps = [
    { label: 'Fire Detection & Analysis', done: step >= 2 },
    { label: 'Spread Simulation', done: step >= 3 },
    { label: 'Knapsack Resource Allocation', done: step >= 4 },
    { label: 'Dijkstra Route Optimization', done: result !== null },
  ];

  // Intensity bar gradient color
  const intensityColor = intensity <= 3 ? '#ffb800' : intensity <= 6 ? '#ff8c00' : '#ff2d55';

  return (
    <section className="min-h-screen py-8 px-6 relative">
      {/* Fire rings animation overlay */}
      <AnimatePresence>
        {showFireRings && (
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2"
                style={{ borderColor: '#ffb80060' }}
                initial={{ width: 20, height: 20, opacity: 0.8 }}
                animate={{
                  width: [20, 300 + i * 100],
                  height: [20, 300 + i * 100],
                  opacity: [0.8, 0],
                }}
                transition={{ duration: 1.2, delay: i * 0.3, ease: 'easeOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🚒</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              <span className="text-white">Fire</span>{' '}
              <span className="neon-text-warning">System</span>
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
            Fire Response Unit • Spread Simulation • Knapsack Allocation + Dijkstra Routing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {/* Map */}
          <GlassPanel variant="warning" className="relative overflow-hidden" style={{ minHeight: 450 }}>
            <h3 className="text-sm font-mono text-[#ffb800] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse" />
              Fire Zone Map
            </h3>
            {selectedOrigin && (
              <div className="absolute top-6 right-6 z-10 text-[10px] font-mono">
                <span className="text-[#ffb800]">● Fire: {puneNodes.find(n => n.id === selectedOrigin)?.label}</span>
                {autoSelectedStation && (
                  <span className="ml-3 text-[#3d8fff]">● Auto: {autoSelectedStation.name}</span>
                )}
              </div>
            )}
            <NodeMap
              nodes={puneNodes} edges={puneEdges} activePath={activePath}
              variant="warning" vehicleIcon="🚒" showVehicle={showVehicle}
              onNodeClick={handleNodeClick} selectedOrigin={selectedOrigin}
              selectedDestination={autoSelectedStation?.nodeId} serviceData={serviceData}
              nodeFilter={(n) => n.type !== 'hospital' && n.type !== 'police_station'}
            />
          </GlassPanel>

          {/* Controls */}
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
            <GlassPanel variant="warning">
              <h3 className="text-sm font-mono text-[#ffb800] mb-4 uppercase tracking-wider">Fire Report</h3>

              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">
                  Fire Intensity: <span style={{ color: intensityColor }}>{intensity}/10</span>
                </label>
                <input type="range" min="1" max="10" value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))} className="slider-neon slider-warning" />
                {/* Intensity bar */}
                <div className="mt-2 h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${intensity * 10}%`, background: `linear-gradient(90deg, #ffb800, ${intensityColor})` }} />
                </div>
                <div className="text-[10px] font-mono text-[rgba(255,255,255,0.4)] mt-1">
                  Est. Spread: <span style={{ color: intensityColor }}>{spreadRadius}m</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Fire Type</label>
                <select value={fireType} onChange={(e) => setFireType(e.target.value)}
                  className="input-field" style={{ borderColor: 'rgba(255,184,0,0.3)' }}>
                  {fireTypes.map(f => <option key={f.value} value={f.value} className="bg-[#0d0d15]">{f.label}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Fire Location</label>
                <select value={selectedOrigin || ''} onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="input-field" style={{ borderColor: 'rgba(255,184,0,0.3)' }}>
                  <option value="" className="bg-[#0d0d15]">Click map or select...</option>
                  {incidentNodes.map(n => <option key={n.id} value={n.id} className="bg-[#0d0d15]">{n.label}</option>)}
                </select>
              </div>

              {/* NO "Deploy From Station" dropdown — auto-selected by Dijkstra + Knapsack */}

              <div className="mb-4">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Building Type</label>
                <select value={buildingType} onChange={(e) => setBuildingType(e.target.value)}
                  className="input-field" style={{ borderColor: 'rgba(255,184,0,0.3)' }}>
                  {buildingTypes.map(b => <option key={b.value} value={b.value} className="bg-[#0d0d15]">{b.label}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <NeonButton onClick={handleDispatch} variant="warning" loading={loading} className="flex-1"
                  disabled={!selectedOrigin}>
                  🔥 Deploy Fire Units
                </NeonButton>
                {result && <NeonButton onClick={reset} variant="neon" size="md">↺ Reset</NeonButton>}
              </div>
            </GlassPanel>

            <AnimatePresence mode="wait">
              {step > 0 && (
                <GlassPanel variant="warning">
                  <h3 className="text-sm font-mono text-[#ffb800] mb-4 uppercase tracking-wider">Fire Pipeline</h3>
                  <ProcessingPipeline steps={pipelineSteps} currentStep={step} variant="warning" />
                </GlassPanel>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {result && (
                <GlassPanel variant="warning" glow>
                  <h3 className="text-sm font-mono text-[#ffb800] mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#39ff8f]" />
                    Dispatch Result
                  </h3>
                  {/* Auto-selected station info */}
                  <div className="mb-4 p-3 rounded-lg bg-[#ffb800]/5 border border-[#ffb800]/10">
                    <div className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase mb-1">Auto-Selected Station</div>
                    <div className="text-sm font-bold text-[#ffb800]">{result.station}</div>
                    <div className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] mt-1">{result.reason}</div>
                  </div>
                  {/* Spread Radius */}
                  <div className="mb-4 p-3 rounded-lg bg-[#ffb800]/5 border border-[#ffb800]/10 text-center">
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] uppercase">Estimated Spread: </span>
                    <span className="text-lg font-bold text-[#ffb800]">{result.spreadRadius}</span>
                  </div>
                  <DispatchResult result={result} variant="warning" type="fire" />
                </GlassPanel>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FirePage;
