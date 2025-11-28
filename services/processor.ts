import { GoogleGenAI } from "@google/genai";
import { ProcessorConfig, ProcessingResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `
Eres un asistente editorial experto en la estructuración y versificación de textos religiosos (Salmos y Cartas Apostólicas).

TU TAREA PRINCIPAL:
Analizar el texto de entrada y generar un objeto JSON con dos propiedades principales:
1. "verses": Un array de strings con el texto dividido en versículos visuales.
2. "jsonOutput": Un string que contenga la estructura JSON estricta solicitada.

REGLAS PARA "verses" (VISUALIZACIÓN):
1. Encabezados: Título, Fecha, Lugar y Autor al inicio. NO deben llevar número.
2. Versículo 1: Si hay lista de títulos (Siervo de Dios, etc.), agrúpalos con el nombre en el primer versículo.
3. División:
   - Cada versículo debe ser una idea completa.
   - Agrupa frases cortas consecutivas del mismo tema.
   - Respeta citas bíblicas dentro del versículo.
   - Exclamaciones fuertes pueden ir solas.
4. Cierre: La firma final es el último versículo.

REGLAS PARA "jsonOutput" (ESTRUCTURA DE DATOS):
Clasifica en MODO A (Salmos) o MODO B (Epístolas).

MODO A: SALMOS (Si dice "SALMO X")
- ID Principal: "njg-slm{N}"
- ID Versículo: "njg-s{N}-{V}"
- Título: "Salmo {N}"

MODO B: EPÍSTOLAS (Si tiene fecha/lugar)
- ID Principal: "njg-{N}" (Si no hay capitulo explícito, usa 1 o deduce).
- ID Versículo: "njg-{N}-{V}"
- Título: "Epístola del {Fecha}"

ESTRUCTURA DEL JSON STRING INTERNO:
Debe ser un Array con objetos: { id, chapter, title, location, date, content: [{ id, number, text }] }.
Limpia el texto de los versículos en el JSON (sin números al inicio).

FORMATO DE RESPUESTA ESPERADO DEL MODELO:
Devuelve SOLAMENTE un JSON válido con esta estructura:
{
  "verses": ["Encabezado 1", "Encabezado 2", "1. Primer versículo...", "2. Segundo versículo..."],
  "jsonOutput": "[...el json estricto stringificado...]"
}
`;

export const processTextContent = async (text: string, config: ProcessorConfig): Promise<ProcessingResult> => {
  if (!text) {
    return { verses: [], jsonOutput: '' };
  }

  try {
    // Si el usuario configuró algo manual en el modal, lo añadimos al prompt
    let userCustomInstructions = "";
    if (config.verseSeparator) {
        userCustomInstructions += `\nNOTA DEL USUARIO SOBRE VERSÍCULOS: ${config.verseSeparator}`;
    }
    if (config.jsonKey) {
        userCustomInstructions += `\nNOTA DEL USUARIO SOBRE JSON KEY: Usar '${config.jsonKey}' en lugar de 'content' si es posible.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        systemInstruction: SYSTEM_PROMPT + userCustomInstructions,
        temperature: 0.1, // Baja temperatura para ser estricto con las reglas
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: `TEXTO A PROCESAR:\n\n${text}` }
          ]
        }
      ]
    });

    const outputText = response.text;
    
    if (!outputText) {
      throw new Error("No response from AI");
    }

    // Parseamos la respuesta del modelo
    const parsed = JSON.parse(outputText);

    // Aseguramos que jsonOutput sea un string formateado si el modelo lo devolvió como objeto
    let jsonString = parsed.jsonOutput;
    if (typeof jsonString !== 'string') {
        jsonString = JSON.stringify(jsonString, null, 2);
    } else {
        // Si ya es string, intentamos formatearlo bonito
        try {
            const tempObj = JSON.parse(jsonString);
            jsonString = JSON.stringify(tempObj, null, 2);
        } catch (e) {
            // Si no es parseable, lo dejamos como está
        }
    }

    return {
      verses: parsed.verses || [],
      jsonOutput: jsonString || ''
    };

  } catch (error) {
    console.error("Error processing with Gemini:", error);
    return {
      verses: ["Error al procesar con IA.", "Verifica tu conexión o intenta de nuevo.", `Detalle: ${error}`],
      jsonOutput: JSON.stringify({ error: "Failed to process text" }, null, 2)
    };
  }
};
