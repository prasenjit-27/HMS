/* patient.js — Patient dashboard logic */

const user = requireAuth();
if (user && user.role !== 'patient') window.location.href = '/';

let allDoctors = [];
let allConsultations = [];

document.addEventListener('DOMContentLoaded', () => {
  loadDoctors();
  loadConsultations();
  loadProfile();
  
  // Set avatar in navbar from global user object
  if (user && user.profileImage) {
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) {
        navAvatar.innerHTML = `<img src="${user.profileImage}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    }
    
    // Also set it in the profile settings section if the elements exist
    const previewImg = document.getElementById('profile-preview-img');
    const placeholder = document.getElementById('profile-avatar-placeholder');
    if (previewImg && placeholder) {
        previewImg.src = user.profileImage;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
    }
  }
});

/* ---- Doctors ---- */
async function loadDoctors() {
  try {
    const res = await api.get('/patient/doctors');
    allDoctors = res.data;
    renderDoctors(allDoctors);
  } catch (error) {
    showToast(error.message, 'error');
    document.getElementById('doctor-grid').innerHTML =
      `<div class="empty-state" style="grid-column:1/-1;"><h3>Could not load doctors</h3><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function renderDoctors(doctors) {
  const grid = document.getElementById('doctor-grid');
  if (!grid) return;
  if (doctors.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>No Doctors Found</h3><p>Try adjusting your search or filter criteria.</p></div>`;
    return;
  }
  grid.innerHTML = doctors.map((doc, i) => `
    <div class="doctor-card" style="animation-delay:${i * 0.07}s">
      <div class="doctor-card-header">
        <div class="doctor-avatar">${getInitials(doc.userId?.name)}</div>
        <div class="doctor-info">
          <h3>Dr. ${escapeHtml(doc.userId?.name || 'Unknown')}</h3>
          <p>${escapeHtml(doc.specialization || 'General')}</p>
        </div>
      </div>
      <div class="doctor-card-details">
        ${doc.experience ? `<div class="detail">${doc.experience} yrs exp</div>` : ''}
        ${doc.consultationFee ? `<div class="detail">₹${doc.consultationFee}</div>` : `<div class="detail">Free</div>`}
        ${doc.qualifications ? `<div class="detail">${escapeHtml(doc.qualifications)}</div>` : ''}
      </div>
      <div class="doctor-card-bio">
        ${doc.bio ? escapeHtml(doc.bio) : '<span style="color:var(--text-muted);font-style:italic;">No biography provided.</span>'}
      </div>
      ${doc.availability && doc.availability.length > 0 ? `
        <div class="availability-grid">
          ${doc.availability.map(a => `<div class="availability-slot">${a.day} ${a.startTime || ''}${a.endTime ? '–'+a.endTime : ''}</div>`).join('')}
        </div>
      ` : ''}
      <div class="doctor-card-footer">
        <button class="btn btn-primary btn-block" onclick="openConsultationModal('${doc.userId?._id}', '${escapeHtml(doc.userId?.name || '')}')">
          Request Consultation
        </button>
      </div>
    </div>
  `).join('');
}

function filterDoctors() {
  const search = (document.getElementById('search-doctor')?.value || '').toLowerCase();
  const spec   = (document.getElementById('filter-specialization')?.value || '').toLowerCase();
  renderDoctors(allDoctors.filter(doc => {
    const nameMatch = !search || doc.userId?.name?.toLowerCase().includes(search);
    const specMatch = !spec  || doc.specialization?.toLowerCase().includes(spec);
    return nameMatch && specMatch;
  }));
}

/* ---- Consultation Modal ---- */
function openConsultationModal(doctorId, doctorName) {
  document.getElementById('modal-doctor-id').value = doctorId;
  document.getElementById('modal-doctor-name').textContent = `with Dr. ${doctorName}`;
  document.getElementById('modal-symptoms').value = '';
  document.getElementById('modal-description').value = '';
  document.getElementById('consultation-modal').classList.add('active');
}

function closeConsultationModal() {
  document.getElementById('consultation-modal').classList.remove('active');
}

async function handleRequestConsultation(e) {
  e.preventDefault();
  const doctorId    = document.getElementById('modal-doctor-id').value;
  const symptoms    = document.getElementById('modal-symptoms').value.trim();
  const description = document.getElementById('modal-description').value.trim();
  if (!symptoms) { showToast('Please describe your symptoms.', 'error'); return; }
  try {
    showLoader();
    await api.post('/patient/consultations', { doctorId, symptoms, description });
    showToast('Consultation request sent!', 'success');
    closeConsultationModal();
    loadConsultations();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}

/* ---- Consultations ---- */
async function loadConsultations() {
  try {
    const res = await api.get('/patient/consultations');
    allConsultations = res.data;
    renderConsultations(allConsultations);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderConsultations(consultations) {
  const list = document.getElementById('consultation-list');
  if (!list) return;
  if (consultations.length === 0) {
    list.innerHTML = `<div class="empty-state"><h3>No Consultations Yet</h3><p>Find a doctor and send your first consultation request.</p></div>`;
    return;
  }
  list.innerHTML = consultations.map(c => `
    <div class="consultation-card">
      <div class="consultation-info">
        <h4>Dr. ${escapeHtml(c.doctorId?.name || 'Unknown')}</h4>
        <p>${escapeHtml(c.symptoms)} &nbsp; ${getStatusBadge(c.status)}</p>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">${formatDateTime(c.createdAt)}</p>
      </div>
      <div class="consultation-actions">
        ${c.status === 'accepted' ? `<a href="/chat.html?id=${c._id}" class="btn btn-primary btn-sm">Open Chat</a>` : ''}
        ${c.status === 'closed'   ? `<a href="/chat.html?id=${c._id}" class="btn btn-secondary btn-sm">View Chat</a>` : ''}
      </div>
    </div>
  `).join('');
}

function filterConsultations(btn) {
  document.querySelectorAll('#consultation-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filter = btn.dataset.filter;
  renderConsultations(filter === 'all' ? allConsultations : allConsultations.filter(c => c.status === filter));
}

/* ---- Profile ---- */
async function loadProfile() {
  try {
    const res = await api.get('/patient/profile');
    const p = res.data;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('profile-age', p.age);
    set('profile-gender', p.gender);
    set('profile-phone', p.phone);
    set('profile-blood', p.bloodGroup);
    set('profile-history', p.medicalHistory);
  } catch (_) {}
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  try {
    showLoader();
    await api.put('/patient/profile', {
      age: parseInt(document.getElementById('profile-age').value) || null,
      gender: document.getElementById('profile-gender').value,
      phone: document.getElementById('profile-phone').value,
      bloodGroup: document.getElementById('profile-blood').value,
      medicalHistory: document.getElementById('profile-history').value,
    });
    showToast('Profile updated!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
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
      document.getElementById('profile-preview-img').src = e.target.result;
      document.getElementById('profile-preview-img').style.display = 'block';
      document.getElementById('profile-avatar-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Upload to server
    const token = localStorage.getItem('token');
    const res = await fetch('/api/patient/profile-image', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('Profile image updated!', 'success');
      // Update global user
      let currUser = JSON.parse(localStorage.getItem('user') || '{}');
      currUser.profileImage = data.profileImage;
      localStorage.setItem('user', JSON.stringify(currUser));
      document.getElementById('nav-avatar').innerHTML = `<img src="${data.profileImage}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      throw new Error(data.message || 'Image upload failed');
    }
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    hideLoader();
  }
}
