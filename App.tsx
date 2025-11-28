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
  Sparkles
} from 'lucide-react';

import { HistorySidebar } from './components/HistorySidebar';
import { SettingsModal } from './components/SettingsModal';
import { Button } from './components/Button';
import { processTextContent } from './services/processor';
import { HistoryItem, ProcessorConfig, ProcessingResult } from './types';

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
    if (!textInput.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const processed = await processTextContent(textInput, currentConfig);
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
        config: { ...currentConfig }, 
        preview: textInput.substring(0, 30) + (textInput.length > 30 ? '...' : '')
      };

      setHistory(prev => [newItem, ...prev]);
      setSelectedHistoryId(newItem.id);
    } catch (error) {
      console.error("Processing failed", error);
      alert("Hubo un error al procesar el texto con la IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = async (item: HistoryItem) => {
    setTextInput(item.originalText);
    setCurrentConfig(item.config); 
    setSelectedHistoryId(item.id);
    
    // Si seleccionamos historial, re-procesamos (o idealmente guardaríamos el resultado en el historial para no gastar tokens, 
    // pero por simplicidad y para permitir re-configuracion, procesamos de nuevo).
    setIsLoading(true);
    try {
        const processed = await processTextContent(item.originalText, item.config);
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

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextInput(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopy = () => {
    if (!result) return;
    
    let textToCopy = "";
    if (activeTab === 'json') {
        textToCopy = result.jsonOutput || '';
    } else {
        // Para versículos, el array ya viene formateado visualmente en algunos casos, 
        // pero asegurémonos de copiar texto limpio.
        textToCopy = result.verses?.join('\n\n') || '';
    }
      
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNew = () => {
    setTextInput('');
    setResult(null);
    setSelectedHistoryId(null);
  };

  return (
    <div className="flex h-screen bg-black text-neutral-200 font-sans selection:bg-white/20 overflow-hidden">
      
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
      <main className="flex-1 flex flex-col h-full min-w-0 bg-neutral-950 w-full">
        
        {/* Header / Toolbar */}
        <header className="h-16 border-b border-neutral-900 bg-black flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 relative">
          <div className="flex items-center gap-4">
            
            {/* History Toggle Button */}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors py-2 px-3 hover:bg-neutral-900 rounded-lg"
              title="Abrir Historial"
            >
              <History className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Historial</span>
            </button>

            <div className="h-6 w-px bg-neutral-800 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-md hidden sm:block">
                 <Terminal className="w-4 h-4 text-black" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Procesador<span className="text-neutral-500">Estructural</span> <span className="text-[10px] bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded ml-1">AI</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleNew} title="Nuevo Documento" className="text-neutral-400 hover:text-white hidden sm:flex">
              <PlusCircle className="w-5 h-5" />
              <span>Nuevo</span>
            </Button>
            <div className="w-px h-6 bg-neutral-800 mx-2 hidden sm:block"></div>
            <Button variant="secondary" onClick={() => setIsSettingsOpen(true)} className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Lógica</span>
            </Button>
            <Button 
              onClick={handleProcess} 
              disabled={!textInput || isLoading} 
              className={`border-none font-bold transition-all ${isLoading ? 'bg-neutral-800 text-neutral-400 cursor-wait' : 'bg-white text-black hover:bg-neutral-200'}`}
            >
              {isLoading ? (
                <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span className="hidden sm:inline">Procesando...</span>
                </>
              ) : (
                <>
                   <Sparkles className="w-4 h-4 fill-current text-purple-600" />
                   <span className="hidden sm:inline">Procesar con IA</span>
                   <span className="sm:hidden">IA</span>
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left/Top: Input Area */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-900 p-6 min-h-[300px] bg-black">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Entrada de Texto</label>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".txt,.json,.md,.csv" 
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-800 hover:border-neutral-600 transition-all"
                >
                  <Upload className="w-3 h-3" />
                  Subir Archivo
                </button>
              </div>
            </div>
            <div className="relative flex-1 group">
                <textarea
                className="absolute inset-0 w-full h-full bg-neutral-900/30 border border-neutral-800 rounded-xl p-5 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-neutral-900/50 text-neutral-300 font-mono text-sm leading-relaxed transition-all placeholder-neutral-700"
                placeholder="Pega tu texto aquí (Salmo o Carta) para comenzar..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isLoading}
                />
            </div>
          </div>

          {/* Right/Bottom: Output Area */}
          <div className="flex-1 flex flex-col p-6 bg-neutral-950">
            
            {/* Output Tabs & Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex bg-black p-1 rounded-lg border border-neutral-900">
                
                {(!result || (result.verses && result.verses.length > 0)) && (
                  <button
                    onClick={() => setActiveTab('verses')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'verses' 
                        ? 'bg-neutral-800 text-white shadow-sm' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    Versículos
                    {result?.verses && <span className="ml-1 text-[10px] bg-white text-black px-1.5 py-0.5 rounded-full">{result.verses.length}</span>}
                  </button>
                )}
                
                {(!result || result.jsonOutput) && (
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'json' 
                        ? 'bg-neutral-800 text-white shadow-sm' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <FileJson className="w-4 h-4" />
                    JSON
                  </button>
                )}
              </div>

              {result && (
                <div className="flex items-center gap-2">
                   <div className="text-[10px] text-neutral-600 font-mono uppercase border border-neutral-800 px-2 py-1 rounded hidden lg:block">
                      Modo: {currentConfig.outputMode === 'both' ? 'Completo' : currentConfig.outputMode === 'verses' ? 'Solo Versos' : 'Solo JSON'}
                   </div>
                  <Button variant="ghost" onClick={handleCopy} className="text-neutral-500 hover:text-white hover:bg-neutral-900">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span className={copied ? "text-green-500" : ""}>{copied ? 'Copiado' : 'Copiar'}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Output Display */}
            <div className="flex-1 bg-black border border-neutral-900 rounded-xl overflow-hidden relative shadow-inner">
              {isLoading ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                    <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                    <p className="text-sm text-neutral-300 animate-pulse">Analizando estructura y semántica...</p>
                 </div>
              ) : !result ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700">
                  <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                     <Sparkles className="w-8 h-8 opacity-50 text-purple-900" />
                  </div>
                  <p className="text-sm font-medium">Esperando procesamiento inteligente...</p>
                  <p className="text-xs text-neutral-600 mt-2">Pega el texto y presiona Procesar</p>
                </div>
              ) : (
                <div className="absolute inset-0 overflow-auto p-6 custom-scrollbar">
                  {activeTab === 'verses' && result.verses ? (
                    <div className="space-y-4">
                      {result.verses.map((verse, idx) => {
                        // Detectar si el versículo comienza con un número (formato 1. Texto) para estilizar
                        const isNumbered = /^\d+\./.test(verse);
                        // Detectar si es un encabezado probable (MAYUSCULAS cortas o sin punto final)
                        const isLikelyHeader = !isNumbered && (verse === verse.toUpperCase() || verse.length < 50) && !verse.trim().endsWith('.');
                        
                        return (
                        <div key={idx} className={`flex gap-4 group p-2 -mx-2 rounded-lg transition-colors ${isLikelyHeader ? 'bg-neutral-900/20 py-4 justify-center text-center' : 'hover:bg-neutral-900/50 border-b border-neutral-900/50 last:border-0'}`}>
                          <p className={`${isLikelyHeader ? 'text-white font-bold tracking-widest text-sm' : 'text-neutral-300 leading-relaxed text-base font-light'}`}>
                            {verse}
                          </p>
                        </div>
                      )})}
                    </div>
                  ) : activeTab === 'json' && result.jsonOutput ? (
                    <pre className="font-mono text-xs text-green-500/80 whitespace-pre-wrap break-words leading-relaxed">
                      {result.jsonOutput}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-600">
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
