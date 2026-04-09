// ─────────────────────────────────────────────
//  API Base URL
//  The frontend is served by the same Express
//  server, so all requests go to the same origin.
// ─────────────────────────────────────────────

const API = '';   // empty = same origin (no need for http://localhost:4000)

// ─────────────────────────────────────────────
//  Auth Token Helpers
// ─────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('auth_token');
}

function setToken(token) {
  localStorage.setItem('auth_token', token);
}

function clearToken() {
  localStorage.removeItem('auth_token');
}

// ─────────────────────────────────────────────
//  Fetch Wrapper
//  Adds Authorization header automatically when
//  a token is stored and handles JSON + errors.
// ─────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message ?? `Request failed (${res.status})`);
  }

  return data;
}

// ─────────────────────────────────────────────
//  Global Auth State
// ─────────────────────────────────────────────

let currentUser = null;

// ─────────────────────────────────────────────
//  Route Map
// ─────────────────────────────────────────────

const ROUTES = {
  '#/':           'home-page',
  '#/register':   'register-page',
  '#/verify':     'verify-page',
  '#/login':      'login-page',
  '#/profile':    'profile-page',
  '#/requests':   'requests-page',
  '#/employees':  'employees-page',
  '#/accounts':   'accounts-page',
  '#/departments':'departments-page',
};

const PROTECTED_ROUTES = new Set(['#/profile', '#/requests']);
const ADMIN_ROUTES     = new Set(['#/employees', '#/accounts', '#/departments']);

// ─────────────────────────────────────────────
//  Navigation Helper
// ─────────────────────────────────────────────

function navigateTo(hash) {
  window.location.hash = hash;
}

// ─────────────────────────────────────────────
//  Core Router
// ─────────────────────────────────────────────

function handleRouting() {
  let hash = window.location.hash || '#/';
  if (hash === '#') hash = '#/';

  // Access-control guards
  if (PROTECTED_ROUTES.has(hash) || ADMIN_ROUTES.has(hash)) {
    if (!currentUser) { window.location.hash = '#/login'; return; }
    if (ADMIN_ROUTES.has(hash) && currentUser.role !== 'Admin') {
      window.location.hash = '#/'; return;
    }
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));

  // Show matched page
  const pageId = ROUTES[hash];
  if (pageId) {
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
    else document.getElementById('home-page')?.classList.add('active');
  } else {
    document.getElementById('home-page')?.classList.add('active');
  }

  syncAuthClasses();

  // Render dynamic pages
  if (hash === '#/profile')     renderProfile();
  if (hash === '#/accounts')    renderAccountsList();
  if (hash === '#/departments') renderDepartmentsList();
  if (hash === '#/employees')   renderEmployeesTable();
  if (hash === '#/requests')    renderRequestsTable();
}

window.addEventListener('hashchange', handleRouting);

// ─────────────────────────────────────────────
//  Auth State Management
// ─────────────────────────────────────────────

function setAuthState(isAuth, user = null) {
  currentUser = isAuth ? user : null;
  syncAuthClasses();
}

function syncAuthClasses() {
  document.body.classList.toggle('not-authenticated', !currentUser);
  document.body.classList.toggle('authenticated', !!currentUser);
  document.body.classList.toggle('is-admin', !!(currentUser && currentUser.role === 'Admin'));

  const loggedOutNav = document.querySelector('.role-logged-out');
  const loggedInNav  = document.querySelector('.role-logged-in');
  if (loggedOutNav) loggedOutNav.classList.toggle('d-none', !!currentUser);
  if (loggedInNav)  loggedInNav.classList.toggle('d-none', !currentUser);

  const dropdownBtn = document.getElementById('adminDropdown');
  if (dropdownBtn) dropdownBtn.textContent = currentUser ? currentUser.role : 'Account';
}

// ─────────────────────────────────────────────
//  UI Helpers
// ─────────────────────────────────────────────

function showError(containerId, message) {
  removeAlert(containerId);
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger mt-3';
  alert.setAttribute('role', 'alert');
  alert.textContent = message;
  document.getElementById(containerId)?.prepend(alert);
}

function showSuccess(containerId, message, autoDismissMs = 3000) {
  removeAlert(containerId);
  const alert = document.createElement('div');
  alert.className = 'alert alert-success mt-3';
  alert.setAttribute('role', 'alert');
  alert.textContent = message;
  document.getElementById(containerId)?.prepend(alert);
  if (autoDismissMs) setTimeout(() => alert.remove(), autoDismissMs);
}

