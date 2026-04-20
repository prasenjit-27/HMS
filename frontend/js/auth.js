/* auth.js — Login / register / OTP / forgot-password flows */

let pendingEmail = '';
let pendingRole = '';
let currentFlow = '';

/* Auto-redirect if already logged in */
(function checkExistingAuth() {
  const user = getUser();
  const token = getToken();
  if (user && token) redirectToDashboard(user.role);
})();

/* ---- UI Logic & Toast Notifications ---- */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      ${type === 'success'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2" style="background:rgba(29, 158, 117, 0.1); border-radius:50%; padding:2px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" stroke-width="2" style="background:rgba(226, 75, 74, 0.1); border-radius:50%; padding:2px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'}
    </div>
    <div class="toast-content">
      <h4>${type === 'success' ? 'Success' : 'Attention'}</h4>
      <p>${message}</p>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutR 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function switchAuthTab(tab) {
  const container = document.getElementById('auth-tabs-container');
  if (container) container.style.display = 'flex';
  
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));

  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const indicator = document.getElementById('auth-tabs-indicator');

  if (tab === 'login' && loginForm) {
    loginForm.classList.remove('hidden');
    const tabEl = document.querySelector('.auth-tab:nth-child(1)');
    if (tabEl) tabEl.classList.add('active');
    if (indicator) indicator.style.transform = 'translateX(0)';
  } else if (tab === 'register' && regForm) {
    regForm.classList.remove('hidden');
    const tabEl = document.querySelector('.auth-tab:nth-child(2)');
    if (tabEl) tabEl.classList.add('active');
    if (indicator) indicator.style.transform = 'translateX(100%)';
  }
}

function setRole(role) {
  document.querySelectorAll('.role-pill-btn').forEach(b => b.classList.remove('active'));
  const slider = document.getElementById('role-pill-slider');
  const specWrapper = document.getElementById('specialty-wrapper');
  const roleInput = document.getElementById('register-role-val');
  if (roleInput) roleInput.value = role;

  if (role === 'patient') {
    const btn = document.querySelector('.role-pill-btn:nth-child(2)');
    if (btn) btn.classList.add('active');
    if (slider) slider.style.transform = 'translateX(0)';
    if (specWrapper) specWrapper.classList.add('hidden');
  } else {
    const btn = document.querySelector('.role-pill-btn:nth-child(3)');
    if (btn) btn.classList.add('active');
    if (slider) slider.style.transform = 'translateX(100%)';
    if (specWrapper) specWrapper.classList.remove('hidden');
  }
}

function showForgotPassword(e) {
  if (e) e.preventDefault();
  document.getElementById('auth-tabs-container').style.display = 'none';
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('forgot-password-form').classList.remove('hidden');
}

/* ---- Live Input Validation Engine ---- */
function setError(input, msgId, show) {
  const msg = document.getElementById(msgId);
  if (show) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    if (msg) msg.classList.add('visible');
  } else {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    if (msg) msg.classList.remove('visible');
  }
}

function validateEmail(input) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
  const msgId = input.id === 'login-email' ? 'err-login-email' : (input.id === 'register-email' ? 'err-reg-email' : 'err-forgot-email');
  if (input.value.length === 0) { input.classList.remove('is-invalid', 'is-valid'); document.getElementById(msgId)?.classList.remove('visible'); return false; }
  setError(input, msgId, !valid);
  return valid;
}

function validateLength(input, min) {
  const valid = input.value.trim().length >= min;
  const msgId = input.id === 'login-password' ? 'err-login-pwd' : (input.id === 'register-name' ? 'err-reg-name' : 'err-reg-spec');
  if (input.value.length === 0) { input.classList.remove('is-invalid', 'is-valid'); document.getElementById(msgId)?.classList.remove('visible'); return false; }
  setError(input, msgId, !valid);
  return valid;
}

function validatePasswordStrength(input) {
  const val = input.value;
  const msgId = 'err-reg-pwd';
  const container = document.getElementById('pwd-strength-container');
  const label = document.getElementById('pwd-label');

  if (val.length === 0) {
    input.classList.remove('is-invalid', 'is-valid');
    document.getElementById(msgId)?.classList.remove('visible');
    container.classList.add('hidden');
    return false;
  }
  container.classList.remove('hidden');

  let score = 0;
  if (val.length > 5) score++;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  if (score > 4) score = 4;

  const bars = [1, 2, 3, 4].map(n => document.getElementById(`pwd-bar-${n}`));
  bars.forEach(b => b.className = 'pwd-bar');

  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  label.textContent = labels[Math.max(0, score - 1)];

  for (let i = 0; i < score; i++) {
    bars[i].classList.add(`bar-fill-${score}`);
  }

  const valid = val.length >= 8;
  setError(input, msgId, !valid);
  return valid;
}

