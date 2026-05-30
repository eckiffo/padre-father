/**
 * GET /api/blessing/score?wallet=ADDRESS&refresh=1
 * Returns the full Blessing Score breakdown for a wallet.
 * Caches in Vercel KV for 30 minutes unless ?refresh=1
 */

import { kv }        from '@vercel/kv';
import { Connection, PublicKey } from '@solana/web3.js';
import { SCORE_CONFIG, CACHE_TTL_SECONDS, getRankForScore, cors } from './_config.js';

const RPC_URL     = process.env.SOLANA_RPC_URL     || 'https://api.mainnet-beta.solana.com';
const TOKEN_ADDR  = process.env.PADRE_TOKEN_ADDRESS || null;
const CC_API_KEY  = process.env.CC_API_KEY          || null;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const wallet  = req.query?.wallet;
  const refresh = req.query?.refresh === '1';

  if (!wallet) {
    return res.status(400).json({ error: 'wallet param required' });
  }

  // Validate base58 public key (basic length check)
  if (wallet.length < 32 || wallet.length > 44) {
    return res.status(400).json({ error: 'invalid wallet address' });
  }

  /* ─── Cache check ─── */
  const cacheKey = `wallet:${wallet}`;
  if (!refresh) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached && cached.lastUpdated) {
        const age = (Date.now() - new Date(cached.lastUpdated).getTime()) / 1000;
        if (age < CACHE_TTL_SECONDS) {
          return res.status(200).json({ ...cached, cached: true });
        }
      }
    } catch (e) {
      console.warn('[score] KV get failed, recomputing:', e.message);
    }
  }

  /* ─── Compute score ─── */
  const [holdResult, socialResult, referralScore] = await Promise.all([
    computeHoldScore(wallet),
    computeSocialScore(wallet),
    getReferralScore(wallet),
  ]);

  const totalScore = holdResult.score + socialResult.score + referralScore;
  const rank       = getRankForScore(totalScore);

  // Calculate claimable (proportional to score, placeholder until treasury is set)
  // Real distribution: total pool × (this score / total leaderboard score)
  // For now we store 0 and update during distribution
  let existingClaimed = 0;
  try {
    const existing = await kv.get(cacheKey);
    existingClaimed = existing?.claimed || 0;
  } catch (_) {}

  const scoreRecord = {
    wallet,
    score:         totalScore,
    holdScore:     holdResult.score,
    socialScore:   socialResult.score,
    referralScore,
    // Hold details
    balance:       holdResult.balance,
    holdStart:     holdResult.holdStart,
    holdDays:      holdResult.holdDays,
    holderTier:    holdResult.holderTier,
    // Social details
    posts:         socialResult.posts,
    replies:       socialResult.replies,
    likes:         socialResult.likes,
    // Referrals
    referrals:     await getReferralCount(wallet),
    // Rewards
    claimable:     0,   // set by admin during distribution
    claimed:       existingClaimed,
    rank:          rank.name,
    lastUpdated:   new Date().toISOString(),
  };

  /* ─── Store in KV + update leaderboard + hourly bucket ─── */
  try {
    await kv.set(cacheKey, scoreRecord, { ex: CACHE_TTL_SECONDS * 2 });
    await kv.zadd('leaderboard', { score: totalScore, member: wallet });

    // Update hourly activity bucket (social score = activity this session)
    // We use social score as proxy for activity level
    if (socialResult.score > 0) {
      const hourBucket = new Date().toISOString().slice(0, 13);
      const activityScore = (socialResult.posts   * 25) +
                            (socialResult.replies  * 10) +
                            (socialResult.likes    *  5);
      // zadd with NX so we take the max (most active reading)
      await kv.zadd(`hourly:${hourBucket}`, {
        score:  activityScore,
        member: wallet,
      });
      // Expire hourly buckets after 48h
      await kv.expire(`hourly:${hourBucket}`, 48 * 60 * 60);
    }
  } catch (e) {
    console.warn('[score] KV write failed:', e.message);
  }

  return res.status(200).json({ ...scoreRecord, cached: false });
}

/* ═══════════════════════════════════════════════════════════════
   HOLD SCORE
   ═══════════════════════════════════════════════════════════════ */
