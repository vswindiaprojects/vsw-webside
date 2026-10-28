const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

const request = async (path, options = {}) => {
  let response
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20000)

  try {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) },
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request took too long. Check your connection and try again.')
    throw new Error(`Cannot connect to the API at ${API_BASE}. Start the backend server and check its URL/port.`)
  } finally {
    window.clearTimeout(timeout)
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fallback = response.status === 429
      ? 'The inquiry service is temporarily rate-limited. Please wait a few minutes, then try again.'
      : `Request failed with HTTP ${response.status}.`
    const error = new Error(payload.message || fallback)
    error.status = response.status
    error.retryAfter = response.headers.get('Retry-After')
    throw error
  }
  return payload
}

export const api = {
  projects: () => request('/projects?limit=100'),
  services: () => request('/services'),
  company: () => request('/settings'),
  publicContent: () => request('/content'),
  contact: (token, data) => request('/contact', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  contactMessage: (data) => request('/contact/message', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: (token) => request('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  adminMe: (token) => request('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  userRegister: (data) => request('/users/register', { method: 'POST', body: JSON.stringify(data) }),
  userLogin: (data) => request('/users/login', { method: 'POST', body: JSON.stringify(data) }),
  userLogout: (token) => request('/users/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  requestPasswordResetOtp: (data) => request('/users/password/reset/request', { method: 'POST', body: JSON.stringify(data) }),
  resetPasswordWithOtp: (data) => request('/users/password/reset', { method: 'POST', body: JSON.stringify(data) }),
  requestPasswordChangeOtp: (token) => request('/users/password/change/request', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  changePasswordWithOtp: (token, data) => request('/users/password/change', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  userProfile: (token) => request('/users/me', { headers: { Authorization: `Bearer ${token}` } }),
  accountDashboard: (token, params = {}) => request(`/users/me/dashboard?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  userInquiries: (token, params = {}) => request(`/users/me/inquiries?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  userSummary: (token) => request('/users/me/summary', { headers: { Authorization: `Bearer ${token}` } }),
  updateProfile: (token, data) => request('/users/me', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  accountSettings: (token) => request('/users/me/settings', { headers: { Authorization: `Bearer ${token}` } }),
  updateAccountSettings: (token, data) => request('/users/me/settings', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  notifications: (token) => request('/users/me/notifications', { headers: { Authorization: `Bearer ${token}` } }),
  markNotificationRead: (token, id) => request(`/users/me/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }),
  markAllNotificationsRead: (token) => request('/users/me/notifications/read-all', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }),
  accountActivity: (token) => request('/users/me/activity', { headers: { Authorization: `Bearer ${token}` } }),
  deactivateAccount: (token) => request('/users/me', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  inquiryDetails: (token, id) => request(`/users/me/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  inquiryMessages: (token, id) => request(`/users/me/inquiries/${id}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
  replyToInquiry: (token, id, message) => request(`/contact/${id}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ message }) }),
  adminProjects: (token) => request('/projects?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
  adminServices: (token) => request('/services', { headers: { Authorization: `Bearer ${token}` } }),
  messages: (token) => request('/contact?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
  inquiryStatuses: (token) => request('/contact/statuses', { headers: { Authorization: `Bearer ${token}` } }),
  adminInquiryMessages: (token, id) => request(`/contact/${id}/messages/admin`, { headers: { Authorization: `Bearer ${token}` } }),
  adminReplyToInquiry: (token, id, message) => request(`/contact/${id}/messages/admin`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ message }) }),
  updateMessage: (token, id, status) => request(`/contact/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
  adminUsers: (token) => request('/users?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
  updateUserStatus: (token, id, status) => request(`/users/${id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
  deleteProject: (token, id) => request(`/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  createProject: (token, data) => request('/projects', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  adminDashboard: (token) => request('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
  adminUsersPage: (token, params = {}) => request(`/admin/users?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  adminUser: (token, id) => request(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  saveAdminUser: (token, id, data) => request(`/admin/users/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deleteAdminUser: (token, id) => request(`/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminInquiries: (token, params = {}) => request(`/admin/inquiries?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  adminInquiry: (token, id) => request(`/admin/inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  saveAdminInquiry: (token, id, data) => request(`/admin/inquiries/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  addInquiryNote: (token, id, note) => request(`/admin/inquiries/${id}/notes`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ note }) }),
  adminProjectsPage: (token, params = {}) => request(`/admin/projects?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  adminProject: (token, id) => request(`/admin/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  saveAdminProject: (token, id, data) => request(`/admin/projects${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  archiveAdminProject: (token, id) => request(`/admin/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminServicesPage: (token, params = {}) => request(`/admin/services?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  saveAdminService: (token, id, data) => request(`/admin/services${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deleteAdminService: (token, id) => request(`/admin/services/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminCompany: (token) => request('/admin/company', { headers: { Authorization: `Bearer ${token}` } }),
  saveAdminCompany: (token, data) => request('/admin/company', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  websiteContent: (token) => request('/admin/content', { headers: { Authorization: `Bearer ${token}` } }),
  saveWebsiteContent: (token, data) => request('/admin/content', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  adminContacts: (token, params = {}) => request(`/admin/contacts?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  saveAdminContact: (token, id, status) => request(`/admin/contacts/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
  deleteAdminContact: (token, id) => request(`/admin/contacts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminMedia: (token) => request('/admin/media?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
  uploadAdminMedia: (token, formData) => request('/admin/media', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }),
  updateAdminMedia: (token, id, data) => request(`/admin/media/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deleteAdminMedia: (token, id) => request(`/admin/media/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminDocuments: (token) => request('/admin/documents', { headers: { Authorization: `Bearer ${token}` } }),
  createAdminDocument: (token, data) => request('/admin/documents', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deleteAdminDocument: (token, id) => request(`/admin/documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminAccounts: (token) => request('/admin/admins', { headers: { Authorization: `Bearer ${token}` } }),
  createAdminAccount: (token, data) => request('/admin/admins', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  updateAdminAccount: (token, id, data) => request(`/admin/admins/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
  deleteAdminAccount: (token, id) => request(`/admin/admins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminNotifications: (token) => request('/admin/notifications', { headers: { Authorization: `Bearer ${token}` } }),
  markAdminNotification: (token, id) => request(`/admin/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }),
  markAllAdminNotifications: (token) => request('/admin/notifications/read-all', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }),
  deleteAdminNotification: (token, id) => request(`/admin/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  adminReports: (token, params = {}) => request(`/admin/reports?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } }),
  adminSettings: (token) => request('/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
  changeAdminPassword: (token, data) => request('/admin/security/password', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) }),
}
