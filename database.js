// database.js
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'gremio-gods'
    });
    console.log('Database connection successfully established');
    return connection;
}

module.exports = initializeDatabase;
