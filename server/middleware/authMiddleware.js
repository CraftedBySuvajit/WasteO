const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Protect routes — verify JWT token and attach full user to req.user
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB to ensure data is current (block might have changed)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const safeUser = { ...user };
    delete safeUser.password;

    // Attach user to request — this includes role, block, userId etc.
    req.user = safeUser;
    console.log("AUTH USER:", req.user);

    // Debug: verify block is available (remove in production)
    if (safeUser.role === 'collector') {
      console.log(`🔑 [AUTH] Collector ${safeUser.id} authenticated | block: ${JSON.stringify(safeUser.block)}`);
    }

    next();
  } catch (err) {
    if (err.message && err.message.includes('Supabase is not configured')) {
      return res.status(503).json({ message: err.message });
    }
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Role '${req.user.role}' is not authorized` });
    }
    next();
  };
};

module.exports = { protect, authorize };
