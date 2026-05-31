/* ═══════════════════════════════════════════════════════════════
   $PADRE — Father of Trenches
   Main JS — Candles, Stats, Copy CA, Mobile Menu, Posts
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── CANDLES ─── */
  function buildCandles() {
    const row = document.getElementById('candleRow');
    if (!row) return;

    const counts = window.innerWidth < 600 ? 6 : window.innerWidth < 900 ? 10 : 16;
    const heights = [60, 80, 100, 90, 70, 110, 85, 65, 95, 75, 105, 88, 72, 98, 82, 68];

    for (let i = 0; i < counts; i++) {
      const h = heights[i % heights.length];
      const speed = (0.1 + Math.random() * 0.15).toFixed(2);

      const candle = document.createElement('div');
      candle.className = 'candle';
      candle.innerHTML = `
        <div class="candle-flame" style="--flicker-speed:${speed}s"></div>
        <div class="candle-wax" style="height:${h}px"></div>
        <div class="candle-base"></div>
      `;
      row.appendChild(candle);
    }
  }

  /* ─── PARTICLES ─── */
  function buildParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        bottom: ${Math.random() * 30}%;
        --dur: ${6 + Math.random() * 10}s;
        --delay: ${Math.random() * 8}s;
        width: ${1 + Math.random() * 2}px;
        height: ${1 + Math.random() * 2}px;
      `;
      container.appendChild(p);
    }
  }

  /* ─── MOBILE MENU ─── */
  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      nav.classList.toggle('is-open');
      const isOpen = nav.classList.contains('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('is-open');
      }
    });
  }

  /* ─── RESOLVE TOKEN ADDRESS ─── */
  const RESOLVED_CA = new URLSearchParams(location.search).get('ca')
    || window.PADRE_CA
    || null;

  /* ─── COPY CA ─── */
  function initCopyCA() {
    const btn = document.getElementById('caCopy');
    const val = document.getElementById('caValue');
    if (!btn || !val) return;

    const ca = RESOLVED_CA;

    if (ca) {
      val.textContent = ca;
    }

    btn.addEventListener('click', () => {
      const text = val.textContent.trim();
      if (!text || text.startsWith('COMING SOON')) return;

      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '✓';
        btn.style.color = '#4CAF50';
        setTimeout(() => {
          btn.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
          btn.style.color = '';
        }, 2000);
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    });
  }

  /* ─── DEXSCREENER EMBED ─── */
  function initDexscreener() {
    const container = document.getElementById('dexscreener-embed');
    if (!container) return;

    if (RESOLVED_CA) {
      container.innerHTML = `
        <iframe
          src="https://dexscreener.com/solana/${RESOLVED_CA}?embed=1&loadChartSettings=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"
          style="width:100%;height:64px;border:none;background:transparent;"
          allow="clipboard-write"
        ></iframe>
      `;
    }
  }

  /* ─── STATS — Fetch from Dexscreener API ─── */
  async function loadStats() {
    const tokenAddr = RESOLVED_CA;

    if (!tokenAddr) return;

    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddr}`);
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (!pair) return;

      const mcap = pair.fdv ? formatNumber(pair.fdv) : '—';
      const vol  = pair.volume?.h24 ? formatNumber(pair.volume.h24) : '—';

      const mcEl = document.getElementById('marketCap');
      const vEl  = document.getElementById('volume24h');
      if (mcEl) mcEl.textContent = '$' + mcap;
      if (vEl)  vEl.textContent  = '$' + vol;
    } catch (e) {
      console.warn('Dexscreener stats failed:', e);
    }
  }

  function formatNumber(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }

  /* ─── COMMUNITY POSTS (Coin Communities API) ─── */
  async function loadCommunityPosts() {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    try {
      const res = await fetch('/api/community?limit=6');
      if (!res.ok) throw new Error('API error');
      const posts = await res.json();

      if (!posts || !posts.length) return;

      grid.innerHTML = '';
      posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
          <div class="post-header">
            <div class="post-avatar">${post.author?.[0]?.toUpperCase() || '✝'}</div>
            <span class="post-author">${escapeHtml(post.author || 'Anonymous')}</span>
            <span class="post-time">${timeAgo(post.createdAt)}</span>
          </div>
          <p class="post-body">${escapeHtml(post.content || '')}</p>
        `;
        grid.appendChild(card);
      });
    } catch (e) {
      // Keep placeholder silently
      console.warn('Community posts load failed:', e);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function timeAgo(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }

  /* ─── ANIMATE COUNTER ─── */
  function animateCounter(el, target) {
    if (!el || target === 0) return;
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(interval);
    }, 30);
  }

  /* ─── INTERSECTION OBSERVER for counter ─── */
  function initObservers() {
    const statsEl = document.querySelector('.stats-strip');
    if (!statsEl) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const holderEl = document.getElementById('holderCount');
          if (holderEl && holderEl.dataset.target) {
            animateCounter(holderEl, parseInt(holderEl.dataset.target));
          }
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });

    obs.observe(statsEl);
  }

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', () => {
    buildCandles();
    buildParticles();
    initMobileMenu();
    initCopyCA();
    initDexscreener();
    initObservers();
    loadStats();
    loadCommunityPosts();
  });

})();
