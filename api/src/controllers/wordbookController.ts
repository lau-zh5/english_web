import { Request, Response } from 'express';
import { pool } from '../config/database';

export async function getAllWordbooks(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute(`
      SELECT w.*, 
        (SELECT COUNT(*) FROM chapters WHERE wordbook_id = w.id) as chapter_count,
        (SELECT COUNT(*) FROM words WHERE wordbook_id = w.id OR chapter_id IN (SELECT id FROM chapters WHERE wordbook_id = w.id)) as word_count
      FROM wordbooks w
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getWordbookById(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM wordbooks WHERE id = ?', [req.params.id]);
    const wordbooks = rows as Array<{ id: number }>;
    if (wordbooks.length === 0) {
      return res.status(404).json({ error: 'Wordbook not found' });
    }
    
    const [chapters] = await pool.execute(
      'SELECT * FROM chapters WHERE wordbook_id = ? ORDER BY chapter_order',
      [req.params.id]
    );
    
    const [words] = await pool.execute(
      'SELECT * FROM words WHERE wordbook_id = ? ORDER BY chapter_id, id',
      [req.params.id]
    );
    
    res.json({
      ...wordbooks[0],
      chapters,
      words
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createWordbook(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO wordbooks (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute(`
      SELECT w.*, 
        (SELECT COUNT(*) FROM chapters WHERE wordbook_id = w.id) as chapter_count,
        (SELECT COUNT(*) FROM words WHERE wordbook_id = w.id OR chapter_id IN (SELECT id FROM chapters WHERE wordbook_id = w.id)) as word_count
      FROM wordbooks w WHERE w.id = ?
    `, [insertResult.insertId]);
    res.status(201).json((rows as Array<unknown>)[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateWordbook(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    await pool.execute(
      'UPDATE wordbooks SET name = ?, description = ? WHERE id = ?',
      [name, description || null, req.params.id]
    );
    
    const [rows] = await pool.execute(`
      SELECT w.*, 
        (SELECT COUNT(*) FROM chapters WHERE wordbook_id = w.id) as chapter_count,
        (SELECT COUNT(*) FROM words WHERE wordbook_id = w.id OR chapter_id IN (SELECT id FROM chapters WHERE wordbook_id = w.id)) as word_count
      FROM wordbooks w WHERE w.id = ?
    `, [req.params.id]);
    const wordbooks = rows as Array<{ id: number }>;
    if (wordbooks.length === 0) {
      return res.status(404).json({ error: 'Wordbook not found' });
    }
    res.json(wordbooks[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteWordbook(req: Request, res: Response) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const wordbookId = req.params.id;

    const [wordbookRows] = await connection.execute('SELECT id FROM wordbooks WHERE id = ?', [wordbookId]);
    const wordbooks = wordbookRows as Array<{ id: number }>;
    if (wordbooks.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Wordbook not found' });
    }

    await connection.execute('DELETE FROM words WHERE chapter_id IN (SELECT id FROM chapters WHERE wordbook_id = ?)', [wordbookId]);

    await connection.execute('DELETE FROM words WHERE wordbook_id = ?', [wordbookId]);

    await connection.execute('DELETE FROM chapters WHERE wordbook_id = ?', [wordbookId]);

    await connection.execute('DELETE FROM wordbooks WHERE id = ?', [wordbookId]);

    await connection.commit();
    res.json({ message: 'Wordbook and all related chapters and words deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: (error as Error).message });
  } finally {
    connection.release();
  }
}
