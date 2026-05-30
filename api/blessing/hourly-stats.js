/**
 * GET /api/blessing/hourly-stats
 * Returns:
 *   - currentHour rankings (top 10 by activity this hour)
 *   - lastHour winners (top 3 + reward amounts)
 *   - hourlyConfig (reward amount per position)
 *   - nextRewardAt (ISO timestamp of next :00:00)
 *
 * Activity is updated each time /api/blessing/score is called for a wallet,
 * and each time the CC community is polled for new posts.
 * No cron required — lazy evaluation on each request.
 */

import { kv } from '@vercel/kv';
import { cors } from './_config.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const now        = new Date();
    const hourBucket = getHourBucket(now);          // e.g. "2025-05-30T14"
    const prevBucket = getHourBucket(new Date(now.getTime() - 3_600_000));

    /* ── Current hour top 10 ── */
    const currentRaw = await kv.zrange(`hourly:${hourBucket}`, 0, 9, {
      rev: true,
      withScores: true,
    }).catch(() => []);

    const currentHour = parseLeaderboard(currentRaw);

    /* ── Last hour winners (stored when hour rolled over) ── */
    let lastHour = await kv.get(`hourly:winners:${prevBucket}`).catch(() => null);

    /* ── If last hour winners not yet stored, compute them now ── */
    if (!lastHour) {
      const prevRaw = await kv.zrange(`hourly:${prevBucket}`, 0, 9, {
        rev: true,
        withScores: true,
      }).catch(() => []);

      if (prevRaw.length > 0) {
        const prevEntries = parseLeaderboard(prevRaw);
        lastHour = buildWinners(prevEntries);
        // Cache it
        await kv.set(`hourly:winners:${prevBucket}`, lastHour, {
          ex: 7 * 24 * 60 * 60, // keep 1 week
        }).catch(() => {});
      }
    }

    /* ── Hourly reward config ── */
    const config = await kv.get('hourly:config').catch(() => null) || {
      active:    true,
      rewards:   ['0.05 SOL', '0.03 SOL', '0.02 SOL'], // 1st, 2nd, 3rd
      currency:  'SOL',
      note:      'Distributed manually within 1 hour of each winner',
    };

    /* ── Next reward timestamp ── */
    const nextRewardAt = getNextHourISO(now);

    return res.status(200).json({
      currentHour,
      lastHour,
      config,
      nextRewardAt,
      hourBucket,
      prevBucket,
    });

  } catch (e) {
    console.error('[hourly-stats]', e);
    return res.status(500).json({ error: 'Failed', currentHour: [], lastHour: null });
  }
}

/* ─── Helpers ─── */

function getHourBucket(date) {
  // "2025-05-30T14" — unique per hour
  return date.toISOString().slice(0, 13);
}

function getNextHourISO(now) {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next.toISOString();
}

function parseLeaderboard(raw) {
  // raw is [{member, score}, ...] from Vercel KV zrange withScores
  const items = Array.isArray(raw?.[0]?.member !== undefined ? raw : [])
    ? raw
    : chunkPairs(raw);

  return items.map((item, i) => {
    const wallet = item.member || item[0];
    const score  = parseInt(item.score || item[1] || 0);
    return {
      position:    i + 1,
      wallet,
      walletShort: wallet ? wallet.slice(0, 4) + '…' + wallet.slice(-4) : '—',
      activityScore: score,
      // score = posts*25 + replies*10 + likes*5
      estimatedPosts:   Math.floor(score / 25),
    };
  });
}

function buildWinners(entries) {
  return entries.slice(0, 3).map((e, i) => ({
    position: i + 1,
    wallet:      e.wallet,
    walletShort: e.walletShort,
    activityScore: e.activityScore,
    medal: ['🥇','🥈','🥉'][i],
  }));
}

function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push({ member: arr[i], score: arr[i + 1] });
  }
  return out;
}
