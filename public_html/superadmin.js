const API_BASE = '/api';
let superAdminData = null;
let schools = [];

function init() {
  const app = document.getElementById('superadmin-app');
  const stored = localStorage.getItem('superadmin');
  if (stored) {
    superAdminData = JSON.parse(stored);
    showDashboard(app);
  } else {
    showLogin(app);
  }
}

function showLogin(container) {
  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 px-4">
      <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <div class="bg-indigo-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-crown text-3xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800">Super Admin</h1>
          <p class="text-gray-600 mt-2">Bus Tracking SAAS Platform</p>
        </div>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" id="username" required 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="superadmin">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" id="password" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Password">
          </div>
          <div id="error-message" class="text-red-600 text-sm hidden"></div>
          <button type="submit" class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
            <i class="fas fa-sign-in-alt mr-2"></i> Login as Super Admin
          </button>
        </form>
        <div class="mt-4 text-center">
          <a href="/" class="text-indigo-600 hover:underline text-sm">
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
    const response = await fetch(`${API_BASE}/superadmin.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    
    if (data.success) {
      superAdminData = data.superadmin;
      localStorage.setItem('superadmin', JSON.stringify(superAdminData));
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
      <div class="bg-indigo-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">
              <i class="fas fa-crown mr-2"></i> Super Admin Dashboard
            </h1>
            <p class="text-sm opacity-90">Multi-School SAAS Management</p>
          </div>
          <button onclick="logout()" class="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-100">
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
              <span class="text-3xl font-bold text-gray-800" id="total-schools">0</span>
            </div>
            <p class="text-gray-600 text-sm">Total Schools</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="bg-green-100 p-3 rounded-lg">
                <i class="fas fa-check-circle text-green-600 text-2xl"></i>
              </div>
              <span class="text-3xl font-bold text-gray-800" id="active-schools">0</span>
            </div>
            <p class="text-gray-600 text-sm">Active Schools</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="bg-yellow-100 p-3 rounded-lg">
                <i class="fas fa-users text-yellow-600 text-2xl"></i>
              </div>
              <span class="text-3xl font-bold text-gray-800" id="total-students">0</span>
            </div>
            <p class="text-gray-600 text-sm">Total Students</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-2">
              <div class="bg-purple-100 p-3 rounded-lg">
                <i class="fas fa-dollar-sign text-purple-600 text-2xl"></i>
              </div>
              <span class="text-3xl font-bold text-gray-800" id="monthly-revenue">$0</span>
            </div>
            <p class="text-gray-600 text-sm">Monthly Revenue</p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">
              <i class="fas fa-building mr-2"></i> Schools Management
            </h2>
            <button onclick="showAddSchoolModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              <i class="fas fa-plus mr-2"></i> Add New School
            </button>
          </div>
          <div id="schools-list" class="overflow-x-auto">
            <p class="text-gray-500 text-center py-8">Loading schools...</p>
          </div>
        </div>
      </div>
    </div>

    <div id="modal-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div id="modal-content" class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"></div>
    </div>
  `;
  
  loadDashboardStats();
  loadSchools();
}

async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_BASE}/superadmin.php?action=stats`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('total-schools').textContent = data.stats.total_schools;
      document.getElementById('active-schools').textContent = data.stats.active_schools;
      document.getElementById('total-students').textContent = data.stats.total_students;
      document.getElementById('monthly-revenue').textContent = '$' + (data.stats.monthly_revenue || 0);
    }
  } catch (error) {
    console.error('Failed to load stats');
  }
}

async function loadSchools() {
  try {
    const response = await fetch(`${API_BASE}/superadmin.php?action=list-schools`);
    const data = await response.json();
    
    if (data.success) {
      schools = data.schools;
      displaySchools();
    }
  } catch (error) {
    document.getElementById('schools-list').innerHTML = '<p class="text-red-600 text-center py-4">Failed to load schools</p>';
  }
}

function displaySchools() {
  const container = document.getElementById('schools-list');
  
  if (schools.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">No schools found. Add your first school to get started.</p>';
    return;
  }
  
  container.innerHTML = `
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        ${schools.map(school => `
          <tr>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-800">${school.school_name}</div>
              <div class="text-sm text-gray-500">${school.contact_email || 'No email'}</div>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 text-xs rounded-full ${getPlanBadgeClass(school.subscription_plan)}">
                ${school.subscription_plan.toUpperCase()}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">${school.student_count || 0} / ${school.max_students || 100}</td>
            <td class="px-4 py-3">
              ${school.is_active ? 
                '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>' : 
                '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>'}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">
              ${school.subscription_end ? new Date(school.subscription_end).toLocaleDateString() : 'N/A'}
            </td>
            <td class="px-4 py-3">
              <button onclick="editSchool(${school.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="viewSchoolDetails(${school.id})" class="text-green-600 hover:text-green-800 mr-2">
                <i class="fas fa-eye"></i>
              </button>
              <button onclick="toggleSchoolStatus(${school.id}, ${school.is_active})" class="text-orange-600 hover:text-orange-800">
                <i class="fas fa-${school.is_active ? 'ban' : 'check'}"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getPlanBadgeClass(plan) {
  const classes = {
    'free': 'bg-gray-100 text-gray-800',
    'basic': 'bg-blue-100 text-blue-800',
    'premium': 'bg-purple-100 text-purple-800',
    'enterprise': 'bg-indigo-100 text-indigo-800'
  };
  return classes[plan] || 'bg-gray-100 text-gray-800';
}

function showAddSchoolModal() {
  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">
          <i class="fas fa-plus-circle mr-2"></i> Add New School
        </h3>
        <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      <form id="add-school-form" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
            <input type="text" id="school_name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School Code *</label>
            <input type="text" id="school_code" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea id="address" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
            <input type="tel" id="contact_phone" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
            <input type="email" id="contact_email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
            <select id="subscription_plan" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="free">Free (50 students)</option>
              <option value="basic" selected>Basic (100 students)</option>
              <option value="premium">Premium (500 students)</option>
              <option value="enterprise">Enterprise (Unlimited)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Subscription Duration</label>
            <select id="subscription_duration" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="30">1 Month</option>
              <option value="90">3 Months</option>
              <option value="180">6 Months</option>
              <option value="365" selected>1 Year</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Admin Username *</label>
          <input type="text" id="admin_username" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
          <input type="password" id="admin_password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Admin Full Name *</label>
          <input type="text" id="admin_name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        </div>
        <div id="form-error" class="text-red-600 text-sm hidden"></div>
        <div class="flex gap-3">
          <button type="submit" class="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
            <i class="fas fa-save mr-2"></i> Create School
          </button>
          <button type="button" onclick="closeModal()" class="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('add-school-form').addEventListener('submit', handleAddSchool);
}

async function handleAddSchool(e) {
  e.preventDefault();
  const errorDiv = document.getElementById('form-error');
  
  const formData = {
    school_name: document.getElementById('school_name').value,
    school_code: document.getElementById('school_code').value,
    address: document.getElementById('address').value,
    contact_phone: document.getElementById('contact_phone').value,
    contact_email: document.getElementById('contact_email').value,
    subscription_plan: document.getElementById('subscription_plan').value,
    subscription_duration: document.getElementById('subscription_duration').value,
    admin_username: document.getElementById('admin_username').value,
    admin_password: document.getElementById('admin_password').value,
    admin_name: document.getElementById('admin_name').value
  };
  
  try {
    const response = await fetch(`${API_BASE}/superadmin.php?action=create-school`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    
    if (data.success) {
      alert('School created successfully!');
      closeModal();
      loadSchools();
      loadDashboardStats();
    } else {
      errorDiv.textContent = data.error || 'Failed to create school';
      errorDiv.classList.remove('hidden');
    }
  } catch (error) {
    errorDiv.textContent = 'Failed to create school';
    errorDiv.classList.remove('hidden');
  }
}

async function toggleSchoolStatus(schoolId, currentStatus) {
  if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this school?`)) return;
  
  try {
    const response = await fetch(`${API_BASE}/superadmin.php?action=toggle-school-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: schoolId })
    });
    const data = await response.json();
    
    if (data.success) {
      loadSchools();
      loadDashboardStats();
    }
  } catch (error) {
    alert('Failed to update school status');
  }
}

function editSchool(schoolId) {
  alert('Edit school functionality coming soon. School ID: ' + schoolId);
}

function viewSchoolDetails(schoolId) {
  alert('View school details functionality coming soon. School ID: ' + schoolId);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function logout() {
  if (confirm('Logout?')) {
    localStorage.removeItem('superadmin');
    window.location.href = '/';
  }
}

init();
