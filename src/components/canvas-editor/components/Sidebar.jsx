import { useRef } from 'react';
import { sidebarStyle, sidebarButtonStyle } from '../styles';

/**
 * Sidebar - Menu komponen untuk menambah elemen ke canvas
 * 
 * @param {Object} props
 * @param {Function} props.onAddElement - Callback saat add element (type, options) => void
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.onToggleCollapse - Toggle collapse callback
 */
function Sidebar({ onAddElement, collapsed = true, onToggleCollapse }) {
  const fileInputRef = useRef(null);

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create object URL for the image
      const url = URL.createObjectURL(file);
      onAddElement('image', { src: url });

      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  // Trigger file picker
  const handleAddImage = () => {
    fileInputRef.current?.click();
  };
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

      {/* Add Text */}
      <button
        onClick={() => onAddElement('text')}
        style={sidebarButtonStyle(false)}
        title="Add Text"
      >
        T
      </button>

      {/* Add Image */}
      <button
        onClick={handleAddImage}
        style={sidebarButtonStyle(false)}
        title="Add Image"
      >
        🖼
      </button>

      {/* Add Symbol */}
      <button
        onClick={() => onAddElement('symbol')}
        style={sidebarButtonStyle(false)}
        title="Add Machine Symbol (Ongoing)"
      >
        ⚡
      </button>

      {/* Hidden file input for image selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default Sidebar;

