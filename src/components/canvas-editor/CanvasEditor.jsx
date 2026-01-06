import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from 'fabric';
import { useCanvasEditor } from './hooks';
import { Sidebar, PropertiesPanel, FloatingToolbar } from './components';
import { canvasWrapperStyle, canvasStyle } from './styles';

/**
 * CanvasEditor - Main canvas editor component
 * 
 * Features:
 * - Multiple elements support
 * - Add/edit/delete elements
 * - Pan and zoom
 * - Grid overlay
 * - Selection handling
 */
function CanvasEditor() {
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  
  // Canvas editor hook for state management
  const {
    elements,
    selectedElementId,
    selectedElementIds,
    setCanvas,
    getCanvas,
    addElement,
    deleteElement,
    deleteSelectedElement,
    getSelectedElement,
    selectElement,
    setSelectedElements,
    updateSelectedElement,
    groupSelectedElements,
    ungroupSelectedElement,
  } = useCanvasEditor();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Canvas controls
  const [gridOn, setGridOn] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTool, setActiveTool] = useState('select');

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const gridOnRef = useRef(gridOn);
  gridOnRef.current = gridOn;

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const baseGridSpacing = 50;

  // Get selected element
  const selectedElement = getSelectedElement();

  // Helper function to get element ID from fabric object
  const getElementIdFromObject = (obj) => {
    if (obj._polygonElement) return obj._polygonElement.id;
    if (obj._textElement) return obj._textElement.id;
    if (obj._imageElement) return obj._imageElement.id;
    if (obj._bezierLineElement) return obj._bezierLineElement.id;
    return null;
  };

  // Draw grid
  const drawGrid = useCallback(() => {
    const gridCanvas = gridCanvasRef.current;
    const fabricCanvas = getCanvas();
    if (!gridCanvas || !fabricCanvas) return;

    const ctx = gridCanvas.getContext('2d');
    const width = gridCanvas.width;
    const height = gridCanvas.height;

    // Always clear the grid canvas first
    ctx.clearRect(0, 0, width, height);

    // Use ref to get latest gridOn value (for event handlers that capture old closure)
    if (!gridOnRef.current) return; // If grid is off, stop here after clearing

    // Draw background only if grid is on
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const zoom = fabricCanvas.getZoom();
    const vpt = fabricCanvas.viewportTransform;

    const startX = -vpt[4] / zoom;
    const startY = -vpt[5] / zoom;
    const endX = startX + width / zoom;
    const endY = startY + height / zoom;

    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const firstVertX = Math.floor(startX / baseGridSpacing) * baseGridSpacing;
    for (let worldX = firstVertX; worldX <= endX; worldX += baseGridSpacing) {
      const screenX = (worldX - startX) * zoom;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }

    const firstHorizY = Math.floor(startY / baseGridSpacing) * baseGridSpacing;
    for (let worldY = firstHorizY; worldY <= endY; worldY += baseGridSpacing) {
      const screenY = (worldY - startY) * zoom;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }

    ctx.restore();
  }, [gridOn, getCanvas]);

  // Fit view to show all objects
  const fitView = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (objects.length === 0) return;

    // Calculate bounding box of all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach(obj => {
      const bounds = obj.getBoundingRect();
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.left + bounds.width);
      maxY = Math.max(maxY, bounds.top + bounds.height);
    });

    if (minX === Infinity) return;

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const zoomX = canvasWidth / width;
    const zoomY = canvasHeight / height;
    const zoom = Math.min(zoomX, zoomY) * 0.8;

    canvas.setZoom(Math.max(0.1, Math.min(3, zoom)));
    canvas.absolutePan({ x: centerX * zoom - canvasWidth / 2, y: centerY * zoom - canvasHeight / 2 });
    setZoomLevel(canvas.getZoom());
    drawGrid();
    canvas.requestRenderAll();
  }, [getCanvas, drawGrid]);

  // Redraw grid when gridOn or zoom changes
  useEffect(() => {
    drawGrid();
  }, [gridOn, zoomLevel, drawGrid]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tool switching
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
        return;
      }

      // Delete element(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = getCanvas();
        if (!canvas) return;
        
        const activeObjects = canvas.getActiveObjects();
        const element = getSelectedElement();
        
        // Check if we're in text edit mode (IText editing)
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.isEditing) {
          // Let text editing handle delete
          return;
        }
        
        // If multiple selected (via Fabric's active selection), delete all
        if (activeObjects.length > 1) {
          e.preventDefault();
          // Get element IDs from active objects
          const ids = activeObjects
            .map(obj => {
              if (obj._polygonElement) return obj._polygonElement.id;
              if (obj._textElement) return obj._textElement.id;
              if (obj._imageElement) return obj._imageElement.id;
              if (obj._bezierLineElement) return obj._bezierLineElement.id;
              return null;
            })
            .filter(Boolean);
          
          // Delete each element
          ids.forEach(id => {
            deleteElement(id);
          });
          
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          selectElement(null);
        } else if (selectedElementIds.length > 1) {
          e.preventDefault();
          // Delete all selected elements using the hook
          deleteSelectedElement();
        } else if (element && !element.isEditMode) {
          e.preventDefault();
          deleteSelectedElement();
        } else if (element?.isEditMode && element.deleteSelectedNode) {
          e.preventDefault();
          element.deleteSelectedNode();
        }
      }

      // Escape to deselect or exit edit mode
      if (e.key === 'Escape') {
        const element = getSelectedElement();
        // Cancel bezier line drawing if active
        if (element?.properties?.isDrawing) {
          element.cancelDrawing?.();
          return;
        }
        if (element?.isEditMode) {
          element.setEditMode(false);
          element.selectPolygon?.();
          element.selectBezierLine?.();
        } else {
          selectElement(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getSelectedElement, deleteSelectedElement, deleteElement, selectElement, selectedElementIds, getCanvas]);

  // Update cursor based on active tool
  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    if (activeTool === 'pan') {
      canvas.hoverCursor = 'grab';
      canvas.defaultCursor = 'grab';
    } else {
      canvas.hoverCursor = 'default';
      canvas.defaultCursor = 'default';
    }
  }, [activeTool, getCanvas]);

  // Initialize canvas
  useEffect(() => {
    if (getCanvas()) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: 'transparent',
      selection: true, // Enable selection for multiple selection support (Shift+click)
      preserveObjectStacking: true, // Preserve object stacking order
    });

    setCanvas(canvas);

    // Resize handler
    const resizeCanvas = () => {
      if (canvasContainerRef.current && canvas) {
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        canvas.setDimensions({ width: clientWidth, height: clientHeight });
        
        if (gridCanvasRef.current) {
          gridCanvasRef.current.width = clientWidth;
          gridCanvasRef.current.height = clientHeight;
          drawGrid();
        }
        
        canvas.requestRenderAll();
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    // Selection events - detect clicks on elements
    canvas.on('selection:created', (e) => {
      const activeObjects = canvas.getActiveObjects();
      const isMultiSelect = e.e?.ctrlKey || e.e?.metaKey;
      
      if (activeObjects.length === 1) {
        // Single selection
        const obj = activeObjects[0];
        const elementId = getElementIdFromObject(obj);
        if (elementId) {
          selectElement(elementId, isMultiSelect);
        }
      } else if (activeObjects.length > 1) {
        // Multiple selection - don't show properties panel
        const ids = activeObjects
          .map(obj => getElementIdFromObject(obj))
          .filter(Boolean);
        if (ids.length > 0) {
          setSelectedElements(ids);
        }
      }
    });

    canvas.on('selection:updated', (e) => {
      const activeObjects = canvas.getActiveObjects();
      const isMultiSelect = e.e?.ctrlKey || e.e?.metaKey;
      
      if (activeObjects.length === 1) {
        // Single selection
        const obj = activeObjects[0];
        const elementId = getElementIdFromObject(obj);
        if (elementId) {
          selectElement(elementId, isMultiSelect);
        }
      } else if (activeObjects.length > 1) {
        // Multiple selection - don't show properties panel
        const ids = activeObjects
          .map(obj => getElementIdFromObject(obj))
          .filter(Boolean);
        if (ids.length > 0) {
          setSelectedElements(ids);
        }
      }
    });

    canvas.on('selection:cleared', () => {
      // Deselect element when clicking on empty area
      const selectedEl = getSelectedElement();
      
      // If element is in edit mode, exit edit mode but keep it selected
      if (selectedEl?.isEditMode) {
        selectedEl.setEditMode(false);
        // Re-select the polygon after exiting edit mode
        setTimeout(() => {
          if (selectedEl.type === 'polygon') {
            selectedEl.selectPolygon();
          }
        }, 10);
        return;
      }
      
      selectElement(null);
    });

    // Double-click to add node in edit mode or finish bezier line drawing
    canvas.on('mouse:dblclick', (opt) => {
      // Check if bezier line is in drawing mode
      const allElements = Array.from(canvas.getObjects())
        .map(obj => obj._bezierLineElement || obj._polygonElement || obj._textElement || obj._imageElement)
        .filter(Boolean);
      
      const drawingBezierLine = allElements.find(el => el?.properties?.isDrawing);
      if (drawingBezierLine) {
        // Let bezier line handle the double-click
        return;
      }

      // Find if any element is in edit mode
      const selectedEl = getSelectedElement();
      if (!selectedEl?.isEditMode) return;

      // If clicked on edge handle (polygon), add node at that edge
      if (opt.target && opt.target._isEdgeHandle) {
        const edgeIndex = opt.target._edgeIndex;
        selectedEl.addNodeAtEdge?.(edgeIndex);
        return;
      }

      // If clicked on edge line (bezier/polyline), add node at that edge
      if (opt.target && opt.target._isEdgeLine) {
        const edgeIndex = opt.target._edgeIndex;
        selectedEl.addNodeAtEdge?.(edgeIndex);
        return;
      }

      // If clicked on empty area, add node at position
      if (!opt.target) {
        const pointer = canvas.getPointer(opt.e);
        selectedEl.addNodeAtPosition?.(pointer);
      }
    });

    // Pan functionality
    canvas.on('mouse:down', (opt) => {
      if (activeToolRef.current !== 'pan') {
        isDraggingRef.current = false;
        return;
      }
      if (opt.target) {
        isDraggingRef.current = false;
        return;
      }
      
      const evt = opt.e;
      isDraggingRef.current = true;
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      canvas.selection = false;
      canvas.defaultCursor = 'grabbing';
      canvas.hoverCursor = 'grabbing';
    });

    canvas.on('mouse:move', (opt) => {
      if (!isDraggingRef.current || activeToolRef.current !== 'pan') {
        return;
      }
      
      const evt = opt.e;
      const deltaX = evt.clientX - lastPosRef.current.x;
      const deltaY = evt.clientY - lastPosRef.current.y;
      canvas.relativePan({ x: deltaX, y: deltaY });
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      drawGrid();
      canvas.requestRenderAll();
      
      // Ensure cursor is grabbing during drag
      canvas.defaultCursor = 'grabbing';
      canvas.hoverCursor = 'grabbing';
    });

    canvas.on('mouse:up', () => {
      isDraggingRef.current = false;
      canvas.selection = true;
      if (activeToolRef.current === 'pan') {
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
      }
    });

    // Zoom functionality
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.max(0.1, Math.min(3, zoom));
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      setZoomLevel(zoom);
      drawGrid();
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return () => {
      canvas.dispose();
      setCanvas(null);
      resizeObserver.disconnect();
    };
  }, []);

  // Handle add element
  const handleAddElement = (type, options = {}) => {
    addElement(type, options);
  };

  // Handle update element properties
  const handleUpdateProperties = (properties) => {
    updateSelectedElement(properties);
    // Re-select to maintain selection after update
    if (selectedElementId) {
      selectElement(selectedElementId);
    }
  };

  // Handle delete element
  const handleDeleteElement = () => {
    deleteSelectedElement();
  };

  return (
    <div>
      {/* Canvas Area */}
      <div ref={canvasContainerRef} style={canvasWrapperStyle}>
        {/* Grid Canvas */}
        <canvas 
          ref={gridCanvasRef} 
          style={{
            ...canvasStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }} 
        />
        {/* Fabric Canvas */}
        <canvas 
          ref={canvasRef} 
          style={{
            ...canvasStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }} 
        />
        
        {/* Floating Toolbar */}
        <FloatingToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          gridOn={gridOn}
          onGridToggle={setGridOn}
          zoomLevel={zoomLevel}
          onFitView={fitView}
          selectedElementIds={selectedElementIds}
          onGroup={groupSelectedElements}
          onUngroup={ungroupSelectedElement}
          getCanvas={getCanvas}
        />

        {/* Sidebar */}
        <Sidebar
          onAddElement={handleAddElement}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Properties Panel - muncul otomatis saat element dipilih (hanya untuk single selection) */}
        {selectedElement && selectedElementIds.length <= 1 && (
          <PropertiesPanel
            element={selectedElement}
            onUpdate={handleUpdateProperties}
            onDelete={handleDeleteElement}
          />
        )}

        {/* Element count indicator */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '11px',
          color: '#94a3b8',          fontFamily: "'Segoe UI', system-ui, sans-serif",          zIndex: 1000,
        }}>
          Elements: {elements.length}
        </div>
      </div>
    </div>
  );
}

export default CanvasEditor;

