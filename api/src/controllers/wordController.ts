import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');
const WORD_AUDIO_DIR = path.join(INFO_DIR, 'word-audio');

if (!fs.existsSync(WORD_AUDIO_DIR)) {
  fs.mkdirSync(WORD_AUDIO_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: WORD_AUDIO_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadWordAudioMiddleware = multer({ storage });

export async function getAllWords(req: Request, res: Response) {
  try {
    const { wordbook_id, chapter_id, status, source_type } = req.query;
    
    let query = `
      SELECT w.*, wb.name as wordbook_name, c.name as chapter_name, a.title as source_title
      FROM words w
      LEFT JOIN wordbooks wb ON w.wordbook_id = wb.id
      LEFT JOIN chapters c ON w.chapter_id = c.id
      LEFT JOIN articles a ON w.source_id = a.id AND w.source_type = 'reading'
      WHERE 1=1
    `;
    const params: (string | number | boolean | null | Date | Buffer)[] = [];
    
    if (wordbook_id) {
      query += ' AND w.wordbook_id = ?';
      params.push(wordbook_id as string);
    }
    if (chapter_id) {
      query += ' AND w.chapter_id = ?';
      params.push(chapter_id as string);
    }
    if (status) {
      query += ' AND w.status = ?';
      params.push(status as string);
    }
    if (source_type) {
      query += ' AND w.source_type = ?';
      params.push(source_type as string);
    }
    
    query += ' ORDER BY w.source_type DESC, w.chapter_id, w.id';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getReadingWords(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute(`
      SELECT w.*, a.title as source_title
      FROM words w
      LEFT JOIN articles a ON w.source_id = a.id
      WHERE w.source_type = 'reading'
      ORDER BY w.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getWordById(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute(`
      SELECT w.*, wb.name as wordbook_name, c.name as chapter_name, c.audio_path as chapter_audio_path
      FROM words w
      LEFT JOIN wordbooks wb ON w.wordbook_id = wb.id
      LEFT JOIN chapters c ON w.chapter_id = c.id
      WHERE w.id = ?
    `, [req.params.id]);
    const words = rows as Array<{ id: number }>;
    if (words.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }
    res.json(words[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createWord(req: Request, res: Response) {
  try {
    const { word, phonetic, meaning, example, status, wordbook_id, chapter_id, audio_path, source_type, source_id, is_polysemous, is_similar } = req.body;
    
    if (!word || !meaning) {
      return res.status(400).json({ error: 'Word and meaning are required' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO words (word, phonetic, meaning, example, status, wordbook_id, chapter_id, audio_path, source_type, source_id, is_polysemous, is_similar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [word, phonetic || null, meaning, example || null, status || 'new', wordbook_id || null, chapter_id || null, audio_path || null, source_type || 'manual', source_id || null, is_polysemous || false, is_similar || false]
    );
    
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM words WHERE id = ?', [insertResult.insertId]);
    res.status(201).json((rows as Array<unknown>)[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function batchCreateWords(req: Request, res: Response) {
  try {
    const { words, wordbook_id, chapter_id, group_type } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'words array is required' });
    }
    
    const group_id = crypto.randomUUID();
    
    const values = words.map((w: { word: string; phonetic?: string; meaning: string; example?: string }) => [
      w.word,
      w.phonetic || null,
      w.meaning,
      w.example || null,
      'new',
      wordbook_id || null,
      chapter_id || null,
      null,
      group_type ? group_id : null,
      group_type || null
    ]);

    const placeholders = words.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flattenedValues = values.flat();

    await pool.execute(
      `INSERT INTO words (word, phonetic, meaning, example, status, wordbook_id, chapter_id, audio_path, group_id, group_type) 
       VALUES ${placeholders}`,
      flattenedValues
    );

    let query = 'SELECT * FROM words WHERE group_id = ?';
    const [rows] = await pool.execute(query, [group_type ? group_id : null]);
    res.status(201).json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateWord(req: Request, res: Response) {
  try {
    const { word, phonetic, meaning, example, status, audio_path, is_polysemous, is_similar, reviewCount, lastReviewedAt } = req.body;
    
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    
    if (word !== undefined) {
      updates.push('word = ?');
      values.push(word);
    }
    if (phonetic !== undefined) {
      updates.push('phonetic = ?');
      values.push(phonetic);
    }
    if (meaning !== undefined) {
      updates.push('meaning = ?');
      values.push(meaning);
    }
    if (example !== undefined) {
      updates.push('example = ?');
      values.push(example);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (audio_path !== undefined) {
      updates.push('audio_path = ?');
      values.push(audio_path);
    }
    if (is_polysemous !== undefined) {
      updates.push('is_polysemous = ?');
      values.push(is_polysemous);
    }
    if (is_similar !== undefined) {
      updates.push('is_similar = ?');
      values.push(is_similar);
    }
    if (reviewCount !== undefined) {
      updates.push('review_count = ?');
      values.push(reviewCount);
    }
    if (lastReviewedAt !== undefined) {
      updates.push('last_reviewed = ?');
      // Convert ISO date string to MySQL datetime format
      const mysqlDate = new Date(lastReviewedAt).toISOString().slice(0, 19).replace('T', ' ');
      values.push(mysqlDate);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(req.params.id);
    
    await pool.execute(
      `UPDATE words SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute('SELECT * FROM words WHERE id = ?', [req.params.id]);
    const words = rows as Array<{ id: number }>;
    if (words.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }
    res.json(words[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getGroupedWords(req: Request, res: Response) {
  try {
    const { group_type } = req.query;
    
    if (!group_type || (group_type !== 'polysemous' && group_type !== 'similar')) {
      return res.status(400).json({ error: 'group_type must be polysemous or similar' });
    }
    
    const [rows] = await pool.execute(
      `SELECT * FROM words WHERE group_type = ? ORDER BY group_id, id`,
      [group_type]
    );
    
    const groupedWords: { [key: string]: Array<unknown> } = {};
    (rows as Array<{ group_id: string }>).forEach(word => {
      if (!groupedWords[word.group_id]) {
        groupedWords[word.group_id] = [];
      }
      groupedWords[word.group_id].push(word);
    });
    
    res.json(Object.values(groupedWords));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function uploadWordAudio(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { word_id } = req.body;
    if (!word_id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'word_id is required' });
    }

    const filePath = `/media/word-audio/${req.file.filename}`;
    
    await pool.execute(
      'UPDATE words SET audio_path = ? WHERE id = ?',
      [filePath, word_id]
    );
    
    res.json({ file_path: filePath, message: 'Audio uploaded successfully' });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteWord(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM words WHERE id = ?', [req.params.id]);
    const words = rows as Array<{ audio_path: string }>;
    
    if (words.length === 0) {
      return res.status(404).json({ error: 'Word not found' });
    }

    if (words[0].audio_path) {
      const filePath = path.join(WORD_AUDIO_DIR, path.basename(words[0].audio_path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.execute('DELETE FROM words WHERE id = ?', [req.params.id]);
    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function streamWordAudio(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT audio_path FROM words WHERE id = ?', [req.params.id]);
    const words = rows as Array<{ audio_path: string }>;
    
    if (words.length === 0 || !words[0].audio_path) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    const fileName = words[0].audio_path.split('/').pop();
    const filePath = path.join(WORD_AUDIO_DIR, fileName!);
    
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
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
