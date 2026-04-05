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

const policeNodes = [
  { id: 'crime', x: 100, y: 200, label: 'Crime Zone', icon: '⚠️', size: 14, pulse: true, color: '#ff2d55' },
  { id: 'sector1', x: 180, y: 90, label: 'Sector 1', size: 6 },
  { id: 'sector2', x: 170, y: 310, label: 'Sector 2', size: 6 },
  { id: 'junction', x: 270, y: 200, label: 'Junction A', size: 6 },
  { id: 'highway', x: 350, y: 120, label: 'Highway', size: 6 },
  { id: 'bridge', x: 340, y: 290, label: 'Bridge St', size: 6 },
  { id: 'station', x: 440, y: 200, label: 'Station', icon: '🏛️', size: 14, color: '#3d8fff' },
];

const policeEdges = [
  { from: 'crime', to: 'sector1' },
  { from: 'crime', to: 'sector2' },
  { from: 'sector1', to: 'junction' },
  { from: 'sector2', to: 'junction' },
  { from: 'sector2', to: 'bridge' },
  { from: 'junction', to: 'highway' },
  { from: 'junction', to: 'bridge' },
  { from: 'highway', to: 'station' },
  { from: 'bridge', to: 'station' },
  { from: 'sector1', to: 'highway' },
];

const crimeTypes = [
  { value: 'robbery', label: '🔫 Armed Robbery' },
  { value: 'assault', label: '👊 Assault' },
  { value: 'burglary', label: '🏠 Burglary' },
  { value: 'accident', label: '🚗 Traffic Accident' },
  { value: 'suspicious', label: '👁️ Suspicious Activity' },
];

