import { useRef } from 'react';
import { sidebarStyle, sidebarButtonStyle } from '../styles';
import { Menu, X, Square, Minus, Type, Image, Zap } from 'lucide-react';

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

  return (
    <div style={{
      ...sidebarStyle,
      width: '33px',
      padding: '4px',
    }}>
      <button
        onClick={onToggleCollapse}
        style={sidebarButtonStyle(false)}
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {!collapsed && (
        <>
          {/* Divider */}
          <div style={{
            borderBottom: '1px solid #2a2a4a',
            margin: '4px 0'
          }} />

          {/* Add Polygon */}
          <button
            onClick={() => onAddElement('polygon')}
            style={sidebarButtonStyle(false)}
            title="Add Shape"
          >
            <Square size={20} />
          </button>

          {/* Add Line */}
          <button
            onClick={() => onAddElement('bezierLine')}
            style={sidebarButtonStyle(false)}
            title="Add Line"
          >
            <Minus size={20} />
          </button>

          {/* Add Text */}
          <button
            onClick={() => onAddElement('text')}
            style={sidebarButtonStyle(false)}
            title="Add Text"
          >
            <Type size={20} />
          </button>

          {/* Add Image */}
          <button
            onClick={handleAddImage}
            style={sidebarButtonStyle(false)}
            title="Add Image"
          >
            <Image size={20} />
          </button>

          {/* Add Symbol */}
          <button
            onClick={() => onAddElement('symbol')}
            style={sidebarButtonStyle(false)}
            title="Add Machine Symbol (Ongoing)"
          >
            <Zap size={20} />
          </button>

          {/* Hidden file input for image selection */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
}

export default Sidebar;
