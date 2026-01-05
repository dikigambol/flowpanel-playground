function HeaderBar({ activeTab, onTabChange, showGrid, onToggleGrid }) {
  return (
    <div style={{
      height: '60px',
      backgroundColor: '#1a1a3e',
      borderBottom: '1px solid #2a2a4a',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '20px',
      flexShrink: 0,
    }}>
      <h1 style={{ 
        color: '#60a5fa', 
        fontSize: '20px', 
        margin: 0,
        marginRight: 'auto',
        fontWeight: '600',
      }}>
        🎨 Flow Panel Editor
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => onTabChange('toolbox')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'toolbox' ? '#3b82f6' : '#2a2a4a',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          Toolbox
        </button>
        <button
          onClick={() => onTabChange('properties')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'properties' ? '#3b82f6' : '#2a2a4a',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
        >
          Properties
        </button>
      </div>

      {/* Grid Toggle */}
      <button
        onClick={onToggleGrid}
        style={{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: showGrid ? '#22c55e' : '#2a2a4a',
          color: '#ffffff',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.2s',
        }}
      >
        {showGrid ? '✓ Grid On' : 'Grid Off'}
      </button>
    </div>
  );
}

export default HeaderBar;

