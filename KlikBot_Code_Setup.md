# KlikBot Student Guide

Welcome to the KlikBot project! This guide will help you set up and run the KlikBot WhatsApp bot on your own system.

---

## 📦 1. Clone the Source Code

Open SSH terminal or Git Bash and run:
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
$ sudo mysql -u root -p

Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 8
Server version: 8.0.41-0ubuntu0.24.04.1 (Ubuntu)

Copyright (c) 2000, 2025, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> CREATE DATABASE bot;
Query OK, 1 row affected (2.48 sec)

mysql> USE bot;
Database changed
mysql> CREATE TABLE messages (
    ->     id INT AUTO_INCREMENT PRIMARY KEY,
    ->     sender VARCHAR(50),
    ->     receiver VARCHAR(50),
    ->     message TEXT,
    ->     message_type VARCHAR(20),
    ->     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ->     status VARCHAR(20),
    ->     response TEXT,
    ->     media_url TEXT,
    ->     chat_id VARCHAR(50)
    -> );
Query OK, 0 rows affected (1.15 sec)

mysql> CREATE TABLE message_queue (
    ->     id INT AUTO_INCREMENT PRIMARY KEY,
    ->     recipient VARCHAR(50),
    ->     message TEXT,
    ->     status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    ->     retries INT DEFAULT 0,
    ->     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -> );
Query OK, 0 rows affected (0.26 sec)

mysql> CREATE USER 'bot'@'localhost' IDENTIFIED BY 'BOT8.father';
Query OK, 0 rows affected (1.68 sec)

mysql> GRANT ALL PRIVILEGES ON bot.* TO 'bot'@'localhost';
Query OK, 0 rows affected (0.14 sec)

mysql> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.17 sec)

mysql> quit;
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
$ sudo nano /etc/nginx/sites-available/klikbot

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

$ sudo ln -s /etc/nginx/sites-available/klikbot /etc/nginx/sites-enabled/
$ sudo nginx -t
$ sudo systemctl reload nginx
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful

$ sudo certbot --nginx -d klikbot.mozobot.com
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Enter email address (used for urgent renewal and security notices)
 (Enter 'c' to cancel): klik.innovations@gmail.com

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please read the Terms of Service at
https://letsencrypt.org/documents/LE-SA-v1.5-February-24-2025.pdf. You must
agree in order to register with the ACME server. Do you agree?
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(Y)es/(N)o: y

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Would you be willing, once your first certificate is successfully issued, to
share your email address with the Electronic Frontier Foundation, a founding
partner of the Let's Encrypt project and the non-profit organization that
develops Certbot? We'd like to send you email about our work encrypting the web,
EFF news, campaigns, and ways to support digital freedom.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(Y)es/(N)o: y
Account registered.
Requesting a certificate for klikbot.mozobot.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/klikbot.mozobot.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/klikbot.mozobot.com/privkey.pem
This certificate expires on 2025-06-22.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

Deploying certificate
Successfully deployed certificate for klikbot.mozobot.com to /etc/nginx/sites-enabled/klikbot
Congratulations! You have successfully enabled HTTPS on https://klikbot.mozobot.com

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
If you like Certbot, please consider supporting our work by:
 * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
 * Donating to EFF:                    https://eff.org/donate-le

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

