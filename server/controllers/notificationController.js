const supabase = require('../config/supabase');

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
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;

    const mappedNotifications = notifications.map(n => mapNotification(n));
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
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure user owns the notification
    if (notification.user_id !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

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
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

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
    
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        message,
        type: type || 'info'
      }]);

    if (error) throw error;
    
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
