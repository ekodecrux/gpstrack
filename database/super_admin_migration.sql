-- Super Admin Migration for SAAS Multi-School System
-- Run this after schema.sql

USE bus_tracker;

-- Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
) ENGINE=InnoDB;

-- Add subscription/billing fields to schools table
ALTER TABLE schools 
ADD COLUMN subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'basic',
ADD COLUMN subscription_start DATE,
ADD COLUMN subscription_end DATE,
ADD COLUMN max_students INT DEFAULT 100,
ADD COLUMN max_routes INT DEFAULT 10,
ADD COLUMN max_drivers INT DEFAULT 20,
ADD COLUMN billing_email VARCHAR(255),
ADD COLUMN notes TEXT;

-- Create super admin activity log
CREATE TABLE IF NOT EXISTS super_admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  super_admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (super_admin_id) REFERENCES super_admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert default super admin (username: superadmin, password: superadmin123)
INSERT INTO super_admins (username, password_hash, full_name, email, phone) 
VALUES ('superadmin', '$2y$10$VWqP9rR3jJ3YhZ8XkKZGxOK.kB9FQZk9z5xH5yL9HQkGZX5YhZ8Xk', 'Super Administrator', 'superadmin@bustracker.com', '+1000000000')
ON DUPLICATE KEY UPDATE username=username;

-- Update existing schools with subscription info
UPDATE schools 
SET subscription_plan = 'basic',
    subscription_start = CURDATE(),
    subscription_end = DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
    billing_email = contact_email
WHERE subscription_plan IS NULL;
