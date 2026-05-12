const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

// Helper to clean user object (remove password)
const cleanUser = (user) => {
  const obj = { ...user };
  delete obj.password;
  return obj;
};

// @desc    Get all users (admin)
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });
    
    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    // Remove passwords from response
    const cleanedUsers = users.map(user => cleanUser(user));
    res.json(cleanedUsers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });
    
    res.json(cleanUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Create user (admin)
// @route   POST /api/users
const createUser = async (req, res) => {
  try {
    const { role, name, email, dept, block, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields (name, email, password)' });
    }

    // Validate block for students and collectors
    if (['student', 'collector'].includes(role) && !block) {
      return res.status(400).json({ message: `Block (A–E) is required when creating a ${role}` });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(400).json({ message: `Email "${email.toLowerCase()}" already exists. Choose a different email.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      password: hashedPassword,
      role: role || 'student',
      name,
      email: email.toLowerCase(),
      dept: dept || '',
    };

    if (['student', 'collector'].includes(role) && block) {
      userData.block = block.toUpperCase();
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;

    console.log(`👤 [USERS] Created ${userData.role} | block: ${userData.block || 'N/A'} | email: ${userData.email}`);

    // ✅ Notify the new user directly via Supabase
    await supabase.from('notifications').insert([{
      user_id: user.id,
      message: `👋 Welcome to WasteO, ${user.name}! Your account as a ${user.role} has been created.`,
      type: 'info'
    }]);

    res.status(201).json(cleanUser(user));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update user fields
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

    // Only allow self-update or admin
    // Note: req.user.id is used here, assuming it's the UUID from JWT
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowedFields = ['name', 'email', 'dept', 'avatar'];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(cleanUser(updatedUser));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/:id/password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide old and new passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

    // Only allow self-update
    if (req.user.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('name')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) return res.status(404).json({ message: 'User not found' });

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    res.json({ message: `User ${user.name} deleted` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, changePassword, deleteUser };
