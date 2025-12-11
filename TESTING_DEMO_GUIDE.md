# 🎥 Device Session Management - Testing Demo Guide

## Visual Flow of Device Session Management

### **Scenario 1: First Login (Normal)**

```
┌─────────────────────────────────────────┐
│  BROWSER A (Chrome)                     │
│  URL: https://yourdomain.com/driver.html│
└─────────────────────────────────────────┘

Step 1: Open Login Page
┌─────────────────────────────────┐
│    Driver Login                 │
│                                 │
│  Phone Number                   │
│  [+1234567890          ]        │
│                                 │
│  PIN                            │
│  [****                 ]        │
│                                 │
│  [     Login     ]              │
│                                 │
│  ← Back to Home                 │
└─────────────────────────────────┘

Step 2: Enter Credentials
Phone: +1234567890
PIN: 1234

Step 3: Click Login
↓
✅ LOGIN SUCCESSFUL

Step 4: Dashboard Loads
┌─────────────────────────────────────────┐
│  Driver Dashboard                       │
│  John Driver                    [Logout]│
│                                         │
│  Your Route                             │
│  ┌──────┬──────────┬──────────┐        │
│  │R001  │ BUS-101  │ Active   │        │
│  └──────┴──────────┴──────────┘        │
│                                         │
│  Trip Management                        │
│  [Start Trip] [View Route]              │
│                                         │
│  ✅ Session active on this device       │
│     Device ID: dev_abc123...            │
└─────────────────────────────────────────┘

✅ Result: Driver logged in successfully
✅ Database: Session created with device_id = "dev_abc123"
```

---

### **Scenario 2: Second Device Login Attempt (Session Conflict)**

```
┌─────────────────────────────────────────┐
│  BROWSER B (Firefox/Phone)              │
│  URL: https://yourdomain.com/driver.html│
└─────────────────────────────────────────┘

Step 1: Open Login Page (while Browser A still logged in)
┌─────────────────────────────────┐
│    Driver Login                 │
│                                 │
│  Phone Number                   │
│  [+1234567890          ]        │
│                                 │
│  PIN                            │
│  [****                 ]        │
│                                 │
│  [     Login     ]              │
└─────────────────────────────────┘

Step 2: Enter SAME Credentials
Phone: +1234567890
PIN: 1234

Step 3: Click Login
↓
⚠️ SYSTEM DETECTS CONFLICT

Step 4: Session Conflict Dialog Appears
┌─────────────────────────────────────────┐
│        ⚠️                               │
│     Already Logged In                   │
│                                         │
│  Your account is active on              │
│  another device                         │
│                                         │
│  ╔════════════════════════════════════╗ │
│  ║ ℹ️ Active Session Details:        ║ │
│  ║                                    ║ │
│  ║ Last login:                        ║ │
│  ║ Dec 11, 2025 10:30 AM              ║ │
│  ║                                    ║ │
│  ║ Device:                            ║ │
│  ║ Chrome 131.0.0.0 / Windows 10      ║ │
│  ║                                    ║ │
│  ║ Device ID:                         ║ │
│  ║ dev_abc123xyz789                   ║ │
│  ╚════════════════════════════════════╝ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ⚡ Terminate Other Session &      │ │
│  │    Login Here                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ✖  Cancel                         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🔒 For security, only one active      │
│     session is allowed per driver.     │
└─────────────────────────────────────────┘

✅ Result: Login blocked, user informed of conflict
✅ Database: System detected active session exists
✅ User given choice: Terminate or Cancel
```

---

### **Scenario 3: Force Login (Terminate Other Session)**

```
Step 5: User Clicks "Terminate Other Session & Login Here"
↓
Loading Animation Shows
┌─────────────────────────────────┐
│                                 │
│      ⏳ Terminating...          │
│                                 │
│  Terminating other session...   │
│                                 │
└─────────────────────────────────┘

Backend Process:
1. Verify credentials again (security)
2. Mark old session as inactive in database:
   UPDATE driver_sessions 
   SET is_active = 0, 
       logout_at = NOW(), 
       terminated_by = 'new_login'
   WHERE driver_id = 1 AND is_active = 1;

3. Create new session for Browser B:
   INSERT INTO driver_sessions 
   (driver_id, session_token, device_id, device_info, ip_address)
   VALUES (1, 'new_token_xyz...', 'dev_xyz456', '...', '192.168.1.100');

4. Update driver's current session:
   UPDATE drivers 
   SET current_device_id = 'dev_xyz456',
       current_session_token = 'new_token_xyz...'
   WHERE id = 1;

Step 6: Browser B Dashboard Loads
┌─────────────────────────────────────────┐
│  BROWSER B - Dashboard                  │
│                                         │
│  Driver Dashboard                       │
│  John Driver                    [Logout]│
│                                         │
│  Your Route                             │
│  ┌──────┬──────────┬──────────┐        │
│  │R001  │ BUS-101  │ Active   │        │
│  └──────┴──────────┴──────────┘        │
│                                         │
│  ✅ Session active on this device       │
│     Device ID: dev_xyz456...            │
└─────────────────────────────────────────┘

✅ Result: Browser B logged in successfully
✅ Database: New session created, old session terminated
```

