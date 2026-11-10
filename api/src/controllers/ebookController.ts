import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../');
const INFO_DIR = path.join(PROJECT_ROOT, 'info');
const EBOOK_DIR = path.join(INFO_DIR, 'ebooks');

if (!fs.existsSync(EBOOK_DIR)) {
  fs.mkdirSync(EBOOK_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: EBOOK_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadEbookMiddleware = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('只支持PDF格式'));
    }
  }
});

export async function uploadEbook(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择文件' });
    }

    const { name, description } = req.body;
    if (!name) {
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: '请输入单词书名称' });
    }

    const filePath = `/media/ebooks/${req.file.filename}`;
    
    const [result] = await pool.execute(
      'INSERT INTO wordbooks (name, description, ebook_path) VALUES (?, ?, ?)',
      [name, description || null, filePath]
    );

    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute(`
      SELECT w.*, 
        (SELECT COUNT(*) FROM chapters WHERE wordbook_id = w.id) as chapter_count,
        (SELECT COUNT(*) FROM words WHERE wordbook_id = w.id) as word_count
      FROM wordbooks w WHERE w.id = ?
    `, [insertResult.insertId]);

    res.status(201).json((rows as Array<unknown>)[0]);
  } catch (error) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getEbookInfo(req: Request, res: Response) {
  try {
    const { wordbookId } = req.params;
    
    const [rows] = await pool.execute('SELECT id, name, ebook_path FROM wordbooks WHERE id = ?', [wordbookId]);
    const wordbooks = rows as Array<{ id: number; name: string; ebook_path: string }>;
    
    if (wordbooks.length === 0) {
      return res.status(404).json({ error: '未找到单词书' });
    }

    const wordbook = wordbooks[0];
    if (!wordbook.ebook_path) {
      return res.status(404).json({ error: '未找到电子书文件' });
    }

    const fileName = wordbook.ebook_path.split('/').pop();
    const filePath = path.join(EBOOK_DIR, fileName!);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.json({
      id: wordbook.id,
      name: wordbook.name,
      url: `/media/ebooks/${fileName}`,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteEbook(req: Request, res: Response) {
  try {
    const { wordbookId } = req.params;
    
    const [rows] = await pool.execute('SELECT ebook_path FROM wordbooks WHERE id = ?', [wordbookId]);
    const wordbooks = rows as Array<{ ebook_path: string }>;
    
    if (wordbooks.length === 0) {
      return res.status(404).json({ error: '未找到单词书' });
    }

    if (wordbooks[0].ebook_path) {
      const fileName = wordbooks[0].ebook_path.split('/').pop();
      const filePath = path.join(EBOOK_DIR, fileName!);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.execute('DELETE FROM wordbooks WHERE id = ?', [wordbookId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}