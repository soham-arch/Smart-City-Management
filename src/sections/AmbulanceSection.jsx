import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import NodeMap from '../components/NodeMap';
import ProgressBar from '../components/ProgressBar';
import AnimatedCounter from '../components/AnimatedCounter';
import axios from 'axios';

gsap.registerPlugin(ScrollTrigger);

const ambulanceNodes = [
  { id: 'patient', x: 80, y: 200, label: 'Patient', icon: '🚨', size: 12, pulse: true, color: '#ff2d55' },
  { id: 'road1', x: 160, y: 120, label: 'Main St', size: 6 },
  { id: 'road2', x: 200, y: 280, label: 'Oak Ave', size: 6 },
  { id: 'road3', x: 280, y: 180, label: 'Highway 7', size: 6 },
  { id: 'road4', x: 340, y: 100, label: 'Park Rd', size: 6 },
  { id: 'road5', x: 320, y: 300, label: 'River Ln', size: 6 },
  { id: 'hospital', x: 430, y: 180, label: 'Hospital', icon: '🏥', size: 14, color: '#39ff8f' },
];

const ambulanceEdges = [
  { from: 'patient', to: 'road1' },
  { from: 'patient', to: 'road2' },
  { from: 'road1', to: 'road3' },
  { from: 'road2', to: 'road3' },
  { from: 'road2', to: 'road5' },
  { from: 'road3', to: 'road4' },
  { from: 'road3', to: 'hospital' },
  { from: 'road4', to: 'hospital' },
  { from: 'road5', to: 'hospital' },
  { from: 'road1', to: 'road4' },
];

const locations = [
  { value: 'downtown', label: 'Downtown District' },
  { value: 'suburb', label: 'Suburban Area' },
  { value: 'industrial', label: 'Industrial Zone' },
  { value: 'residential', label: 'Residential Block' },
];

