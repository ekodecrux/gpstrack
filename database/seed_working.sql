-- WORKING TEST DATA WITH VERIFIED CREDENTIALS
-- All bcrypt hashes are for password: "password"
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

USE bus_tracker;

-- Clear existing data (optional - use with caution)
-- DELETE FROM students;
-- DELETE FROM parents;
-- DELETE FROM drivers;
-- DELETE FROM routes;
-- DELETE FROM school_admins;
-- DELETE FROM super_admins;
-- DELETE FROM schools;

-- ============================================
-- SUPER ADMIN (SAAS Management)
-- ============================================
-- Username: superadmin
-- Password: password
INSERT INTO super_admins (username, password_hash, email, is_active) VALUES
('superadmin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin@bustracker.com', 1);

-- ============================================
-- DEMO SCHOOL
-- ============================================
INSERT INTO schools (school_name, school_code, address, contact_phone, contact_email, is_active) VALUES
('Demo Public School', 'DEMO001', '123 Main Street, Demo City', '+1234567890', 'admin@demoschool.edu', 1);

-- ============================================
-- SCHOOL ADMIN
-- ============================================
-- Username: admin
-- Password: password
INSERT INTO school_admins (school_id, username, password_hash, admin_name, email, phone, is_active) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin@demoschool.edu', '+1234567890', 1);

-- ============================================
-- ROUTES
-- ============================================
INSERT INTO routes (school_id, route_number, route_name, bus_number, is_active) VALUES
(1, 'R001', 'Morning Route', 'BUS-101', 1),
(1, 'R002', 'Afternoon Route', 'BUS-102', 1);

-- ============================================
-- DRIVERS
-- ============================================
-- Phone: +1234567890 / PIN: 1234
-- Phone: +9876543210 / PIN: 5678
INSERT INTO drivers (school_id, driver_name, phone, pin, license_number, current_route_id, status) VALUES
(1, 'John Driver', '+1234567890', '1234', 'DL123456', 1, 'active'),
(1, 'Mike Driver', '+9876543210', '5678', 'DL234567', 2, 'active');

-- ============================================
-- PARENTS
-- ============================================
-- Phone: +1987654321 / PIN: 5678
-- Phone: +1987654322 / PIN: 1234
INSERT INTO parents (school_id, parent_name, phone, pin, email) VALUES
(1, 'Mary Parent', '+1987654321', '5678', 'mary@email.com'),
(1, 'Tom Parent', '+1987654322', '1234', 'tom@email.com');

-- ============================================
-- STUDENTS
-- ============================================
INSERT INTO students (school_id, parent_id, route_id, student_name, class, section, roll_number, pickup_address, dropoff_address, is_active) VALUES
(1, 1, 1, 'John Smith', '5', 'A', '101', '123 Oak Street', 'Demo Public School', 1),
(1, 1, 1, 'Emma Smith', '3', 'B', '102', '123 Oak Street', 'Demo Public School', 1),
(1, 2, 2, 'Sarah Johnson', '4', 'A', '201', '456 Pine Avenue', 'Demo Public School', 1),
(1, 2, 2, 'Tommy Johnson', '6', 'C', '202', '456 Pine Avenue', 'Demo Public School', 1);

-- ============================================
-- SUBSCRIPTION PLANS (for SAAS)
-- ============================================
INSERT INTO subscription_plans (plan_name, max_students, max_routes, max_drivers, price_per_month, features) VALUES
('Free', 50, 1, 2, 0.00, 'Basic features for testing'),
('Basic', 200, 3, 5, 10.00, 'Small schools - up to 200 students'),
('Premium', 1000, 10, 20, 50.00, 'Medium schools - up to 1000 students'),
('Enterprise', 999999, 999, 999, 200.00, 'Large schools - unlimited');

-- Update school with subscription
UPDATE schools SET subscription_plan_id = 2 WHERE id = 1;