function removeAlert(containerId) {
  document
    .getElementById(containerId)
    ?.querySelector('.alert.alert-danger, .alert.alert-success')
    ?.remove();
}

function showLoading(containerId) {
  removeAlert(containerId);
  const el = document.createElement('div');
  el.className = 'alert alert-info mt-3';
  el.id = `loading-${containerId}`;
  el.textContent = 'Loading…';
  document.getElementById(containerId)?.prepend(el);
}

function hideLoading(containerId) {
  document.getElementById(`loading-${containerId}`)?.remove();
}

// ─────────────────────────────────────────────
//  A. Registration
// ─────────────────────────────────────────────

async function handleRegister() {
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const email     = document.getElementById('reg-email').value.trim().toLowerCase();
  const password  = document.getElementById('reg-password').value;

  if (!firstName || !lastName || !email || !password) {
    showError('register-page', 'All fields are required.'); return;
  }
  if (password.length < 6) {
    showError('register-page', 'Password must be at least 6 characters.'); return;
  }

  try {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        title:           'Mr',   // default title – can be added as a field later
        firstName,
        lastName,
        email,
        password,
        confirmPassword: password,
        role:            'User',
      }),
    });

    // Save email so the verify page knows who to verify
    localStorage.setItem('unverified_email', email);

    const verifyMsg = document.querySelector('#verify-page .alert-success');
    if (verifyMsg) verifyMsg.textContent = `✅ Registration successful! Click below to simulate email verification for ${email}.`;

    navigateTo('#/verify');
  } catch (err) {
    showError('register-page', err.message);
  }
}

// ─────────────────────────────────────────────
//  B. Email Verification (Simulated)
// ─────────────────────────────────────────────

async function handleVerify() {
  const email = localStorage.getItem('unverified_email');
  if (!email) {
    showError('verify-page', 'No pending verification. Please register first.'); return;
  }

  try {
    await apiFetch('/users/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    localStorage.removeItem('unverified_email');
    showSuccess('verify-page', 'Email verified! Redirecting to login…');
    setTimeout(() => navigateTo('#/login'), 1200);
  } catch (err) {
    showError('verify-page', err.message);
  }
}

// ─────────────────────────────────────────────
//  C. Login
// ─────────────────────────────────────────────

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showError('login-page', 'Please enter your email and password.'); return;
  }

  try {
    const data = await apiFetch('/users/authenticate', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(data.token);
    setAuthState(true, data);
    navigateTo('#/profile');
  } catch (err) {
    showError('login-page', err.message);
  }
}

// ─────────────────────────────────────────────
//  E. Logout
// ─────────────────────────────────────────────

function handleLogout() {
  clearToken();
  setAuthState(false);
  navigateTo('#/');
}

// ─────────────────────────────────────────────
//  Session Restore
//  Re-hydrates currentUser from JWT stored in
//  localStorage so a page refresh keeps you in.
// ─────────────────────────────────────────────

async function restoreSession() {
  const token = getToken();
  if (!token) return;

  try {
    // Decode payload from the JWT (middle section, base64)
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.sub) throw new Error('invalid token');

    // Fetch the actual user record to get fresh data (role, name, etc.)
    const user = await apiFetch(`/users/${payload.sub}`);
    // Re-attach the token since apiFetch response doesn't include it
    setAuthState(true, { ...user, token });
  } catch {
    clearToken();
    setAuthState(false);
  }
}

// ─────────────────────────────────────────────
//  Profile Page
// ─────────────────────────────────────────────

function renderProfile() {
  if (!currentUser) return;

  document.querySelector('#profile-page .card-title').textContent =
    `${currentUser.firstName} ${currentUser.lastName}`;

  document.querySelector('#profile-page .card-text').innerHTML =
    `<strong>Email: </strong>${currentUser.email}`;

  document.querySelector('#profile-page p:nth-of-type(2)').innerHTML =
    `<strong>Role: </strong>${currentUser.role}`;

  // Wire Edit button – opens modal and pre-fills fields
  const editBtn = document.querySelector('#profile-page .btn-outline-primary');
  const fresh = editBtn.cloneNode(true);
  editBtn.replaceWith(fresh);

  fresh.addEventListener('click', () => {
    document.getElementById('profile-name').value  = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('profile-role').value  = currentUser.role;
    new bootstrap.Modal(document.getElementById('editProfileModal')).show();
  });
}

