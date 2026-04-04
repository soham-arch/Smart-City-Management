import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 2, prefix = '', suffix = '', className = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = 0;
    const end = parseInt(value, 10);
    const totalFrames = Math.max(30, duration * 60);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * end));

      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(counter);
      }
    }, 1000 / 60);

    return () => clearInterval(counter);
  }, [isInView, value, duration]);

  return (
    <motion.span
      ref={ref}
      className={`font-mono tabular-nums ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
    >
      {prefix}{count}{suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
