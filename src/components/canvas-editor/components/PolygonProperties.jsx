import { useState } from 'react';
import {
  controlGroupStyle,
  labelStyle,
  inputRowStyle,
  colorInputStyle,
  rangeStyle,
  buttonStyle,
  checkboxStyle,
  smallTextStyle,
  mutedTextStyle,
} from '../styles';

/**
 * PolygonProperties - Properties component untuk polygon elements
 */
function PolygonProperties({ properties, onPropertyChange, editMode, nodeCount, selectedNodeIndex, onToggleEditMode, onDeleteSelectedNode }) {
  const handlePropertyChange = (key, value) => {
    onPropertyChange(key, value);
  };

  const toggleEditMode = () => {
    onToggleEditMode(!editMode);
  };

  const deleteSelectedNode = () => {
    if (onDeleteSelectedNode) {
      const success = onDeleteSelectedNode();
      if (!success && nodeCount <= 3) {
        alert('Minimal 3 node untuk membentuk polygon!');
      }
    }
  };

  return (
    <>
      {/* Fill Color */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Fill Color</span>
        <div style={inputRowStyle}>
          <input
            type="checkbox"
            checked={properties.transparentFill || false}
            onChange={(e) => handlePropertyChange('transparentFill', e.target.checked)}
            style={checkboxStyle}
          />
          <span style={smallTextStyle}>Transparent</span>
        </div>
        {!properties.transparentFill && (
          <div style={inputRowStyle}>
            <input
              type="color"
              value={properties.fillColor || '#3b82f6'}
              onChange={(e) => handlePropertyChange('fillColor', e.target.value)}
              style={colorInputStyle}
            />
            <span style={smallTextStyle}>{properties.fillColor}</span>
          </div>
        )}
      </div>

      {/* Shape Type */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Shape Type</span>
        <div style={inputRowStyle}>
          <select
            value={properties.shapeType || 'freeform'}
            onChange={(e) => handlePropertyChange('shapeType', e.target.value)}
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid #2a2a4a',
              borderRadius: '6px',
              backgroundColor: '#1e1e3f',
              color: '#cbd5e1',
              fontSize: '12px',
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            <option value="freeform">Freeform</option>
            <option value="triangle">Triangle</option>
            <option value="square">Square</option>
            <option value="diamond">Diamond</option>
            <option value="parallelogram">Parallelogram</option>
            <option value="pentagon">Pentagon</option>
            <option value="hexagon">Hexagon</option>
            <option value="circle">Circle</option>
          </select>
        </div>
      </div>

      {/* Status */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Status</span>
        <div style={inputRowStyle}>
          <select
            value={properties.status || ''}
            onChange={(e) => handlePropertyChange('status', e.target.value)}
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid #2a2a4a',
              borderRadius: '6px',
              backgroundColor: '#1e1e3f',
              color: '#cbd5e1',
              fontSize: '12px',
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            <option value="">Default</option>
            <option value="running">Running (Hijau)</option>
            <option value="idle">Idle (Kuning)</option>
            <option value="off">Off (Kuning)</option>
            <option value="alarm">Alarm (Merah)</option>
            <option value="maintenance">Maintenance (Biru)</option>
            <option value="breakdown">Breakdown (Hitam)</option>
            <option value="disconnected">Disconnected (Abu-abu)</option>
          </select>
        </div>
      </div>

      {/* Border Controls */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Border</span>
        <div style={inputRowStyle}>
          <input
            type="checkbox"
            checked={properties.hasBorder !== false}
            onChange={(e) => handlePropertyChange('hasBorder', e.target.checked)}
            style={checkboxStyle}
          />
          <span style={smallTextStyle}>
            {properties.hasBorder !== false ? 'On' : 'Off'}
          </span>
        </div>
        {properties.hasBorder !== false && (
          <>
            <div style={inputRowStyle}>
              <input
                type="color"
                value={properties.strokeColor || '#1e40af'}
                onChange={(e) => handlePropertyChange('strokeColor', e.target.value)}
                style={colorInputStyle}
              />
              <span style={smallTextStyle}>{properties.strokeColor}</span>
            </div>
            <div style={inputRowStyle}>
              <input
                type="range"
                min="1"
                max="15"
                value={properties.strokeWidth || 3}
                onChange={(e) => handlePropertyChange('strokeWidth', Number(e.target.value))}
                style={rangeStyle}
              />
              <span style={smallTextStyle}>{properties.strokeWidth || 3}px</span>
            </div>
          </>
        )}
      </div>

      {/* Edit Mode */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Edit Nodes</span>
        <button
          onClick={toggleEditMode}
          style={buttonStyle(editMode)}
        >
          {editMode ? '✓ Done Editing' : '✎ Edit Shape'}
        </button>
        <span style={mutedTextStyle}>
          Nodes: {nodeCount}
        </span>
      </div>

      {/* Delete Node Button (edit mode only) */}
      {editMode && selectedNodeIndex !== null && (
        <div style={controlGroupStyle}>
          <span style={labelStyle}>Node Actions</span>
          <button
            onClick={deleteSelectedNode}
            style={buttonStyle(false, '#ef4444')}
          >
            🗑 Delete Node
          </button>
          <span style={mutedTextStyle}>
            Selected Node: {selectedNodeIndex + 1}
          </span>
        </div>
      )}

      {/* Edit Nodes Tips */}
      {editMode && (
        <div style={controlGroupStyle}>
          <span style={labelStyle}>💡 Edit Tips</span>
          <div style={{ ...smallTextStyle, lineHeight: '1.4', marginTop: '4px' }}>
            • <strong>Add Node:</strong> Double-click on blue circles<br/>
            • <strong>Move Edge:</strong> Drag blue circles to reshape<br/>
            • <strong>Delete Node:</strong> Select node then click "Delete Node"
          </div>
        </div>
      )}

      {/* General Polygon Tips */}
      {!editMode && (
        <div style={controlGroupStyle}>
          <span style={labelStyle}>💡 Usage Tips</span>
          <div style={{ ...smallTextStyle, lineHeight: '1.4', marginTop: '4px' }}>
            • Click "Edit Shape" to modify nodes and edges<br/>
            • Change shape type to create presets (triangle, square, etc.)<br/>
            • Toggle border on/off and adjust thickness
          </div>
        </div>
      )}
    </>
  );
}

export default PolygonProperties;