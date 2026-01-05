import {
  floatingToolbarStyle,
  iconButtonStyle,
  checkboxStyle,
  buttonStyle,
  mutedTextStyle,
  verticalDividerStyle,
} from '../styles';

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
 */
function FloatingToolbar({ 
  activeTool, 
  onToolChange, 
  gridOn, 
  onGridToggle, 
  zoomLevel, 
  onFitView 
}) {
  return (
    <div style={floatingToolbarStyle}>
      {/* Tool Buttons */}
      <div style={{ display: 'flex', gap: '4px', ...verticalDividerStyle }}>
        <button
          onClick={() => onToolChange('select')}
          title="Select Tool (V)"
          style={iconButtonStyle(activeTool === 'select')}
        >
          ↖
        </button>
        <button
          onClick={() => onToolChange('pan')}
          title="Pan Tool (H)"
          style={iconButtonStyle(activeTool === 'pan')}
        >
          ✋
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
          margin: 0
        }}
      >
        📐 Fit
      </button>
    </div>
  );
}

export default FloatingToolbar;

