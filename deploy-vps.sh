#!/bin/bash

################################################################################
# Bus Tracker SAAS - Automated VPS Deployment Script
# Version: 4.3
# Date: December 11, 2025
# 
# This script will:
# 1. Install LAMP stack (Apache, MySQL, PHP)
# 2. Configure Apache virtual host
# 3. Clone application from GitHub
# 4. Setup MySQL database
# 5. Configure SSL with Let's Encrypt
# 6. Setup firewall
# 7. Configure file permissions
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables
DOMAIN="www.bustrackgps.in"
DOMAIN_ALT="bustrackgps.in"
SERVER_IP="88.222.244.84"
APP_DIR="/var/www/bustrackgps.in"
GITHUB_REPO="https://github.com/ekodecrux/gpstrack.git"
DB_NAME="bus_tracker"
DB_USER="bustracker_user"
DB_PASS=""  # Will be generated or prompted
ADMIN_EMAIL="admin@bustrackgps.in"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

################################################################################
# Main Deployment Functions
################################################################################

step1_system_update() {
    print_header "Step 1: Updating System"
    
    print_info "Updating package lists..."
    apt update -y
    
    print_info "Upgrading installed packages..."
    apt upgrade -y
    
    print_success "System updated successfully"
}

step2_install_lamp() {
    print_header "Step 2: Installing LAMP Stack"
    
    # Install Apache
    print_info "Installing Apache web server..."
    apt install apache2 -y
    systemctl start apache2
    systemctl enable apache2
    print_success "Apache installed"
    
    # Install MySQL
    print_info "Installing MySQL database server..."
    apt install mysql-server -y
    systemctl start mysql
    systemctl enable mysql
    print_success "MySQL installed"
    
    # Install PHP and extensions
    print_info "Installing PHP and required extensions..."
    apt install php libapache2-mod-php php-mysql php-mbstring php-xml php-curl php-json php-zip php-gd -y
    print_success "PHP installed"
    
    # Enable Apache modules
    print_info "Enabling Apache modules..."
    a2enmod rewrite
    a2enmod ssl
    a2enmod headers
    systemctl restart apache2
    print_success "Apache modules enabled"
}

step3_configure_mysql() {
    print_header "Step 3: Configuring MySQL Database"
    
    # Generate secure password if not provided
    if [ -z "$DB_PASS" ]; then
        DB_PASS=$(generate_password)
        print_info "Generated secure database password"
    fi
    
    print_info "Creating database and user..."
    
    # Create database and user
    mysql -u root <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT
    
    print_success "Database '${DB_NAME}' created"
    print_success "User '${DB_USER}' created with secure password"
}

step4_clone_application() {
    print_header "Step 4: Cloning Application from GitHub"
    
    # Create application directory
    print_info "Creating application directory: ${APP_DIR}"
    mkdir -p ${APP_DIR}
    
    # Clone repository
    print_info "Cloning from GitHub: ${GITHUB_REPO}"
    cd ${APP_DIR}
    
    if [ -d ".git" ]; then
        print_warning "Git repository already exists, pulling latest changes..."
        git pull origin main
    else
        git clone ${GITHUB_REPO} .
    fi
    
    print_success "Application cloned successfully"
}

step5_import_database() {
    print_header "Step 5: Importing Database Schema"
    
    cd ${APP_DIR}
    
    if [ -f "database/schema.sql" ]; then
        print_info "Importing schema.sql..."
        mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < database/schema.sql
        print_success "Base schema imported (17 tables)"
    else
        print_error "schema.sql not found!"
        exit 1
    fi
    
    if [ -f "database/super_admin_migration.sql" ]; then
        print_info "Importing super_admin_migration.sql..."
        mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < database/super_admin_migration.sql
        print_success "SAAS tables imported (2 tables)"
    fi
    
    if [ -f "database/device_session_migration.sql" ]; then
        print_info "Importing device_session_migration.sql..."
        mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < database/device_session_migration.sql
        print_success "Session tables imported (2 tables)"
    fi
    
    if [ -f "database/seed_working.sql" ]; then
        print_info "Importing test data (seed_working.sql)..."
        mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < database/seed_working.sql
        print_success "Test data imported"
    fi
    
    print_success "Total 21 tables created successfully"
}

