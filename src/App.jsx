// Canvas Editor - Phase 2: Multiple elements support
// Uncomment the import you want to use:

// Original monolithic component (for comparison)
// import PolygonShape from "./components/polygon-shape";

// Phase 1 Test (single element)
// import { CanvasEditorTest } from "./components/canvas-editor";

// Phase 2: Full Canvas Editor with multiple elements
import { CanvasEditor } from "./components/canvas-editor";

function App() {
  return (
    // Original:
    // <PolygonShape />
    
    // Phase 1 Test:
    // <CanvasEditorTest />
    
    // Phase 2: Full Canvas Editor
    <CanvasEditor />
  );
}

export default App;
