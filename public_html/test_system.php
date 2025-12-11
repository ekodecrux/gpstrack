<?php
/**
 * SYSTEM DIAGNOSTIC TEST PAGE
 * Access this file at: https://yourdomain.com/test_system.php
 * This will show what's wrong with your setup
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bus Tracker - System Diagnostic</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .section {
            margin: 20px 0;
            padding: 20px;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .success {
            border-left-color: #28a745;
            background: #d4edda;
            color: #155724;
        }
        .error {
            border-left-color: #dc3545;
            background: #f8d7da;
            color: #721c24;
        }
        .warning {
            border-left-color: #ffc107;
            background: #fff3cd;
            color: #856404;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #667eea;
            color: white;
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-success { background: #28a745; color: white; }
        .badge-error { background: #dc3545; color: white; }
        .badge-warning { background: #ffc107; color: black; }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .copy-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        .copy-btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
<div class="container">
    <h1>🚨 Bus Tracker System Diagnostic</h1>
    <p>This page checks your entire setup and tells you what's wrong.</p>
    
    <?php
    $errors = [];
    $warnings = [];
    $success = [];
    
    // ============================================
    // TEST 1: PHP Version
    // ============================================
    echo '<div class="section">';
    echo '<h2>1️⃣ PHP Version Check</h2>';
    $phpVersion = phpversion();
    if (version_compare($phpVersion, '7.4.0', '>=')) {
        echo '<div class="badge badge-success">✓ PASS</div> ';
        echo "PHP Version: <strong>$phpVersion</strong> (Required: 7.4+)";
        $success[] = 'PHP version is compatible';
    } else {
        echo '<div class="badge badge-error">✗ FAIL</div> ';
        echo "PHP Version: <strong>$phpVersion</strong> (Required: 7.4+)";
        $errors[] = "PHP version too old. Need 7.4 or higher.";
    }
    echo '</div>';
    
    // ============================================
    // TEST 2: Required PHP Extensions
    // ============================================
    echo '<div class="section">';
    echo '<h2>2️⃣ Required PHP Extensions</h2>';
    $required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
    $all_extensions_ok = true;
    
    echo '<table>';
    echo '<tr><th>Extension</th><th>Status</th></tr>';
    foreach ($required_extensions as $ext) {
        $loaded = extension_loaded($ext);
        echo '<tr><td>' . $ext . '</td><td>';
        if ($loaded) {
            echo '<span class="badge badge-success">Loaded</span>';
        } else {
            echo '<span class="badge badge-error">Missing</span>';
            $errors[] = "PHP extension '$ext' is not loaded";
            $all_extensions_ok = false;
        }
        echo '</td></tr>';
    }
    echo '</table>';
    
    if ($all_extensions_ok) {
        $success[] = 'All required PHP extensions are loaded';
    }
    echo '</div>';
    
    // ============================================
    // TEST 3: Config File Check
    // ============================================
    echo '<div class="section">';
    echo '<h2>3️⃣ Configuration File</h2>';
    $config_file = '../api/config.php';
    
    if (file_exists($config_file)) {
        echo '<div class="badge badge-success">✓ FOUND</div> ';
        echo "Config file exists at: <code>$config_file</code><br>";
        
        require_once $config_file;
        
        echo '<strong>Current Settings:</strong><br>';
        echo '<table>';
        echo '<tr><th>Setting</th><th>Value</th></tr>';
        echo '<tr><td>DB_HOST</td><td>' . DB_HOST . '</td></tr>';
        echo '<tr><td>DB_NAME</td><td>' . DB_NAME . '</td></tr>';
        echo '<tr><td>DB_USER</td><td>' . DB_USER . '</td></tr>';
        echo '<tr><td>DB_PASS</td><td>' . (DB_PASS ? '****** (hidden)' : '<span class="badge badge-error">EMPTY!</span>') . '</td></tr>';
        echo '</table>';
        
        if (DB_USER === 'your_db_username' || DB_PASS === 'your_db_password') {
            $errors[] = 'Database credentials not configured in config.php';
            echo '<div class="badge badge-error">✗ NOT CONFIGURED</div> ';
            echo '<strong>You need to edit api/config.php with your actual database credentials!</strong>';
        } else {
            $success[] = 'Config file has custom credentials (looks good)';
        }
    } else {
        echo '<div class="badge badge-error">✗ MISSING</div> ';
        echo "Config file not found at: <code>$config_file</code>";
        $errors[] = 'Config file missing';
    }
    echo '</div>';
    
    // ============================================
    // TEST 4: Database Connection
    // ============================================
    echo '<div class="section">';
    echo '<h2>4️⃣ Database Connection</h2>';
    
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        echo '<div class="badge badge-success">✓ CONNECTED</div> ';
        echo '<strong>Successfully connected to database: ' . DB_NAME . '</strong><br>';
        $success[] = 'Database connection successful';
        
        // Check tables
        echo '<br><strong>Database Tables:</strong><br>';
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $required_tables = ['drivers', 'parents', 'school_admins', 'super_admins', 'routes', 'schools', 'driver_sessions', 'parent_sessions'];
        
        if (count($tables) === 0) {
            echo '<div class="badge badge-error">✗ NO TABLES</div> ';
            echo '<strong>Database is empty! You need to import the SQL files.</strong><br>';
            $errors[] = 'Database has no tables - import schema.sql, super_admin_migration.sql, device_session_migration.sql, seed_working.sql';
        } else {
            echo '<div class="badge badge-success">Found ' . count($tables) . ' tables</div><br>';
            
            echo '<details><summary>Show all tables</summary>';
            echo '<ul>';
            foreach ($tables as $table) {
                echo '<li>' . $table . '</li>';
            }
            echo '</ul></details>';
            
            // Check for missing required tables
            $missing_tables = array_diff($required_tables, $tables);
            if (!empty($missing_tables)) {
                echo '<br><div class="badge badge-warning">⚠ WARNING</div> ';
                echo '<strong>Missing tables:</strong> ' . implode(', ', $missing_tables);
                $warnings[] = 'Some tables are missing. Re-import SQL files.';
            } else {
                $success[] = 'All required tables exist';
            }
        }
        
    } catch (PDOException $e) {
        echo '<div class="badge badge-error">✗ CONNECTION FAILED</div> ';
        echo '<strong>Error:</strong> ' . $e->getMessage() . '<br>';
        $errors[] = 'Cannot connect to database: ' . $e->getMessage();
    }
    echo '</div>';
    
    // ============================================
    // TEST 5: Check Test Data
    // ============================================
    if (isset($pdo)) {
        echo '<div class="section">';
        echo '<h2>5️⃣ Test Credentials Check</h2>';
        
        try {
            // Check drivers
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM drivers WHERE phone = '+1234567890' AND pin = '1234'");
            $driver_count = $stmt->fetch()['count'];
            
            echo '<strong>Driver Test Account:</strong><br>';
            if ($driver_count > 0) {
                echo '<div class="badge badge-success">✓ EXISTS</div> ';
                echo 'Phone: <code>+1234567890</code>, PIN: <code>1234</code><br>';
                $success[] = 'Driver test account exists';
                
                // Get driver details
                $stmt = $pdo->query("SELECT d.*, r.route_number, r.bus_number FROM drivers d LEFT JOIN routes r ON d.current_route_id = r.id WHERE d.phone = '+1234567890'");
                $driver = $stmt->fetch();
                
                echo '<table>';
                echo '<tr><th>Field</th><th>Value</th></tr>';
                echo '<tr><td>Name</td><td>' . $driver['driver_name'] . '</td></tr>';
                echo '<tr><td>Phone</td><td>' . $driver['phone'] . '</td></tr>';
                echo '<tr><td>PIN</td><td>' . $driver['pin'] . '</td></tr>';
                echo '<tr><td>Status</td><td><span class="badge badge-' . ($driver['status'] === 'active' ? 'success' : 'warning') . '">' . $driver['status'] . '</span></td></tr>';
                echo '<tr><td>Route</td><td>' . ($driver['route_number'] ?? 'Not Assigned') . '</td></tr>';
                echo '<tr><td>Bus</td><td>' . ($driver['bus_number'] ?? 'N/A') . '</td></tr>';
                echo '</table>';
            } else {
                echo '<div class="badge badge-error">✗ MISSING</div> ';
                echo '<strong>Test driver account not found!</strong><br>';
                echo 'You need to import <code>seed_working.sql</code> or <code>fix_credentials.sql</code>';
                $errors[] = 'Test driver account missing - import seed data';
            }
            
            echo '<br><strong>Parent Test Account:</strong><br>';
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM parents WHERE phone = '+1987654321' AND pin = '5678'");
            $parent_count = $stmt->fetch()['count'];
            
            if ($parent_count > 0) {
                echo '<div class="badge badge-success">✓ EXISTS</div> ';
                echo 'Phone: <code>+1987654321</code>, PIN: <code>5678</code><br>';
                $success[] = 'Parent test account exists';
            } else {
                echo '<div class="badge badge-error">✗ MISSING</div> ';
                echo '<strong>Test parent account not found!</strong><br>';
                $errors[] = 'Test parent account missing - import seed data';
            }
            
            echo '<br><strong>School Admin Test Account:</strong><br>';
            $stmt = $pdo->query("SELECT * FROM school_admins WHERE username = 'admin' LIMIT 1");
            $admin = $stmt->fetch();
            
            if ($admin) {
                echo '<div class="badge badge-success">✓ EXISTS</div> ';
                echo 'Username: <code>admin</code>, Password: <code>password</code><br>';
                $success[] = 'School admin test account exists';
            } else {
                echo '<div class="badge badge-error">✗ MISSING</div> ';
                echo '<strong>Test admin account not found!</strong><br>';
                $errors[] = 'Test admin account missing - import seed data';
            }
            
            echo '<br><strong>Super Admin Test Account:</strong><br>';
            $stmt = $pdo->query("SELECT * FROM super_admins WHERE username = 'superadmin' LIMIT 1");
            $superadmin = $stmt->fetch();
            
            if ($superadmin) {
                echo '<div class="badge badge-success">✓ EXISTS</div> ';
                echo 'Username: <code>superadmin</code>, Password: <code>password</code><br>';
                $success[] = 'Super admin test account exists';
            } else {
                echo '<div class="badge badge-error">✗ MISSING</div> ';
                echo '<strong>Test super admin account not found!</strong><br>';
                $errors[] = 'Test super admin account missing - import seed data';
            }
            
        } catch (PDOException $e) {
            echo '<div class="badge badge-error">✗ ERROR</div> ';
            echo 'Error checking test data: ' . $e->getMessage();
        }
        echo '</div>';
    }
    
    // ============================================
    // TEST 6: API Endpoint Check
    // ============================================
    echo '<div class="section">';
    echo '<h2>6️⃣ API Endpoint Check</h2>';
    
    $api_file = '../api/auth.php';
    if (file_exists($api_file)) {
        echo '<div class="badge badge-success">✓ FOUND</div> ';
        echo "API file exists at: <code>$api_file</code><br>";
        echo '<strong>File size:</strong> ' . filesize($api_file) . ' bytes<br>';
        $success[] = 'API file exists';
    } else {
        echo '<div class="badge badge-error">✗ MISSING</div> ';
        echo "API file not found at: <code>$api_file</code>";
        $errors[] = 'API file missing - upload api/auth.php';
    }
    echo '</div>';
    
    // ============================================
    // SUMMARY
    // ============================================
    echo '<div class="section ' . (empty($errors) ? 'success' : 'error') . '">';
    echo '<h2>📊 Summary</h2>';
    
    if (empty($errors)) {
        echo '<h3 style="color: #28a745;">✅ ALL TESTS PASSED!</h3>';
        echo '<p>Your system is properly configured. You should be able to login now:</p>';
        echo '<ul>';
        echo '<li><strong>Driver:</strong> <a href="driver.html">driver.html</a> - Phone: +1234567890, PIN: 1234</li>';
        echo '<li><strong>Parent:</strong> <a href="parent.html">parent.html</a> - Phone: +1987654321, PIN: 5678</li>';
        echo '<li><strong>School Admin:</strong> <a href="admin.html">admin.html</a> - admin/password</li>';
        echo '<li><strong>Super Admin:</strong> <a href="superadmin.html">superadmin.html</a> - superadmin/password</li>';
        echo '</ul>';
    } else {
        echo '<h3 style="color: #dc3545;">❌ ISSUES FOUND (' . count($errors) . ')</h3>';
        echo '<p><strong>You need to fix these issues:</strong></p>';
        echo '<ol>';
        foreach ($errors as $error) {
            echo '<li>' . $error . '</li>';
        }
        echo '</ol>';
        
        echo '<h4>🔧 Quick Fix Steps:</h4>';
        echo '<ol>';
        
        if (in_array('Database has no tables - import schema.sql, super_admin_migration.sql, device_session_migration.sql, seed_working.sql', $errors)) {
            echo '<li><strong>Import Database Tables:</strong><br>';
            echo 'Go to phpMyAdmin and import these files in order:<br>';
            echo '<code>schema.sql</code> → <code>super_admin_migration.sql</code> → <code>device_session_migration.sql</code> → <code>seed_working.sql</code></li>';
        }
        
        if (strpos(implode(' ', $errors), 'credentials not configured') !== false) {
            echo '<li><strong>Update Database Credentials:</strong><br>';
            echo 'Edit <code>api/config.php</code> with your actual database username and password</li>';
        }
        
        if (strpos(implode(' ', $errors), 'test account missing') !== false) {
            echo '<li><strong>Import Test Data:</strong><br>';
            echo 'In phpMyAdmin, import <code>fix_credentials.sql</code> to add test accounts</li>';
        }
        
        echo '<li><strong>Refresh this page</strong> after making changes to verify fixes</li>';
        echo '</ol>';
    }
    
    if (!empty($warnings)) {
        echo '<h4 style="color: #ffc107;">⚠ Warnings (' . count($warnings) . '):</h4>';
        echo '<ul>';
        foreach ($warnings as $warning) {
            echo '<li>' . $warning . '</li>';
        }
        echo '</ul>';
    }
    
    echo '</div>';
    
    // ============================================
    // SQL FIX COMMAND
    // ============================================
    if (!empty($errors) && isset($pdo)) {
        echo '<div class="section warning">';
        echo '<h2>💊 Quick Fix SQL Command</h2>';
        echo '<p>Run this in phpMyAdmin SQL tab to fix test credentials:</p>';
        echo '<button class="copy-btn" onclick="copySQL()">Copy SQL</button>';
        echo '<pre id="sqlCommand">';
        echo file_get_contents('../database/fix_credentials.sql');
        echo '</pre>';
        echo '</div>';
    }
    ?>
    
    <script>
    function copySQL() {
        const sql = document.getElementById('sqlCommand').textContent;
        navigator.clipboard.writeText(sql).then(() => {
            alert('SQL copied to clipboard! Paste it in phpMyAdmin SQL tab.');
        });
    }
    </script>
    
    <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
        <p><strong>Need help?</strong></p>
        <p>GitHub: <a href="https://github.com/ekodecrux/gpstrack" target="_blank">ekodecrux/gpstrack</a></p>
        <p>Documentation: See <code>FIX_CREDENTIALS_NOW.md</code></p>
    </div>
</div>
</body>
</html>
