# Rencana Pengembangan Canvas Editor

## Overview
Aplikasi ini akan dikembangkan menjadi **Canvas Editor** yang fleksibel, di mana pengguna dapat menambahkan berbagai komponen visual (elemen, text, dll.) ke dalam satu canvas utama. Setiap komponen memiliki properti unik dan ID yang unik, memungkinkan editing individual dan manajemen yang terstruktur.

## Visi Aplikasi
- **Canvas Editor**: Platform untuk membuat dan mengedit desain visual dengan komponen modular.
- **Komponen Modular**: PolygonShape sebagai komponen awal, dengan rencana ekspansi ke TextShape, ImageShape, dll.
- **Multi-Instance**: Mendukung multiple instance dari setiap komponen dalam satu canvas.
- **Properti Dinamis**: Setiap komponen memiliki properti unik yang dapat diedit melalui UI.

## Kondisi Saat Ini
- **PolygonShape**: Komponen utama dengan canvas sendiri, fitur edit nodes, warna, border, dll.
- **Struktur**: Canvas terintegrasi dalam komponen, tidak modular untuk multiple elemen.
- **Keterbatasan**: Tidak bisa menambahkan multiple elemen atau komponen lain dalam satu canvas.

## Arsitektur yang Diusulkan

### 1. Canvas Editor (Komponen Utama)
- **Canvas Utama**: Satu canvas Fabric.js yang menampung semua elemen.
- **State Management**: Menggunakan React state atau Context untuk mengelola daftar elemen.
- **Layout**: 
  - Kiri (floating yang bisa di collapse): Sidebar menu komponen
  - Kanan: Canvas area dengan floating controls
  - Kanan (floating): Properties panel untuk elemen yang dipilih

### 2. Sidebar/Menu Komponen
- **Daftar Komponen**: Button untuk setiap tipe komponen (PolygonShape, TextShape, dll.)
- **Add Elemen**: Klik button → tambah instance baru ke canvas dengan ID unik.

### 3. Komponen Elemen
- **PolygonShape**: Refactor dari komponen saat ini menjadi komponen yang bisa di-instantiate multiple.
- **TextShape**: Komponen baru untuk text editing.
- **Base Shape Class**: Interface umum untuk semua elemen (ID, position, properties).

### 4. State Management
- **Elemen Array**: Array of elemen objects, masing-masing dengan:
  - `id`: UUID unik
  - `type`: 'polygon', 'text', dll.
  - `properties`: Object properti spesifik (fillColor, strokeColor, dll.)
  - `fabricObject`: Reference ke Fabric.js object
- **Selected Elemen**: ID elemen yang sedang dipilih untuk editing properties.

## Breakdown Komponen

### CanvasEditor.jsx
```jsx
function CanvasEditor() {
  const [elemen, setElemen] = useState([]);
  const [selectedElemenId, setSelectedElemenId] = useState(null);
  const canvasRef = useRef(null);
  const canvasInstanceRef = useRef(null);

  // Functions: addElemen, selectElemen, updateElemenProperties, deleteElemen
}
```

### Sidebar.jsx
```jsx
function Sidebar({ onAddElemen }) {
  return (
    <div>
      <button onClick={() => onAddElemen('polygon')}>Add Polygon</button>
      <button onClick={() => onAddElemen('text')}>Add Text</button>
    </div>
  );
}
```

### PolygonShape.jsx (Refactored)
- Bukan komponen React lagi, tapi class/function yang membuat Fabric.js objects.
- Menerima `id`, `properties`, dan callback untuk update.

### PropertiesPanel.jsx
- Menampilkan properti elemen yang dipilih.
- Input fields untuk edit properti.

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

## Fitur Utama

### Elemen Management
- **Add Elemen**: Klik menu → tambah ke canvas dengan posisi default.
- **Select Elemen**: Klik elemen → highlight dan show properties.
- **Delete Elemen**: Delete key atau button di properties panel.
- **Duplicate Elemen**: Copy elemen dengan properties baru.

### Properties Editing
- **Per Elemen**: Setiap elemen punya properti independen.
- **Real-time Update**: Perubahan langsung terlihat di canvas.
- **Validation**: Validasi input (misal min 3 nodes untuk polygon).

### Canvas Features
- **Zoom/Pan**: Tetap dari implementasi sekarang.
- **Grid**: Toggle on/off.
- **Fit View**: Zoom to fit all elemen.
- **Snap to Grid**: Optional snapping saat drag.

## Tantangan Teknis

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

## Timeline Estimasi

### Week 1-2: Phase 1-2
- Refactor PolygonShape
- Setup Canvas Editor utama

### Week 3: Phase 3
- Sidebar dan Properties Panel

### Week 4: Phase 4
- Multiple elemen support

### Week 5: Phase 5
- TextShape implementation

### Week 6: Phase 6
- Persistence dan export

## Testing Strategy
- **Unit Tests**: Test functions untuk add/update/delete elemen.
- **Integration Tests**: Test interaksi antara components.
- **UI Tests**: Test canvas interactions (drag, select, dll.).

## Future Extensions
- **More Elemen Types**: Circle, Rectangle, Line, dll.
- **Grouping**: Group multiple elemen.
- **Layers**: Layer management untuk z-index.
- **Undo/Redo**: History untuk actions.
- **Collaboration**: Real-time editing (advanced).
- **Templates**: Save/load templates.

## Dependencies
- **Fabric.js**: Untuk canvas manipulation.
- **React**: UI framework.
- **UUID**: Untuk generate unique IDs.
- **Potentially**: Redux/Zustand untuk complex state management jika diperlukan.

---

*Dokumen ini akan diupdate seiring perkembangan implementasi.*