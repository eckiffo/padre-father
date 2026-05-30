/* ═══════════════════════════════════════════════════════════════
   $PADRE — OBS Overlay JS
   Coin Communities WebSocket + Dexscreener price polling
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const TOKEN_ADDRESS = window.__PADRE_TOKEN || null; // injected server-side or set here
  const MAX_TOASTS    = 5;
  const TOAST_DURATION = 7000; // ms before auto-dismiss
  const PRICE_INTERVAL = 30000; // poll every 30s

  const toastStack = document.getElementById('toastStack');
  const otPrice    = document.getElementById('otPrice');
  const otHolders  = document.getElementById('otHolders');

  /* ─── PRICE TICKER ─── */
  async function fetchPrice() {
    if (!TOKEN_ADDRESS) {
      if (otPrice) otPrice.textContent = 'TBA';
      return;
    }
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`);
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (!pair) return;

      const price = pair.priceUsd ? '$' + parseFloat(pair.priceUsd).toFixed(8) : '—';
      const fdv   = pair.fdv ? formatNum(pair.fdv) : '—';
      const txns  = pair.txns?.h24?.buys ? (pair.txns.h24.buys + pair.txns.h24.sells) : null;

      if (otPrice) otPrice.textContent = price + (fdv !== '—' ? '  ·  MC $' + fdv : '');
    } catch (e) {
      console.warn('[overlay] price fetch failed:', e);
    }
  }

  function formatNum(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }

  /* ─── TOAST FACTORY ─── */
  function createToast({ type, icon, author, body, isSoul }) {
    const el = document.createElement('div');
    el.className = 'toast' + (isSoul ? ' toast--soul' : '');

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    el.innerHTML = `
      <div class="toast-header">
        <span class="toast-icon">${icon}</span>
        <span class="toast-type">${escHtml(type)}</span>
        <span class="toast-time">${timeStr}</span>
      </div>
      <div class="toast-body">${body}</div>
    `;

    return el;
  }

  function pushToast(opts) {
    // Enforce max stack
    const existing = toastStack.querySelectorAll('.toast');
    if (existing.length >= MAX_TOASTS) {
      dismissToast(existing[0]);
    }

    const el = createToast(opts);
    toastStack.appendChild(el);

    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(el), TOAST_DURATION);
    el.dataset.timer = timer;
  }

  function dismissToast(el) {
    if (!el || el.classList.contains('toast-exit')) return;
    clearTimeout(parseInt(el.dataset.timer));
    el.classList.add('toast-exit');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // Fallback remove
    setTimeout(() => el.remove(), 600);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─── HOLDER SAVE EVENT ─── */
  function onNewHolder(holderAddr) {
    const short = holderAddr
      ? holderAddr.slice(0, 4) + '…' + holderAddr.slice(-4)
      : 'A new soul';

    pushToast({
      type: '✝  A New Soul Has Been Saved',
      icon: '🕯️',
      isSoul: true,
      body: `<span class="toast-author">${escHtml(short)}</span> has received The Father's blessing and joined the congregation.`,
    });
  }

  /* ─── COMMUNITY POST EVENT ─── */
  function onNewPost(post) {
    const author = post?.author || 'Anonymous';
    const content = post?.content || '';
    const truncated = content.length > 140 ? content.slice(0, 137) + '…' : content;

    pushToast({
      type: '✦  Congregation Speaks',
      icon: '💬',
      isSoul: false,
      body: `<span class="toast-author">${escHtml(author)}:</span> ${escHtml(truncated)}`,
    });
  }

  /* ─── COIN COMMUNITIES WEBSOCKET ─── */
  let ws = null;
  let wsReconnectTimer = null;
  let wsReconnectDelay = 2000;

  function connectWebSocket() {
    if (!TOKEN_ADDRESS) {
      // Demo mode — fire fake toasts for testing
      startDemoMode();
      return;
    }

    // The SDK websocket endpoint — adjust if SDK provides a different connection method
    try {
      ws = new WebSocket(`wss://ws.coincommunities.io?token=${TOKEN_ADDRESS}`);

      ws.addEventListener('open', () => {
        console.log('[overlay] WS connected');
        wsReconnectDelay = 2000;

        // Subscribe to this token's community
        ws.send(JSON.stringify({
          action: 'subscribe',
          tokenAddress: TOKEN_ADDRESS,
          apiKey: window.__CC_API_KEY || '',
        }));
      });

      ws.addEventListener('message', (e) => {
        try {
          const msg = JSON.parse(e.data);
          handleWsMessage(msg);
        } catch (err) {
          console.warn('[overlay] WS parse error', err);
        }
      });

      ws.addEventListener('close', () => {
        console.warn('[overlay] WS closed — reconnecting in', wsReconnectDelay, 'ms');
        wsReconnectTimer = setTimeout(() => {
          wsReconnectDelay = Math.min(wsReconnectDelay * 1.5, 30000);
          connectWebSocket();
        }, wsReconnectDelay);
      });

      ws.addEventListener('error', (e) => {
        console.warn('[overlay] WS error', e);
        ws.close();
      });
    } catch (e) {
      console.warn('[overlay] WS init failed', e);
    }
  }

  function handleWsMessage(msg) {
    switch (msg.type) {
      case 'post':
      case 'new_post':
        onNewPost(msg.data || msg);
        break;
      case 'holder':
      case 'new_holder':
        onNewHolder(msg.data?.address || msg.address || null);
        if (msg.data?.holderCount && otHolders) {
          otHolders.textContent = Number(msg.data.holderCount).toLocaleString() + ' Souls Saved';
        }
        break;
      case 'price':
        if (otPrice && msg.data?.priceUsd) {
          otPrice.textContent = '$' + parseFloat(msg.data.priceUsd).toFixed(8);
        }
        break;
    }
  }

  /* ─── DEMO MODE (no token yet) ─── */
  function startDemoMode() {
    if (otPrice) otPrice.textContent = 'Token Launching Soon';
    if (otHolders) otHolders.textContent = '0 Souls Saved';

    const demoPosts = [
      { author: 'CryptoFaithful', content: '$PADRE will save us all. Diamond hands until $1.' },
      { author: 'HolderOfGains',  content: 'The Father watches over every wallet. WAGMI congregation.' },
      { author: 'PumpFaithMaxis', content: 'Blessed are those who ape early. The Father provides.' },
      { author: 'SolanaPreacher', content: 'Zero taxes, zero presale. The Father is pure. Amen.' },
    ];

    let idx = 0;
    const fire = () => {
      if (Math.random() > 0.4) {
        onNewPost(demoPosts[idx % demoPosts.length]);
        idx++;
      } else {
        onNewHolder('Demo' + Math.random().toString(36).slice(2, 8));
      }
    };

    // Stagger demo toasts
    setTimeout(fire, 2000);
    setInterval(fire, 6000 + Math.random() * 4000);
  }

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', () => {
    fetchPrice();
    setInterval(fetchPrice, PRICE_INTERVAL);
    connectWebSocket();
  });

})();
