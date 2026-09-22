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

  const loginData = await safeJson(res);
  console.log('Login response:', res.status, loginData);
  if (res.status === 401 || res.status === 404 || !loginData.accessToken) {
    const uniqueMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const regRes = await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, mobileNumber: uniqueMobile, password, role })
    });
    const regData = await safeJson(regRes);
    console.log('Register response:', regRes.status, regData);
    if (regRes.ok) return regData.accessToken;
  }
  return loginData.accessToken || loginData.token;
}

async function test() {
  const token = await login('farmer_chilli@agrigrade.ai', 'farmer123', 'Chilli Farmer', 'FARMER');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. Get Green Chilli crop & varieties
  const crops = await fetch(`${BASE}/api/v1/crops`).then(r => r.json());
  const chilli = crops.find(c => c.code === 'CHILLI');
  console.log('Green Chilli crop found:', chilli);

  const chilliVars = await fetch(`${BASE}/api/v1/crops/${chilli.id}/varieties`).then(r => r.json());
  console.log(`Chilli varieties (${chilliVars.length}):`, chilliVars.map(v => v.name));

  const pusaJwala = chilliVars.find(v => v.name === 'Pusa Jwala') || chilliVars[0];

  // 2. Create Batch with Chilli and its default storage condition
  const batchRes = await fetch(`${BASE}/api/v1/batches`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cropId: chilli.id,
      varietyId: pusaJwala.id,
      harvestDate: '2026-08-10',
      quantity: 500,
      quantityUnit: 'KG',
      district: 'Coimbatore',
      state: 'TN',
      storageCondition: chilli.defaultStorageCondition
    })
  });
  console.log('Batch creation status:', batchRes.status);
  const batch = await safeJson(batchRes);
  console.log('Created batch:', batch);

  // 3. Test admin update of crop storage condition
  const updateRes = await fetch(`${BASE}/api/v1/crops/${chilli.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'Green Chilli',
      defaultStorageCondition: 'Cool storage (8-10°C)',
      baseShelfLifeDays: 12
    })
  });
  console.log('Admin crop update status:', updateRes.status);
  const updatedCrop = await safeJson(updateRes);
  console.log('Updated crop:', updatedCrop);
}

test().catch(console.error);
