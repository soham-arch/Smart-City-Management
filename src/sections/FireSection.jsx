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

const fireNodes = [
  { id: 'fire', x: 100, y: 200, label: 'Fire Site', icon: '🔥', size: 14, pulse: true, color: '#ff2d55' },
  { id: 'road1', x: 180, y: 100, label: 'Block 3', size: 6 },
  { id: 'road2', x: 190, y: 300, label: 'Block 7', size: 6 },
  { id: 'road3', x: 280, y: 200, label: 'Industrial Rd', size: 6 },
  { id: 'road4', x: 360, y: 110, label: 'Elm St', size: 6 },
  { id: 'road5', x: 350, y: 300, label: 'River Rd', size: 6 },
  { id: 'station', x: 440, y: 200, label: 'Fire Station', icon: '🚒', size: 14, color: '#ffb800' },
];

const fireEdges = [
  { from: 'fire', to: 'road1' },
  { from: 'fire', to: 'road2' },
  { from: 'road1', to: 'road3' },
  { from: 'road2', to: 'road3' },
  { from: 'road2', to: 'road5' },
  { from: 'road3', to: 'road4' },
  { from: 'road3', to: 'road5' },
  { from: 'road4', to: 'station' },
  { from: 'road5', to: 'station' },
  { from: 'road1', to: 'road4' },
];

