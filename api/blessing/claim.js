/**
 * POST /api/blessing/claim
 * Body: { wallet: string }
 * Marks rewards as claimed (pending manual distribution).
 * Records to KV claims list for admin to action.
 */

import { kv } from '@vercel/kv';
import { getRankForScore, HOLDER_FEE_SHARE, cors } from './_config.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { return res.status(405).json({ error: 'Method not allowed' }); }

  const { wallet } = req.body || {};
  if (!wallet) return res.status(400).json({ error: 'wallet required' });

  const cacheKey = `wallet:${wallet}`;

  try {
    const walletData = await kv.get(cacheKey);
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

    // Check for duplicate pending claim
    const existingClaim = await kv.get(`claim_pending:${wallet}`);
    if (existingClaim) {
      return res.status(400).json({ error: 'You already have a pending claim. Wait for distribution.' });
    }

    // Record the claim
    const claimRecord = {
      wallet,
      amount:       walletData.claimable,
      score:        walletData.score,
      rank:         rank.name,
      requestedAt:  new Date().toISOString(),
      status:       'pending',
    };

    // Store pending claim (7 day TTL — admin should distribute by then)
    await kv.set(`claim_pending:${wallet}`, claimRecord, { ex: 7 * 24 * 60 * 60 });

    // Add to admin claims queue
    await kv.lpush('claims:queue', JSON.stringify(claimRecord));

    // Update wallet record — clear claimable, add to total claimed
    const newTotalClaimed = (walletData.claimed || 0) + walletData.claimable;
    await kv.set(cacheKey, {
      ...walletData,
      claimable:    0,
      claimed:      newTotalClaimed,
      lastClaim:    new Date().toISOString(),
    }, { ex: 48 * 60 * 60 });

    return res.status(200).json({
      success:      true,
      claimed:      walletData.claimable,
      totalClaimed: newTotalClaimed,
      claimable:    0,
      message:      'Claim recorded. The Father will distribute rewards within 7 days.',
    });

  } catch (e) {
    console.error('[claim] error:', e);
    return res.status(500).json({ error: 'Claim failed. Please try again.' });
  }
}
