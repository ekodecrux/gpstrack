<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

switch($action) {
    case 'driver-login':
        handleDriverLogin($input);
        break;
    case 'terminate-session':
        terminateExistingSession($input);
        break;
    case 'driver-logout':
        handleDriverLogout($input);
        break;
    case 'parent-login':
        handleParentLogin($input);
        break;
    case 'admin-login':
        handleAdminLogin($input);
        break;
    default:
        sendError('Invalid action');
}

function handleDriverLogin($input) {
    validateRequired($input, ['phone', 'pin']);
    $db = getDB();
    
    $deviceId = $input['device_id'] ?? generateDeviceId();
    $deviceInfo = $input['device_info'] ?? $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
    
    $stmt = $db->prepare("
        SELECT d.*, r.route_number, r.route_name, r.bus_number, s.school_name
        FROM drivers d
        LEFT JOIN routes r ON d.current_route_id = r.id
        LEFT JOIN schools s ON d.school_id = s.id
        WHERE d.phone = ? AND d.pin = ? AND d.status IN ('active', 'on_duty')
    ");
    $stmt->execute([$input['phone'], $input['pin']]);
    $driver = $stmt->fetch();
    
    if (!$driver) {
        sendError('Invalid phone or PIN', 401);
    }
    
    $stmt = $db->prepare("
        SELECT session_token, device_id, device_info, login_at 
        FROM driver_sessions 
        WHERE driver_id = ? AND is_active = 1
        ORDER BY login_at DESC 
        LIMIT 1
    ");
    $stmt->execute([$driver['id']]);
    $activeSession = $stmt->fetch();
    
    if ($activeSession && $activeSession['device_id'] !== $deviceId) {
        sendJSON([
            'success' => false,
            'error' => 'already_logged_in',
            'message' => 'You are already logged in on another device',
            'session_info' => [
                'device_info' => $activeSession['device_info'],
                'login_time' => $activeSession['login_at'],
                'current_device' => $activeSession['device_id']
            ],
            'driver_id' => $driver['id']
        ]);
        return;
    }
    
    $sessionToken = bin2hex(random_bytes(32));
    
    $stmt = $db->prepare("
        INSERT INTO driver_sessions (driver_id, session_token, device_id, device_info, ip_address)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$driver['id'], $sessionToken, $deviceId, $deviceInfo, $ipAddress]);
    
    $stmt = $db->prepare("
        UPDATE drivers 
        SET current_device_id = ?, current_session_token = ?, last_login_ip = ?, last_login_at = NOW(), device_info = ?
        WHERE id = ?
    ");
    $stmt->execute([$deviceId, $sessionToken, $ipAddress, $deviceInfo, $driver['id']]);
    
    unset($driver['pin']);
    $driver['session_token'] = $sessionToken;
    $driver['device_id'] = $deviceId;
    
    sendJSON([
        'success' => true,
        'driver' => $driver,
        'session_token' => $sessionToken
    ]);
}

function terminateExistingSession($input) {
    validateRequired($input, ['driver_id', 'phone', 'pin', 'device_id']);
    $db = getDB();
    
    $stmt = $db->prepare("SELECT id FROM drivers WHERE id = ? AND phone = ? AND pin = ?");
    $stmt->execute([$input['driver_id'], $input['phone'], $input['pin']]);
    if (!$stmt->fetch()) {
        sendError('Invalid credentials', 401);
    }
    
    $db->beginTransaction();
    try {
        $stmt = $db->prepare("
            UPDATE driver_sessions 
            SET is_active = 0, logout_at = NOW(), terminated_by = 'new_login'
            WHERE driver_id = ? AND is_active = 1
        ");
        $stmt->execute([$input['driver_id']]);
        
        $db->commit();
        
        $loginInput = [
            'phone' => $input['phone'],
            'pin' => $input['pin'],
            'device_id' => $input['device_id'],
            'device_info' => $input['device_info'] ?? 'Unknown'
        ];
        handleDriverLogin($loginInput);
        
    } catch(Exception $e) {
        $db->rollBack();
        sendError('Failed to terminate session: ' . $e->getMessage());
    }
}

function handleDriverLogout($input) {
    validateRequired($input, ['session_token']);
    $db = getDB();
    
    $stmt = $db->prepare("
        UPDATE driver_sessions 
        SET is_active = 0, logout_at = NOW(), terminated_by = 'driver'
        WHERE session_token = ? AND is_active = 1
    ");
    $stmt->execute([$input['session_token']]);
    
    sendJSON(['success' => true, 'message' => 'Logged out successfully']);
}

function handleParentLogin($input) {
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
}

function handleAdminLogin($input) {
    validateRequired($input, ['username', 'password']);
    $db = getDB();
    
    $stmt = $db->prepare("SELECT * FROM school_admins WHERE username = ? AND is_active = 1");
    $stmt->execute([$input['username']]);
    $admin = $stmt->fetch();
    
    if ($admin && password_verify($input['password'], $admin['password_hash'])) {
        unset($admin['password_hash']);
        sendJSON(['success' => true, 'admin' => $admin]);
    } else {
        sendError('Invalid credentials', 401);
    }
}

function generateDeviceId() {
    return md5($_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR'] . time());
}
?>
