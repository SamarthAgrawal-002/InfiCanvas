
import React from 'react';
import { Type, Image as ImageIcon, List, Undo2, Redo2, Save, History, Search } from 'lucide-react';

interface ToolbarProps {
  onAddPin: (type: 'text' | 'image' | 'list') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveSnapshot: () => void;
  onOpenSnapshots: () => void;
  filter: string;
  onFilterChange: (val: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddPin,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveSnapshot,
  onOpenSnapshots,
  filter,
  onFilterChange
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[100]">
      {/* Creation Group */}
      <div className="flex items-center gap-1 bg-white p-2 rounded-2xl shadow-2xl border border-gray-200">
        <button 
          onClick={() => onAddPin('text')}
          className="p-3 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group flex flex-col items-center gap-1"
          title="Add Text Note"
        >
          <Type size={20} />
          <span className="text-[10px] font-bold">TEXT</span>
        </button>
        <button 
          onClick={() => onAddPin('image')}
          className="p-3 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all group flex flex-col items-center gap-1"
          title="Add Image"
        >
          <ImageIcon size={20} />
          <span className="text-[10px] font-bold">IMAGE</span>
        </button>
        <button 
          onClick={() => onAddPin('list')}
          className="p-3 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-all group flex flex-col items-center gap-1"
          title="Add List"
        >
          <List size={20} />
          <span className="text-[10px] font-bold">LIST</span>
        </button>
      </div>

      {/* History Group */}
      <div className="flex items-center gap-1 bg-white p-2 rounded-2xl shadow-2xl border border-gray-200">
        <button 
          disabled={!canUndo}
          onClick={onUndo}
          className="p-3 disabled:opacity-30 hover:bg-gray-100 rounded-xl transition-all"
          title="Undo"
        >
          <Undo2 size={20} />
        </button>
        <button 
          disabled={!canRedo}
          onClick={onRedo}
          className="p-3 disabled:opacity-30 hover:bg-gray-100 rounded-xl transition-all"
          title="Redo"
        >
          <Redo2 size={20} />
        </button>
      </div>

      {/* Storage Group */}
      <div className="flex items-center gap-1 bg-white p-2 rounded-2xl shadow-2xl border border-gray-200">
        <button 
          onClick={onSaveSnapshot}
          className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl transition-all flex flex-col items-center gap-1"
          title="Save Snapshot"
        >
          <Save size={20} />
          <span className="text-[10px] font-bold">SAVE</span>
        </button>
        <button 
          onClick={onOpenSnapshots}
          className="p-3 hover:bg-gray-100 rounded-xl transition-all flex flex-col items-center gap-1"
          title="Version History"
        >
          <History size={20} />
          <span className="text-[10px] font-bold">HISTORY</span>
        </button>
      </div>

      {/* Search/Filter Group */}
      <div className="flex items-center gap-2 bg-white px-4 h-14 rounded-2xl shadow-2xl border border-gray-200">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text"
          placeholder="Filter by tags or content..."
          className="bg-transparent border-none focus:ring-0 text-sm w-48"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
        />
      </div>
    </div>
  );
};
