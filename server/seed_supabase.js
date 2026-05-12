require('dotenv').config();
const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

const generateUsers = async () => {
  const users = [];
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('12345678', salt);

  // 1 Admin
  users.push({
    name: 'System Admin',
    email: 'admin@edu.in',
    password: hashedPassword,
    role: 'admin',
    block: 'A',
    reward_points: 100
  });

  // 15 Students
  for (let i = 1; i <= 15; i++) {
    users.push({
      name: `Student ${i}`,
      email: `student${i}@edu.in`,
      password: hashedPassword,
      role: 'student',
      dept: ['Computer Science', 'Environmental Science', 'Mechanical', 'Electrical'][i % 4],
      block: ['A', 'B', 'C', 'D'][i % 4],
      reward_points: Math.floor(Math.random() * 500) + 100
    });
  }

  // 10 Collectors
  for (let i = 1; i <= 10; i++) {
    users.push({
      name: `Collector ${i}`,
      email: `collector${i}@edu.in`,
      password: hashedPassword,
      role: 'collector',
      block: ['A', 'B', 'C'][i % 3],
      reward_points: 100
    });
  }

  return users;
};

const seedDatabase = async () => {
  console.log('🌱 Starting Supabase seeding...');
  
  try {
    const demoUsers = await generateUsers();
    
    // Insert users into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert(demoUsers)
      .select();

    if (error) {
      console.error('❌ Seeding error:', error.message);
      console.error('Details:', error);
    } else {
      console.log(`✅ Successfully inserted ${data.length} users into Supabase.`);
      console.log('\n✨ Seeding successful! You can now login with:');
      console.log('   Admin: admin@edu.in / 12345678');
      console.log('   Collector: collector1@edu.in (up to collector10)');
      console.log('   Student: student1@edu.in (up to student15)');
    }
  } catch (err) {
    console.error('❌ Unexpected error during seeding:', err.message);
  }
};

seedDatabase();
