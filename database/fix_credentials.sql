-- ============================================
-- FIX CREDENTIALS - Run this if login not working
-- ============================================

USE bus_tracker;

-- ============================================
-- CHECK IF DATA EXISTS
-- ============================================
SELECT 'Checking Drivers...' as Status;
SELECT COUNT(*) as driver_count FROM drivers;

SELECT 'Checking Parents...' as Status;
SELECT COUNT(*) as parent_count FROM parents;

SELECT 'Checking School Admins...' as Status;
SELECT COUNT(*) as admin_count FROM school_admins;

SELECT 'Checking Super Admins...' as Status;
SELECT COUNT(*) as superadmin_count FROM super_admins;

-- ============================================
-- IF COUNTS ARE 0, DELETE AND RE-INSERT
-- ============================================

-- Clear old data (if exists)
DELETE FROM students WHERE school_id = 1;
DELETE FROM parents WHERE school_id = 1;
DELETE FROM drivers WHERE school_id = 1;
DELETE FROM routes WHERE school_id = 1;
DELETE FROM school_admins WHERE school_id = 1;
DELETE FROM schools WHERE id = 1;
DELETE FROM super_admins WHERE username = 'superadmin';

-- ============================================
-- INSERT SUPER ADMIN
-- ============================================
-- Username: superadmin
-- Password: password
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO super_admins (username, password_hash, email, is_active, created_at) VALUES
('superadmin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin@bustracker.com', 1, NOW());

-- ============================================
-- INSERT DEMO SCHOOL
-- ============================================
INSERT INTO schools (school_name, school_code, address, contact_phone, contact_email, is_active, created_at) VALUES
('Demo Public School', 'DEMO001', '123 Main Street, Demo City', '+1234567890', 'admin@demoschool.edu', 1, NOW());

-- ============================================
-- INSERT SCHOOL ADMIN
-- ============================================
-- Username: admin
-- Password: password
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO school_admins (school_id, username, password_hash, admin_name, email, phone, is_active, created_at) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin@demoschool.edu', '+1234567890', 1, NOW());

-- ============================================
-- INSERT ROUTES
-- ============================================
INSERT INTO routes (school_id, route_number, route_name, bus_number, is_active, created_at) VALUES
(1, 'R001', 'Morning Route', 'BUS-101', 1, NOW()),
(1, 'R002', 'Afternoon Route', 'BUS-102', 1, NOW());

-- ============================================
-- INSERT DRIVERS WITH WORKING CREDENTIALS
-- ============================================
-- Driver 1: Phone: +1234567890 / PIN: 1234
-- Driver 2: Phone: +9876543210 / PIN: 5678
INSERT INTO drivers (school_id, driver_name, phone, pin, license_number, current_route_id, status, created_at) VALUES
(1, 'John Driver', '+1234567890', '1234', 'DL123456', 1, 'active', NOW()),
(1, 'Mike Driver', '+9876543210', '5678', 'DL234567', 2, 'active', NOW());

-- ============================================
-- INSERT PARENTS WITH WORKING CREDENTIALS
-- ============================================
-- Parent 1: Phone: +1987654321 / PIN: 5678
-- Parent 2: Phone: +1987654322 / PIN: 1234
INSERT INTO parents (school_id, parent_name, phone, pin, email, created_at) VALUES
(1, 'Mary Parent', '+1987654321', '5678', 'mary@email.com', NOW()),
(1, 'Tom Parent', '+1987654322', '1234', 'tom@email.com', NOW());

-- ============================================
-- INSERT STUDENTS
-- ============================================
INSERT INTO students (school_id, parent_id, route_id, student_name, class, section, roll_number, pickup_address, dropoff_address, is_active, created_at) VALUES
(1, 1, 1, 'John Smith', '5', 'A', '101', '123 Oak Street', 'Demo Public School', 1, NOW()),
(1, 1, 1, 'Emma Smith', '3', 'B', '102', '123 Oak Street', 'Demo Public School', 1, NOW()),
(1, 2, 2, 'Sarah Johnson', '4', 'A', '201', '456 Pine Avenue', 'Demo Public School', 1, NOW()),
(1, 2, 2, 'Tommy Johnson', '6', 'C', '202', '456 Pine Avenue', 'Demo Public School', 1, NOW());

-- ============================================
-- VERIFY DATA INSERTED CORRECTLY
-- ============================================
SELECT '==== VERIFICATION RESULTS ====' as Status;

SELECT 'Super Admins:' as Table_Name, COUNT(*) as Count FROM super_admins;
SELECT 'Schools:' as Table_Name, COUNT(*) as Count FROM schools;
SELECT 'School Admins:' as Table_Name, COUNT(*) as Count FROM school_admins;
SELECT 'Routes:' as Table_Name, COUNT(*) as Count FROM routes;
SELECT 'Drivers:' as Table_Name, COUNT(*) as Count FROM drivers;
SELECT 'Parents:' as Table_Name, COUNT(*) as Count FROM parents;
SELECT 'Students:' as Table_Name, COUNT(*) as Count FROM students;

SELECT '==== DRIVER LOGIN CREDENTIALS ====' as Info;
SELECT id, driver_name, phone, pin, status, route_number, bus_number 
FROM drivers 
LEFT JOIN routes ON drivers.current_route_id = routes.id;

SELECT '==== PARENT LOGIN CREDENTIALS ====' as Info;
SELECT id, parent_name, phone, pin, email FROM parents;

SELECT '==== SCHOOL ADMIN LOGIN CREDENTIALS ====' as Info;
SELECT id, username, admin_name, email FROM school_admins;

SELECT '==== SUPER ADMIN LOGIN CREDENTIALS ====' as Info;
SELECT id, username, email, is_active FROM super_admins;

SELECT '==== ALL CREDENTIALS FIXED! ====' as Status;
SELECT 'Driver 1: Phone +1234567890, PIN 1234' as Credentials;
SELECT 'Driver 2: Phone +9876543210, PIN 5678' as Credentials;
SELECT 'Parent 1: Phone +1987654321, PIN 5678' as Credentials;
SELECT 'Parent 2: Phone +1987654322, PIN 1234' as Credentials;
SELECT 'School Admin: Username admin, Password password' as Credentials;
SELECT 'Super Admin: Username superadmin, Password password' as Credentials;