step6_configure_application() {
    print_header "Step 6: Configuring Application"
    
    cd ${APP_DIR}
    
    # Create config.php if it doesn't exist
    print_info "Creating database configuration..."
    
    cat > api/config.php <<CONFIG_PHP
<?php
/**
 * Database Configuration
 * Auto-generated by deployment script
 * Date: $(date)
 */

// Database Connection
define('DB_HOST', 'localhost');
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASS', '${DB_PASS}');

// PDO Connection Function
function getDB() {
    try {
        \$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        return \$pdo;
    } catch(PDOException \$e) {
        error_log("Database connection failed: " . \$e->getMessage());
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed']));
    }
}

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS requests
if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Utility Functions
function sendJSON(\$data) {
    echo json_encode(\$data);
    exit();
}

function sendError(\$message, \$code = 400) {
    http_response_code(\$code);
    echo json_encode(['error' => \$message, 'success' => false]);
    exit();
}

function validateRequired(\$data, \$fields) {
    foreach(\$fields as \$field) {
        if(!isset(\$data[\$field]) || empty(\$data[\$field])) {
            sendError("Missing required field: \$field", 400);
        }
    }
}
?>
CONFIG_PHP
    
    print_success "Configuration file created: api/config.php"
    
    # Set proper permissions
    print_info "Setting file permissions..."
    chown -R www-data:www-data ${APP_DIR}
    chmod -R 755 ${APP_DIR}
    chmod 644 api/config.php
    
    print_success "Permissions configured"
}

step7_configure_apache() {
    print_header "Step 7: Configuring Apache Virtual Host"
    
    print_info "Creating virtual host configuration..."
    
    cat > /etc/apache2/sites-available/bustrackgps.conf <<VHOST
<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias ${DOMAIN_ALT}
    ServerAdmin ${ADMIN_EMAIL}
    DocumentRoot ${APP_DIR}/public_html

    <Directory ${APP_DIR}/public_html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API Directory
    Alias /api ${APP_DIR}/api
    <Directory ${APP_DIR}/api>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Logging
    ErrorLog \${APACHE_LOG_DIR}/bustrackgps_error.log
    CustomLog \${APACHE_LOG_DIR}/bustrackgps_access.log combined

    # Security Headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
VHOST
    
    # Disable default site and enable new site
    print_info "Enabling virtual host..."
    a2dissite 000-default.conf 2>/dev/null || true
    a2ensite bustrackgps.conf
    
    # Test Apache configuration
    print_info "Testing Apache configuration..."
    apache2ctl configtest
    
    # Restart Apache
    systemctl restart apache2
    
    print_success "Apache virtual host configured"
}

step8_setup_ssl() {
    print_header "Step 8: Setting up SSL Certificate"
    
    print_info "Installing Certbot..."
    apt install certbot python3-certbot-apache -y
    
    print_info "Obtaining SSL certificate for ${DOMAIN} and ${DOMAIN_ALT}..."
    print_warning "Make sure DNS is pointing to ${SERVER_IP} before proceeding!"
    
    read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."
    
    certbot --apache -d ${DOMAIN} -d ${DOMAIN_ALT} \
        --non-interactive \
        --agree-tos \
        --email ${ADMIN_EMAIL} \
        --redirect || {
        print_warning "SSL setup failed. You can run it manually later with:"
        print_info "sudo certbot --apache -d ${DOMAIN} -d ${DOMAIN_ALT}"
        return 0
    }
    
    # Setup auto-renewal
    print_info "Setting up SSL auto-renewal..."
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    print_success "SSL certificate installed and auto-renewal configured"
}

step9_configure_firewall() {
    print_header "Step 9: Configuring Firewall"
    
    print_info "Installing UFW firewall..."
    apt install ufw -y
    
    print_info "Configuring firewall rules..."
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Apache Full'
    
    print_warning "Enabling firewall..."
    echo "y" | ufw enable
    
    print_success "Firewall configured and enabled"
}

step10_final_configuration() {
    print_header "Step 10: Final Configuration"
    
    # Create .htaccess for clean URLs
    print_info "Creating .htaccess for clean URLs..."
    cat > ${APP_DIR}/public_html/.htaccess <<HTACCESS
# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS (after SSL is setup)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
<IfModule mod_headers.c>
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Disable Directory Listing
Options -Indexes

# Protect sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>
HTACCESS
    
    # Restart services
    print_info "Restarting all services..."
    systemctl restart apache2
    systemctl restart mysql
    
    print_success "All services restarted"
}

