# KlikBot Student Guide

Welcome to the KlikBot project! This guide will help you set up and run the KlikBot WhatsApp bot on your own system.

---

## 📦 1. Clone the Source Code

Open terminal or Git Bash and run:
```bash
git clone https://github.com/klik-innovations/klikBot.git
cd klikBot
```

---

## ⚙️ 2. Install Dependencies

Ensure Node.js is installed. Then run:
```bash
npm install
```

---

## 📝 3. Setup .env File

Create a `.env` file inside the project folder:
```bash
nano .env
```
Paste this content:
```env
BOT_NAME=KlikBot
WEBSITE_URL=https://yourdomain.com
BILLING_URL=https://yourdomain.com/billing
SUPPORT_EMAIL=support@yourdomain.com
PORT=3001

DB_HOST=localhost
DB_USER=bot
DB_PASS=BOT8.father
DB_NAME=bot

OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key
```
Save and exit.

---

## 🗃️ 4. Setup MySQL Database

Use the provided SQL script `init.sql` in the `/database` folder to set up your database.

Run these SQL commands (via phpMyAdmin or MySQL CLI):
```sql
CREATE DATABASE bot;
-- Then execute the contents of init.sql to create tables 'messages' and 'message_queue'
```

---

## 🚀 5. Run KlikBot Locally

Start the bot:
```bash
node index.js
```

Visit your bot status:
```
http://localhost:3001/status
```
Expected output:
```json
{"status": "running"}
```

---

## 🌐 6. Nginx Reverse Proxy (Optional)
If you're hosting on a VM and want to expose KlikBot on port 80 or 443:

### Sample Nginx Config:
```nginx
server {
    listen 80;
    server_name klikbot.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable SSL via Certbot:
```bash
sudo certbot --nginx -d klikbot.yourdomain.com
```

---

## 🌍 7. FreeDNS.afraid.org Setup
Use FreeDNS to map your VM's public IP to a domain like `klikbot.mozobot.com`. Update the A record to your VM IP.

---

## 🧩 Support
For help, reach out to your instructor or visit the project discussion board.

Happy Coding! 🚀

