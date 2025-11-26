import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { Message, Role, Source } from '../types/chatbot';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SYSTEM_INSTRUCTION = "You are a helpful writing assistant for the Writer's War-Room application. You help authors with character development, plot ideas, world-building, writing techniques, and general creative writing advice. Keep your answers concise and actionable.";

export const getChatResponse = async (history: Message[]): Promise<{ text: string, sources: Source[] }> => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.");
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Format history for the API
    const contents: Content[] = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      systemInstruction: {
        role: 'model',
        parts: [{text: SYSTEM_INSTRUCTION}]
      },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text ?? "I'm at a loss for words...";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: Source[] = groundingChunks?.filter((chunk): chunk is Source => 'web' in chunk) || [];

    return { text, sources };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};