---

### **Scenario 4: Browser A Becomes Logged Out**

```
┌─────────────────────────────────────────┐
│  BROWSER A (Chrome) - Still showing     │
│  dashboard from before                  │
└─────────────────────────────────────────┘

Step 7: User in Browser A tries to interact
(Click any button, refresh page, or make API call)

↓

API Response:
{
  "success": false,
  "error": "session_invalid",
  "message": "Your session has been terminated"
}

↓

Browser A redirects to login page:
┌─────────────────────────────────┐
│    Driver Login                 │
│                                 │
│  ⚠️ Session Expired             │
│  You have been logged out       │
│                                 │
│  Phone Number                   │
│  [                     ]        │
│                                 │
│  PIN                            │
│  [                     ]        │
│                                 │
│  [     Login     ]              │
└─────────────────────────────────┘

✅ Result: Browser A logged out automatically
✅ Database: Session marked as terminated
✅ Security: Only one active session maintained
```

---

## 📊 Database State Changes

### Initial State (No active sessions)
```sql
SELECT * FROM driver_sessions WHERE driver_id = 1;
-- Result: Empty or all is_active = 0
```

### After Browser A Login
```sql
SELECT * FROM driver_sessions WHERE driver_id = 1 AND is_active = 1;

+----+-----------+-----------------+-------------+--------+---------------------+
| id | driver_id | device_id       | is_active   | login_at            |
+----+-----------+-----------------+-------------+--------+---------------------+
| 1  | 1         | dev_abc123      | 1           | 2025-12-11 10:30:00 |
+----+-----------+-----------------+-------------+--------+---------------------+
```

### After Browser B Forces Login
```sql
SELECT * FROM driver_sessions WHERE driver_id = 1 ORDER BY login_at DESC LIMIT 2;

+----+-----------+-----------------+-------------+---------------------+---------------------+--------------+
| id | driver_id | device_id       | is_active   | login_at            | logout_at           | terminated_by|
+----+-----------+-----------------+-------------+---------------------+---------------------+--------------+
| 2  | 1         | dev_xyz456      | 1           | 2025-12-11 10:35:00 | NULL                | NULL         |
| 1  | 1         | dev_abc123      | 0           | 2025-12-11 10:30:00 | 2025-12-11 10:35:00 | new_login    |
+----+-----------+-----------------+-------------+---------------------+---------------------+--------------+
```

✅ Session 1 (Browser A): is_active = 0, terminated_by = 'new_login'
✅ Session 2 (Browser B): is_active = 1, currently active

---

## 🔍 API Request/Response Flow

### Login Request (Browser A)
```http
POST /api/auth.php?action=driver-login HTTP/1.1
Content-Type: application/json

{
  "phone": "+1234567890",
  "pin": "1234",
  "device_id": "dev_abc123xyz789",
  "device_info": "{\"userAgent\":\"Chrome/131.0.0.0\",\"platform\":\"Win32\"}"
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
    "route_name": "Morning Route",
    "bus_number": "BUS-101",
    "status": "active",
    "school_name": "Demo Public School"
  },
  "session_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "device_id": "dev_abc123xyz789"
}
```

### Login Request (Browser B - Conflict)
```http
POST /api/auth.php?action=driver-login HTTP/1.1
Content-Type: application/json

{
  "phone": "+1234567890",
  "pin": "1234",
  "device_id": "dev_xyz456abc123",
  "device_info": "{\"userAgent\":\"Firefox/120.0\",\"platform\":\"Linux x86_64\"}"
}
```

**Response (Conflict Detected):**
```json
{
  "success": false,
  "error": "already_logged_in",
  "message": "You are already logged in on another device",
  "session_info": {
    "device_info": "{\"userAgent\":\"Chrome/131.0.0.0\",\"platform\":\"Win32\"}",
    "login_time": "2025-12-11 10:30:00",
    "current_device": "dev_abc123xyz789"
  },
  "driver_id": 1
}
```

### Terminate Session Request
```http
POST /api/auth.php?action=terminate-session HTTP/1.1
Content-Type: application/json

{
  "driver_id": 1,
  "phone": "+1234567890",
  "pin": "1234",
  "device_id": "dev_xyz456abc123",
  "device_info": "{\"userAgent\":\"Firefox/120.0\",\"platform\":\"Linux x86_64\"}"
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
    "route_name": "Morning Route",
    "bus_number": "BUS-101",
    "status": "active"
  },
  "session_token": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8"
}
```

---

## 🧪 Testing Checklist

### ✅ Test Case 1: Normal Login
- [ ] Open driver.html in Browser A
- [ ] Enter: +1234567890 / 1234
- [ ] Click Login
- [ ] **Expected:** Dashboard loads successfully
- [ ] **Expected:** See "Session active on this device"

