# 🚀 Hostinger KVM 4 VPS Deployment Guide for Xian's Game World

Complete, production-ready guide to deploy **Xian's Game World** (Next.js 16 + React 19 + Real-Time Socket.io Multiplayer + PostgreSQL 16) with **Docker**, **Automatic Let's Encrypt SSL**, and your **Custom Domain** on a **Hostinger KVM 4 VPS**.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client["🌐 Players & Gamers (Web & Mobile)"] -->|HTTPS (Port 443) / WSS (WebSockets)| Caddy["🛡️ Caddy 2 Reverse Proxy<br/>(Auto Let's Encrypt SSL & HTTP/3)"]
    Caddy -->|HTTP / WebSocket Upgrade| App["⚡ Xian's Game World Container<br/>(Next.js 16 + Socket.io Server on :3000)"]
    App -->|PostgreSQL Protocol| DB[("🗄️ PostgreSQL 16 Database<br/>(Persistent NVMe Volume: pgdata_prod)")]
    App -->|Google SMTP SSL 465| Gmail["📧 Gmail Mailer (sharedxian@gmail.com)"]
```

### Why Hostinger KVM 4 is Ideal
- **4 vCPUs & 16 GB RAM**: Handles hundreds of simultaneous multiplayer rooms and heavy physics calculations effortlessly.
- **200 GB NVMe Storage**: Blazing-fast PostgreSQL disk I/O.
- **Dedicated IPv4**: Stable DNS routing for your custom domain.

---

## 📋 Prerequisites

1. **Hostinger KVM 4 VPS** with **Ubuntu 22.04 LTS or 24.04 LTS**.
2. **Domain name** (managed on Hostinger, Cloudflare, Namecheap, GoDaddy, etc.).
3. **VPS IP Address** & SSH root credentials (found in your Hostinger hPanel).

---

## 🛠️ Step 1: Point Your Domain DNS to the VPS

Go to your DNS provider (Hostinger hPanel DNS Manager or Cloudflare) and create **A Records**:

| Type | Name | Content / Value | TTL | Proxy Status (if Cloudflare) |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (or `games`) | `<YOUR_HOSTINGER_VPS_IP>` | Auto / 300 | DNS Only (Gray Cloud) during SSL init |
| **A** | `www` | `<YOUR_HOSTINGER_VPS_IP>` | Auto / 300 | DNS Only (Gray Cloud) |

> 💡 *Note: If using Cloudflare, make sure Proxy is set to **DNS Only** (gray cloud) initially so Caddy can automatically verify the Let's Encrypt ACME challenge, or set SSL mode in Cloudflare to "Full (Strict)".*

---

## 🔐 Step 2: SSH into Your Hostinger VPS & Configure Firewall

Open PowerShell or Terminal on your computer and connect to your VPS:

```bash
ssh root@<YOUR_HOSTINGER_VPS_IP>
```

Update system packages and configure the firewall (`ufw`):

```bash
# Update Ubuntu packages
apt update && apt upgrade -y

# Allow essential ports
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP (ACME SSL challenge)
ufw allow 443/tcp    # HTTPS
ufw allow 443/udp    # HTTP/3 QUIC

# Enable firewall
ufw --force enable
ufw status
```

---

## 📦 Step 3: Clone the Repository & Configure Environment

Clone your project from GitHub into `/var/www/xian-games`:

```bash
mkdir -p /var/www
cd /var/www

git clone https://github.com/githubxiansaiful/web-games.git xian-games
cd xian-games
```

Create your production `.env` file from the provided template:

```bash
cp .env.production.example .env
nano .env
```

Edit the following fields in `.env`:
```env
# 1. Your domain name
DOMAIN=yourdomain.com

# 2. Your email for automatic SSL notifications
SSL_EMAIL=your-email@gmail.com

# 3. Create a strong PostgreSQL password
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CreateYourStrongPasswordHere2026!
POSTGRES_DB=xian_games

# 4. Gmail SMTP credentials (use your 16-character Google App Password)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=sharedxian@gmail.com
SMTP_PASSWORD=your_gmail_app_password_here

# 5. Leave empty to use unified self-hosted WebSocket server
NEXT_PUBLIC_SOCKET_URL=
```

Press `Ctrl + O`, then `Enter` to save, and `Ctrl + X` to exit `nano`.

---

## 🚀 Step 4: 1-Command Deployment

Make the deployment script executable and run it:

```bash
chmod +x deploy.sh backup-db.sh
./deploy.sh
```

### What `deploy.sh` Does Automatically:
1. Detects and installs Docker & Docker Compose if not already present.
2. Builds the optimized production Docker image (`xian-games-app`).
3. Starts the PostgreSQL 16 container with a persistent volume.
4. Auto-creates all PostgreSQL tables (`users`, `games`, `email_logs`) and migrates existing seed accounts.
5. Launches **Caddy 2**, which contacts Let's Encrypt, generates a free trusted SSL certificate, and binds HTTPS on port 443!

---

## ✅ Step 5: Verify Your Deployment

1. **Visit your website**: Open `https://yourdomain.com` in your browser.
   - You should see the green padlock (Valid SSL).
   - Test registration, login, and single-player games.
2. **Test Multiplayer Real-Time Racing**:
   - Open `https://yourdomain.com` in two separate browser tabs or on your phone.
   - Tab 1: Click **Create Room** (e.g. Code `123456`).
   - Tab 2: Click **Join Room** -> Enter `123456`.
   - Both players will instantly connect over WebSocket (WSS) and race in real-time!
3. **Check Container Status**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
4. **Access the Admin Dashboard**:
   - Log in with the super admin credentials configured in your `.env` file (`ADMIN_EMAIL` and `ADMIN_PASSWORD`).
   - Visit `https://yourdomain.com/admin` to view database health, registered users, and email logs.

---

## 🔄 Day-2 Operations & Maintenance

### 1. Zero-Downtime Application Updates
Whenever you push changes to GitHub, update your VPS with one command:
```bash
cd /var/www/xian-games
./deploy.sh
```

### 2. View Live Server Logs
```bash
# View all container logs in real time
docker compose -f docker-compose.prod.yml logs -f

# View only the application logs
docker compose -f docker-compose.prod.yml logs -f app

# View Caddy SSL & web access logs
docker compose -f docker-compose.prod.yml logs -f caddy
```

### 3. Automated Daily PostgreSQL Backups
To create an instant database backup:
```bash
./backup-db.sh
```
The compressed backup is saved in `./backups/xian_games_backup_YYYYMMDD_HHMMSS.sql.gz`.

To automate backups every night at 3:00 AM, add a cron job:
```bash
crontab -e
```
Add this line:
```cron
0 3 * * * cd /var/www/xian-games && ./backup-db.sh >> /var/log/cron-db-backup.log 2>&1
```

### 4. Direct Database Inspection (CLI)
To run SQL queries directly inside PostgreSQL:
```bash
docker exec -it xian-games-db-prod psql -U postgres -d xian_games
```
Example queries:
```sql
SELECT count(*) FROM users;
SELECT id, name, email, runner_games, space_high_score FROM users;
\q
```