// Save Profile changes
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const fullName = document.getElementById('profile-name').value.trim();
    const email    = document.getElementById('profile-email').value.trim();

    if (!fullName || !email) {
      showError('editProfileModal', 'Name and email are required.'); return;
    }

    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || currentUser.lastName;

    try {
      await apiFetch(`/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, email }),
      });

      currentUser.firstName = firstName;
      currentUser.lastName  = lastName;
      currentUser.email     = email;

      bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
      renderProfile();
      showSuccess('profile-page', 'Profile updated successfully.');
    } catch (err) {
      showError('profile-page', err.message);
    }
  });
});

// ─────────────────────────────────────────────
//  Accounts CRUD  (GET /users)
// ─────────────────────────────────────────────

async function renderAccountsList() {
  const tbody = document.querySelector('#accounts-page table tbody');
  if (!tbody) return;

  try {
    const accounts = await apiFetch('/users');

    if (accounts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 bg-light">No accounts.</td></tr>`;
      return;
    }

    tbody.innerHTML = accounts.map((acc) => `
      <tr>
        <td>${acc.firstName} ${acc.lastName}</td>
        <td>${acc.email}</td>
        <td>${acc.role}</td>
        <td>${acc.verified ? '✅' : '—'}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm me-1"
            onclick="openEditAccountModal(${acc.id}, '${acc.firstName}', '${acc.lastName}', '${acc.email}', '${acc.role}', ${acc.verified})">Edit</button>
          <button class="btn btn-outline-warning btn-sm me-1"
            onclick="openResetPwModal(${acc.id}, '${acc.email}')">Reset PW</button>
          <button class="btn btn-outline-danger btn-sm"
            onclick="openDeleteAccountModal(${acc.id}, '${acc.email}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;
  }
}

// ── Reset Password Modal ──

function openResetPwModal(id, email) {
  document.getElementById('reset-pw-email-label').textContent = email;
  document.getElementById('modal-new-password').value = '';
  document.getElementById('resetPwModal').dataset.targetId = id;
  removeAlert('reset-pw-modal-body');
  new bootstrap.Modal(document.getElementById('resetPwModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-reset-pw-btn')?.addEventListener('click', async () => {
    const id    = document.getElementById('resetPwModal').dataset.targetId;
    const newPw = document.getElementById('modal-new-password').value;

    if (!newPw || newPw.length < 6) {
      showError('reset-pw-modal-body', 'Password must be at least 6 characters.'); return;
    }

    try {
      await apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPw, confirmPassword: newPw }),
      });

      bootstrap.Modal.getInstance(document.getElementById('resetPwModal')).hide();
      showSuccess('accounts-page', 'Password reset successfully.');
    } catch (err) {
      showError('reset-pw-modal-body', err.message);
    }
  });
});

// ── Edit Account Modal ──

function openEditAccountModal(id, firstName, lastName, email, role, verified) {
  document.getElementById('modal-acc-firstname').value  = firstName;
  document.getElementById('modal-acc-lastname').value   = lastName;
  document.getElementById('modal-acc-email').value      = email;
  document.getElementById('modal-acc-password').value   = '';
  document.getElementById('modal-acc-role').value       = role;
  document.getElementById('modal-acc-verified').checked = verified;
  document.getElementById('editAccountModal').dataset.editingId = id;
  removeAlert('edit-account-modal-body');
  new bootstrap.Modal(document.getElementById('editAccountModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-save-account-btn')?.addEventListener('click', async () => {
    const id        = document.getElementById('editAccountModal').dataset.editingId;
    const firstName = document.getElementById('modal-acc-firstname').value.trim();
    const lastName  = document.getElementById('modal-acc-lastname').value.trim();
    const email     = document.getElementById('modal-acc-email').value.trim().toLowerCase();
    const password  = document.getElementById('modal-acc-password').value;
    const role      = document.getElementById('modal-acc-role').value;
    const verified  = document.getElementById('modal-acc-verified').checked;

    if (!firstName || !lastName || !email) {
      showError('edit-account-modal-body', 'First name, last name, and email are required.'); return;
    }

    const payload = { firstName, lastName, email, role, verified };
    if (password.length >= 6) {
      Object.assign(payload, { password, confirmPassword: password });
    }

    try {
      await apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

      bootstrap.Modal.getInstance(document.getElementById('editAccountModal')).hide();
      renderAccountsList();
      showSuccess('accounts-page', 'Account updated successfully.');
    } catch (err) {
      showError('edit-account-modal-body', err.message);
    }
  });
});

// ── Delete Account Modal ──

function openDeleteAccountModal(id, email) {
  if (currentUser && currentUser.id === id) {
    alert('You cannot delete your own account.'); return;
  }
  document.getElementById('delete-account-confirm-msg').textContent =
    `Are you sure you want to delete the account for "${email}"? This cannot be undone.`;
  document.getElementById('deleteAccountModal').dataset.targetId = id;
  new bootstrap.Modal(document.getElementById('deleteAccountModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-confirm-delete-account-btn')?.addEventListener('click', async () => {
    const id = document.getElementById('deleteAccountModal').dataset.targetId;

    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });

      bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal')).hide();
      renderAccountsList();
      showSuccess('accounts-page', 'Account deleted successfully.');
    } catch (err) {
      showError('accounts-page', err.message);
    }
  });
});

// ─────────────────────────────────────────────
//  Departments CRUD  (GET /departments)
// ─────────────────────────────────────────────

async function renderDepartmentsList() {
  const tbody = document.querySelector('#departments-page table tbody');
  if (!tbody) return;

  try {
    const departments = await apiFetch('/departments');

    if (departments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center py-3 bg-light">No departments.</td></tr>`;
      return;
    }

    tbody.innerHTML = departments.map((dept) => `
      <tr>
        <td class="ps-3">${dept.name}</td>
        <td>${dept.description ?? ''}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm me-1"
            onclick="editDepartment(${dept.id}, '${escHtml(dept.name)}', '${escHtml(dept.description ?? '')}')">Edit</button>
          <button class="btn btn-outline-danger btn-sm"
            onclick="deleteDepartment(${dept.id}, '${escHtml(dept.name)}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-danger text-center py-3">${err.message}</td></tr>`;
  }
}

