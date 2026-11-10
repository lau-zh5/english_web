export interface Word {
  id: number | string;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  status: 'new' | 'learning' | 'mastered';
  wordbook_id?: number | null;
  chapter_id?: number | null;
  audio_path?: string | null;
  wordbook_name?: string;
  chapter_name?: string;
  source_type?: 'manual' | 'reading';
  source_id?: number | null;
  source_title?: string;
  is_polysemous?: boolean | number;
  is_similar?: boolean | number;
  createdAt?: string;
  lastReviewedAt?: string | null;
  reviewCount?: number;
}

export interface Wordbook {
  id: number;
  name: string;
  description: string;
  word_count?: number;
  chapter_count?: number;
  ebook_path?: string | null;
  chapters?: Chapter[];
  words?: Word[];
}

export interface Chapter {
  id: number;
  wordbook_id: number;
  name: string;
  chapter_order: number;
  audio_path?: string | null;
  word_count?: number;
  words?: Word[];
}

export interface AudioItem {
  id: number;
  title: string;
  category: string;
  duration: number;
  audioUrl?: string;
  file_path?: string;
  createdAt?: string;
}

export interface Article {
  id: number | string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount?: number;
  questions?: Question[];
  createdAt?: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number | null;
  correctAnswerText?: string;
  explanation: string;
  type: 'choice' | 'fill';
}

export interface StudyRecord {
  id: number | string;
  date: string;
  wordsLearned: number;
  listeningMinutes: number;
  articlesRead: number;
}

export interface Note {
  id: string;
  audioId: string;
  content: string;
  timestamp: string;
  createdAt: string;
}

export type WordStatus = 'new' | 'learning' | 'mastered';
