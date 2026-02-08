const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Stripe = require('stripe');
const admin = require('firebase-admin');
const fs = require('fs');
const fetch = require('node-fetch');
const OpenAI = require('openai');

dotenv.config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((item) => item.trim()).filter(Boolean)
  : [];

const primaryFrontendUrl = allowedOrigins[0] || '';

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    return next();
  }
  express.json()(req, res, next);
});

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    return;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8');
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
};

initializeFirebaseAdmin();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

const getPlanForPrice = (priceId) => {
  if (!priceId) return 'none';
  if (priceId === process.env.STRIPE_PRICE_BASIC_ID) return 'basic';
  if (priceId === process.env.STRIPE_PRICE_PRO_ID) return 'pro';
  return 'none';
};

const updateUserSubscription = async (userRef, data) => {
  await userRef.set({
    subscription: {
      status: data.status || 'inactive',
      plan: data.plan || 'none',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    stripeCustomerId: data.stripeCustomerId || null
  }, { merge: true });
};

const getUserByCustomerId = async (customerId) => {
  const snapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0];
};

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Missing Firebase auth token.' });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid Firebase auth token.' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/stripe/checkout', verifyFirebaseToken, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['basic', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_BASIC_ID || !process.env.STRIPE_PRICE_PRO_ID) {
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    const userRef = db.collection('users').doc(req.user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const userData = userSnap.data();
    let stripeCustomerId = userData.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email || req.user.email || undefined,
        metadata: { uid: req.user.uid }
      });
      stripeCustomerId = customer.id;
      await userRef.set({ stripeCustomerId }, { merge: true });
    }

    const priceId = plan === 'basic'
      ? process.env.STRIPE_PRICE_BASIC_ID
      : process.env.STRIPE_PRICE_PRO_ID;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${primaryFrontendUrl}/?checkout=success`,
      cancel_url: `${primaryFrontendUrl}/paywall?checkout=cancel`,
      metadata: {
        uid: req.user.uid,
        plan
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

app.post('/api/stripe/portal', verifyFirebaseToken, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    const userRef = db.collection('users').doc(req.user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const userData = userSnap.data();
    let stripeCustomerId = userData.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email || req.user.email || undefined,
        metadata: { uid: req.user.uid }
      });
      stripeCustomerId = customer.id;
      await userRef.set({ stripeCustomerId }, { merge: true });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${primaryFrontendUrl}/paywall`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create customer portal session.' });
  }
});

