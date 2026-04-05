import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const NeonButton = ({ children, onClick, variant = 'neon', size = 'md', loading = false, className = '', disabled = false }) => {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);

  const colorMap = {
    neon: {
      bg: 'bg-city-neon/10',
      border: 'border-city-neon/50',
      text: 'text-city-neon',
      hover: 'hover:bg-city-neon/20 hover:shadow-[0_0_30px_#39ff8f30]',
      glow: '#39ff8f',
    },
    blue: {
      bg: 'bg-city-blue/10',
      border: 'border-city-blue/50',
      text: 'text-city-blue',
      hover: 'hover:bg-city-blue/20 hover:shadow-[0_0_30px_#3d8fff30]',
      glow: '#3d8fff',
    },
    danger: {
      bg: 'bg-city-danger/10',
      border: 'border-city-danger/50',
      text: 'text-city-danger',
      hover: 'hover:bg-city-danger/20 hover:shadow-[0_0_30px_#ff2d5530]',
      glow: '#ff2d55',
    },
    warning: {
      bg: 'bg-city-warning/10',
      border: 'border-city-warning/50',
      text: 'text-city-warning',
      hover: 'hover:bg-city-warning/20 hover:shadow-[0_0_30px_#ffb80030]',
      glow: '#ffb800',
    },
  };

  const sizeMap = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const colors = colorMap[variant];

  const handleClick = (e) => {
    if (disabled || loading) return;

    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);

    onClick?.(e);
  };

  return (
    <motion.button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-lg border font-mono tracking-wider uppercase
        transition-all duration-300 cursor-pointer
        ${colors.bg} ${colors.border} ${colors.text} ${colors.hover}
        ${sizeMap[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            backgroundColor: colors.glow + '40',
          }}
        />
      ))}

      {/* Loading spinner */}
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default NeonButton;
