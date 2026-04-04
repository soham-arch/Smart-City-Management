import { motion } from 'framer-motion';

const ProgressBar = ({ value = 0, max = 100, label = '', variant = 'neon', animated = true, className = '' }) => {
  const percentage = Math.min(100, (value / max) * 100);

  const colorMap = {
    neon: { bar: 'bg-city-neon', glow: 'shadow-[0_0_10px_#39ff8f60]', text: 'text-city-neon' },
    blue: { bar: 'bg-city-blue', glow: 'shadow-[0_0_10px_#3d8fff60]', text: 'text-city-blue' },
    danger: { bar: 'bg-city-danger', glow: 'shadow-[0_0_10px_#ff2d5560]', text: 'text-city-danger' },
    warning: { bar: 'bg-city-warning', glow: 'shadow-[0_0_10px_#ffb80060]', text: 'text-city-warning' },
  };

  const colors = colorMap[variant];

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-city-muted uppercase tracking-wider">{label}</span>
          <span className={`text-xs font-mono ${colors.text}`}>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-city-border rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colors.bar} ${colors.glow}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: animated ? 1.5 : 0, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
