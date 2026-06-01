/**
 * GET /api/blessing/score?wallet=ADDRESS&refresh=1
 * Returns the full Blessing Score breakdown for a wallet.
 * Caches in Vercel KV for 30 minutes unless ?refresh=1
 */

// @solana/web3.js imported lazily inside computeHoldScore to avoid Vercel cold-start crashes
import { SCORE_CONFIG, CACHE_TTL_SECONDS, getRankForScore, cors } from './_config.js';
import { kvGet, kvSet, kvZadd, kvExpire, kvScard } from './_kv.js';

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
    const cached = await kvGet(cacheKey);
    if (cached && cached.lastUpdated) {
      const age = (Date.now() - new Date(cached.lastUpdated).getTime()) / 1000;
      if (age < CACHE_TTL_SECONDS) {
        return res.status(200).json({ ...cached, cached: true });
      }
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
  const existing = await kvGet(cacheKey);
  existingClaimed = existing?.claimed || 0;

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
  await kvSet(cacheKey, scoreRecord, { ex: CACHE_TTL_SECONDS * 2 });
  await kvZadd('leaderboard', { score: totalScore, member: wallet });

  if (socialResult.score > 0) {
    const hourBucket   = new Date().toISOString().slice(0, 13);
    const activityScore = (socialResult.posts   * 25) +
                          (socialResult.replies  * 10) +
                          (socialResult.likes    *  5);
    await kvZadd(`hourly:${hourBucket}`, { score: activityScore, member: wallet });
    await kvExpire(`hourly:${hourBucket}`, 48 * 60 * 60);
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

  if (!TOKEN_ADDR) return { ...result, holderTier: 'Token not launched' };

  try {
    // Lazy import to avoid Vercel cold-start crashes
    const { Connection, PublicKey } = await import('@solana/web3.js');
    const connection   = new Connection(RPC_URL, { commitment: 'confirmed', disableRetryOnRateLimit: true });
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
   SOCIAL SCORE
   Fast path: read from `social:${wallet}` KV cache written by /api/blessing/sync
   Slow path (fallback): query CC SDK directly if no cached data yet
   ═══════════════════════════════════════════════════════════════ */
async function computeSocialScore(wallet) {
  const result = { score: 0, posts: 0, replies: 0, likes: 0 };

  if (!CC_API_KEY || !TOKEN_ADDR) return result;

  // Fast path — sync job pre-populates this every 15 min
  const socialCached = await kvGet(`social:${wallet}`);
  if (socialCached && socialCached.updatedAt) {
    const ageMs = Date.now() - new Date(socialCached.updatedAt).getTime();
    if (ageMs < 20 * 60 * 1000) {
      return {
        score:   socialCached.score   || 0,
        posts:   socialCached.posts   || 0,
        replies: socialCached.replies || 0,
        likes:   socialCached.likes   || 0,
      };
    }
  }

  try {
    // All CC SDK functions live under api.* — not top-level named exports
    const { configureApi, api } = await import('@coin-communities/sdk/node');

    configureApi({
      baseUrl: 'https://api.coin-communities.xyz',
      headers: { 'x-api-key': CC_API_KEY },
    });

    /* Count messages authored by this wallet using getMessagesPublic
       walletAddress is a top-level field on each message — no user lookup needed */
    try {
      const res  = await api.getMessagesPublic({
        path:  { token_address: TOKEN_ADDR },
        query: { limit: 200 },
      });
      const raw  = res?.data;
      const msgs = Array.isArray(raw) ? raw : (raw?.messages || raw?.data || []);

      for (const m of msgs) {
        const msgWallet = m.walletAddress || m.wallet_address;
        if (!msgWallet || msgWallet.toLowerCase() !== wallet.toLowerCase()) continue;
        if (m.parentMessageId || m.parent_message_id || m.parentId) result.replies++;
        else result.posts++;
        // likes given by this user aren't tracked in messages — use 0 or sync job
      }
    } catch (e) {
      console.warn('[social] getMessagesPublic failed:', e.message);
    }

    const { social } = SCORE_CONFIG;
    result.score = (result.posts * social.post) + (result.replies * social.reply) + (result.likes * social.like);

  } catch (e) {
    console.warn('[social] CC SDK error:', e.message);
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   REFERRAL SCORE
   ═══════════════════════════════════════════════════════════════ */
async function getReferralScore(wallet) {
  const count = await kvScard(`referrals:${wallet}`);
  return count * SCORE_CONFIG.referral.perWallet;
}

async function getReferralCount(wallet) {
  return await kvScard(`referrals:${wallet}`);
}