app.post('/api/stripe/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).send('Missing webhook signature.');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature error:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = getPlanForPrice(priceId);
        const uid = session.metadata?.uid;

        if (uid) {
          const userRef = db.collection('users').doc(uid);
          await updateUserSubscription(userRef, {
            status: subscription.status,
            plan,
            stripeCustomerId: session.customer
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = getPlanForPrice(priceId);
        const userDoc = await getUserByCustomerId(subscription.customer);
        if (userDoc) {
          await updateUserSubscription(userDoc.ref, {
            status: subscription.status,
            plan,
            stripeCustomerId: subscription.customer
          });
        }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

// ── Schwab API Integration ──────────────────────────────────────────────

const SCHWAB_TOKEN_URL = 'https://api.schwabapi.com/v1/oauth/token';
const SCHWAB_TRADER_BASE = 'https://api.schwabapi.com/trader/v1';

const schwabBasicAuth = () => {
  const id = process.env.SCHWAB_CLIENT_ID || '';
  const secret = process.env.SCHWAB_CLIENT_SECRET || '';
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
};

const transformSchwabTransactions = (schwabTxns) => {
  const grouped = {};
  let skippedCurrency = 0;
  let processed = 0;

  for (const txn of schwabTxns) {
    const transferItems = txn.transferItems || [];
    for (const item of transferItems) {
      const instrument = item.instrument || {};
      const assetType = (instrument.assetType || '').toUpperCase();

      // Skip cash/currency settlement legs — only process actual instruments
      if (assetType === 'CURRENCY' || assetType === '') {
        skippedCurrency++;
        continue;
      }

      processed++;

      // Determine side from the transfer item amount:
      // positive amount = buying contracts/shares, negative = selling
      const side = item.amount > 0 ? 'BUY'
        : item.amount < 0 ? 'SELL'
        : 'N/A';

      // For options, use underlyingSymbol as the grouping symbol
      const symbol = instrument.underlyingSymbol || instrument.symbol || 'UNKNOWN';
      const strike = instrument.strikePrice || 0;

      let expiration = 'N/A';
      if (instrument.expirationDate) {
        const d = new Date(instrument.expirationDate);
        expiration = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      }

      const putCall = instrument.putCall || '';
      const type = assetType === 'EQUITY' ? 'EQUITY'
        : putCall === 'CALL' ? 'CALL'
        : putCall === 'PUT' ? 'PUT'
        : assetType || 'UNKNOWN';

      let posEffect = 'UNKNOWN';
      const pe = (item.positionEffect || '').toUpperCase();
      if (pe.includes('OPEN')) posEffect = 'OPEN';
      else if (pe.includes('CLOS')) posEffect = 'CLOSE';

      const execTime = txn.time ? new Date(txn.time).toISOString() : new Date().toISOString();
      let tradeDate = 'N/A';
      if (txn.tradeDate) {
        const d = new Date(txn.tradeDate);
        tradeDate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
      }

      const price = item.price || (item.cost && item.amount ? Math.abs(item.cost / item.amount) : 0);

      const transaction = {
        ExecTime: execTime,
        TradeDate: tradeDate,
        Side: side,
        Quantity: Math.abs(item.amount || 0),
        Symbol: symbol,
        Expiration: expiration,
        Strike: strike,
        Price: price,
        OrderType: 'MARKET',
        PosEffect: posEffect,
        Type: type,
        _schwabActivityId: String(txn.activityId || txn.transactionId || `${txn.time}-${symbol}-${side}`),
      };

      const groupKey = `${symbol}-${strike}-${expiration}`;
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          Symbol: symbol,
          Strike: strike,
          Expiration: expiration,
          Transactions: [],
        };
      }
      grouped[groupKey].Transactions.push(transaction);
    }
  }

  console.log(`Transform stats: ${processed} instrument items processed, ${skippedCurrency} currency/empty items skipped`);
  return Object.values(grouped);
};

const mergeSchwabWithExisting = (existing, schwabGroups) => {
  // Filter out any junk CURRENCY_USD groups from previous bad syncs
  const cleaned = existing.filter(g => g.Symbol !== 'CURRENCY_USD');
  if (cleaned.length < existing.length) {
    console.log(`Cleaned ${existing.length - cleaned.length} CURRENCY_USD junk groups from existing data`);
  }

  const merged = cleaned.map(g => ({
    ...g,
    Transactions: g.Transactions.map(t => ({ ...t })),
  }));

  const groupMap = {};
  for (const group of merged) {
    const key = `${group.Symbol}-${group.Strike}-${group.Expiration}`;
    groupMap[key] = group;
  }

  const existingIds = new Set();
  for (const group of merged) {
    for (const tx of group.Transactions) {
      if (tx._schwabActivityId) existingIds.add(tx._schwabActivityId);
    }
  }

  for (const schwabGroup of schwabGroups) {
    const key = `${schwabGroup.Symbol}-${schwabGroup.Strike}-${schwabGroup.Expiration}`;
    if (!groupMap[key]) {
      groupMap[key] = {
        Symbol: schwabGroup.Symbol,
        Strike: schwabGroup.Strike,
        Expiration: schwabGroup.Expiration,
        Transactions: [],
      };
      merged.push(groupMap[key]);
    }

    for (const tx of schwabGroup.Transactions) {
      if (!existingIds.has(tx._schwabActivityId)) {
        groupMap[key].Transactions.push(tx);
        existingIds.add(tx._schwabActivityId);
      }
    }
  }

  return merged;
};

const refreshSchwabTokenIfNeeded = async (userRef, tokenDoc) => {
  const data = tokenDoc.data();
  const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);

  if (new Date() < expiresAt) {
    return data;
  }

  // Check if refresh token is still valid (7-day lifetime)
  const refreshExpiresAt = data.refreshExpiresAt?.toDate ? data.refreshExpiresAt.toDate() : new Date(data.refreshExpiresAt);
  if (new Date() >= refreshExpiresAt) {
    return null; // Refresh token expired, need to reconnect
  }

  const resp = await fetch(SCHWAB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: schwabBasicAuth(),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: data.refreshToken,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('Schwab token refresh failed:', errText);
    return null;
  }

  const tokens = await resp.json();
  const now = new Date();
  const newData = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || data.refreshToken,
    expiresAt: new Date(now.getTime() + (tokens.expires_in || 1800) * 1000),
    refreshExpiresAt: tokens.refresh_token
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      : data.refreshExpiresAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userRef.collection('schwabTokens').doc('primary').set(newData, { merge: true });
  return { ...data, ...newData };
};

// POST /api/schwab/token – exchange auth code for tokens
app.post('/api/schwab/token', verifyFirebaseToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code.' });
    }
    if (!process.env.SCHWAB_CLIENT_ID || !process.env.SCHWAB_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Schwab API is not configured on the server.' });
    }

    const resp = await fetch(SCHWAB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: schwabBasicAuth(),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SCHWAB_REDIRECT_URI || '',
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('Schwab token exchange failed:', errBody);
      return res.status(resp.status).json({ error: 'Failed to exchange authorization code.' });
    }

    const tokens = await resp.json();
    const now = new Date();
    const userRef = db.collection('users').doc(req.user.uid);

    await userRef.collection('schwabTokens').doc('primary').set({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(now.getTime() + (tokens.expires_in || 1800) * 1000),
      refreshExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await userRef.set({ schwabConnected: true }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Schwab token error:', error);
    res.status(500).json({ error: 'Failed to connect Schwab account.' });
  }
});

// GET /api/schwab/status – check connection status
app.get('/api/schwab/status', verifyFirebaseToken, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.json({ connected: false, lastSync: null });
    }
    const userData = userSnap.data();
    res.json({
      connected: !!userData.schwabConnected,
      lastSync: userData.schwabLastSync ? userData.schwabLastSync.toDate?.() || userData.schwabLastSync : null,
    });
  } catch (error) {
    console.error('Schwab status error:', error);
    res.status(500).json({ error: 'Failed to fetch Schwab status.' });
  }
});

