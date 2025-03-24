require('dotenv').config();
const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { storeMessage, getChatHistory, pingDB } = require('./utils/database');
const { detectLanguageLocal, generateAIReply } = require('./utils/ai');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const BOT_NAME = process.env.BOT_NAME || "KlikBot";
const PORT = process.env.PORT || 3001;
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;

// === MySQL Connection Pool for Queue ===
const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// === WhatsApp Client ===
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log(`✅ ${BOT_NAME} is ready!`));

// === Handle Incoming WhatsApp Messages ===
client.on('message', async (message) => {
    const { from, body } = message;
    const chatId = from;
    const userMessage = body;

    if (!userMessage.startsWith('!')) {
        switch (userMessage.toLowerCase()) {
            case 'menu':
                message.reply(`Welcome to ${BOT_NAME}!\n1️⃣ Product Info\n2️⃣ Troubleshooting\n3️⃣ Billing\n4️⃣ Talk to Agent`);
                break;
            case '1':
                message.reply("Our services: AI software, animation, e-commerce. More: https://klik.net.my");
                break;
            case '2':
                message.reply("Reply:\n- 'login'\n- 'payment'\n- 'technical'");
                break;
            case '3':
                message.reply("Billing portal: https://klik.net.my/billing or billing@klik.net.my");
                break;
            case 'agent':
                message.reply("Connecting to human agent... or email support@klik.net.my");
                break;
            default:
                const chat = await client.getChatById(chatId);
                await chat.sendStateTyping();
                const history = await getChatHistory(chatId, 5);
                const aiReply = await generateAIReply(userMessage, history);
                await storeMessage(from, message.to, userMessage, 'text', 'received', aiReply, '', chatId);
                await client.sendMessage(chatId, aiReply);
                await chat.clearState();
        }
    }
});

// === Queue Processor ===
const randomDelay = () => Math.floor(Math.random() * (90000 - 30000 + 1)) + 30000;

async function processQueue() {
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
}

setInterval(processQueue, randomDelay());

// === Auth Middleware ===
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token === API_AUTH_TOKEN) {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
};

// === API: Queue Message ===
app.post('/api/queue-message', authMiddleware, async (req, res) => {
    const { sender, recipient, message, unique_id } = req.body;
    if (!sender || !recipient || !message || !unique_id) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        await db.query(
            "INSERT INTO message_queue (sender, recipient, message, unique_id, status, retries, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', 0, NOW(), NOW())",
            [sender, recipient, message, unique_id]
        );
        res.json({ success: true, message: 'Queued successfully' });
    } catch (err) {
        console.error('Queue Error:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// === API: Check Status ===
app.get('/api/check-status', authMiddleware, async (req, res) => {
    const unique_id = req.query.unique_id;
    if (!unique_id) {
        return res.status(400).json({ error: 'Missing unique_id' });
    }

    try {
        const [rows] = await db.query(
            "SELECT status FROM message_queue WHERE unique_id = ? LIMIT 1",
            [unique_id]
        );

        if (rows.length > 0) {
            res.json({ unique_id, status: rows[0].status });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (err) {
        console.error('Status Check Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// === Health Check ===
app.get('/status', (req, res) => res.json({ status: 'running' }));

// === MySQL Keep-Alive ===
setInterval(async () => {
    await pingDB();
}, 60000);

// === Start Bot + Server ===
client.initialize();
app.listen(PORT, () => {
    console.log(`🚀 Server + Bot running on port ${PORT}`);
});
