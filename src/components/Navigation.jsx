import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const sectionLabels = ['Home', 'Ambulance', 'Police', 'Fire', 'Simulate'];
const sectionIds = ['hero', 'ambulance', 'police', 'fire', 'simulation'];

const Navigation = () => {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const sections = sectionIds.map(id => document.getElementById(id));
      const scrollPos = window.scrollY + window.innerHeight / 2;

      sections.forEach((section, index) => {
        if (section) {
          const top = section.offsetTop;
          const bottom = top + section.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index) => {
    const section = document.getElementById(sectionIds[index]);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-4">
      {sectionLabels.map((label, index) => (
        <motion.button
          key={label}
          onClick={() => scrollToSection(index)}
          className="group flex items-center gap-3 cursor-pointer bg-transparent border-none outline-none"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Label */}
          <span className="text-xs font-mono tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-city-muted group-hover:text-city-neon">
            {label}
          </span>

          {/* Dot */}
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeSection === index
                  ? 'bg-city-neon shadow-[0_0_10px_#39ff8f,0_0_20px_#39ff8f40] scale-125'
                  : 'bg-city-border group-hover:bg-city-muted'
              }`}
            />
            {activeSection === index && (
              <motion.div
                className="absolute inset-0 rounded-full bg-city-neon"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        </motion.button>
      ))}
    </nav>
  );
};

export default Navigation;
