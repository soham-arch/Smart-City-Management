import { motion } from 'framer-motion';

const ProcessingPipeline = ({ steps, currentStep, variant = 'blue' }) => {
  const colorMap = {
    blue: { active: 'text-[#3d8fff]', bg: 'bg-[#3d8fff]/20', border: 'border-[#3d8fff]', spinner: 'border-[#3d8fff]' },
    danger: { active: 'text-[#ff2d55]', bg: 'bg-[#ff2d55]/20', border: 'border-[#ff2d55]', spinner: 'border-[#ff2d55]' },
    warning: { active: 'text-[#ffb800]', bg: 'bg-[#ffb800]/20', border: 'border-[#ffb800]', spinner: 'border-[#ffb800]' },
    neon: { active: 'text-[#39ff8f]', bg: 'bg-[#39ff8f]/20', border: 'border-[#39ff8f]', spinner: 'border-[#39ff8f]' },
  };

  const colors = colorMap[variant] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {steps.map((step, i) => {
        const isDone = currentStep > i + 1 || (step.done);
        const isActive = currentStep === i + 1 && !isDone;

        return (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono border ${
              isDone
                ? `${colors.bg} ${colors.border} ${colors.active}`
                : isActive
                ? `${colors.border}/50 ${colors.active} animate-pulse`
                : 'border-[#1a1a2e] text-[rgba(255,255,255,0.4)]'
            }`}>
              {isDone ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-mono ${isDone ? colors.active : isActive ? colors.active : 'text-[rgba(255,255,255,0.4)]'}`}>
              {step.label}
            </span>
            {isActive && (
              <div className="ml-auto">
                <div className={`w-4 h-4 border-2 ${colors.spinner} border-t-transparent rounded-full animate-spin`} />
              </div>
            )}
            {isDone && (
              <span className="ml-auto text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
                {step.time || 'done'}
              </span>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

export default ProcessingPipeline;
