const mysql = require('mysql2/promise');

async function clean() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'agrigrade_ai',
    });

    console.log('Cleaning flyway_schema_history for failed version 14...');
    await connection.execute("DELETE FROM flyway_schema_history WHERE version = '14'");
    console.log('Failed Flyway record removed successfully.');
    await connection.end();
  } catch (err) {
    console.error('Error cleaning flyway schema history:', err.message);
  }
}

clean();
