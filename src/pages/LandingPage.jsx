import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import TypingText from '../components/TypingText';
import ScrollIndicator from '../components/ScrollIndicator';
import AnimatedCounter from '../components/AnimatedCounter';
import GlassPanel from '../components/GlassPanel';
import IncidentFeed from '../components/IncidentFeed';
import { useCityStats } from '../hooks/useCityStats';

const LandingPage = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const statsRef = useRef(null);
  const { stats, loading: statsLoading } = useCityStats();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from(titleRef.current, { y: 60, opacity: 0, scale: 0.9, duration: 1.2 })
        .from(subtitleRef.current, { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
        .from(statsRef.current, { y: 40, opacity: 0, duration: 0.8 }, '-=0.3');
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const liveStats = [
    { value: stats.activeIncidents, suffix: '', label: 'Active Incidents', color: '#ff2d55' },
    { value: stats.unitsDeployed, suffix: '', label: 'Units Deployed', color: '#3d8fff' },
    { value: parseFloat(stats.avgResponseTime) || 0, suffix: ' min', label: 'Avg Response', color: '#39ff8f' },
    { value: stats.bedsAvailable, suffix: '', label: 'Beds Available', color: '#ffb800' },
  ];

  const emergencyCards = [
    {
      icon: '🚑',
      title: 'AMBULANCE',
      desc: 'Medical Crisis',
      path: '/ambulance',
      color: '#3d8fff',
    },
    {
      icon: '🚓',
      title: 'POLICE',
      desc: 'Crime / Safety',
      path: '/police',
      color: '#ff2d55',
    },
    {
      icon: '🚒',
      title: 'FIRE',
      desc: 'Fire Hazard',
      path: '/fire',
      color: '#ffb800',
    },
  ];

  const statusColor = stats.systemStatus === 'all_clear' ? '#39ff8f' : '#ff2d55';
  const statusLabel = stats.systemStatus === 'all_clear' ? 'ALL CLEAR' : 'ACTIVE EMERGENCY';

  return (
    <div ref={sectionRef}>
      {/* ── Hero Section ── */}
      <section className="section-full flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07070c] z-[1]" />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          {/* Live status badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              border: `1px solid ${statusColor}30`,
              background: `${statusColor}08`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
            />
            <span className="text-xs font-mono tracking-wider uppercase" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </motion.div>

          {/* Eyebrow label */}
          <div className="font-mono text-[10px] tracking-[0.4em] text-[#39ff8f] uppercase mb-6 opacity-80">
            // an AI-powered emergency management system
          </div>

          {/* Title with glitch effect */}
          <h1 ref={titleRef} className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold leading-tight mb-6">
            <span className="glitch-text text-white" data-text="NEXUS">NEXUS</span>
            <br />
            <span className="neon-text">Smart City Emergency System</span>
          </h1>

          {/* Subtitle */}
          <div ref={subtitleRef} className="mb-8">
            <p className="text-lg md:text-xl text-[rgba(255,255,255,0.5)] mb-4 font-light">
              AI-Powered Emergency Optimization for Pune
            </p>
            <div className="text-[#39ff8f]/70 text-sm md:text-base h-6">
              <TypingText
                texts={[
                  'Protecting Pune, 24/7',
                  'AI-Powered Dispatch',
                  'Real-time Resource Tracking',
                  'Optimizing ambulance dispatch routes...',
                ]}
                speed={50}
                deleteSpeed={30}
                pauseDuration={1500}
              />
            </div>
          </div>

          {/* Live Stats */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
            {liveStats.map((stat, idx) => (
              <motion.div
                key={idx}
                className="glass-panel p-4 text-center"
                whileHover={{ scale: 1.05, borderColor: `${stat.color}40` }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="text-2xl md:text-3xl font-bold" style={{ color: stat.color }}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
                </div>
                <div className="text-[10px] md:text-xs font-mono text-[rgba(255,255,255,0.45)] mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <ScrollIndicator />

        {/* Decorative side lines */}
        <div className="absolute left-8 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-[#39ff8f]/20 to-transparent" />
        <div className="absolute right-8 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-[#39ff8f]/20 to-transparent" />
      </section>

      {/* ── Divider ── */}
      <div className="relative h-px max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#39ff8f]/20 to-transparent" />
      </div>

      {/* ── Report Emergency Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            <span className="text-white">Report </span>
            <span className="neon-text">Emergency</span>
          </h2>
          <p className="text-center text-[rgba(255,255,255,0.45)] font-mono text-sm mb-12">
            Select the type of emergency to begin dispatch
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {emergencyCards.map((card) => (
              <motion.div
                key={card.path}
                className="glass-panel p-8 text-center cursor-pointer group"
                style={{ borderColor: `${card.color}15` }}
                whileHover={{
                  scale: 1.05,
                  borderColor: `${card.color}60`,
                  boxShadow: `0 0 30px ${card.color}20`,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300 }}
                onClick={() => navigate(card.path)}
              >
                <div className="text-5xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-heading font-bold mb-2" style={{ color: card.color }}>
                  {card.title}
                </h3>
                <p className="text-sm text-[rgba(255,255,255,0.5)] font-mono mb-4">{card.desc}</p>
                <div
                  className="text-xs font-mono tracking-wider uppercase opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ color: card.color }}
                >
                  Click to report →
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative h-px max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#39ff8f]/20 to-transparent" />
      </div>

      {/* ── Algorithm Badges Section ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-heading font-bold mb-6">
            <span className="text-white">Powered by </span>
            <span className="neon-text">C++ Algorithms</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Dijkstra\'s Algorithm', color: '#39ff8f', desc: 'Shortest path routing' },
              { label: '0/1 Knapsack', color: '#3d8fff', desc: 'Resource allocation' },
              { label: 'Priority Queue', color: '#ff2d55', desc: 'Emergency triage' },
              { label: 'Merge Sort', color: '#ffb800', desc: 'Distance sorting' },
              { label: 'Max-Heap', color: '#39ff8f', desc: 'Crime queue management' },
            ].map((algo, idx) => (
              <motion.div
                key={idx}
                className="chip-badge"
                style={{ color: algo.color, borderColor: `${algo.color}25` }}
                whileHover={{ scale: 1.05, borderColor: `${algo.color}60` }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: algo.color }} />
                {algo.label}
              </motion.div>
            ))}
          </div>
          <p className="text-[rgba(255,255,255,0.3)] font-mono text-[10px] mt-4">
            Core execution runs through native C++ binaries for maximum performance
          </p>
        </div>
      </section>

      {/* ── Recent Incidents Feed ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-heading font-bold mb-2">
            <span className="text-white">Recent </span>
            <span className="neon-text">Incidents</span>
          </h2>
          <p className="text-[rgba(255,255,255,0.45)] font-mono text-sm mb-8">
            Live dispatch feed
          </p>

          <GlassPanel>
            <IncidentFeed limit={8} />
          </GlassPanel>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
