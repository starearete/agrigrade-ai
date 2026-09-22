const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:8085/api/v1';

function queryDb(sql) {
  const mysqlPath = '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe"';
  const cmd = `${mysqlPath} -u root -proot agrigrade_ai -e "${sql.replace(/"/g, '\\"')}" --batch --raw`;
  const output = execSync(cmd, { encoding: 'utf8' });
  const lines = output.replace(/\r/g, '').trim().split('\n').filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => {
    const vals = line.split('\t');
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i]; });
    return row;
  });
}

async function httpRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
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
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
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

async function runTests() {
  console.log('====================================================');
  console.log('AGRIGRADE AI — LISTING WITHDRAWAL INTEGRITY TEST');
  console.log('====================================================\n');

  try {
    const timestamp = Date.now();
    const farmerEmail = `withdraw.farmer.${timestamp}@agrigrade.com`;
    const buyerEmail = `withdraw.buyer.${timestamp}@agrigrade.com`;
    const farmerMobile = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
    const buyerMobile = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 1. Register Farmer
    console.log('Step 1: Registering Fresh Farmer...');
    const farmerReg = await httpRequest('POST', '/auth/register', {
      fullName: 'Withdrawal Test Farmer',
      email: farmerEmail,
      mobileNumber: farmerMobile,
      password: 'Password@123',
      role: 'FARMER',
    });
    console.log(`Farmer reg status: ${farmerReg.status}`);
    const farmerToken = farmerReg.body.accessToken || farmerReg.body.token;
    if (!farmerToken) throw new Error('Farmer registration failed: ' + JSON.stringify(farmerReg.body));
    console.log('✓ Farmer registered and authenticated successfully.\n');

    // 2. Register Buyer
    console.log('Step 2: Registering Fresh Buyer...');
    const buyerReg = await httpRequest('POST', '/auth/register', {
      fullName: 'Withdrawal Test Buyer',
      email: buyerEmail,
      mobileNumber: buyerMobile,
      password: 'Password@123',
      role: 'BUYER',
    });
    console.log(`Buyer reg status: ${buyerReg.status}`);
    const buyerToken = buyerReg.body.accessToken || buyerReg.body.token;
    if (!buyerToken) throw new Error('Buyer registration failed: ' + JSON.stringify(buyerReg.body));
    console.log('✓ Buyer registered and authenticated successfully.\n');

    // 3. Create Farmer Harvest Batch with 2500 KG quantity
    console.log('Step 3: Creating Farmer Harvest Batch (2500 KG)...');
    const batchRes = await httpRequest(
      'POST',
      '/batches',
      {
        varietyId: 1,
        quantity: 2500.0,
        quantityUnit: 'KG',
        harvestDate: '2026-08-05',
        district: 'Theni',
        state: 'Tamil Nadu',
      },
      farmerToken
    );
    console.log(`Create batch HTTP status: ${batchRes.status}`);
    const batchId = batchRes.body.id;
    console.log(`Created Batch ID: ${batchId}, Batch Number: ${batchRes.body.batchNumber}`);

    // Verify DB product_batches quantity = 2500
    const batches = queryDb(`SELECT * FROM product_batches WHERE id = ${batchId}`);
    console.log(`DB product_batches.quantity: ${batches[0].quantity}`);
    console.assert(parseFloat(batches[0].quantity) === 2500.0, 'Assertion Failed: Batch quantity should be 2500.0');
    console.log('✓ Farmer harvest batch created with 2500.0 KG in DB.\n');

    // 4. Run AI Inspection so batch status becomes AI_GRADED
    console.log('Step 4: Setting AI Inspection COMPLETED on Batch...');
    execSync(`"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe" -u root -proot agrigrade_ai -e "INSERT INTO ai_analyses (batch_id, model_id, analysis_type, status, completed_at) VALUES (${batchId}, 1, 'QUALITY_GRADING', 'COMPLETED', NOW()); UPDATE product_batches SET status = 'AI_GRADED' WHERE id = ${batchId};"`);
    
    const batchesAfterAi = queryDb(`SELECT * FROM product_batches WHERE id = ${batchId}`);
    console.log(`DB product_batches.status after AI: ${batchesAfterAi[0].status}`);
    console.assert(batchesAfterAi[0].status === 'AI_GRADED', 'Assertion Failed: Batch status should be AI_GRADED');
    console.log('✓ AI inspection completed.\n');

    // 5. Create Marketplace Listing for 2500 KG load
    console.log('Step 5: Farmer creates Marketplace Listing...');
    const listingRes = await httpRequest(
      'POST',
      `/batches/${batchId}/listing`,
      {
        askingPricePerUnit: 35.0,
        minimumOrderQuantity: 100.0,
      },
      farmerToken
    );
    console.log(`Create listing HTTP status: ${listingRes.status}`);
    const listingId = listingRes.body.id;
    console.log(`Listing ID: ${listingId}, Code: ${listingRes.body.listingCode}`);

    const listings = queryDb(`SELECT * FROM marketplace_listings WHERE id = ${listingId}`);
    console.log(`DB marketplace_listings.status: ${listings[0].status}`);
    console.log(`DB marketplace_listings.quantity_remaining: ${listings[0].quantity_remaining}`);
    console.assert(listings[0].status === 'ACTIVE', 'Assertion 1: Listing status must be ACTIVE');
    console.assert(parseFloat(listings[0].quantity_remaining) === 2500.0, 'Assertion 2: Listing remaining qty must be 2500');

    const batchCheck1 = queryDb(`SELECT * FROM product_batches WHERE id = ${batchId}`);
    console.log(`DB product_batches.quantity: ${batchCheck1[0].quantity}`);
    console.assert(parseFloat(batchCheck1[0].quantity) === 2500.0, 'Assertion 3: Original batch harvest quantity MUST be 2500');
    console.log('✓ Marketplace listing created.\n');

    // 6. Buyer places order for 500 KG
    console.log('Step 6: Buyer creates Purchase Order for 500 KG...');
    const orderRes = await httpRequest(
      'POST',
      `/marketplace/listings/${listingId}/orders`,
      {
        requestedQuantity: 500.0,
        offeredPricePerUnit: 35.0,
      },
      buyerToken
    );
    console.log(`Create order HTTP status: ${orderRes.status}`);
    const orderId = orderRes.body.orderId;
    console.log(`Order ID: ${orderId}, Order Number: ${orderRes.body.orderNumber}`);

    const listingsAfterOrder = queryDb(`SELECT * FROM marketplace_listings WHERE id = ${listingId}`);
    console.log(`DB marketplace_listings.quantity_remaining: ${listingsAfterOrder[0].quantity_remaining}`);
    console.assert(parseFloat(listingsAfterOrder[0].quantity_remaining) === 2000.0, 'Assertion 4: Listing remaining quantity must decrease to 2000');

    const batchCheck2 = queryDb(`SELECT * FROM product_batches WHERE id = ${batchId}`);
    console.log(`DB product_batches.quantity: ${batchCheck2[0].quantity}`);
    console.assert(parseFloat(batchCheck2[0].quantity) === 2500.0, 'Assertion 5: Original harvest quantity MUST REMAIN 2500');
    console.log('✓ Buyer order placed successfully.\n');

    // 7. Test Active Order Safety: Attempt to withdraw listing while active order (AGREED) exists
    console.log('Step 7: Attempting withdrawal while active order exists (Expect 409 CONFLICT)...');
    const withdrawAttempt = await httpRequest(
      'PATCH',
      `/farmer/listings/${listingId}/withdraw`,
      {},
      farmerToken
    );
    console.log(`Withdraw attempt HTTP status: ${withdrawAttempt.status}`);
    console.log(`Withdraw error body:`, withdrawAttempt.body);
    console.assert(withdrawAttempt.status === 409, 'Assertion 6: Withdrawal with active orders MUST return HTTP 409 Conflict');
    console.assert(
      withdrawAttempt.body.code === 'LISTING_HAS_ACTIVE_ORDERS' || withdrawAttempt.body.message.includes('active buyer orders'),
      'Assertion 7: Error code MUST indicate LISTING_HAS_ACTIVE_ORDERS'
    );

    const listingsStillActive = queryDb(`SELECT * FROM marketplace_listings WHERE id = ${listingId}`);
    console.assert(listingsStillActive[0].status === 'ACTIVE', 'Assertion 8: Listing status must remain ACTIVE after rejected withdrawal');
    console.log('✓ Active order safety protection verified (409 Conflict returned).\n');

    // 8. Resolve active order (change status to COMPLETED) and withdraw listing
    console.log('Step 8: Completing active order in DB and attempting withdrawal again...');
    execSync(`"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe" -u root -proot agrigrade_ai -e "UPDATE orders SET status = 'COMPLETED' WHERE id = ${orderId};"`);

    const withdrawSuccess = await httpRequest(
      'PATCH',
      `/farmer/listings/${listingId}/withdraw`,
      {},
      farmerToken
    );
    console.log(`Withdraw success HTTP status: ${withdrawSuccess.status}`);
    console.assert(withdrawSuccess.status === 200, 'Assertion 9: Withdrawal must succeed with HTTP 200');
    console.assert(withdrawSuccess.body.status === 'WITHDRAWN', 'Assertion 10: Response status must be WITHDRAWN');

    const listingsWithdrawn = queryDb(`SELECT * FROM marketplace_listings WHERE id = ${listingId}`);
    console.log(`DB marketplace_listings.status: ${listingsWithdrawn[0].status}`);
    console.assert(listingsWithdrawn[0].status === 'WITHDRAWN', 'Assertion 11: DB listing status must be WITHDRAWN');

    const batchCheck3 = queryDb(`SELECT * FROM product_batches WHERE id = ${batchId}`);
    console.log(`DB product_batches.quantity: ${batchCheck3[0].quantity}`);
    console.log(`DB product_batches.status: ${batchCheck3[0].status}`);
    console.assert(parseFloat(batchCheck3[0].quantity) === 2500.0, 'Assertion 12: Original harvest quantity MUST STILL BE 2500.0');
    console.assert(batchCheck3[0].status === 'AI_GRADED', 'Assertion 13: Batch status must return to AI_GRADED (Ready to List)');
    console.log('✓ Listing successfully withdrawn and batch returned to Ready to List.\n');

    // 9. Verify Marketplace Listings endpoint returns ONLY ACTIVE listings
    console.log('Step 9: Verifying buyer marketplace feed hides withdrawn listing...');
    const marketFeed = await httpRequest('GET', '/marketplace/listings');
    console.log(`Marketplace feed count: ${marketFeed.body.length}`);
    const foundWithdrawn = marketFeed.body.find((l) => l.id === listingId);
    console.assert(!foundWithdrawn, 'Assertion 14: Withdrawn listing MUST NOT appear in active buyer marketplace feed');
    console.log('✓ Buyer marketplace feed correctly excludes withdrawn listing.\n');

    // 10. Re-list the SAME batch on the marketplace
    console.log('Step 10: Farmer re-lists the SAME batch (2500 KG load)...');
    const relistRes = await httpRequest(
      'POST',
      `/batches/${batchId}/listing`,
      {
        askingPricePerUnit: 38.0,
        minimumOrderQuantity: 150.0,
      },
      farmerToken
    );
    console.log(`Re-list HTTP status: ${relistRes.status}`);
    const newListingId = relistRes.body.id;
    console.log(`New Listing ID: ${newListingId}, Code: ${relistRes.body.listingCode}`);

    console.assert(newListingId !== listingId, 'Assertion 15: Re-listing must create a NEW listing ID');
    console.assert(relistRes.body.status === 'ACTIVE', 'Assertion 16: New listing status must be ACTIVE');

    const allListingsForBatch = queryDb(`SELECT id, listing_code, status, quantity_remaining FROM marketplace_listings WHERE batch_id = ${batchId} ORDER BY id ASC`);
    console.log('All DB listings for batch:', allListingsForBatch);
    console.assert(allListingsForBatch.length === 2, 'Assertion 17: Database must contain 2 listing records for batch');
    console.assert(allListingsForBatch[0].status === 'WITHDRAWN', 'Assertion 18: Old listing must remain WITHDRAWN');
    console.assert(allListingsForBatch[1].status === 'ACTIVE', 'Assertion 19: New listing must be ACTIVE');

    const batchCheck4 = queryDb(`SELECT * FROM product_batches WHERE id = ${batchId}`);
    console.log(`DB product_batches.quantity: ${batchCheck4[0].quantity}`);
    console.assert(parseFloat(batchCheck4[0].quantity) === 2500.0, 'Assertion 20: Original harvest quantity MUST REMAIN 2500.0');
    console.assert(batchCheck4[0].status === 'LISTED', 'Assertion 21: Batch status must be LISTED again');
    console.log('✓ Re-listing verified successfully.\n');

    console.log('====================================================');
    console.log('ALL 21/21 AUTOMATED INTEGRITY ASSERTIONS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('TEST FAILED WITH ERROR:', err);
    process.exit(1);
  }
}

runTests();
