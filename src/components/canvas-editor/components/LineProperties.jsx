import {
  controlGroupStyle,
  labelStyle,
  inputRowStyle,
  colorInputStyle,
  rangeStyle,
  buttonStyle,
  smallTextStyle,
  mutedTextStyle,
} from '../styles';

/**
 * LineProperties - Properties component untuk line elements
 */
function BezierLineProperties({ properties, onPropertyChange, editMode, segmentCount, selectedControlPointIndex, onToggleEditMode, onDeleteSelectedSegment }) {
  const handlePropertyChange = (key, value) => {
    onPropertyChange(key, value);
  };

  const toggleEditMode = () => {
    onToggleEditMode(!editMode);
  };

  const deleteSelectedNode = () => {
    if (onDeleteSelectedSegment) {
      const success = onDeleteSelectedSegment();
      if (!success && segmentCount <= 1) {
        alert('Minimal 2 titik untuk membentuk garis!');
      }
    }
  };

  // Node count = segmentCount + 1 (points = segments + 1)
  const nodeCount = segmentCount + 1;

  return (
    <>
      {/* Stroke Color */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Stroke Color</span>
        <div style={inputRowStyle}>
          <input
            type="color"
            value={properties.strokeColor || '#22c55e'}
            onChange={(e) => handlePropertyChange('strokeColor', e.target.value)}
            style={colorInputStyle}
          />
          <input
            type="text"
            value={properties.strokeColor || '#22c55e'}
            onChange={(e) => handlePropertyChange('strokeColor', e.target.value)}
            style={{
              ...rangeStyle,
              width: '100px',
              marginLeft: '8px',
            }}
            placeholder="#22c55e"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Stroke Width: {properties.strokeWidth || 3}px</span>
        <input
          type="range"
          min="1"
          max="20"
          value={properties.strokeWidth || 3}
          onChange={(e) => handlePropertyChange('strokeWidth', parseInt(e.target.value))}
          style={rangeStyle}
        />
      </div>

      {/* Node Info */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Nodes: {nodeCount}</span>
        <span style={mutedTextStyle}>
          {nodeCount} titik, {segmentCount} segment garis
        </span>
      </div>

      {/* Edit Mode */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Edit Mode</span>
        <button
          onClick={toggleEditMode}
          style={buttonStyle(editMode)}
        >
          {editMode ? '✓ Edit Mode ON' : 'Edit Shape'}
        </button>
        {editMode && (
          <div style={{ marginTop: '8px' }}>
            <span style={smallTextStyle}>
              • Drag titik untuk mengubah posisi<br/>
              • Hijau = titik awal/akhir<br/>
              • Merah = titik tengah<br/>
              • Kuning = titik terpilih<br/>
            </span>
          </div>
        )}
      </div>

      {/* Delete Node (Edit Mode Only) */}
      {editMode && selectedControlPointIndex !== null && (
        <div style={controlGroupStyle}>
          <span style={labelStyle}>Selected Node</span>
          <button
            onClick={deleteSelectedNode}
            style={buttonStyle(false, '#dc2626')}
          >
            Delete Node
          </button>
          <span style={smallTextStyle}>
            Node: {selectedControlPointIndex?.segIndex !== undefined ? selectedControlPointIndex.segIndex + 1 : 'None'}
          </span>
        </div>
      )}

      {/* Instructions */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Instructions</span>
        <div style={smallTextStyle}>
          <strong>Editing:</strong><br/>
          • Klik "Edit Shape" untuk edit titik<br/>
          • Drag titik merah/hijau untuk pindahkan<br/>
          • Drag lingkaran biru untuk pindahkan segment<br/>
          • Double-click lingkaran biru untuk tambah titik<br/>
          • Klik titik lalu "Delete Node" untuk hapus<br/>
        </div>
      </div>
    </>
  );
}

export default BezierLineProperties;
