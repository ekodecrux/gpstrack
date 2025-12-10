const API_BASE = '/api';
let map, marker, trackingInterval, currentPosition;
let driverData = null;
let activeTripId = null;

function init() {
  const app = document.getElementById('driver-app');
  const storedDriver = localStorage.getItem('driver');
  if (storedDriver) {
    driverData = JSON.parse(storedDriver);
    showDashboard(app);
  } else {
    showLogin(app);
  }
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
      body: JSON.stringify({ phone, pin })
    });
    const data = await response.json();
    
    if (data.success) {
      driverData = data.driver;
      localStorage.setItem('driver', JSON.stringify(driverData));
      init();
    } else {
      errorDiv.textContent = data.error || 'Invalid credentials';
      errorDiv.classList.remove('hidden');
    }
  } catch (error) {
    errorDiv.textContent = 'Login failed';
    errorDiv.classList.remove('hidden');
  }
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
          <h2 class="text-xl font-bold mb-4"><i class="fas fa-route mr-2"></i> Trip Management</h2>
          <div id="trip-controls"></div>
        </div>
        <div id="students-section" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
          <h2 class="text-xl font-bold mb-4"><i class="fas fa-users mr-2"></i> Students</h2>
          <div id="students-list"></div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-4"><i class="fas fa-map-marked-alt mr-2"></i> Location</h2>
          <div id="map" style="height: 400px; border-radius: 8px;"></div>
          <div id="location-info" class="mt-4 text-sm text-gray-600"></div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold mb-4"><i class="fas fa-info-circle mr-2"></i> Status</h2>
          <div id="status-panel" class="space-y-2 text-sm"></div>
        </div>
      </div>
    </div>
  `;
  initMap();
  loadTripStatus();
}

function initMap() {
  map = L.map('map').setView([40.7580, -73.9855], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setView([currentPosition.lat, currentPosition.lng], 15);
      marker = L.marker([currentPosition.lat, currentPosition.lng]).addTo(map);
      updateLocationInfo(position);
    });
  }
}

async function loadTripStatus() {
  try {
    const response = await fetch(`${API_BASE}/trips.php?action=driver-active&id=${driverData.id}`);
    const trip = await response.json();
    const tripControls = document.getElementById('trip-controls');
    
    if (trip && trip.id) {
      activeTripId = trip.id;
      tripControls.innerHTML = `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-green-800"><i class="fas fa-check-circle mr-2"></i> Trip Active</p>
              <p class="text-sm text-green-600">Route: ${trip.route_number} - ${trip.route_name}</p>
            </div>
            <button onclick="endTrip()" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
              <i class="fas fa-stop mr-2"></i> End Trip
            </button>
          </div>
        </div>
      `;
      startLocationTracking();
      loadStudentsList();
    } else {
      tripControls.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-600 mb-4">No active trip</p>
          <button onclick="showStartTripForm()" class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600">
            <i class="fas fa-play mr-2"></i> Start Trip
          </button>
        </div>
      `;
      document.getElementById('students-section').classList.add('hidden');
    }
  } catch (error) {
    console.error(error);
  }
}

function showStartTripForm() {
  document.getElementById('trip-controls').innerHTML = `
    <form id="start-trip-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
        <select id="trip-type" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>
      <div class="flex gap-4">
        <button type="submit" class="flex-1 bg-green-500 text-white py-2 rounded-lg">Start</button>
        <button type="button" onclick="loadTripStatus()" class="flex-1 bg-gray-300 py-2 rounded-lg">Cancel</button>
      </div>
    </form>
  `;
  document.getElementById('start-trip-form').addEventListener('submit', startTrip);
}

async function startTrip(e) {
  e.preventDefault();
  try {
    const response = await fetch(`${API_BASE}/trips.php?action=start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driver_id: driverData.id,
        route_id: driverData.current_route_id,
        trip_type: document.getElementById('trip-type').value
      })
    });
    const data = await response.json();
    if (data.success) {
      activeTripId = data.id;
      loadTripStatus();
    }
  } catch (error) {
    console.error(error);
  }
}

async function endTrip() {
  if (!confirm('End this trip?')) return;
  try {
    await fetch(`${API_BASE}/trips.php?action=end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip_id: activeTripId, total_distance: 0 })
    });
    stopLocationTracking();
    activeTripId = null;
    loadTripStatus();
  } catch (error) {
    console.error(error);
  }
}

