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
- SEARCH_BOOK: {"action": "search_book", "query": "search terms", "excerpt": "relevant excerpt from book"} - Searches the book draft and returns relevant excerpt
- HIGHLIGHT_TEXT: {"action": "highlight_text", "text": "text to highlight", "context": "brief explanation"} - Highlights specific text in the writing area

**Book Draft Search Capabilities:**
When a user asks to "pull up", "find", "show me", or references existing content from their book, use the SEARCH_BOOK command.
Extract the most relevant excerpt (up to 500 characters) that matches their query.
For "find where" queries, include the exact text they're looking for in the excerpt field.

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
    
    const rawText = response.text ?? "I'm at a loss for words...";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: Source[] = groundingChunks?.filter((chunk): chunk is Source => 'web' in chunk) || [];

    // Extract commands from response
    const commands = extractCommands(rawText);
    
    // Clean the text to remove JSON commands
    const text = cleanResponseText(rawText);

    return { text, sources, commands };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};

// Extract and remove JSON commands from AI response
const extractCommands = (text: string): any[] => {
  const commands: any[] = [];
  // Match both single-line and multi-line JSON objects
  const jsonRegex = /\{[\s\S]*?"action"[\s\S]*?\}/g;
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

// Remove JSON commands from response text for cleaner display
const cleanResponseText = (text: string): string => {
  // Remove JSON command blocks
  let cleaned = text.replace(/\{[^{}]*"action"[^{}]*\}/g, '').trim();
  
  // Remove extra whitespace and empty lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // If text is now empty or just whitespace after removing commands, return a confirmation
  if (!cleaned || cleaned.trim().length === 0) {
    return 'Done! ✓';
  }
  
  return cleaned;
};

// Refine writing draft for organized book format
export const refineBookDraft = async (rawDraft: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key not configured.");
  }

  const prompt = `You are a professional book editor. Take this raw manuscript draft and refine it for better organization and layout while preserving the author's voice and story. 

Format it as a proper book manuscript with:
- Clear chapter breaks
- Proper paragraph spacing
- Section divisions where appropriate
- Maintained narrative flow
- Minor grammar/punctuation fixes only

Keep ALL the content, just organize and format it better. Do not add or remove story content.

Here is the draft:

${rawDraft}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });

    return response.text ?? rawDraft;
  } catch (error) {
    console.error("Error refining draft:", error);
    return rawDraft; // Return original if refinement fails
  }
};

// Search book draft for specific content
export const searchBookDraft = async (query: string, bookContent: string): Promise<{
  found: boolean;
  excerpt: string;
  position: number;
}> => {
  if (!ai) {
    throw new Error("Gemini API key not configured.");
  }

  const prompt = `Search this book manuscript for content related to: "${query}"

Find the most relevant paragraph or section that matches this query. Return ONLY valid JSON in this exact format:
{
  "found": true/false,
  "excerpt": "the relevant excerpt (up to 500 characters)",
  "context": "brief explanation of what was found"
}

Book manuscript:
${bookContent.substring(0, 10000)}...`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });

    const text = response.text ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      
      // Find the position of this excerpt in the full text
      let position = -1;
      if (result.found && result.excerpt) {
        // Try to find exact match or close match
        const excerptStart = result.excerpt.substring(0, 50).trim();
        position = bookContent.toLowerCase().indexOf(excerptStart.toLowerCase());
      }
      
      return {
        found: result.found || false,
        excerpt: result.excerpt || '',
        position: position
      };
    }
    return { found: false, excerpt: '', position: -1 };
  } catch (error) {
    console.error("Error searching book draft:", error);
    return { found: false, excerpt: '', position: -1 };
  }
};

// Analyze draft and extract story elements
export const analyzeDraftForElements = async (draft: string): Promise<{
  characters: any[];
  places: any[];
  events: any[];
}> => {
  if (!ai) {
    throw new Error("Gemini API key not configured.");
  }

  const prompt = `Analyze this manuscript and extract story elements. Return ONLY valid JSON in this exact format:
{
  "characters": [{"name": "Character Name", "description": "brief description"}],
  "places": [{"name": "Place Name", "description": "brief description"}],
  "events": [{"name": "Event Name", "description": "brief description"}]
}

Manuscript:
${draft.substring(0, 3000)}...`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });

    const text = response.text ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { characters: [], places: [], events: [] };
  } catch (error) {
    console.error("Error analyzing draft:", error);
    return { characters: [], places: [], events: [] };
  }
};

// Format sticky note content with AI
export const formatStickyNote = async (content: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API key not configured.");
  }

  const prompt = `Format this sticky note content to be concise and well-organized. Use:
- <strong>bold</strong> for important words/names
- <mark style="background: #ffeb3b;">highlighting</mark> for key points
- <ul><li>bullet points</li></ul> for lists
- Line breaks for readability

Keep it SHORT and scannable. Return ONLY the formatted HTML (no explanations).

Content: "${content}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });

    return response.text ?? content;
  } catch (error) {
    console.error("Error formatting sticky note:", error);
    return content;
  }
};

// Search for images based on description (returns placeholder URLs for now)
export const searchImages = async (query: string): Promise<string[]> => {
  // Note: This is a placeholder. In a real implementation, you'd integrate with:
  // - Unsplash API
  // - Pexels API
  // - Google Custom Search API
  // For now, we'll return Unsplash placeholder URLs
  
  const encodedQuery = encodeURIComponent(query);
  return [
    `https://source.unsplash.com/800x600/?${encodedQuery}`,
    `https://source.unsplash.com/800x600/?${encodedQuery},1`,
    `https://source.unsplash.com/800x600/?${encodedQuery},2`
  ];
};
