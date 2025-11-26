import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export interface ConsistencyIssue {
  type: 'character' | 'plot' | 'timeline' | 'setting' | 'other';
  severity: 'high' | 'medium' | 'low';
  issue: string;
  location: string;
  suggestion?: string;
}

export const checkConsistency = async (bookContent: string): Promise<ConsistencyIssue[]> => {
  if (!ai) {
    throw new Error("Gemini API key not configured.");
  }

  const prompt = `Analyze this book manuscript for consistency issues. Check for:
1. Character inconsistencies (appearance, personality, abilities changes)
2. Plot holes or contradictions
3. Timeline inconsistencies
4. Setting/world-building contradictions
5. Continuity errors

Return ONLY valid JSON array in this format:
[
  {
    "type": "character|plot|timeline|setting|other",
    "severity": "high|medium|low",
    "issue": "description of the issue",
    "location": "where in the manuscript (chapter/scene reference)",
    "suggestion": "optional suggestion to fix"
  }
]

Manuscript (first 8000 chars):
${bookContent.substring(0, 8000)}...`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });

    const text = response.text ?? '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error checking consistency:", error);
    return [];
  }
};
