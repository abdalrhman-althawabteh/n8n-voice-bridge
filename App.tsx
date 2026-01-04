import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Settings, Send, FileAudio, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { AppState, Memory } from './types';
import { sendAudioToWebhook } from './services/n8nService';
import { Waveform } from './components/Waveform';
import { SettingsModal } from './components/SettingsModal';
import { MemoriesModal } from './components/MemoriesModal';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transcription, setTranscription] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>(() => localStorage.getItem('n8n_webhook_url') || '');
  
  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState<boolean>(false);
  
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Memories History
  const [memories, setMemories] = useState<Memory[]>(() => {
    try {
      const saved = localStorage.getItem('voice_memories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Persist memories
  useEffect(() => {
    localStorage.setItem('voice_memories', JSON.stringify(memories));
  }, [memories]);

  // Download functionality
  const handleDownloadMemories = useCallback(() => {
    if (memories.length === 0) return;
    
    const textContent = memories
      .map(m => `[${new Date(m.timestamp).toLocaleString('ar-SA')}]\n${m.text}\n-------------------`)
      .join('\n\n');
      
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice-memories-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [memories]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S or Command + S to save/download
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownloadMemories();
      }
      // Ctrl + M to open memories
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        setIsMemoriesOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDownloadMemories]);

  const startRecording = async () => {
    try {
      if (!webhookUrl) {
        setIsSettingsOpen(true);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleUpload(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setAppState(AppState.RECORDING);
      setErrorMsg('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setErrorMsg('لا يمكن الوصول إلى الميكروفون. يرجى التأكد من السماح بالوصول.');
      setAppState(AppState.ERROR);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && appState === AppState.RECORDING) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUpload = async (audioBlob: Blob) => {
    setAppState(AppState.PROCESSING);
    try {
      const resultText = await sendAudioToWebhook(audioBlob, webhookUrl);
      setTranscription(resultText);
      
      // Add to memories
      const newMemory: Memory = {
        id: crypto.randomUUID(),
        text: resultText,
        timestamp: Date.now()
      };
      setMemories(prev => [newMemory, ...prev]);
      
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
      setAppState(AppState.ERROR);
    }
  };

  const resetState = () => {
    setAppState(AppState.IDLE);
    setTranscription('');
    setErrorMsg('');
  };

  const handleSaveSettings = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('n8n_webhook_url', url);
  };

  const handleClearMemories = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع الذكريات؟')) {
      setMemories([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-lg">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b border-slate-100/50">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">مساعد صوتي</h1>
              <p className="text-slate-500 text-sm">تحدث ليتم تحويل صوتك إلى نص</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsMemoriesOpen(true)}
                title="الذكريات (Ctrl+M)"
                className="p-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-400 hover:text-purple-600 transition-all shadow-sm border border-slate-100 relative"
              >
                <History size={20} />
                {memories.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border border-white"></span>
                )}
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                title="الإعدادات"
                className="p-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all shadow-sm border border-slate-100"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

          {/* Main Action Area */}
          <div className="p-8 flex flex-col items-center justify-center min-h-[300px] transition-all duration-500">
            
            {/* Initial State / Recording State */}
            {appState === AppState.IDLE && (
              <div className="flex flex-col items-center gap-6 animate-fade-in">
                <button
                  onClick={startRecording}
                  className="group relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-indigo-300/50 hover:scale-105 transition-all duration-300"
                >
                  <Mic size={48} className="text-white group-hover:animate-pulse" />
                  <span className="absolute -bottom-10 text-slate-500 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    اضغط للتحدث
                  </span>
                </button>
                <p className="text-slate-400 text-center max-w-xs mt-4">
                  يمكنك الضغط على <kbd className="font-sans bg-slate-200 px-1 rounded">Ctrl+S</kbd> في أي وقت لحفظ جميع الذكريات
                </p>
              </div>
            )}

            {appState === AppState.RECORDING && (
              <div className="flex flex-col items-center gap-8 animate-fade-in w-full">
                <div className="relative w-40 h-40 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-200">
                  <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-20"></span>
                  <Waveform />
                </div>
                <div className="text-center">
                  <p className="text-red-500 font-bold text-lg mb-1">جاري التسجيل...</p>
                  <p className="text-slate-400 text-sm">تحدث بوضوح</p>
                </div>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-slate-800 text-white px-8 py-3 rounded-full hover:bg-slate-900 transition-colors shadow-lg"
                >
                  <Square size={18} fill="currentColor" />
                  إنهاء وإرسال
                </button>
              </div>
            )}

            {appState === AppState.PROCESSING && (
              <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Send size={32} className="text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-700">جاري المعالجة</h3>
                  <p className="text-slate-500">يتم إرسال البيانات إلى n8n...</p>
                </div>
              </div>
            )}

            {appState === AppState.SUCCESS && (
              <div className="w-full flex flex-col gap-6 animate-fade-in">
                <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-2xl border border-green-100">
                  <CheckCircle2 size={24} />
                  <span className="font-bold">تم الاستلام والحفظ</span>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[160px] relative group">
                  <div className="absolute top-3 left-3 bg-white p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <FileAudio size={16} className="text-slate-400" />
                  </div>
                  <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                    {transcription}
                  </p>
                </div>

                <button
                  onClick={resetState}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  تسجيل جديد
                </button>
              </div>
            )}

            {appState === AppState.ERROR && (
              <div className="flex flex-col items-center gap-6 animate-fade-in text-center px-4">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">عفواً، حدث خطأ</h3>
                  <p className="text-slate-500">{errorMsg}</p>
                </div>
                <button
                  onClick={resetState}
                  className="px-8 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
                >
                  حاول مرة أخرى
                </button>
              </div>
            )}

          </div>
        </div>
        
        {/* Footer info */}
        <p className="text-center mt-6 text-indigo-900/40 text-sm font-medium">
          Powered by React & n8n
        </p>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentUrl={webhookUrl}
        onSave={handleSaveSettings}
      />

      <MemoriesModal 
        isOpen={isMemoriesOpen}
        onClose={() => setIsMemoriesOpen(false)}
        memories={memories}
        onClear={handleClearMemories}
        onDownload={handleDownloadMemories}
      />
    </div>
  );
};

export default App;
