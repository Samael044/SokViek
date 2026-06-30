const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.error ? `: ${data.error}` : '';
    throw new Error((data.message || 'An error occurred') + detail);
  }
  return data;
}

export const api = {
  register: (login, password, role, profile) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ login, password, role, profile }),
    }),

  login: (login, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),

  getMe: () => request('/auth/me'),

  completeProfile: (role, profile) =>
    request('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ role, profile }),
    }),

  updateProfile: (profile) =>
    request('/profile', { method: 'PUT', body: JSON.stringify({ profile }) }),

  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/feed${query ? `?${query}` : ''}`);
  },

  getJobs: () => request('/jobs'),

  postJob: (job) =>
    request('/jobs', { method: 'POST', body: JSON.stringify(job) }),

  updateJob: (id, job) =>
    request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) }),

  deleteJob: (id) =>
    request(`/jobs/${id}`, { method: 'DELETE' }),

  getResumes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/resumes${query ? `?${query}` : ''}`);
  },

  getMyResume: () => request('/resumes/me'),

  saveResume: (resume) =>
    request('/resumes', { method: 'PUT', body: JSON.stringify(resume) }),

  getJobseekers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/resumes${query ? `?${query}` : ''}`);
  },

  getAdminReports: () => request('/admin/reports'),

  getAdminUsers: () => request('/admin/users'),

  getAdminStats: () => request('/admin/stats'),

  getDashboard: () => request('/dashboard'),

  getPendingUsers: () => request('/admin/pending-users'),

  approveUser: (id) => request(`/admin/users/${id}/approve`, { method: 'PUT' }),

  rejectUser: (id) => request(`/admin/users/${id}/reject`, { method: 'PUT' }),

  updateUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  deleteUser: (id, password) =>
    request(`/admin/users/${id}/delete`, { method: 'POST', body: JSON.stringify({ password }) }),

  // Verify the currently logged-in admin password before sensitive actions.
  verifyAdminPassword: (password) =>
    request('/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  applyJob: (jobId) => request(`/jobs/${jobId}/apply`, { method: 'POST' }),

  cancelApplyJob: (jobId) => request(`/jobs/${jobId}/apply`, { method: 'DELETE' }),

  checkApplied: (jobId) => request(`/jobs/${jobId}/applied`),

  getJobApplications: (jobId) => request(`/jobs/${jobId}/applications`),

  hireApplicant: (jobId, applicationId) =>
    request(`/jobs/${jobId}/applications/${applicationId}/hire`, { method: 'PUT' }),

  getNotifications: () => request('/notifications'),

  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  sendHireInvite: (toUserId) =>
    request('/notifications/invite', { method: 'POST', body: JSON.stringify({ toUserId }) }),

  getSavedCandidates: () => request('/saved'),
  saveCandidate: (employeeId) => request(`/saved/${employeeId}`, { method: 'POST' }),
  unsaveCandidate: (employeeId) => request(`/saved/${employeeId}`, { method: 'DELETE' }),
  getSavedStatus: (employeeId) => request(`/saved/${employeeId}/status`),

  getSavedCompanies: () => request('/saved-companies'),
  saveCompany: (companyId) => request(`/saved-companies/${companyId}`, { method: 'POST' }),
  unsaveCompany: (companyId) => request(`/saved-companies/${companyId}`, { method: 'DELETE' }),
  getSavedCompanyStatus: (companyId) => request(`/saved-companies/${companyId}/status`),

  getInterviews: () => request('/interviews'),
  getMyInterviews: () => request('/interviews/mine'),
  createInterview: (data) => request('/interviews', { method: 'POST', body: JSON.stringify(data) }),
  cancelInterview: (id) => request(`/interviews/${id}/cancel`, { method: 'PUT' }),

  submitReport: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
};

export function calculateAge(birthDate) {
  if (!birthDate) return null;
  // Normalize: strip time portion if full ISO timestamp
  const dateOnly = typeof birthDate === 'string' && birthDate.includes('T')
    ? birthDate.split('T')[0]
    : birthDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  const [y, m, d] = dateOnly.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age -= 1;
  }
  return age;
}

export function fileToBase64(file) {
  return compressImageFile(file);
}

/** ลดขนาดรูปก่อนส่งเก็บในฐานข้อมูล */
export function compressImageFile(file, maxWidth = 480) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}
