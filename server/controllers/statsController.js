const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderLog = require('../models/OrderLog');

const getDashboardStats = async (req, res) => {
  try {
    const complaintMatch = {};
    if (req.user.role === 'collector') {
      if (!req.user.block) return res.json({ total: 0, pending: 0, progress: 0, done: 0, students: 0, collectors: 0 });
      complaintMatch.block = req.user.block;
    } else if (req.user.role === 'student') {
      complaintMatch.user_id = req.user.id;
    }

    const complaints = await Complaint.find(complaintMatch).select('status block');
    const statusMap = {};
    complaints.forEach((c) => { statusMap[c.status] = (statusMap[c.status] || 0) + 1; });

    const users = await User.find().select('role');
    const roleMap = {};
    users.forEach((u) => { roleMap[u.role] = (roleMap[u.role] || 0) + 1; });

    let totalOrders = 0;
    let deliveredOrders = 0;
    let failedAttempts = 0;
    let blockPerformance = [];

    if (req.user.role === 'admin') {
      totalOrders = await Order.countDocuments();
      deliveredOrders = await Order.countDocuments({ status: 'delivered' });
      failedAttempts = await OrderLog.countDocuments({ action: 'failed_verification' });
      const deliveredOrdersData = await Order.find({ status: 'delivered' }).select('block');
      const blockMap = {};
      deliveredOrdersData.forEach((o) => { if (o.block) blockMap[o.block] = (blockMap[o.block] || 0) + 1; });
      blockPerformance = Object.keys(blockMap).map((block) => ({ _id: block, count: blockMap[block] }));
    }

    res.json({
      total: (statusMap['pending'] || 0) + (statusMap['in-progress'] || 0) + (statusMap['in_progress'] || 0) + (statusMap['completed'] || 0),
      pending: statusMap['pending'] || 0,
      progress: (statusMap['in-progress'] || 0) + (statusMap['in_progress'] || 0),
      done: statusMap['completed'] || 0,
      students: roleMap['student'] || 0,
      collectors: roleMap['collector'] || 0,
      orderAnalytics: {
        total: totalOrders,
        delivered: deliveredOrders,
        completionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0,
        failedAttempts,
        blockPerformance,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getDashboardStats };
