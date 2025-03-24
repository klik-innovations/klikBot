const mysql = require('mysql2/promise');

const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const storeMessage = async (from, to, message, messageType, status, response = '', mediaUrl = '', chatId = '') => {
    try {
        await db.query(
            "INSERT INTO messages (sender, receiver, message, message_type, timestamp, status, response, media_url, chat_id) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)",
            [from, to, message, messageType, status, response, mediaUrl, chatId]
        );
    } catch (err) {
        console.error('Error storing message:', err);
    }
};

const getChatHistory = async (sender, limit) => {
    const [rows] = await db.query(
        "SELECT message, response FROM messages WHERE sender = ? ORDER BY timestamp DESC LIMIT ?",
        [sender, limit]
    );
    return rows.map(row => `User: ${row.message}\nBot: ${row.response}`).join("\n");
};

const pingDB = async () => {
    try {
        await db.query('SELECT 1');
        console.log('MySQL Keep-Alive: Success');
    } catch (err) {
        console.error('MySQL Keep-Alive Error:', err);
    }
};

module.exports = { storeMessage, getChatHistory, pingDB };
