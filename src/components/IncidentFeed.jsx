/**
 * IncidentFeed.jsx — Live incident feed with expandable detail cards
 *
 * Displays a scrollable list of recent dispatch incidents (ambulance, police, fire).
 * Each incident card can be clicked to expand and show full details:
 * type, location, severity, route, ETA, hospital, algorithm used, and timestamps.
 *
 * Data source: Polls the 'incidents' table from the local JSONL database via usePolling.
 *
 * Used on: LandingPage (Recent Incidents section), DashboardPage (Live Feed panel)
 *
 * Props:
 *   - limit    {number}   Max incidents to display (default: 8)
 *   - showType {boolean}  Whether to show the type icon (default: true)
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePolling } from '../hooks/usePolling';
import StatusBadge from './StatusBadge';

const IncidentFeed = ({ limit = 8, showType = true }) => {
  // Poll the incidents table every 5 seconds for real-time updates
  const { data: allIncidents, loading } = usePolling('incidents');

  // Track which incident is expanded (null = none)
  const [expandedId, setExpandedId] = useState(null);

  // Sort by most recent first and limit the display count
  const incidents = [...allIncidents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);

  // Icon mapping for each emergency type
  const typeIcons = {
    ambulance: '🚑',
    police: '🚓',
    fire: '🚒',
  };

  // Color theme for each emergency type
  const typeColors = {
    ambulance: '#3d8fff',
    police: '#ff2d55',
    fire: '#ffb800',
  };

  // Convert timestamp to human-readable "X ago" format
  const timeAgo = (date) => {
    if (!date) return '—';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Toggle expand/collapse on click
  const handleClick = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Loading skeleton placeholders
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
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
        {incidents.map((incident) => {
          const isExpanded = expandedId === incident.id;
          const color = typeColors[incident.type] || '#39ff8f';

          return (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="rounded-lg border transition-all cursor-pointer"
              style={{
                borderColor: isExpanded ? `${color}50` : `${color}20`,
                background: isExpanded ? `${color}10` : `${color}05`,
              }}
              onClick={() => handleClick(incident.id)}
            >
              {/* ─── Collapsed Row (always visible) ─── */}
              <div className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors">
                {showType && (
                  <span className="text-lg">{typeIcons[incident.type] || '⚠️'}</span>
                )}
                <span
                  className="text-xs font-mono font-semibold uppercase"
                  style={{ color }}
                >
                  {incident.type}
                </span>
                <span className="text-xs font-mono text-[rgba(255,255,255,0.7)] flex-1 truncate">
                  {incident.location_name || '—'}
                </span>
                <span className="text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
                  {timeAgo(incident.created_at)}
                </span>
                <StatusBadge status={incident.status} />
                {/* Expand/collapse indicator */}
                <span className={`text-[10px] font-mono transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  style={{ color }}>
                  ▼
                </span>
              </div>

              {/* ─── Expanded Detail Panel ─── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 pt-1 border-t"
                      style={{ borderColor: `${color}15` }}>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] font-mono">
                        {/* Row 1: Type + Severity */}
                        <DetailRow label="Type" value={incident.type?.toUpperCase()} color={color} />
                        <DetailRow label="Severity" value={incident.severity ? `${incident.severity}/10` : '—'} color="#ff2d55" />

                        {/* Row 2: Location + Priority */}
                        <DetailRow label="Location" value={incident.location_name || incident.map_node_id || '—'} />
                        <DetailRow label="Priority Score" value={incident.priority_score || '—'} color="#ffb800" />

                        {/* Row 3: Hospital + ETA */}
                        {incident.hospital_name && (
                          <DetailRow label="Hospital" value={incident.hospital_name} color="#3d8fff" />
                        )}
                        {incident.hospital_id && !incident.hospital_name && (
                          <DetailRow label="Hospital ID" value={incident.hospital_id} color="#3d8fff" />
                        )}
                        {incident.eta && (
                          <DetailRow label="ETA" value={incident.eta} color="#39ff8f" />
                        )}

                        {/* Row 4: Distance + Algorithm */}
                        {incident.route_distance_km !== undefined && (
                          <DetailRow label="Distance" value={`${incident.route_distance_km} km`} />
                        )}
                        {incident.algorithm_used && (
                          <DetailRow label="Algorithm" value={incident.algorithm_used} color="#39ff8f" />
                        )}

                        {/* Row 5: Status + Timestamp */}
                        <DetailRow label="Status" value={incident.status?.toUpperCase()} color={
                          incident.status === 'dispatched' ? '#ffb800' :
                          incident.status === 'resolved' ? '#39ff8f' : color
                        } />
                        <DetailRow label="Created" value={
                          incident.created_at ? new Date(incident.created_at).toLocaleString() : '—'
                        } />
                      </div>

                      {/* Route path (if available) */}
                      {incident.route && Array.isArray(incident.route) && incident.route.length > 0 && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: `${color}10` }}>
                          <span className="text-[10px] font-mono text-[rgba(255,255,255,0.4)] uppercase">Route: </span>
                          <span className="text-[10px] font-mono" style={{ color: `${color}90` }}>
                            {incident.route.join(' → ')}
                          </span>
                        </div>
                      )}

                      {/* Linked crime (police incidents) */}
                      {incident.linked_crime_id && (
                        <div className="mt-1">
                          <span className="text-[10px] font-mono text-[rgba(255,255,255,0.4)] uppercase">Linked Crime: </span>
                          <span className="text-[10px] font-mono text-[#ff2d55]">{incident.linked_crime_id}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

/**
 * DetailRow — A single label-value row in the expanded incident detail panel
 * @param {string} label - Field label (e.g. "Severity")
 * @param {string|number} value - Field value
 * @param {string} color - Optional accent color for the value text
 */
const DetailRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center gap-2">
    <span className="text-[rgba(255,255,255,0.4)]">{label}</span>
    <span className="text-right truncate max-w-[180px]" style={{ color: color || 'rgba(255,255,255,0.75)' }}>
      {value}
    </span>
  </div>
);

export default IncidentFeed;
