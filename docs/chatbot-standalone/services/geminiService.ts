
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { Message, Role, Source } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = "You are a friendly and conversational expert on the American Revolutionary War. Your knowledge should be in-depth, covering key figures, society, key places, and other relevant topics. Keep your answers as short and concise as possible.";

export const getChatResponse = async (history: Message[]): Promise<{ text: string, sources: Source[] }> => {
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
