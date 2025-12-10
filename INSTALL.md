# Bus Tracking System - Hostinger Installation Guide

## System Requirements
- Hostinger Shared/Business hosting
- PHP 7.4 or higher
- MySQL 5.7 or higher
- phpMyAdmin access

## Installation Steps

### 1. Upload Files
1. Connect to your Hostinger account via File Manager or FTP
2. Upload all files from `public_html/` to your `public_html/` directory
3. Upload all files from `api/` to `public_html/api/` directory

### 2. Create Database
1. Log in to Hostinger control panel
2. Go to "Databases" → "MySQL Databases"
3. Create a new database named `bus_tracker`
4. Create a database user and grant all privileges
5. Note down:
   - Database name
   - Database username
   - Database password
   - Database host (usually `localhost`)

### 3. Import Database Schema
1. Open phpMyAdmin from Hostinger control panel
2. Select your `bus_tracker` database
3. Click "Import" tab
4. Upload `database/schema.sql`
5. Click "Go" to execute
6. Upload `database/seed.sql` (optional - for test data)
7. Click "Go" to execute

### 4. Configure API
1. Open `public_html/api/config.php`
2. Update database credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'bus_tracker');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
```

### 5. Set File Permissions
```
public_html/             755
public_html/api/         755
public_html/api/*.php    644
```

### 6. Test Installation
1. Visit: `https://yourdomain.com/`
2. Test Driver Login: `https://yourdomain.com/driver.html`
   - Phone: +1234567890
   - PIN: 1234
3. Test Parent Login: `https://yourdomain.com/parent.html`
   - Phone: +1987654321
   - PIN: 5678
4. Test Admin Login: `https://yourdomain.com/admin.html`
   - Username: admin
   - Password: admin

### 7. Security (IMPORTANT)
1. Change default admin password in database
2. Update driver/parent test credentials
3. Enable HTTPS (SSL) in Hostinger control panel
4. Add .htaccess for additional security

## File Structure
```
public_html/
├── index.html          - Home page
├── driver.html         - Driver application
├── parent.html         - Parent application
├── admin.html          - Admin dashboard
├── driver.js           - Driver app script
├── parent.js           - Parent app script
├── admin.js            - Admin app script
└── api/
    ├── config.php      - Database configuration
    ├── auth.php        - Authentication API
    ├── trips.php       - Trip management API
    ├── tracking.php    - Location tracking API
    └── pickup-dropoff.php - Pickup/dropoff confirmation API
```

## Test Credentials
After installation with seed data:

**Admin:**
- Username: `admin`
- Password: `admin`

**Driver:**
- Phone: `+1234567890`
- PIN: `1234`

**Parent:**
- Phone: `+1987654321`
- PIN: `5678`

## Troubleshooting

### API Not Working
- Check PHP version (minimum 7.4)
- Verify database credentials in config.php
- Check file permissions
- Enable error reporting temporarily: `ini_set('display_errors', 1);`

### Database Connection Failed
- Verify database exists
- Check username/password
- Confirm user has privileges
- Try changing DB_HOST to '127.0.0.1'

### 404 Errors
- Check .htaccess configuration
- Verify file paths are correct
- Ensure files are uploaded to correct directory

### Maps Not Loading
- OpenStreetMap requires internet connection
- Check browser console for errors
- Verify Leaflet.js CDN is accessible

## Production Checklist
- [ ] Database credentials updated
- [ ] Default passwords changed
- [ ] HTTPS/SSL enabled
- [ ] Test all login flows
- [ ] Test pickup/dropoff confirmations
- [ ] Test location tracking
- [ ] Verify API endpoints working
- [ ] Check mobile responsiveness
- [ ] Review PHP error logs
- [ ] Set up database backups

## Support
For issues:
1. Check Hostinger documentation
2. Review PHP error logs in control panel
3. Check browser console for JavaScript errors
4. Verify database tables created correctly

## Features
- Multi-tenant SAAS architecture
- Driver pickup confirmation
- Parent dropoff confirmation
- Real-time GPS tracking
- OpenStreetMap integration (zero cost)
- Student absence marking
- Device restrictions
- Complete audit trail

## Updates
To update:
1. Backup current files and database
2. Upload new files
3. Run any new SQL migrations
4. Clear browser cache
5. Test all functionality
