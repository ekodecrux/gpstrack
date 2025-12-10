<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;

$db = getDB();

switch($action) {
    case 'start':
        validateRequired($input, ['driver_id', 'route_id', 'trip_type']);
        $stmt = $db->prepare("
            INSERT INTO trip_sessions (driver_id, route_id, trip_type, status)
            VALUES (?, ?, ?, 'active')
        ");
        $stmt->execute([$input['driver_id'], $input['route_id'], $input['trip_type']]);
        $tripId = $db->lastInsertId();
        
        $db->prepare("UPDATE drivers SET status = 'on_duty' WHERE id = ?")->execute([$input['driver_id']]);
        
        sendJSON(['success' => true, 'id' => $tripId]);
        break;
        
    case 'end':
        validateRequired($input, ['trip_id']);
        $stmt = $db->prepare("
            UPDATE trip_sessions 
            SET end_time = CURRENT_TIMESTAMP, status = 'completed', total_distance = ?
            WHERE id = ?
        ");
        $stmt->execute([$input['total_distance'] ?? 0, $input['trip_id']]);
        
        $stmt = $db->prepare("SELECT driver_id FROM trip_sessions WHERE id = ?");
        $stmt->execute([$input['trip_id']]);
        $trip = $stmt->fetch();
        
        if ($trip) {
            $db->prepare("UPDATE drivers SET status = 'off_duty' WHERE id = ?")->execute([$trip['driver_id']]);
        }
        
        sendJSON(['success' => true]);
        break;
        
    case 'driver-active':
        if (!$id) sendError('Driver ID required');
        $stmt = $db->prepare("
            SELECT t.*, r.route_number, r.route_name, r.bus_number
            FROM trip_sessions t
            JOIN routes r ON t.route_id = r.id
            WHERE t.driver_id = ? AND t.status = 'active'
            ORDER BY t.start_time DESC
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $trip = $stmt->fetch();
        sendJSON($trip ?: null);
        break;
        
    case 'route-active':
        if (!$id) sendError('Route ID required');
        $stmt = $db->prepare("
            SELECT t.*, d.driver_name, r.route_number, r.route_name
            FROM trip_sessions t
            JOIN drivers d ON t.driver_id = d.id
            JOIN routes r ON t.route_id = r.id
            WHERE t.route_id = ? AND t.status = 'active'
            ORDER BY t.start_time DESC
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $trip = $stmt->fetch();
        sendJSON($trip ?: null);
        break;
        
    default:
        sendError('Invalid action');
}
?>
