/* ═══════════════════════════════════════════════════════════════
   $PADRE — Blessing Leaderboard Frontend
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const TIER_CSS = {
    'Sinner':       'tier-sinner',
    'Believer':     'tier-believer',
    'Congregation': 'tier-congregation',
    'Disciple':     'tier-disciple',
    'Cardinal':     'tier-cardinal',
    'Saint':        'tier-saint',
  };

  const TIER_COLORS = {
    'Cardinal': '#FF4444',
    'Saint':    '#FFFFFF',
  };

  const $ = id => document.getElementById(id);
  const connectedWallet = localStorage.getItem('padre_wallet') || null;

  async function loadLeaderboard() {
    try {
      const res  = await fetch('/api/blessing/leaderboard?limit=50');
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();

      $('lbLoading').style.display = 'none';

      if (!data.entries || data.entries.length === 0) {
        $('lbError').textContent = 'No wallets on the leaderboard yet. Be the first — connect your wallet on the Dashboard.';
        $('lbError').style.display = 'block';
        return;
      }

      // Stats bar
      $('lbTotalWallets').textContent = (data.total || data.entries.length).toLocaleString();
      $('lbUpdatedAt').textContent    = data.updatedAt
        ? new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '—';

      // Build table rows
      const tbody = $('lbBody');
      tbody.innerHTML = '';

      data.entries.forEach(entry => {
        const isMe      = connectedWallet && entry.wallet === connectedWallet;
        const isSaint   = entry.rank === 'Saint';
        const isCardinal= entry.rank === 'Cardinal';

        const tr = document.createElement('tr');
        tr.className = [
          'lb-row',
          isSaint    ? 'is-saint'    : '',
          isCardinal ? 'is-cardinal' : '',
          isMe       ? 'is-me'       : '',
        ].filter(Boolean).join(' ');

        const numClass = entry.position <= 3 ? 'lb-rank-num top3' : 'lb-rank-num';

        const displayName = entry.username
          ? '@' + entry.username
          : entry.walletShort;

        tr.innerHTML = `
          <td><span class="${numClass}">${toRoman(entry.position)}</span></td>
          <td>
            <span class="lb-wallet ${isMe ? 'is-me' : ''}">${esc(displayName)}</span>
            <span style="font-family:'Courier New',monospace;font-size:9px;color:var(--text-muted);margin-left:6px;opacity:0.5;">${entry.walletShort}</span>
            ${isMe ? '<span class="lb-wallet-tag">YOU</span>' : ''}
            ${isSaint    ? '<span class="lb-wallet-tag" style="color:#fff;border-color:rgba(255,255,255,0.3)">✝ SAINT</span>'   : ''}
            ${isCardinal ? '<span class="lb-wallet-tag" style="color:#FF4444;border-color:#CC0000">🔴 CARDINAL</span>' : ''}
          </td>
          <td><span class="lb-tier-badge ${TIER_CSS[entry.rank] || ''}">${entry.rankIcon} ${entry.rank}</span></td>
          <td style="color:var(--text-muted);font-size:11px;">${entry.holdDays > 0 ? entry.holdDays + 'd' : '—'}</td>
          <td><span class="lb-score-val">${entry.score.toLocaleString()}</span></td>
        `;
        tbody.appendChild(tr);
      });

      $('lbTableWrap').style.display = 'block';

      // Elite section (Saints + Cardinals)
      const elites = data.entries.filter(e => e.rank === 'Saint' || e.rank === 'Cardinal');
      if (elites.length > 0) {
        const grid = $('eliteGrid');
        grid.innerHTML = '';
        elites.forEach(e => {
          const color = TIER_COLORS[e.rank] || 'var(--gold-primary)';
          const card  = document.createElement('div');
          card.style.cssText = `
            background:var(--bg-card);border:1px solid ${color}44;border-radius:var(--radius-lg);
            padding:20px;text-align:center;
          `;
          card.innerHTML = `
            <div style="font-size:28px;margin-bottom:8px;">${e.rankIcon}</div>
            <div style="font-family:var(--font-heading);font-size:10px;letter-spacing:.15em;color:${color};margin-bottom:4px;">${e.rank}</div>
            <div style="font-family:'Courier New',monospace;font-size:11px;color:var(--text-secondary);">${e.walletShort}</div>
            <div style="font-family:var(--font-heading);font-size:16px;font-weight:700;color:${color};margin-top:8px;">${e.score.toLocaleString()} pts</div>
          `;
          grid.appendChild(card);
        });
        $('eliteSection').style.display = 'block';
      }

    } catch (e) {
      console.error('[leaderboard]', e);
      $('lbLoading').style.display = 'none';
      $('lbError').textContent = 'Failed to load leaderboard. Please refresh.';
      $('lbError').style.display = 'block';
    }
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function toRoman(n) {
    if (n > 50) return n;
    const v = [50,40,10,9,5,4,1];
    const s = ['L','XL','X','IX','V','IV','I'];
    let result = '';
    for (let i = 0; i < v.length; i++) {
      while (n >= v[i]) { result += s[i]; n -= v[i]; }
    }
    return result;
  }

  document.addEventListener('DOMContentLoaded', loadLeaderboard);

})();
