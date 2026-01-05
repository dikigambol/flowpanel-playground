import { useEffect, useRef, useState } from 'react';
import { Canvas, Polygon, Circle, Line } from 'fabric';

/**
 * EditableBaseShape Component
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
function EditableBaseShape() {
  const canvasRef = useRef(null);
  const canvasInstanceRef = useRef(null);
  const polygonRef = useRef(null);
  const nodesRef = useRef([]);
  const edgeLinesRef = useRef([]);
  const selectedNodeIndexRef = useRef(null);
  const editModeRef = useRef(false);
  
  // State untuk kontrol UI
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1e40af');
  const [hasBorder, setHasBorder] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [editMode, setEditMode] = useState(false);
  const [nodeCount, setNodeCount] = useState(4);

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

    const points = pointsRef.current;
    
    // Hapus polygon lama
    if (polygonRef.current) {
      polygonRef.current.off();
      canvas.remove(polygonRef.current);
      polygonRef.current = null;
    }

    // Buat polygon baru
    const polygon = new Polygon([...points], {
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
    
    if (!isEditMode) {
      canvas.setActiveObject(polygon);
    }
    
    canvas.requestRenderAll();
    setNodeCount(points.length);
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
    if (polygonRef.current) {
      canvas.sendObjectToBack(polygonRef.current);
    }

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
        
        // Update polygon points directly tanpa recreate
        const polygon = polygonRef.current;
        if (polygon) {
          polygon.set({ points: [...pointsRef.current] });
          polygon.setCoords();
        }
        
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
      // Masuk edit mode
      selectedNodeIndexRef.current = null;
      rebuildPolygon(true);
      createEdgeLines();
      createNodes();
    } else {
      // Keluar edit mode
      clearNodes();
      clearEdgeLines();
      selectedNodeIndexRef.current = null;
      rebuildPolygon(false);
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
      if (!editModeRef.current) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inisialisasi canvas
  useEffect(() => {
    if (canvasInstanceRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: '#1a1a2e',
      selection: false,
    });

    canvasInstanceRef.current = canvas;

    // Initial polygon
    rebuildPolygon(false);

    return () => {
      canvas.dispose();
      canvasInstanceRef.current = null;
    };
  }, []);

  // ========== STYLES ==========
  const containerStyle = {
    padding: '20px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#0f0f23',
    minHeight: '100vh',
    width: '100%',
    color: '#e0e0e0',
  };

  const headerStyle = {
    marginBottom: '20px',
    color: '#60a5fa',
    fontSize: '24px',
    fontWeight: '600',
  };

  const panelStyle = {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  };

  const controlGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#1e1e3f',
    borderRadius: '8px',
    minWidth: '160px',
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const inputRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const colorInputStyle = {
    width: '40px',
    height: '32px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  };

  const rangeStyle = {
    flex: 1,
    accentColor: '#3b82f6',
  };

  const buttonStyle = (active = false, color = '#3b82f6') => ({
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    backgroundColor: active ? '#22c55e' : color,
    color: '#ffffff',
    transition: 'all 0.2s',
  });

  const checkboxStyle = {
    width: '18px',
    height: '18px',
    accentColor: '#3b82f6',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>🔷 Polygon Shape Editor</h1>
      
      {/* Control Panel */}
      <div style={panelStyle}>
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
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{fillColor}</span>
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
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
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
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{strokeColor}</span>
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
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{strokeWidth}px</span>
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
        {editMode && (
          <div style={controlGroupStyle}>
            <span style={labelStyle}>Actions</span>
            <button
              onClick={deleteSelectedNode}
              style={buttonStyle(false, '#ef4444')}
            >
              🗑 Delete Node
            </button>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              or press Delete key
            </span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '2px solid #3b82f6', 
          borderRadius: '12px',
          display: 'block',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
        }} 
      />

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px',
        backgroundColor: '#1e1e3f',
        borderRadius: '8px',
        fontSize: '13px',
        lineHeight: '1.8',
      }}>
        <strong style={{ color: '#60a5fa', fontSize: '14px' }}>📌 Cara Pakai:</strong>
        <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <strong style={{ color: '#22c55e' }}>Normal Mode:</strong>
            <ul style={{ marginTop: '5px', paddingLeft: '20px', color: '#94a3b8' }}>
              <li>Drag polygon untuk pindah</li>
              <li>Gunakan handles untuk resize/rotate</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: '#ef4444' }}>Edit Mode:</strong>
            <ul style={{ marginTop: '5px', paddingLeft: '20px', color: '#94a3b8' }}>
              <li><strong>Drag node merah</strong> → pindahkan titik</li>
              <li><strong>Double-click garis biru</strong> → tambah node</li>
              <li><strong>Klik node + Delete</strong> → hapus node</li>
              <li>Node hijau = terpilih</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditableBaseShape;