const PoliceSection = () => {
  const sectionRef = useRef(null);
  const [crimeType, setCrimeType] = useState('robbery');
  const [severity, setSeverity] = useState(6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [showVehicle, setShowVehicle] = useState(false);
  const [step, setStep] = useState(0);
  const [alertFlash, setAlertFlash] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pol-title', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        x: 60,
        opacity: 0,
        duration: 0.8,
      });

      gsap.from('.pol-panel', {
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

  const handleDeploy = async () => {
    setLoading(true);
    setStep(1);
    setResult(null);
    setActivePath([]);
    setShowVehicle(false);
    setAlertFlash(true);

    // Flash effect
    setTimeout(() => setAlertFlash(false), 2000);

    // Step 1: Crime Analysis
    await new Promise(r => setTimeout(r, 800));
    setStep(2);

    // Step 2: Priority Ranking
    await new Promise(r => setTimeout(r, 800));
    setStep(3);

    try {
      const response = await axios.post('http://localhost:3001/api/police', {
        crimeType,
        severity,
      });
      setResult(response.data);
      setActivePath(['station', 'highway', 'junction', 'crime']);
      setShowVehicle(true);
    } catch (err) {
      setResult({
        status: 'success',
        route: ['Station Alpha', 'Highway', 'Junction A', 'Crime Zone'],
        cost: 5,
        eta: '3 min',
        priorityScore: Math.min(10, severity + 1),
        resourcesAllocated: { units: 2, officers: 4, backupAvailable: true },
      });
      setActivePath(['station', 'highway', 'junction', 'crime']);
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
    <section id="police" ref={sectionRef} className="section-full py-20 px-6 relative">
      {/* Alert flash overlay */}
      <AnimatePresence>
        {alertFlash && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0, 0.1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              background: 'linear-gradient(135deg, #ff2d5540, #3d8fff40)',
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="pol-title mb-12 text-right">
          <div className="flex items-center justify-end gap-3 mb-3">
            <h2 className="text-4xl md:text-5xl font-extrabold">
              <span className="text-city-text">Police</span>{' '}
              <span className="neon-text-danger">System</span>
            </h2>
            <span className="text-3xl">🚓</span>
          </div>
          <p className="text-city-muted font-mono text-sm">
            Crime Response Unit • Priority Dispatch • Real-time Unit Tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Controls + Results */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            {/* Input Panel */}
            <GlassPanel variant="danger" className="pol-panel">
              <h3 className="text-sm font-mono text-city-danger mb-4 uppercase tracking-wider">
                Crime Report
              </h3>

              {/* Crime Type */}
              <div className="mb-4">
                <label className="text-xs font-mono text-city-muted block mb-2">Crime Type</label>
                <select
                  value={crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  className="input-field"
                  style={{ borderColor: 'rgba(255,45,85,0.3)' }}
                >
                  {crimeTypes.map(ct => (
                    <option key={ct.value} value={ct.value} className="bg-city-dark">
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div className="mb-6">
                <label className="text-xs font-mono text-city-muted block mb-2">
                  Severity Level: <span className="text-city-danger">{severity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="slider-neon slider-danger"
                />
                <div className="flex justify-between text-[10px] font-mono text-city-muted mt-1">
                  <span>Minor</span>
                  <span>Critical</span>
                </div>
              </div>

              <div className="flex gap-3">
                <NeonButton onClick={handleDeploy} variant="danger" loading={loading} className="flex-1">
                  🚨 Deploy Units
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
                  <GlassPanel variant="danger" className="pol-panel">
                    <h3 className="text-sm font-mono text-city-danger mb-4 uppercase tracking-wider">
                      Response Pipeline
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Crime Analysis', done: step >= 2 },
                        { label: 'Priority Ranking', done: step >= 3 },
                        { label: 'Unit Deployment', done: result !== null },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border ${
                            s.done
                              ? 'bg-city-danger/20 border-city-danger text-city-danger'
                              : step === i + 1
                              ? 'border-city-danger/50 text-city-danger animate-pulse'
                              : 'border-city-border text-city-muted'
                          }`}>
                            {s.done ? '✓' : i + 1}
                          </div>
                          <span className={`text-sm font-mono ${s.done ? 'text-city-danger' : 'text-city-muted'}`}>
                            {s.label}
                          </span>
                          {step === i + 1 && !s.done && (
                            <div className="ml-auto">
                              <div className="w-4 h-4 border-2 border-city-danger border-t-transparent rounded-full animate-spin" />
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
                  <GlassPanel variant="danger" glow className="pol-panel">
                    <h3 className="text-sm font-mono text-city-danger mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-city-neon" />
                      Deployment Status
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-danger">
                          <AnimatedCounter value={result.resourcesAllocated?.units || 2} />
                        </div>
                        <div className="text-[10px] font-mono text-city-muted">Units</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-neon">{result.eta}</div>
                        <div className="text-[10px] font-mono text-city-muted">ETA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-city-blue">
                          <AnimatedCounter value={result.resourcesAllocated?.officers || 4} />
                        </div>
                        <div className="text-[10px] font-mono text-city-muted">Officers</div>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="mb-4">
                      <div className="text-[10px] font-mono text-city-muted mb-2 uppercase">Dispatch Route</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {result.route.map((stop, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className="px-2 py-1 rounded bg-city-danger/10 text-city-danger text-xs font-mono border border-city-danger/20">
                              {stop}
                            </span>
                            {i < result.route.length - 1 && <span className="text-city-muted">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>

                    <ProgressBar value={result.resourcesAllocated?.officers || 4} max={10} label="Officers Deployed" variant="danger" />
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Map */}
          <GlassPanel variant="danger" className="pol-panel min-h-[400px] order-1 lg:order-2">
            <h3 className="text-sm font-mono text-city-danger mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-city-danger animate-pulse" />
              Crime Zone Map
            </h3>
            <NodeMap
              nodes={policeNodes}
              edges={policeEdges}
              activePath={activePath}
              variant="danger"
              vehicleIcon="🚓"
              showVehicle={showVehicle}
            />
          </GlassPanel>
        </div>
      </div>
    </section>
  );
};

export default PoliceSection;
