import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import ProcessingPipeline from '../components/ProcessingPipeline';
import DispatchResult from '../components/DispatchResult';
import { puneNodes, incidentNodes } from '../data/puneNodes';
import { puneEdges, buildGraph } from '../data/puneEdges';
import { useRealtime } from '../hooks/useRealtime';
import { selectOptimalHospital } from '../algorithms/ambulanceDispatch';
import supabase from '../lib/supabase';

const patientConditions = [
  { value: 'cardiac', label: 'Cardiac', weight: 2 },
  { value: 'trauma', label: 'Trauma', weight: 1.5 },
  { value: 'stroke', label: 'Stroke', weight: 2 },
  { value: 'accident', label: 'Accident', weight: 1.5 },
  { value: 'other', label: 'Other', weight: 1 },
];

const AmbulancePage = () => {
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [severity, setSeverity] = useState(5);
  const [condition, setCondition] = useState('cardiac');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0);
  const [autoSelectedHospital, setAutoSelectedHospital] = useState(null);

  const { data: hospitals } = useRealtime('hospitals');

  // Build service data lookup for tooltips
  const serviceData = useMemo(() => {
    const map = {};
    hospitals.forEach(h => { map[h.map_node_id] = h; });
    return map;
  }, [hospitals]);

  // Build graph for Dijkstra
  const graph = useMemo(() => buildGraph(puneEdges), []);

  // Priority score computation
  const conditionWeight = patientConditions.find(c => c.value === condition)?.weight || 1;
  const priorityScore = Math.min(10, Math.round(severity * conditionWeight));

  // Node click handler — only incident nodes are selectable as origin
  const handleNodeClick = (node) => {
    if (node.type === 'incident') {
      setSelectedOrigin(node.id);
    }
    // Hospital clicks just show tooltip (info only, no manual selection)
  };

  // AUTOMATIC DISPATCH — No manual hospital selection
  const handleDispatch = async () => {
    if (!selectedOrigin) return;

    setLoading(true);
    setStep(1);
    setResult(null);
    setShowVehicle(false);
    setAutoSelectedHospital(null);
    setActivePath([]);

    // Step 1: Priority Queue Analysis
    await new Promise(r => setTimeout(r, 800));
    setStep(2);

    // Step 2: Knapsack Resource Allocation
    await new Promise(r => setTimeout(r, 800));
    setStep(3);

    // Step 3: Dijkstra Route Computation + Auto Hospital Selection
    // Use hospital data from Supabase, fallback to node data
    const hospitalData = hospitals.length > 0
      ? hospitals
      : puneNodes.filter(n => n.type === 'hospital').map(n => ({
          id: n.id,
          map_node_id: n.id,
          name: n.label,
          beds_available: 50,
          icu_beds_available: 5,
          ambulances_available: 3,
        }));

    const dispatchResult = selectOptimalHospital(selectedOrigin, hospitalData, graph);

    if (!dispatchResult || !dispatchResult.hospital) {
      setLoading(false);
      setStep(0);
      return;
    }

    const selected = dispatchResult.hospital;
    setAutoSelectedHospital(selected);

    const routeNodeLabels = selected.path.map(id => {
      const node = puneNodes.find(n => n.id === id);
      return node ? node.label : id;
    });

    const resultData = {
      priorityScore,
      eta: `${Math.max(2, Math.round(selected.distance * 1.5))} min`,
      totalDistance: selected.distance,
      route: routeNodeLabels,
      cost: selected.distance,
      destination: selected.name,
      reason: dispatchResult.reason,
      resourcesAllocated: {
        ambulances: 1,
        paramedics: 2,
        bedsAvailable: selected.beds_available,
        icuAvailable: selected.icu_beds_available,
      },
    };

    setResult(resultData);
    setActivePath(selected.path);
    setShowVehicle(true);

    // Save to Supabase
    await supabase.from('incidents').insert({
      type: 'ambulance',
      location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
      map_node_id: selectedOrigin,
      severity,
      priority_score: priorityScore,
      route: selected.path,
      route_distance_km: selected.distance,
      eta: resultData.eta,
      resources_allocated: resultData.resourcesAllocated,
      algorithm_used: 'Dijkstra + Knapsack (Auto Hospital)',
      status: 'dispatched',
    }).catch(() => {});

    setLoading(false);
  };

  const reset = () => {
    setStep(0);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);
    setSelectedOrigin(null);
    setAutoSelectedHospital(null);
  };

  const pipelineSteps = [
    { label: 'Priority Queue Analysis', done: step >= 2 },
    { label: 'Knapsack Resource Allocation', done: step >= 3 },
    { label: 'Dijkstra Route Computation', done: result !== null },
  ];

  return (
    <section className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🚑</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              <span className="text-white">Ambulance</span>{' '}
              <span className="neon-text-blue">System</span>
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
            Medical Emergency Response • Priority-Based Dispatch • Auto Hospital Selection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {/* Left: Map */}
          <GlassPanel variant="blue" className="relative overflow-hidden" style={{ minHeight: 450 }}>
            <h3 className="text-sm font-mono text-[#3d8fff] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3d8fff] animate-pulse" />
              Pune City Map
            </h3>
            {selectedOrigin && (
              <div className="absolute top-6 right-6 z-10 text-[10px] font-mono">
                <span className="text-[#ff2d55]">● Incident: {puneNodes.find(n => n.id === selectedOrigin)?.label}</span>
                {autoSelectedHospital && (
                  <span className="ml-3 text-[#3d8fff]">● Auto: {autoSelectedHospital.name}</span>
                )}
              </div>
            )}
            <NodeMap
              nodes={puneNodes}
              edges={puneEdges}
              activePath={activePath}
              variant="blue"
              vehicleIcon="🚑"
              showVehicle={showVehicle}
              onNodeClick={handleNodeClick}
              selectedOrigin={selectedOrigin}
              selectedDestination={autoSelectedHospital?.nodeId}
              serviceData={serviceData}
              nodeFilter={(n) => n.type !== 'police_station' && n.type !== 'fire_station'}
            />
          </GlassPanel>

          {/* Right: Controls */}
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
            {/* Input Panel */}
            <GlassPanel variant="blue">
              <h3 className="text-sm font-mono text-[#3d8fff] mb-4 uppercase tracking-wider">
                Emergency Input
              </h3>

              {/* Location */}
              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Incident Location</label>
                <select
                  value={selectedOrigin || ''}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="input-field"
                  style={{ borderColor: 'rgba(61,143,255,0.3)' }}
                >
                  <option value="" className="bg-[#0d0d15]">Click map or select...</option>
                  {incidentNodes.map(n => (
                    <option key={n.id} value={n.id} className="bg-[#0d0d15]">{n.label}</option>
                  ))}
                </select>
              </div>

              {/* NO Destination Hospital dropdown — auto-selected by algorithm */}

              {/* Severity */}
              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">
                  Patient Severity: <span className="text-[#3d8fff]">{severity}/10</span>
                </label>
                <input
                  type="range" min="1" max="10" value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="slider-neon slider-blue"
                />
                <div className="flex justify-between text-[10px] font-mono text-[rgba(255,255,255,0.4)] mt-1">
                  <span>Low</span><span>Critical</span>
                </div>
              </div>

              {/* Condition */}
              <div className="mb-4">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Patient Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="input-field"
                  style={{ borderColor: 'rgba(61,143,255,0.3)' }}
                >
                  {patientConditions.map(c => (
                    <option key={c.value} value={c.value} className="bg-[#0d0d15]">{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority Preview */}
              <div className="mb-4 p-3 rounded-lg bg-[#3d8fff]/5 border border-[#3d8fff]/10">
                <span className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] uppercase">Live Priority Score: </span>
                <span className="text-lg font-bold text-[#3d8fff]">{priorityScore}</span>
              </div>

              <div className="flex gap-3">
                <NeonButton
                  onClick={handleDispatch}
                  variant="blue"
                  loading={loading}
                  className="flex-1"
                  disabled={!selectedOrigin}
                >
                  ⚡ Dispatch Ambulance
                </NeonButton>
                {result && (
                  <NeonButton onClick={reset} variant="neon" size="md">↺ Reset</NeonButton>
                )}
              </div>
            </GlassPanel>

            {/* Processing Pipeline */}
            <AnimatePresence mode="wait">
              {step > 0 && (
                <GlassPanel variant="blue">
                  <h3 className="text-sm font-mono text-[#3d8fff] mb-4 uppercase tracking-wider">
                    Processing Pipeline
                  </h3>
                  <ProcessingPipeline steps={pipelineSteps} currentStep={step} variant="blue" />
                </GlassPanel>
              )}
            </AnimatePresence>

            {/* Dispatch Result */}
            <AnimatePresence>
              {result && (
                <GlassPanel variant="blue" glow>
                  <h3 className="text-sm font-mono text-[#3d8fff] mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#39ff8f]" />
                    Dispatch Result
                  </h3>
                  {/* Auto-selected hospital info */}
                  <div className="mb-4 p-3 rounded-lg bg-[#3d8fff]/5 border border-[#3d8fff]/10">
                    <div className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase mb-1">Auto-Selected Hospital</div>
                    <div className="text-sm font-bold text-[#3d8fff]">{result.destination}</div>
                    <div className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] mt-1">{result.reason}</div>
                  </div>
                  <DispatchResult result={result} variant="blue" type="ambulance" />
                </GlassPanel>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AmbulancePage;
