import { sidebarStyle, sidebarButtonStyle } from '../styles';

/**
 * Sidebar - Menu komponen untuk menambah elemen ke canvas
 * 
 * @param {Object} props
 * @param {Function} props.onAddElement - Callback saat add element (type) => void
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.onToggleCollapse - Toggle collapse callback
 */
function Sidebar({ onAddElement, collapsed = true, onToggleCollapse }) {
  if (collapsed) {
    return (
      <div style={{
        ...sidebarStyle,
        width: '33px',
        padding: '4px',
      }}>
        <button
          onClick={onToggleCollapse}
          style={sidebarButtonStyle(false)}
          title="Expand Sidebar"
        >
          ☰
        </button>
      </div>
    );
  }

  return (
    <div style={sidebarStyle}>
      {/* Collapse button */}
      <button
        onClick={onToggleCollapse}
        style={sidebarButtonStyle(false)}
        title="Collapse Sidebar"
      >
        ✕
      </button>

      {/* Divider */}
      <div style={{ 
        borderBottom: '1px solid #2a2a4a', 
        margin: '4px 0' 
      }} />

      {/* Add Polygon */}
      <button
        onClick={() => onAddElement('polygon')}
        style={sidebarButtonStyle(false)}
        title="Add Polyline/Polygon Shape"
      >
        ⬡
      </button>

      {/* Future: Add Text */}
      <button
        onClick={() => onAddElement('text')}
        style={{
          ...sidebarButtonStyle(false),
          opacity: 0.5,
          cursor: 'not-allowed',
        }}
        title="Add Text (Coming Soon)"
        disabled
      >
        T
      </button>

      {/* Future: Add Image */}
      <button
        onClick={() => onAddElement('image')}
        style={{
          ...sidebarButtonStyle(false),
          opacity: 0.5,
          cursor: 'not-allowed',
        }}
        title="Add Image (Coming Soon)"
        disabled
      >
        🖼
      </button>
    </div>
  );
}

export default Sidebar;

