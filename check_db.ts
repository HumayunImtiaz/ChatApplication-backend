import db from './src/config/database.js';

async function check() {
  try {
    const columns = await db('messages').columnInfo();
    console.log('Columns in messages table:', Object.keys(columns));
    process.exit(0);
  } catch (error) {
    console.error('Error checking columns:', error);
    process.exit(1);
  }
}

check();
