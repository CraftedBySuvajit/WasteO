require('./config/loadEnv');
const connectMongo = require('./config/mongodb');
const User = require('./models/User');
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
    await User.insertMany(demoUsers, { ordered: false });
    console.log(`✅ Successfully inserted ${demoUsers.length} users into MongoDB.`);
    console.log('\n✨ Seeding successful! You can now login with:');
    console.log('   Admin: admin@edu.in / 12345678');
    console.log('   Collector: collector1@edu.in (up to collector10)');
    console.log('   Student: student1@edu.in (up to student15)');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exitCode = 1;
  }
};

seedDatabase();