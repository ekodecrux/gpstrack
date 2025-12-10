<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

switch($action) {
    case 'driver-login':
        validateRequired($input, ['phone', 'pin']);
        $db = getDB();
        $stmt = $db->prepare("
            SELECT d.*, r.route_number, r.route_name, r.bus_number, s.school_name
            FROM drivers d
            LEFT JOIN routes r ON d.current_route_id = r.id
            LEFT JOIN schools s ON d.school_id = s.id
            WHERE d.phone = ? AND d.pin = ? AND d.status IN ('active', 'on_duty')
        ");
        $stmt->execute([$input['phone'], $input['pin']]);
        $driver = $stmt->fetch();
        
        if ($driver) {
            unset($driver['pin']);
            sendJSON(['success' => true, 'driver' => $driver]);
        } else {
            sendError('Invalid phone or PIN', 401);
        }
        break;
        
    case 'parent-login':
        validateRequired($input, ['phone', 'pin']);
        $db = getDB();
        $stmt = $db->prepare("
            SELECT p.*, s.school_name
            FROM parents p
            LEFT JOIN schools s ON p.school_id = s.id
            WHERE p.phone = ? AND p.pin = ?
        ");
        $stmt->execute([$input['phone'], $input['pin']]);
        $parent = $stmt->fetch();
        
        if ($parent) {
            unset($parent['pin']);
            $stmt = $db->prepare("
                SELECT s.*, r.route_number, r.route_name, r.bus_number
                FROM students s
                LEFT JOIN routes r ON s.route_id = r.id
                WHERE s.parent_id = ? AND s.is_active = 1
            ");
            $stmt->execute([$parent['id']]);
            $students = $stmt->fetchAll();
            
            sendJSON(['success' => true, 'parent' => $parent, 'students' => $students]);
        } else {
            sendError('Invalid phone or PIN', 401);
        }
        break;
        
    case 'admin-login':
        validateRequired($input, ['username', 'password']);
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = ? AND is_active = 1");
        $stmt->execute([$input['username']]);
        $admin = $stmt->fetch();
        
        if ($admin && password_verify($input['password'], $admin['password_hash'])) {
            unset($admin['password_hash']);
            sendJSON(['success' => true, 'admin' => $admin]);
        } else {
            sendError('Invalid credentials', 401);
        }
        break;
        
    default:
        sendError('Invalid action');
}
?>
