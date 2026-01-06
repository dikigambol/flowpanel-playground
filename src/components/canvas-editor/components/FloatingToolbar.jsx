import { useState, useEffect } from 'react';
import {
  floatingToolbarStyle,
  iconButtonStyle,
  checkboxStyle,
  buttonStyle,
  mutedTextStyle,
  verticalDividerStyle,
} from '../styles';
import { MousePointer2, Hand, Maximize2, Group, Ungroup } from 'lucide-react';

/**
 * FloatingToolbar - Toolbar floating untuk canvas controls
 * 
 * @param {Object} props
 * @param {string} props.activeTool - Currently active tool ('select' | 'pan')
 * @param {Function} props.onToolChange - Callback saat tool berubah
 * @param {boolean} props.gridOn - Whether grid is visible
 * @param {Function} props.onGridToggle - Callback saat grid toggle
 * @param {number} props.zoomLevel - Current zoom level (0-1 scale)
 * @param {Function} props.onFitView - Callback saat fit view clicked
 * @param {Array<string>} props.selectedElementIds - Array of selected element IDs
 * @param {Function} props.onGroup - Callback saat group clicked
 * @param {Function} props.onUngroup - Callback saat ungroup clicked
 * @param {Function} props.getCanvas - Function to get canvas instance
 */
function FloatingToolbar({ 
  activeTool, 
  onToolChange, 
  gridOn, 
  onGridToggle, 
  zoomLevel, 
  onFitView,
  selectedElementIds = [],
  onGroup,
  onUngroup,
  getCanvas,
}) {
  // Check if active object is a group or active selection
  const [isGroupSelected, setIsGroupSelected] = useState(false);
  const [canGroup, setCanGroup] = useState(false);
  
  useEffect(() => {
    if (!getCanvas) return;
    
    const canvas = getCanvas();
    if (!canvas) return;
    
    const checkSelection = () => {
      const activeObject = canvas.getActiveObject();
      const activeObjects = canvas.getActiveObjects();
      
      // Can group if multiple objects selected (activeSelection)
      const hasMultipleSelected = activeObjects.length >= 2;
      setCanGroup(hasMultipleSelected);
      
      // Can ungroup if a group is selected
      setIsGroupSelected(activeObject?.type === 'group');
    };
    
    // Check initially
    checkSelection();
    
    // Listen to selection changes
    canvas.on('selection:created', checkSelection);
    canvas.on('selection:updated', checkSelection);
    canvas.on('selection:cleared', checkSelection);
    
    return () => {
      canvas.off('selection:created', checkSelection);
      canvas.off('selection:updated', checkSelection);
      canvas.off('selection:cleared', checkSelection);
    };
  }, [getCanvas, selectedElementIds]); // Re-run when selection changes
  return (
    <div style={floatingToolbarStyle}>
      {/* Tool Buttons */}
      <div style={{ display: 'flex', gap: '4px', ...verticalDividerStyle }}>
        <button
          onClick={() => onToolChange('select')}
          title="Select Tool (V)"
          style={iconButtonStyle(activeTool === 'select')}
        >
          <MousePointer2 size={16} />
        </button>
        <button
          onClick={() => onToolChange('pan')}
          title="Pan Tool (H)"
          style={iconButtonStyle(activeTool === 'pan')}
        >
          <Hand size={16} />
        </button>
        <button
          onClick={onGroup}
          title="Group (Ctrl+G)"
          disabled={!canGroup}
          style={{
            ...iconButtonStyle(false),
            opacity: !canGroup ? 0.5 : 1,
            cursor: !canGroup ? 'not-allowed' : 'pointer',
          }}
        >
          <Group size={16} />
        </button>
        <button
          onClick={onUngroup}
          title="Ungroup"
          disabled={!isGroupSelected}
          style={{
            ...iconButtonStyle(false),
            opacity: !isGroupSelected ? 0.5 : 1,
            cursor: !isGroupSelected ? 'not-allowed' : 'pointer',
          }}
        >
          <Ungroup size={16} />
        </button>
      </div>

      {/* Grid Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="checkbox"
          checked={gridOn}
          onChange={(e) => onGridToggle(e.target.checked)}
          style={{ ...checkboxStyle, margin: 0 }}
        />
        <span style={{ ...mutedTextStyle, margin: 0 }}>Grid</span>
      </div>
      
      {/* Zoom Level */}
      <div style={{ ...mutedTextStyle, minWidth: '40px', textAlign: 'center' }}>
        {(zoomLevel * 100).toFixed(0)}%
      </div>
      
      {/* Fit View Button */}
      <button
        onClick={onFitView}
        style={{ 
          ...buttonStyle(false), 
          padding: '4px 8px', 
          fontSize: '11px',
          minWidth: 'auto',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Maximize2 size={14} /> Fit
      </button>
    </div>
  );
}

export default FloatingToolbar;