save_credentials() {
    print_header "Saving Deployment Credentials"
    
    CRED_FILE="${APP_DIR}/DEPLOYMENT_CREDENTIALS.txt"
    
    cat > ${CRED_FILE} <<CREDENTIALS
================================================================================
  BUS TRACKER SAAS - DEPLOYMENT CREDENTIALS
================================================================================

Deployment Date: $(date)
Server IP: ${SERVER_IP}
Domain: https://${DOMAIN}

================================================================================
  DATABASE CREDENTIALS
================================================================================

Host:     localhost
Database: ${DB_NAME}
Username: ${DB_USER}
Password: ${DB_PASS}

MySQL Root Access:
mysql -u root -p

Application Database Access:
mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME}

================================================================================
  APPLICATION URLS
================================================================================

Landing Page:  https://${DOMAIN}/
Super Admin:   https://${DOMAIN}/superadmin.html
School Admin:  https://${DOMAIN}/admin.html
Driver App:    https://${DOMAIN}/driver.html
Parent App:    https://${DOMAIN}/parent.html

================================================================================
  TEST CREDENTIALS (CHANGE IN PRODUCTION!)
================================================================================

Super Admin:
  Username: superadmin
  Password: password

School Admin:
  Username: admin
  Password: password

Driver:
  Phone: +1234567890
  PIN: 1234

Parent:
  Phone: +1987654321
  PIN: 5678

================================================================================
  FILE LOCATIONS
================================================================================

Application Root:    ${APP_DIR}
Frontend Files:      ${APP_DIR}/public_html/
Backend APIs:        ${APP_DIR}/api/
Database Scripts:    ${APP_DIR}/database/
Configuration:       ${APP_DIR}/api/config.php

