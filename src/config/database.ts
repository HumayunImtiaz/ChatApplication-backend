import knex from 'knex';
import config from './knexfile.js';

const dbConfig = {
  ...config,
  connection: {
    ...(typeof config.connection === 'object' ? config.connection : {}),
    ssl: { rejectUnauthorized: false }
  }
};

const db = knex(dbConfig);


db.raw('select 1')
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error(' Database connection failed:', err.message);
  });

export default db;