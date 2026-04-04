import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import ParticleBackground from './components/ParticleBackground';
import Navigation from './components/Navigation';

import HeroSection from './sections/HeroSection';
import AmbulanceSection from './sections/AmbulanceSection';
import PoliceSection from './sections/PoliceSection';
import FireSection from './sections/FireSection';
import SimulationSection from './sections/SimulationSection';

gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    // Smooth scroll config
    ScrollTrigger.defaults({
      toggleActions: 'play none none reverse',
    });

    // Refresh ScrollTrigger after all images/content loaded
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1000);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-city-bg">
      {/* Three.js Particle Background */}
      <ParticleBackground />

      {/* Floating Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection />

        {/* Section Divider */}
        <div className="relative h-px max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-city-neon/20 to-transparent" />
        </div>

        <AmbulanceSection />

        <div className="relative h-px max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-city-danger/20 to-transparent" />
        </div>

        <PoliceSection />

        <div className="relative h-px max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-city-warning/20 to-transparent" />
        </div>

        <FireSection />

        <div className="relative h-px max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-city-neon/20 to-transparent" />
        </div>

        <SimulationSection />

        {/* Footer */}
        <footer className="relative z-10 py-12 text-center border-t border-city-border/30">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-city-neon animate-pulse" />
              <span className="font-mono text-xs text-city-neon tracking-[0.3em] uppercase">Nexus EMS</span>
            </div>
            <p className="text-city-muted text-xs font-mono">
              Smart City Emergency Management System • AI-Powered Optimization
            </p>
            <p className="text-city-border text-[10px] font-mono mt-2">
              Built with React • Three.js • GSAP • Framer Motion
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
