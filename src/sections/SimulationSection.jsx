import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GlassPanel from '../components/GlassPanel';
import NeonButton from '../components/NeonButton';
import AnimatedCounter from '../components/AnimatedCounter';
import ProgressBar from '../components/ProgressBar';

gsap.registerPlugin(ScrollTrigger);

const pipelineSteps = [
  {
    id: 'priority',
    icon: '📊',
    title: 'Priority Queue',
    subtitle: 'Emergency prioritization',
    description: 'Sorting incoming emergencies by severity, time, and resource requirements. Critical cases are escalated automatically.',
    color: 'neon',
    items: [
      { label: 'Fire — Intensity 9', priority: 9, color: '#ffb800' },
      { label: 'Robbery — Severity 7', priority: 7, color: '#ff2d55' },
      { label: 'Cardiac — Severity 8', priority: 8, color: '#3d8fff' },
      { label: 'Accident — Severity 5', priority: 5, color: '#39ff8f' },
    ],
  },
  {
    id: 'sorting',
    icon: '🔄',
    title: 'Resource Sorting',
    subtitle: 'Optimal resource ordering',
    description: 'Resources sorted by proximity, availability, and specialization to ensure fastest response times.',
    color: 'blue',
    resources: [
      { name: 'Fire Truck Alpha', distance: '1.2km', status: 'Available' },
      { name: 'Ambulance Unit 3', distance: '0.8km', status: 'Available' },
      { name: 'Police Unit 7', distance: '2.1km', status: 'En Route' },
      { name: 'Fire Truck Beta', distance: '3.5km', status: 'Available' },
    ],
  },
  {
    id: 'knapsack',
    icon: '🎒',
    title: 'Knapsack Allocation',
    subtitle: 'Maximize resource utilization',
    description: 'Optimal allocation of limited resources across multiple emergencies to maximize coverage and minimize response time.',
    color: 'warning',
    allocations: [
      { resource: 'Ambulances', allocated: 3, total: 5 },
      { resource: 'Police Units', allocated: 4, total: 6 },
      { resource: 'Fire Trucks', allocated: 2, total: 4 },
      { resource: 'Paramedics', allocated: 6, total: 10 },
    ],
  },
  {
    id: 'dijkstra',
    icon: '🗺️',
    title: 'Dijkstra Routing',
    subtitle: 'Shortest path computation',
    description: 'Computing optimal routes through the city network graph, accounting for traffic, road closures, and distance.',
    color: 'danger',
    routes: [
      { from: 'Station A', to: 'Fire Zone', path: ['Station A', 'Main St', 'Industrial', 'Fire Zone'], cost: 8 },
      { from: 'Hospital', to: 'Accident', path: ['Hospital', 'Highway', 'Oak Ave', 'Accident'], cost: 5 },
    ],
  },
];

