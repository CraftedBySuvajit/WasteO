const BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'wasteo_token';

// Helper to get token
const getToken = () => localStorage.getItem(TOKEN_KEY);

// Helper to get headers
const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper to format response to match what frontend expects
const formatResponse = (payload) => {
  return { data: payload };
};

// Helper to handle response
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw { response: { data: { message: data.message || 'API Error' } } };
  }
  return formatResponse(data);
};

// ──────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password, role }) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, role })
  });
  const data = await res.json();
  if (!res.ok) {
    throw { response: { data: { message: data.message || 'Login failed' } } };
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return formatResponse(data);
};

export const registerUser = async ({ name, email, dept, password }) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, dept, password, block: 'A' }) // Default block A for students
  });
  const data = await res.json();
  if (!res.ok) {
    throw { response: { data: { message: data.message || 'Registration failed' } } };
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return formatResponse(data);
};

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const forgotPasswordApi = async ({ email }) => {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email })
  });
  return handleResponse(res);
};

// ──────────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────────

export const getUsers = async (role) => {
  let url = `${BASE_URL}/users`;
  if (role) url += `?role=${role}`;
  const res = await fetch(url, { headers: getHeaders() });
  return handleResponse(res);
};

export const getUserById = async (id) => {
  const res = await fetch(`${BASE_URL}/users/${id}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const createUser = async (payload) => {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};

export const updateUser = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};

export const changePassword = async (id, { oldPassword, newPassword }) => {
  const res = await fetch(`${BASE_URL}/users/${id}/password`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return handleResponse(res);
};

export const deleteUserApi = async (id) => {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// ──────────────────────────────────────────────────────────────
// COMPLAINTS
// ──────────────────────────────────────────────────────────────

export const getComplaints = async (params = {}) => {
  let url = `${BASE_URL}/complaints`;
  const queryParams = new URLSearchParams();
  if (params.user) queryParams.append('user', params.user);
  if (params.status) queryParams.append('status', params.status);
  if (queryParams.toString()) url += `?${queryParams.toString()}`;

  const res = await fetch(url, { headers: getHeaders() });
  return handleResponse(res);
};

export const getComplaintById = async (id) => {
  const res = await fetch(`${BASE_URL}/complaints/${id}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const submitComplaint = async (payload) => {
  // Payload might be FormData if it has a file
  const isFormData = payload instanceof FormData;
  const res = await fetch(`${BASE_URL}/complaints`, {
    method: 'POST',
    headers: getHeaders(isFormData),
    body: isFormData ? payload : JSON.stringify(payload)
  });
  return handleResponse(res);
};

export const updateComplaintStatus = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/complaints/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};

export const completeComplaintApi = async (id, payload) => {
  const isFormData = payload instanceof FormData;
  const res = await fetch(`${BASE_URL}/complaints/complete/${id}`, {
    method: 'POST',
    headers: getHeaders(isFormData),
    body: isFormData ? payload : JSON.stringify(payload)
  });
  return handleResponse(res);
};

// ──────────────────────────────────────────────────────────────
// REWARDS
// ──────────────────────────────────────────────────────────────

export const getRewards = async (params = {}) => {
  let url = `${BASE_URL}/rewards`;
  if (params.user) url += `?user=${params.user}`;
  const res = await fetch(url, { headers: getHeaders() });
  return handleResponse(res);
};

export const addReward = async (payload) => {
  const res = await fetch(`${BASE_URL}/rewards`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};

// ──────────────────────────────────────────────────────────────
// STATS
// ──────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const res = await fetch(`${BASE_URL}/stats/dashboard`, { headers: getHeaders() });
  return handleResponse(res);
};

// ──────────────────────────────────────────────────────────────
// STORE
// ──────────────────────────────────────────────────────────────

export const getStoreItems = async () => {
  const res = await fetch(`${BASE_URL}/store`, { headers: getHeaders() });
  return handleResponse(res);
};

export const redeemStoreItem = async (itemId) => {
  const res = await fetch(`${BASE_URL}/store/redeem`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ itemId })
  });
  return handleResponse(res);
};

export const getOrders = async (params = {}) => {
  let url = `${BASE_URL}/orders`;
  const queryParams = new URLSearchParams();
  if (params.user) queryParams.append('user', params.user);
  if (params.status) queryParams.append('status', params.status);
  if (queryParams.toString()) url += `?${queryParams.toString()}`;

  const res = await fetch(url, { headers: getHeaders() });
  return handleResponse(res);
};

export const getOrderById = async (id) => {
  const res = await fetch(`${BASE_URL}/orders/${id}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const updateOrderStatus = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/orders/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
};

export const assignOrderApi = async (id) => {
  const res = await fetch(`${BASE_URL}/orders/${id}/assign`, {
    method: 'PUT', // Or POST depending on route
    headers: getHeaders()
  });
  return handleResponse(res);
};

// ──────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────────────────────

export const getNotifications = async () => {
  const res = await fetch(`${BASE_URL}/notifications`, { headers: getHeaders() });
  return handleResponse(res);
};

export const markNotificationRead = async (id) => {
  const res = await fetch(`${BASE_URL}/notifications/read/${id}`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const markAllNotificationsRead = async () => {
  const res = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// ──────────────────────────────────────────────────────────────
// IOT
// ──────────────────────────────────────────────────────────────

export const getIotBinData = async () => {
  const res = await fetch(`${BASE_URL}/iot/data`, { headers: getHeaders() });
  return handleResponse(res);
};
