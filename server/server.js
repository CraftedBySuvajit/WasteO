require('./config/loadEnv');

const express = require('express');
const cors = require('cors');
const connectMongo = require('./config/mongodb');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const statsRoutes = require('./routes/statsRoutes');
const storeRoutes = require('./routes/storeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const iotRoutes = require('./routes/iotRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Enforce JWT_SECRET existence and check against common placeholder values
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_with_strong_secret') {
  const errorMessage = '❌ CRITICAL: JWT_SECRET is missing or using the default placeholder value.';
  if (isProduction) {
    console.error(errorMessage);
    console.error('The server cannot start in production without a secure JWT_SECRET defined in environment variables.');
    process.exit(1);
  } else {
    console.warn(`⚠️ WARNING: ${errorMessage} Authentication and registration features will not work correctly.`);
  }
}

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:3004',
  'http://127.0.0.1:5173',
];

const envOrigins = (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  return allowedOrigins.some((pattern) => {
    if (!pattern.includes('*')) return false;
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(origin);
  });
};

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.send('🚀 WasteO Backend Running Successfully'));
app.get('/api', (req, res) => res.send('🚀 WasteO API is running successfully...'));
app.get('/api/health', async (req, res) => {
  let cloudinaryStatus = { configured: false };
  try {
    const cloudinary = require('./config/cloudinary');
    const cfg = cloudinary.config();
    cloudinaryStatus = {
      configured: !!(cfg.cloud_name && cfg.api_key && cfg.api_secret),
      cloud_name: cfg.cloud_name || 'MISSING',
      api_key: cfg.api_key ? '***' + cfg.api_key.slice(-4) : 'MISSING',
      api_secret: cfg.api_secret ? '***' + cfg.api_secret.slice(-4) : 'MISSING',
    };
  } catch (err) {
    cloudinaryStatus.error = 'Cloudinary config not found';
  }

  let multerVersion = 'unknown';
  try {
    multerVersion = require('multer/package.json').version;
  } catch (err) {
    // ignore
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    db: {
      configured: Boolean(process.env.MONGO_URI),
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.readyState,
      error: mongoose.connection.readyState === 1 ? null : 'MongoDB not connected',
    },
    cloudinary: cloudinaryStatus,
    multer: multerVersion,
  });
});

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Image too large. Maximum size is 2 MB.' });
  if (err.message && err.message.includes('Only image files')) return res.status(400).json({ message: err.message });
  console.error('🔥 Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectMongo();
    console.log('✅ MongoDB connected');
    if (require.main === module || !process.env.VERCEL) {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    if (!process.env.VERCEL) process.exit(1);
  }
};
start();

module.exports = app;
