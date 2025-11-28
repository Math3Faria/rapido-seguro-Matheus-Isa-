const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '10.87.169.35',
    user: 'matheu',
    password: '1706Smjmt@',
    database: 'rapidoseguro',
    port: '3306',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0 
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado ao MySQL')
        connection.release();
    } catch (error) {
        console.log(`Erro ao conectar com o MySQL: ${error}`)
    }
})();


module.exports = { pool };