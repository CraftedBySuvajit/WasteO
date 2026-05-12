require('./config/loadEnv');

const BASE_URL = (process.env.TEST_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
const TEST_ROLE = process.env.TEST_ROLE || 'student';

const toJson = async (res) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
};

const assertStatus = (name, status, expected) => {
  const ok = expected.includes(status);
  console.log(`${ok ? '✅' : '❌'} ${name} -> ${status} (expected: ${expected.join(', ')})`);
  return ok;
};

const call = async (name, path, options = {}, expected = [200]) => {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const body = await toJson(res);
  const ok = assertStatus(name, res.status, expected);
  if (!ok) {
    console.log('  Response:', body);
  }
  return { ok, status: res.status, body };
};

const main = async () => {
  console.log(`Testing API routes at ${BASE_URL}`);

  let passed = 0;
  let total = 0;

  const count = (ok) => {
    total += 1;
    if (ok) passed += 1;
  };

  count((await call('GET /api', '', {}, [200])).ok);
  count((await call('GET /api/health', '/health', {}, [200])).ok);
  count((await call('GET /api/iot/data', '/iot/data', {}, [200, 500, 503])).ok);

  count((await call('POST /api/auth/login (negative)', '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid@example.com', password: 'invalid123', role: 'student' })
  }, [401, 500, 503])).ok);

  const protectedChecks = [
    ['/users', 'GET /api/users'],
    ['/complaints', 'GET /api/complaints'],
    ['/rewards', 'GET /api/rewards'],
    ['/stats/dashboard', 'GET /api/stats/dashboard'],
    ['/store', 'GET /api/store'],
    ['/orders', 'GET /api/orders'],
    ['/notifications', 'GET /api/notifications'],
  ];

  for (const [path, name] of protectedChecks) {
    count((await call(`${name} (no token)`, path, {}, [401])).ok);
  }

  let token = '';
  if (TEST_EMAIL && TEST_PASSWORD) {
    const login = await call('POST /api/auth/login (test user)', '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, role: TEST_ROLE })
    }, [200]);
    count(login.ok);

    if (login.ok && login.body && login.body.token) {
      token = login.body.token;
      const authHeaders = { Authorization: `Bearer ${token}` };

      count((await call('GET /api/auth/me', '/auth/me', { headers: authHeaders }, [200])).ok);
      count((await call('GET /api/complaints (token)', '/complaints', { headers: authHeaders }, [200])).ok);
      count((await call('GET /api/rewards (token)', '/rewards', { headers: authHeaders }, [200])).ok);
      count((await call('GET /api/stats/dashboard (token)', '/stats/dashboard', { headers: authHeaders }, [200])).ok);
      count((await call('GET /api/store (token)', '/store', { headers: authHeaders }, [200])).ok);
      count((await call('GET /api/orders (token)', '/orders', { headers: authHeaders }, [200])).ok);
      count((await call('GET /api/notifications (token)', '/notifications', { headers: authHeaders }, [200])).ok);
    }
  } else {
    console.log('ℹ️ TEST_EMAIL/TEST_PASSWORD not provided, skipping authenticated route checks.');
  }

  console.log(`\nRoute test summary: ${passed}/${total} checks passed.`);
  if (passed !== total) process.exitCode = 1;
};

main().catch((err) => {
  console.error('❌ Route test failed:', err.message);
  process.exitCode = 1;
});
