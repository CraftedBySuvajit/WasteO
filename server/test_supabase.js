require('./config/loadEnv');
const supabase = require('./config/supabase');

const testConnection = async () => {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  try {
    // Try to select from a table. Even if it doesn't exist or is empty, we should get a response.
    // We'll try to select from 'users' which we defined in the schema.
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Data returned:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
};

testConnection();
