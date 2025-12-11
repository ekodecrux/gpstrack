const API_BASE = '/api';
let map, busMarker, refreshInterval;
let parentData = null;
let students = [];
let selectedStudent = null;

function init() {
  const app = document.getElementById('parent-app');
  const storedParent = localStorage.getItem('parent');
  if (storedParent) {
    const data = JSON.parse(storedParent);
    parentData = data.parent;
    students = data.students;
    showDashboard(app);
  } else {
    showLogin(app);
  }
}

function showLogin(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-blue-600 px-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-users text-2xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800">Parent Login</h1>
          <p class="text-gray-600 mt-2">Track your child's bus</p>
        </div>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input type="tel" id="phone" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="+1987654321">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">PIN</label>
            <input type="password" id="pin" required maxlength="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="4-digit PIN">
          </div>
          <div id="error-message" class="text-red-600 text-sm hidden"></div>
          <button type="submit" class="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold">
            <i class="fas fa-sign-in-alt mr-2"></i> Login
          </button>
        </form>
        <div class="mt-4 text-center">
          <a href="/" class="text-green-500 hover:underline text-sm">
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
    const response = await fetch(`${API_BASE}/auth.php?action=parent-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    const data = await response.json();
    
    if (data.success) {
      parentData = data.parent;
      students = data.students;
      localStorage.setItem('parent', JSON.stringify(data));
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
      <div class="bg-green-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">
              <i class="fas fa-bus mr-2"></i> Track Your Child's Bus
            </h1>
            <p class="text-sm opacity-90">${parentData.parent_name}</p>
          </div>
          <button onclick="logout()" class="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100">
            <i class="fas fa-sign-out-alt mr-2"></i> Logout
          </button>
        </div>
      </div>
      <div class="container mx-auto px-4 py-6">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-child mr-2"></i> Select Child
          </h2>
          <div id="student-selector" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
        </div>
        <div id="pending-confirmations" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-clipboard-check mr-2"></i> Confirm Dropoff
          </h2>
          <div id="confirmations-list"></div>
        </div>
        <div id="bus-status" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-info-circle mr-2"></i> Bus Status
          </h2>
          <div id="status-content"></div>
        </div>
        <div id="map-container" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-map-marked-alt mr-2"></i> Live Location
          </h2>
          <div id="map" style="height: 400px; border-radius: 8px;"></div>
          <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
            <div id="last-update"></div>
            <button onclick="refreshLocation()" class="text-green-600 hover:text-green-700 font-medium">
              <i class="fas fa-sync-alt mr-1"></i> Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  displayStudents();
  loadPendingConfirmations();
  setInterval(loadPendingConfirmations, 60000);
}

function displayStudents() {
  const selector = document.getElementById('student-selector');
  if (students.length === 0) {
    selector.innerHTML = '<p class="text-gray-600 col-span-full text-center py-4">No students found</p>';
    return;
  }
  selector.innerHTML = students.map(student => `
    <div class="border border-gray-200 rounded-lg p-4 hover:border-green-500 cursor-pointer transition"
         onclick="selectStudent(${student.id})">
      <div class="flex items-center">
        <div class="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mr-4">
          <i class="fas fa-child text-xl"></i>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-gray-800">${student.student_name}</h3>
          <p class="text-sm text-gray-600">Class ${student.class || 'N/A'} - ${student.section || 'N/A'}</p>
          <p class="text-sm text-green-600">
            <i class="fas fa-route mr-1"></i> ${student.route_number || 'No route'}
          </p>
        </div>
      </div>
    </div>
  `).join('');
}

function selectStudent(studentId) {
  selectedStudent = students.find(s => s.id === studentId);
  if (!selectedStudent.route_id) {
    alert('This student is not assigned to any route yet.');
    return;
  }
  document.getElementById('bus-status').classList.remove('hidden');
  document.getElementById('map-container').classList.remove('hidden');
  initMap();
  loadBusLocation();
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(loadBusLocation, 30000);
}

function initMap() {
  if (map) map.remove();
  map = L.map('map').setView([40.7580, -73.9855], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
}

async function loadBusLocation() {
  if (!selectedStudent || !selectedStudent.route_id) return;
  try {
    const response = await fetch(`${API_BASE}/tracking.php?action=route-live&id=${selectedStudent.route_id}`);
    const data = await response.json();
    const statusDiv = document.getElementById('status-content');
    
    if (data.location) {
      if (busMarker) {
        busMarker.setLatLng([data.location.latitude, data.location.longitude]);
      } else {
        busMarker = L.marker([data.location.latitude, data.location.longitude]).addTo(map)
          .bindPopup(`<strong>${data.route.route_name}</strong><br>Driver: ${data.location.driver_name}`);
      }
      map.setView([data.location.latitude, data.location.longitude], 15);
      
      if (data.waypoints && data.waypoints.length > 0) {
        data.waypoints.forEach(wp => {
          L.marker([wp.latitude, wp.longitude]).addTo(map).bindPopup(wp.waypoint_name);
        });
      }
      
      statusDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-bus text-green-600 text-2xl mr-3"></i>
              <div>
                <p class="text-sm text-gray-600">Route</p>
                <p class="font-semibold text-gray-800">${data.route.route_name}</p>
              </div>
            </div>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-tachometer-alt text-blue-600 text-2xl mr-3"></i>
              <div>
                <p class="text-sm text-gray-600">Speed</p>
                <p class="font-semibold text-gray-800">${Math.round(data.location.speed || 0)} km/h</p>
              </div>
            </div>
          </div>
        </div>
      `;
      const lastUpdate = new Date(data.location.timestamp);
      document.getElementById('last-update').innerHTML = `
        <i class="fas fa-clock mr-1"></i> Last updated: ${lastUpdate.toLocaleTimeString()}
      `;
    } else {
      statusDiv.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-circle text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-600">Bus is not currently tracking</p>
        </div>
      `;
    }
  } catch (error) {
    const statusDiv = document.getElementById('status-content');
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-circle text-red-400 text-4xl mb-4"></i>
          <p class="text-red-600">Failed to load bus location</p>
        </div>
      `;
    }
  }
}

