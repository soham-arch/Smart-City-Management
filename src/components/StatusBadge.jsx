const StatusBadge = ({ status }) => {
  const config = {
    dispatched: { color: '#3d8fff', label: 'Dispatched' },
    en_route: { color: '#ffb800', label: 'En Route' },
    resolved: { color: '#39ff8f', label: 'Resolved' },
  };

  const { color, label } = config[status] || config.dispatched;

  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
      style={{
        color,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
