
# 📦 KlikBot Deployment Guide (Google Cloud e2-micro VM)

## 1. 🔧 Google Cloud VM Setup (e2-micro Free Tier)
### VM Specs
- VM Type: `e2-micro`
- Region: `us-central1`, `us-west1`, or `us-east1`
- OS: Ubuntu 22.04 LTS Minimal
- Disk: 10 GB Standard HDD (free-tier eligible)
- External IP: Ephemeral (for internet access)

### Add Swap Memory (Prevents Crashes)
```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h  # Confirm swap is active
```

---

## 2. 🛠️ Install Node.js v20 + Puppeteer + PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nano wget curl chromium-browser
sudo npm install -g pm2
```

---

## 3. 🐬 Install MySQL + Create Tables
### Install MySQL
```bash
sudo apt update && sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### Create DB + Tables + User
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

## 4. 🌐 Nginx + Certbot SSL (Reverse Proxy for HTTPS)
### Install Nginx + Certbot
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo ufw allow 'Nginx Full'
```

### Configure Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/klikbot
```

Add:
```nginx
server {
    listen 80;
    server_name bot.klik.in.net;

    location / {
        proxy_pass http://localhost:3000;
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
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d bot.klik.in.net
```

---

## 5. 🧩 Source Code Setup + GitHub Push
### Prepare Files
- `index.js`, `rag_helper.js`, `business_data.json`, `.gitignore`, `package.json`

### Initialize Git + Push
```bash
git init
git remote add origin https://github.com/klik-innovations/klikBot.git
git add .
git commit -m "Initial push of KlikBot"
git branch -M main
git push -u origin main
```

---

## 6. ⚙️ PM2 Start Commands
```bash
pm2 start index.js --name klikBot
pm2 save
pm2 startup systemd
```

---

## ✅ Complete! Access your bot at https://bot.klik.in.net/status
