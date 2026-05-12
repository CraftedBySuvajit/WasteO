const Notification = require('../models/Notification');

// Helper to map DB notification to frontend camelCase
const mapNotification = (n) => {
  if (!n) return null;
  return {
    id: n.id,
    user: n.user_id,
    message: n.message,
    type: n.type,
    isRead: n.is_read,
    createdAt: n.created_at,
    updatedAt: n.updated_at
  };
};

// @desc    Get user notifications
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user_id: userId }).sort({ created_at: -1 }).limit(50);
    const mappedNotifications = notifications.map((n) => mapNotification(n));
    res.json(mappedNotifications);
  } catch (err) {
    console.error(`❌ [NOTIFICATIONS ERROR]: ${err.message}`);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/read/:id
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure user owns the notification
    if (String(notification.user_id) !== String(req.user.id)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.is_read = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true });

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Internal utility to create notifications
const createNotification = async (userId, message, type) => {
  try {
    if (!userId) {
      console.error('⚠️ [NOTIFICATION] Cannot create notification: No userId provided');
      return;
    }
    
    await Notification.create({
      user_id: userId,
      message,
      type: type || 'info',
    });
    
    console.log(`🔔 [NOTIFICATION] Created for user ${userId}: "${message}" (${type})`);
  } catch (err) {
    console.error('❌ [NOTIFICATION ERROR]:', err.message);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