const SimulationSection = () => {
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const [sortedItems, setSortedItems] = useState([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.sim-title', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.8,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const runSimulation = async () => {
    setIsRunning(true);
    setCompleted(false);
    setCurrentStep(-1);
    setSortedItems([]);

    for (let i = 0; i < pipelineSteps.length; i++) {
      setCurrentStep(i);

      // Animate priority sorting for step 0
      if (i === 0) {
        const items = [...pipelineSteps[0].items];
        setSortedItems(items);
        await new Promise(r => setTimeout(r, 500));

        // Sort animation
        const sorted = [...items].sort((a, b) => b.priority - a.priority);
        setSortedItems(sorted);
      }

      await new Promise(r => setTimeout(r, 2500));
    }

    setCompleted(true);
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setCurrentStep(-1);
    setCompleted(false);
    setSortedItems([]);
  };

  const getColorClass = (color) => ({
    neon: { text: 'text-city-neon', bg: 'bg-city-neon', border: 'border-city-neon' },
    blue: { text: 'text-city-blue', bg: 'bg-city-blue', border: 'border-city-blue' },
    warning: { text: 'text-city-warning', bg: 'bg-city-warning', border: 'border-city-warning' },
    danger: { text: 'text-city-danger', bg: 'bg-city-danger', border: 'border-city-danger' },
  }[color]);

  return (
    <section id="simulation" ref={sectionRef} className="min-h-screen py-20 px-6 relative">
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="sim-title text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-city-neon/20 bg-city-neon/5 mb-6">
            <span className="text-xs font-mono text-city-neon tracking-wider uppercase">Algorithm Pipeline</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-4">
            <span className="text-city-text">Emergency</span>{' '}
            <span className="neon-text">Simulation</span>
          </h2>
          <p className="text-city-muted font-mono text-sm max-w-xl mx-auto">
            Watch the complete emergency response pipeline in action — from prioritization to route optimization.
          </p>

          {/* Start Button */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {!isRunning && !completed && (
              <NeonButton onClick={runSimulation} variant="neon" size="lg">
                ⚡ Start Emergency Simulation
              </NeonButton>
            )}
            {completed && (
              <NeonButton onClick={reset} variant="neon" size="lg">
                ↺ Run Again
              </NeonButton>
            )}
            {isRunning && (
              <div className="flex items-center gap-3 text-city-neon font-mono text-sm">
                <div className="w-5 h-5 border-2 border-city-neon border-t-transparent rounded-full animate-spin" />
                Running Simulation...
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Progress */}
        {(isRunning || completed) && (
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {pipelineSteps.map((step, idx) => {
                const colors = getColorClass(step.color);
                const isActive = idx === currentStep;
                const isDone = idx < currentStep || completed;

                return (
                  <div key={step.id} className="flex items-center">
                    {/* Step Circle */}
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                        isDone
                          ? `${colors.border} ${colors.bg}/20`
                          : isActive
                          ? `${colors.border} animate-pulse`
                          : 'border-city-border'
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {isDone ? '✓' : step.icon}
                    </motion.div>

                    {/* Connector Line */}
                    {idx < pipelineSteps.length - 1 && (
                      <div className="w-16 md:w-24 h-0.5 mx-2">
                        <motion.div
                          className="h-full rounded-full"
                          animate={{
                            backgroundColor: isDone ? '#39ff8f' : '#1a1a2e',
                            scaleX: isDone ? 1 : 0.3,
                          }}
                          style={{ transformOrigin: 'left' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Horizontal Scrolling Pipeline Cards */}
        {(isRunning || completed) && (
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-6 scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex gap-6 min-w-max px-4">
              {pipelineSteps.map((step, idx) => {
                const colors = getColorClass(step.color);
                const isActive = idx === currentStep;
                const isDone = idx < currentStep || completed;
                const isVisible = idx <= currentStep || completed;

                if (!isVisible) return null;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, delay: 0.1 }}
                    className="w-[380px] flex-shrink-0"
                  >
                    <GlassPanel
                      variant={step.color === 'neon' ? 'default' : step.color === 'blue' ? 'blue' : step.color === 'warning' ? 'warning' : 'danger'}
                      glow={isActive}
                      className={`h-full transition-all duration-500 ${isActive ? 'ring-1 ring-offset-0' : ''}`}
                      style={{ '--tw-ring-color': isActive ? colors.text : 'transparent' }}
                    >
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{step.icon}</span>
                        <div>
                          <h4 className={`font-bold text-lg ${colors.text}`}>{step.title}</h4>
                          <p className="text-xs font-mono text-city-muted">{step.subtitle}</p>
                        </div>
                        {isDone && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto w-6 h-6 rounded-full bg-city-neon/20 flex items-center justify-center"
                          >
                            <span className="text-city-neon text-xs">✓</span>
                          </motion.div>
                        )}
                      </div>

                      <p className="text-xs text-city-muted mb-4 leading-relaxed">{step.description}</p>

                      {/* Step-specific content */}
                      {step.id === 'priority' && (
                        <div className="space-y-2">
                          {(sortedItems.length > 0 ? sortedItems : step.items).map((item, i) => (
                            <motion.div
                              key={item.label}
                              layout
                              className="flex items-center justify-between p-2 rounded-lg bg-city-dark/50 border border-city-border/50"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <span className="text-xs font-mono text-city-text">{item.label}</span>
                              <span
                                className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                                style={{ color: item.color, backgroundColor: item.color + '15' }}
                              >
                                P{item.priority}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {step.id === 'sorting' && (
                        <div className="space-y-2">
                          {step.resources.map((res, i) => (
                            <motion.div
                              key={res.name}
                              className="flex items-center justify-between p-2 rounded-lg bg-city-dark/50 border border-city-border/50"
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.15 }}
                            >
                              <div>
                                <span className="text-xs font-mono text-city-text block">{res.name}</span>
                                <span className="text-[10px] font-mono text-city-muted">{res.distance}</span>
                              </div>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                res.status === 'Available'
                                  ? 'text-city-neon bg-city-neon/10'
                                  : 'text-city-warning bg-city-warning/10'
                              }`}>
                                {res.status}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {step.id === 'knapsack' && (
                        <div className="space-y-3">
                          {step.allocations.map((alloc, i) => (
                            <motion.div
                              key={alloc.resource}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.2 }}
                            >
                              <ProgressBar
                                value={alloc.allocated}
                                max={alloc.total}
                                label={`${alloc.resource} (${alloc.allocated}/${alloc.total})`}
                                variant={i === 0 ? 'blue' : i === 1 ? 'danger' : i === 2 ? 'warning' : 'neon'}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {step.id === 'dijkstra' && (
                        <div className="space-y-3">
                          {step.routes.map((route, i) => (
                            <motion.div
                              key={i}
                              className="p-3 rounded-lg bg-city-dark/50 border border-city-border/50"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.3 }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-mono text-city-danger">{route.from} → {route.to}</span>
                                <span className="text-xs font-mono text-city-neon">Cost: {route.cost}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {route.path.map((node, j) => (
                                  <span key={j} className="flex items-center gap-1">
                                    <motion.span
                                      className="px-1.5 py-0.5 rounded bg-city-danger/10 text-city-danger text-[10px] font-mono border border-city-danger/20"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: 0.3 + j * 0.15 }}
                                    >
                                      {node}
                                    </motion.span>
                                    {j < route.path.length - 1 && <span className="text-city-muted text-[10px]">→</span>}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Loading indicator for active step */}
                      {isActive && !isDone && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                          <div className={`w-4 h-4 border-2 ${colors.border} border-t-transparent rounded-full animate-spin`} />
                          <span className={`text-xs font-mono ${colors.text}`}>Processing...</span>
                        </div>
                      )}
                    </GlassPanel>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completion Summary */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', damping: 20 }}
              className="mt-12"
            >
              <GlassPanel glow className="max-w-3xl mx-auto text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.8 }}
                  className="w-16 h-16 rounded-full bg-city-neon/10 border border-city-neon/30 flex items-center justify-center mx-auto mb-4"
                >
                  <span className="text-3xl">✅</span>
                </motion.div>

                <h3 className="text-2xl font-bold neon-text mb-2">Simulation Complete</h3>
                <p className="text-city-muted font-mono text-sm mb-6">
                  All emergency responses optimized and dispatched successfully.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: 4, label: 'Emergencies', suffix: '', color: 'text-city-neon' },
                    { value: 15, label: 'Resources', suffix: '', color: 'text-city-blue' },
                    { value: 98, label: 'Efficiency', suffix: '%', color: 'text-city-warning' },
                    { value: 3, label: 'Avg ETA', suffix: 'm', color: 'text-city-danger' },
                  ].map((stat, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-city-dark/50 border border-city-border/50">
                      <div className={`text-xl font-bold font-mono ${stat.color}`}>
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-[10px] font-mono text-city-muted uppercase mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default SimulationSection;
