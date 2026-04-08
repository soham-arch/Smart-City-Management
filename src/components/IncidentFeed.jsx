import { motion, AnimatePresence } from 'framer-motion';
import { usePolling } from '../hooks/usePolling';
import StatusBadge from './StatusBadge';

const IncidentFeed = ({ limit = 8, showType = true }) => {
  const { data: allIncidents, loading } = usePolling('incidents');
  // Sort by created_at descending and limit
  const incidents = [...allIncidents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);

  const typeIcons = {
    ambulance: '🚑',
    police: '🚓',
    fire: '🚒',
  };

  const typeColors = {
    ambulance: '#3d8fff',
    police: '#ff2d55',
    fire: '#ffb800',
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-[rgba(255,255,255,0.4)] font-mono text-sm">
        No incidents recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {incidents.map((incident) => (
          <motion.div
            key={incident.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg border transition-all hover:bg-white/5"
            style={{
              borderColor: `${typeColors[incident.type]}20`,
              background: `${typeColors[incident.type]}05`,
            }}
          >
            {showType && (
              <span className="text-lg">{typeIcons[incident.type] || '⚠️'}</span>
            )}
            <span
              className="text-xs font-mono font-semibold uppercase"
              style={{ color: typeColors[incident.type] }}
            >
              {incident.type}
            </span>
            <span className="text-xs font-mono text-[rgba(255,255,255,0.7)] flex-1">
              {incident.location_name || '—'}
            </span>
            <span className="text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
              {timeAgo(incident.created_at)}
            </span>
            <StatusBadge status={incident.status} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default IncidentFeed;
