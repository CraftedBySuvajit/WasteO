const TOKEN_KEY = 'wasteo_token';

// Helper to get/set from localStorage
const getStorageItem = (key, defaultVal) => {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultVal;
};

const setStorageItem = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Seed Data Initialization (Expanded for full dashboard features)
const initData = () => {
  if (!localStorage.getItem('wasteo_users')) {
    setStorageItem('wasteo_users', [
      { _id: '1', name: 'System Admin', email: 'admin@edu.in', password: '12345678', role: 'admin', block: 'A', reward_points: 100 },
      { _id: '2', name: 'Student 1', email: 'student1@edu.in', password: '12345678', role: 'student', dept: 'Computer Science', block: 'A', reward_points: 350 },
      { _id: '3', name: 'Collector 1', email: 'collector1@edu.in', password: '12345678', role: 'collector', block: 'A', reward_points: 100 },
      { _id: '4', name: 'Student 2', email: 'student2@edu.in', password: '12345678', role: 'student', dept: 'Mechanical', block: 'B', reward_points: 50 },
      { _id: '5', name: 'Collector 2', email: 'collector2@edu.in', password: '12345678', role: 'collector', block: 'B', reward_points: 100 },
      { _id: '6', name: 'Student 3', email: 'student3@edu.in', password: '12345678', role: 'student', dept: 'Electrical', block: 'C', reward_points: 200 }
    ]);
  }
  
  if (!localStorage.getItem('wasteo_complaints')) {
    setStorageItem('wasteo_complaints', [
      { _id: 'c1', complaint_id: 'C-1', user_id: '2', location: 'Canteen Backside', waste_type: 'organic', description: 'Leftover food waste causing bad smell.', status: 'pending', block: 'A', createdAt: new Date().toISOString() },
      { _id: 'c2', complaint_id: 'C-2', user_id: '4', location: 'Main Library Entrance', waste_type: 'plastic', description: 'Empty water bottles scattered near the steps.', status: 'completed', block: 'B', assignedTo: '3', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'c3', complaint_id: 'C-3', user_id: '2', location: 'Hostel A Gate', waste_type: 'paper', description: 'Cardboard boxes blocking the walkway.', status: 'in-progress', block: 'A', assignedTo: '3', createdAt: new Date(Date.now() - 43200000).toISOString() },
      { _id: 'c4', complaint_id: 'C-4', user_id: '6', location: 'Auditorium Garden', waste_type: 'hazardous', description: 'Leaking battery found near source.', status: 'pending', block: 'C', createdAt: new Date().toISOString() },
      { _id: 'c5', complaint_id: 'C-5', user_id: '2', location: 'Parking Zone 2', waste_type: 'metal', description: 'Rusty scrap metal parts dumped.', status: 'completed', block: 'A', assignedTo: '3', createdAt: new Date(Date.now() - 172800000).toISOString() },
      { _id: 'c6', complaint_id: 'C-6', user_id: '4', location: 'Block B Lab', waste_type: 'hazardous', description: 'Chemical waste containers unattended.', status: 'rejected', block: 'B', createdAt: new Date(Date.now() - 259200000).toISOString() }
    ]);
  }
  
  if (!localStorage.getItem('wasteo_store_items')) {
    setStorageItem('wasteo_store_items', [
      { _id: 's1', name: 'Reusable Bottle', description: '500ml stainless steel vacuum flask.', image: 'https://images.unsplash.com/photo-1602143307185-8a1550552844?w=400', points_required: 300, stock: 20, category: 'accessories' },
      { _id: 's2', name: 'Recycled Notebook', description: 'Eco-friendly A5 notebook from recycled paper.', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400', points_required: 150, stock: 50, category: 'stationery' },
      { _id: 's3', name: 'Plant Sapling', description: 'Native sapling for campus planting.', image: 'https://images.unsplash.com/photo-1592150621344-22d50897be4d?w=400', points_required: 200, stock: 30, category: 'garden' },
      { _id: 's4', name: 'Bamboo Toothbrush', description: 'Biodegradable bamboo handle.', image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400', points_required: 50, stock: 100, category: 'accessories' }
    ]);
  }
  
  if (!localStorage.getItem('wasteo_rewards')) {
    setStorageItem('wasteo_rewards', [
      { _id: 'r1', user_id: '2', activity: 'Waste Reporting Reward', points: 10, date: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'r2', user_id: '2', activity: 'Campus Cleanup', points: 50, date: new Date(Date.now() - 172800000).toISOString() },
      { _id: 'r3', user_id: '2', activity: 'Expert Reporting', points: 100, date: new Date(Date.now() - 259200000).toISOString() }
    ]);
  }
  
  if (!localStorage.getItem('wasteo_orders')) {
    setStorageItem('wasteo_orders', [
      { _id: 'o1', orderId: 'ORD-1A2B', user: '2', userName: 'Student 1', itemName: 'Recycled Notebook', pointsUsed: 150, status: 'delivered', createdAt: new Date(Date.now() - 172800000).toISOString() },
      { _id: 'o2', orderId: 'ORD-3C4D', user: '2', userName: 'Student 1', itemName: 'Plant Sapling', pointsUsed: 200, status: 'pending', createdAt: new Date().toISOString() },
      { _id: 'o3', orderId: 'ORD-5E6F', user: '4', userName: 'Student 2', itemName: 'Bamboo Toothbrush', pointsUsed: 50, status: 'approved', createdAt: new Date(Date.now() - 86400000).toISOString() }
    ]);
  }
  
  if (!localStorage.getItem('wasteo_notifications')) {
    setStorageItem('wasteo_notifications', [
      { _id: 'n1', user_id: '2', message: 'Your complaint C-2 has been completed!', type: 'success', read: false, createdAt: new Date().toISOString() },
      { _id: 'n2', user_id: '2', message: 'You earned 50 points for Campus Cleanup!', type: 'reward', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
      { _id: 'n3', user_id: '2', message: 'Welcome to WasteO! Start reporting waste to earn points.', type: 'info', read: true, createdAt: new Date(Date.now() - 604800000).toISOString() }
    ]);
  }
  
  if (!localStorage.getItem('wasteo_bin_data')) {
    setStorageItem('wasteo_bin_data', [
      { bin_id: 'BIN-A-1', block: 'A', level: 80 },
      { bin_id: 'BIN-B-1', block: 'B', level: 40 },
      { bin_id: 'BIN-C-1', block: 'C', level: 20 },
      { bin_id: 'BIN-D-1', block: 'D', level: 95 },
      { bin_id: 'BIN-A-2', block: 'A', level: 15 }
    ]);
  }
};

initData();

// Helper to format response
const formatResponse = (payload) => {
  return { data: payload };
};

// Helper to get current user from token
const getCurrentUser = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const users = getStorageItem('wasteo_users', []);
  return users.find(u => u._id === token) || null;
};

// ──────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password, role }) => {
  const users = getStorageItem('wasteo_users', []);
  const user = users.find(u => u.email === email && u.password === password && u.role === role);
  
  if (!user) {
    throw { response: { data: { message: 'Invalid credentials or role' } } };
  }
  
  localStorage.setItem(TOKEN_KEY, user._id);
  return formatResponse({ token: user._id, user });
};

export const registerUser = async ({ name, email, dept, password }) => {
  const users = getStorageItem('wasteo_users', []);
  if (users.find(u => u.email === email)) {
    throw { response: { data: { message: 'Email already registered' } } };
  }
  
  const newUser = {
    _id: `u${Date.now()}`,
    name,
    email,
    dept,
    password,
    role: 'student',
    block: 'A',
    reward_points: 100 // Welcome bonus
  };
  
  users.push(newUser);
  setStorageItem('wasteo_users', users);
  
  localStorage.setItem(TOKEN_KEY, newUser._id);
  return formatResponse({ token: newUser._id, user: newUser });
};

export const getMe = async () => {
  const user = getCurrentUser();
  if (!user) {
    throw { response: { data: { message: 'Not authenticated' } } };
  }
  return formatResponse(user);
};

export const forgotPasswordApi = async ({ email }) => {
  const users = getStorageItem('wasteo_users', []);
  const user = users.find(u => u.email === email);
  if (!user) {
    throw { response: { data: { message: 'Email not found' } } };
  }
  return formatResponse({ message: 'Reset instructions sent to your email.' });
};

// ──────────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────────

export const getUsers = async (role) => {
  let users = getStorageItem('wasteo_users', []);
  if (role) users = users.filter(u => u.role === role);
  return formatResponse(users);
};

export const getUserById = async (id) => {
  const users = getStorageItem('wasteo_users', []);
  const user = users.find(u => u._id === id);
  if (!user) throw { response: { data: { message: 'User not found' } } };
  return formatResponse(user);
};

export const createUser = async (payload) => {
  const users = getStorageItem('wasteo_users', []);
  const newUser = { _id: `u${Date.now()}`, ...payload };
  users.push(newUser);
  setStorageItem('wasteo_users', users);
  return formatResponse(newUser);
};

export const updateUser = async (id, payload) => {
  const users = getStorageItem('wasteo_users', []);
  const index = users.findIndex(u => u._id === id);
  if (index === -1) throw { response: { data: { message: 'User not found' } } };
  
  users[index] = { ...users[index], ...payload };
  setStorageItem('wasteo_users', users);
  return formatResponse(users[index]);
};

export const changePassword = async (id, { oldPassword, newPassword }) => {
  const users = getStorageItem('wasteo_users', []);
  const index = users.findIndex(u => u._id === id);
  if (index === -1) throw { response: { data: { message: 'User not found' } } };
  
  if (users[index].password !== oldPassword) {
    throw { response: { data: { message: 'Incorrect old password' } } };
  }
  
  users[index].password = newPassword;
  setStorageItem('wasteo_users', users);
  return formatResponse({ message: 'Password updated successfully' });
};

export const deleteUserApi = async (id) => {
  let users = getStorageItem('wasteo_users', []);
  users = users.filter(u => u._id !== id);
  setStorageItem('wasteo_users', users);
  return formatResponse({ message: 'User deleted' });
};

// ──────────────────────────────────────────────────────────────
// COMPLAINTS
// ──────────────────────────────────────────────────────────────

export const getComplaints = async (params = {}) => {
  let complaints = getStorageItem('wasteo_complaints', []);
  if (params.user) complaints = complaints.filter(c => c.user_id === params.user);
  if (params.status) complaints = complaints.filter(c => c.status === params.status);
  return formatResponse(complaints);
};

export const getComplaintById = async (id) => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const complaint = complaints.find(c => c._id === id);
  if (!complaint) throw { response: { data: { message: 'Complaint not found' } } };
  return formatResponse(complaint);
};

