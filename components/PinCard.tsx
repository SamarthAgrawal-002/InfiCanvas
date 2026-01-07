
import React, { useState, useRef, useEffect } from 'react';
import { Pin, PinItem } from '../types';
import { Trash2, GripHorizontal, Plus, X } from 'lucide-react';

interface PinCardProps {
  pin: Pin;
  zoom: number;
  onMove: (id: string, x: number, y: number) => void;
  onUpdate: (id: string, updates: Partial<Pin>) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const PinCard: React.FC<PinCardProps> = ({
  pin,
  zoom,
  onMove,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    
    setIsDragging(true);
    onDragStart();
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const container = document.getElementById('canvas-container');
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      
      const newX = (moveEvent.clientX - cRect.left) / zoom - dragOffset.current.x;
      const newY = (moveEvent.clientY - cRect.top) / zoom - dragOffset.current.y;
      
      onMove(pin.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleListToggle = (itemId: string) => {
    const newItems = pin.items?.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    onUpdate(pin.id, { items: newItems });
  };

  const addListItem = () => {
    const newItems = [...(pin.items || []), { id: Math.random().toString(36).substr(2, 9), text: '', checked: false }];
    onUpdate(pin.id, { items: newItems });
  };

  const updateListItem = (itemId: string, text: string) => {
    const newItems = pin.items?.map(item => 
      item.id === itemId ? { ...item, text } : item
    );
    onUpdate(pin.id, { items: newItems });
  };

  const removeListItem = (itemId: string) => {
    const newItems = pin.items?.filter(item => item.id !== itemId);
    onUpdate(pin.id, { items: newItems });
  };

  return (
    <div
      ref={cardRef}
      className={`absolute select-none shadow-lg rounded-xl overflow-hidden border border-gray-200 transition-shadow ${
        isDragging ? 'shadow-2xl z-50 cursor-grabbing' : 'cursor-grab hover:shadow-xl z-10'
      }`}
      style={{
        left: pin.x,
        top: pin.y,
        width: pin.width || 250,
        backgroundColor: pin.color,
        transform: `scale(${isDragging ? 1.02 : 1})`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header / Drag Handle */}
      <div className="h-8 flex items-center justify-between px-3 bg-black/5">
        <div className="flex items-center gap-1">
          <GripHorizontal size={14} className="text-gray-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{pin.type}</span>
        </div>
        <button 
          onClick={() => onDelete(pin.id)}
          className="no-drag p-1 hover:bg-red-100 hover:text-red-600 rounded text-gray-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {pin.type === 'text' && (
          <textarea
            className="no-drag w-full bg-transparent border-none focus:ring-0 resize-none text-gray-800 placeholder-gray-400"
            value={pin.content}
            onChange={(e) => onUpdate(pin.id, { content: e.target.value })}
            placeholder="Write something..."
            rows={4}
          />
        )}

        {pin.type === 'image' && (
          <div className="no-drag group relative">
            {pin.content ? (
              <img 
                src={pin.content} 
                alt="Pin" 
                className="w-full h-auto rounded pointer-events-none"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!pin.width) onUpdate(pin.id, { width: 300 });
                }}
              />
            ) : (
              <div className="bg-gray-100 rounded p-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <input 
                  type="text"
                  placeholder="Paste image URL..."
                  className="w-full text-sm p-2 rounded border focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onUpdate(pin.id, { content: (e.target as HTMLInputElement).value });
                  }}
                />
              </div>
            )}
          </div>
        )}

        {pin.type === 'list' && (
          <div className="no-drag space-y-2">
            {pin.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group/item">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleListToggle(item.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateListItem(item.id, e.target.value)}
                  placeholder="Task..."
                  className={`flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}
                />
                <button 
                  onClick={() => removeListItem(item.id)}
                  className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addListItem}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2 transition-colors"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      {pin.tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {pin.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-black/5 text-[10px] rounded-full text-gray-600 font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
