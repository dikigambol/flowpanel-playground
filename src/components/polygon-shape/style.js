// Styles for EditableBaseShape component

export const canvasWrapperStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  margin: 0,
  padding: 0,
  backgroundColor: '#1a1a2e',
};

export const canvasStyle = {
  width: '100%',
  height: '100%',
  display: 'block',
};

export const drawerStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  width: '250px',
  backgroundColor: '#15152a',
  border: '1px solid #2a2a4a',
  borderRadius: '12px',
  padding: '15px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  zIndex: 10,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

export const headerStyle = {
  color: '#60a5fa',
  fontSize: '18px',
  fontWeight: '600',
  borderBottom: '1px solid #2a2a4a',
  paddingBottom: '10px',
  marginBottom: '8px',
};

export const controlGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '10px',
  backgroundColor: '#1e1e3f',
  borderRadius: '8px',
};

export const labelStyle = {
  fontSize: '10px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export const inputRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export const colorInputStyle = {
  width: '40px',
  height: '32px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

export const rangeStyle = {
  flex: 1,
  accentColor: '#3b82f6',
};

export const buttonStyle = (active = false, color = '#3b82f6') => ({
  padding: '8px 12px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '12px',
  backgroundColor: active ? '#22c55e' : color,
  color: '#ffffff',
  transition: 'all 0.2s',
});

export const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentColor: '#3b82f6',
  cursor: 'pointer',
};
