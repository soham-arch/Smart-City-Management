/**
 * DashboardPage.jsx — Command Dashboard / Overview
 *
 * Displays a comprehensive real-time overview of all emergency services:
 *   - 12-stat overview grid (incidents, units, beds, patients, stations)
 *   - Service status panels for Ambulance/Police/Fire (utilization %, active count)
 *   - Live Incident Feed with expandable detail cards
 *   - Interactive Resource Heatmap (NodeMap with service data overlays)
 *   - Infrastructure summary (hospital capacity bars, police/fire station usage)
 *
 * Data sources: useCityStats (aggregated stats), usePolling (hospitals, incidents, etc.)
 * Animations: GSAP scroll-triggered entrance animations for all sections
 */
import { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GlassPanel from '../components/GlassPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import ProgressBar from '../components/ProgressBar';
import IncidentFeed from '../components/IncidentFeed';
import NodeMap from '../components/NodeMap';
import { useCityStats } from '../hooks/useCityStats';
import { usePolling } from '../hooks/usePolling';
import { puneNodes } from '../data/puneNodes';
import { puneEdges } from '../data/puneEdges';

gsap.registerPlugin(ScrollTrigger);

const DashboardPage = () => {
  const { stats } = useCityStats();
  const { data: hospitals } = usePolling('hospitals');
  const { data: policeStations } = usePolling('police_stations');
  const { data: fireStations } = usePolling('fire_stations');
  const { data: allIncidents } = usePolling('incidents');
  const incidents = [...allIncidents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const statsGridRef = useRef(null);
  const serviceRef = useRef(null);
  const feedRef = useRef(null);

  // GSAP scroll-triggered animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header fly-in
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );

      // Stats grid stagger
      if (statsGridRef.current) {
        gsap.fromTo(statsGridRef.current.children,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out', delay: 0.3 }
        );
      }

      // Service panels fly-in
      if (serviceRef.current) {
        gsap.fromTo(serviceRef.current.children,
          { opacity: 0, x: -40 },
          { 
            opacity: 1, x: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: serviceRef.current, start: 'top 80%' }
          }
        );
      }

      // Feed section
      if (feedRef.current) {
        gsap.fromTo(feedRef.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: feedRef.current, start: 'top 80%' }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Build combined service data for heatmap tooltips
  const serviceData = useMemo(() => {
    const map = {};
    hospitals.forEach(h => { map[h.map_node_id] = h; });
    policeStations.forEach(p => { map[p.map_node_id] = p; });
    fireStations.forEach(f => { map[f.map_node_id] = f; });
    return map;
  }, [hospitals, policeStations, fireStations]);

  const overviewStats = [
    { label: 'Active Incidents', value: stats.activeIncidents, color: '#ff2d55', icon: '⚡' },
    { label: 'Units Deployed', value: stats.unitsDeployed, color: '#ffb800', icon: '🚨' },
    { label: 'Ambulance Active', value: stats.ambulanceUnits, color: '#3d8fff', icon: '🚑' },
    { label: 'Police Active', value: stats.policeUnits, color: '#ff2d55', icon: '🚓' },
    { label: 'Fire Active', value: stats.fireUnits, color: '#ffb800', icon: '🚒' },
    { label: 'Avg ETA', value: parseFloat(stats.avgResponseTime) || 0, suffix: ' min', color: '#39ff8f', icon: '⏱' },
    { label: 'Beds Available', value: stats.bedsAvailable, color: '#3d8fff', icon: '🏥' },
    { label: 'ICU Beds', value: stats.icuBedsAvailable, color: '#ff2d55', icon: '🫀' },
    { label: 'Patients', value: stats.totalPatients, color: '#ffb800', icon: '🩺' },
    { label: 'Hospitals', value: stats.totalHospitals, color: '#3d8fff', icon: '🏛' },
    { label: 'Police Stations', value: stats.totalPoliceStations, color: '#ff2d55', icon: '🏢' },
    { label: 'Fire Stations', value: stats.totalFireStations, color: '#ffb800', icon: '🔥' },
  ];

  const serviceStatus = [
    {
      name: 'Ambulance', icon: '🚑', color: '#3d8fff',
      active: stats.ambulanceUnits,
      totalUnits: hospitals.reduce((s, h) => s + (h.ambulances_stationed || 0), 0),
      availableUnits: hospitals.reduce((s, h) => s + (h.ambulances_available || 0), 0),
      lastIncident: incidents.find(i => i.type === 'ambulance'),
    },
    {
      name: 'Police', icon: '🚓', color: '#ff2d55',
      active: stats.policeUnits,
      totalUnits: policeStations.reduce((s, p) => s + (p.units_total || 0), 0),
      availableUnits: policeStations.reduce((s, p) => s + (p.units_available || 0), 0),
      lastIncident: incidents.find(i => i.type === 'police'),
    },
    {
      name: 'Fire', icon: '🚒', color: '#ffb800',
      active: stats.fireUnits,
      totalUnits: fireStations.reduce((s, f) => s + (f.trucks_total || 0), 0),
      availableUnits: fireStations.reduce((s, f) => s + (f.trucks_available || 0), 0),
      lastIncident: incidents.find(i => i.type === 'fire'),
    },
  ];

  const timeAgo = (date) => {
    if (!date) return 'None';
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  const statusColor = stats.systemStatus === 'all_clear' ? '#39ff8f' : stats.systemStatus === 'critical' ? '#ff2d55' : '#ffb800';
  const statusLabel = stats.systemStatus === 'all_clear' ? 'ALL CLEAR' : stats.systemStatus === 'critical' ? 'CRITICAL' : 'ACTIVE';

  return (
    <section ref={sectionRef} className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header with glitch effect */}
        <div ref={headerRef} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              <span className="text-white">Command </span>
              <span className="glitch-text neon-text" data-text="Dashboard">Dashboard</span>
            </h1>
            {/* Live system status badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full ml-auto"
              style={{
                border: `1px solid ${statusColor}30`,
                background: `${statusColor}08`,
              }}>
              <span className="w-2 h-2 rounded-full animate-pulse" 
                style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
              <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
              Real-time overview of all emergency services in Pune
            </p>
            {stats.lastUpdated && (
              <span className="text-[10px] font-mono text-[rgba(255,255,255,0.3)] ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39ff8f] animate-pulse" />
                Last sync: {new Date(stats.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Overview Stats Grid */}
        <div ref={statsGridRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {overviewStats.map((stat, idx) => (
            <div
              key={idx}
              className="stat-card text-center group"
            >
              <div className="text-lg mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{stat.icon}</div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} duration={1.5} />
              </div>
              <div className="text-[9px] font-mono text-[rgba(255,255,255,0.45)] mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Service Status Panels */}
        <div ref={serviceRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {serviceStatus.map((svc) => {
            const utilization = svc.totalUnits > 0 ? ((svc.totalUnits - svc.availableUnits) / svc.totalUnits) * 100 : 0;
            const status = utilization > 80 ? 'CRITICAL' : utilization > 50 ? 'DEGRADED' : 'OPERATIONAL';
            const sColor = status === 'CRITICAL' ? '#ff2d55' : status === 'DEGRADED' ? '#ffb800' : '#39ff8f';

            return (
              <GlassPanel key={svc.name}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{svc.icon}</span>
                  <h3 className="text-sm font-heading font-semibold text-white">{svc.name}</h3>
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase"
                    style={{ color: sColor, backgroundColor: `${sColor}15`, border: `1px solid ${sColor}30` }}>
                    {status}
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.5)]">Active Incidents</span>
                    <span style={{ color: svc.color }}>{svc.active}</span>
                  </div>
                  <ProgressBar value={svc.totalUnits - svc.availableUnits} max={svc.totalUnits}
                    label={`Units: ${svc.availableUnits} available / ${svc.totalUnits} total`}
                    variant={svc.name === 'Ambulance' ? 'blue' : svc.name === 'Police' ? 'danger' : 'warning'} />
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.5)]">Utilization</span>
                    <span style={{ color: sColor }}>{Math.round(utilization)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.5)]">Last Incident</span>
                    <span className="text-[rgba(255,255,255,0.7)] truncate max-w-[180px]">
                      {svc.lastIncident ? `${svc.lastIncident.location_name} — ${timeAgo(svc.lastIncident.created_at)}` : 'None'}
                    </span>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>

        {/* Two-column: Incident Feed + Resource Heatmap */}
        <div ref={feedRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Incident Feed */}
          <GlassPanel>
            <h3 className="text-sm font-mono text-[#39ff8f] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
              Live Incident Feed
              <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.3)]">
                {allIncidents.length} total records
              </span>
            </h3>
            <IncidentFeed limit={15} />
          </GlassPanel>

          {/* Resource Heatmap */}
          <GlassPanel className="relative overflow-hidden" style={{ minHeight: 400 }}>
            <h3 className="text-sm font-mono text-[#39ff8f] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
              Resource Heatmap
              <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.3)]">
                Click nodes for details
              </span>
            </h3>
            <NodeMap
              nodes={puneNodes}
              edges={puneEdges}
              activePath={[]}
              variant="neon"
              serviceData={serviceData}
              readOnly={true}
            />
          </GlassPanel>
        </div>

        {/* Infrastructure Summary */}
        <motion.div 
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Hospital Summary */}
          <GlassPanel>
            <h3 className="text-sm font-mono text-[#3d8fff] mb-3 uppercase tracking-wider">🏥 Hospital Capacity</h3>
            <div className="space-y-2">
              {hospitals.slice(0, 5).map(h => {
                const usage = h.beds_total > 0 ? ((h.beds_total - h.beds_available) / h.beds_total * 100) : 0;
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.6)] w-[120px] truncate">{h.name}</span>
                    <div className="flex-1 mem-bar-track">
                      <div className="mem-bar-fill" style={{ width: `${usage}%`, background: usage > 80 ? '#ff2d55' : '#3d8fff' }} />
                    </div>
                    <span className="text-[9px] font-mono text-[rgba(255,255,255,0.5)] w-[40px] text-right">{Math.round(usage)}%</span>
                  </div>
                );
              })}
              {hospitals.length === 0 && <div className="text-[11px] font-mono text-[rgba(255,255,255,0.3)]">No hospitals loaded</div>}
            </div>
          </GlassPanel>

          {/* Police Summary */}
          <GlassPanel>
            <h3 className="text-sm font-mono text-[#ff2d55] mb-3 uppercase tracking-wider">🏛 Police Stations</h3>
            <div className="space-y-2">
              {policeStations.slice(0, 5).map(s => {
                const usage = s.units_total > 0 ? ((s.units_total - s.units_available) / s.units_total * 100) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.6)] w-[120px] truncate">{s.name}</span>
                    <div className="flex-1 mem-bar-track">
                      <div className="mem-bar-fill" style={{ width: `${usage}%`, background: usage > 80 ? '#ff2d55' : '#ff2d55' }} />
                    </div>
                    <span className="text-[9px] font-mono text-[rgba(255,255,255,0.5)] w-[40px] text-right">{s.units_available}/{s.units_total}</span>
                  </div>
                );
              })}
              {policeStations.length === 0 && <div className="text-[11px] font-mono text-[rgba(255,255,255,0.3)]">No stations loaded</div>}
            </div>
          </GlassPanel>

          {/* Fire Summary */}
          <GlassPanel>
            <h3 className="text-sm font-mono text-[#ffb800] mb-3 uppercase tracking-wider">🚒 Fire Stations</h3>
            <div className="space-y-2">
              {fireStations.slice(0, 5).map(s => {
                const usage = s.trucks_total > 0 ? ((s.trucks_total - s.trucks_available) / s.trucks_total * 100) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.6)] w-[120px] truncate">{s.name}</span>
                    <div className="flex-1 mem-bar-track">
                      <div className="mem-bar-fill" style={{ width: `${usage}%`, background: usage > 80 ? '#ff2d55' : '#ffb800' }} />
                    </div>
                    <span className="text-[9px] font-mono text-[rgba(255,255,255,0.5)] w-[40px] text-right">{s.trucks_available}/{s.trucks_total}</span>
                  </div>
                );
              })}
              {fireStations.length === 0 && <div className="text-[11px] font-mono text-[rgba(255,255,255,0.3)]">No stations loaded</div>}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPage;
