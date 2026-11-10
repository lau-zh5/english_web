import { Request, Response } from 'express';
import { pool } from '../config/database';

export async function getAllNotes(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getNotesByAudioId(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM notes WHERE audio_id = ? ORDER BY created_at ASC', [req.params.audioId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createNote(req: Request, res: Response) {
  try {
    const { audioId, content, timestamp } = req.body;
    
    if (!audioId || !content || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      'INSERT INTO notes (audio_id, content, timestamp) VALUES (?, ?, ?)',
      [audioId, content, timestamp]
    );
    
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM notes WHERE id = ?', [insertResult.insertId]);
    res.status(201).json((rows as Array<unknown>)[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteNote(req: Request, res: Response) {
  try {
    const [result] = await pool.execute('DELETE FROM notes WHERE id = ?', [req.params.id]);
    const deleteResult = result as { affectedRows: number };
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}