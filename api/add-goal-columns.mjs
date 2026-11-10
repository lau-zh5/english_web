import mysql from 'mysql2/promise';

async function addGoalColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'english_learning'
  });

  console.log('✅ Connected to MySQL');

  try {
    await connection.execute('ALTER TABLE users ADD COLUMN daily_word_goal INT DEFAULT 20');
    console.log('✅ Column daily_word_goal added');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ Column daily_word_goal already exists');
    } else {
      console.error('❌ Error adding daily_word_goal:', error.message);
    }
  }

  try {
    await connection.execute('ALTER TABLE users ADD COLUMN daily_listening_goal INT DEFAULT 30');
    console.log('✅ Column daily_listening_goal added');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ Column daily_listening_goal already exists');
    } else {
      console.error('❌ Error adding daily_listening_goal:', error.message);
    }
  }

  try {
    await connection.execute('ALTER TABLE users ADD COLUMN daily_reading_goal INT DEFAULT 3');
    console.log('✅ Column daily_reading_goal added');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ Column daily_reading_goal already exists');
    } else {
      console.error('❌ Error adding daily_reading_goal:', error.message);
    }
  }

  await connection.end();
  console.log('🎉 Operation completed!');
}

addGoalColumns().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});