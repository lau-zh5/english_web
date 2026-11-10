import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database';
import wordRoutes from './routes/wordRoutes';
import chapterRoutes from './routes/chapterRoutes';
import wordbookRoutes from './routes/wordbookRoutes';
import audioRoutes from './routes/audioRoutes';
import articleRoutes from './routes/articleRoutes';
import questionRoutes from './routes/questionRoutes';
import studyRecordRoutes from './routes/studyRecordRoutes';
import ebookRoutes from './routes/ebookRoutes';
import noteRoutes from './routes/noteRoutes';
import userRoutes from './routes/userRoutes';
import quoteRoutes from './routes/quoteRoutes';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');

const app = express();
const PORT = Number(process.env.PORT || 3001);

const CHAPTER_AUDIO_DIR = path.join(INFO_DIR, 'chapter-audio');
const WORD_AUDIO_DIR = path.join(INFO_DIR, 'word-audio');
const MUSIC_DIR = path.join(INFO_DIR, 'music');
const ARTICLES_DIR = path.join(INFO_DIR, 'articles');
const QUESTIONS_DIR = path.join(INFO_DIR, 'questions');
const EBOOK_DIR = path.join(INFO_DIR, 'ebooks');
const AVATAR_DIR = path.join(INFO_DIR, 'pic');

[CHAPTER_AUDIO_DIR, WORD_AUDIO_DIR, MUSIC_DIR, ARTICLES_DIR, QUESTIONS_DIR, EBOOK_DIR, AVATAR_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 媒体统一挂在 /media/<分类>/<文件名> 下。
 * /info/* 保留为兼容别名，供尚未迁移的历史数据使用，新代码一律用 /media。
 */
const MEDIA_DIRS: Record<string, string> = {
  'chapter-audio': CHAPTER_AUDIO_DIR,
  'word-audio': WORD_AUDIO_DIR,
  music: MUSIC_DIR,
  articles: ARTICLES_DIR,
  questions: QUESTIONS_DIR,
  ebooks: EBOOK_DIR,
  pic: AVATAR_DIR,
};

Object.entries(MEDIA_DIRS).forEach(([name, dir]) => {
  app.use(`/media/${name}`, express.static(dir));
  app.use(`/info/${name}`, express.static(dir));
});

const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin.split(',') } : {}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/wordbooks', wordbookRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/study_records', studyRecordRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quotes', quoteRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
