/* ============================================================
   utils.js — Global utilities for HMS
   ============================================================ */

/* ---------- Theme ---------- */
/* Theme toggle removed — dark-theme is always active */
function toggleTheme() { /* no-op */ }

function initTheme() {
  document.body.classList.add('light-theme');
  document.body.classList.remove('dark-theme');
}

// Note: initTheme is called from combined DOMContentLoaded at the bottom

/* ---------- Auth ---------- */
function setAuth(token, user) {
  localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

function getToken() { return localStorage.getItem('token'); }

function getUser() {
  try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
  catch (e) { return null; }
}

function removeAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function logout() {
  removeAuth();
  window.location.href = '/';
}

function requireAuth() {
  const user = getUser();
  const token = getToken();
  if (!user || !token) { window.location.href = '/'; return null; }
  populateNavUser(user);
  return user;
}

/* Populate dashboard navbar with user info */
function populateNavUser(user) {
  if (!user) return;
  const nameEl = document.getElementById('nav-name');
  const avatarEl = document.getElementById('nav-avatar');
  if (nameEl) nameEl.textContent = user.name || 'User';
  if (avatarEl) avatarEl.textContent = getInitials(user.name);
}

/* ---------- Toast ---------- */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '24px', right: '24px',
      zIndex: '99999', display: 'flex', flexDirection: 'column', gap: '8px',
      pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }

  const colors = { error: '#f43f5e', success: '#10b981', info: '#6366f1', warning: '#f59e0b' };
  const icons = { error: '✕', success: '✓', info: 'ℹ', warning: '⚠' };

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    background: colors[type] || colors.info,
    color: '#fff', padding: '12px 20px', borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: '500',
    opacity: '0', transform: 'translateX(40px)',
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    display: 'flex', alignItems: 'center', gap: '8px',
    maxWidth: '340px', pointerEvents: 'auto'
  });
  toast.innerHTML = `<span style="font-weight:700;">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)';
    setTimeout(() => { toast.remove(); if (!container.children.length) container.remove(); }, 300);
  }, duration);
}

/* ---------- Custom Confirm Modal ---------- */
function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)', zIndex: '100000', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      opacity: '0', transition: 'opacity 0.3s ease'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      background: 'var(--bg-surface)', padding: '2.5rem 2rem', borderRadius: '24px',
      boxShadow: 'var(--shadow-lg)', width: '90%', maxWidth: '420px',
      transform: 'scale(0.95)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
      textAlign: 'center', border: '1px solid var(--border-subtle)'
    });

    // We make sure it fits light/dark theme seamlessly
    modal.innerHTML = `
      <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); color: var(--warning); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; border: 1px solid rgba(245, 158, 11, 0.2);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
      </div>
      <h3 style="margin-bottom: 0.75rem; font-size: 1.35rem; color: var(--text-primary); font-family: var(--font-display);">Action Required</h3>
      <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">${escapeHtml(message)}</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="confirmCancelBtn" class="btn btn-secondary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600;">Cancel</button>
        <button id="confirmOkBtn" class="btn btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; background: var(--warning); color: #fff;">Confirm</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    });

    const close = (result) => {
      overlay.style.opacity = '0';
      modal.style.transform = 'scale(0.95)';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };

    modal.querySelector('#confirmCancelBtn').addEventListener('click', () => close(false));
    modal.querySelector('#confirmOkBtn').addEventListener('click', () => close(true));
  });
}

