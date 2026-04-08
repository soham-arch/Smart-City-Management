import { motion } from 'framer-motion';

const GlassPanel = ({ children, className = '', variant = 'default', glow = false, ...props }) => {
  const variants = {
    default: 'glass-panel',
    blue: 'glass-panel-blue',
    danger: 'glass-panel-danger',
    warning: 'glass-panel-warning',
  };

  const glowVariants = {
    default: 'glow-border',
    blue: 'glow-border-blue',
    danger: 'glow-border-danger',
    warning: 'glow-border-warning',
  };

  return (
    <motion.div
      className={`${variants[variant]} ${glow ? glowVariants[variant] : ''} p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassPanel;
