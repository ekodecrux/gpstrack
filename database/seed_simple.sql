-- Simple Test Data with Easy Credentials
USE bus_tracker;

-- Insert Super Admin (for SAAS management)
-- Username: superadmin / Password: superadmin123
INSERT INTO super_admins (username, password_hash, email) VALUES
('superadmin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin@bustracker.com');

-- Insert Demo School
INSERT INTO schools (school_name, school_code, address, contact_phone, contact_email) VALUES
('Demo Public School', 'DEMO001', '123 Main Street, Demo City', '+1234567890', 'admin@demoschool.edu');

-- Insert School Admin
-- Username: admin / Password: admin
INSERT INTO school_admins (school_id, username, password_hash, admin_name, email, phone) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin@demoschool.edu', '+1234567890');

-- Insert Routes
INSERT INTO routes (school_id, route_number, route_name, bus_number) VALUES
(1, 'R001', 'Morning Route', 'BUS-101'),
(1, 'R002', 'Afternoon Route', 'BUS-102');

-- Insert Driver (Phone: +1234567890, PIN: 1234)
INSERT INTO drivers (school_id, driver_name, phone, pin, license_number, current_route_id, status) VALUES
(1, 'John Driver', '+1234567890', '1234', 'DL123456', 1, 'active');

-- Insert Parent (Phone: +1987654321, PIN: 5678)
INSERT INTO parents (school_id, parent_name, phone, pin, email) VALUES
(1, 'Mary Parent', '+1987654321', '5678', 'mary@email.com');

-- Insert Students
INSERT INTO students (school_id, parent_id, route_id, student_name, class, section, roll_number, pickup_address, dropoff_address, is_active) VALUES
(1, 1, 1, 'John Smith', '5', 'A', '101', '123 Oak Street', 'Demo Public School', 1),
(1, 1, 1, 'Emma Smith', '3', 'B', '102', '123 Oak Street', 'Demo Public School', 1);

-- Insert sample subscription plan
INSERT INTO subscription_plans (plan_name, max_students, max_routes, max_drivers, price_per_month, features) VALUES
('Basic', 200, 3, 5, 10.00, 'Basic features for small schools');
