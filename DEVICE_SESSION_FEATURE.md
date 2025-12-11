# Device Session Management - User Guide

## Overview
The Bus Tracker System now includes **Device Session Management** for drivers, ensuring that only one device can be logged in at a time for security and operational consistency.

---

## 🔐 How It Works

### Single Device Login Enforcement
When a driver tries to log in:

1. **First Login (No Active Session)**
   - Driver enters phone number and PIN
   - System creates new session and grants access
   - Device ID is stored for future verification

2. **Second Login Attempt (Active Session Exists)**
   - System detects existing active session on another device
   - Shows session conflict dialog with details:
     - Last login time
     - Device information
     - Current device ID
   - Provides two options:
     - **Terminate Other Session & Login Here** (recommended)
     - **Cancel** (keep existing session active)

3. **Session Termination Process**
   - User confirms termination
   - Old session is invalidated immediately
   - New session is created on current device
   - Driver is logged in successfully

---

## 📱 User Experience Flow

### Login Screen
```
┌─────────────────────────────┐
│    Driver Login             │
│                             │
│  Phone: +1234567890         │
│  PIN:   ****                │
│                             │
│  [     Login     ]          │
│                             │
│  ← Back to Home             │
└─────────────────────────────┘
```

### Session Conflict Dialog
```
┌─────────────────────────────────────┐
│  ⚠️  Already Logged In              │
│                                     │
│  Your account is active on          │
│  another device                     │
│                                     │
│  ℹ️ Active Session Details:         │
│  Last login: Dec 10, 2025 10:30 AM │
│  Device: Android Chrome Mobile      │
│                                     │
│  [ Terminate Other Session &       │
│    Login Here ]                     │
│                                     │
│  [      Cancel      ]               │
│                                     │
│  🔒 Only one active session         │
│     allowed per driver account      │
└─────────────────────────────────────┘
```

