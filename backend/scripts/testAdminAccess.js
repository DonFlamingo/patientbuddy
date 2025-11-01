// Test admin sign-in and verify admin endpoints
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@patientbuddy.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass123!';

async function run() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const loginData = await loginRes.json();
    console.log('LOGIN RESPONSE:', JSON.stringify(loginData, null, 2));
    if (!loginData.token) {
      console.error('Login failed');
      process.exit(1);
    }
    const token = loginData.token;

    // Call admin users endpoint
    const usersRes = await fetch('http://localhost:3000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const usersData = await usersRes.json();
    console.log('ADMIN /users STATUS:', usersRes.status);
    console.log('USERS LENGTH:', Array.isArray(usersData) ? usersData.length : 'not-array');
    console.log(JSON.stringify(usersData, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
