/**
 * App.jsx — Root Application Component
 *
 * Sets up the full application layout with:
 *   - Three.js particle background (ParticleBackground)
 *   - Top navigation bar (TopNav) + side dot navigation (Navigation)
 *   - Route-based page loading (Landing, Ambulance, Police, Fire, Dashboard, Hospital)
 *   - Dynamic theme classes per route (changes accent colors)
 *   - Scroll progress bar at the top
 *   - ErrorBoundary wrapping each page for crash isolation
 *
 * ROUTES:
 *   /           → LandingPage (hero + emergency cards + incident feed)
 *   /ambulance  → AmbulancePage (dispatch workflow)
 *   /police     → PolicePage (crime reporting + dispatch)
 *   /fire       → FirePage (fire dispatch)
 *   /dashboard  → DashboardPage (overview stats + heatmap)
 *   /hospitals  → HospitalPage (bed management + ICU knapsack)
 */
import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import ErrorBoundary from './components/ErrorBoundary';
import ParticleBackground from './components/ParticleBackground';
import DarkOverlay from './components/DarkOverlay';
import TopNav from './components/TopNav';
import Navigation from './components/Navigation';

import LandingPage from './pages/LandingPage';
import AmbulancePage from './pages/AmbulancePage';
import PolicePage from './pages/PolicePage';
import FirePage from './pages/FirePage';
import DashboardPage from './pages/DashboardPage';
import HospitalPage from './pages/HospitalPage';

gsap.registerPlugin(ScrollTrigger);

// Theme class map per route
const themeMap = {
  '/': 'theme-landing',
  '/ambulance': 'theme-ambulance',
  '/police': 'theme-police',
  '/fire': 'theme-fire',
  '/dashboard': 'theme-dashboard',
  '/hospitals': 'theme-hospitals',
};

// Safe wrapper to catch errors in individual pages without crashing the whole app
function SafePage({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

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

  // Scroll progress bar
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`relative min-h-screen bg-city-bg ${themeClass}`} style={{ background: '#050510' }}>
      {/* Three.js Particle Background (z-0) */}
      <ErrorBoundary>
        <ParticleBackground />
      </ErrorBoundary>

      {/* Scroll Progress Bar (z-[1000]) */}
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Dark Overlay (z-1) */}
      <DarkOverlay />

      {/* Top Navigation (z-50) */}
      <ErrorBoundary>
        <TopNav />
      </ErrorBoundary>

      {/* Right Side Dot Navigation (z-50) */}
      <Navigation />

      {/* Page Content (z-10) */}
      <main className="relative z-10 pt-14">
        <Routes>
          <Route path="/" element={<SafePage><LandingPage /></SafePage>} />
          <Route path="/ambulance" element={<SafePage><AmbulancePage /></SafePage>} />
          <Route path="/police" element={<SafePage><PolicePage /></SafePage>} />
          <Route path="/fire" element={<SafePage><FirePage /></SafePage>} />
          <Route path="/dashboard" element={<SafePage><DashboardPage /></SafePage>} />
          <Route path="/hospitals" element={<SafePage><HospitalPage /></SafePage>} />
        </Routes>

        {/* Footer */}
        <footer className="relative z-10 py-12 text-center border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
              <span className="font-mono text-xs text-[#39ff8f] tracking-[0.3em] uppercase">Nexus EMS</span>
            </div>
            <p className="text-[rgba(255,255,255,0.28)] text-[11px] font-mono mt-2">
              Core execution runs through C++ Dijkstra, Knapsack, Sorting, and Priority Queue logic.
            </p>
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
