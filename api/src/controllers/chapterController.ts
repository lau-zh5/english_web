import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');
const CHAPTER_AUDIO_DIR = path.join(INFO_DIR, 'chapter-audio');

if (!fs.existsSync(CHAPTER_AUDIO_DIR)) {
  fs.mkdirSync(CHAPTER_AUDIO_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: CHAPTER_AUDIO_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadChapterAudioMiddleware = multer({ storage });

export async function getAllChapters(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM words WHERE chapter_id = c.id) as word_count
      FROM chapters c 
      ORDER BY c.wordbook_id, c.chapter_order
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getChaptersByWordbook(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM words WHERE chapter_id = c.id) as word_count
      FROM chapters c 
      WHERE c.wordbook_id = ? 
      ORDER BY c.chapter_order
    `, [req.params.wordbookId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getChapterById(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
    const chapters = rows as Array<{ id: number }>;
    if (chapters.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    const [words] = await pool.execute(
      'SELECT * FROM words WHERE chapter_id = ? ORDER BY id',
      [req.params.id]
    );
    
    res.json({ ...chapters[0], words });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createChapter(req: Request, res: Response) {
  try {
    const { wordbook_id, name, chapter_order } = req.body;
    if (!wordbook_id || !name) {
      return res.status(400).json({ error: 'wordbook_id and name are required' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO chapters (wordbook_id, name, chapter_order) VALUES (?, ?, ?)',
      [wordbook_id, name, chapter_order || 0]
    );
    
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM chapters WHERE id = ?', [insertResult.insertId]);
    res.status(201).json((rows as Array<unknown>)[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function uploadChapterAudio(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { chapter_id } = req.body;
    if (!chapter_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'chapter_id is required' });
    }

    const filePath = `/media/chapter-audio/${req.file.filename}`;
    
    await pool.execute('UPDATE chapters SET audio_path = ? WHERE id = ?', [filePath, chapter_id]);
    
    res.json({ file_path: filePath, message: 'Audio uploaded successfully' });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateChapter(req: Request, res: Response) {
  try {
    const { name, chapter_order } = req.body;
    
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (chapter_order !== undefined) {
      updates.push('chapter_order = ?');
      values.push(chapter_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(req.params.id);
    
    await pool.execute(`UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const [rows] = await pool.execute('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
    const chapters = rows as Array<{ id: number }>;
    if (chapters.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.json(chapters[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteChapter(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
    const chapters = rows as Array<{ audio_path: string }>;
    
    if (chapters.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    if (chapters[0].audio_path) {
      const filePath = path.join(CHAPTER_AUDIO_DIR, path.basename(chapters[0].audio_path));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.execute('DELETE FROM chapters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function streamChapterAudio(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT audio_path FROM chapters WHERE id = ?', [req.params.id]);
    const chapters = rows as Array<{ audio_path: string }>;
    
    if (chapters.length === 0 || !chapters[0].audio_path) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    const fileName = chapters[0].audio_path.split('/').pop();
    const filePath = path.join(CHAPTER_AUDIO_DIR, fileName!);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = { 'Content-Length': fileSize, 'Content-Type': 'audio/mpeg' };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