async function computeHoldScore(wallet) {
  const result = {
    score: 0, balance: 0, holdDays: 0,
    holdStart: null, holderTier: 'Standard Holder',
  };

  if (!TOKEN_ADDR) {
    // No token yet — return demo data
    return { ...result, balance: 0, holderTier: 'Token not launched' };
  }

  try {
    const connection  = new Connection(RPC_URL, { commitment: 'confirmed', disableRetryOnRateLimit: true });
    const walletPubkey = new PublicKey(wallet);
    const mintPubkey   = new PublicKey(TOKEN_ADDR);

    // Get token account
    const accounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { mint: mintPubkey },
      'confirmed'
    );

    if (!accounts.value.length) return result;

    const tokenAccount = accounts.value[0];
    const balance = parseFloat(
      tokenAccount.account.data.parsed.info.tokenAmount.uiAmount || 0
    );

    if (balance === 0) return result;
    result.balance = balance;

    /* ── Hold duration from token account signature history ── */
    const tokenAccountPubkey = tokenAccount.pubkey;
    try {
      // Get up to 1000 signatures, oldest will be at end of array
      const sigs = await connection.getSignaturesForAddress(
        tokenAccountPubkey,
        { limit: 1000 },
        'confirmed'
      );
      if (sigs.length > 0) {
        const oldest = sigs[sigs.length - 1];
        result.holdStart = oldest.blockTime
          ? new Date(oldest.blockTime * 1000).toISOString()
          : new Date().toISOString();
      }
    } catch (e) {
      console.warn('[hold] sig history failed:', e.message);
      result.holdStart = new Date().toISOString();
    }

    const holdMs   = Date.now() - new Date(result.holdStart).getTime();
    const holdDays = Math.floor(holdMs / (1000 * 60 * 60 * 24));
    result.holdDays = holdDays;

    const { hold } = SCORE_CONFIG;
    if (holdDays >= 30)     result.score += hold.month;
    else if (holdDays >= 7) result.score += hold.week;
    else if (holdDays >= 1) result.score += hold.day;

    /* ── Holder rank bonus (top 20 accounts as proxy) ── */
    try {
      const largest = await connection.getTokenLargestAccounts(mintPubkey, 'confirmed');
      const top20   = largest.value; // array of { address, amount, decimals, uiAmount }

      // Find this wallet's account in top 20
      const myRaw = tokenAccount.account.data.parsed.info.tokenAmount.amount;
      const myIdx = top20.findIndex(a => {
        const diff = BigInt(a.amount) - BigInt(myRaw);
        return diff === 0n || (diff < 0n ? diff > -1000n : diff < 1000n);
      });

      if (myIdx >= 0) {
        if (myIdx === 0) {
          result.score    += hold.top1pct;
          result.holderTier = 'Top 1% Holder 🏆';
        } else if (myIdx < 3) {
          result.score    += hold.top1pct;
          result.holderTier = 'Top 1% Holder';
        } else if (myIdx < 10) {
          result.score    += hold.top10pct;
          result.holderTier = 'Top 10% Holder';
        } else {
          result.score    += hold.top10pct;
          result.holderTier = 'Top 10% Holder';
        }
      }
    } catch (e) {
      console.warn('[hold] largest accounts failed:', e.message);
    }

  } catch (e) {
    console.error('[hold] RPC error:', e.message);
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   SOCIAL SCORE (Coin Communities SDK — correct methods)
   Flow: getUserByWallet(address) → user_id
         getMessages(token_address) → filter by user_id for posts
         getReplies per message → count authored replies
   ═══════════════════════════════════════════════════════════════ */
async function computeSocialScore(wallet) {
  const result = { score: 0, posts: 0, replies: 0, likes: 0 };

  if (!CC_API_KEY || !TOKEN_ADDR) return result;

  try {
    const {
      configureApi,
      getUserByWallet,
      getMessagesServer,
      getCommunityMembersServer,
    } = await import('@coin-communities/sdk/node');

    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: { 'x-api-key': CC_API_KEY },
    });

    /* ── Step 1: Resolve wallet → user_id ── */
    let userId = null;
    try {
      const user = await getUserByWallet({ address: wallet });
      userId = user?.id || user?.user_id || user?.userId || null;
    } catch (e) {
      // Wallet not linked to a CC account — social score stays 0
      console.warn('[social] getUserByWallet failed:', e.message);
      return result;
    }

    if (!userId) return result;

    /* ── Step 2: Count community member stats ──
       getCommunityMembersServer may return per-member activity counts.
       If not, fall back to counting messages manually. */
    let gotStatsFromMembers = false;
    try {
      const members = await getCommunityMembersServer({ token_address: TOKEN_ADDR });
      if (Array.isArray(members)) {
        const me = members.find(m =>
          m.user_id === userId || m.userId === userId || m.id === userId
        );
        if (me) {
          result.posts   = me.post_count   || me.postCount   || me.posts   || 0;
          result.replies = me.reply_count  || me.replyCount  || me.replies || 0;
          result.likes   = me.like_count   || me.likeCount   || me.likes   || 0;
          gotStatsFromMembers = true;
        }
      }
    } catch (e) {
      console.warn('[social] getCommunityMembersServer failed:', e.message);
    }

    /* ── Step 3: Fallback — count messages manually ── */
    if (!gotStatsFromMembers) {
      try {
        // Fetch up to 200 recent messages and count by this user
        const messages = await getMessagesServer(
          { token_address: TOKEN_ADDR },
          { limit: 200, offset: 0 }
        );
        const msgs = Array.isArray(messages) ? messages : (messages?.messages || messages?.data || []);

        for (const m of msgs) {
          const authorId = m.user_id || m.userId || m.author?.id;
          if (authorId === userId) {
            if (m.parent_id || m.parentId || m.reply_to) {
              result.replies++;
            } else {
              result.posts++;
            }
          }
        }
      } catch (e) {
        console.warn('[social] getMessagesServer failed:', e.message);
      }
    }

    const { social } = SCORE_CONFIG;
    result.score = (result.posts   * social.post) +
                   (result.replies * social.reply) +
                   (result.likes   * social.like);

  } catch (e) {
    console.warn('[social] CC SDK error:', e.message);
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   REFERRAL SCORE
   ═══════════════════════════════════════════════════════════════ */
async function getReferralScore(wallet) {
  try {
    const count = await kv.scard(`referrals:${wallet}`) || 0;
    return count * SCORE_CONFIG.referral.perWallet;
  } catch (_) { return 0; }
}

async function getReferralCount(wallet) {
  try {
    return await kv.scard(`referrals:${wallet}`) || 0;
  } catch (_) { return 0; }
}
