# Rencana Pengembangan Canvas Editor

## Overview
Aplikasi ini dikembangkan menjadi **Canvas Editor** yang fleksibel, di mana pengguna dapat menambahkan berbagai komponen visual (elemen, text, dll.) ke dalam satu canvas utama. Setiap komponen memiliki properti unik dan ID yang unik, memungkinkan editing individual dan manajemen yang terstruktur.

## Visi Aplikasi
- **Canvas Editor**: Platform untuk membuat dan mengedit desain visual dengan komponen modular.
- **Komponen Modular**: PolygonShape sebagai komponen awal, dengan ekspansi ke TextShape, ImageShape, BezierLineShape, dll.
- **Multi-Instance**: Mendukung multiple instance dari setiap komponen dalam satu canvas.
- **Properti Dinamis**: Setiap komponen memiliki properti unik yang dapat diedit melalui UI.

## Kondisi Saat Ini (Januari 2026)
- **Canvas Editor Utama**: Diimplementasi dengan Fabric.js sebagai satu canvas utama.
- **Multiple Elements Support**: Mendukung 4 jenis elemen: Polygon, Text, Image, dan BezierLine.
- **State Management**: Menggunakan custom hook `useCanvasEditor` untuk mengelola state elemen.
- **UI Components**: Sidebar untuk add elemen, PropertiesPanel untuk edit properti, FloatingToolbar untuk controls.
- **Fitur Canvas**: Pan/zoom, grid overlay, fit view, selection handling, keyboard shortcuts.
- **Element Management**: Add, select, update, delete, group/ungroup elemen.
- **Base Architecture**: Class-based element system dengan BaseElement sebagai abstract class.

## Arsitektur yang Diimplementasi

### 1. Canvas Editor (Komponen Utama)
- **Canvas Utama**: Satu canvas Fabric.js yang menampung semua elemen.
- **State Management**: Custom hook `useCanvasEditor` untuk mengelola daftar elemen.
- **Layout**:
  - Kiri (floating yang bisa di collapse): Sidebar menu komponen
  - Kanan: Canvas area dengan floating controls
  - Kanan (floating): Properties panel untuk elemen yang dipilih

### 2. Sidebar/Menu Komponen
- **Daftar Komponen**: Button untuk setiap tipe komponen (Polygon, Text, Image, BezierLine, Symbol - ongoing)
- **Add Elemen**: Klik button → tambah instance baru ke canvas dengan ID unik.
- **Image Upload**: File picker untuk upload gambar.

### 3. Komponen Elemen
- **PolygonElement**: Refactored dari komponen lama, mendukung edit nodes, warna, border.
- **TextElement**: Komponen untuk text editing dengan font properties.
- **ImageElement**: Komponen untuk image dengan resize dan positioning.
- **BezierLineElement**: Komponen untuk curved lines dengan control points.
- **BaseElement**: Abstract class untuk konsistensi interface semua elemen.

### 4. State Management
- **Elemen Array**: Array of elemen objects, masing-masing dengan:
  - `id`: UUID unik
  - `type`: 'polygon', 'text', 'image', 'bezierLine'
  - `properties`: Object properti spesifik (fillColor, strokeColor, fontSize, dll.)
  - `fabricObjects`: Reference ke Fabric.js objects
- **Selected Elemen**: ID elemen yang sedang dipilih untuk editing properties.
- **Group Support**: Multiple selection dan grouping.

## Breakdown Komponen

### CanvasEditor.jsx
```jsx
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

  // Functions: drawGrid, fitView, handleKeyDown, handleCanvasEvents, dll.
}
```

### Sidebar.jsx
```jsx
function Sidebar({ onAddElement, collapsed = true, onToggleCollapse }) {
  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAddElement('image', { src: url });
    }
  };

  return (
    <div>
      <button onClick={() => onAddElement('polygon')}>Add Shape</button>
      <button onClick={() => onAddElement('bezierLine')}>Add Line</button>
      <button onClick={() => onAddElement('text')}>Add Text</button>
      <button onClick={handleAddImage}>Add Image</button>
      <button onClick={() => onAddElement('symbol')}>Add Machine Symbol</button>
    </div>
  );
}
```