export const submitComplaint = async (payload) => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const user = getCurrentUser();
  
  let newComplaint = {
    _id: `c${Date.now()}`,
    complaint_id: `C-${Date.now()}`,
    user_id: user?._id || '2',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...payload
  };
  
  if (payload instanceof FormData) {
    newComplaint = {
      ...newComplaint,
      location: payload.get('location'),
      waste_type: payload.get('waste_type'),
      description: payload.get('description'),
      block: payload.get('block'),
      image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400'
    };
  }
  
  complaints.push(newComplaint);
  setStorageItem('wasteo_complaints', complaints);
  return formatResponse(newComplaint);
};

export const updateComplaintStatus = async (id, payload) => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const index = complaints.findIndex(c => c._id === id);
  if (index === -1) throw { response: { data: { message: 'Complaint not found' } } };
  
  complaints[index] = { ...complaints[index], ...payload };
  setStorageItem('wasteo_complaints', complaints);
  return formatResponse(complaints[index]);
};

export const completeComplaintApi = async (id, payload) => {
  return updateComplaintStatus(id, { status: 'completed', ...payload });
};

// ──────────────────────────────────────────────────────────────
// REWARDS
// ──────────────────────────────────────────────────────────────

export const getRewards = async (params = {}) => {
  let rewards = getStorageItem('wasteo_rewards', []);
  if (params.user) rewards = rewards.filter(r => r.user_id === params.user);
  return formatResponse(rewards);
};

