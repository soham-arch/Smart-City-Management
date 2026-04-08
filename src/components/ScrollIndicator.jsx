import { motion } from 'framer-motion';

const ScrollIndicator = () => {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
    >
      <span className="text-[10px] font-mono text-city-muted uppercase tracking-[0.3em]">
        Scroll to explore
      </span>
      <motion.div
        className="w-5 h-8 rounded-full border-2 border-city-muted/40 flex justify-center pt-1.5"
        animate={{ borderColor: ['rgba(107,107,128,0.4)', 'rgba(57,255,143,0.4)', 'rgba(107,107,128,0.4)'] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <motion.div
          className="w-1 h-2 rounded-full bg-city-neon"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default ScrollIndicator;
