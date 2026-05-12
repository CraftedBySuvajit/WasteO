const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

const cleanUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort({ created_at: -1 });
    res.json(users.map(cleanUser));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(cleanUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { role, name, email, dept, block, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please fill all required fields (name, email, password)' });
    if (['student', 'collector'].includes(role) && !block) return res.status(400).json({ message: `Block (A–E) is required when creating a ${role}` });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: `Email "${email.toLowerCase()}" already exists. Choose a different email.` });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ password: hashedPassword, role: role || 'student', name, email: email.toLowerCase(), dept: dept || '', block: ['student', 'collector'].includes(role) && block ? block.toUpperCase() : undefined });

    await Notification.create({ user_id: user._id, message: `👋 Welcome to WasteO, ${user.name}! Your account as a ${user.role} has been created.`, type: 'info' });
    res.status(201).json(cleanUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role !== 'admin' && String(req.user.id) !== String(user.id)) return res.status(403).json({ message: 'Not authorized' });

    const allowedFields = ['name', 'email', 'dept', 'avatar'];
    allowedFields.forEach((field) => { if (req.body[field] !== undefined) user[field] = req.body[field]; });
    await user.save();
    res.json(cleanUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Please provide old and new passwords' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (String(req.user.id) !== String(user.id)) return res.status(403).json({ message: 'Not authorized' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: `User ${user.name} deleted` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, changePassword, deleteUser };
