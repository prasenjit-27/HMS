/* doctor.js — Physician dashboard logic */

const user = requireAuth();
if (user && user.role !== 'doctor') window.location.href = '/';

let allConsultations = [];
let doctorProfile = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDoctorData();
  
  // Set avatar in navbar from global user object
  if (user && user.profileImage) {
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) {
        navAvatar.innerHTML = `<img src="${user.profileImage}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }
  }
});

async function loadDoctorData() {
  try {
    showLoader();
    await Promise.all([loadProfile(), loadConsultations()]);
    updateGreeting();
    updateApprovalBanner();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';
  const el = document.getElementById('doctor-greeting');
  if (el) el.textContent = `${greeting}, Dr. ${user.name}`;
}

function updateApprovalBanner() {
  const appEl = document.getElementById('approval-banner');
  const rejEl = document.getElementById('rejected-banner');
  if (!appEl || !rejEl) return;
  appEl.classList.add('hidden');
  rejEl.classList.add('hidden');
  if (doctorProfile) {
    if (doctorProfile.status === 'pending') appEl.classList.remove('hidden');
    else if (doctorProfile.status === 'rejected') rejEl.classList.remove('hidden');
  }
}

/* ---- Profile ---- */
async function loadProfile() {
  try {
    const res = await api.get('/doctor/profile');
    const p = res.data;
    if (!p) return;
    doctorProfile = p;

    // Check approval status
    if (p.status === 'pending') document.getElementById('approval-banner')?.classList.remove('hidden');
    if (p.status === 'rejected') document.getElementById('rejected-banner')?.classList.remove('hidden');

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('doc-specialization', p.specialization);
    set('doc-experience', p.experience);
    set('doc-qualifications', p.qualifications);
    set('doc-fee', p.consultationFee);
    set('doc-phone', p.phone);
    set('doc-bio', p.bio);
    
    // Set Profile Photo Preview
    if (p.userId?.profileImage) {
        const previewImg = document.getElementById('profile-preview-img');
        const placeholder = document.getElementById('profile-avatar-placeholder');
        if (previewImg && placeholder) {
            previewImg.src = p.userId.profileImage;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        }
    }

    if (p.availability) {
      document.getElementById('availability-editor').innerHTML = '';
      p.availability.forEach(addAvailabilitySlot);
    }
  } catch (_) {}
}

async function handleProfileImageUpload(file) {
  if (!file) return;
  try {
    showLoader();
    const formData = new FormData();
    formData.append('profileImage', file);
    
    // Preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById('profile-preview-img');
      const placeholder = document.getElementById('profile-avatar-placeholder');
      if (previewImg && placeholder) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);

    // Upload to server (Backend should handle Cloudinary and DB update)
    const token = localStorage.getItem('token');
    const res = await fetch('/api/doctor/profile-image', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('Professional photo updated!', 'success');
      // Update global user
      let currUser = JSON.parse(localStorage.getItem('user') || '{}');
      currUser.profileImage = data.profileImage;
      localStorage.setItem('user', JSON.stringify(currUser));
      
      const navAvatar = document.getElementById('nav-avatar');
      if (navAvatar) {
        navAvatar.innerHTML = `<img src="${data.profileImage}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
      }
    } else {
      throw new Error(data.message || 'Photo upload failed');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

function addAvailabilitySlot(data = null) {
  const editor = document.getElementById('availability-editor');
  if (!editor) return;
  const div = document.createElement('div');
  div.className = 'form-row';
  div.style.cssText = 'margin-bottom:0.75rem;align-items:end;';
  div.innerHTML = `
    <div class="form-group" style="margin-bottom:0">
      <select class="form-input" data-field="day">
        <option value="">Day</option>
        ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d =>
          `<option value="${d}" ${data?.day === d ? 'selected' : ''}>${d}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group" style="margin-bottom:0;display:flex;gap:0.5rem;align-items:center;">
      <input class="form-input" type="time" data-field="startTime" value="${data?.startTime || '09:00'}" style="flex:1">
      <span style="color:var(--text-muted);white-space:nowrap;">to</span>
      <input class="form-input" type="time" data-field="endTime" value="${data?.endTime || '17:00'}" style="flex:1">
      <button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('.form-row').remove()" style="color:var(--danger);flex-shrink:0;font-size:1.1rem;">✕</button>
    </div>
  `;
  editor.appendChild(div);
}

async function handleUpdateDoctorProfile(e) {
  e.preventDefault();
  const availability = [];
  document.querySelectorAll('#availability-editor .form-row').forEach(row => {
    const day = row.querySelector('[data-field="day"]')?.value;
    const startTime = row.querySelector('[data-field="startTime"]')?.value;
    const endTime = row.querySelector('[data-field="endTime"]')?.value;
    if (day) availability.push({ day, startTime, endTime });
  });
  const profileData = {
    specialization: document.getElementById('doc-specialization').value,
    experience: parseInt(document.getElementById('doc-experience').value) || 0,
    qualifications: document.getElementById('doc-qualifications').value,
    consultationFee: parseInt(document.getElementById('doc-fee').value) || 0,
    phone: document.getElementById('doc-phone').value,
    bio: document.getElementById('doc-bio').value,
    availability,
  };
  try {
    showLoader();
    await api.put('/doctor/profile', profileData);
    showToast('Profile updated!', 'success');
    await loadProfile();
    updateApprovalBanner();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

async function loadConsultations() {
  try {
    const res = await api.get('/doctor/consultations');
    allConsultations = res.data;
    renderStats();
    renderPendingRequests();
    renderAllConsultations(allConsultations);
  } catch (_) {}
}

function renderStats() {
  const pending = allConsultations.filter(c => c.status === 'pending').length;
  const active  = allConsultations.filter(c => c.status === 'accepted').length;
  const closed  = allConsultations.filter(c => c.status === 'closed').length;
  const total   = allConsultations.length;
  const el = document.getElementById('doctor-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${pending}</div>
      <div class="stat-label">Pending Requests</div>
    </div>
    <div class="stat-card info">
      <div class="stat-value">${active}</div>
      <div class="stat-label">Active Consultations</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${closed}</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card warning">
      <div class="stat-value">${total}</div>
      <div class="stat-label">Total Consultations</div>
    </div>
  `;
}

function renderPendingRequests() {
  const pending = allConsultations.filter(c => c.status === 'pending');
  const emptyHtml = `<div class="empty-state"><h3>No Pending Requests</h3><p>You're all caught up!</p></div>`;
  const html = pending.length === 0 ? emptyHtml : pending.map(c => renderConsultationCard(c)).join('');

  const el1 = document.getElementById('pending-requests');
  if (el1) el1.innerHTML = html;

  const el2 = document.getElementById('pending-requests-full');
  if (el2) el2.innerHTML = html;
}

function renderAllConsultations(consultations) {
  const container = document.getElementById('all-consultations');
  if (!container) return;
  if (consultations.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>No Consultations</h3><p>Consultations will appear here when patients request them.</p></div>`;
    return;
  }
  container.innerHTML = consultations.map(c => renderConsultationCard(c)).join('');
}

function renderConsultationCard(c) {
  return `
    <div class="consultation-card">
      <div class="consultation-info">
        <h4>${escapeHtml(c.patientId?.name || 'Patient')}</h4>
        <p>${escapeHtml(c.symptoms)} &nbsp; ${getStatusBadge(c.status)}</p>
        ${c.description ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">${escapeHtml(c.description).slice(0, 100)}</p>` : ''}
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.35rem;">${formatDateTime(c.createdAt)}</p>
      </div>
      <div class="consultation-actions">
        ${c.status === 'pending' ? `
          <button class="btn btn-primary btn-sm" onclick="acceptConsultation('${c._id}')">Accept</button>
          <button class="btn btn-danger btn-sm" onclick="rejectConsultation('${c._id}')">Reject</button>
        ` : ''}
        ${c.status === 'accepted' ? `
          <a href="/chat.html?id=${c._id}" class="btn btn-primary btn-sm">Open Chat</a>
          <button class="btn btn-danger btn-sm" onclick="closeConsultation('${c._id}')">Close</button>
        ` : ''}
        ${c.status === 'closed' ? `
          <a href="/chat.html?id=${c._id}" class="btn btn-secondary btn-sm">View Chat</a>
        ` : ''}
      </div>
    </div>
  `;
}

function filterDocConsultations(btn) {
  document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filter = btn.dataset.filter;
  renderAllConsultations(filter === 'all' ? allConsultations : allConsultations.filter(c => c.status === filter));
}

async function acceptConsultation(id) {
  try {
    showLoader();
    await api.put(`/doctor/consultations/${id}/accept`);
    showToast('Consultation accepted!', 'success');
    await loadConsultations();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

async function rejectConsultation(id) {
  if (!confirm('Reject this consultation?')) return;
  try {
    showLoader();
    await api.put(`/doctor/consultations/${id}/reject`);
    showToast('Consultation rejected.', 'info');
    await loadConsultations();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

async function closeConsultation(id) {
  if (!confirm('Close this consultation? The chat becomes read-only.')) return;
  try {
    showLoader();
    await api.put(`/doctor/consultations/${id}/close`);
    showToast('Consultation closed.', 'info');
    await loadConsultations();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}
