const BASE_URL = 'http://localhost:8085';

async function safeJson(res) {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    if (!res.ok) {
      console.error(`HTTP ${res.status} error response:`, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    throw new Error(`HTTP ${res.status} non-JSON response body: "${text.substring(0, 500)}"`);
  }
}

async function login(emailOrMobile, password, fullName, role) {
  let res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrMobile, password })
  });

  if (res.status === 401 || res.status === 404) {
    const uniqueMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullName,
        email: emailOrMobile.includes('@') ? emailOrMobile : `${emailOrMobile}@agrigrade.ai`,
        mobileNumber: uniqueMobile,
        password: password,
        role: role,
        businessName: role === 'BUYER' ? `${fullName} Enterprise` : undefined
      })
    });
    const regData = await safeJson(regRes);
    const token = regData.token || regData.accessToken;
    if (regRes.ok) {
      return {
        token,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
    }
  }

  const data = await safeJson(res);
  if (!res.ok) throw new Error(`Login failed for ${emailOrMobile}: ${JSON.stringify(data)}`);
  const token = data.token || data.accessToken;
  return {
    token,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
}

async function runTests() {
  console.log('===========================================================');
  console.log(' AGRICRADE AI — BUYER TRADE & DATA ISOLATION TEST SUITE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Create Buyer A, Buyer B, and Farmer
    console.log('1. Registering & Authenticating Users...');
    const ts = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const farmer = await login(`farmer_clean_${ts}@agrigrade.ai`, 'password123', 'Ramasamy Farmer', 'FARMER');
    const buyerA = await login(`buyerA_clean_${ts}@agrigrade.ai`, 'password123', 'Selvam Buyer A', 'BUYER');
    const buyerB = await login(`buyerB_clean_${ts}@agrigrade.ai`, 'password123', 'Kavitha Buyer B', 'BUYER');
    console.log(`   Farmer created & authenticated (Token length: ${farmer.token ? farmer.token.length : 0})`);

    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: farmer.headers });
    const meData = await safeJson(meRes);
    console.log('   Farmer /api/v1/auth/me status:', meRes.status, JSON.stringify(meData));

    console.log(`   Buyer A created & authenticated`);
    console.log(`   Buyer B created & authenticated\n`);

    // 2. Farmer Creates Harvest Batch & Lists Crop on Marketplace
    console.log('2. Farmer Creating Batch & Listing Crop...');
    const createBatchRes = await fetch(`${BASE_URL}/api/v1/batches`, {
      method: 'POST',
      headers: farmer.headers,
      body: JSON.stringify({
        cropId: 3, // Tomato
        varietyId: 24, // CO-3
        harvestDate: new Date().toISOString().split('T')[0],
        quantity: 1000,
        quantityUnit: 'KG',
        district: 'Dindigul',
        state: 'Tamil Nadu'
      })
    });
    const batchData = await safeJson(createBatchRes);
    assert(createBatchRes.ok, `Farmer created harvest batch #${batchData.id}`);

    // Upload photo required for AI listing
    const formData = new FormData();
    const fakeImageBuffer = Buffer.from('AGRICRADE-TOMATO-IMAGE-BINARY-DATA-BYTES-98765');
    const blob = new Blob([fakeImageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'tomato-harvest-evidence.jpg');
    formData.append('mediaType', 'PHOTO');

    await fetch(`${BASE_URL}/api/v1/batches/${batchData.id}/images`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${farmer.token}` },
      body: formData
    });

    // Run AI analysis
    await fetch(`${BASE_URL}/api/v1/batches/${batchData.id}/ai-analysis`, {
      method: 'POST',
      headers: farmer.headers,
      body: JSON.stringify({})
    });

    const createListingRes = await fetch(`${BASE_URL}/api/v1/batches/${batchData.id}/listing`, {
      method: 'POST',
      headers: farmer.headers,
      body: JSON.stringify({
        askingPricePerUnit: 25.00,
        minimumOrderQuantity: 100
      })
    });
    const listingData = await safeJson(createListingRes);
    assert(createListingRes.ok, `Farmer created marketplace listing #${listingData.id} for batch #${batchData.id}\n`);

    // 3. Buyer A Submits Purchase Request on Marketplace Listing
    console.log('3. Buyer A Submitting Purchase Request...');
    const submitReqRes = await fetch(`${BASE_URL}/api/v1/purchase-requests`, {
      method: 'POST',
      headers: buyerA.headers,
      body: JSON.stringify({
        listingId: listingData.id,
        offeredPricePerUnit: 24.00,
        requestedQuantity: 500,
        deliveryPreference: 'BUYER_DELIVERY_NEEDED',
        message: 'Looking for 500 KG tomato load for immediate pickup.'
      })
    });
    const reqData = await safeJson(submitReqRes);
    assert(submitReqRes.status === 201, `Buyer A submitted purchase request #${reqData.id}`);
    assert(reqData.status === 'PENDING', 'Purchase request status is PENDING');
    assert(reqData.offeredPricePerUnit === 24.00, 'Offered price per unit is 24.00');
    assert(reqData.requestedQuantity === 500, 'Requested quantity is 500 KG\n');

    // 4. Verification: Buyer A Sees Pending Request in /buyer/purchase-requests
    console.log('4. Verifying Buyer A Purchase Requests View...');
    const buyerAReqsRes = await fetch(`${BASE_URL}/api/v1/buyer/purchase-requests`, {
      headers: buyerA.headers
    });
    const buyerAReqs = await safeJson(buyerAReqsRes);
    assert(buyerAReqsRes.ok, 'GET /api/v1/buyer/purchase-requests returned 200 OK');
    assert(buyerAReqs.length === 1, 'Buyer A sees exactly 1 purchase request');
    assert(buyerAReqs[0].id === reqData.id, `Request ID matches #${reqData.id}`);
    assert(buyerAReqs[0].status === 'PENDING', 'Request status is PENDING\n');

    // 5. Verification: Buyer B Cannot See Buyer A's Purchase Request
    console.log('5. Verifying Buyer B Data Isolation (Purchase Requests)...');
    const buyerBReqsRes = await fetch(`${BASE_URL}/api/v1/buyer/purchase-requests`, {
      headers: buyerB.headers
    });
    const buyerBReqs = await safeJson(buyerBReqsRes);
    assert(buyerBReqsRes.ok, 'GET /api/v1/buyer/purchase-requests for Buyer B returned 200 OK');
    assert(buyerBReqs.length === 0, 'Buyer B sees ZERO requests (Buyer A data isolated)');
    console.log('');

    // 6. Farmer Views Incoming Purchase Request
    console.log('6. Farmer Reviewing Incoming Requests...');
    const farmerReqsRes = await fetch(`${BASE_URL}/api/v1/farmer/purchase-requests`, {
      headers: farmer.headers
    });
    const farmerReqs = await safeJson(farmerReqsRes);
    assert(farmerReqsRes.ok, 'GET /api/v1/farmer/purchase-requests returned 200 OK');
    assert(farmerReqs.some(r => r.id === reqData.id), `Farmer sees incoming purchase request #${reqData.id}\n`);

    // 7. Farmer Accepts Buyer A's Purchase Request
    console.log('7. Farmer Accepting Buyer A Purchase Request...');
    const acceptRes = await fetch(`${BASE_URL}/api/v1/farmer/purchase-requests/${reqData.id}/accept`, {
      method: 'POST',
      headers: farmer.headers
    });
    const acceptedData = await safeJson(acceptRes);
    assert(acceptRes.ok, `Farmer accepted purchase request #${reqData.id}`);
    assert(acceptedData.status === 'ACCEPTED', 'Request status updated to ACCEPTED\n');

    // 8. Verification: Buyer A Sees Accepted Request in /buyer/purchase-requests
    console.log('8. Verifying Buyer A Updated Purchase Requests View...');
    const buyerAReqsUpdatedRes = await fetch(`${BASE_URL}/api/v1/buyer/purchase-requests`, {
      headers: buyerA.headers
    });
    const buyerAReqsUpdated = await safeJson(buyerAReqsUpdatedRes);
    assert(buyerAReqsUpdated.length === 1, 'Buyer A has 1 request');
    assert(buyerAReqsUpdated[0].status === 'ACCEPTED', 'Request status displays as ACCEPTED (not empty state)\n');

    // 9. Verification: Buyer A Sees Generated Trade Order in /buyer/orders
    console.log('9. Verifying Buyer A Generated Procurement / Trade Order...');
    const buyerAOrdersRes = await fetch(`${BASE_URL}/api/v1/buyer/orders`, {
      headers: buyerA.headers
    });
    const buyerAOrders = await safeJson(buyerAOrdersRes);
    assert(buyerAOrdersRes.ok, 'GET /api/v1/buyer/orders returned 200 OK');
    assert(buyerAOrders.length === 1, 'Buyer A sees 1 active trade order');
    assert(buyerAOrders[0].listingId === listingData.id, `Order associated with listing #${listingData.id}`);
    assert(buyerAOrders[0].agreedPricePerUnit === 24.00, 'Agreed price per unit is 24.00');
    assert(buyerAOrders[0].quantity === 500, 'Quantity is 500 KG');
    assert(buyerAOrders[0].totalAmount === 12000.00, 'Total contract amount is 12,000.00');
    assert(buyerAOrders[0].status === 'AGREED', 'Trade order status is AGREED\n');

    // 10. Verification: Buyer B Cannot See Buyer A's Trade Order
    console.log('10. Verifying Buyer B Data Isolation (Trade Orders)...');
    const buyerBOrdersRes = await fetch(`${BASE_URL}/api/v1/buyer/orders`, {
      headers: buyerB.headers
    });
    const buyerBOrders = await safeJson(buyerBOrdersRes);
    assert(buyerBOrdersRes.ok, 'GET /api/v1/buyer/orders for Buyer B returned 200 OK');
    assert(buyerBOrders.length === 0, 'Buyer B sees ZERO trade orders (Buyer A order isolated)\n');

    // 11. Verification: Role Access Control (Farmer Accessing Buyer Endpoint Returns 403 Forbidden)
    console.log('11. Verifying Security & Role Access Control (403 Forbidden)...');
    const farmerAccessRes = await fetch(`${BASE_URL}/api/v1/buyer/orders`, {
      headers: farmer.headers
    });
    assert(farmerAccessRes.status === 403, 'Farmer accessing /buyer/orders returned 403 Forbidden');

    const farmerReqAccessRes = await fetch(`${BASE_URL}/api/v1/buyer/purchase-requests`, {
      headers: farmer.headers
    });
    assert(farmerReqAccessRes.status === 403, 'Farmer accessing /buyer/purchase-requests returned 403 Forbidden');

    const unauthRes = await fetch(`${BASE_URL}/api/v1/buyer/orders`);
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Unauthenticated request returned 401/403 (Actual API error state)\n');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('===========================================================');
  console.log(` TOTAL TESTS EVALUATED | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
