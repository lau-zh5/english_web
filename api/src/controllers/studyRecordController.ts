import { Request, Response } from 'express';
import { pool } from '../config/database';

export async function getAllStudyRecords(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT * FROM study_records ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getStudyRecordByDate(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT * FROM study_records WHERE date = ?', [req.params.date]);
    const records = rows as Array<{ id: number }>;
    if (records.length === 0) {
      return res.status(404).json({ error: 'Study record not found' });
    }
    res.json(records[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createOrUpdateStudyRecord(req: Request, res: Response) {
  try {
    const { date, words_learned, listening_minutes, articles_read } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const [existing] = await pool.query('SELECT * FROM study_records WHERE date = ?', [date]);
    const existingRecords = existing as Array<{ id: number }>;

    if (existingRecords.length > 0) {
      await pool.query(
        'UPDATE study_records SET words_learned = ?, listening_minutes = ?, articles_read = ? WHERE date = ?',
        [words_learned || 0, listening_minutes || 0, articles_read || 0, date]
      );
    } else {
      await pool.query(
        'INSERT INTO study_records (date, words_learned, listening_minutes, articles_read) VALUES (?, ?, ?, ?)',
        [date, words_learned || 0, listening_minutes || 0, articles_read || 0]
      );
    }

    const [rows] = await pool.query('SELECT * FROM study_records WHERE date = ?', [date]);
    res.json((rows as Array<unknown>)[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
