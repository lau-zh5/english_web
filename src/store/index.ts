import { create } from 'zustand';
import { Word, Article, StudyRecord, Note, AudioItem, Wordbook, Chapter } from '../types';

import { apiFetch } from '../lib/api';

interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  dailyWordGoal?: number;
  dailyListeningGoal?: number;
  dailyReadingGoal?: number;
}

interface AppState {
  words: Word[];
  articles: Article[];
  records: StudyRecord[];
  notes: Note[];
  audios: AudioItem[];
  wordbooks: Wordbook[];
  chapters: Chapter[];
  currentWordbook: Wordbook | null;
  currentChapter: Chapter | null;
  currentUser: User | null;
  
  loadWordbooks: () => Promise<void>;
  addWordbook: (name: string, description?: string) => Promise<Wordbook>;
  updateWordbook: (id: number, updates: Partial<Wordbook>) => Promise<void>;
  deleteWordbook: (id: number) => Promise<void>;
  
  loadChapters: (wordbookId: number) => Promise<void>;
  loadAllChapters: () => Promise<void>;
  addChapter: (wordbookId: number, name: string, chapterOrder?: number) => Promise<Chapter>;
  updateChapter: (id: number, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: number) => Promise<void>;
  uploadChapterAudio: (chapterId: number, file: File) => Promise<string>;
  
  loadWords: (chapterId?: number, wordbookId?: number) => Promise<void>;
  loadReadingWords: () => Promise<void>;
  addWord: (word: Omit<Word, 'id' | 'createdAt' | 'lastReviewedAt' | 'reviewCount'>) => Promise<Word>;
  updateWord: (id: string | number, updates: Partial<Word>) => Promise<void>;
  deleteWord: (id: string | number) => Promise<void>;
  batchAddWords: (words: Array<{word: string; phonetic?: string; meaning: string; example?: string}>, wordbookId?: number, chapterId?: number) => Promise<void>;
  uploadWordAudio: (wordId: number, file: File) => Promise<string>;
  
  loadArticles: () => Promise<void>;
  addArticle: (article: Omit<Article, 'id' | 'createdAt' | 'wordCount'>) => Promise<void>;
  updateArticle: (id: number, updates: Partial<Article>) => Promise<void>;
  deleteArticle: (id: number) => Promise<void>;
  
  loadQuestions: (articleId: string | number) => Promise<any[]>;
  addQuestions: (articleId: string | number, questions: any[]) => Promise<any[]>;
  
  loadRecords: () => Promise<void>;
  updateTodayRecord: (updates: Partial<StudyRecord>) => void;
  
  loadNotes: () => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  
  loadAudios: () => Promise<void>;
  uploadAudio: (title: string, category: string, file: File) => Promise<void>;
  deleteAudio: (id: number | string) => Promise<void>;
  
  loadCurrentUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  words: [],
  articles: [],
  records: [],
  notes: [],
  audios: [],
  wordbooks: [],
  chapters: [],
  currentWordbook: null,
  currentChapter: null,
  currentUser: null,
  
  loadWordbooks: async () => {
    try {
      const response = await apiFetch(`/wordbooks`);
      const data = await response.json();
      set({ wordbooks: data });
    } catch (error) {
      console.error('Failed to load wordbooks:', error);
      set({ wordbooks: [] });
    }
  },
  
