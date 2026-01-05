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

  // Render based on element type
  const renderPolygonProperties = () => (
    <>
      {/* Fill Color */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Fill Color</span>
        <div style={inputRowStyle}>
          <input
            type="color"
            value={properties.fillColor || '#3b82f6'}
            onChange={(e) => handlePropertyChange('fillColor', e.target.value)}
            style={colorInputStyle}
          />
          <span style={smallTextStyle}>{properties.fillColor}</span>
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

