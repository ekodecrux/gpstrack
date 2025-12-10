<?php
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;

$db = getDB();

switch($action) {
    case 'driver-confirm-pickup':
        validateRequired($input, ['trip_session_id', 'student_id', 'driver_id']);
        $stmt = $db->prepare("
            INSERT INTO student_pickup_dropoff_log 
            (trip_session_id, student_id, route_id, driver_id, pickup_type, 
             driver_status, driver_confirmed_at, driver_notes, 
             driver_location_lat, driver_location_lng, parent_confirmation_status)
            SELECT ?, ?, t.route_id, ?, 'pickup', 
                   'picked_up', CURRENT_TIMESTAMP, ?, ?, ?, 'not_required'
            FROM trip_sessions t
            WHERE t.id = ?
        ");
        $stmt->execute([
            $input['trip_session_id'], $input['student_id'], $input['driver_id'],
            $input['driver_notes'] ?? '', $input['latitude'] ?? null, 
            $input['longitude'] ?? null, $input['trip_session_id']
        ]);
        sendJSON(['success' => true, 'id' => $db->lastInsertId()]);
        break;
        
    case 'driver-report-not-present':
        validateRequired($input, ['trip_session_id', 'student_id', 'driver_id']);
        $stmt = $db->prepare("
            INSERT INTO student_pickup_dropoff_log 
            (trip_session_id, student_id, route_id, driver_id, pickup_type, 
             driver_status, driver_confirmed_at, driver_notes, 
             driver_location_lat, driver_location_lng, parent_confirmation_status)
            SELECT ?, ?, t.route_id, ?, 'pickup', 
                   'not_present', CURRENT_TIMESTAMP, ?, ?, ?, 'not_required'
            FROM trip_sessions t
            WHERE t.id = ?
        ");
        $stmt->execute([
            $input['trip_session_id'], $input['student_id'], $input['driver_id'],
            $input['driver_notes'] ?? 'Student not present', 
            $input['latitude'] ?? null, $input['longitude'] ?? null, 
            $input['trip_session_id']
        ]);
        sendJSON(['success' => true, 'id' => $db->lastInsertId()]);
        break;
        
    case 'driver-confirm-dropoff':
        validateRequired($input, ['trip_session_id', 'student_id', 'driver_id']);
        $stmt = $db->prepare("
            INSERT INTO student_pickup_dropoff_log 
            (trip_session_id, student_id, route_id, driver_id, pickup_type, 
             driver_status, driver_confirmed_at, driver_notes, 
             driver_location_lat, driver_location_lng, parent_confirmation_status)
            SELECT ?, ?, t.route_id, ?, 'dropoff', 
                   'dropped_off', CURRENT_TIMESTAMP, ?, ?, ?, 'pending'
            FROM trip_sessions t
            WHERE t.id = ?
        ");
        $stmt->execute([
            $input['trip_session_id'], $input['student_id'], $input['driver_id'],
            $input['driver_notes'] ?? '', $input['latitude'] ?? null, 
            $input['longitude'] ?? null, $input['trip_session_id']
        ]);
        
        $logId = $db->lastInsertId();
        
        $stmt = $db->prepare("
            INSERT INTO notifications (parent_id, student_id, notification_type, message)
            SELECT s.parent_id, s.id, 'dropoff', 
                   CONCAT('Your child ', s.student_name, ' has been dropped off. Please confirm.')
            FROM students s
            WHERE s.id = ?
        ");
        $stmt->execute([$input['student_id']]);
        
        sendJSON(['success' => true, 'id' => $logId]);
        break;
        
    case 'driver-students-pending':
        if (!$id) sendError('Trip ID required');
        $stmt = $db->prepare("
            SELECT s.*, 
                   COALESCE(sa.absence_date IS NOT NULL, 0) as is_absent,
                   pickup.driver_status as pickup_status,
                   dropoff.driver_status as dropoff_status
            FROM students s
            JOIN trip_sessions t ON s.route_id = t.route_id
            LEFT JOIN student_attendance sa ON s.id = sa.student_id 
                AND sa.absence_date = CURDATE() 
                AND sa.trip_type = t.trip_type
            LEFT JOIN student_pickup_dropoff_log pickup ON s.id = pickup.student_id 
                AND pickup.trip_session_id = t.id 
                AND pickup.pickup_type = 'pickup'
            LEFT JOIN student_pickup_dropoff_log dropoff ON s.id = dropoff.student_id 
                AND dropoff.trip_session_id = t.id 
                AND dropoff.pickup_type = 'dropoff'
            WHERE t.id = ? AND s.is_active = 1
            ORDER BY s.student_name
        ");
        $stmt->execute([$id]);
        sendJSON(['students' => $stmt->fetchAll()]);
        break;
        
    case 'parent-confirm-dropoff':
        validateRequired($input, ['student_id', 'pickup_dropoff_log_id']);
        $stmt = $db->prepare("
            UPDATE student_pickup_dropoff_log 
            SET parent_confirmation_status = 'confirmed',
                parent_confirmed_at = CURRENT_TIMESTAMP,
                parent_notes = ?
            WHERE id = ?
        ");
        $stmt->execute([$input['parent_notes'] ?? 'Child received safely', $input['pickup_dropoff_log_id']]);
        sendJSON(['success' => true]);
        break;
        
    case 'parent-report-issue':
        validateRequired($input, ['student_id', 'pickup_dropoff_log_id', 'issue_details']);
        $stmt = $db->prepare("
            UPDATE student_pickup_dropoff_log 
            SET parent_confirmation_status = 'issue_reported',
                parent_confirmed_at = CURRENT_TIMESTAMP,
                parent_notes = ?
            WHERE id = ?
        ");
        $stmt->execute([$input['parent_notes'] ?? $input['issue_details'], $input['pickup_dropoff_log_id']]);
        
        $stmt = $db->prepare("
            INSERT INTO pickup_dropoff_incidents 
            (pickup_dropoff_log_id, student_id, incident_type, issue_details, parent_notes)
            VALUES (?, ?, 'other', ?, ?)
        ");
        $stmt->execute([
            $input['pickup_dropoff_log_id'], $input['student_id'],
            $input['issue_details'], $input['parent_notes'] ?? ''
        ]);
        
        sendJSON(['success' => true]);
        break;
        
    case 'parent-pending':
        $parentId = $_GET['parent_id'] ?? null;
        if (!$parentId) sendError('Parent ID required');
        
        $stmt = $db->prepare("
            SELECT pd.*, s.student_name, r.route_number, 
                   CONCAT(sl.address, ' (', sl.latitude, ',', sl.longitude, ')') as dropoff_location
            FROM student_pickup_dropoff_log pd
            JOIN students s ON pd.student_id = s.id
            JOIN routes r ON pd.route_id = r.id
            LEFT JOIN student_locations sl ON s.id = sl.student_id AND sl.location_type = 'dropoff'
            WHERE s.parent_id = ? 
              AND pd.pickup_type = 'dropoff'
              AND pd.parent_confirmation_status = 'pending'
              AND pd.driver_status = 'dropped_off'
            ORDER BY pd.actual_time DESC
        ");
        $stmt->execute([$parentId]);
        sendJSON(['pending' => $stmt->fetchAll()]);
        break;
        
    default:
        sendError('Invalid action');
}
?>
