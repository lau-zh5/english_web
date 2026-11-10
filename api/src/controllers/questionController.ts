import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');
const QUESTIONS_DIR = path.join(INFO_DIR, 'questions');

export async function getQuestionsByArticle(req: Request, res: Response) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM questions WHERE article_id = ? ORDER BY id ASC',
      [req.params.articleId]
    );
    const questions = rows as Array<{ options: string; correct_answer: number | null; correct_answer_text: string | null; type: string }>;
    const result = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options),
      correctAnswer: q.correct_answer,
      correctAnswerText: q.correct_answer_text,
      type: q.type || 'choice'
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createQuestion(req: Request, res: Response) {
  try {
    const { article_id, question, options, correct_answer, explanation } = req.body;
    if (!article_id || !question || !options || correct_answer === undefined) {
      return res.status(400).json({ error: 'article_id, question, options, and correct_answer are required' });
    }
    const [articleRows] = await pool.execute('SELECT id FROM articles WHERE id = ?', [article_id]);
    if ((articleRows as Array<unknown>).length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const optionsJson = JSON.stringify(options);
    const [result] = await pool.execute(
      'INSERT INTO questions (article_id, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)',
      [article_id, question, optionsJson, correct_answer, explanation || null]
    );
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ?', [insertResult.insertId]);
    const newQuestion = rows as Array<{ options: string }>;
    res.status(201).json({
      ...newQuestion[0],
      options: JSON.parse(newQuestion[0].options)
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function createQuestionsBatch(req: Request, res: Response) {
  try {
    const { article_id, questions } = req.body;
    if (!article_id || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'article_id and questions array are required' });
    }
    const [articleRows] = await pool.execute('SELECT id FROM articles WHERE id = ?', [article_id]);
    if ((articleRows as Array<unknown>).length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const values = questions.map((q: { question: string; options?: string[]; correctAnswer?: number | null; correctAnswerText?: string; explanation?: string; type?: string }) => {
      return [
        article_id, 
        q.question, 
        JSON.stringify(q.options || []), 
        q.type === 'choice' ? (q.correctAnswer ?? null) : null, 
        q.type === 'fill' ? (q.correctAnswerText || null) : null,
        q.explanation || null,
        q.type || 'choice'
      ];
    });
    const placeholders = questions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flattenedValues = values.flat();
    await pool.execute(
      `INSERT INTO questions (article_id, question, options, correct_answer, correct_answer_text, explanation, type) VALUES ${placeholders}`,
      flattenedValues
    );
    const [rows] = await pool.execute(
      'SELECT * FROM questions WHERE article_id = ? ORDER BY id ASC',
      [article_id]
    );
    const result = rows as Array<{ options: string; correct_answer: number | null; correct_answer_text: string | null; type: string }>;
    res.json(result.map(q => ({ 
      ...q, 
      options: JSON.parse(q.options),
      correctAnswer: q.correct_answer,
      correctAnswerText: q.correct_answer_text,
      type: q.type || 'choice'
    })));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteQuestion(req: Request, res: Response) {
  try {
    const [result] = await pool.execute('DELETE FROM questions WHERE id = ?', [req.params.id]);
    const deleteResult = result as { affectedRows: number };
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteQuestionsByArticle(req: Request, res: Response) {
  try {
    await pool.execute('DELETE FROM questions WHERE article_id = ?', [req.params.articleId]);
    res.json({ message: 'All questions deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