function editDepartment(id, name, description) {
  document.getElementById('editDepartmentId').value          = id;
  document.getElementById('editDepartmentName').value        = name;
  document.getElementById('editDepartmentDescription').value = description;
  new bootstrap.Modal(document.getElementById('editDepartmentModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('saveDepartmentBtn')?.addEventListener('click', async () => {
    const id      = document.getElementById('editDepartmentId').value;
    const name    = document.getElementById('editDepartmentName').value.trim();
    const desc    = document.getElementById('editDepartmentDescription').value.trim();
    const nameEl  = document.getElementById('editDepartmentName');

    if (!name) { nameEl.classList.add('is-invalid'); return; }
    nameEl.classList.remove('is-invalid');

    try {
      await apiFetch(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description: desc }),
      });

      bootstrap.Modal.getInstance(document.getElementById('editDepartmentModal')).hide();
      renderDepartmentsList();
    } catch (err) {
      showError('departments-page', err.message);
    }
  });

  document.getElementById('editDepartmentModal')?.addEventListener('show.bs.modal', () => {
    document.getElementById('editDepartmentName').classList.remove('is-invalid');
  });
});

async function deleteDepartment(id, name) {
  const dept = { id, name };

  // Check if department has employees before showing modal
  try {
    const employees = await apiFetch('/employees');
    const inUse = employees.some((e) => e.deptId === id);

    const confirmMsg = document.getElementById('deleteDepartmentConfirmMsg');
    const warnMsg    = document.getElementById('deleteDepartmentWarnMsg');
    const warnText   = document.getElementById('deleteDepartmentWarnText');
    const deleteBtn  = document.getElementById('confirmDeleteDepartmentBtn');

    document.getElementById('deleteDepartmentId').value = id;

    if (inUse) {
      confirmMsg.classList.add('d-none');
      warnText.textContent = `Cannot delete "${name}" — it has employees assigned to it.`;
      warnMsg.classList.remove('d-none');
      deleteBtn.disabled = true;
    } else {
      warnMsg.classList.add('d-none');
      confirmMsg.textContent = `Are you sure you want to delete "${name}"? This cannot be undone.`;
      confirmMsg.classList.remove('d-none');
      deleteBtn.disabled = false;
    }

    new bootstrap.Modal(document.getElementById('deleteDepartmentModal')).show();
  } catch (err) {
    showError('departments-page', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('confirmDeleteDepartmentBtn')?.addEventListener('click', async () => {
    const id = document.getElementById('deleteDepartmentId').value;

    try {
      await apiFetch(`/departments/${id}`, { method: 'DELETE' });

      bootstrap.Modal.getInstance(document.getElementById('deleteDepartmentModal')).hide();
      renderDepartmentsList();
    } catch (err) {
      bootstrap.Modal.getInstance(document.getElementById('deleteDepartmentModal')).hide();
      showError('departments-page', err.message);
    }
  });
});

function addDepartment() {
  new bootstrap.Modal(document.getElementById('addDepartmentModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  const modal     = document.getElementById('addDepartmentModal');
  const nameInput = document.getElementById('addDepartmentName');
  const descInput = document.getElementById('addDepartmentDescription');

  modal?.addEventListener('show.bs.modal', () => {
    nameInput.value = '';
    descInput.value = '';
    nameInput.classList.remove('is-invalid');
  });

  document.getElementById('addDepartmentBtn')?.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const desc = descInput.value.trim();

    if (!name) { nameInput.classList.add('is-invalid'); return; }
    nameInput.classList.remove('is-invalid');

    try {
      await apiFetch('/departments', {
        method: 'POST',
        body: JSON.stringify({ name, description: desc }),
      });

      bootstrap.Modal.getInstance(modal).hide();
      renderDepartmentsList();
    } catch (err) {
      showError('departments-page', err.message);
    }
  });
});

