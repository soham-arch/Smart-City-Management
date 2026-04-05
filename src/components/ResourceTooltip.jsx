import { motion, AnimatePresence } from 'framer-motion';

const ResourceTooltip = ({ node, data, position, onClose }) => {
  if (!node || !position) return null;

  const typeConfig = {
    hospital: { icon: '🏥', color: '#3d8fff' },
    police_station: { icon: '🏛', color: '#ff2d55' },
    fire_station: { icon: '🚒', color: '#ffb800' },
  };

  const config = typeConfig[node.type] || typeConfig.hospital;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute z-50 pointer-events-auto"
        style={{
          left: position.x + 10,
          top: position.y - 10,
          minWidth: 200,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-xl p-3"
          style={{
            background: 'rgba(10, 10, 30, 0.9)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${config.color}30`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 15px ${config.color}15`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span>{config.icon}</span>
            <span className="text-xs font-heading font-semibold text-white">{node.label}</span>
            <button
              onClick={onClose}
              className="ml-auto text-[rgba(255,255,255,0.3)] hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            {data && node.type === 'hospital' && (
              <>
                <InfoRow label="Beds Available" value={data.beds_available} total={data.beds_total} color="#3d8fff" />
                <InfoRow label="ICU Beds" value={data.icu_beds_available} total={data.icu_beds_total} color="#ff2d55" />
                <InfoRow label="Ambulances" value={data.ambulances_available} total={data.ambulances_stationed} color="#39ff8f" />
              </>
            )}
            {data && node.type === 'police_station' && (
              <>
                <InfoRow label="Units Available" value={data.units_available} total={data.units_total} color="#ff2d55" />
                <InfoRow label="Officers On Duty" value={data.officers_on_duty} total={data.officers_total} color="#3d8fff" />
                <InfoRow label="Vehicles" value={data.vehicles_available} total={data.response_vehicles} color="#39ff8f" />
              </>
            )}
            {data && node.type === 'fire_station' && (
              <>
                <InfoRow label="Fire Trucks" value={data.trucks_available} total={data.trucks_total} color="#ffb800" />
                <InfoRow label="Firefighters" value={data.firefighters_on_duty} total={data.firefighters_total} color="#ff2d55" />
                <InfoRow label="Water Tankers" value={data.water_tankers_available} total={data.water_tankers_total} color="#3d8fff" />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const InfoRow = ({ label, value, total, color }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-mono text-[rgba(255,255,255,0.5)]">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-mono font-semibold" style={{ color }}>
        {value ?? '—'}
      </span>
      {total != null && (
        <span className="text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
          /{total}
        </span>
      )}
    </div>
  </div>
);

export default ResourceTooltip;
