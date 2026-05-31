/* ═══════════════════════════════════════════════════════
   $PADRE — OBS Overlay  (production)
   Requires: window.PADRE_CA set in js/config.js
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const CA = window.PADRE_CA || new URLSearchParams(location.search).get('ca') || '';

  const PRICE_INTERVAL  = 30_000;   // ms — Dexscreener poll
  const COMMUNITY_POLL  = 20_000;   // ms — community posts poll
  const TOAST_DURATION  = 7_000;    // ms — how long each toast stays
  const MAX_TOASTS      = 5;
  const SOL_RPC_WS      = 'wss://api.mainnet-beta.solana.com';
  const SOL_RPC_HTTP    = 'https://api.mainnet-beta.solana.com';

  const toastStack = document.getElementById('toastStack');
  const otPrice    = document.getElementById('otPrice');
  const otHolders  = document.getElementById('otHolders');

  /* ─── WAITING STATE (no CA yet) ─── */
  if (!CA) {
    if (otPrice) otPrice.textContent = 'Set PADRE_CA in config.js';
    return;
  }

  /* ═══════════════════ PRICE TICKER ═══════════════════ */
  async function fetchPrice() {
    try {
      const res  = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CA}`);
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (!pair) return;

      const price = pair.priceUsd
        ? '$' + parseFloat(pair.priceUsd).toFixed(8)
        : '—';
      const mc = pair.fdv ? '  ·  MC $' + fmt(pair.fdv) : '';
      const vol = pair.volume?.h24 ? '  ·  Vol $' + fmt(pair.volume.h24) : '';

      if (otPrice)   otPrice.textContent   = price + mc + vol;
      if (otHolders) otHolders.textContent = ''; // holder count not in Dexscreener
    } catch (e) {
      console.warn('[overlay] price fetch failed', e);
    }
  }

  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Number(n).toFixed(2);
  }

  /* ═══════════════════ TOASTS ═══════════════════ */
  function pushToast({ type, icon, body, soul }) {
    const existing = toastStack.querySelectorAll('.toast:not(.toast-exit)');
    if (existing.length >= MAX_TOASTS) dismiss(existing[0]);

    const el  = document.createElement('div');
    el.className = 'toast' + (soul ? ' toast--soul' : '');
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    el.innerHTML = `
      <div class="toast-header">
        <span class="toast-icon">${icon}</span>
        <span class="toast-type">${esc(type)}</span>
        <span class="toast-time">${time}</span>
      </div>
      <div class="toast-body">${body}</div>`;

    toastStack.appendChild(el);
    const t = setTimeout(() => dismiss(el), TOAST_DURATION);
    el.dataset.timer = String(t);
  }

  function dismiss(el) {
    if (!el || el.classList.contains('toast-exit')) return;
    clearTimeout(parseInt(el.dataset.timer || '0'));
    el.classList.add('toast-exit');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 700);
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function shortWallet(addr) {
    return String(addr).slice(0, 4) + '…' + String(addr).slice(-4);
  }

  /* ─── Toast types ─── */
  function toastBuy(wallet, solAmt, tokenAmt) {
    const tokens = tokenAmt
      ? `<strong>${esc(tokenAmt)} $PADRE</strong> for `
      : '';
    pushToast({
      type: '📈  New Buy — $PADRE',
      icon: '💰',
      soul: false,
      body: `<span class="toast-author">${esc(shortWallet(wallet))}</span> bought ${tokens}<strong>${esc(solAmt)} SOL</strong>`,
    });
  }

  function toastNewHolder(wallet) {
    pushToast({
      type: '✝  A New Soul Has Been Saved',
      icon: '🕯️',
      soul: true,
      body: `<span class="toast-author">${esc(shortWallet(wallet))}</span> has received The Father's blessing and joined the congregation.`,
    });
  }

  function toastPost(author, content) {
    const truncated = content.length > 140 ? content.slice(0, 137) + '…' : content;
    pushToast({
      type: '✦  Congregation Speaks',
      icon: '💬',
      soul: false,
      body: `<span class="toast-author">${esc(author)}:</span> ${esc(truncated)}`,
    });
  }

  /* ═══════════════════ SOLANA RPC — BUY DETECTION ═══════════════════ */
  let solWs         = null;
  let txQueue       = [];
  let processingTx  = false;
  let seenSigs      = new Set();  // deduplicate within session

  async function parseTx(sig) {
    try {
      const res = await fetch(SOL_RPC_HTTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method:  'getTransaction',
          params:  [sig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
        }),
      });
      const data = await res.json();
      const tx   = data?.result;
      if (!tx || tx.meta?.err) return null;          // failed tx, skip

      const keys       = tx.transaction?.message?.accountKeys || [];
      const preSol     = tx.meta?.preBalances  || [];
      const postSol    = tx.meta?.postBalances || [];
      const fee        = tx.meta?.fee || 0;

      // Buyer = first signer; SOL spent = decrease in their balance minus fee
      const solSpent = (preSol[0] - postSol[0] - fee) / 1e9;
      if (solSpent < 0.001) return null;             // dust / not a buy

      const buyer = keys[0]?.pubkey || keys[0];

      // Token amount received by any wallet in this tx
      const preTokens  = tx.meta?.preTokenBalances  || [];
      const postTokens = tx.meta?.postTokenBalances || [];
      let tokenReceived = 0;
      let isNewHolder   = false;

      for (const post of postTokens) {
        if (post.mint !== CA) continue;
        const pre     = preTokens.find(p => p.accountIndex === post.accountIndex);
        const preAmt  = pre?.uiTokenAmount?.uiAmount || 0;
        const postAmt = post.uiTokenAmount?.uiAmount  || 0;
        const diff    = postAmt - preAmt;
        if (diff > tokenReceived) tokenReceived = diff;
        if (preAmt === 0 && postAmt > 0) isNewHolder = true;
      }

      return {
        buyer:        String(buyer),
        solSpent:     solSpent.toFixed(3),
        tokenReceived: tokenReceived > 0
          ? Number(tokenReceived.toFixed(0)).toLocaleString()
          : null,
        isNewHolder,
      };
    } catch (e) {
      console.warn('[overlay] parseTx failed', e);
      return null;
    }
  }

  async function drainQueue() {
    if (processingTx || txQueue.length === 0) return;
    processingTx = true;

    while (txQueue.length > 0) {
      const sig    = txQueue.shift();
      const result = await parseTx(sig);
      if (result) {
        if (result.isNewHolder) toastNewHolder(result.buyer);
        else                    toastBuy(result.buyer, result.solSpent, result.tokenReceived);
      }
      // Small delay between RPC calls to avoid rate-limiting
      await new Promise(r => setTimeout(r, 400));
    }

    processingTx = false;
  }

  function connectSolanaWS() {
    if (solWs) { try { solWs.close(); } catch (_) {} }

    solWs = new WebSocket(SOL_RPC_WS);

    solWs.onopen = () => {
      console.log('[overlay] Solana WS connected');
      solWs.send(JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method:  'logsSubscribe',
        params:  [
          { mentions: [CA] },
          { commitment: 'confirmed' },
        ],
      }));
    };

    solWs.onmessage = (msg) => {
      try {
        const data  = JSON.parse(msg.data);
        if (data.method !== 'logsNotification') return;

        const value = data.params?.result?.value;
        if (!value || value.err) return;             // failed tx, skip

        const logs = value.logs || [];
        const sig  = value.signature;
        if (!sig || seenSigs.has(sig)) return;

        // Only care about buys (pump.fun "Instruction: Buy" or generic swap logs)
        const isBuy = logs.some(l =>
          l.includes('Instruction: Buy') ||
          l.includes('ray_log') ||
          l.includes('Instruction: Swap')
        );
        if (!isBuy) return;

        seenSigs.add(sig);
        if (seenSigs.size > 200) {
          // Keep set from growing unbounded
          const oldest = [...seenSigs].slice(0, 100);
          oldest.forEach(s => seenSigs.delete(s));
        }

        txQueue.push(sig);
        drainQueue();
      } catch (_) {}
    };

    solWs.onclose = () => {
      console.warn('[overlay] Solana WS closed — reconnecting in 4s');
      setTimeout(connectSolanaWS, 4000);
    };

    solWs.onerror = () => solWs.close();
  }

  /* ═══════════════════ COMMUNITY POSTS ═══════════════════ */
  let lastPostId = null;

  async function pollCommunity() {
    try {
      const res   = await fetch('/api/community?limit=5');
      if (!res.ok) return;
      const posts = await res.json();
      if (!Array.isArray(posts) || posts.length === 0) return;

      const newest = posts[0];
      if (!newest?.id) return;
      if (lastPostId === null) { lastPostId = newest.id; return; } // first poll, no toast
      if (newest.id === lastPostId) return;

      for (const post of posts) {
        if (post.id === lastPostId) break;
        const author  = post.author || post.username || 'Anonymous';
        const content = post.content || post.text || '';
        if (content) toastPost(author, content);
      }
      lastPostId = newest.id;
    } catch (_) {}
  }

  /* ═══════════════════ INIT ═══════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    fetchPrice();
    setInterval(fetchPrice, PRICE_INTERVAL);

    connectSolanaWS();

    // Community posts — start polling after 5s delay (let WS connect first)
    setTimeout(() => {
      pollCommunity();
      setInterval(pollCommunity, COMMUNITY_POLL);
    }, 5000);
  });

})();
