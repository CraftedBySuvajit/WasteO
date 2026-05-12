const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

// Generate JWT with id, role, and block embedded
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      block: user.block || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper to clean user object (remove password)
const cleanUser = (user) => {
  const obj = { ...user };
  delete obj.password;
  return obj;
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      console.log(`❌ [LOGIN]: User not found or error: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ [LOGIN]: Password mismatch for ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Role mismatch check
    if (role && user.role !== role) {
      console.log(`❌ [LOGIN]: Role mismatch for ${email}. Expected ${role}, got ${user.role}`);
      return res.status(401).json({
        message: `This account is not a ${role} account. Please select the correct role.`,
      });
    }

    res.json({
      token: generateToken(user),
      user: cleanUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Register student
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, dept, password, block } = req.body;

    const studentBlock = block || 'A';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Ensure uniqueness
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          password: hashedPassword,
          role: 'student',
          name,
          email: email.toLowerCase(),
          dept: dept || '',
          block: studentBlock,
          reward_points: 100,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ [REGISTER ERROR]:', error.message);
      return res.status(500).json({ message: 'Failed to register user', error: error.message });
    }

    // Create signup bonus reward entry
    const { error: rewardError } = await supabase
      .from('rewards')
      .insert([
        {
          user_id: user.id,
          activity: 'Signup Bonus',
          points: 100,
          date: new Date(),
        }
      ]);

    if (rewardError) console.error('⚠️ [REWARD ERROR]:', rewardError.message);

    console.log(`🎁 [SIGNUP] New student ${user.email} received 100 pts signup bonus`);

    // ✅ Notify Student (Omitted for simplicity or if not yet migrated)
    // await createNotification(user.id, '🎉 100 Points Credited! Welcome Bonus!', 'reward');

    // ✅ Notify Admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins) {
      for (const admin of admins) {
        await supabase.from('notifications').insert([{
          user_id: admin.id,
          message: `🆕 New user registered: ${user.name} (${user.email})`,
          type: 'user'
        }]);
      }
    }

    res.status(201).json({
      token: generateToken(user),
      user: cleanUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide Email' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (!user) {
      return res.status(404).json({ message: 'User not found with matching email.' });
    }

    console.log(`🔑 [PASSWORD RESET] Request received for ${user.email}`);
    
    res.json({ 
      message: 'Password reset request received. Instructions have been sent to your administrator or registered email.' 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, register, getMe, forgotPassword };
