const supabase = require('../config/supabase');
const { createNotification } = require('./notificationController');

// Helper to map DB reward to frontend camelCase
const mapReward = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    user: r.user || r.user_id,
    activity: r.activity,
    points: r.points,
    date: r.date,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
};

// @desc    Get rewards for a user
// @route   GET /api/rewards
const getRewards = async (req, res) => {
  try {
    const { user, studentId } = req.query;
    const targetId = user || studentId;

    let query = supabase
      .from('rewards')
      .select('*, user:users!rewards_user_id_fkey(name, email)')
      .order('date', { ascending: false });

    if (targetId) {
      query = query.eq('user_id', targetId);
    }

    const { data: rewards, error } = await query;
    if (error) throw error;

    const mappedRewards = rewards.map(r => mapReward(r));
    res.json(mappedRewards);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Award points to user
// @route   POST /api/rewards
const addReward = async (req, res) => {
  try {
    const { user: targetId, studentId, activity, points } = req.body;
    const finalTargetId = targetId || studentId;

    if (!finalTargetId || !activity || !points) {
      return res.status(400).json({ message: 'Please provide user, activity, and points' });
    }

    if (points < 1) {
      return res.status(400).json({ message: 'Points must be at least 1' });
    }

    // Find user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', finalTargetId)
      .single();

    if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

    const updatedPoints = (user.reward_points || 0) + Number(points);

    // Update user points
    const { error: updateError } = await supabase
      .from('users')
      .update({ reward_points: updatedPoints })
      .eq('id', finalTargetId);

    if (updateError) throw updateError;

    // Create reward record
    const { data: reward, error: insertError } = await supabase
      .from('rewards')
      .insert([{
        user_id: finalTargetId,
        activity,
        points: Number(points),
        date: new Date(),
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // ✅ Notify User
    await createNotification(
      finalTargetId,
      `🏆 Reward Credited: +${points} pts for "${activity}"`,
      'reward'
    );

    res.status(201).json({ reward: mapReward(reward), updatedPoints });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRewards, addReward };
