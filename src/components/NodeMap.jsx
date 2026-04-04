import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NodeMap = ({
  nodes = [],
  edges = [],
  activePath = [],
  variant = 'neon',
  vehicleIcon = '🚑',
  showVehicle = false,
  className = '',
}) => {
  const [vehiclePos, setVehiclePos] = useState(null);
  const svgRef = useRef(null);

  const colorMap = {
    neon: { node: '#39ff8f', edge: '#39ff8f', glow: '#39ff8f60', pulse: '#39ff8f' },
    blue: { node: '#3d8fff', edge: '#3d8fff', glow: '#3d8fff60', pulse: '#3d8fff' },
    danger: { node: '#ff2d55', edge: '#ff2d55', glow: '#ff2d5560', pulse: '#ff2d55' },
    warning: { node: '#ffb800', edge: '#ffb800', glow: '#ffb80060', pulse: '#ffb800' },
  };

  const colors = colorMap[variant];

  // Animate vehicle along active path
  useEffect(() => {
    if (!showVehicle || activePath.length < 2) {
      setVehiclePos(null);
      return;
    }

    let step = 0;
    const pathNodes = activePath.map(id => nodes.find(n => n.id === id)).filter(Boolean);

    if (pathNodes.length < 2) return;

    setVehiclePos(pathNodes[0]);

    const interval = setInterval(() => {
      step++;
      if (step < pathNodes.length) {
        setVehiclePos(pathNodes[step]);
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [showVehicle, activePath, nodes]);

  const isActiveEdge = (from, to) => {
    for (let i = 0; i < activePath.length - 1; i++) {
      if (
        (activePath[i] === from && activePath[i + 1] === to) ||
        (activePath[i] === to && activePath[i + 1] === from)
      ) return true;
    }
    return false;
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <svg ref={svgRef} viewBox="0 0 500 400" className="w-full h-full">
        {/* Grid lines for futuristic feel */}
        <defs>
          <pattern id={`grid-${variant}`} width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a2e" strokeWidth="0.5" />
          </pattern>
          <filter id={`glow-${variant}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect width="500" height="400" fill={`url(#grid-${variant})`} />

        {/* Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          const active = isActiveEdge(edge.from, edge.to);

          return (
            <g key={idx}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={active ? colors.edge : '#1a1a2e'}
                strokeWidth={active ? 2.5 : 1}
                strokeDasharray={active ? '8 4' : 'none'}
                className={active ? 'animate-dash' : ''}
                filter={active ? `url(#glow-${variant})` : 'none'}
                opacity={active ? 1 : 0.4}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isInPath = activePath.includes(node.id);
          return (
            <g key={node.id}>
              {/* Pulse ring for active/important nodes */}
              {(node.pulse || isInPath) && (
                <>
                  <circle cx={node.x} cy={node.y} r="15" fill="none" stroke={colors.pulse} strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" values="10;25;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size || 8}
                fill={node.color || (isInPath ? colors.node : '#1a1a2e')}
                stroke={isInPath ? colors.node : '#2a2a3e'}
                strokeWidth={isInPath ? 2 : 1}
                filter={isInPath ? `url(#glow-${variant})` : 'none'}
                className="transition-all duration-500"
              />

              {/* Icon */}
              {node.icon && (
                <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central" fontSize="12">
                  {node.icon}
                </text>
              )}

              {/* Label */}
              <text
                x={node.x}
                y={node.y + (node.size || 8) + 14}
                textAnchor="middle"
                fill={isInPath ? colors.node : '#6b6b80'}
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Vehicle */}
        <AnimatePresence>
          {vehiclePos && (
            <motion.text
              x={vehiclePos.x}
              y={vehiclePos.y - 20}
              textAnchor="middle"
              fontSize="20"
              initial={{ scale: 0 }}
              animate={{ x: vehiclePos.x, y: vehiclePos.y - 20, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {vehicleIcon}
            </motion.text>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
};

export default NodeMap;
