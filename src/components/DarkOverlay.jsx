export default function DarkOverlay() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 5, 20, 0.72)',
      zIndex: 1,
      pointerEvents: 'none'
    }} />
  );
}