### After Successful Login
```
┌─────────────────────────────────────┐
│  Driver Dashboard                   │
│  Name: John Driver                  │
│                                     │
│  Route Info...                      │
│  Trip Management...                 │
│                                     │
│  ✅ Session active on this device   │
│     Device ID: dev_abc123...        │
└─────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### Database Tables

#### `drivers` Table (Enhanced)
```sql
ALTER TABLE drivers 
ADD COLUMN current_device_id VARCHAR(255),
ADD COLUMN current_session_token VARCHAR(255),
ADD COLUMN last_login_ip VARCHAR(50),
ADD COLUMN last_login_at TIMESTAMP NULL,
ADD COLUMN device_info TEXT;
```

#### `driver_sessions` Table (New)
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

### API Endpoints

#### 1. Driver Login
**Endpoint:** `POST /api/auth.php?action=driver-login`

**Request Body:**
```json
{
  "phone": "+1234567890",
  "pin": "1234",
  "device_id": "dev_abc123xyz789",
  "device_info": "{...device details...}"
}
```

**Response (Success):**
```json
{
  "success": true,
  "driver": {
    "id": 1,
    "driver_name": "John Driver",
    "phone": "+1234567890",
    "route_number": "R001",
    "bus_number": "BUS-101",
    "status": "active"
  },
  "session_token": "64-character-hex-token",
  "device_id": "dev_abc123xyz789"
}
```

**Response (Session Conflict):**
```json
{
  "success": false,
  "error": "already_logged_in",
  "message": "You are already logged in on another device",
  "session_info": {
    "device_info": "Mozilla/5.0 (Android...)",
    "login_time": "2025-12-10 10:30:45",
    "current_device": "dev_xyz456abc123"
  },
  "driver_id": 1
}
```

#### 2. Terminate Existing Session
**Endpoint:** `POST /api/auth.php?action=terminate-session`

**Request Body:**
```json
{
  "driver_id": 1,
  "phone": "+1234567890",
  "pin": "1234",
  "device_id": "dev_new_device_123",
  "device_info": "{...new device details...}"
}
```

**Response:**
```json
{
  "success": true,
  "driver": {...driver data...},
  "session_token": "new-64-character-token"
}
```

#### 3. Driver Logout
**Endpoint:** `POST /api/auth.php?action=driver-logout`

**Request Body:**
```json
{
  "session_token": "current-session-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🔒 Security Features

1. **Device Fingerprinting**
   - Unique device ID generated per browser/device
   - Stored in localStorage
   - Used to identify returning devices

2. **Session Tokens**
   - 64-character hex tokens (256-bit entropy)
   - Unique per session
   - Stored securely in database

3. **IP Tracking**
   - Logs IP address for each login
   - Helps identify suspicious activity

4. **Automatic Session Management**
   - Old sessions automatically invalidated
   - Database transactions ensure consistency
   - No orphaned sessions

---

## 📋 Deployment Instructions

### Step 1: Update Database Schema
```bash
# Import the device session migration
mysql -u your_user -p bus_tracker < database/device_session_migration.sql
```

### Step 2: Verify Files
Ensure these files are present:
- `api/auth.php` (device session logic)
- `public_html/driver.js` (session conflict UI)
- `database/device_session_migration.sql` (schema updates)

### Step 3: Test the Feature

#### Test Case 1: Normal Login
1. Open driver.html in Browser A
2. Login with: +1234567890 / 1234
3. ✅ Should login successfully

#### Test Case 2: Session Conflict
1. Keep Browser A logged in
2. Open driver.html in Browser B (different browser/incognito)
3. Try to login with same credentials
4. ✅ Should show "Already Logged In" dialog

#### Test Case 3: Force Login
1. In Browser B session conflict dialog
2. Click "Terminate Other Session & Login Here"
3. ✅ Browser B should login successfully
4. ✅ Browser A should be logged out (refresh to verify)

#### Test Case 4: Logout
1. In active browser, click Logout
2. ✅ Should redirect to home page
3. Try logging in again
4. ✅ Should work without conflict

---

## 🎯 Benefits

1. **Security**: Prevents unauthorized simultaneous access
2. **Operational Control**: Ensures driver uses assigned device
3. **Audit Trail**: Complete session history in database
4. **User-Friendly**: Clear dialog explains situation and options
5. **Flexible**: User can terminate old session if needed

---

## 📊 Session Monitoring

### Check Active Sessions (SQL)
```sql
SELECT 
  d.driver_name,
  d.phone,
  ds.device_id,
  ds.ip_address,
  ds.login_at,
  ds.is_active
FROM driver_sessions ds
JOIN drivers d ON ds.driver_id = d.id
WHERE ds.is_active = 1
ORDER BY ds.login_at DESC;
```

### View Session History
```sql
SELECT 
  d.driver_name,
  ds.login_at,
  ds.logout_at,
  ds.terminated_by,
  ds.device_info
FROM driver_sessions ds
JOIN drivers d ON ds.driver_id = d.id
WHERE d.phone = '+1234567890'
ORDER BY ds.login_at DESC
LIMIT 10;
```

---

## ❓ FAQ

**Q: What happens if I close the browser without logging out?**  
A: The session remains active in the database. You'll need to use "Terminate Other Session" when logging in from a new device.

**Q: Can I login from the same device later?**  
A: Yes! The system recognizes your device ID and allows you to login without conflicts.

**Q: What if I lose my phone?**  
A: Contact your school admin to manually clear your session from the database, or simply login from your new device and terminate the old session.

**Q: How long do sessions last?**  
A: Sessions remain active until:
- Manual logout
- Terminated by new login
- Admin manually deactivates

**Q: Can admin see my session history?**  
A: Yes, administrators can view session logs for security auditing purposes.

---

## 🚀 Version History

**v4.3 - Device Session Management**
- ✅ Single device enforcement
- ✅ Session conflict detection
- ✅ Force login capability
- ✅ Complete audit trail
- ✅ User-friendly dialogs
- ✅ Secure session tokens

---

## 📞 Support

For technical issues or questions:
1. Check database migration ran successfully
2. Verify API endpoint is accessible
3. Check browser console for JavaScript errors
4. Review session logs in database

**Test Credentials:**
- Driver: +1234567890 / PIN: 1234
- Parent: +1987654321 / PIN: 5678
- Admin: admin / admin

---

**Last Updated:** December 11, 2025  
**Version:** 4.3 - Complete Device Session Management