### BaseElement.js (Abstract Class)
```javascript
export class BaseElement {
  constructor(canvas, options = {}) {
    this.id = options.id || uuidv4();
    this.type = 'base';
    this.canvas = canvas;
    this.fabricObjects = [];
    this.isEditMode = false;
    this.isSelected = false;

    // Event callbacks
    this.onSelect = options.onSelect || null;
    this.onDeselect = options.onDeselect || null;
    this.onUpdate = options.onUpdate || null;
    this.onDelete = options.onDelete || null;
  }

  create() { throw new Error('create() must be implemented by subclass'); }
  update(properties) { /* Update properties */ }
  destroy() { /* Cleanup */ }
  getProperties() { /* Return current properties */ }
  setEditMode(enabled) { /* Toggle edit mode */ }
}
```

### PropertiesPanel.jsx
- **Dynamic Rendering**: Render properti berdasarkan tipe elemen (PolygonProperties, TextProperties, dll.)
- **Real-time Updates**: Perubahan langsung terlihat di canvas.
- **Edit Mode Toggle**: Toggle edit mode untuk elemen tertentu.

## Langkah Implementasi

### Phase 1: Refactor PolygonShape
1. **Extract Logic**: Pisahkan logic canvas dari React component.
2. **Create Elemen Factory**: Function untuk membuat PolygonShape instance dengan ID dan properties.
3. **Integrate to Canvas**: Tambahkan ke canvas utama, bukan canvas sendiri.

### Phase 2: Canvas Editor Utama
1. **Setup Canvas**: Buat canvas Fabric.js utama.
2. **State Management**: Implementasi elemen array dan selectedElemenId.
3. **Add Elemen Functionality**: Function untuk menambah elemen baru.

### Phase 3: Sidebar dan Properties Panel
1. **Sidebar**: UI untuk add elemen.
2. **Properties Panel**: Dynamic form berdasarkan elemen type dan properties.

### Phase 4: Multiple Elemen Support
1. **Selection Handling**: Klik elemen untuk select dan show properties.
2. **Edit Mode per Elemen**: Toggle edit mode untuk elemen yang dipilih.
3. **Delete Elemen**: Remove elemen dari canvas dan state.

### Phase 5: TextShape Component
1. **Implement TextShape**: Mirip PolygonShape tapi untuk text editing.
2. **Add to Sidebar**: Button untuk add text.

### Phase 6: Persistence dan Export
1. **Save/Load**: Simpan elemen ke localStorage atau file.
2. **Export**: Export canvas sebagai image atau JSON.

## Fitur yang Telah Diimplementasi

### Elemen Management
- **Add Elemen**: Klik menu → tambah ke canvas dengan posisi default.
- **Select Elemen**: Klik elemen → highlight dan show properties.
- **Delete Elemen**: Delete key atau button di properties panel.
- **Multiple Selection**: Shift+click untuk select multiple, group/ungroup.
- **Duplicate Elemen**: Copy elemen dengan properties baru (ongoing).

### Properties Editing
- **Per Elemen**: Setiap elemen punya properti independen.
- **Real-time Update**: Perubahan langsung terlihat di canvas.
- **Validation**: Validasi input (misal min 3 nodes untuk polygon).
- **Specific Properties**:
  - Polygon: Fill color, stroke color, stroke width, nodes editing
  - Text: Font family, size, color, alignment, bold/italic
  - Image: Scale, position, opacity
  - BezierLine: Control points, stroke properties

### Canvas Features
- **Zoom/Pan**: Mouse wheel zoom, space+drag pan.
- **Grid**: Toggle on/off, adaptive grid spacing.
- **Fit View**: Zoom to fit all elemen.
- **Snap to Grid**: Optional snapping saat drag (ongoing).
- **Keyboard Shortcuts**: V (select), H (pan), Delete (remove).

### Tools dan Controls
- **Active Tool**: Select, pan modes.
- **Floating Toolbar**: Quick access controls.
- **Selection Handling**: Single dan multiple selection.

## Tantangan Teknis yang Telah Diselesaikan

### 1. Fabric.js Integration
- **Multiple Objects**: Manage multiple Fabric objects dalam satu canvas.
- **Event Handling**: Handle selection, drag, dll. untuk multiple elemen.
- **Performance**: Optimasi untuk banyak elemen dengan selective rendering.

### 2. State Synchronization
- **React State ↔ Fabric Objects**: Sync properties antara React state dan Fabric objects.
- **Avoid Re-renders**: Gunakan refs untuk Fabric objects dan callbacks.

### 3. Component Architecture
- **Modular Elemen**: Design interface yang konsisten untuk semua elemen types.
- **Dynamic Properties**: Properties panel yang adaptif berdasarkan elemen type.

### 4. ID Management
- **Unique IDs**: Generate UUID untuk setiap elemen.
- **Reference Management**: Map ID ke Fabric object dan sebaliknya.

