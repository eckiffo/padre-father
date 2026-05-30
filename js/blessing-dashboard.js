/* ═══════════════════════════════════════════════════════════════
   $PADRE — Blessing Score Dashboard
   Vanilla JS · Detects Phantom / Solflare · Calls /api/blessing/*
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── RANK CONFIG (mirrors server) ─── */
  const RANKS = [
    { name: 'Sinner',       min: 0,     max: 99,       icon: '😈', color: '#555555' },
    { name: 'Believer',     min: 100,   max: 499,      icon: '🙏', color: '#8B6914' },
    { name: 'Congregation', min: 500,   max: 1999,     icon: '⛪', color: '#C9A84C' },
    { name: 'Disciple',     min: 2000,  max: 4999,     icon: '📿', color: '#FFD700' },
    { name: 'Cardinal',     min: 5000,  max: 14999,    icon: '🔴', color: '#FF4444' },
    { name: 'Saint',        min: 15000, max: Infinity, icon: '✝',  color: '#FFFFFF' },
  ];

  function getRank(score) {
    return RANKS.slice().reverse().find(r => score >= r.min) || RANKS[0];
  }

  function getNextRank(score) {
    return RANKS.find(r => r.min > score) || null;
  }

  /* ─── STATE ─── */
  let connectedWallet = null;
  let scoreData       = null;

  /* ─── DOM ─── */
  const $ = id => document.getElementById(id);

  /* ─── WALLET DETECTION ─── */
  function getProvider(type) {
    if (type === 'phantom') {
      if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
      if (window.solana?.isPhantom) return window.solana;
    }
    if (type === 'solflare') {
      if (window.solflare?.isSolflare) return window.solflare;
    }
    return null;
  }

  async function connectWallet(type) {
    showConnectError('');
    const provider = getProvider(type);
    if (!provider) {
      const url = type === 'phantom' ? 'https://phantom.app' : 'https://solflare.com';
      showConnectError(`${type} wallet not detected. <a href="${url}" target="_blank" rel="noopener" style="color:var(--gold-primary)">Install it here →</a>`);
      return;
    }

    try {
      const resp = await provider.connect();
      const pubkey = resp.publicKey.toString();
      onWalletConnected(pubkey, provider);
    } catch (e) {
      if (e.code === 4001) {
        showConnectError('Connection declined.');
      } else {
        showConnectError('Connection failed: ' + (e.message || 'unknown error'));
      }
    }
  }

  function showConnectError(msg) {
    const el = $('connectError');
    if (!el) return;
    el.innerHTML = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  /* ─── ON WALLET CONNECTED ─── */
  async function onWalletConnected(pubkey, provider) {
    connectedWallet = pubkey;
    localStorage.setItem('padre_wallet', pubkey);
    localStorage.setItem('padre_wallet_type', provider?.isPhantom ? 'phantom' : 'solflare');

    // Update UI
    const short = pubkey.slice(0, 4) + '…' + pubkey.slice(-4);
    $('walletAddrShort').textContent = short;
    $('walletBar').style.display = 'flex';
    $('connectGate').style.display = 'none';

    // Set referral input
    const refUrl = `${location.origin}/dashboard.html?ref=${pubkey}`;
    $('referralInput').value = refUrl;

    // Check if this wallet was referred
    const ref = new URLSearchParams(location.search).get('ref');
    if (ref && ref !== pubkey) {
      fetch('/api/blessing/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: pubkey, referrer: ref }),
      }).catch(() => {});
    }

    // Load score
    await loadScore();
  }

  /* ─── LOAD SCORE ─── */
  async function loadScore(force = false) {
    if (!connectedWallet) return;

    $('connectGate').style.display    = 'none';
    $('dashboardLoading').style.display = 'flex';
    $('dashboardContent').style.display  = 'none';

    try {
      const url = `/api/blessing/score?wallet=${connectedWallet}${force ? '&refresh=1' : ''}`;
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      scoreData = await res.json();
      renderDashboard(scoreData);
    } catch (e) {
      console.error('[dashboard] score load failed:', e);
      $('dashboardLoading').style.display = 'none';
      $('connectGate').style.display = 'block';
      showConnectError('Failed to load score: ' + (e.message || 'Please try again.'));
    }
  }

  /* ─── RENDER DASHBOARD ─── */
  function renderDashboard(data) {
    $('dashboardLoading').style.display = 'none';
    $('dashboardContent').style.display = 'block';

    const total = data.score || 0;
    const rank  = getRank(total);
    const next  = getNextRank(total);

    // Score value (animate count-up)
    animateCount($('scoreValue'), total);

    // Rank badge
    $('rankBadge').style.setProperty('--rank-color', rank.color);
    $('rankIcon').textContent  = rank.icon;
    $('rankName').textContent  = rank.name;

    // Progress bar
    if (next) {
      const pct = ((total - rank.min) / (next.min - rank.min)) * 100;
      $('rankProgressFill').style.width = Math.min(pct, 99) + '%';
      $('progressCurRank').textContent   = rank.name;
      $('progressNextRank').textContent  = next.name;
      $('progressSub').textContent       = `${(next.min - total).toLocaleString()} pts to reach ${next.name}`;
    } else {
      $('rankProgressFill').style.width  = '100%';
      $('progressCurRank').textContent   = 'Saint';
      $('progressNextRank').textContent  = '✝ Ascended';
      $('progressSub').textContent       = 'Maximum rank achieved. You are blessed beyond measure.';
    }

    // Breakdown bars
    const hold     = data.holdScore     || 0;
    const social   = data.socialScore   || 0;
    const referral = data.referralScore || 0;
    const maxScore = Math.max(hold + social + referral, 1);
    $('holdBar').style.width     = (hold     / maxScore * 100) + '%';
    $('socialBar').style.width   = (social   / maxScore * 100) + '%';
    $('referralBar').style.width = (referral / maxScore * 100) + '%';
    $('holdPts').textContent     = hold.toLocaleString();
    $('socialPts').textContent   = social.toLocaleString();
    $('referralPts').textContent = referral.toLocaleString();

    // Hold details
    $('detailBalance').textContent    = data.balance ? Number(data.balance).toLocaleString(undefined, {maximumFractionDigits: 0}) + ' $PADRE' : '0 $PADRE';
    $('detailHoldStart').textContent  = data.holdStart ? new Date(data.holdStart).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : 'No $PADRE detected';
    $('detailHoldDays').textContent   = (data.holdDays || 0) + ' days';
    $('detailHolderRank').textContent = data.holderTier || 'Standard Holder';
    $('detailHoldScore').textContent  = hold.toLocaleString() + ' pts';

    // Social
    $('actPosts').textContent        = data.posts   || 0;
    $('actReplies').textContent      = data.replies || 0;
    $('actLikes').textContent        = data.likes   || 0;
    $('detailSocialScore').textContent = social.toLocaleString() + ' pts';

    // Referrals
    $('detailReferrals').textContent     = (data.referrals || 0) + ' wallets';
    $('detailReferralScore').textContent = referral.toLocaleString() + ' pts';

    // Claim box
    const claimable = data.claimable || 0;
    $('claimAmount').textContent = claimable.toLocaleString() + ' $PADRE';
    $('claimBtn').disabled = claimable === 0;
    if (claimable === 0) $('claimBtn').style.opacity = '0.4';

    // Last updated
    $('lastUpdated').textContent = data.lastUpdated
      ? 'Updated ' + timeAgo(data.lastUpdated)
      : '';

    // Share badge
    $('shareBadgeCard').style.setProperty('--rank-color', rank.color);
    $('badgeCross').style.color  = rank.color;
    $('badgeRankName').textContent = rank.name;
    $('badgeRankName').style.color = rank.color;
    $('badgeScore').textContent    = total.toLocaleString() + ' Blessing Points';
  }

  /* ─── CLAIM ─── */
  async function doClaim() {
    if (!connectedWallet) return;
    const btn = $('claimBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    try {
      const res = await fetch('/api/blessing/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: connectedWallet }),
      });
      if (!res.ok) throw new Error('Claim failed');
      const result = await res.json();

      btn.style.display = 'none';
      $('claimSuccess').style.display = 'block';
      if (result.claimable !== undefined) {
        $('claimAmount').textContent = result.claimable.toLocaleString() + ' $PADRE';
      }
    } catch (e) {
      btn.textContent = 'Claim failed — try again';
      btn.disabled = false;
      console.error('[dashboard] claim error:', e);
    }
  }

  /* ─── DISCONNECT ─── */
  function disconnect() {
    connectedWallet = null;
    scoreData       = null;
    localStorage.removeItem('padre_wallet');
    localStorage.removeItem('padre_wallet_type');
    $('walletBar').style.display     = 'none';
    $('dashboardContent').style.display = 'none';
    $('connectGate').style.display   = 'block';
  }

  /* ─── COPY REFERRAL ─── */
  function copyReferral() {
    const input = $('referralInput');
    if (!input || !connectedWallet) return;
    navigator.clipboard.writeText(input.value).then(() => {
      const btn = $('copyRefBtn');
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    }).catch(() => {
      input.select();
      document.execCommand('copy');
    });
  }

  /* ─── HELPERS ─── */
  function animateCount(el, target) {
    if (!el) return;
    let current = 0;
    const step = Math.max(Math.ceil(target / 50), 1);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(interval);
    }, 20);
  }

  function timeAgo(ts) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60)   return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return Math.floor(diff / 3600) + 'h ago';
  }

  /* ─── HOURLY RACE ─── */
  let hourlyData = null;

  async function loadHourlyStats() {
    try {
      const res  = await fetch('/api/blessing/hourly-stats');
      if (!res.ok) return;
      hourlyData = await res.json();
      renderHourly();
    } catch (e) {
      console.warn('[hourly]', e);
    }
  }

  function renderHourly() {
    if (!hourlyData) return;

    // Rewards line
    const rewards = hourlyData.config?.rewards;
    if (rewards && $('hourlyRewards')) {
      $('hourlyRewards').textContent =
        `🥇 ${rewards[0]}  ·  🥈 ${rewards[1]}  ·  🥉 ${rewards[2]}`;
    }

    // This hour top 3
    const top3El = $('hourlyTop3');
    if (top3El) {
      const entries = (hourlyData.currentHour || []).slice(0, 3);
      if (entries.length === 0) {
        top3El.innerHTML = `<div style="font-family:var(--font-heading);font-size:11px;color:var(--text-dim);text-align:center;padding:8px;">No activity yet this hour — be first!</div>`;
      } else {
        const medals = ['🥇','🥈','🥉'];
        top3El.innerHTML = entries.map((e, i) => {
          const isMe = connectedWallet && e.wallet === connectedWallet;
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bg-border);">
              <span style="font-size:18px;">${medals[i]}</span>
              <span style="font-family:'Courier New',monospace;font-size:11px;color:${isMe ? '#FFB800' : 'var(--text-secondary)'};">
                ${e.walletShort}${isMe ? ' <span style="color:#FFB800;font-family:var(--font-heading);font-size:9px;">(YOU)</span>' : ''}
              </span>
              <span style="margin-left:auto;font-family:var(--font-heading);font-size:11px;font-weight:700;color:#FFB800;">${e.activityScore} pts</span>
            </div>`;
        }).join('');
      }
    }

    // Last hour winners
    const lastEl = $('lastHourWinners');
    if (lastEl) {
      const winners = hourlyData.lastHour;
      if (!winners || winners.length === 0) {
        lastEl.innerHTML = `<div style="font-family:var(--font-heading);font-size:11px;color:var(--text-dim);">No winners yet — first hour coming up!</div>`;
      } else {
        const rewards = hourlyData.config?.rewards || [];
        lastEl.innerHTML = winners.map((w, i) => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:16px;">${w.medal}</span>
            <span style="font-family:'Courier New',monospace;font-size:11px;color:var(--text-secondary);">${w.walletShort}</span>
            <span style="margin-left:auto;font-family:var(--font-heading);font-size:11px;font-weight:700;color:#4CAF50;">${rewards[i] || '—'}</span>
          </div>`).join('');
      }
    }

    // My hourly rank
    const myRankEl = $('myHourlyRank');
    if (myRankEl && connectedWallet) {
      const myEntry = (hourlyData.currentHour || []).find(e => e.wallet === connectedWallet);
      if (myEntry) {
        myRankEl.textContent = `#${myEntry.position} this hour — ${myEntry.activityScore} activity pts`;
        myRankEl.style.color = myEntry.position <= 3 ? '#FFB800' : 'var(--gold-primary)';
      } else {
        myRankEl.textContent = 'Not ranked yet — post in the community!';
        myRankEl.style.color = 'var(--text-muted)';
      }
    }
  }

  /* ─── HOURLY COUNTDOWN ─── */
  function startCountdown() {
    function tick() {
      const now       = new Date();
      const nextHour  = new Date(now);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(nextHour.getHours() + 1);

      const totalSecs = 3600;
      const remaining = Math.max(0, Math.floor((nextHour - now) / 1000));
      const elapsed   = totalSecs - remaining;
      const pct       = (elapsed / totalSecs) * 100;

      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      const fmt = `${pad(h)}:${pad(m)}:${pad(s)}`;

      const cdEl = $('hourlyCountdown');
      const pbEl = $('hourlyProgressBar');
      if (cdEl) cdEl.textContent = fmt;
      if (pbEl) pbEl.style.width = pct + '%';

      // Refresh hourly data when hour rolls over
      if (remaining === 0 || remaining === 3599) {
        loadHourlyStats();
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  /* ─── AUTO-RECONNECT ─── */
  async function tryAutoReconnect() {
    const saved = localStorage.getItem('padre_wallet');
    const type  = localStorage.getItem('padre_wallet_type') || 'phantom';
    if (!saved) return;

    const provider = getProvider(type);
    if (!provider) return;

    try {
      // Only reconnect if already authorized (onlyIfTrusted)
      const resp = await provider.connect({ onlyIfTrusted: true });
      onWalletConnected(resp.publicKey.toString(), provider);
    } catch (_) {
      localStorage.removeItem('padre_wallet');
    }
  }

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    $('connectPhantom') ?.addEventListener('click', () => connectWallet('phantom'));
    $('connectSolflare')?.addEventListener('click', () => connectWallet('solflare'));
    $('disconnectBtn')  ?.addEventListener('click', disconnect);
    $('refreshBtn')     ?.addEventListener('click', () => loadScore(true));
    $('claimBtn')       ?.addEventListener('click', doClaim);
    $('copyRefBtn')     ?.addEventListener('click', copyReferral);
    $('screenshotBtn')  ?.addEventListener('click', () => {
      alert('Right-click or long-press the badge above to save the image, or take a screenshot!');
    });

    // Auto-reconnect
    tryAutoReconnect();

    // Hourly race — always running, no wallet needed
    startCountdown();
    loadHourlyStats();
    setInterval(loadHourlyStats, 60_000); // refresh every minute
  });

})();
