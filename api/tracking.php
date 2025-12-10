<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;

$db = getDB();

switch($action) {
    case 'update-location':
        validateRequired($input, ['driver_id', 'route_id', 'latitude', 'longitude']);
        $stmt = $db->prepare("
            INSERT INTO location_tracking (driver_id, route_id, latitude, longitude, speed, heading, accuracy)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['driver_id'],
            $input['route_id'],
            $input['latitude'],
            $input['longitude'],
            $input['speed'] ?? 0,
            $input['heading'] ?? null,
            $input['accuracy'] ?? null
        ]);
        sendJSON(['success' => true]);
        break;
        
    case 'route-live':
        if (!$id) sendError('Route ID required');
        $stmt = $db->prepare("
            SELECT lt.*, d.driver_name, r.route_number, r.route_name,
                   t.id as trip_id, t.trip_type, t.start_time
            FROM location_tracking lt
            JOIN drivers d ON lt.driver_id = d.id
            JOIN routes r ON lt.route_id = r.id
            LEFT JOIN trip_sessions t ON t.driver_id = d.id AND t.route_id = r.id AND t.status = 'active'
            WHERE lt.route_id = ?
            ORDER BY lt.timestamp DESC
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $location = $stmt->fetch();
        
        $response = ['location' => $location];
        
        if ($location) {
            $stmt = $db->prepare("
                SELECT * FROM route_waypoints 
                WHERE route_id = ? 
                ORDER BY waypoint_order
            ");
            $stmt->execute([$id]);
            $response['waypoints'] = $stmt->fetchAll();
            
            $stmt = $db->prepare("SELECT * FROM routes WHERE id = ?");
            $stmt->execute([$id]);
            $response['route'] = $stmt->fetch();
            
            $stmt = $db->prepare("
                SELECT * FROM trip_sessions 
                WHERE route_id = ? AND status = 'active' 
                ORDER BY start_time DESC 
                LIMIT 1
            ");
            $stmt->execute([$id]);
            $response['trip'] = $stmt->fetch();
        }
        
        sendJSON($response);
        break;
        
    case 'route-latest':
        if (!$id) sendError('Route ID required');
        $stmt = $db->prepare("
            SELECT * FROM location_tracking 
            WHERE route_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        ");
        $stmt->execute([$id]);
        sendJSON($stmt->fetch() ?: null);
        break;
        
    case 'driver-history':
        if (!$id) sendError('Driver ID required');
        $limit = $_GET['limit'] ?? 100;
        $stmt = $db->prepare("
            SELECT * FROM location_tracking 
            WHERE driver_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        ");
        $stmt->execute([$id, (int)$limit]);
        sendJSON($stmt->fetchAll());
        break;
        
    default:
        sendError('Invalid action');
}
?>
