USE bus_tracker;

INSERT INTO schools (school_name, school_code, address, contact_phone, contact_email) VALUES
('Green Valley School', 'GVS001', '123 Main Street, Springfield', '+1234567890', 'admin@greenvalley.edu'),
('Riverside School', 'RS002', '456 River Road, Lakeside', '+1234567891', 'admin@riverside.edu'),
('Hillside Academy', 'HA003', '789 Hill Avenue, Mountain View', '+1234567892', 'admin@hillside.edu');

INSERT INTO school_admins (school_id, username, password_hash, admin_name, email, phone) VALUES
(1, 'greenvalley_admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Smith', 'john@greenvalley.edu', '+1111111111'),
(2, 'riverside_admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Doe', 'jane@riverside.edu', '+2222222222'),
(3, 'hillside_admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Johnson', 'mike@hillside.edu', '+3333333333');

INSERT INTO routes (school_id, route_number, route_name, bus_number) VALUES
(1, 'R101', 'North Route', 'BUS-101'),
(1, 'R102', 'South Route', 'BUS-102'),
(2, 'R201', 'East Route', 'BUS-201'),
(2, 'R202', 'West Route', 'BUS-202'),
(3, 'R301', 'Central Route', 'BUS-301'),
(3, 'R302', 'Express Route', 'BUS-302');

INSERT INTO drivers (school_id, driver_name, phone, pin, license_number, current_route_id, status) VALUES
(1, 'David Miller', '+1234567890', '1234', 'DL123456', 1, 'active'),
(1, 'Sarah Wilson', '+1234567893', '2345', 'DL234567', 2, 'active'),
(2, 'Robert Brown', '+1234567894', '3456', 'DL345678', 3, 'active'),
(2, 'Emily Davis', '+1234567895', '4567', 'DL456789', 4, 'active'),
(3, 'James Taylor', '+1234567896', '5678', 'DL567890', 5, 'active'),
(3, 'Lisa Anderson', '+1234567897', '6789', 'DL678901', 6, 'active');

INSERT INTO parents (school_id, parent_name, phone, pin, email) VALUES
(1, 'Tom Johnson', '+1987654321', '5678', 'tom@email.com'),
(1, 'Mary Smith', '+1987654322', '6789', 'mary@email.com'),
(2, 'Chris Williams', '+1987654323', '7890', 'chris@email.com'),
(2, 'Anna Martinez', '+1987654324', '8901', 'anna@email.com'),
(3, 'Paul Garcia', '+1987654325', '9012', 'paul@email.com'),
(3, 'Linda Rodriguez', '+1987654326', '0123', 'linda@email.com');

INSERT INTO students (school_id, parent_id, route_id, student_name, class, section, roll_number, pickup_address, dropoff_address) VALUES
(1, 1, 1, 'Sarah Johnson', '5', 'A', '101', '123 Oak Street', 'Green Valley School'),
(1, 1, 1, 'Tommy Johnson', '3', 'B', '102', '123 Oak Street', 'Green Valley School'),
(1, 2, 2, 'Emily Smith', '4', 'A', '201', '456 Pine Avenue', 'Green Valley School'),
(1, 2, 2, 'Michael Smith', '6', 'C', '202', '456 Pine Avenue', 'Green Valley School'),
(2, 3, 3, 'Jessica Williams', '5', 'B', '301', '789 Maple Road', 'Riverside School'),
(2, 3, 3, 'Daniel Williams', '2', 'A', '302', '789 Maple Road', 'Riverside School'),
(2, 4, 4, 'Sofia Martinez', '7', 'A', '401', '321 Cedar Lane', 'Riverside School'),
(2, 4, 4, 'Diego Martinez', '4', 'B', '402', '321 Cedar Lane', 'Riverside School'),
(3, 5, 5, 'Emma Garcia', '6', 'A', '501', '654 Birch Street', 'Hillside Academy'),
(3, 5, 5, 'Lucas Garcia', '3', 'C', '502', '654 Birch Street', 'Hillside Academy'),
(3, 6, 6, 'Olivia Rodriguez', '5', 'B', '601', '987 Elm Drive', 'Hillside Academy'),
(3, 6, 6, 'Noah Rodriguez', '8', 'A', '602', '987 Elm Drive', 'Hillside Academy');
