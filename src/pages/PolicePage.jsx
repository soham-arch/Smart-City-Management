import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import ProcessingPipeline from '../components/ProcessingPipeline';
import DispatchResult from '../components/DispatchResult';
import { puneNodes, incidentNodes, policeStationNodes } from '../data/puneNodes';
import { puneEdges, buildGraph, dijkstra } from '../data/puneEdges';
import { useRealtime } from '../hooks/useRealtime';
import supabase from '../lib/supabase';
import axios from 'axios';

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
  const [selectedStation, setSelectedStation] = useState(null);
  const [severity, setSeverity] = useState(6);
  const [crimeType, setCrimeType] = useState('robbery');
  const [crowdSize, setCrowdSize] = useState('Small');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0);
  const [alertFlash, setAlertFlash] = useState(false);

  const { data: policeStations } = useRealtime('police_stations');

  const serviceData = useMemo(() => {
    const map = {};
    policeStations.forEach(p => { map[p.map_node_id] = p; });
    return map;
  }, [policeStations]);

  const graph = useMemo(() => buildGraph(puneEdges), []);

  // Client-side path preview
  useEffect(() => {
    if (selectedOrigin && selectedStation) {
      const { path } = dijkstra(graph, selectedStation, selectedOrigin);
      if (path.length > 0) setActivePath(path);
    } else {
      setActivePath([]);
    }
  }, [selectedOrigin, selectedStation, graph]);

  const handleNodeClick = (node) => {
    if (node.type === 'incident' || node.type === 'junction') {
      setSelectedOrigin(node.id);
    } else if (node.type === 'police_station') {
      setSelectedStation(node.id);
    }
  };

  const handleDeploy = async () => {
    if (!selectedOrigin || !selectedStation) return;

    setLoading(true);
    setStep(1);
    setResult(null);
    setShowVehicle(false);
    setAlertFlash(true);
    setTimeout(() => setAlertFlash(false), 2000);

    await new Promise(r => setTimeout(r, 800));
    setStep(2);
    await new Promise(r => setTimeout(r, 800));
    setStep(3);

    try {
      const response = await axios.post('http://localhost:3001/api/dijkstra', {
        from: selectedStation, to: selectedOrigin, graph,
      });
      const pathResult = response.data;
      const routeLabels = pathResult.path.map(id => puneNodes.find(n => n.id === id)?.label || id);
      const crowdMultiplier = crowdSize === 'Large' ? 3 : crowdSize === 'Medium' ? 2 : 1;

      const dispatchResult = {
        priorityScore: Math.min(10, severity + 1),
        eta: `${Math.max(2, Math.round(pathResult.total_distance * 1.3))} min`,
        totalDistance: pathResult.total_distance,
        route: routeLabels,
        resourcesAllocated: {
          units: Math.min(crowdMultiplier + 1, 5),
          officers: crowdMultiplier * 3 + severity,
          backupAvailable: true,
        },
      };

      setResult(dispatchResult);
      setActivePath(pathResult.path);
      setShowVehicle(true);

      await supabase.from('incidents').insert({
        type: 'police',
        location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
        map_node_id: selectedOrigin,
        severity,
        priority_score: Math.min(10, severity + 1),
        route: pathResult.path,
        route_distance_km: pathResult.total_distance,
        eta: dispatchResult.eta,
        resources_allocated: dispatchResult.resourcesAllocated,
        algorithm_used: 'Priority Queue + Dijkstra',
        status: 'dispatched',
      });
    } catch {
      const { path, totalDistance } = dijkstra(graph, selectedStation, selectedOrigin);
      const routeLabels = path.map(id => puneNodes.find(n => n.id === id)?.label || id);
      const crowdMultiplier = crowdSize === 'Large' ? 3 : crowdSize === 'Medium' ? 2 : 1;

      const dispatchResult = {
        priorityScore: Math.min(10, severity + 1),
        eta: `${Math.max(2, Math.round(totalDistance * 1.3))} min`,
        totalDistance,
        route: routeLabels,
        resourcesAllocated: {
          units: Math.min(crowdMultiplier + 1, 5),
          officers: crowdMultiplier * 3 + severity,
          backupAvailable: true,
        },
      };

      setResult(dispatchResult);
      setActivePath(path);
      setShowVehicle(true);

      await supabase.from('incidents').insert({
        type: 'police', location_name: puneNodes.find(n => n.id === selectedOrigin)?.label, map_node_id: selectedOrigin,
        severity, priority_score: Math.min(10, severity + 1), route: path, route_distance_km: totalDistance,
        eta: dispatchResult.eta, resources_allocated: dispatchResult.resourcesAllocated,
        algorithm_used: 'Priority Queue + Dijkstra (client)', status: 'dispatched',
      }).catch(() => {});
    }
    setLoading(false);
  };

  const reset = () => {
    setStep(0); setResult(null); setActivePath([]); setShowVehicle(false);
    setSelectedOrigin(null); setSelectedStation(null);
  };

  const pipelineSteps = [
    { label: 'Crime Analysis', done: step >= 2 },
    { label: 'Priority Ranking', done: step >= 3 },
    { label: 'Unit Deployment — Dijkstra', done: result !== null },
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
            Crime Response Unit • Priority Dispatch • Real-time Unit Tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {/* Map */}
          <GlassPanel variant="danger" className="relative overflow-hidden" style={{ minHeight: 450 }}>
            <h3 className="text-sm font-mono text-[#ff2d55] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff2d55] animate-pulse" />
              Crime Zone Map
            </h3>
            <NodeMap
              nodes={puneNodes} edges={puneEdges} activePath={activePath}
              variant="danger" vehicleIcon="🚓" showVehicle={showVehicle}
              onNodeClick={handleNodeClick} selectedOrigin={selectedOrigin}
              selectedDestination={selectedStation} serviceData={serviceData}
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

              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Deploy From Station</label>
                <select value={selectedStation || ''} onChange={(e) => setSelectedStation(e.target.value)}
                  className="input-field" style={{ borderColor: 'rgba(255,45,85,0.3)' }}>
                  <option value="" className="bg-[#0d0d15]">Click station on map or select...</option>
                  {policeStationNodes.map(n => <option key={n.id} value={n.id} className="bg-[#0d0d15]">{n.label}</option>)}
                </select>
              </div>

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
                  disabled={!selectedOrigin || !selectedStation}>
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
