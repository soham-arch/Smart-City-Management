import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResourceTooltip from './ResourceTooltip';

const NodeMap = ({
  nodes = [],
  edges = [],
  activePath = [],
  secondaryPath = [],
  variant = 'neon',
  vehicleIcon = '🚑',
  secondaryVehicleIcon = '🚑',
  showVehicle = false,
  className = '',
  onNodeClick,
  selectedOrigin,
  selectedDestination,
  serviceData = {},
  nodeFilter,
  readOnly = false,
  crimeMarkers = [],
}) => {
  const [vehiclePos, setVehiclePos] = useState(null);
  const [secondaryVehiclePos, setSecondaryVehiclePos] = useState(null);
  const [tooltipNode, setTooltipNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1400, h: 900 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const colorMap = {
    neon: { accent: '#39ff8f', glow: '#39ff8f60', edgeIdle: 'rgba(57,255,143,0.18)' },
    blue: { accent: '#3d8fff', glow: '#3d8fff60', edgeIdle: 'rgba(61,143,255,0.18)' },
    danger: { accent: '#ff2d55', glow: '#ff2d5560', edgeIdle: 'rgba(255,45,85,0.18)' },
    warning: { accent: '#ffb800', glow: '#ffb80060', edgeIdle: 'rgba(255,184,0,0.18)' },
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

  // Animate secondary vehicle along secondary path
  useEffect(() => {
    if (!showVehicle || secondaryPath.length < 2) {
      setSecondaryVehiclePos(null);
      return;
    }
    let step = 0;
    const pathNodes = secondaryPath.map(id => nodes.find(n => n.id === id)).filter(Boolean);
    if (pathNodes.length < 2) return;
    setSecondaryVehiclePos(pathNodes[0]);
    const interval = setInterval(() => {
      step++;
      if (step < pathNodes.length) {
        setSecondaryVehiclePos(pathNodes[step]);
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [showVehicle, secondaryPath, nodes]);

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

  const isSecondaryEdge = (from, to) => {
    for (let i = 0; i < secondaryPath.length - 1; i++) {
      if (
        (secondaryPath[i] === from && secondaryPath[i + 1] === to) ||
        (secondaryPath[i] === to && secondaryPath[i + 1] === from)
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
        radius = 14;
        fill = isInPath ? '#3d8fff' : '#3d8fff30';
        stroke = '#3d8fff';
        strokeWidth = isInPath ? 2.5 : 1.5;
        icon = '🏥';
        break;
      case 'police_station':
        radius = 10;
        fill = isInPath ? '#ff2d55' : '#ff2d5530';
        stroke = '#ff2d55';
        strokeWidth = isInPath ? 2.5 : 1.5;
        icon = '🏛';
        break;
      case 'fire_station':
        radius = 10;
        fill = isInPath ? '#ffb800' : '#ffb80030';
        stroke = '#ffb800';
        strokeWidth = isInPath ? 2.5 : 1.5;
        icon = '🚒';
        break;
      case 'junction':
        radius = 4;
        fill = isInPath ? colors.accent : '#15152a';
        stroke = isInPath ? colors.accent : '#2a2a3e';
        strokeWidth = isInPath ? 1.5 : 1;
        break;
      case 'incident':
      default:
        radius = 9;
        fill = isInPath ? colors.accent : '#15152a';
        stroke = isInPath ? colors.accent : '#3a3a5e';
        strokeWidth = isInPath ? 2.5 : 1.5;
        break;
    }

    if (isOrigin) {
      fill = '#ff2d55';
      stroke = '#ff2d55';
      strokeWidth = 3;
    }
    if (isDestination) {
      fill = colors.accent;
      stroke = colors.accent;
      strokeWidth = 3;
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
      const newW = Math.max(200, Math.min(2200, prev.w * zoomFactor));
      const newH = Math.max(130, Math.min(1500, prev.h * zoomFactor));
      const dx = (prev.w - newW) / 2;
      const dy = (prev.h - newH) / 2;
      return { x: prev.x + dx, y: prev.y + dy, w: newW, h: newH };
    });
  }, []);

  // Zoom button handlers
  const handleZoomIn = () => {
    setViewBox(prev => {
      const newW = Math.max(200, prev.w * 0.75);
      const newH = Math.max(130, prev.h * 0.75);
      const dx = (prev.w - newW) / 2;
      const dy = (prev.h - newH) / 2;
      return { x: prev.x + dx, y: prev.y + dy, w: newW, h: newH };
    });
  };

  const handleZoomOut = () => {
    setViewBox(prev => {
      const newW = Math.min(2200, prev.w * 1.35);
      const newH = Math.min(1500, prev.h * 1.35);
      const dx = (prev.w - newW) / 2;
      const dy = (prev.h - newH) / 2;
      return { x: prev.x + dx, y: prev.y + dy, w: newW, h: newH };
    });
  };

  const handleZoomReset = () => {
    setViewBox({ x: 0, y: 0, w: 1400, h: 900 });
  };

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

  // Compute zoom level for label sizing
  const zoomLevel = 1400 / viewBox.w;

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`} style={{ minHeight: 350 }}>
      {/* Zoom Controls */}
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-[#0d0d15]/80 border border-white/10 text-white/70 hover:text-white hover:border-white/30 hover:bg-[#1a1a2e]/90 transition-all text-sm font-mono flex items-center justify-center backdrop-blur-sm"
          title="Zoom In"
        >+</button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-[#0d0d15]/80 border border-white/10 text-white/70 hover:text-white hover:border-white/30 hover:bg-[#1a1a2e]/90 transition-all text-sm font-mono flex items-center justify-center backdrop-blur-sm"
          title="Zoom Out"
        >−</button>
        <button
          onClick={handleZoomReset}
          className="w-8 h-8 rounded-lg bg-[#0d0d15]/80 border border-white/10 text-white/70 hover:text-white hover:border-white/30 hover:bg-[#1a1a2e]/90 transition-all text-[9px] font-mono flex items-center justify-center backdrop-blur-sm"
          title="Reset Zoom"
        >⟲</button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-2 left-2 z-20 text-[9px] font-mono text-white/30 backdrop-blur-sm bg-[#0d0d15]/50 px-2 py-1 rounded">
        {Math.round(zoomLevel * 100)}%
      </div>

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
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-blue-secondary">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Label background filter */}
          <filter id="label-bg" x="-0.15" y="-0.15" width="1.3" height="1.3">
            <feFlood floodColor="#0a0a1e" floodOpacity="0.85" result="bg"/>
            <feMerge>
              <feMergeNode in="bg"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill={`url(#grid-${variant})`} />

        {/* Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          const active = isActiveEdge(edge.from, edge.to);
          const secondary = isSecondaryEdge(edge.from, edge.to);
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;

          // Offset label slightly to avoid overlap with edge line
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const offsetX = (-dy / len) * 10;
          const offsetY = (dx / len) * 10;

          return (
            <g key={idx}>
              <line
                x1={fromNode.x} y1={fromNode.y}
                x2={toNode.x} y2={toNode.y}
                stroke={active ? colors.accent : secondary ? '#3d8fff' : 'rgba(255,255,255,0.22)'}
                strokeWidth={active ? 3 : secondary ? 2.5 : 1.5}
                strokeDasharray={active || secondary ? '8 4' : 'none'}
                className={active || secondary ? 'animate-dash' : ''}
                filter={active ? `url(#glow-${variant})` : secondary ? 'url(#glow-blue-secondary)' : 'none'}
                opacity={active || secondary ? 1 : 0.7}
                strokeLinecap="round"
              />
              {/* Distance label with background */}
              <rect
                x={midX + offsetX - 16}
                y={midY + offsetY - 8}
                width="32"
                height="13"
                rx="3"
                fill={active ? `${colors.accent}20` : 'rgba(10,10,30,0.75)'}
                stroke={active ? `${colors.accent}40` : 'rgba(255,255,255,0.08)'}
                strokeWidth="0.5"
              />
              <text
                x={midX + offsetX}
                y={midY + offsetY + 2}
                textAnchor="middle"
                fill={active ? colors.accent : secondary ? '#3d8fff' : 'rgba(255,255,255,0.55)'}
                fontSize="8.5"
                fontWeight={active ? 'bold' : 'normal'}
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
                <circle cx={node.x} cy={node.y} r="18" fill="none" stroke={isOrigin ? '#ff2d55' : colors.accent} strokeWidth="1.5" opacity="0.3">
                  <animate attributeName="r" values="12;28;12" dur="2s" repeatCount="indefinite" />
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
                  fontSize="11"
                  className="pointer-events-none"
                >
                  {style.icon}
                </text>
              )}

              {/* Label */}
              {node.type !== 'junction' && (
                <>
                  {/* Label background */}
                  <rect
                    x={node.x - 50}
                    y={node.y + (node.type === 'hospital' ? 20 : 16)}
                    width="100"
                    height="14"
                    rx="3"
                    fill="rgba(10,10,30,0.7)"
                    className="pointer-events-none"
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x={node.x}
                    y={node.y + (node.type === 'hospital' ? 30 : 26)}
                    textAnchor="middle"
                    fill={isInPath || isOrigin || isDestination ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)'}
                    fontSize="9"
                    fontWeight={isInPath || isOrigin || isDestination ? 'bold' : 'normal'}
                    fontFamily="'JetBrains Mono', monospace"
                    className="pointer-events-none"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Crime Markers */}
        {crimeMarkers.map((marker, idx) => {
          const markerNode = nodes.find(n => n.id === marker.map_node_id);
          if (!markerNode) return null;
          return (
            <g key={`crime-${idx}`}>
              <circle cx={markerNode.x} cy={markerNode.y} r="6" fill="#ff2d55" opacity="0.7">
                <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={markerNode.x} cy={markerNode.y} r="3" fill="#ff2d55" />
            </g>
          );
        })}

        {/* Vehicle */}
        <AnimatePresence>
          {vehiclePos && (
            <motion.text
              x={vehiclePos.x}
              y={vehiclePos.y - 22}
              textAnchor="middle"
              fontSize="22"
              initial={{ scale: 0 }}
              animate={{ x: vehiclePos.x, y: vehiclePos.y - 22, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {vehicleIcon}
            </motion.text>
          )}
        </AnimatePresence>

        {/* Secondary Vehicle */}
        <AnimatePresence>
          {secondaryVehiclePos && (
            <motion.text
              x={secondaryVehiclePos.x}
              y={secondaryVehiclePos.y - 22}
              textAnchor="middle"
              fontSize="22"
              initial={{ scale: 0 }}
              animate={{ x: secondaryVehiclePos.x, y: secondaryVehiclePos.y - 22, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {secondaryVehicleIcon}
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
