import { useState, useEffect } from 'react';
import {
  drawerStyle,
  headerStyle,
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
 * PropertiesPanel - Panel untuk mengedit properties elemen yang dipilih
 * Panel muncul otomatis saat element diklik, hilang saat deselect
 * 
 * @param {Object} props
 * @param {Object} props.element - Selected element instance
 * @param {Function} props.onUpdate - Callback saat properties diupdate
 * @param {Function} props.onDelete - Callback saat delete element
 */
function PropertiesPanel({ element, onUpdate, onDelete }) {
  // Local state for properties
  const [properties, setProperties] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(null);

  // Sync properties from element
  useEffect(() => {
    if (element) {
      const props = element.getProperties();
      setProperties(props);
      setEditMode(element.isEditMode || false);
      setNodeCount(element.getNodeCount?.() || 0);
      setSelectedNodeIndex(element.getSelectedNodeIndex?.() || null);
    }
  }, [element]);

  // Re-sync when element updates (for node operations)
  useEffect(() => {
    if (element) {
      const interval = setInterval(() => {
        setNodeCount(element.getNodeCount?.() || 0);
        setSelectedNodeIndex(element.getSelectedNodeIndex?.() || null);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [element]);

  if (!element) {
    return null;
  }

  const handlePropertyChange = (key, value) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);
    onUpdate?.(newProperties);
  };

  const toggleEditMode = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    element.setEditMode(newEditMode);
    
    if (!newEditMode) {
      element.selectPolygon?.();
    }
  };

  const deleteSelectedNode = () => {
    if (element.deleteSelectedNode) {
      const success = element.deleteSelectedNode();
      if (!success && element.getNodeCount?.() <= 3) {
        alert('Minimal 3 node untuk membentuk polygon!');
      }
    }
  };

  // Toggle font style helper
  const toggleFontStyle = (style) => {
    if (style === 'bold') {
      handlePropertyChange('fontWeight', properties.fontWeight === 'bold' ? 'normal' : 'bold');
    } else if (style === 'italic') {
      handlePropertyChange('fontStyle', properties.fontStyle === 'italic' ? 'normal' : 'italic');
    } else if (style === 'underline') {
      handlePropertyChange('underline', !properties.underline);
    }
  };

  // Render based on element type
  const renderPolygonProperties = () => (
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
    </>
  );

  // Render text properties
  const renderTextProperties = () => (
    <>
      {/* Font Size */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Font Size</span>
        <div style={inputRowStyle}>
          <input
            type="range"
            min="8"
            max="120"
            value={properties.fontSize || 24}
            onChange={(e) => handlePropertyChange('fontSize', Number(e.target.value))}
            style={rangeStyle}
          />
          <span style={smallTextStyle}>{properties.fontSize || 24}px</span>
        </div>
      </div>

      {/* Font Color */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Font Color</span>
        <div style={inputRowStyle}>
          <input
            type="color"
            value={properties.fontColor || '#ffffff'}
            onChange={(e) => handlePropertyChange('fontColor', e.target.value)}
            style={colorInputStyle}
          />
          <span style={smallTextStyle}>{properties.fontColor}</span>
        </div>
      </div>

      {/* Font Style */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Font Style</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => toggleFontStyle('bold')}
            style={{
              ...buttonStyle(properties.fontWeight === 'bold'),
              fontWeight: 'bold',
              minWidth: '36px',
              padding: '6px 10px',
            }}
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => toggleFontStyle('italic')}
            style={{
              ...buttonStyle(properties.fontStyle === 'italic'),
              fontStyle: 'italic',
              minWidth: '36px',
              padding: '6px 10px',
            }}
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => toggleFontStyle('underline')}
            style={{
              ...buttonStyle(properties.underline === true),
              textDecoration: 'underline',
              minWidth: '36px',
              padding: '6px 10px',
            }}
            title="Underline"
          >
            U
          </button>
        </div>
      </div>

      {/* Font Family */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Font Family</span>
        <select
          value={properties.fontFamily || 'Arial'}
          onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #2a2a4a',
            backgroundColor: '#1a1a2e',
            color: '#cbd5e1',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
          <option value="Impact">Impact</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
        </select>
      </div>

      {/* Edit Text Hint */}
      <div style={controlGroupStyle}>
        <span style={mutedTextStyle}>
          💡 Double-click text to edit content
        </span>
      </div>
    </>
  );

  // Get icon based on element type
  const getElementIcon = () => {
    switch (element.type) {
      case 'polygon': return '⬡';
      case 'text': return 'T';
      case 'image': return '🖼';
      default: return '□';
    }
  };

  return (
    <div style={{
      ...drawerStyle,
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }}>
      {/* Header */}
      <h1 style={headerStyle}>
        {getElementIcon()} {element.type.charAt(0).toUpperCase() + element.type.slice(1)}
      </h1>

      {/* Properties based on type */}
      {element.type === 'polygon' && renderPolygonProperties()}
      {element.type === 'text' && renderTextProperties()}

      {/* Delete Element */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Element Actions</span>
        <button
          onClick={onDelete}
          style={buttonStyle(false, '#dc2626')}
        >
          🗑 Delete Element
        </button>
      </div>
    </div>
  );
}

export default PropertiesPanel;

