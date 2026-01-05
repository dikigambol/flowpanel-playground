import { useEffect, useRef, useState } from 'react';
import { Canvas, Polygon, Circle, Line, util as fabricUtil } from 'fabric';
import { canvasWrapperStyle, canvasStyle, drawerStyle, headerStyle, controlGroupStyle, labelStyle, inputRowStyle, colorInputStyle, rangeStyle, buttonStyle, checkboxStyle } from './style.js';

/**
 * PolygonShape Component
 * 
 * Polygon editor dengan fitur:
 * - Ubah warna background (fill)
 * - Toggle border on/off  
 * - Ubah warna border
 * - Edit nodes: tambah, hapus, pindahkan
 * - Bentuk shape bebas dari nodes
 * 
 * @component
 */
function PolygonShape() {
  const canvasRef = useRef(null);
  const gridCanvasRef = useRef(null); // Separate canvas for grid
  const canvasInstanceRef = useRef(null);
  const polygonRef = useRef(null);
  const nodesRef = useRef([]);
  const edgeLinesRef = useRef([]);
  const selectedNodeIndexRef = useRef(null);
  const editModeRef = useRef(false);
  const canvasContainerRef = useRef(null);

  // State untuk kontrol UI
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1e40af');
  const [hasBorder, setHasBorder] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [editMode, setEditMode] = useState(false);
  const [nodeCount, setNodeCount] = useState(4);
  const [showDrawer, setShowDrawer] = useState(false);

  // Grid, pan, zoom states
  const [gridOn, setGridOn] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTool, setActiveTool] = useState('select'); // 'select' atau 'pan'

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const baseGridSpacingRef = useRef(50); // in world units (px)

  // Ref untuk tool - langsung sync tanpa useEffect agar selalu up-to-date
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool; // Selalu sync setiap render

  // Points disimpan sebagai absolute coordinates
  const pointsRef = useRef([
    { x: 200, y: 150 },
    { x: 400, y: 150 },
    { x: 400, y: 350 },
    { x: 200, y: 350 },
  ]);

  // Sync editMode to ref for use in callbacks
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);


  // Helper: Clear all nodes from canvas
  const clearNodes = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    nodesRef.current.forEach(node => {
      node.off(); // Remove all event listeners
      canvas.remove(node);
    });
    nodesRef.current = [];
  };

  // Helper: Clear all edge lines from canvas
  const clearEdgeLines = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    edgeLinesRef.current.forEach(line => {
      line.off();
      canvas.remove(line);
    });
    edgeLinesRef.current = [];
  };

  // Function untuk menggambar grid pada canvas terpisah
  const drawGrid = () => {
    const gridCanvas = gridCanvasRef.current;
    const fabricCanvas = canvasInstanceRef.current;
    if (!gridCanvas || !fabricCanvas) return;

    const ctx = gridCanvas.getContext('2d');
    const width = gridCanvas.width;
    const height = gridCanvas.height;

    // Clear dan gambar background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Jangan gambar grid lines jika grid off
    if (!gridOn) return;

    const zoom = fabricCanvas.getZoom();
    const vpt = fabricCanvas.viewportTransform;
    const gridSpacing = baseGridSpacingRef.current;

    // Calculate visible area in world coordinates
    const startX = -vpt[4] / zoom;
    const startY = -vpt[5] / zoom;
    const endX = startX + width / zoom;
    const endY = startY + height / zoom;

    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Vertical lines
    const firstVertX = Math.floor(startX / gridSpacing) * gridSpacing;
    for (let worldX = firstVertX; worldX <= endX; worldX += gridSpacing) {
      const screenX = (worldX - startX) * zoom;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }

    // Horizontal lines
    const firstHorizY = Math.floor(startY / gridSpacing) * gridSpacing;
    for (let worldY = firstHorizY; worldY <= endY; worldY += gridSpacing) {
      const screenY = (worldY - startY) * zoom;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Redraw grid when gridOn, zoomLevel changes, or after pan
  useEffect(() => {
    drawGrid();
  }, [gridOn, zoomLevel]);

  // Helper: Fit view to show all objects
  const fitView = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects().filter(obj => obj !== polygonRef.current || !editModeRef.current);
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

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate zoom to fit
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const zoomX = canvasWidth / width;
    const zoomY = canvasHeight / height;
    const zoom = Math.min(zoomX, zoomY) * 0.8; // 80% to add some padding

    canvas.setZoom(Math.max(0.1, Math.min(3, zoom)));
    canvas.absolutePan({ x: centerX * zoom - canvasWidth / 2, y: centerY * zoom - canvasHeight / 2 });
    setZoomLevel(canvas.getZoom());
    drawGrid(); // Redraw grid setelah fit view
    canvas.requestRenderAll();
  };

  // Helper: Get absolute vertex coordinates of a transformed polygon
  const getAbsoluteVertices = (polygon) => {
    if (!polygon || !canvasInstanceRef.current) return [];

    // Get transformation matrix yang mencakup semua transformasi (position, scale, rotation)
    const matrix = polygon.calcTransformMatrix();

    const absoluteVertices = polygon.points.map(p => {
      // Transform dari local coordinates ke canvas coordinates
      // Local coordinates: point relative to pathOffset
      const localX = p.x - polygon.pathOffset.x;
      const localY = p.y - polygon.pathOffset.y;

      // Apply transformation matrix
      const transformed = fabricUtil.transformPoint({ x: localX, y: localY }, matrix);

      return { x: transformed.x, y: transformed.y };
    });

    return absoluteVertices;
  };

  // Update polygon visual only (tanpa recreate)
  const updatePolygonStyle = () => {
    const polygon = polygonRef.current;
    const canvas = canvasInstanceRef.current;
    if (!polygon || !canvas) return;

    polygon.set({
      fill: fillColor,
      stroke: hasBorder ? strokeColor : null,
      strokeWidth: hasBorder ? strokeWidth : 0,
    });
    canvas.requestRenderAll();
  };

  // Rebuild polygon dari points (full recreate)
  const rebuildPolygon = (isEditMode) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const currentPoints = pointsRef.current; // These are absolute canvas coordinates

    if (currentPoints.length < 3) return;

    // Hapus polygon lama
    if (polygonRef.current) {
      polygonRef.current.off();
      canvas.remove(polygonRef.current);
      polygonRef.current = null;
    }

    // Buat polygon baru langsung dengan absolute points
    const polygon = new Polygon([...currentPoints], {
      fill: fillColor,
      stroke: hasBorder ? strokeColor : null,
      strokeWidth: hasBorder ? strokeWidth : 0,
      strokeUniform: true,
      objectCaching: false,

      selectable: !isEditMode,
      evented: !isEditMode,
      hasControls: !isEditMode,
      hasBorders: !isEditMode,

      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#ffffff',
      cornerSize: 10,
      cornerStyle: 'circle',
      borderColor: '#3b82f6',

      hoverCursor: isEditMode ? 'default' : 'move',
    });

    polygonRef.current = polygon;
    canvas.add(polygon);
    canvas.sendObjectToBack(polygon);

    canvas.requestRenderAll();
    setNodeCount(currentPoints.length);
  };

  // Select polygon dan show drawer
  const selectPolygon = () => {
    const canvas = canvasInstanceRef.current;
    const polygon = polygonRef.current;
    if (!canvas || !polygon) return;
    
    canvas.setActiveObject(polygon);
    setShowDrawer(true);
    canvas.requestRenderAll();
  };

  // Create edge lines
  const createEdgeLines = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    clearEdgeLines();

    const points = pointsRef.current;

    points.forEach((point, index) => {
      const nextPoint = points[(index + 1) % points.length];

      const line = new Line([point.x, point.y, nextPoint.x, nextPoint.y], {
        stroke: '#60a5fa',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: true,
        hoverCursor: 'crosshair',
      });

      line.edgeIndex = index;

      // Double click pada edge untuk add node
      line.on('mousedblclick', () => {
        if (editModeRef.current) {
          addNodeAtEdge(index);
        }
      });

      canvas.add(line);
      edgeLinesRef.current.push(line);
    });

    // Reorder: polygon paling belakang, lalu lines, lalu nodes
    if (polygonRef.current) {
      canvas.sendObjectToBack(polygonRef.current);
    }
    edgeLinesRef.current.forEach(line => {
      canvas.sendObjectToBack(line);
    });

    canvas.requestRenderAll();
  };

  // Create visual nodes
  const createNodes = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    clearNodes();

    const points = pointsRef.current;

    points.forEach((point, index) => {
      const node = new Circle({
        left: point.x,
        top: point.y,
        radius: 10,
        fill: selectedNodeIndexRef.current === index ? '#22c55e' : '#ef4444',
        stroke: '#ffffff',
        strokeWidth: 3,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'grab',
        moveCursor: 'grabbing',
      });

      node.nodeIndex = index;

      // Drag node → update point and sync visuals
      node.on('moving', () => {
        const idx = node.nodeIndex;
        pointsRef.current[idx] = { x: node.left, y: node.top };

        // Rebuild polygon dengan points baru
        rebuildPolygon(true);

        // Update edge lines positions
        updateEdgeLinesPositions();

        canvasInstanceRef.current?.requestRenderAll();
      });

      // Click untuk select
      node.on('mousedown', () => {
        selectedNodeIndexRef.current = index;
        highlightSelectedNode();
      });

      canvas.add(node);
      canvas.bringObjectToFront(node);
      nodesRef.current.push(node);
    });

    canvas.requestRenderAll();
  };

  // Update edge lines positions (tanpa recreate)
  const updateEdgeLinesPositions = () => {
    const points = pointsRef.current;
    const lines = edgeLinesRef.current;

    lines.forEach((line, index) => {
      const nextIndex = (index + 1) % points.length;
      line.set({
        x1: points[index].x,
        y1: points[index].y,
        x2: points[nextIndex].x,
        y2: points[nextIndex].y,
      });
      line.setCoords();
    });
  };

  // Highlight node yang dipilih
  const highlightSelectedNode = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    nodesRef.current.forEach((node, index) => {
      node.set({
        fill: selectedNodeIndexRef.current === index ? '#22c55e' : '#ef4444',
      });
    });
    canvas.requestRenderAll();
  };

  // Add node di tengah edge
  const addNodeAtEdge = (edgeIndex) => {
    const points = pointsRef.current;
    const nextIndex = (edgeIndex + 1) % points.length;

    const p1 = points[edgeIndex];
    const p2 = points[nextIndex];

    // Titik tengah
    const newPoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    // Insert setelah edgeIndex
    points.splice(edgeIndex + 1, 0, newPoint);

    // Select node baru
    selectedNodeIndexRef.current = edgeIndex + 1;

    // Rebuild everything
    rebuildPolygon(true);
    createEdgeLines();
    createNodes();
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    const points = pointsRef.current;
    const selectedIndex = selectedNodeIndexRef.current;

    if (selectedIndex === null) {
      return;
    }

    // Minimum 3 nodes untuk polygon
    if (points.length <= 3) {
      alert('Minimal 3 node untuk membentuk polygon!');
      return;
    }

    // Hapus point
    points.splice(selectedIndex, 1);
    selectedNodeIndexRef.current = null;

    // Rebuild everything
    rebuildPolygon(true);
    createEdgeLines();
    createNodes();
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    const newEditMode = !editMode;
    setEditMode(newEditMode);
    editModeRef.current = newEditMode;

    if (newEditMode) {
      // Masuk edit mode - deselect polygon dulu
      canvas.discardActiveObject();
      selectedNodeIndexRef.current = null;
      const currentPolygon = polygonRef.current;
      if (currentPolygon) {
        pointsRef.current = getAbsoluteVertices(currentPolygon);
      }
      rebuildPolygon(true);
      createEdgeLines();
      createNodes();
      // Drawer tetap tampil saat edit mode
      setShowDrawer(true);
    } else {
      // Keluar edit mode
      clearNodes();
      clearEdgeLines();
      selectedNodeIndexRef.current = null;
      rebuildPolygon(false);
      // Select polygon kembali setelah keluar edit mode
      selectPolygon();
    }
  };

  // Effect untuk update polygon style saat warna berubah
  useEffect(() => {
    if (canvasInstanceRef.current && polygonRef.current) {
      updatePolygonStyle();
    }
  }, [fillColor, strokeColor, hasBorder, strokeWidth]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tool switching shortcuts (always active)
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
        return;
      }

      // Edit mode shortcuts
      if (!editModeRef.current) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inisialisasi canvas dan ResizeObserver
  useEffect(() => {
    if (canvasInstanceRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: 'transparent', // Transparan agar grid terlihat
      selection: false,
    });

    canvasInstanceRef.current = canvas;

    // Resize Canvas to fill container
    const resizeCanvas = () => {
      if (canvasContainerRef.current && canvasInstanceRef.current) {
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        canvasInstanceRef.current.setDimensions({ width: clientWidth, height: clientHeight });
        
        // Resize grid canvas juga
        if (gridCanvasRef.current) {
          gridCanvasRef.current.width = clientWidth;
          gridCanvasRef.current.height = clientHeight;
          drawGrid();
        }
        
        canvasInstanceRef.current.requestRenderAll();
        // After resize, if in edit mode, redraw nodes/lines
        if (editModeRef.current) {
          if (polygonRef.current) {
            pointsRef.current = getAbsoluteVertices(polygonRef.current);
          }
          rebuildPolygon(true);
          createEdgeLines();
          createNodes();
        }
      }
    };

    // Initial resize
    resizeCanvas();

    // ResizeObserver untuk menyesuaikan canvas dengan ukuran container
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    // Event untuk selection changes
    canvas.on('selection:created', (e) => {
      // Hanya show drawer jika yang di-select adalah polygon utama
      if (e.selected && e.selected.includes(polygonRef.current)) {
        setShowDrawer(true);
      }
    });

    canvas.on('selection:cleared', () => {
      // Jangan hide drawer atau exit edit mode jika sedang dalam edit mode
      // karena di edit mode, polygon tidak selectable
      if (!editModeRef.current) {
        setShowDrawer(false);
      }
    });

    // Event untuk double-click di canvas (bukan object) untuk add node
    canvas.on('mouse:dblclick', (opt) => {
      if (!editModeRef.current) return;
      if (opt.target) return; // Jangan add jika klik pada object

      const pointer = canvas.getPointer(opt.e);

      // Simple add node at click position if not near any edge
      pointsRef.current.push({ x: pointer.x, y: pointer.y });
      // Automatically select the newly added node
      selectedNodeIndexRef.current = pointsRef.current.length - 1;
      rebuildPolygon(true);
      createEdgeLines();
      createNodes();
    });

    // Pan functionality (only active when pan tool is selected)
    canvas.on('mouse:down', (opt) => {
      // Hanya pan jika tool pan aktif DAN tidak klik object
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
      // Double check: hanya pan jika isDragging DAN tool pan aktif
      if (!isDraggingRef.current || activeToolRef.current !== 'pan') {
        return;
      }
      
      const evt = opt.e;
      const deltaX = evt.clientX - lastPosRef.current.x;
      const deltaY = evt.clientY - lastPosRef.current.y;
      canvas.relativePan({ x: deltaX, y: deltaY });
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      drawGrid(); // Redraw grid saat pan
      canvas.requestRenderAll();
    });

    canvas.on('mouse:up', () => {
      isDraggingRef.current = false;
      canvas.selection = true;
    });

    // Zoom functionality
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.max(0.1, Math.min(3, zoom)); // Limit zoom between 0.1 and 3
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      setZoomLevel(zoom);
      drawGrid(); // Redraw grid saat zoom
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Initial polygon dan select
    rebuildPolygon(false);
    // Select polygon setelah dibuat (delayed agar canvas siap)
    setTimeout(() => {
      selectPolygon();
    }, 100);

    return () => {
      canvas.dispose();
      canvasInstanceRef.current = null;
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div>
      {/* Canvas Area */}
      <div ref={canvasContainerRef} style={canvasWrapperStyle}>
        {/* Grid Canvas - di bawah fabric canvas */}
        <canvas 
          ref={gridCanvasRef} 
          style={{
            ...canvasStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none', // Tidak menerima mouse events
            zIndex: 0,
          }} 
        />
        {/* Fabric Canvas - di atas grid */}
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
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
        }}>
          {/* Tool Buttons */}
          <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid rgba(71, 85, 105, 0.5)', paddingRight: '12px' }}>
            <button
              onClick={() => setActiveTool('select')}
              title="Select Tool (V)"
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: activeTool === 'select' ? '#3b82f6' : 'transparent',
                color: activeTool === 'select' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s',
              }}
            >
              ↖
            </button>
            <button
              onClick={() => setActiveTool('pan')}
              title="Pan Tool (H)"
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: activeTool === 'pan' ? '#3b82f6' : 'transparent',
                color: activeTool === 'pan' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s',
              }}
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
            <span style={{ fontSize: '11px', color: '#cbd5e1', margin: 0 }}>Grid</span>
          </div>
          
          <div style={{ fontSize: '11px', color: '#94a3b8', minWidth: '40px', textAlign: 'center' }}>
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
              <span style={{ fontSize: '11px', color: '#cbd5e1' }}>{fillColor}</span>
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
              <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
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
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>{strokeColor}</span>
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
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>{strokeWidth}px</span>
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
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Nodes: {nodeCount}
            </span>
          </div>

          {/* Delete Node Button */}
          {editMode && selectedNodeIndexRef.current !== null && (
            <div style={controlGroupStyle}>
              <span style={labelStyle}>Actions</span>
              <button
                onClick={deleteSelectedNode}
                style={buttonStyle(false, '#ef4444')}
              >
                🗑 Delete Node
              </button>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Selected Node: {selectedNodeIndexRef.current + 1}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PolygonShape;
