/**
 * POST /api/blessing/referral
 * Body: { wallet: string, referrer: string }
 * Records referral attribution. Referrer gets +200 pts next score refresh.
 */

import { kv } from '@vercel/kv';
import { cors } from './_config.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { return res.status(405).end(); }

  const { wallet, referrer } = req.body || {};
  if (!wallet || !referrer || wallet === referrer) {
    return res.status(400).json({ error: 'invalid' });
  }

  try {
    // Only count once per wallet
    const alreadyTracked = await kv.get(`ref_attr:${wallet}`);
    if (alreadyTracked) {
      return res.status(200).json({ ok: true, message: 'already tracked' });
    }

    // Record attribution
    await kv.set(`ref_attr:${wallet}`, referrer, { ex: 365 * 24 * 60 * 60 }); // 1 year
    // Add to referrer's set of referred wallets
    await kv.sadd(`referrals:${referrer}`, wallet);

    // Invalidate referrer's cached score so it recalculates with new referral
    try {
      const existing = await kv.get(`wallet:${referrer}`);
      if (existing) {
        await kv.set(`wallet:${referrer}`, { ...existing, lastUpdated: '2000-01-01' });
      }
    } catch (_) {}

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[referral]', e);
    return res.status(500).json({ error: 'failed' });
  }
}
