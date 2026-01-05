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
    setCanvas,
    getCanvas,
    addElement,
    deleteSelectedElement,
    getSelectedElement,
    selectElement,
    updateSelectedElement,
  } = useCanvasEditor();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Canvas controls
  const [gridOn, setGridOn] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTool, setActiveTool] = useState('select');

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const baseGridSpacing = 50;

  // Get selected element
  const selectedElement = getSelectedElement();

  // Draw grid
  const drawGrid = useCallback(() => {
    const gridCanvas = gridCanvasRef.current;
    const fabricCanvas = getCanvas();
    if (!gridCanvas || !fabricCanvas) return;

    const ctx = gridCanvas.getContext('2d');
    const width = gridCanvas.width;
    const height = gridCanvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    if (!gridOn) return;

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

      // Delete element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const element = getSelectedElement();
        if (element && !element.isEditMode) {
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
        if (element?.isEditMode) {
          element.setEditMode(false);
          element.selectPolygon?.();
        } else {
          selectElement(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getSelectedElement, deleteSelectedElement, selectElement]);

  // Update cursor based on active tool
  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    if (activeTool === 'pan') {
      canvas.defaultCursor = 'grab';
    } else {
      canvas.defaultCursor = 'default';
    }
  }, [activeTool, getCanvas]);

  // Initialize canvas
  useEffect(() => {
    if (getCanvas()) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: 'transparent',
      selection: false,
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
      if (e.selected && e.selected.length > 0) {
        const obj = e.selected[0];
        if (obj._polygonElement) {
          selectElement(obj._polygonElement.id);
        }
      }
    });

    canvas.on('selection:updated', (e) => {
      if (e.selected && e.selected.length > 0) {
        const obj = e.selected[0];
        if (obj._polygonElement) {
          selectElement(obj._polygonElement.id);
        }
      }
    });

    canvas.on('selection:cleared', () => {
      // Deselect element when clicking on empty area
      // But not if element is in edit mode
      selectElement(null);
    });

    // Double-click to add node in edit mode
    canvas.on('mouse:dblclick', (opt) => {
      // Find if any element is in edit mode
      const selectedEl = getSelectedElement();
      if (selectedEl?.isEditMode && !opt.target) {
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
    });

    canvas.on('mouse:up', () => {
      isDraggingRef.current = false;
      canvas.selection = true;
      if (activeToolRef.current === 'pan') {
        canvas.defaultCursor = 'grab';
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
  const handleAddElement = (type) => {
    addElement(type);
  };

  // Handle update element properties
  const handleUpdateProperties = (properties) => {
    updateSelectedElement(properties);
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
        />

        {/* Sidebar */}
        <Sidebar
          onAddElement={handleAddElement}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Properties Panel - muncul otomatis saat element dipilih */}
        {selectedElement && (
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

