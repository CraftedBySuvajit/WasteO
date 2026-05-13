const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'wasteo_token';

const getStorageItem = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch { return defaultVal; }
};
const setStorageItem = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── Auth Helpers (placed here so token tracking can use them) ──
const getCurrentUser = () => {
  const id = localStorage.getItem(TOKEN_KEY);
  if (!id) return null;
  const users = getStorageItem('wasteo_users', []);
  return users.find(u => u._id === id) || null;
};
const normalizeUser = (u) => u ? ({ ...u, rewardPoints: u.reward_points || 0 }) : null;

// ── Token/ID Tracking System ──────────────────────────────────
const TRACKING_KEY = 'wasteo_token_tracking';

/** Tag every tracking entry with the logged-in user so logs stay isolated. */
export const trackToken = (type, id, meta = {}) => {
  const user = getCurrentUser();
  const log = getStorageItem(TRACKING_KEY, []);
  const entry = {
    type,
    id,
    meta,
    timestamp: new Date().toISOString(),
    userId: user?._id || null,
    userRole: user?.role || null,
  };
  log.unshift(entry);
  setStorageItem(TRACKING_KEY, log.slice(0, 500)); // keep last 500 across all users
  // fire custom event so UI can react
  window.dispatchEvent(new CustomEvent('wasteo:token', { detail: entry }));
};

/**
 * Returns tracking log entries:
 *  - admin  → all entries (every user's activity)
 *  - others → only own entries (userId === current user._id)
 */
export const getTokenTracking = (forceAll = false) => {
  const user = getCurrentUser();
  const log = getStorageItem(TRACKING_KEY, []);
  if (!user) return [];
  if (user.role === 'admin' || forceAll) return log; // admin sees everything
  return log.filter(e => e.userId === user._id);
};

/**
 * Search complaints and orders by token ID:
 *  - admin  → searches ALL records
 *  - student / collector → only returns records owned by the current user
 */
export const searchByToken = async (id) => {
  const user = getCurrentUser();
  const q = id.trim().toUpperCase();
  const isAdmin = user?.role === 'admin';

  // Search complaints
  const complaints = getStorageItem('wasteo_complaints', []);
  const complaint = complaints.find(c => {
    const idMatch = (c.complaintId || '').toUpperCase() === q || (c._id || '').toUpperCase() === q;
    if (!idMatch) return false;
    // Non-admins can only view their own complaints
    if (!isAdmin && user && c.user_id !== user._id) return false;
    return true;
  });
  if (complaint) {
    return {
      data: {
        type: 'complaint',
        id: complaint.complaintId || complaint._id,
        status: complaint.status,
        location: complaint.location,
        block: complaint.block,
        wasteType: complaint.wasteType,
        description: complaint.description,
        createdAt: complaint.createdAt,
        assignedTo: complaint.assignedTo,
        rejectionReason: complaint.rejectionReason,
        statusHistory: complaint.statusHistory || [],
        history: complaint.statusHistory || [],
        image: complaint.image,
        completionImage: complaint.completionImage,
        // Admin extras
        filedBy: isAdmin ? (complaint.user_id) : undefined,
      }
    };
  }

  // Search orders
  const orders = getStorageItem('wasteo_orders', []);
  const order = orders.find(o => {
    const idMatch = (o.orderId || '').toUpperCase() === q || (o._id || '').toUpperCase() === q;
    if (!idMatch) return false;
    // Non-admins can only view their own orders
    if (!isAdmin && user && o.user_id !== user._id) return false;
    return true;
  });
  if (order) {
    return {
      data: {
        type: 'order',
        id: order.orderId || order._id,
        status: order.status,
        itemName: order.itemName,
        pointsUsed: order.pointsUsed,
        pickupCode: order.pickupCode,
        pickupLocation: order.pickupLocation,
        pickupTime: order.pickupTime,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        expiresAt: order.expiresAt,
        history: [],
        // Admin extras
        orderedBy: isAdmin ? (order.user_id) : undefined,
      }
    };
  }

  // Not found (or not owned by this user)
  throw { response: { data: { message: isAdmin ? 'Token not found in system.' : 'Token not found. You can only search your own complaint or order IDs.' } } };
};


