require('./config/loadEnv');
const connectMongo = require('./config/mongodb');
const User = require('./models/User');
const StoreItem = require('./models/StoreItem');
const Reward = require('./models/Reward');
const Complaint = require('./models/Complaint');
const Notification = require('./models/Notification');
const BinData = require('./models/BinData');
const bcrypt = require('bcryptjs');

const generateUsers = async () => {
  const users = [];
  const hashedPassword = await bcrypt.hash('12345678', 10);

  users.push({ name: 'System Admin', email: 'admin@edu.in', password: hashedPassword, role: 'admin', block: 'A', reward_points: 100 });

  for (let i = 1; i <= 15; i++) {
    users.push({
      name: `Student ${i}`,
      email: `student${i}@edu.in`,
      password: hashedPassword,
      role: 'student',
      dept: ['Computer Science', 'Environmental Science', 'Mechanical', 'Electrical'][i % 4],
      block: ['A', 'B', 'C', 'D'][i % 4],
      reward_points: Math.floor(Math.random() * 500) + 100,
    });
  }

  for (let i = 1; i <= 10; i++) {
    users.push({
      name: `Collector ${i}`,
      email: `collector${i}@edu.in`,
      password: hashedPassword,
      role: 'collector',
      block: ['A', 'B', 'C'][i % 3],
      reward_points: 100,
    });
  }

  return users;
};

const seedDatabase = async () => {
  console.log('🌱 Starting Mongo seeding...');
  try {
    await connectMongo();
    const demoUsers = await generateUsers();
    const emails = demoUsers.map((user) => user.email);
    const existingUsers = await User.find({ email: { $in: emails } }).select('email');
    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const usersToInsert = demoUsers.filter((user) => !existingEmails.has(user.email));

    if (usersToInsert.length > 0) {
      await User.insertMany(usersToInsert, { ordered: false });
    }

    console.log(`✅ Seed users: Inserted ${usersToInsert.length} new users, skipped ${demoUsers.length - usersToInsert.length} existing users.`);

    // ── Store items demo ──
    const existingStoreCount = await StoreItem.countDocuments();
    if (existingStoreCount === 0) {
      const items = [
        { name: 'Reusable Bottle', description: '500ml stainless bottle', image: '/images/bottle.jpg', points_required: 300, stock: 20, category: 'accessories' },
        { name: 'Recycled Notebook', description: 'A5 notebook from recycled paper', image: '/images/notebook.jpg', points_required: 150, stock: 50, category: 'stationery' },
        { name: 'Plant Sapling', description: 'Native sapling for campus planting', image: '/images/plant.jpg', points_required: 200, stock: 30, category: 'garden' },
      ];
      await StoreItem.insertMany(items);
      console.log(`✅ Seed store items: inserted ${items.length} items.`);
    } else {
      console.log(`ℹ️ Store items already present (${existingStoreCount}), skipping store seed.`);
    }

    // ── Notifications / Rewards / Complaints demo ──
    // Create a couple of sample notifications and rewards for first student and collector
    const admin = await User.findOne({ email: 'admin@edu.in' });
    const student = await User.findOne({ email: 'student1@edu.in' });
    const collector = await User.findOne({ email: 'collector1@edu.in' });

    if (student) {
      const existingRewards = await Reward.find({ user_id: student._id }).limit(1);
      if (existingRewards.length === 0) {
        await Reward.create({ user_id: student._id, activity: 'Welcome bonus', points: 100 });
        await Notification.create({ user_id: student._id, message: 'Welcome to WasteO! You earned 100 points.', type: 'reward' });
        console.log('✅ Seed reward/notification for student1');
      }
    }

    if (collector) {
      const existingNotifications = await Notification.find({ user_id: collector._id }).limit(1);
      if (existingNotifications.length === 0) {
        await Notification.create({ user_id: collector._id, message: 'Collector account active — check assigned pickups.', type: 'info' });
        console.log('✅ Seed notification for collector1');
      }
    }

    // Sample complaint
    const existingComplaints = await Complaint.countDocuments();
    if (existingComplaints === 0 && student) {
      await Complaint.create({
        complaint_id: `C-${Date.now()}`,
        user_id: student._id,
        location: 'Canteen area',
        waste_type: 'plastic',
        description: 'Overflowing plastic waste near canteen',
        block: 'A',
        image: '',
        status_history: [{ status: 'pending', note: 'New complaint', timestamp: new Date() }],
      });
      console.log('✅ Seed sample complaint');
    }

    // Sample bin data
    const existingBins = await BinData.countDocuments();
    if (existingBins === 0) {
      const bins = [
        { bin_id: 'BIN-A-1', block: 'A', level: 80 },
        { bin_id: 'BIN-B-1', block: 'B', level: 40 },
        { bin_id: 'BIN-C-1', block: 'C', level: 20 },
      ];
      await BinData.insertMany(bins);
      console.log(`✅ Seeded ${bins.length} bin telemetry entries`);
    } else {
      console.log(`ℹ️ Bin data already present (${existingBins}), skipping bin seed.`);
    }

    console.log('\n✨ Seeding complete! Demo data is ready.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  }
};

seedDatabase();