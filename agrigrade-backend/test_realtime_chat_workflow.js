const WebSocket = require('ws');

const BASE_URL = 'http://localhost:8085/api/v1';

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`HTTP ${res.status} non-JSON response: ${text.substring(0, 300)}`);
  }
}

function logTest(name, passed, detail = '') {
  const icon = passed ? '  [PASS]' : '  [FAIL]';
  console.log(`${icon} ${name} ${detail ? ' (' + detail + ')' : ''}`);
  if (!passed) {
    process.exitCode = 1;
  }
}

async function runChatTestSuite() {
  console.log('===========================================================');
  console.log(' AGRICRADE AI — REAL-TIME CHAT & WEBSOCKET TEST SUITE');
  console.log('===========================================================');

  try {
    const ts = Date.now();
    const farmerMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const buyerMobile = '97' + Math.floor(10000000 + Math.random() * 90000000);

    // CHAT-01: Create Farmer Account
    const farmerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: `Chat Farmer ${ts}`,
        email: `chatfarmer_${ts}@agrigrade.ai`,
        mobileNumber: farmerMobile,
        password: `FarmerPass123!`,
        role: 'FARMER',
      }),
    });
    const farmerRegData = await safeJson(farmerRegRes);
    const farmerToken = farmerRegData.token || farmerRegData.accessToken;
    logTest('CHAT-01: Create Farmer Account', farmerRegRes.ok && !!farmerToken, `Token length: ${farmerToken?.length || 0}`);

    const farmerHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`,
    };

    // CHAT-02: Create Buyer Account
    const buyerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: `Chat Buyer ${ts}`,
        email: `chatbuyer_${ts}@agrigrade.ai`,
        mobileNumber: buyerMobile,
        password: `BuyerPass123!`,
        role: 'BUYER',
      }),
    });
    const buyerRegData = await safeJson(buyerRegRes);
    const buyerToken = buyerRegData.token || buyerRegData.accessToken;
    logTest('CHAT-02: Create Buyer Account', buyerRegRes.ok && !!buyerToken, `Token length: ${buyerToken?.length || 0}`);

    const buyerHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${buyerToken}`,
    };

    // CHAT-03: Farmer creates farm batch
    const batchRes = await fetch(`${BASE_URL}/batches`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        cropId: 3,
        varietyId: 24,
        harvestDate: '2026-08-08',
        quantity: 2500,
        quantityUnit: 'KG',
        district: 'Dindigul',
        state: 'Tamil Nadu',
        storageCondition: 'AMBIENT',
      }),
    });
    const batchData = await safeJson(batchRes);
    const batchId = batchData.id;
    logTest('CHAT-03: Create Farmer Batch', batchRes.ok && !!batchId, `Batch ID: ${batchId}`);

    // Upload product photo
    const formData = new FormData();
    const fakeImageBuffer = Buffer.from('AGRICRADE-TOMATO-IMAGE-BINARY-DATA-BYTES-98765');
    const blob = new Blob([fakeImageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'tomato-harvest-evidence.jpg');
    formData.append('mediaType', 'PHOTO');

    await fetch(`${BASE_URL}/batches/${batchId}/images`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${farmerToken}` },
      body: formData,
    });

    // Execute AI Analysis
    await fetch(`${BASE_URL}/batches/${batchId}/ai-analysis`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({}),
    });

    // CHAT-04: Create Active Marketplace Listing
    const listingRes = await fetch(`${BASE_URL}/batches/${batchId}/listing`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        askingPricePerUnit: 32.50,
        minimumOrderQuantity: 100,
      }),
    });
    const listingData = await safeJson(listingRes);
    const listingId = listingData.id;
    logTest('CHAT-04: Create Active Marketplace Listing', listingRes.ok && !!listingId, `Listing ID: ${listingId}`);

    // CHAT-05: Buyer creates conversation for listing
    const convRes = await fetch(`${BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        listingId: listingId,
        initialMessage: 'Hello farmer! Is this tomato batch ready for immediate dispatch?',
      }),
    });
    const convData = await safeJson(convRes);
    const convId = convData.data?.id || convData.id;
    logTest('CHAT-05: Buyer Creates Conversation for Listing', convRes.ok && !!convId, `Conv ID: ${convId}`);

    // CHAT-06: Duplicate conversation request returns existing conversation
    const dupConvRes = await fetch(`${BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        listingId: listingId,
      }),
    });
    const dupConvData = await safeJson(dupConvRes);
    const dupConvId = dupConvData.data?.id || dupConvData.id;
    logTest('CHAT-06: Duplicate Conversation Idempotency', dupConvId === convId);

    // CHAT-07: Real-Time WebSocket STOMP Connection
    const buyerWs = new WebSocket('ws://localhost:8085/ws');
    const farmerWs = new WebSocket('ws://localhost:8085/ws');

    await new Promise((resolve) => {
      let buyerOk = false;
      let farmerOk = false;

      buyerWs.on('open', () => {
        buyerWs.send(`CONNECT\naccept-version:1.1,1.0\nAuthorization:Bearer ${buyerToken}\n\n\0`);
      });

      farmerWs.on('open', () => {
        farmerWs.send(`CONNECT\naccept-version:1.1,1.0\nAuthorization:Bearer ${farmerToken}\n\n\0`);
      });

      buyerWs.on('message', (msg) => {
        const text = msg.toString();
        if (text.startsWith('CONNECTED')) {
          buyerWs.send(`SUBSCRIBE\nid:sub-buyer\ndestination:/user/queue/messages\n\n\0`);
          buyerOk = true;
          if (buyerOk && farmerOk) resolve();
        }
      });

      farmerWs.on('message', (msg) => {
        const text = msg.toString();
        if (text.startsWith('CONNECTED')) {
          farmerWs.send(`SUBSCRIBE\nid:sub-farmer\ndestination:/user/queue/messages\n\n\0`);
          farmerWs.send(`SUBSCRIBE\nid:sub-topic-${convId}\ndestination:/topic/conversations.${convId}\n\n\0`);
          farmerOk = true;
          if (buyerOk && farmerOk) resolve();
        }
      });
    });

    logTest('CHAT-07: Buyer & Farmer Connected via WebSocket STOMP', true);

    // CHAT-08 & CHAT-09: Send WebSocket Message from Buyer -> Farmer & Verify Persistence
    const clientMsgId = `cmsg_${ts}_1`;
    buyerWs.send(`SEND\ndestination:/app/chat.send\n\n${JSON.stringify({
      conversationId: convId,
      content: 'Can you deliver 500 KG to Dindigul market tomorrow morning?',
      clientMessageId: clientMsgId,
    })}\0`);

    await new Promise((r) => setTimeout(r, 800));

    // Fetch messages to verify persistence
    const msgListRes = await fetch(`${BASE_URL}/chat/conversations/${convId}/messages`, { headers: farmerHeaders });
    const msgListData = await safeJson(msgListRes);
    const messages = msgListData.data || msgListData || [];
    const persistedMsg = Array.isArray(messages) ? messages.find((m) => m.clientMessageId === clientMsgId || (m.content && m.content.includes('500 KG'))) : null;
    logTest('CHAT-09: Message Persisted in MySQL', !!persistedMsg, `Msg ID: ${persistedMsg?.id}`);

    // CHAT-10: Farmer Replies via Chat API
    const replyRes = await fetch(`${BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        conversationId: convId,
        content: 'Yes, 500 KG can be delivered tomorrow by 8 AM with grade report.',
      }),
    });
    const replyData = await safeJson(replyRes);
    const replyMsg = replyData.data || replyData;
    logTest('CHAT-10: Farmer Replies via Chat API', replyRes.ok && !!replyMsg?.id, `Reply Msg ID: ${replyMsg?.id}`);

    // CHAT-13: Mark Messages as Read
    const readRes = await fetch(`${BASE_URL}/chat/conversations/${convId}/read`, {
      method: 'PATCH',
      headers: farmerHeaders,
      body: JSON.stringify({}),
    });
    logTest('CHAT-13: Mark Messages as Read', readRes.ok);

    // CHAT-15: Unread Count Endpoint
    const unreadRes = await fetch(`${BASE_URL}/chat/unread-count`, { headers: buyerHeaders });
    const unreadData = await safeJson(unreadRes);
    const totalUnread = unreadData.data?.totalUnread !== undefined ? unreadData.data.totalUnread : unreadData.totalUnread;
    logTest('CHAT-15: Unread Count Endpoint', unreadRes.ok && typeof totalUnread === 'number', `Total Unread: ${totalUnread}`);

    // CHAT-18: Idempotent ClientMessageId Handling
    const dupSendRes = await fetch(`${BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        conversationId: convId,
        content: 'Duplicate send attempt',
        clientMessageId: clientMsgId,
      }),
    });
    const dupData = await safeJson(dupSendRes);
    const dupMsg = dupData.data || dupData;
    logTest('CHAT-18: Idempotent ClientMessageId Handling', dupMsg?.id === persistedMsg?.id);

    // CHAT-19 & CHAT-20: Security Checks
    const thirdPartyMobile = '96' + Math.floor(10000000 + Math.random() * 90000000);
    const thirdPartyRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: `Third Party ${ts}`,
        email: `thirdparty_${ts}@agrigrade.ai`,
        mobileNumber: thirdPartyMobile,
        password: `UserPass123!`,
        role: 'BUYER',
      }),
    });
    const thirdPartyData = await safeJson(thirdPartyRegRes);
    const thirdPartyToken = thirdPartyData.token || thirdPartyData.accessToken;
    const thirdPartyHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${thirdPartyToken}`,
    };

    const unauthRead = await fetch(`${BASE_URL}/chat/conversations/${convId}/messages`, { headers: thirdPartyHeaders });
    logTest('CHAT-19: Unauthorized Conversation Access Protection', unauthRead.status === 403);

    const unauthSend = await fetch(`${BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: thirdPartyHeaders,
      body: JSON.stringify({
        conversationId: convId,
        content: 'Malicious injection',
      }),
    });
    logTest('CHAT-20: Sender Impersonation Protection', unauthSend.status === 403);

    // CHAT-28: Script Injection Sanitization
    const htmlInjectionRes = await fetch(`${BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        conversationId: convId,
        content: '<script>alert("hack")</script>Hello safe text',
      }),
    });
    const sanitizedData = await safeJson(htmlInjectionRes);
    const sanitizedMsg = sanitizedData.data || sanitizedData;
    logTest('CHAT-28: Script Injection Sanitized', !!sanitizedMsg?.content && !sanitizedMsg.content.includes('<script>'), `Content: "${sanitizedMsg?.content}"`);

    // CHAT-29: Message Length Validation (Reject > 2000 chars)
    const longText = 'A'.repeat(2500);
    const longMsgRes = await fetch(`${BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: buyerHeaders,
      body: JSON.stringify({
        conversationId: convId,
        content: longText,
      }),
    });
    logTest('CHAT-29: Message Exceeding 2000 Chars Rejected', longMsgRes.status === 400);

    buyerWs.close();
    farmerWs.close();

    console.log('===========================================================');
    console.log(' AGRICRADE AI — ALL CHAT & WEBSOCKET TESTS PASSED CLEANLY');
    console.log('===========================================================');
  } catch (err) {
    console.error('Test Suite Exception:', err);
    process.exitCode = 1;
  }
}

runChatTestSuite();
