/**
 * GET /api/blessing/hourly-stats
 * Computes hourly race standings from CC community posts — no KV needed.
 * Counts posts/replies/likes per wallet within the current hour bucket.
 */

import { cors } from './_config.js';
import { kvZrange, kvGet, kvSet } from './_kv.js';

const CC_API_KEY  = process.env.CC_API_KEY          || null;
const TOKEN_ADDR  = process.env.PADRE_TOKEN_ADDRESS  || null;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const now        = new Date();
  const hourBucket = getHourBucket(now);
  const prevBucket = getHourBucket(new Date(now.getTime() - 3_600_000));
  const nextRewardAt = getNextHourISO(now);

  /* ── Try KV first (fast, if available) ── */
  const kvCurrent = await kvZrange(`hourly:${hourBucket}`, 0, 9, { rev: true, withScores: true }).catch(() => []);
  if (kvCurrent && kvCurrent.length > 0) {
    const lastHour = await kvGet(`hourly:winners:${prevBucket}`).catch(() => null);
    const config   = await kvGet('hourly:config').catch(() => null) || defaultConfig();
    return res.status(200).json({
      currentHour: parseLeaderboard(kvCurrent),
      lastHour,
      config,
      nextRewardAt,
      hourBucket,
      prevBucket,
      source: 'kv',
    });
  }

  /* ── Fallback: compute from CC community posts ── */
  if (!CC_API_KEY || !TOKEN_ADDR) {
    return res.status(200).json({
      currentHour: [], lastHour: null,
      config: defaultConfig(), nextRewardAt, hourBucket, prevBucket, source: 'empty',
    });
  }

  try {
    const { configureApi, api } = await import('@coin-communities/sdk/node');
    configureApi({ baseUrl: 'https://api.coin-communities.xyz', headers: { 'x-api-key': CC_API_KEY } });

    // Fetch last 200 messages to cover current + last hour
    const res1  = await api.getMessagesPublic({ path: { token_address: TOKEN_ADDR }, query: { limit: 200 } });
    const raw   = res1?.data;
    const msgs  = Array.isArray(raw) ? raw : (raw?.messages || raw?.data || []);

    const hourStart = new Date(now); hourStart.setMinutes(0, 0, 0);
    const prevStart = new Date(hourStart.getTime() - 3_600_000);

    // Aggregate current hour
    const currentMap = {};
    const prevMap    = {};

    for (const m of msgs) {
      const wallet = m.walletAddress || m.wallet_address;
      if (!wallet) continue;
      const ts = new Date(m.createdAt || m.created_at);
      const isReply = !!(m.parentMessageId || m.parent_message_id);

      if (ts >= hourStart) {
        if (!currentMap[wallet]) currentMap[wallet] = { wallet, username: m.username || '', posts: 0, replies: 0, likes: 0, score: 0 };
        if (isReply) { currentMap[wallet].replies++; currentMap[wallet].score += 10; }
        else         { currentMap[wallet].posts++;   currentMap[wallet].score += 25; }
        currentMap[wallet].likes += m.likeCount || 0;
        currentMap[wallet].score += (m.likeCount || 0) * 5;
      } else if (ts >= prevStart) {
        if (!prevMap[wallet]) prevMap[wallet] = { wallet, username: m.username || '', posts: 0, replies: 0, likes: 0, score: 0 };
        if (isReply) { prevMap[wallet].replies++; prevMap[wallet].score += 10; }
        else         { prevMap[wallet].posts++;   prevMap[wallet].score += 25; }
      }
    }

    const currentHour = Object.values(currentMap)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((e, i) => ({
        position:     i + 1,
        wallet:       e.wallet,
        walletShort:  e.wallet.slice(0, 4) + '…' + e.wallet.slice(-4),
        username:     e.username,
        displayName:  e.username ? '@' + e.username : e.wallet.slice(0, 4) + '…' + e.wallet.slice(-4),
        activityScore: e.score,
        posts:        e.posts,
        replies:      e.replies,
        likes:        e.likes,
      }));

    const prevSorted = Object.values(prevMap)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const lastHour = prevSorted.length > 0
      ? prevSorted.map((e, i) => ({
          position:     i + 1,
          wallet:       e.wallet,
          walletShort:  e.wallet.slice(0, 4) + '…' + e.wallet.slice(-4),
          username:     e.username,
          displayName:  e.username ? '@' + e.username : e.wallet.slice(0, 4) + '…' + e.wallet.slice(-4),
          activityScore: e.score,
          medal:        ['🥇','🥈','🥉'][i],
        }))
      : null;

    return res.status(200).json({
      currentHour,
      lastHour,
      config: defaultConfig(),
      nextRewardAt,
      hourBucket,
      prevBucket,
      source: 'community',
    });

  } catch (e) {
    console.error('[hourly-stats]', e);
    return res.status(500).json({ error: 'Failed', currentHour: [], lastHour: null });
  }
}

function getHourBucket(date) { return date.toISOString().slice(0, 13); }
function getNextHourISO(now) {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next.toISOString();
}
function defaultConfig() {
  return { active: true, rewards: ['0.05 SOL', '0.03 SOL', '0.02 SOL'], currency: 'SOL', note: 'Distributed within 1h of each winner' };
}
function parseLeaderboard(raw) {
  const items = Array.isArray(raw[0]?.member !== undefined ? raw : []) ? raw : chunkPairs(raw);
  return items.map((item, i) => {
    const wallet = item.member || item[0];
    const score  = parseInt(item.score || item[1] || 0);
    return { position: i+1, wallet, walletShort: wallet.slice(0,4)+'…'+wallet.slice(-4), activityScore: score };
  });
}
function chunkPairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 2) out.push({ member: arr[i], score: arr[i+1] });
  return out;
}
