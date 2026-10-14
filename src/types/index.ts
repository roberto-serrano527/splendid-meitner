export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'idiom'
  | 'preposition'
  | 'conjunction'
  | 'other';

export type SRSGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Deck {
  id: string;
  title: string;
  description: string;
  targetLang: string; // e.g. 'en-US', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'es-ES'
  sourceLang: string; // e.g. 'es-ES', 'en-US'
  color: string;      // tailwind accent color key, e.g. 'indigo', 'emerald', 'violet', 'amber'
  createdAt: number;
  updatedAt: number;
}

export interface Card {
  id: string;
  deckId: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: PartOfSpeech | string;
  translation: string;
  definition?: string;
  example?: string;
  exampleTranslation?: string;
  notes?: string;
  tags?: string[];
  // SRS SM-2 fields
  srsRepetitions: number;
  srsInterval: number;     // Days until next review
  srsEaseFactor: number;   // Ease factor, starts at 2.5, min 1.3
  dueDate: number;         // Timestamp (ms)
  state: CardState;
  createdAt: number;
  updatedAt: number;
}

export interface StudyLog {
  id: string;
  cardId: string;
  deckId: string;
  grade: SRSGrade;
  timestamp: number;
  previousInterval: number;
  newInterval: number;
}

export interface ExportData {
  version: 1;
  exportDate: string;
  deck: Partial<Deck>;
  cards: Array<Partial<Card>>;
}
