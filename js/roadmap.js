/* ═══════════════════════════════════════════════════════════════
   $PADRE — Live Roadmap JS
   Renders the 6-candle roadmap and polls Dexscreener for stage
   Works on homepage (#roadmapMount) and roadmap.html standalone
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const _p           = new URLSearchParams(location.search);
  const TOKEN        = _p.get('ca') || window.PADRE_CA || null;
  const POLL_MS      = 30_000;

  /* ─── STAGE DEFINITIONS ─── */
  const STAGES = [
    {
      id:         0,
      cls:        'rm-s0',
      numeral:    'I',
      name:       'Ember',
      threshold:  0,
      nextAt:     10_000,
      label:      'Pre-Launch',
      verse:      '"The Father Prepares His Light"',
      desc:       'The candle is unlit. The Father is born. The congregation begins to form. Every great fire starts with a single ember.',
      milestones: ['Token deployed on Pump.fun', 'LP burned forever', 'Zero tax confirmed', 'Website live'],
      /* candle sizing */
      fw: 12,  fh: 18,  cw: 22, ch: 44,  speed: '0.28s', glowSize: '5px',
    },
    {
      id:         1,
      cls:        'rm-s1',
      numeral:    'II',
      name:       'Red Candle',
      threshold:  10_000,
      nextAt:     100_000,
      label:      '$10K',
      verse:      '"The Fire of Faith Ignites"',
      desc:       'The first believers ape in. Red candles are not defeats — they are the blood of faith being tested. The congregation holds.',
      milestones: ['1,000 holders', 'CoinGecko listing applied', 'Community channels open', 'First sermons delivered'],
      fw: 18,  fh: 28,  cw: 26, ch: 54,  speed: '0.20s', glowSize: '10px',
    },
    {
      id:         2,
      cls:        'rm-s2',
      numeral:    'III',
      name:       'Green Candle',
      threshold:  100_000,
      nextAt:     500_000,
      label:      '$100K',
      verse:      '"The Congregation Grows in Light"',
      desc:       'Green candles mean the congregation is growing in number and conviction. The market is beginning to understand what $PADRE represents.',
      milestones: ['2,500 holders', 'CMC listing', 'Dexscreener trending', 'First viral sermon clip'],
      fw: 24,  fh: 42,  cw: 30, ch: 62,  speed: '0.17s', glowSize: '14px',
    },
    {
      id:         3,
      cls:        'rm-s3',
      numeral:    'IV',
      name:       'Gold Candle',
      threshold:  500_000,
      nextAt:     2_000_000,
      label:      '$500K',
      verse:      '"The Ministry of $PADRE Rises"',
      desc:       'The golden flame burns steady and true. The Father\'s ministry is established. Influencers speak of him. The faithful are rewarded.',
      milestones: ['5,000 holders', 'Tier-2 CEX listing', 'Influencer partnerships', 'Merch drops'],
      fw: 32,  fh: 56,  cw: 34, ch: 70,  speed: '0.14s', glowSize: '20px',
    },
    {
      id:         4,
      cls:        'rm-s4',
      numeral:    'V',
      name:       'God Candle',
      threshold:  2_000_000,
      nextAt:     10_000_000,
      label:      '$2M',
      verse:      '"The Father\'s Power is Undeniable"',
      desc:       'The God Candle burns so bright it lights the whole crypto space. Everyone knows the name. The Father has become a force of nature.',
      milestones: ['10,000 holders', 'Tier-1 CEX outreach', 'Billboard campaign', 'Top 50 Solana token'],
      fw: 42,  fh: 74,  cw: 38, ch: 78,  speed: '0.11s', glowSize: '30px',
    },
    {
      id:         5,
      cls:        'rm-s5',
      numeral:    'VI',
      name:       'Holy Candle',
      threshold:  10_000_000,
      nextAt:     null,
      label:      '$10M',
      verse:      '"Divinity Achieved · The Prophecy Fulfilled"',
      desc:       'The Holy Candle transcends all. The last coin you will ever need has proven itself. The faithful who held from the Ember are rewarded beyond measure. Amen.',
      milestones: ['Diamond hands rewarded', 'Top 20 Solana token', 'The prophecy fulfilled', 'WAGMI'],
      fw: 52,  fh: 92,  cw: 42, ch: 84,  speed: '0.09s', glowSize: '48px',
    },
  ];

  /* ─── STATE ─── */
  let currentMC      = 0;
  let currentPrice   = 0;
  let activeStageId  = 0;

  /* ─── FORMAT HELPERS ─── */
  function fmtMC(n) {
    if (!n || n <= 0) return 'Pre-Launch';
    if (n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n/1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }
  function fmtPrice(p) {
    if (!p) return '—';
    if (p < 0.000001) return '$' + p.toExponential(2);
    if (p < 0.001)    return '$' + p.toFixed(8);
    return '$' + p.toFixed(6);
  }
  function stageFor(mc) {
    let s = STAGES[0];
    for (const st of STAGES) { if (mc >= st.threshold) s = st; }
    return s;
  }
  function progressPct(stage, mc) {
    if (!stage.nextAt) return 100;
    const pct = ((mc - stage.threshold) / (stage.nextAt - stage.threshold)) * 100;
    return Math.min(Math.max(pct, 2), 99);
  }

  /* ─── BUILD CANDLE HTML ─── */
  function candleHTML(stage) {
    return `
      <div class="rm-candle-wrap">
        <div class="rm-flame" style="--rm-fw:${stage.fw}px;--rm-fh:${stage.fh}px;--rm-speed:${stage.speed};">
          <div class="rm-flame-glow"></div>
        </div>
        <div class="rm-wick"></div>
        <div class="rm-wax-body" style="--rm-cw:${stage.cw}px;--rm-ch:${stage.ch}px;--rm-glow-size:${stage.glowSize};">
          <div class="rm-wax-shine"></div>
        </div>
        <div class="rm-base" style="--rm-cw:${stage.cw}px;"></div>
        <div class="rm-ground-glow"></div>
        <div class="rm-node"></div>
      </div>
    `;
  }

  /* ─── BUILD FULL ROADMAP HTML ─── */
  function buildRoadmapHTML() {
    return `
      <div class="roadmap-inner">
        <div style="text-align:center;margin-bottom:16px;">
          <span class="roadmap-live-badge">
            <span class="roadmap-live-dot"></span>
            Live · Updates every 30s
          </span>
        </div>
        <div class="section-header" style="margin-bottom:28px;">
          <div class="section-cross">🕯️</div>
          <h2 class="section-title">The Father's Journey</h2>
          <p class="section-subtitle" id="rm-stage-label">Loading…</p>
          <div class="title-ornament">◆────────────────────────◆</div>
        </div>
        <div class="roadmap-mc-bar">
          <div class="roadmap-mc-item">Market Cap <strong id="rm-mc">—</strong></div>
          <span class="roadmap-mc-divider">◆</span>
          <div class="roadmap-mc-item">Price <strong id="rm-price">—</strong></div>
          <span class="roadmap-mc-divider">◆</span>
          <div class="roadmap-mc-item">Current Stage <strong id="rm-cur-stage">—</strong></div>
          <span class="roadmap-mc-divider">◆</span>
          <div class="roadmap-mc-item">Next Unlock <strong id="rm-next-at">—</strong></div>
        </div>
        <div class="roadmap-track" id="rmTrack">
          <div class="roadmap-progress-line" id="rmProgressLine"></div>
          ${STAGES.map(s => `
            <div class="rm-stage ${s.cls}" id="rm-stage-${s.id}" data-id="${s.id}">
              ${candleHTML(s)}
              <div class="rm-info">
                <div class="rm-numeral">${s.numeral}</div>
                <div class="rm-name">${s.name}</div>
                <div class="rm-threshold">${s.label}</div>
                <div class="rm-desc">${s.verse}</div>
                <div class="rm-badge">${s.name}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ─── BUILD DETAIL CARDS (roadmap.html only) ─── */
  function buildDetailCards() {
    const el = document.getElementById('stageCards');
    if (!el) return;

    el.innerHTML = STAGES.map(s => `
      <div class="commandment" id="rm-card-${s.id}" style="opacity:0.4;transition:opacity 0.5s ease;">
        <span class="commandment-num">${s.numeral}</span>
        <div>
          <p style="font-family:var(--font-heading);font-size:13px;font-weight:700;color:var(--text-white);margin-bottom:6px;letter-spacing:.05em;">
            ${s.name}
            <span style="font-size:10px;color:var(--text-muted);font-weight:400;margin-left:8px;letter-spacing:.1em;">${s.label} MC</span>
          </p>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:8px;">${s.desc}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${s.milestones.map(m => `
              <span style="font-family:var(--font-heading);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);background:var(--bg-card);border:1px solid var(--bg-border);border-radius:2px;padding:3px 8px;" class="rm-milestone-${s.id}">${m}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  /* ─── APPLY STATE TO DOM ─── */
  function applyState(mc, price) {
    const active = stageFor(mc);

    /* Stats bar */
    const mcEl    = document.getElementById('rm-mc');
    const priceEl = document.getElementById('rm-price');
    const curEl   = document.getElementById('rm-cur-stage');
    const nextEl  = document.getElementById('rm-next-at');
    const lblEl   = document.getElementById('rm-stage-label');

    if (mcEl)    mcEl.textContent    = fmtMC(mc);
    if (priceEl) priceEl.textContent = fmtPrice(price);
    if (curEl)   curEl.textContent   = active.name;
    if (nextEl)  nextEl.textContent  = active.nextAt ? fmtMC(active.nextAt) : '✝ Ascended';
    if (lblEl)   lblEl.textContent   = `Currently: ${active.name} · ${active.verse}`;

    /* Stage classes */
    STAGES.forEach(s => {
      const el = document.getElementById(`rm-stage-${s.id}`);
      if (!el) return;
      el.classList.remove('is-done', 'is-active');
      if (s.id < active.id)  el.classList.add('is-done');
      if (s.id === active.id) el.classList.add('is-active');
    });

    /* Progress line — spans from stage 0 node to active node */
    const line = document.getElementById('rmProgressLine');
    if (line) {
      // Each stage takes 1/6 of the track width
      // Line starts at left edge of stage-0, stops at center of active stage
      const segW   = 100 / STAGES.length;          // % per stage
      const segPct = progressPct(active, mc);       // % through current stage
      const filled = active.id * segW + (segW * segPct / 100);
      line.style.width = Math.min(filled, 98) + '%';
    }

    /* Detail cards on roadmap.html */
    STAGES.forEach(s => {
      const card = document.getElementById(`rm-card-${s.id}`);
      if (!card) return;
      if (s.id < active.id) {
        card.style.opacity = '1';
        card.style.borderLeftColor = 'var(--gold-dark)';
        // tick milestones
        card.querySelectorAll(`.rm-milestone-${s.id}`).forEach(m => {
          m.style.color = 'var(--gold-primary)';
          m.style.borderColor = 'var(--gold-deep)';
          if (!m.textContent.startsWith('✓')) m.textContent = '✓ ' + m.textContent;
        });
      }
      if (s.id === active.id) {
        card.style.opacity = '1';
        card.style.borderLeftColor = 'var(--gold-primary)';
        card.style.boxShadow = '0 0 20px rgba(201,168,76,0.08)';
      }
    });

    activeStageId = active.id;
  }

  /* ─── FETCH LIVE DATA ─── */
  async function fetchData() {
    if (!TOKEN) {
      // No token — stay at stage 0, show pre-launch
      applyState(0, 0);
      return;
    }
    try {
      const res  = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN}`);
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (!pair) { applyState(0, 0); return; }
      currentMC    = pair.fdv || 0;
      currentPrice = parseFloat(pair.priceUsd || 0);
      applyState(currentMC, currentPrice);
    } catch (e) {
      console.warn('[roadmap] fetch failed', e);
      applyState(currentMC, currentPrice);
    }
  }

  /* ─── MOUNT ─── */
  function mount() {
    const mountEl = document.getElementById('roadmapMount');
    if (mountEl) {
      mountEl.innerHTML = buildRoadmapHTML();
    }
    buildDetailCards();
    fetchData();
    setInterval(fetchData, POLL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

})();
