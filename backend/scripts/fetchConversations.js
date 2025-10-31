// Simple script to login as admin and fetch admin conversations
// Requires backend running on localhost:3000

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
    console.log('=== LOGIN RESPONSE ===');
    console.log(JSON.stringify(loginData, null, 2));

    if (!loginData.token) {
      console.error('Login failed, no token returned');
      process.exit(1);
    }

    const token = loginData.token;

    const convRes = await fetch('http://localhost:3000/api/admin/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const convData = await convRes.json();
    console.log('=== CONVERSATIONS ===');
    console.log(JSON.stringify(convData, null, 2));
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
