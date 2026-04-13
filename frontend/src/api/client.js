const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
  return res.json();
}

export const api = {
  getDashboard: () => request('/api/dashboard'),
  getTemplates: () => request('/api/templates'),
  getTemplate: (id) => request(`/api/templates/${id}`),
  getOnboardings: () => request('/api/onboardings'),
  getOnboarding: (id) => request(`/api/onboardings/${id}`),
  getTasks: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/tasks${q ? '?' + q : ''}`);
  },
  updateTaskStatus: (taskId, status) =>
    request(`/api/tasks/${taskId}/status?new_status=${status}`, { method: 'PATCH' }),
  getEmployees: () => request('/api/employees'),
  getKnowledge: (q) => request(`/api/knowledge${q ? '?q=' + encodeURIComponent(q) : ''}`),
  getDocument: (id) => request(`/api/knowledge/${id}`),
  sendChat: (message) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getChatHistory: () => request('/api/chat/history'),
};
