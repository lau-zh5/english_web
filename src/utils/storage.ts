import { Word, Article, StudyRecord, Note, AudioItem } from '../types';

const STORAGE_KEYS = {
  WORDS: 'english_learning_words',
  ARTICLES: 'english_learning_articles',
  RECORDS: 'english_learning_records',
  NOTES: 'english_learning_notes',
  AUDIOS: 'english_learning_audios',
};

export const storage = {
  getWords: (): Word[] => {
    const data = localStorage.getItem(STORAGE_KEYS.WORDS);
    return data ? JSON.parse(data) : [];
  },
  
  saveWords: (words: Word[]): void => {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
  },
  
  getArticles: (): Article[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    return data ? JSON.parse(data) : getDefaultArticles();
  },
  
  saveArticles: (articles: Article[]): void => {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
  },
  
  getRecords: (): StudyRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },
  
  saveRecords: (records: StudyRecord[]): void => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },
  
  getNotes: (): Note[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  },
  
  saveNotes: (notes: Note[]): void => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },
  
  getAudios: (): AudioItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIOS);
    return data ? JSON.parse(data) : getDefaultAudios();
  },
  
  saveAudios: (audios: AudioItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.AUDIOS, JSON.stringify(audios));
  },
  
  getTodayRecord: (): StudyRecord | null => {
    const records = storage.getRecords();
    const today = new Date().toISOString().split('T')[0];
    return records.find(r => r.date === today) || null;
  },
  
  updateTodayRecord: (updates: Partial<StudyRecord>): void => {
    const records = storage.getRecords();
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = records.findIndex(r => r.date === today);
    
    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], ...updates };
    } else {
      records.push({
        id: crypto.randomUUID(),
        date: today,
        wordsLearned: 0,
        listeningMinutes: 0,
        articlesRead: 0,
        ...updates,
      });
    }
    
    storage.saveRecords(records);
  },
};

function getDefaultArticles(): Article[] {
  return [
    {
      id: 1,
      title: 'The Importance of Reading',
      content: `Reading is one of the most important skills we can develop. It opens doors to new worlds, ideas, and perspectives. When we read, we not only learn new information but also improve our vocabulary and critical thinking abilities.

Many successful people attribute their success to their reading habits. They read books on various topics, from science to philosophy, from history to technology. This broad knowledge base helps them make better decisions and solve problems more creatively.

In today's digital age, reading has become even more accessible. We can read books on our phones, tablets, and computers. However, it's important to choose quality content and make time for focused reading without distractions.

The benefits of reading extend beyond personal growth. It can reduce stress, improve focus and concentration, and even help us sleep better. So why not pick up a book today and start your reading journey?`,
      difficulty: 'medium',
      wordCount: 156,
      questions: [
        {
          id: '1',
          question: 'What is one benefit of reading mentioned in the text?',
          options: ['Improving vocabulary', 'Making money', 'Playing games', 'Watching movies'],
          correctAnswer: 0,
          type: 'choice',
          explanation: 'The text mentions that reading helps improve vocabulary and critical thinking abilities.',
        },
        {
          id: '2',
          question: 'Why do successful people read according to the passage?',
          options: ['To pass time', 'To gain broad knowledge', 'To avoid work', 'To show off'],
          correctAnswer: 1,
          type: 'choice',
          explanation: 'The passage states that successful people read to gain a broad knowledge base that helps them make better decisions.',
        },
        {
          id: '3',
          question: 'What has made reading more accessible in modern times?',
          options: ['Libraries', 'Digital devices', 'Schools', 'Teachers'],
          correctAnswer: 1,
          type: 'choice',
          explanation: 'The text mentions that in the digital age, we can read on phones, tablets, and computers.',
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Climate Change and Our Planet',
      content: `Climate change is one of the biggest challenges facing our planet today. Rising temperatures, melting ice caps, and extreme weather events are becoming more common. Scientists warn that we need to take action now to prevent further damage.

The main cause of climate change is the increase in greenhouse gases, particularly carbon dioxide, in our atmosphere. These gases trap heat and cause the Earth's temperature to rise. Human activities such as burning fossil fuels, deforestation, and industrial processes contribute significantly to this problem.

However, there is hope. Many countries are investing in renewable energy sources like solar and wind power. Individuals can also make a difference by reducing their carbon footprint through simple actions like using public transportation, recycling, and conserving energy.

Education plays a crucial role in addressing climate change. When people understand the science behind it and the impact of their actions, they are more likely to make environmentally conscious choices. Together, we can work towards a sustainable future for generations to come.`,
      difficulty: 'hard',
      wordCount: 168,
      questions: [
        {
          id: '1',
          question: 'What is the main cause of climate change?',
          options: ['Solar flares', 'Greenhouse gases', 'Ocean currents', 'Volcanic eruptions'],
          correctAnswer: 1,
          type: 'choice',
          explanation: 'The text clearly states that the main cause is the increase in greenhouse gases, particularly carbon dioxide.',
        },
        {
          id: '2',
          question: 'Which renewable energy sources are mentioned?',
          options: ['Nuclear and hydro', 'Solar and wind', 'Geothermal and tidal', 'Biomass and hydrogen'],
          correctAnswer: 1,
          type: 'choice',
          explanation: 'The passage mentions that countries are investing in solar and wind power.',
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Learning a New Language',
      content: `Learning a new language is an exciting journey that opens many doors. Whether you want to travel, advance your career, or simply challenge yourself, acquiring a new language can be incredibly rewarding.

The key to successful language learning is consistency. Studying for just 15-30 minutes every day is more effective than cramming for hours once a week. Find methods that work for you, whether it's using language apps, watching movies, or practicing with native speakers.

Don't be afraid to make mistakes. Making errors is a natural part of the learning process. Each mistake is an opportunity to learn and improve. Native speakers appreciate when you try to speak their language, even if you're not perfect.

Immersion is one of the most effective ways to learn. If you can't travel to a country where the language is spoken, create your own immersion environment. Listen to music, watch shows, read books, and change your phone's language settings. The more you surround yourself with the language, the faster you'll progress.`,
      difficulty: 'easy',
      wordCount: 172,
      questions: [
        {
          id: '1',
          question: 'What is the key to successful language learning?',
          options: ['Natural talent', 'Expensive courses', 'Consistency', 'Living abroad'],
          correctAnswer: 2,
          type: 'choice',
          explanation: 'The text states that consistency is the key - studying 15-30 minutes daily is more effective than cramming.',
        },
        {
          id: '2',
          question: 'Why should you not be afraid of making mistakes?',
          options: [
            'Mistakes are impossible',
            'Native speakers will correct you',
            'Mistakes are learning opportunities',
            'You will never make mistakes',
          ],
          correctAnswer: 2,
          type: 'choice',
          explanation: 'The passage explains that making errors is natural and each mistake is an opportunity to learn.',
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ];
}

function getDefaultAudios(): AudioItem[] {
  return [
    {
      id: 1,
      title: 'Daily Conversation Practice',
      category: 'Conversation',
      duration: 180,
      audioUrl: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'News Report: Technology',
      category: 'News',
      duration: 240,
      audioUrl: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Short Story: The Lost Key',
      category: 'Story',
      duration: 300,
      audioUrl: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      title: 'Business English: Meeting',
      category: 'Business',
      duration: 210,
      audioUrl: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 5,
      title: 'Academic Lecture: Environment',
      category: 'Academic',
      duration: 360,
      audioUrl: '',
      createdAt: new Date().toISOString(),
    },
  ];
}
