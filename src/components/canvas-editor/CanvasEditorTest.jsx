import { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';
import { createPolygonElement } from './elements';
import {
  canvasWrapperStyle,
  canvasStyle,
  drawerStyle,
  headerStyle,
  controlGroupStyle,
  labelStyle,
  inputRowStyle,
  colorInputStyle,
  rangeStyle,
  buttonStyle,
  checkboxStyle,
  floatingToolbarStyle,
  iconButtonStyle,
  verticalDividerStyle,
  smallTextStyle,
  mutedTextStyle,
} from './styles';

/**
 * CanvasEditorTest - Test component untuk memverifikasi PolygonElement
 * 
 * Ini adalah test sederhana untuk Phase 1 refactoring.
 * Menunjukkan bahwa PolygonElement bisa digunakan terpisah dari React component.
 */
function CanvasEditorTest() {
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null);
  const canvasInstanceRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const polygonElementRef = useRef(null);

  // UI State
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1e40af');
  const [hasBorder, setHasBorder] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [editMode, setEditMode] = useState(false);
  const [nodeCount, setNodeCount] = useState(4);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(null);

  // Canvas controls
  const [gridOn, setGridOn] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTool, setActiveTool] = useState('select');

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const baseGridSpacing = 50;

  // Draw grid
  const drawGrid = () => {
    const gridCanvas = gridCanvasRef.current;
    const fabricCanvas = canvasInstanceRef.current;
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
  };

  // Fit view
  const fitView = () => {
    const canvas = canvasInstanceRef.current;
    const element = polygonElementRef.current;
    if (!canvas || !element || !element.polygon) return;

    const bounds = element.polygon.getBoundingRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const zoomX = canvasWidth / bounds.width;
    const zoomY = canvasHeight / bounds.height;
    const zoom = Math.min(zoomX, zoomY) * 0.8;

    canvas.setZoom(Math.max(0.1, Math.min(3, zoom)));
    canvas.absolutePan({ x: centerX * zoom - canvasWidth / 2, y: centerY * zoom - canvasHeight / 2 });
    setZoomLevel(canvas.getZoom());
    drawGrid();
    canvas.requestRenderAll();
  };

  // Update polygon when properties change
  useEffect(() => {
    const element = polygonElementRef.current;
    if (element) {
      element.update({
        fillColor,
        strokeColor,
        hasBorder,
        strokeWidth,
      });
    }
  }, [fillColor, strokeColor, hasBorder, strokeWidth]);

  // Redraw grid when gridOn or zoom changes
  useEffect(() => {
    drawGrid();
  }, [gridOn, zoomLevel]);

  // Toggle edit mode
  const toggleEditMode = () => {
    const element = polygonElementRef.current;
    if (!element) return;

    const newEditMode = !editMode;
    setEditMode(newEditMode);
    element.setEditMode(newEditMode);
    
    setNodeCount(element.getNodeCount());
    setSelectedNodeIndex(element.getSelectedNodeIndex());
    
    if (!newEditMode) {
      // Select polygon after exiting edit mode
      element.selectPolygon();
    }
    
    setShowDrawer(true);
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    const element = polygonElementRef.current;
    if (!element) return;

    const success = element.deleteSelectedNode();
    if (!success && element.getNodeCount() <= 3) {
      alert('Minimal 3 node untuk membentuk polygon!');
      return;
    }
    
    setNodeCount(element.getNodeCount());
    setSelectedNodeIndex(element.getSelectedNodeIndex());
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
        return;
      }

      if (!editMode) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode]);

  // Initialize canvas
  useEffect(() => {
    if (canvasInstanceRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: 'transparent',
      selection: false,
    });

    canvasInstanceRef.current = canvas;

    // Resize handler
    const resizeCanvas = () => {
      if (canvasContainerRef.current && canvasInstanceRef.current) {
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        canvasInstanceRef.current.setDimensions({ width: clientWidth, height: clientHeight });
        
        if (gridCanvasRef.current) {
          gridCanvasRef.current.width = clientWidth;
          gridCanvasRef.current.height = clientHeight;
          drawGrid();
        }
        
        canvasInstanceRef.current.requestRenderAll();
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    // Create polygon element using factory
    const polygonElement = createPolygonElement(canvas, {
      fillColor,
      strokeColor,
      hasBorder,
      strokeWidth,
      onSelect: (el) => {
        setShowDrawer(true);
      },
      onUpdate: (el) => {
        setNodeCount(el.getNodeCount());
        setSelectedNodeIndex(el.getSelectedNodeIndex());
      },
    });

    polygonElementRef.current = polygonElement;

    // Selection events
    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected.some(obj => obj._polygonElement)) {
        setShowDrawer(true);
      }
    });

    canvas.on('selection:cleared', () => {
      const element = polygonElementRef.current;
      if (!element?.isEditMode) {
        setShowDrawer(false);
      }
    });

    // Double-click to add node in edit mode
    canvas.on('mouse:dblclick', (opt) => {
      const element = polygonElementRef.current;
      if (!element?.isEditMode) return;
      if (opt.target) return;

      const pointer = canvas.getPointer(opt.e);
      element.addNodeAtPosition(pointer);
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
    });

    // Zoom
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

    // Select polygon initially
    setTimeout(() => {
      polygonElement.selectPolygon();
    }, 100);

    return () => {
      if (polygonElementRef.current) {
        polygonElementRef.current.destroy();
      }
      canvas.dispose();
      canvasInstanceRef.current = null;
      resizeObserver.disconnect();
    };
  }, []);

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
        
        {/* Floating Controls */}
        <div style={floatingToolbarStyle}>
          {/* Tool Buttons */}
          <div style={{ display: 'flex', gap: '4px', ...verticalDividerStyle }}>
            <button
              onClick={() => setActiveTool('select')}
              title="Select Tool (V)"
              style={iconButtonStyle(activeTool === 'select')}
            >
              ↖
            </button>
            <button
              onClick={() => setActiveTool('pan')}
              title="Pan Tool (H)"
              style={iconButtonStyle(activeTool === 'pan')}
            >
              ✋
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={gridOn}
              onChange={(e) => setGridOn(e.target.checked)}
              style={{ ...checkboxStyle, margin: 0 }}
            />
            <span style={{ ...mutedTextStyle, margin: 0 }}>Grid</span>
          </div>
          
          <div style={{ ...mutedTextStyle, minWidth: '40px', textAlign: 'center' }}>
            {(zoomLevel * 100).toFixed(0)}%
          </div>
          
          <button
            onClick={fitView}
            style={{ 
              ...buttonStyle(false), 
              padding: '4px 8px', 
              fontSize: '11px',
              minWidth: 'auto',
              margin: 0
            }}
          >
            📐 Fit
          </button>
        </div>
      </div>

      {/* Properties Drawer */}
      {showDrawer && (
        <div style={{
          ...drawerStyle,
          opacity: showDrawer ? 1 : 0,
          transform: showDrawer ? 'translateX(0)' : 'translateX(20px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          <h1 style={headerStyle}>🔷 Polygon Editor</h1>
          <p style={mutedTextStyle}>Phase 1 Test - PolygonElement Factory</p>

          {/* Fill Color */}
          <div style={controlGroupStyle}>
            <span style={labelStyle}>Fill Color</span>
            <div style={inputRowStyle}>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                style={colorInputStyle}
              />
              <span style={smallTextStyle}>{fillColor}</span>
            </div>
          </div>

          {/* Border Controls */}
          <div style={controlGroupStyle}>
            <span style={labelStyle}>Border</span>
            <div style={inputRowStyle}>
              <input
                type="checkbox"
                checked={hasBorder}
                onChange={(e) => setHasBorder(e.target.checked)}
                style={checkboxStyle}
              />
              <span style={smallTextStyle}>
                {hasBorder ? 'On' : 'Off'}
              </span>
            </div>
            {hasBorder && (
              <>
                <div style={inputRowStyle}>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    style={colorInputStyle}
                  />
                  <span style={smallTextStyle}>{strokeColor}</span>
                </div>
                <div style={inputRowStyle}>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    style={rangeStyle}
                  />
                  <span style={smallTextStyle}>{strokeWidth}px</span>
                </div>
              </>
            )}
          </div>

          {/* Edit Mode */}
          <div style={controlGroupStyle}>
            <span style={labelStyle}>Edit Nodes</span>
            <button
              onClick={toggleEditMode}
              style={buttonStyle(editMode)}
            >
              {editMode ? '✓ Done Editing' : '✎ Edit Shape'}
            </button>
            <span style={mutedTextStyle}>
              Nodes: {nodeCount}
            </span>
          </div>

          {/* Delete Node Button */}
          {editMode && selectedNodeIndex !== null && (
            <div style={controlGroupStyle}>
              <span style={labelStyle}>Actions</span>
              <button
                onClick={deleteSelectedNode}
                style={buttonStyle(false, '#ef4444')}
              >
                🗑 Delete Node
              </button>
              <span style={mutedTextStyle}>
                Selected Node: {selectedNodeIndex + 1}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CanvasEditorTest;

