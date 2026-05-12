require('./config/loadEnv');
const connectMongo = require('./config/mongodb');
const User = require('./models/User');
const StoreItem = require('./models/StoreItem');
const Reward = require('./models/Reward');
const Complaint = require('./models/Complaint');
const Notification = require('./models/Notification');
const BinData = require('./models/BinData');
const Order = require('./models/Order');
const bcrypt = require('bcryptjs');

const generateUsers = async () => {
  const users = [];
  const hashedPassword = await bcrypt.hash('12345678', 10);

  users.push({ name: 'System Admin', email: 'admin@edu.in', password: hashedPassword, role: 'admin', block: 'A', reward_points: 100 });

  for (let i = 1; i <= 40; i++) {
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

  for (let i = 1; i <= 15; i++) {
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
        { name: 'Reusable Bottle', description: '500ml stainless steel vacuum flask.', image: 'https://images.unsplash.com/photo-1602143307185-8a1550552844?w=400', points_required: 300, stock: 20, category: 'accessories' },
        { name: 'Recycled Notebook', description: 'Eco-friendly A5 notebook from recycled paper.', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400', points_required: 150, stock: 50, category: 'stationery' },
        { name: 'Plant Sapling', description: 'Native sapling for campus planting.', image: 'https://images.unsplash.com/photo-1592150621344-22d50897be4d?w=400', points_required: 200, stock: 30, category: 'garden' },
        { name: 'Bamboo Toothbrush', description: 'Biodegradable bamboo handle with soft bristles.', image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400', points_required: 50, stock: 100, category: 'accessories' },
        { name: 'Canvas Tote Bag', description: 'Heavy duty reusable canvas bag for shopping.', image: 'https://images.unsplash.com/photo-1591339021151-692795f54366?w=400', points_required: 120, stock: 40, category: 'accessories' },
        { name: 'Solar Keychain Light', description: 'Small LED light charged via solar panel.', image: 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=400', points_required: 250, stock: 15, category: 'electronics' },
        { name: 'Metal Straw Set', description: 'Set of 4 straws with cleaning brush.', image: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?w=400', points_required: 80, stock: 60, category: 'kitchen' },
        { name: 'Compost Bin (Home)', description: 'Small kitchen compost bin for organic waste.', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400', points_required: 500, stock: 10, category: 'garden' },
        { name: 'Recycled Pens (Pack of 5)', description: 'Pens made from recycled ocean plastic.', image: 'https://images.unsplash.com/photo-1585336139118-132f7f21503e?w=400', points_required: 60, stock: 80, category: 'stationery' },
        { name: 'Seed Paper Cards', description: 'Cards you can plant after use.', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400', points_required: 100, stock: 45, category: 'stationery' },
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
    const allStudents = await User.find({ role: 'student' });
    const allCollectors = await User.find({ role: 'collector' });

    // ── More Rewards & Notifications ──
    console.log('✨ Seeding rewards and notifications...');
    for (let i = 0; i < 20; i++) {
      const target = allStudents[i % allStudents.length];
      await Reward.create({ user_id: target._id, activity: ['Campus Cleanup', 'Plastic Recycling', 'Expert Reporting', 'Health Webinar'][i % 4], points: (i + 1) * 10 });
      await Notification.create({ user_id: target._id, message: `You earned ${(i + 1) * 10} points for environmental contributions!`, type: 'reward' });
    }

    // ── More Complaints ──
    const existingComplaints = await Complaint.countDocuments();
    if (existingComplaints < 5) {
      console.log('✨ Seeding multiple complaints across blocks...');
      const complaintTemplates = [
        { loc: 'Canteen Backside', type: 'organic', desc: 'Leftover food waste causing bad smell.' },
        { loc: 'Main Library Entrance', type: 'plastic', desc: 'Empty water bottles scattered near the steps.', image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400' },
        { loc: 'Block B Laboratory', type: 'hazardous', desc: 'Chemical waste containers left unattended.' },
        { loc: 'Auditorium Garden', type: 'paper', desc: 'Event flyers and paper waste after the seminar.' },
        { loc: 'Hostel A Gate', type: 'metal', desc: 'Construction scrap blocking the walkway.' },
        { loc: 'Sports Ground', type: 'plastic', desc: 'Plastic wrappers after the match.', image: 'https://images.unsplash.com/photo-1595273670150-db0a3bf44244?w=400' },
        { loc: 'Admin Block Stairs', type: 'paper', desc: 'Shredded documents found outside bin.' },
        { loc: 'Parking Zone 2', type: 'metal', desc: 'Rusty car parts dumped illegally.' },
        { loc: 'Cafeteria Kitchen', type: 'organic', desc: 'Expired produce bins overflowing.' },
        { loc: 'Gym Entrance', type: 'plastic', desc: 'Disposable masks and energy drink bottles.' },
        { 
          loc: 'Central Fountain', 
          type: 'hazardous', 
          desc: 'Old battery pack found leaking near water source.',
          ai_results: { label: 'Hazardous Waste', confidence: 0.99, detected_items: ['battery', 'acid'] }
        },
        { 
          loc: 'Block D Workshop', 
          type: 'metal', 
          desc: 'Leftover metal shavings from machining project.',
          ai_results: { label: 'Scrap Metal', confidence: 0.91, detected_items: ['aluminum', 'shavings'] }
        },
        { 
          loc: 'Academic Block C', 
          type: 'plastic', 
          desc: 'Automated detection: Multiple plastic bottles found.', 
          image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400', 
          ai_results: { label: 'Plastic Bottles', confidence: 0.98, detected_items: ['bottle', 'bottle', 'wrapper'] } 
        },
        { 
          loc: 'North Parking Lot', 
          type: 'paper', 
          desc: 'AI Alert: High density of paper waste detected.', 
          image: 'https://images.unsplash.com/photo-1595273670150-db0a3bf44244?w=400', 
          ai_results: { label: 'Paper Waste', confidence: 0.94, detected_items: ['cardboard', 'paper'] } 
        },
      ];

      for (let i = 0; i < 30; i++) {
        const temp = complaintTemplates[i % complaintTemplates.length];
        const stu = allStudents[i % allStudents.length];
        const block = ['A', 'B', 'C', 'D'][i % 4];
        const status = ['pending', 'in-progress', 'completed', 'rejected', 'pending'][i % 5];
        
        const complaint = await Complaint.create({
          complaint_id: `C-${Date.now()}-${i}`,
          user_id: stu._id,
          location: temp.loc,
          waste_type: temp.type,
          description: temp.desc,
          block: block,
          image: temp.image || null,
          ai_results: temp.ai_results || null,
          status: status,
          assignedTo: status !== 'pending' ? allCollectors.find(c => c.block === block)?._id : null,
          status_history: [{ status: 'pending', note: 'Initial report', timestamp: new Date() }],
        });

        if (status === 'completed') {
          await Reward.create({ user_id: stu._id, activity: 'Waste Reporting Reward', points: 10 });
        }
      }
    }

    // ── Store Orders (Redemptions) ──
    const existingOrders = await Order.countDocuments();
    if (existingOrders === 0) {
      console.log('✨ Seeding marketplace orders...');
      const storeItemsList = await StoreItem.find();
      if (storeItemsList.length > 0) {
        for (let i = 0; i < 8; i++) {
          const stu = allStudents[i % allStudents.length];
          const item = storeItemsList[i % storeItemsList.length];
          const status = ['pending', 'approved', 'ready_for_pickup', 'delivered'][i % 4];
          
          await Order.create({
            order_id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            user_id: stu._id,
            user_name: stu.name,
            item_id: item._id,
            item_name: item.name,
            points_used: item.points_required,
            status: status,
            pickup_location: 'Main Admin Office',
            pickup_time: '10:00 AM - 04:00 PM',
            pickup_code: Math.random().toString(36).substr(2, 6).toUpperCase(),
            assigned_to: status !== 'pending' ? allCollectors[0]._id : null
          });

          await Notification.create({
            user_id: stu._id,
            message: `Order for ${item.name} is now ${status.replace(/_/g, ' ')}.`,
            type: 'info'
          });
        }
      }
    }

    // Sample bin data
    const existingBins = await BinData.countDocuments();
    if (existingBins === 0) {
      const bins = [
        { bin_id: 'BIN-A-1', block: 'A', level: 80 },
        { bin_id: 'BIN-B-1', block: 'B', level: 40 },
        { bin_id: 'BIN-C-1', block: 'C', level: 20 },
        { bin_id: 'BIN-A-2', block: 'A', level: 95 },
        { bin_id: 'BIN-D-1', block: 'D', level: 10 },
        { bin_id: 'BIN-B-2', block: 'B', level: 85 },
        { bin_id: 'BIN-C-2', block: 'C', level: 55 },
        { bin_id: 'BIN-D-2', block: 'D', level: 30 },
        { bin_id: 'BIN-A-3', block: 'A', level: 15 },
        { bin_id: 'BIN-B-3', block: 'B', level: 45 },
        { bin_id: 'BIN-C-3', block: 'C', level: 92 },
        { bin_id: 'BIN-E-1', block: 'E', level: 60 },
      ];
      await BinData.insertMany(bins);
      console.log(`✅ Seeded ${bins.length} bin telemetry entries`);
    } else {
      console.log(`ℹ️ Bin data already present (${existingBins}), skipping bin seed.`);
    }

    console.log('\n✨ Seeding complete! Demo data is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDatabase();