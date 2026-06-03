# $PADRE — Father of Trenches
## Project Overview

Static site for the $PADRE Solana memecoin. Deployed on Vercel at **trenchfather.fun**.
Stack: vanilla HTML/CSS/JS, no build step, Vercel serverless functions in `/api`.

Father Agent bot lives at `/root/father-agent` on VPS `76.13.248.249` (root / `PD-B'fr,L@mw9bon;cU1`).
Managed via PM2 as `father-agent`. Deploy by SFTPing files + `pm2 restart father-agent`.

---

## CA / Token Address

`HNVYhd7CMfCYDgDiRBKzx1gvZVqYohjMMFmRS1n8pump`

Set in **`js/config.js`** — one file, one line:
```js
window.PADRE_CA = 'HNVYhd7CMfCYDgDiRBKzx1gvZVqYohjMMFmRS1n8pump';
```
Server-side functions read from Vercel env var `PADRE_TOKEN_ADDRESS`.

---

## File Structure

```
/
├── index.html              Homepage
├── flywheel.html           THE most important page — reward flywheel explainer
├── rewards.html            Technical reward system details
├── dashboard.html          Wallet connect + Blessing Score
├── leaderboard.html        All-time + hourly leaderboard
├── about.html
├── plan-to-ape.html
├── livestream.html
├── sermons.html
├── scripture.html
├── roadmap.html
├── confessional.html
├── offerings.html
├── request-blessing.html
├── connect-wallet.html
├── overlay.html            OBS Browser Source — ticker + buy/holder/post toasts (1920×1080)
├── candle-widget.html      OBS Browser Source — 320×420 candle stage widget
├── bagworkers-overlay.html OBS Browser Source — 400×520 hourly top 5 bag workers
├── chat-overlay.html       OBS Browser Source — 400×600 live coincommunities chat feed
├── css/
│   ├── main.css            Global styles, design tokens, all components
│   ├── blessing.css        Dashboard / leaderboard / rewards shared styles
│   ├── roadmap.css         Roadmap candle section
│   ├── candle-widget.css   OBS candle widget
│   └── overlay.css         OBS overlay (all white accent, no green)
├── js/
│   ├── config.js           ← CA set here
│   ├── main.js             Homepage: candles, particles, stats, CA copy, Dexscreener embed
│   ├── roadmap.js          Live roadmap candle section (homepage)
│   ├── overlay.js          OBS overlay: Solana WS buy detection, community posts
│   ├── candle-widget.js    OBS candle widget: Dexscreener polling, stage logic
│   ├── blessing-dashboard.js  Wallet connect, score render, hourly race
│   └── blessing-leaderboard.js  Leaderboard table
├── img/
│   ├── padre-priest-ocean.jpg
│   ├── padre-banner.jpg
│   └── padre-social-card.jpg
└── videos/
    ├── padre-hero-1.mp4    (drop in to activate hero video)
    └── padre-hero-2.mp4
```

---

## Design System

**Colors (css/main.css `:root`):**
- `--gold-primary: #00E676` — pump.fun green, main accent
- `--gold-bright: #39FF14` — neon green hover
- `--gold-mid: #00C853`, `--gold-dark: #00962E`, `--gold-deep: #00581A`
- `--bg-void: #000000`, `--bg-deep: #080808`, `--bg-dark: #0D0D0D`
- `--bg-card: #111111`, `--bg-border: #222222`
- `--text-white: #FFFFFF`, `--text-secondary: #BBBBBB`, `--text-muted: #777777`

**overlay.css** uses all-white accents (`--gold: #FFFFFF`) — separate from main site.

**Fonts:** Cinzel Decorative (display), Cinzel (heading), IM Fell English (body), UnifrakturMaguntia (fraktur numerals)

---

## THE COMMUNITY REWARD SYSTEM (aka The Reward Flywheel)

### Fee Flow
- **100% of all trading fees** go to dev wallet (`8YnUQEZY9beCZQMiTcB8wswUrouW6naJj6W3MgCGerVA`)
- When fees arrive: bot detects SOL deposit → DMs Ray → Ray approves → **50% buyback** via pumpdev.io
- Bought tokens split: **50% to hourly bag workers** / **50% → weekly pool**
- **Weekly pool** distributed every Sunday to qualifying holders

