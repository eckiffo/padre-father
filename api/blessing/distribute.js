/**
 * POST /api/blessing/distribute
 * Admin-only: set claimable amounts based on total pool size.
 * Body: { adminKey: string, totalPool: number }
 *
 * Fee split: 50% to creator (handled off-chain), 50% to holders.
 * The holder 50% is split proportionally by Blessing Score.
 * Only Congregation rank (500 pts) and above are eligible.
 *
 * Example: pool of 10,000,000 $PADRE to distribute.
 * Wallet with 2000 pts out of 50,000 total eligible pts
 *   → gets 2000/50000 × 10,000,000 = 400,000 $PADRE
 */

import { kv }   from '@vercel/kv';
import { HOLDER_FEE_SHARE, getRankForScore, cors } from './_config.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { return res.status(405).end(); }

  // Basic admin auth via shared secret
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.body?.adminKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const totalPool = parseFloat(req.body?.totalPool || 0);
  if (!totalPool || totalPool <= 0) {
    return res.status(400).json({ error: 'totalPool required (total $PADRE to distribute to holders)' });
  }

  try {
    // Get ALL leaderboard members
    const all = await kv.zrange('leaderboard', 0, -1, { rev: true, withScores: true });
    if (!all || all.length === 0) {
      return res.status(200).json({ message: 'No wallets on leaderboard', distributed: 0 });
    }

    const items = Array.isArray(all[0]?.member !== undefined ? all : []) ? all : chunkPairs(all);

    // Filter to reward-eligible wallets (score >= 500 = Congregation)
    const eligible = items.filter(item => {
      const score = parseInt(item.score || item[1] || 0);
      return getRankForScore(score).rewardEligible;
    });

    if (eligible.length === 0) {
      return res.status(200).json({ message: 'No eligible wallets', distributed: 0 });
    }

    // Sum of all eligible scores
    const totalScore = eligible.reduce((sum, item) => sum + parseInt(item.score || item[1] || 0), 0);

    // Distribute proportionally
    let distributed = 0;
    const distributions = [];

    for (const item of eligible) {
      const wallet = item.member || item[0];
      const score  = parseInt(item.score || item[1] || 0);
      const share  = Math.floor((score / totalScore) * totalPool);

      if (share <= 0) continue;

      try {
        const key      = `wallet:${wallet}`;
        const existing = await kv.get(key) || {};
        await kv.set(key, {
          ...existing,
          claimable: (existing.claimable || 0) + share,
        }, { keepTtl: true });
        distributions.push({ wallet, score, share });
        distributed += share;
      } catch (e) {
        console.warn(`[distribute] failed for ${wallet}:`, e.message);
      }
    }

    // Record distribution in history
    const histEntry = {
      totalPool,
      distributed,
      eligibleCount: eligible.length,
      totalScore,
      distributedAt: new Date().toISOString(),
      snapshot: distributions.slice(0, 20), // store top 20 for display
    };
    await kv.lpush('distribution:history', JSON.stringify(histEntry));
    await kv.ltrim('distribution:history', 0, 51); // keep last 52 entries

    return res.status(200).json({
      success: true,
      totalPool,
      distributed,
      eligibleWallets: eligible.length,
      totalScore,
      message: `Distributed ${distributed.toLocaleString()} $PADRE to ${eligible.length} wallets`,
    });

  } catch (e) {
    console.error('[distribute] error:', e);
    return res.status(500).json({ error: 'Distribution failed' });
  }
}

function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push({ member: arr[i], score: arr[i + 1] });
  }
  return out;
}
