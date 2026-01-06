import { useState, useRef, useCallback } from 'react';
import { Group, util } from 'fabric';
import { createPolygonElement, createTextElement, createImageElement, createBezierLineElement } from '../elements';

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
  const [selectedElementIds, setSelectedElementIds] = useState([]); // Multiple selection
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

      case 'text':
        element = createTextElement(canvas, {
          text: options.text || 'Double click to edit',
          left: canvasCenter.x - 100 + offset,
          top: canvasCenter.y + offset,
          fontSize: options.fontSize || 24,
          fontColor: options.fontColor || '#ffffff',
          fontFamily: options.fontFamily || 'Arial',
          fontWeight: options.fontWeight || 'normal',
          fontStyle: options.fontStyle || 'normal',
          underline: options.underline || false,
          textAlign: options.textAlign || 'left',
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

      case 'symbol':
        // Placeholder for symbol element (ongoing)
        console.log('Machine Symbol element is still under development');
        // For now, create a simple text element as placeholder
        element = createTextElement(canvas, {
          text: '⚡ Machine Symbol (Ongoing)',
          left: canvasCenter.x - 50 + offset,
          top: canvasCenter.y + offset,
          fontSize: 20,
          fontColor: '#fbbf24',
          fontFamily: 'Arial',
          onSelect: (el) => {
            setSelectedElementId(el.id);
          },
          onUpdate: (el) => {
            setElements(prev => [...prev]);
          },
          onDelete: (el) => {
            removeElementFromState(el.id);
          },
        });
        break;

      case 'image':
        // Image is async, handle separately
        return addImageElement(canvas, canvasCenter, offset, options);

      case 'bezierLine':
        element = createBezierLineElement(canvas, {
          strokeColor: options.strokeColor || '#22c55e',
          strokeWidth: options.strokeWidth || 3,
          centerX: canvasCenter.x,
          centerY: canvasCenter.y,
          offset: offset,
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
      
      // Call appropriate select method based on type
      if (element.type === 'polygon') {
        element.selectPolygon();
      } else if (element.type === 'text' || element.type === 'symbol') {
        element.selectText();
      } else if (element.type === 'image') {
        element.selectImage();
      } else if (element.type === 'bezierLine') {
        // Select bezier line (not in drawing mode)
        element.selectBezierLine();
      }

      return element;
    }

    return null;
  }, []);

  /**
   * Add image element (async)
   * @param {Canvas} canvas - Fabric canvas
   * @param {Object} canvasCenter - Center position
   * @param {number} offset - Offset for stacking
   * @param {Object} options - Element options
   */
  const addImageElement = useCallback(async (canvas, canvasCenter, offset, options) => {
    if (!options.src) {
      console.error('Image src is required');
      return null;
    }

    try {
      const element = await createImageElement(canvas, {
        src: options.src,
        left: options.left || canvasCenter.x - 100 + offset,
        top: options.top || canvasCenter.y - 100 + offset,
        opacity: options.opacity !== undefined ? options.opacity : 1,
        flipX: options.flipX || false,
        flipY: options.flipY || false,
        scaleX: options.scaleX || 1,
        scaleY: options.scaleY || 1,
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
        element.selectImage();

        return element;
      }
    } catch (error) {
      console.error('Failed to add image element:', error);
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
   * Delete selected element(s)
   */
  const deleteSelectedElement = useCallback(() => {
    // Delete all selected elements if multiple selection
    if (selectedElementIds.length > 1) {
      selectedElementIds.forEach(id => {
        deleteElement(id);
      });
      setSelectedElementIds([]);
      setSelectedElementId(null);
    } else if (selectedElementId) {
      deleteElement(selectedElementId);
      setSelectedElementId(null);
      setSelectedElementIds([]);
    }
  }, [selectedElementId, selectedElementIds, deleteElement]);

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
   * @param {boolean} multiSelect - Whether to add to selection (for ctrl+click)
   */
  const selectElement = useCallback((id, multiSelect = false) => {
    if (multiSelect && id) {
      // Multi-select: add/remove from selection
      setSelectedElementIds(prev => {
        if (prev.includes(id)) {
          // Deselect if already selected
          const element = elementsMapRef.current.get(id);
          if (element) {
            element.deselect();
          }
          const newIds = prev.filter(selectedId => selectedId !== id);
          if (newIds.length === 1) {
            setSelectedElementId(newIds[0]);
          } else {
            setSelectedElementId(null);
          }
          return newIds;
        } else {
          // Add to selection
          const element = elementsMapRef.current.get(id);
          if (element) {
            element.select();
          }
          const newIds = [...prev, id];
          if (newIds.length === 1) {
            setSelectedElementId(id);
          } else {
            setSelectedElementId(null);
          }
          return newIds;
        }
      });
    } else {
      // Single select: deselect all previous
      selectedElementIds.forEach(prevId => {
        const prevElement = elementsMapRef.current.get(prevId);
        if (prevElement) {
          prevElement.deselect();
          if (prevElement.isEditMode) {
            prevElement.setEditMode(false);
          }
        }
      });

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
      setSelectedElementIds(id ? [id] : []);

      // Select new
      if (id) {
        const element = elementsMapRef.current.get(id);
        if (element) {
          element.select();
        }
      }
    }
  }, [selectedElementId, selectedElementIds]);

  /**
   * Set multiple selected elements
   * @param {Array<string>} ids - Array of element ids
   */
  const setSelectedElements = useCallback((ids) => {
    // Deselect all previous
    selectedElementIds.forEach(prevId => {
      const prevElement = elementsMapRef.current.get(prevId);
      if (prevElement) {
        prevElement.deselect();
        if (prevElement.isEditMode) {
          prevElement.setEditMode(false);
        }
      }
    });

    if (selectedElementId) {
      const prevElement = elementsMapRef.current.get(selectedElementId);
      if (prevElement) {
        prevElement.deselect();
        if (prevElement.isEditMode) {
          prevElement.setEditMode(false);
        }
      }
    }

    // Select new
    ids.forEach(id => {
      const element = elementsMapRef.current.get(id);
      if (element) {
        element.select();
      }
    });

    setSelectedElementIds(ids);
    setSelectedElementId(ids.length === 1 ? ids[0] : null);
  }, [selectedElementId, selectedElementIds]);

  /**
   * Update element properties
   * @param {string} id - Element id
   * @param {Object} properties - Properties to update
   */
  const updateElement = useCallback((id, properties) => {
    const element = elementsMapRef.current.get(id);
    if (element) {
      element.update(properties);
      // Trigger re-render
      setElements([...elements]);
    }
  }, [elements]);

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
    setSelectedElementIds([]);
  }, []);

  /**
   * Group selected elements
   */
  const groupSelectedElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 2) {
      console.log('Need at least 2 objects to group');
      return;
    }

    // Discard current selection
    canvas.discardActiveObject();

    // Create group from selected objects
    const group = new Group(activeObjects, {
      canvas: canvas,
    });

    // Remove individual objects from canvas
    activeObjects.forEach(obj => {
      canvas.remove(obj);
    });

    // Add group to canvas
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();

    // Clear selection state
    setSelectedElementIds([]);
    setSelectedElementId(null);
  }, []);

  /**
   * Ungroup selected group
   */
  const ungroupSelectedElement = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      console.log('No active object for ungroup');
      return;
    }
    
    if (activeObject.type !== 'group') {
      console.log('Active object is not a group, type is:', activeObject.type);
      return;
    }

    // Get items from group
    const items = activeObject.getObjects();
    
    // Get group's transform matrix
    const groupMatrix = activeObject.calcTransformMatrix();
    
    // Remove group from canvas
    canvas.remove(activeObject);

    // Add items back with correct transforms
    items.forEach(item => {
      // Get the item's transform relative to group
      const itemMatrix = item.calcTransformMatrix();
      
      // Multiply to get absolute transform
      const fullMatrix = util.multiplyTransformMatrices(groupMatrix, itemMatrix);
      
      // Decompose matrix to get position, scale, rotation
      const options = util.qrDecompose(fullMatrix);
      
      item.set({
        left: options.translateX,
        top: options.translateY,
        scaleX: options.scaleX,
        scaleY: options.scaleY,
        angle: options.angle,
        flipX: false,
        flipY: false,
      });
      
      item.setCoords();
      canvas.add(item);
    });

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    setSelectedElementIds([]);
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
    selectedElementIds,
    
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
    setSelectedElements,
    updateElement,
    updateSelectedElement,
    setSelectedElementEditMode,
    clearAllElements,
    
    // Group operations
    groupSelectedElements,
    ungroupSelectedElement,
    
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