function refreshLocation() {
  const btn = event.target.closest('button');
  const icon = btn.querySelector('i');
  icon.classList.add('fa-spin');
  loadBusLocation().finally(() => {
    setTimeout(() => icon.classList.remove('fa-spin'), 500);
  });
}

async function loadPendingConfirmations() {
  if (!parentData) return;
  try {
    const response = await fetch(`${API_BASE}/pickup-dropoff.php?action=parent-pending&parent_id=${parentData.id}`);
    const data = await response.json();
    const section = document.getElementById('pending-confirmations');
    const list = document.getElementById('confirmations-list');
    
    if (!data.pending || data.pending.length === 0) {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    list.innerHTML = data.pending.map(item => {
      const dropoffTime = new Date(item.actual_time);
      const minutesAgo = Math.round((Date.now() - dropoffTime.getTime()) / 60000);
      
      return `
        <div class="border-2 border-orange-300 bg-orange-50 rounded-lg p-4 mb-3">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-800 flex items-center">
                <i class="fas fa-user-graduate mr-2 text-orange-600"></i>
                ${item.student_name}
              </h3>
              <p class="text-sm text-gray-700 mt-1">
                <i class="fas fa-bus mr-1"></i> 
                Dropped off from Route ${item.route_number}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                <i class="fas fa-clock mr-1"></i> 
                ${minutesAgo < 60 ? `${minutesAgo} minutes ago` : dropoffTime.toLocaleTimeString()}
              </p>
              ${item.driver_notes ? `
                <p class="text-xs text-gray-600 mt-2 italic">
                  Driver note: "${item.driver_notes}"
                </p>
              ` : ''}
            </div>
            <div class="flex flex-col gap-2 ml-4">
              <button onclick="confirmDropoffReceived(${item.id}, ${item.student_id}, '${item.student_name}')" 
                class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm whitespace-nowrap">
                <i class="fas fa-check-circle mr-1"></i> Confirm
              </button>
              <button onclick="reportDropoffIssue(${item.id}, ${item.student_id}, '${item.student_name}')" 
                class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm whitespace-nowrap">
                <i class="fas fa-exclamation-circle mr-1"></i> Report Issue
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    section.classList.add('hidden');
  }
}

async function confirmDropoffReceived(logId, studentId, studentName) {
  const notes = prompt(`Confirm ${studentName} was safely received.\n\nOptional note:`);
  if (notes === null) return;
  
  try {
    const response = await fetch(`${API_BASE}/pickup-dropoff.php?action=parent-confirm-dropoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        pickup_dropoff_log_id: logId,
        parent_notes: notes || 'Child received safely'
      })
    });
    const data = await response.json();
    if (data.success) {
      alert(`✓ Confirmed: ${studentName} received safely`);
      loadPendingConfirmations();
    }
  } catch (error) {
    alert('Failed to confirm dropoff');
  }
}

async function reportDropoffIssue(logId, studentId, studentName) {
  const issue = prompt(`Report an issue with ${studentName}'s dropoff.\n\nDescribe the problem:`);
  if (!issue || issue.trim() === '') {
    alert('Please describe the issue');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/pickup-dropoff.php?action=parent-report-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        pickup_dropoff_log_id: logId,
        issue_details: issue,
        parent_notes: issue
      })
    });
    const data = await response.json();
    if (data.success) {
      alert(`Issue reported for ${studentName}. School admin will be notified.`);
      loadPendingConfirmations();
    }
  } catch (error) {
    alert('Failed to report issue');
  }
}

function logout() {
  if (confirm('Logout?')) {
    if (refreshInterval) clearInterval(refreshInterval);
    localStorage.removeItem('parent');
    window.location.href = '/';
  }
}

init();
