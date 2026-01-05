import { IText } from 'fabric';
import { BaseElement } from './base-element.js';

/**
 * TextElement - Text element untuk canvas editor
 * 
 * Features:
 * - Editable text content
 * - Font size control
 * - Font color
 * - Font style (bold, italic, underline)
 * - Font family
 */
export class TextElement extends BaseElement {
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    this.type = 'text';
    
    // Text-specific properties
    this.properties = {
      text: options.text || 'Double click to edit',
      fontSize: options.fontSize || 24,
      fontColor: options.fontColor || '#ffffff',
      fontFamily: options.fontFamily || 'Arial',
      fontWeight: options.fontWeight || 'normal', // 'normal' | 'bold'
      fontStyle: options.fontStyle || 'normal', // 'normal' | 'italic'
      underline: options.underline || false,
      textAlign: options.textAlign || 'left', // 'left' | 'center' | 'right'
      left: options.left || 200,
      top: options.top || 200,
    };

    // Internal refs
    this.textObject = null;
  }

  /**
   * Create the text object on canvas
   */
  create() {
    this._createText();
    return this;
  }

  /**
   * Update text properties
   * @param {Object} newProperties - Properties to update
   */
  update(newProperties) {
    // Merge new properties
    Object.assign(this.properties, newProperties);
    
    // Update text object
    this._updateTextStyle();
    
    this.notifyUpdate();
  }

  /**
   * Get current properties
   * @returns {Object} Current text properties
   */
  getProperties() {
    // Sync position from fabric object if exists
    if (this.textObject) {
      this.properties.left = this.textObject.left;
      this.properties.top = this.textObject.top;
      this.properties.text = this.textObject.text;
    }
    return { ...this.properties };
  }

  /**
   * Toggle edit mode (for text, this enters text editing)
   * @param {boolean} enabled - Whether edit mode is enabled
   */
  setEditMode(enabled) {
    super.setEditMode(enabled);
    
    if (this.textObject) {
      if (enabled) {
        // Enter text editing mode
        this.canvas.setActiveObject(this.textObject);
        this.textObject.enterEditing();
        this.textObject.selectAll();
      } else {
        // Exit text editing mode
        this.textObject.exitEditing();
      }
      this.canvas.requestRenderAll();
    }
  }

  /**
   * Select the text object
   */
  selectText() {
    if (this.textObject && !this.isEditMode) {
      this.canvas.setActiveObject(this.textObject);
      this.canvas.requestRenderAll();
    }
    this.select();
  }

  /**
   * Get text content
   * @returns {string} Current text content
   */
  getText() {
    return this.textObject?.text || this.properties.text;
  }

  /**
   * Set text content
   * @param {string} text - New text content
   */
  setText(text) {
    this.properties.text = text;
    if (this.textObject) {
      this.textObject.set('text', text);
      this.canvas.requestRenderAll();
    }
    this.notifyUpdate();
  }

  /**
   * Check if text is currently being edited
   * @returns {boolean} Whether text is in editing mode
   */
  isEditing() {
    return this.textObject?.isEditing || false;
  }

  /**
   * Destroy element and cleanup
   */
  destroy() {
    if (this.textObject) {
      this.textObject.exitEditing?.();
      this.textObject.off();
      this.canvas.remove(this.textObject);
      this.textObject = null;
    }
    
    super.destroy();
  }

  // ==================== Private Methods ====================

  /**
   * Create text Fabric object
   */
  _createText() {
    const { text, fontSize, fontColor, fontFamily, fontWeight, fontStyle, underline, textAlign, left, top } = this.properties;

    const textObj = new IText(text, {
      left,
      top,
      fontSize,
      fill: fontColor,
      fontFamily,
      fontWeight,
      fontStyle,
      underline,
      textAlign,
      
      // Selection styling
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#ffffff',
      cornerSize: 10,
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      
      // Editing styling
      editingBorderColor: '#22c55e',
      cursorColor: '#22c55e',
      cursorWidth: 2,
      
      hoverCursor: 'move',
    });

    // Store reference to this element on the Fabric object
    textObj._textElement = this;

    // Handle text change events
    textObj.on('changed', () => {
      this.properties.text = textObj.text;
      this.notifyUpdate();
    });

    // Handle editing events
    textObj.on('editing:entered', () => {
      this.isEditMode = true;
    });

    textObj.on('editing:exited', () => {
      this.isEditMode = false;
      this.properties.text = textObj.text;
      this.notifyUpdate();
    });

    // Handle movement
    textObj.on('moving', () => {
      this.properties.left = textObj.left;
      this.properties.top = textObj.top;
    });

    textObj.on('modified', () => {
      this.properties.left = textObj.left;
      this.properties.top = textObj.top;
      this.notifyUpdate();
    });

    this.textObject = textObj;
    this.fabricObjects = [textObj];
    this.canvas.add(textObj);
    this.canvas.requestRenderAll();
  }

  /**
   * Update text style without recreating
   */
  _updateTextStyle() {
    if (!this.textObject) return;

    const { text, fontSize, fontColor, fontFamily, fontWeight, fontStyle, underline, textAlign } = this.properties;

    this.textObject.set({
      text,
      fontSize,
      fill: fontColor,
      fontFamily,
      fontWeight,
      fontStyle,
      underline,
      textAlign,
    });
    
    this.canvas.requestRenderAll();
  }
}

/**
 * Factory function untuk membuat TextElement
 * @param {Canvas} canvas - Fabric.js canvas instance
 * @param {Object} options - Element options
 * @returns {TextElement} New text element instance
 */
export function createTextElement(canvas, options = {}) {
  const element = new TextElement(canvas, options);
  element.create();
  return element;
}

export default TextElement;

