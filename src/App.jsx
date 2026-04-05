import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import ParticleBackground from './components/ParticleBackground';
import DarkOverlay from './components/DarkOverlay';
import TopNav from './components/TopNav';
import Navigation from './components/Navigation';

import LandingPage from './pages/LandingPage';
import AmbulancePage from './pages/AmbulancePage';
import PolicePage from './pages/PolicePage';
import FirePage from './pages/FirePage';
import DashboardPage from './pages/DashboardPage';
import SimulationPage from './pages/SimulationPage';

gsap.registerPlugin(ScrollTrigger);

// Theme class map per route
const themeMap = {
  '/': 'theme-landing',
  '/ambulance': 'theme-ambulance',
  '/police': 'theme-police',
  '/fire': 'theme-fire',
  '/dashboard': 'theme-dashboard',
  '/simulation': 'theme-simulation',
};

function App() {
  const location = useLocation();
  const themeClass = themeMap[location.pathname] || 'theme-landing';

  useEffect(() => {
    ScrollTrigger.defaults({ toggleActions: 'play none none reverse' });
    const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={`relative min-h-screen bg-city-bg ${themeClass}`}>
      {/* Three.js Particle Background (z-0) */}
      <ParticleBackground />

      {/* Dark Overlay (z-1) */}
      {/* <DarkOverlay /> */}

      {/* Top Navigation (z-50) */}
      <TopNav />

      {/* Right Side Dot Navigation (z-50) */}
      <Navigation />

      {/* Page Content (z-10) */}
      <main className="relative z-10 pt-14">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ambulance" element={<AmbulancePage />} />
          <Route path="/police" element={<PolicePage />} />
          <Route path="/fire" element={<FirePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
        </Routes>

        {/* Footer */}
        <footer className="relative z-10 py-12 text-center border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
              <span className="font-mono text-xs text-[#39ff8f] tracking-[0.3em] uppercase">Nexus EMS</span>
            </div>
            <p className="text-[rgba(255,255,255,0.4)] text-xs font-mono">
              Smart City Emergency Management System • AI-Powered Optimization • Pune
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
