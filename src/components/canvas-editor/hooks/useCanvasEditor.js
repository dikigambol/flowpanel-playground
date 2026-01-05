import { useState, useRef, useCallback } from 'react';
import { createPolygonElement } from '../elements';

/**
 * useCanvasEditor - Custom hook untuk state management canvas editor
 * 
 * Mengelola:
 * - Array elemen (polygon, text, dll)
 * - Selected element
 * - Canvas instance
 * - Add/update/delete elemen
 */
export function useCanvasEditor() {
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const canvasRef = useRef(null);
  const elementsMapRef = useRef(new Map()); // Map id -> element instance

  /**
   * Set canvas instance
   */
  const setCanvas = useCallback((canvas) => {
    canvasRef.current = canvas;
  }, []);

  /**
   * Get canvas instance
   */
  const getCanvas = useCallback(() => {
    return canvasRef.current;
  }, []);

  /**
   * Add new element to canvas
   * @param {string} type - Element type ('polygon', 'text', etc)
   * @param {Object} options - Element options
   * @returns {Object} Created element instance
   */
  const addElement = useCallback((type, options = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not initialized');
      return null;
    }

    let element = null;

    // Calculate center position for new element
    const canvasCenter = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };

    // Offset for each new element to avoid stacking
    const offset = elementsMapRef.current.size * 30;

    switch (type) {
      case 'polygon':
        // Default polygon points centered on canvas
        const defaultPoints = [
          { x: canvasCenter.x - 100 + offset, y: canvasCenter.y - 100 + offset },
          { x: canvasCenter.x + 100 + offset, y: canvasCenter.y - 100 + offset },
          { x: canvasCenter.x + 100 + offset, y: canvasCenter.y + 100 + offset },
          { x: canvasCenter.x - 100 + offset, y: canvasCenter.y + 100 + offset },
        ];

        element = createPolygonElement(canvas, {
          points: options.points || defaultPoints,
          fillColor: options.fillColor || getRandomColor(),
          strokeColor: options.strokeColor || '#1e40af',
          hasBorder: options.hasBorder !== undefined ? options.hasBorder : true,
          strokeWidth: options.strokeWidth || 3,
          onSelect: (el) => {
            setSelectedElementId(el.id);
          },
          onUpdate: (el) => {
            // Trigger re-render when element updates
            setElements(prev => [...prev]);
          },
          onDelete: (el) => {
            removeElementFromState(el.id);
          },
        });
        break;

      // Future: case 'text': ...
      // Future: case 'image': ...

      default:
        console.error(`Unknown element type: ${type}`);
        return null;
    }

    if (element) {
      // Store in map
      elementsMapRef.current.set(element.id, element);

      // Update state
      setElements(prev => [...prev, {
        id: element.id,
        type: element.type,
      }]);

      // Select new element
      setSelectedElementId(element.id);
      element.selectPolygon();

      return element;
    }

    return null;
  }, []);

  /**
   * Remove element from state (internal)
   */
  const removeElementFromState = useCallback((id) => {
    elementsMapRef.current.delete(id);
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  /**
   * Delete element by id
   * @param {string} id - Element id to delete
   */
  const deleteElement = useCallback((id) => {
    const element = elementsMapRef.current.get(id);
    if (element) {
      element.destroy();
      // removeElementFromState will be called by onDelete callback
    }
  }, []);

  /**
   * Delete selected element
   */
  const deleteSelectedElement = useCallback(() => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
    }
  }, [selectedElementId, deleteElement]);

  /**
   * Get element by id
   * @param {string} id - Element id
   * @returns {Object|null} Element instance or null
   */
  const getElementById = useCallback((id) => {
    return elementsMapRef.current.get(id) || null;
  }, []);

  /**
   * Get selected element
   * @returns {Object|null} Selected element instance or null
   */
  const getSelectedElement = useCallback(() => {
    if (!selectedElementId) return null;
    return elementsMapRef.current.get(selectedElementId) || null;
  }, [selectedElementId]);

  /**
   * Select element by id
   * @param {string} id - Element id to select (null to deselect)
   */
  const selectElement = useCallback((id) => {
    // Deselect previous
    if (selectedElementId && selectedElementId !== id) {
      const prevElement = elementsMapRef.current.get(selectedElementId);
      if (prevElement) {
        prevElement.deselect();
        if (prevElement.isEditMode) {
          prevElement.setEditMode(false);
        }
      }
    }

    setSelectedElementId(id);

    // Select new
    if (id) {
      const element = elementsMapRef.current.get(id);
      if (element) {
        element.select();
      }
    }
  }, [selectedElementId]);

  /**
   * Update element properties
   * @param {string} id - Element id
   * @param {Object} properties - Properties to update
   */
  const updateElement = useCallback((id, properties) => {
    const element = elementsMapRef.current.get(id);
    if (element) {
      element.update(properties);
    }
  }, []);

  /**
   * Update selected element properties
   * @param {Object} properties - Properties to update
   */
  const updateSelectedElement = useCallback((properties) => {
    if (selectedElementId) {
      updateElement(selectedElementId, properties);
    }
  }, [selectedElementId, updateElement]);

  /**
   * Toggle edit mode for selected element
   * @param {boolean} enabled - Whether edit mode is enabled
   */
  const setSelectedElementEditMode = useCallback((enabled) => {
    const element = getSelectedElement();
    if (element && typeof element.setEditMode === 'function') {
      element.setEditMode(enabled);
    }
  }, [getSelectedElement]);

  /**
   * Clear all elements
   */
  const clearAllElements = useCallback(() => {
    elementsMapRef.current.forEach(element => {
      element.destroy();
    });
    elementsMapRef.current.clear();
    setElements([]);
    setSelectedElementId(null);
  }, []);

  /**
   * Get all elements data for serialization
   * @returns {Array} Array of element data
   */
  const toJSON = useCallback(() => {
    return Array.from(elementsMapRef.current.values()).map(el => el.toJSON());
  }, []);

  /**
   * Load elements from JSON data
   * @param {Array} data - Array of element data
   */
  const loadFromJSON = useCallback((data) => {
    clearAllElements();
    
    data.forEach(item => {
      addElement(item.type, {
        id: item.id,
        ...item.properties,
      });
    });
  }, [clearAllElements, addElement]);

  return {
    // State
    elements,
    selectedElementId,
    
    // Canvas
    setCanvas,
    getCanvas,
    
    // Element operations
    addElement,
    deleteElement,
    deleteSelectedElement,
    getElementById,
    getSelectedElement,
    selectElement,
    updateElement,
    updateSelectedElement,
    setSelectedElementEditMode,
    clearAllElements,
    
    // Serialization
    toJSON,
    loadFromJSON,
  };
}

/**
 * Generate random color for new elements
 */
function getRandomColor() {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default useCanvasEditor;

