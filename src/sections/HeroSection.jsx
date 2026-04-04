import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import TypingText from '../components/TypingText';
import ScrollIndicator from '../components/ScrollIndicator';
import AnimatedCounter from '../components/AnimatedCounter';

const HeroSection = () => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(titleRef.current, {
        y: 60,
        opacity: 0,
        scale: 0.9,
        duration: 1.2,
      })
      .from(subtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
      }, '-=0.4')
      .from(statsRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
      }, '-=0.3');
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { value: 99, suffix: '%', label: 'Response Accuracy' },
    { value: 3, suffix: 's', label: 'Avg Response Time' },
    { value: 500, suffix: '+', label: 'Nodes Covered' },
    { value: 24, suffix: '/7', label: 'Monitoring' },
  ];

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="section-full flex-col relative"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-city-bg z-[1]" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-city-neon/20 bg-city-neon/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-city-neon animate-pulse" />
          <span className="text-xs font-mono text-city-neon tracking-wider uppercase">System Online</span>
        </motion.div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold leading-tight mb-6"
        >
          <span className="text-city-text">Smart City</span>
          <br />
          <span className="neon-text">Emergency System</span>
        </h1>

        {/* Subtitle */}
        <div ref={subtitleRef} className="mb-8">
          <p className="text-lg md:text-xl text-city-muted mb-4 font-light">
            AI-Powered Emergency Optimization
          </p>
          <div className="text-city-neon/70 text-sm md:text-base h-6">
            <TypingText
              texts={[
                'Optimizing ambulance dispatch routes...',
                'Analyzing crime zone patterns...',
                'Calculating fire containment strategies...',
                'Allocating emergency resources...',
              ]}
              speed={50}
              deleteSpeed={30}
              pauseDuration={1500}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="glass-panel p-4 text-center"
              whileHover={{ scale: 1.05, borderColor: 'rgba(57,255,143,0.3)' }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-2xl md:text-3xl font-bold neon-text">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
              </div>
              <div className="text-[10px] md:text-xs font-mono text-city-muted mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />

      {/* Decorative side lines */}
      <div className="absolute left-8 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-city-neon/20 to-transparent" />
      <div className="absolute right-8 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-city-neon/20 to-transparent" />
    </section>
  );
};

export default HeroSection;
