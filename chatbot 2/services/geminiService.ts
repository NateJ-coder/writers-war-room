
import { GoogleGenAI, Chat } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

const MODEL_NAME = 'gemini-2.5-flash';

let chat: Chat | null = null;

async function getChatSession(): Promise<Chat> {
  if (chat) {
    return chat;
  }

  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable not set');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return chat;
}

export async function runChat(message: string): Promise<string> {
  try {
    const chatSession = await getChatSession();
    const response = await chatSession.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    // Invalidate chat session on error
    chat = null;
    throw error;
  }
}
