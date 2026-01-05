import { useEffect, useRef, useState } from 'react';
import { Canvas, Polygon, Circle, Line, util as fabricUtil } from 'fabric';

function CanvasArea({ activeTool, showGrid, onObjectSelect }) {
  const canvasRef = useRef(null);
  const canvasInstanceRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });

  // Shape tool state
  const polygonRef = useRef(null);
  const nodesRef = useRef([]);
  const edgeLinesRef = useRef([]);
  const selectedNodeIndexRef = useRef(null);
  const editModeRef = useRef(false);
  const pointsRef = useRef([
    { x: 200, y: 150 },
    { x: 400, y: 150 },
    { x: 400, y: 350 },
    { x: 200, y: 350 },
  ]);

  // Initialize canvas
  useEffect(() => {
    if (canvasInstanceRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: '#1a1a2e',
      selection: true,
    });

    canvasInstanceRef.current = canvas;

    // Pan functionality
    canvas.on('mouse:down', (opt) => {
      if (opt.e.ctrlKey || opt.e.metaKey || opt.e.button === 1) {
        isPanningRef.current = true;
        lastPanPointRef.current = canvas.getPointer(opt.e);
        canvas.defaultCursor = 'grabbing';
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanningRef.current) {
        const pointer = canvas.getPointer(opt.e);
        const deltaX = pointer.x - lastPanPointRef.current.x;
        const deltaY = pointer.y - lastPanPointRef.current.y;
        
        canvas.relativePan({ x: deltaX, y: deltaY });
        lastPanPointRef.current = pointer;
      }
    });

    canvas.on('mouse:up', () => {
      isPanningRef.current = false;
      canvas.defaultCursor = 'default';
    });

    // Object selection
    canvas.on('selection:created', (e) => {
      onObjectSelect(e.selected[0]);
    });

    canvas.on('selection:updated', (e) => {
      onObjectSelect(e.selected[0]);
    });

    canvas.on('selection:cleared', () => {
      onObjectSelect(null);
    });

    // Resize canvas
    const resizeCanvas = () => {
      if (canvasContainerRef.current && canvasInstanceRef.current) {
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        canvasInstanceRef.current.setDimensions({ width: clientWidth, height: clientHeight });
        canvasInstanceRef.current.requestRenderAll();
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      canvas.dispose();
      canvasInstanceRef.current = null;
      resizeObserver.disconnect();
    };
  }, [onObjectSelect]);

  // Grid rendering
  useEffect(() => {
    if (!canvasInstanceRef.current) return;

    const canvas = canvasInstanceRef.current;
    
    if (showGrid) {
      // Draw grid
      const gridSize = 20;
      const width = canvas.getWidth();
      const height = canvas.getHeight();
      
      // Create grid lines
      const gridLines = [];
      
      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        const line = new Line([x, 0, x, height], {
          stroke: '#2a2a4a',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        gridLines.push(line);
      }
      
      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        const line = new Line([0, y, width, y], {
          stroke: '#2a2a4a',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        gridLines.push(line);
      }
      
      // Add all grid lines to canvas
      gridLines.forEach(line => {
        canvas.add(line);
        canvas.sendObjectToBack(line);
      });
      
      canvas.requestRenderAll();
      
      return () => {
        gridLines.forEach(line => canvas.remove(line));
      };
    } else {
      // Remove grid
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        if (obj.excludeFromExport) {
          canvas.remove(obj);
        }
      });
      canvas.requestRenderAll();
    }
  }, [showGrid]);

  // Shape tool functionality
  useEffect(() => {
    if (activeTool !== 'shape') {
      // Clear shape tool jika tool lain dipilih
      clearShapeTool();
      return;
    }

    // Initialize shape tool
    if (canvasInstanceRef.current && !polygonRef.current) {
      createInitialPolygon();
    }
  }, [activeTool]);

  const clearShapeTool = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    if (polygonRef.current) {
      canvas.remove(polygonRef.current);
      polygonRef.current = null;
    }
    nodesRef.current.forEach(node => canvas.remove(node));
    nodesRef.current = [];
    edgeLinesRef.current.forEach(line => canvas.remove(line));
    edgeLinesRef.current = [];
  };

  const createInitialPolygon = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const polygon = new Polygon([...pointsRef.current], {
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 3,
      strokeUniform: true,
      objectCaching: false,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
    });

    polygonRef.current = polygon;
    canvas.add(polygon);
    canvas.setActiveObject(polygon);
    canvas.requestRenderAll();
  };

  return (
    <div 
      ref={canvasContainerRef}
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
      }}
    >
      <canvas 
        ref={canvasRef}
        style={{
          display: 'block',
        }}
      />
      {activeTool === 'shape' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          padding: '10px',
          backgroundColor: 'rgba(30, 30, 63, 0.9)',
          borderRadius: '6px',
          color: '#ffffff',
          fontSize: '12px',
        }}>
          <strong>Shape Tool Active</strong>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>
            Hold Ctrl/Cmd + Drag untuk pan canvas
          </p>
        </div>
      )}
    </div>
  );
}

export default CanvasArea;

