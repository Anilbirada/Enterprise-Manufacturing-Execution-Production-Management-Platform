# PRODUCTION DEPLOYMENT & DEVOPS GUIDE
## RSR Factory360 MES Infrastructure

---

### 1. Prerequisites & System Requirements
- **Host OS:** Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) or Windows Server with WSL2 / Docker Desktop.
- **Hardware:**
  - CPU: Minimum 4 Cores (8 Cores recommended for high-frequency telemetry).
  - RAM: 16 GB minimum (32 GB recommended).
  - Disk: 100 GB SSD/NVMe with RAID-1 for persistent database storage.
- **Software Dependencies:**
  - Docker Engine v24.0+
  - Docker Compose v2.20+
  - Git

---

### 2. Production Docker Compose Stack

The stack comprises 4 containerized services connected over the isolated `rsr-net` bridge network:

```
+-------------------------------------------------------------+
|                      RSR FACTORY360 STACK                   |
|                                                             |
|   +-------------------+        +--------------------+       |
|   |   Nginx Frontend  | <----> |  Express Backend   |       |
|   |    Port 80/443    |        |     Port 5000      |       |
|   +-------------------+        +--------------------+       |
|                                     |         |             |
|                                     v         v             |
|                              +---------+  +---------+       |
|                              | MongoDB |  |  Redis  |       |
|                              | :27017  |  |  :6379  |       |
|                              +---------+  +---------+       |
+-------------------------------------------------------------+
```

#### Starting the Production Stack
```bash
# Clone or navigate to the project directory
cd /opt/rsrfactory360

# Build and start all services in detached mode
docker compose up -d --build

# Verify container health status
docker compose ps
```

---

### 3. Nginx Reverse Proxy & SSL Configuration
The Nginx configuration (`docker/nginx.conf`) manages:
- SPA fallback routing: `try_files $uri $uri/ /index.html`
- REST API proxy: `/api/` -> `http://backend:5000`
- WebSocket proxy: `/socket.io/` -> `http://backend:5000` with HTTP/1.1 upgrade headers.
- Gzip compression for fast loading over shop-floor Wi-Fi.

#### Enabling HTTPS / SSL Certificates
To install Let's Encrypt or corporate internal CA certificates:
1. Mount certificates into the Nginx container:
   ```yaml
   volumes:
     - /etc/ssl/certs/rsr_mes.crt:/etc/ssl/certs/cert.crt:ro
     - /etc/ssl/private/rsr_mes.key:/etc/ssl/private/cert.key:ro
   ```
2. Update `docker/nginx.conf` with:
   ```nginx
   listen 443 ssl http2;
   ssl_certificate /etc/ssl/certs/cert.crt;
   ssl_certificate_key /etc/ssl/private/cert.key;
   ssl_protocols TLSv1.2 TLSv1.3;
   ```

---

### 4. Automated Backup Configuration (Cron)
Add the following cron entry to the host server to trigger daily automated backups:

```bash
# Open host crontab
crontab -e

# Add automated daily backup at 02:00 AM IST
0 2 * * * /opt/rsrfactory360/docker/backup.sh >> /var/log/rsr_backup.log 2>&1
```

---

### 5. Disaster Recovery Restoration Procedure
In the event of hardware replacement or database disaster:

```bash
# Ensure containers are running
docker compose up -d mongo

# Make restore script executable
chmod +x docker/restore.sh

# Run restoration with target backup archive
./docker/restore.sh /var/backups/rsrfactory360/rsrfactory360_backup_20261108_020000.tar.gz

# Confirm the restoration prompt ('yes')
# Restart backend service to refresh caches
docker compose restart backend
```

---

### 6. Health Checks & Monitoring
- **Backend Healthcheck:** `GET http://localhost:5000/api/health` returns HTTP 200 with database status.
- **Frontend Healthcheck:** `GET http://localhost:80/` verified by Nginx container daemon.
- **Database Status:** `docker exec -it rsr_mongo mongosh --eval "db.adminCommand('ping')"`
