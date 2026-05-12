const Order = require('../models/Order');
const StoreItem = require('../models/StoreItem');
const User = require('../models/User');
const OrderLog = require('../models/OrderLog');
const { createNotification } = require('./notificationController');

const generateOrderId = async () => {
  const lastOrder = await Order.findOne().sort({ order_id: -1 }).select('order_id');
  let nextNum = 1;

  if (lastOrder && lastOrder.order_id) {
    const parts = lastOrder.order_id.split('-');
    if (parts.length >= 2) {
      const lastNum = parseInt(parts[1], 10);
      if (!Number.isNaN(lastNum)) nextNum = lastNum + 1;
    }
  }

  return 'ORD-' + String(nextNum).padStart(4, '0');
};

const createAuditLog = async (orderId, action, userId, details = '') => {
  try {
    await OrderLog.create({ order_id: orderId, action, performed_by: userId, details });
  } catch (err) {
    console.error(`❌ [AUDIT] Failed to log ${action} for ${orderId}:`, err.message);
  }
};

const mapOrder = (o) => ({
  id: o.id,
  orderId: o.order_id,
  userName: o.user_name,
  user: o.user_id,
  block: o.block,
  item: o.item_id,
  itemName: o.item_name,
  pointsUsed: o.points_used,
  status: o.status,
  assignedTo: o.assigned_to,
  assignedCollectorName: o.assigned_collector_name,
  pickupLocation: o.pickup_location,
  pickupTime: o.pickup_time,
  pickupCode: o.pickup_code,
  failedAttempts: o.failed_attempts,
  expiresAt: o.expires_at,
  deliveredAt: o.delivered_at,
  rewardGiven: o.reward_given,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
});

const mapStoreItem = (i) => ({
  id: i.id,
  name: i.name,
  description: i.description,
  image: i.image,
  pointsRequired: i.points_required,
  stock: i.stock,
  category: i.category,
  isActive: i.is_active,
  createdAt: i.created_at,
  updatedAt: i.updated_at,
});

