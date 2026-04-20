/* api.js — HTTP client with auth headers */

const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this._headers(),
    });
    return this._handle(response);
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data),
    });
    return this._handle(response);
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this._headers(),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return this._handle(response);
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this._headers(),
    });
    return this._handle(response);
  },

  async upload(endpoint, formData) {
    // For file uploads we omit Content-Type so browser sets multipart boundary
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return this._handle(response);
  },

  _headers() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async _handle(response) {
    if (!response.ok) {
      let msg = 'Request failed';
      try {
        const err = await response.json();
        msg = err.message || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return response.json();
  },
};