const speakeasy = require('speakeasy');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

async function request(method, path, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function runTest() {
  try {
    console.log('1. Connecting to DB to clear users...');
    await mongoose.connect('mongodb://localhost:27017/whatsapp-automation');
    await mongoose.connection.db.collection('users').deleteMany({});
    console.log('Users cleared.');

    console.log('\n2. Testing /api/auth/setup...');
    const setupRes = await request('POST', '/auth/setup', {
      username: 'testadmin',
      password: 'password123'
    });
    console.log('Setup successful:', setupRes.success);
    const token = setupRes.token;

    console.log('\n3. Generating 2FA...');
    const genRes = await request('POST', '/auth/2fa/generate', null, token);
    const secret = genRes.secret;
    console.log('Generated secret:', secret);

    console.log('\n4. Enabling 2FA...');
    const totpToken = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
    const enableRes = await request('POST', '/auth/2fa/enable', {
      secret,
      token: totpToken
    }, token);
    console.log('2FA Enabled:', enableRes.message);

    console.log('\n5. Testing Login with 2FA...');
    const loginRes = await request('POST', '/auth/login', {
      username: 'testadmin',
      password: 'password123'
    });
    console.log('Login requires 2FA:', loginRes.requiresTwoFactor);
    const tempToken = loginRes.tempToken;

    console.log('\n6. Verifying 2FA for Login...');
    const loginTotpToken = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
    const verifyRes = await request('POST', '/auth/verify-2fa', {
      token: loginTotpToken
    }, tempToken);
    console.log('Login Verified! Token received:', !!verifyRes.token);

    console.log('\n✅ All 2FA flows tested successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
