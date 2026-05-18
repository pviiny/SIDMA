const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "sidma",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres"
});

async function testConnection() {
    const client = await pool.connect();
    try {
        await client.query("SELECT 1");
        console.log("Conexao com PostgreSQL estabelecida.");
    } finally {
        client.release();
    }
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    testConnection
};
