/* ═══════════════════════════════════════════════════════════════
   $PADRE — Live Candle Roadmap Widget
   Polls Dexscreener every 30s · 6 stages driven by market cap
   URL params:
     ?test         → demo mode, cycles all stages automatically
     ?stage=0..5   → lock to a specific stage (preview in OBS)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── CONFIG ─── */
  const TOKEN_ADDRESS  = window.__PADRE_TOKEN || null;
  const POLL_INTERVAL  = 30_000;  // ms between Dexscreener polls
  const FAKE_HOLDERS   = 1247;    // test mode starting holder count

  const params     = new URLSearchParams(location.search);
  const IS_TEST    = params.has('test') || !TOKEN_ADDRESS;
  const LOCK_STAGE = params.has('stage') ? parseInt(params.get('stage')) : null;

  /* ─── STAGE DEFINITIONS ─── */
  const STAGES = [
    {
      id:        0,
      cls:       'stage-0',
      name:      'Ember',
      verse:     '"The Father Prepares His Light"',
      threshold: 0,
      nextLabel: 'Red Candle',
      nextAt:    10_000,
      dripCount: 0,
      sparks:    2,
    },
    {
      id:        1,
      cls:       'stage-1',
      name:      'Red Candle',
      verse:     '"The Fire of Faith Ignites"',
      threshold: 10_000,
      nextLabel: 'Green Candle',
      nextAt:    100_000,
      dripCount: 1,
      sparks:    4,
    },
    {
      id:        2,
      cls:       'stage-2',
      name:      'Green Candle',
      verse:     '"The Congregation Grows in Light"',
      threshold: 100_000,
      nextLabel: 'Gold Candle',
      nextAt:    500_000,
      dripCount: 2,
      sparks:    6,
    },
    {
      id:        3,
      cls:       'stage-3',
      name:      'Gold Candle',
      verse:     '"The Ministry of $PADRE Rises"',
      threshold: 500_000,
      nextLabel: 'God Candle',
      nextAt:    2_000_000,
      dripCount: 2,
      sparks:    8,
    },
    {
      id:        4,
      cls:       'stage-4',
      name:      'God Candle',
      verse:     '"The Father\'s Power is Undeniable"',
      threshold: 2_000_000,
      nextLabel: 'Holy Candle',
      nextAt:    10_000_000,
      dripCount: 3,
      sparks:    12,
    },
    {
      id:        5,
      cls:       'stage-5',
      name:      'Holy Candle',
      verse:     '"Divinity Achieved · The Prophecy Fulfilled"',
      threshold: 10_000_000,
      nextLabel: 'ASCENDED',
      nextAt:    null,          // no next stage
      dripCount: 3,
      sparks:    16,
    },
  ];

  /* ─── STATE ─── */
  let currentStageId = 0;
  let currentMC      = 0;
  let currentPrice   = 0;
  let currentHolders = 0;

  /* ─── DOM ─── */
  const widget          = document.getElementById('widget');
  const stageNameEl     = document.getElementById('stageName');
  const stageVerseEl    = document.getElementById('stageVerse');
  const progressFill    = document.getElementById('progressFill');
  const progressCurrent = document.getElementById('progressCurrent');
  const progressNext    = document.getElementById('progressNext');
  const progressThresh  = document.getElementById('progressThreshold');
  const statMC          = document.getElementById('statMC');
  const statPrice       = document.getElementById('statPrice');
  const statHolders     = document.getElementById('statHolders');
  const dripsEl         = document.getElementById('drips');
  const particlesEl     = document.getElementById('particles');
  const raysEl          = document.getElementById('rays');
  const testBadge       = document.getElementById('testBadge');

  /* ─── UTILS ─── */
  function formatMC(n) {
    if (!n) return '$0';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }

  function formatPrice(p) {
    if (!p) return '—';
    if (p < 0.000001) return '$' + p.toExponential(2);
    if (p < 0.001)    return '$' + p.toFixed(8);
    return '$' + p.toFixed(6);
  }

  function stageForMC(mc) {
    let s = STAGES[0];
    for (const stage of STAGES) {
      if (mc >= stage.threshold) s = stage;
    }
    return s;
  }

  function progressPercent(stage, mc) {
    if (!stage.nextAt) return 100;
    const from  = stage.threshold;
    const to    = stage.nextAt;
    const pct   = Math.min(((mc - from) / (to - from)) * 100, 99.5);
    return Math.max(pct, 1);
  }

  /* ─── BUILD DRIPS ─── */
  function buildDrips(count) {
    dripsEl.innerHTML = '';
    const positions = [-10, 10, -5, 8, -14, 14];
    for (let i = 0; i < count; i++) {
      const drip = document.createElement('div');
      drip.className = 'drip';
      const h = 8 + Math.random() * 14;
      drip.style.cssText = `
        left: calc(50% + ${positions[i % positions.length]}px);
        --drip-h: ${h}px;
        animation-delay: ${i * 1.3}s;
        animation-duration: ${3 + Math.random() * 2}s;
      `;
      dripsEl.appendChild(drip);
    }
  }

  /* ─── BUILD SPARKS ─── */
  function buildSparks(count, color) {
    particlesEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      const left  = 50 + (Math.random() - 0.5) * 30;
      const drift = (Math.random() - 0.5) * 20;
      s.style.cssText = `
        left: ${left}%;
        background: ${color};
        --dur: ${1.2 + Math.random() * 1.6}s;
        --delay: ${Math.random() * 2}s;
        --drift: ${drift}px;
        width: ${1.5 + Math.random() * 2}px;
        height: ${1.5 + Math.random() * 2}px;
      `;
      particlesEl.appendChild(s);
    }
  }

  /* ─── BUILD RAYS (holy stage) ─── */
  function buildRays(show) {
    raysEl.innerHTML = '';
    if (!show) return;
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const r   = document.createElement('div');
      r.className = 'ray';
      const angle  = (i / rayCount) * 360;
      const length = 60 + Math.random() * 40;
      const delay  = Math.random() * 2;
      r.style.cssText = `
        transform-origin: bottom center;
        transform: translateX(-50%) rotate(${angle}deg);
        height: ${length}px;
        top: calc(50% - ${length}px);
        animation-delay: ${delay}s;
        opacity: ${0.3 + Math.random() * 0.4};
      `;
      raysEl.appendChild(r);
    }
  }

  /* ─── APPLY STAGE ─── */
  function applyStage(stage, mc) {
    // Swap stage class on widget
    STAGES.forEach(s => widget.classList.remove(s.cls));
    widget.classList.add(stage.cls);

    // Stage info
    stageNameEl.textContent  = stage.name;
    stageVerseEl.textContent = stage.verse;

    // Progress
    const pct = progressPercent(stage, mc);
    progressFill.style.width = pct + '%';
    progressCurrent.textContent = formatMC(mc);

    if (stage.nextAt) {
      progressNext.textContent  = 'Next: ' + stage.nextLabel;
      progressThresh.textContent = formatMC(stage.nextAt) + ' needed';
    } else {
      progressNext.textContent   = '✝ ' + stage.nextLabel + ' ✝';
      progressThresh.textContent = 'The Father has ascended';
    }

    // Rebuild candle effects
    buildDrips(stage.dripCount);
    buildSparks(stage.sparks, 'var(--flame-tip)');
    buildRays(stage.id === 5);

    currentStageId = stage.id;
  }

  /* ─── UPDATE STATS ─── */
  function updateStats(mc, price, holders) {
    statMC.textContent      = mc      ? formatMC(mc)         : '—';
    statPrice.textContent   = price   ? formatPrice(price)   : '—';
    statHolders.textContent = holders ? holders.toLocaleString() : '—';
  }

  /* ─── RENDER (from data) ─── */
  function render(mc, price, holders) {
    const stage = LOCK_STAGE !== null ? STAGES[LOCK_STAGE] : stageForMC(mc);
    applyStage(stage, mc);
    updateStats(mc, price, holders);
  }

  /* ─── FETCH LIVE DATA ─── */
  async function fetchLiveData() {
    if (!TOKEN_ADDRESS) return;
    try {
      const res  = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`);
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (!pair) return;

      currentMC      = pair.fdv            || 0;
      currentPrice   = parseFloat(pair.priceUsd || 0);
      currentHolders = pair.txns?.h24?.buys || 0; // Dexscreener doesn't give holder count directly

      render(currentMC, currentPrice, currentHolders);
    } catch (e) {
      console.warn('[candle-widget] fetch failed:', e);
    }
  }

  /* ─── TEST MODE — cycles through all 6 stages ─── */
  function startTestMode() {
    testBadge.style.display = 'block';

    // If ?stage=N is set, just show that one stage with fake data
    if (LOCK_STAGE !== null) {
      const stage = STAGES[Math.max(0, Math.min(5, LOCK_STAGE))];
      const fakeMC = stage.threshold + (stage.nextAt ? (stage.nextAt - stage.threshold) * 0.45 : 0);
      render(fakeMC, 0.0000042, FAKE_HOLDERS);
      updateStats(fakeMC, 0.0000042, FAKE_HOLDERS);
      return;
    }

    // Otherwise cycle through all stages, 8s each
    const fakeMCsByStage = [
      5_000,      // Stage 0: Ember
      45_000,     // Stage 1: Red
      280_000,    // Stage 2: Green
      1_200_000,  // Stage 3: Gold
      6_500_000,  // Stage 4: God
      25_000_000, // Stage 5: Holy
    ];
    const fakePrices = [0.000000005, 0.000000045, 0.00000028, 0.0000012, 0.0000065, 0.000025];

    let idx = 0;

    function showNext() {
      const mc      = fakeMCsByStage[idx];
      const price   = fakePrices[idx];
      const holders = FAKE_HOLDERS + idx * 1200;
      render(mc, price, holders);
      updateStats(mc, price, holders);
      idx = (idx + 1) % STAGES.length;
    }

    showNext(); // show immediately
    setInterval(showNext, 8000); // cycle every 8s
  }

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', () => {
    // Set initial stage-0 class and base render
    applyStage(STAGES[0], 0);
    updateStats(0, 0, 0);

    if (IS_TEST) {
      startTestMode();
    } else {
      fetchLiveData();
      setInterval(fetchLiveData, POLL_INTERVAL);
    }
  });

})();
