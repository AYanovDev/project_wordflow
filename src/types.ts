export interface Word {
  word: string;
  translation: string;
  definition?: string;
  partOfSpeech?: string;
  synonyms?: string[];
  antonyms?: string[];
  progress?: number;
}

export interface LearningData {
  grade: string;
  module: string;
}

export type MatchSide = "word" | "synonym" | "antonym";
export type FeedbackType = "correct" | "incorrect";
