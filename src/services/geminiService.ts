import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { Message, Role, Source } from '../types/chatbot';
import { getWebsiteContext, formatContextForAI } from './contentContext';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const SYSTEM_INSTRUCTION = `You are an advanced AI writing assistant integrated into the Writer's War-Room application. You have full context of the user's project and can help in multiple ways:

**Your Capabilities:**
1. View all project content: pinboard notes, characters, places, events, story outline, and writing draft
2. Execute commands to modify the project
3. Provide writing advice, character development, plot ideas, and world-building suggestions
4. Automatically analyze writing and suggest updates to Contents and Outline pages

**Commands you can execute (use JSON format in your response):**
- ADD_NOTE: {"action": "add_note", "text": "note content"} - Adds a sticky note to the pinboard
- ADD_CHARACTER: {"action": "add_character", "name": "Character Name", "description": "description"}
- ADD_PLACE: {"action": "add_place", "name": "Place Name", "description": "description"}
- ADD_EVENT: {"action": "add_event", "name": "Event Name", "description": "description"}

When a user asks you to add a sticky note or create something, include the appropriate JSON command in your response.
Keep your text answers concise and actionable. You have access to the current project context which will be provided with each message.`;

export interface CommandResponse {
  text: string;
  sources: Source[];
  commands?: any[];
}

export const getChatResponse = async (history: Message[], includeContext: boolean = false): Promise<CommandResponse> => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.");
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Get website context if requested
    let contextMessage = '';
    if (includeContext) {
      const context = getWebsiteContext();
      contextMessage = formatContextForAI(context);
    }
    
    // Format history for the API, prepending system instruction and context
    const contents: Content[] = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I have full access to view and modify your project content. I will help you with writing assistance and can execute commands to update your project.' }],
      }
    ];
    
    // Add context before the conversation if available
    if (contextMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: contextMessage }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'I have reviewed your current project context.' }],
      });
    }
    
    // Add conversation history
    contents.push(...history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })));

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text ?? "I'm at a loss for words...";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: Source[] = groundingChunks?.filter((chunk): chunk is Source => 'web' in chunk) || [];

    // Extract commands from response
    const commands = extractCommands(text);

    return { text, sources, commands };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};

// Extract JSON commands from AI response
const extractCommands = (text: string): any[] => {
  const commands: any[] = [];
  const jsonRegex = /\{[^{}]*"action"[^{}]*\}/g;
  const matches = text.match(jsonRegex);
  
  if (matches) {
    matches.forEach(match => {
      try {
        const command = JSON.parse(match);
        if (command.action) {
          commands.push(command);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });
  }
  
  return commands;
};
