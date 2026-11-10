# English Learning Web API 测试文档

## 📋 目录

- [项目结构](#项目结构)
- [数据库结构](#数据库结构)
- [环境配置](#环境配置)
- [API 接口测试](#api-接口测试)
  - [健康检查](#健康检查)
  - [用户接口](#用户接口-users)
  - [单词书接口](#单词书接口-wordbooks)
  - [章节接口](#章节接口-chapters)
  - [单词接口](#单词接口-words)
  - [音频接口](#音频接口-audios)
  - [文章接口](#文章接口-articles)
  - [问题接口](#问题接口-questions)
  - [学习记录接口](#学习记录接口-study_records)
  - [笔记接口](#笔记接口-notes)
  - [每日名言接口](#每日名言接口-quotes)
  - [电子书接口](#电子书接口-ebooks)

---

## 🗂️ 项目结构

```
English_learning_web/
├── api/                          # 后端 API 项目
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts       # 数据库配置
│   │   ├── controllers/          # 控制器
│   │   │   ├── userController.ts       # 用户控制器
│   │   │   ├── wordbookController.ts   # 单词书控制器
│   │   │   ├── chapterController.ts    # 章节控制器
│   │   │   ├── wordController.ts       # 单词控制器
│   │   │   ├── articleController.ts    # 文章控制器
│   │   │   ├── audioController.ts      # 音频控制器
│   │   │   ├── questionController.ts   # 问题控制器
│   │   │   ├── studyRecordController.ts # 学习记录控制器
│   │   │   ├── noteController.ts       # 笔记控制器
│   │   │   └── ebookController.ts      # 电子书控制器
│   │   ├── routes/               # 路由
│   │   │   ├── userRoutes.ts
│   │   │   ├── wordbookRoutes.ts
│   │   │   ├── chapterRoutes.ts
│   │   │   ├── wordRoutes.ts
│   │   │   ├── articleRoutes.ts
│   │   │   ├── audioRoutes.ts
│   │   │   ├── questionRoutes.ts
│   │   │   ├── studyRecordRoutes.ts
│   │   │   ├── noteRoutes.ts
│   │   │   ├── ebookRoutes.ts
│   │   │   └── quoteRoutes.ts
│   │   └── server.ts             # 服务器入口
│   ├── info/                     # 上传文件目录
│   │   ├── pic/                  # 用户头像
│   │   ├── music/                # 听力音频
│   │   ├── chapter-audio/        # 章节音频
│   │   ├── word-audio/           # 单词音频
│   │   ├── articles/             # 文章
│   │   ├── questions/            # 问题文件
│   │   └── ebooks/               # 电子书
│   └── package.json
├── src/                          # 前端项目
│   ├── components/               # React 组件
│   ├── pages/                    # 页面
│   ├── store/                    # 状态管理
│   ├── types/                    # TypeScript 类型
│   └── utils/                    # 工具函数
└── package.json
```

---

## 🗄️ 数据库结构

### 数据库名称：`english_learning`

### 配置信息
- **主机**：`localhost`
- **端口**：`3306`
- **用户名**：`root`
- **密码**：`0000`

---

### 1. users（用户表）

```sql
CREATE TABLE users (
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
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(255) | 用户名，唯一 |
| password | VARCHAR(255) | 密码 |
| email | VARCHAR(255) | 邮箱 |
| avatar | VARCHAR(500) | 头像路径 |
| daily_word_goal | INT | 每日单词目标，默认 20 |
| daily_listening_goal | INT | 每日听力目标（分钟），默认 30 |
| daily_reading_goal | INT | 每日阅读目标（篇），默认 3 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 2. wordbooks（单词书表）

```sql
CREATE TABLE wordbooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(255) | 单词书名称 |
| description | TEXT | 单词书描述 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 3. chapters（章节表）

```sql
CREATE TABLE chapters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wordbook_id INT,
  name VARCHAR(255) NOT NULL,
  chapter_order INT DEFAULT 0,
  audio_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| wordbook_id | INT | 所属单词书 ID |
| name | VARCHAR(255) | 章节名称 |
| chapter_order | INT | 章节顺序 |
| audio_path | VARCHAR(500) | 音频文件路径 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 4. words（单词表）

```sql
CREATE TABLE words (
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
  last_reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE SET NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| word | VARCHAR(255) | 单词 |
| phonetic | VARCHAR(255) | 音标 |
| meaning | TEXT | 释义 |
| example | TEXT | 例句 |
| status | ENUM | 状态：new/learning/mastered |
| wordbook_id | INT | 所属单词书 ID |
| chapter_id | INT | 所属章节 ID |
| audio_path | VARCHAR(500) | 音频文件路径 |
| source_type | ENUM | 来源：manual/ebook/reading |
| source_id | INT | 来源 ID |
| is_polysemous | BOOLEAN | 是否多义词 |
| is_similar | BOOLEAN | 是否易混淆词 |
| last_reviewed_at | TIMESTAMP | 最后复习时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 5. articles（文章表）

```sql
CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  word_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| title | VARCHAR(500) | 文章标题 |
| content | TEXT | 文章内容 |
| difficulty | ENUM | 难度：easy/medium/hard |
| word_count | INT | 单词数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 6. questions（问题表）

```sql
CREATE TABLE questions (
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
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| article_id | INT | 所属文章 ID |
| question | TEXT | 问题内容 |
| options | TEXT | 选项（JSON 格式） |
| correct_answer | INT | 正确答案索引（选择题） |
| correct_answer_text | TEXT | 正确答案文本（填空题） |
| explanation | TEXT | 解析 |
| type | ENUM | 类型：choice/fill |
| created_at | TIMESTAMP | 创建时间 |

---

### 7. audios（音频表）

```sql
CREATE TABLE audios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  duration INT DEFAULT 0,
  file_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| title | VARCHAR(255) | 音频标题 |
| category | VARCHAR(100) | 分类 |
| duration | INT | 时长（秒） |
| file_path | VARCHAR(500) | 文件路径 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 8. notes（笔记表）

```sql
CREATE TABLE notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  audio_id INT,
  content TEXT NOT NULL,
  timestamp INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE CASCADE
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| audio_id | INT | 所属音频 ID |
| content | TEXT | 笔记内容 |
| timestamp | INT | 时间戳（秒） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 9. study_records（学习记录表）

```sql
CREATE TABLE study_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  words_learned INT DEFAULT 0,
  listening_minutes INT DEFAULT 0,
  articles_read INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| date | DATE | 日期，唯一 |
| words_learned | INT | 学习的单词数 |
| listening_minutes | INT | 听力时长（分钟） |
| articles_read | INT | 阅读的文章数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

### 10. daily_quotes（每日名言表）

```sql
CREATE TABLE daily_quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quote TEXT NOT NULL,
  author VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| quote | TEXT | 名言内容 |
| author | VARCHAR(255) | 作者 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

## ⚙️ 环境配置

### Apifox 环境变量

| 环境名称 | 变量名 | 值 |
|---------|--------|-----|
| Development | base_url | http://localhost:3001 |

### 启动后端服务

```bash
cd api
npm install
npm run dev
```

服务地址：`http://localhost:3001`

---

## 🧪 API 接口测试

### 健康检查

#### GET /api/health

检查服务是否正常运行。

**响应示例：**
```json
{
  "status": "ok",
  "message": "API is running"
}
```

---

### 用户接口 (users)

基础路径：`/api/users`

#### 1. 用户注册

```
POST /api/users/register
Content-Type: application/json
```

**请求体：**
```json
{
  "username": "testuser",
  "password": "123456"
}
```

**成功响应 (201)：**
```json
{
  "id": 1,
  "username": "testuser"
}
```

**错误响应 (400)：**
```json
{
  "error": "用户名已存在"
}
```

---

#### 2. 用户登录

```
POST /api/users/login
Content-Type: application/json
```

**请求体：**
```json
{
  "username": "testuser",
  "password": "123456"
}
```

**成功响应 (200)：**
```json
{
  "id": 1,
  "username": "testuser"
}
```

**错误响应 (401)：**
```json
{
  "error": "用户名或密码错误"
}
```

---

#### 3. 获取用户信息

```
GET /api/users/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 用户 ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "avatar": "/info/pic/avatar.jpg",
  "dailyWordGoal": 20,
  "dailyListeningGoal": 30,
  "dailyReadingGoal": 3
}
```

---

#### 4. 更新用户信息

```
PUT /api/users/:id
Content-Type: application/json
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 用户 ID |

**请求体：**
```json
{
  "username": "newusername",
  "email": "new@example.com",
  "password": "newpassword",
  "dailyWordGoal": 30,
  "dailyListeningGoal": 45,
  "dailyReadingGoal": 5
}
```

**成功响应 (200)：**
```json
{
  "id": 1,
  "username": "newusername",
  "email": "new@example.com",
  "avatar": "/info/pic/avatar.jpg",
  "dailyWordGoal": 30,
  "dailyListeningGoal": 45,
  "dailyReadingGoal": 5
}
```

---

#### 5. 上传用户头像

```
POST /api/users/:id/avatar
Content-Type: multipart/form-data
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 用户 ID |

**表单字段：**
| 字段 | 类型 | 说明 |
|------|------|------|
| avatar | File | 头像图片文件 |

**成功响应 (200)：**
```json
{
  "avatar": "/info/pic/avatar_1_1234567890.jpg"
}
```

---

### 单词书接口 (wordbooks)

基础路径：`/api/wordbooks`

#### 1. 获取所有单词书

```
GET /api/wordbooks
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "name": "CET-4 词汇",
    "description": "大学英语四级词汇",
    "chapter_count": 10,
    "word_count": 100,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### 2. 获取单词书详情

```
GET /api/wordbooks/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 单词书 ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "name": "CET-4 词汇",
  "description": "大学英语四级词汇",
  "chapters": [
    {
      "id": 1,
      "wordbook_id": 1,
      "name": "第一单元",
      "chapter_order": 1,
      "word_count": 20
    }
  ],
  "words": [
    {
      "id": 1,
      "word": "abandon",
      "phonetic": "/əˈbændən/",
      "meaning": "放弃，抛弃",
      "status": "new"
    }
  ]
}
```

---

#### 3. 创建单词书

```
POST /api/wordbooks
Content-Type: application/json
```

**请求体：**
```json
{
  "name": "CET-6 词汇",
  "description": "大学英语六级词汇"
}
```

**成功响应 (201)：**
```json
{
  "id": 2,
  "name": "CET-6 词汇",
  "description": "大学英语六级词汇",
  "chapter_count": 0,
  "word_count": 0
}
```

---

#### 4. 更新单词书

```
PUT /api/wordbooks/:id
Content-Type: application/json
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 单词书 ID |

**请求体：**
```json
{
  "name": "新版 CET-6 词汇",
  "description": "更新后的六级词汇"
}
```

**成功响应 (200)：**
```json
{
  "id": 2,
  "name": "新版 CET-6 词汇",
  "description": "更新后的六级词汇"
}
```

---

#### 5. 删除单词书（级联删除）

```
DELETE /api/wordbooks/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 单词书 ID |

**说明：** 删除单词书时会同时删除关联的章节和单词。

**成功响应 (200)：**
```json
{
  "message": "Wordbook deleted successfully"
}
```

---

### 章节接口 (chapters)

基础路径：`/api/chapters`

#### 1. 获取所有章节

```
GET /api/chapters
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "wordbook_id": 1,
    "name": "第一单元",
    "chapter_order": 1,
    "audio_path": "/info/chapter-audio/audio.mp3",
    "word_count": 20
  }
]
```

---

#### 2. 按单词书获取章节

```
GET /api/chapters/wordbook/:wordbookId
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| wordbookId | INT | 单词书 ID |

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "wordbook_id": 1,
    "name": "第一单元",
    "chapter_order": 1,
    "word_count": 20
  }
]
```

---

#### 3. 获取章节详情

```
GET /api/chapters/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 章节 ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "wordbook_id": 1,
  "name": "第一单元",
  "chapter_order": 1,
  "audio_path": "/info/chapter-audio/audio.mp3",
  "words": [
    {
      "id": 1,
      "word": "abandon",
      "meaning": "放弃"
    }
  ]
}
```

---

#### 4. 创建章节

```
POST /api/chapters
Content-Type: application/json
```

**请求体：**
```json
{
  "wordbook_id": 1,
  "name": "第二单元",
  "chapter_order": 2
}
```

**成功响应 (201)：**
```json
{
  "id": 2,
  "wordbook_id": 1,
  "name": "第二单元",
  "chapter_order": 2
}
```

---

#### 5. 更新章节

```
PUT /api/chapters/:id
Content-Type: application/json
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 章节 ID |

**请求体：**
```json
{
  "name": "更新后的单元名称",
  "chapter_order": 3
}
```

**成功响应 (200)：**
```json
{
  "id": 2,
  "wordbook_id": 1,
  "name": "更新后的单元名称",
  "chapter_order": 3
}
```

---

#### 6. 上传章节音频

```
POST /api/chapters/:id/audio
Content-Type: multipart/form-data
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 章节 ID |

**表单字段：**
| 字段 | 类型 | 说明 |
|------|------|------|
| audio | File | 音频文件 |

**成功响应 (200)：**
```json
{
  "id": 2,
  "audio_path": "/info/chapter-audio/1234567890.mp3"
}
```

---

#### 7. 删除章节

```
DELETE /api/chapters/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 章节 ID |

**说明：** 删除章节时会将关联单词的 chapter_id 设为 NULL。

**成功响应 (200)：**
```json
{
  "message": "Chapter deleted successfully"
}
```

---

### 单词接口 (words)

基础路径：`/api/words`

#### 1. 获取所有单词

```
GET /api/words
```

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| wordbook_id | INT | 单词书 ID |
| chapter_id | INT | 章节 ID |
| status | STRING | 状态：new/learning/mastered |
| source_type | STRING | 来源：manual/ebook/reading |

**示例：**
```
GET /api/words?chapter_id=1&status=new
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "word": "abandon",
    "phonetic": "/əˈbændən/",
    "meaning": "放弃，抛弃",
    "example": "Don't abandon your dreams.",
    "status": "new",
    "wordbook_id": 1,
    "chapter_id": 1,
    "wordbook_name": "CET-4 词汇",
    "chapter_name": "第一单元",
    "source_title": null
  }
]
```

---

#### 2. 获取阅读词汇

```
GET /api/words/reading
```

**成功响应 (200)：**
```json
[
  {
    "id": 10,
    "word": "technology",
    "meaning": "技术",
    "source_type": "reading",
    "source_id": 1,
    "source_title": "人工智能的未来"
  }
]
```

---

#### 3. 获取单词详情

```
GET /api/words/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 单词 ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "word": "abandon",
  "phonetic": "/əˈbændən/",
  "meaning": "放弃，抛弃",
  "example": "Don't abandon your dreams.",
  "status": "new",
  "wordbook_name": "CET-4 词汇",
  "chapter_name": "第一单元",
  "chapter_audio_path": "/info/chapter-audio/audio.mp3"
}
```

---

#### 4. 创建单词

```
POST /api/words
Content-Type: application/json
```

**请求体：**
```json
{
  "word": "benevolent",
  "phonetic": "/bɪˈnevələnt/",
  "meaning": "仁慈的，善良的",
  "example": "She was benevolent and kind.",
  "status": "new",
  "wordbook_id": 1,
  "chapter_id": 1,
  "source_type": "manual",
  "is_polysemous": false,
  "is_similar": false
}
```

**成功响应 (201)：**
```json
{
  "id": 5,
  "word": "benevolent",
  "phonetic": "/bɪˈnevələnt/",
  "meaning": "仁慈的，善良的",
  "example": "She was benevolent and kind.",
  "status": "new",
  "wordbook_id": 1,
  "chapter_id": 1
}
```

---

#### 5. 批量创建单词

```
POST /api/words/batch
Content-Type: application/json
```

**请求体：**
```json
{
  "words": [
    {
      "word": "word1",
      "phonetic": "/wɜːrd/",
      "meaning": "单词1的释义",
      "example": "Example sentence."
    },
    {
      "word": "word2",
      "phonetic": "/wɜːrd/",
      "meaning": "单词2的释义"
    }
  ],
  "wordbook_id": 1,
  "chapter_id": 1
}
```

**成功响应 (201)：**
```json
[
  {
    "id": 6,
    "word": "word1"
  },
  {
    "id": 7,
    "word": "word2"
  }
]
```

---

#### 6. 更新单词

```
PUT /api/words/:id
Content-Type: application/json
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 单词 ID |

**请求体：**
```json
{
  "meaning": "新的释义",
  "status": "learning",
  "example": "新的例句"
}
```

**成功响应 (200)：**
```json
{
  "id": 1,
  "word": "abandon",
  "meaning": "新的释义",
  "status": "learning"
}
```

---

#### 7. 删除单词

```
DELETE /api/words/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 单词 ID |

**成功响应 (200)：**
```json
{
  "message": "Word deleted successfully"
}
```

---

#### 8. 更新单词状态

```
PUT /api/words/:id/status
Content-Type: application/json
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 单词 ID |

**请求体：**
```json
{
  "status": "mastered"
}
```

**成功响应 (200)：**
```json
{
  "id": 1,
  "status": "mastered",
  "last_reviewed_at": "2024-01-15T10:30:00.000Z"
}
```

---

### 音频接口 (audios)

基础路径：`/api/audios`

#### 1. 获取所有音频

```
GET /api/audios
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "title": "听力练习 1",
    "category": "练习",
    "duration": 300,
    "file_path": "/music/audio.mp3",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### 2. 获取音频详情

```
GET /api/audios/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 音频 ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "title": "听力练习 1",
  "category": "练习",
  "duration": 300,
  "file_path": "/music/audio.mp3"
}
```

---

#### 3. 创建音频（上传）

```
POST /api/audios
Content-Type: multipart/form-data
```

**表单字段：**
| 字段 | 类型 | 说明 |
|------|------|------|
| title | STRING | 音频标题 |
| category | STRING | 分类 |
| audio | FILE | 音频文件 |

**成功响应 (201)：**
```json
{
  "id": 2,
  "title": "听力练习 2",
  "category": "练习",
  "file_path": "/music/1234567890.mp3"
}
```

---

#### 4. 流式播放音频

```
GET /api/audios/stream/:filename
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| filename | STRING | 音频文件名 |

**说明：** 支持 Range 请求，用于音频播放器。

---

#### 5. 删除音频

```
DELETE /api/audios/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 音频 ID |

**说明：** 删除音频时会同时删除关联的笔记。

**成功响应 (200)：**
```json
{
  "message": "Audio deleted successfully"
}
```

---

### 文章接口 (articles)

基础路径：`/api/articles`

#### 1. 获取所有文章

```
GET /api/articles
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "title": "人工智能的未来",
    "content": "文章内容...",
    "difficulty": "medium",
    "word_count": 500,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### 2. 获取文章详情

```
GET /api/articles/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 文章 ID |

**成功响应 (200)：**
```json
{
  "id": 1,
  "title": "人工智能的未来",
  "content": "文章完整内容...",
  "difficulty": "medium",
  "word_count": 500
}
```

---

#### 3. 创建文章

```
POST /api/articles
Content-Type: application/json
```

**请求体：**
```json
{
  "title": "新文章标题",
  "content": "文章内容...",
  "difficulty": "easy"
}
```

**说明：** difficulty 可选值：easy, medium, hard

**成功响应 (201)：**
```json
{
  "id": 2,
  "title": "新文章标题",
  "content": "文章内容...",
  "difficulty": "easy",
  "word_count": 50
}
```

---

#### 4. 更新文章

```
PUT /api/articles/:id
Content-Type: application/json
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 文章 ID |

**请求体：**
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容...",
  "difficulty": "hard"
}
```

**成功响应 (200)：**
```json
{
  "id": 2,
  "title": "更新后的标题",
  "content": "更新后的内容...",
  "difficulty": "hard",
  "word_count": 100
}
```

---

#### 5. 删除文章

```
DELETE /api/articles/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 文章 ID |

**说明：** 删除文章时会同时删除关联的问题。

**成功响应 (200)：**
```json
{
  "message": "Article deleted successfully"
}
```

---

### 问题接口 (questions)

基础路径：`/api/questions`

#### 1. 获取文章的问题

```
GET /api/questions/article/:articleId
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| articleId | INT | 文章 ID |

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "article_id": 1,
    "question": "这篇文章的主题是什么？",
    "options": ["A. 科技", "B. 文化", "C. 政治", "D. 体育"],
    "correctAnswer": 0,
    "explanation": "根据文章内容，主题是科技",
    "type": "choice"
  }
]
```

---

#### 2. 创建问题

```
POST /api/questions
Content-Type: application/json
```

**请求体：**
```json
{
  "article_id": 1,
  "question": "这篇文章的主题是什么？",
  "options": ["A. 科技", "B. 文化", "C. 政治", "D. 体育"],
  "correct_answer": 0,
  "explanation": "根据文章内容，主题是科技",
  "type": "choice"
}
```

**成功响应 (201)：**
```json
{
  "id": 1,
  "article_id": 1,
  "question": "这篇文章的主题是什么？",
  "options": ["A. 科技", "B. 文化", "C. 政治", "D. 体育"],
  "correctAnswer": 0,
  "explanation": "根据文章内容，主题是科技",
  "type": "choice"
}
```

---

#### 3. 批量创建问题

```
POST /api/questions/batch
Content-Type: application/json
```

**请求体：**
```json
{
  "article_id": 1,
  "questions": [
    {
      "question": "问题1",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "type": "choice"
    },
    {
      "question": "问题2",
      "correctAnswerText": "正确答案",
      "type": "fill"
    }
  ]
}
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "question": "问题1",
    "type": "choice"
  },
  {
    "id": 2,
    "question": "问题2",
    "type": "fill"
  }
]
```

---

### 学习记录接口 (study_records)

基础路径：`/api/study_records`

#### 1. 获取所有学习记录

```
GET /api/study_records
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "words_learned": 20,
    "listening_minutes": 30,
    "articles_read": 2
  }
]
```

---

#### 2. 按日期获取学习记录

```
GET /api/study_records/:date
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| date | STRING | 日期（格式：YYYY-MM-DD） |

**示例：**
```
GET /api/study_records/2024-01-15
```

**成功响应 (200)：**
```json
{
  "id": 1,
  "date": "2024-01-15",
  "words_learned": 20,
  "listening_minutes": 30,
  "articles_read": 2
}
```

---

#### 3. 创建或更新学习记录

```
POST /api/study_records
Content-Type: application/json
```

**请求体：**
```json
{
  "date": "2024-01-15",
  "words_learned": 25,
  "listening_minutes": 45,
  "articles_read": 3
}
```

**说明：** 如果该日期已存在记录，则更新；不存在则创建。

**成功响应 (200)：**
```json
{
  "id": 1,
  "date": "2024-01-15",
  "words_learned": 25,
  "listening_minutes": 45,
  "articles_read": 3
}
```

---

### 笔记接口 (notes)

基础路径：`/api/notes`

#### 1. 获取所有笔记

```
GET /api/notes
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "audio_id": 1,
    "content": "这是一个重要的听力笔记",
    "timestamp": 120,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### 2. 按音频获取笔记

```
GET /api/notes/audio/:audioId
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| audioId | INT | 音频 ID |

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "audio_id": 1,
    "content": "笔记内容",
    "timestamp": 120
  },
  {
    "id": 2,
    "audio_id": 1,
    "content": "另一条笔记",
    "timestamp": 300
  }
]
```

---

#### 3. 创建笔记

```
POST /api/notes
Content-Type: application/json
```

**请求体：**
```json
{
  "audioId": 1,
  "content": "新的听力笔记内容",
  "timestamp": 180
}
```

**成功响应 (201)：**
```json
{
  "id": 3,
  "audio_id": 1,
  "content": "新的听力笔记内容",
  "timestamp": 180
}
```

---

#### 4. 删除笔记

```
DELETE /api/notes/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 笔记 ID |

**成功响应 (200)：**
```json
{
  "message": "Note deleted successfully"
}
```

---

### 每日名言接口 (quotes)

基础路径：`/api/quotes`

#### 1. 获取随机名言

```
GET /api/quotes/random
```

**成功响应 (200)：**
```json
{
  "id": 1,
  "quote": "The only way to do great work is to love what you do.",
  "author": "Steve Jobs"
}
```

---

### 电子书接口 (ebooks)

基础路径：`/api/ebooks`

#### 1. 获取所有电子书

```
GET /api/ebooks
```

**成功响应 (200)：**
```json
[
  {
    "id": 1,
    "title": "英语语法全书",
    "file_path": "/info/ebooks/book.pdf",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

#### 2. 上传电子书

```
POST /api/ebooks
Content-Type: multipart/form-data
```

**表单字段：**
| 字段 | 类型 | 说明 |
|------|------|------|
| title | STRING | 电子书标题 |
| ebook | FILE | PDF 文件 |

**成功响应 (201)：**
```json
{
  "id": 2,
  "title": "新电子书",
  "file_path": "/info/ebooks/1234567890.pdf"
}
```

---

#### 3. 删除电子书

```
DELETE /api/ebooks/:id
```

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | INT | 电子书 ID |

**成功响应 (200)：**
```json
{
  "message": "Ebook deleted successfully"
}
```

---

## 📝 测试示例

### 示例 1：完整的单词书创建流程

#### Step 1: 创建单词书
```http
POST /api/wordbooks
Content-Type: application/json

{
  "name": "IELTS 词汇",
  "description": "雅思考试必备词汇"
}
```

#### Step 2: 创建章节
```http
POST /api/chapters
Content-Type: application/json

{
  "wordbook_id": 1,
  "name": "Unit 1 - Education",
  "chapter_order": 1
}
```

#### Step 3: 批量添加单词
```http
POST /api/words/batch
Content-Type: application/json

{
  "words": [
    {
      "word": "curriculum",
      "phonetic": "/kəˈrɪkjələm/",
      "meaning": "课程",
      "example": "The school has revised its curriculum."
    },
    {
      "word": "scholarship",
      "phonetic": "/ˈskɒləʃɪp/",
      "meaning": "奖学金",
      "example": "She received a scholarship to study abroad."
    }
  ],
  "wordbook_id": 1,
  "chapter_id": 1
}
```

#### Step 4: 查看单词书详情
```http
GET /api/wordbooks/1
```

---

### 示例 2：阅读理解创建流程

#### Step 1: 创建文章
```http
POST /api/articles
Content-Type: application/json

{
  "title": "The Impact of Social Media",
  "content": "Social media has revolutionized how we communicate...",
  "difficulty": "medium"
}
```

#### Step 2: 批量创建问题
```http
POST /api/questions/batch
Content-Type: application/json

{
  "article_id": 1,
  "questions": [
    {
      "question": "What is the main topic of this passage?",
      "options": ["A. Technology", "B. Education", "C. Politics", "D. Sports"],
      "correctAnswer": 0,
      "explanation": "The passage primarily discusses technology."
    },
    {
      "question": "Fill in the blank: Social media has _____ how we communicate.",
      "correctAnswerText": "revolutionized",
      "type": "fill"
    }
  ]
}
```

#### Step 3: 查看问题和文章
```http
GET /api/questions/article/1
```

---

## ⚠️ 注意事项

1. **文件上传**：需要使用 `multipart/form-data` 格式
2. **JSON 请求**：需要设置 `Content-Type: application/json`
3. **日期格式**：使用 `YYYY-MM-DD` 格式
4. **错误处理**：所有接口在出错时会返回错误信息
5. **CORS**：后端已配置 CORS，允许前端访问

---

## 🔗 相关资源

- 前端项目地址：`http://localhost:5173`
- 后端 API 地址：`http://localhost:3001`
- 数据库管理：使用 MySQL Workbench 或其他 MySQL 客户端
- API 测试工具：Apifox、Postman 或 curl

---

*文档生成时间：2024年*
