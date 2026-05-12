const supabase = require('../config/supabase');

// @desc    Get dashboard stats (role-aware)
// @route   GET /api/stats/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const complaintMatch = {};
    if (req.user.role === 'collector') {
      if (!req.user.block) return res.json({ total: 0, pending: 0, progress: 0, done: 0, students: 0, collectors: 0 });
      complaintMatch.block = req.user.block;
    } else if (req.user.role === 'student') {
      complaintMatch.user_id = req.user.id;
    }

    // 1. Fetch Complaints for status aggregation
    let complaintsQuery = supabase.from('complaints').select('status, block');
    if (complaintMatch.block) complaintsQuery = complaintsQuery.eq('block', complaintMatch.block);
    if (complaintMatch.user_id) complaintsQuery = complaintsQuery.eq('user_id', complaintMatch.user_id);
    
    const { data: complaints, error: compError } = await complaintsQuery;
    if (compError) throw compError;

    const statusMap = {};
    complaints.forEach(c => {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    });

    // 2. Fetch Users for role aggregation
    const { data: users, error: userError } = await supabase.from('users').select('role');
    if (userError) throw userError;

    const roleMap = {};
    users.forEach(u => {
      roleMap[u.role] = (roleMap[u.role] || 0) + 1;
    });

    // 3. Admin only: Order analytics
    let totalOrders = 0;
    let deliveredOrders = 0;
    let failedAttempts = 0;
    let blockPerformance = [];

    if (req.user.role === 'admin') {
      // Total orders
      const { count: total } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      totalOrders = total || 0;

      // Delivered orders
      const { count: delivered } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered');
      deliveredOrders = delivered || 0;

      // Failed attempts (count of order logs with action 'failed_verification')
      const { count: failed } = await supabase.from('order_logs').select('*', { count: 'exact', head: true }).eq('action', 'failed_verification');
      failedAttempts = failed || 0;

      // Block performance (delivered orders grouped by block)
      const { data: deliveredOrdersData } = await supabase.from('orders').select('block').eq('status', 'delivered');
      
      const blockMap = {};
      if (deliveredOrdersData) {
        deliveredOrdersData.forEach(o => {
          if (o.block) blockMap[o.block] = (blockMap[o.block] || 0) + 1;
        });
      }
      blockPerformance = Object.keys(blockMap).map(block => ({ _id: block, count: blockMap[block] }));
    }

    res.json({
      total: (statusMap['pending'] || 0) + (statusMap['in-progress'] || 0) + (statusMap['in_progress'] || 0) + (statusMap['completed'] || 0),
      pending: statusMap['pending'] || 0,
      progress: (statusMap['in-progress'] || 0) + (statusMap['in_progress'] || 0),
      done: statusMap['completed'] || 0,
      students: roleMap['student'] || 0,
      collectors: roleMap['collector'] || 0,
      // Advanced Metrics
      orderAnalytics: {
        total: totalOrders,
        delivered: deliveredOrders,
        completionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0,
        failedAttempts,
        blockPerformance
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getDashboardStats };
