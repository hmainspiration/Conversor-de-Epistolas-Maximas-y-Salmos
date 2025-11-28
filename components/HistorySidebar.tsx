import React from 'react';
import { History, Trash2, ChevronRight, X } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  selectedId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  history, 
  onSelect, 
  onClear,
  selectedId,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-950 border-r border-slate-900 transform transition-transform duration-300 ease-in-out shadow-2xl shadow-black ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-950">
            <h2 className="font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Historial
            </h2>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  title="Borrar historial"
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-slate-950">
            {history.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-600 text-sm">
                <p>No hay procesamientos recientes.</p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all group relative ${
                    selectedId === item.id 
                      ? 'bg-slate-900 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20' 
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${selectedId === item.id ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-200 truncate font-medium mb-2">
                    {item.preview || "Texto sin título"}
                  </p>

                  {/* Mode Badges */}
                  <div className="flex gap-2">
                     <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                        {item.config.outputMode === 'both' ? 'Completo' : item.config.outputMode === 'json' ? 'JSON' : 'Versos'}
                     </span>
                  </div>
                  
                  {selectedId === item.id && (
                    <div className="absolute right-3 top-4">
                        <ChevronRight className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
};