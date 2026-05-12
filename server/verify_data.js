const supabase = require('./config/supabase');

const verifyData = async () => {
  console.log('🔍 Starting database verification...');

  try {
    // 1. Check Total Users
    const { count: userCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`📊 Total Users in Database: ${userCount}`);

    // 2. Check Test User
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('email', 'testuser@edu.in')
      .single();

    if (userError) {
      console.log('❌ Test user "testuser@edu.in" not found or error occurred.');
    } else {
      console.log('✅ Test User Found:');
      console.log(testUser);
    }

    // 3. Check Admins
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'admin');

    if (adminError) throw adminError;
    console.log(`👑 Admins found: ${admins.length}`);
    admins.forEach(a => console.log(` - ${a.email}`));

    console.log('\n✨ Verification complete!');

  } catch (err) {
    console.error('❌ Error during verification:', err.message);
  }
};

verifyData();
