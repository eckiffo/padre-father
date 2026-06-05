/* ═══════════════════════════════════════════════
   PADRE Card Game — Game Engine
   1997 Anime Yu-Gi-Oh rules
   ═══════════════════════════════════════════════ */

const G = {

  // ── STATE ─────────────────────────────────────

  state: null,
  selectedHandIdx: null,
  selectedFieldZone: null,
  pendingTributes: [],
  tributesNeeded: 0,
  pendingCard: null,
  attackSource: null,
  mode: null, // 'summon-target' | 'attack-target' | 'tribute' | 'spell-target' | 'set-target' | 'trap-target'

  // ── TIMER ─────────────────────────────────────
  _turnTimer: null,
  _turnTimeLeft: 60,
  TURN_SECONDS: 60,

  // ── INIT ──────────────────────────────────────

  init() {
    this._bindUI();
    this._showScreen('select');
    this._renderDeckSelect();
  },

  _showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
  },

  // ── DECK SELECT ───────────────────────────────

  _renderDeckSelect() {
    const grid = document.getElementById('deck-grid');
    grid.innerHTML = '';
    const icons = { father:'⛪', dev:'💻', degen:'🦍', kol:'📢', jeet:'📉', whale:'🐋', rugged:'🚪', ct_girl:'👩‍💻' };
    const diffStars = n => '★'.repeat(n) + '☆'.repeat(5-n);

    Object.values(PADRE_DECKS).forEach(deck => {
      const boss = PADRE_CARDS[deck.boss_card];
      const el = document.createElement('div');
      el.className = 'deck-card';
      el.style.setProperty('--deck-color', deck.color);
      el.innerHTML = `
        <span class="deck-icon">${icons[deck.id] || '🃏'}</span>
        <div class="deck-name">${deck.name}</div>
        <div class="deck-boss">${boss ? boss.name : ''}</div>
        <div class="difficulty-stars">${diffStars(deck.difficulty)}</div>
        <div class="deck-quote">${deck.quote}</div>
      `;
      el.addEventListener('click', () => this._selectDeck(deck.id));
      grid.appendChild(el);
    });
  },

  _selectDeck(deckId) {
    document.querySelectorAll('.deck-card').forEach((c,i) => {
      c.classList.toggle('selected', Object.keys(PADRE_DECKS)[i] === deckId);
    });
    const deck = PADRE_DECKS[deckId];
    document.getElementById('sel-name').textContent = deck.name;
    document.getElementById('sel-desc').textContent = deck.description;
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-start').dataset.deck = deckId;
  },

  // ── START GAME ────────────────────────────────

  startGame(playerDeckId) {
    // pick random opponent deck that isn't the player's
    const deckIds = Object.keys(PADRE_DECKS).filter(d => d !== playerDeckId);
    const oppDeckId = deckIds[Math.floor(Math.random() * deckIds.length)];

    this.state = {
      turn: 'player',
      phase: 'draw',
      turnNum: 1,
      player: this._initSide('player', playerDeckId),
      opponent: this._initSide('opponent', oppDeckId),
    };

    this._showScreen('game');
    this._renderTopbar();
    this._renderOppHand();
    this._renderField();
    this._renderHand();
    this._setPhase('draw');
    this._showTurnOverlay('YOUR TURN', 'DRAW PHASE');
  },

  _initSide(who, deckId) {
    const deck = PADRE_DECKS[deckId];
    // build full card list from id refs, shuffle
    const cardList = deck.cards.map(id => ({ ...PADRE_CARDS[id], uid: Math.random().toString(36).slice(2) }));
    this._shuffle(cardList);
    const hand = cardList.splice(0, 5);
    return {
      who,
      deckId,
      deckName: deck.name,
      faith: 8000,
      deck: cardList,
      hand,
      field: {
        monsters: [null,null,null,null,null],
        spells:   [null,null,null,null,null],
        fieldSpell: null,
      },
      graveyard: [],
      normalSummonUsed: false,
      attackedThisTurn: new Set(),
    };
  },

  // ── PHASE SYSTEM ──────────────────────────────

  _setPhase(phase) {
    const s = this.state;
    s.phase = phase;
    this._clearMode();
    this.selectedHandIdx = null;
    this.attackSource = null;

    document.getElementById('phase-display').textContent = phase.toUpperCase().replace('1','1').replace('2','2');
    document.querySelectorAll('.phase-btn').forEach(b => b.classList.toggle('active', b.dataset.phase === phase));

    const isPlayer = s.turn === 'player';
    document.getElementById('btn-battle').disabled = !isPlayer || phase !== 'main1';
    document.getElementById('btn-end').disabled = !isPlayer || (phase !== 'main1' && phase !== 'battle' && phase !== 'main2');
    document.getElementById('btn-main2').disabled = !isPlayer || phase !== 'battle';

    const me = s[s.turn === 'player' ? 'player' : 'opponent'];

    switch(phase) {
      case 'draw':
        this._phaseAnnounce('DRAW');
        this._doDrawPhase();
        break;
      case 'standby':
        this._phaseAnnounce('STANDBY');
        this._doStandbyPhase();
        break;
      case 'main1':
        this._phaseAnnounce('MAIN');
        this._renderHand();
        this._renderField();
        if (s.turn === 'opponent') setTimeout(() => this._aiMainPhase(), 800);
        break;
      case 'battle':
        this._phaseAnnounce('BATTLE');
        this._renderField();
        if (s.turn === 'opponent') setTimeout(() => this._aiBattlePhase(), 600);
        break;
      case 'main2':
        this._phaseAnnounce('MAIN 2');
        this._renderHand();
        this._renderField();
        if (s.turn === 'opponent') setTimeout(() => this._setPhase('end'), 500);
        break;
      case 'end':
        this._stopTimer();
        this._doEndPhase();
        break;
    }

    // start/stop timer based on whose turn it is and what phase
    if (s.turn === 'player' && (phase === 'main1' || phase === 'battle' || phase === 'main2')) {
      if (phase === 'main1') this._startTimer(); // only reset on main1 entry
    }
  },

  _doDrawPhase() {
    const s = this.state;
    const me = s[s.turn === 'player' ? 'player' : 'opponent'];
    if (me.deck.length === 0) {
      this._endGame(s.turn === 'player' ? 'opponent' : 'player', 'deck out');
      return;
    }
    const drawn = me.deck.splice(0,1)[0];
    me.hand.push(drawn);
    if (s.turn === 'player') {
      this._log(`You drew ${drawn.name}`, 'summon');
      this._renderHand();
    } else {
      this._renderOppHand();
    }
    this._renderTopbar();
    setTimeout(() => this._setPhase('standby'), 400);
  },

  _doStandbyPhase() {
    // handle continuous effects (Viral World cost, Viral Post cost)
    const s = this.state;
    const me = s[s.turn === 'player' ? 'player' : 'opponent'];
    let cost = 0;
    me.field.monsters.forEach(card => {
      if (!card) return;
      if (card.id === 'viral_post' || card.id === 'viral_thread') cost += 500;
      if (card.id === 'the_believer') {
        card.atk = (card._base_atk || card.atk) + 200;
        card._base_atk = card._base_atk || (card.atk - 200);
        this._log(`${card.name} grows stronger (${card.atk} ATK)`, 'summon');
      }
    });
    if (me.field.fieldSpell && me.field.fieldSpell.id === 'viral_world') cost += 500 * me.field.monsters.filter(Boolean).length;
    if (cost > 0) {
      me.faith = Math.max(0, me.faith - cost);
      this._log(`${me.who} pays ${cost} Faith maintenance`, 'damage');
      this._renderTopbar();
      if (me.faith <= 0) { this._endGame(s.turn === 'player' ? 'opponent' : 'player', 'maintenance cost'); return; }
    }
    setTimeout(() => this._setPhase('main1'), 300);
  },

  _doEndPhase() {
    const s = this.state;
    const me = s[s.turn === 'player' ? 'player' : 'opponent'];
    // discard to 6
    while (me.hand.length > 6) {
      const disc = me.hand.pop();
      me.graveyard.push(disc);
      if (s.turn === 'player') this._log(`Discarded ${disc.name} (hand limit)`, 'destroy');
    }
    // decrement lock turns
    if (me._lockTurns > 0) me._lockTurns--;
    // reset
    me.normalSummonUsed = false;
    me.attackedThisTurn = new Set();
    // switch turn
    s.turn = s.turn === 'player' ? 'opponent' : 'player';
    s.turnNum++;
    this._renderTopbar();
    this._renderHand();
    this._renderOppHand();
    this._renderField();

    const name = s.turn === 'player' ? 'YOUR TURN' : `${s.opponent.deckName.toUpperCase()}'S TURN`;
    this._showTurnOverlay(name, 'DRAW PHASE', () => this._setPhase('draw'));
  },

  // ── TIMER ─────────────────────────────────────

  _startTimer() {
    this._stopTimer();
    this._turnTimeLeft = this.TURN_SECONDS;
    this._updateTimerUI();
    this._turnTimer = setInterval(() => {
      this._turnTimeLeft--;
      this._updateTimerUI();
      if (this._turnTimeLeft <= 0) {
        this._stopTimer();
        this._log('Time up! Turn ended automatically', 'phase');
        this._setPhase('end');
      }
    }, 1000);
  },

  _stopTimer() {
    clearInterval(this._turnTimer);
    this._turnTimer = null;
    this._updateTimerUI();
  },

  _updateTimerUI() {
    const el = document.getElementById('turn-timer');
    if (!el) return;
    const s = this.state;
    const active = this._turnTimer !== null;
    el.textContent = active ? `${this._turnTimeLeft}s` : '';
    el.className = 'turn-timer' + (this._turnTimeLeft <= 10 && active ? ' urgent' : '');
  },

  // ── TRIBUTE SUMMON ────────────────────────────

  _startTribute(card, targetZoneIdx) {
    const needed = card.stars <= 6 ? 1 : 2;
    this.tributesNeeded = needed;
    this.pendingTributes = [];
    this.pendingCard = { card, targetZoneIdx };
    this.mode = 'tribute';
    this._log(`Select ${needed} monster(s) to tribute`, 'phase');
    this._highlightTributeTargets();
    this._renderField();
  },

  _highlightTributeTargets() {
    document.querySelectorAll('.player-monster-slot .field-card').forEach((el, i) => {
      el.classList.add('tribute-glow');
    });
  },

  _selectTribute(slotIdx) {
    if (!this.pendingTributes.includes(slotIdx)) {
      this.pendingTributes.push(slotIdx);
    }
    if (this.pendingTributes.length >= this.tributesNeeded) {
      this._completeTribute();
    }
  },

  _completeTribute() {
    const s = this.state;
    const me = s.player;
    const { card, targetZoneIdx } = this.pendingCard;
    // remove tributed monsters
    this.pendingTributes.forEach(idx => {
      const tributed = me.field.monsters[idx];
      if (tributed) {
        me.graveyard.push(tributed);
        me.field.monsters[idx] = null;
        this._log(`Tributed ${tributed.name}`, 'destroy');
      }
    });
    // place card
    card._atk = card.atk;
    card._def = card.def;
    card.position = 'attack';
    me.field.monsters[targetZoneIdx] = card;
    me.normalSummonUsed = true;
    this._log(`Tribute Summoned ${card.name}!`, 'summon');
    this._onSummonEffect(card, 'player');
    this.mode = null;
    this.pendingCard = null;
    this.pendingTributes = [];
    this._renderField();
    this._renderHand();
  },

  // ── SUMMON (Player) ───────────────────────────

  _summonMonster(handIdx, slotIdx) {
    const s = this.state;
    const me = s.player;
    const card = me.hand[handIdx];
    if (!card) return;

    // check tribute needed
    if (card.stars >= 5) {
      // remove from hand first
      me.hand.splice(handIdx, 1);
      this.selectedHandIdx = null;
      this._startTribute(card, slotIdx);
      return;
    }

    // normal summon
    if (me.normalSummonUsed) { this._toast('Already summoned this turn'); return; }
    if (me.field.monsters[slotIdx] !== null) { this._toast('Zone occupied'); return; }

    me.hand.splice(handIdx, 1);
    card.position = 'attack';
    card._atk = card.atk;
    card._def = card.def;
    me.field.monsters[slotIdx] = card;
    me.normalSummonUsed = true;
    this.selectedHandIdx = null;
    this._log(`You summoned ${card.name} (${card.atk}/${card.def})`, 'summon');
    this._onSummonEffect(card, 'player');
    this._renderField();
    this._renderHand();
  },

  _setMonster(handIdx, slotIdx) {
    const s = this.state;
    const me = s.player;
    const card = me.hand[handIdx];
    if (me.normalSummonUsed) { this._toast('Already summoned this turn'); return; }
    if (me.field.monsters[slotIdx] !== null) { this._toast('Zone occupied'); return; }
    me.hand.splice(handIdx, 1);
    card.position = 'defense';
    card.faceDown = true;
    card._atk = card.atk;
    card._def = card.def;
    me.field.monsters[slotIdx] = card;
    me.normalSummonUsed = true;
    this.selectedHandIdx = null;
    this._log(`You set a monster face-down`, 'summon');
    this._renderField();
    this._renderHand();
  },

  // ── PLAY SPELL/TRAP ───────────────────────────

  _playSpell(handIdx, slotIdx) {
    const s = this.state;
    const me = s.player;
    const card = me.hand[handIdx];
    if (!card) return;

    if (card.subtype === 'continuous' || card.subtype === 'field') {
      if (card.subtype === 'field') {
        if (me.field.fieldSpell) { me.graveyard.push(me.field.fieldSpell); }
        me.field.fieldSpell = card;
      } else {
        if (me.field.spells[slotIdx] !== null) { this._toast('Zone occupied'); return; }
        me.field.spells[slotIdx] = card;
      }
      me.hand.splice(handIdx, 1);
      this._log(`Activated ${card.name}`, 'summon');
      this._applySpellEffect(card, 'player');
    } else {
      // normal spell — instant effect
      me.hand.splice(handIdx, 1);
      me.graveyard.push(card);
      this._log(`Activated ${card.name}`, 'summon');
      this._applySpellEffect(card, 'player');
    }
    this.selectedHandIdx = null;
    this._renderField();
    this._renderHand();
  },

  _setTrap(handIdx, slotIdx) {
    const s = this.state;
    const me = s.player;
    const card = me.hand[handIdx];
    if (me.field.spells[slotIdx] !== null) { this._toast('Zone occupied'); return; }
    me.hand.splice(handIdx, 1);
    card.faceDown = true;
    me.field.spells[slotIdx] = card;
    this.selectedHandIdx = null;
    this._log(`Set a card face-down`, 'summon');
    this._renderField();
    this._renderHand();
  },

  // ── SPELL EFFECTS ─────────────────────────────

  _applySpellEffect(card, side) {
    const s = this.state;
    const me = side === 'player' ? s.player : s.opponent;
    const opp = side === 'player' ? s.opponent : s.player;

    switch(card.id) {
      case 'ape_in':
        for(let i=0;i<2;i++) {
          if(me.deck.length>0) me.hand.push(me.deck.splice(0,1)[0]);
        }
        this._log(`${side} drew 2 cards`, 'summon');
        if(side==='player') this._renderHand(); else this._renderOppHand();
        break;

      case 'second_chance': {
        // resurrect strongest from either graveyard
        const allGrave = [...me.graveyard, ...opp.graveyard].filter(c=>c.type==='monster');
        if(allGrave.length===0){this._log('No monsters in Trenches','muted');break;}
        const best = allGrave.sort((a,b)=>(b.atk||0)-(a.atk||0))[0];
        const slot = me.field.monsters.findIndex(m=>!m);
        if(slot===-1){this._log('No space on field','muted');break;}
        // remove from graveyard
        const gi = me.graveyard.indexOf(best);
        if(gi>-1) me.graveyard.splice(gi,1);
        else { const ogi = opp.graveyard.indexOf(best); if(ogi>-1) opp.graveyard.splice(ogi,1); }
        best.position='attack'; best.faceDown=false;
        me.field.monsters[slot]=best;
        this._log(`${best.name} rises from The Trenches!`,'summon');
        this._renderField();
        break;
      }

      case 'market_crash':
        [...s.player.field.monsters,...s.opponent.field.monsters].forEach((c,i)=>{
          if(!c) return;
          if(i<5) { s.player.field.monsters[i]=null; s.player.graveyard.push(c); }
          else { s.opponent.field.monsters[i-5]=null; s.opponent.graveyard.push(c); }
        });
        this._log('Market Crash — all monsters destroyed!','destroy');
        this._renderField();
        break;

      case 'diamond_hands_lock':
        opp._lockTurns = 3;
        this._log(`${opp.who} cannot attack for 3 turns`,'summon');
        break;

      case 'narrative_shift': {
        const targets = opp.field.monsters.filter(Boolean);
        if(targets.length===0){this._log('No targets','muted');break;}
        const stolen = targets[0];
        const oi = opp.field.monsters.indexOf(stolen);
        opp.field.monsters[oi]=null;
        const slot = me.field.monsters.findIndex(m=>!m);
        if(slot>-1){ me.field.monsters[slot]=stolen; this._log(`${stolen.name} stolen until End Phase`,'summon'); }
        this._renderField();
        break;
      }

      case 'market_wipe':
        [...s.player.field.spells,...s.opponent.field.spells].forEach((c,i)=>{
          if(!c) return;
          if(i<5){s.player.graveyard.push(c); s.player.field.spells[i]=null;}
          else{s.opponent.graveyard.push(c); s.opponent.field.spells[i-5]=null;}
        });
        this._log('All spells and traps wiped!','destroy');
        this._renderField();
        break;

      case 'ct_wipes_the_board':
        opp.field.spells.forEach((c,i)=>{if(c){opp.graveyard.push(c);opp.field.spells[i]=null;}});
        this._log('CT Wipes the Board — all opponent S/T destroyed!','destroy');
        this._renderField();
        break;

      case 'green_candle': {
        const target = me.field.monsters.find(Boolean);
        if(!target){this._log('No monsters to buff','muted');break;}
        const roll = Math.ceil(Math.random()*6);
        const old = target.atk;
        target.atk = target.atk * roll;
        target._tempAtk = target.atk;
        this._log(`Green Candle! Rolled ${roll}. ${target.name} ATK: ${old} → ${target.atk}`,'summon');
        this._renderField();
        break;
      }

      case 'two_x_leverage': {
        const target = me.field.monsters.find(Boolean);
        if(!target) break;
        if(me.faith < opp.faith){ target.atk*=2; this._log(`2x Leverage! ${target.name} ATK doubled to ${target.atk}`,'summon'); }
        else { target.atk=Math.floor(target.atk/2); this._log(`2x Leverage backfired. ${target.name} ATK halved to ${target.atk}`,'damage'); }
        this._renderField();
        break;
      }

      case 'paper_bag': {
        const target = opp.field.monsters.find(Boolean);
        if(!target){this._log('No targets','muted');break;}
        target.atk=Math.floor(target.atk/2);
        this._log(`Paper Bag: ${target.name} ATK halved to ${target.atk}`,'destroy');
        this._renderField();
        break;
      }

      case 'airdrop_wallets': {
        for(let i=0;i<4;i++){
          const slot=me.field.monsters.findIndex(m=>!m);
          if(slot===-1) break;
          me.field.monsters[slot]={ id:'airdrop_token', name:'Airdrop Token', atk:0, def:0, stars:1, type:'monster', subtype:'token', position:'defense', uid:Math.random().toString(36).slice(2), rarity:'common' };
        }
        this._log('Airdrop! 4 tokens summoned','summon');
        this._renderField();
        break;
      }

      case 'green_market':
        [...me.field.monsters,...opp.field.monsters].filter(Boolean).forEach(c=>{ c.atk+=200; c.def+=200; });
        this._log('Green Market: all monsters +200 ATK/DEF','summon');
        this._renderField();
        break;

      case 'wallet_scanner': {
        if(opp.deck.length>0){
          const found=opp.deck.splice(0,1)[0];
          me.hand.push(found);
          this._log(`Wallet Scanner: took ${found.name} from opponent's deck`,'summon');
          if(side==='player') this._renderHand();
        }
        break;
      }

      case 'elegant_algorithm': {
        const hasCT = me.field.monsters.some(c=>c&&c.id==='ct_lady');
        if(!hasCT){this._log('Need CT Lady on field','muted');break;}
        const trinity = me.hand.findIndex(c=>c.id==='ct_trinity');
        if(trinity===-1){this._log('CT Trinity not in Bag','muted');break;}
        const slot=me.field.monsters.findIndex(m=>!m);
        if(slot===-1) break;
        const t = me.hand.splice(trinity,1)[0];
        t.position='attack'; t.faceDown=false;
        me.field.monsters[slot]=t;
        this._log('CT Trinity special summoned!','summon');
        this._renderField();
        if(side==='player') this._renderHand();
        break;
      }

      case 'triangle_chart': {
        me.field.monsters.filter(c=>c&&c.attribute==='VIRAL').forEach(c=>{ c.atk+=500; });
        opp.field.spells.forEach((c,i)=>{ if(c&&c.subtype==='continuous'){ opp.graveyard.push(c); opp.field.spells[i]=null; } });
        this._log('Triangle Chart: CT monsters +500 ATK, opponent continuous traps destroyed','summon');
        this._renderField();
        break;
      }

      case 'rug_virus': {
        // destroy opponent monsters with 1500+ atk
        opp.field.monsters.forEach((c,i)=>{ if(c&&c.atk>=1500){ opp.graveyard.push(c); opp.field.monsters[i]=null; this._log(`Rug Virus destroyed ${c.name}`,'destroy'); } });
        this._renderField();
        break;
      }

      case 'viral_world':
        this._log('Viral World activated! VIRAL monsters can attack directly','summon');
        break;

      default:
        // silently handle unimplemented spells
        break;
    }
    this._renderTopbar();
    this._checkWin();
  },

  // ── SUMMON EFFECTS ────────────────────────────

  _onSummonEffect(card, side) {
    const s = this.state;
    const me = side==='player' ? s.player : s.opponent;
    const opp = side==='player' ? s.opponent : s.player;

    switch(card.id) {
      case 'bundler_bot': {
        for(let i=0;i<2;i++){
          const slot=me.field.monsters.findIndex(m=>!m);
          if(slot>-1) me.field.monsters[slot]={ id:'bundler_token', name:'Bundler Token', atk:500, def:500, stars:1, type:'monster', subtype:'token', position:'attack', uid:Math.random().toString(36).slice(2), attribute:'MACHINE', rarity:'common' };
        }
        this._log(`${card.name}: 2 Bundler Tokens summoned`,'summon');
        this._renderField();
        break;
      }
      case 'paid_shill':
        if(opp.hand.length>0){ opp.hand.splice(Math.floor(Math.random()*opp.hand.length),1); this._log(`${opp.who} discarded a card (Paid Shill)`,'destroy'); if(side==='opponent')this._renderHand(); else this._renderOppHand(); }
        break;
      case 'early_buyer': {
        const roll=Math.ceil(Math.random()*6);
        card.atk=roll*300; card.def=roll*300;
        this._log(`Early Buyer rolled ${roll}! ATK/DEF: ${card.atk}/${card.def}`,'summon');
        this._renderField();
        break;
      }
      case 'coordinated_dump':
        opp.field.monsters.filter(Boolean).forEach(c=>{ c.atk=Math.max(0,c.atk-500); });
        this._log(`Coordinated Dump: all opponent monsters -500 ATK`,'destroy');
        this._renderField();
        break;
      case 'narrative_control': {
        const targets=opp.field.monsters.filter(Boolean);
        if(targets.length>0){
          const weakest=targets.reduce((a,b)=>a.atk<=b.atk?a:b);
          const oi=opp.field.monsters.indexOf(weakest);
          opp.field.monsters[oi]=null;
          const slot=me.field.monsters.findIndex(m=>!m);
          if(slot>-1){ me.field.monsters[slot]=weakest; this._log(`${weakest.name} taken (Narrative Control)`,'summon'); }
          this._renderField();
        }
        break;
      }
    }
  },

  // ── CHANGE POSITION ───────────────────────────

  _changePosition(slotIdx) {
    const s = this.state;
    const me = s.player;
    const card = me.field.monsters[slotIdx];
    if (!card) return;
    if (me.attackedThisTurn.has(slotIdx)) { this._toast('Cannot change position after attacking'); return; }
    card.position = card.position === 'attack' ? 'defense' : 'attack';
    if (card.faceDown) { card.faceDown = false; this._log(`Flip summoned ${card.name}!`,'summon'); this._onFlipEffect(card,'player'); }
    this._renderField();
  },

  _onFlipEffect(card, side) {
    const s = this.state;
    const me = side==='player' ? s.player : s.opponent;
    const opp = side==='player' ? s.opponent : s.player;
    switch(card.id) {
      case 'rug_eater': {
        const targets=[...me.field.monsters,...opp.field.monsters].filter(Boolean);
        if(targets.length>1){
          const target=targets[Math.floor(Math.random()*targets.length)];
          const idx=me.field.monsters.indexOf(target);
          if(idx>-1){me.graveyard.push(target);me.field.monsters[idx]=null;}
          else{const oi=opp.field.monsters.indexOf(target);if(oi>-1){opp.graveyard.push(target);opp.field.monsters[oi]=null;}}
          this._log(`Rug Eater destroyed ${target.name}!`,'destroy');
          this._renderField();
        }
        break;
      }
      case 'parasite_wallet': {
        const slot=opp.field.monsters.findIndex(m=>!m);
        if(slot>-1){ me.field.monsters[me.field.monsters.indexOf(card)]=null; opp.field.monsters[slot]=card; this._log('Parasite Wallet infected opponent field!','destroy'); this._renderField(); }
        break;
      }
    }
  },

  // ── ATTACK SYSTEM ─────────────────────────────

  _startAttack(slotIdx) {
    const s = this.state;
    if (s.phase !== 'battle') { this._toast('Can only attack during Battle Phase'); return; }
    if (s.turn !== 'player') return;
    const me = s.player;
    const card = me.field.monsters[slotIdx];
    if (!card) return;
    if (card.position !== 'attack') { this._toast('Switch to Attack position first'); return; }
    if (me.attackedThisTurn.has(slotIdx)) { this._toast('Already attacked this turn'); return; }
    if (me._lockTurns > 0) { this._toast('Diamond Hands Lock — cannot attack'); return; }

    this.attackSource = slotIdx;
    this.mode = 'attack-target';
    this._log(`Select attack target for ${card.name}`, 'phase');
    this._renderField(); // highlights targets
  },

  _resolveAttack(attackerSide, attackerIdx, defenderSide, defenderIdx) {
    const s = this.state;
    const aSide = s[attackerSide];
    const dSide = s[defenderSide];
    const attacker = aSide.field.monsters[attackerIdx];
    if (!attacker) return;

    aSide.attackedThisTurn.add(attackerIdx);

    if (defenderIdx === 'direct') {
      // direct attack
      const dmg = attacker.atk;
      dSide.faith = Math.max(0, dSide.faith - dmg);
      this._log(`${attacker.name} attacks directly! ${defenderSide} takes ${dmg} damage`, 'damage');
      this._flashDamage(defenderSide);
    } else {
      const defender = dSide.field.monsters[defenderIdx];
      if (!defender) return;

      // flip face-down if set
      if (defender.faceDown) {
        defender.faceDown = false;
        this._log(`${defender.name} flipped face-up`, 'summon');
        this._onFlipEffect(defender, defenderSide);
      }

      if (defender.position === 'attack') {
        // ATK vs ATK
        const diff = attacker.atk - defender.atk;
        if (diff > 0) {
          dSide.field.monsters[defenderIdx] = null;
          dSide.graveyard.push(defender);
          dSide.faith = Math.max(0, dSide.faith - diff);
          this._log(`${attacker.name} (${attacker.atk}) destroyed ${defender.name} (${defender.atk})! ${defenderSide} -${diff} Faith`, 'damage');
          this._flashDamage(defenderSide);
          this._onDestroyEffect(defender, defenderSide);
        } else if (diff < 0) {
          aSide.field.monsters[attackerIdx] = null;
          aSide.graveyard.push(attacker);
          aSide.faith = Math.max(0, aSide.faith - Math.abs(diff));
          this._log(`${attacker.name} was destroyed by ${defender.name}! ${attackerSide} -${Math.abs(diff)} Faith`, 'damage');
          this._flashDamage(attackerSide);
          this._onDestroyEffect(attacker, attackerSide);
        } else {
          aSide.field.monsters[attackerIdx] = null;
          dSide.field.monsters[defenderIdx] = null;
          aSide.graveyard.push(attacker);
          dSide.graveyard.push(defender);
          this._log(`Both ${attacker.name} and ${defender.name} destroyed!`, 'destroy');
          this._onDestroyEffect(attacker, attackerSide);
          this._onDestroyEffect(defender, defenderSide);
        }
      } else {
        // ATK vs DEF
        const diff = attacker.atk - defender.def;
        if (diff > 0) {
          dSide.field.monsters[defenderIdx] = null;
          dSide.graveyard.push(defender);
          this._log(`${attacker.name} (${attacker.atk}) destroyed ${defender.name} in defense (DEF:${defender.def})`, 'destroy');
          this._onDestroyEffect(defender, defenderSide);
        } else if (diff < 0) {
          aSide.faith = Math.max(0, aSide.faith - Math.abs(diff));
          this._log(`${attacker.name} attacks ${defender.name} in defense. ${attackerSide} -${Math.abs(diff)} Faith`, 'damage');
          this._flashDamage(attackerSide);
        } else {
          this._log(`${attacker.name} vs ${defender.name} — no damage`, 'summon');
        }
      }
    }

    this._renderField();
    this._renderTopbar();
    this._checkWin();
    this.mode = null;
    this.attackSource = null;
  },

  _onDestroyEffect(card, side) {
    const s = this.state;
    const me = side==='player' ? s.player : s.opponent;
    const opp = side==='player' ? s.opponent : s.player;
    switch(card.id) {
      case 'ghost_wallet':
        opp.faith=Math.max(0,opp.faith-300);
        this._log(`Ghost Wallet: ${opp.who} loses 300 Faith`,'damage');
        this._flashDamage(opp.who);
        this._renderTopbar();
        break;
      case 'congregation_member':
        if(me.deck.length>0){ me.hand.push(me.deck.splice(0,1)[0]); this._log('Congregation Member: drew 1 card','summon'); if(side==='player')this._renderHand(); else this._renderOppHand(); }
        break;
      case 'rug_god': {
        const targets=opp.field.monsters.filter(Boolean);
        if(targets.length>0){
          const stolen=targets[0];
          const oi=opp.field.monsters.indexOf(stolen);
          opp.field.monsters[oi]=null;
          const slot=me.field.monsters.findIndex(m=>!m);
          if(slot>-1){ me.field.monsters[slot]=stolen; this._log(`Rug God takes ${stolen.name} with it!`,'destroy'); }
          this._renderField();
        }
        break;
      }
      case 'jeet':
        opp.faith+=200;
        this._log(`Jeet: ${opp.who} gains 200 Faith (profited off your jeet)`,'heal');
        this._renderTopbar();
        break;
      case 'smart_wallet':
        if(side==='player'||side==='opponent'){
          me.faith=Math.min(8000,me.faith+300);
          this._renderTopbar();
        }
        break;
    }
  },

  // ── AI ─────────────────────────────────────────

  _aiMainPhase() {
    const s = this.state;
    const ai = s.opponent;

    // Sequential callback-based queue so response windows don't get bypassed
    const actions = [];

    // 1. Play normal spells (max 2), each with a player response window
    let spellsPlayed = 0;
    for (const card of [...ai.hand]) {
      if (spellsPlayed >= 2) break;
      if (card.type === 'blessing' && card.subtype === 'normal') {
        const c = card;
        actions.push(next => {
          this._triggerResponseWindow('spell', c, negated => {
            if (!negated) {
              const idx = ai.hand.indexOf(c);
              if (idx !== -1) {
                ai.hand.splice(idx, 1);
                ai.graveyard.push(c);
                this._log(`Opponent activated ${c.name}`, 'summon');
                this._applySpellEffect(c, 'opponent');
                this._renderOppHand();
              }
            } else {
              // spell was countered — remove from hand anyway (negated and sent to grave)
              const idx = ai.hand.indexOf(c);
              if (idx !== -1) { ai.hand.splice(idx, 1); ai.graveyard.push(c); this._renderOppHand(); }
            }
            setTimeout(next, 300);
          });
        });
        spellsPlayed++;
      }
    }

    // 2. Summon best monster, with response window for summon traps
    if (!ai.normalSummonUsed) {
      const summonable = ai.hand.filter(c => c.type === 'monster');
      if (summonable.length > 0) {
        const best = summonable.sort((a,b) => (b.atk||0)-(a.atk||0))[0];
        actions.push(next => {
          const slot = ai.field.monsters.findIndex(m => !m);
          if (ai.normalSummonUsed || slot === -1) { next(); return; }
          const idx = ai.hand.indexOf(best);
          if (idx === -1) { next(); return; }
          if (best.stars >= 5) {
            const needed = best.stars <= 6 ? 1 : 2;
            const tributes = ai.field.monsters.map((c,ti) => c ? ti : null).filter(ti => ti !== null);
            if (tributes.length < needed) { next(); return; }
            for (let t = 0; t < needed; t++) { ai.graveyard.push(ai.field.monsters[tributes[t]]); ai.field.monsters[tributes[t]] = null; }
            best.position = 'attack'; best.faceDown = false;
            ai.field.monsters[slot] = best;
            ai.hand.splice(idx, 1);
            ai.normalSummonUsed = true;
            this._log(`Opponent tribute summoned ${best.name}!`, 'summon');
            this._onSummonEffect(best, 'opponent');
          } else {
            best.position = 'attack'; best.faceDown = false;
            ai.field.monsters[slot] = best;
            ai.hand.splice(idx, 1);
            ai.normalSummonUsed = true;
            this._log(`Opponent summoned ${best.name} (${best.atk}/${best.def})`, 'summon');
            this._onSummonEffect(best, 'opponent');
          }
          this._renderField();
          this._renderOppHand();
          // response window for summon traps
          this._triggerResponseWindow('summon', best, () => setTimeout(next, 300));
        });
      }
    }

    // 3. Set one trap face-down
    const trap = ai.hand.find(c => c.type === 'confession');
    if (trap) {
      actions.push(next => {
        const slot = ai.field.spells.findIndex(sp => !sp);
        const idx = ai.hand.indexOf(trap);
        if (idx !== -1 && slot !== -1) {
          ai.hand.splice(idx, 1);
          trap.faceDown = true;
          ai.field.spells[slot] = trap;
          this._log(`Opponent set a card face-down`, 'summon');
          this._renderField();
          this._renderOppHand();
        }
        next();
      });
    }

    // Run queue sequentially then advance to battle
    const runNext = (i) => {
      if (i >= actions.length) { setTimeout(() => this._setPhase('battle'), 300); return; }
      setTimeout(() => actions[i](() => runNext(i + 1)), 400);
    };
    setTimeout(() => runNext(0), 400);
  },

  _aiBattlePhase() {
    const s = this.state;
    const ai = s.opponent;
    const player = s.player;

    if (ai._lockTurns > 0) {
      this._log(`Opponent is locked (Diamond Hands Lock)`, 'summon');
      setTimeout(() => this._setPhase('main2'), 500);
      return;
    }

    const attackerIdxs = ai.field.monsters
      .map((c,i) => c && c.position === 'attack' ? i : null)
      .filter(i => i !== null);

    const processNext = (i) => {
      if (i >= attackerIdxs.length) { setTimeout(() => this._setPhase('main2'), 400); return; }

      const attackerIdx = attackerIdxs[i];
      const attacker = ai.field.monsters[attackerIdx];
      if (!attacker || ai.attackedThisTurn.has(attackerIdx) || attacker._lockAttacks) {
        processNext(i + 1); return;
      }

      const targets = player.field.monsters.map((c,ti) => c ? ti : null).filter(ti => ti !== null);
      const targetIdx = targets.length === 0 ? 'direct' : targets.reduce((best, ti) => {
        const tc = player.field.monsters[ti];
        const bc = player.field.monsters[best];
        return (tc.position === 'defense' ? tc.def : tc.atk) < (bc.position === 'defense' ? bc.def : bc.atk) ? ti : best;
      });

      this._log(`${attacker.name} declares attack!`, 'phase');

      setTimeout(() => {
        this._triggerResponseWindow('attack', attacker, negated => {
          // re-check attacker still alive after trap resolution
          const stillAlive = ai.field.monsters[attackerIdx];
          if (stillAlive && !negated) {
            this._resolveAttack('opponent', attackerIdx, 'player', targetIdx);
          }
          setTimeout(() => processNext(i + 1), 500);
        });
      }, 400);
    };

    setTimeout(() => processNext(0), 400);
  },

  // ── RESPONSE WINDOW ───────────────────────────

  _triggerResponseWindow(trigger, triggerCard, onDone) {
    const activatable = [];
    this.state.player.field.spells.forEach((card, i) => {
      if (card && card.faceDown && card.type === 'confession' && this._trapCanActivate(card, trigger, triggerCard)) {
        activatable.push({ card, slotIdx: i });
      }
    });

    if (activatable.length === 0) { onDone(false); return; }

    let resolved = false;
    let timeLeft = 5;

    const resolve = (activated, slotIdx) => {
      if (resolved) return;
      resolved = true;
      clearInterval(countdownTimer);
      this._hideResponseWindow();

      if (activated) {
        const card = this.state.player.field.spells[slotIdx];
        if (!card) { onDone(false); return; }
        this.state.player.field.spells[slotIdx] = null;
        this.state.player.graveyard.push(card);
        card.faceDown = false;
        this._log(`⚡ Activated ${card.name} in response!`, 'phase');
        const negated = this._activateTrapResponse(card, trigger, triggerCard);
        this._renderField();
        this._renderTopbar();
        this._checkWin();
        onDone(negated);
      } else {
        onDone(false);
      }
    };

    // Build UI
    const rw = document.getElementById('response-window');
    rw.querySelector('.rw-title').textContent =
      trigger === 'attack' ? `${triggerCard.name} ATTACKS!` :
      trigger === 'summon' ? `${triggerCard.name} SUMMONED!` :
      `OPPONENT ACTIVATES SPELL!`;

    const cardsEl = document.getElementById('rw-cards');
    cardsEl.innerHTML = '';
    activatable.forEach(({ card, slotIdx }) => {
      const btn = document.createElement('button');
      btn.className = 'rw-card-btn';
      btn.innerHTML = `<span class="rw-card-name">${card.name}</span><span class="rw-card-fx">${card.effect || ''}</span>`;
      btn.addEventListener('click', () => resolve(true, slotIdx));
      cardsEl.appendChild(btn);
    });

    document.getElementById('rw-pass').onclick = () => resolve(false);

    // Timer bar animation
    const barFill = document.getElementById('rw-bar-fill');
    barFill.style.transition = 'none';
    barFill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      barFill.style.transition = `width ${timeLeft}s linear`;
      barFill.style.width = '0%';
    }));

    const timerEl = rw.querySelector('.rw-timer');
    timerEl.textContent = `${timeLeft}s`;
    timerEl.className = 'rw-timer';

    rw.classList.add('visible');

    const countdownTimer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 3) timerEl.className = 'rw-timer urgent';
      if (timeLeft <= 0) resolve(false);
    }, 1000);
  },

  _hideResponseWindow() {
    document.getElementById('response-window').classList.remove('visible');
  },

  _trapCanActivate(card, trigger, triggerCard) {
    switch(trigger) {
      case 'attack': return ['rugback','stop_loss','locked_liquidity','red_candle','stop_the_pump','liquidation','take_you_with_me','jeet_shield'].includes(card.id);
      case 'summon': return ['sniper_hole','fomo_trap','dev_exit'].includes(card.id);
      case 'spell':  return ['dip_trap','tx_rejected'].includes(card.id);
      default: return false;
    }
  },

  _activateTrapResponse(card, trigger, triggerCard) {
    const s = this.state;
    const opp = s.opponent;
    let negated = false;

    switch(card.id) {
      case 'rugback': // Mirror Force — destroy all attack-position opponent monsters
        opp.field.monsters.forEach((c,i) => {
          if (c && c.position === 'attack') {
            opp.graveyard.push(c); opp.field.monsters[i] = null;
            this._log(`Rugback destroyed ${c.name}!`, 'destroy');
            this._onDestroyEffect(c, 'opponent');
          }
        });
        negated = true;
        break;

      case 'stop_loss': // Negate Attack
        this._log(`Stop Loss! ${triggerCard.name}'s attack negated!`, 'summon');
        negated = true;
        break;

      case 'stop_the_pump': { // destroy the attacking monster
        const idx = opp.field.monsters.indexOf(triggerCard);
        if (idx > -1) {
          opp.graveyard.push(triggerCard); opp.field.monsters[idx] = null;
          this._log(`Stop the Pump! ${triggerCard.name} destroyed!`, 'destroy');
          this._onDestroyEffect(triggerCard, 'opponent');
        }
        negated = true;
        break;
      }

      case 'locked_liquidity':
        triggerCard._lockAttacks = true;
        this._log(`Locked Liquidity! ${triggerCard.name} is frozen!`, 'summon');
        negated = true;
        break;

      case 'red_candle': {
        const roll = Math.ceil(Math.random() * 6);
        opp.faith = Math.max(0, opp.faith - roll * 100);
        this._log(`Red Candle! Rolled ${roll} — opponent loses ${roll * 100} Faith`, 'damage');
        this._flashDamage('opponent');
        break; // doesn't negate
      }

      case 'liquidation':
        if (triggerCard.atk >= 2000) {
          const idx = opp.field.monsters.indexOf(triggerCard);
          if (idx > -1) { opp.graveyard.push(triggerCard); opp.field.monsters[idx] = null; this._log(`Liquidation! ${triggerCard.name} destroyed!`, 'destroy'); this._onDestroyEffect(triggerCard, 'opponent'); }
          negated = true;
        } else {
          this._log(`Liquidation fizzled — ${triggerCard.name} ATK too low`, 'muted');
        }
        break;

      case 'take_you_with_me': {
        const target = opp.field.monsters.find(Boolean);
        if (target) {
          const idx = opp.field.monsters.indexOf(target);
          opp.graveyard.push(target); opp.field.monsters[idx] = null;
          this._log(`Take You With Me! ${target.name} dragged to The Trenches!`, 'destroy');
        }
        break;
      }

      case 'jeet_shield':
        if (triggerCard.subtype === 'token') {
          negated = true; this._log(`Jeet Shield! Token attack blocked!`, 'summon');
        }
        break;

      case 'sniper_hole':
        if (triggerCard.atk >= 1000 && triggerCard.atk <= 1500) {
          const idx = opp.field.monsters.indexOf(triggerCard);
          if (idx > -1) { opp.graveyard.push(triggerCard); opp.field.monsters[idx] = null; this._log(`Sniper Hole! ${triggerCard.name} eliminated!`, 'destroy'); }
        } else {
          this._log(`Sniper Hole missed — out of range`, 'muted');
        }
        break;

      case 'fomo_trap':
        if (triggerCard) { triggerCard.position = 'defense'; this._log(`FOMO Trap! ${triggerCard.name} forced into defense!`, 'summon'); }
        break;

      case 'dip_trap':
      case 'tx_rejected':
        this._log(`${card.name}! Opponent's spell negated!`, 'summon');
        negated = true;
        break;
    }

    return negated;
  },

  // ── WIN CHECK ─────────────────────────────────

  _checkWin() {
    const s = this.state;
    if (s.player.faith <= 0) { this._endGame('opponent', 'faith'); return; }
    if (s.opponent.faith <= 0) { this._endGame('player', 'faith'); return; }
  },

  _endGame(winner, reason) {
    this._stopTimer();
    const isPlayer = winner === 'player';
    const modal = document.getElementById('modal-game-over');
    modal.querySelector('h2').textContent = isPlayer ? 'VICTORY' : 'DEFEATED';
    modal.querySelector('h2').className = isPlayer ? 'win' : 'lose';
    modal.querySelector('p').textContent = isPlayer
      ? `The Father blesses your victory. ${reason === 'deck out' ? 'Opponent ran out of cards.' : 'Opponent\'s Faith reached zero.'}`
      : `The trenches claim another soul. ${reason === 'deck out' ? 'Your deck ran out.' : 'Your Faith reached zero.'}`;
    document.getElementById('overlay').classList.add('visible');
  },

  // ── RENDER ────────────────────────────────────

  _renderTopbar() {
    const s = this.state;
    const pf = s.player.faith;
    const of = s.opponent.faith;
    const pfEl = document.getElementById('player-faith');
    const ofEl = document.getElementById('opp-faith');
    pfEl.textContent = pf.toLocaleString();
    ofEl.textContent = of.toLocaleString();
    pfEl.className = 'faith-value' + (pf < 1000 ? ' low' : pf < 3000 ? ' mid' : '');
    ofEl.className = 'faith-value' + (of < 1000 ? ' low' : of < 3000 ? ' mid' : '');
    document.getElementById('player-deck-count').textContent = `Deck: ${s.player.deck.length}`;
    document.getElementById('opp-deck-count').textContent = `Deck: ${s.opponent.deck.length}`;
    document.getElementById('turn-player').textContent = s.turn === 'player' ? 'YOUR TURN' : 'OPPONENT\'S TURN';
  },

  _renderOppHand() {
    const s = this.state;
    const area = document.getElementById('opp-hand-area');
    area.innerHTML = '';
    s.opponent.hand.forEach(() => {
      const el = document.createElement('div');
      el.className = 'opp-card-back';
      area.appendChild(el);
    });
  },

  _renderHand() {
    const s = this.state;
    const area = document.getElementById('hand-area');
    area.innerHTML = '';
    s.player.hand.forEach((card, i) => {
      const el = this._buildHandCard(card, i);
      area.appendChild(el);
    });
  },

  _buildHandCard(card, idx) {
    const el = document.createElement('div');
    el.className = `hand-card rarity-${card.rarity || 'common'}`;
    if (this.selectedHandIdx === idx) el.classList.add('selected');

    const imgSrc = card.image || 'img/cards/card-back.jpg';
    const typeLabel = card.type === 'monster'
      ? `${card.attribute || ''} ★${card.stars} ${card.subtype?.toUpperCase() || 'DEGEN'}`
      : `${card.type.toUpperCase()} / ${card.subtype?.toUpperCase() || ''}`;
    const statsHtml = card.atk != null
      ? `<div class="hc-stats"><span>ATK/${card.atk}</span><span>DEF/${card.def}</span></div>`
      : '';

    el.innerHTML = `
      <img src="${imgSrc}" onerror="this.src='img/cards/card-back.jpg'">
      <div class="hc-name">${card.name}</div>
      <div class="hc-type">${typeLabel}</div>
      ${statsHtml}
      <div class="hc-effect">${card.effect || ''}</div>
    `;

    el.addEventListener('click', () => this._onHandCardClick(idx));
    el.addEventListener('mouseenter', () => this._showPreview(card));
    el.addEventListener('mouseleave', () => this._hidePreview());
    return el;
  },

  _onHandCardClick(idx) {
    const s = this.state;
    if (s.turn !== 'player' || (s.phase !== 'main1' && s.phase !== 'main2')) {
      this._toast('Can only play cards during Main Phase'); return;
    }
    if (this.mode === 'attack-target') { this._clearMode(); return; }

    if (this.selectedHandIdx === idx) {
      this.selectedHandIdx = null;
      this._renderHand();
      this._hideActionMenu();
      return;
    }

    this.selectedHandIdx = idx;
    this._renderHand();
    const card = s.player.hand[idx];
    this._showCardActionMenu(card, idx);
  },

  _showCardActionMenu(card, idx) {
    const menu = document.getElementById('action-menu');
    menu.innerHTML = '';

    if (card.type === 'monster') {
      const btn1 = document.createElement('button');
      btn1.className = 'action-btn';
      btn1.textContent = card.stars >= 5 ? `Tribute Summon (${card.stars <= 6 ? 1 : 2}x)` : 'Normal Summon';
      btn1.addEventListener('click', () => {
        this._hideActionMenu();
        this.mode = 'summon-target';
        this._renderField();
        this._log('Select a monster zone', 'phase');
      });
      menu.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.className = 'action-btn';
      btn2.textContent = 'Set (face-down)';
      btn2.addEventListener('click', () => {
        this._hideActionMenu();
        this.mode = 'set-target';
        this._renderField();
        this._log('Select a monster zone to set', 'phase');
      });
      menu.appendChild(btn2);
    } else if (card.type === 'blessing') {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.textContent = card.subtype === 'continuous' || card.subtype === 'field' ? 'Activate' : 'Activate';
      btn.addEventListener('click', () => {
        this._hideActionMenu();
        if (card.subtype === 'normal') {
          this._playSpell(idx, 0);
        } else {
          this.mode = 'spell-target';
          this._renderField();
          this._log('Select a spell/trap zone', 'phase');
        }
      });
      menu.appendChild(btn);
    } else if (card.type === 'confession') {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.textContent = 'Set face-down';
      btn.addEventListener('click', () => {
        this._hideActionMenu();
        this.mode = 'trap-target';
        this._renderField();
        this._log('Select a spell/trap zone', 'phase');
      });
      menu.appendChild(btn);
    }

    const cancel = document.createElement('button');
    cancel.className = 'action-btn danger';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => { this._hideActionMenu(); this.selectedHandIdx = null; this._renderHand(); this._clearMode(); });
    menu.appendChild(cancel);

    menu.classList.add('visible');
    // position near hand area
    const handArea = document.getElementById('hand-area');
    const rect = handArea.getBoundingClientRect();
    menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    menu.style.left = '50%';
    menu.style.transform = 'translateX(-50%)';
  },

  _hideActionMenu() {
    document.getElementById('action-menu').classList.remove('visible');
  },

  _renderField() {
    const s = this.state;
    this._renderSide('opponent', s.opponent, false);
    this._renderSide('player', s.player, true);
  },

  _renderSide(who, side, isPlayer) {
    // render monsters
    for (let i = 0; i < 5; i++) {
      const slot = document.getElementById(`${who}-m-${i}`);
      if (!slot) continue;
      slot.innerHTML = '';
      const card = side.field.monsters[i];

      // highlight logic
      slot.classList.remove('highlight', 'attack-target', 'droppable');

      const oppHasMonsters = !isPlayer && s.opponent.field.monsters.some(Boolean);

      if (isPlayer && this.mode === 'summon-target' && !card) slot.classList.add('highlight');
      if (isPlayer && this.mode === 'set-target' && !card) slot.classList.add('highlight');
      if (isPlayer && this.mode === 'tribute' && card) slot.classList.add('highlight');
      if (!isPlayer && this.mode === 'attack-target' && card) slot.classList.add('attack-target');
      // direct attack: glow all empty opponent slots when opponent has no monsters
      if (!isPlayer && this.mode === 'attack-target' && !card && !oppHasMonsters) slot.classList.add('attack-target');

      slot.onclick = null;

      if (this.mode === 'summon-target' && isPlayer && !card) {
        slot.onclick = () => { this._summonMonster(this.selectedHandIdx, i); this._clearMode(); };
      } else if (this.mode === 'set-target' && isPlayer && !card) {
        slot.onclick = () => { this._setMonster(this.selectedHandIdx, i); this._clearMode(); };
      } else if (this.mode === 'tribute' && isPlayer && card) {
        slot.onclick = () => this._selectTribute(i);
      } else if (this.mode === 'attack-target' && !isPlayer && card) {
        slot.onclick = () => { this._resolveAttack('player', this.attackSource, 'opponent', i); };
      } else if (this.mode === 'attack-target' && !isPlayer && !card && !oppHasMonsters) {
        slot.onclick = () => { this._resolveAttack('player', this.attackSource, 'opponent', 'direct'); };
      }

      if (!card) {
        const lbl = document.createElement('div');
        lbl.className = 'slot-label';
        lbl.textContent = 'M';
        slot.appendChild(lbl);
        continue;
      }

      const el = this._buildFieldCard(card, isPlayer, i, who);
      slot.appendChild(el);
    }

    // render spells/traps
    for (let i = 0; i < 5; i++) {
      const slot = document.getElementById(`${who}-s-${i}`);
      if (!slot) continue;
      slot.innerHTML = '';
      const card = side.field.spells[i];

      slot.classList.remove('highlight', 'droppable');
      slot.onclick = null;

      if (isPlayer && (this.mode === 'spell-target' || this.mode === 'trap-target') && !card) {
        slot.classList.add('highlight');
        slot.onclick = () => {
          if (this.mode === 'spell-target') this._playSpell(this.selectedHandIdx, i);
          else this._setTrap(this.selectedHandIdx, i);
          this._clearMode();
        };
      }

      if (!card) {
        const lbl = document.createElement('div');
        lbl.className = 'slot-label';
        lbl.textContent = 'S/T';
        slot.appendChild(lbl);
        continue;
      }

      const el = this._buildFieldCard(card, isPlayer, i, who);
      slot.appendChild(el);
    }

    // direct attack zone
    const directZone = document.getElementById(`${who}-direct`);
    if (directZone) {
      directZone.onclick = null;
      directZone.classList.remove('attack-target');
      if (!isPlayer && this.mode === 'attack-target' && side.field.monsters.every(m=>!m)) {
        directZone.classList.add('attack-target');
        directZone.onclick = () => { this._resolveAttack('player', this.attackSource, 'opponent', 'direct'); };
      }
    }
  },

  _buildFieldCard(card, isPlayer, idx, who) {
    const el = document.createElement('div');
    el.className = 'field-card';
    if (card.faceDown) { el.classList.add('face-down'); return el; }
    if (card.position === 'defense') el.classList.add('defense');

    const imgSrc = card.image || 'img/cards/card-back.jpg';
    const statsHtml = card.atk != null ? `<div class="fc-stats"><span>${card.atk}</span><span>${card.def}</span></div>` : '';

    el.innerHTML = `
      <img src="${imgSrc}" onerror="this.src='img/cards/card-back.jpg'">
      <div class="fc-name">${card.name}</div>
      ${statsHtml}
    `;

    el.addEventListener('mouseenter', () => this._showPreview(card));
    el.addEventListener('mouseleave', () => this._hidePreview());

    if (isPlayer && this.state.turn === 'player') {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.mode === 'tribute') { this._selectTribute(idx); return; }
        if (this.state.phase === 'battle' && card.type === 'monster' && !card.faceDown) {
          this._startAttack(idx);
        } else if (this.state.phase === 'main1' || this.state.phase === 'main2') {
          this._showFieldCardMenu(card, idx, who);
        }
      });
    }

    if (isPlayer && this.state.turn === 'player' && this.state.phase === 'battle' && card.type === 'monster' && !card.faceDown && !this.state.player.attackedThisTurn.has(idx)) {
      el.title = 'Click to attack';
    }

    if (this.state.player.attackedThisTurn.has(idx) && who === 'player') el.classList.add('attacked');

    return el;
  },

  _showFieldCardMenu(card, idx, who) {
    const menu = document.getElementById('action-menu');
    menu.innerHTML = '';

    if (card.type === 'monster' && !card.faceDown) {
      const pos = document.createElement('button');
      pos.className = 'action-btn';
      pos.textContent = card.position === 'attack' ? 'Switch to Defense' : 'Switch to Attack';
      pos.addEventListener('click', () => { this._changePosition(idx); this._hideActionMenu(); });
      menu.appendChild(pos);
    }

    if (card.faceDown) {
      const flip = document.createElement('button');
      flip.className = 'action-btn';
      flip.textContent = 'Flip Summon';
      flip.addEventListener('click', () => { this._changePosition(idx); this._hideActionMenu(); });
      menu.appendChild(flip);
    }

    const cancel = document.createElement('button');
    cancel.className = 'action-btn danger';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => this._hideActionMenu());
    menu.appendChild(cancel);

    menu.classList.add('visible');
    const rect = document.getElementById(`${who}-m-${idx}`).getBoundingClientRect();
    menu.style.bottom = 'auto';
    menu.style.top = (rect.bottom + 6) + 'px';
    menu.style.left = rect.left + 'px';
    menu.style.transform = 'none';
  },

  // ── PREVIEW ───────────────────────────────────

  _showPreview(card) {
    const p = document.getElementById('card-preview');
    p.querySelector('img').src = card.image || 'img/cards/card-back.jpg';
    p.querySelector('.preview-name').textContent = card.name;
    const typeStr = card.type === 'monster'
      ? `[${card.attribute || ''} ★${card.stars}] ${(card.subtype||'').toUpperCase()}`
      : `[${card.type.toUpperCase()}] ${(card.subtype||'').toUpperCase()}`;
    p.querySelector('.preview-type').textContent = typeStr;
    const stats = p.querySelector('.preview-stats');
    stats.innerHTML = card.atk != null ? `<span>ATK/${card.atk}</span><span>DEF/${card.def}</span>` : '';
    p.querySelector('.preview-effect').textContent = card.effect || '';
    p.classList.add('visible');
  },

  _hidePreview() {
    document.getElementById('card-preview').classList.remove('visible');
  },

  // ── UI HELPERS ────────────────────────────────

  _toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
  },

  _log(msg, type='') {
    const log = document.getElementById('game-log');
    const el = document.createElement('div');
    el.className = 'log-entry ' + type;
    el.textContent = msg;
    log.prepend(el);
    while (log.children.length > 40) log.removeChild(log.lastChild);
  },

  _phaseAnnounce(text) {
    if (this.state.turn !== 'player') return;
    const el = document.getElementById('phase-announce');
    el.textContent = text;
    el.style.transition = 'none';
    el.style.opacity = '1';
    setTimeout(() => {
      el.style.transition = 'opacity 0.6s';
      el.style.opacity = '0';
    }, 700);
  },

  _showTurnOverlay(name, sub, cb) {
    const ov = document.getElementById('turn-overlay');
    ov.querySelector('.turn-name').textContent = name;
    ov.querySelector('.turn-sub').textContent = sub;
    ov.classList.add('visible');
    setTimeout(() => {
      ov.classList.remove('visible');
      if (cb) cb();
    }, 1200);
  },

  _flashDamage(side) {
    const el = document.getElementById(side === 'player' ? 'player-faith-wrap' : 'opp-faith-wrap');
    if (!el) return;
    el.classList.add('taking-damage');
    setTimeout(() => el.classList.remove('taking-damage'), 400);
  },

  _clearMode() {
    this.mode = null;
    this.attackSource = null;
    this._renderField();
  },

  // ── BIND UI ───────────────────────────────────

  _bindUI() {
    document.getElementById('btn-start').addEventListener('click', e => {
      const deckId = e.target.dataset.deck;
      if (deckId) this.startGame(deckId);
    });

    document.getElementById('btn-battle').addEventListener('click', () => {
      if (this.state.turn === 'player' && this.state.phase === 'main1') this._setPhase('battle');
    });

    document.getElementById('btn-main2').addEventListener('click', () => {
      if (this.state.turn === 'player' && this.state.phase === 'battle') this._setPhase('main2');
    });

    document.getElementById('btn-end').addEventListener('click', () => {
      if (this.state.turn === 'player') this._setPhase('end');
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      document.getElementById('overlay').classList.remove('visible');
      this._showScreen('select');
      this._renderDeckSelect();
      document.getElementById('btn-start').disabled = true;
    });

    document.getElementById('btn-rematch').addEventListener('click', () => {
      document.getElementById('overlay').classList.remove('visible');
      const deck = this.state.player.deckId;
      this.startGame(deck);
    });

    // close action menu on click elsewhere
    document.addEventListener('click', e => {
      if (!e.target.closest('#action-menu') && !e.target.closest('.hand-card') && !e.target.closest('.field-card')) {
        this._hideActionMenu();
      }
    });
  },

  // ── UTIL ──────────────────────────────────────

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
};

document.addEventListener('DOMContentLoaded', () => G.init());
