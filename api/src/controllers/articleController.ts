import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');
const ARTICLES_DIR = path.join(INFO_DIR, 'articles');

export async function getAllArticles(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT id, title, content, difficulty, word_count, created_at FROM articles ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getArticleById(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    const articles = rows as Array<{ id: number }>;
    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(articles[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createArticle(req: Request, res: Response) {
  try {
    const { title, content, difficulty = 'medium' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const wordCount = content.split(/\s+/).length;
    
    const [result] = await pool.execute(
      'INSERT INTO articles (title, content, difficulty, word_count) VALUES (?, ?, ?, ?)',
      [title, content, difficulty, wordCount]
    );
    
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM articles WHERE id = ?', [insertResult.insertId]);
    res.status(201).json((rows as Array<unknown>)[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateArticle(req: Request, res: Response) {
  try {
    const { title, content, difficulty } = req.body;
    
    const updates: Array<[string, unknown]> = [];
    const values: (string | number | null)[] = [];
    
    if (title !== undefined) {
      updates.push(['title = ?', title]);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(['content = ?', content]);
      updates.push(['word_count = ?', content.split(/\s+/).length]);
      values.push(content);
      values.push(content.split(/\s+/).length);
    }
    if (difficulty !== undefined) {
      updates.push(['difficulty = ?', difficulty]);
      values.push(difficulty);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(req.params.id);
    
    await pool.execute(
      `UPDATE articles SET ${updates.map(u => u[0]).join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    const articles = rows as Array<{ id: number }>;
    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(articles[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteArticle(req: Request, res: Response) {
  try {
    const [result] = await pool.execute('DELETE FROM articles WHERE id = ?', [req.params.id]);
    const deleteResult = result as { affectedRows: number };
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
