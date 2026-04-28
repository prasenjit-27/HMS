/* admin.js — Admin dashboard logic */

const user = requireAuth();
if (user && user.role !== 'admin') window.location.href = '/';

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadPendingDoctors();
  loadUsers();
  loadMessages();
});

let currentSubRole = 'doctor';
let overviewChart = null; // Legacy placeholder

/* ---- Stats ---- */
async function loadStats() {
  try {
    const res = await api.get('/admin/stats');
    const s = res.data;
    const el = document.getElementById('admin-stats');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${s.totalPatients ?? '0'}</div>
        <div class="stat-label">Total Patients</div>
      </div>
      <div class="stat-card info">
        <div class="stat-value">${s.totalDoctors ?? '0'}</div>
        <div class="stat-label">Total Doctors</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">${s.pendingDoctors ?? '0'}</div>
        <div class="stat-label">Pending Approvals</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${s.approvedDoctors ?? '0'}</div>
        <div class="stat-label">Approved Doctors</div>
      </div>
    `;
  } catch (error) {
    showToast(error.message, 'error');
  }
}

/* ---- Pending Doctors ---- */
async function loadPendingDoctors() {
  try {
    const res = await api.get('/admin/doctors/pending');
    const docs = res.data;
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = docs.length;
    renderPendingDoctors(docs);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderPendingDoctors(docs) {
  const container = document.getElementById('pending-list');
  if (!container) return;
  if (docs.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>All Clear!</h3><p>No pending doctor registrations.</p></div>`;
    return;
  }
  container.innerHTML = docs.map(doc => `
    <div class="card" style="margin-bottom:1.5rem;">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div class="doctor-avatar" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">
             ${doc.userId?.profileImage ? `<img src="${doc.userId.profileImage}" style="width:100%; height:100%; object-fit:cover;">` : getInitials(doc.userId?.name)}
          </div>
          <div>
            <h3 style="font-size:1.1rem;font-weight:600;">Dr. ${escapeHtml(doc.userId?.name || 'Unknown')}</h3>
            <p style="font-size:0.85rem;color:var(--text-secondary);">${escapeHtml(doc.userId?.email || '')}</p>
          </div>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="approveDoctor('${doc._id}')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="rejectDoctor('${doc._id}')">Reject</button>
        </div>
      </div>
      <div class="card-body">
        <div style="display:flex;flex-wrap:wrap;gap:1rem;font-size:0.875rem;margin-bottom:0.75rem;">
          ${doc.specialization ? `<div><strong>Specialization:</strong> ${escapeHtml(doc.specialization)}</div>` : ''}
          ${doc.experience     ? `<div><strong>Experience:</strong> ${doc.experience} years</div>` : ''}
          ${doc.qualifications ? `<div><strong>Qualifications:</strong> ${escapeHtml(doc.qualifications)}</div>` : ''}
          ${doc.consultationFee ? `<div><strong>Fee:</strong> ₹${doc.consultationFee}</div>` : ''}
        </div>
        ${doc.bio ? `<p style="color:var(--text-secondary);font-size:0.875rem;">${escapeHtml(doc.bio)}</p>` : ''}
        ${doc.availability && doc.availability.length > 0 ? `
          <div class="availability-grid" style="margin-top:0.75rem;">
            ${doc.availability.map(a => `<div class="availability-slot">${a.day} ${a.startTime || ''}${a.endTime ? '–'+a.endTime : ''}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

async function approveDoctor(id) {
  try {
    showLoader();
    await api.put(`/admin/doctors/${id}/approve`);
    showToast('Doctor approved!', 'success');
    await Promise.all([loadPendingDoctors(), loadStats(), loadUsers()]);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

async function rejectDoctor(id) {
  const confirmed = await showConfirm('Reject this doctor registration?');
  if (!confirmed) return;
  try {
    showLoader();
    await api.put(`/admin/doctors/${id}/reject`);
    showToast('Doctor rejected.', 'info');
    await Promise.all([loadPendingDoctors(), loadStats(), loadUsers()]);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

/* ---- Users ---- */
async function loadUsers() {
  try {
    const [docsRes, patsRes] = await Promise.all([
      api.get('/admin/users?role=doctor'),
      api.get('/admin/users?role=patient')
    ]);
    renderUsersTable(docsRes.data, 'doctors-tbody');
    renderUsersTable(patsRes.data, 'patients-tbody');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderUsersTable(users, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:1.5rem;">No users.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div style="width:32px; height:32px; border-radius:50%; background:var(--gradient-brand); color:white; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; overflow:hidden;">
            ${u.profileImage ? `<img src="${u.profileImage}" style="width:100%; height:100%; object-fit:cover;">` : getInitials(u.name)}
          </div>
          <span style="font-weight:600; font-size:0.875rem;">${escapeHtml(u.name)}</span>
        </div>
      </td>
      <td style="color:var(--text-secondary);font-size:0.85rem;">${escapeHtml(u.email)}</td>
      <td>
        ${u.role !== 'admin'
          ? `<button class="btn btn-danger btn-sm" onclick="confirmDeleteUser('${u._id}', '${escapeHtml(u.name)}')">Delete</button>`
          : '—'}
      </td>
    </tr>
  `).join('');
}

async function confirmDeleteUser(id, name) {
  const confirmed = await showConfirm(`Are you sure you want to PERMANENTLY delete user "${name}"? This will remove them from the database and cannot be undone.`);
  if (!confirmed) return;
  try {
    showLoader();
    await api.delete(`/admin/users/${id}`);
    showToast('User permanently deleted.', 'info');
    await loadUsers();
    await loadStats();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

/* ---- Contact Messages ---- */
async function loadMessages() {
  try {
    const res = await api.get('/admin/contact-messages');
    renderMessages(res.data);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderMessages(messages) {
  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;
  if (messages.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem;">No messages found.</td></tr>`;
    return;
  }

  tbody.innerHTML = messages.map(msg => `
    <tr>
      <td style="white-space:nowrap; font-size:0.85rem;">${new Date(msg.createdAt).toLocaleDateString()}</td>
      <td style="font-weight:600; font-size:0.85rem;">${escapeHtml(msg.firstName + ' ' + msg.lastName)}</td>
      <td style="color:var(--text-secondary);font-size:0.85rem;"><a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a></td>
      <td style="font-size:0.85rem; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(msg.message)}">${escapeHtml(msg.message)}</td>
      <td>
        <div style="display:flex;gap:0.5rem;">
          <a href="mailto:${escapeHtml(msg.email)}?subject=Re: Your Contact Request to HMS" class="btn btn-secondary btn-sm" style="text-decoration:none; padding: 0.25rem 0.5rem;">Reply</a>
          <button class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem;" onclick="deleteMessage('${msg._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function deleteMessage(id) {
  const confirmed = await showConfirm('Are you sure you want to delete this message?');
  if (!confirmed) return;
  try {
    showLoader();
    await api.delete(`/admin/contact-messages/${id}`);
    showToast('Message deleted successfully.', 'info');
    await loadMessages();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}
