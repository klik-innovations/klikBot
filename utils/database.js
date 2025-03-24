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

const processQueueRandom = (client) => {
    const randomDelay = () => Math.floor(Math.random() * (90000 - 30000 + 1)) + 30000;

    const processQueue = async () => {
        const [rows] = await db.query(
            "SELECT * FROM message_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
        );

        if (rows.length === 0) {
            console.log("📭 No pending messages in queue.");
            return;
        }

        const message = rows[0];
        const chatId = `${message.recipient}@c.us`;

        try {
            await client.sendMessage(chatId, message.message);
            await db.query("UPDATE message_queue SET status = 'sent' WHERE id = ?", [message.id]);
            console.log(`✅ Message sent to ${message.recipient}`);
        } catch (error) {
            console.error(`❌ Failed to send message to ${message.recipient}`, error);
            if (message.retries < 3) {
                await db.query("UPDATE message_queue SET retries = retries + 1 WHERE id = ?", [message.id]);
            } else {
                await db.query("UPDATE message_queue SET status = 'failed' WHERE id = ?", [message.id]);
            }
        }
    };

    setInterval(processQueue, randomDelay());
};

const pingDB = async () => {
    try {
        await db.query('SELECT 1');
        console.log('MySQL Keep-Alive: Success');
    } catch (err) {
        console.error('MySQL Keep-Alive Error:', err);
    }
};

module.exports = { storeMessage, getChatHistory, processQueueRandom, pingDB };
