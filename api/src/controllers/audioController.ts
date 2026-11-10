import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');
const MUSIC_DIR = path.join(INFO_DIR, 'music');

export async function getAllAudios(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM audios ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getAudioById(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM audios WHERE id = ?', [req.params.id]);
    const audios = rows as Array<{ id: number }>;
    if (audios.length === 0) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    res.json(audios[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createAudio(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, category } = req.body;
    if (!title) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Title is required' });
    }

    const filePath = `/media/music/${req.file.filename}`;
    
    const [result] = await pool.execute(
      'INSERT INTO audios (title, category, duration, file_path) VALUES (?, ?, ?, ?)',
      [title, category || null, 0, filePath]
    );
    
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM audios WHERE id = ?', [insertResult.insertId]);
    res.status(201).json((rows as Array<unknown>)[0]);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteAudio(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM audios WHERE id = ?', [req.params.id]);
    const audios = rows as Array<{ id: number; file_path: string }>;
    
    if (audios.length === 0) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    const filePath = path.join(MUSIC_DIR, path.basename(audios[0].file_path));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.execute('DELETE FROM audios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Audio deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export function streamAudio(req: Request, res: Response) {
  try {
    const fileName = req.params.filename;
    const filePath = path.join(MUSIC_DIR, fileName);
    
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