// ─────────────────────────────────────────────
//  Employees CRUD  (GET /employees)
// ─────────────────────────────────────────────

let editingEmployeeDbId = null;   // the DB primary key (integer)

async function renderEmployeesTable() {
  const tbody = document.querySelector('#employees-page table tbody');
  if (!tbody) return;

  try {
    const employees = await apiFetch('/employees');

    if (employees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="bg-light py-3 text-center">No employees.</td></tr>`;
    } else {
      tbody.innerHTML = employees.map((emp) => `
        <tr>
          <td>${emp.employeeId}</td>
          <td>${emp.userEmail}</td>
          <td>${emp.position}</td>
          <td>${emp.deptName ?? '—'}</td>
          <td>
            <button class="btn btn-outline-primary btn-sm me-1"
              onclick="openEmployeeForm(${emp.id})">Edit</button>
            <button class="btn btn-outline-danger btn-sm"
              onclick="deleteEmployee(${emp.id}, '${emp.employeeId}')">Delete</button>
          </td>
        </tr>
      `).join('');
    }

    await populateDeptDropdown();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">${err.message}</td></tr>`;
  }
}

async function populateDeptDropdown() {
  const select = document.getElementById('emp-department');
  if (!select) return;

  try {
    const depts = await apiFetch('/departments');
    select.innerHTML = depts.length
      ? depts.map((d) => `<option value="${d.id}">${d.name}</option>`).join('')
      : `<option value="">No departments available</option>`;
  } catch {
    select.innerHTML = `<option value="">Could not load departments</option>`;
  }
}

async function openEmployeeForm(dbId = null) {
  editingEmployeeDbId = dbId;
  removeAlert('employees-page');

  await populateDeptDropdown();

  if (dbId) {
    try {
      const emp = await apiFetch(`/employees/${dbId}`);
      document.getElementById('emp-id').value         = emp.employeeId;
      document.getElementById('emp-email').value      = emp.userEmail;
      document.getElementById('emp-position').value   = emp.position;
      document.getElementById('emp-department').value = emp.deptId;
      document.getElementById('emp-hiredate').value   = emp.hireDate;
      document.querySelector('#employee-form-card .card-header').textContent = 'Edit Employee';
    } catch (err) {
      showError('employees-page', err.message); return;
    }
  } else {
    document.getElementById('emp-id').value       = '';
    document.getElementById('emp-email').value    = '';
    document.getElementById('emp-position').value = '';
    document.getElementById('emp-hiredate').value = '';
    document.querySelector('#employee-form-card .card-header').textContent = 'Add Employee';
  }

  const card = document.getElementById('employee-form-card');
  card.classList.remove('d-none');
  card.scrollIntoView({ behavior: 'smooth' });
}

function closeEmployeeForm() {
  document.getElementById('employee-form-card').classList.add('d-none');
  editingEmployeeDbId = null;
}

async function saveEmployee() {
  const employeeId = document.getElementById('emp-id').value.trim();
  const userEmail  = document.getElementById('emp-email').value.trim().toLowerCase();
  const position   = document.getElementById('emp-position').value.trim();
  const deptId     = parseInt(document.getElementById('emp-department').value, 10);
  const hireDate   = document.getElementById('emp-hiredate').value;

  if (!employeeId || !userEmail || !position || !deptId) {
    showError('employees-page', 'Employee ID, email, position, and department are required.'); return;
  }

  try {
    if (editingEmployeeDbId) {
      await apiFetch(`/employees/${editingEmployeeDbId}`, {
        method: 'PUT',
        body: JSON.stringify({ employeeId, userEmail, position, deptId, hireDate }),
      });
    } else {
      await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify({ employeeId, userEmail, position, deptId, hireDate }),
      });
    }

    closeEmployeeForm();
    renderEmployeesTable();
    showSuccess('employees-page', 'Employee saved successfully.');
  } catch (err) {
    showError('employees-page', err.message);
  }
}

