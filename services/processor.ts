import { GoogleGenAI } from "@google/genai";
import { ProcessorConfig, ProcessingResult, Attachment } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `
Eres un asistente editorial experto en la estructuración y versificación de textos religiosos (Salmos, Cartas Apostólicas y Máximas).

TU TAREA PRINCIPAL:
Analizar el texto o DOCUMENTO PDF proporcionado. Debes identificar, extraer y estructurar el contenido relevante (Cartas, Salmos o escritos doctrinales).

SI HAY UN PDF ADJUNTO:
1. Ignora el ruido (encabezados de página repetitivos, números de página).
2. Busca el inicio y fin lógico de cada documento (Carta, Salmo, etc.).
3. Si hay múltiples documentos, procésalos todos secuencialmente.

FORMATO DE SALIDA (JSON):
Debes devolver un JSON con dos claves:
1. "verses": Un array de strings plano que contenga TODOS los versículos generados de TODOS los documentos encontrados, separados visualmente si es necesario.
2. "jsonOutput": Un string que contenga el JSON ESTRUCTURADO (Array de objetos).

REGLAS DE PROCESAMIENTO:
MODO A: SALMOS
- ID: "njg-slm{N}"
- Detectar "SALMO X".

MODO B: EPÍSTOLAS / CARTAS
- ID: "njg-{N}" o "njg-{YYYY}-{MM}-{DD}" si no hay numero.
- Detectar fechas y lugares de inicio.

MODO C: MÁXIMAS / CONSEJOS (Si detectas frases cortas o listas)
- ID: "njg-mx-{N}"
- Título: "Máximas Espirituales"

REGLAS DE VERSIFICACIÓN (Para el array "verses"):
- Encabezados (Título, Fecha, Autor) NO llevan número.
- Divide por ideas completas (puntos).
- Agrupa frases cortas del mismo tema.
- Firma final es el último versículo.

FORMATO DE RESPUESTA DEL MODELO:
{
  "verses": ["Encabezado Carta 1", "1. Texto...", "2. Texto...", "---", "Encabezado Carta 2", "1. Texto..."],
  "jsonOutput": "[ { \"id\": \"...\", \"content\": [...] }, { \"id\": \"...\", \"content\": [...] } ]"
}
`;

export const processTextContent = async (
  text: string, 
  config: ProcessorConfig, 
  attachment: Attachment | null
): Promise<ProcessingResult> => {
  
  if (!text && !attachment) {
    return { verses: [], jsonOutput: '' };
  }

  try {
    let userCustomInstructions = "";
    if (config.verseSeparator) userCustomInstructions += `\nNOTA: Separador versículos forzado: ${config.verseSeparator}`;
    if (config.jsonKey) userCustomInstructions += `\nNOTA: Usar key '${config.jsonKey}' en JSON.`;

    // Construir partes del mensaje (Multimodal)
    const parts: any[] = [];

    // 1. Si hay archivo (PDF), va primero
    if (attachment) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data // Base64 string
        }
      });
      parts.push({ text: "Analiza el documento adjunto y extrae las cartas/salmos según las instrucciones." });
    }

    // 2. Si hay texto (instrucciones extra o contenido pegado)
    if (text) {
      parts.push({ text: `TEXTO/INSTRUCCIONES ADICIONALES:\n${text}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash soporta gran contexto (1M tokens) ideal para PDFs grandes
      config: {
        responseMimeType: 'application/json',
        systemInstruction: SYSTEM_PROMPT + userCustomInstructions,
        temperature: 0.1,
      },
      contents: [
        {
          role: 'user',
          parts: parts
        }
      ]
    });

    const outputText = response.text;
    
    if (!outputText) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(outputText);

    // Formatear jsonOutput
    let jsonString = parsed.jsonOutput;
    if (typeof jsonString !== 'string') {
        jsonString = JSON.stringify(jsonString, null, 2);
    } else {
        try {
            const tempObj = JSON.parse(jsonString);
            jsonString = JSON.stringify(tempObj, null, 2);
        } catch (e) {}
    }

    return {
      verses: parsed.verses || [],
      jsonOutput: jsonString || ''
    };

  } catch (error) {
    console.error("Error processing with Gemini:", error);
    return {
      verses: ["Error al procesar.", "Si el PDF es muy grande (>20MB), intenta dividirlo.", `Detalle: ${error}`],
      jsonOutput: JSON.stringify({ error: "Failed to process content" }, null, 2)
    };
  }
};