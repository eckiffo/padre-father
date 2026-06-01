/**
 * GET /api/blessing/leaderboard?limit=50
 *
 * Builds leaderboard from community posts (wallets who have posted)
 * + hold score from Solana RPC for each wallet.
 * No KV dependency — works on Hobby plan with no database.
 *
 * Score = (posts×25 + replies×10 + likes×5) + holdDays×10
 */

import { getRankForScore, SCORE_CONFIG, cors } from './_config.js';
import { kvGet, kvZrange, kvZcard } from './_kv.js';

const TOKEN_ADDR = process.env.PADRE_TOKEN_ADDRESS || null;
const CC_API_KEY = process.env.CC_API_KEY          || null;
const RPC_URL    = process.env.SOLANA_RPC_URL      || 'https://api.mainnet-beta.solana.com';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const limit = Math.min(parseInt(req.query?.limit || '50'), 100);

  /* ── Try KV leaderboard first (fast path if KV is set up) ── */
  const kvEntries = await tryKvLeaderboard(limit);
  if (kvEntries && kvEntries.length > 0) {
    return res.status(200).json({
      entries:   kvEntries,
      total:     kvEntries.length,
      source:    'kv',
      updatedAt: new Date().toISOString(),
    });
  }

  /* ── Fallback: build from community posts (no KV needed) ── */
  if (!CC_API_KEY || !TOKEN_ADDR) {
    return res.status(200).json({
      entries:   [],
      total:     0,
      source:    'empty',
      updatedAt: new Date().toISOString(),
      message:   'Set CC_API_KEY and PADRE_TOKEN_ADDRESS in Vercel env vars',
    });
  }

  try {
    const { configureApi, api } = await import('@coin-communities/sdk/node');
    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: { 'x-api-key': CC_API_KEY },
    });

    // Get all messages to build wallet → activity counts
    const res1  = await api.getMessagesPublic({
      path:  { token_address: TOKEN_ADDR },
      query: { limit: 200 },
    });
    const raw  = res1?.data;
    const msgs = Array.isArray(raw) ? raw : (raw?.messages || raw?.data || []);

    // Aggregate social activity per wallet
    const walletMap = {};
    for (const m of msgs) {
      const wallet = m.walletAddress || m.wallet_address;
      if (!wallet || wallet.length < 32) continue;
      if (!walletMap[wallet]) {
        walletMap[wallet] = { wallet, posts: 0, replies: 0, likes: 0, username: m.username || m.author?.username || '' };
      }
      if (m.parentMessageId || m.parent_message_id) walletMap[wallet].replies++;
      else walletMap[wallet].posts++;
      walletMap[wallet].likes += m.likeCount || m.like_count || 0;
    }

    const wallets = Object.values(walletMap);
    if (wallets.length === 0) {
      return res.status(200).json({ entries: [], total: 0, source: 'community', updatedAt: new Date().toISOString() });
    }

    // Compute scores (include hold score where possible)
    const entries = await Promise.all(wallets.map(async (w) => {
      const { social } = SCORE_CONFIG;
      const socialScore = (w.posts * social.post) + (w.replies * social.reply) + (w.likes * social.like);

      // Try to get hold score from KV cache (populated when wallet visits dashboard)
      const cached   = await kvGet(`wallet:${w.wallet}`);
      const holdScore  = cached?.holdScore  || 0;
      const holdDays   = cached?.holdDays   || 0;
      const balance    = cached?.balance    || 0;
      const totalScore = socialScore + holdScore + (cached?.referralScore || 0);
      const rank       = getRankForScore(totalScore);

      return {
        wallet:      w.wallet,
        walletShort: w.wallet.slice(0, 4) + '…' + w.wallet.slice(-4),
        username:    w.username,
        score:       totalScore,
        socialScore,
        holdScore,
        rank:        rank.name,
        rankIcon:    rank.icon,
        posts:       w.posts,
        replies:     w.replies,
        likes:       w.likes,
        holdDays,
        balance,
      };
    }));

    // Sort by score descending, add position
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => { e.position = i + 1; });

    return res.status(200).json({
      entries:   entries.slice(0, limit),
      total:     entries.length,
      source:    'community',
      updatedAt: new Date().toISOString(),
    });

  } catch (e) {
    console.error('[leaderboard]', e);
    return res.status(500).json({ error: 'Failed', entries: [] });
  }
}

async function tryKvLeaderboard(limit) {
  try {
    const raw = await kvZrange('leaderboard', 0, limit - 1, { rev: true, withScores: true });
    if (!raw || raw.length === 0) return null;

    const items = Array.isArray(raw[0]?.member !== undefined ? raw : []) ? raw : chunkPairs(raw);
    const entries = [];

    for (let i = 0; i < items.length; i++) {
      const wallet = items[i].member || items[i][0];
      const score  = parseInt(items[i].score || items[i][1] || 0);
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
    return entries.length > 0 ? entries : null;
  } catch (_) {
    return null;
  }
}

function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) out.push({ member: arr[i], score: arr[i + 1] });
  return out;
}