async function loadStudentsList() {
  if (!activeTripId) return;
  try {
    const response = await fetch(`${API_BASE}/pickup-dropoff.php?action=driver-students-pending&id=${activeTripId}`);
    const data = await response.json();
    const studentsSection = document.getElementById('students-section');
    const studentsList = document.getElementById('students-list');
    
    if (!data.students || data.students.length === 0) {
      studentsSection.classList.add('hidden');
      return;
    }
    
    studentsSection.classList.remove('hidden');
    studentsList.innerHTML = data.students.map(s => `
      <div class="border rounded-lg p-4 mb-3 ${s.is_absent ? 'bg-gray-100 opacity-60' : ''}">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold">${s.student_name} ${s.is_absent ? '<span class="bg-gray-500 text-white text-xs px-2 py-1 rounded ml-2">ABSENT</span>' : ''}</h3>
            <p class="text-sm text-gray-600">${s.address || 'No address'}</p>
          </div>
          <div class="flex flex-col gap-2">
            ${!s.is_absent ? `
              ${!s.pickup_status ? `
                <button onclick="confirmPickup(${s.id}, '${s.student_name}')" 
                  class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Pickup</button>
                <button onclick="reportNotPresent(${s.id}, '${s.student_name}')" 
                  class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Not Present</button>
              ` : `
                ${s.pickup_status === 'picked_up' && !s.dropoff_status ? `
                  <span class="bg-green-100 text-green-800 px-4 py-2 rounded text-sm">Picked Up</span>
                  <button onclick="confirmDropoff(${s.id}, '${s.student_name}')" 
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Drop Off</button>
                ` : s.dropoff_status === 'dropped_off' ? `
                  <span class="bg-blue-100 text-blue-800 px-4 py-2 rounded text-sm">Dropped Off</span>
                ` : ''}
              `}
            ` : '<span class="bg-gray-400 text-white px-4 py-2 rounded text-sm">Marked Absent</span>'}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error(error);
  }
}

async function confirmPickup(studentId, name) {
  try {
    const response = await fetch(`${API_BASE}/pickup-dropoff.php?action=driver-confirm-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip_session_id: activeTripId,
        student_id: studentId,
        driver_id: driverData.id,
        latitude: currentPosition?.lat || 0,
        longitude: currentPosition?.lng || 0
      })
    });
    const data = await response.json();
    if (data.success) {
      updateStatusPanel(`${name} picked up`, 'success');
      loadStudentsList();
    }
  } catch (error) {
    updateStatusPanel(`Failed: ${name}`, 'error');
  }
}

async function reportNotPresent(studentId, name) {
  if (!confirm(`Mark ${name} as NOT PRESENT?`)) return;
  try {
    const response = await fetch(`${API_BASE}/pickup-dropoff.php?action=driver-report-not-present`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip_session_id: activeTripId,
        student_id: studentId,
        driver_id: driverData.id,
        latitude: currentPosition?.lat || 0,
        longitude: currentPosition?.lng || 0
      })
    });
    const data = await response.json();
    if (data.success) {
      updateStatusPanel(`${name} not present`, 'info');
      loadStudentsList();
    }
  } catch (error) {
    updateStatusPanel(`Failed: ${name}`, 'error');
  }
}

async function confirmDropoff(studentId, name) {
  try {
    const response = await fetch(`${API_BASE}/pickup-dropoff.php?action=driver-confirm-dropoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip_session_id: activeTripId,
        student_id: studentId,
        driver_id: driverData.id,
        latitude: currentPosition?.lat || 0,
        longitude: currentPosition?.lng || 0
      })
    });
    const data = await response.json();
    if (data.success) {
      updateStatusPanel(`${name} dropped off`, 'success');
      loadStudentsList();
    }
  } catch (error) {
    updateStatusPanel(`Failed: ${name}`, 'error');
  }
}

function startLocationTracking() {
  trackingInterval = setInterval(() => {
    if (navigator.geolocation && activeTripId) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        currentPosition = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (marker) {
          marker.setLatLng([currentPosition.lat, currentPosition.lng]);
          map.panTo([currentPosition.lat, currentPosition.lng]);
        }
        try {
          await fetch(`${API_BASE}/tracking.php?action=update-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driver_id: driverData.id,
              route_id: driverData.current_route_id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speed: position.coords.speed || 0
            })
          });
          updateLocationInfo(position);
          updateStatusPanel('Location updated', 'success');
        } catch (error) {
          updateStatusPanel('Failed to update location', 'error');
        }
      });
    }
  }, 30000);
}

function stopLocationTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

function updateLocationInfo(position) {
  document.getElementById('location-info').innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div><strong>Lat:</strong> ${position.coords.latitude.toFixed(6)}</div>
      <div><strong>Lng:</strong> ${position.coords.longitude.toFixed(6)}</div>
      <div><strong>Speed:</strong> ${Math.round(position.coords.speed || 0)} km/h</div>
      <div><strong>Accuracy:</strong> ${Math.round(position.coords.accuracy)} m</div>
    </div>
  `;
}

function updateStatusPanel(message, type = 'info') {
  const colors = { success: 'text-green-600', error: 'text-red-600', info: 'text-blue-600' };
  const entry = document.createElement('div');
  entry.className = `${colors[type]} flex items-center`;
  entry.innerHTML = `<i class="fas fa-circle text-xs mr-2"></i><span>${message}</span>`;
  const panel = document.getElementById('status-panel');
  panel.prepend(entry);
  while (panel.children.length > 10) panel.removeChild(panel.lastChild);
}

function logout() {
  if (confirm('Logout?')) {
    stopLocationTracking();
    localStorage.removeItem('driver');
    window.location.href = '/';
  }
}

init();
