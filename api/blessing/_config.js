/* ═══════════════════════════════════════════════════════════════
   $PADRE Blessing System — Shared Config
   Imported by all /api/blessing/* routes
   ═══════════════════════════════════════════════════════════════ */

export const RANKS = [
  { name: 'Sinner',       min: 0,     max: 99,       icon: '😈', rewardEligible: false },
  { name: 'Believer',     min: 100,   max: 499,      icon: '🙏', rewardEligible: false },
  { name: 'Congregation', min: 500,   max: 1999,     icon: '⛪', rewardEligible: true  },
  { name: 'Disciple',     min: 2000,  max: 4999,     icon: '📿', rewardEligible: true  },
  { name: 'Cardinal',     min: 5000,  max: 14999,    icon: '🔴', rewardEligible: true  },
  { name: 'Saint',        min: 15000, max: Infinity, icon: '✝',  rewardEligible: true  },
];

export const SCORE_CONFIG = {
  hold: {
    day:    10,
    week:   100,
    month:  500,
    top1pct:  500,
    top10pct: 200,
  },
  social: {
    post:  25,
    reply: 10,
    like:   5,
  },
  referral: {
    perWallet: 200,
  },
};

// 50% of fees goes to holder pool, split proportionally by Blessing Score
export const HOLDER_FEE_SHARE = 0.5;
export const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes

export function getRankForScore(score) {
  return [...RANKS].reverse().find(r => score >= r.min) || RANKS[0];
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
