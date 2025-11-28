export type OutputMode = 'both' | 'verses' | 'json';

export interface ProcessorConfig {
  outputMode: OutputMode;
  verseSeparator: string;
  jsonKey: string;
  includeIndex: boolean;
}

export interface ProcessingResult {
  verses: string[] | null;
  jsonOutput: string | null;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64 limpia
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalText: string;
  attachmentName?: string; // Para saber si hubo archivo
  config: ProcessorConfig;
  preview: string;
}