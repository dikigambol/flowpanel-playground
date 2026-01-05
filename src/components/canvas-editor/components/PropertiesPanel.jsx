import { useState, useEffect } from 'react';
import {
  drawerStyle,
  headerStyle,
  controlGroupStyle,
  labelStyle,
  buttonStyle,
  smallTextStyle,
} from '../styles';
import PolygonProperties from './PolygonProperties';
import TextProperties from './TextProperties';
import ImageProperties from './ImageProperties';

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
      {element.type === 'polygon' && (
        <PolygonProperties
          properties={properties}
          editMode={editMode}
          nodeCount={nodeCount}
          selectedNodeIndex={selectedNodeIndex}
          onPropertyChange={handlePropertyChange}
          onToggleEditMode={toggleEditMode}
          onDeleteSelectedNode={deleteSelectedNode}
        />
      )}
      {element.type === 'text' && (
        <TextProperties
          properties={properties}
          onPropertyChange={handlePropertyChange}
          onToggleFontStyle={toggleFontStyle}
        />
      )}
      {element.type === 'image' && (
        <ImageProperties
          properties={properties}
          onPropertyChange={handlePropertyChange}
          onResetSize={() => element.resetSize?.()}
        />
      )}

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