### Fee Collection Flow (LIVE)
1. Ray manually collects fees from pump.fun UI
2. Bot's fee deposit watcher (`logsSubscribe` on dev wallet) detects incoming SOL
3. Bot DMs Ray: "Received X SOL — buyback Y SOL?" 
4. Ray `/approve` → pumpdev.io executes buy → tokens distributed
- pumpdev.io endpoint: `POST https://pumpdev.io/api/trade-lightning` with `X-Api-Key` header

### Hourly Race
- Points this hour: posts × 25 + replies × 10 + likes × 5
- **Top workers** split 50% of hourly buyback tokens proportionally by points
- Resets every hour, no activity → all rolls to weekly pool

### Weekly Distribution (Every Sunday)
- Qualifying: hold > 0, 500+ pts, held 7+ days, did not sell
- Distribution by Blessing Score weight (Saint > Cardinal > Disciple > Congregation)

### Rank Tiers
| Rank | Points | Benefit |
|------|--------|---------|
| Sinner | 0–99 | No rewards |
| Believer | 100–499 | Stream shoutout |
| Congregation | 500–1,999 | Weekly eligible |
| Disciple | 2,000–4,999 | Bigger share + badge |
| Cardinal | 5,000–14,999 | Priority share |
| Saint | 15,000+ | Largest share |

---

## Father Agent Bot (VPS — `/home/ray/father-agent`)

### Key Files
| File | Purpose |
|------|---------|
| `agent.js` | Main process — all crons, sell/buy detector, fee watcher, quote poster |
| `distribution.js` | Hourly + weekly distribution logic, pumpdev.io buyback |
| `telegram.js` | Telegram bot, approval flow |
| `personality.js` | Claude API, Father character, quote generation |
| `community.js` | CoinCommunities WebSocket watcher + poster |
| `solana.js` | Token sends, wallet balance, RPC calls |
| `x.js` | X/Twitter OAuth 1.0a poster (currently 401 — broken) |
| `state.js` | Persistent JSON state |

### Cron Jobs (node-cron)
| Schedule | Job |
|----------|-----|
| `0 * * * *` | Hourly community fee announcement post |
| `5 * * * *` | Hourly distribution (asks Ray to approve buyback) |
| `*/10 * * * *` | Father quote posted to coincommunities |
| `*/15 * * * *` | Milestone check (MC $100K/$500K/$1M) |
| `0 1 * * 1` | Weekly distribution (Sunday) |
| `0 */6 * * *` | Heartbeat DM to Ray |

### Telegram Commands
```
/approve <id>   — approve pending buyback/distribution
/skip <id>      — skip this round
/pending        — list pending approvals
/post <msg>     — post to community as The Father
/father <topic> — Claude writes it, you confirm
/confirm        — post the Claude draft
/cancel         — discard draft
/reply <id> <msg> — reply to community post
/xpost <topic>  — write X post draft (X still broken)
/posts          — show last 5 community posts
/balance        — dev wallet SOL + $PADRE balance
/status         — uptime + last hourly/weekly run
/help           — command list
```

### Always-On Watchers
- **Sell detector** — `logsSubscribe` on token address → shame post + Telegram alert
- **Buy detector** — same WS → buy alert, new holder welcome, big buy X post
- **Fee deposit watcher** — `logsSubscribe` on dev wallet → detects incoming SOL → triggers buyback approval

---

## OBS Browser Sources

| File | Size | Purpose |
|------|------|---------|
| `overlay.html` | 1920×1080 | Main overlay: ticker, buy toasts, sell toasts, community posts |
| `candle-widget.html` | 320×420 | Candle stage widget (Ember→Holy based on MC) |
| `bagworkers-overlay.html` | 400×520 | Live hourly top 5 bag workers leaderboard |
| `chat-overlay.html` | 400×600 | Live coincommunities chat feed with WS + poll fallback |

---

## API Routes (Vercel Serverless)
```
/api/community              GET community posts
/api/blessing/score         GET wallet blessing score (fetches Solana hold data live)
/api/blessing/claim         POST claim rewards
/api/blessing/referral      POST register referral
/api/blessing/leaderboard   GET top 50 wallets
/api/blessing/hourly-stats  GET current + last hour race data
/api/blessing/sync          GET sync social scores + hold data (manual: ?secret=padre_sync_2026)
/api/blessing/sync?action=refresh-token  Refresh CC access token (daily cron at 8am UTC)
/api/ws-ticket              GET community WS auth ticket
```

---

