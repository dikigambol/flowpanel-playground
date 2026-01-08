import { useState, useEffect } from 'react';
import {
  floatingToolbarStyle,
  iconButtonStyle,
  checkboxStyle,
  buttonStyle,
  mutedTextStyle,
  verticalDividerStyle,
} from '../styles';
import { MousePointer2, Hand, Maximize2, Group, Ungroup, FileText, Image, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

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
 * @param {Function} props.onExportJSON - Callback saat export JSON clicked
 * @param {Function} props.onExportPNG - Callback saat export PNG clicked
 * @param {Function} props.getCanvas - Function to get canvas instance
 * @param {boolean} props.viewMode - Whether view mode is active
 * @param {Function} props.onViewModeToggle - Callback saat view mode toggle
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
  onExportJSON,
  onExportPNG,
  getCanvas,
  viewMode,
  onViewModeToggle,
}) {
  // Check if active object is a group or active selection
  const [isGroupSelected, setIsGroupSelected] = useState(false);
  const [canGroup, setCanGroup] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Force expand toolbar when view mode is active
  useEffect(() => {
    if (viewMode && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [viewMode, isCollapsed]);
  const [windowWidth, setWindowWidth] = useState(0);
  
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

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const prevWidth = windowWidth;
      setWindowWidth(width);
      
      // Auto-collapse when transitioning from large to small screen
      if (prevWidth >= 768 && width < 768) {
        setIsCollapsed(true);
      }
      // Auto-expand when transitioning from small to large screen
      else if (prevWidth < 768 && width >= 768) {
        setIsCollapsed(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // Initial check
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [windowWidth]);

  // Toggle collapse (manual override) - disabled in view mode
  const toggleCollapse = () => {
    if (!viewMode) {
      setIsCollapsed(!isCollapsed);
    }
  };
  return (
    <div style={{
      ...floatingToolbarStyle,
      padding: isCollapsed ? '6px' : '6px 12px',
      minWidth: isCollapsed ? 'auto' : 'auto',
    }}>
      {isCollapsed ? (
        // Collapsed view - tools based on view mode
        <>
          {viewMode ? (
            // View Mode: Pan tool, view toggle, zoom info, and fit view
            <>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => onToolChange('pan')}
                  title="Pan Tool (H)"
                  style={iconButtonStyle(activeTool === 'pan')}
                >
                  <Hand size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={viewMode}
                  onChange={(e) => onViewModeToggle(e.target.checked)}
                  style={{ ...checkboxStyle, margin: 0 }}
                />
                <span style={{ ...mutedTextStyle, margin: 0, fontSize: '10px' }}>View</span>
              </div>

              {/* Zoom Level */}
              <div style={{ ...mutedTextStyle, minWidth: '30px', textAlign: 'center', fontSize: '10px' }}>
                {(zoomLevel * 100).toFixed(0)}%
              </div>

              {/* Fit View Button */}
              <button
                onClick={onFitView}
                style={{
                  ...buttonStyle(false),
                  padding: '2px 6px',
                  fontSize: '10px',
                  minWidth: 'auto',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <Maximize2 size={10} /> Fit
              </button>
            </>
          ) : (
            // Normal Mode: Select tool and view toggle
            <>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => onToolChange('select')}
                  title="Select Tool (V)"
                  style={iconButtonStyle(activeTool === 'select')}
                >
                  <MousePointer2 size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={viewMode}
                  onChange={(e) => onViewModeToggle(e.target.checked)}
                  style={{ ...checkboxStyle, margin: 0 }}
                />
                <span style={{ ...mutedTextStyle, margin: 0, fontSize: '10px' }}>View</span>
              </div>

              {/* Expand button - only show in normal mode */}
              <button
                onClick={toggleCollapse}
                title="Expand Toolbar"
                style={{
                  ...iconButtonStyle(false),
                  padding: '4px',
                }}
              >
                <ChevronRight size={12} />
              </button>
            </>
          )}
        </>
      ) : (
        // Expanded view - tools based on view mode
        <>
          {viewMode ? (
            // View Mode: Pan tool, view toggle, zoom info, and fit view
            <>
              <button
                onClick={() => onToolChange('pan')}
                title="Pan Tool (H)"
                style={iconButtonStyle(activeTool === 'pan')}
              >
                <Hand size={14} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={viewMode}
                  onChange={(e) => onViewModeToggle(e.target.checked)}
                  style={{ ...checkboxStyle, margin: 0 }}
                />
                <span style={{ ...mutedTextStyle, margin: 0 }}>View</span>
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
                <Maximize2 size={12} /> Fit
              </button>
            </>
          ) : (
            // Normal Mode: All tools
            <>
              {/* Tool Buttons */}
              <div style={{ display: 'flex', gap: '4px', ...verticalDividerStyle }}>
                <button
                  onClick={() => onToolChange('select')}
                  title="Select Tool (V)"
                  style={iconButtonStyle(activeTool === 'select')}
                >
                  <MousePointer2 size={14} />
                </button>
                <button
                  onClick={() => onToolChange('pan')}
                  title="Pan Tool (H)"
                  style={iconButtonStyle(activeTool === 'pan')}
                >
                  <Hand size={14} />
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
                  <Group size={14} />
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
                  <Ungroup size={14} />
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

              {/* View Mode Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={viewMode}
                  onChange={(e) => onViewModeToggle(e.target.checked)}
                  style={{ ...checkboxStyle, margin: 0 }}
                />
                <span style={{ ...mutedTextStyle, margin: 0 }}>View</span>
              </div>

              {/* Zoom Level */}
              <div style={{ ...mutedTextStyle, minWidth: '40px', textAlign: 'center' }}>
                {(zoomLevel * 100).toFixed(0)}%
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={onExportJSON}
                  title="Export as JSON"
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
                  <FileText size={12} /> JSON
                </button>
                <button
                  onClick={onExportPNG}
                  title="Export as PNG"
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
                  <Image size={12} /> PNG
                </button>
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
                <Maximize2 size={12} /> Fit
              </button>

              {/* Collapse button - only show in normal mode */}
              <button
                onClick={toggleCollapse}
                title="Collapse Toolbar"
                style={{
                  ...iconButtonStyle(false),
                  padding: '4px',
                }}
              >
                <ChevronLeft size={12} />
              </button>
            </>
          )}

        </>
      )}
    </div>
  );
}

export default FloatingToolbar;
