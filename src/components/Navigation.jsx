import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Home', icon: '⌂' },
  { path: '/ambulance', label: 'Ambulance', icon: '🚑' },
  { path: '/police', label: 'Police', icon: '🚓' },
  { path: '/fire', label: 'Fire', icon: '🚒' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/hospitals', label: 'Hospitals', icon: '🏥' },
];

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-3 hidden md:flex">
      {navItems.map((item, index) => (
        <motion.button
          key={item.path}
          onClick={() => navigate(item.path)}
          className="group flex items-center gap-3 cursor-pointer bg-transparent border-none outline-none"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Label */}
          <span className="text-[10px] font-mono tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[rgba(255,255,255,0.4)] group-hover:text-[#39ff8f]">
            {item.label}
          </span>

          {/* Dot */}
          <div className="relative">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? 'bg-[#39ff8f] shadow-[0_0_10px_#39ff8f,0_0_20px_#39ff8f40] scale-125'
                  : 'bg-[#1a1a2e] group-hover:bg-[#6b6b80]'
              }`}
            />
            {activeIndex === index && (
              <motion.div
                className="absolute inset-0 rounded-full bg-[#39ff8f]"
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
