import { v4 as uuidv4 } from 'uuid';

/**
 * BaseElement - Abstract base class untuk semua elemen canvas
 * 
 * Setiap elemen harus implement:
 * - create(): Membuat Fabric.js object(s)
 * - update(properties): Update properties elemen
 * - destroy(): Cleanup dan remove dari canvas
 * - getProperties(): Return current properties
 * - setEditMode(enabled): Toggle edit mode
 */
export class BaseElement {
  constructor(canvas, options = {}) {
    if (new.target === BaseElement) {
      throw new Error('BaseElement is abstract and cannot be instantiated directly');
    }
    
    this.id = options.id || uuidv4();
    this.type = 'base';
    this.canvas = canvas;
    this.fabricObjects = []; // Array of Fabric objects belonging to this element
    this.isEditMode = false;
    this.isSelected = false;
    
    // Event callbacks
    this.onSelect = options.onSelect || null;
    this.onDeselect = options.onDeselect || null;
    this.onUpdate = options.onUpdate || null;
    this.onDelete = options.onDelete || null;
  }

  /**
   * Create Fabric.js objects for this element
   * Must be implemented by subclasses
   */
  create() {
    throw new Error('create() must be implemented by subclass');
  }

  /**
   * Update element properties
   * @param {Object} properties - New properties to apply
   */
  update(properties) {
    throw new Error('update() must be implemented by subclass');
  }

  /**
   * Get current element properties
   * @returns {Object} Current properties
   */
  getProperties() {
    throw new Error('getProperties() must be implemented by subclass');
  }

  /**
   * Toggle edit mode for this element
   * @param {boolean} enabled - Whether edit mode is enabled
   */
  setEditMode(enabled) {
    this.isEditMode = enabled;
  }

  /**
   * Select this element
   */
  select() {
    this.isSelected = true;
    if (this.onSelect) {
      this.onSelect(this);
    }
  }

  /**
   * Deselect this element
   */
  deselect() {
    this.isSelected = false;
    if (this.onDeselect) {
      this.onDeselect(this);
    }
  }

  /**
   * Remove all Fabric objects from canvas and cleanup
   */
  destroy() {
    this.fabricObjects.forEach(obj => {
      if (obj) {
        obj.off(); // Remove all event listeners
        this.canvas.remove(obj);
      }
    });
    this.fabricObjects = [];
    
    if (this.onDelete) {
      this.onDelete(this);
    }
  }

  /**
   * Bring element to front
   */
  bringToFront() {
    this.fabricObjects.forEach(obj => {
      this.canvas.bringObjectToFront(obj);
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Send element to back
   */
  sendToBack() {
    this.fabricObjects.forEach(obj => {
      this.canvas.sendObjectToBack(obj);
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Get serializable data for save/load
   * @returns {Object} Serializable element data
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      properties: this.getProperties(),
    };
  }

  /**
   * Notify that element has been updated
   */
  notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate(this);
    }
  }
}

export default BaseElement;

