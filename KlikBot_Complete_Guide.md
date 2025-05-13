# 📦 klikBot Complete Setup & Deployment Guide

Welcome to the klikBot project! This guide will help you set up, run, and deploy the klikBot WhatsApp bot on your local machine or cloud VM.

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
BOT_NAME=klikBot
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

## 🚀 5. Run klikBot code to test for any errors

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
git commit -m "Initial push of klikBot"
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
Then follow the instruction printed from the pm2 startup systemd command.

---

## 🌍 10. FreeDNS Setup (Domain)
Map your public VM IP to a domain like `klikbot.mozobot.com` using FreeDNS.afraid.org (A record).

---

## 📆 Done! Access your bot:
```bash
https://klikbot.yourdomain.com/status
```


## Auto-Cleanup and send disk usage alert if above threshold:

1. Create deep_clean.sh in your home folder (eg: /home/klikBot) file with the following content:

```bash
#!/bin/bash
LOGFILE="/var/log/klikbot-cleanup.log"
THRESHOLD=90
TARGET_NUMBER="601xxxxxxxxx"                            #change to your WhatsApp number (other than the one used by your bot)
AUTH_TOKEN="6b9afc8cb4358fc576bcc88a82e083xxxxxxxxxx"   #change to your bot token
API_URL="https://yourbot.mozobot.com/api/send-message"  #use your own domain
ALERT_MESSAGE="🚨 ALERT: klikBot VM disk usage has exceeded ${THRESHOLD}%. Immediate cleanup is recommended."

echo "[START] Cleanup started at $(date)" | tee -a $LOGFILE

# 1. Clean PM2 logs (user and root)
rm -rf /home/*/.pm2/logs/*.log /root/.pm2/logs/*.log 2>/dev/null
echo "✔️ PM2 logs cleared" | tee -a $LOGFILE

# 2. Clean NPM cache
npm cache clean --force 2>/dev/null
rm -rf /home/*/.npm 2>/dev/null
echo "✔️ NPM cache cleaned" | tee -a $LOGFILE

# 3. Clean /var/log
sudo journalctl --vacuum-time=1d
sudo truncate -s 0 /var/log/syslog /var/log/kern.log /var/log/auth.log 2>/dev/null
echo "✔️ System logs truncated" | tee -a $LOGFILE

# 4. Clean Snap cache and remove old revisions
rm -rf /var/lib/snapd/cache/*
snap list --all | awk '/disabled/ {print $1, $2}' | while read snapname revision; do
  echo "🧽 Removing $snapname revision $revision..." | tee -a $LOGFILE
  snap remove "$snapname" --revision="$revision" 2>/dev/null || echo "⚠️ Skipped: $snapname $revision" | tee -a $LOGFILE
done
echo "✔️ Snap junk removed" | tee -a $LOGFILE

# 5. Skip cleaning .wwebjs_auth and Chromium binaries intentionally
echo "✔️ Preserved Chromium and session folders" | tee -a $LOGFILE

# 6. Check disk usage
USAGE=$(df / | grep / | awk '{ print $5 }' | sed 's/%//g')
if [ "$USAGE" -ge "$THRESHOLD" ]; then
  echo "⚠️ Disk usage is at ${USAGE}% — sending WhatsApp alert..." | tee -a $LOGFILE
  curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"number\":\"$TARGET_NUMBER\",\"message\":\"$ALERT_MESSAGE\"}" >> $LOGFILE
else
  echo "✅ Disk usage is safe at ${USAGE}%." | tee -a $LOGFILE
fi

echo "[DONE] Cleanup finished at $(date)" | tee -a $LOGFILE
```

2. Make it executable:
```bash
chmod +x ~/deep_clean.sh
```

3. Run it to test:
```bash
sudo ~/deep_clean.sh
```

4. View the log:
```bash
cat /var/log/klikbot-cleanup.log
```

5. Edit the cron job file:
```bash
sudo crontab -e
```

6. Add the following line:
```bash
0 3 * * 0 /home/klikBot/deep_clean.sh
```


## CPU alert if above threshold and reboot if necessary:
cpu_alert.sh: WhatsApp Alert if CPU ≥ 90%
reboot_if_high_memory.sh: Auto Reboot if Memory Usage ≥ 90%

1. Create cpu_alert.sh file in your home folder (eg: /home/klikBot) file with the following content:

```bash
#!/bin/bash
THRESHOLD=90
USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}' | cut -d'.' -f1)
TARGET="601xxxxxxxx"                                        #change to your WhatsApp number (other than the one used by your bot)
AUTH_TOKEN="6b9afc8cb4358fc576bcc88a82e083xxxxxxxxxx"       #change to your bot token
API_URL="https://yourbot.mozobot.com/api/send-message"      #use your own domain
MESSAGE="🚨 ALERT: klikBot VM CPU usage is at ${USAGE}%. Investigate immediately!"

if [ "$USAGE" -ge "$THRESHOLD" ]; then
  curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"number\":\"$TARGET\",\"message\":\"$MESSAGE\"}"
fi
```

2. Create reboot_if_high_memory.sh file in your home folder (eg: /home/klikBot) file with the following content:

```bash
#!/bin/bash
LIMIT=90
USED=$(free | awk '/Mem:/ { printf("%.0f\n", $3/$2 * 100) }')

if [ "$USED" -ge "$LIMIT" ]; then
  echo "🧠 Memory usage is at ${USED}%. Rebooting..."
  /sbin/shutdown -r now "High memory usage – triggered auto reboot"
fi
```

3. Make it executable:
```bash
chmod +x ~/cpu_alert.sh ~/reboot_if_high_memory.sh
```

3. Run it to test:
```bash
sudo ~/cpu_alert.sh
sudo ~/reboot_if_high_memory.sh
```

4. Edit the cron job file:
```bash
sudo crontab -e
```

6. Add the following lines:
```bash
*/30 * * * * /home/klikBot/cpu_alert.sh
*/15 * * * * /home/klikBot/reboot_if_high_memory.sh
```


## Configure logrotate:

1. Create this file:
```bash
sudo nano /etc/logrotate.d/klikbot
```

2. Insert the following content:
```bash
/var/log/klikbot-cleanup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 644 root root
}
```

It will automatically compresses and rotates cleanup logs weekly, keeping the last 4.


