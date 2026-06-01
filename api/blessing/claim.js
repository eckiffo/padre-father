/**
 * POST /api/blessing/claim
 * Body: { wallet: string }
 * Marks rewards as claimed (pending manual distribution).
 */

import { getRankForScore, cors } from './_config.js';
import { kvGet, kvSet } from './_kv.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { return res.status(405).json({ error: 'Method not allowed' }); }

  const { wallet } = req.body || {};
  if (!wallet) return res.status(400).json({ error: 'wallet required' });

  const cacheKey  = `wallet:${wallet}`;
  const walletData = await kvGet(cacheKey);
  if (!walletData) {
    return res.status(404).json({ error: 'Score not found. Visit dashboard first.' });
  }

  const rank = getRankForScore(walletData.score || 0);
  if (!rank.rewardEligible) {
    return res.status(403).json({
      error: `${rank.name} rank is not reward eligible. You need at least Congregation (500 pts).`,
      rank: rank.name,
    });
  }

  if (walletData.claimable === 0) {
    return res.status(400).json({ error: 'No rewards available to claim right now.' });
  }

  const existingClaim = await kvGet(`claim_pending:${wallet}`);
  if (existingClaim) {
    return res.status(400).json({ error: 'You already have a pending claim. Wait for distribution.' });
  }

  const claimRecord = {
    wallet,
    amount:      walletData.claimable,
    score:       walletData.score,
    rank:        rank.name,
    requestedAt: new Date().toISOString(),
    status:      'pending',
  };

  await kvSet(`claim_pending:${wallet}`, claimRecord, { ex: 7 * 24 * 60 * 60 });

  // Note: lpush not in _kv.js — use kvSet for queue (simple append pattern)
  try {
    const mod = await import('@vercel/kv');
    await mod.kv.lpush('claims:queue', JSON.stringify(claimRecord));
  } catch (_) {}

  const newTotalClaimed = (walletData.claimed || 0) + walletData.claimable;
  await kvSet(cacheKey, {
    ...walletData,
    claimable: 0,
    claimed:   newTotalClaimed,
    lastClaim: new Date().toISOString(),
  }, { ex: 48 * 60 * 60 });

  return res.status(200).json({
    success:      true,
    claimed:      walletData.claimable,
    totalClaimed: newTotalClaimed,
    claimable:    0,
    message:      'Claim recorded. The Father will distribute rewards within 7 days.',
  });
}
