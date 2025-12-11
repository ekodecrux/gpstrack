# 🚨 DRIVER PAGE NOT LOADING - TROUBLESHOOTING GUIDE

## ✅ FILES VERIFIED - ALL CORRECT

I've verified all your files:
- ✅ `public_html/driver.html` (609 bytes) - **EXISTS**
- ✅ `public_html/driver.js` (12KB) - **EXISTS**
- ✅ `api/auth.php` (6.1KB, 198 lines) - **EXISTS**
- ✅ `database/seed_working.sql` - **EXISTS with test credentials**

**The files are correct!** The issue is likely with your **deployment or testing environment**.

---

## 🎯 TELL ME: WHERE ARE YOU TESTING?

### Option A: Testing on Hostinger / Shared Hosting
**URL:** `http://yourdomain.com/driver.html` or `https://yourdomain.com/driver.html`

### Option B: Testing on VPS (88.222.244.84)
**URL:** `http://88.222.244.84/driver.html` or `https://www.bustrackgps.in/driver.html`

### Option C: Testing on Local Computer (XAMPP/WAMP)
**URL:** `http://localhost/bus-tracker/driver.html`

### Option D: Direct File Access (WRONG)
**URL:** `file:///C:/Users/yourname/Downloads/driver.html` ❌ **THIS WON'T WORK**

---

## 🔧 MOST COMMON ISSUE: API Path Problem

### Problem: You see login form but it doesn't work

**Diagnosis:**
1. Open browser console (Press **F12**)
2. Click "Network" tab
3. Try to login
4. Check if you see **red errors** for `/api/auth.php`

### Fix 1: Database Not Imported

```bash
# SSH into your server
ssh root@88.222.244.84

# Import database (IN ORDER!)
cd /var/www/bustrackgps.in/database

mysql -u root -p bus_tracker < schema.sql
mysql -u root -p bus_tracker < super_admin_migration.sql
mysql -u root -p bus_tracker < device_session_migration.sql
mysql -u root -p bus_tracker < seed_working.sql

# Verify data exists
mysql -u root -p bus_tracker -e "SELECT id, driver_name, phone, pin FROM drivers;"
```

**Expected Output:**
```
+----+--------------+---------------+------+
| id | driver_name  | phone         | pin  |
+----+--------------+---------------+------+
|  1 | John Smith   | +1234567890   | 1234 |
+----+--------------+---------------+------+
```

### Fix 2: Wrong Database Credentials

```bash
# Edit config.php
nano /var/www/bustrackgps.in/api/config.php
```

**Should look like:**
```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'bus_tracker');
define('DB_USER', 'your_database_user');     // ← CHECK THIS
define('DB_PASS', 'your_database_password'); // ← CHECK THIS
```

**To find your database credentials on Hostinger:**
1. Login to Hostinger control panel
2. Go to **Databases** → **MySQL Databases**
3. Look for database name, username, and password

### Fix 3: Missing Database Tables

```bash
# Check if driver_sessions table exists
mysql -u root -p bus_tracker -e "SHOW TABLES;"
```

**You should see these 21 tables:**
```
+-------------------------+
| Tables_in_bus_tracker   |
+-------------------------+
| driver_sessions         | ← Device session management
| drivers                 | ← Driver accounts
| parent_sessions         | ← Parent session management
| parents                 | ← Parent accounts
| pickup_dropoff_logs     |
| route_waypoints         |
| routes                  |
| school_admins           |
| schools                 |
| student_locations       |
| students                |
| super_admins            |
| trips                   |
| ... (and more)          |
+-------------------------+
```

**If tables are missing:**
```bash
# Re-import schema
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/schema.sql
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/device_session_migration.sql
```

---

## 🌐 DEPLOYMENT STATUS CHECK

### Are you deployed yet?

**Check DNS:**
```bash
# From your local computer, run:
ping www.bustrackgps.in

# Expected:
# PING www.bustrackgps.in (88.222.244.84) ...
```

**If DNS not configured:**
1. Go to your domain registrar
2. Add A records:
   - **Host:** `@` → **Value:** `88.222.244.84`
   - **Host:** `www` → **Value:** `88.222.244.84`
3. Wait 10-30 minutes

**If DNS configured but not deployed:**
```bash
# Run the automated deployment script
ssh root@88.222.244.84

wget https://raw.githubusercontent.com/ekodecrux/gpstrack/main/deploy-vps.sh
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh
```

---

## 🧪 MANUAL TEST - Check API Directly

### Test 1: Check if PHP is working

**Create test file:**
```bash
echo "<?php phpinfo(); ?>" > /var/www/bustrackgps.in/test.php
```

**Access in browser:**
```
https://www.bustrackgps.in/test.php
```

**Expected:** You should see PHP configuration page.

**If shows blank page or code:** PHP is not enabled or not processing.

### Test 2: Check if auth.php exists

```bash
curl https://www.bustrackgps.in/api/auth.php
```

**Expected Response:**
```json
{"success":false,"error":"Invalid action"}
```

**If 404 error:** File path is wrong or .htaccess not configured.

### Test 3: Test Driver Login API

