import { useMemo } from 'react';
import { motion } from 'framer-motion';
import GlassPanel from '../components/GlassPanel';
import AnimatedCounter from '../components/AnimatedCounter';
import ProgressBar from '../components/ProgressBar';
import IncidentFeed from '../components/IncidentFeed';
import NodeMap from '../components/NodeMap';
import { useCityStats } from '../hooks/useCityStats';
import { useRealtime } from '../hooks/useRealtime';
import { puneNodes } from '../data/puneNodes';
import { puneEdges } from '../data/puneEdges';

const DashboardPage = () => {
  const { stats } = useCityStats();
  const { data: hospitals } = useRealtime('hospitals');
  const { data: policeStations } = useRealtime('police_stations');
  const { data: fireStations } = useRealtime('fire_stations');
  const { data: incidents } = useRealtime('incidents', { orderBy: 'created_at', orderAsc: false, limit: 20 });

  // Build combined service data for heatmap tooltips
  const serviceData = useMemo(() => {
    const map = {};
    hospitals.forEach(h => { map[h.map_node_id] = h; });
    policeStations.forEach(p => { map[p.map_node_id] = p; });
    fireStations.forEach(f => { map[f.map_node_id] = f; });
    return map;
  }, [hospitals, policeStations, fireStations]);

  const overviewStats = [
    { label: 'Active Incidents', value: stats.activeIncidents, color: '#ff2d55' },
    { label: 'Ambulance Units', value: stats.ambulanceUnits, color: '#3d8fff' },
    { label: 'Police Units', value: stats.policeUnits, color: '#ff2d55' },
    { label: 'Fire Units', value: stats.fireUnits, color: '#ffb800' },
    { label: 'Avg ETA', value: parseFloat(stats.avgResponseTime) || 0, suffix: ' min', color: '#39ff8f' },
    { label: 'Beds Available', value: stats.bedsAvailable, color: '#3d8fff' },
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

  return (
    <section className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            <span className="text-white">Command </span>
            <span className="neon-text">Dashboard</span>
          </h1>
          <p className="text-[rgba(255,255,255,0.5)] font-mono text-sm">
            Real-time overview of all emergency services in Pune
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {overviewStats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel p-4 text-center"
            >
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix || ''} duration={1.5} />
              </div>
              <div className="text-[10px] font-mono text-[rgba(255,255,255,0.45)] mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Service Status Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {serviceStatus.map((svc) => {
            const utilization = svc.totalUnits > 0 ? ((svc.totalUnits - svc.availableUnits) / svc.totalUnits) * 100 : 0;
            const status = utilization > 80 ? 'CRITICAL' : utilization > 50 ? 'DEGRADED' : 'OPERATIONAL';
            const statusColor = status === 'CRITICAL' ? '#ff2d55' : status === 'DEGRADED' ? '#ffb800' : '#39ff8f';

            return (
              <GlassPanel key={svc.name}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{svc.icon}</span>
                  <h3 className="text-sm font-heading font-semibold text-white">{svc.name}</h3>
                  <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase"
                    style={{ color: statusColor, backgroundColor: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
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
                    <span className="text-[rgba(255,255,255,0.5)]">Last Incident</span>
                    <span className="text-[rgba(255,255,255,0.7)]">
                      {svc.lastIncident ? `${svc.lastIncident.location_name} — ${timeAgo(svc.lastIncident.created_at)}` : 'None'}
                    </span>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>

        {/* Two-column: Incident Feed + Resource Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Incident Feed */}
          <GlassPanel>
            <h3 className="text-sm font-mono text-[#39ff8f] mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
              Live Incident Feed
            </h3>
            <IncidentFeed limit={15} />
          </GlassPanel>

          {/* Resource Heatmap */}
          <GlassPanel className="relative overflow-hidden" style={{ minHeight: 400 }}>
            <h3 className="text-sm font-mono text-[#39ff8f] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
              Resource Heatmap
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
      </div>
    </section>
  );
};

export default DashboardPage;
