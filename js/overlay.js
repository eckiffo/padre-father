/* ═══════════════════════════════════════════════════════════════
   $PADRE — OBS Overlay JS
   Uses CommunityRealtimeClient with proper ticket auth
   Test mode: ?test  |  Live CA override: ?ca=ADDRESS
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const _p             = new URLSearchParams(location.search);
  const TOKEN_ADDRESS  = _p.get('ca') || window.__PADRE_TOKEN || null;
  const MAX_TOASTS     = 5;
  const TOAST_DURATION = 7000;
  const PRICE_INTERVAL = 30_000;
  const TICKET_REFRESH = 25 * 60 * 1000; // refresh WS ticket every 25min

  const IS_TEST = _p.has('test') || !TOKEN_ADDRESS;

  const toastStack = document.getElementById('toastStack');
  const otPrice    = document.getElementById('otPrice');
  const otHolders  = document.getElementById('otHolders');

  /* ─── FAKE WALLET GENERATOR (test mode) ─── */
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function fakeWallet() {
    let a = '';
    for (let i = 0; i < 44; i++) a += B58[Math.floor(Math.random() * B58.length)];
    return a;
  }
  function shortWallet(a) { return a.slice(0, 4) + '…' + a.slice(-4); }

  function fakeBuyAmount() {
    const amounts = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50];
    const sol     = amounts[Math.floor(Math.random() * amounts.length)];
    const tokens  = (sol * (800000 + Math.random() * 400000)).toFixed(0);
    return { sol, tokens: Number(tokens).toLocaleString() };
  }

  const DEMO_POSTS = [
    { author: 'DiamondHandsDevon',  content: '$PADRE is the last coin I will ever need. Congregation WAGMI. Amen 🙏' },
    { author: 'SolanaPreacher',     content: 'The Father spoke to me in a dream. He said "buy more". I obeyed.' },
    { author: 'CryptoFaithful',     content: 'Blessed are the diamond hands, for they shall inherit the charts. 💎' },
    { author: 'HolderOfGains',      content: 'Zero taxes. Zero presale. Zero rug. The Father is pure. Amen.' },
    { author: 'PumpFaithMaxis',     content: 'Just aped another 5 SOL into $PADRE. The congregation grows stronger.' },
    { author: 'WalletWarden9',      content: 'Chart looking holy right now. $PADRE forming a golden cross. WAGMI.' },
    { author: 'RektToRedeemed',     content: 'I was a paperhander once. The Father forgave me. Never again.' },
    { author: 'OnchainChaplain',    content: 'Telling everyone about $PADRE. The gospel must spread. 📣' },
    { author: 'GloryBagHolder',     content: 'This community is different. Real faith. Real diamond hands.' },
    { author: 'BlessedBagger',      content: 'New ATH incoming. The prophecy is being fulfilled. HOLD THE LINE.' },
  ];

  const DEMO_NAMES = [
    'FaithfulAper','SolSaint','ChainPilgrim','HolyChadler',
    'WalletWarden','DiamondDeacon','PumpProphet','MemeMinister',
    'GloryBagger','RektRedeemer','OnchainOracle','TokenTithes',
  ];

  const ALERT_TYPES  = ['buy','holder','post','buy','post','holder','buy','post'];
  let alertCursor    = 0;
  let fakeHolderCount = 1247;
  let fakePriceUsd   = 0.00000842;
  let realtimeClient = null;

  /* ─── PRICE TICKER ─── */
  async function fetchPrice() {
    if (IS_TEST) {
      fakePriceUsd *= (0.97 + Math.random() * 0.06);
      if (otPrice) otPrice.textContent = `$${fakePriceUsd.toFixed(8)}  ·  MC $${fmtNum(fakePriceUsd * 1_000_000_000)}`;
      return;
    }
    if (!TOKEN_ADDRESS) return;
    try {
      const res  = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`);
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (!pair) return;
      const price = pair.priceUsd ? '$' + parseFloat(pair.priceUsd).toFixed(8) : '—';
      const fdv   = pair.fdv ? '  ·  MC $' + fmtNum(pair.fdv) : '';
      if (otPrice) otPrice.textContent = price + fdv;
    } catch (e) { console.warn('[overlay] price fetch failed', e); }
  }

  function fmtNum(n) {
    if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
    return Number(n).toFixed(2);
  }

  /* ─── TOAST FACTORY ─── */
  function createToast({ type, icon, body, isSoul }) {
    const el    = document.createElement('div');
    el.className = 'toast' + (isSoul ? ' toast--soul' : '');
    const time  = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    el.innerHTML = `
      <div class="toast-header">
        <span class="toast-icon">${icon}</span>
        <span class="toast-type">${esc(type)}</span>
        <span class="toast-time">${time}</span>
      </div>
      <div class="toast-body">${body}</div>
    `;
    return el;
  }

  function pushToast(opts) {
    const existing = toastStack.querySelectorAll('.toast:not(.toast-exit)');
    if (existing.length >= MAX_TOASTS) dismissToast(existing[0]);
    const el    = createToast(opts);
    toastStack.appendChild(el);
    const timer = setTimeout(() => dismissToast(el), TOAST_DURATION);
    el.dataset.timer = String(timer);
  }

  function dismissToast(el) {
    if (!el || el.classList.contains('toast-exit')) return;
    clearTimeout(parseInt(el.dataset.timer || '0'));
    el.classList.add('toast-exit');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 700);
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ─── EVENT HANDLERS ─── */
  function onNewBuy(wallet, sol, tokens) {
    pushToast({
      type: '📈  New Buy — $PADRE',
      icon: '💰',
      isSoul: false,
      body: `<span class="toast-author">${esc(shortWallet(wallet))}</span> bought <span class="toast-author">${esc(tokens)} $PADRE</span> for <strong>${sol} SOL</strong>`,
    });
  }

  function onNewHolder(wallet) {
    fakeHolderCount++;
    if (otHolders) otHolders.textContent = fakeHolderCount.toLocaleString() + ' Souls Saved';
    pushToast({
      type: '✝  A New Soul Has Been Saved',
      icon: '🕯️',
      isSoul: true,
      body: `<span class="toast-author">${esc(shortWallet(wallet))}</span> has received The Father's blessing and joined the congregation.`,
    });
  }

  function onNewPost(post) {
    const author    = post?.author || post?.username || 'Anonymous';
    const content   = post?.content || post?.text || '';
    const truncated = content.length > 140 ? content.slice(0, 137) + '…' : content;
    pushToast({
      type: '✦  Congregation Speaks',
      icon: '💬',
      isSoul: false,
      body: `<span class="toast-author">${esc(author)}:</span> ${esc(truncated)}`,
    });
  }

  function onNewLike(post) {
    // Show like events as a smaller toast
    const author = post?.author || 'Someone';
    pushToast({
      type: '♥  Community Activity',
      icon: '❤️',
      isSoul: false,
      body: `<span class="toast-author">${esc(author)}</span>'s post received a new like`,
    });
  }

  /* ─── REAL-TIME CONNECTION via CommunityRealtimeClient ─── */
  async function connectRealtime() {
    if (!TOKEN_ADDRESS) return;

    // Dynamically load the SDK browser bundle
    // In OBS Browser Source context the page has full network access
    try {
      // Get WS ticket from our server endpoint
      async function getTicket() {
        const res  = await fetch('/api/ws-ticket');
        const data = await res.json();
        if (!data.ticket) throw new Error('No ticket returned');
        return data.ticket;
      }

      // Import browser SDK
      const sdk = await import('https://cdn.jsdelivr.net/npm/@coin-communities/sdk@latest/dist/index.mjs')
        .catch(() => null);

      if (!sdk?.CommunityRealtimeClient) {
        console.warn('[overlay] CommunityRealtimeClient not available in browser bundle, falling back to polling');
        startPolling();
        return;
      }

      realtimeClient = sdk.CommunityRealtimeClient.getOrCreate({
        baseUrl:      'https://api.coin-communities.xyz',
        tokenAddress: TOKEN_ADDRESS,
        auth:         { getTicket },
      });

      realtimeClient.subscribe({
        onConnect:    () => console.log('[overlay] WS connected'),
        onDisconnect: () => {
          console.warn('[overlay] WS disconnected');
          // Attempt reconnect after 5s
          setTimeout(connectRealtime, 5000);
        },
        onMessage:    (event) => {
          // New post in community
          onNewPost(event);
        },
        onLike:       (event) => {
          onNewLike(event);
        },
        onModeration: () => {}, // ignore moderation events in overlay
        onGap:        () => {
          // Gap = we missed some events; could refetch recent posts here
          console.warn('[overlay] WS gap detected');
        },
      });

      // Refresh ticket before it expires
      setInterval(async () => {
        if (realtimeClient) {
          try { realtimeClient.dispose?.(); } catch (_) {}
          realtimeClient = null;
        }
        connectRealtime();
      }, TICKET_REFRESH);

    } catch (e) {
      console.warn('[overlay] realtime init failed, polling instead:', e.message);
      startPolling();
    }
  }

  /* ─── POLLING FALLBACK (if WS not available) ─── */
  let lastSeenId     = null;
  let pollInterval   = null;

  function startPolling() {
    if (pollInterval) return;
    console.log('[overlay] starting poll fallback');
    pollInterval = setInterval(pollCommunity, 15_000);
    pollCommunity();
  }

  async function pollCommunity() {
    try {
      const res   = await fetch('/api/community?limit=3');
      const posts = await res.json();
      if (!Array.isArray(posts) || posts.length === 0) return;

      const newest = posts[0];
      if (!newest?.id) return;
      if (lastSeenId === null) { lastSeenId = newest.id; return; } // first poll, don't toast
      if (newest.id === lastSeenId) return; // nothing new

      // Toast each new post since last poll
      for (const post of posts) {
        if (post.id === lastSeenId) break;
        onNewPost(post);
      }
      lastSeenId = newest.id;
    } catch (e) {
      console.warn('[overlay] poll failed:', e.message);
    }
  }

  /* ─── TEST MODE ─── */
  function startTestMode() {
    if (otPrice)   otPrice.textContent   = `$${fakePriceUsd.toFixed(8)}  ·  MC $${fmtNum(fakePriceUsd * 1_000_000_000)}`;
    if (otHolders) otHolders.textContent = `${fakeHolderCount.toLocaleString()} Souls Saved`;

    const badge       = document.createElement('div');
    badge.style.cssText = 'position:fixed;top:12px;right:12px;font-family:"Cinzel",serif;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.4);color:rgba(201,168,76,.7);padding:5px 12px;border-radius:3px;pointer-events:none;';
    badge.textContent   = '✝ TEST MODE ✝';
    document.body.appendChild(badge);

    function fireNext() {
      const type = ALERT_TYPES[alertCursor++ % ALERT_TYPES.length];
      if (type === 'buy') {
        const { sol, tokens } = fakeBuyAmount();
        onNewBuy(fakeWallet(), sol, tokens);
      } else if (type === 'holder') {
        onNewHolder(fakeWallet());
      } else {
        const p      = DEMO_POSTS[Math.floor(Math.random() * DEMO_POSTS.length)];
        const author = Math.random() > 0.5 ? p.author : DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        onNewPost({ ...p, author });
      }
    }

    setTimeout(fireNext, 1500);
    setInterval(fireNext, 10_000);
    setInterval(fetchPrice, 30_000);
  }

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', () => {
    fetchPrice();

    if (IS_TEST) {
      startTestMode();
    } else {
      setInterval(fetchPrice, PRICE_INTERVAL);
      connectRealtime();
    }
  });

})();
