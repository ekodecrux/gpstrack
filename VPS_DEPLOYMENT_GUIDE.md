# 🚀 VPS Deployment Guide - Bus Tracker SAAS

Complete guide for deploying Bus Tracker SAAS on your VPS (88.222.244.84)

---

## 📋 Quick Summary

- **Domain:** www.bustrackgps.in
- **Server IP:** 88.222.244.84
- **Technology:** PHP/MySQL (Apache/Nginx)
- **Database:** MySQL (21 tables)
- **SSL:** Let's Encrypt (Free)

---

## 🎯 Option 1: Automated Deployment (RECOMMENDED)

### **Single Command Deployment**

```bash
# 1. SSH into your VPS
ssh root@88.222.244.84

# 2. Download deployment script
wget https://raw.githubusercontent.com/ekodecrux/gpstrack/main/deploy-vps.sh

# 3. Make it executable
chmod +x deploy-vps.sh

# 4. Run deployment (as root)
sudo ./deploy-vps.sh
```

**That's it!** The script will automatically:
- ✅ Install LAMP stack
- ✅ Configure Apache
- ✅ Clone from GitHub
- ✅ Setup MySQL database
- ✅ Import all SQL files
- ✅ Configure SSL
- ✅ Setup firewall
- ✅ Generate secure passwords
- ✅ Save all credentials

**Time:** ~10-15 minutes (including SSL setup)

---

## 🛠️ Option 2: Manual Deployment

### **Prerequisites**
- Ubuntu 20.04+ or Debian 10+ VPS
- Root or sudo access
- Domain pointing to your server IP

### **Step-by-Step Manual Installation**

#### **1. Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

#### **2. Install Apache**
```bash
sudo apt install apache2 -y
sudo systemctl start apache2
sudo systemctl enable apache2
```

#### **3. Install MySQL**
```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
```

#### **4. Install PHP**
```bash
sudo apt install php libapache2-mod-php php-mysql php-mbstring php-xml php-curl php-json php-zip php-gd -y

# Enable required Apache modules
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
sudo systemctl restart apache2
```

#### **5. Clone Application**
```bash
# Create directory
sudo mkdir -p /var/www/bustrackgps.in
cd /var/www/bustrackgps.in

# Clone from GitHub
sudo git clone https://github.com/ekodecrux/gpstrack.git .
```

#### **6. Setup Database**
```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user (in MySQL prompt)
CREATE DATABASE bus_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bustracker_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON bus_tracker.* TO 'bustracker_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import SQL files (IN ORDER!)
mysql -u bustracker_user -p bus_tracker < database/schema.sql
mysql -u bustracker_user -p bus_tracker < database/super_admin_migration.sql
mysql -u bustracker_user -p bus_tracker < database/device_session_migration.sql
mysql -u bustracker_user -p bus_tracker < database/seed_working.sql
```

#### **7. Configure Application**
```bash
# Edit config file
sudo nano api/config.php
```

Update with your database credentials:
```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'bus_tracker');
define('DB_USER', 'bustracker_user');
define('DB_PASS', 'YOUR_SECURE_PASSWORD');

function getDB() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        return $pdo;
    } catch(PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed']));
    }
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function sendJSON($data) {
    echo json_encode($data);
    exit();
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $message, 'success' => false]);
    exit();
}

function validateRequired($data, $fields) {
    foreach($fields as $field) {
        if(!isset($data[$field]) || empty($data[$field])) {
            sendError("Missing required field: $field", 400);
        }
    }
}
?>
```

#### **8. Configure Apache Virtual Host**
```bash
sudo nano /etc/apache2/sites-available/bustrackgps.conf
```

Add this configuration:
```apache
<VirtualHost *:80>
    ServerName www.bustrackgps.in
    ServerAlias bustrackgps.in
    ServerAdmin admin@bustrackgps.in
    DocumentRoot /var/www/bustrackgps.in/public_html

    <Directory /var/www/bustrackgps.in/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /var/www/bustrackgps.in/api
    <Directory /var/www/bustrackgps.in/api>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/bustrackgps_error.log
    CustomLog ${APACHE_LOG_DIR}/bustrackgps_access.log combined

    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

Enable site:
```bash
sudo a2dissite 000-default.conf
sudo a2ensite bustrackgps.conf
sudo apache2ctl configtest
sudo systemctl restart apache2
```

#### **9. Set Permissions**
```bash
sudo chown -R www-data:www-data /var/www/bustrackgps.in
sudo chmod -R 755 /var/www/bustrackgps.in
sudo chmod 644 /var/www/bustrackgps.in/api/config.php
```

#### **10. Setup SSL (HTTPS)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Get SSL certificate
sudo certbot --apache -d www.bustrackgps.in -d bustrackgps.in

# Setup auto-renewal
sudo certbot renew --dry-run
```

#### **11. Configure Firewall**
```bash
sudo apt install ufw -y
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Apache Full'
sudo ufw enable
```

---

## 🧪 Testing After Deployment

### **1. Test URLs**

**Landing Page:**
```
https://www.bustrackgps.in/
```

**Super Admin:**
```
URL: https://www.bustrackgps.in/superadmin.html
Username: superadmin
Password: password
```

**School Admin:**
```
URL: https://www.bustrackgps.in/admin.html
Username: admin
Password: password
```

**Driver App:**
```
URL: https://www.bustrackgps.in/driver.html
Phone: +1234567890
PIN: 1234
```

**Parent App:**
```
URL: https://www.bustrackgps.in/parent.html
Phone: +1987654321
PIN: 5678
```

### **2. Test Device Session Management**