  addWordbook: async (name, description) => {
    try {
      const response = await apiFetch(`/wordbooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const newWordbook = await response.json();
      set(state => ({ wordbooks: [...state.wordbooks, newWordbook] }));
      return newWordbook;
    } catch (error) {
      console.error('Failed to add wordbook:', error);
      throw error;
    }
  },
  
  updateWordbook: async (id, updates) => {
    try {
      await apiFetch(`/wordbooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      set(state => ({
        wordbooks: state.wordbooks.map(w => w.id === id ? { ...w, ...updates } : w)
      }));
    } catch (error) {
      console.error('Failed to update wordbook:', error);
    }
  },
  
  deleteWordbook: async (id) => {
    try {
      await apiFetch(`/wordbooks/${id}`, { method: 'DELETE' });
      set(state => ({ wordbooks: state.wordbooks.filter(w => w.id !== id) }));
    } catch (error) {
      console.error('Failed to delete wordbook:', error);
    }
  },
  
  loadChapters: async (wordbookId) => {
    try {
      const response = await apiFetch(`/chapters/wordbook/${wordbookId}`);
      const data = await response.json();
      set({ chapters: data });
    } catch (error) {
      console.error('Failed to load chapters:', error);
      set({ chapters: [] });
    }
  },
  
  loadAllChapters: async () => {
    try {
      const response = await apiFetch(`/chapters`);
      const data = await response.json();
      set({ chapters: data });
    } catch (error) {
      console.error('Failed to load all chapters:', error);
      set({ chapters: [] });
    }
  },
  
  addChapter: async (wordbookId, name, chapterOrder) => {
    try {
      const response = await apiFetch(`/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordbook_id: wordbookId, name, chapter_order: chapterOrder }),
      });
      const newChapter = await response.json();
      set(state => ({ chapters: [...state.chapters, newChapter] }));
      return newChapter;
    } catch (error) {
      console.error('Failed to add chapter:', error);
      throw error;
    }
  },
  
  updateChapter: async (id, updates) => {
    try {
      await apiFetch(`/chapters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      set(state => ({
        chapters: state.chapters.map(c => c.id === id ? { ...c, ...updates } : c)
      }));
    } catch (error) {
      console.error('Failed to update chapter:', error);
    }
  },
  
  deleteChapter: async (id) => {
    try {
      await apiFetch(`/chapters/${id}`, { method: 'DELETE' });
      set(state => ({ chapters: state.chapters.filter(c => c.id !== id) }));
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  },
  
  uploadChapterAudio: async (chapterId, file) => {
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('chapter_id', chapterId.toString());
      
      const response = await apiFetch(`/chapters/audio`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      set(state => ({
        chapters: state.chapters.map(c => 
          c.id === chapterId ? { ...c, audio_path: data.file_path } : c
        )
      }));
      return data.file_path;
    } catch (error) {
      console.error('Failed to upload chapter audio:', error);
      throw error;
    }
  },
  
  loadWords: async (chapterId, wordbookId) => {
    try {
      let url = `/words?`;
      if (chapterId) url += `chapter_id=${chapterId}`;
      if (wordbookId) url += `wordbook_id=${wordbookId}`;
      
      const response = await apiFetch(url);
      const data = await response.json();
      const transformedData = data.map((word: any) => ({
        ...word,
        lastReviewedAt: word.last_reviewed || word.last_reviewed_at || word.lastReviewedAt,
        reviewCount: word.review_count || word.reviewCount,
        createdAt: word.created_at || word.createdAt
      }));
      set({ words: transformedData });
    } catch (error) {
      console.error('Failed to load words:', error);
      set({ words: [] });
    }
  },
  
  loadReadingWords: async () => {
    try {
      const response = await apiFetch(`/words/reading`);
      const data = await response.json();
      const transformedData = data.map((word: any) => ({
        ...word,
        lastReviewedAt: word.last_reviewed || word.last_reviewed_at || word.lastReviewedAt,
        reviewCount: word.review_count || word.reviewCount,
        createdAt: word.created_at || word.createdAt
      }));
      set({ words: transformedData });
    } catch (error) {
      console.error('Failed to load reading words:', error);
      set({ words: [] });
    }
  },
  
  addWord: async (wordData) => {
    try {
      const response = await apiFetch(`/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordData),
      });
      const newWord = await response.json();
      set(state => ({ words: [...state.words, newWord] }));
      return newWord;
    } catch (error) {
      console.error('Failed to add word:', error);
      throw error;
    }
  },
  
  updateWord: async (id, updates) => {
    try {
      await apiFetch(`/words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      set(state => ({ 
        words: state.words.map(w => w.id === id ? { ...w, ...updates } : w)
      }));
    } catch (error) {
      console.error('Failed to update word:', error);
    }
  },
  
  deleteWord: async (id) => {
    try {
      await apiFetch(`/words/${id}`, { method: 'DELETE' });
      set(state => ({ words: state.words.filter(w => w.id !== id) }));
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  },
  
  batchAddWords: async (words, wordbookId, chapterId) => {
    try {
      const response = await apiFetch(`/words/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          words, 
          wordbook_id: wordbookId, 
          chapter_id: chapterId 
        }),
      });
      const newWords = await response.json();
      set(state => ({ words: [...state.words, ...newWords] }));
    } catch (error) {
      console.error('Failed to batch add words:', error);
      throw error;
    }
  },
  
  uploadWordAudio: async (wordId, file) => {
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('word_id', wordId.toString());
      
      const response = await apiFetch(`/words/audio`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      set(state => ({
        words: state.words.map(w => 
          w.id === wordId ? { ...w, audio_path: data.file_path } : w
        )
      }));
      return data.file_path;
    } catch (error) {
      console.error('Failed to upload word audio:', error);
      throw error;
    }
  },
  
  loadArticles: async () => {
    try {
      const response = await apiFetch(`/articles`);
      const data = await response.json();
      const formattedArticles = data.map((article: any) => ({
        ...article,
        wordCount: article.word_count || article.wordCount,
      }));
      set({ articles: formattedArticles });
    } catch {
      set({ articles: [] });
    }
  },
  
  addArticle: async (articleData) => {
    try {
      const response = await apiFetch(`/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });
      const newArticle = await response.json();
      set(state => ({ articles: [...state.articles, newArticle] }));
    } catch (error) {
      console.error('Failed to add article:', error);
    }
  },

  updateArticle: async (id, updates) => {
    try {
      await apiFetch(`/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      set(state => ({
        articles: state.articles.map(a => a.id === id ? { ...a, ...updates } : a)
      }));
    } catch (error) {
      console.error('Failed to update article:', error);
    }
  },

  deleteArticle: async (id) => {
    try {
      await apiFetch(`/articles/${id}`, { method: 'DELETE' });
      set(state => ({ articles: state.articles.filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  },
  
  loadQuestions: async (articleId) => {
    try {
      const response = await apiFetch(`/questions/article/${articleId}`);
      return await response.json();
    } catch {
      return [];
    }
  },
  
  addQuestions: async (articleId, questions) => {
    try {
      const response = await apiFetch(`/questions/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, questions }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to add questions:', error);
      return [];
    }
  },
  
  loadRecords: async () => {
    try {
      const response = await apiFetch(`/study_records`);
      const data = await response.json();
      set({ records: data });
    } catch {
      set({ records: [] });
    }
  },
  
  updateTodayRecord: async (updates) => {
    set(state => {
      const today = new Date().toISOString().split('T')[0];
      const existingIndex = state.records.findIndex(r => r.date === today);
      const newRecords = [...state.records];
      
      if (existingIndex >= 0) {
        newRecords[existingIndex] = { ...newRecords[existingIndex], ...updates };
      } else {
        newRecords.push({
          id: crypto.randomUUID(),
          date: today,
          wordsLearned: 0,
          listeningMinutes: 0,
          articlesRead: 0,
          ...updates,
        });
      }
      
      return { records: newRecords };
    });
  },
  
  loadNotes: async () => {
    try {
      const response = await apiFetch(`/notes`);
      const data = await response.json();
      const formattedNotes = data.map((note: any) => ({
        id: note.id,
        audioId: String(note.audio_id),
        content: note.content,
        timestamp: note.timestamp,
        createdAt: note.created_at,
      }));
      set({ notes: formattedNotes });
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  },
  
  addNote: async (noteData) => {
    try {
      const response = await apiFetch(`/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioId: noteData.audioId,
          content: noteData.content,
          timestamp: noteData.timestamp,
        }),
      });
      const newNote = await response.json();
      const formattedNote = {
        id: newNote.id,
        audioId: String(newNote.audio_id),
        content: newNote.content,
        timestamp: newNote.timestamp,
        createdAt: newNote.created_at,
      };
      set(state => ({ notes: [...state.notes, formattedNote] }));
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  },
  
  loadAudios: async () => {
    try {
      const response = await apiFetch(`/audios`);
      const data = await response.json();
      set({ audios: data });
    } catch {
      set({ audios: [] });
    }
  },
  
  uploadAudio: async (title, category, file) => {
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      formData.append('category', category);
      
      const response = await apiFetch(`/audios`, {
        method: 'POST',
        body: formData,
      });
      
      const newAudio = await response.json();
      set(state => ({ audios: [...state.audios, newAudio] }));
    } catch (error) {
      console.error('Failed to upload audio:', error);
    }
  },
  
  deleteAudio: async (id) => {
    try {
      await apiFetch(`/audios/${id}`, { method: 'DELETE' });
      set(state => ({ audios: state.audios.filter(a => a.id !== id) }));
    } catch {
      set(state => ({ audios: state.audios.filter(a => a.id !== id) }));
    }
  },
  
  loadCurrentUser: async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id) {
          try {
            const response = await apiFetch(`/users/${user.id}`);
            if (response.ok) {
              const userInfo = await response.json();
              set({ currentUser: userInfo });
              return;
            }
          } catch (apiError) {
            console.error('Failed to fetch user from API:', apiError);
          }
        }
        set({ currentUser: { id: user.id, username: user.username } });
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  },
  
  updateUser: async (data) => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const response = await apiFetch(`/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          await response.json();
          set(state => ({ 
            currentUser: { 
              ...state.currentUser!, 
              ...data 
            } 
          }));
          
          if (data.username) {
            localStorage.setItem('user', JSON.stringify({ ...user, username: data.username }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },
}));