function deleteEmployee(dbId, employeeId) {
  document.getElementById('deleteEmployeeId').value = dbId;
  document.getElementById('deleteEmployeeConfirmMsg').textContent =
    `Are you sure you want to delete employee "${employeeId}"? This cannot be undone.`;
  new bootstrap.Modal(document.getElementById('deleteEmployeeModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-employee-btn')?.addEventListener('click', () => openEmployeeForm());
  document.getElementById('save-employee-btn')?.addEventListener('click', saveEmployee);
  document.getElementById('cancel-employee-btn')?.addEventListener('click', closeEmployeeForm);

  document.getElementById('confirmDeleteEmployeeBtn')?.addEventListener('click', async () => {
    const dbId = document.getElementById('deleteEmployeeId').value;

    try {
      await apiFetch(`/employees/${dbId}`, { method: 'DELETE' });
      bootstrap.Modal.getInstance(document.getElementById('deleteEmployeeModal')).hide();
      renderEmployeesTable();
    } catch (err) {
      bootstrap.Modal.getInstance(document.getElementById('deleteEmployeeModal')).hide();
      showError('employees-page', err.message);
    }
  });
});

// ─────────────────────────────────────────────
//  My Requests  (GET /requests)
// ─────────────────────────────────────────────

const STATUS_BADGE = { Pending: 'warning', Approved: 'success', Rejected: 'danger' };