1. Open Chrome: `https://www.bustrackgps.in/driver.html`
2. Login: `+1234567890 / 1234`
3. Open Firefox: `https://www.bustrackgps.in/driver.html`
4. Login with same credentials
5. **Should show:** "Already Logged In" dialog
6. Click "Terminate Other Session & Login Here"
7. **Result:** Firefox logs in, Chrome gets logged out

### **3. Check Database**
```bash
mysql -u bustracker_user -p bus_tracker

# Check tables
SHOW TABLES;

# Check super admin
SELECT * FROM super_admins;

# Check drivers
SELECT * FROM drivers;

# Check session tables
SELECT * FROM driver_sessions;
```

---

## 📊 DNS Configuration

Before SSL setup, configure your DNS:

### **A Records (Required)**
```
Type: A
Name: @
Value: 88.222.244.84
TTL: 3600

Type: A
Name: www
Value: 88.222.244.84
TTL: 3600
```

### **Optional CNAME for Subdomains**
```
Type: CNAME
Name: app
Value: www.bustrackgps.in
TTL: 3600
```

**Wait 10-30 minutes for DNS propagation before running SSL setup**

---

## 🔧 Post-Deployment Configuration

### **1. Change Default Passwords (IMPORTANT!)**

**Super Admin:**
```sql
mysql -u bustracker_user -p bus_tracker

-- Generate new hash (use online bcrypt generator or PHP)
UPDATE super_admins 
SET password_hash = '$2y$10$YOUR_NEW_HASH' 
WHERE username = 'superadmin';
```

**School Admin:**
```sql
UPDATE school_admins 
SET password_hash = '$2y$10$YOUR_NEW_HASH' 
WHERE username = 'admin';
```

**Generate bcrypt hash:**
```bash
# Using PHP
php -r "echo password_hash('your_new_password', PASSWORD_BCRYPT);"
```

### **2. Update Driver/Parent PINs**
```sql
-- Update driver PIN
UPDATE drivers SET pin = '9999' WHERE phone = '+1234567890';

-- Update parent PIN
UPDATE parents SET pin = '8888' WHERE phone = '+1987654321';
```

### **3. Setup Automated Backups**

Create backup script:
```bash
sudo nano /root/backup-bustracker.sh
```

Add this content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u bustracker_user -pYOUR_PASSWORD bus_tracker > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/bustrackgps.in

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and add to crontab:
```bash
chmod +x /root/backup-bustracker.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /root/backup-bustracker.sh >> /var/log/backup.log 2>&1
```

### **4. Monitor Logs**

**Apache Errors:**
```bash
sudo tail -f /var/log/apache2/bustrackgps_error.log
```

**MySQL Errors:**
```bash
sudo tail -f /var/log/mysql/error.log
```

**System Logs:**
```bash
sudo journalctl -u apache2 -f
```

### **5. PHP Configuration (Optional)**

Edit PHP settings for better performance:
```bash
sudo nano /etc/php/7.4/apache2/php.ini

# Recommended settings:
upload_max_filesize = 20M
post_max_size = 25M
max_execution_time = 300
memory_limit = 256M
max_input_vars = 3000
```

Restart Apache:
```bash
sudo systemctl restart apache2
```

---

## 🚨 Troubleshooting

### **Issue: Can't connect to MySQL**
```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### **Issue: Apache not starting**
```bash
# Check Apache status
sudo systemctl status apache2

# Test configuration
sudo apache2ctl configtest

# Check error logs
sudo tail -f /var/log/apache2/error.log
```

### **Issue: SSL certificate failed**
```bash
# Make sure DNS is pointing to your server
dig www.bustrackgps.in

# Try manual SSL setup
sudo certbot --apache -d www.bustrackgps.in -d bustrackgps.in --dry-run

# Check Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### **Issue: Permission denied**
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/bustrackgps.in
sudo chmod -R 755 /var/www/bustrackgps.in
sudo chmod 644 /var/www/bustrackgps.in/api/config.php
```

### **Issue: Database connection failed**
```bash
# Test database connection
mysql -u bustracker_user -p bus_tracker

# Check config.php has correct credentials
sudo cat /var/www/bustrackgps.in/api/config.php

# Check MySQL user exists
mysql -u root -p
SELECT User, Host FROM mysql.user WHERE User = 'bustracker_user';
```

---

## 📞 Support & Resources

- **GitHub Repository:** https://github.com/ekodecrux/gpstrack
- **Documentation:** Check `/docs` folder in repository
- **Test Credentials:** See `TEST_CREDENTIALS.txt`
- **Deployment Script:** `deploy-vps.sh`

---

## ✅ Deployment Checklist

Before going live, ensure:

- [ ] Domain DNS pointing to server IP (88.222.244.84)
- [ ] Apache installed and running
- [ ] MySQL installed and running
- [ ] PHP 7.4+ installed
- [ ] Application cloned from GitHub
- [ ] Database created (bus_tracker)
- [ ] All SQL files imported (21 tables)
- [ ] config.php configured with correct credentials
- [ ] Apache virtual host configured
- [ ] SSL certificate installed (HTTPS)
- [ ] Firewall configured (UFW)
- [ ] File permissions set correctly
- [ ] All URLs tested and working
- [ ] Device session management tested
- [ ] Default passwords changed
- [ ] Automated backups configured
- [ ] Monitoring/logging setup

---

## 🎉 Success!

Once deployment is complete:

1. **Access your application:** https://www.bustrackgps.in
2. **Login as Super Admin** to configure first school
3. **Change all default passwords**
4. **Setup backups**
5. **Monitor logs regularly**

**Your Bus Tracker SAAS is now live!** 🚀

---

**Version:** 4.3  
**Last Updated:** December 11, 2025  
**Status:** Production Ready