## Vercel Environment Variables (all set in Production)
```
PADRE_TOKEN_ADDRESS     HNVYhd7CMfCYDgDiRBKzx1gvZVqYohjMMFmRS1n8pump
CC_API_KEY              cc_ea5be553...
CC_SERVER_KEY           cck_b91c0fa...
CC_SERVER_SECRET        ccs_4c1aee3...
CC_ACCESS_TOKEN         JWT (expires ~24h — auto-refreshed daily by cron)
CC_REFRESH_TOKEN        JWT (expires 28d)
CC_BOT_TWITTER_ID       2060718028283654144
DEV_WALLET_ADDRESS      8YnUQEZY9beCZQMiTcB8wswUrouW6naJj6W3MgCGerVA
SOLANA_RPC_URL          https://api.mainnet-beta.solana.com
SITE_URL                https://trenchfather.fun
SYNC_SECRET             padre_sync_2026
CRON_SECRET             padre_cron_2026
KV_*                    Upstash Redis (set by Vercel KV integration)
```

**Note:** Vercel Hobby plan = max 12 serverless functions, 1 cron/day max.
Current function count: 12 (at limit — do not add more without removing one).

---

## Blessing Score Sync

`/api/blessing/sync` — manually triggered or called by agent.
- Fetches all community members from CC SDK
- For each wallet: writes `social:{wallet}` to KV + updates hourly bucket + leaderboard
- **Now also fetches hold data from Solana RPC** (balance, holdDays, holdStart) for each wallet
- Merges into `wallet:{address}` KV record so leaderboard shows real hold data
- CC access token auto-refreshed daily at 8am UTC via `?action=refresh-token`

**Known issue:** Hold data only shows for wallets that have posted in community (wallet address must be in CC messages). Dev wallet shows 0 $PADRE because it genuinely holds 0 — needs tokens bought into it.

---

## Third-Party Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| **pumpdev.io** | Buyback transactions via Lightning API | ✅ Working (tested live) |
| **Dexscreener** | Volume, price, MC data | ✅ Working |
| **Solana RPC** | Wallet tracking, sell detection, balance checks | ✅ Working |
| **CoinCommunities SDK** | Social scoring, posting as Father | ✅ Working |
| **Anthropic Claude** | Father personality, quote generation | ✅ Working |
| **Telegram Bot** | Ray's control panel, approvals | ✅ Working |
| **X/Twitter API** | Auto-posting as @fatherofpumpfun | ❌ 401 Unauthorized (OAuth issue) |
| **Vercel KV (Upstash)** | Leaderboard, score cache, hourly buckets | ✅ Working |

---

## System Status (as of 2026-06-03)

### ✅ Working
- Community reward system end-to-end (fee detect → buyback → distribute)
- Pumpdev.io buyback (tested, got real tx signature)
- Father quotes posting to coincommunities every 10 minutes
- Hourly fee announcement to coincommunities
- Sell shaming + buy alerts via Solana WebSocket
- Telegram approval flow (approve/skip buybacks)
- Leaderboard + hourly race showing real data
- Bagworkers OBS overlay
- Live chat OBS overlay
- All Vercel env vars set + deployed
- CC access token daily auto-refresh cron
- Blessing score dashboard (social score working)

### ❌ Broken / Incomplete
- **X/Twitter posting** — persistent 401 despite new keys. Tried: new consumer keys, new access token, twitter-api-v2 library. Possible fix: set up Account Automation on @fatherofpumpfun in X Settings
- **Dashboard hold data = 0** — dev wallet holds 0 $PADRE. Buy some $PADRE into `8YnU…erVA` to fix
- **Sync job frequency** — Vercel Hobby only allows 1 cron/day. Sync runs manually or when score page is visited. Consider upgrading to Pro ($20/mo) for 15-min sync

### ⚠️ Watch Out For
- CC access token expires every ~24h — daily cron refreshes at 8am UTC. If cron misses, call `/api/blessing/sync?action=refresh-token&secret=padre_sync_2026` manually
- pumpdev.io API key: `evtT_beiiNN6LkpeBZqGPDNRU2zwCDiCCEX5gd1fcQ-Wixdkgww41P7ookvtOZ6R`
- Father quote every 10 min = ~144 CC API calls/day — monitor for rate limits

---

## Next Priorities
1. Fix X/Twitter 401 — enable Account Automation on @fatherofpumpfun
2. Buy $PADRE into dev wallet so hold score shows on dashboard
3. Explore pump-fun SDK for auto fee collection (permissionless `collect_creator_fee_v2`)
4. Consider Vercel Pro for 15-min sync cron
5. pump-fun-skills repo — `coin-fees` skill has fee inspection + collection tools worth integrating