/* ---- Submit Handlers ---- */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim().toLowerCase();
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role-val').value;
  const spec = document.getElementById('register-specialty') ? document.getElementById('register-specialty').value.trim() : '';

  if (!name || !email || !password || (role === 'doctor' && !spec)) {
    showToast('Please correctly fill all highlighted form fields.', 'error');
    return;
  }

  const btn = document.getElementById('register-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader loader-sm"></span> Creating…';

  try {
    const payload = { name, email, password, role };
    if (role === 'doctor') payload.specialty = spec;
    const res = await api.post('/auth/register', payload);
    showToast(res.message || 'Check your email for the OTP.', 'success');
    pendingEmail = email; pendingRole = role; currentFlow = 'register';
    openOtpModal(email);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Create account';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showToast('Complete all fields before submitting.', 'error'); return; }

  const btn = document.getElementById('login-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader loader-sm"></span> Signing in…';

  try {
    const res = await api.post('/auth/login', { email, password });
    showToast(res.message || 'Verification successful, loading dashboard.', 'success');
    setAuth(res.data.token, res.data.user);
    setTimeout(() => redirectToDashboard(res.data.user.role), 1200);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign in';
  }
}

async function handleForgotPasswordSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim().toLowerCase();
  if (!email) { showToast('Please provide a valid email format.', 'error'); return; }

  const btn = document.getElementById('forgot-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader loader-sm"></span> Sending…';

  try {
    const res = await api.post('/auth/forgot-password', { email });
    showToast(res.message || 'Secured reset code dispatched!', 'success');
    pendingEmail = email; currentFlow = 'forgot_password';
    openOtpModal(email);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Send code';
  }
}

/* ---- OTP Modal ---- */
function openOtpModal(email) {
  const display = document.getElementById('otp-email-display');
  if (display) display.textContent = `Enter the 6-digit code sent to ${email}`;
  const titleEl = document.getElementById('otp-title');
  const resetGroup = document.getElementById('reset-password-group');
  if (currentFlow === 'forgot_password') {
    if (titleEl) titleEl.textContent = 'Reset password';
    if (resetGroup) resetGroup.classList.remove('hidden');
  } else {
    if (titleEl) titleEl.textContent = 'Verify email';
    if (resetGroup) resetGroup.classList.add('hidden');
  }
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach(inp => inp.value = '');
  if (inputs[0]) inputs[0].focus();
  const modal = document.getElementById('otp-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeOtpModal() {
  const m = document.getElementById('otp-modal');
  if (m) m.classList.add('hidden');
}

/* OTP auto-advance */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.otp-input').forEach((input, idx, arr) => {
    input.addEventListener('input', e => { if (e.target.value && idx < arr.length - 1) arr[idx + 1].focus(); });
    input.addEventListener('keydown', e => { if (e.key === 'Backspace' && !input.value && idx > 0) arr[idx - 1].focus(); });
    input.addEventListener('paste', e => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').trim();
      if (pasted.length === 6 && /^\d+$/.test(pasted)) { arr.forEach((inp, i) => inp.value = pasted[i] || ''); arr[5].focus(); }
    });
  });
});

/* ---- Verify OTP ---- */
async function handleVerifyOtp() {
  const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  if (otp.length !== 6) { showToast('Enter the complete 6-digit code.', 'error'); return; }
  const btn = document.getElementById('verify-otp-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader loader-sm"></span> Verifying…';
  try {
    if (currentFlow === 'forgot_password') {
      const pw = document.getElementById('reset-new-password').value;
      if (!pw) { showToast('Enter a new password.', 'error'); btn.disabled = false; btn.textContent = 'Verify & continue'; return; }
      const res = await api.post('/auth/reset-password', { email: pendingEmail, otp, newPassword: pw });
      showToast(res.message || 'Password reset!', 'success');
      closeOtpModal();
      if (window.location.pathname.includes('login')) {
         switchAuthTab('login');
      } else {
         window.location.href = '/login.html';
      }
    } else {
      const res = await api.post('/auth/verify-otp', { email: pendingEmail, otp });
      setAuth(res.data.token, res.data.user);
      showToast('Verified!', 'success');
      closeOtpModal();
      setTimeout(() => redirectToDashboard(res.data.user.role), 400);
    }
  } catch (error) { showToast(error.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Verify & continue'; }
}

/* ---- Redirect ---- */
function redirectToDashboard(role) {
  const map = { patient: '/patient-dashboard.html', doctor: '/doctor-dashboard.html', admin: '/admin-dashboard.html' };
  window.location.href = map[role] || '/';
}

/* Start on login panel if on login page */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('auth-tabs-container')) {
    switchAuthTab('login');
  }
});
