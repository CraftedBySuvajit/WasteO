require('./config/loadEnv');
const supabase = require('./config/supabase');

const run = async () => {
  try {
    console.log('🧹 Removing demo/test data...');

    const { data: demoUsers, error: fetchErr } = await supabase
      .from('users')
      .select('id,email')
      .or('email.eq.admin@edu.in,email.like.student%@edu.in,email.like.collector%@edu.in,email.eq.testuser@edu.in,email.like.test_new_%@campus.edu');

    if (fetchErr) throw fetchErr;

    if (!demoUsers || demoUsers.length === 0) {
      console.log('✅ No demo users found.');
      return;
    }

    const userIds = demoUsers.map((u) => u.id);
    console.log(`Found ${demoUsers.length} demo users.`);

    const delOps = [
      ['notifications', 'user_id'],
      ['rewards', 'user_id'],
      ['orders', 'user_id'],
      ['complaints', 'user_id'],
    ];

    for (const [table, col] of delOps) {
      const { error } = await supabase.from(table).delete().in(col, userIds);
      if (error) {
        console.log(`⚠️ ${table} cleanup skipped: ${error.message}`);
      } else {
        console.log(`✅ Cleaned ${table}`);
      }
    }

    const { error: userDeleteErr } = await supabase
      .from('users')
      .delete()
      .in('id', userIds);

    if (userDeleteErr) throw userDeleteErr;

    console.log('✅ Demo users removed:');
    demoUsers.forEach((u) => console.log(` - ${u.email}`));
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exitCode = 1;
  }
};

run();
