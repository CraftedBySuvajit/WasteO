const Reward = require('../models/Reward');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const mapReward = (r) => ({
  id: r.id,
  user: r.user_id,
  activity: r.activity,
  points: r.points,
  date: r.date,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const getRewards = async (req, res) => {
  try {
    const { user, studentId } = req.query;
    const targetId = user || studentId;
    const filter = targetId ? { user_id: targetId } : {};
    const rewards = await Reward.find(filter).sort({ date: -1 });
    res.json(rewards.map(mapReward));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addReward = async (req, res) => {
  try {
    const { user: targetId, studentId, activity, points } = req.body;
    const finalTargetId = targetId || studentId;

    if (!finalTargetId || !activity || !points) {
      return res.status(400).json({ message: 'Please provide user, activity, and points' });
    }

    if (points < 1) return res.status(400).json({ message: 'Points must be at least 1' });

    const user = await User.findById(finalTargetId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.reward_points = (user.reward_points || 0) + Number(points);
    await user.save();

    const reward = await Reward.create({ user_id: finalTargetId, activity, points: Number(points), date: new Date() });
    await createNotification(finalTargetId, `🏆 Reward Credited: +${points} pts for "${activity}"`, 'reward');

    res.status(201).json({ reward: mapReward(reward), updatedPoints: user.reward_points });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRewards, addReward };
