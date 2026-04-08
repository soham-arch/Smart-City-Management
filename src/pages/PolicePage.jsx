import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import ProcessingPipeline from '../components/ProcessingPipeline';
import ProgressBar from '../components/ProgressBar';
import { puneNodes, incidentNodes } from '../data/puneNodes';
import { puneEdges } from '../data/puneEdges';
import { usePolling } from '../hooks/usePolling';
import { requestPoliceDispatch, resolveCrime } from '../lib/cppDispatchApi';

const API_BASE = import.meta.env.VITE_CPP_API_URL || 'http://localhost:3001';

const CRIME_TYPES = {
  murder_assault:   { label: 'Murder / Assault in Progress', base_priority: 10, units_needed: 3, sla_minutes: 3,  auto_ambulance: true,  default_injury: 'trauma'   },
  robbery:          { label: 'Robbery in Progress',          base_priority: 9,  units_needed: 2, sla_minutes: 4,  auto_ambulance: false                              },
  hit_and_run:      { label: 'Hit and Run',                  base_priority: 8,  units_needed: 1, sla_minutes: 5,  auto_ambulance: true,  default_injury: 'accident'  },
  burglary:         { label: 'Burglary in Progress',         base_priority: 7,  units_needed: 2, sla_minutes: 7,  auto_ambulance: false                              },
  accident:         { label: 'Road Accident',                base_priority: 6,  units_needed: 1, sla_minutes: 8,  auto_ambulance: true,  default_injury: 'accident'  },
  domestic_dispute: { label: 'Domestic Dispute',             base_priority: 5,  units_needed: 2, sla_minutes: 10, auto_ambulance: false                              },
  theft_reported:   { label: 'Theft (Reported After)',       base_priority: 3,  units_needed: 1, sla_minutes: 20, auto_ambulance: false                              },
  noise_complaint:  { label: 'Noise Complaint',              base_priority: 1,  units_needed: 1, sla_minutes: 30, auto_ambulance: false                              },
};

const VEHICLE_EMOJI = { patrol_car: '🚓', armed_response: '🚔', motorcycle: '🏍️' };

