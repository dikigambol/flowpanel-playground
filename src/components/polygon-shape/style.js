// Styles for EditableBaseShape component

export const canvasWrapperStyle = {
  height: '100vh',
};

export const drawerStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  width: '300px',
  backgroundColor: '#15152a',
  border: '1px solid #2a2a4a',
  borderRadius: '12px',
  padding: '20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '25px',
  zIndex: 10,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

export const headerStyle = {
  color: '#60a5fa',
  fontSize: '22px',
  fontWeight: '600',
  borderBottom: '1px solid #2a2a4a',
  paddingBottom: '15px',
  marginBottom: '10px',
};

export const controlGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '15px',
  backgroundColor: '#1e1e3f',
  borderRadius: '8px',
};

export const labelStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export const inputRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
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
  padding: '10px 16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
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
