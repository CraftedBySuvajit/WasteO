require('./config/loadEnv');
const testLogin = async () => {
  const baseUrl = 'http://localhost:5000/api/auth';
  const testUser = {
    name: 'Test User',
    email: 'testuser@edu.in',
    password: '12345678',
    dept: 'CS',
    block: 'A'
  };

  console.log('Starting login test...');

  try {
    // 1. Try to Register
    console.log('Trying to register user...');
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const regData = await regRes.json();
    console.log('Register Response Status:', regRes.status);
    console.log('Register Response:', regData);

    if (regRes.status === 503) {
      console.log('⚠️ Auth write flow is blocked by backend configuration:');
      console.log(regData.message || 'MongoDB connection or schema setup is required for registration writes.');
      return;
    }

    // If user already exists, that's fine too for testing login.
    if (regRes.status !== 201 && regRes.status !== 400) {
      console.error('❌ Registration failed with unexpected status.');
      return;
    }

    // 2. Try to Login
    console.log('Trying to login...');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        role: 'student'
      })
    });

    const loginData = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Response:', loginData);

    if (loginRes.status === 200) {
      console.log('✅ Login successful!');
      console.log('Token:', loginData.token ? 'Received' : 'Missing');
    } else {
      console.error('❌ Login failed.');
    }

  } catch (err) {
    console.error('❌ Error during test:', err.message);
  }
};

// Wait for server to be up before running
setTimeout(testLogin, 3000);
