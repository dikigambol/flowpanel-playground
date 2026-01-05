function ToolboxPanel({ activeTool, onToolSelect }) {
  const tools = [
    { 
      id: 'shape', 
      name: 'Shape Tool', 
      icon: '🔷', 
      description: 'Polygon editor dengan nodes yang bisa diedit' 
    },
    // Nanti bisa ditambah tools lain di sini
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ 
        color: '#60a5fa', 
        fontSize: '18px', 
        fontWeight: '600',
        marginBottom: '20px',
        borderBottom: '1px solid #2a2a4a',
        paddingBottom: '10px',
      }}>
        Tools
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            style={{
              padding: '15px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeTool === tool.id ? '#3b82f6' : '#1e1e3f',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              border: activeTool === tool.id ? '2px solid #60a5fa' : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{tool.icon}</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{tool.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  {tool.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeTool && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#1e1e3f',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#94a3b8',
        }}>
          <strong style={{ color: '#60a5fa' }}>💡 Tip:</strong>
          <p style={{ marginTop: '8px', lineHeight: '1.6' }}>
            Klik pada canvas untuk menggunakan tool yang dipilih.
            Gunakan Properties tab untuk mengatur properti object.
          </p>
        </div>
      )}
    </div>
  );
}

export default ToolboxPanel;

