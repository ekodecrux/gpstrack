<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$db = getDB();

switch($action) {
    case 'login':
        handleSuperAdminLogin($db);
        break;
    case 'stats':
        getDashboardStats($db);
        break;
    case 'list-schools':
        listSchools($db);
        break;
    case 'create-school':
        createSchool($db);
        break;
    case 'toggle-school-status':
        toggleSchoolStatus($db);
        break;
    default:
        sendError('Invalid action');
}

function handleSuperAdminLogin($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    validateRequired($input, ['username', 'password']);
    
    $stmt = $db->prepare("
        SELECT id, username, full_name, email, phone 
        FROM super_admins 
        WHERE username = ? AND is_active = 1
    ");
    $stmt->execute([$input['username']]);
    $superadmin = $stmt->fetch();
    
    if (!$superadmin) {
        sendError('Invalid credentials', 401);
    }
    
    $stmt = $db->prepare("SELECT password_hash FROM super_admins WHERE id = ?");
    $stmt->execute([$superadmin['id']]);
    $hash = $stmt->fetchColumn();
    
    if (!password_verify($input['password'], $hash)) {
        sendError('Invalid credentials', 401);
    }
    
    $db->prepare("UPDATE super_admins SET last_login = NOW() WHERE id = ?")->execute([$superadmin['id']]);
    
    sendJSON([
        'success' => true,
        'superadmin' => $superadmin
    ]);
}

function getDashboardStats($db) {
    $totalSchools = $db->query("SELECT COUNT(*) FROM schools")->fetchColumn();
    $activeSchools = $db->query("SELECT COUNT(*) FROM schools WHERE is_active = 1")->fetchColumn();
    
    $totalStudents = $db->query("
        SELECT COUNT(*) FROM students s 
        JOIN schools sc ON s.school_id = sc.id 
        WHERE sc.is_active = 1
    ")->fetchColumn();
    
    $plans = [
        'free' => 0,
        'basic' => 10,
        'premium' => 50,
        'enterprise' => 200
    ];
    
    $stmt = $db->query("
        SELECT subscription_plan, COUNT(*) as count 
        FROM schools 
        WHERE is_active = 1 
        GROUP BY subscription_plan
    ");
    $revenue = 0;
    while($row = $stmt->fetch()) {
        $revenue += ($plans[$row['subscription_plan']] ?? 0) * $row['count'];
    }
    
    sendJSON([
        'success' => true,
        'stats' => [
            'total_schools' => $totalSchools,
            'active_schools' => $activeSchools,
            'total_students' => $totalStudents,
            'monthly_revenue' => $revenue
        ]
    ]);
}

function listSchools($db) {
    $stmt = $db->query("
        SELECT 
            s.*,
            (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id) as student_count,
            (SELECT COUNT(*) FROM routes r WHERE r.school_id = s.id) as route_count,
            (SELECT COUNT(*) FROM drivers d WHERE d.school_id = s.id) as driver_count
        FROM schools s
        ORDER BY s.created_at DESC
    ");
    
    $schools = $stmt->fetchAll();
    
    sendJSON([
        'success' => true,
        'schools' => $schools
    ]);
}

function createSchool($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    validateRequired($input, [
        'school_name', 'school_code', 'contact_email',
        'admin_username', 'admin_password', 'admin_name'
    ]);
    
    $db->beginTransaction();
    
    try {
        $maxStudents = [
            'free' => 50,
            'basic' => 100,
            'premium' => 500,
            'enterprise' => 9999
        ];
        
        $plan = $input['subscription_plan'] ?? 'basic';
        $duration = (int)($input['subscription_duration'] ?? 365);
        
        $stmt = $db->prepare("
            INSERT INTO schools (
                school_name, school_code, address, contact_phone, contact_email,
                subscription_plan, subscription_start, subscription_end,
                max_students, max_routes, max_drivers, billing_email
            ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, 50, 50, ?)
        ");
        
        $stmt->execute([
            $input['school_name'],
            $input['school_code'],
            $input['address'] ?? '',
            $input['contact_phone'] ?? '',
            $input['contact_email'],
            $plan,
            $duration,
            $maxStudents[$plan],
            $input['contact_email']
        ]);
        
        $schoolId = $db->lastInsertId();
        
        $passwordHash = password_hash($input['admin_password'], PASSWORD_BCRYPT);
        
        $stmt = $db->prepare("
            INSERT INTO school_admins (
                school_id, username, password_hash, admin_name, email, phone
            ) VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $schoolId,
            $input['admin_username'],
            $passwordHash,
            $input['admin_name'],
            $input['contact_email'],
            $input['contact_phone'] ?? ''
        ]);
        
        $db->commit();
        
        sendJSON([
            'success' => true,
            'school_id' => $schoolId,
            'message' => 'School created successfully'
        ]);
        
    } catch(PDOException $e) {
        $db->rollBack();
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendError('School code or admin username already exists');
        }
        sendError('Failed to create school: ' . $e->getMessage());
    }
}

function toggleSchoolStatus($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    validateRequired($input, ['school_id']);
    
    $stmt = $db->prepare("UPDATE schools SET is_active = NOT is_active WHERE id = ?");
    $stmt->execute([$input['school_id']]);
    
    sendJSON([
        'success' => true,
        'message' => 'School status updated'
    ]);
}
?>
