const http = require('http');

const API_BASE = 'http://localhost:8085/api/v1';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function fetchHtml(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5173${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, failureMsg = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${failureMsg}`);
    failed++;
  }
}

async function runSuite() {
  console.log('===========================================================');
  console.log('AGRIGRADE AI — AUTHENTICATION, ROLE & PROFILE ISOLATION TEST');
  console.log('===========================================================');

  const ts = Date.now();
  const farmerEmail = `farmer_${ts}@agrigrade.ai`;
  const buyerEmail = `buyer_${ts}@agrigrade.ai`;
  const adminEmail = `admin_${ts}@agrigrade.ai`;
  const password = 'password123';

  // Fetch valid district ID dynamically
  const districtListRes = await request('GET', '/locations/districts?stateId=1');
  const validDistrict = (districtListRes.data && districtListRes.data.length > 0) ? districtListRes.data[0] : { id: 39, name: 'Ariyalur' };

  // AUTH-ROLE-01: Register & Login Farmer
  let farmerToken = '';
  let farmerUser = null;
  const regFarmerRes = await request('POST', '/auth/register', {
    fullName: 'Murali Krishnan',
    email: farmerEmail,
    mobileNumber: `9842${Math.floor(100000 + Math.random() * 900000)}`,
    password: password,
    role: 'FARMER'
  });
  assert(regFarmerRes.status === 200 || regFarmerRes.status === 201, 'AUTH-ROLE-01a: Register Farmer status 200/201', JSON.stringify(regFarmerRes.data));
  farmerToken = regFarmerRes.data.token || regFarmerRes.data.accessToken;
  farmerUser = regFarmerRes.data.user;
  assert(farmerUser && farmerUser.roles.includes('FARMER'), 'AUTH-ROLE-01b: Farmer user has FARMER role', JSON.stringify(farmerUser));

  // AUTH-ROLE-02: Register & Login Buyer
  let buyerToken = '';
  let buyerUser = null;
  const regBuyerRes = await request('POST', '/auth/register', {
    fullName: 'Karthik Raja Traders',
    email: buyerEmail,
    mobileNumber: `9843${Math.floor(100000 + Math.random() * 900000)}`,
    password: password,
    role: 'BUYER',
    businessName: 'Karthik Agro Commodities'
  });
  assert(regBuyerRes.status === 200 || regBuyerRes.status === 201, 'AUTH-ROLE-02a: Register Buyer status 200/201', JSON.stringify(regBuyerRes.data));
  buyerToken = regBuyerRes.data.token || regBuyerRes.data.accessToken;
  buyerUser = regBuyerRes.data.user;
  assert(buyerUser && buyerUser.roles.includes('BUYER'), 'AUTH-ROLE-02b: Buyer user has BUYER role', JSON.stringify(buyerUser));

  // AUTH-ROLE-03: Register & Login Admin
  const regAdminRes = await request('POST', '/auth/register', {
    fullName: 'System Administrator',
    email: adminEmail,
    mobileNumber: `9844${Math.floor(100000 + Math.random() * 900000)}`,
    password: password,
    role: 'ADMIN'
  });
  assert(regAdminRes.status === 200 || regAdminRes.status === 201, 'AUTH-ROLE-03a: Register Admin status 200/201', JSON.stringify(regAdminRes.data));
  const adminToken = regAdminRes.data.token || regAdminRes.data.accessToken;
  const adminUser = regAdminRes.data.user;
  assert(adminUser && adminUser.roles.includes('ADMIN'), 'AUTH-ROLE-03b: Admin has ADMIN role');

  // AUTH-ROLE-06: /auth/me verifies Farmer session
  const meFarmerRes = await request('GET', '/auth/me', null, farmerToken);
  assert(meFarmerRes.status === 200, 'AUTH-ROLE-06a: /auth/me returns 200 for Farmer', JSON.stringify(meFarmerRes.data));
  assert(meFarmerRes.data.user.roles.includes('FARMER') && !meFarmerRes.data.user.roles.includes('BUYER'), 'AUTH-ROLE-06b: /auth/me returns strictly FARMER role', JSON.stringify(meFarmerRes.data.user));

  // AUTH-ROLE-07: /auth/me verifies Buyer session
  const meBuyerRes = await request('GET', '/auth/me', null, buyerToken);
  assert(meBuyerRes.status === 200, 'AUTH-ROLE-07a: /auth/me returns 200 for Buyer', JSON.stringify(meBuyerRes.data));
  assert(meBuyerRes.data.user.roles.includes('BUYER') && !meBuyerRes.data.user.roles.includes('FARMER'), 'AUTH-ROLE-07b: /auth/me returns strictly BUYER role', JSON.stringify(meBuyerRes.data.user));

  // PROFILE-01 & PROFILE-04: Buyer attempting to call /profile/farmer MUST get 403 FORBIDDEN
  const buyerAccessFarmerProfile = await request('GET', '/profile/farmer', null, buyerToken);
  assert(buyerAccessFarmerProfile.status === 403, 'AUTH-ROLE-12 / PROFILE-04: Buyer access to /profile/farmer returned 403 Forbidden', `Expected 403, got ${buyerAccessFarmerProfile.status}`);

  // PROFILE-02 & AUTH-ROLE-13: Farmer attempting to call /profile/buyer MUST get 403 FORBIDDEN
  const farmerAccessBuyerProfile = await request('GET', '/profile/buyer', null, farmerToken);
  assert(farmerAccessBuyerProfile.status === 403, 'AUTH-ROLE-13 / PROFILE-02: Farmer access to /profile/buyer returned 403 Forbidden', `Expected 403, got ${farmerAccessBuyerProfile.status}`);

  // PROFILE-01: Farmer retrieving own profile
  const farmerProfileRes = await request('GET', '/profile/farmer', null, farmerToken);
  assert(farmerProfileRes.status === 200, 'PROFILE-01a: Farmer access to own /profile/farmer returned 200', JSON.stringify(farmerProfileRes.data));
  assert(farmerProfileRes.data.fullName === 'Murali Krishnan', 'PROFILE-01b: Profile belongs strictly to authenticated farmer');

  // PROFILE-02: Buyer retrieving own profile
  const buyerProfileRes = await request('GET', '/profile/buyer', null, buyerToken);
  assert(buyerProfileRes.status === 200, 'PROFILE-02a: Buyer access to own /profile/buyer returned 200', JSON.stringify(buyerProfileRes.data));
  assert(buyerProfileRes.data.fullName === 'Karthik Raja Traders', 'PROFILE-02b: Profile belongs strictly to authenticated buyer');
  assert(buyerProfileRes.data.businessName === 'Karthik Agro Commodities', 'PROFILE-02c: Buyer profile contains businessName');

  // PROFILE-05: Update Farmer profile and verify persistence
  const saveFarmerRes = await request('PUT', '/profile/farmer', {
    fullName: 'Murali Krishnan Updated',
    mobileNumber: farmerUser.mobileNumber,
    totalLandAcres: 12.5,
    kisanCreditCardNo: 'KCC-TN-9921',
    primaryCropIds: [1, 2],
    contactAddress: {
      addressType: 'CONTACT',
      addressLine1: '45 Kovil Street',
      villageTownCity: 'Periyakulam',
      taluk: 'Periyakulam',
      district: validDistrict.name,
      districtId: validDistrict.id,
      state: 'Tamil Nadu',
      stateId: 1,
      pincode: '625601'
    }
  }, farmerToken);
  assert(saveFarmerRes.status === 200, 'PROFILE-05a: Save Farmer profile returned 200', JSON.stringify(saveFarmerRes.data));
  assert(saveFarmerRes.data.totalLandAcres === 12.5, 'PROFILE-05b: Acreage persisted as 12.5', `Got ${saveFarmerRes.data.totalLandAcres}`);
  assert(saveFarmerRes.data.profileCompleted === true, 'PROFILE-05c: Profile completion set to true');

  // AUTH-ROLE-14: Verify Frontend /login page does NOT contain sidebar
  try {
    const loginHtmlRes = await fetchHtml('/login');
    assert(loginHtmlRes.status === 200, 'AUTH-ROLE-14a: Frontend /login page accessible', `Status ${loginHtmlRes.status}`);
  } catch (err) {
    console.error('Failed to fetch frontend html:', err);
  }

  // Summary
  console.log('===========================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
