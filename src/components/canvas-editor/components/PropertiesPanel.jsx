import { useState, useEffect, useRef } from 'react';
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
import LineProperties from './LineProperties';
import { Square, Type, Image, Zap, Minus, Trash2, ChevronUp, ChevronDown, Grip } from 'lucide-react';

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
  const [segmentCount, setSegmentCount] = useState(0);
  const [selectedControlPointIndex, setSelectedControlPointIndex] = useState(null);

  // Panel state for resizable and draggable
  const [panelSize, setPanelSize] = useState({ width: 220, height: 380 });
  const [panelPosition, setPanelPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 });

  const panelRef = useRef(null);

  // Set default position to top-right corner (more to the left)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPanelPosition({
        x: window.innerWidth - panelSize.width - 40,  // More margin from right edge
        y: 70,
      });
    }
  }, []);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.properties-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanelPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isResizing) {
      const newWidth = Math.max(180, Math.min(350, resizeStart.width + (e.clientX - resizeStart.x)));
      const newHeight = Math.max(250, Math.min(500, resizeStart.height + (e.clientY - resizeStart.y)));
      setPanelSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Resize handlers
  const handleResizeMouseDown = (e) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: panelSize.width,
      height: panelSize.height,
    });
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart]);

  // Sync properties from element
  useEffect(() => {
    if (element) {
      const props = element.getProperties();
      setProperties(props);
      setEditMode(element.isEditMode || false);
      setNodeCount(element.getNodeCount?.() || 0);
      setSelectedNodeIndex(element.getSelectedNodeIndex?.() || null);
      setSegmentCount(element.getSegmentCount?.() || 0);
      setSelectedControlPointIndex(element.getSelectedControlPointIndex?.() || null);
    }
  }, [element]);

  // Re-sync when element updates (for node/segment operations)
  useEffect(() => {
    if (element) {
      const interval = setInterval(() => {
        setNodeCount(element.getNodeCount?.() || 0);
        setSelectedNodeIndex(element.getSelectedNodeIndex?.() || null);
        setSegmentCount(element.getSegmentCount?.() || 0);
        setSelectedControlPointIndex(element.getSelectedControlPointIndex?.() || null);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [element]);

  if (!element) {
    return null;
  }

  const handlePropertyChange = (key, value) => {
    // Update local state
    setProperties(prev => ({ ...prev, [key]: value }));
    // Only send the changed property to avoid overwriting transformed positions
    onUpdate?.({ [key]: value });
  };

  const toggleEditMode = () => {
    const newEditMode = !editMode;
    setEditMode(newEditMode);
    element.setEditMode(newEditMode);
    
    if (!newEditMode) {
      element.selectPolygon?.();
      element.selectBezierLine?.();
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

  // Get display name based on element type
  const getElementDisplayName = () => {
    switch (element.type) {
      case 'symbol': return 'Machine Symbol';
      default: return element.type.charAt(0).toUpperCase() + element.type.slice(1);
    }
  };

  // Get icon based on element type
  const getElementIcon = () => {
    switch (element.type) {
      case 'polygon': return <Square size={14} />;
      case 'text': return <Type size={14} />;
      case 'symbol': return <Zap size={14} />;
      case 'image': return <Image size={14} />;
      case 'line': return <Minus size={14} />;
      default: return '□';
    }
  };

  return (
    <div
      ref={panelRef}
      className="properties-drawer"
      style={{
        ...drawerStyle,
        width: panelSize.width,
        height: panelSize.height,
        position: 'absolute',
        top: panelPosition.y,
        left: panelPosition.x,
        transition: isDragging || isResizing ? 'none' : 'opacity 0.2s ease',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div 
        className="properties-header" 
        style={{ 
          ...headerStyle, 
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0px', // Reduced top padding
          marginTop: '-5px',
          paddingBottom: '10px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getElementIcon()} 
          <span>{getElementDisplayName()}</span>
        </div>
        <Grip size={14} style={{ color: '#94a3b8', opacity: 0.6 }} />
      </div>

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
      {element.type === 'symbol' && (
        <div style={controlGroupStyle}>
          <span style={smallTextStyle}>
            <Zap size={12} /> Machine Symbol properties (Coming Soon)
          </span>
        </div>
      )}
      {element.type === 'image' && (
        <ImageProperties
          properties={properties}
          onPropertyChange={handlePropertyChange}
          onResetSize={() => element.resetSize?.()}
        />
      )}
      {element.type === 'line' && (
        <LineProperties
          properties={properties}
          editMode={editMode}
          segmentCount={segmentCount}
          selectedControlPointIndex={selectedControlPointIndex}
          onPropertyChange={handlePropertyChange}
          onToggleEditMode={toggleEditMode}
          onDeleteSelectedSegment={() => {
            const success = element.deleteSelectedSegment?.();
            if (!success && element.getSegmentCount?.() <= 1) {
              alert('Minimal 2 titik untuk membentuk garis!');
            }
          }}
        />
      )}

      {/* Element Actions */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Element Actions</span>
        
        {/* Layer Ordering */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <button
            onClick={() => element.bringToFront?.()}
            style={{
              ...buttonStyle(false),
              padding: '6px 8px',
              fontSize: '11px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            title="Bring to Front"
          >
            <ChevronUp size={12} /> Front
          </button>
          <button
            onClick={() => element.sendToBack?.()}
            style={{
              ...buttonStyle(false),
              padding: '5px 6px',
              fontSize: '10px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
            }}
            title="Send to Back"
          >
            <ChevronDown size={12} /> Back
          </button>
        </div>
        
        <button
          onClick={onDelete}
          style={{
            ...buttonStyle(false, '#dc2626'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Trash2 size={14} /> Delete Element
        </button>
      </div>

      {/* Resize handle */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'nw-resize',
          background: 'url("data:image/svg+xml,%3csvg width="6" height="6" xmlns="http://www.w3.org/2000/svg"%3e%3cpath d="m0 6l6-6h-6v6z" fill="%23666"/%3e%3c/svg%3e") no-repeat center',
        }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

export default PropertiesPanel;
