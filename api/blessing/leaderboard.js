/**
 * GET /api/blessing/leaderboard?limit=50
 * Returns top N wallets by Blessing Score from KV sorted set.
 * Cached at the edge for 30 minutes.
 */

import { kv } from '@vercel/kv';
import { getRankForScore, cors } from './_config.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const limit = Math.min(parseInt(req.query?.limit || '50'), 100);

  try {
    // zrange with REV and WITHSCORES — highest scores first
    const raw = await kv.zrange('leaderboard', 0, limit - 1, {
      rev: true,
      withScores: true,
    });

    if (!raw || raw.length === 0) {
      return res.status(200).json({ entries: [], total: 0, updatedAt: new Date().toISOString() });
    }

    // raw is interleaved [member, score, member, score, ...]
    // Vercel KV returns [{member, score}] when withScores:true
    const entries = [];
    const items = Array.isArray(raw[0]) ? raw : chunkPairs(raw);

    for (let i = 0; i < items.length; i++) {
      const item   = items[i];
      const wallet = item.member || item[0];
      const score  = parseInt(item.score || item[1] || 0);

      if (!wallet) continue;

      // Fetch wallet details from KV (best effort)
      let detail = null;
      try {
        detail = await kv.get(`wallet:${wallet}`);
      } catch (_) {}

      const rank = getRankForScore(score);
      entries.push({
        position:   i + 1,
        wallet,
        walletShort: wallet.slice(0, 4) + '…' + wallet.slice(-4),
        score,
        rank:        rank.name,
        rankIcon:    rank.icon,
        holdDays:    detail?.holdDays    || 0,
        posts:       detail?.posts       || 0,
        balance:     detail?.balance     || 0,
      });
    }

    // Leaderboard stats
    const totalWallets = await kv.zcard('leaderboard') || 0;

    return res.status(200).json({
      entries,
      total:     totalWallets,
      updatedAt: new Date().toISOString(),
    });

  } catch (e) {
    console.error('[leaderboard] error:', e);
    return res.status(500).json({ error: 'Failed to load leaderboard', entries: [] });
  }
}

function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push({ member: arr[i], score: arr[i + 1] });
  }
  return out;
}