const AmbulanceSection = () => {
  const sectionRef = useRef(null);
  const [location, setLocation] = useState('downtown');
  const [severity, setSeverity] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0); // 0: idle, 1: priority, 2: allocation, 3: route

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.amb-title', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        x: -60,
        opacity: 0,
        duration: 0.8,
      });

      gsap.from('.amb-panel', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleDispatch = async () => {
    setLoading(true);
    setStep(1);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);

    // Step 1: Priority Queue
    await new Promise(r => setTimeout(r, 1000));
    setStep(2);

    // Step 2: Resource Allocation
    await new Promise(r => setTimeout(r, 1000));
    setStep(3);

    try {
      const response = await axios.post('http://localhost:3001/api/ambulance', {
        location,
        severity,
      });
      setResult(response.data);
      setActivePath(['patient', 'road1', 'road3', 'hospital']);
      setShowVehicle(true);
    } catch (err) {
      // Use mock data if server is down
      setResult({
        status: 'success',
        route: ['Patient', 'Main St', 'Highway 7', 'Hospital'],
        cost: 8,
        eta: '4 min',
        priorityScore: Math.min(10, severity + 2),
        resourcesAllocated: { ambulances: 1, paramedics: 2, bedsAvailable: 15 },
      });
      setActivePath(['patient', 'road1', 'road3', 'hospital']);
      setShowVehicle(true);
    }

    setLoading(false);
  };

  const reset = () => {
    setStep(0);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);
  };

  return (
    <section id="ambulance" ref={sectionRef} className="section-full py-20 px-6">
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="amb-title mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🚑</span>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              <span className="text-city-text">Ambulance</span>{' '}
              <span className="neon-text-blue">System</span>
            </h2>
          </div>
          <p className="text-city-muted font-mono text-sm">
            Medical Emergency Response • Priority-Based Dispatch • Shortest Route Optimization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Map */}
          <GlassPanel variant="blue" className="amb-panel min-h-[400px]">
            <h3 className="text-sm font-mono text-city-blue mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-city-blue animate-pulse" />
              City Network Map
            </h3>
            <NodeMap
              nodes={ambulanceNodes}
              edges={ambulanceEdges}
              activePath={activePath}
              variant="blue"
              vehicleIcon="🚑"
              showVehicle={showVehicle}
            />
          </GlassPanel>

          {/* Right: Controls + Results */}
          <div className="flex flex-col gap-6">
            {/* Input Panel */}
            <GlassPanel variant="blue" className="amb-panel">
              <h3 className="text-sm font-mono text-city-blue mb-4 uppercase tracking-wider">
                Emergency Input
              </h3>

              {/* Location */}
              <div className="mb-4">
                <label className="text-xs font-mono text-city-muted block mb-2">Emergency Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                >
                  {locations.map(loc => (
                    <option key={loc.value} value={loc.value} className="bg-city-dark">
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="mb-6">
                <label className="text-xs font-mono text-city-muted block mb-2">
                  Patient Severity: <span className="text-city-blue">{severity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="slider-neon slider-blue"
                />
                <div className="flex justify-between text-[10px] font-mono text-city-muted mt-1">
                  <span>Low</span>
                  <span>Critical</span>
                </div>
              </div>

              <div className="flex gap-3">
                <NeonButton onClick={handleDispatch} variant="blue" loading={loading} className="flex-1">
                  ⚡ Dispatch Ambulance
                </NeonButton>
                {result && (
                  <NeonButton onClick={reset} variant="neon" size="md">
                    ↺ Reset
                  </NeonButton>
                )}
              </div>
            </GlassPanel>

            {/* Process Steps */}
            <AnimatePresence mode="wait">
              {step > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <GlassPanel variant="blue" className="amb-panel">
                    <h3 className="text-sm font-mono text-city-blue mb-4 uppercase tracking-wider">
                      Processing Pipeline
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Priority Queue Analysis', done: step >= 2 },
                        { label: 'Resource Allocation', done: step >= 3 },
                        { label: 'Route Computation (Dijkstra)', done: result !== null },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border ${
                            s.done
                              ? 'bg-city-blue/20 border-city-blue text-city-blue'
                              : step === i + 1
                              ? 'border-city-blue/50 text-city-blue animate-pulse'
                              : 'border-city-border text-city-muted'
                          }`}>
                            {s.done ? '✓' : i + 1}
                          </div>
                          <span className={`text-sm font-mono ${s.done ? 'text-city-blue' : 'text-city-muted'}`}>
                            {s.label}
                          </span>
                          {step === i + 1 && !s.done && (
                            <div className="ml-auto">
                              <div className="w-4 h-4 border-2 border-city-blue border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                >
                  <GlassPanel variant="blue" glow className="amb-panel">
                    <h3 className="text-sm font-mono text-city-blue mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-city-neon" />
                      Dispatch Result
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-blue">
                          <AnimatedCounter value={result.priorityScore || 7} />
                        </div>
                        <div className="text-[10px] font-mono text-city-muted">Priority</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-neon">{result.eta}</div>
                        <div className="text-[10px] font-mono text-city-muted">ETA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-warning">
                          <AnimatedCounter value={result.cost} />
                        </div>
                        <div className="text-[10px] font-mono text-city-muted">Cost</div>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="mb-4">
                      <div className="text-[10px] font-mono text-city-muted mb-2 uppercase">Optimal Route</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {result.route.map((stop, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="px-2 py-1 rounded bg-city-blue/10 text-city-blue text-xs font-mono border border-city-blue/20">
                              {stop}
                            </span>
                            {i < result.route.length - 1 && (
                              <span className="text-city-muted">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div>
                      <div className="text-[10px] font-mono text-city-muted mb-2 uppercase">Resources Allocated</div>
                      <div className="space-y-2">
                        <ProgressBar value={result.resourcesAllocated?.bedsAvailable || 15} max={30} label="Beds Available" variant="blue" />
                        <ProgressBar value={result.resourcesAllocated?.paramedics || 2} max={5} label="Paramedics Assigned" variant="neon" />
                      </div>
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

export default AmbulanceSection;
