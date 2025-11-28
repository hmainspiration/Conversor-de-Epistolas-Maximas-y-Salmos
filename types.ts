export type OutputMode = 'both' | 'verses' | 'json';

export interface ProcessorConfig {
  outputMode: OutputMode;
  
  // Configuración de Versículos
  verseSeparator: string;   // Si está vacío, usa la lógica inteligente. Si tiene algo, usa eso como separador manual.

  // Configuración de JSON
  jsonKey: string;          // Para overrides manuales, por defecto usa la lógica de "content"
  
  includeIndex: boolean;
}

export interface ProcessingResult {
  verses: string[] | null;
  jsonOutput: string | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalText: string;
  config: ProcessorConfig;
  preview: string;
}