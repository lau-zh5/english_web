import { Request, Response } from 'express';
import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  hashPassword,
  isHashed,
  verifyPassword,
  signToken,
  validateRegistration,
} from '../utils/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const AVATAR_DIR = path.join(PROJECT_ROOT, 'info', 'pic');

console.log('AVATAR_DIR initialized:', AVATAR_DIR);

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE username = ?',
      [username],
    );

    const users = rows as Array<{ id: number; username: string; email: string; password: string }>;

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];

    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 历史明文密码在首次成功登录时自动升级为 scrypt 哈希
    if (!isHashed(user.password)) {
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [
        hashPassword(password),
        user.id,
      ]);
    }

    res.json({
      token: signToken(user.id),
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { username, password, email } = req.body;

    const invalid = validateRegistration({ username, password, email });
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const [result] = await pool.execute(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashPassword(password), email || null],
    );

    const insertResult = result as { insertId: number };
    res.status(201).json({
      token: signToken(insertResult.insertId),
      id: insertResult.insertId,
      username,
      email: email || null,
    });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err?.code === 'ER_DUP_ENTRY' || /Duplicate entry/i.test(err?.message || '')) {
      return res.status(409).json({ error: '该用户名已被注册，请换一个' });
    }
    console.error('register failed:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar, daily_word_goal, daily_listening_goal, daily_reading_goal FROM users WHERE id = ?',
      [id]
    );
    
    const users = rows as Array<{ id: number; username: string; email: string; avatar: string; daily_word_goal: number; daily_listening_goal: number; daily_reading_goal: number }>;
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const user = users[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      dailyWordGoal: user.daily_word_goal,
      dailyListeningGoal: user.daily_listening_goal,
      dailyReadingGoal: user.daily_reading_goal,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, email, password, dailyWordGoal, dailyListeningGoal, dailyReadingGoal } = req.body;
    
    const fields: string[] = [];
    const values: (string | number)[] = [];
    
    if (username) {
      fields.push('username = ?');
      values.push(username);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (password) {
      fields.push('password = ?');
      values.push(hashPassword(password));
    }
    if (dailyWordGoal !== undefined) {
      fields.push('daily_word_goal = ?');
      values.push(dailyWordGoal);
    }
    if (dailyListeningGoal !== undefined) {
      fields.push('daily_listening_goal = ?');
      values.push(dailyListeningGoal);
    }
    if (dailyReadingGoal !== undefined) {
      fields.push('daily_reading_goal = ?');
      values.push(dailyReadingGoal);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar, daily_word_goal, daily_listening_goal, daily_reading_goal FROM users WHERE id = ?',
      [id]
    );
    const users = rows as Array<{ id: number; username: string; email: string; avatar: string; daily_word_goal: number; daily_listening_goal: number; daily_reading_goal: number }>;
    
    const user = users[0];
    res.json({ 
      message: '更新成功', 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        dailyWordGoal: user.daily_word_goal,
        dailyListeningGoal: user.daily_listening_goal,
        dailyReadingGoal: user.daily_reading_goal,
      }
    });
  } catch (error) {
    if ((error as Error).message.includes('ER_DUP_ENTRY')) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function uploadAvatar(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的头像文件' });
    }
    
    console.log('Uploading avatar for user:', id);
    console.log('AVATAR_DIR:', AVATAR_DIR);
    
    const file = req.file;
    const ext = path.extname(file.originalname);
    const fileName = `avatar_${id}_${Date.now()}${ext}`;
    const filePath = path.join(AVATAR_DIR, fileName);
    
    console.log('File path:', filePath);
    
    if (!fs.existsSync(AVATAR_DIR)) {
      console.log('Creating AVATAR_DIR:', AVATAR_DIR);
      fs.mkdirSync(AVATAR_DIR, { recursive: true });
    }
    
    fs.writeFileSync(filePath, file.buffer);
    console.log('File written successfully:', filePath);
    
    const avatarPath = `/media/pic/${fileName}`;
    
    await pool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, id]
    );
    
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [id]
    );
    const users = rows as Array<{ id: number; username: string; email: string; avatar: string }>;
    
    res.json({ message: '头像上传成功', user: users[0] });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