const getStoreItems = async (req, res) => {
  try {
    const items = await StoreItem.find({ is_active: true }).sort({ points_required: 1 });
    res.json(items.map(mapStoreItem));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createStoreItem = async (req, res) => {
  try {
    const { name, description, image, pointsRequired, stock, category } = req.body;
    if (!name || !description || !pointsRequired) {
      return res.status(400).json({ message: 'Name, description, and pointsRequired are required.' });
    }

    const item = await StoreItem.create({
      name,
      description,
      image: image || null,
      points_required: Number(pointsRequired),
      stock: stock != null ? Number(stock) : 0,
      category: category || 'other',
    });

    res.status(201).json(mapStoreItem(item));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const redeemItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: 'Please provide itemId.' });

    const item = await StoreItem.findById(itemId);
    if (!item || !item.is_active) return res.status(404).json({ message: 'Item not found or unavailable.' });
    if (item.stock <= 0) return res.status(400).json({ message: 'Item is out of stock.' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.block) {
      return res.status(400).json({ message: 'Your account lacks a Campus Block assignment. Please update your profile or contact administrator before redeeming.' });
    }
    if ((user.reward_points || 0) < item.points_required) {
      return res.status(400).json({ message: `Insufficient points. Need ${item.points_required}, you have ${user.reward_points || 0}.` });
    }

    user.reward_points -= item.points_required;
    await user.save();

    item.stock -= 1;
    await item.save();

    let code;
    while (true) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingOrder = await Order.findOne({ pickup_code: code }).select('_id');
      if (!existingOrder) break;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const orderId = await generateOrderId();

    const order = await Order.create({
      order_id: orderId,
      user_name: user.name,
      user_id: user._id,
      block: user.block,
      item_id: item._id,
      item_name: item.name,
      points_used: item.points_required,
      pickup_code: code,
      expires_at: expiresAt,
    });

    await createNotification(user._id, `🛒 Order ${orderId} placed successfully! Use code ${code} for pickup.`, 'info');

    res.status(201).json({ order: mapOrder(order), remainingPoints: user.reward_points });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') filter.user_id = req.user.id;
    if (req.user.role === 'collector') {
      filter.block = req.user.block;
      filter.$or = [{ assigned_to: null }, { assigned_to: req.user.id }];
    }
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .populate('user_id', 'name email')
      .populate('item_id', 'name image points_required')
      .sort({ created_at: -1 });

    const mappedOrders = orders.map((o) => {
      const mapped = mapOrder(o);
      if (req.user.role === 'collector' && o.status !== 'delivered') delete mapped.pickupCode;
      return mapped;
    });

    res.json(mappedOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'ready_for_pickup', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findOne({ order_id: req.params.id.toUpperCase() });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'collector' && order.block !== req.user.block) {
      return res.status(403).json({ message: 'Access denied: cannot update orders from another block' });
    }
    if (order.status !== 'delivered') {
      if (order.expires_at && new Date() > new Date(order.expires_at)) {
        return res.status(400).json({ message: 'This pickup order has expired. Please contact admin for a reset.' });
      }
      if (order.failed_attempts >= 3) {
        await createAuditLog(order.order_id, 'locked', req.user.id, 'Too many failed attempts');
        return res.status(400).json({ message: 'Order is locked due to multiple failed verification attempts.' });
      }
    }

    const validTransitions = { pending: ['approved'], approved: ['ready_for_pickup'], ready_for_pickup: ['delivered'] };
    if (validTransitions[order.status] && !validTransitions[order.status].includes(status)) {
      return res.status(400).json({ message: `Invalid status transition: ${order.status} → ${status}. Allowed: ${validTransitions[order.status].join(', ')}` });
    }

    if (status === 'delivered') {
      const { verificationCode } = req.body;
      if (req.user.role !== 'admin') {
        if (!verificationCode) return res.status(400).json({ message: 'Pickup code is required for delivery confirmation.' });
        if (verificationCode.toUpperCase() !== String(order.pickup_code).toUpperCase()) {
          order.failed_attempts = (order.failed_attempts || 0) + 1;
          await order.save();
          await createAuditLog(order.order_id, 'failed_verification', req.user.id, `Attempt ${order.failed_attempts}`);
          return res.status(400).json({ message: 'Invalid pickup code. Please check your code and try again.' });
        }
      }
      order.delivered_at = new Date();
      await createAuditLog(order.order_id, 'delivered', req.user.id);
    }

    if (status === 'delivered' && req.user.role === 'collector' && !order.reward_given) {
      const collector = await User.findById(req.user.id).select('reward_points');
      if (collector) {
        collector.reward_points = (collector.reward_points || 0) + 20;
        await collector.save();
        order.reward_given = true;
        await require('../models/Reward').create({ user_id: req.user.id, activity: `Delivered Order ${order.order_id}`, points: 20 });
      }
    }

    order.status = status;
    await order.save();
    await createNotification(order.user_id, status === 'delivered' ? `📦 Your order ${order.order_id} has been delivered!` : status === 'ready_for_pickup' ? `🎁 Your order ${order.order_id} is ready for pickup!` : `👍 Your order ${order.order_id} status updated to: ${status}`, 'info');

    res.json(mapOrder(order));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.params.id.toUpperCase() }).populate('user_id', 'name email').populate('item_id', 'name image points_required');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'student' && String(order.user_id._id || order.user_id) !== String(req.user.id)) return res.status(403).json({ message: 'Access denied' });
    if (req.user.role === 'collector' && order.block !== req.user.block) return res.status(403).json({ message: 'Access denied: order belongs to another block' });
    await createAuditLog(order.order_id, 'viewed', req.user.id);
    const mappedOrder = mapOrder(order);
    if (req.user.role === 'collector' && order.status !== 'delivered') delete mappedOrder.pickupCode;
    res.json(mappedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const assignOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.assigned_to) return res.status(400).json({ message: `Order already assigned to ${order.assigned_collector_name}` });

    order.assigned_to = req.user.id;
    order.assigned_collector_name = req.user.name;
    if (order.status === 'pending') order.status = 'approved';
    await order.save();

    await createNotification(order.user_id, `🤝 Collector ${req.user.name} has taken your order ${order.order_id} and is preparing it.`, 'info');
    res.json(mapOrder(order));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStoreItems, createStoreItem, redeemItem, getOrders, updateOrderStatus, getOrderById, assignOrder };
