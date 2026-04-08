/**
 * AnimatedCounter.jsx — Smoothly animating number counter component
 *
 * Displays a numeric value with an eased animation when it first appears (in-view)
 * AND re-animates whenever the value changes (real-time updates).
 *
 * Used on: LandingPage (hero stats), DashboardPage (overview grid), HospitalPage (summary stats)
 *
 * Props:
 *   - value    {number}  The target number to display
 *   - duration {number}  Animation duration in seconds (default: 2)
 *   - prefix   {string}  Text before the number (e.g. '$')
 *   - suffix   {string}  Text after the number (e.g. '%', ' min')
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 2, prefix = '', suffix = '', className = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref); // No 'once: true' — allows re-triggering on value changes
  const prevValueRef = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    // Animate from the previous value to the new value
    const start = prevValueRef.current;
    const end = parseInt(value, 10) || 0;

    // If value hasn't changed, don't re-animate
    if (start === end) {
      setCount(end);
      return;
    }

    // Shorter animation for updates (not first render)
    const animDuration = start === 0 && end !== 0 ? duration : 0.6;
    const totalFrames = Math.max(15, animDuration * 60);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(start + eased * (end - start)));

      if (frame >= totalFrames) {
        setCount(end);
        prevValueRef.current = end;
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
