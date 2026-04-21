import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.njtfmuylfdybprzhgjyx',
  password: '3n2KuPz4eDklKE74',
  ssl: { rejectUnauthorized: false }
});

console.log('🔄 Connecting to Supabase...');
console.log('Host:', client.host);
console.log('Port:', client.port);
console.log('User:', client.user);
console.log('Database:', client.database);

client.connect()
  .then(() => {
    console.log('\n✅ SUCCESS! Connected to Supabase!');
    return client.query('SELECT NOW()');
  })
  .then(result => {
    console.log('✅ Database time:', result.rows[0].now);
    console.log('✅ Connection working perfectly!\n');
    client.end();
  })
  .catch(err => {
    console.error('\n❌ CONNECTION FAILED!');
    console.error('Error Message:', err.message);
    console.error('Error Code:', err.code);
    console.error('\nFull error:', err);
  });