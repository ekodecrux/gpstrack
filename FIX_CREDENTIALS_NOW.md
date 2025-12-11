# 🚨 CREDENTIALS NOT WORKING - IMMEDIATE FIX

## ⚠️ MOST COMMON ISSUE: Database Not Imported or Wrong Config

Your driver page is loading, but login fails because:
1. **Database tables don't exist yet** (not imported)
2. **Database credentials wrong** in `api/config.php`
3. **Test data not seeded** (drivers don't exist in database)

---

## 🔧 SOLUTION 1: HOSTINGER / SHARED HOSTING

### Step 1: Check if Database Exists

1. Login to **Hostinger Control Panel**
2. Go to **Databases** → **MySQL Databases**
3. Check if database `bus_tracker` exists
   - ✅ If exists → Go to Step 2
   - ❌ If not exists → Create it now:
     - Database Name: `bus_tracker`
     - Click "Create Database"

### Step 2: Import Database Tables

1. In Hostinger panel, click **phpMyAdmin**
2. Select `bus_tracker` database from left sidebar
3. Click **Import** tab
4. Import these 4 SQL files **IN ORDER**:

   **File 1: schema.sql** (creates 17 base tables)
   - Click "Choose File" → select `schema.sql`
   - Click "Go" at bottom
   - ✅ Success message should appear

   **File 2: super_admin_migration.sql** (adds super admin features)
   - Click "Choose File" → select `super_admin_migration.sql`
   - Click "Go"
   - ✅ Success

   **File 3: device_session_migration.sql** (adds session management)
   - Click "Choose File" → select `device_session_migration.sql`
   - Click "Go"
   - ✅ Success

   **File 4: seed_working.sql** (adds test data with working credentials)
   - Click "Choose File" → select `seed_working.sql`
   - Click "Go"
   - ✅ Success: "4 rows inserted" for drivers, etc.

### Step 3: Verify Test Data Exists

In phpMyAdmin, click **SQL** tab and run:

```sql
SELECT id, driver_name, phone, pin, status FROM drivers;
```

**Expected Result:**
```
+----+--------------+---------------+------+--------+
| id | driver_name  | phone         | pin  | status |
+----+--------------+---------------+------+--------+
|  1 | John Driver  | +1234567890   | 1234 | active |
|  2 | Mike Driver  | +9876543210   | 5678 | active |
+----+--------------+---------------+------+--------+
```

✅ If you see this → Database is ready!
❌ If "Table doesn't exist" → Go back to Step 2

### Step 4: Update Database Credentials

1. In Hostinger File Manager, open: `api/config.php`
2. Find your database credentials in Hostinger:
   - Go to **Databases** → **MySQL Databases**
   - Look for: Database Name, Username, Password
3. Edit `api/config.php`:

```php
<?php
define('DB_HOST', 'localhost');           // Usually localhost
define('DB_NAME', 'your_actual_db_name'); // Example: u123456_bus_tracker
define('DB_USER', 'your_db_username');    // Example: u123456_admin
define('DB_PASS', 'your_db_password');    // The password from Hostinger
```

**Save the file!**

### Step 5: Test Login

Go to: `https://yourdomain.com/driver.html`

**Test Credentials:**
- Phone: `+1234567890`
- PIN: `1234`

✅ Should login successfully!

---

## 🔧 SOLUTION 2: VPS (88.222.244.84) - AUTOMATED FIX

If you're on VPS, use the automated script:

```bash
# SSH into VPS
ssh root@88.222.244.84

# Run automated deployment (fixes everything)
wget https://raw.githubusercontent.com/ekodecrux/gpstrack/main/deploy-vps.sh
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh

# Wait 10-15 minutes
# Credentials will be saved to: /var/www/bustrackgps.in/DEPLOYMENT_CREDENTIALS.txt
```

**Test URL:** `https://www.bustrackgps.in/driver.html`

---

## 🔧 SOLUTION 3: LOCAL XAMPP - STEP BY STEP

### Step 1: Start XAMPP
- Start **Apache** and **MySQL**

### Step 2: Create Database
1. Open: `http://localhost/phpmyadmin`
2. Click "New" in left sidebar
3. Database name: `bus_tracker`
4. Collation: `utf8mb4_general_ci`
5. Click "Create"

### Step 3: Import SQL Files
1. Click `bus_tracker` database in left sidebar
2. Click **Import** tab
3. Import these files **IN ORDER**:
   - `schema.sql`
   - `super_admin_migration.sql`
   - `device_session_migration.sql`
   - `seed_working.sql`

### Step 4: Update config.php
Edit: `C:\xampp\htdocs\bus-tracker\api\config.php`

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'bus_tracker');
define('DB_USER', 'root');
define('DB_PASS', ''); // Empty for XAMPP default
```

### Step 5: Fix API Path for Local
Edit: `C:\xampp\htdocs\bus-tracker\public_html\driver.js`

**Line 1, change from:**
```javascript
const API_BASE = '/api';
```

**To:**
```javascript
const API_BASE = '/bus-tracker/api';
```

### Step 6: Test
Open: `http://localhost/bus-tracker/public_html/driver.html`

