require('./config/loadEnv');
const connectMongo = require('./config/mongodb');
const User = require('./models/User');
const Reward = require('./models/Reward');

const verifyData = async () => {
  console.log('🔍 Starting database verification...');

  try {
    await connectMongo();

    const userCount = await User.countDocuments();
    console.log(`📊 Total Users in Database: ${userCount}`);

    const testUser = await User.findOne({ email: 'testuser@edu.in' }).select('_id name email role');
    if (!testUser) {
      console.log('❌ Test user "testuser@edu.in" not found or error occurred.');
    } else {
      console.log('✅ Test User Found:');
      console.log(testUser);
    }

    const admins = await User.find({ role: 'admin' }).select('email');
    console.log(`👑 Admins found: ${admins.length}`);
    admins.forEach((a) => console.log(` - ${a.email}`));

    const rewardCount = await Reward.countDocuments();
    console.log(`🏆 Total Rewards: ${rewardCount}`);

    console.log('\n✨ Verification complete!');

  } catch (err) {
    console.error('❌ Error during verification:', err.message);
  }
};

verifyData();
