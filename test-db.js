// test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/classroom',
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error de conexión:', err.message);
  } else {
    console.log('Conexión exitosa:', res.rows[0]);
  }
  pool.end();
});