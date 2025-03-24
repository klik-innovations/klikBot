# 📦 KlikBot Complete Setup & Deployment Guide

Welcome to the KlikBot project! This guide will help you set up, run, and deploy the KlikBot WhatsApp bot on your local machine or cloud VM.

---

## 📆 1. Clone the Source Code

```bash
git clone https://github.com/klik-innovations/klikBot.git
cd klikBot
```

---

## ⚙️ 2. Install Dependencies (Node.js + dotenv)

Ensure Node.js v20+ is installed:
```bash
node -v
```
Install dependencies:
```bash
npm install dotenv
npm install
```

---

## 📕 3. Setup .env File

Create `.env` file:
```bash
nano .env
```
Paste:
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

---

## 📃 4. Setup MySQL Database

Use MySQL CLI or phpMyAdmin:
```sql
CREATE DATABASE bot;
USE bot;

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender VARCHAR(50),
    receiver VARCHAR(50),
    message TEXT,
    message_type VARCHAR(20),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20),
    response TEXT,
    media_url TEXT,
    chat_id VARCHAR(50)
);

CREATE TABLE message_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(50),
    message TEXT,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    retries INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE USER 'bot'@'localhost' IDENTIFIED BY 'BOT8.father';
GRANT ALL PRIVILEGES ON bot.* TO 'bot'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🚀 5. Run KlikBot Locally

```bash
node index.js
```
Visit:
```
http://localhost:3001/status
```
Expected:
```json
{"status": "running"}
```

---

## 🔧 6. VM Deployment (Google Cloud e2-micro)

### VM Specs
- VM Type: `e2-micro`
- Region: `us-central1`, `us-west1`, or `us-east1`
- OS: Ubuntu 22.04 or 24.04 LTS
- Disk: 10 GB Standard HDD

### Add Swap Memory:
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Install Node.js, PM2, Puppeteer Dependencies:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nano wget curl
sudo apt install -y libnss3 libatk-bridge2.0-0t64 libxss1 libasound2t64 libgtk-3-0t64 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libpangocairo-1.0-0 libcairo2 libu2f-udev libvulkan1
sudo npm install -g pm2
```

---

## 🌐 7. Nginx + SSL (Reverse Proxy)

### Install Nginx + Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo ufw allow 'Nginx Full'
```

### Nginx Config:
```nginx
sudo nano /etc/nginx/sites-available/klikbot

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
Enable config:
```bash
sudo ln -s /etc/nginx/sites-available/klikbot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Enable SSL:
```bash
sudo certbot --nginx -d klikbot.yourdomain.com
```

---

## 🧩 8. GitHub Push (Optional for Code Backup)
```bash
git init
git remote add origin https://github.com/klik-innovations/klikBot.git
git add .
git commit -m "Initial push of KlikBot"
git branch -M main
git push -u origin main
```

---

## 🚧 9. PM2 Auto Start

```bash
pm2 start index.js --name klikBot
pm2 save
pm2 startup systemd
```

---

## 🌍 10. FreeDNS Setup (Domain)
Map your public VM IP to a domain like `klikbot.mozobot.com` using FreeDNS.afraid.org (A record).

---

## 📆 Done! Access your bot:
```bash
https://klikbot.yourdomain.com/status
```
