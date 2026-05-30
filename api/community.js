/**
 * $PADRE — Coin Communities API proxy
 * GET /api/community?limit=N&offset=N
 * Env vars: CC_API_KEY, PADRE_TOKEN_ADDRESS
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET')     { res.status(405).json({ error: 'Method not allowed' }); return; }

  const tokenAddress = process.env.PADRE_TOKEN_ADDRESS;
  if (!tokenAddress) {
    // Token not launched yet — return empty
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
    const { configureApi, getMessages } = await import('@coin-communities/sdk/node');

    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: { 'x-api-key': apiKey },
    });

    // Correct method: getMessages (not getPosts)
    const result = await getMessages(
      { token_address: tokenAddress },
      { limit, offset }
    );

    // Normalise to array regardless of response shape
    const messages = Array.isArray(result) ? result : (result?.messages || result?.data || []);

    // Map to a consistent shape for the frontend
    const posts = messages.map(m => ({
      id:        m.id || m.message_id,
      author:    m.author?.username || m.username || m.user?.username || 'Anonymous',
      content:   m.content || m.text || m.body || '',
      createdAt: m.created_at || m.createdAt || m.timestamp,
      likes:     m.likes_count || m.likesCount || 0,
      replies:   m.replies_count || m.repliesCount || 0,
    }));

    res.status(200).json(posts);
  } catch (e) {
    console.error('[community api]', e);
    res.status(500).json({ error: 'Failed to fetch community posts' });
  }
}