### ✅ Test Case 2: Detect Duplicate Login
- [ ] Keep Browser A logged in
- [ ] Open driver.html in Browser B (different browser)
- [ ] Enter same credentials: +1234567890 / 1234
- [ ] Click Login
- [ ] **Expected:** "Already Logged In" dialog appears
- [ ] **Expected:** Shows last login time and device info

### ✅ Test Case 3: Terminate Other Session
- [ ] In Browser B dialog, click "Terminate Other Session & Login Here"
- [ ] **Expected:** Loading animation shows
- [ ] **Expected:** Browser B logs in successfully
- [ ] **Expected:** Dashboard loads in Browser B

### ✅ Test Case 4: Verify Old Session Terminated
- [ ] Go back to Browser A
- [ ] Refresh page or click any button
- [ ] **Expected:** Browser A shows login page (logged out)
- [ ] **Expected:** May show "Session Expired" message

### ✅ Test Case 5: Re-login Same Device
- [ ] Logout from Browser B
- [ ] Login again in Browser B
- [ ] **Expected:** Login works without conflict (same device_id)

### ✅ Test Case 6: Database Audit Trail
```sql
-- Check session history
SELECT 
  id,
  device_id,
  login_at,
  logout_at,
  is_active,
  terminated_by
FROM driver_sessions
WHERE driver_id = 1
ORDER BY login_at DESC;
```
- [ ] **Expected:** See all login attempts
- [ ] **Expected:** Old sessions marked is_active = 0
- [ ] **Expected:** terminated_by = 'new_login' for forced logout

---

## 🎬 Video Demo Script

If you record a video demo, follow this script:

**[00:00 - 00:30] Introduction**
"Hello! Today I'll demonstrate the device session management feature in our Bus Tracker system. This ensures only one device can be logged in per driver account."

**[00:30 - 01:00] Normal Login**
1. Open Chrome browser
2. Navigate to driver.html
3. Enter phone: +1234567890
4. Enter PIN: 1234
5. Click Login
6. Show dashboard loading
7. Point out "Session active on this device" message

**[01:00 - 02:00] Duplicate Login Attempt**
1. Open Firefox (or another browser)
2. Navigate to driver.html
3. Enter SAME credentials: +1234567890 / 1234
4. Click Login
5. **Point out:** "Already Logged In" dialog appears
6. **Highlight:** Session details shown (time, device)
7. **Explain:** Two options available

**[02:00 - 02:30] Terminate Session**
1. Click "Terminate Other Session & Login Here"
2. Show loading animation
3. Dashboard loads in Firefox
4. Point out session active on new device

**[02:30 - 03:00] Verify Old Session Terminated**
1. Switch back to Chrome
2. Try to interact or refresh
3. Show that Chrome is now logged out
4. **Explain:** Only one active session maintained

**[03:00 - 03:30] Database Audit**
1. Open phpMyAdmin or database tool
2. Show driver_sessions table
3. Point out:
   - Old session: is_active = 0
   - New session: is_active = 1
   - terminated_by = 'new_login'

**[03:30 - 04:00] Conclusion**
"This feature ensures driver account security by preventing simultaneous access from multiple devices. The system provides a user-friendly dialog to handle conflicts, and maintains a complete audit trail for security monitoring."

---

## 📝 Testing Notes

### Device ID Generation
- Stored in browser's localStorage
- Format: `dev_[random]_[timestamp]`
- Example: `dev_abc123xyz_1702308000000`
- Persists across browser sessions
- Different for each browser/device

### Session Token
- 64-character random hex string
- Generated server-side using: `bin2hex(random_bytes(32))`
- Unique per session
- Stored in database and client localStorage

### IP Tracking
- Server captures: `$_SERVER['REMOTE_ADDR']`
- Logged with each login
- Used for security auditing

### User Agent Info
- Client sends: `navigator.userAgent`
- Includes browser, OS, version
- Stored with session for identification

---

## 🔒 Security Considerations

✅ **Credentials Re-verified:** System asks for phone/PIN again before terminating
✅ **Atomic Operations:** Database transactions ensure consistency
✅ **Session Tokens:** High entropy (256-bit) for security
✅ **Audit Trail:** Complete history of all login/logout events
✅ **IP Logging:** Track login locations
✅ **Device Fingerprinting:** Unique ID per browser

---

## 📞 Support Information

If you encounter any issues during testing:

1. **Check browser console** for JavaScript errors
2. **Check network tab** for API responses
3. **Verify database** has all tables (run migrations)
4. **Check PHP error logs** on server
5. **Clear localStorage** if device ID issues: `localStorage.clear()`

---

**Ready to Test?**

Deploy to Hostinger and test with real browsers! The feature works best in a production environment with actual PHP/MySQL backend.

**Download Package:** https://www.genspark.ai/api/files/s/gJxhNeMR

---

**Last Updated:** December 11, 2025  
**Version:** 4.3 - Device Session Management  
**Status:** Production Ready ✅
