/**
 * POST /api/blessing/referral
 * Body: { wallet: string, referrer: string }
 * Records referral attribution. Referrer gets +200 pts next score refresh.
 */

import { cors } from './_config.js';
import { kvGet, kvSet, kvSadd } from './_kv.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { return res.status(405).end(); }

  const { wallet, referrer } = req.body || {};
  if (!wallet || !referrer || wallet === referrer) {
    return res.status(400).json({ error: 'invalid' });
  }

  // Only count once per wallet
  const alreadyTracked = await kvGet(`ref_attr:${wallet}`);
  if (alreadyTracked) {
    return res.status(200).json({ ok: true, message: 'already tracked' });
  }

  await kvSet(`ref_attr:${wallet}`, referrer, { ex: 365 * 24 * 60 * 60 });
  await kvSadd(`referrals:${referrer}`, wallet);

  // Invalidate referrer's cached score so it recalculates with new referral
  const existing = await kvGet(`wallet:${referrer}`);
  if (existing) {
    await kvSet(`wallet:${referrer}`, { ...existing, lastUpdated: '2000-01-01' });
  }

  return res.status(200).json({ ok: true });
}
