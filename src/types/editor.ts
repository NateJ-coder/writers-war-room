export enum SuggestionType {
  GRAMMAR = 'GRAMMAR',
  CLARITY = 'CLARITY',
  STYLE = 'STYLE',
  REDUNDANCY = 'REDUNDANCY',
  DUPLICATE = 'DUPLICATE',
  CHARACTER_CONSISTENCY = 'CHARACTER_CONSISTENCY',
  TONE_STYLE = 'TONE_STYLE',
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  original: string;
  suggestion: string;
  explanation: string;
}
