# 👑 Super Admin & SAAS Multi-School System

## Overview

The Super Admin system enables **SAAS (Software as a Service)** management of multiple schools on a single platform. This allows you to onboard, manage, and monetize multiple schools from one central dashboard.

---

## 🔐 Super Admin Credentials

### Default Login:
- **URL**: `https://yourdomain.com/superadmin.html`
- **Username**: `superadmin`
- **Password**: `superadmin123`

⚠️ **CHANGE PASSWORD IMMEDIATELY IN PRODUCTION**

---

## 🚀 Features

### 1. **Multi-School Management**
- ✅ Add unlimited schools
- ✅ View all schools in one dashboard
- ✅ Activate/deactivate schools
- ✅ Monitor school statistics

### 2. **Subscription Plans**
- **Free Plan**: 50 students, 5 routes
- **Basic Plan**: 100 students, 10 routes ($10/month)
- **Premium Plan**: 500 students, 50 routes ($50/month)
- **Enterprise Plan**: Unlimited ($200/month)

### 3. **School Onboarding**
- One-click school creation
- Automatic school admin account creation
- Subscription management
- Billing tracking

### 4. **Dashboard Analytics**
- Total schools count
- Active schools
- Total students across all schools
- Monthly revenue calculation

---

## 📋 How to Use

### **Step 1: Login as Super Admin**
1. Visit `https://yourdomain.com/superadmin.html`
2. Login with super admin credentials
3. Access the Super Admin Dashboard

### **Step 2: Add New School**
1. Click **"Add New School"** button
2. Fill in school details:
   - School Name (e.g., "ABC High School")
   - School Code (unique, e.g., "ABC001")
   - Address
   - Contact Phone
   - Contact Email
3. Select subscription plan
4. Choose subscription duration
5. Create school admin credentials:
   - Admin Username
   - Admin Password
   - Admin Full Name
6. Click **"Create School"**

### **Step 3: School Admin Access**
After creating a school, the school admin can:
1. Visit `https://yourdomain.com/admin.html`
2. Login with the credentials you created
3. Manage their school (routes, drivers, students, etc.)

### **Step 4: Manage Schools**
From the Super Admin dashboard:
- **View**: Click eye icon to see school details
- **Edit**: Click edit icon to modify school settings
- **Activate/Deactivate**: Click toggle icon to enable/disable school
- **Monitor**: View student count, subscription status

---

## 🗄️ Database Setup

### **Step 1: Run Migration**
After deploying, run the Super Admin migration:

```sql
-- In phpMyAdmin, run this file:
database/super_admin_migration.sql
```

This creates:
- `super_admins` table
- Subscription fields in `schools` table
- Activity logs table
- Default super admin account

### **Step 2: Verify Tables**
Check that these tables exist:
- ✅ `super_admins`
- ✅ `super_admin_logs`
- ✅ `schools` (with new subscription columns)

---

## 🔧 Technical Details

### **Database Schema Updates**

#### `super_admins` Table:
```sql
- id (Primary Key)
- username (Unique)
- password_hash
- full_name
- email
- phone
- is_active
- created_at
- last_login
```

#### `schools` Table (New Fields):
```sql
- subscription_plan (free/basic/premium/enterprise)
- subscription_start (DATE)
- subscription_end (DATE)
- max_students (INT)
- max_routes (INT)
- max_drivers (INT)
- billing_email
- notes
```

### **API Endpoints**

**Super Admin API** (`api/superadmin.php`):
- `POST /api/superadmin.php?action=login` - Super admin login
- `GET /api/superadmin.php?action=stats` - Dashboard statistics
- `GET /api/superadmin.php?action=list-schools` - List all schools
- `POST /api/superadmin.php?action=create-school` - Create new school
- `POST /api/superadmin.php?action=toggle-school-status` - Activate/deactivate school

---

## 💰 SAAS Business Model

### **Revenue Calculator**

With 10 schools:
- 3 Free plans: $0
- 4 Basic plans: 4 × $10 = $40
- 2 Premium plans: 2 × $50 = $100
- 1 Enterprise plan: 1 × $200 = $200

**Monthly Revenue**: $340
**Annual Revenue**: $4,080

### **Scaling Potential**

| Schools | Mix | Monthly Revenue |
|---------|-----|-----------------|
| 10 | Mixed | $340 |
| 50 | Mixed | $1,500 |
| 100 | Mixed | $4,000 |
| 500 | Mixed | $25,000 |

---

## 🔒 Security Best Practices

### **1. Change Default Password**
```sql
UPDATE super_admins 
SET password_hash = '$2y$10$YOUR_NEW_BCRYPT_HASH' 
WHERE username = 'superadmin';
```

### **2. Use Strong Passwords**
- Minimum 12 characters
- Include uppercase, lowercase, numbers, symbols
- Use password manager

### **3. Restrict Access**
- Limit super admin access to trusted personnel only
- Use HTTPS (SSL certificate)
- Enable IP whitelisting if possible

### **4. Regular Backups**
- Backup database daily
- Store backups securely off-site

---

## 📊 Workflow Example

### **Scenario: Onboarding "Sunshine Elementary School"**

1. **Super Admin Actions:**
   - Login to super admin dashboard
   - Click "Add New School"
   - Enter:
     - Name: "Sunshine Elementary School"
     - Code: "SUNSHINE001"
     - Email: admin@sunshine.edu
     - Plan: Premium (500 students)
     - Duration: 1 year
     - Admin Username: sunshine_admin
     - Admin Password: SecurePass123!
   - Click "Create School"

2. **System Actions:**
   - Creates school record
   - Sets subscription (expires in 1 year)
   - Creates school admin account
   - School is now active

3. **School Admin Actions:**
   - Receives credentials via email (manual process)
   - Logs into admin.html
   - Starts adding routes, drivers, students

4. **Monitoring:**
   - Super admin can view school stats
   - Track student count vs. limit
   - Monitor subscription expiration

---

## 🎯 Future Enhancements

### **Phase 2 (Optional)**
- [ ] Automated email notifications
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Usage analytics per school
- [ ] Billing invoices generation
- [ ] School admin self-service portal
- [ ] Bulk school import (CSV)
- [ ] White-label branding per school

---

## 🆘 Troubleshooting

### **Issue: Can't login as super admin**
**Solution:**
1. Verify `super_admin_migration.sql` was run
2. Check if `super_admins` table exists
3. Verify password hash in database
4. Clear browser cache

### **Issue: Can't create new school**
**Solution:**
1. Check database permissions
2. Ensure school_code is unique
3. Verify admin_username is unique
4. Check error logs in browser console

### **Issue: School not appearing in list**
**Solution:**
1. Refresh the page
2. Check database - school should be in `schools` table
3. Verify `is_active = 1`

---

## 📞 Support

For technical support:
1. Check browser console for errors
2. Check `api/superadmin.php` for backend errors
3. Verify database migrations are complete
4. Ensure all files are uploaded correctly

---

## ✅ Deployment Checklist

- [ ] Upload all files to Hostinger
- [ ] Run `schema.sql` in phpMyAdmin
- [ ] Run `super_admin_migration.sql` in phpMyAdmin
- [ ] Run `seed.sql` for test data (optional)
- [ ] Test super admin login
- [ ] Create first school
- [ ] Test school admin login
- [ ] Change default super admin password
- [ ] Configure SSL certificate
- [ ] Set up backup schedule

---

**Super Admin is now ready! Start onboarding schools and building your SAAS business! 🚀**
