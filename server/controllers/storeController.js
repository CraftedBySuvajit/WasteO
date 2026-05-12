const supabase = require('../config/supabase');
const { createNotification } = require('./notificationController');

// ── Generate sequential order ID ──
const generateOrderId = async () => {
  const { data: lastOrder, error } = await supabase
    .from('orders')
    .select('order_id')
    .order('order_id', { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (lastOrder && lastOrder.order_id) {
    const parts = lastOrder.order_id.split('-');
    if (parts.length >= 2) {
      const lastNum = parseInt(parts[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
  }
  return 'ORD-' + String(nextNum).padStart(4, '0');
};

// HELPER: Audit logging
const createAuditLog = async (orderId, action, userId, details = '') => {
  try {
    await supabase.from('order_logs').insert([{
      order_id: orderId,
      action,
      performed_by: userId,
      details
    }]);
  } catch (err) {
    console.error(`❌ [AUDIT] Failed to log ${action} for ${orderId}:`, err.message);
  }
};

// Helper to map DB order to frontend camelCase
const mapOrder = (o) => {
  if (!o) return null;
  return {
    id: o.id,
    orderId: o.order_id,
    userName: o.user_name,
    user: o.user || o.user_id,
    block: o.block,
    item: o.item || o.item_id,
    itemName: o.item_name,
    pointsUsed: o.points_used,
    status: o.status,
    assignedTo: o.assignedTo || o.assigned_to,
    assignedCollectorName: o.assigned_collector_name,
    pickupLocation: o.pickup_location,
    pickupTime: o.pickup_time,
    pickupCode: o.pickup_code,
    failedAttempts: o.failed_attempts,
    expiresAt: o.expires_at,
    deliveredAt: o.delivered_at,
    rewardGiven: o.reward_given,
    createdAt: o.created_at,
    updatedAt: o.updated_at
  };
};

// Helper to map DB store item to frontend camelCase
const mapStoreItem = (i) => {
  if (!i) return null;
  return {
    id: i.id,
    name: i.name,
    description: i.description,
    image: i.image,
    pointsRequired: i.points_required,
    stock: i.stock,
    category: i.category,
    isActive: i.is_active,
    createdAt: i.created_at,
    updatedAt: i.updated_at
  };
};

// ──────────────────────────────────────────────────────────────
// STORE ITEMS
// ──────────────────────────────────────────────────────────────

// @desc    Get all active store items
// @route   GET /api/store
const getStoreItems = async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) throw error;

    const mappedItems = items.map(i => mapStoreItem(i));
    res.json(mappedItems);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create store item (admin only)
// @route   POST /api/store
const createStoreItem = async (req, res) => {
  try {
    const { name, description, image, pointsRequired, stock, category } = req.body;

    if (!name || !description || !pointsRequired) {
      return res.status(400).json({ message: 'Name, description, and pointsRequired are required.' });
    }

    const { data: item, error } = await supabase
      .from('store_items')
      .insert([{
        name,
        description,
        image: image || null,
        points_required: Number(pointsRequired),
        stock: stock != null ? Number(stock) : 0,
        category: category || 'other',
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(mapStoreItem(item));
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────
// REDEEM
// ──────────────────────────────────────────────────────────────

// @desc    Redeem item (student/collector)
// @route   POST /api/store/redeem
const redeemItem = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'Please provide itemId.' });
    }

    // 1. Find item
    const { data: item, error: itemError } = await supabase
      .from('store_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item || !item.is_active) {
      return res.status(404).json({ message: 'Item not found or unavailable.' });
    }

    // 2. Check stock
    if (item.stock <= 0) {
      return res.status(400).json({ message: 'Item is out of stock.' });
    }

    // 3. Fetch fresh user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.block) {
      return res.status(400).json({
        message: 'Your account lacks a Campus Block assignment. Please update your profile or contact administrator before redeeming.',
      });
    }

    // 4. Check points
    if (user.reward_points < item.points_required) {
      return res.status(400).json({
        message: `Insufficient points. Need ${item.points_required}, you have ${user.reward_points || 0}.`,
      });
    }

    // 5. Deduct points
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ reward_points: user.reward_points - item.points_required })
      .eq('id', user.id);

    if (userUpdateError) throw userUpdateError;

    // 6. Decrease stock
    const { error: itemUpdateError } = await supabase
      .from('store_items')
      .update({ stock: item.stock - 1 })
      .eq('id', item.id);

    if (itemUpdateError) throw itemUpdateError;

    // ── Generate Unique 6-Char Pickup Code ──
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('pickup_code', code)
        .single();
      exists = !!existingOrder;
    }

    // ── Generate Expiration Date (24h) ──
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 8. Create order
    const orderId = await generateOrderId();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_id: orderId,
        user_name: user.name,
        user_id: user.id,
        block: user.block,
        item_id: item.id,
        item_name: item.name,
        points_used: item.points_required,
        pickup_code: code,
        expires_at: expiresAt,
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    console.log(`🛒 [ORDER] Created: ${orderId} | Block: ${user.block} | User: ${user.id}`);

    // ✅ Notify Student
    await createNotification(
      user.id,
      `🛒 Order ${orderId} placed successfully! Use code ${code} for pickup.`,
      'info'
    );

    res.status(201).json({
      order: mapOrder(order),
      remainingPoints: user.reward_points - item.points_required,
    });
  } catch (err) {
    console.error("REDEEM ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ──────────────────────────────────────────────────────────────
// ORDERS
// ──────────────────────────────────────────────────────────────

// @desc    Get orders (role-filtered)
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    let query = supabase
      .from('orders')
      .select('*, user:users!orders_user_id_fkey(name, email), item:store_items!orders_item_id_fkey(name, image, points_required)')
      .order('created_at', { ascending: false });

    // Students only see their own orders
    if (req.user.role === 'student') {
      query = query.eq('user_id', req.user.id);
    }

    // Collectors: see unassigned orders OR orders assigned specifically to me
    if (req.user.role === 'collector') {
      query = query.or(`assigned_to.is.null,assigned_to.eq.${req.user.id}`);
    }

    // Optional status filter
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    const mappedOrders = orders.map(o => {
      const mapped = mapOrder(o);
      // Collector can only see code AFTER delivery (for receipt)
      if (req.user.role === 'collector' && o.status !== 'delivered') {
        delete mapped.pickupCode;
      }
      return mapped;
    });

    res.json(mappedOrders);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update order status (collector/admin)
// @route   PUT /api/orders/:id
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'ready_for_pickup', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', req.params.id.toUpperCase())
      .single();

    if (fetchError || !order) return res.status(404).json({ message: 'Order not found' });

    // Security Check (Collector)
    if (req.user.role === 'collector' && order.block !== req.user.block) {
      return res.status(403).json({ message: 'Access denied: cannot update orders from another block' });
    }

    // Expiration & Lockout Checks
    if (order.status !== 'delivered') {
      if (order.expires_at && new Date() > new Date(order.expires_at)) {
        return res.status(400).json({ message: 'This pickup order has expired. Please contact admin for a reset.' });
      }
      if (order.failed_attempts >= 3) {
        await createAuditLog(order.order_id, 'locked', req.user.id, 'Too many failed attempts');
        return res.status(400).json({ message: 'Order is locked due to multiple failed verification attempts.' });
      }
    }

    const updateData = { status };

    // Delivery Verification Step
    if (status === 'delivered') {
      const { verificationCode } = req.body;
      if (!verificationCode) {
        return res.status(400).json({ message: 'Pickup code is required for delivery confirmation.' });
      }
      
      if (verificationCode.toUpperCase() !== order.pickup_code.toUpperCase()) {
        const failedAttempts = (order.failed_attempts || 0) + 1;
        await supabase.from('orders').update({ failed_attempts: failedAttempts }).eq('id', order.id);
        await createAuditLog(order.order_id, 'failed_verification', req.user.id, `Attempt ${failedAttempts}`);
        return res.status(400).json({ 
          message: 'Invalid pickup code. Please check your code and try again.',
        });
      }
      
      updateData.delivered_at = new Date();
      await createAuditLog(order.order_id, 'delivered', req.user.id);
    }

    // Strict Status Transition Validation
    const validTransitions = {
      pending: ['approved'],
      approved: ['ready_for_pickup'],
      ready_for_pickup: ['delivered'],
    };

    if (validTransitions[order.status] && !validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition: ${order.status} → ${status}. Allowed: ${validTransitions[order.status].join(', ')}`,
      });
    }

    // Reward Logic (Collector only)
    if (status === 'delivered' && req.user.role === 'collector' && !order.reward_given) {
      const { data: collector } = await supabase
        .from('users')
        .select('reward_points')
        .eq('id', req.user.id)
        .single();

      if (collector) {
        const newPoints = (collector.reward_points || 0) + 20;
        await supabase.from('users').update({ reward_points: newPoints }).eq('id', req.user.id);
        
        updateData.reward_given = true;
        
        await supabase.from('rewards').insert([{
          user_id: req.user.id,
          activity: `Delivered Order ${order.order_id}`,
          points: 20,
        }]);
        
        console.log(`🏆 [REWARD] Collector ${req.user.id} earned 20 pts for delivery ${order.order_id}`);
      }
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // ✅ Notify Student
    const statusMsg = status === 'delivered' 
      ? `📦 Your order ${order.order_id} has been delivered!` 
      : status === 'ready_for_pickup'
      ? `🎁 Your order ${order.order_id} is ready for pickup!`
      : `👍 Your order ${order.order_id} status updated to: ${status}`;

    await createNotification(order.user_id, statusMsg, 'info');

    res.json(mapOrder(updatedOrder));
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get order by ID (role-enforced)
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, user:users!orders_user_id_fkey(name, email)')
      .eq('order_id', req.params.id.toUpperCase())
      .single();

    if (error || !order) return res.status(404).json({ message: 'Order not found' });

    const mappedOrder = mapOrder(order);

    // Hide code for collectors if NOT delivered
    if (req.user.role === 'collector' && order.status !== 'delivered') {
      delete mappedOrder.pickupCode;
    }

    // Security
    if (req.user.role === 'student' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'collector' && order.block !== req.user.block) {
      return res.status(403).json({ message: 'Access denied: order belongs to another block' });
    }

    // Audit Log: Viewed
    await createAuditLog(order.order_id, 'viewed', req.user.id);

    res.json(mappedOrder);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

const assignOrder = async (req, res) => {
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
      
    if (fetchError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Concurrency Check
    if (order.assigned_to) {
      return res.status(400).json({ message: `Order already assigned to ${order.assigned_collector_name}` });
    }

    const updateData = {
      assigned_to: req.user.id,
      assigned_collector_name: req.user.name
    };
    
    // Auto-approve unassigned orders when taken
    if (order.status === 'pending') {
      updateData.status = 'approved';
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;
    
    console.log(`🤝 [SUCCESS] Order ${order.order_id} taken by Collector ${req.user.id}`);

    // ✅ Notify Student
    await createNotification(
      order.user_id,
      `🤝 Collector ${req.user.name} has taken your order ${order.order_id} and is preparing it.`,
      'info'
    );

    res.json(mapOrder(updatedOrder));
  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStoreItems, createStoreItem, redeemItem, getOrders, updateOrderStatus, getOrderById, assignOrder };