// POST /api/schwab/sync – pull trades from Schwab
app.post('/api/schwab/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const tokenDoc = await userRef.collection('schwabTokens').doc('primary').get();

    if (!tokenDoc.exists) {
      return res.status(400).json({ error: 'Schwab account not connected.' });
    }

    const tokenData = await refreshSchwabTokenIfNeeded(userRef, tokenDoc);
    if (!tokenData) {
      // Refresh token expired – clear connection
      await userRef.collection('schwabTokens').doc('primary').delete();
      await userRef.set({ schwabConnected: false }, { merge: true });
      return res.json({ reconnectRequired: true, error: 'Schwab session expired. Please reconnect.' });
    }

    // Fetch account number-to-hash mappings
    const accountNumsResp = await fetch(`${SCHWAB_TRADER_BASE}/accounts/accountNumbers`, {
      headers: { Authorization: `Bearer ${tokenData.accessToken}` },
    });

    if (!accountNumsResp.ok) {
      const errText = await accountNumsResp.text();
      console.error('Schwab accountNumbers fetch failed:', errText);
      return res.status(accountNumsResp.status).json({ error: 'Failed to fetch Schwab accounts.' });
    }

    const accountNumbers = await accountNumsResp.json();
    console.log('Schwab accountNumbers response:', JSON.stringify(accountNumbers));
    const allTransactions = [];

    // Build date range (last 60 days, the Schwab API maximum)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Fetch transactions for each account using hashValue
    for (const acct of accountNumbers) {
      const hashValue = acct.hashValue;
      if (!hashValue) continue;

      const txnUrl = `${SCHWAB_TRADER_BASE}/accounts/${hashValue}/transactions?types=TRADE&startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}`;
      console.log('Fetching transactions from:', txnUrl);

      const txnResp = await fetch(txnUrl, {
        headers: { Authorization: `Bearer ${tokenData.accessToken}` },
      });

      if (txnResp.ok) {
        const txns = await txnResp.json();
        console.log(`Schwab transactions for account ${acct.accountNumber}: ${Array.isArray(txns) ? txns.length : 'not an array'}`);
        if (Array.isArray(txns)) {
          allTransactions.push(...txns);
        }
      } else {
        const errText = await txnResp.text();
        console.error(`Schwab transactions fetch failed for account ${acct.accountNumber} (${txnResp.status}):`, errText);
      }
    }

    // Log a sample raw transaction to understand the structure
    if (allTransactions.length > 0) {
      console.log('Sample raw Schwab transaction:', JSON.stringify(allTransactions[0], null, 2));
    }

    const schwabGroups = transformSchwabTransactions(allTransactions);
    console.log(`Transform result: ${schwabGroups.length} groups, total transactions: ${schwabGroups.reduce((sum, g) => sum + g.Transactions.length, 0)}`);
    if (schwabGroups.length > 0) {
      console.log('Sample transformed group:', JSON.stringify(schwabGroups[0], null, 2));
    }

    // Get existing trade data
    const userSnap = await userRef.get();
    const existing = userSnap.exists ? (userSnap.data().tradeData || []) : [];

    const merged = mergeSchwabWithExisting(existing, schwabGroups);
    console.log(`Merge result: ${merged.length} groups (was ${existing.length} existing + ${schwabGroups.length} schwab)`);

    await userRef.set({
      tradeData: merged,
      schwabLastSync: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: new Date(),
    }, { merge: true });

    res.json({ success: true, tradeData: merged, transactionsImported: allTransactions.length });
  } catch (error) {
    console.error('Schwab sync error:', error);
    res.status(500).json({ error: 'Failed to sync trades from Schwab.' });
  }
});