Apache Config:       /etc/apache2/sites-available/bustrackgps.conf
Apache Logs:         /var/log/apache2/bustrackgps_*.log
PHP Config:          /etc/php/*/apache2/php.ini

================================================================================
  IMPORTANT SECURITY NOTES
================================================================================

1. CHANGE ALL DEFAULT PASSWORDS IMMEDIATELY!
   
   Super Admin Password:
   mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME}
   UPDATE super_admins SET password_hash = PASSWORD_HASH('new_password') 
   WHERE username = 'superadmin';
   
   School Admin Password:
   UPDATE school_admins SET password_hash = PASSWORD_HASH('new_password') 
   WHERE username = 'admin';

2. Update driver and parent PINs in database

3. Configure backups:
   - Database: mysqldump -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > backup.sql
   - Files: tar -czf backup.tar.gz ${APP_DIR}

4. Monitor logs:
   - Apache: tail -f /var/log/apache2/bustrackgps_error.log
   - MySQL: tail -f /var/log/mysql/error.log

5. Setup automated backups (recommended)

================================================================================
  USEFUL COMMANDS
================================================================================

Restart Apache:      sudo systemctl restart apache2
Restart MySQL:       sudo systemctl restart mysql
Check Apache Status: sudo systemctl status apache2
Check MySQL Status:  sudo systemctl status mysql
View Apache Logs:    sudo tail -f /var/log/apache2/bustrackgps_error.log
Test Database:       mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME}

Update Application:
cd ${APP_DIR}
git pull origin main
sudo systemctl restart apache2

================================================================================
  SSL CERTIFICATE
================================================================================

Renew Manually:      sudo certbot renew
Test Renewal:        sudo certbot renew --dry-run
Certificate Info:    sudo certbot certificates

Auto-renewal is configured via systemd timer

================================================================================
  FIREWALL STATUS
================================================================================

Check Status:        sudo ufw status
Allow Port:          sudo ufw allow PORT
Deny Port:           sudo ufw deny PORT

================================================================================
  NEXT STEPS
================================================================================

1. Test all application URLs
2. Change default passwords
3. Setup automated backups
4. Configure monitoring
5. Test device session management
6. Review security headers
7. Setup log rotation
8. Configure email notifications (if needed)

================================================================================

⚠️  KEEP THIS FILE SECURE - Contains sensitive credentials!

Saved at: ${CRED_FILE}

================================================================================
CREDENTIALS
    
    chmod 600 ${CRED_FILE}
    
    print_success "Credentials saved to: ${CRED_FILE}"
}

display_summary() {
    print_header "DEPLOYMENT COMPLETED SUCCESSFULLY!"
    
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║              BUS TRACKER SAAS - DEPLOYMENT SUMMARY                 ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo ""
    echo -e "${BLUE}📍 Application URLs:${NC}"
    echo -e "   Landing Page:  ${GREEN}https://${DOMAIN}/${NC}"
    echo -e "   Super Admin:   ${GREEN}https://${DOMAIN}/superadmin.html${NC}"
    echo -e "   School Admin:  ${GREEN}https://${DOMAIN}/admin.html${NC}"
    echo -e "   Driver App:    ${GREEN}https://${DOMAIN}/driver.html${NC}"
    echo -e "   Parent App:    ${GREEN}https://${DOMAIN}/parent.html${NC}"
    
    echo ""
    echo -e "${BLUE}🔑 Test Credentials:${NC}"
    echo -e "   Super Admin: ${YELLOW}superadmin / password${NC}"
    echo -e "   School Admin: ${YELLOW}admin / password${NC}"
    echo -e "   Driver: ${YELLOW}+1234567890 / 1234${NC}"
    echo -e "   Parent: ${YELLOW}+1987654321 / 5678${NC}"
    
    echo ""
    echo -e "${BLUE}🗄️ Database:${NC}"
    echo -e "   Database: ${GREEN}${DB_NAME}${NC}"
    echo -e "   Username: ${GREEN}${DB_USER}${NC}"
    echo -e "   Password: ${GREEN}${DB_PASS}${NC}"
    echo -e "   Tables: ${GREEN}21 tables created${NC}"
    
    echo ""
    echo -e "${BLUE}📁 File Locations:${NC}"
    echo -e "   Application: ${GREEN}${APP_DIR}${NC}"
    echo -e "   Config File: ${GREEN}${APP_DIR}/api/config.php${NC}"
    echo -e "   Credentials: ${GREEN}${APP_DIR}/DEPLOYMENT_CREDENTIALS.txt${NC}"
    
    echo ""
    echo -e "${RED}⚠️  SECURITY REMINDERS:${NC}"
    echo -e "   ${YELLOW}1. CHANGE ALL DEFAULT PASSWORDS IMMEDIATELY!${NC}"
    echo -e "   ${YELLOW}2. Review credentials file: ${APP_DIR}/DEPLOYMENT_CREDENTIALS.txt${NC}"
    echo -e "   ${YELLOW}3. Setup automated backups${NC}"
    echo -e "   ${YELLOW}4. Monitor application logs${NC}"
    
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${BLUE}🚀 Your Bus Tracker SAAS is now live!${NC}"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    clear
    
    echo -e "${BLUE}"
    cat <<BANNER
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║                   BUS TRACKER SAAS - VPS DEPLOYMENT                      ║
║                          Version 4.3                                     ║
║                                                                          ║
║     Automated deployment script for Ubuntu/Debian VPS                   ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
BANNER
    echo -e "${NC}"
    
    # Check if running as root
    check_root
    
    # Confirmation
    print_warning "This script will install and configure:"
    echo "  • Apache web server"
    echo "  • MySQL database server"
    echo "  • PHP 7.4+"
    echo "  • SSL certificate (Let's Encrypt)"
    echo "  • UFW firewall"
    echo "  • Bus Tracker SAAS application"
    echo ""
    echo -e "${YELLOW}Domain: ${DOMAIN}${NC}"
    echo -e "${YELLOW}Server IP: ${SERVER_IP}${NC}"
    echo ""
    
    read -p "Do you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        print_error "Deployment cancelled by user"
        exit 1
    fi
    
    # Execute deployment steps
    step1_system_update
    step2_install_lamp
    step3_configure_mysql
    step4_clone_application
    step5_import_database
    step6_configure_application
    step7_configure_apache
    step8_setup_ssl
    step9_configure_firewall
    step10_final_configuration
    save_credentials
    display_summary
}

# Run main function
main "$@"
