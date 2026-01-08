// Shared styles for Canvas Editor components

// ==================== Canvas Styles ====================

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

// ==================== Panel Styles ====================

export const drawerStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  width: '220px',
  maxHeight: 'calc(100vh - 80px)',
  backgroundColor: '#15152a',
  border: '1px solid #2a2a4a',
  borderRadius: '10px',
  padding: '10px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  zIndex: 10,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

export const sidebarStyle = {
  position: 'absolute',
  top: '10px',
  left: '20px',
  width: '30px',
  backgroundColor: '#ffffffff',
  border: '1px solid #3a3a3aff',
  borderRadius: '10px',
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  zIndex: 10,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

export const floatingToolbarStyle = {
  position: 'absolute',
  top: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(15, 23, 42, 0.9)',
  borderRadius: '6px',
  padding: '4px 8px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '8px',
  zIndex: 1000,
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(71, 85, 105, 0.3)',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

// ==================== Typography Styles ====================

export const headerStyle = {
  color: '#60a5fa',
  fontSize: '16px',
  fontWeight: '600',
  borderBottom: '1px solid #2a2a4a',
  paddingBottom: '8px',
  marginBottom: '6px',
};

export const labelStyle = {
  fontSize: '9px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export const smallTextStyle = {
  fontSize: '10px',
  color: '#cbd5e1',
};

export const mutedTextStyle = {
  fontSize: '11px',
  color: '#94a3b8',
};

// ==================== Control Group Styles ====================

export const controlGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: '8px',
  backgroundColor: '#1e1e3f',
  borderRadius: '6px',
};

export const inputRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

// ==================== Input Styles ====================

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

export const checkboxStyle = {
  width: '18px',
  height: '18px',
  accentColor: '#3b82f6',
  cursor: 'pointer',
};

// ==================== Button Styles ====================

export const buttonStyle = (active = false, color = '#3b82f6') => ({
  padding: '6px 10px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '11px',
  backgroundColor: active ? '#22c55e' : color,
  color: '#ffffff',
  transition: 'all 0.2s',
});

export const iconButtonStyle = (active = false) => ({
  padding: '6px 10px',
  fontSize: '14px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  backgroundColor: active ? '#3b82f6' : 'transparent',
  color: active ? '#ffffff' : '#94a3b8',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const sidebarButtonStyle = (active = false) => ({
  width: '28px',
  height: '28px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  backgroundColor: active ? '#3b82f6' : 'transparent',
  color: active ? '#393939ff' : '#000000ff',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
});

// ==================== Divider Styles ====================

export const verticalDividerStyle = {
  borderRight: '1px solid rgba(71, 85, 105, 0.5)',
  paddingRight: '8px',
};

export const horizontalDividerStyle = {
  borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
  paddingBottom: '8px',
  marginBottom: '8px',
};

// Resizable handle styles
export const resizableHandleStyle = {
  position: 'absolute',
  width: '20px',
  height: '20px',
  bottom: '0',
  right: '0',
  background: 'url("data:image/svg+xml,%3csvg width="6" height="6" xmlns="http://www.w3.org/2000/svg"%3e%3cpath d="m0 6l6-6h-6v6z" fill="%23666"/%3e%3c/svg%3e") no-repeat center',
  cursor: 'nw-resize',
  zIndex: 1,
};

