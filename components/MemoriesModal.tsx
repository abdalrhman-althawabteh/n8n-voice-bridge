import React from 'react';
import { X, Download, Trash2, Clock, History } from 'lucide-react';
import { Memory } from '../types';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onClear: () => void;
  onDownload: () => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({
  isOpen,
  onClose,
  memories,
  onClear,
  onDownload,
}) => {
  if (!isOpen) return null;

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(ts));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col animate-fade-in" dir="rtl">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <History size={20} className="text-purple-600" />
            الذكريات ({memories.length})
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {memories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <History size={48} className="opacity-20" />
              <p>لا توجد ذكريات مسجلة بعد</p>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-purple-100 transition-colors">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-2">
                  {memory.text}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>{formatDate(memory.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3 shrink-0">
          <button
            onClick={onClear}
            disabled={memories.length === 0}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Trash2 size={16} />
            مسح الكل
          </button>
          
          <button
            onClick={onDownload}
            disabled={memories.length === 0}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none"
          >
            <Download size={18} />
            حفظ الذكريات
          </button>
        </div>
      </div>
    </div>
  );
};
