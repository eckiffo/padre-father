/* ═══════════════════════════════════════════════════════════════
   $PADRE — OBS Overlay JS
   Coin Communities WebSocket + Dexscreener price polling
   Test mode: add ?test to URL to force demo alerts
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Priority: ?ca= URL param → window.__PADRE_TOKEN env var → null (demo mode)
  const _p             = new URLSearchParams(location.search);
  const TOKEN_ADDRESS  = _p.get('ca') || window.__PADRE_TOKEN || null;
  const MAX_TOASTS     = 5;
  const TOAST_DURATION = 7000;   // ms before auto-dismiss
  const PRICE_INTERVAL = 30000;  // poll live price every 30s

  // Force test mode via ?test in URL, or automatically when no token
  const IS_TEST = _p.has('test') || !TOKEN_ADDRESS;

  const toastStack = document.getElementById('toastStack');
  const otPrice    = document.getElementById('otPrice');
  const otHolders  = document.getElementById('otHolders');

  /* ─── FAKE SOLANA WALLET GENERATOR ─── */
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function fakeWallet() {
    let addr = '';
    for (let i = 0; i < 44; i++) addr += BASE58[Math.floor(Math.random() * BASE58.length)];
    return addr;
  }
  function shortWallet(addr) {
    return addr.slice(0, 4) + '…' + addr.slice(-4);
  }

  /* ─── FAKE BUY AMOUNTS ─── */
  function fakeBuyAmount() {
    const amounts = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50];
    const sol = amounts[Math.floor(Math.random() * amounts.length)];
    const tokens = (sol * (800000 + Math.random() * 400000)).toFixed(0);
    return { sol, tokens: Number(tokens).toLocaleString() };
  }

  /* ─── DEMO DATA POOLS ─── */
  const DEMO_POSTS = [
    { author: 'DiamondHandsDevon',  content: '$PADRE is the last coin I will ever need. Congregation WAGMI. Amen 🙏' },
    { author: 'SolanaPreacher',     content: 'The Father spoke to me in a dream. He said "buy more". I obeyed.' },
    { author: 'CryptoFaithful',     content: 'Blessed are the diamond hands, for they shall inherit the charts. 💎' },
    { author: 'HolderOfGains',      content: 'Zero taxes. Zero presale. Zero rug. The Father is pure. Amen.' },
    { author: 'PumpFaithMaxis',     content: 'Just aped another 5 SOL into $PADRE. The congregation grows stronger.' },
    { author: 'WalletWarden9',      content: 'Chart looking holy right now. $PADRE forming a golden cross. Not financial advice but WAGMI.' },
    { author: 'RektToRedeemed',     content: 'I was a paperhander once. The Father forgave me. I am reborn. Never again.' },
    { author: 'OnchainChaplain',    content: 'Telling everyone in my server about $PADRE. The gospel must spread. 📣' },
    { author: 'GloryBagHolder',     content: 'This community is different. Real faith. Real diamond hands. Real gains.' },
    { author: 'SermonsAndSolana',   content: '$PADRE sermon tonight was FIRE. Father called $1 by end of month. Congregation erupted.' },
    { author: 'ApingWithFaith',     content: 'LP burned. Contract renounced. The Father trusts his flock. We trust The Father. 🔥' },
    { author: 'BlessedBagger',      content: 'New ATH incoming. The prophecy is being fulfilled. HOLD THE LINE CONGREGATION.' },
  ];

  const DEMO_NAMES = [
    'FaithfulAper', 'SolSaint', 'ChainPilgrim', 'HolyChadler',
    'WalletWarden', 'DiamondDeacon', 'PumpProphet', 'MemeMinister',
    'GloryBagger', 'RektRedeemer', 'OnchainOracle', 'TokenTithes',
    'BlessedHolder', 'SolanaSeraph', 'CryptoClergy', 'ApeApostle',
  ];

  /* ─── ALERT TYPES (cycles in order for test mode) ─── */
  const ALERT_TYPES = ['buy', 'holder', 'post', 'buy', 'post', 'holder', 'buy', 'post'];
  let alertCursor = 0;
  let fakeHolderCount = 1247;
  let fakePriceUsd = 0.00000842;

  /* ─── PRICE TICKER ─── */
  async function fetchPrice() {
    if (IS_TEST) {
      // Gently drift the fake price
      fakePriceUsd *= (0.97 + Math.random() * 0.06);
      const change = (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 12).toFixed(1) + '%';
      if (otPrice) otPrice.textContent = `$${fakePriceUsd.toFixed(8)}  ·  MC $${formatNum(fakePriceUsd * 1_000_000_000)}`;
      return;
    }
    if (!TOKEN_ADDRESS) return;
    try {
      const res  = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`);
      const data = await res.json();
      const pair = data?.pairs?.[0];
      if (!pair) return;
      const price = pair.priceUsd ? '$' + parseFloat(pair.priceUsd).toFixed(8) : '—';
      const fdv   = pair.fdv ? 'MC $' + formatNum(pair.fdv) : '';
      if (otPrice) otPrice.textContent = fdv ? `${price}  ·  ${fdv}` : price;
    } catch (e) {
      console.warn('[overlay] price fetch failed:', e);
    }
  }

  function formatNum(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Number(n).toFixed(2);
  }

  /* ─── TOAST FACTORY ─── */
  function createToast({ type, icon, body, isSoul }) {
    const el = document.createElement('div');
    el.className = 'toast' + (isSoul ? ' toast--soul' : '');

    const now     = new Date();
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
    const existing = toastStack.querySelectorAll('.toast:not(.toast-exit)');
    if (existing.length >= MAX_TOASTS) dismissToast(existing[0]);

    const el = createToast(opts);
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

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─── EVENT HANDLERS ─── */
  function onNewBuy(walletAddr, solAmount, tokenAmount) {
    const short = shortWallet(walletAddr);
    pushToast({
      type: '📈  New Buy — $PADRE',
      icon: '💰',
      isSoul: false,
      body: `<span class="toast-author">${escHtml(short)}</span> just bought <span class="toast-author">${tokenAmount} $PADRE</span> for <strong>${solAmount} SOL</strong>`,
    });
  }

  function onNewHolder(holderAddr) {
    fakeHolderCount++;
    if (otHolders) otHolders.textContent = fakeHolderCount.toLocaleString() + ' Souls Saved';
    const short = holderAddr ? shortWallet(holderAddr) : 'A new soul';
    pushToast({
      type: '✝  A New Soul Has Been Saved',
      icon: '🕯️',
      isSoul: true,
      body: `<span class="toast-author">${escHtml(short)}</span> has received The Father's blessing and joined the congregation.`,
    });
  }

  function onNewPost(post) {
    const author    = post?.author  || 'Anonymous';
    const content   = post?.content || '';
    const truncated = content.length > 140 ? content.slice(0, 137) + '…' : content;
    pushToast({
      type: '✦  Congregation Speaks',
      icon: '💬',
      isSoul: false,
      body: `<span class="toast-author">${escHtml(author)}:</span> ${escHtml(truncated)}`,
    });
  }

  /* ─── TEST MODE — fires every 10s, cycles all types ─── */
  function startTestMode() {
    // Initial fake ticker values
    if (otPrice)   otPrice.textContent   = `$${fakePriceUsd.toFixed(8)}  ·  MC $${formatNum(fakePriceUsd * 1_000_000_000)}`;
    if (otHolders) otHolders.textContent = `${fakeHolderCount.toLocaleString()} Souls Saved`;

    // Show TEST MODE badge
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed; top: 12px; right: 12px;
      font-family: 'Cinzel', serif; font-size: 10px; font-weight: 700;
      letter-spacing: .2em; text-transform: uppercase;
      background: rgba(201,168,76,.15); border: 1px solid rgba(201,168,76,.4);
      color: rgba(201,168,76,.7); padding: 5px 12px; border-radius: 3px;
      pointer-events: none;
    `;
    badge.textContent = '✝ TEST MODE ✝';
    document.body.appendChild(badge);

    function fireNext() {
      const type = ALERT_TYPES[alertCursor % ALERT_TYPES.length];
      alertCursor++;

      if (type === 'buy') {
        const wallet = fakeWallet();
        const { sol, tokens } = fakeBuyAmount();
        onNewBuy(wallet, sol, tokens);
      } else if (type === 'holder') {
        onNewHolder(fakeWallet());
      } else {
        const post = DEMO_POSTS[Math.floor(Math.random() * DEMO_POSTS.length)];
        // Occasionally randomise the author name too
        const author = Math.random() > 0.5
          ? post.author
          : DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
        onNewPost({ ...post, author });
      }
    }

    // First toast after 1.5s so OBS has time to render the page
    setTimeout(fireNext, 1500);
    // Then one every 10 seconds, looping forever
    setInterval(fireNext, 10000);

    // Also tick the fake price every 30s
    setInterval(fetchPrice, 30000);
  }

  /* ─── WEBSOCKET (live mode) ─── */
  let ws = null;
  let wsReconnectDelay = 2000;

  function connectWebSocket() {
    try {
      ws = new WebSocket(`wss://ws.coincommunities.io?token=${TOKEN_ADDRESS}`);

      ws.addEventListener('open', () => {
        console.log('[overlay] WS connected');
        wsReconnectDelay = 2000;
        ws.send(JSON.stringify({
          action:       'subscribe',
          tokenAddress: TOKEN_ADDRESS,
          apiKey:       window.__CC_API_KEY || '',
        }));
      });

      ws.addEventListener('message', (e) => {
        try { handleWsMessage(JSON.parse(e.data)); }
        catch (err) { console.warn('[overlay] WS parse error', err); }
      });

      ws.addEventListener('close', () => {
        console.warn('[overlay] WS closed — reconnecting in', wsReconnectDelay, 'ms');
        setTimeout(() => {
          wsReconnectDelay = Math.min(wsReconnectDelay * 1.5, 30000);
          connectWebSocket();
        }, wsReconnectDelay);
      });

      ws.addEventListener('error', () => ws.close());
    } catch (e) {
      console.warn('[overlay] WS init failed', e);
    }
  }

  function handleWsMessage(msg) {
    switch (msg.type) {
      case 'buy':
      case 'new_buy':
        onNewBuy(
          msg.data?.address || msg.address || fakeWallet(),
          msg.data?.solAmount || '?',
          msg.data?.tokenAmount ? Number(msg.data.tokenAmount).toLocaleString() : '?'
        );
        break;
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
          const p   = parseFloat(msg.data.priceUsd).toFixed(8);
          const fdv = msg.data.fdv ? '  ·  MC $' + formatNum(msg.data.fdv) : '';
          otPrice.textContent = `$${p}${fdv}`;
        }
        break;
    }
  }

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', () => {
    if (IS_TEST) {
      startTestMode();
    } else {
      fetchPrice();
      setInterval(fetchPrice, PRICE_INTERVAL);
      connectWebSocket();
    }
  });

})();