// ── Seed ──────────────────────────────────────────────────────
const initData = () => {
  if (!localStorage.getItem('wasteo_users')) {
    setStorageItem('wasteo_users', [
      { _id: '1', name: 'System Admin', email: 'admin@edu.in', password: '12345678', role: 'admin', block: 'A', reward_points: 100 },
      { _id: '2', name: 'Student 1', email: 'student1@edu.in', password: '12345678', role: 'student', dept: 'Computer Science', block: 'A', reward_points: 350 },
      { _id: '3', name: 'Collector 1', email: 'collector1@edu.in', password: '12345678', role: 'collector', block: 'A', reward_points: 100 },
      { _id: '4', name: 'Student 2', email: 'student2@edu.in', password: '12345678', role: 'student', dept: 'Mechanical', block: 'B', reward_points: 50 },
      { _id: '5', name: 'Collector 2', email: 'collector2@edu.in', password: '12345678', role: 'collector', block: 'B', reward_points: 100 },
      { _id: '6', name: 'Student 3', email: 'student3@edu.in', password: '12345678', role: 'student', dept: 'Electrical', block: 'C', reward_points: 200 },
    ]);
  }

  if (!localStorage.getItem('wasteo_complaints')) {
    setStorageItem('wasteo_complaints', [
      { _id: 'c1', complaintId: 'COMP-001', user_id: '2', location: 'Canteen Backside', wasteType: 'organic', description: 'Leftover food waste causing bad smell.', status: 'pending', block: 'A', statusHistory: [{ status: 'pending', note: 'Complaint submitted', timestamp: new Date().toISOString() }], createdAt: new Date().toISOString() },
      { _id: 'c2', complaintId: 'COMP-002', user_id: '4', location: 'Main Library Entrance', wasteType: 'plastic', description: 'Empty water bottles scattered near steps.', status: 'completed', block: 'B', assignedTo: '3', statusHistory: [{ status: 'completed', note: 'Area cleaned', timestamp: new Date().toISOString() }], createdAt: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'c3', complaintId: 'COMP-003', user_id: '2', location: 'Hostel A Gate', wasteType: 'paper', description: 'Cardboard boxes blocking walkway.', status: 'in-progress', block: 'A', assignedTo: '3', statusHistory: [{ status: 'in-progress', note: 'Collector assigned', timestamp: new Date().toISOString() }], createdAt: new Date(Date.now() - 43200000).toISOString() },
      { _id: 'c4', complaintId: 'COMP-004', user_id: '6', location: 'Auditorium Garden', wasteType: 'hazardous', description: 'Leaking battery found near source.', status: 'pending', block: 'C', statusHistory: [{ status: 'pending', note: 'Complaint submitted', timestamp: new Date().toISOString() }], createdAt: new Date().toISOString() },
    ]);
  }

  if (!localStorage.getItem('wasteo_store_items')) {
    setStorageItem('wasteo_store_items', [
      { _id: 's1', name: 'Reusable Bottle', description: '500ml stainless steel vacuum flask.', image: 'https://images.unsplash.com/photo-1602143307185-8a1550552844?w=400', pointsRequired: 300, stock: 20, category: 'accessories' },
      { _id: 's2', name: 'Recycled Notebook', description: 'Eco-friendly A5 notebook from recycled paper.', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400', pointsRequired: 150, stock: 50, category: 'stationery' },
      { _id: 's3', name: 'Plant Sapling', description: 'Native sapling for campus planting.', image: 'https://images.unsplash.com/photo-1592150621344-22d50897be4d?w=400', pointsRequired: 200, stock: 30, category: 'garden' },
      { _id: 's4', name: 'Bamboo Toothbrush', description: 'Biodegradable bamboo handle.', image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400', pointsRequired: 50, stock: 100, category: 'accessories' },
    ]);
  }

  if (!localStorage.getItem('wasteo_rewards')) {
    setStorageItem('wasteo_rewards', [
      { _id: 'r1', user_id: '2', activity: 'Waste Reporting Reward', points: 10, date: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'r2', user_id: '2', activity: 'Campus Cleanup', points: 50, date: new Date(Date.now() - 172800000).toISOString() },
    ]);
  }

  if (!localStorage.getItem('wasteo_orders')) {
    setStorageItem('wasteo_orders', [
      { _id: 'o1', orderId: 'ORD-0001', user_id: '2', userName: 'Student 1', block: 'A', itemName: 'Recycled Notebook', pointsUsed: 150, status: 'delivered', pickupCode: 'NB1234', pickupLocation: 'Admin Office – Ground Floor', pickupTime: '10 AM – 5 PM', createdAt: new Date(Date.now() - 172800000).toISOString(), deliveredAt: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'o2', orderId: 'ORD-0002', user_id: '2', userName: 'Student 1', block: 'A', itemName: 'Plant Sapling', pointsUsed: 200, status: 'ready_for_pickup', pickupCode: 'PS5678', pickupLocation: 'Eco Hub – Block A', pickupTime: '10 AM – 5 PM', createdAt: new Date().toISOString() },
    ]);
  }

  if (!localStorage.getItem('wasteo_notifications')) {
    setStorageItem('wasteo_notifications', [
      { _id: 'n1', user_id: '2', message: 'Your complaint COMP-002 has been completed!', type: 'success', isRead: false, createdAt: new Date().toISOString() },
      { _id: 'n2', user_id: '2', message: 'You earned 50 points for Campus Cleanup!', type: 'reward', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
    ]);
  }

  if (!localStorage.getItem('wasteo_bin_data')) {
    setStorageItem('wasteo_bin_data', [
      { binId: 'BIN-A-1', block: 'A', level: 80, lastUpdated: new Date().toISOString() },
      { binId: 'BIN-B-1', block: 'B', level: 40, lastUpdated: new Date().toISOString() },
      { binId: 'BIN-C-1', block: 'C', level: 20, lastUpdated: new Date().toISOString() },
      { binId: 'BIN-D-1', block: 'D', level: 95, lastUpdated: new Date().toISOString() },
      { binId: 'BIN-A-2', block: 'A', level: 15, lastUpdated: new Date().toISOString() },
    ]);
  }
};

initData();

const fmt = (payload) => ({ data: payload });

// getCurrentUser and normalizeUser are defined at the top of the file

// Generate a unique pickup code
const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Notify a user
const pushNotification = (userId, message, type = 'info') => {
  const notifications = getStorageItem('wasteo_notifications', []);
  notifications.unshift({ _id: `n${Date.now()}`, user_id: userId, message, type, isRead: false, createdAt: new Date().toISOString() });
  setStorageItem('wasteo_notifications', notifications);
};

// ──────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password, role }) => {
  const users = getStorageItem('wasteo_users', []);
  const user = users.find(u => u.email === email && u.password === password && u.role === role);
  if (!user) throw { response: { data: { message: 'Invalid credentials or role' } } };
  localStorage.setItem(TOKEN_KEY, user._id);
  trackToken('login', user._id, { role: user.role, email: user.email });
  return fmt({ token: user._id, user: normalizeUser(user) });
};

export const registerUser = async ({ name, email, dept, password }) => {
  const users = getStorageItem('wasteo_users', []);
  if (users.find(u => u.email === email)) throw { response: { data: { message: 'Email already registered' } } };
  const newUser = { _id: `u${Date.now()}`, name, email, dept, password, role: 'student', block: 'A', reward_points: 100 };
  users.push(newUser);
  setStorageItem('wasteo_users', users);
  localStorage.setItem(TOKEN_KEY, newUser._id);
  trackToken('register', newUser._id, { email });
  return fmt({ token: newUser._id, user: normalizeUser(newUser) });
};

export const getMe = async () => {
  const user = getCurrentUser();
  if (!user) throw { response: { data: { message: 'Not authenticated' } } };
  return fmt({ user: normalizeUser(user) });
};

export const forgotPasswordApi = async ({ email }) => {
  const users = getStorageItem('wasteo_users', []);
  if (!users.find(u => u.email === email)) throw { response: { data: { message: 'Email not found' } } };
  return fmt({ message: 'Reset instructions sent to your email.' });
};

// ──────────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────────

export const getUsers = async (role) => {
  let users = getStorageItem('wasteo_users', []);
  if (role) users = users.filter(u => u.role === role);
  return fmt(users.map(normalizeUser));
};

export const getUserById = async (id) => {
  const users = getStorageItem('wasteo_users', []);
  const user = users.find(u => u._id === id);
  if (!user) throw { response: { data: { message: 'User not found' } } };
  return fmt(normalizeUser(user));
};

export const createUser = async (payload) => {
  const users = getStorageItem('wasteo_users', []);
  const newUser = { _id: `u${Date.now()}`, reward_points: 0, ...payload };
  users.push(newUser);
  setStorageItem('wasteo_users', users);
  return fmt(normalizeUser(newUser));
};

export const updateUser = async (id, payload) => {
  const users = getStorageItem('wasteo_users', []);
  const index = users.findIndex(u => u._id === id);
  if (index === -1) throw { response: { data: { message: 'User not found' } } };
  users[index] = { ...users[index], ...payload };
  setStorageItem('wasteo_users', users);
  return fmt(normalizeUser(users[index]));
};

export const changePassword = async (id, { oldPassword, newPassword }) => {
  const users = getStorageItem('wasteo_users', []);
  const index = users.findIndex(u => u._id === id);
  if (index === -1) throw { response: { data: { message: 'User not found' } } };
  if (users[index].password !== oldPassword) throw { response: { data: { message: 'Incorrect old password' } } };
  users[index].password = newPassword;
  setStorageItem('wasteo_users', users);
  return fmt({ message: 'Password updated successfully' });
};

export const deleteUserApi = async (id) => {
  let users = getStorageItem('wasteo_users', []);
  users = users.filter(u => u._id !== id);
  setStorageItem('wasteo_users', users);
  return fmt({ message: 'User deleted' });
};

// ──────────────────────────────────────────────────────────────
// COMPLAINTS
// ──────────────────────────────────────────────────────────────

export const getComplaints = async (params = {}) => {
  let complaints = getStorageItem('wasteo_complaints', []);
  if (params.user) complaints = complaints.filter(c => c.user_id === params.user);
  if (params.status) complaints = complaints.filter(c => c.status === params.status);
  return fmt(complaints);
};

export const getComplaintById = async (id) => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const complaint = complaints.find(c => c._id === id || c.complaintId === id);
  if (!complaint) throw { response: { data: { message: 'Complaint not found' } } };
  return fmt(complaint);
};

export const submitComplaint = async (payload) => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const user = getCurrentUser();
  const complaintId = `COMP-${Date.now()}`;

  let fields = {};
  if (payload instanceof FormData) {
    fields = {
      location: payload.get('location'),
      wasteType: payload.get('wasteType') || payload.get('waste_type'),
      description: payload.get('description'),
      block: payload.get('block'),
      type: payload.get('type') || 'complaint',
    };
  } else {
    fields = { ...payload };
  }

  const newComplaint = {
    _id: `c${Date.now()}`,
    complaintId,
    user_id: user?._id || '2',
    status: 'pending',
    statusHistory: [{ status: 'pending', note: 'Complaint submitted', updatedBy: user?._id, timestamp: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    ...fields,
  };

  complaints.push(newComplaint);
  setStorageItem('wasteo_complaints', complaints);

  // Track the new complaint token
  trackToken('complaint', complaintId, { location: newComplaint.location, block: newComplaint.block, status: 'pending' });

  // Notify the student
  pushNotification(user?._id, `📢 Your complaint ${complaintId} has been registered successfully!`, 'complaint');

  return fmt(newComplaint);
};

export const updateComplaintStatus = async (id, payload) => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const index = complaints.findIndex(c => c._id === id || c.complaintId === id);
  if (index === -1) throw { response: { data: { message: 'Complaint not found' } } };

  const user = getCurrentUser();
  const { status, note, rejectionReason } = payload;
  const histEntry = { status, note: note || `Status updated to ${status}`, updatedBy: user?._id, timestamp: new Date().toISOString() };

  complaints[index] = {
    ...complaints[index],
    status,
    rejectionReason: rejectionReason || complaints[index].rejectionReason,
    statusHistory: [...(complaints[index].statusHistory || []), histEntry],
    updatedAt: new Date().toISOString(),
  };
  setStorageItem('wasteo_complaints', complaints);

  // Track status update
  trackToken('status_update', id, { newStatus: status, updatedBy: user?._id });

  // Notify complaint owner
  pushNotification(complaints[index].user_id, `🔍 Complaint ${complaints[index].complaintId} status updated to: ${status}`, 'complaint');

  return fmt(complaints[index]);
};

export const completeComplaintApi = async (id, payload) => {
  return updateComplaintStatus(id, { status: 'completed', note: 'Completed with proof', ...(payload instanceof FormData ? {} : payload) });
};

// ──────────────────────────────────────────────────────────────
// REWARDS
// ──────────────────────────────────────────────────────────────

export const getRewards = async (params = {}) => {
  let rewards = getStorageItem('wasteo_rewards', []);
  if (params.user) rewards = rewards.filter(r => r.user_id === params.user);
  return fmt(rewards);
};

export const addReward = async (payload) => {
  const rewards = getStorageItem('wasteo_rewards', []);
  const newReward = { _id: `r${Date.now()}`, date: new Date().toISOString(), ...payload };
  rewards.push(newReward);
  setStorageItem('wasteo_rewards', rewards);

  // Add points to user
  const users = getStorageItem('wasteo_users', []);
  const userIndex = users.findIndex(u => u._id === payload.user_id);
  if (userIndex !== -1) {
    users[userIndex].reward_points = (users[userIndex].reward_points || 0) + payload.points;
    setStorageItem('wasteo_users', users);
  }

  trackToken('reward', newReward._id, { activity: payload.activity, points: payload.points, userId: payload.user_id });
  pushNotification(payload.user_id, `🏆 You earned ${payload.points} points for: ${payload.activity}`, 'reward');

  return fmt(newReward);
};

// ──────────────────────────────────────────────────────────────
// STATS
// ──────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const complaints = getStorageItem('wasteo_complaints', []);
  const users = getStorageItem('wasteo_users', []);
  const orders = getStorageItem('wasteo_orders', []);

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'pending').length;
  const progress = complaints.filter(c => c.status === 'in-progress').length;
  const done = complaints.filter(c => c.status === 'completed').length;
  const students = users.filter(u => u.role === 'student').length;
  const collectors = users.filter(u => u.role === 'collector').length;
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const completionRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  return fmt({ total, pending, progress, done, students, collectors, orderAnalytics: { total: totalOrders, delivered: deliveredOrders, completionRate, failedAttempts: 0 } });
};

