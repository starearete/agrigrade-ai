const http = require('http');

const req = http.request(
  'http://localhost:8085/api/v1/auth/register',
  { method: 'POST', headers: { 'Content-Type': 'application/json' } },
  (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => console.log('REGISTER RESP:', res.statusCode, d));
  }
);

req.write(
  JSON.stringify({
    fullName: 'Test User',
    email: `test_${Date.now()}@agrigrade.ai`,
    mobileNumber: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'FARMER',
  })
);
req.end();
