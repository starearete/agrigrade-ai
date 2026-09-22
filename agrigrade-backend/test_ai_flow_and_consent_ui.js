const BASE = 'http://localhost:8085';

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

async function login(emailOrMobile, password, fullName, role) {
  let res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrMobile, password })
  });

  if (res.status === 401 || res.status === 404) {
    const uniqueMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const regRes = await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullName,
        email: emailOrMobile.includes('@') ? emailOrMobile : `${emailOrMobile}@agrigrade.ai`,
        mobileNumber: uniqueMobile,
        password: password,
        role: role
      })
    });
    const regData = await safeJson(regRes);
    if (regRes.ok) return regData.accessToken || regData.token;
  }

  const data = await safeJson(res);
  if (!res.ok) throw new Error(`Login failed for ${emailOrMobile}: ${JSON.stringify(data)}`);
  return data.accessToken || data.token;
}

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

async function runTests() {
  console.log('===========================================================');
  console.log(' AGRICRADE AI — AI ANALYSIS & LISTING CONSENT FLOW SUITE');
  console.log('===========================================================\n');

  const farmerToken = await login('farmer_flow@agrigrade.ai', 'farmer123', 'Flow Farmer', 'FARMER');
  const buyerToken = await login('buyer_flow@agrigrade.ai', 'buyer123', 'Flow Buyer', 'BUYER');

  const farmerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${farmerToken}`
  };

  const buyerHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${buyerToken}`
  };

  // Test Case A: Newly created batch
  console.log('Test Case A: Newly Created Batch (0 photos)');
  const batchRes = await fetch(`${BASE}/api/v1/batches`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      cropId: 4, // Onion
      varietyId: 538, // Big Onion / Bellary
      harvestDate: '2026-08-10',
      quantity: 900,
      quantityUnit: 'KG',
      district: 'Dindigul',
      state: 'Tamil Nadu',
      storageCondition: 'Dry, well-ventilated storage'
    })
  });
  const batchA = await safeJson(batchRes);
  assert(batchRes.status === 201, `Batch A created with HTTP 201 (id: ${batchA.id})`);
  assert(batchA.status === 'HARVESTED', `Initial batch status is HARVESTED (Received: ${batchA.status})`);
  assert(batchA.certificateNumber === null, `Certificate is absent before inspection`);
  assert(batchA.qualityScore === null, `Quality score is absent before inspection`);

  // Test Case I: Directly requesting AI Analysis endpoint before analysis
  console.log('\nTest Case I: Direct GET on /ai-analysis before inspection is run');
  const getAiBefore = await fetch(`${BASE}/api/v1/batches/${batchA.id}/ai-analysis`, {
    headers: farmerHeaders
  });
  assert(getAiBefore.status === 404, `GET /batches/${batchA.id}/ai-analysis returns HTTP 404 before inspection (Received: ${getAiBefore.status})`);

  // Test Case B: Run AI Analysis on batch without images
  console.log('\nTest Case B: Attempt AI Analysis with 0 Photos');
  const noImgRes = await fetch(`${BASE}/api/v1/batches/${batchA.id}/ai-analysis`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({ sampleSize: 10 })
  });
  const noImgData = await safeJson(noImgRes);
  assert(noImgRes.status === 400, `Rejected with HTTP 400 (Received: ${noImgRes.status})`);
  assert(noImgData.code === 'NO_PRODUCT_IMAGES', `Error code matches NO_PRODUCT_IMAGES (Received: ${noImgData.code})`);

  // Upload Evidence Image for Batch A
  console.log('\nUploading Product Photo for Batch A...');
  const formData = new FormData();
  const dummyFile = new Blob(['sample-onion-photo-bytes'], { type: 'image/jpeg' });
  formData.append('file', dummyFile, 'onion_sample.jpg');
  formData.append('mediaType', 'PHOTO');

  const uploadRes = await fetch(`${BASE}/api/v1/batches/${batchA.id}/images`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${farmerToken}` },
    body: formData
  });
  assert(uploadRes.status === 201, `Photo uploaded successfully to batch (Received: ${uploadRes.status})`);

  // Test Case C: Crop Mismatch Simulation
  console.log('\nTest Case C: AI Inspection with simulateCropMismatch: true');
  const mismatchRes = await fetch(`${BASE}/api/v1/batches/${batchA.id}/ai-analysis`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({ simulateCropMismatch: true })
  });
  const mismatchData = await safeJson(mismatchRes);
  assert(mismatchRes.status === 400, `Rejected with HTTP 400 (Received: ${mismatchRes.status})`);
  assert(mismatchData.code === 'CROP_MISMATCH', `Error code matches CROP_MISMATCH (Received: ${mismatchData.code})`);

  // Test Case D: Low Confidence Simulation
  console.log('\nTest Case D: AI Inspection with simulateLowConfidence: true');
  const lowConfRes = await fetch(`${BASE}/api/v1/batches/${batchA.id}/ai-analysis`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({ simulateLowConfidence: true })
  });
  const lowConfData = await safeJson(lowConfRes);
  assert(lowConfRes.status === 400, `Rejected with HTTP 400 (Received: ${lowConfRes.status})`);
  assert(lowConfData.code === 'LOW_CONFIDENCE', `Error code matches LOW_CONFIDENCE (Received: ${lowConfData.code})`);

  // Test Case E: Successful Production AI Inspection
  console.log('\nTest Case E: Successful AI Analysis Execution');
  const successRes = await fetch(`${BASE}/api/v1/batches/${batchA.id}/ai-analysis`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({ sampleSize: 10 })
  });
  const successData = await safeJson(successRes);
  assert(successRes.status === 200, `AI Analysis completed with HTTP 200 (Received: ${successRes.status})`);
  assert(successData.aiAnalysis.status === 'COMPLETED', `aiAnalysis.status is COMPLETED (Received: ${successData.aiAnalysis.status})`);
  assert(successData.certificate.status === 'ISSUED', `certificate.status is ISSUED (Received: ${successData.certificate.status})`);
  assert(successData.certificate.certificateNumber.startsWith('AGRI-CERT-'), `Certificate Number generated: ${successData.certificate.certificateNumber}`);
  assert(successData.aiAnalysis.qualityScore === 95.0, `Quality score is 95.0% (Received: ${successData.aiAnalysis.qualityScore})`);

  // Check Batch Status updated to AI_GRADED (Not auto-listed)
  const batchAfterAi = await fetch(`${BASE}/api/v1/batches/${batchA.id}`, { headers: farmerHeaders }).then(r => r.json());
  assert(batchAfterAi.status === 'AI_GRADED', `Batch status is AI_GRADED (Received: ${batchAfterAi.status})`);
  assert(batchAfterAi.certificateNumber === successData.certificate.certificateNumber, `Batch certificate persisted in DB`);

  // Test Case H: Refresh / Direct GET on AI Analysis Page restores authoritative result
  console.log('\nTest Case H: GET /batches/{id}/ai-analysis Restores Authoritative Result on Refresh');
  const getAiAfter = await fetch(`${BASE}/api/v1/batches/${batchA.id}/ai-analysis`, { headers: farmerHeaders });
  const restoredAi = await safeJson(getAiAfter);
  assert(getAiAfter.status === 200, `GET /ai-analysis returns HTTP 200`);
  assert(restoredAi.certificate.certificateNumber === successData.certificate.certificateNumber, `Restored certificate matches MySQL record`);

  // Test Case F: Farmer chooses "Not Now"
  console.log('\nTest Case F: Farmer Action "Not Now" (Keeps batch in farmer records unlisted)');
  const batchStillGraded = await fetch(`${BASE}/api/v1/batches/${batchA.id}`, { headers: farmerHeaders }).then(r => r.json());
  assert(batchStillGraded.status === 'AI_GRADED', `Batch remains AI_GRADED in farm records without auto-listing`);

  // Buyer Marketplace Check: Unlisted batch must NOT be visible to buyers
  const marketplaceBefore = await fetch(`${BASE}/api/v1/marketplace/listings`, { headers: buyerHeaders }).then(r => r.json());
  const foundBefore = marketplaceBefore.find(l => l.batchId === batchA.id);
  assert(foundBefore === undefined, `Unlisted batch is NOT visible to buyers in marketplace`);

  // Test Case G: Explicit Listing Creation
  console.log('\nTest Case G: Farmer Clicks [ List Batch ] -> Backend Listing Creation');
  const listRes = await fetch(`${BASE}/api/v1/batches/${batchA.id}/listing`, {
    method: 'POST',
    headers: farmerHeaders,
    body: JSON.stringify({
      askingPricePerUnit: 28.5,
      minimumOrderQuantity: 100
    })
  });
  const listingData = await safeJson(listRes);
  assert(listRes.status === 200 || listRes.status === 201, `Listing created with HTTP 200/201 (id: ${listingData.id})`);
  assert(listingData.status === 'ACTIVE', `Listing status is ACTIVE (Received: ${listingData.status})`);

  // Check batch status updated to ACTIVE_LISTING (LISTED)
  const batchAfterListing = await fetch(`${BASE}/api/v1/batches/${batchA.id}`, { headers: farmerHeaders }).then(r => r.json());
  assert(batchAfterListing.status === 'ACTIVE_LISTING' || batchAfterListing.status === 'LISTED', `Batch status is ACTIVE_LISTING (Received: ${batchAfterListing.status})`);

  // Test Case J: Buyer Marketplace Visibility
  console.log('\nTest Case J: Buyer Marketplace Visibility & Isolation');
  const marketplaceAfter = await fetch(`${BASE}/api/v1/marketplace/listings`, { headers: buyerHeaders }).then(r => r.json());
  const foundAfter = marketplaceAfter.find(l => l.batchId === batchA.id);
  assert(foundAfter !== undefined, `Listing #${listingData.id} is now visible to buyers on Marketplace`);
  assert(foundAfter.certificateNumber === successData.certificate.certificateNumber, `Buyer sees verified AI certificate number: ${foundAfter.certificateNumber}`);
  assert(foundAfter.assignedGrade === 'GRADE_A_PREMIUM', `Buyer sees assigned grade: ${foundAfter.assignedGrade}`);

  console.log('\n===========================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