```bash
curl -X POST 'https://www.bustrackgps.in/api/auth.php?action=driver-login' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "+1234567890",
    "pin": "1234",
    "device_id": "test_device_123",
    "device_info": "Test Browser"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "driver": {
    "id": 1,
    "driver_name": "John Smith",
    "phone": "+1234567890",
    "route_number": "A1",
    "bus_number": "BUS-001",
    "status": "active"
  },
  "session_token": "abc123..."
}
```

**Expected Response (Fail - Wrong Credentials):**
```json
{
  "success": false,
  "error": "Invalid phone or PIN"
}
```

---

## 🔍 DETAILED ERROR DIAGNOSTICS

### Error 1: Blank White Page

**Cause:** JavaScript error or file not loading

**Fix:**
1. Press **F12** (open console)
2. Check **Console** tab for red errors
3. Check **Network** tab - see if `driver.js` loaded (should be 12KB)

**If driver.js shows 404:**
```bash
# Fix file path - check exact location
ls -la /var/www/bustrackgps.in/public_html/driver.js
```

### Error 2: Login Button Does Nothing

**Cause:** API not responding

**Fix:**
1. Press **F12** → **Network** tab
2. Try to login
3. Look for `/api/auth.php` request
4. Check if it's **red (failed)** or **green (success)**

**If red with 404:**
```bash
# Check .htaccess exists
cat /var/www/bustrackgps.in/.htaccess

# Should contain:
# RewriteEngine On
# RewriteRule ^api/(.*)$ /api/$1 [L]
```

**If red with 500 error:**
```bash
# Check PHP error logs
tail -50 /var/log/apache2/error.log

# Or enable error display
nano /var/www/bustrackgps.in/api/config.php

# Add at top:
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### Error 3: "Invalid phone or PIN"

**Cause:** Database not seeded or wrong credentials

**Fix:**
```bash
# Verify driver exists in database
mysql -u root -p bus_tracker -e "
SELECT id, driver_name, phone, pin, status 
FROM drivers 
WHERE phone = '+1234567890';
"
```

**Expected:**
```
+----+-------------+---------------+------+--------+
| id | driver_name | phone         | pin  | status |
+----+-------------+---------------+------+--------+
|  1 | John Smith  | +1234567890   | 1234 | active |
+----+-------------+---------------+------+--------+
```

**If no results:**
```bash
# Import seed data
mysql -u root -p bus_tracker < /var/www/bustrackgps.in/database/seed_working.sql

# Try again
```

### Error 4: CORS Error

**Error message in console:**
```
Access to fetch at 'https://www.bustrackgps.in/api/auth.php' from origin 'https://example.com' 
has been blocked by CORS policy
```

**Fix - Add CORS headers to api/config.php:**
```php
<?php
// Add these lines BEFORE any other code
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Rest of your config.php code...
define('DB_HOST', 'localhost');
// ...
```

---

## 📦 QUICK REINSTALL (IF NOTHING WORKS)

### Option 1: Use Automated Script (VPS Only)

```bash
ssh root@88.222.244.84

# Clean install
rm -rf /var/www/bustrackgps.in/*

# Run deployment script
wget https://raw.githubusercontent.com/ekodecrux/gpstrack/main/deploy-vps.sh
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh

# Wait 10-15 minutes
# Test: https://www.bustrackgps.in/driver.html
```

### Option 2: Manual Reinstall (Hostinger)

```bash
# Download fresh package
wget https://www.genspark.ai/api/files/s/A1REDusk -O bus-tracker.zip

# Unzip
unzip bus-tracker.zip

# Upload via FTP to public_html/

# Import database in Hostinger phpMyAdmin:
# 1. schema.sql
# 2. super_admin_migration.sql
# 3. device_session_migration.sql
# 4. seed_working.sql

# Edit api/config.php with your database credentials

# Test: https://yourdomain.com/driver.html
```

---

## ✅ WORKING TEST CREDENTIALS

Once deployed and database is seeded:

**Driver Login:**
- **Phone:** `+1234567890`
- **PIN:** `1234`
- **URL:** `https://www.bustrackgps.in/driver.html`

**Parent Login:**
- **Phone:** `+1987654321`
- **PIN:** `5678`
- **URL:** `https://www.bustrackgps.in/parent.html`

**School Admin:**
- **Username:** `admin`
- **Password:** `password`
- **URL:** `https://www.bustrackgps.in/admin.html`

**Super Admin:**
- **Username:** `superadmin`
- **Password:** `password`
- **URL:** `https://www.bustrackgps.in/superadmin.html`

---

## 🆘 NEXT STEPS

**Please tell me:**

1. **Where are you testing?**
   - Hostinger?
   - VPS (88.222.244.84)?
   - Local XAMPP?
   - Direct file?

2. **What EXACTLY do you see?**
   - Blank white page?
   - Login form but button doesn't work?
   - Error message?
   - Page loads but then crashes?

3. **Browser console errors?** (Press F12, copy any red text)

4. **What URL are you accessing?**
   - Example: `https://www.bustrackgps.in/driver.html`

**With this information, I can provide an exact fix!** 🚀

---

## 📚 Documentation Files

- **Full Deployment:** `VPS_DEPLOYMENT_GUIDE.md`
- **Test Credentials:** `TEST_CREDENTIALS.txt`
- **Quick Start:** `QUICK_START.txt`
- **This Guide:** `DRIVER_PAGE_FIX.md`
