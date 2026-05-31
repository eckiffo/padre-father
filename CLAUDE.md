# $PADRE — Father of Trenches
## Project Overview

Static site for the $PADRE Solana memecoin. Deployed on Vercel at **trenchfather.fun**.
Stack: vanilla HTML/CSS/JS, no build step, Vercel serverless functions in `/api`.

---

## CA / Token Address

Set in **`js/config.js`** — one file, one line:
```js
window.PADRE_CA = ''; // ← paste CA here at launch
```
Every page and overlay reads from `window.PADRE_CA`. Change it here, push, done.

Server-side functions read from Vercel env var `PADRE_TOKEN_ADDRESS` (set in Vercel dashboard).

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
├── overlay.html            OBS Browser Source — ticker + buy/holder/post toasts
├── candle-widget.html      OBS Browser Source — 320×420 candle stage widget
├── css/
│   ├── main.css            Global styles, design tokens, all components
│   ├── blessing.css        Dashboard / leaderboard / rewards shared styles
│   ├── roadmap.css         Roadmap candle section
│   ├── candle-widget.css   OBS candle widget
│   └── overlay.css         OBS overlay (all white accent, no green)
├── js/
│   ├── config.js           ← SET CA HERE AT LAUNCH
│   ├── main.js             Homepage: candles, particles, stats, CA copy, Dexscreener embed
│   ├── roadmap.js          Live roadmap candle section (homepage)
│   ├── overlay.js          OBS overlay: Solana WS buy detection, community posts
│   ├── candle-widget.js    OBS candle widget: Dexscreener polling, stage logic
│   ├── blessing-dashboard.js  Wallet connect, score render, hourly race
│   └── blessing-leaderboard.js  Leaderboard table
├── img/
│   ├── padre-priest-ocean.jpg   Main cinematic photo (about strip)
│   ├── padre-banner.jpg         Twitter/X banner (og:image)
│   └── padre-social-card.jpg    Square social card
└── videos/
    ├── padre-hero-1.mp4    Hero background video (drop in to activate)
    └── padre-hero-2.mp4    Second video (cycles after first)
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

## THE REWARD FLYWHEEL

### Fee Flow
- **100% of all trading fees** go to dev wallet
- Every hour the bot calculates:
  - **25%** of that hour's fees → buys $PADRE from the market (buyback)
  - Bought tokens split: **25% to top 5 hourly bag workers** (by points) / **75% → weekly pool**
- **Weekly pool** distributed every Sunday to qualifying holders

### Hourly Race
- Anyone can win regardless of bag size
- **Points this hour:** posts × 25 + replies × 10 + likes × 5
- **Top 5 wallets** split 25% of the hourly buyback tokens, proportionally by points
- Resets every hour
- If tie or no activity → all bought tokens roll into weekly pool

### Weekly Distribution (Every Sunday)
**Qualification requirements — all must be met:**
1. Hold minimum **0.2% of total supply**
2. Minimum **500 pts** (Congregation rank)
3. Held **7+ days continuously**
4. **Did not sell** any tokens during the week

**Distribution by Blessing Score weight:**
- Saints → largest share
- Cardinals → second
- Disciples → third
- Congregation → minimum share

### Hold Scoring (compounding daily)
- **+10 pts per day** held continuously
- Sell ANY tokens → **streak resets to ZERO**
- Top 1% holder → **+500 pts bonus**
- Top 10% holder → **+200 pts bonus**

### Social Scoring
- Post in community → **+25 pts**
- Reply → **+10 pts**
- Like → **+5 pts**
- Refer new wallet → **+200 pts**

### Rank Tiers
| Rank | Points | Benefit |
|------|--------|---------|
| Sinner | 0–99 | No rewards |
| Believer | 100–499 | Stream shoutout |
| Congregation | 500–1,999 | Weekly eligible |
| Disciple | 2,000–4,999 | Bigger share + badge |
| Cardinal | 5,000–14,999 | Priority share |
| Saint | 15,000+ | Largest share |

### Accumulate & Multiply Mechanic
On dashboard, holders choose between:
- **CLAIM NOW** → tokens sent immediately
- **KEEP ACCUMULATING** → rewards build with multiplier:
  - Week 1: 1× 
  - Week 2: 1.2×
  - Week 4: 1.5×
  - Week 8: 2×

### If Someone Sells
- Hold streak resets to zero
- Unclaimed accumulated rewards → return to weekly pool
- Bot detects sell via Solana RPC
- Father Agent announces in community
- Remaining holders get a bigger share

---

## Admin Dashboard (Ray approves everything)

**Hourly panel shows:**
- Hour fees received
- Buyback amount & $PADRE tokens bought
- Top 5 wallets, their points, token amounts
- APPROVE / SKIP / EDIT buttons

**Weekly panel shows:**
- Week total fees & pool amount
- All qualifying wallets ranked by score
- Their share in tokens and USD value
- APPROVE / SKIP / EDIT buttons

---

## Third-Party Integrations
| Service | Purpose |
|---------|---------|
| **pumpdev.io API** | Buyback transactions |
| **Dexscreener** | Volume, price, MC data |
| **Solana RPC** | Wallet tracking, sell detection, buy toasts |
| **Communities SDK** | Social scoring (posts, replies, likes) |

---

## OBS Overlay Setup

**overlay.html** — Browser Source, 1920×1080:
- Persistent ticker bottom-left: `$PADRE · $price · MC · Vol`
- Buy toasts: fire from Solana WS `logsSubscribe` → `getTransaction` for real amounts
- New holder toasts: detected when pre-balance = 0
- Community post toasts: polls `/api/community` every 20s

**candle-widget.html** — Browser Source, 320×420:
- 6-stage candle driven by market cap
- Stages: Ember ($0) → Red Candle ($10K) → Green Candle ($100K) → Gold Candle ($500K) → God Candle ($2M) → Holy Candle ($10M+)

Both read CA from `window.PADRE_CA` (set in `js/config.js`).

---

## API Routes (Vercel Serverless)
```
/api/community          GET community posts
/api/blessing/score     GET wallet blessing score
/api/blessing/claim     POST claim rewards
/api/blessing/referral  POST register referral
/api/blessing/leaderboard GET top 50 wallets
/api/blessing/hourly-stats GET current + last hour race data
/api/ws-ticket          GET community WS auth ticket
```

---

## Launch Checklist
- [ ] Set `window.PADRE_CA` in `js/config.js`
- [ ] Set `PADRE_TOKEN_ADDRESS` in Vercel env vars
- [ ] Drop `padre-hero-1.mp4` + `padre-hero-2.mp4` into `videos/`
- [ ] Verify Dexscreener embed showing live data
- [ ] Test overlay in OBS with real CA
- [ ] Confirm community SDK connected
