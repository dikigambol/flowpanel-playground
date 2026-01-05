import { controlGroupStyle, labelStyle, inputRowStyle, rangeStyle, buttonStyle, smallTextStyle, mutedTextStyle } from '../styles';

/**
 * ImageProperties - Properties component untuk image elements
 */
function ImageProperties({ properties, onPropertyChange, onResetSize }) {
  const handlePropertyChange = (key, value) => {
    onPropertyChange(key, value);
  };

  return (
    <>
      {/* Opacity */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Opacity</span>
        <div style={inputRowStyle}>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((properties.opacity || 1) * 100)}
            onChange={(e) => handlePropertyChange('opacity', Number(e.target.value) / 100)}
            style={rangeStyle}
          />
          <span style={smallTextStyle}>{Math.round((properties.opacity || 1) * 100)}%</span>
        </div>
      </div>

      {/* Flip Controls */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Flip</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => handlePropertyChange('flipX', !properties.flipX)}
            style={{
              ...buttonStyle(properties.flipX === true),
              minWidth: '80px',
              padding: '6px 10px',
            }}
            title="Flip Horizontal"
          >
            ↔ Horizontal
          </button>
          <button
            onClick={() => handlePropertyChange('flipY', !properties.flipY)}
            style={{
              ...buttonStyle(properties.flipY === true),
              minWidth: '80px',
              padding: '6px 10px',
            }}
            title="Flip Vertical"
          >
            ↕ Vertical
          </button>
        </div>
      </div>

      {/* Reset Size */}
      <div style={controlGroupStyle}>
        <span style={labelStyle}>Size</span>
        <button
          onClick={onResetSize}
          style={{
            ...buttonStyle(false),
            padding: '6px 10px',
          }}
          title="Reset to original size"
        >
          ↺ Reset Size
        </button>
        <span style={mutedTextStyle}>
          Scale: {Math.round((properties.scaleX || 1) * 100)}% x {Math.round((properties.scaleY || 1) * 100)}%
        </span>
      </div>

      {/* Hint */}
      <div style={controlGroupStyle}>
        <span style={mutedTextStyle}>
          💡 Drag corners to resize image
        </span>
      </div>
    </>
  );
}

export default ImageProperties;