Login with:
- Phone: `+1234567890`
- PIN: `1234`

---

## 🧪 DIAGNOSTIC: Check What's Wrong

### Test 1: Check if Database Has Tables

**For Hostinger/VPS:**
```bash
mysql -u your_db_user -p bus_tracker -e "SHOW TABLES;"
```

**For XAMPP:** Open phpMyAdmin, select `bus_tracker`, check if you see 21 tables.

**Expected Tables:**
```
driver_sessions
drivers
parent_sessions
parents
pickup_dropoff_logs
route_waypoints
routes
school_admins
schools
student_locations
students
subscription_plans
super_admins
trips
(and more... should be 21 total)
```

### Test 2: Check if Drivers Exist

```sql
SELECT * FROM drivers WHERE phone = '+1234567890';
```

**Expected:** Should return 1 row with driver "John Driver"

**If empty:** Run `seed_working.sql` again

### Test 3: Check Database Connection

Create test file: `api/test_db.php`

```php
<?php
require_once 'config.php';

try {
    $db = getDB();
    echo json_encode(['success' => true, 'message' => 'Database connected!']);
} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
```

Access: `https://yourdomain.com/api/test_db.php`

**Expected:** `{"success":true,"message":"Database connected!"}`

### Test 4: Test Driver Login API Directly

```bash
curl -X POST 'https://yourdomain.com/api/auth.php?action=driver-login' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "+1234567890",
    "pin": "1234",
    "device_id": "test123",
    "device_info": "Test Browser"
  }'
```

**Expected (Success):**
```json
{
  "success": true,
  "driver": {
    "id": 1,
    "driver_name": "John Driver",
    "phone": "+1234567890",
    ...
  },
  "session_token": "abc123..."
}
```

**If you get error:**
- `"Invalid phone or PIN"` → Database not seeded (run seed_working.sql)
- `"Database connection failed"` → Wrong credentials in config.php
- `404 Not Found` → File path wrong or not uploaded

---

## ✅ COMPLETE TEST CREDENTIALS

After importing `seed_working.sql`:

### Driver App (`/driver.html`)
```
Driver 1:
Phone: +1234567890
PIN: 1234
Name: John Driver
Route: R001 (Morning Route)
Bus: BUS-101

Driver 2:
Phone: +9876543210
PIN: 5678
Name: Mike Driver
Route: R002 (Afternoon Route)
Bus: BUS-102
```

### Parent App (`/parent.html`)
```
Parent 1:
Phone: +1987654321
PIN: 5678
Name: Mary Parent
Children: John Smith, Emma Smith

Parent 2:
Phone: +1987654322
PIN: 1234
Name: Tom Parent
Children: Sarah Johnson, Tommy Johnson
```

### School Admin (`/admin.html`)
```
Username: admin
Password: password
School: Demo Public School
```

### Super Admin (`/superadmin.html`)
```
Username: superadmin
Password: password
Role: SAAS Platform Admin
```

---

## 🔍 BROWSER CONSOLE DEBUGGING

1. Open driver.html
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Try to login
5. Look for errors:

**Error: "Failed to fetch"**
→ API server not running or wrong URL

**Error: "401 Unauthorized" or "Invalid phone or PIN"**
→ Database not seeded or credentials wrong in database

**Error: "500 Internal Server Error"**
→ PHP error, check Apache logs:
```bash
tail -f /var/log/apache2/error.log
```

**Error: "CORS policy blocked"**
→ CORS headers missing in config.php (but they're already there)

---

## 📦 QUICK REINSTALL (If Nothing Works)

### Download Fresh Package
```bash
wget https://www.genspark.ai/api/files/s/A1REDusk -O bus-tracker.zip
unzip bus-tracker.zip
```

### Upload to Hostinger
1. Delete old files
2. Upload new files via FTP/File Manager
3. Import database (4 SQL files)
4. Edit api/config.php
5. Test

---

## 🆘 STILL NOT WORKING?

**Tell me EXACTLY:**

1. **Where are you testing?**
   □ Hostinger (Domain: _________)
   □ VPS 88.222.244.84
   □ Local XAMPP
   □ Other: __________

2. **Did you import the database?**
   □ Yes, all 4 SQL files imported
   □ No, not yet
   □ Got error when importing: __________

3. **What happens when you try to login?**
   □ Nothing happens (button doesn't work)
   □ Error message: "__________"
   □ Page reloads but stays on login
   □ Other: __________

4. **Browser Console Errors? (F12)**
   Copy/paste red errors here:
   
   

5. **Can you access phpMyAdmin?**
   □ Yes, I can see database tables
   □ Yes, but database is empty (no tables)
   □ No, don't have access
   □ Don't know how

---

**Reply with these 5 answers and I'll give you the EXACT fix!** 🚀

---

## 📞 Quick Support Links

- GitHub: https://github.com/ekodecrux/gpstrack
- Download: https://www.genspark.ai/api/files/s/A1REDusk
- VPS Script: https://raw.githubusercontent.com/ekodecrux/gpstrack/main/deploy-vps.sh
