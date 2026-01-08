import { Path, Circle, Line, util as fabricUtil } from 'fabric';
import { BaseElement } from './base-element.js';

/**
 * LineElement - Polyline element untuk canvas editor
 * 
 * Features:
 * - Garis lurus antar titik (polyline)
 * - Edit mode: edit nodes dengan edge handles
 * - Customizable stroke color and width
 * - Add/remove nodes
 */
export class BezierLineElement extends BaseElement {
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    this.type = 'line';
    
    // Line properties - simplified to just points (polyline)
    this.properties = {
      strokeColor: options.strokeColor || '#22c55e',
      strokeWidth: options.strokeWidth || 3,
      status: options.status || '',
      // Array of points: [{ x, y }, { x, y }, ...]
      points: options.points || [],
    };

    // Internal refs
    this.path = null;
    this.nodes = []; // Visual node circles
    this.edgeHandles = []; // Edge handles (blue circles at midpoints)
    this.edgeLines = []; // Visual edge lines in edit mode
    this.selectedNodeIndex = null;
  }

  /**
   * Create the line on canvas
   */
  create() {
    this._createPath();
    return this;
  }

  /**
   * Create path from points
   */
  _createPath() {
    // Remove old path
    if (this.path) {
      this.path.off();
      this.canvas.remove(this.path);
      this.path = null;
    }

    if (this.properties.points.length < 2) return;

    // Build SVG path string - straight lines (L = lineto)
    let pathString = '';
    const points = this.properties.points;

    // Start with first point
    pathString += `M ${points[0].x} ${points[0].y} `;

    // Add straight lines to each subsequent point
    for (let i = 1; i < points.length; i++) {
      pathString += `L ${points[i].x} ${points[i].y} `;
    }

    // Create Path object
    const path = new Path(pathString, {
      stroke: this.properties.strokeColor,
      strokeWidth: this.properties.strokeWidth,
      fill: '',
      selectable: !this.isEditMode,
      evented: !this.isEditMode,
      hasControls: !this.isEditMode,
      hasBorders: !this.isEditMode,
      perPixelTargetFind: true,
      transparentCorners: false,
      cornerColor: '#22c55e',
      cornerStrokeColor: '#ffffff',
      cornerSize: 10,
      cornerStyle: 'circle',
      borderColor: '#22c55e',
      hoverCursor: this.isEditMode ? 'default' : 'move',
    });

    // Store reference
    path._bezierLineElement = this;

    this.path = path;
    this.fabricObjects = [path];
    this.canvas.add(path);
    
    if (this.isEditMode) {
      this.canvas.sendObjectToBack(path);
    }
    
    this.canvas.requestRenderAll();
  }

  /**
   * Update line properties
   */
  update(newProperties) {
    Object.assign(this.properties, newProperties);
    
    if (newProperties.points) {
      this._createPath();
      if (this.isEditMode) {
        this._updateNodesPositions();
        this._updateEdgeLinesPositions();
        this._updateEdgeHandlesPositions();
      }
    } else {
      // Just update style
      this._updatePathStyle();
    }
    
    this.notifyUpdate();
  }

  /**
   * Get current properties
   */
  getProperties() {
    return { ...this.properties };
  }

  /**
   * Get colors based on status
   * @returns {Object} {stroke} color or null if no status match
   */
  _getStatusColors() {
    const statusColors = {
      'running': { stroke: '#16a34a' }, // hijau
      'idle': { stroke: '#ca8a04' }, // kuning
      'off': { stroke: '#ca8a04' }, // kuning (idle/off)
      'alarm': { stroke: '#dc2626' }, // merah
      'maintenance': { stroke: '#2563eb' }, // biru
      'breakdown': { stroke: '#374151' }, // hitam
      'disconnected': { stroke: '#4b5563' }, // abu-abu
    };
    
    return statusColors[this.properties.status] || null;
  }

  /**
   * Update path style without rebuilding
   */
  _updatePathStyle() {
    if (!this.path) return;

    const statusColors = this._getStatusColors();
    const strokeColor = statusColors ? statusColors.stroke : this.properties.strokeColor;

    this.path.set({
      stroke: strokeColor,
      strokeWidth: this.properties.strokeWidth,
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Toggle edit mode
   */
  setEditMode(enabled) {
    super.setEditMode(enabled);
    
    if (enabled) {
      // Enter edit mode
      this.canvas.discardActiveObject();
      this.selectedNodeIndex = null;
      
      // Get absolute points from current path (after drag/transform)
      if (this.path) {
        this.properties.points = this._getAbsolutePoints(this.path);
      }
      
      // Rebuild path as non-selectable
      this._createPath();
      this._createEdgeLines();
      this._createNodes();
    } else {
      // Exit edit mode
      this._clearNodes();
      this._clearEdgeLines();
      this.selectedNodeIndex = null;
      
      // Rebuild path as selectable
      this._createPath();
    }
  }

  /**
   * Get absolute point coordinates from transformed path
   * @param {Path} path - Fabric path object
   * @returns {Array} Array of absolute points
   */
  _getAbsolutePoints(path) {
    if (!path) return this.properties.points;

    const matrix = path.calcTransformMatrix();
    const pathOffset = path.pathOffset || { x: 0, y: 0 };

    // Extract points from path commands
    const newPoints = [];
    const pathData = path.path;
    
    if (pathData && pathData.length > 0) {
      pathData.forEach(cmd => {
        // M (moveto) and L (lineto) commands have x,y at index 1,2
        if (cmd[0] === 'M' || cmd[0] === 'L') {
          const localX = cmd[1] - pathOffset.x;
          const localY = cmd[2] - pathOffset.y;
          const transformed = fabricUtil.transformPoint({ x: localX, y: localY }, matrix);
          newPoints.push({ x: transformed.x, y: transformed.y });
        }
      });
    }

    return newPoints.length > 0 ? newPoints : this.properties.points;
  }

  /**
   * Select the line
   */
  selectBezierLine() {
    if (this.path && !this.isEditMode) {
      this.canvas.setActiveObject(this.path);
      this.canvas.requestRenderAll();
    }
    this.select();
  }

  /**
   * Create visual edge lines and edge handles for edit mode
   */
  _createEdgeLines() {
    this._clearEdgeLines();

    const points = this.properties.points;
    if (points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Calculate midpoint for edge handle
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Create visible line (dashed)
      const line = new Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: '#60a5fa',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        hoverCursor: 'default',
      });

      line._edgeIndex = i;
      line._isEdgeLine = true;

      // Create edge handle (blue circle at midpoint) - double click to add node
      const edgeHandle = new Circle({
        left: midX,
        top: midY,
        radius: 8,
        fill: 'rgba(96, 165, 250, 0.3)',
        stroke: '#60a5fa',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        hoverCursor: 'pointer',
      });

      edgeHandle._edgeIndex = i;
      edgeHandle._nextIndex = i + 1;
      edgeHandle._bezierLineElement = this;
      edgeHandle._isEdgeHandle = true;

      // Store original positions on drag start
      edgeHandle.on('mousedown', () => {
        if (this.isEditMode) {
          edgeHandle._startNode1 = { ...this.properties.points[i] };
          edgeHandle._startNode2 = { ...this.properties.points[i + 1] };
          edgeHandle._startPos = { x: edgeHandle.left, y: edgeHandle.top };
        }
      });

      // Drag edge handle → move both connected nodes
      edgeHandle.on('moving', () => {
        if (!this.isEditMode) return;

        const deltaX = edgeHandle.left - edgeHandle._startPos.x;
        const deltaY = edgeHandle.top - edgeHandle._startPos.y;

        // Update both connected nodes based on delta
        this.properties.points[i] = {
          x: edgeHandle._startNode1.x + deltaX,
          y: edgeHandle._startNode1.y + deltaY,
        };
        this.properties.points[i + 1] = {
          x: edgeHandle._startNode2.x + deltaX,
          y: edgeHandle._startNode2.y + deltaY,
        };

        // Rebuild path with new points
        this._createPath();

        // Update all edge lines positions
        this._updateEdgeLinesPositions();

        // Update all nodes positions
        this._updateNodesPositions();

        // Update all edge handles positions
        this._updateEdgeHandlesPositions();

        this.canvas.requestRenderAll();
      });

      // End drag - notify update
      edgeHandle.on('modified', () => {
        this.notifyUpdate();
      });

      // Double click on edge handle to add node
      edgeHandle.on('mousedblclick', () => {
        if (this.isEditMode) {
          this.addNodeAtEdge(i);
        }
      });

      this.canvas.add(line);
      this.canvas.add(edgeHandle);
      
      // Store both line and handle
      line._edgeHandle = edgeHandle;
      edgeHandle._edgeLine = line;
      
      this.edgeLines.push(line);
      this.edgeHandles.push(edgeHandle);
    }

    // Reorder: path at back, then lines, then edge handles, then nodes on top
    if (this.path) {
      this.canvas.sendObjectToBack(this.path);
    }
    this.edgeLines.forEach(line => {
      this.canvas.sendObjectToBack(line);
    });

    this.canvas.requestRenderAll();
  }

  /**
   * Create visual nodes for edit mode
   */
  _createNodes() {
    this._clearNodes();

    const points = this.properties.points;

    points.forEach((point, index) => {
      const isFirst = index === 0;
      const isLast = index === points.length - 1;

      const node = new Circle({
        left: point.x,
        top: point.y,
        radius: 10,
        fill: this.selectedNodeIndex === index ? '#fbbf24' : (isFirst || isLast ? '#22c55e' : '#ef4444'),
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

      node._nodeIndex = index;
      node._bezierLineElement = this;

      // Drag node
      node.on('moving', () => {
        const idx = node._nodeIndex;
        this.properties.points[idx] = { x: node.left, y: node.top };

        // Update path
        this._createPath();
        
        // Update edge lines positions
        this._updateEdgeLinesPositions();
        
        // Update edge handles positions
        this._updateEdgeHandlesPositions();
      });

      node.on('modified', () => {
        this.notifyUpdate();
      });

      // Click to select
      node.on('mousedown', () => {
        this.selectedNodeIndex = index;
        this._highlightSelectedNode();
      });

      this.canvas.add(node);
      this.canvas.bringObjectToFront(node);
      this.nodes.push(node);
    });

    this.canvas.requestRenderAll();
  }

  /**
   * Update edge lines positions without recreating
   */
  _updateEdgeLinesPositions() {
    const points = this.properties.points;

    this.edgeLines.forEach((line, index) => {
      if (index < points.length - 1) {
        const p1 = points[index];
        const p2 = points[index + 1];
        
        if (p1 && p2) {
          line.set({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
          });
          line.setCoords();
        }
      }
    });
    
    this.canvas.requestRenderAll();
  }

  /**
   * Update edge handles positions without recreating
   */
  _updateEdgeHandlesPositions() {
    const points = this.properties.points;

    this.edgeHandles.forEach((handle, index) => {
      if (index < points.length - 1) {
        const p1 = points[index];
        const p2 = points[index + 1];
        
        if (p1 && p2) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          handle.set({
            left: midX,
            top: midY,
          });
          handle.setCoords();
        }
      }
    });
    
    this.canvas.requestRenderAll();
  }

  /**
   * Update nodes positions without recreating
   */
  _updateNodesPositions() {
    const points = this.properties.points;

    this.nodes.forEach((node, index) => {
      if (points[index]) {
        node.set({
          left: points[index].x,
          top: points[index].y,
        });
        node.setCoords();
      }
    });
    
    this.canvas.requestRenderAll();
  }

  /**
   * Highlight selected node
   */
  _highlightSelectedNode() {
    const points = this.properties.points;
    
    this.nodes.forEach((node, index) => {
      const isFirst = index === 0;
      const isLast = index === points.length - 1;
      
      node.set({
        fill: this.selectedNodeIndex === index ? '#fbbf24' : (isFirst || isLast ? '#22c55e' : '#ef4444'),
      });
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Clear all nodes
   */
  _clearNodes() {
    this.nodes.forEach(node => {
      node.off();
      this.canvas.remove(node);
    });
    this.nodes = [];
  }

  /**
   * Clear all edge lines and handles
   */
  _clearEdgeLines() {
    this.edgeLines.forEach(line => {
      line.off();
      this.canvas.remove(line);
    });
    this.edgeLines = [];
    
    this.edgeHandles.forEach(handle => {
      handle.off();
      this.canvas.remove(handle);
    });
    this.edgeHandles = [];
  }

  /**
   * Delete selected node
   */
  deleteSelectedNode() {
    if (this.selectedNodeIndex === null) {
      return false;
    }

    // Minimum 2 points
    if (this.properties.points.length <= 2) {
      return false;
    }

    // Remove point
    this.properties.points.splice(this.selectedNodeIndex, 1);
    this.selectedNodeIndex = null;

    // Rebuild
    this._createPath();
    this._createEdgeLines();
    this._createNodes();
    this.notifyUpdate();
    return true;
  }

  /**
   * Add node at edge (midpoint)
   */
  addNodeAtEdge(edgeIndex) {
    const points = this.properties.points;
    if (edgeIndex < 0 || edgeIndex >= points.length - 1) return;

    const p1 = points[edgeIndex];
    const p2 = points[edgeIndex + 1];

    // Midpoint
    const newPoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    // Insert after edgeIndex
    points.splice(edgeIndex + 1, 0, newPoint);

    // Select new node
    this.selectedNodeIndex = edgeIndex + 1;

    // Rebuild
    this._createPath();
    this._createEdgeLines();
    this._createNodes();
    this.notifyUpdate();
  }

  /**
   * Add node at position (at end of line)
   */
  addNodeAtPosition(position) {
    this.properties.points.push({ x: position.x, y: position.y });
    this.selectedNodeIndex = this.properties.points.length - 1;
    
    this._createPath();
    this._createEdgeLines();
    this._createNodes();
    this.notifyUpdate();
  }

  /**
   * Get node count
   */
  getNodeCount() {
    return this.properties.points.length;
  }

  /**
   * Get segment count (number of line segments = points - 1)
   */
  getSegmentCount() {
    return Math.max(0, this.properties.points.length - 1);
  }

  /**
   * Get selected node index
   */
  getSelectedNodeIndex() {
    return this.selectedNodeIndex;
  }

  /**
   * Get selected control point index (for compatibility)
   */
  getSelectedControlPointIndex() {
    if (this.selectedNodeIndex === null) return null;
    return { segIndex: this.selectedNodeIndex, pointIndex: 0 };
  }

  /**
   * Delete selected segment (actually deletes selected node)
   */
  deleteSelectedSegment() {
    return this.deleteSelectedNode();
  }

  /**
   * Destroy element and cleanup
   */
  destroy() {
    this._clearNodes();
    this._clearEdgeLines();
    
    if (this.path) {
      this.path.off();
      this.canvas.remove(this.path);
      this.path = null;
    }
    
    super.destroy();
  }
}

/**
 * Factory function untuk membuat LineElement (polyline)
 * @param {Canvas} canvas - Fabric.js canvas instance
 * @param {Object} options - Element options
 * @returns {BezierLineElement} New line element instance
 */
export function createBezierLineElement(canvas, options = {}) {
  // If no points provided, create default points
  const hasPoints = options.points && options.points.length > 0;
  
  if (!hasPoints) {
    // Create default line (2 points, straight)
    const centerX = options.centerX || canvas.width / 2;
    const centerY = options.centerY || canvas.height / 2;
    const offset = options.offset || 0;
    
    // Default: 2 points forming a straight horizontal line
    options.points = [
      { x: centerX - 75 + offset, y: centerY + offset },
      { x: centerX + 75 + offset, y: centerY + offset },
    ];
  }
  
  const element = new BezierLineElement(canvas, options);
  element.create();
  return element;
}

export default BezierLineElement;