export const addReward = async (payload) => {
  const rewards = getStorageItem('wasteo_rewards', []);
  const newReward = { _id: `r${Date.now()}`, date: new Date().toISOString(), ...payload };
  rewards.push(newReward);
  setStorageItem('wasteo_rewards', rewards);
  
  const users = getStorageItem('wasteo_users', []);
  const userIndex = users.findIndex(u => u._id === payload.user_id);
  if (userIndex !== -1) {
    users[userIndex].reward_points = (users[userIndex].reward_points || 0) + payload.points;
    setStorageItem('wasteo_users', users);
  }
  
  return formatResponse(newReward);
};

// ──────────────────────────────────────────────────────────────
// STATS
// ──────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const users = getStorageItem('wasteo_users', []);
  
  const stats = {
    totalComplaints: complaints.length,
    pendingComplaints: complaints.filter(c => c.status === 'pending').length,
    completedComplaints: complaints.filter(c => c.status === 'completed').length,
    totalStudents: users.filter(u => u.role === 'student').length,
    totalCollectors: users.filter(u => u.role === 'collector').length,
  };
  
  return formatResponse(stats);
};

// ──────────────────────────────────────────────────────────────
// STORE
// ──────────────────────────────────────────────────────────────

export const getStoreItems = async () => {
  const items = getStorageItem('wasteo_store_items', []);
  return formatResponse(items);
};

