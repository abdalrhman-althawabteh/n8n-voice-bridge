import React, { useState, useEffect } from 'react';
import { X, Save, Link as LinkIcon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSave: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSave,
}) => {
  const [url, setUrl] = useState(currentUrl);

  useEffect(() => {
    setUrl(currentUrl);
  }, [currentUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in" dir="rtl">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <LinkIcon size={20} className="text-indigo-600" />
            إعدادات الاتصال
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              رابط الويب هوك (n8n Webhook URL)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-n8n-instance.com/webhook/..."
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left ltr"
              dir="ltr"
            />
            <p className="text-xs text-slate-500 mt-2">
              سيتم إرسال الملف الصوتي كـ <code>Multipart Form-Data</code> إلى هذا الرابط.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              onSave(url);
              onClose();
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200"
          >
            <Save size={18} />
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};