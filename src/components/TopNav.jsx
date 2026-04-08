import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCityStats } from '../hooks/useCityStats';

const TopNav = () => {
  const location = useLocation();
  const { stats } = useCityStats();

  const links = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/hospitals', label: 'Hospitals' },
  ];

  const isActive = (path) => location.pathname === path;

  const statusColor = stats.systemStatus === 'all_clear' ? '#39ff8f' :
    stats.systemStatus === 'active_emergency' ? '#ff2d55' : '#ffb800';

  const statusLabel = stats.systemStatus === 'all_clear' ? 'ALL CLEAR' :
    stats.systemStatus === 'active_emergency' ? 'ACTIVE EMERGENCY' : 'CRITICAL';

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 h-14"
      style={{
        background: 'rgba(10, 10, 30, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-2 h-2 rounded-full bg-[#39ff8f] animate-pulse" />
          <span className="font-heading font-bold text-lg tracking-wider text-white group-hover:text-[#39ff8f] transition-colors">
            NEXUS
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all duration-300 ${
                isActive(link.path)
                  ? 'text-[#39ff8f] bg-[#39ff8f]/10 border border-[#39ff8f]/20'
                  : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* City Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              animation: stats.systemStatus !== 'all_clear' ? 'pulseRing 1.5s ease-out infinite' : 'none',
            }}
          />
          <span
            className="text-[10px] font-mono tracking-wider uppercase"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </motion.nav>
  );
};

export default TopNav;
