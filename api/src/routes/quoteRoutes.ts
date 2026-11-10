import express from 'express';
import { pool } from '../config/database';

const router = express.Router();

router.get('/daily', async (req, res) => {
  try {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );

    const [rows] = await pool.execute(
      'SELECT * FROM daily_quotes ORDER BY id ASC'
    );
    
    const quotes = rows as any[];
    
    if (quotes.length === 0) {
      return res.json({
        content: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        source: null
      });
    }

    const quoteIndex = dayOfYear % quotes.length;
    const todayQuote = quotes[quoteIndex];

    res.json(todayQuote);
  } catch (error) {
    console.error('Error fetching daily quote:', error);
    res.status(500).json({ error: 'Failed to fetch daily quote' });
  }
});

export default router;
