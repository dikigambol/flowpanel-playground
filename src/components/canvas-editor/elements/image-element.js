import { FabricImage } from 'fabric';
import { BaseElement } from './base-element.js';

/**
 * ImageElement - Image element untuk canvas editor
 * 
 * Features:
 * - Load image from URL or file
 * - Opacity control
 * - Maintain aspect ratio option
 * - Flip horizontal/vertical
 */
export class ImageElement extends BaseElement {
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    this.type = 'image';
    
    // Image-specific properties
    this.properties = {
      src: options.src || '',
      opacity: options.opacity !== undefined ? options.opacity : 1,
      flipX: options.flipX || false,
      flipY: options.flipY || false,
      left: options.left || 200,
      top: options.top || 200,
      scaleX: options.scaleX || 1,
      scaleY: options.scaleY || 1,
    };

    // Internal refs
    this.imageObject = null;
    this._imageLoaded = false;
  }

  /**
   * Create the image object on canvas
   */
  async create() {
    if (this.properties.src) {
      await this._createImage();
    }
    return this;
  }

  /**
   * Update image properties
   * @param {Object} newProperties - Properties to update
   */
  update(newProperties) {
    // Check if src changed - need to reload image
    const srcChanged = newProperties.src && newProperties.src !== this.properties.src;
    
    // Merge new properties
    Object.assign(this.properties, newProperties);
    
    if (srcChanged) {
      // Reload image with new src
      this._createImage();
    } else {
      // Just update style
      this._updateImageStyle();
    }
    
    this.notifyUpdate();
  }

  /**
   * Get current properties
   * @returns {Object} Current image properties
   */
  getProperties() {
    // Sync position and scale from fabric object if exists
    if (this.imageObject) {
      this.properties.left = this.imageObject.left;
      this.properties.top = this.imageObject.top;
      this.properties.scaleX = this.imageObject.scaleX;
      this.properties.scaleY = this.imageObject.scaleY;
      this.properties.flipX = this.imageObject.flipX;
      this.properties.flipY = this.imageObject.flipY;
    }
    return { ...this.properties };
  }

  /**
   * Select the image object
   */
  selectImage() {
    if (this.imageObject) {
      this.canvas.setActiveObject(this.imageObject);
      this.canvas.requestRenderAll();
    }
    this.select();
  }

  /**
   * Check if image is loaded
   * @returns {boolean} Whether image is loaded
   */
  isLoaded() {
    return this._imageLoaded;
  }

  /**
   * Get image dimensions
   * @returns {Object} {width, height} or null if not loaded
   */
  getDimensions() {
    if (!this.imageObject) return null;
    return {
      width: this.imageObject.width * this.imageObject.scaleX,
      height: this.imageObject.height * this.imageObject.scaleY,
    };
  }

  /**
   * Reset image to original size
   */
  resetSize() {
    if (this.imageObject) {
      this.imageObject.set({
        scaleX: 1,
        scaleY: 1,
      });
      this.properties.scaleX = 1;
      this.properties.scaleY = 1;
      this.canvas.requestRenderAll();
      this.notifyUpdate();
    }
  }

  /**
   * Destroy element and cleanup
   */
  destroy() {
    if (this.imageObject) {
      this.imageObject.off();
      this.canvas.remove(this.imageObject);
      this.imageObject = null;
    }
    
    super.destroy();
  }

  // ==================== Private Methods ====================

  /**
   * Create image Fabric object
   */
  async _createImage() {
    const { src, opacity, flipX, flipY, left, top, scaleX, scaleY } = this.properties;

    if (!src) return;

    // Remove old image if exists
    if (this.imageObject) {
      this.imageObject.off();
      this.canvas.remove(this.imageObject);
      this.imageObject = null;
    }

    try {
      // Load image
      const img = await FabricImage.fromURL(src, {
        crossOrigin: 'anonymous',
      });

      img.set({
        left,
        top,
        opacity,
        flipX,
        flipY,
        scaleX,
        scaleY,
        
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
        
        hoverCursor: 'move',
      });

      // Store reference to this element on the Fabric object
      img._imageElement = this;

      // Handle movement
      img.on('moving', () => {
        this.properties.left = img.left;
        this.properties.top = img.top;
      });

      img.on('scaling', () => {
        this.properties.scaleX = img.scaleX;
        this.properties.scaleY = img.scaleY;
      });

      img.on('modified', () => {
        this.properties.left = img.left;
        this.properties.top = img.top;
        this.properties.scaleX = img.scaleX;
        this.properties.scaleY = img.scaleY;
        this.notifyUpdate();
      });

      this.imageObject = img;
      this.fabricObjects = [img];
      this._imageLoaded = true;
      this.canvas.add(img);
      this.canvas.requestRenderAll();

    } catch (error) {
      console.error('Failed to load image:', error);
      this._imageLoaded = false;
    }
  }

  /**
   * Update image style without recreating
   */
  _updateImageStyle() {
    if (!this.imageObject) return;

    const { opacity, flipX, flipY } = this.properties;

    this.imageObject.set({
      opacity,
      flipX,
      flipY,
    });
    
    this.canvas.requestRenderAll();
  }
}

/**
 * Factory function untuk membuat ImageElement
 * @param {Canvas} canvas - Fabric.js canvas instance
 * @param {Object} options - Element options
 * @returns {Promise<ImageElement>} New image element instance
 */
export async function createImageElement(canvas, options = {}) {
  const element = new ImageElement(canvas, options);
  await element.create();
  return element;
}

export default ImageElement;

