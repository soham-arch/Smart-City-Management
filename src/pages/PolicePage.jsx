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
import { selectNearestPoliceStation, computePoliceResources } from '../algorithms/policeDispatch';
import supabase from '../lib/supabase';

const crimeTypes = [
  { value: 'robbery', label: 'Armed Robbery' },
  { value: 'assault', label: 'Assault' },
  { value: 'burglary', label: 'Burglary' },
  { value: 'accident', label: 'Traffic Accident' },
  { value: 'suspicious', label: 'Suspicious Activity' },
  { value: 'vandalism', label: 'Vandalism' },
];

const crowdSizes = ['Small', 'Medium', 'Large'];

const PolicePage = () => {
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [severity, setSeverity] = useState(6);
  const [crimeType, setCrimeType] = useState('robbery');
  const [crowdSize, setCrowdSize] = useState('Small');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0);
  const [alertFlash, setAlertFlash] = useState(false);
  const [autoSelectedStation, setAutoSelectedStation] = useState(null);

  const { data: policeStations } = useRealtime('police_stations');

  const serviceData = useMemo(() => {
    const map = {};
    policeStations.forEach(p => { map[p.map_node_id] = p; });
    return map;
  }, [policeStations]);

  const graph = useMemo(() => buildGraph(puneEdges), []);

  // Node click — only incident nodes as crime location
  const handleNodeClick = (node) => {
    if (node.type === 'incident') {
      setSelectedOrigin(node.id);
    }
    // Police station clicks just show tooltip (info only, no manual selection)
  };

  // AUTOMATIC DISPATCH — No manual station selection
  const handleDeploy = async () => {
    if (!selectedOrigin) return;

    setLoading(true);
    setStep(1);
    setResult(null);
    setShowVehicle(false);
    setAutoSelectedStation(null);
    setActivePath([]);
    setAlertFlash(true);
    setTimeout(() => setAlertFlash(false), 2000);

    // Step 1: Crime Analysis
    await new Promise(r => setTimeout(r, 800));
    setStep(2);

    // Step 2: Priority Ranking
    await new Promise(r => setTimeout(r, 800));
    setStep(3);

    // Step 3: Dijkstra Unit Deployment — Auto station selection
    const stationData = policeStations.length > 0
      ? policeStations
      : puneNodes.filter(n => n.type === 'police_station').map(n => ({
          id: n.id,
          map_node_id: n.id,
          name: n.label,
          units_available: 3,
          officers_on_duty: 20,
          vehicles_available: 3,
        }));

    const dispatchResult = selectNearestPoliceStation(selectedOrigin, stationData, graph);

    if (!dispatchResult || !dispatchResult.station) {
      setLoading(false);
      setStep(0);
      return;
    }

    const selected = dispatchResult.station;
    setAutoSelectedStation(selected);

    // Path goes FROM station TO crime (station dispatches to crime)
    // The path from dijkstra is from crime to station, we reverse it for display
    const pathForDisplay = [...selected.path].reverse();
    const routeLabels = pathForDisplay.map(id => puneNodes.find(n => n.id === id)?.label || id);

    const resources = computePoliceResources(severity, crowdSize);

    const resultData = {
      priorityScore: Math.min(10, severity + 1),
      eta: `${Math.max(2, Math.round(selected.distance * 1.3))} min`,
      totalDistance: selected.distance,
      route: routeLabels,
      station: selected.name,
      resourcesAllocated: {
        units: Math.min(resources.vehicles, selected.units_available),
        officers: Math.min(resources.officers, selected.officers_on_duty),
        vehicles: resources.vehicles,
        backupAvailable: resources.backup,
      },
    };

    setResult(resultData);
    setActivePath(pathForDisplay);
    setShowVehicle(true);

    // Save to Supabase
    await supabase.from('incidents').insert({
      type: 'police',
      location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
      map_node_id: selectedOrigin,
      severity,
      priority_score: Math.min(10, severity + 1),
      route: pathForDisplay,
      route_distance_km: selected.distance,
      eta: resultData.eta,
      resources_allocated: resultData.resourcesAllocated,
      algorithm_used: 'Priority Queue + Dijkstra (Auto Station)',
      status: 'dispatched',
    }).catch(() => {});

    setLoading(false);
  };

  const reset = () => {
    setStep(0); setResult(null); setActivePath([]); setShowVehicle(false);
    setSelectedOrigin(null); setAutoSelectedStation(null);
  };

  const pipelineSteps = [
    { label: 'Crime Analysis', done: step >= 2 },
    { label: 'Priority Ranking', done: step >= 3 },
    { label: 'Dijkstra Unit Deployment', done: result !== null },
  ];

  return (
    <section className="min-h-screen py-8 px-6 relative">
      {/* Alert flash */}
      <AnimatePresence>
        {alertFlash && (
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0, 0.1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{ background: 'linear-gradient(135deg, #ff2d5540, #3d8fff40)' }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🚓</span>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              <span className="text-white">Police</span>{' '}
              <span className="neon-text-danger">System</span>
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
            Crime Response Unit • Auto Station Dispatch • Real-time Unit Tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {/* Map */}
          <GlassPanel variant="danger" className="relative overflow-hidden" style={{ minHeight: 450 }}>
            <h3 className="text-sm font-mono text-[#ff2d55] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
              Crime Zone Map
            </h3>
            {selectedOrigin && (
              <div className="absolute top-6 right-6 z-10 text-[10px] font-mono">
                <span className="text-[#ff2d55]">● Crime: {puneNodes.find(n => n.id === selectedOrigin)?.label}</span>
                {autoSelectedStation && (
                  <span className="ml-3 text-[#3d8fff]">● Auto: {autoSelectedStation.name}</span>
                )}
              </div>
            )}
            <NodeMap
              nodes={puneNodes} edges={puneEdges} activePath={activePath}
              variant="danger" vehicleIcon="🚓" showVehicle={showVehicle}
              onNodeClick={handleNodeClick} selectedOrigin={selectedOrigin}
              selectedDestination={autoSelectedStation?.nodeId} serviceData={serviceData}
              nodeFilter={(n) => n.type !== 'hospital' && n.type !== 'fire_station'}
            />
          </GlassPanel>

          {/* Controls */}
          <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
            <GlassPanel variant="danger">
              <h3 className="text-sm font-mono text-[#ff2d55] mb-4 uppercase tracking-wider">Crime Report</h3>

              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Crime Type</label>
                <select value={crimeType} onChange={(e) => setCrimeType(e.target.value)}
                  className="input-field" style={{ borderColor: 'rgba(255,45,85,0.3)' }}>
                  {crimeTypes.map(c => <option key={c.value} value={c.value} className="bg-[#0d0d15]">{c.label}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Crime Location</label>
                <select value={selectedOrigin || ''} onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="input-field" style={{ borderColor: 'rgba(255,45,85,0.3)' }}>
                  <option value="" className="bg-[#0d0d15]">Click map or select...</option>
                  {incidentNodes.map(n => <option key={n.id} value={n.id} className="bg-[#0d0d15]">{n.label}</option>)}
                </select>
              </div>

              {/* NO "Deploy From Station" dropdown — auto-selected by Dijkstra */}

              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">
                  Severity: <span className="text-[#ff2d55]">{severity}/10</span>
                </label>
                <input type="range" min="1" max="10" value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))} className="slider-neon slider-danger" />
              </div>

              <div className="mb-4">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Crowd Size</label>
                <div className="flex gap-2">
                  {crowdSizes.map(size => (
                    <button key={size} onClick={() => setCrowdSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        crowdSize === size ? 'bg-[#ff2d55]/20 border-[#ff2d55] text-[#ff2d55]' : 'border-[#1a1a2e] text-[rgba(255,255,255,0.4)] hover:border-[#ff2d55]/30'
                      }`}>{size}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <NeonButton onClick={handleDeploy} variant="danger" loading={loading} className="flex-1"
                  disabled={!selectedOrigin}>
                  🚨 Deploy Units
                </NeonButton>
                {result && <NeonButton onClick={reset} variant="neon" size="md">↺ Reset</NeonButton>}
              </div>
            </GlassPanel>

            <AnimatePresence mode="wait">
              {step > 0 && (
                <GlassPanel variant="danger">
                  <h3 className="text-sm font-mono text-[#ff2d55] mb-4 uppercase tracking-wider">Response Pipeline</h3>
                  <ProcessingPipeline steps={pipelineSteps} currentStep={step} variant="danger" />
                </GlassPanel>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {result && (
                <GlassPanel variant="danger" glow>
                  <h3 className="text-sm font-mono text-[#ff2d55] mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#39ff8f]" />
                    Deployment Status
                  </h3>
                  {/* Auto-selected station info */}
                  <div className="mb-4 p-3 rounded-lg bg-[#ff2d55]/5 border border-[#ff2d55]/10">
                    <div className="text-xs font-mono text-[rgba(255,255,255,0.5)] uppercase mb-1">Auto-Selected Station</div>
                    <div className="text-sm font-bold text-[#ff2d55]">{result.station}</div>
                    <div className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] mt-1">
                      Nearest available — {result.totalDistance} km away
                    </div>
                  </div>
                  <DispatchResult result={result} variant="danger" type="police" />
                </GlassPanel>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PolicePage;
