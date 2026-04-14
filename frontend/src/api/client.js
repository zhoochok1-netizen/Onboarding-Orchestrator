const API_BASE = process.env.REACT_APP_API_URL || '';

function getUserId() {
  try {
    const saved = localStorage.getItem('onboarding_user');
    return saved ? JSON.parse(saved).id : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const userId = getUserId();
  const headers = { 'Content-Type': 'application/json' };
  if (userId) headers['X-User-Id'] = userId;

  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

async function requestMultipart(path, formData) {
  const userId = getUserId();
  const headers = {};
  if (userId) headers['X-User-Id'] = userId;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST', headers, body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  getDashboard: () => request('/api/dashboard'),
  getTemplates: () => request('/api/templates'),
  getTemplate: (id) => request(`/api/templates/${id}`),
  createTemplate: (data) =>
    request('/api/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id, data) =>
    request(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id) =>
    request(`/api/templates/${id}`, { method: 'DELETE' }),
  getOnboardings: () => request('/api/onboardings'),
  getOnboarding: (id) => request(`/api/onboardings/${id}`),
  createOnboarding: (data) =>
    request('/api/onboardings', { method: 'POST', body: JSON.stringify(data) }),
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/tasks${q ? '?' + q : ''}`);
  },
  updateTaskStatus: (taskId, status) =>
    request(`/api/tasks/${taskId}/status?new_status=${status}`, { method: 'PATCH' }),
  getEmployees: () => request('/api/employees'),
  getKnowledge: (q) => request(`/api/knowledge${q ? '?q=' + encodeURIComponent(q) : ''}`),
  getDocument: (id) => request(`/api/knowledge/${id}`),
  uploadDocument: (formData) => requestMultipart('/api/knowledge/upload', formData),
  askKnowledge: (query) =>
    request('/api/knowledge/ask', { method: 'POST', body: JSON.stringify({ query }) }),
  sendChat: (message) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getChatHistory: () => request('/api/chat/history'),
};
