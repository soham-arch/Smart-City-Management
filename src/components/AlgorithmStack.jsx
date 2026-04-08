const AlgorithmStack = ({ title = 'DSA Concepts Used', items = [], accent = '#3d8fff' }) => {
  if (!items.length) return null;

  return (
    <div
      className="mb-4 p-3 rounded-lg border"
      style={{
        backgroundColor: `${accent}10`,
        borderColor: `${accent}22`,
      }}
    >
      <div className="text-[10px] font-mono text-[rgba(255,255,255,0.5)] uppercase mb-2">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="px-2 py-1 rounded text-[11px] font-mono border"
            style={{
              color: accent,
              backgroundColor: `${accent}12`,
              borderColor: `${accent}33`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AlgorithmStack;
