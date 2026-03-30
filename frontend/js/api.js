const BASE_URL = '/api';

export const getToken = () => localStorage.getItem('token');
export const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
export const setAuth = (token, user) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); };
export const clearAuth = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); };

const request = async (method, url, data = null, isFormData = false) => {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const config = { method, headers };
  if (data) config.body = isFormData ? data : JSON.stringify(data);

  const res = await fetch(`${BASE_URL}${url}`, config);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
};

export const api = {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, data),
  put: (url, data) => request('PUT', url, data),
  delete: (url) => request('DELETE', url),
  postForm: (url, formData) => request('POST', url, formData, true),
  putForm: (url, formData) => request('PUT', url, formData, true),
};

export const showToast = (message, type = 'success') => {
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'fadeOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3500);
  toast.onclick = () => toast.remove();
};

export const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
export const formatDateTime = (d) => `${formatDate(d)}, ${formatTime(d)}`;

export const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(d);
};

export const getInitials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

export const getFileIcon = (mimetype = '', name = '') => {
  if (!mimetype && name) {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc','docx'].includes(ext)) return '📝';
    if (['xls','xlsx'].includes(ext)) return '📊';
    if (['zip','rar'].includes(ext)) return '🗜️';
  }
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype === 'application/pdf') return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('sheet') || mimetype.includes('excel')) return '📊';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return '🗜️';
  return '📎';
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};
