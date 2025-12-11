# 📱 Device Session Management - Implementation Guide

## Overview

Driver app now includes **strict device restriction** with session management. Only **ONE active session per driver** is allowed.

---

## 🔒 How It Works

### **Scenario 1: Driver Login (No Conflicts)**
1. Driver enters phone + PIN
2. System checks for active sessions
3. No active session found → Login successful
4. Session created for this device

### **Scenario 2: Already Logged In on Another Device**
1. Driver tries to login on Device B
2. System detects active session on Device A
3. Shows warning dialog:
   ```
   ⚠️ Already Logged In
   
   Your account is active on another device
   Last login: Dec 10, 2025 2:30 PM
   Device: Chrome on Windows
   
   [Terminate Other Session & Login Here]
   [Cancel]
   ```
4. If driver clicks "Terminate" → Device A session ends, Device B logs in
5. If driver clicks "Cancel" → Returns to login screen

---

## 🗄️ Database Changes

### **New Migration File**
```sql
database/device_session_migration.sql
```

### **What It Adds:**

**1. Fields to `drivers` table:**
- `current_device_id` - Unique device identifier
- `current_session_token` - Active session token
- `last_login_ip` - IP address of last login
- `last_login_at` - Timestamp of last login
- `device_info` - Browser/device information

**2. New `driver_sessions` table:**
```sql
CREATE TABLE driver_sessions (
  id INT PRIMARY KEY,
  driver_id INT,
  session_token VARCHAR(255) UNIQUE,
  device_id VARCHAR(255),
  device_info TEXT,
  ip_address VARCHAR(50),
  login_at TIMESTAMP,
  logout_at TIMESTAMP,
  is_active TINYINT(1),
  terminated_by ENUM('driver', 'system', 'new_login')
);
```

**3. New `parent_sessions` table** (for consistency)

---

## 🚀 Deployment Steps

### **Step 1: Backup Database**
```bash
# In Hostinger phpMyAdmin
Export → bus_tracker database → Download
```

### **Step 2: Run Migration**
```sql
-- In phpMyAdmin, run this file:
database/device_session_migration.sql
```

### **Step 3: Verify Tables**
Check that these exist:
- ✅ `drivers` (with new columns)
- ✅ `driver_sessions` (new table)
- ✅ `parent_sessions` (new table)

### **Step 4: Upload Updated Files**
Upload these files to Hostinger:
- `api/auth.php` (updated)
- `public_html/driver.js` (updated)

### **Step 5: Test**
1. Login as driver on Device A
2. Try login same driver on Device B
3. Should see "Already logged in" dialog
4. Click "Terminate & Login"
5. Device A session ends, Device B logs in

---

## 🔧 API Endpoints

### **1. Driver Login**
```
POST /api/auth.php?action=driver-login

Body:
{
  "phone": "+1234567890",
  "pin": "1234",
  "device_id": "dev_abc123...",
  "device_info": "{\"userAgent\":\"...\",\"platform\":\"...\"}"
}

Response (Success):
{
  "success": true,
  "driver": {...},
  "session_token": "abc123..."
}

Response (Already Logged In):
{
  "success": false,
  "error": "already_logged_in",
  "message": "You are already logged in on another device",
  "session_info": {
    "device_info": "Chrome on Windows",
    "login_time": "2025-12-10 14:30:00",
    "current_device": "dev_xyz789"
  },
  "driver_id": 1
}
```

### **2. Terminate Session**
```
POST /api/auth.php?action=terminate-session

Body:
{
  "driver_id": 1,
  "phone": "+1234567890",
  "pin": "1234",
  "device_id": "dev_abc123...",
  "device_info": "{...}"
}

Response:
{
  "success": true,
  "driver": {...},
  "session_token": "new_token..."
}
```

### **3. Driver Logout**
```
POST /api/auth.php?action=driver-logout

Body:
{
  "session_token": "abc123..."
}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 💻 Frontend Implementation

### **Device ID Generation**
```javascript
function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('device_id', id);
  }
  return id;
}
```

### **Device Info Collection**
```javascript
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`
  };
}
```

