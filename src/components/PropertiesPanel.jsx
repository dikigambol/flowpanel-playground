import { useState, useEffect } from 'react';

function PropertiesPanel({ selectedObject, activeTool }) {
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1e40af');
  const [hasBorder, setHasBorder] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Update properties saat object berubah
  useEffect(() => {
    if (selectedObject) {
      // Load properties dari selected object
      if (selectedObject.fill) {
        setFillColor(selectedObject.fill);
      }
      if (selectedObject.stroke) {
        setStrokeColor(selectedObject.stroke);
        setHasBorder(true);
      } else {
        setHasBorder(false);
      }
      if (selectedObject.strokeWidth) {
        setStrokeWidth(selectedObject.strokeWidth);
      }
    }
  }, [selectedObject]);

  // Update object saat properties berubah
  useEffect(() => {
    if (selectedObject) {
      selectedObject.set({
        fill: fillColor,
        stroke: hasBorder ? strokeColor : null,
        strokeWidth: hasBorder ? strokeWidth : 0,
      });
      selectedObject.canvas?.requestRenderAll();
    }
  }, [fillColor, strokeColor, hasBorder, strokeWidth, selectedObject]);

  if (!selectedObject && !activeTool) {
    return (
      <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
        <p>Pilih object di canvas atau pilih tool untuk melihat properties</p>
      </div>
    );
  }

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
        Properties
      </h2>

      {selectedObject ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Fill Color */}
          <div style={{
            padding: '15px',
            backgroundColor: '#1e1e3f',
            borderRadius: '8px',
          }}>
            <label style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: '10px',
            }}>
              Fill Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                style={{
                  width: '50px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{fillColor}</span>
            </div>
          </div>

          {/* Border Controls */}
          <div style={{
            padding: '15px',
            backgroundColor: '#1e1e3f',
            borderRadius: '8px',
          }}>
            <label style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: '10px',
            }}>
              Border
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={hasBorder}
                  onChange={(e) => setHasBorder(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#3b82f6',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  {hasBorder ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {hasBorder && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      style={{
                        width: '50px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{strokeColor}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(Number(e.target.value))}
                      style={{
                        flex: 1,
                        accentColor: '#3b82f6',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#cbd5e1', minWidth: '40px' }}>
                      {strokeWidth}px
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '15px', backgroundColor: '#1e1e3f', borderRadius: '8px', color: '#94a3b8' }}>
          <p>Pilih object di canvas untuk mengedit properties</p>
        </div>
      )}
    </div>
  );
}

export default PropertiesPanel;

