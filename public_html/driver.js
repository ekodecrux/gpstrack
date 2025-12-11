const API_BASE = '/api';
let map, marker, trackingInterval, currentPosition;
let driverData = null;
let activeTripId = null;
let deviceId = null;
let sessionToken = null;

function init() {
  deviceId = getDeviceId();
  const app = document.getElementById('driver-app');
  const stored = localStorage.getItem('driver');
  
  if (stored) {
    const data = JSON.parse(stored);
    driverData = data.driver;
    sessionToken = data.session_token;
    showDashboard(app);
  } else {
    showLogin(app);
  }
}

function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('device_id', id);
  }
  return id;
}

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`
  };
}

function showLogin(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-id-card text-2xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800">Driver Login</h1>
          <p class="text-gray-600 mt-2">Enter your credentials</p>
        </div>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input type="tel" id="phone" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+1234567890">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">PIN</label>
            <input type="password" id="pin" required maxlength="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="4-digit PIN">
          </div>
          <div id="error-message" class="text-red-600 text-sm hidden"></div>
          <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition font-semibold">
            <i class="fas fa-sign-in-alt mr-2"></i> Login
          </button>
        </form>
        <div class="mt-4 text-center">
          <a href="/" class="text-blue-500 hover:underline text-sm">
            <i class="fas fa-home mr-1"></i> Back to Home
          </a>
        </div>
      </div>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('phone').value;
  const pin = document.getElementById('pin').value;
  const errorDiv = document.getElementById('error-message');
  
  try {
    const response = await fetch(`${API_BASE}/auth.php?action=driver-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        pin,
        device_id: deviceId,
        device_info: JSON.stringify(getDeviceInfo())
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      driverData = data.driver;
      sessionToken = data.session_token;
      localStorage.setItem('driver', JSON.stringify(data));
      init();
    } else if (data.error === 'already_logged_in') {
      showSessionConflictDialog(phone, pin, data);
    } else {
      errorDiv.textContent = data.error || data.message || 'Invalid credentials';
      errorDiv.classList.remove('hidden');
    }
  } catch (error) {
    errorDiv.textContent = 'Login failed. Please try again.';
    errorDiv.classList.remove('hidden');
  }
}

function showSessionConflictDialog(phone, pin, conflictData) {
  const app = document.getElementById('driver-app');
  const sessionTime = new Date(conflictData.session_info.login_time).toLocaleString();
  
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600 px-4">
      <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="bg-red-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-exclamation-triangle text-3xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">Already Logged In</h1>
          <p class="text-gray-600">Your account is active on another device</p>
        </div>
        
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-info-circle text-yellow-400"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                <strong>Active Session Details:</strong><br>
                Last login: ${sessionTime}<br>
                Device: ${conflictData.session_info.device_info || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
        
        <div class="space-y-4">
          <button onclick="terminateAndLogin('${phone}', '${pin}', ${conflictData.driver_id})" 
            class="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold">
            <i class="fas fa-power-off mr-2"></i> Terminate Other Session & Login Here
          </button>
          <button onclick="cancelLogin()" 
            class="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
            <i class="fas fa-times mr-2"></i> Cancel
          </button>
        </div>
        
        <div class="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-800">
          <i class="fas fa-shield-alt mr-1"></i> 
          For security, only one active session is allowed per driver account.
        </div>
      </div>
    </div>
  `;
}

async function terminateAndLogin(phone, pin, driverId) {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loadingDiv.innerHTML = `
    <div class="bg-white rounded-lg p-6 text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-3"></i>
      <p class="text-gray-700">Terminating other session...</p>
    </div>
  `;
  document.body.appendChild(loadingDiv);
  
  try {
    const response = await fetch(`${API_BASE}/auth.php?action=terminate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driver_id: driverId,
        phone,
        pin,
        device_id: deviceId,
        device_info: JSON.stringify(getDeviceInfo())
      })
    });
    
    const data = await response.json();
    document.body.removeChild(loadingDiv);
    
    if (data.success) {
      driverData = data.driver;
      sessionToken = data.session_token;
      localStorage.setItem('driver', JSON.stringify(data));
      init();
    } else {
      alert('Failed to terminate session: ' + (data.error || 'Unknown error'));
      cancelLogin();
    }
  } catch (error) {
    document.body.removeChild(loadingDiv);
    alert('Failed to terminate session. Please try again.');
    cancelLogin();
  }
}

function cancelLogin() {
  localStorage.removeItem('driver');
  init();
}

function showDashboard(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <div class="bg-blue-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">
              <i class="fas fa-bus mr-2"></i> Driver Dashboard
            </h1>
            <p class="text-sm opacity-90">${driverData.driver_name}</p>
          </div>
          <button onclick="logout()" class="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100">
            <i class="fas fa-sign-out-alt mr-2"></i> Logout
          </button>
        </div>
      </div>
      
      <div class="container mx-auto px-4 py-6">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-route mr-2"></i> Your Route
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">Route Number</p>
              <p class="text-xl font-bold text-blue-600">${driverData.route_number || 'Not Assigned'}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">Bus Number</p>
              <p class="text-xl font-bold text-green-600">${driverData.bus_number || 'N/A'}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">Status</p>
              <p class="text-xl font-bold text-purple-600">${driverData.status}</p>
            </div>
          </div>
        </div>
        
        <div id="trip-section" class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-clipboard-list mr-2"></i> Trip Management
          </h2>
          <div id="trip-status">
            <p class="text-gray-500 text-center py-8">Loading...</p>
          </div>
        </div>
        
        <div id="map-section" class="bg-white rounded-lg shadow-md p-6 hidden">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-map-marked-alt mr-2"></i> Live Tracking
          </h2>
          <div id="map" style="height: 400px; border-radius: 8px;"></div>
          <div class="mt-4 flex justify-between">
            <button onclick="startTracking()" id="start-tracking-btn" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
              <i class="fas fa-play mr-2"></i> Start Tracking
            </button>
            <button onclick="stopTracking()" id="stop-tracking-btn" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 hidden">
              <i class="fas fa-stop mr-2"></i> Stop Tracking
            </button>
          </div>
        </div>
        
        <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-600 mr-2"></i>
            <span class="text-sm text-green-800">
              Session active on this device • Device ID: ${deviceId.substr(0, 12)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  loadTripStatus();
}

async function loadTripStatus() {
  const statusDiv = document.getElementById('trip-status');
  statusDiv.innerHTML = '<p class="text-center py-4">Loading trip status...</p>';
}

function startTracking() {
  document.getElementById('start-tracking-btn').classList.add('hidden');
  document.getElementById('stop-tracking-btn').classList.remove('hidden');
  alert('GPS tracking started');
}

function stopTracking() {
  document.getElementById('stop-tracking-btn').classList.add('hidden');
  document.getElementById('start-tracking-btn').classList.remove('hidden');
  alert('GPS tracking stopped');
}

async function logout() {
  if (!confirm('Are you sure you want to logout?')) return;
  
  try {
    await fetch(`${API_BASE}/auth.php?action=driver-logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: sessionToken })
    });
  } catch (error) {
    // Continue with logout even if API call fails
  }
  
  localStorage.removeItem('driver');
  window.location.href = '/';
}

init();
