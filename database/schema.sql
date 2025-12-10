CREATE DATABASE IF NOT EXISTS bus_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bus_tracker;

CREATE TABLE schools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_name VARCHAR(255) NOT NULL,
  school_code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE school_admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  admin_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  route_number VARCHAR(50) NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  bus_number VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY unique_route (school_id, route_number)
) ENGINE=InnoDB;

CREATE TABLE route_waypoints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  waypoint_order INT NOT NULL,
  waypoint_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  estimated_arrival_time TIME,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE drivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  driver_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  pin VARCHAR(4) NOT NULL,
  license_number VARCHAR(100),
  current_route_id INT,
  status ENUM('active', 'inactive', 'on_duty', 'off_duty') DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (current_route_id) REFERENCES routes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE parents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  pin VARCHAR(4) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,
  parent_id INT NOT NULL,
  route_id INT,
  student_name VARCHAR(255) NOT NULL,
  class VARCHAR(50),
  section VARCHAR(50),
  roll_number VARCHAR(50),
  pickup_address TEXT,
  dropoff_address TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE student_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  location_type ENUM('pickup', 'dropoff') NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_by INT,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES school_admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE trip_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  route_id INT NOT NULL,
  trip_type ENUM('morning', 'afternoon', 'evening') NOT NULL,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  total_distance DECIMAL(10, 2),
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_active_trips (driver_id, status)
) ENGINE=InnoDB;

CREATE TABLE location_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  route_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  accuracy DECIMAL(8, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_time (route_id, timestamp DESC)
) ENGINE=InnoDB;

CREATE TABLE student_attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  absence_date DATE NOT NULL,
  marked_by INT NOT NULL,
  absence_reason TEXT,
  trip_type ENUM('morning', 'afternoon', 'evening') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES parents(id) ON DELETE CASCADE,
  UNIQUE KEY unique_absence (student_id, absence_date, trip_type)
) ENGINE=InnoDB;

CREATE TABLE driver_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  registration_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES school_admins(id) ON DELETE SET NULL,
  UNIQUE KEY unique_device (driver_id, device_id)
) ENGINE=InnoDB;

CREATE TABLE student_pickup_dropoff_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_session_id INT NOT NULL,
  student_id INT NOT NULL,
  route_id INT NOT NULL,
  driver_id INT NOT NULL,
  pickup_type ENUM('pickup', 'dropoff') NOT NULL,
  actual_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  driver_status ENUM('picked_up', 'dropped_off', 'not_present', 'absent') NOT NULL,
  driver_confirmed_at TIMESTAMP NULL,
  driver_notes TEXT,
  driver_location_lat DECIMAL(10, 8),
  driver_location_lng DECIMAL(11, 8),
  parent_confirmation_status ENUM('pending', 'confirmed', 'issue_reported', 'not_required') DEFAULT 'pending',
  parent_confirmed_at TIMESTAMP NULL,
  parent_notes TEXT,
  FOREIGN KEY (trip_session_id) REFERENCES trip_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  INDEX idx_pending_confirmations (student_id, parent_confirmation_status, actual_time)
) ENGINE=InnoDB;

CREATE TABLE pickup_dropoff_incidents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pickup_dropoff_log_id INT NOT NULL,
  student_id INT NOT NULL,
  incident_type ENUM('not_present', 'late_dropoff', 'location_mismatch', 'unauthorized_person', 'other') NOT NULL,
  issue_details TEXT NOT NULL,
  parent_notes TEXT,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_by INT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP NULL,
  status ENUM('pending', 'investigating', 'resolved', 'closed') DEFAULT 'pending',
  FOREIGN KEY (pickup_dropoff_log_id) REFERENCES student_pickup_dropoff_log(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES school_admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT,
  student_id INT,
  notification_type ENUM('trip_start', 'trip_end', 'near_stop', 'alert', 'absence', 'pickup', 'dropoff') NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_parent_unread (parent_id, is_read, created_at DESC)
) ENGINE=InnoDB;

CREATE TABLE admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO admin_users (username, password_hash, full_name, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'superadmin');
