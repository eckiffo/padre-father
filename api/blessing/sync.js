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
import { kvGet, kvSet, kvZadd, kvZscore, kvExpire } from './_kv.js';

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

    // Use KV-refreshed token if available, fall back to env var
    const freshToken = await kvGet('cc:access_token');
    const accessToken = freshToken || process.env.CC_ACCESS_TOKEN || null;

    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: {
        'x-api-key': CC_API_KEY,
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
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

          // Fetch hold data from Solana for this wallet (best-effort, non-blocking)
          try {
            const holdData = await fetchHoldData(wallet);
            if (holdData.balance > 0) {
              // Merge into wallet KV record so leaderboard can show holdDays + balance
              await kvSet(
                `wallet:${wallet}`,
                {
                  wallet,
                  balance:   holdData.balance,
                  holdDays:  holdData.holdDays,
                  holdStart: holdData.holdStart,
                  holdScore: holdData.holdScore,
                  socialScore,
                  posts, replies, likes,
                  score: socialScore + holdData.holdScore,
                  lastUpdated: new Date().toISOString(),
                },
                { ex: 2 * 60 * 60 } // 2h TTL — sync refreshes every 15min
              );
              await kvZadd('leaderboard', { score: socialScore + holdData.holdScore, member: wallet });
            }
          } catch (_) {}

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

/* ── Fetch token balance + hold duration for a wallet ── */
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

async function fetchHoldData(wallet) {
  const result = { balance: 0, holdDays: 0, holdStart: null, holdScore: 0 };
  if (!TOKEN_ADDR) return result;
  try {
    const { Connection, PublicKey } = await import('@solana/web3.js');
    const conn = new Connection(RPC_URL, { commitment: 'confirmed', disableRetryOnRateLimit: true });
    const accounts = await conn.getParsedTokenAccountsByOwner(
      new PublicKey(wallet),
      { mint: new PublicKey(TOKEN_ADDR) },
      'confirmed'
    );
    if (!accounts.value.length) return result;
    const ta      = accounts.value[0];
    const balance = parseFloat(ta.account.data.parsed.info.tokenAmount.uiAmount || 0);
    if (balance === 0) return result;
    result.balance = balance;

    // Get oldest tx on the token account to determine hold start
    try {
      const sigs = await conn.getSignaturesForAddress(ta.pubkey, { limit: 1000 }, 'confirmed');
      if (sigs.length > 0) {
        const oldest = sigs[sigs.length - 1];
        result.holdStart = oldest.blockTime
          ? new Date(oldest.blockTime * 1000).toISOString()
          : new Date().toISOString();
      }
    } catch (_) {
      result.holdStart = new Date().toISOString();
    }

    const holdDays = Math.floor((Date.now() - new Date(result.holdStart).getTime()) / 86400000);
    result.holdDays = holdDays;

    const { hold } = SCORE_CONFIG;
    if (holdDays >= 30)     result.holdScore = hold.month;
    else if (holdDays >= 7) result.holdScore = hold.week;
    else if (holdDays >= 1) result.holdScore = hold.day;
  } catch (e) {
    console.warn('[sync] fetchHoldData failed for', wallet, e.message);
  }
  return result;
}