/* ---------- Loader ---------- */
function showLoader() {
  let el = document.getElementById('global-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-loader';
    el.innerHTML = '<div class="loader"></div>';
    Object.assign(el.style, {
      position: 'fixed', inset: '0', background: 'rgba(6,8,15,0.5)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: '99998',
    });
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}

function hideLoader() {
  const el = document.getElementById('global-loader');
  if (el) el.style.display = 'none';
}

/* ---------- Sidebar / Tabs ---------- */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const navbarContent = document.querySelector('.navbar-dashboard .nav-content');
  if (sidebar && navbarContent) {
    if (!document.getElementById('mobile-menu-btn')) {
      const btn = document.createElement('button');
      btn.id = 'mobile-menu-btn';
      btn.className = 'btn btn-ghost btn-icon mobile-only';
      btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      
      navbarContent.insertBefore(btn, navbarContent.firstChild);
      
      btn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }
}

function switchTab(el) {
  document.querySelectorAll('.sidebar-nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  const target = el.dataset.tab;
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.remove('active');
    c.style.display = 'none';
  });
  const targetEl = document.getElementById(target);
  if (targetEl) { targetEl.classList.add('active'); targetEl.style.display = 'block'; }
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

/* ---------- Formatters ---------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
  const map = {
    pending:  '<span class="badge badge-warning">Pending</span>',
    accepted: '<span class="badge badge-success">Active</span>',
    rejected: '<span class="badge badge-danger">Rejected</span>',
    closed:   '<span class="badge badge-info">Closed</span>',
  };
  return map[status] || `<span class="badge">${escapeHtml(status)}</span>`;
}

/* ---------- Navbar & Scroll Effects ---------- */
window.addEventListener('scroll', () => {
  // Sticky Nav Style
  const nav = document.querySelector('.navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);

  // Parallax animation for Doctor Image - Disabled to keep it fixed
  /*
  const doctorImg = document.getElementById('hero-doctor-img');
  if (doctorImg) {
    const scrolled = window.scrollY;
    // Scale slightly and move up to create a 3D cutout effect
    doctorImg.style.transform = `translateY(${scrolled * -0.05}px) scale(${1 + (scrolled * 0.0002)})`;
  }
  */
});

/* ---------- Interactive Services Logic ---------- */
const servicesData = {
  cardiology: {
    title: "Cardiology",
    description: "Our cardiology department offers comprehensive heart care from prevention and diagnosis to advanced surgical interventions. Equipped with state-of-the-art technology, we ensure your heart receives the utmost attention.",
    features: ["Echocardiography & TMT", "Angiography & Angioplasty", "Pacemaker Implantation", "24/7 Heart Emergency Care"]
  },
  anaesthesiology: {
    title: "Anaesthesiology",
    description: "Our expert anaesthesiologists ensure patient safety and comfort during surgical procedures. We utilize advanced monitoring systems and tailor pain management protocols for optimum recovery.",
    features: ["General & Regional Anaesthesia", "Post-operative Pain Management", "Critical Care Support", "Advanced Vitals Monitoring"]
  },
  bariatric: {
    title: "Bariatric Surgery",
    description: "Transform your life with our specialized weight loss surgery program. We provide highly effective, minimally invasive treatments paired with lifelong nutritional counseling and support.",
    features: ["Gastric Bypass & Sleeve Gastrectomy", "Minimally Invasive Techniques", "Comprehensive Nutritional Guidance", "Long-term Weight Management"]
  },
  bloodbank: {
    title: "Blood Bank",
    description: "Our fully licensed, state-of-the-art blood bank operates 24/7 to ensure a safe, secure, and rapid supply of blood products for emergencies and routine medical treatments.",
    features: ["Strict Screening & Testing", "Aphaeresis Facility", "Platelet & Plasma Separation", "24/7 On-Call Availability"]
  },
  endocrinology: {
    title: "Endocrinology & Diabetology",
    description: "We offer holistic management of hormonal and metabolic disorders, specializing in cutting-edge diabetes care, thyroid management, and advanced dietary planning.",
    features: ["Comprehensive Diabetes Care", "Thyroid & Pituitary Disorders", "Insulin Pump Therapy", "Dietary & Lifestyle Management"]
  },
  oncology: {
    title: "Medical Oncology",
    description: "Our dedicated cancer institute provides compassionate, cutting-edge treatment plans including targeted therapies, chemotherapy, and immunotherapy tailored to complex underlying cases.",
    features: ["Chemotherapy & Immunotherapy", "Targeted Cancer Therapies", "Tumor Board Consultations", "Palliative Care Support"]
  }
};

function switchService(serviceKey, element) {
  // Update active state
  document.querySelectorAll('.service-item').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');

  // Update DOM content
  const data = servicesData[serviceKey];
  const container = document.getElementById('services-dynamic-content');
  
  if(container && data) {
    let featuresHTML = data.features.map(f => `<li>${f}</li>`).join('');
    container.innerHTML = `
      <div class="service-detail">
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <ul>${featuresHTML}</ul>
      </div>
    `;

    // Auto-scroll the view to the content gracefully (specifically helpful on mobile flow)
    if (element) {
      setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }
}

// Initialize dynamic content upon load
document.addEventListener('DOMContentLoaded', () => {
  const firstTab = document.querySelector('.service-item');
  if(firstTab) {
    switchService('cardiology', null); // pass null to prevent initial auto-scroll jump
  }
});

/* ---------- Scroll Animations & Rings ---------- */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // No rings to process anymore
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollAnimations();
  initSidebar();
});