### 1. Fabric.js Integration
- **Multiple Objects**: Manage multiple Fabric objects dalam satu canvas.
- **Event Handling**: Handle selection, drag, dll. untuk multiple elemen.
- **Performance**: Optimasi untuk banyak elemen.

### 2. State Synchronization
- **React State ↔ Fabric Objects**: Sync properties antara React state dan Fabric objects.
- **Avoid Re-renders**: Gunakan refs untuk Fabric objects.

### 3. Component Architecture
- **Modular Elemen**: Design interface yang konsisten untuk semua elemen types.
- **Dynamic Properties**: Properties panel yang adaptif berdasarkan elemen type.

### 4. ID Management
- **Unique IDs**: Generate UUID untuk setiap elemen.
- **Reference Management**: Map ID ke Fabric object dan sebaliknya.

## Timeline Implementasi (Completed)

### Phase 1-2: Refactor PolygonShape & Canvas Editor Utama ✅
- Refactor PolygonShape menjadi PolygonElement class
- Setup Canvas Editor utama dengan Fabric.js
- Implementasi state management dengan useCanvasEditor hook

### Phase 3: Sidebar dan Properties Panel ✅
- Sidebar dengan button untuk add elemen
- PropertiesPanel dengan dynamic rendering
- File picker untuk image upload

### Phase 4: Multiple Elemen Support ✅
- Selection handling untuk multiple elemen
- Edit mode per elemen
- Delete elemen dari canvas dan state
- Group/ungroup functionality

### Phase 5: TextShape Component ✅
- TextElement implementation
- Font properties editing
- Text editing mode

### Phase 6: Additional Elements ✅
- ImageElement dengan upload dan resize
- BezierLineElement dengan control points
- BaseElement abstract class

### Phase 7: Canvas Features ✅
- Pan/zoom dengan mouse wheel
- Grid overlay dengan toggle
- Fit view functionality
- Keyboard shortcuts

## Testing Strategy
- **Unit Tests**: Test functions untuk add/update/delete elemen (planned).
- **Integration Tests**: Test interaksi antara components (planned).
- **UI Tests**: Test canvas interactions (drag, select, dll.) (planned).

## Future Extensions
- **More Elemen Types**: Circle, Rectangle, Arrow, dll.
- **Grouping**: Enhanced group management dengan nested groups.
- **Layers**: Layer management untuk z-index dan visibility.
- **Undo/Redo**: History untuk actions dengan command pattern.
- **Persistence**: Save/Load canvas sebagai JSON atau file.
- **Export**: Export canvas sebagai image atau SVG.
- **Collaboration**: Real-time editing (advanced).
- **Templates**: Save/load templates.
- **Symbol Library**: Predefined symbols untuk machine diagrams.
- **Snap to Grid/Objects**: Enhanced snapping functionality.
- **Ruler/Guides**: Measurement tools.

## Dependencies
- **Fabric.js**: ^7.1.0 - Untuk canvas manipulation.
- **React**: ^19.2.0 - UI framework.
- **UUID**: ^13.0.0 - Untuk generate unique IDs.
- **Lucide React**: ^0.561.0 - Icon library.
- **Vite**: ^7.2.4 - Build tool.
- **ESLint**: ^9.39.1 - Code linting.

---

*Dokumen ini diupdate pada Januari 2026 berdasarkan implementasi yang telah selesai. Beberapa fitur future extensions masih dalam development.*

## File Structure Saat Ini
```
src/components/canvas-editor/
├── CanvasEditor.jsx          # Main canvas component
├── CanvasEditorTest.jsx      # Test component
├── index.js                  # Barrel export
├── components/
│   ├── Sidebar.jsx           # Add elements menu
│   ├── PropertiesPanel.jsx   # Properties editor
│   ├── FloatingToolbar.jsx   # Quick controls
│   ├── PolygonProperties.jsx # Polygon-specific props
│   ├── TextProperties.jsx    # Text-specific props
│   ├── ImageProperties.jsx   # Image-specific props
│   ├── LineProperties.jsx    # Line-specific props
│   └── index.js
├── elements/
│   ├── base-element.js       # Abstract base class
│   ├── polygon-element.js    # Polygon implementation
│   ├── text-element.js       # Text implementation
│   ├── image-element.js      # Image implementation
│   ├── bezier-line-element.js # Bezier line implementation
│   └── index.js
├── hooks/
│   ├── useCanvasEditor.js    # State management hook
│   └── index.js
└── styles/
    ├── editor-styles.js      # Main styles
    ├── scrollbar.css         # Custom scrollbar
    └── index.js
```