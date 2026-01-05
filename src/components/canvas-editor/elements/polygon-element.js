import { Polygon, Circle, Line, util as fabricUtil } from 'fabric';
import { BaseElement } from './base-element.js';

/**
 * PolygonElement - Polygon shape element untuk canvas editor
 * 
 * Features:
 * - Customizable fill color
 * - Optional border with color and width
 * - Edit mode untuk manipulasi nodes
 * - Add/remove/move nodes
 */
export class PolygonElement extends BaseElement {
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    this.type = 'polygon';
    
    // Polygon-specific properties
    this.properties = {
      fillColor: options.fillColor || '#3b82f6',
      strokeColor: options.strokeColor || '#1e40af',
      hasBorder: options.hasBorder !== undefined ? options.hasBorder : true,
      strokeWidth: options.strokeWidth || 3,
      shapeType: options.shapeType || 'freeform',
      transparentFill: options.transparentFill || false,
      points: options.points || [
        { x: 200, y: 150 },
        { x: 400, y: 150 },
        { x: 400, y: 350 },
        { x: 200, y: 350 },
      ],
    };

    // Internal refs
    this.polygon = null;
    this.nodes = [];
    this.edgeLines = [];
    this.selectedNodeIndex = null;
  }

  /**
   * Create the polygon on canvas
   */
  create() {
    this._createPolygon(false);
    return this;
  }

  /**
   * Update polygon properties
   * @param {Object} newProperties - Properties to update
   */
  update(newProperties) {
    // Merge new properties
    Object.assign(this.properties, newProperties);
    
    // If shapeType changed, regenerate points
    if (newProperties.shapeType && newProperties.shapeType !== 'freeform') {
      const newPoints = this._generatePointsForShape(newProperties.shapeType);
      this.properties.points = newPoints;
    }
    
    // If points changed, rebuild polygon
    if (newProperties.points || newProperties.shapeType) {
      this._rebuildPolygon(this.isEditMode);
      if (this.isEditMode) {
        this._createEdgeLines();
        this._createNodes();
      }
    } else {
      // Just update style
      this._updatePolygonStyle();
    }
    
    this.notifyUpdate();
  }

  /**
   * Get current properties
   * @returns {Object} Current polygon properties
   */
  getProperties() {
    return { ...this.properties };
  }

  /**
   * Toggle edit mode
   * @param {boolean} enabled - Whether edit mode is enabled
   */
  setEditMode(enabled) {
    super.setEditMode(enabled);
    
    if (enabled) {
      // Enter edit mode - deselect polygon first
      this.canvas.discardActiveObject();
      this.selectedNodeIndex = null;
      
      // Get absolute vertices from current polygon
      if (this.polygon) {
        this.properties.points = this._getAbsoluteVertices(this.polygon);
      }
      
      this._rebuildPolygon(true);
      this._createEdgeLines();
      this._createNodes();
    } else {
      // Exit edit mode
      this._clearNodes();
      this._clearEdgeLines();
      this.selectedNodeIndex = null;
      this._rebuildPolygon(false);
    }
  }

  /**
   * Select the polygon (for non-edit mode)
   */
  selectPolygon() {
    if (this.polygon && !this.isEditMode) {
      this.canvas.setActiveObject(this.polygon);
      this.canvas.requestRenderAll();
    }
    this.select();
  }

  /**
   * Delete selected node (edit mode only)
   * @returns {boolean} Whether deletion was successful
   */
  deleteSelectedNode() {
    if (this.selectedNodeIndex === null) {
      return false;
    }

    // Minimum 3 nodes for polygon
    if (this.properties.points.length <= 3) {
      return false;
    }

    // Remove point
    this.properties.points.splice(this.selectedNodeIndex, 1);
    this.selectedNodeIndex = null;

    // Rebuild everything
    this._rebuildPolygon(true);
    this._createEdgeLines();
    this._createNodes();
    
    this.notifyUpdate();
    return true;
  }

  /**
   * Add node at edge
   * @param {number} edgeIndex - Index of the edge to add node at
   */
  addNodeAtEdge(edgeIndex) {
    const points = this.properties.points;
    const nextIndex = (edgeIndex + 1) % points.length;

    const p1 = points[edgeIndex];
    const p2 = points[nextIndex];

    // Midpoint
    const newPoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    // Insert after edgeIndex
    points.splice(edgeIndex + 1, 0, newPoint);

    // Select new node
    this.selectedNodeIndex = edgeIndex + 1;

    // Rebuild everything
    this._rebuildPolygon(true);
    this._createEdgeLines();
    this._createNodes();
    
    this.notifyUpdate();
  }

  /**
   * Add node at position (for double-click on canvas)
   * @param {Object} position - {x, y} position
   */
  addNodeAtPosition(position) {
    this.properties.points.push({ x: position.x, y: position.y });
    this.selectedNodeIndex = this.properties.points.length - 1;
    
    this._rebuildPolygon(true);
    this._createEdgeLines();
    this._createNodes();
    
    this.notifyUpdate();
  }

  /**
   * Get node count
   * @returns {number} Number of nodes
   */
  getNodeCount() {
    return this.properties.points.length;
  }

  /**
   * Get selected node index
   * @returns {number|null} Selected node index or null
   */
  getSelectedNodeIndex() {
    return this.selectedNodeIndex;
  }

  /**
   * Destroy element and cleanup
   */
  destroy() {
    this._clearNodes();
    this._clearEdgeLines();
    
    if (this.polygon) {
      this.polygon.off();
      this.canvas.remove(this.polygon);
      this.polygon = null;
    }
    
    super.destroy();
  }

  // ==================== Private Methods ====================

  /**
   * Create polygon Fabric object
   * @param {boolean} isEditMode - Whether in edit mode
   */
  _createPolygon(isEditMode) {
    this._rebuildPolygon(isEditMode);
  }

  /**
   * Rebuild polygon from points
   * @param {boolean} isEditMode - Whether in edit mode
   */
  _rebuildPolygon(isEditMode) {
    const currentPoints = this.properties.points;

    if (currentPoints.length < 3) return;

    // Remove old polygon
    if (this.polygon) {
      this.polygon.off();
      this.canvas.remove(this.polygon);
      this.polygon = null;
    }

    // Create new polygon with absolute points
    const polygon = new Polygon([...currentPoints], {
      fill: this.properties.transparentFill ? null : this.properties.fillColor,
      stroke: this.properties.hasBorder ? this.properties.strokeColor : null,
      strokeWidth: this.properties.hasBorder ? this.properties.strokeWidth : 0,
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

    // Store reference to this element on the Fabric object
    polygon._polygonElement = this;

    this.polygon = polygon;
    this.fabricObjects = [polygon];
    this.canvas.add(polygon);
    this.canvas.sendObjectToBack(polygon);
    this.canvas.requestRenderAll();
  }

  /**
   * Update polygon style without rebuilding
   */
  _updatePolygonStyle() {
    if (!this.polygon) return;

    this.polygon.set({
      fill: this.properties.transparentFill ? null : this.properties.fillColor,
      stroke: this.properties.hasBorder ? this.properties.strokeColor : null,
      strokeWidth: this.properties.hasBorder ? this.properties.strokeWidth : 0,
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Get absolute vertex coordinates from transformed polygon
   * @param {Polygon} polygon - Fabric polygon object
   * @returns {Array} Array of absolute points
   */
  _getAbsoluteVertices(polygon) {
    if (!polygon) return [];

    const matrix = polygon.calcTransformMatrix();

    return polygon.points.map(p => {
      const localX = p.x - polygon.pathOffset.x;
      const localY = p.y - polygon.pathOffset.y;
      const transformed = fabricUtil.transformPoint({ x: localX, y: localY }, matrix);
      return { x: transformed.x, y: transformed.y };
    });
  }

  /**
   * Clear all nodes from canvas
   */
  _clearNodes() {
    this.nodes.forEach(node => {
      node.off();
      this.canvas.remove(node);
    });
    this.nodes = [];
  }

  /**
   * Clear all edge lines from canvas
   */
  _clearEdgeLines() {
    this.edgeLines.forEach(line => {
      line.off();
      this.canvas.remove(line);
    });
    this.edgeLines = [];
  }

  /**
   * Create edge lines for edit mode
   */
  _createEdgeLines() {
    this._clearEdgeLines();

    const points = this.properties.points;

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

      line._edgeIndex = index;
      line._polygonElement = this;

      // Double click on edge to add node
      line.on('mousedblclick', () => {
        if (this.isEditMode) {
          this.addNodeAtEdge(index);
        }
      });

      this.canvas.add(line);
      this.edgeLines.push(line);
    });

    // Reorder: polygon at back, then lines, then nodes
    if (this.polygon) {
      this.canvas.sendObjectToBack(this.polygon);
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
      const node = new Circle({
        left: point.x,
        top: point.y,
        radius: 10,
        fill: this.selectedNodeIndex === index ? '#22c55e' : '#ef4444',
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
      node._polygonElement = this;

      // Drag node → update point and sync visuals
      node.on('moving', () => {
        const idx = node._nodeIndex;
        this.properties.points[idx] = { x: node.left, y: node.top };

        // Rebuild polygon with new points
        this._rebuildPolygon(true);

        // Update edge lines positions
        this._updateEdgeLinesPositions();

        this.canvas.requestRenderAll();
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
    const lines = this.edgeLines;

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
  }

  /**
   * Highlight selected node
   */
  _highlightSelectedNode() {
    this.nodes.forEach((node, index) => {
      node.set({
        fill: this.selectedNodeIndex === index ? '#22c55e' : '#ef4444',
      });
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Generate points for preset shapes
   * @param {string} shapeType - Type of shape
   * @returns {Array} Array of points
   */
  _generatePointsForShape(shapeType) {
    // Calculate center and size from current points
    const points = this.properties.points;
    if (points.length === 0) return points;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    const size = Math.max(width, height) / 2;

    switch (shapeType) {
      case 'triangle':
        return [
          { x: centerX, y: centerY - size },
          { x: centerX - size * 0.866, y: centerY + size * 0.5 },
          { x: centerX + size * 0.866, y: centerY + size * 0.5 },
        ];
      case 'square':
        return [
          { x: centerX - size, y: centerY - size },
          { x: centerX + size, y: centerY - size },
          { x: centerX + size, y: centerY + size },
          { x: centerX - size, y: centerY + size },
        ];
      case 'diamond':
        return [
          { x: centerX, y: centerY - size },
          { x: centerX + size, y: centerY },
          { x: centerX, y: centerY + size },
          { x: centerX - size, y: centerY },
        ];
      case 'parallelogram':
        return [
          { x: centerX - size * 0.8, y: centerY - size },
          { x: centerX + size * 1.2, y: centerY - size },
          { x: centerX + size, y: centerY + size },
          { x: centerX - size * 0.2, y: centerY + size },
        ];
      case 'pentagon':
        const pentagonPoints = [];
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          pentagonPoints.push({
            x: centerX + size * Math.cos(angle),
            y: centerY + size * Math.sin(angle),
          });
        }
        return pentagonPoints;
      case 'hexagon':
        const hexagonPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * 2 * Math.PI) / 6;
          hexagonPoints.push({
            x: centerX + size * Math.cos(angle),
            y: centerY + size * Math.sin(angle),
          });
        }
        return hexagonPoints;
      case 'circle':
        // For circle, we'll create a circular polygon with many points
        const circlePoints = [];
        const numPoints = 32;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          circlePoints.push({
            x: centerX + size * Math.cos(angle),
            y: centerY + size * Math.sin(angle),
          });
        }
        return circlePoints;
      default:
        return points; // Keep current points for freeform
    }
  }
}

/**
 * Factory function untuk membuat PolygonElement
 * @param {Canvas} canvas - Fabric.js canvas instance
 * @param {Object} options - Element options
 * @returns {PolygonElement} New polygon element instance
 */
export function createPolygonElement(canvas, options = {}) {
  const element = new PolygonElement(canvas, options);
  element.create();
  return element;
}

export default PolygonElement;

