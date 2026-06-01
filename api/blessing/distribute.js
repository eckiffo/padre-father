/**
 * POST /api/blessing/distribute
 * Admin-only: set claimable amounts based on total pool size.
 * Body: { adminKey: string, totalPool: number }
 */

import { HOLDER_FEE_SHARE, getRankForScore, cors } from './_config.js';
import { kvZrange, kvGet, kvSet } from './_kv.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { return res.status(405).end(); }

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.body?.adminKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const totalPool = parseFloat(req.body?.totalPool || 0);
  if (!totalPool || totalPool <= 0) {
    return res.status(400).json({ error: 'totalPool required' });
  }

  const all = await kvZrange('leaderboard', 0, -1, { rev: true, withScores: true });
  if (!all || all.length === 0) {
    return res.status(200).json({ message: 'No wallets on leaderboard', distributed: 0 });
  }

  const items    = Array.isArray(all[0]?.member !== undefined ? all : []) ? all : chunkPairs(all);
  const eligible = items.filter(item => getRankForScore(parseInt(item.score || item[1] || 0)).rewardEligible);

  if (eligible.length === 0) {
    return res.status(200).json({ message: 'No eligible wallets', distributed: 0 });
  }

  const totalScore = eligible.reduce((sum, item) => sum + parseInt(item.score || item[1] || 0), 0);
  let distributed  = 0;
  const distributions = [];

  for (const item of eligible) {
    const wallet = item.member || item[0];
    const score  = parseInt(item.score || item[1] || 0);
    const share  = Math.floor((score / totalScore) * totalPool);
    if (share <= 0) continue;

    const key      = `wallet:${wallet}`;
    const existing = await kvGet(key) || {};
    await kvSet(key, { ...existing, claimable: (existing.claimable || 0) + share }, { keepTtl: true });
    distributions.push({ wallet, score, share });
    distributed += share;
  }

  // Record distribution history (best effort — requires lpush which needs raw kv)
  try {
    const mod = await import('@vercel/kv');
    const histEntry = {
      totalPool, distributed,
      eligibleCount: eligible.length, totalScore,
      distributedAt: new Date().toISOString(),
      snapshot: distributions.slice(0, 20),
    };
    await mod.kv.lpush('distribution:history', JSON.stringify(histEntry));
    await mod.kv.ltrim('distribution:history', 0, 51);
  } catch (_) {}

  return res.status(200).json({
    success: true, totalPool, distributed,
    eligibleWallets: eligible.length, totalScore,
    message: `Distributed ${distributed.toLocaleString()} $PADRE to ${eligible.length} wallets`,
  });
}

function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) out.push({ member: arr[i], score: arr[i + 1] });
  return out;
}