// ──────────────────────────────────────────────────────────────
// STORE
// ──────────────────────────────────────────────────────────────

export const getStoreItems = async () => {
  const items = getStorageItem('wasteo_store_items', []);
  return fmt(items);
};

export const redeemStoreItem = async (itemId) => {
  const items = getStorageItem('wasteo_store_items', []);
  const itemIndex = items.findIndex(i => i._id === itemId);
  if (itemIndex === -1) throw { response: { data: { message: 'Item not found' } } };

  const item = items[itemIndex];
  const user = getCurrentUser();
  if (!user) throw { response: { data: { message: 'Not authenticated' } } };

  if (user.reward_points < item.pointsRequired) {
    throw { response: { data: { message: `Insufficient points. Need ${item.pointsRequired}, you have ${user.reward_points || 0}.` } } };
  }
  if (item.stock <= 0) throw { response: { data: { message: 'Item is out of stock.' } } };

  // Deduct points
  const users = getStorageItem('wasteo_users', []);
  const userIndex = users.findIndex(u => u._id === user._id);
  users[userIndex].reward_points -= item.pointsRequired;
  setStorageItem('wasteo_users', users);

  // Reduce stock
  items[itemIndex].stock -= 1;
  setStorageItem('wasteo_store_items', items);

  // Generate order
  const orders = getStorageItem('wasteo_orders', []);
  const seq = String(orders.length + 1).padStart(4, '0');
  const orderId = `ORD-${seq}`;
  const pickupCode = genCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const newOrder = {
    _id: `o${Date.now()}`,
    orderId,
    user_id: user._id,
    userName: user.name,
    block: user.block || 'A',
    itemName: item.name,
    pointsUsed: item.pointsRequired,
    status: 'pending',
    pickupCode,
    pickupLocation: 'Admin Office – Ground Floor',
    pickupTime: '10 AM – 5 PM',
    expiresAt,
    failedAttempts: 0,
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  setStorageItem('wasteo_orders', orders);

  // Track the new order token
  trackToken('order', orderId, { item: item.name, pickupCode, userId: user._id, block: user.block });

  // Notify user
  pushNotification(user._id, `🛒 Order ${orderId} placed! Pickup code: ${pickupCode}. Valid 24h.`, 'info');

  const remainingPoints = users[userIndex].reward_points;
  // Return shape: { order: {...}, remainingPoints }
  return fmt({ order: newOrder, remainingPoints });
};

export const getOrders = async (params = {}) => {
  let orders = getStorageItem('wasteo_orders', []);
  if (params.user) orders = orders.filter(o => o.user_id === params.user || o.user === params.user);
  if (params.status) orders = orders.filter(o => o.status === params.status);
  return fmt(orders);
};

export const getOrderById = async (id) => {
  const orders = getStorageItem('wasteo_orders', []);
  const order = orders.find(o => o._id === id || o.orderId === id);
  if (!order) throw { response: { data: { message: 'Order not found' } } };
  return fmt(order);
};

export const updateOrderStatus = async (id, payload) => {
  const orders = getStorageItem('wasteo_orders', []);
  const index = orders.findIndex(o => o._id === id || o.orderId === id);
  if (index === -1) throw { response: { data: { message: 'Order not found' } } };

  const order = orders[index];

  // Verify pickup code when delivering
  if (payload.status === 'delivered') {
    const code = (payload.verificationCode || '').toUpperCase();
    if (code && code !== String(order.pickupCode).toUpperCase()) {
      orders[index].failedAttempts = (orders[index].failedAttempts || 0) + 1;
      setStorageItem('wasteo_orders', orders);
      throw { response: { data: { message: 'Invalid pickup code. Please check and try again.' } } };
    }
    orders[index].deliveredAt = new Date().toISOString();
  }

  orders[index] = { ...orders[index], ...payload, updatedAt: new Date().toISOString() };
  setStorageItem('wasteo_orders', orders);

  // Track status change
  trackToken('order_status', id, { newStatus: payload.status });

  // Notify order owner
  const msg = payload.status === 'delivered'
    ? `📦 Your order ${order.orderId} has been delivered!`
    : payload.status === 'ready_for_pickup'
    ? `🎁 Your order ${order.orderId} is ready for pickup! Code: ${order.pickupCode}`
    : `👍 Your order ${order.orderId} status updated to: ${payload.status}`;
  pushNotification(order.user_id, msg, 'info');

  return fmt(orders[index]);
};

export const assignOrderApi = async (id) => {
  const user = getCurrentUser();
  const orders = getStorageItem('wasteo_orders', []);
  const index = orders.findIndex(o => o._id === id || o.orderId === id);
  if (index === -1) throw { response: { data: { message: 'Order not found' } } };
  orders[index].assignedTo = user?._id;
  orders[index].assignedCollectorName = user?.name;
  if (orders[index].status === 'pending') orders[index].status = 'approved';
  setStorageItem('wasteo_orders', orders);
  return fmt(orders[index]);
};

// ──────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────────────────────

export const getNotifications = async () => {
  const user = getCurrentUser();
  // Strict: only show this user's notifications — never show cross-user alerts
  if (!user) return fmt([]);
  const notifications = getStorageItem('wasteo_notifications', []);
  const mine = notifications
    .filter(n => n.user_id === user._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(n => ({ ...n, id: n._id, isRead: n.isRead || n.read || false }));
  return fmt(mine);
};

export const markNotificationRead = async (id) => {
  const notifications = getStorageItem('wasteo_notifications', []);
  const index = notifications.findIndex(n => n._id === id || n.id === id);
  if (index !== -1) { notifications[index].isRead = true; notifications[index].read = true; }
  setStorageItem('wasteo_notifications', notifications);
  return fmt({ success: true });
};

export const markAllNotificationsRead = async () => {
  const user = getCurrentUser();
  const notifications = getStorageItem('wasteo_notifications', []);
  notifications.forEach(n => { if (n.user_id === user?._id) { n.isRead = true; n.read = true; } });
  setStorageItem('wasteo_notifications', notifications);
  return fmt({ success: true });
};

// ──────────────────────────────────────────────────────────────
// IOT
// ──────────────────────────────────────────────────────────────

export const getIotBinData = async () => {
  const data = getStorageItem('wasteo_bin_data', []);
  return fmt(data);
};
