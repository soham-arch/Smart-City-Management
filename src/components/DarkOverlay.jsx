const DarkOverlay = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(5, 5, 20, 0.65)',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default DarkOverlay;
