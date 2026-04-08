import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import ProcessingPipeline from '../components/ProcessingPipeline';
import DispatchResult from '../components/DispatchResult';
import ProgressBar from '../components/ProgressBar';
import { puneNodes, incidentNodes } from '../data/puneNodes';
import { puneEdges, buildGraph } from '../data/puneEdges';
import { usePolling } from '../hooks/usePolling';
import { requestAmbulanceDispatch } from '../lib/cppDispatchApi';

const API_BASE = import.meta.env.VITE_CPP_API_URL || 'http://localhost:3001';

const INJURY_TYPES = {
  cardiac:  { healing_days: 7,  resource_weight: 3, initial_severity_bonus: 2 },
  stroke:   { healing_days: 10, resource_weight: 3, initial_severity_bonus: 2 },
  trauma:   { healing_days: 5,  resource_weight: 2, initial_severity_bonus: 1 },
  accident: { healing_days: 6,  resource_weight: 2, initial_severity_bonus: 1 },
  other:    { healing_days: 3,  resource_weight: 1, initial_severity_bonus: 0 },
};

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
  const [autoSelectedHospital, setAutoSelectedHospital] = useState(null);
  const [dispatchError, setDispatchError] = useState('');

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(0); // 0=input, 1=dijkstra, 2=admission, 3=summary
  const [dijkstraSteps, setDijkstraSteps] = useState([]);
  const [currentDijkstraStep, setCurrentDijkstraStep] = useState(-1);
  const [patientRecord, setPatientRecord] = useState(null);
  const [wardResult, setWardResult] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);

  const { data: hospitals, refetch: refetchHospitals } = usePolling('hospitals');
  const { data: patients } = usePolling('patients');

  // Build service data lookup for tooltips
  const serviceData = useMemo(() => {
    const map = {};
    hospitals.forEach(h => { map[h.map_node_id] = h; });
    return map;
  }, [hospitals]);

  const graph = useMemo(() => buildGraph(puneEdges), []);

  // Priority score computation
  const conditionWeight = patientConditions.find(c => c.value === condition)?.weight || 1;
  const priorityScore = Math.min(10, Math.round(severity * conditionWeight));

  // Node click handler
  const handleNodeClick = (node) => {
    if (node.type === 'incident' && currentStep === 0) {
      setSelectedOrigin(node.id);
    }
  };

  // Run Dijkstra step-by-step visualization
  const runDijkstraVisualization = useCallback(async (from, to) => {
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

    const path = [];
    let cur = to;
    while (cur) { path.unshift(cur); cur = previous[cur]; }

    return { steps, path, totalDistance: Math.round(distances[to] * 10) / 10 };
  }, [graph]);

  // AUTOMATIC DISPATCH — Full multi-step flow
  const handleDispatch = async () => {
    if (!selectedOrigin) return;

    setLoading(true);
    setProcessingStep(1);
    setResult(null);
    setShowVehicle(false);
    setAutoSelectedHospital(null);
    setActivePath([]);
    setDispatchError('');
    setDijkstraSteps([]);
    setCurrentDijkstraStep(-1);
    setPatientRecord(null);
    setWardResult(null);

    await new Promise(r => setTimeout(r, 600));
    setProcessingStep(2);
    await new Promise(r => setTimeout(r, 600));
    setProcessingStep(3);

    // Use hospital data from DB
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

    try {
      const apiResult = await requestAmbulanceDispatch({
        origin: selectedOrigin,
        severity,
        prioritySeverity: priorityScore,
        hospitals: hospitalData,
        edges: puneEdges,
      });

      if (!apiResult || !apiResult.hospital) {
        setCurrentStep(0);
        setProcessingStep(0);
        setDispatchError('C++ dispatch server returned no reachable hospital.');
        setLoading(false);
        return;
      }

      const selected = apiResult.hospital;
      setAutoSelectedHospital(selected);

      const routeNodeLabels = selected.path.map(id => {
        const node = puneNodes.find(n => n.id === id);
        return node ? node.label : id;
      });

      const resultData = {
        priorityScore: apiResult.priorityScore ?? priorityScore,
        eta: `${Math.max(2, Math.round(selected.distance * 1.5))} min`,
        totalDistance: selected.distance,
        route: routeNodeLabels,
        cost: selected.distance,
        destination: selected.name,
        reason: apiResult.reason,
        algorithmStack: [
          'Graph (Adjacency List)',
          'Priority Queue',
          'Dijkstra Shortest Path',
          '0/1 Knapsack Dynamic Programming',
        ],
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

      // Save incident to local DB
      await fetch(`${API_BASE}/api/db/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ambulance',
          location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
          map_node_id: selectedOrigin,
          severity,
          priority_score: resultData.priorityScore,
          route: selected.path,
          route_distance_km: selected.distance,
          eta: resultData.eta,
          resources_allocated: resultData.resourcesAllocated,
          algorithm_used: 'C++ Priority Queue + Dijkstra + 0/1 Knapsack',
          status: 'dispatched',
        }),
      }).catch(() => {});

      // Move to Step 1: Dijkstra Visualization
      setCurrentStep(1);
      setLoading(false);

      // Animate Dijkstra steps
      if (apiResult.dijkstraSteps && apiResult.dijkstraSteps.length > 0) {
        const dSteps = apiResult.dijkstraSteps.map(s => ({
          ...s,
          currentLabel: puneNodes.find(n => n.id === s.current)?.label || s.current,
          neighbors: (s.neighbors || []).map(nb => ({
            ...nb,
            label: puneNodes.find(n => n.id === nb.node)?.label || nb.node,
          })),
        }));
        setDijkstraSteps(dSteps);

        for (let i = 0; i < dSteps.length; i++) {
          setCurrentDijkstraStep(i);
          await new Promise(r => setTimeout(r, 300));
        }
      } else {
        // Fallback: run client-side
        const vizResult = await runDijkstraVisualization(selectedOrigin, selected.nodeId || selected.map_node_id);
        setDijkstraSteps(vizResult.steps);
        for (let i = 0; i < vizResult.steps.length; i++) {
          setCurrentDijkstraStep(i);
          await new Promise(r => setTimeout(r, 300));
        }
      }
    } catch (error) {
      console.error('[NEXUS] C++ ambulance dispatch failed:', error.message);
      setCurrentStep(0);
      setProcessingStep(0);
      setDispatchError('C++ dispatch server is required. Start the backend on http://localhost:3001.');
      setLoading(false);
    }
  };

  // Step 2: Admit patient
  const handleAdmitPatient = async () => {
    if (!autoSelectedHospital) return;

    const injuryInfo = INJURY_TYPES[condition] || INJURY_TYPES.other;
    const ward = severity >= 7 ? 'icu' : 'general';

    try {
      // Create patient record
      const patientRes = await fetch(`${API_BASE}/api/db/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: autoSelectedHospital.map_node_id || autoSelectedHospital.nodeId,
          name: `Patient #${Date.now().toString().slice(-4)}`,
          injury_type: condition,
          severity,
          resource_weight: injuryInfo.resource_weight,
          ward,
          status: 'admitted',
          days_admitted: 0,
          healing_duration: injuryInfo.healing_days,
          admitted_at: new Date().toISOString(),
          incident_id: null,
        }),
      });
      const patient = await patientRes.json();
      setPatientRecord(patient);

      // Run ward knapsack to rebalance
      const knapsackRes = await fetch(`${API_BASE}/api/ward-knapsack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: autoSelectedHospital.map_node_id || autoSelectedHospital.nodeId,
        }),
      });
      const knapsackData = await knapsackRes.json();
      setWardResult(knapsackData);

      // Refresh hospital data
      refetchHospitals();

      setCurrentStep(2);
    } catch (err) {
      console.error('[NEXUS] Patient admission failed:', err);
      setCurrentStep(2); // Still show step even if knapsack fails
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setProcessingStep(0);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);
    setSelectedOrigin(null);
    setAutoSelectedHospital(null);
    setDispatchError('');
    setDijkstraSteps([]);
    setCurrentDijkstraStep(-1);
    setPatientRecord(null);
    setWardResult(null);
  };

  const pipelineSteps = [
    { label: 'Priority Queue Analysis', done: processingStep >= 2 },
    { label: '0/1 Knapsack Dynamic Programming', done: processingStep >= 3 },
    { label: 'Dijkstra Shortest Path on City Graph', done: result !== null },
  ];

  // Get hospital patients for ward display
  const hospitalPatients = useMemo(() => {
    if (!autoSelectedHospital) return [];
    const hid = autoSelectedHospital.map_node_id || autoSelectedHospital.nodeId;
    return patients.filter(p => p.hospital_id === hid && p.status !== 'discharged');
  }, [patients, autoSelectedHospital]);

  const currentHospitalData = useMemo(() => {
    if (!autoSelectedHospital) return null;
    const hid = autoSelectedHospital.map_node_id || autoSelectedHospital.nodeId;
    return hospitals.find(h => h.map_node_id === hid) || autoSelectedHospital;
  }, [hospitals, autoSelectedHospital]);

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
          {/* Step indicator */}
          {currentStep > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {['Dispatch', 'Dijkstra', 'Admission', 'Summary'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-all ${
                    i < currentStep ? 'bg-[#39ff8f]/20 border-[#39ff8f] text-[#39ff8f]' :
                    i === currentStep ? 'bg-[#3d8fff]/20 border-[#3d8fff] text-[#3d8fff]' :
                    'border-white/10 text-white/30'
                  }`}>{i + 1}</div>
                  <span className={`text-[10px] font-mono ${i <= currentStep ? 'text-white/70' : 'text-white/20'}`}>{label}</span>
                  {i < 3 && <div className={`w-8 h-px ${i < currentStep ? 'bg-[#39ff8f]/40' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>
          )}
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

          {/* Right: Step-based panels */}
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>

            {/* ═══ STEP 0: Input Panel ═══ */}
            {currentStep === 0 && (
              <GlassPanel variant="blue">
                <h3 className="text-sm font-mono text-[#3d8fff] mb-4 uppercase tracking-wider">
                  Emergency Input
                </h3>

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

                <div className="mb-4 p-3 rounded-lg bg-[#3d8fff]/5 border border-[#3d8fff]/10">
                  <span className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] uppercase">Live Priority Score: </span>
                  <span className="text-lg font-bold text-[#3d8fff]">{priorityScore}</span>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-[#3d8fff]/5 border border-[#3d8fff]/10">
                  <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] uppercase mb-2">College Concept Mapping</div>
                  <div className="text-[11px] font-mono text-[rgba(255,255,255,0.72)] leading-5">
                    Graph stored as adjacency list<br />
                    Priority handled through priority-queue style scoring<br />
                    Dijkstra finds shortest route to each hospital<br />
                    0/1 Knapsack chooses the best-fit hospital under budget
                  </div>
                </div>

                {dispatchError && (
                  <div className="mb-4 p-3 rounded-lg bg-[#ff2d55]/10 border border-[#ff2d55]/20 text-[11px] font-mono text-[#ff9ab0]">
                    {dispatchError}
                  </div>
                )}

                <NeonButton
                  onClick={handleDispatch}
                  variant="blue"
                  loading={loading}
                  className="w-full"
                  disabled={!selectedOrigin}
                >
                  ⚡ Dispatch Ambulance
                </NeonButton>
              </GlassPanel>
            )}

            {/* Processing Pipeline shown during dispatch */}
            <AnimatePresence mode="wait">
              {processingStep > 0 && currentStep === 0 && (
                <GlassPanel variant="blue">
                  <h3 className="text-sm font-mono text-[#3d8fff] mb-4 uppercase tracking-wider">
                    Processing Pipeline
                  </h3>
                  <ProcessingPipeline steps={pipelineSteps} currentStep={processingStep} variant="blue" />
                </GlassPanel>
              )}
            </AnimatePresence>

            {/* ═══ STEP 1: Dijkstra Visualization ═══ */}
            <AnimatePresence>
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassPanel variant="blue">
                    <h3 className="text-sm font-mono text-[#3d8fff] mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3d8fff] animate-pulse" />
                      Step 2 — Dijkstra Shortest Path ({currentDijkstraStep + 1}/{dijkstraSteps.length})
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
                      {dijkstraSteps.slice(0, currentDijkstraStep + 1).map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-2 rounded text-xs font-mono ${i === currentDijkstraStep ? 'bg-[#3d8fff]/10 border border-[#3d8fff]/20' : 'bg-white/5'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#3d8fff] font-bold">→ {step.currentLabel}</span>
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
                    {/* Hospital selection result */}
                    {autoSelectedHospital && (
                      <div className="p-3 rounded-lg bg-[#39ff8f]/5 border border-[#39ff8f]/20 mb-4">
                        <div className="text-[10px] font-mono text-[#39ff8f] uppercase mb-1">Selected Hospital</div>
                        <div className="text-sm font-bold text-[#3d8fff]">{autoSelectedHospital.name}</div>
                        <div className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] mt-1">
                          Distance: {autoSelectedHospital.distance} km
                        </div>
                      </div>
                    )}
                    <NeonButton onClick={handleAdmitPatient} variant="blue" className="w-full">
                      Continue → Admit Patient
                    </NeonButton>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ STEP 2: Patient Admission & Ward Status ═══ */}
            <AnimatePresence>
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GlassPanel variant="blue">
                    <h3 className="text-sm font-mono text-[#3d8fff] mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#39ff8f]" />
                      Step 3 — Patient Admission & Ward Status
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Left: Patient Card */}
                      <div className="p-4 rounded-lg bg-[#3d8fff]/5 border border-[#3d8fff]/20">
                        <div className="text-xs font-mono text-[#3d8fff] uppercase mb-3 font-bold">Patient Admitted</div>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-white/50">Hospital:</span>
                            <span className="text-white/90">{autoSelectedHospital?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Injury type:</span>
                            <span className="text-[#3d8fff] capitalize">{condition}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Severity:</span>
                            <span className="text-[#ff2d55] font-bold">{severity}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Ward assigned:</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${severity >= 7 ? 'bg-[#ff2d55]/20 text-[#ff2d55]' : 'bg-[#3d8fff]/20 text-[#3d8fff]'}`}>
                              {severity >= 7 ? 'ICU' : 'General'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Healing duration:</span>
                            <span className="text-white/80">{INJURY_TYPES[condition]?.healing_days || 3} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Resource weight:</span>
                            <span className="text-[#ffb800]">{INJURY_TYPES[condition]?.resource_weight || 1} units</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Hospital Ward Status */}
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs font-mono text-[#39ff8f] uppercase mb-3 font-bold">
                          {currentHospitalData?.name || 'Hospital'} — Status
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] font-mono text-white/50 uppercase mb-1">ICU Ward</div>
                            <ProgressBar
                              value={(currentHospitalData?.icu_beds_total || 0) - (currentHospitalData?.icu_beds_available || 0)}
                              max={currentHospitalData?.icu_beds_total || 1}
                              label={`ICU: ${currentHospitalData?.icu_beds_available || 0} / ${currentHospitalData?.icu_beds_total || 0} available`}
                              variant="danger"
                            />
                          </div>
                          <div>
                            <div className="text-[10px] font-mono text-white/50 uppercase mb-1">General Ward</div>
                            <ProgressBar
                              value={(currentHospitalData?.beds_total || 0) - (currentHospitalData?.beds_available || 0)}
                              max={currentHospitalData?.beds_total || 1}
                              label={`Beds: ${currentHospitalData?.beds_available || 0} / ${currentHospitalData?.beds_total || 0} available`}
                              variant="blue"
                            />
                          </div>
                          <div className="text-[10px] font-mono text-white/40">
                            Current patients: {hospitalPatients.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DP Table Visualization */}
                    {wardResult && wardResult.dp_table_snapshot && (
                      <div className="mb-4">
                        <div className="text-[10px] font-mono text-[#ffb800] uppercase mb-2">
                          Knapsack DP Table — ICU Allocation
                        </div>
                        <div className="text-[9px] font-mono text-white/30 mb-2">
                          Each cell = max severity achievable with [resource units] for [n patients considered]
                        </div>
                        <div className="overflow-x-auto max-h-40 overflow-y-auto rounded border border-white/10">
                          <table className="text-[9px] font-mono">
                            <tbody>
                              {wardResult.dp_table_snapshot.slice(0, 12).map((row, i) => (
                                <tr key={i}>
                                  {(Array.isArray(row) ? row : []).slice(0, 20).map((cell, j) => (
                                    <td
                                      key={j}
                                      className={`px-1.5 py-0.5 border border-white/5 text-center ${
                                        cell > 0 ? 'text-[#39ff8f] bg-[#39ff8f]/5' : 'text-white/20'
                                      }`}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-[#39ff8f]">
                          Total severity served: {wardResult.total_severity_served || 0} | 
                          ICU patients: {wardResult.icu_admitted?.length || 0} | 
                          General: {wardResult.general_ward?.length || 0}
                        </div>
                      </div>
                    )}

                    <NeonButton onClick={() => setCurrentStep(3)} variant="blue" className="w-full">
                      Continue → View Summary
                    </NeonButton>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ STEP 3: Dispatch Summary ═══ */}
            <AnimatePresence>
              {currentStep === 3 && result && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <GlassPanel variant="blue" glow>
                    <h3 className="text-sm font-mono text-[#3d8fff] mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#39ff8f]" />
                      Step 4 — Dispatch Summary
                    </h3>
                    <div className="mb-4 p-3 rounded-lg bg-[#3d8fff]/5 border border-[#3d8fff]/10">
                      <div className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase mb-1">Auto-Selected Hospital</div>
                      <div className="text-sm font-bold text-[#3d8fff]">{result.destination}</div>
                      <div className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] mt-1">{result.reason}</div>
                    </div>
                    <DispatchResult result={result} variant="blue" type="ambulance" />
                    <div className="mt-4">
                      <NeonButton onClick={reset} variant="neon" className="w-full">
                        🚑 New Dispatch
                      </NeonButton>
                    </div>
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

export default AmbulancePage;
