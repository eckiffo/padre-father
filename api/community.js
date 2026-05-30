/**
 * $PADRE — Coin Communities API proxy
 * GET /api/community?limit=N&offset=N
 * Env vars: CC_API_KEY, PADRE_TOKEN_ADDRESS
 */

let sdkInstance = null;

async function getSDK() {
  if (sdkInstance) return sdkInstance;
  try {
    const { CoinCommunities } = await import('@coin-communities/sdk');
    sdkInstance = new CoinCommunities({
      apiKey: process.env.CC_API_KEY,
    });
    return sdkInstance;
  } catch (e) {
    throw new Error('SDK init failed: ' + e.message);
  }
}

export default async function handler(req, res) {
  // CORS for overlay
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const tokenAddress = process.env.PADRE_TOKEN_ADDRESS;
  if (!tokenAddress) {
    // Token not launched yet — return empty array gracefully
    res.status(200).json([]);
    return;
  }

  const apiKey = process.env.CC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'CC_API_KEY not configured' });
    return;
  }

  const limit  = Math.min(parseInt(req.query.limit  || '6',  10), 20);
  const offset = Math.max(parseInt(req.query.offset || '0',  10), 0);

  try {
    const sdk   = await getSDK();
    const posts = await sdk.getPosts({
      tokenAddress,
      limit,
      offset,
    });

    res.status(200).json(posts || []);
  } catch (e) {
    console.error('[community api]', e);
    res.status(500).json({ error: 'Failed to fetch community posts' });
  }
}