export const redeemStoreItem = async (itemId) => {
  const items = getStorageItem('wasteo_store_items', []);
  const item = items.find(i => i._id === itemId);
  if (!item) throw { response: { data: { message: 'Item not found' } } };
  
  const user = getCurrentUser();
  if (!user) throw { response: { data: { message: 'Not authenticated' } } };
  
  if (user.reward_points < item.points_required) {
    throw { response: { data: { message: 'Insufficient points' } } };
  }
  
  const users = getStorageItem('wasteo_users', []);
  const userIndex = users.findIndex(u => u._id === user._id);
  users[userIndex].reward_points -= item.points_required;
  setStorageItem('wasteo_users', users);
  
  const orders = getStorageItem('wasteo_orders', []);
  const newOrder = {
    _id: `o${Date.now()}`,
    orderId: `ORD-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    user: user._id,
    userName: user.name,
    itemName: item.name,
    pointsUsed: item.points_required,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.push(newOrder);
  setStorageItem('wasteo_orders', orders);
  
  return formatResponse(newOrder);
};

export const getOrders = async (params = {}) => {
  let orders = getStorageItem('wasteo_orders', []);
  if (params.user) orders = orders.filter(o => o.user === params.user);
  if (params.status) orders = orders.filter(o => o.status === params.status);
  return formatResponse(orders);
};

export const getOrderById = async (id) => {
  const orders = getStorageItem('wasteo_orders', []);
  const order = orders.find(o => o._id === id);
  if (!order) throw { response: { data: { message: 'Order not found' } } };
  return formatResponse(order);
};

export const updateOrderStatus = async (id, payload) => {
  const orders = getStorageItem('wasteo_orders', []);
  const index = orders.findIndex(o => o._id === id);
  if (index === -1) throw { response: { data: { message: 'Order not found' } } };
  
  orders[index] = { ...orders[index], ...payload };
  setStorageItem('wasteo_orders', orders);
  return formatResponse(orders[index]);
};

export const assignOrderApi = async (id) => {
  const user = getCurrentUser();
  return updateOrderStatus(id, { assignedTo: user?._id, status: 'approved' });
};

// ──────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────────────────────

export const getNotifications = async () => {
  const user = getCurrentUser();
  let notifications = getStorageItem('wasteo_notifications', []);
  if (user) notifications = notifications.filter(n => n.user_id === user._id);
  return formatResponse(notifications);
};

export const markNotificationRead = async (id) => {
  const notifications = getStorageItem('wasteo_notifications', []);
  const index = notifications.findIndex(n => n._id === id);
  if (index !== -1) {
    notifications[index].read = true;
    setStorageItem('wasteo_notifications', notifications);
  }
  return formatResponse({ success: true });
};

export const markAllNotificationsRead = async () => {
  const user = getCurrentUser();
  const notifications = getStorageItem('wasteo_notifications', []);
  notifications.forEach(n => {
    if (n.user_id === user?._id) n.read = true;
  });
  setStorageItem('wasteo_notifications', notifications);
  return formatResponse({ success: true });
};

// ──────────────────────────────────────────────────────────────
// IOT
// ──────────────────────────────────────────────────────────────

export const getIotBinData = async () => {
  const data = getStorageItem('wasteo_bin_data', []);
  return formatResponse(data);
};
