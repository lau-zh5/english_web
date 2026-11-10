import mysql from 'mysql2/promise';

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  console.log('✅ Connected to MySQL');

  await connection.execute('CREATE DATABASE IF NOT EXISTS english_learning DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  console.log('✅ Database created/verified: english_learning');

  await connection.changeUser({ database: 'english_learning' });

  await connection.execute('DROP TABLE IF EXISTS study_records');
  await connection.execute('DROP TABLE IF EXISTS questions');
  await connection.execute('DROP TABLE IF EXISTS articles');
  await connection.execute('DROP TABLE IF EXISTS audios');
  await connection.execute('DROP TABLE IF EXISTS words');
  await connection.execute('DROP TABLE IF EXISTS chapters');
  await connection.execute('DROP TABLE IF EXISTS wordbooks');
  console.log('✅ Old tables dropped');

  await connection.execute(`
    CREATE TABLE wordbooks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table created: wordbooks');

  await connection.execute(`
    CREATE TABLE chapters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wordbook_id INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      chapter_order INT DEFAULT 0,
      audio_path VARCHAR(500) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table created: chapters');

  await connection.execute(`
    CREATE TABLE words (
      id INT AUTO_INCREMENT PRIMARY KEY,
      word VARCHAR(100) NOT NULL,
      phonetic VARCHAR(50) DEFAULT NULL,
      meaning TEXT NOT NULL,
      example TEXT DEFAULT NULL,
      status ENUM('new', 'learning', 'mastered') DEFAULT 'new',
      wordbook_id INT DEFAULT NULL,
      chapter_id INT DEFAULT NULL,
      audio_path VARCHAR(500) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_reviewed_at DATETIME DEFAULT NULL,
      review_count INT DEFAULT 0,
      FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE SET NULL,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Table created: words');

  await connection.execute(`
    CREATE TABLE audios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      category VARCHAR(50) DEFAULT NULL,
      duration INT DEFAULT 0,
      file_path VARCHAR(500) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table created: audios');

  await connection.execute(`
    CREATE TABLE articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
      word_count INT DEFAULT 0,
      file_path VARCHAR(500) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table created: articles');

  await connection.execute(`
    CREATE TABLE questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      article_id INT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INT NOT NULL,
      explanation TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Table created: questions');

  await connection.execute(`
    CREATE TABLE study_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      words_learned INT DEFAULT 0,
      listening_minutes INT DEFAULT 0,
      articles_read INT DEFAULT 0
    )
  `);
  console.log('✅ Table created: study_records');

  const [tables] = await connection.execute('SHOW TABLES');
  console.log('\n📋 All tables in database:');
  console.log(tables);

  await connection.end();
  console.log('\n🎉 Database initialization completed!');
}

initDatabase().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