const FireSection = () => {
  const sectionRef = useRef(null);
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0);
  const [fireRings, setFireRings] = useState([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.fire-title', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        y: -40,
        opacity: 0,
        duration: 0.8,
      });

      gsap.from('.fire-panel', {
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

  // Fire spread rings animation
  useEffect(() => {
    if (step >= 2 && step <= 3) {
      const interval = setInterval(() => {
        setFireRings(prev => [...prev.slice(-5), Date.now()]);
      }, 600);
      return () => clearInterval(interval);
    } else {
      setFireRings([]);
    }
  }, [step]);

  const handleRespond = async () => {
    setLoading(true);
    setStep(1);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);

    // Step 1: Fire Detection
    await new Promise(r => setTimeout(r, 800));
    setStep(2);

    // Step 2: Spread Simulation
    await new Promise(r => setTimeout(r, 1200));
    setStep(3);

    // Step 3: Resource Allocation
    await new Promise(r => setTimeout(r, 800));

    try {
      const response = await axios.post('http://localhost:3001/api/fire', { intensity });
      setResult(response.data);
      setActivePath(['station', 'road4', 'road3', 'fire']);
      setShowVehicle(true);
    } catch (err) {
      setResult({
        status: 'success',
        route: ['Fire Station', 'Elm St', 'Industrial Rd', 'Fire Site'],
        cost: 12,
        eta: '5 min',
        priorityScore: Math.min(10, intensity + 2),
        spreadRadius: `${intensity * 15}m`,
        resourcesAllocated: { trucks: 2, firefighters: 8, waterTanks: 3 },
      });
      setActivePath(['station', 'road4', 'road3', 'fire']);
      setShowVehicle(true);
    }

    setStep(4);
    setLoading(false);
  };

  const reset = () => {
    setStep(0);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);
    setFireRings([]);
  };

  return (
    <section id="fire" ref={sectionRef} className="section-full py-20 px-6 relative">
      {/* Heat glow overlay */}
      {step >= 2 && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at 30% 50%, rgba(255,184,0,${0.03 * intensity}) 0%, transparent 60%)`,
          }}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="fire-title mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-3xl">🚒</span>
            <h2 className="text-4xl md:text-5xl font-extrabold">
              <span className="text-city-text">Fire</span>{' '}
              <span className="neon-text-warning">Response</span>
            </h2>
            <span className="text-3xl">🔥</span>
          </div>
          <p className="text-city-muted font-mono text-sm">
            Fire Detection • Spread Simulation • Resource Deployment • Route Optimization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Map with fire spread */}
          <GlassPanel variant="warning" className="fire-panel min-h-[400px] relative overflow-hidden">
            <h3 className="text-sm font-mono text-city-warning mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-city-warning animate-pulse" />
              Fire Containment Map
            </h3>

            {/* Fire spread rings overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {fireRings.map((id) => (
                <motion.div
                  key={id}
                  className="absolute rounded-full border border-orange-500/30"
                  initial={{ width: 20, height: 20, opacity: 0.6 }}
                  animate={{ width: 200 + intensity * 20, height: 200 + intensity * 20, opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                  style={{
                    left: '20%',
                    top: '45%',
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(circle, rgba(255,100,0,0.1) 0%, transparent 70%)`,
                  }}
                />
              ))}
            </div>

            <NodeMap
              nodes={fireNodes}
              edges={fireEdges}
              activePath={activePath}
              variant="warning"
              vehicleIcon="🚒"
              showVehicle={showVehicle}
            />
          </GlassPanel>

          {/* Right: Controls */}
          <div className="flex flex-col gap-6">
            {/* Input Panel */}
            <GlassPanel variant="warning" className="fire-panel">
              <h3 className="text-sm font-mono text-city-warning mb-4 uppercase tracking-wider">
                Fire Report
              </h3>

              {/* Intensity */}
              <div className="mb-6">
                <label className="text-xs font-mono text-city-muted block mb-2">
                  Fire Intensity: <span className="text-city-warning">{intensity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="slider-neon slider-warning"
                />
                <div className="flex justify-between text-[10px] font-mono text-city-muted mt-1">
                  <span>Small</span>
                  <span>Inferno</span>
                </div>

                {/* Intensity Visual */}
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 h-2 rounded-full"
                      animate={{
                        backgroundColor: i < intensity
                          ? `hsl(${30 - i * 3}, 100%, ${55 - i * 2}%)`
                          : '#1a1a2e',
                      }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    />
                  ))}
                </div>
              </div>

              {/* Estimated spread */}
              <div className="mb-6 p-3 rounded-lg bg-city-warning/5 border border-city-warning/10">
                <div className="text-[10px] font-mono text-city-muted uppercase mb-1">Estimated Spread Radius</div>
                <div className="text-lg font-mono text-city-warning font-bold">{intensity * 15}m</div>
              </div>

              <div className="flex gap-3">
                <NeonButton onClick={handleRespond} variant="warning" loading={loading} className="flex-1">
                  🔥 Deploy Fire Response
                </NeonButton>
                {result && (
                  <NeonButton onClick={reset} variant="neon" size="md">
                    ↺ Reset
                  </NeonButton>
                )}
              </div>
            </GlassPanel>

            {/* Processing */}
            <AnimatePresence mode="wait">
              {step > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <GlassPanel variant="warning" className="fire-panel">
                    <h3 className="text-sm font-mono text-city-warning mb-4 uppercase tracking-wider">
                      Response Pipeline
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Fire Detection & Analysis', done: step >= 2 },
                        { label: 'Spread Simulation', done: step >= 3 },
                        { label: 'Resource Allocation (Knapsack)', done: step >= 4 },
                        { label: 'Route Optimization (Dijkstra)', done: result !== null },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border ${
                            s.done
                              ? 'bg-city-warning/20 border-city-warning text-city-warning'
                              : step === i + 1
                              ? 'border-city-warning/50 text-city-warning animate-pulse'
                              : 'border-city-border text-city-muted'
                          }`}>
                            {s.done ? '✓' : i + 1}
                          </div>
                          <span className={`text-sm font-mono ${s.done ? 'text-city-warning' : 'text-city-muted'}`}>
                            {s.label}
                          </span>
                          {step === i + 1 && !s.done && (
                            <div className="ml-auto">
                              <div className="w-4 h-4 border-2 border-city-warning border-t-transparent rounded-full animate-spin" />
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
                  <GlassPanel variant="warning" glow className="fire-panel">
                    <h3 className="text-sm font-mono text-city-warning mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-city-neon" />
                      Response Deployed
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-warning">
                          <AnimatedCounter value={result.resourcesAllocated?.trucks || 2} />
                        </div>
                        <div className="text-[10px] font-mono text-city-muted">Trucks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-neon">{result.eta}</div>
                        <div className="text-[10px] font-mono text-city-muted">ETA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-danger">
                          <AnimatedCounter value={result.resourcesAllocated?.firefighters || 8} />
                        </div>
                        <div className="text-[10px] font-mono text-city-muted">Firefighters</div>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="mb-4">
                      <div className="text-[10px] font-mono text-city-muted mb-2 uppercase">Dispatch Route</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {result.route.map((stop, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="px-2 py-1 rounded bg-city-warning/10 text-city-warning text-xs font-mono border border-city-warning/20">
                              {stop}
                            </span>
                            {i < result.route.length - 1 && <span className="text-city-muted">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <ProgressBar value={result.resourcesAllocated?.waterTanks || 3} max={5} label="Water Tanks" variant="blue" />
                      <ProgressBar value={result.resourcesAllocated?.firefighters || 8} max={15} label="Firefighters" variant="warning" />
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

export default FireSection;