### **Session Conflict Dialog**
Shows when driver tries to login on new device:
- Device info from active session
- Option to terminate other session
- Option to cancel and keep existing session

---

## 🔍 Monitoring Sessions

### **View Active Sessions (SQL)**
```sql
SELECT 
  ds.*, 
  d.driver_name, 
  d.phone,
  TIMESTAMPDIFF(MINUTE, ds.login_at, NOW()) as minutes_active
FROM driver_sessions ds
JOIN drivers d ON ds.driver_id = d.id
WHERE ds.is_active = 1
ORDER BY ds.login_at DESC;
```

### **Manually Terminate Session (SQL)**
```sql
UPDATE driver_sessions 
SET is_active = 0, 
    logout_at = NOW(), 
    terminated_by = 'system'
WHERE driver_id = 1 AND is_active = 1;
```

---

## 🔒 Security Features

### **1. Device Fingerprinting**
- Unique device ID stored in localStorage
- Cannot easily spoof across different devices

### **2. Session Tokens**
- 64-character random tokens
- Stored in database
- Validated on sensitive operations

### **3. Session Tracking**
- Records login time, IP, device info
- Tracks termination reason
- Audit trail for security

### **4. Auto-Cleanup**
Optional: Add cron job to clean old sessions:
```sql
UPDATE driver_sessions 
SET is_active = 0, 
    terminated_by = 'system'
WHERE is_active = 1 
  AND TIMESTAMPDIFF(HOUR, login_at, NOW()) > 24;
```

---

## 🧪 Testing Scenarios

### **Test 1: Normal Login**
1. Clear browser data
2. Login as driver
3. ✅ Should login successfully

### **Test 2: Session Conflict**
1. Login as driver on Browser A
2. Open Browser B (or incognito)
3. Try login same driver
4. ✅ Should show conflict dialog

### **Test 3: Terminate Session**
1. From Browser B conflict dialog
2. Click "Terminate & Login"
3. ✅ Browser A gets logged out
4. ✅ Browser B logs in successfully

### **Test 4: Normal Logout**
1. Login as driver
2. Click Logout button
3. ✅ Session marked inactive
4. ✅ Can login again

---

## 📊 Database Schema

### **Drivers Table (Updated)**
```sql
ALTER TABLE drivers 
ADD COLUMN current_device_id VARCHAR(255),
ADD COLUMN current_session_token VARCHAR(255),
ADD COLUMN last_login_ip VARCHAR(50),
ADD COLUMN last_login_at TIMESTAMP NULL,
ADD COLUMN device_info TEXT;
```

### **Driver Sessions Table (New)**
```sql
CREATE TABLE driver_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(50),
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP NULL,
  is_active TINYINT(1) DEFAULT 1,
  terminated_by ENUM('driver', 'system', 'new_login') NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);
```

---

## 🆘 Troubleshooting

### **Issue: Can't login on any device**
**Solution:**
```sql
UPDATE driver_sessions 
SET is_active = 0 
WHERE driver_id = YOUR_DRIVER_ID;
```

### **Issue: Session conflict not detected**
**Checklist:**
- ✅ Migration run successfully?
- ✅ `driver_sessions` table exists?
- ✅ Using updated `auth.php`?
- ✅ Using updated `driver.js`?

### **Issue: Device ID not persistent**
**Solution:**
- Check browser localStorage is enabled
- Not in private/incognito mode

---

## ✅ Benefits

1. **Security**: Prevents unauthorized concurrent access
2. **Control**: Driver manages their own sessions
3. **Audit Trail**: Complete login history
4. **User Experience**: Clear conflict resolution
5. **Compliance**: Meets security requirements

---

## 🚀 Ready to Deploy!

All files are included in the package. Just run the migration and upload the updated files!

**Files Modified:**
- ✅ `api/auth.php` - Device session logic
- ✅ `public_html/driver.js` - Session conflict UI
- ✅ `database/device_session_migration.sql` - NEW

**Backup created:**
- `api/auth_old.php.bak`
- `public_html/driver_old.js.bak`
