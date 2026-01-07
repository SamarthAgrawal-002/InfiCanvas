
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Pin, BoardState, Snapshot, PinType, DrawingStroke, DrawingPoint } from './types';
import { PinCard } from './components/PinCard';
import { Toolbar } from './components/Toolbar';
import { HistoryManager } from './utils/history';
import { COLORS, INITIAL_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from './constants';
import { 
  Search, X, MousePointer2, ZoomIn, ZoomOut, Maximize, Trash2, 
  Pencil, Eraser, Palette, Minus 
} from 'lucide-react';

const history = new HistoryManager();

const App: React.FC = () => {
  // --- State ---
  const [pins, setPins] = useState<Pin[]>([]);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#3b82f6'); // Default Blue
  const [brushWidth, setBrushWidth] = useState(4);
  const [brushType, setBrushType] = useState<'pen' | 'highlighter'>('pen');
  
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const currentStroke = useRef<DrawingStroke | null>(null);

  // --- Persistence ---
  useEffect(() => {
    const savedBoard = localStorage.getItem('pinboard_state');
    if (savedBoard) {
      try {
        const parsed = JSON.parse(savedBoard);
        setPins(parsed.pins || []);
        setStrokes(parsed.strokes || []);
        setZoom(parsed.zoom || INITIAL_ZOOM);
        setPan({ x: parsed.panX || 0, y: parsed.panY || 0 });
        history.push(parsed);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    } else {
      history.push({ pins: [], strokes: [], zoom: INITIAL_ZOOM, panX: 0, panY: 0 });
    }

    const savedSnapshots = localStorage.getItem('pinboard_snapshots');
    if (savedSnapshots) {
      setSnapshots(JSON.parse(savedSnapshots));
    }
  }, []);

  useEffect(() => {
    const boardState: BoardState = { pins, strokes, zoom, panX: pan.x, panY: pan.y };
    localStorage.setItem('pinboard_state', JSON.stringify(boardState));
  }, [pins, strokes, zoom, pan]);

  // --- Drawing Logic ---
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawStroke = (s: DrawingStroke) => {
      if (s.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width * zoom;
      ctx.globalAlpha = s.opacity;
      
      // Transform world points to screen points
      const firstPoint = s.points[0];
      ctx.moveTo((firstPoint.x + pan.x) * zoom, (firstPoint.y + pan.y) * zoom);
      
      for (let i = 1; i < s.points.length; i++) {
        const p = s.points[i];
        ctx.lineTo((p.x + pan.x) * zoom, (p.y + pan.y) * zoom);
      }
      ctx.stroke();
    };

    strokes.forEach(drawStroke);
    if (currentStroke.current) {
      drawStroke(currentStroke.current);
    }
    ctx.globalAlpha = 1.0;
  }, [strokes, pan, zoom]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        renderCanvas();
      }
    };
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [strokes, pan, zoom, renderCanvas]);

  // --- Input Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const worldX = (e.clientX - rect.left) / zoom - pan.x;
    const worldY = (e.clientY - rect.top) / zoom - pan.y;

    if (drawMode) {
      setIsDrawing(true);
      currentStroke.current = {
        id: Math.random().toString(36).substr(2, 9),
        points: [{ x: worldX, y: worldY }],
        color: brushColor,
        width: brushWidth,
        opacity: brushType === 'highlighter' ? 0.4 : 1.0,
        type: brushType
      };
    } else if (e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isDrawing && currentStroke.current) {
      const worldX = (e.clientX - rect.left) / zoom - pan.x;
      const worldY = (e.clientY - rect.top) / zoom - pan.y;
      
      currentStroke.current.points.push({ x: worldX, y: worldY });
      renderCanvas();
    } else if (isPanning) {
      const dx = (e.clientX - lastMousePos.current.x) / zoom;
      const dy = (e.clientY - lastMousePos.current.y) / zoom;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentStroke.current) {
      const newStrokes = [...strokes, currentStroke.current];
      setStrokes(newStrokes);
      currentStroke.current = null;
      setIsDrawing(false);
      history.push({ pins, strokes: newStrokes, zoom, panX: pan.x, panY: pan.y });
    }
    setIsPanning(false);
  };

  // Added handleWheel to support zooming with Ctrl + Scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY;
      const zoomChange = delta > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(prev => Math.min(Math.max(prev + zoomChange, MIN_ZOOM), MAX_ZOOM));
    }
  };

  const clearCanvas = () => {
    if (confirm("Clear all drawings?")) {
      setStrokes([]);
      history.push({ pins, strokes: [], zoom, panX: pan.x, panY: pan.y });
    }
  };

  // --- Board Actions ---
  const addPin = (type: PinType) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? (rect.width / 2) / zoom - pan.x : 100;
    const centerY = rect ? (rect.height / 2) / zoom - pan.y : 100;

    const newPin: Pin = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: centerX - 125,
      y: centerY - 100,
      content: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tags: [],
      createdAt: Date.now(),
      items: type === 'list' ? [] : undefined
    };
    
    const newPins = [...pins, newPin];
    setPins(newPins);
    history.push({ pins: newPins, strokes, zoom, panX: pan.x, panY: pan.y });
  };

  const movePin = useCallback((id: string, x: number, y: number) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
  }, []);

  const finishDrag = () => {
    history.push({ pins, strokes, zoom, panX: pan.x, panY: pan.y });
  };

  const updatePin = (id: string, updates: Partial<Pin>) => {
    setPins(pins => pins.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePin = (id: string) => {
    const newPins = pins.filter(p => p.id !== id);
    setPins(newPins);
    history.push({ pins: newPins, strokes, zoom, panX: pan.x, panY: pan.y });
  };

  const handleUndo = () => {
    const state = history.undo();
    if (state) {
      setPins(state.pins);
      setStrokes(state.strokes || []);
      setZoom(state.zoom);
      setPan({ x: state.panX, y: state.panY });
    }
  };

  const handleRedo = () => {
    const state = history.redo();
    if (state) {
      setPins(state.pins);
      setStrokes(state.strokes || []);
      setZoom(state.zoom);
      setPan({ x: state.panX, y: state.panY });
    }
  };

  const saveSnapshot = () => {
    const name = prompt("Enter snapshot name:", `Board ${new Date().toLocaleTimeString()}`);
    if (!name) return;
    const newSnapshot: Snapshot = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      timestamp: Date.now(),
      data: { pins, strokes, zoom, panX: pan.x, panY: pan.y }
    };
    const newSnapshots = [newSnapshot, ...snapshots];
    setSnapshots(newSnapshots);
    localStorage.setItem('pinboard_snapshots', JSON.stringify(newSnapshots));
  };

  const restoreSnapshot = (s: Snapshot) => {
    setPins(s.data.pins);
    setStrokes(s.data.strokes || []);
    setZoom(s.data.zoom);
    setPan({ x: s.data.panX, y: s.data.panY });
    history.push(s.data);
    setIsHistoryOpen(false);
  };

  const deleteSnapshot = (id: string) => {
    const next = snapshots.filter(s => s.id !== id);
    setSnapshots(next);
    localStorage.setItem('pinboard_snapshots', JSON.stringify(next));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const filteredPins = pins.filter(p => {
    if (!filter) return true;
    const search = filter.toLowerCase();
    return (
      p.content.toLowerCase().includes(search) ||
      p.tags.some(t => t.toLowerCase().includes(search)) ||
      p.items?.some(i => i.text.toLowerCase().includes(search))
    );
  });

  return (
    <div className="relative w-screen h-screen bg-gray-50 overflow-hidden select-none">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-[100] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <MousePointer2 className="text-white fill-current" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">PinBoard Pro</h1>
            <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">Creative Canvas</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDrawMode(!drawMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                drawMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Pencil size={14} />
              {drawMode ? 'DRAWING MODE ON' : 'ENABLE DRAWING'}
            </button>
          </div>
          <div className="h-6 w-[1px] bg-gray-200" />
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ZoomOut size={18} /></button>
            <span className="text-xs font-bold text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ZoomIn size={18} /></button>
            <button onClick={resetView} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600"><Maximize size={18} /></button>
          </div>
        </div>
      </div>

      {/* Drawing Toolbar Overlay */}
      {drawMode && (
        <div className="absolute top-20 right-8 z-[150] bg-white p-3 rounded-2xl shadow-2xl border border-gray-200 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setBrushType('pen')}
                className={`p-2 rounded-lg ${brushType === 'pen' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => setBrushType('highlighter')}
                className={`p-2 rounded-lg ${brushType === 'highlighter' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Palette size={18} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Size</span>
            <input 
              type="range" min="1" max="20" 
              value={brushWidth} 
              onChange={(e) => setBrushWidth(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Color</span>
            <div className="grid grid-cols-3 gap-1">
              {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                <button 
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${brushColor === c ? 'border-gray-900' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button 
            onClick={clearCanvas}
            className="flex items-center justify-center gap-2 p-2 mt-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
          >
            <Eraser size={14} /> CLEAR
          </button>
        </div>
      )}

      {/* Main Canvas Container */}
      <div 
        id="canvas-container"
        ref={containerRef}
        className={`w-full h-full relative cursor-${drawMode ? 'crosshair' : isPanning ? 'grabbing' : 'default'} transition-colors canvas-grid`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Native Drawing Layer */}
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 z-20 pointer-events-none"
        />

        {/* Infinite Transformable Layer */}
        <div 
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            width: '1px',
            height: '1px',
          }}
          className={`relative ${drawMode ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          {/* Pins Layer */}
          <div className="pointer-events-auto">
            {filteredPins.map(pin => (
              <PinCard 
                key={pin.id}
                pin={pin}
                zoom={zoom}
                onMove={movePin}
                onUpdate={updatePin}
                onDelete={deletePin}
                onDragStart={() => {}} 
                onDragEnd={finishDrag}
              />
            ))}
          </div>
        </div>
      </div>

      <Toolbar 
        onAddPin={addPin}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo()}
        canRedo={history.canRedo()}
        onSaveSnapshot={saveSnapshot}
        onOpenSnapshots={() => setIsHistoryOpen(true)}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Snapshot Sidebar */}
      {isHistoryOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex justify-end">
          <div className="w-96 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Snapshots</h2>
                <p className="text-xs text-gray-500">Restore previous versions</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {snapshots.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No snapshots saved yet.</div>
              ) : (
                snapshots.map(s => (
                  <div key={s.id} className="group border border-gray-100 p-4 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer" onClick={() => restoreSnapshot(s)}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-800 group-hover:text-blue-700">{s.name}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSnapshot(s.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <p className="text-gray-400 font-medium">{new Date(s.timestamp).toLocaleString()}</p>
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{s.data.pins.length} pins</span>
                        {s.data.strokes && s.data.strokes.length > 0 && (
                          <span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{s.data.strokes.length} strokes</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions / Hints */}
      <div className="absolute top-20 left-8 flex flex-col gap-2 pointer-events-none opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
          <kbd className="px-2 py-1 bg-white border rounded shadow-sm">CTRL</kbd> + <kbd className="px-2 py-1 bg-white border rounded shadow-sm">Scroll</kbd> to Zoom
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
          <kbd className="px-2 py-1 bg-white border rounded shadow-sm">Middle Click</kbd> to Pan
        </div>
      </div>
    </div>
  );
};

export default App;
