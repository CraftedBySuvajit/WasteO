const STORAGE_KEY = 'wasteo_data';
const TOKEN_KEY = 'wasteo_token';

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyData() {
  const now = new Date().toISOString();
  const users = [
    { _id: 'admin-1', name: 'WasteO Admin', email: 'admin@edu.in', password: '12345678', role: 'admin', dept: 'Operations', block: 'A', rewardPoints: 0, createdAt: now },
    { _id: 'student-1', name: 'Alex Johnson', email: 'student@edu.in', password: '12345678', role: 'student', dept: 'Environmental Science', block: 'A', rewardPoints: 140, createdAt: now },
    { _id: 'student-2', name: 'Rahul Mehta', email: 'rahul@edu.in', password: '12345678', role: 'student', dept: 'Computer Science', block: 'C', rewardPoints: 220, createdAt: now },
    { _id: 'student-3', name: 'Priya Sharma', email: 'priya@edu.in', password: '12345678', role: 'student', dept: 'Information Technology', block: 'B', rewardPoints: 310, createdAt: now },
    { _id: 'student-4', name: 'Siddharth Roy', email: 'sid@edu.in', password: '12345678', role: 'student', dept: 'Electrical Engineering', block: 'A', rewardPoints: 45, createdAt: now },
  ];

  // Add 20+ collectors for management
  for (let i = 1; i <= 25; i++) {
    users.push({
      _id: `collector-${i}`,
      name: i === 1 ? 'Bin Collector' : `Collector ${i}`,
      email: i === 1 ? 'collector@edu.in' : `collector${i}@edu.in`,
      password: '12345678',
      role: 'collector',
      dept: 'Field Operations',
      block: ['A', 'B', 'C', 'D', 'E'][i % 5],
      rewardPoints: 0,
      createdAt: now
    });
  }

  return {
    users,
    complaints: [
      { _id: 'complaint-1', complaintId: 'WO-101', user: 'student-1', location: 'Cafeteria', wasteType: 'Food Waste', description: 'Overflowing food waste bin near the cafeteria exit.', block: 'A', type: 'manual', status: 'pending', image: null, createdAt: now },
      { _id: 'complaint-2', complaintId: 'WO-102', user: 'student-1', location: 'Library', wasteType: 'Plastic Waste', description: 'Discarded plastic bottles in the reading area.', block: 'A', type: 'manual', status: 'in-progress', image: null, createdAt: now },
      { _id: 'complaint-3', complaintId: 'WO-103', user: 'student-2', location: 'Block C Corridor', wasteType: 'Mixed Waste', description: 'Black bin overflowing with mixed trash.', block: 'C', type: 'iot', status: 'pending', image: null, createdAt: now },
      { _id: 'complaint-4', complaintId: 'WO-104', user: 'student-3', location: 'Auditorium Exit', wasteType: 'Paper Waste', description: 'Leftover brochures from the event scattered around.', block: 'B', type: 'manual', status: 'completed', image: null, createdAt: now },
      { _id: 'complaint-5', complaintId: 'WO-105', user: 'student-1', location: 'Science Lab 4', wasteType: 'Glass Waste', description: 'Broken beaker glass needs safe disposal.', block: 'A', type: 'manual', status: 'pending', image: null, createdAt: now },
      { _id: 'complaint-6', complaintId: 'WO-106', user: 'student-4', location: 'Sports Ground', wasteType: 'Organic Waste', description: 'Grass clippings left in a pile near the gate.', block: 'D', type: 'manual', status: 'pending', image: null, createdAt: now },
      { _id: 'complaint-7', complaintId: 'WO-107', user: 'student-2', location: 'Block C Entrance', wasteType: 'Electronic Waste', description: 'Old UPS battery left near the bin.', block: 'C', type: 'manual', status: 'completed', image: null, createdAt: now },
    ],
    rewards: [
      { _id: 'reward-1', user: 'student-1', activity: 'Waste Photo Complaint', points: 50, date: now },
      { _id: 'reward-2', user: 'student-3', activity: 'Waste Scan Alert', points: 100, date: now },
      { _id: 'reward-3', user: 'student-2', activity: 'Complaint Resolved', points: 50, date: now },
      { _id: 'reward-4', user: 'student-1', activity: 'Weekly Green Bonus', points: 20, date: now },
      { _id: 'reward-5', user: 'student-2', activity: 'Eco-Hero Badge', points: 150, date: now },
      { _id: 'reward-6', user: 'student-3', activity: 'Signup Bonus', points: 100, date: now },
    ],
    storeItems: [
      { _id: 'item-1', title: 'Reusable Water Bottle', pointsRequired: 120, stock: 15, description: 'Eco-friendly refillable bottle made from recycled plastic.', image: 'https://images.unsplash.com/photo-1510626176961-4b8dd6f2f86b?auto=format&fit=crop&w=400&q=70' },
      { _id: 'item-2', title: 'Bamboo Notebook', pointsRequired: 90, stock: 22, description: 'Durable notebook with recycled paper.', image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=70' },
      { _id: 'item-3', title: 'Plantable Pen', pointsRequired: 70, stock: 45, description: 'Biodegradable pen you can plant after use.', image: 'https://images.unsplash.com/photo-1512126427068-9e0c0a181c8f?auto=format&fit=crop&w=400&q=70' },
      { _id: 'item-4', title: 'Bamboo Cutlery Set', pointsRequired: 150, stock: 8, description: 'Portable set with spoon, fork, and chopsticks in a cotton pouch.', image: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&w=400&q=70' },
      { _id: 'item-5', title: 'Solar Power Bank', pointsRequired: 500, stock: 3, description: '10,000mAh bank that recharges via clean sunlight.', image: 'https://images.unsplash.com/photo-1584270354949-1f62b3d1a4cb?auto=format&fit=crop&w=400&q=70' },
      { _id: 'item-6', title: 'Recycled Tote Bag', pointsRequired: 60, stock: 30, description: 'Heavy-duty cotton bag for all your campus gear.', image: 'https://images.unsplash.com/photo-1593032465171-8c02f3b74f4b?auto=format&fit=crop&w=400&q=70' },
    ],
    orders: [
      { _id: 'order-1', orderId: 'ORD-501', user: 'student-1', item: 'item-2', itemName: 'Bamboo Notebook', pointsUsed: 90, status: 'pending', assignedTo: null, createdAt: now },
      { _id: 'order-2', orderId: 'ORD-502', user: 'student-2', item: 'item-3', itemName: 'Plantable Pen', pointsUsed: 70, status: 'delivered', assignedTo: 'collector-1', createdAt: now },
      { _id: 'order-3', orderId: 'ORD-503', user: 'student-3', item: 'item-1', itemName: 'Reusable Water Bottle', pointsUsed: 120, status: 'delivered', assignedTo: null, createdAt: now },
      { _id: 'order-4', orderId: 'ORD-504', user: 'student-1', item: 'item-6', itemName: 'Recycled Tote Bag', pointsUsed: 60, status: 'ready_for_pickup', assignedTo: 'collector-1', createdAt: now },
    ],
    notifications: [
      { _id: 'note-1', user: 'student-1', title: 'Welcome to WasteO!', message: 'You have earned 140 points to start reporting waste and redeeming rewards.', isRead: false, createdAt: now },
      { _id: 'note-2', user: 'collector-1', title: 'New IoT Alert', message: 'Dustbin full alert received for Block C.', isRead: false, createdAt: now },
      { _id: 'note-3', user: 'admin-1', title: 'System Ready', message: 'WasteO system is running successfully.', isRead: false, createdAt: now },
    ],
    iotBins: [
      { _id: 'bin-1', label: 'B1', block: 'A', fillLevel: 81, status: 'High', location: 'Science Block' },
      { _id: 'bin-2', label: 'B2', block: 'B', fillLevel: 60, status: 'Medium', location: 'Cafeteria' },
      { _id: 'bin-3', label: 'B3', block: 'C', fillLevel: 95, status: 'Critical', location: 'Library Entrance' },
      { _id: 'bin-4', label: 'B4', block: 'D', fillLevel: 15, status: 'Low', location: 'Sports Center' },
      { _id: 'bin-5', label: 'B5', block: 'A', fillLevel: 42, status: 'Medium', location: 'Hostel Gate' },
    ],
  };
}

function getData() {
  let data;
  const raw = localStorage.getItem(STORAGE_KEY);
  
  try {
    data = raw ? JSON.parse(raw) : emptyData();
  } catch (err) {
    data = emptyData();
  }

  // Refresh default users to ensure they match the latest requested credentials
  const demoLogins = [
    { email: 'admin@edu.in', role: 'admin' },
    { email: 'collector@edu.in', role: 'collector' },
    { email: 'student@edu.in', role: 'student' }
  ];

  demoLogins.forEach(demo => {
    const user = data.users.find(u => u.role === demo.role);
    if (user) {
      user.email = demo.email;
      user.password = '12345678';
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  // If no token, return null rather than throwing immediately to allow UI to handle guest state
  if (!token) return null;
  
  const data = getData();
  const user = data.users.find((u) => u._id === token);
  if (!user) {
    throw { response: { data: { message: 'Session expired' } } };
  }
  return user;
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function formatResponse(payload) {
  return { data: payload };
}

export const loginUser = async ({ email, password, role }) => {
  const data = getData();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const normalizedRole = String(role || '').trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedRole) {
    throw { response: { data: { message: 'Email, password, and role are required' } } };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw { response: { data: { message: 'Please enter a valid email address' } } };
  }

  const user = data.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword && u.role === normalizedRole
  );
  if (!user) {
    throw { response: { data: { message: 'Invalid credentials or role' } } };
  }
  localStorage.setItem(TOKEN_KEY, user._id);
  return formatResponse({ token: user._id, user: sanitizeUser(user) });
};

export const registerUser = async ({ name, email, dept, password }) => {
  const data = getData();
  if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw { response: { data: { message: 'Email already registered' } } };
  }
  const newUser = {
    _id: createId('student'),
    name,
    email: email.toLowerCase(),
    password,
    role: 'student',
    dept: dept || 'General',
    block: 'A',
    rewardPoints: 100,
    createdAt: new Date().toISOString(),
  };
  data.users.push(newUser);
  data.notifications.unshift({
    _id: createId('note'),
    user: newUser._id,
    title: 'Welcome to WasteO!',
    message: 'Your account is ready. Start reporting waste and earning points.',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  saveData(data);
  localStorage.setItem(TOKEN_KEY, newUser._id);
  return formatResponse({ token: newUser._id, user: sanitizeUser(newUser) });
};

export const getMe = async () => {
  const user = getCurrentUser();
  if (!user) throw { response: { data: { message: 'Not authenticated' } } };
  return formatResponse({ user: sanitizeUser(user) });
};

export const forgotPasswordApi = async ({ email }) => {
  const data = getData();
  const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw { response: { data: { message: 'Email not found' } } };
  }
  return formatResponse({ message: 'Password reset instructions have been sent to your inbox.' });
};

export const getUsers = async (role) => {
  const data = getData();
  const users = role ? data.users.filter((user) => user.role === role) : data.users;
  return formatResponse(users.map(sanitizeUser));
};

export const getUserById = async (id) => {
  const data = getData();
  const user = data.users.find((u) => u._id === id);
  if (!user) {
    throw { response: { data: { message: 'User not found' } } };
  }
  return formatResponse(sanitizeUser(user));
};

export const createUser = async (payload) => {
  const data = getData();
  if (data.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    throw { response: { data: { message: 'Email already exists' } } };
  }
  const newUser = {
    _id: createId(payload.role || 'user'),
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: payload.password || 'Welcome123',
    role: payload.role || 'student',
    dept: payload.dept || '',
    block: payload.block || 'A',
    rewardPoints: payload.rewardPoints ?? 0,
    createdAt: new Date().toISOString(),
  };
  data.users.push(newUser);
  saveData(data);
  return formatResponse(sanitizeUser(newUser));
};

export const updateUser = async (id, payload) => {
  const data = getData();
  const user = data.users.find((u) => u._id === id);
  if (!user) {
    throw { response: { data: { message: 'User not found' } } };
  }
  Object.assign(user, payload);
  saveData(data);
  return formatResponse(sanitizeUser(user));
};

export const changePassword = async (id, { oldPassword, newPassword }) => {
  const data = getData();
  const user = data.users.find((u) => u._id === id);
  if (!user) {
    throw { response: { data: { message: 'User not found' } } };
  }
  if (user.password !== oldPassword) {
    throw { response: { data: { message: 'Current password is incorrect' } } };
  }
  user.password = newPassword;
  saveData(data);
  return formatResponse({ message: 'Password updated successfully' });
};

export const deleteUserApi = async (id) => {
  const data = getData();
  const userIndex = data.users.findIndex((u) => u._id === id);
  if (userIndex === -1) {
    throw { response: { data: { message: 'User not found' } } };
  }
  const removedUser = data.users.splice(userIndex, 1)[0];
  data.complaints = data.complaints.filter((c) => c.user !== id);
  data.rewards = data.rewards.filter((r) => r.user !== id);
  data.orders = data.orders.filter((o) => o.user !== id);
  data.notifications = data.notifications.filter((n) => n.user !== id);
  saveData(data);
  return formatResponse({ message: `${removedUser.name} removed successfully` });
};

export const getComplaints = async (params = {}) => {
  const data = getData();
  let results = data.complaints.slice();
  if (params.user) results = results.filter((c) => c.user === params.user);
  if (params.status) results = results.filter((c) => c.status === params.status);
  return formatResponse(results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
};

export const getComplaintById = async (id) => {
  const data = getData();
  const complaint = data.complaints.find((c) => c.complaintId === id || c._id === id);
  if (!complaint) {
    throw { response: { data: { message: 'Complaint not found' } } };
  }
  return formatResponse(complaint);
};

function buildImageValue(file) {
  if (!file) return null;
  if (typeof file === 'string') return file;
  if (file instanceof File) {
    return URL.createObjectURL(file);
  }
  return null;
}

export const submitComplaint = async (payload) => {
  const currentUser = getCurrentUser();
  const data = getData();
  const location = payload.get ? payload.get('location') : payload.location;
  const wasteType = payload.get ? payload.get('wasteType') : payload.wasteType;
  const description = payload.get ? payload.get('description') : payload.description;
  const block = payload.get ? payload.get('block') : payload.block;
  const type = payload.get ? payload.get('type') : payload.type || 'manual';
  const imageFile = payload.get ? payload.get('image') : payload.image;
  const newComplaint = {
    _id: createId('complaint'),
    complaintId: `WO-${100 + data.complaints.length + 1}`,
    user: currentUser._id,
    location,
    wasteType,
    description,
    block,
    type,
    status: 'pending',
    image: buildImageValue(imageFile),
    createdAt: new Date().toISOString(),
  };
  data.complaints.unshift(newComplaint);
  data.notifications.unshift({
    _id: createId('note'),
    user: currentUser._id,
    title: 'Complaint Submitted',
    message: `Your complaint ${newComplaint.complaintId} has been logged successfully.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  saveData(data);
  return formatResponse({ complaintId: newComplaint.complaintId });
};

export const updateComplaintStatus = async (id, payload) => {
  const data = getData();
  const complaint = data.complaints.find((c) => c.complaintId === id || c._id === id);
  if (!complaint) {
    throw { response: { data: { message: 'Complaint not found' } } };
  }
  complaint.status = payload.status || complaint.status;
  if (payload.rejectionReason) complaint.rejectionReason = payload.rejectionReason;
  if (complaint.status === 'completed' && !complaint.rewarded) {
    const student = data.users.find((u) => u._id === complaint.user);
    if (student) {
      student.rewardPoints = (student.rewardPoints || 0) + 10;
      complaint.rewarded = true;
      data.rewards.unshift({
        _id: createId('reward'),
        user: student._id,
        activity: 'Complaint Completed',
        points: 10,
        date: new Date().toISOString(),
      });
    }
  }
  data.notifications.unshift({
    _id: createId('note'),
    user: complaint.user,
    title: `Complaint ${complaint.status}`,
    message: `Complaint ${complaint.complaintId} is now ${complaint.status}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  saveData(data);
  return formatResponse({ rewardGiven: complaint.rewarded || false });
};

export const completeComplaintApi = async (id, payload) => {
  const data = getData();
  const complaint = data.complaints.find((c) => c.complaintId === id || c._id === id);
  if (!complaint) {
    throw { response: { data: { message: 'Complaint not found' } } };
  }
  const imageFile = payload.get ? payload.get('image') : payload.image;
  complaint.status = 'completed';
  complaint.image = complaint.image || buildImageValue(imageFile);
  complaint.completedAt = new Date().toISOString();
  if (!complaint.rewarded) {
    const student = data.users.find((u) => u._id === complaint.user);
    if (student) {
      student.rewardPoints = (student.rewardPoints || 0) + 10;
      complaint.rewarded = true;
      data.rewards.unshift({
        _id: createId('reward'),
        user: student._id,
        activity: 'Completion Proof Approved',
        points: 10,
        date: new Date().toISOString(),
      });
    }
  }
  data.notifications.unshift({
    _id: createId('note'),
    user: complaint.user,
    title: 'Complaint Completed',
    message: `Your complaint ${complaint.complaintId} has been completed.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  saveData(data);
  return formatResponse({ complaintId: complaint.complaintId });
};

export const getRewards = async (params = {}) => {
  const data = getData();
  let rewards = data.rewards.slice();
  if (params.user) rewards = rewards.filter((r) => r.user === params.user);
  return formatResponse(rewards.sort((a, b) => new Date(b.date) - new Date(a.date)));
};

export const addReward = async ({ user, activity, points }) => {
  const data = getData();
  const student = data.users.find((u) => u._id === user);
  if (!student) {
    throw { response: { data: { message: 'User not found' } } };
  }
  student.rewardPoints = (student.rewardPoints || 0) + Number(points || 0);
  const reward = {
    _id: createId('reward'),
    user,
    activity,
    points: Number(points || 0),
    date: new Date().toISOString(),
  };
  data.rewards.unshift(reward);
  data.notifications.unshift({
    _id: createId('note'),
    user,
    title: 'Reward Added',
    message: `${points} points added for ${activity}.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  saveData(data);
  return formatResponse(reward);
};

export const getDashboardStats = async () => {
  const data = getData();
  const total = data.complaints.length;
  const pending = data.complaints.filter((c) => c.status === 'pending').length;
  const progress = data.complaints.filter((c) => c.status === 'in-progress').length;
  const done = data.complaints.filter((c) => c.status === 'completed').length;
  const students = data.users.filter((u) => u.role === 'student').length;
  const collectors = data.users.filter((u) => u.role === 'collector').length;
  const orderAnalytics = {
    total: data.orders.length,
    delivered: data.orders.filter((o) => o.status === 'delivered').length,
    completionRate: data.orders.length ? Math.round((data.orders.filter((o) => o.status === 'delivered').length / data.orders.length) * 100) : 0,
    failedAttempts: data.orders.filter((o) => o.status === 'failed').length,
    blockPerformance: data.complaints.reduce((acc, complaint) => {
      const block = complaint.block || 'Unknown';
      const entry = acc.find((item) => item._id === block);
      if (entry) entry.count += 1;
      else acc.push({ _id: block, count: 1 });
      return acc;
    }, []),
  };
  return formatResponse({ total, pending, progress, done, students, collectors, orderAnalytics });
};

export const getStoreItems = async () => {
  const data = getData();
  return formatResponse(data.storeItems);
};

export const redeemStoreItem = async (itemId) => {
  const currentUser = getCurrentUser();
  const data = getData();
  const item = data.storeItems.find((i) => i._id === itemId);
  if (!item) {
    throw { response: { data: { message: 'Item not found' } } };
  }
  if (item.stock <= 0) {
    throw { response: { data: { message: 'Item out of stock' } } };
  }
  if ((currentUser.rewardPoints || 0) < item.pointsRequired) {
    throw { response: { data: { message: 'Insufficient reward points' } } };
  }
  currentUser.rewardPoints -= item.pointsRequired;
  item.stock -= 1;
  const order = {
    _id: createId('order'),
    orderId: `ORD-${500 + data.orders.length + 1}`,
    user: currentUser._id,
    itemName: item.title,
    item: item._id,
    pointsUsed: item.pointsRequired,
    status: 'pending',
    assignedTo: null,
    createdAt: new Date().toISOString(),
  };
  data.orders.unshift(order);
  data.notifications.unshift({
    _id: createId('note'),
    user: currentUser._id,
    title: 'Order Created',
    message: `Your order ${order.orderId} for ${item.title} has been created.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  saveData(data);
  return formatResponse({ order, remainingPoints: currentUser.rewardPoints });
};

export const getOrders = async (params = {}) => {
  const data = getData();
  let orders = data.orders.slice();
  if (params.user) orders = orders.filter((o) => o.user === params.user);
  if (params.status) orders = orders.filter((o) => o.status === params.status);
  return formatResponse(orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
};

export const getOrderById = async (id) => {
  const data = getData();
  const order = data.orders.find((o) => o._id === id || o.orderId === id);
  if (!order) {
    throw { response: { data: { message: 'Order not found' } } };
  }
  return formatResponse(order);
};

export const updateOrderStatus = async (id, payload) => {
  const data = getData();
  const order = data.orders.find((o) => o._id === id || o.orderId === id);
  if (!order) {
    throw { response: { data: { message: 'Order not found' } } };
  }
  if (payload.status) order.status = payload.status;
  if (payload.assignedTo) order.assignedTo = payload.assignedTo;
  saveData(data);
  return formatResponse(order);
};

export const assignOrderApi = async (id) => {
  const currentUser = getCurrentUser();
  const data = getData();
  const order = data.orders.find((o) => o._id === id || o.orderId === id);
  if (!order) {
    throw { response: { data: { message: 'Order not found' } } };
  }
  order.assignedTo = currentUser._id;
  order.status = 'in-progress';
  saveData(data);
  return formatResponse(order);
};

export const getNotifications = async () => {
  const currentUser = getCurrentUser();
  const data = getData();
  const notifications = data.notifications
    .filter((n) => n.user === currentUser._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return formatResponse(notifications);
};

export const markNotificationRead = async (id) => {
  const currentUser = getCurrentUser();
  const data = getData();
  const note = data.notifications.find((n) => n._id === id && n.user === currentUser._id);
  if (note) note.isRead = true;
  saveData(data);
  return formatResponse({});
};

export const markAllNotificationsRead = async () => {
  const currentUser = getCurrentUser();
  const data = getData();
  data.notifications.forEach((note) => {
    if (note.user === currentUser._id) note.isRead = true;
  });
  saveData(data);
  return formatResponse({});
};

export const getIotBinData = async () => {
  const data = getData();
  return formatResponse(data.iotBins);
};
