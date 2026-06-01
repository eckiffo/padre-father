/**
 * GET /api/blessing/leaderboard?limit=50
 * Returns top N wallets by Blessing Score from KV sorted set.
 */

import { getRankForScore, cors } from './_config.js';
import { kvZrange, kvZcard, kvGet } from './_kv.js';

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const limit = Math.min(parseInt(req.query?.limit || '50'), 100);

  const raw = await kvZrange('leaderboard', 0, limit - 1, { rev: true, withScores: true });

  if (!raw || raw.length === 0) {
    return res.status(200).json({ entries: [], total: 0, updatedAt: new Date().toISOString() });
  }

  const items   = Array.isArray(raw[0]?.member !== undefined ? raw : []) ? raw : chunkPairs(raw);
  const entries = [];

  for (let i = 0; i < items.length; i++) {
    const item   = items[i];
    const wallet = item.member || item[0];
    const score  = parseInt(item.score || item[1] || 0);
    if (!wallet) continue;

    const detail = await kvGet(`wallet:${wallet}`);
    const rank   = getRankForScore(score);
    entries.push({
      position:    i + 1,
      wallet,
      walletShort: wallet.slice(0, 4) + '…' + wallet.slice(-4),
      score,
      rank:        rank.name,
      rankIcon:    rank.icon,
      holdDays:    detail?.holdDays || 0,
      posts:       detail?.posts    || 0,
      balance:     detail?.balance  || 0,
    });
  }

  const total = await kvZcard('leaderboard');

  return res.status(200).json({ entries, total, updatedAt: new Date().toISOString() });
}

function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push({ member: arr[i], score: arr[i + 1] });
  }
  return out;
}