async function renderRequestsTable() {
  if (!currentUser) return;

  const emptyMsg  = document.getElementById('requests-empty');
  const tableWrap = document.getElementById('requests-table-wrap');
  const tbody     = document.querySelector('#requests-page table tbody');

  try {
    const requests = await apiFetch('/requests');

    if (requests.length === 0) {
      emptyMsg?.classList.remove('d-none');
      tableWrap?.classList.add('d-none');
      return;
    }

    emptyMsg?.classList.add('d-none');
    tableWrap?.classList.remove('d-none');

    tbody.innerHTML = requests.map((req) => {
      const badge   = STATUS_BADGE[req.status] ?? 'secondary';
      const itemStr = req.items.map((i) => `${i.name} ×${i.qty}`).join(', ');
      return `
        <tr>
          <td>${req.id}</td>
          <td>${req.type}</td>
          <td class="text-start">${itemStr}</td>
          <td>${req.date}</td>
          <td><span class="badge bg-${badge}">${req.status}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showError('requests-page', err.message);
  }
}

// ── Item rows ──

function addItemRow() {
  const container = document.getElementById('item-container');
  const row = document.createElement('div');
  row.className = 'input-group mb-2 item-row';
  row.innerHTML = `
    <input type="text"   class="form-control item-name" placeholder="Item name" />
    <input type="number" class="form-control item-qty"  value="1" min="1" style="max-width:80px" />
    <button class="btn btn-outline-danger" type="button" onclick="removeItemRow(this)">×</button>
  `;
  container.appendChild(row);
}

function removeItemRow(btn) {
  const container = document.getElementById('item-container');
  if (container.querySelectorAll('.item-row').length > 1) btn.closest('.item-row').remove();
}

function resetRequestModal() {
  document.getElementById('req-type').value = 'Equipment';
  document.getElementById('item-container').innerHTML = `
    <div class="input-group mb-2 item-row">
      <input type="text"   class="form-control item-name" placeholder="Item name" />
      <input type="number" class="form-control item-qty"  value="1" min="1" style="max-width:80px" />
      <button class="btn btn-outline-secondary" type="button" onclick="addItemRow()">+</button>
    </div>
  `;
  removeAlert('request-modal-body');
}

async function submitRequest() {
  const type  = document.getElementById('req-type').value;
  const rows  = document.querySelectorAll('#item-container .item-row');
  const items = [];

  rows.forEach((row) => {
    const name = row.querySelector('.item-name')?.value.trim();
    const qty  = parseInt(row.querySelector('.item-qty')?.value, 10) || 1;
    if (name) items.push({ name, qty });
  });

  if (items.length === 0) {
    showError('request-modal-body', 'Please add at least one item.'); return;
  }

  try {
    await apiFetch('/requests', {
      method: 'POST',
      body: JSON.stringify({ type, items }),
    });

    const modalEl = document.getElementById('requestModal');
    bootstrap.Modal.getInstance(modalEl)?.hide();
    resetRequestModal();
    renderRequestsTable();
    showSuccess('requests-page', 'Request submitted successfully.');
  } catch (err) {
    showError('request-modal-body', err.message);
  }
}

// ─────────────────────────────────────────────
//  Utility
// ─────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clearForm(pageId) {
  document.querySelectorAll(`#${pageId} input`).forEach((el) => {
    if (el.type !== 'checkbox') el.value = '';
    else el.checked = false;
  });
  removeAlert(pageId);
}

// ─────────────────────────────────────────────
//  DOMContentLoaded – Wire Everything Up
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Restore session (async – awaited so guards work on first load)
  await restoreSession();

  // Set default hash
  if (!window.location.hash || window.location.hash === '#') {
    history.replaceState(null, '', '#/');
  }

  // ── Registration ──
  document.querySelector('#register-page .btn-success')
    ?.addEventListener('click', handleRegister);
  document.querySelector('#register-page .btn-outline-secondary')
    ?.addEventListener('click', () => navigateTo('#/'));

  // ── Verify Email ──
  document.querySelector('#verify-page .btn-success')
    ?.addEventListener('click', handleVerify);
  document.querySelector('#verify-page .btn-outline-secondary')
    ?.addEventListener('click', () => navigateTo('#/'));

  // ── Login ──
  document.querySelector('#login-page .btn-primary')
    ?.addEventListener('click', handleLogin);
  document.querySelector('#login-page .btn-outline-secondary')
    ?.addEventListener('click', () => navigateTo('#/'));

  // ── Logout ──
  document.querySelector('.dropdown-item.text-danger')
    ?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

  // ── Get Started ──
  document.querySelector('#home-page .btn-primary')
    ?.addEventListener('click', () => navigateTo(currentUser ? '#/profile' : '#/login'));

  // ── Accounts ──
  document.querySelector('#accounts-page > .d-flex .btn-success')
    ?.addEventListener('click', () => {
      // Inline add-account – just re-use modal with blank fields
      document.getElementById('modal-acc-firstname').value  = '';
      document.getElementById('modal-acc-lastname').value   = '';
      document.getElementById('modal-acc-email').value      = '';
      document.getElementById('modal-acc-password').value   = '';
      document.getElementById('modal-acc-role').value       = 'User';
      document.getElementById('modal-acc-verified').checked = false;
      delete document.getElementById('editAccountModal').dataset.editingId;
      removeAlert('edit-account-modal-body');
      // Change modal title to Add
      document.querySelector('#editAccountModal .modal-title').textContent = 'Add Account';
      new bootstrap.Modal(document.getElementById('editAccountModal')).show();
    });

  // ── Departments ──
  document.querySelector('#departments-page .btn-success')
    ?.addEventListener('click', addDepartment);

  // ── Requests ──
  document.getElementById('addRow')?.addEventListener('click', addItemRow);
  document.getElementById('submitRequest')?.addEventListener('click', submitRequest);
  document.getElementById('requestModal')
    ?.addEventListener('show.bs.modal', resetRequestModal);

  // ── Clear forms on navigation ──
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash !== '#/register') clearForm('register-page');
    if (hash !== '#/login')    clearForm('login-page');
  });

  // ── Run router ──
  handleRouting();
});
