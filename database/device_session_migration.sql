-- Device Session Management Migration
-- Add device tracking and session management for drivers

USE bus_tracker;

-- Add device session fields to drivers table
ALTER TABLE drivers 
ADD COLUMN current_device_id VARCHAR(255),
ADD COLUMN current_session_token VARCHAR(255),
ADD COLUMN last_login_ip VARCHAR(50),
ADD COLUMN last_login_at TIMESTAMP NULL,
ADD COLUMN device_info TEXT;

-- Create driver_sessions table for complete session tracking
CREATE TABLE IF NOT EXISTS driver_sessions (
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
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  INDEX idx_driver_active (driver_id, is_active),
  INDEX idx_session_token (session_token)
) ENGINE=InnoDB;

-- Create parent_sessions table (for consistency)
CREATE TABLE IF NOT EXISTS parent_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(50),
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
) ENGINE=InnoDB;
