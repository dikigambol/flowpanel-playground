import { controlGroupStyle, labelStyle, inputRowStyle, colorInputStyle, rangeStyle, buttonStyle, smallTextStyle, mutedTextStyle } from '../styles';

/**
 * TextProperties - Properties component untuk text elements
 */
function TextProperties({ properties, onPropertyChange, onToggleFontStyle }) {
  const handlePropertyChange = (key, value) => {
    onPropertyChange(key, value);
  };

  return (
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
            onClick={() => onToggleFontStyle('bold')}
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
            onClick={() => onToggleFontStyle('italic')}
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
            onClick={() => onToggleFontStyle('underline')}
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
}

export default TextProperties;