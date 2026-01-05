import { useState } from 'react';
import HeaderBar from './components/HeaderBar';
import CanvasArea from './components/CanvasArea';
import ToolboxPanel from './components/ToolboxPanel';
import PropertiesPanel from './components/PropertiesPanel';

function App() {
  const [activeTab, setActiveTab] = useState('toolbox'); // 'toolbox' atau 'properties'
  const [activeTool, setActiveTool] = useState(null); // 'shape' atau null
  const [selectedObject, setSelectedObject] = useState(null); // Object yang dipilih di canvas
  const [showGrid, setShowGrid] = useState(true);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 18px)',
      overflow: 'hidden',
      backgroundColor: '#0f0f23',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header Bar */}
      <HeaderBar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      {/* Main Content Area */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden' 
      }}>
        {/* Sidebar - Toolbox atau Properties */}
        <div style={{ 
          width: '300px', 
          minWidth: '300px',
          backgroundColor: '#15152a',
          borderRight: '1px solid #2a2a4a',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          {activeTab === 'toolbox' ? (
            <ToolboxPanel 
              activeTool={activeTool}
              onToolSelect={setActiveTool}
            />
          ) : (
            <PropertiesPanel 
              selectedObject={selectedObject}
              activeTool={activeTool}
            />
          )}
        </div>

        {/* Canvas Area */}
        <CanvasArea 
          activeTool={activeTool}
          showGrid={showGrid}
          onObjectSelect={setSelectedObject}
        />
      </div>
    </div>
  );
}

export default App;
