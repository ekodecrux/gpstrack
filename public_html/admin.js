const API_BASE = '/api';
let adminData = null;

function init() {
  const app = document.getElementById('admin-app');
  const storedAdmin = localStorage.getItem('admin');
  if (storedAdmin) {
    adminData = JSON.parse(storedAdmin);
    showDashboard(app);
  } else {
    showLogin(app);
  }
}

function showLogin(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 px-4">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="bg-purple-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-cog text-2xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800">Admin Login</h1>
          <p class="text-gray-600 mt-2">School Bus Management System</p>
        </div>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" id="username" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="admin">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" id="password" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Password">
          </div>
          <div id="error-message" class="text-red-600 text-sm hidden"></div>
          <button type="submit" class="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition font-semibold">
            <i class="fas fa-sign-in-alt mr-2"></i> Login
          </button>
        </form>
        <div class="mt-4 text-center">
          <a href="/" class="text-purple-500 hover:underline text-sm">
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
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');
  
  try {
    const response = await fetch(`${API_BASE}/auth.php?action=admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    
    if (data.success) {
      adminData = data.admin;
      localStorage.setItem('admin', JSON.stringify(adminData));
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
      <div class="bg-purple-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">
              <i class="fas fa-cog mr-2"></i> Admin Dashboard
            </h1>
            <p class="text-sm opacity-90">${adminData.full_name} (${adminData.role})</p>
          </div>
          <button onclick="logout()" class="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100">
            <i class="fas fa-sign-out-alt mr-2"></i> Logout
          </button>
        </div>
      </div>
      <div class="container mx-auto px-4 py-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="bg-blue-100 p-3 rounded-lg">
                <i class="fas fa-school text-blue-600 text-2xl"></i>
              </div>
              <span class="text-3xl font-bold text-gray-800" id="schools-count">-</span>
            </div>
            <p class="text-gray-600 text-sm">Total Schools</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="bg-green-100 p-3 rounded-lg">
                <i class="fas fa-bus text-green-600 text-2xl"></i>
              </div>
              <span class="text-3xl font-bold text-gray-800" id="drivers-count">-</span>
            </div>
            <p class="text-gray-600 text-sm">Active Drivers</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="bg-yellow-100 p-3 rounded-lg">
                <i class="fas fa-users text-yellow-600 text-2xl"></i>
              </div>
              <span class="text-3xl font-bold text-gray-800" id="students-count">-</span>
            </div>
            <p class="text-gray-600 text-sm">Total Students</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="bg-purple-100 p-3 rounded-lg">
                <i class="fas fa-route text-purple-600 text-2xl"></i>
              </div>
              <span class="text-3xl font-bold text-gray-800" id="routes-count">-</span>
            </div>
            <p class="text-gray-600 text-sm">Active Routes</p>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-tachometer-alt mr-2"></i> System Overview
          </h2>
          <div class="space-y-4">
            <div class="border-l-4 border-green-500 bg-green-50 p-4 rounded">
              <h3 class="font-semibold text-green-800 mb-2">
                <i class="fas fa-check-circle mr-2"></i> System Status: Operational
              </h3>
              <p class="text-sm text-green-700">All systems are running smoothly. Real-time tracking active.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-gray-600 mb-1">Active Trips</p>
                <p class="text-2xl font-bold text-blue-600" id="active-trips">0</p>
              </div>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-sm text-gray-600 mb-1">Completed Today</p>
                <p class="text-2xl font-bold text-green-600" id="completed-trips">0</p>
              </div>
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p class="text-sm text-gray-600 mb-1">Total Distance (km)</p>
                <p class="text-2xl font-bold text-purple-600" id="total-distance">0</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold mb-4">
            <i class="fas fa-tools mr-2"></i> Quick Actions
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button class="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition">
              <i class="fas fa-school text-2xl mb-2"></i>
              <p class="text-sm font-semibold">Manage Schools</p>
            </button>
            <button class="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition">
              <i class="fas fa-id-card text-2xl mb-2"></i>
              <p class="text-sm font-semibold">Manage Drivers</p>
            </button>
            <button class="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition">
              <i class="fas fa-user-graduate text-2xl mb-2"></i>
              <p class="text-sm font-semibold">Manage Students</p>
            </button>
            <button class="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition">
              <i class="fas fa-route text-2xl mb-2"></i>
              <p class="text-sm font-semibold">Manage Routes</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  loadDashboardStats();
}

async function loadDashboardStats() {
  document.getElementById('schools-count').textContent = '3';
  document.getElementById('drivers-count').textContent = '6';
  document.getElementById('students-count').textContent = '12';
  document.getElementById('routes-count').textContent = '6';
  document.getElementById('active-trips').textContent = '0';
  document.getElementById('completed-trips').textContent = '0';
  document.getElementById('total-distance').textContent = '0';
}

function logout() {
  if (confirm('Logout?')) {
    localStorage.removeItem('admin');
    window.location.href = '/';
  }
}

init();
