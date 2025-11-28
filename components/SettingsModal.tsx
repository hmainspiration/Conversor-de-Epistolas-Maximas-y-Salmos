import React, { useState } from 'react';
import { X, Settings, Check, Layout, AlignLeft, FileJson, Layers } from 'lucide-react';
import { ProcessorConfig, OutputMode } from '../types';
import { Button } from './Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProcessorConfig;
  onConfigChange: (newConfig: ProcessorConfig) => void;
}

type Tab = 'general' | 'verses' | 'json';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onConfigChange 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  if (!isOpen) return null;

  const handleChange = (key: keyof ProcessorConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Layers className="w-4 h-4" /> },
    { id: 'verses', label: 'Versículos', icon: <AlignLeft className="w-4 h-4" /> },
    { id: 'json', label: 'JSON', icon: <FileJson className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900 shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-200" />
            Configuración de Lógica
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white bg-indigo-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Modo de Procesamiento
                </h4>
                <p className="text-xs text-slate-500">
                  Selecciona qué tipo de resultado deseas generar al procesar el texto.
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'both', label: 'Ambos (Versículos y JSON)', desc: 'Genera lista visual y código JSON.' },
                    { value: 'verses', label: 'Solo Versículos', desc: 'Solo divide el texto visualmente.' },
                    { value: 'json', label: 'Solo JSON', desc: 'Solo genera la estructura de código.' },
                  ].map((option) => (
                    <label 
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        config.outputMode === option.value 
                          ? 'bg-indigo-500/10 border-indigo-500/50' 
                          : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="outputMode"
                        className="mt-1 accent-indigo-500"
                        checked={config.outputMode === option.value}
                        onChange={() => handleChange('outputMode', option.value as OutputMode)}
                      />
                      <div>
                        <span className={`block text-sm font-bold ${config.outputMode === option.value ? 'text-indigo-200' : 'text-slate-300'}`}>
                          {option.label}
                        </span>
                        <span className="text-xs text-slate-500">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: VERSICULOS */}
          {activeTab === 'verses' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">División de Versículos</h4>
              </div>
              
              <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg mb-4">
                <p className="text-xs text-indigo-200">
                  La aplicación usa una <strong>lógica inteligente</strong> predefinida para detectar encabezados, Salmos y dividir por oraciones gramaticales completas automáticamente.
                </p>
              </div>

              <div className="space-y-5">
                <label className="block space-y-2">
                  <span className="text-slate-400 text-xs font-medium uppercase">Separador Personalizado (Opcional)</span>
                  <textarea 
                    value={config.verseSeparator}
                    onChange={(e) => handleChange('verseSeparator', e.target.value)}
                    placeholder="Dejar vacío para usar lógica automática..."
                    rows={12}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono text-sm placeholder-slate-700 resize-y min-h-[300px]"
                  />
                  <p className="text-[10px] text-slate-500">
                    Si escribes algo aquí, se desactivará la lógica inteligente y se usará este separador simple (ej. \n).
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* TAB: JSON */}
          {activeTab === 'json' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Estructura JSON</h4>
              </div>

              <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg mb-4">
                <p className="text-xs text-purple-200">
                  Generación automática de IDs (njg-slm/njg-cap), detección de Salmos/Cartas y extracción de metadatos (Lugar, Fecha).
                </p>
              </div>

              <div className="space-y-5">
                <label className="block space-y-2">
                  <span className="text-slate-400 text-xs font-medium uppercase">Clave de Contenido (Opcional)</span>
                  <textarea 
                    value={config.jsonKey}
                    onChange={(e) => handleChange('jsonKey', e.target.value)}
                    placeholder="content (Por defecto)"
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none font-mono text-sm placeholder-slate-700 resize-y min-h-[150px]"
                  />
                  <p className="text-[10px] text-slate-500">Override manual para el nombre del array de contenido.</p>
                </label>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-600 transition-colors group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.includeIndex ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                      {config.includeIndex && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={config.includeIndex}
                      onChange={(e) => handleChange('includeIndex', e.target.checked)}
                    />
                    <span className="text-slate-300 text-sm">Incluir índice numérico en objetos</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end shrink-0">
          <Button onClick={onClose} variant="primary" className="w-full sm:w-auto">
            Guardar y Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};