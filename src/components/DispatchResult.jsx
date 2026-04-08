import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import ProgressBar from './ProgressBar';
import AlgorithmStack from './AlgorithmStack';

const DispatchResult = ({ result, variant = 'blue', type = 'ambulance' }) => {
  if (!result) return null;

  const colorMap = {
    blue: { text: 'text-[#3d8fff]', bg: 'bg-[#3d8fff]/10', border: 'border-[#3d8fff]/20' },
    danger: { text: 'text-[#ff2d55]', bg: 'bg-[#ff2d55]/10', border: 'border-[#ff2d55]/20' },
    warning: { text: 'text-[#ffb800]', bg: 'bg-[#ffb800]/10', border: 'border-[#ffb800]/20' },
  };

  const colors = colorMap[variant] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className={`text-xl font-bold ${colors.text}`}>
            <AnimatedCounter value={result.priorityScore || 7} />
          </div>
          <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)]">Priority</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-[#39ff8f]">{result.eta}</div>
          <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)]">ETA</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-[#ffb800]">
            <AnimatedCounter value={result.totalDistance || result.cost || 0} suffix=" km" />
          </div>
          <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)]">Distance</div>
        </div>
      </div>

      {/* Route */}
      {result.route && (
        <div className="mb-4">
          <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] mb-2 uppercase">Optimal Route</div>
          <div className="flex items-center gap-1 flex-wrap">
            {result.route.map((stop, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className={`px-2 py-1 rounded ${colors.bg} ${colors.text} text-xs font-mono border ${colors.border}`}>
                  {stop}
                </span>
                {i < result.route.length - 1 && (
                  <span className="text-[rgba(255,255,255,0.3)]">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <AlgorithmStack
        title="DSA Concepts Used"
        items={result.algorithmStack || []}
        accent={variant === 'danger' ? '#ff2d55' : variant === 'warning' ? '#ffb800' : '#3d8fff'}
      />

      {/* Resources */}
      {result.resourcesAllocated && (
        <div>
          <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] mb-2 uppercase">Resources Allocated</div>
          <div className="space-y-2">
            {type === 'ambulance' && (
              <>
                <ProgressBar value={result.resourcesAllocated.bedsAvailable || 15} max={30} label="Beds Available" variant="blue" />
                <ProgressBar value={result.resourcesAllocated.paramedics || 2} max={5} label="Paramedics" variant="neon" />
              </>
            )}
            {type === 'police' && (
              <>
                <ProgressBar value={result.resourcesAllocated.officers || 4} max={10} label="Officers Deployed" variant="danger" />
                <ProgressBar value={result.resourcesAllocated.units || 2} max={5} label="Units Deployed" variant="blue" />
              </>
            )}
            {type === 'fire' && (
              <>
                <ProgressBar value={result.resourcesAllocated.trucks || 2} max={6} label="Fire Trucks" variant="warning" />
                <ProgressBar value={result.resourcesAllocated.firefighters || 8} max={20} label="Firefighters" variant="danger" />
                <ProgressBar value={result.resourcesAllocated.waterTanks || 2} max={5} label="Water Tankers" variant="blue" />
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DispatchResult;
