import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResourceTooltip from './ResourceTooltip';

const NodeMap = ({
  nodes = [],
  edges = [],
  activePath = [],
  variant = 'neon',
  vehicleIcon = '🚑',
  showVehicle = false,
  className = '',
  onNodeClick,
  selectedOrigin,
  selectedDestination,
  serviceData = {},
  nodeFilter,
  readOnly = false,
}) => {
  const [vehiclePos, setVehiclePos] = useState(null);
  const [tooltipNode, setTooltipNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1100, h: 750 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const colorMap = {
    neon: { accent: '#39ff8f', glow: '#39ff8f60' },
    blue: { accent: '#3d8fff', glow: '#3d8fff60' },
    danger: { accent: '#ff2d55', glow: '#ff2d5560' },
    warning: { accent: '#ffb800', glow: '#ffb80060' },
  };
  const colors = colorMap[variant] || colorMap.neon;

  // Filter visible nodes
  const visibleNodes = nodeFilter ? nodes.filter(nodeFilter) : nodes;

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

  // Edge helpers
  const isActiveEdge = (from, to) => {
    for (let i = 0; i < activePath.length - 1; i++) {
      if (
        (activePath[i] === from && activePath[i + 1] === to) ||
        (activePath[i] === to && activePath[i + 1] === from)
      ) return true;
    }
    return false;
  };

  // Node type styles
  const getNodeStyle = (node) => {
    const isOrigin = selectedOrigin === node.id;
    const isDestination = selectedDestination === node.id;
    const isInPath = activePath.includes(node.id);

    let radius = 6;
    let fill = '#1a1a2e';
    let stroke = '#2a2a3e';
    let strokeWidth = 1;
    let icon = null;

    switch (node.type) {
      case 'hospital':
        radius = 16;
        fill = isInPath ? '#3d8fff' : '#3d8fff30';
        stroke = '#3d8fff';
        strokeWidth = isInPath ? 2 : 1;
        icon = '🏥';
        break;
      case 'police_station':
        radius = 10;
        fill = isInPath ? '#ff2d55' : '#ff2d5530';
        stroke = '#ff2d55';
        strokeWidth = isInPath ? 2 : 1;
        icon = '🏛';
        break;
      case 'fire_station':
        radius = 10;
        fill = isInPath ? '#ffb800' : '#ffb80030';
        stroke = '#ffb800';
        strokeWidth = isInPath ? 2 : 1;
        icon = '🚒';
        break;
      case 'junction':
        radius = 5;
        fill = isInPath ? colors.accent : '#1a1a2e';
        stroke = isInPath ? colors.accent : '#2a2a3e';
        break;
      case 'incident':
      default:
        radius = 10;
        fill = isInPath ? colors.accent : '#1a1a2e';
        stroke = isInPath ? colors.accent : '#3a3a4e';
        strokeWidth = isInPath ? 2 : 1;
        break;
    }

    if (isOrigin) {
      fill = '#ff2d55';
      stroke = '#ff2d55';
      strokeWidth = 2.5;
    }
    if (isDestination) {
      fill = colors.accent;
      stroke = colors.accent;
      strokeWidth = 2.5;
    }

    return { radius, fill, stroke, strokeWidth, icon };
  };

  // Handle node click
  const handleNodeClick = (node, e) => {
    e.stopPropagation();

    if (readOnly || node.type === 'junction') {
      // Show tooltip for service nodes
      if (['hospital', 'police_station', 'fire_station'].includes(node.type)) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipNode(node);
          setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
      }
      return;
    }

    // Selectable node clicked
    if (['hospital', 'police_station', 'fire_station'].includes(node.type)) {
      // Show tooltip AND select
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipNode(node);
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }

    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  // Zoom handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => {
      const newW = Math.max(400, Math.min(2200, prev.w * zoomFactor));
      const newH = Math.max(280, Math.min(1500, prev.h * zoomFactor));
      const dx = (prev.w - newW) / 2;
      const dy = (prev.h - newH) / 2;
      return { x: prev.x + dx, y: prev.y + dy, w: newW, h: newH };
    });
  }, []);

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && panStart) {
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      setViewBox(prev => ({ ...prev, x: panStart.vx - dx, y: panStart.vy - dy }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  useEffect(() => {
    const svgEl = svgRef.current;
    if (svgEl) {
      svgEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (svgEl) svgEl.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Get service data for a node
  const getServiceData = (nodeId) => serviceData[nodeId] || null;

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`} style={{ minHeight: 350 }}>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
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
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill={`url(#grid-${variant})`} />

        {/* Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          const active = isActiveEdge(edge.from, edge.to);
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;

          return (
            <g key={idx}>
              <line
                x1={fromNode.x} y1={fromNode.y}
                x2={toNode.x} y2={toNode.y}
                stroke={active ? colors.accent : 'rgba(255,255,255,0.15)'}
                strokeWidth={active ? 2.5 : 0.8}
                strokeDasharray={active ? '8 4' : 'none'}
                className={active ? 'animate-dash' : ''}
                filter={active ? `url(#glow-${variant})` : 'none'}
                opacity={active ? 1 : 0.5}
              />
              {/* Distance label */}
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fill={active ? colors.accent : 'rgba(255,255,255,0.45)'}
                fontSize="8"
                fontFamily="'JetBrains Mono', monospace"
              >
                {edge.distance_km}km
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const style = getNodeStyle(node);
          const isOrigin = selectedOrigin === node.id;
          const isDestination = selectedDestination === node.id;
          const isInPath = activePath.includes(node.id);
          const isClickable = !readOnly && node.type !== 'junction';

          return (
            <g
              key={node.id}
              onClick={(e) => handleNodeClick(node, e)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              {/* Pulse ring for selected/active nodes */}
              {(isOrigin || isDestination || isInPath) && (
                <circle cx={node.x} cy={node.y} r="15" fill="none" stroke={isOrigin ? '#ff2d55' : colors.accent} strokeWidth="1" opacity="0.3">
                  <animate attributeName="r" values="10;25;10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={style.radius}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                filter={isInPath || isOrigin || isDestination ? `url(#glow-${variant})` : 'none'}
                className="transition-all duration-300"
              />

              {/* Icon for service nodes */}
              {style.icon && (
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  {style.icon}
                </text>
              )}

              {/* Label */}
              {node.type !== 'junction' && (
                <text
                  x={node.x}
                  y={node.y + (node.type === 'hospital' ? 34 : 26)}
                  textAnchor="middle"
                  fill={isInPath || isOrigin || isDestination ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.85)'}
                  fontSize="9"
                  fontFamily="'JetBrains Mono', monospace"
                  className="pointer-events-none"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label}
                </text>
              )}
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

      {/* Resource Tooltip */}
      {tooltipNode && tooltipPos && (
        <ResourceTooltip
          node={tooltipNode}
          data={getServiceData(tooltipNode.id)}
          position={tooltipPos}
          onClose={() => { setTooltipNode(null); setTooltipPos(null); }}
        />
      )}
    </div>
  );
};

export default NodeMap;
