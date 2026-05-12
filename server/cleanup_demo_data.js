require('./config/loadEnv');
const connectMongo = require('./config/mongodb');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Reward = require('./models/Reward');
const Order = require('./models/Order');
const Notification = require('./models/Notification');

const run = async () => {
  try {
    await connectMongo();
    console.log('🧹 Removing demo/test data...');

    const demoUsers = await User.find({
      $or: [
        { email: 'admin@edu.in' },
        { email: { $regex: /^student\d+@edu\.in$/i } },
        { email: { $regex: /^collector\d+@edu\.in$/i } },
        { email: 'testuser@edu.in' },
        { email: { $regex: /^test_new_.*@campus\.edu$/i } },
      ],
    }).select('_id email');

    if (!demoUsers || demoUsers.length === 0) {
      console.log('✅ No demo users found.');
      return;
    }

    const userIds = demoUsers.map((u) => u._id);
    console.log(`Found ${demoUsers.length} demo users.`);

    await Promise.all([
      Notification.deleteMany({ user_id: { $in: userIds } }),
      Reward.deleteMany({ user_id: { $in: userIds } }),
      Order.deleteMany({ user_id: { $in: userIds } }),
      Complaint.deleteMany({ user_id: { $in: userIds } }),
    ]);

    await User.deleteMany({ _id: { $in: userIds } });

    console.log('✅ Demo users removed:');
    demoUsers.forEach((u) => console.log(` - ${u.email}`));
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exitCode = 1;
  }
};

run();
