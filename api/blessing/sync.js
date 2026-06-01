/**
 * GET /api/blessing/sync
 * Cron: runs every 15 minutes via vercel.json
 * Also callable manually: GET /api/blessing/sync?secret=SYNC_SECRET
 *
 * Fetches all $PADRE community members from CC SDK,
 * then for each member with a linked wallet:
 *   - Updates `leaderboard` sorted set with their social score
 *   - Updates `hourly:YYYY-MM-DDTHH` with their activity points
 *   - Writes `wallet:${address}` social sub-record for score.js to merge
 *
 * This is the engine that makes Blessing Scores accumulate
 * without waiting for users to manually hit /api/blessing/score.
 */

import { SCORE_CONFIG, cors } from './_config.js';
import { kvSet, kvZadd, kvZscore, kvExpire } from './_kv.js';

const TOKEN_ADDR = process.env.PADRE_TOKEN_ADDRESS || null;
const CC_API_KEY = process.env.CC_API_KEY          || null;
const SYNC_SECRET = process.env.SYNC_SECRET        || null;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Allow GET (from cron) or POST (manual trigger)
  // If SYNC_SECRET is set, require it (except for Vercel cron which sends Authorization header)
  const cronHeader = req.headers['authorization'] || '';
  const secretParam = req.query?.secret;
  const isCron = cronHeader === `Bearer ${process.env.CRON_SECRET || ''}`;
  const isManual = SYNC_SECRET && secretParam === SYNC_SECRET;
  const isOpen = !SYNC_SECRET;

  if (!isCron && !isManual && !isOpen) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!TOKEN_ADDR || !CC_API_KEY) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'Token not launched yet' });
  }

  const startedAt = Date.now();
  let processed = 0;
  let errors = 0;

  try {
    const { configureApi, api } = await import('@coin-communities/sdk/node');

    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: { 'x-api-key': CC_API_KEY },
    });

    // getMessagesPublic returns walletAddress on every message — no server key needed
    // Count posts/replies per wallet from recent messages
    const msgsRes = await api.getMessagesPublic({
      path:  { token_address: TOKEN_ADDR },
      query: { limit: 200 },
    });
    const raw  = msgsRes?.data;
    const msgs = Array.isArray(raw) ? raw : (raw?.messages || raw?.data || []);

    // Aggregate counts per wallet
    const walletMap = {};
    for (const m of msgs) {
      const w = m.walletAddress || m.wallet_address;
      if (!w || w.length < 32) continue;
      if (!walletMap[w]) walletMap[w] = { posts: 0, replies: 0, likes: 0 };
      if (m.parentMessageId || m.parent_message_id) walletMap[w].replies++;
      else walletMap[w].posts++;
      walletMap[w].likes += m.likeCount || m.like_count || 0;
    }

    const list = Object.entries(walletMap).map(([wallet, counts]) => ({ wallet, ...counts }));

    if (list.length === 0) {
      return res.status(200).json({ ok: true, processed: 0, reason: 'No community members returned' });
    }

    const hourBucket = new Date().toISOString().slice(0, 13);
    const { social } = SCORE_CONFIG;

    // Process all members in parallel (batched to avoid KV rate limits)
    const BATCH = 20;
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      await Promise.all(batch.map(async (m) => {
        try {
          const wallet  = m.wallet; // shape from walletMap: { wallet, posts, replies, likes }
          if (!wallet || wallet.length < 32) return;

          const posts   = m.posts   || 0;
          const replies = m.replies || 0;
          const likes   = m.likes   || 0;

          const socialScore    = (posts * social.post) + (replies * social.reply) + (likes * social.like);
          const activityPoints = socialScore; // same formula for hourly race

          if (socialScore === 0) return; // no activity, nothing to record

          // Update the persistent leaderboard (social score component only — hold score added on demand)
          // We store the raw social score under a separate key so score.js can read it without re-fetching CC
          await kvSet(
            `social:${wallet}`,
            { posts, replies, likes, score: socialScore, updatedAt: new Date().toISOString() },
            { ex: 7 * 24 * 60 * 60 }
          );

          // Update hourly activity bucket (use max so re-runs don't double-count)
          const currentHourly = await kvZscore(`hourly:${hourBucket}`, wallet);
          if (currentHourly === null || activityPoints > currentHourly) {
            await kvZadd(`hourly:${hourBucket}`, { score: activityPoints, member: wallet });
            await kvExpire(`hourly:${hourBucket}`, 48 * 60 * 60);
          }

          await kvZadd('leaderboard:social', { score: socialScore, member: wallet });

          processed++;
        } catch (e) {
          console.warn('[sync] member error:', e.message);
          errors++;
        }
      }));
    }

    // Record last sync metadata
    await kvSet('sync:last', {
      at: new Date().toISOString(),
      processed,
      errors,
      memberCount: list.length,
      durationMs: Date.now() - startedAt,
    }, { ex: 24 * 60 * 60 }).catch(() => {});

    return res.status(200).json({
      ok: true,
      processed,
      errors,
      memberCount: list.length,
      durationMs: Date.now() - startedAt,
    });

  } catch (e) {
    console.error('[sync]', e);
    return res.status(500).json({ error: 'Sync failed', message: e.message });
  }
}
