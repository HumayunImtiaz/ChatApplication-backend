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

export default db;