// POST /api/schwab/disconnect – remove Schwab connection
app.post('/api/schwab/disconnect', verifyFirebaseToken, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    await userRef.collection('schwabTokens').doc('primary').delete();
    await userRef.set({ schwabConnected: false, schwabLastSync: null }, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Schwab disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Schwab account.' });
  }
});

// ── AI Trade Review ─────────────────────────────────────────────────────

app.post('/api/ai/trade-review', verifyFirebaseToken, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'AI review is not configured on the server.' });
    }

    // Verify Pro subscription
    const userRef = db.collection('users').doc(req.user.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User record not found.' });
    }
    const userData = userSnap.data();
    const sub = userData.subscription || {};
    if (sub.plan !== 'pro' || !['active', 'trialing'].includes(sub.status)) {
      return res.status(403).json({ error: 'AI Trade Review is available on the Pro plan.' });
    }

    // Validate trade data
    const { trade } = req.body;
    if (!trade || !trade.symbol) {
      return res.status(400).json({ error: 'Missing trade data.' });
    }

    const systemPrompt = `You are an expert trading coach with 20+ years of experience in options and equities trading. Analyze the following trade and provide structured, actionable feedback. Be direct, specific, and constructive. Your response MUST follow this exact structure with these section headers in bold:

**Trade Summary**
Brief recap of what was traded and the outcome.

**What Went Well**
Identify positives in the trade execution, timing, or strategy.

**Areas for Improvement**
Specific, actionable suggestions for improving future trades.

**Key Takeaway**
One concise lesson the trader should remember from this trade.

Keep the total response under 300 words.`;

    const side = (trade.type || '').toUpperCase() === 'PUT' ? 'SHORT' : 'LONG';
    const holdingPeriod = trade.entryTime && trade.exitTime
      ? `${Math.round((new Date(trade.exitTime) - new Date(trade.entryTime)) / (1000 * 60))} minutes`
      : 'N/A';

    const userPrompt = `Trade Details:
- Symbol: ${trade.symbol}
- Side: ${side}
- Strike: ${trade.strike || 'N/A'}
- Type: ${trade.type || 'N/A'}
- Expiration: ${trade.expiration || 'N/A'}
- Entry Price: $${trade.entryPrice || 'N/A'}
- Exit Price: $${trade.exitPrice || 'N/A'}
- Quantity: ${trade.quantity || 'N/A'} contracts
- Net P&L: $${trade.netPL != null ? trade.netPL.toFixed(2) : 'N/A'}
- Net ROI: ${trade.netROI != null ? trade.netROI.toFixed(2) + '%' : 'N/A'}
- Status: ${trade.status || 'N/A'}
- Trade Date: ${trade.tradeDate || 'N/A'}
- Close Date: ${trade.closeDate || 'N/A'}
- Holding Period: ${holdingPeriod}
- Entry Time: ${trade.entryTime || 'N/A'}
- Exit Time: ${trade.exitTime || 'N/A'}

Trader Self-Assessment:
- Rating: ${trade.rating ? trade.rating + '/5 stars' : 'Not rated'}
- Setups: ${trade.setups && trade.setups.length ? trade.setups.join(', ') : 'None tagged'}
- Mistakes: ${trade.mistakes && trade.mistakes.length ? trade.mistakes.join(', ') : 'None tagged'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const review = completion.choices[0]?.message?.content || '';
    res.json({ review });
  } catch (error) {
    console.error('AI trade review error:', error);
    if (error?.status === 429) {
      return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' });
    }
    if (error?.status === 401) {
      return res.status(500).json({ error: 'AI service authentication failed. Please contact support.' });
    }
    res.status(500).json({ error: 'Failed to generate trade review.' });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
