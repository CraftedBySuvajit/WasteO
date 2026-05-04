require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const generateDemoUsers = () => {
  const users = [
    {
      name: 'System Admin',
      email: 'admin@edu.in',
      password: '12345678',
      role: 'admin',
      block: 'A'
    }
  ];

  // Add 50+ Students
  for (let i = 1; i <= 55; i++) {
    users.push({
      name: `Student ${i}`,
      email: i === 1 ? 'student@edu.in' : `student${i}@edu.in`,
      password: '12345678',
      role: 'student',
      dept: ['Computer Science', 'Environmental Science', 'Mechanical', 'Electrical'][i % 4],
      block: ['A', 'B', 'C', 'D'][i % 4],
      rewardPoints: Math.floor(Math.random() * 500)
    });
  }

  // Add 20+ Collectors
  for (let i = 1; i <= 25; i++) {
    users.push({
      name: `Collector ${i}`,
      email: i === 1 ? 'collector@edu.in' : `collector${i}@edu.in`,
      password: '12345678',
      role: 'collector',
      block: ['A', 'B', 'C'][i % 3]
    });
  }

  return users;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding...');

    const demoUsers = generateDemoUsers();

    // Clear existing demo users to avoid duplicates
    const emails = demoUsers.map(u => u.email);
    await User.deleteMany({ email: { $in: emails } });
    console.log(`🧹 Cleaned up ${emails.length} potential existing demo accounts.`);

    // Bulk create for better performance
    await User.insertMany(demoUsers);
    console.log(`✅ Created ${demoUsers.length} total demo accounts.`);

    console.log('\n✨ Seeding successful! You can now login with:');
    console.log('   Admin: admin@edu.in / 12345678');
    console.log('   Collector: collector@edu.in (and collector2..25@edu.in)');
    console.log('   Student: student@edu.in (and student2..55@edu.in)');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedDatabase();