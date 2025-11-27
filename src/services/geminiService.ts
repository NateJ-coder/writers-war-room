import { GoogleGenAI, GenerateContentResponse, Content, Type } from "@google/genai";
import { Message, Role, Source } from '../types/chatbot';
import { getWebsiteContext, formatContextForAI } from './contentContext';
import type { Suggestion } from '../types/editor';
import { SuggestionType } from '../types/editor';

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

  const prompt = `You are a professional book editor. Take this raw manuscript draft and refine it ONLY for formatting and organization.

CRITICAL RULES:
1. Do NOT rewrite or rephrase any content
2. Do NOT create variations of existing text
3. Do NOT add any new story content
4. ONLY fix obvious typos and punctuation errors
5. ONLY add paragraph breaks where clearly needed
6. ONLY add chapter headings if not present

Your job is to format, not rewrite. Return the EXACT same story content, just better formatted.

Format it with:
- Clear chapter breaks (if missing)
- Proper paragraph spacing
- Consistent punctuation
- Maintained narrative flow

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

// Search for images using Google Custom Search API
export const searchImages = async (query: string): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_CX;
  
  if (!apiKey || !searchEngineId) {
    console.error("Google API key or Search Engine ID not configured");
    // Fallback to placeholder images
    const encodedQuery = encodeURIComponent(query);
    return [
      `https://source.unsplash.com/800x600/?${encodedQuery}`,
      `https://source.unsplash.com/800x600/?${encodedQuery},1`,
      `https://source.unsplash.com/800x600/?${encodedQuery},2`
    ];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodedQuery}&searchType=image&num=3`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract image URLs from results
    if (data.items && data.items.length > 0) {
      return data.items.map((item: any) => item.link);
    }
    
    // No results found, return empty array
    return [];
  } catch (error) {
    console.error("Error searching images:", error);
    // Fallback to placeholder images on error
    const encodedQuery = encodeURIComponent(query);
    return [
      `https://source.unsplash.com/800x600/?${encodedQuery}`,
      `https://source.unsplash.com/800x600/?${encodedQuery},1`,
      `https://source.unsplash.com/800x600/?${encodedQuery},2`
    ];
  }
};

// AI Editor: Get editing suggestions for manuscript text
const suggestionSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: Object.values(SuggestionType),
      description: "The category of the suggestion.",
    },
    original: {
      type: Type.STRING,
      description: "The exact, original text snippet from the manuscript that needs editing.",
    },
    suggestion: {
      type: Type.STRING,
      description: "The suggested replacement text or a comment for improvement.",
    },
    explanation: {
      type: Type.STRING,
      description: "A brief, clear explanation for why the change is recommended.",
    },
  },
  required: ["type", "original", "suggestion", "explanation"],
};

export const getEditingSuggestions = async (text: string): Promise<Suggestion[]> => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.");
  }

  const model = 'gemini-2.0-flash-exp';

  const systemInstruction = `You are an expert editor for a best-selling author. Your task is to analyze the provided manuscript text and identify areas for improvement. Provide specific, actionable suggestions.
Focus on the following categories:
- GRAMMAR: Correct spelling, punctuation, and grammatical errors.
- CLARITY: Rephrase sentences that are ambiguous, confusing, or poorly structured.
- STYLE: Suggest improvements to tone, word choice, and sentence flow to make the writing more engaging.
- REDUNDANCY: Identify and suggest removal or consolidation of repetitive words, phrases, or ideas.
- DUPLICATE: Pinpoint entire sentences or passages that are repeated verbatim or nearly verbatim elsewhere in the text.
- CHARACTER_CONSISTENCY: Flag any contradictions in a character's appearance, behavior, abilities, or backstory. For example, if a character has blue eyes in one chapter and brown in another, or acts completely out of character without justification.
- TONE_STYLE: Analyze the overall tone (e.g., formal, humorous, suspenseful) and writing style. Provide suggestions to maintain consistency or enhance the narrative effect. For instance, point out if a section's tone clashes with the rest of the chapter, or suggest stylistic changes to improve pacing. For TONE_STYLE suggestions, the 'original' text can be a representative passage.

For each suggestion, you must provide the original text snippet, your proposed change, and a concise explanation. Do not suggest changes for the entire text at once; break it down into smaller, individual suggestions. Ensure the 'original' field is an exact substring from the input text.

Return your findings as a JSON array of suggestion objects.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [{
        role: 'user',
        parts: [{ text }],
      }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: suggestionSchema,
        },
        temperature: 0.3,
      }
    });

    const jsonText = response.text?.trim() ?? "";
    if (!jsonText) {
      return [];
    }
    
    const suggestionsData = JSON.parse(jsonText) as Omit<Suggestion, 'id'>[];

    // Add a unique ID to each suggestion for React key purposes
    return suggestionsData.map((s, index) => ({
      ...s,
      id: `${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Error calling Gemini API for editing suggestions:", error);
    if (error instanceof Error && error.message.includes('json')) {
      throw new Error("The AI returned an invalid format. Please try again with a different text or a shorter selection.");
    }
    throw new Error("Failed to get suggestions from the AI. Please check your API key and network connection.");
  }
};
