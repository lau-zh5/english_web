import mysql from 'mysql2/promise';

/**
 * 数据库连接全部走环境变量：
 * 本地开发用默认值；部署到云（云数据库 / CloudBase 背后的 MySQL）时
 * 只需注入 DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME，代码无需改动。
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'english_learning',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export { pool };

export async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wordbooks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wordbook_id INT,
        name VARCHAR(255) NOT NULL,
        chapter_order INT DEFAULT 0,
        audio_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS words (
        id INT AUTO_INCREMENT PRIMARY KEY,
        word VARCHAR(255) NOT NULL,
        phonetic VARCHAR(255),
        meaning TEXT NOT NULL,
        example TEXT,
        status ENUM('new', 'learning', 'mastered') DEFAULT 'new',
        wordbook_id INT,
        chapter_id INT,
        audio_path VARCHAR(500),
        source_type ENUM('manual', 'ebook', 'reading') DEFAULT 'manual',
        source_id INT,
        is_polysemous BOOLEAN DEFAULT FALSE,
        is_similar BOOLEAN DEFAULT FALSE,
        group_id VARCHAR(36) DEFAULT NULL,
        group_type ENUM('polysemous', 'similar') DEFAULT NULL,
        last_reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE SET NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        word_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_id INT,
        question TEXT NOT NULL,
        options TEXT,
        correct_answer INT,
        correct_answer_text TEXT,
        explanation TEXT,
        type ENUM('choice', 'fill') DEFAULT 'choice',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS study_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        words_learned INT DEFAULT 0,
        listening_minutes INT DEFAULT 0,
        articles_read INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        duration INT DEFAULT 0,
        file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        audio_id INT,
        content TEXT NOT NULL,
        timestamp INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS daily_quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quote TEXT NOT NULL,
        author VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        avatar VARCHAR(500),
        daily_word_goal INT DEFAULT 20,
        daily_listening_goal INT DEFAULT 30,
        daily_reading_goal INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [studyRecords] = await connection.execute('SELECT COUNT(*) as count FROM study_records');
    const studyCount = (studyRecords as Array<{ count: number }>)[0].count;
    if (studyCount === 0) {
      await connection.execute(`
        INSERT INTO study_records (date, words_learned, listening_minutes, articles_read) VALUES
        (CURDATE(), 0, 0, 0),
        (DATE_SUB(CURDATE(), INTERVAL 1 DAY), 5, 30, 1),
        (DATE_SUB(CURDATE(), INTERVAL 2 DAY), 10, 45, 2),
        (DATE_SUB(CURDATE(), INTERVAL 3 DAY), 8, 25, 1),
        (DATE_SUB(CURDATE(), INTERVAL 4 DAY), 12, 60, 3)
      `);
    }

    const [quotes] = await connection.execute('SELECT COUNT(*) as count FROM daily_quotes');
    const quotesCount = (quotes as Array<{ count: number }>)[0].count;
    if (quotesCount === 0) {
      const quotesData = [
        ['The only way to do great work is to love what you do.', 'Steve Jobs'],
        ['Innovation distinguishes between a leader and a follower.', 'Steve Jobs'],
        ['Stay hungry, stay foolish.', 'Steve Jobs'],
        ['Life is what happens when you are busy making other plans.', 'John Lennon'],
        ['The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt'],
        ['It is during our darkest moments that we must focus to see the light.', 'Aristotle'],
        ['The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese Proverb'],
        ['Your time is limited, do not waste it living someone else life.', 'Steve Jobs'],
        ['The only impossible journey is the one you never begin.', 'Tony Robbins'],
        ['Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill']
      ];

      for (const [quote, author] of quotesData) {
        await connection.execute(
          'INSERT INTO daily_quotes (quote, author) VALUES (?, ?)',
          [quote, author]
        );
      }
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    connection.release();
  }
}

export const initDatabase = initializeDatabase;

export default { pool, initializeDatabase, initDatabase };
