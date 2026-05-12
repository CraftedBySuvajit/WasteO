require('./config/loadEnv');

const testRegistration = async () => {
    try {
        const payload = {
            name: "Test User",
            email: "test_new_" + Date.now() + "@campus.edu",
            dept: "IT",
            password: "password123"
        };
        console.log('Sending request to http://localhost:5000/api/auth/register with payload:', payload);
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            if (res.status === 503) {
                console.log('⚠️ Registration blocked by backend configuration:');
                console.log(data.message || 'MongoDB connection or schema setup is required for writes.');
                return;
            }
            throw new Error(data.message || 'Registration failed');
        }

        console.log('✅ Registration SUCCESS:', data.user?.id || 'User created');
    } catch (err) {
        console.error('❌ Registration FAILED:', err.message);
    }
};

testRegistration();
