import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import ProcessingPipeline from '../components/ProcessingPipeline';
import DispatchResult from '../components/DispatchResult';
import AnimatedCounter from '../components/AnimatedCounter';
import { puneNodes, incidentNodes, hospitalNodes } from '../data/puneNodes';
import { puneEdges, buildGraph, dijkstra } from '../data/puneEdges';
import { useRealtime } from '../hooks/useRealtime';
import supabase from '../lib/supabase';
import axios from 'axios';

gsap.registerPlugin(ScrollTrigger);

const patientConditions = [
  { value: 'cardiac', label: 'Cardiac' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'stroke', label: 'Stroke' },
  { value: 'accident', label: 'Accident' },
  { value: 'other', label: 'Other' },
];

const AmbulancePage = () => {
  const sectionRef = useRef(null);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [severity, setSeverity] = useState(5);
  const [condition, setCondition] = useState('cardiac');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0);

  const { data: hospitals } = useRealtime('hospitals');

  // Build service data lookup for tooltips
  const serviceData = useMemo(() => {
    const map = {};
    hospitals.forEach(h => { map[h.map_node_id] = h; });
    return map;
  }, [hospitals]);

  // Build graph for Dijkstra
  const graph = useMemo(() => buildGraph(puneEdges), []);

  // Client-side Dijkstra preview
  useEffect(() => {
    if (selectedOrigin && selectedDestination) {
      const { path, totalDistance } = dijkstra(graph, selectedOrigin, selectedDestination);
      if (path.length > 0) {
        setActivePath(path);
      }
    } else {
      setActivePath([]);
    }
  }, [selectedOrigin, selectedDestination, graph]);

  // Priority score computation
  const priorityScore = Math.min(10, severity + (condition === 'cardiac' ? 2 : condition === 'stroke' ? 2 : 1));

  // Node click handler
  const handleNodeClick = (node) => {
    if (node.type === 'incident' || node.type === 'junction') {
      setSelectedOrigin(node.id);
    } else if (node.type === 'hospital') {
      setSelectedDestination(node.id);
    }
  };

  // Selectable locations for dropdown
  const originOptions = incidentNodes;
  const destOptions = hospitalNodes;

  const handleDispatch = async () => {
    if (!selectedOrigin || !selectedDestination) return;

    setLoading(true);
    setStep(1);
    setResult(null);
    setShowVehicle(false);

    // Step 1: Priority Queue Analysis
    await new Promise(r => setTimeout(r, 1000));
    setStep(2);

    // Step 2: Resource Allocation
    await new Promise(r => setTimeout(r, 1000));
    setStep(3);

    try {
      const response = await axios.post('http://localhost:3001/api/dijkstra', {
        from: selectedOrigin,
        to: selectedDestination,
        graph,
      });

      const pathResult = response.data;
      const routeNodeLabels = pathResult.path.map(id => {
        const node = puneNodes.find(n => n.id === id);
        return node ? node.label : id;
      });

      const dispatchResult = {
        priorityScore,
        eta: `${Math.max(2, Math.round(pathResult.total_distance * 1.5))} min`,
        totalDistance: pathResult.total_distance,
        route: routeNodeLabels,
        cost: pathResult.total_distance,
        resourcesAllocated: {
          ambulances: 1,
          paramedics: 2,
          bedsAvailable: serviceData[selectedDestination]?.beds_available || 15,
        },
      };

      setResult(dispatchResult);
      setActivePath(pathResult.path);
      setShowVehicle(true);

      // Save to Supabase
      await supabase.from('incidents').insert({
        type: 'ambulance',
        location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
        map_node_id: selectedOrigin,
        severity,
        priority_score: priorityScore,
        route: pathResult.path,
        route_distance_km: pathResult.total_distance,
        eta: dispatchResult.eta,
        resources_allocated: dispatchResult.resourcesAllocated,
        algorithm_used: 'Dijkstra Shortest Path',
        status: 'dispatched',
      });
    } catch (err) {
      // Fallback: use client-side Dijkstra
      const { path, totalDistance } = dijkstra(graph, selectedOrigin, selectedDestination);
      const routeNodeLabels = path.map(id => puneNodes.find(n => n.id === id)?.label || id);

      const dispatchResult = {
        priorityScore,
        eta: `${Math.max(2, Math.round(totalDistance * 1.5))} min`,
        totalDistance,
        route: routeNodeLabels,
        cost: totalDistance,
        resourcesAllocated: {
          ambulances: 1,
          paramedics: 2,
          bedsAvailable: serviceData[selectedDestination]?.beds_available || 15,
        },
      };

      setResult(dispatchResult);
      setActivePath(path);
      setShowVehicle(true);

      // Still try to save to Supabase
      await supabase.from('incidents').insert({
        type: 'ambulance',
        location_name: puneNodes.find(n => n.id === selectedOrigin)?.label || selectedOrigin,
        map_node_id: selectedOrigin,
        severity,
        priority_score: priorityScore,
        route: path,
        route_distance_km: totalDistance,
        eta: dispatchResult.eta,
        resources_allocated: dispatchResult.resourcesAllocated,
        algorithm_used: 'Dijkstra Shortest Path (client)',
        status: 'dispatched',
      }).catch(() => {});
    }

    setLoading(false);
  };

  const reset = () => {
    setStep(0);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);
    setSelectedOrigin(null);
    setSelectedDestination(null);
  };

  const pipelineSteps = [
    { label: 'Priority Queue Analysis', done: step >= 2 },
    { label: 'Resource Allocation', done: step >= 3 },
    { label: 'Route Computation — Dijkstra', done: result !== null },
  ];

  return (
    <section ref={sectionRef} className="min-h-screen py-8 px-6">
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
            Medical Emergency Response • Priority-Based Dispatch • Shortest Route Optimization
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
                <span className="text-[#ff2d55]">● Origin: {puneNodes.find(n => n.id === selectedOrigin)?.label}</span>
                {selectedDestination && (
                  <span className="ml-3 text-[#3d8fff]">● Dest: {puneNodes.find(n => n.id === selectedDestination)?.label}</span>
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
              selectedDestination={selectedDestination}
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
                  {originOptions.map(n => (
                    <option key={n.id} value={n.id} className="bg-[#0d0d15]">{n.label}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div className="mb-3">
                <label className="text-xs font-mono text-[rgba(255,255,255,0.6)] block mb-1.5">Destination Hospital</label>
                <select
                  value={selectedDestination || ''}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="input-field"
                  style={{ borderColor: 'rgba(61,143,255,0.3)' }}
                >
                  <option value="" className="bg-[#0d0d15]">Click hospital on map or select...</option>
                  {destOptions.map(n => (
                    <option key={n.id} value={n.id} className="bg-[#0d0d15]">{n.label}</option>
                  ))}
                </select>
              </div>

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
                  disabled={!selectedOrigin || !selectedDestination}
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
