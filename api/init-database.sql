-- 数据库初始化脚本
-- 数据库名: english_learning

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS english_learning DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE english_learning;

-- 1. 单词本表
CREATE TABLE IF NOT EXISTS wordbooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 章节表
CREATE TABLE IF NOT EXISTS chapters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wordbook_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  chapter_order INT DEFAULT 0,
  audio_path VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
);

-- 3. 单词表
CREATE TABLE IF NOT EXISTS words (
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
);

-- 4. 听力音频表
CREATE TABLE IF NOT EXISTS audios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT NULL,
  duration INT DEFAULT 0,
  file_path VARCHAR(500) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 阅读理解文章表
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  word_count INT DEFAULT 0,
  file_path VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 阅读理解题目表
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_answer INT NOT NULL,
  explanation TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- 7. 学习记录表
CREATE TABLE IF NOT EXISTS study_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  words_learned INT DEFAULT 0,
  listening_minutes INT DEFAULT 0,
  articles_read INT DEFAULT 0
);

-- 显示所有表
SHOW TABLES;
