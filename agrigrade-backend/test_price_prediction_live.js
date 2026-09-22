const BASE = 'http://localhost:8085';

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

async function login(email, password, fullName, role) {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrMobile: email, password: password })
  });

  if (res.status === 401 || res.status === 404) {
    const uniqueMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const regRes = await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        mobileNumber: uniqueMobile,
        password,
        role
      })
    });
    const regData = await safeJson(regRes);
    if (regRes.ok) return regData.accessToken;
  }

  const data = await safeJson(res);
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(data)}`);
  return data.accessToken || data.token;
}

function makeImageFormData(filename = 'test.jpg') {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
  const fakeJpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
    0x00, 0xBF, 0x00, 0xFF, 0xD9
  ]);

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`),
    fakeJpeg,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  return {
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body
  };
}

async function test() {
  console.log('1. Authenticating Farmer...');
  const token = await login('farmer_pred@agrigrade.ai', 'farmer123', 'Price Forecast Farmer', 'FARMER');
  console.log('   Farmer token received.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('2. Creating Harvest Batch...');
  const batchRes = await fetch(`${BASE}/api/v1/batches`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cropId: 3,
      varietyId: 24,
      harvestDate: '2026-08-08',
      quantity: 1500,
      quantityUnit: 'KG',
      district: 'Theni',
      state: 'TN'
    })
  });
  const batch = await safeJson(batchRes);
  console.log('   Batch status:', batchRes.status, batch);
  console.log('   Batch created, ID:', batch.id);

  console.log('3. Uploading Evidence & Running AI Analysis...');
  const form = makeImageFormData('sample.jpg');
  await fetch(`${BASE}/api/v1/batches/${batch.id}/images`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, ...form.headers },
    body: form.body
  });

  await fetch(`${BASE}/api/v1/batches/${batch.id}/ai-analysis`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sampleSize: 10 })
  });

  console.log('4. Calling Price Prediction API: GET /api/v1/predictions/price/' + batch.id);
  const predRes = await fetch(`${BASE}/api/v1/predictions/price/${batch.id}`, { headers });
  const pred = await safeJson(predRes);
  console.log('   Status:', predRes.status);
  console.log('   Prediction Response:', JSON.stringify(pred, null, 2));
}

test().catch(console.error);
