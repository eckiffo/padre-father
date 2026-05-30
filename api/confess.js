/**
 * $PADRE — Confession submission endpoint
 * POST /api/confess
 * Proxies submissions to Coin Communities API as community posts
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const tokenAddress = process.env.PADRE_TOKEN_ADDRESS;
  const apiKey       = process.env.CC_API_KEY;

  if (!tokenAddress || !apiKey) {
    // Not launched yet — accept gracefully
    res.status(200).json({ ok: true, message: 'Received' });
    return;
  }

  const { name, type, confession } = req.body || {};

  if (!confession || !confession.trim()) {
    res.status(400).json({ error: 'Confession text required' });
    return;
  }

  const typeLabels = {
    sin:        '🙏 Confession of Sin',
    faith:      '✝ Declaration of Faith',
    testimonial:'📈 Gainful Testimonial',
    prayer:     '🕯️ Prayer Request',
    question:   '❓ Question for The Father',
  };

  const label = typeLabels[type] || '✝ Confession';
  const author = (name && name.trim()) ? name.trim() : 'Anonymous Aper';
  const content = `${label}\n\n${confession.trim()}`;

  try {
    const { CoinCommunities } = await import('@coin-communities/sdk');
    const sdk = new CoinCommunities({ apiKey });

    await sdk.createPost({
      tokenAddress,
      author,
      content,
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[confess api]', e);
    // Don't expose error to client — confessions are sensitive
    res.status(200).json({ ok: true });
  }
}