const PolicePage = () => {
  // Step state: 0=form, 1=queue viz, 2=unit assignment, 3=casualties, 4=dispatch board
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [crimeType, setCrimeType] = useState('robbery');
  const [severity, setSeverity] = useState(9);
  const [witnessCount, setWitnessCount] = useState(1);
  const [hasCasualties, setHasCasualties] = useState(false);
  const [casualtyCount, setCasualtyCount] = useState(1);
  const [casualtyInjuryType, setCasualtyInjuryType] = useState('trauma');
  const [loading, setLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [alertFlash, setAlertFlash] = useState(false);

  // Result data
  const [dispatchResult, setDispatchResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [secondaryPath, setSecondaryPath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);

  // Animation state
  const [heapSteps, setHeapSteps] = useState([]);
  const [currentHeapStep, setCurrentHeapStep] = useState(-1);
  const [dijkstraSteps, setDijkstraSteps] = useState([]);
  const [currentDijkstraStep, setCurrentDijkstraStep] = useState(-1);

  // Polling
  const { data: crimeQueue, refetch: refetchQueue } = usePolling('crime_queue', 5000);
  const { data: patrolUnits, refetch: refetchUnits } = usePolling('patrol_units', 5000);
  const { data: policeStations, refetch: refetchStations } = usePolling('police_stations', 5000);
  const { data: crimeIncidents } = usePolling('crime_incidents', 5000);

  const serviceData = useMemo(() => {
    const map = {};
    policeStations.forEach(p => { map[p.map_node_id] = p; });
    return map;
  }, [policeStations]);

  // Derived queue categories
  const pendingCrimes = useMemo(() => crimeQueue.filter(c => c.status === 'pending').sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0)), [crimeQueue]);
  const activeCrimes = useMemo(() => crimeQueue.filter(c => c.status === 'active'), [crimeQueue]);
  const resolvedCrimes = useMemo(() => crimeIncidents.filter(c => c.status === 'resolved').sort((a, b) => new Date(b.resolved_at || b.created_at) - new Date(a.resolved_at || a.created_at)).slice(0, 10), [crimeIncidents]);

  // Auto-fill severity when crime type changes
  useEffect(() => {
    const ct = CRIME_TYPES[crimeType];
    if (ct) setSeverity(ct.base_priority);
  }, [crimeType]);

  const handleNodeClick = (node) => {
    if (node.type === 'incident' && currentStep === 0) {
      setSelectedOrigin(node.id);
    }
  };

  // ═══ DISPATCH HANDLER ═══
  const handleDispatch = async () => {
    if (!selectedOrigin) return;
    setLoading(true);
    setDispatchError('');
    setAlertFlash(true);
    setTimeout(() => setAlertFlash(false), 2000);

    try {
      const result = await requestPoliceDispatch({
        origin: selectedOrigin,
        crime_type: crimeType,
        severity,
        has_casualties: hasCasualties,
        casualty_count: hasCasualties ? casualtyCount : 0,
        casualty_injury_type: hasCasualties ? casualtyInjuryType : null,
        location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
        edges: puneEdges,
      });

      setDispatchResult(result);

      // Set paths
      const route = result.route || [];
      setActivePath(route);
      setShowVehicle(true);

      if (result.ambulanceDispatch?.route) {
        setSecondaryPath(result.ambulanceDispatch.route);
      }

      // Set heap steps for animation
      if (result.crimeQueue?.heap_insertion_steps) {
        setHeapSteps(result.crimeQueue.heap_insertion_steps);
      }

      // Set dijkstra steps
      if (result.dijkstraSteps) {
        const dSteps = result.dijkstraSteps.map(s => ({
          ...s,
          currentLabel: puneNodes.find(n => n.id === s.current)?.label || s.current,
          neighbors: (s.neighbors || []).map(nb => ({
            ...nb,
            label: puneNodes.find(n => n.id === nb.node)?.label || nb.node,
          })),
        }));
        setDijkstraSteps(dSteps);
      }

      // Advance to Step 1 (queue viz)
      setCurrentStep(1);

      // Animate heap steps
      if (result.crimeQueue?.heap_insertion_steps) {
        for (let i = 0; i < result.crimeQueue.heap_insertion_steps.length; i++) {
          setCurrentHeapStep(i);
          await new Promise(r => setTimeout(r, 400));
        }
      }

      // Refetch polling data
      refetchQueue();
      refetchUnits();
      refetchStations();
    } catch (error) {
      console.error('[NEXUS] Police dispatch failed:', error.message);
      setDispatchError('C++ dispatch server is required. Start the backend on http://localhost:3001.');
    } finally {
      setLoading(false);
    }
  };

  // ═══ STEP 2: Animate Dijkstra ═══
  const animateDijkstra = useCallback(async () => {
    for (let i = 0; i < dijkstraSteps.length; i++) {
      setCurrentDijkstraStep(i);
      await new Promise(r => setTimeout(r, 300));
    }
  }, [dijkstraSteps]);

  useEffect(() => {
    if (currentStep === 2 && dijkstraSteps.length > 0) {
      animateDijkstra();
    }
  }, [currentStep, dijkstraSteps, animateDijkstra]);

  // ═══ RESOLVE HANDLER ═══
  const handleResolve = async (crimeId) => {
    try {
      await resolveCrime(crimeId, puneEdges);
      refetchQueue();
      refetchUnits();
      refetchStations();
    } catch (err) {
      console.error('[NEXUS] Resolve failed:', err);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setDispatchResult(null);
    setActivePath([]);
    setSecondaryPath([]);
    setShowVehicle(false);
    setSelectedOrigin(null);
    setDispatchError('');
    setHeapSteps([]);
    setCurrentHeapStep(-1);
    setDijkstraSteps([]);
    setCurrentDijkstraStep(-1);
  };

  // Stats
  const totalToday = crimeIncidents.length + crimeQueue.length;
  const resolvedCount = crimeIncidents.filter(c => c.status === 'resolved').length;
  const slaMetCount = crimeIncidents.filter(c => c.sla_met === true).length;
  const slaTotal = crimeIncidents.filter(c => c.sla_met !== null && c.sla_met !== undefined).length;
  const slaPercent = slaTotal > 0 ? Math.round((slaMetCount / slaTotal) * 100) : 100;
  const availUnits = patrolUnits.filter(u => u.status === 'available').length;
  const totalUnits = patrolUnits.length;

  const ct = CRIME_TYPES[crimeType] || {};

  // Step labels for indicator
  const stepLabels = hasCasualties
    ? ['Report', 'Queue', 'Units', 'Casualties', 'Board']
    : ['Report', 'Queue', 'Units', 'Board'];

  const actualStepCount = stepLabels.length;
  const getDisplayStep = (s) => {
    if (!hasCasualties && s >= 3) return s + 1; // skip casualties step
    return s;
  };

  // ═══ HEAP TREE VISUALIZATION ═══
  const HeapTree = ({ sortedQueue, steps, currentAnimStep }) => {
    if (!sortedQueue || sortedQueue.length === 0) return null;
    const maxNodes = Math.min(sortedQueue.length, 15);
    const treeNodes = sortedQueue.slice(0, maxNodes);

    // Calculate positions for binary tree layout
    const getNodePos = (index, totalLevels) => {
      const level = Math.floor(Math.log2(index + 1));
      const posInLevel = index - (Math.pow(2, level) - 1);
      const nodesInLevel = Math.pow(2, level);
      const width = 380;
      const xSpacing = width / (nodesInLevel + 1);
      const x = xSpacing * (posInLevel + 1);
      const y = 30 + level * 55;
      return { x, y };
    };

    const totalLevels = Math.floor(Math.log2(maxNodes)) + 1;
    const lastInserted = steps?.[steps.length - 1]?.crime_id;

    return (
      <svg viewBox="0 0 380 220" className="w-full" style={{ maxHeight: 220 }}>
        {/* Edges */}
        {treeNodes.map((_, i) => {
          if (i === 0) return null;
          const parent = Math.floor((i - 1) / 2);
          const pos = getNodePos(i, totalLevels);
          const parentPos = getNodePos(parent, totalLevels);
          return (
            <line key={`edge-${i}`} x1={parentPos.x} y1={parentPos.y} x2={pos.x} y2={pos.y}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          );
        })}
        {/* Nodes */}
        {treeNodes.map((node, i) => {
          const pos = getNodePos(i, totalLevels);
          const isNew = node.crime_id === lastInserted;
          const isAnimating = currentAnimStep >= 0 && steps?.[currentAnimStep]?.crime_id === node.crime_id;
          return (
            <g key={`node-${i}`}>
              <circle cx={pos.x} cy={pos.y} r="18"
                fill={isNew ? '#ff2d55' : isAnimating ? '#ffb800' : 'rgba(255,45,85,0.15)'}
                stroke={isNew ? '#ff2d55' : '#ff2d5540'} strokeWidth={isNew ? 2 : 1} />
              <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill="white" fontSize="7"
                fontFamily="'JetBrains Mono', monospace">
                {(node.crime_type || '').slice(0, 8)}
              </text>
              <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill="#ff2d55" fontSize="9"
                fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                {node.priority_score}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <section className="min-h-screen py-8 px-6 relative">
      {/* Alert flash */}
      <AnimatePresence>
        {alertFlash && (
          <motion.div className="fixed inset-0 z-40 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.15, 0, 0.1, 0] }}
            exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
            style={{ background: 'linear-gradient(135deg, #ff2d5540, #3d8fff40)' }} />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🚓</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              <span className="text-white">Police</span>{' '}
              <span className="neon-text-danger">System</span>
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
            Crime Response Unit • Priority Queue Dispatch • Real-time Unit Tracking
          </p>

          {/* Step indicator */}
          {currentStep > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-all ${
                    i < currentStep ? 'bg-[#39ff8f]/20 border-[#39ff8f] text-[#39ff8f]' :
                    i === currentStep ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-[#ff2d55]' :
                    'border-white/10 text-white/30'
                  }`}>{i + 1}</div>
                  <span className={`text-[10px] font-mono ${i <= currentStep ? 'text-white/70' : 'text-white/20'}`}>{label}</span>
                  {i < actualStepCount - 1 && <div className={`w-6 h-px ${i < currentStep ? 'bg-[#39ff8f]/40' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {/* ═══ LEFT: Map ═══ */}
          <GlassPanel variant="danger" className="relative overflow-hidden" style={{ minHeight: 450 }}>
            <h3 className="text-sm font-mono text-[#ff2d55] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
              Crime Zone Map
            </h3>
            {selectedOrigin && (
              <div className="absolute top-6 right-6 z-10 text-[10px] font-mono">
                <span className="text-[#ff2d55]">● Crime: {puneNodes.find(n => n.id === selectedOrigin)?.label}</span>
                {dispatchResult?.assignedStation && (
                  <span className="ml-3 text-[#3d8fff]">● Station: {dispatchResult.assignedStation.name}</span>
                )}
              </div>
            )}
            <NodeMap
              nodes={puneNodes} edges={puneEdges} activePath={activePath}
              secondaryPath={secondaryPath}
              variant="danger" vehicleIcon="🚓" secondaryVehicleIcon="🚑"
              showVehicle={showVehicle}
              onNodeClick={handleNodeClick} selectedOrigin={selectedOrigin}
              selectedDestination={dispatchResult?.assignedStation?.nodeId}
              serviceData={serviceData}
              nodeFilter={(n) => n.type !== 'hospital' && n.type !== 'fire_station'}
            />
          </GlassPanel>

          {/* ═══ RIGHT: Step-based panels ═══ */}
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>

            {/* ═══ STEP 0: Crime Report Form ═══ */}
            {currentStep === 0 && (
              <GlassPanel variant="danger">
                <h3 className="text-sm font-mono text-[#ff2d55] mb-4 uppercase tracking-wider">🚨 Crime Report</h3>

                {/* Crime Type */}
                <div className="mb-3">
                  <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Crime Type</label>
                  <select value={crimeType} onChange={(e) => setCrimeType(e.target.value)}
                    className="input-field" style={{ borderColor: 'rgba(255,45,85,0.3)' }}>
                    {Object.entries(CRIME_TYPES).map(([key, val]) => (
                      <option key={key} value={key} className="bg-[#0d0d15]">{val.label}</option>
                    ))}
                  </select>
                  {ct.sla_minutes && (
                    <div className="mt-1 text-[10px] font-mono text-[#ffb800]">
                      ⏱ SLA Target: {ct.sla_minutes} minutes | Units needed: {ct.units_needed}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="mb-3">
                  <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Incident Location</label>
                  <select value={selectedOrigin || ''} onChange={(e) => setSelectedOrigin(e.target.value)}
                    className="input-field" style={{ borderColor: 'rgba(255,45,85,0.3)' }}>
                    <option value="" className="bg-[#0d0d15]">Click map or select...</option>
                    {incidentNodes.map(n => <option key={n.id} value={n.id} className="bg-[#0d0d15]">{n.label}</option>)}
                  </select>
                </div>

                {/* Severity */}
                <div className="mb-3">
                  <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">
                    Severity: <span className="text-[#ff2d55]">{severity}/10</span>
                  </label>
                  <input type="range" min="1" max="10" value={severity}
                    onChange={(e) => setSeverity(parseInt(e.target.value))} className="slider-neon slider-danger" />
                </div>

                {/* Witness count */}
                <div className="mb-3">
                  <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Witness Count</label>
                  <input type="number" min="1" max="10" value={witnessCount}
                    onChange={(e) => setWitnessCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="input-field w-24" style={{ borderColor: 'rgba(255,45,85,0.3)' }} />
                </div>

                {/* Casualties toggle */}
                <div className="mb-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-mono text-[rgba(255,255,255,0.6)]">Casualties at scene?</label>
                    <button onClick={() => setHasCasualties(!hasCasualties)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                        hasCasualties ? 'bg-[#ff2d55]' : 'bg-[#1a1a2e] border border-[#2a2a3e]'
                      }`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                        hasCasualties ? 'left-6' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Casualty details */}
                <AnimatePresence>
                  {hasCasualties && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-3 rounded-lg bg-[#ff2d55]/10 border border-[#ff2d55]/20 mb-3">
                        <div className="text-[11px] font-mono text-[#ffb800] mb-3 flex items-center gap-2">
                          ⚠ Ambulance will be auto-dispatched to this location
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono text-white/50 block mb-1">Casualty Count</label>
                            <input type="number" min="1" max="10" value={casualtyCount}
                              onChange={(e) => setCasualtyCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                              className="input-field text-sm" style={{ borderColor: 'rgba(255,45,85,0.3)' }} />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-white/50 block mb-1">Injury Type</label>
                            <select value={casualtyInjuryType} onChange={(e) => setCasualtyInjuryType(e.target.value)}
                              className="input-field text-sm" style={{ borderColor: 'rgba(255,45,85,0.3)' }}>
                              <option value="cardiac" className="bg-[#0d0d15]">Cardiac</option>
                              <option value="trauma" className="bg-[#0d0d15]">Trauma</option>
                              <option value="stroke" className="bg-[#0d0d15]">Stroke</option>
                              <option value="accident" className="bg-[#0d0d15]">Accident</option>
                              <option value="other" className="bg-[#0d0d15]">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DSA Concepts */}
                <div className="mb-4 p-3 rounded-lg bg-[#ff2d55]/5 border border-[#ff2d55]/10">
                  <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] uppercase mb-2">College Concept Mapping</div>
                  <div className="text-[11px] font-mono text-[rgba(255,255,255,0.72)] leading-5">
                    Graph stored as adjacency list<br />
                    Max-Heap priority queue ranks crime urgency<br />
                    Dijkstra computes shortest route to stations<br />
                    Sorting chooses the nearest available station
                  </div>
                </div>

                {dispatchError && (
                  <div className="mb-4 p-3 rounded-lg bg-[#ff2d55]/10 border border-[#ff2d55]/20 text-[11px] font-mono text-[#ff9ab0]">
                    {dispatchError}
                  </div>
                )}

                <NeonButton onClick={handleDispatch} variant="danger" loading={loading} className="w-full"
                  disabled={!selectedOrigin}>
                  🚨 Report Crime
                </NeonButton>
              </GlassPanel>
            )}

            {/* ═══ STEP 1: Priority Queue Visualization ═══ */}
            <AnimatePresence>
              {currentStep === 1 && dispatchResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassPanel variant="danger">
                    <h3 className="text-sm font-mono text-[#ff2d55] mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
                      Step 1 — Priority Queue (Max-Heap)
                    </h3>

                    {/* Heap visualization */}
                    <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <HeapTree
                        sortedQueue={dispatchResult.crimeQueue?.sorted_queue || []}
                        steps={heapSteps}
                        currentAnimStep={currentHeapStep}
                      />
                      <div className="text-[10px] font-mono text-white/40 mt-2 text-center">
                        {heapSteps.length > 0 && (
                          <>Inserted at position {heapSteps[0]?.position ?? 0} → {heapSteps.length - 1} swap{heapSteps.length - 1 !== 1 ? 's' : ''} → final position {heapSteps[heapSteps.length - 1]?.position ?? 0}</>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#ffb800] mt-1 text-center">
                        Heap insertion: O(log n) where n = {dispatchResult.crimeQueue?.total_pending || 0} pending crimes
                      </div>
                    </div>

                    {/* Sorted queue table */}
                    <div className="mb-4">
                      <div className="text-[10px] font-mono text-white/50 uppercase mb-2">Sorted Queue</div>
                      <div className="overflow-x-auto rounded border border-white/10">
                        <table className="w-full text-[10px] font-mono">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-2 text-white/40">#</th>
                              <th className="text-left p-2 text-white/40">Crime Type</th>
                              <th className="text-left p-2 text-white/40">Priority</th>
                              <th className="text-left p-2 text-white/40">Units</th>
                              <th className="text-left p-2 text-white/40">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(dispatchResult.crimeQueue?.sorted_queue || []).map((sq, i) => {
                              const isThis = sq.crime_id === dispatchResult.crimeId;
                              return (
                                <tr key={i} className={`border-b border-white/5 ${isThis ? 'bg-[#ff2d55]/10' : ''}`}>
                                  <td className="p-2 text-white/60">{i + 1}</td>
                                  <td className="p-2 text-white/80">{CRIME_TYPES[sq.crime_type]?.label?.split(' ')[0] || sq.crime_type}</td>
                                  <td className="p-2">
                                    <span className={`font-bold ${sq.priority_score >= 8 ? 'text-[#ff2d55]' : sq.priority_score >= 5 ? 'text-[#ffb800]' : 'text-white/60'}`}>
                                      {sq.priority_score}
                                    </span>
                                  </td>
                                  <td className="p-2 text-white/60">{sq.units_needed}</td>
                                  <td className="p-2">
                                    {isThis ? (
                                      <span className="text-[#ff2d55] animate-pulse">← NEW</span>
                                    ) : (
                                      <span className="text-white/40">PENDING</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <NeonButton onClick={() => setCurrentStep(2)} variant="danger" className="w-full">
                      Continue → Unit Assignment
                    </NeonButton>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ STEP 2: Unit Assignment + Dijkstra ═══ */}
            <AnimatePresence>
              {currentStep === 2 && dispatchResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassPanel variant="danger">
                    <h3 className="text-sm font-mono text-[#ff2d55] mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
                      Step 2 — Unit Assignment + Dijkstra
                    </h3>

                    {/* SLA Banner */}
                    {dispatchResult.slaCritical && (
                      <div className="mb-4 p-3 rounded-lg bg-[#ff2d55]/15 border border-[#ff2d55]/30 animate-pulse">
                        <div className="text-sm font-mono font-bold text-[#ff2d55] flex items-center gap-2">
                          ⚠ CRITICAL — SLA target: {dispatchResult.slaTargetMinutes} minutes
                        </div>
                      </div>
                    )}

                    {/* Assigned units */}
                    <div className="mb-4 p-3 rounded-lg bg-[#ff2d55]/5 border border-[#ff2d55]/10">
                      <div className="text-xs font-mono text-[#ff2d55] uppercase mb-2 font-bold">
                        Dispatched from: {dispatchResult.assignedStation?.name}
                      </div>
                      <div className="text-[10px] font-mono text-white/45 mb-3">
                        Route: {(dispatchResult.route || []).map(id => puneNodes.find(n => n.id === id)?.label || id).join(' → ')} ({dispatchResult.totalDistance} km)
                      </div>
                      <div className="space-y-2">
                        {(dispatchResult.assignedUnits || []).map((unit, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded bg-white/5">
                            <span className="text-lg">{VEHICLE_EMOJI[unit.vehicle_type] || '🚓'}</span>
                            <div className="flex-1">
                              <div className="text-xs font-mono text-white/80">{unit.unit_name} | {unit.officer_name}</div>
                              <div className="text-[10px] font-mono text-white/40">ETA: {unit.eta_minutes || '?'} min</div>
                            </div>
                          </div>
                        ))}
                        {(!dispatchResult.assignedUnits || dispatchResult.assignedUnits.length === 0) && (
                          <div className="text-[11px] font-mono text-[#ffb800] p-2">⏳ Awaiting available units</div>
                        )}
                      </div>
                    </div>

                    {/* Dijkstra steps */}
                    <div className="mb-4">
                      <div className="text-[10px] font-mono text-white/50 uppercase mb-2">
                        Dijkstra Shortest Path ({currentDijkstraStep + 1}/{dijkstraSteps.length})
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {dijkstraSteps.slice(0, currentDijkstraStep + 1).map((step, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className={`p-2 rounded text-xs font-mono ${i === currentDijkstraStep ? 'bg-[#ff2d55]/10 border border-[#ff2d55]/20' : 'bg-white/5'}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[#ff2d55] font-bold">→ {step.currentLabel}</span>
                              <span className="text-[rgba(255,255,255,0.3)]">dist: {step.distance}km</span>
                            </div>
                            {step.neighbors && step.neighbors.length > 0 && (
                              <div className="mt-1 pl-4 text-[10px] text-[rgba(255,255,255,0.4)]">
                                Updated: {step.neighbors.map(n => `${n.label}(${n.newDist}km)`).join(', ')}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <NeonButton onClick={() => {
                      if (hasCasualties && dispatchResult.ambulanceDispatch) {
                        setCurrentStep(3);
                      } else {
                        setCurrentStep(4);
                      }
                    }} variant="danger" className="w-full">
                      Continue →
                    </NeonButton>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ STEP 3: Casualties / Linked Ambulance ═══ */}
            <AnimatePresence>
              {currentStep === 3 && dispatchResult?.ambulanceDispatch && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassPanel variant="danger">
                    <h3 className="text-sm font-mono text-[#ff2d55] mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
                      Step 3 — Linked Ambulance Dispatch
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Police summary */}
                      <div className="p-4 rounded-lg bg-[#ff2d55]/5 border border-[#ff2d55]/20">
                        <div className="text-xs font-mono text-[#ff2d55] uppercase mb-2 font-bold">🚓 Police Dispatched</div>
                        <div className="space-y-1 text-[11px] font-mono">
                          <div>Station: <span className="text-white/80">{dispatchResult.assignedStation?.name}</span></div>
                          <div>ETA: <span className="text-white/80">{Math.max(2, Math.round((dispatchResult.totalDistance || 0) * 1.3))} min</span></div>
                          <div>Route: <span className="text-white/80">{dispatchResult.totalDistance} km</span></div>
                          <div>Units: <span className="text-white/80">{(dispatchResult.assignedUnits || []).map(u => u.unit_name).join(', ') || 'Awaiting'}</span></div>
                        </div>
                      </div>

                      {/* Ambulance summary */}
                      <div className="p-4 rounded-lg bg-[#3d8fff]/5 border border-[#3d8fff]/20">
                        <div className="text-xs font-mono text-[#3d8fff] uppercase mb-2 font-bold">🚑 Ambulance Auto-dispatched</div>
                        <div className="space-y-1 text-[11px] font-mono">
                          <div>Casualties: <span className="text-white/80">{dispatchResult.ambulanceDispatch.casualties}</span> | Injury: <span className="text-[#ffb800] capitalize">{dispatchResult.ambulanceDispatch.injury_type}</span></div>
                          <div>Hospital: <span className="text-[#3d8fff]">{dispatchResult.ambulanceDispatch.hospital?.name}</span></div>
                          <div>Ward: <span className="text-white/80 uppercase">{dispatchResult.ambulanceDispatch.ward}</span></div>
                          <div>ETA: <span className="text-white/80">{dispatchResult.ambulanceDispatch.eta}</span> | Distance: <span className="text-white/80">{dispatchResult.ambulanceDispatch.totalDistance} km</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4 text-center">
                      <div className="text-[10px] font-mono text-white/40 uppercase">Shared Incident ID</div>
                      <div className="text-xs font-mono text-[#39ff8f]">{dispatchResult.crimeId}</div>
                      <div className="text-[10px] font-mono text-white/30 mt-1">Both services linked. Police route in red, ambulance in blue.</div>
                    </div>

                    <NeonButton onClick={() => setCurrentStep(4)} variant="danger" className="w-full">
                      Continue → Dispatch Board
                    </NeonButton>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ STEP 4: Active Dispatch Board ═══ */}
            {currentStep === 4 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassPanel variant="danger">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-mono text-[#ff2d55] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
                      Active Dispatch Board
                    </h3>
                    <NeonButton onClick={reset} variant="neon" size="sm">+ New Report</NeonButton>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {/* Pending Queue */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-[#ffb800] uppercase mb-2 font-bold">Pending Queue</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {pendingCrimes.length === 0 && <div className="text-[10px] font-mono text-white/30">No pending crimes</div>}
                        {pendingCrimes.map((crime) => (
                          <div key={crime.id} className="p-2 rounded bg-[#ffb800]/5 border border-[#ffb800]/10">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-white/80">
                                {CRIME_TYPES[crime.crime_type]?.label?.split('(')[0]?.split('/')[0]?.trim() || crime.crime_type}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[#ffb800]">{crime.priority_score}</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                              <div className="bg-[#ffb800] h-1 rounded-full" style={{ width: `${(crime.priority_score || 0) * 10}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active Dispatches */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-[#ff2d55] uppercase mb-2 font-bold">Active Dispatches</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {activeCrimes.length === 0 && <div className="text-[10px] font-mono text-white/30">No active dispatches</div>}
                        {activeCrimes.map((crime) => {
                          const units = patrolUnits.filter(u => u.current_incident_id === crime.id);
                          return (
                            <div key={crime.id} className="p-2 rounded bg-[#ff2d55]/5 border border-[#ff2d55]/10">
                              <div className="text-[10px] font-mono text-white/80 mb-1">
                                {units.map(u => `${VEHICLE_EMOJI[u.vehicle_type] || '🚓'} ${u.unit_name}`).join(' ')} → {crime.location_name}
                              </div>
                              <div className="text-[9px] font-mono text-white/40">
                                {units[0]?.eta_minutes ? `ETA: ${units[0].eta_minutes} min` : 'En route'}
                              </div>
                              <button onClick={() => handleResolve(crime.id)}
                                className="mt-1 w-full text-[9px] font-mono px-2 py-1 rounded bg-[#39ff8f]/10 border border-[#39ff8f]/20 text-[#39ff8f] hover:bg-[#39ff8f]/20 transition-all">
                                ✓ Mark Resolved
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recently Resolved */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-[#39ff8f] uppercase mb-2 font-bold">Recently Resolved</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {resolvedCrimes.length === 0 && <div className="text-[10px] font-mono text-white/30">No resolved crimes yet</div>}
                        {resolvedCrimes.map((crime) => {
                          const ago = Math.round((Date.now() - new Date(crime.resolved_at || crime.created_at).getTime()) / 60000);
                          return (
                            <div key={crime.id} className="p-2 rounded bg-[#39ff8f]/5 border border-[#39ff8f]/10">
                              <div className="text-[10px] font-mono text-white/70 flex items-center gap-1">
                                ✓ {CRIME_TYPES[crime.crime_type]?.label?.split('(')[0]?.split('/')[0]?.trim() || crime.crime_type}
                              </div>
                              <div className="text-[9px] font-mono text-white/40">
                                Resolved {ago < 60 ? `${ago}m ago` : `${Math.floor(ago / 60)}h ago`}
                              </div>
                              <div className={`text-[9px] font-mono font-bold ${crime.sla_met ? 'text-[#39ff8f]' : 'text-[#ff2d55]'}`}>
                                SLA: {crime.sla_met ? 'MET ✓' : 'BREACHED ✗'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/50">
                    <span>Total reported: <span className="text-white/80">{totalToday}</span></span>
                    <span>Resolved: <span className="text-[#39ff8f]">{resolvedCount}</span></span>
                    <span>Pending: <span className="text-[#ffb800]">{pendingCrimes.length}</span></span>
                    <span>Active: <span className="text-[#ff2d55]">{activeCrimes.length}</span></span>
                    <span>SLA met: <span className={slaPercent >= 75 ? 'text-[#39ff8f]' : 'text-[#ff2d55]'}>{slaPercent}%</span></span>
                  </div>
                </GlassPanel>
              </motion.div>
            )}

            {/* Mini status bar when on non-board steps */}
            {currentStep > 0 && currentStep < 4 && (
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[9px] font-mono text-white/40">
                <span>🚓 Units: {availUnits}/{totalUnits} available</span>
                <span>📋 Queue: {pendingCrimes.length} pending, {activeCrimes.length} active</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PolicePage;
