import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Copy, 
  FileJson, 
  AlignLeft, 
  CheckCircle2, 
  Play, 
  Upload, 
  PlusCircle,
  History,
  Terminal,
  Info,
  Loader2,
  Sparkles,
  FileText,
  X
} from 'lucide-react';

import { HistorySidebar } from './components/HistorySidebar';
import { SettingsModal } from './components/SettingsModal';
import { Button } from './components/Button';
import { processTextContent } from './services/processor';
import { HistoryItem, ProcessorConfig, ProcessingResult, Attachment } from './types';

// Initial Configuration Defaults
const DEFAULT_CONFIG: ProcessorConfig = {
  outputMode: 'both',
  verseSeparator: '', 
  jsonKey: 'content',
  includeIndex: true,
};

const App: React.FC = () => {
  // State Management
  const [textInput, setTextInput] = useState<string>('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('app_history');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        config: {
          outputMode: item.config.outputMode || 'both',
          verseSeparator: item.config.verseSeparator || '', 
          jsonKey: item.config.jsonKey || item.config.jsonKeyName || 'content',
          includeIndex: item.config.includeIndex
        }
      }));
    } catch (e) {
      return [];
    }
  });
  const [currentConfig, setCurrentConfig] = useState<ProcessorConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'json' | 'verses'>('verses');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    localStorage.setItem('app_history', JSON.stringify(history));
  }, [history]);

  // Ensure active tab is valid based on result
  useEffect(() => {
    if (result) {
      if (result.verses && !result.jsonOutput && activeTab === 'json') {
        setActiveTab('verses');
      } else if (!result.verses && result.jsonOutput && activeTab === 'verses') {
        setActiveTab('json');
      }
    }
  }, [result]);

  // Handlers
  const handleProcess = async () => {
    if (!textInput.trim() && !attachment) return;

    setIsLoading(true);
    setResult(null);

    try {
      const processed = await processTextContent(textInput, currentConfig, attachment);
      setResult(processed);
      
      // Auto-switch tab based on what was generated
      if (currentConfig.outputMode === 'json') setActiveTab('json');
      if (currentConfig.outputMode === 'verses') setActiveTab('verses');
      if (currentConfig.outputMode === 'both') setActiveTab('verses');

      // Add to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        originalText: textInput,
        attachmentName: attachment?.name,
        config: { ...currentConfig }, 
        preview: attachment 
          ? `[Archivo] ${attachment.name}` 
          : textInput.substring(0, 30) + (textInput.length > 30 ? '...' : '')
      };

      setHistory(prev => [newItem, ...prev]);
      setSelectedHistoryId(newItem.id);
    } catch (error) {
      console.error("Processing failed", error);
      alert("Hubo un error al procesar con la IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = async (item: HistoryItem) => {
    setTextInput(item.originalText);
    setCurrentConfig(item.config); 
    setSelectedHistoryId(item.id);
    setAttachment(null); // No recuperamos el adjunto binario del historial para ahorrar memoria
    
    // Si seleccionamos historial, re-procesamos (Nota: si tenía adjunto, fallará si no se vuelve a subir, 
    // pero para texto plano funciona. En una app real, guardaríamos el resultado en el historial).
    if (item.attachmentName) {
      alert("Este historial tenía un archivo adjunto. Por favor, vuelve a subirlo si deseas procesarlo de nuevo. Mostrando configuración y texto guardado.");
      return;
    }

    setIsLoading(true);
    try {
        const processed = await processTextContent(item.originalText, item.config, null);
        setResult(processed);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de borrar todo el historial?')) {
      setHistory([]);
      setSelectedHistoryId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resetear
    setAttachment(null);
    e.target.value = '';

    const isPdf = file.type === 'application/pdf';

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // result es "data:application/pdf;base64,....."
        // Necesitamos solo la parte base64
        const base64Data = result.split(',')[1];
        
        setAttachment({
          name: file.name,
          mimeType: file.type,
          data: base64Data
        });
        
        // Limpiamos el texto si suben PDF para evitar confusión, o lo dejamos como "prompt"
        if (!textInput) {
            setTextInput("Extrae el contenido de este documento.");
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Fallback para texto plano
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTextInput(content);
      };
      reader.readAsText(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleCopy = () => {
    if (!result) return;
    
    let textToCopy = "";
    if (activeTab === 'json') {
        textToCopy = result.jsonOutput || '';
    } else {
        textToCopy = result.verses?.join('\n\n') || '';
    }
      
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNew = () => {
    setTextInput('');
    setAttachment(null);
    setResult(null);
    setSelectedHistoryId(null);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Drawer Component (Overlay) */}
      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history} 
        onSelect={handleHistorySelect} 
        onClear={handleClearHistory}
        selectedId={selectedHistoryId}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-950 w-full">
        
        {/* Header / Toolbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 relative shadow-md">
          <div className="flex items-center gap-4">
            
            {/* History Toggle Button */}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-2 px-3 hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800"
              title="Abrir Historial"
            >
              <History className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Historial</span>
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-md hidden sm:block shadow-lg shadow-indigo-500/20">
                 <Terminal className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Procesador<span className="text-slate-500">Estructural</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleNew} title="Nuevo Documento" className="text-slate-400 hover:text-white hidden sm:flex">
              <PlusCircle className="w-5 h-5" />
              <span>Nuevo</span>
            </Button>
            <div className="w-px h-6 bg-slate-800 mx-2 hidden sm:block"></div>
            <Button variant="secondary" onClick={() => setIsSettingsOpen(true)} className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Lógica</span>
            </Button>
            <Button 
              onClick={handleProcess} 
              disabled={(!textInput && !attachment) || isLoading} 
              className={`border-none font-bold transition-all shadow-lg ${isLoading ? 'bg-slate-800 text-slate-400 cursor-wait' : 'bg-white text-slate-950 hover:bg-indigo-50 hover:shadow-indigo-500/20'}`}
            >
              {isLoading ? (
                <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span className="hidden sm:inline">Procesando...</span>
                </>
              ) : (
                <>
                   <Sparkles className="w-4 h-4 fill-current text-indigo-600" />
                   <span className="hidden sm:inline">Procesar IA</span>
                   <span className="sm:hidden">IA</span>
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left/Top: Input Area */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-900 p-6 min-h-[300px] bg-slate-950">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entrada / Archivo</label>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".txt,.json,.md,.csv,.pdf" 
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 hover:border-slate-600 transition-all hover:bg-slate-900"
                >
                  <Upload className="w-3 h-3" />
                  {attachment ? 'Cambiar Archivo' : 'Subir PDF/Txt'}
                </button>
              </div>
            </div>
            
            <div className="relative flex-1 group flex flex-col gap-4">
                {/* Visualizador de Adjunto */}
                {attachment && (
                  <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg animate-fadeIn shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 text-red-400 rounded-md border border-red-500/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{attachment.name}</p>
                        <p className="text-xs text-slate-500">PDF Document • Listo para analizar</p>
                      </div>
                    </div>
                    <button onClick={removeAttachment} className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <textarea
                  className={`flex-1 w-full bg-slate-900/40 border border-slate-800 rounded-xl p-5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-slate-900/60 text-slate-300 font-mono text-sm leading-relaxed transition-all placeholder-slate-700 ${attachment ? 'h-1/2' : 'h-full'}`}
                  placeholder={attachment ? "Añade instrucciones extra para el PDF aquí (opcional)..." : "Pega tu texto aquí o sube un PDF para comenzar..."}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isLoading}
                />
            </div>
          </div>

          {/* Right/Bottom: Output Area */}
          <div className="flex-1 flex flex-col p-6 bg-slate-900/30">
            
            {/* Output Tabs & Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-900 shadow-sm">
                
                {(!result || (result.verses && result.verses.length > 0)) && (
                  <button
                    onClick={() => setActiveTab('verses')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'verses' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/5' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    Versículos
                    {result?.verses && <span className="ml-1 text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">{result.verses.length}</span>}
                  </button>
                )}
                
                {(!result || result.jsonOutput) && (
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'json' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/5' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <FileJson className="w-4 h-4" />
                    JSON
                  </button>
                )}
              </div>

              {result && (
                <div className="flex items-center gap-2">
                   <div className="text-[10px] text-slate-500 font-mono uppercase border border-slate-800 px-2 py-1 rounded hidden lg:block bg-slate-950">
                      Modo: {currentConfig.outputMode === 'both' ? 'Completo' : currentConfig.outputMode === 'verses' ? 'Solo Versos' : 'Solo JSON'}
                   </div>
                  <Button variant="ghost" onClick={handleCopy} className="text-slate-500 hover:text-white hover:bg-slate-800">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span className={copied ? "text-green-500" : ""}>{copied ? 'Copiado' : 'Copiar'}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Output Display */}
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative shadow-inner">
              {isLoading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <p className="text-sm text-slate-300 animate-pulse font-medium">Analizando estructura con IA...</p>
                    {attachment && <p className="text-xs text-slate-500 mt-2">Leyendo documento PDF...</p>}
                 </div>
              ) : !result ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-slate-800">
                     <Sparkles className="w-8 h-8 opacity-40 text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium">Esperando procesamiento</p>
                  <p className="text-xs text-slate-600 mt-2">Sube un PDF o pega texto para comenzar</p>
                </div>
              ) : (
                <div className="absolute inset-0 overflow-auto p-6 custom-scrollbar">
                  {activeTab === 'verses' && result.verses ? (
                    <div className="space-y-4">
                      {result.verses.map((verse, idx) => {
                        // Detectar si el versículo comienza con un número (formato 1. Texto) para estilizar
                        const isNumbered = /^\d+\./.test(verse);
                        // Detectar si es un separador visual
                        const isSeparator = verse.includes('---');
                        // Detectar si es un encabezado probable (MAYUSCULAS cortas o sin punto final)
                        const isLikelyHeader = !isNumbered && !isSeparator && (verse === verse.toUpperCase() || verse.length < 50) && !verse.trim().endsWith('.');
                        
                        if (isSeparator) return <hr key={idx} className="border-slate-800 my-8" />;

                        return (
                        <div key={idx} className={`flex gap-4 group p-2 -mx-2 rounded-lg transition-colors ${isLikelyHeader ? 'bg-slate-900/40 py-4 justify-center text-center border border-slate-800/50' : 'hover:bg-slate-900/30 border-b border-slate-900/50 last:border-0'}`}>
                          <p className={`${isLikelyHeader ? 'text-indigo-200 font-bold tracking-widest text-sm' : 'text-slate-300 leading-relaxed text-base font-light'}`}>
                            {verse}
                          </p>
                        </div>
                      )})}
                    </div>
                  ) : activeTab === 'json' && result.jsonOutput ? (
                    <pre className="font-mono text-xs text-emerald-400/90 whitespace-pre-wrap break-words leading-relaxed">
                      {result.jsonOutput}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600">
                      <div className="flex flex-col items-center gap-2">
                        <Info className="w-6 h-6" />
                        <p className="text-sm">Resultado no generado en este modo.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={currentConfig}
        onConfigChange={setCurrentConfig}
      />
    </div>
  );
};

export default App;