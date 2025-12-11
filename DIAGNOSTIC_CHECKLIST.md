# 🔍 Bus Driver Page Troubleshooting Guide

## Where Are You Testing?

### ✅ Option 1: Testing on Hostinger / VPS (RECOMMENDED)
If you've deployed to **www.bustrackgps.in** or Hostinger:

**URLs to Test:**
- Landing Page: `https://www.bustrackgps.in/` or `http://yourdomain.com/`
- Driver Login: `https://www.bustrackgps.in/driver.html`
- Parent Login: `https://www.bustrackgps.in/parent.html`
- Admin Login: `https://www.bustrackgps.in/admin.html`
- Super Admin: `https://www.bustrackgps.in/superadmin.html`

**Common Issues:**

#### 🚫 Issue 1: "driver.html" Shows Blank Page
**Problem:** API calls are failing (Cannot connect to `/api/auth.php`)

**Solution 1 - Check API Path:**
```bash
# SSH into your server
ssh root@88.222.244.84

# Verify files exist
ls -la /var/www/bustrackgps.in/api/
ls -la /var/www/bustrackgps.in/public_html/

# Check Apache configuration
cat /etc/apache2/sites-available/bustrackgps.in.conf
```

**Solution 2 - Fix .htaccess (if API returns 404):**
```bash
# Create .htaccess in document root
cat > /var/www/bustrackgps.in/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^api/(.*)$ /api/$1 [L]
</IfModule>
EOF
```

**Solution 3 - Check Database Connection:**
```bash
# Test database connection
mysql -u bustracker_user -p bus_tracker

# If database doesn't exist, import SQL files
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/schema.sql
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/super_admin_migration.sql
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/device_session_migration.sql
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/seed_working.sql
```

**Solution 4 - Check PHP Errors:**
```bash
# Enable error display temporarily
nano /var/www/bustrackgps.in/api/config.php

# Add these lines at the top:
error_reporting(E_ALL);
ini_set('display_errors', 1);

# Check Apache error logs
tail -f /var/log/apache2/error.log
```

---

#### 🚫 Issue 2: "Login fails with Invalid Credentials"
**Problem:** Database not seeded or passwords incorrect

**Solution:**
```bash
# Import working seed data
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/seed_working.sql

# Verify driver exists
mysql -u root -p bus_tracker -e "SELECT id, driver_name, phone, pin FROM drivers;"
```

**Test Credentials:**
- Phone: `+1234567890`
- PIN: `1234`

---

#### 🚫 Issue 3: "CORS Error" or "Blocked by CORS policy"
**Problem:** Frontend and backend on different domains

**Solution - Update api/config.php:**
```php
<?php
// Add CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>
```

---

### ✅ Option 2: Testing Locally (XAMPP/WAMP/MAMP)

If testing on your local machine:

**Steps:**
1. **Install XAMPP/WAMP** (PHP 7.4+ required)

2. **Copy Files:**
```bash
# Copy to htdocs (XAMPP) or www (WAMP)
cp -r /path/to/hostinger-deploy/* C:/xampp/htdocs/bus-tracker/
```

3. **Create Database:**
```sql
CREATE DATABASE bus_tracker;
USE bus_tracker;

-- Import SQL files in order:
SOURCE C:/xampp/htdocs/bus-tracker/database/schema.sql;
SOURCE C:/xampp/htdocs/bus-tracker/database/super_admin_migration.sql;
SOURCE C:/xampp/htdocs/bus-tracker/database/device_session_migration.sql;
SOURCE C:/xampp/htdocs/bus-tracker/database/seed_working.sql;
```

4. **Configure Database:**
Edit `api/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'bus_tracker');
define('DB_USER', 'root');
define('DB_PASS', ''); // Empty for XAMPP default
```

5. **Test URLs:**
- Landing Page: `http://localhost/bus-tracker/public_html/`
- Driver Login: `http://localhost/bus-tracker/public_html/driver.html`

**Fix API Path for Local Testing:**
Edit `public_html/driver.js`, line 1:
```javascript
// Change from:
const API_BASE = '/api';

// To:
const API_BASE = '/bus-tracker/api';
```

---

### ✅ Option 3: Testing in This Sandbox (NOT POSSIBLE)

**PHP is not available in this sandbox environment.** Cannot run PHP applications here.

---

## 🔬 Browser Developer Console Check

**Open Browser Console (F12) on driver.html and check for errors:**

### Common Console Errors:

**Error 1: `Failed to fetch` or `net::ERR_CONNECTION_REFUSED`**
- **Cause:** API server not running
- **Fix:** Start Apache/PHP server

**Error 2: `404 Not Found: /api/auth.php`**
- **Cause:** Incorrect API path or missing .htaccess
- **Fix:** Check file paths and Apache rewrite rules

**Error 3: `Uncaught SyntaxError: Unexpected token < in JSON`**
- **Cause:** PHP returning HTML error instead of JSON
- **Fix:** Check PHP error logs, enable error display

**Error 4: `CORS policy: No 'Access-Control-Allow-Origin' header`**
- **Cause:** CORS not configured in PHP
- **Fix:** Add CORS headers to api/config.php

---

## ✅ Quick Diagnostic Test

**Test 1: Check if HTML loads**
```bash
# Open driver.html in browser
# If you see login form → HTML is working ✅
# If blank page → Check browser console
```

**Test 2: Check if JavaScript loads**
```javascript
// Open browser console (F12)
// Type:
console.log('API_BASE:', typeof API_BASE !== 'undefined' ? API_BASE : 'NOT LOADED');

// If shows '/api' → JavaScript loaded ✅
// If 'NOT LOADED' → driver.js not loading
```

**Test 3: Check API manually**
```bash
# Test API directly (replace with your domain)
curl -X POST https://www.bustrackgps.in/api/auth.php?action=driver-login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","pin":"1234","device_id":"test123"}'

# Expected response:
# {"success":true,"driver":{...},"session_token":"..."}
```

---

## 📱 Mobile Testing

If testing on mobile device:

1. **Access via IP address** (not localhost)
   - Find server IP: `hostname -I`
   - Access: `http://YOUR_SERVER_IP/driver.html`

2. **Enable mobile debugging:**
   - Chrome: chrome://inspect
   - Safari: Settings → Safari → Advanced → Web Inspector

---

## 🆘 Still Not Working?

**Provide these details:**

1. **Where are you testing?**
   - [ ] Deployed on Hostinger
   - [ ] Deployed on VPS (88.222.244.84)
   - [ ] Local XAMPP/WAMP
   - [ ] Other: ___________

2. **What do you see?**
   - [ ] Completely blank page
   - [ ] Login form shows but can't login
   - [ ] Error message: ___________
   - [ ] Page loads but button doesn't work

3. **Browser console errors?** (Press F12)
   - Copy and paste any red errors

4. **URL you're accessing:**
   - Example: `https://www.bustrackgps.in/driver.html`

---

## 📚 Quick Links

- **Test Credentials:** See `TEST_CREDENTIALS.txt`
- **Deployment Guide:** See `VPS_DEPLOYMENT_GUIDE.md`
- **Complete Setup:** See `COMPLETE_DEPLOYMENT_GUIDE.md`
- **GitHub Repo:** https://github.com/ekodecrux/gpstrack

---

**Next Step:** Tell me WHERE you're testing and WHAT you see, and I'll help you fix it! 🚀
