require('dotenv').config();
const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { storeMessage, getChatHistory, processQueueRandom } = require('./utils/database');
const { detectLanguageLocal, getWaitMessage, generateAIReply } = require('./utils/ai');

const BOT_NAME = process.env.BOT_NAME || "Klik Innovations Support";
const WEBSITE_URL = process.env.WEBSITE_URL || "https://klik.net.my";
const BILLING_URL = process.env.BILLING_URL || "https://klik.net.my/billing";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@klik.net.my";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log(`✅ ${BOT_NAME} is ready!`));

client.on('message', async (message) => {
    const { from, to, body } = message;
    const chatId = from;
    const userMessage = body;

    if (!userMessage.startsWith('!')) {
        switch (userMessage.toLowerCase()) {
            case 'menu':
                message.reply(`Welcome to ${BOT_NAME}! Choose an option:\n1️⃣ Product Info\n2️⃣ Troubleshooting\n3️⃣ Billing\n4️⃣ Talk to Agent`);
                break;
            case '1':
                message.reply(`Our services: AI software, animation, e-commerce. More: ${WEBSITE_URL}`);
                break;
            case '2':
                message.reply("Reply:\n- 'login'\n- 'payment'\n- 'technical'");
                break;
            case '3':
                message.reply(`Billing portal: ${BILLING_URL} or ${SUPPORT_EMAIL}`);
                break;
            case 'agent':
                message.reply(`Connecting to human agent... or email ${SUPPORT_EMAIL}`);
                break;
            default:
                const language = detectLanguageLocal(userMessage);
                const waitMessage = getWaitMessage(language);

                client.sendMessage(chatId, waitMessage);

                const history = await getChatHistory(chatId, 5);

                // Simulate typing indicator by sending presence update
                const chat = await client.getChatById(chatId);
                await chat.sendStateTyping();

                const aiReply = await generateAIReply(userMessage, history);
                await storeMessage(from, to, userMessage, 'text', 'received', aiReply, '', chatId);

                await client.sendMessage(chatId, aiReply);

                // Clear typing status
                await chat.clearState();
        }
    }
});

// API: Send text
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    try {
        const response = await client.sendMessage(chatId, message);
        res.json({ success: true, response });
    } catch (error) {
        res.json({ success: false, error });
    }
});

// API: Send image
app.post('/send-image', async (req, res) => {
    const { number, imageUrl, caption } = req.body;
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    try {
        const media = await MessageMedia.fromUrl(imageUrl);
        const response = await client.sendMessage(chatId, media, { caption });
        res.json({ success: true, response });
    } catch (error) {
        res.json({ success: false, error });
    }
});

app.get('/status', (req, res) => res.json({ status: 'running' }));

client.initialize();
processQueueRandom(client); // Process message queue with random delay

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

setInterval(async () => {
    const { pingDB } = require('./utils/database');
    await pingDB();
}, 60000);
