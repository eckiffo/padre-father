/* ═══════════════════════════════════════════════
   PADRE Card Game — Master Card Database
   All 60 base set cards
   ═══════════════════════════════════════════════ */

window.PADRE_CARDS = {

  // ─── MONSTERS ───────────────────────────────

  // ★★★★★ — 5 STARS (1 tribute)
  trench_father: {
    id: 'trench_father',
    name: 'Trench Father',
    stars: 5,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DARK',
    atk: 2400,
    def: 1200,
    rarity: 'secret',
    deck: 'father',
    image: 'img/cards/trench_father.jpg',
    effect: 'Show 1 Confession card from your Bag: Special Summon this card. While a Confession is face-up on your field: target 1 card on opponent\'s field — if it\'s a Degen, equip it to this card and gain ATK equal to its ATK (max 1). If it\'s a Blessing/Confession, copy its effect until End Phase. You can only use this effect once per turn.'
  },

  chart_reader: {
    id: 'chart_reader',
    name: 'Chart Reader',
    stars: 5,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1900,
    def: 1700,
    rarity: 'ultra',
    deck: 'ct_girl',
    image: 'img/cards/chart_reader.jpg',
    effect: 'When this card attacks: your opponent cannot activate Confession cards until the end of the Damage Step. This card gains 200 ATK for each Blessing card in your Trenches.'
  },

  paper_hands_queen: {
    id: 'paper_hands_queen',
    name: 'Paper Hands Queen',
    stars: 6,
    type: 'monster',
    subtype: 'effect',
    attribute: 'PAPER',
    atk: 2200,
    def: 2400,
    rarity: 'ultra',
    deck: 'jeet',
    image: 'img/cards/paper_hands_queen.jpg',
    effect: 'Must be Tributed from "Cocoon of Exit" to Special Summon. Gains 200 ATK for each Degen in The Trenches.'
  },

  dev_wallet_drainer: {
    id: 'dev_wallet_drainer',
    name: 'Dev Wallet Drainer',
    stars: 5,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DARK',
    atk: 2200,
    def: 2800,
    rarity: 'ultra',
    deck: 'rugged',
    image: 'img/cards/dev_wallet_drainer.jpg',
    effect: 'Can only be Special Summoned when 3 of your Degens have been destroyed this duel. While this card is face-up: when an opponent\'s monster is destroyed, you may take control of it.'
  },

  one_thousand_x_caller: {
    id: 'one_thousand_x_caller',
    name: '1000x Caller',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1600,
    def: 1000,
    rarity: 'rare',
    deck: 'kol',
    image: 'img/cards/1000x_caller.jpg',
    effect: 'While this card is face-up: all your Degens gain 300 ATK. Destroy this card during your 3rd End Phase after it was summoned.'
  },

  // ★★★★★★ — 6 STARS (1 tribute)
  ct_trinity: {
    id: 'ct_trinity',
    name: 'CT Trinity',
    stars: 6,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1950,
    def: 2100,
    rarity: 'ultra',
    deck: 'ct_girl',
    image: 'img/cards/ct_trinity.jpg',
    effect: 'Cannot be Normal Summoned. Must be Special Summoned by "Elegant Algorithm" while "CT Lady" is on your field. This card\'s name is treated as "CT Lady" while on the field.'
  },

  // ★★★★★★★ — 7 STARS (2 tributes)
  coordinated_dump: {
    id: 'coordinated_dump',
    name: 'Coordinated Dump',
    stars: 7,
    type: 'monster',
    subtype: 'effect',
    attribute: 'MACHINE',
    atk: 2600,
    def: 2200,
    rarity: 'ultra',
    deck: 'whale',
    image: 'img/cards/coordinated_dump.jpg',
    effect: 'When this card is Normal Summoned: all opponent Degens lose 500 ATK until the end of this turn.'
  },

  bonding_curve_dragon: {
    id: 'bonding_curve_dragon',
    name: 'Bonding Curve Dragon',
    stars: 7,
    type: 'monster',
    subtype: 'effect',
    attribute: 'CHAIN',
    atk: 2400,
    def: 2000,
    rarity: 'ultra',
    deck: 'degen',
    image: 'img/cards/bonding_curve_dragon.jpg',
    effect: 'Requires 1 Tribute. When this card destroys a monster in battle: roll a die. 1-3: gain 500 Faith. 4-6: this card gains 500 ATK permanently.'
  },

  liquidity_cannon: {
    id: 'liquidity_cannon',
    name: 'Liquidity Cannon',
    stars: 7,
    type: 'monster',
    subtype: 'effect',
    attribute: 'MACHINE',
    atk: 2600,
    def: 2200,
    rarity: 'ultra',
    deck: 'whale',
    image: 'img/cards/liquidity_cannon.jpg',
    effect: 'Requires 2 Tributes. Once per turn: flip 3 coins. For each heads, destroy 1 Degen on the field.'
  },

  // ★★★★★★★★ — 8 STARS (2 tributes)
  sigma_dev: {
    id: 'sigma_dev',
    name: 'Sigma Dev',
    stars: 8,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DARK',
    atk: 3000,
    def: 2500,
    rarity: 'secret',
    deck: 'dev',
    image: 'img/cards/SigmaDev.png',
    effect: 'Requires 2 Tributes. Cannot be targeted by card effects. When this card destroys a monster in battle: your opponent loses 500 Faith.'
  },

  rug_god: {
    id: 'rug_god',
    name: 'Dark Rug God',
    stars: 8,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DARK',
    atk: 2200,
    def: 2800,
    rarity: 'secret',
    deck: 'rugged',
    image: 'img/cards/rug_god.jpg',
    effect: 'Cannot be Normal Summoned. Banish 3 Degen monsters from your Trenches to Special Summon this card. When this card is destroyed: take control of 1 monster on your opponent\'s field permanently.'
  },

  // ★★★★ — 4 STARS (no tribute)
  based_holder: {
    id: 'based_holder',
    name: 'Based Holder',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'LIGHT',
    atk: 1800,
    def: 1500,
    rarity: 'rare',
    deck: 'father',
    image: 'img/cards/based_holder.jpg',
    effect: 'Cannot be destroyed by Blessing card effects.'
  },

  bundler_bot: {
    id: 'bundler_bot',
    name: 'Bundler Bot',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'MACHINE',
    atk: 1800,
    def: 1200,
    rarity: 'rare',
    deck: 'dev',
    image: 'img/cards/bundler_bot.jpg',
    effect: 'When this card is Normal Summoned: Special Summon 2 "Bundler Tokens" (MACHINE/ATK 500/DEF 500) to your field.'
  },

  smart_wallet: {
    id: 'smart_wallet',
    name: 'Smart Wallet',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'LIGHT',
    atk: 1600,
    def: 1400,
    rarity: 'rare',
    deck: 'dev',
    image: 'img/cards/smart_wallet.jpg',
    effect: 'When an opponent\'s monster is destroyed by battle: gain 300 Faith.'
  },

  early_buyer: {
    id: 'early_buyer',
    name: 'Early Buyer',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DEGEN',
    atk: 0,
    def: 0,
    rarity: 'rare',
    deck: 'degen',
    image: 'img/cards/early_buyer.jpg',
    effect: 'When Normal Summoned: roll a die. This card\'s ATK and DEF become (result × 300) until the end of this turn.'
  },

  degen_whale: {
    id: 'degen_whale',
    name: 'Degen Whale',
    stars: 4,
    type: 'monster',
    subtype: 'normal',
    attribute: 'PAPER',
    atk: 1800,
    def: 800,
    rarity: 'rare',
    deck: 'whale',
    image: 'img/cards/degen_whale.jpg',
    effect: 'A massive whale wallet that has been accumulating since day one. Feared by all who see it on the field.'
  },

  degen_raider: {
    id: 'degen_raider',
    name: 'Degen Raider',
    stars: 4,
    type: 'monster',
    subtype: 'normal',
    attribute: 'DEGEN',
    atk: 1900,
    def: 1200,
    rarity: 'rare',
    deck: 'ct_girl',
    image: 'img/cards/degen_raider.jpg',
    effect: 'A seasoned degen who raids every launch. Pure ATK, no strategy, just vibes.'
  },

  ct_lady: {
    id: 'ct_lady',
    name: 'CT Lady',
    stars: 4,
    type: 'monster',
    subtype: 'normal',
    attribute: 'VIRAL',
    atk: 1300,
    def: 1400,
    rarity: 'common',
    deck: 'ct_girl',
    image: 'img/cards/ct_lady.jpg',
    effect: 'She called 47 consecutive 100x plays from Crypto Twitter. Nobody knows how.'
  },

  degen_ct: {
    id: 'degen_ct',
    name: 'Degen CT',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1800,
    def: 1300,
    rarity: 'rare',
    deck: 'ct_girl',
    image: 'img/cards/degen_ct.jpg',
    effect: 'CT-type Degens: opponent\'s Confession cards cannot target this card.'
  },

  alpha_caller: {
    id: 'alpha_caller',
    name: 'Alpha Caller',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1400,
    def: 1000,
    rarity: 'rare',
    deck: 'ct_girl',
    image: 'img/cards/alpha_caller.jpg',
    effect: 'Tribute 2 Degens on your field: inflict 1200 Faith damage to your opponent.'
  },

  market_maker: {
    id: 'market_maker',
    name: 'Market Maker',
    stars: 5,
    type: 'monster',
    subtype: 'effect',
    attribute: 'MACHINE',
    atk: 2200,
    def: 2500,
    rarity: 'rare',
    deck: 'whale',
    image: 'img/cards/market_maker.jpg',
    effect: 'Requires 1 Tribute. While this card is face-up: MACHINE-type Degens gain 100 ATK.'
  },

  whale_wallet: {
    id: 'whale_wallet',
    name: 'Whale Wallet',
    stars: 5,
    type: 'monster',
    subtype: 'normal',
    attribute: 'PAPER',
    atk: 2600,
    def: 1900,
    rarity: 'rare',
    deck: 'whale',
    image: 'img/cards/whale_wallet.jpg',
    effect: 'A wallet so large it moves markets. Every on-chain analyst has it bookmarked.'
  },

  viral_post: {
    id: 'viral_post',
    name: 'Viral Post',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1800,
    def: 1200,
    rarity: 'rare',
    deck: 'kol',
    image: 'img/cards/viral_post.jpg',
    effect: 'This card can attack directly if your opponent has Degens on the field. During each of your Standby Phases: pay 500 Faith or destroy this card.'
  },

  viral_thread: {
    id: 'viral_thread',
    name: 'Viral Thread',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1400,
    def: 1200,
    rarity: 'common',
    deck: 'kol',
    image: 'img/cards/viral_thread.jpg',
    effect: 'This card can attack directly. During each of your Standby Phases: pay 500 Faith or destroy this card.'
  },

  paid_shill: {
    id: 'paid_shill',
    name: 'Paid Shill',
    stars: 3,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1200,
    def: 800,
    rarity: 'common',
    deck: 'kol',
    image: 'img/cards/paid_shill.jpg',
    effect: 'When this card is Normal Summoned: your opponent discards 1 card from their Bag.'
  },

  ct_sniper: {
    id: 'ct_sniper',
    name: 'CT Sniper',
    stars: 3,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 1300,
    def: 900,
    rarity: 'common',
    deck: 'kol',
    image: 'img/cards/ct_sniper.jpg',
    effect: 'This card can attack face-down Degens directly, without flipping them.'
  },

  relinquished_narrative: {
    id: 'relinquished_narrative',
    name: 'Relinquished Narrative',
    stars: 1,
    type: 'monster',
    subtype: 'ritual_effect',
    attribute: 'DARK',
    atk: 0,
    def: 0,
    rarity: 'secret',
    deck: 'kol',
    image: 'img/cards/relinquished_narrative.jpg',
    effect: 'Must be Ritual Summoned with "Thousand Impressions". Once per turn: equip 1 monster on your opponent\'s field to this card (max 1 equipped). This card\'s ATK/DEF equal the equipped monster\'s. If this card would be destroyed, destroy the equipped monster instead.'
  },

  // ★★★ — 3 STARS
  the_believer: {
    id: 'the_believer',
    name: 'The Believer',
    stars: 3,
    type: 'monster',
    subtype: 'effect',
    attribute: 'LIGHT',
    atk: 1200,
    def: 1000,
    rarity: 'common',
    deck: 'father',
    image: 'img/cards/the_believer.jpg',
    effect: 'This card gains 200 ATK during each of your Standby Phases it remains face-up on the field.'
  },

  cycle_wizard: {
    id: 'cycle_wizard',
    name: 'Cycle Wizard',
    stars: 2,
    type: 'monster',
    subtype: 'effect',
    attribute: 'LIGHT',
    atk: 500,
    def: 400,
    rarity: 'rare',
    deck: 'degen',
    image: 'img/cards/cycle_wizard.jpg',
    effect: 'Once per turn: flip a coin. Heads — all Degens on your field have their ATK doubled until end of turn. Tails — all Degens on your field are destroyed.'
  },

  fresh_deploy: {
    id: 'fresh_deploy',
    name: 'Fresh Deploy',
    stars: 3,
    type: 'monster',
    subtype: 'normal',
    attribute: 'DEGEN',
    atk: 1200,
    def: 700,
    rarity: 'common',
    deck: 'degen',
    image: 'img/cards/fresh_deploy.jpg',
    effect: 'A brand new contract just deployed. Hasn\'t been bundled yet. Pure potential.'
  },

  ct_copycat: {
    id: 'ct_copycat',
    name: 'CT Copycat',
    stars: 3,
    type: 'monster',
    subtype: 'effect',
    attribute: 'VIRAL',
    atk: 0,
    def: 0,
    rarity: 'common',
    deck: 'degen',
    image: 'img/cards/ct_copycat.jpg',
    effect: 'When Normal Summoned: this card\'s ATK and DEF become equal to 1 Degen on the field (your choice).'
  },

  moonshot: {
    id: 'moonshot',
    name: 'Moonshot',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DEGEN',
    atk: 1500,
    def: 1300,
    rarity: 'common',
    deck: 'degen',
    image: 'img/cards/moonshot.jpg',
    effect: 'During battle: this card cannot be destroyed by battle. If this card battles a Degen and survives: inflict 500 Faith damage to your opponent.'
  },

  insider_wallet: {
    id: 'insider_wallet',
    name: 'Insider Wallet',
    stars: 3,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DARK',
    atk: 1400,
    def: 800,
    rarity: 'common',
    deck: 'dev',
    image: 'img/cards/insider_wallet.jpg',
    effect: 'Your opponent cannot check this card\'s ATK value until it declares an attack.'
  },

  deployed_contract: {
    id: 'deployed_contract',
    name: 'Deployed Contract',
    stars: 2,
    type: 'monster',
    subtype: 'normal',
    attribute: 'MACHINE',
    atk: 900,
    def: 600,
    rarity: 'common',
    deck: 'dev',
    image: 'img/cards/deployed_contract.jpg',
    effect: 'An immutable contract on-chain. What it does, nobody knows.'
  },

  cardinal: {
    id: 'cardinal',
    name: 'The Cardinal',
    stars: 4,
    type: 'monster',
    subtype: 'effect',
    attribute: 'LIGHT',
    atk: 1700,
    def: 1400,
    rarity: 'common',
    deck: 'father',
    image: 'img/cards/cardinal.jpg',
    effect: 'While this card is face-up: all Degens on your field gain 100 ATK.'
  },

  congregation_member: {
    id: 'congregation_member',
    name: 'Congregation Member',
    stars: 2,
    type: 'monster',
    subtype: 'effect',
    attribute: 'LIGHT',
    atk: 900,
    def: 800,
    rarity: 'common',
    deck: 'father',
    image: 'img/cards/congregation_member.jpg',
    effect: 'When this card is destroyed by battle: draw 1 card.'
  },

  // ★★ — 2 STARS
  cocoon_of_exit: {
    id: 'cocoon_of_exit',
    name: 'Cocoon of Exit',
    stars: 2,
    type: 'monster',
    subtype: 'effect',
    attribute: 'PAPER',
    atk: 0,
    def: 2000,
    rarity: 'common',
    deck: 'jeet',
    image: 'img/cards/cocoon_of_exit.jpg',
    effect: 'This card cannot attack. During your 3rd Standby Phase after it was summoned: you may Tribute this card to Special Summon "Paper Hands Queen" from your Bag or Wallet.'
  },

  rug_eater: {
    id: 'rug_eater',
    name: 'Rug Eater',
    stars: 2,
    type: 'monster',
    subtype: 'flip_effect',
    attribute: 'DARK',
    atk: 450,
    def: 600,
    rarity: 'common',
    deck: 'rugged',
    image: 'img/cards/rug_eater.jpg',
    effect: 'FLIP: Destroy 1 Degen on the field (your choice).'
  },

  ghost_wallet: {
    id: 'ghost_wallet',
    name: 'Ghost Wallet',
    stars: 1,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DARK',
    atk: 500,
    def: 500,
    rarity: 'common',
    deck: 'rugged',
    image: 'img/cards/ghost_wallet.jpg',
    effect: 'When this card is destroyed by battle: your opponent loses 300 Faith.'
  },

  narrative_control: {
    id: 'narrative_control',
    name: 'Narrative Control',
    stars: 3,
    type: 'monster',
    subtype: 'effect',
    attribute: 'DARK',
    atk: 1000,
    def: 800,
    rarity: 'common',
    deck: 'rugged',
    image: 'img/cards/narrative_control.jpg',
    effect: 'When Normal Summoned: take control of your opponent\'s Degen with the lowest ATK until your End Phase.'
  },

  parasite_wallet: {
    id: 'parasite_wallet',
    name: 'Parasite Wallet',
    stars: 2,
    type: 'monster',
    subtype: 'flip_effect',
    attribute: 'DARK',
    atk: 500,
    def: 300,
    rarity: 'rare',
    deck: 'jeet',
    image: 'img/cards/parasite_wallet.jpg',
    effect: 'FLIP: Move this card to your opponent\'s field. While there, all Degens your opponent controls are treated as JEET-type.'
  },

  baby_jeet: {
    id: 'baby_jeet',
    name: 'Baby Jeet',
    stars: 2,
    type: 'monster',
    subtype: 'normal',
    attribute: 'PAPER',
    atk: 500,
    def: 400,
    rarity: 'common',
    deck: 'jeet',
    image: 'img/cards/baby_jeet.jpg',
    effect: 'Sells at the slightest pump. Has never held anything past 2x.'
  },

  micro_jeet: {
    id: 'micro_jeet',
    name: 'Micro Jeet',
    stars: 1,
    type: 'monster',
    subtype: 'effect',
    attribute: 'PAPER',
    atk: 300,
    def: 350,
    rarity: 'common',
    deck: 'jeet',
    image: 'img/cards/micro_jeet.jpg',
    effect: 'If your opponent controls 4 or more Degens: this card can attack your opponent directly.'
  },

  // ★ — 1 STAR
  jeet: {
    id: 'jeet',
    name: 'Jeet',
    stars: 1,
    type: 'monster',
    subtype: 'effect',
    attribute: 'PAPER',
    atk: 100,
    def: 100,
    rarity: 'common',
    deck: 'shared',
    image: 'img/cards/jeet.jpg',
    effect: 'When this card is destroyed by battle: your opponent gains 200 Faith. They profited off your loss.'
  },

  the_normie: {
    id: 'the_normie',
    name: 'The Normie',
    stars: 1,
    type: 'monster',
    subtype: 'normal',
    attribute: 'LIGHT',
    atk: 400,
    def: 400,
    rarity: 'common',
    deck: 'shared',
    image: 'img/cards/the_normie.jpg',
    effect: 'Found in every starter deck. He heard about crypto from his coworker.'
  },

  // ─── BLESSING CARDS (SPELLS) ────────────────

  ape_in: {
    id: 'ape_in',
    name: 'Ape In',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'shared',
    image: 'img/cards/ape_in.jpg',
    effect: 'Draw 2 cards.'
  },

  second_chance: {
    id: 'second_chance',
    name: 'Second Chance',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'ultra',
    deck: 'shared',
    image: 'img/cards/second_chance.jpg',
    effect: 'Target 1 Degen in either player\'s Trenches: Special Summon it.'
  },

  market_crash: {
    id: 'market_crash',
    name: 'Market Crash',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'shared',
    image: 'img/cards/market_crash.jpg',
    effect: 'Destroy ALL Degens on the field.'
  },

  diamond_hands_lock: {
    id: 'diamond_hands_lock',
    name: 'Diamond Hands Lock',
    stars: null,
    type: 'blessing',
    subtype: 'continuous',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'father',
    image: 'img/cards/diamond_hands_lock.jpg',
    effect: 'Your opponent cannot declare an attack for 3 of their turns after this card\'s activation. Destroy this card after 3 turns.'
  },

  rug_virus: {
    id: 'rug_virus',
    name: 'Rug Virus',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'secret',
    deck: 'dev',
    image: 'img/cards/rug_virus.jpg',
    effect: 'Tribute 1 Degen with 1000 or less ATK: destroy all Degens in your opponent\'s Bag, field, and any they draw for the next 3 turns that have 1500 or more ATK.'
  },

  two_x_leverage: {
    id: 'two_x_leverage',
    name: '2x Leverage',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'whale',
    image: 'img/cards/2x_leverage.jpg',
    effect: 'Target 1 face-up Degen. If your Faith is less than your opponent\'s: double that Degen\'s ATK. If your Faith is more: halve it. Until the End Phase.'
  },

  market_wipe: {
    id: 'market_wipe',
    name: 'Market Wipe',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'whale',
    image: 'img/cards/market_wipe.jpg',
    effect: 'Destroy ALL Blessing and Confession cards on the field.'
  },

  green_candle: {
    id: 'green_candle',
    name: 'Green Candle',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'degen',
    image: 'img/cards/green_candle.jpg',
    effect: 'Roll a die. Multiply 1 face-up Degen\'s ATK by the result until the End Phase.'
  },

  airdrop_wallets: {
    id: 'airdrop_wallets',
    name: 'Airdrop Wallets',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'degen',
    image: 'img/cards/airdrop_wallets.jpg',
    effect: 'Special Summon 4 "Airdrop Tokens" (LIGHT/ATK 0/DEF 0) to your field. They cannot attack and cannot be Tributed except for Tribute Summons.'
  },

  narrative_shift: {
    id: 'narrative_shift',
    name: 'Narrative Shift',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'ultra',
    deck: 'kol',
    image: 'img/cards/narrative_shift.jpg',
    effect: 'Take control of 1 Degen your opponent controls until the End Phase.'
  },

  viral_world: {
    id: 'viral_world',
    name: 'Viral World',
    stars: null,
    type: 'blessing',
    subtype: 'field',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'kol',
    image: 'img/cards/viral_world.jpg',
    effect: 'All VIRAL-type Degens can attack directly if your opponent has Degens on the field. During each player\'s Standby Phase: the turn player loses 500 Faith for each VIRAL Degen they control.'
  },

  thousand_impressions: {
    id: 'thousand_impressions',
    name: 'Thousand Impressions',
    stars: null,
    type: 'blessing',
    subtype: 'ritual',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'kol',
    image: 'img/cards/thousand_impressions.jpg',
    effect: 'This card is used to Ritual Summon "Relinquished Narrative". Tribute Degens from your field or Bag whose total Stars equal or exceed 1.'
  },

  elegant_algorithm: {
    id: 'elegant_algorithm',
    name: 'Elegant Algorithm',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'ct_girl',
    image: 'img/cards/elegant_algorithm.jpg',
    effect: 'If you control a "CT Lady": Special Summon "CT Trinity" from your Bag or Wallet.'
  },

  ct_wipes_the_board: {
    id: 'ct_wipes_the_board',
    name: 'CT Wipes the Board',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'ultra',
    deck: 'ct_girl',
    image: 'img/cards/ct_wipes_the_board.jpg',
    effect: 'Destroy all Blessing and Confession cards your opponent controls.'
  },

  green_market: {
    id: 'green_market',
    name: 'Green Market',
    stars: null,
    type: 'blessing',
    subtype: 'field',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'jeet',
    image: 'img/cards/green_market.jpg',
    effect: 'All Degens gain 200 ATK and DEF.'
  },

  paper_bag: {
    id: 'paper_bag',
    name: 'Paper Bag',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'dev',
    image: 'img/cards/paper_bag.jpg',
    effect: 'Target 1 face-up Degen: its ATK becomes half until the End Phase.'
  },

  wallet_scanner: {
    id: 'wallet_scanner',
    name: 'Wallet Scanner',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'rugged',
    image: 'img/cards/wallet_scanner.jpg',
    effect: 'Declare 1 card name: if your opponent has that card in their Wallet, add it to your Bag.'
  },

  triangle_chart: {
    id: 'triangle_chart',
    name: 'Triangle Chart',
    stars: null,
    type: 'blessing',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'ct_girl',
    image: 'img/cards/triangle_chart.jpg',
    effect: 'All CT-type Degens you control gain 500 ATK. All Continuous Confession cards your opponent controls are destroyed.'
  },

  // ─── CONFESSION CARDS (TRAPS) ───────────────

  rugback: {
    id: 'rugback',
    name: 'Rugback',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'ultra',
    deck: 'father',
    image: 'img/cards/rugback.jpg',
    effect: 'Activate when your opponent declares an attack: destroy all Attack Position Degens your opponent controls.'
  },

  sniper_hole: {
    id: 'sniper_hole',
    name: 'Sniper Hole',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'shared',
    image: 'img/cards/sniper_hole.jpg',
    effect: 'Activate when your opponent Normal or Flip Summons a Degen with 1000 or more ATK: destroy that Degen.'
  },

  dev_exit: {
    id: 'dev_exit',
    name: 'Dev Exit',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'dev',
    image: 'img/cards/dev_exit.jpg',
    effect: 'Activate when your opponent attempts to Summon a Degen with 2000 or more ATK: negate the Summon and destroy that Degen.'
  },

  stop_loss: {
    id: 'stop_loss',
    name: 'Stop Loss',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'shared',
    image: 'img/cards/stop_loss.jpg',
    effect: 'Activate when your opponent declares an attack: negate that attack.'
  },

  dip_trap: {
    id: 'dip_trap',
    name: 'Dip Trap',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'degen',
    image: 'img/cards/dip_trap.jpg',
    effect: 'Activate when your opponent declares an attack: inflict damage to your opponent equal to the attacking Degen\'s ATK.'
  },

  fomo_trap: {
    id: 'fomo_trap',
    name: 'FOMO Trap',
    stars: null,
    type: 'confession',
    subtype: 'continuous',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'kol',
    image: 'img/cards/fomo_trap.jpg',
    effect: 'All Degens your opponent controls are switched to Attack Position and cannot change their Battle Position.'
  },

  locked_liquidity: {
    id: 'locked_liquidity',
    name: 'Locked Liquidity',
    stars: null,
    type: 'confession',
    subtype: 'continuous',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'kol',
    image: 'img/cards/locked_liquidity.jpg',
    effect: 'Target 1 face-up Degen your opponent controls: it cannot attack or change its Battle Position.'
  },

  red_candle: {
    id: 'red_candle',
    name: 'Red Candle',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'degen',
    image: 'img/cards/red_candle.jpg',
    effect: 'Activate when your opponent\'s Degen declares an attack: roll a die and divide that Degen\'s ATK by the result until the End Phase.'
  },

  take_you_with_me: {
    id: 'take_you_with_me',
    name: 'Take You With Me',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'rugged',
    image: 'img/cards/take_you_with_me.jpg',
    effect: 'Activate when one of your Degens is destroyed by battle: destroy 1 Degen your opponent controls.'
  },

  tx_rejected: {
    id: 'tx_rejected',
    name: 'TX Rejected',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'rare',
    deck: 'rugged',
    image: 'img/cards/tx_rejected.jpg',
    effect: 'Discard 1 card from your Bag: negate the activation of a Blessing card and destroy it.'
  },

  liquidation: {
    id: 'liquidation',
    name: 'Liquidation',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'whale',
    image: 'img/cards/liquidation.jpg',
    effect: 'Target 1 face-down Defense Position Degen your opponent controls: flip it face-up, then destroy it.'
  },

  stop_the_pump: {
    id: 'stop_the_pump',
    name: 'Stop The Pump',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'whale',
    image: 'img/cards/stop_the_pump.jpg',
    effect: 'Destroy the Degen on your opponent\'s field with the highest ATK.'
  },

  fake_exit: {
    id: 'fake_exit',
    name: 'Fake Exit',
    stars: null,
    type: 'confession',
    subtype: 'normal',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'jeet',
    image: 'img/cards/fake_exit.jpg',
    effect: 'Activate when your opponent declares an attack: negate the attack, then change the attacking Degen to face-down Defense Position.'
  },

  ct_shield: {
    id: 'ct_shield',
    name: 'CT Shield',
    stars: null,
    type: 'confession',
    subtype: 'continuous',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'ct_girl',
    image: 'img/cards/ct_shield.jpg',
    effect: 'Target 1 CT-type Degen you control: it gains 500 ATK and DEF.'
  },

  jeet_shield: {
    id: 'jeet_shield',
    name: 'Jeet Shield',
    stars: null,
    type: 'confession',
    subtype: 'continuous',
    attribute: null,
    atk: null,
    def: null,
    rarity: 'common',
    deck: 'jeet',
    image: 'img/cards/jeet_shield.jpg',
    effect: 'Your opponent\'s Degens cannot attack JEET-type Degens you control.'
  }

};

// ─── STARTER DECKS ──────────────────────────────────────────────────────────

window.PADRE_DECKS = {

  father: {
    id: 'father',
    name: 'The Father',
    character: 'FATHER',
    quote: '"The trenches bow to no one."',
    description: 'Balanced control deck with powerful comeback mechanics. The Trench Father himself leads this congregation.',
    difficulty: 3,
    color: '#FFD700',
    boss_card: 'trench_father',
    cards: [
      'trench_father',
      'based_holder', 'based_holder', 'based_holder',
      'the_believer', 'the_believer', 'the_believer',
      'cardinal', 'cardinal',
      'congregation_member', 'congregation_member', 'congregation_member',
      'jeet', 'jeet',
      'the_normie', 'the_normie',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'market_crash',
      'diamond_hands_lock', 'diamond_hands_lock',
      'rugback', 'rugback',
      'sniper_hole', 'sniper_hole',
      'stop_loss', 'stop_loss',
      'narrative_shift',
      'one_thousand_x_caller',
      'paid_shill',
      'ct_sniper',
      'green_candle',
      'airdrop_wallets',
      'dip_trap',
      'fomo_trap',
      'red_candle',
      'take_you_with_me'
    ]
  },

  dev: {
    id: 'dev',
    name: 'The Dev',
    character: 'DEV',
    quote: '"Build in silence. Dump in peace."',
    description: 'Pure aggression. Run 3 copies of Sigma Dev and overwhelm with raw ATK. Crush Card Virus ends games instantly.',
    difficulty: 2,
    color: '#00FF41',
    boss_card: 'sigma_dev',
    cards: [
      'sigma_dev', 'sigma_dev', 'sigma_dev',
      'bundler_bot', 'bundler_bot', 'bundler_bot',
      'smart_wallet', 'smart_wallet',
      'insider_wallet', 'insider_wallet', 'insider_wallet',
      'deployed_contract', 'deployed_contract',
      'degen_raider', 'degen_raider',
      'the_normie',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'market_crash',
      'paper_bag', 'paper_bag',
      'rug_virus',
      'dev_exit', 'dev_exit',
      'stop_loss', 'stop_loss',
      'sniper_hole', 'sniper_hole',
      'market_wipe',
      'two_x_leverage',
      'wallet_scanner',
      'take_you_with_me',
      'tx_rejected', 'tx_rejected',
      'dip_trap',
      'green_candle',
      'red_candle'
    ]
  },

  degen: {
    id: 'degen',
    name: 'The Degen',
    character: 'DEGEN',
    quote: '"Ape first. Think never."',
    description: 'High risk, high reward. Dice rolls and coin flips decide your fate. Boom or bust every turn.',
    difficulty: 4,
    color: '#FF6B00',
    boss_card: 'bonding_curve_dragon',
    cards: [
      'bonding_curve_dragon', 'bonding_curve_dragon',
      'early_buyer', 'early_buyer', 'early_buyer',
      'cycle_wizard', 'cycle_wizard',
      'fresh_deploy', 'fresh_deploy', 'fresh_deploy',
      'ct_copycat', 'ct_copycat',
      'moonshot', 'moonshot',
      'jeet', 'jeet',
      'the_normie',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'green_candle', 'green_candle', 'green_candle',
      'red_candle', 'red_candle',
      'airdrop_wallets', 'airdrop_wallets',
      'market_crash',
      'dip_trap', 'dip_trap',
      'stop_loss',
      'sniper_hole',
      'fake_exit',
      'take_you_with_me',
      'two_x_leverage',
      'green_market'
    ]
  },

  kol: {
    id: 'kol',
    name: 'The KOL',
    character: 'KOL',
    quote: '"I called it before it went to zero."',
    description: 'Mind control and direct attack. Steal opponent monsters, attack directly with viral posts. Pure manipulation.',
    difficulty: 5,
    color: '#FF1493',
    boss_card: 'relinquished_narrative',
    cards: [
      'relinquished_narrative',
      'viral_post', 'viral_post', 'viral_post',
      'viral_thread', 'viral_thread',
      'paid_shill', 'paid_shill', 'paid_shill',
      'ct_sniper', 'ct_sniper',
      'one_thousand_x_caller', 'one_thousand_x_caller',
      'the_normie', 'the_normie',
      'jeet',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'narrative_shift', 'narrative_shift',
      'viral_world', 'viral_world',
      'thousand_impressions',
      'market_crash',
      'fomo_trap', 'fomo_trap',
      'locked_liquidity', 'locked_liquidity',
      'stop_loss', 'stop_loss',
      'sniper_hole',
      'dip_trap',
      'tx_rejected'
    ]
  },

  jeet: {
    id: 'jeet',
    name: 'The Jeet',
    character: 'JEET',
    quote: '"I\'m taking profits. Sue me."',
    description: 'Stall until Paper Hands Queen evolves from Cocoon of Exit. High DEF, trap-heavy, exits at peak.',
    difficulty: 4,
    color: '#888888',
    boss_card: 'paper_hands_queen',
    cards: [
      'paper_hands_queen',
      'cocoon_of_exit', 'cocoon_of_exit', 'cocoon_of_exit',
      'parasite_wallet', 'parasite_wallet',
      'baby_jeet', 'baby_jeet', 'baby_jeet',
      'micro_jeet', 'micro_jeet',
      'rug_eater', 'rug_eater', 'rug_eater',
      'jeet', 'jeet',
      'the_normie',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'green_market', 'green_market',
      'airdrop_wallets',
      'market_crash',
      'jeet_shield', 'jeet_shield',
      'fake_exit', 'fake_exit', 'fake_exit',
      'sniper_hole', 'sniper_hole',
      'stop_loss', 'stop_loss',
      'dip_trap',
      'fomo_trap',
      'take_you_with_me'
    ]
  },

  whale: {
    id: 'whale',
    name: 'The Whale',
    character: 'WHALE',
    quote: '"I am the market."',
    description: 'Pure machine beatdown. Biggest ATK numbers in the game. Moves the market with raw power.',
    difficulty: 2,
    color: '#0088FF',
    boss_card: 'coordinated_dump',
    cards: [
      'coordinated_dump', 'coordinated_dump',
      'liquidity_cannon',
      'market_maker', 'market_maker',
      'whale_wallet', 'whale_wallet',
      'degen_whale', 'degen_whale', 'degen_whale',
      'bundler_bot', 'bundler_bot',
      'smart_wallet',
      'the_normie', 'the_normie',
      'jeet',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'market_crash',
      'market_wipe', 'market_wipe',
      'two_x_leverage', 'two_x_leverage',
      'paper_bag', 'paper_bag',
      'stop_the_pump', 'stop_the_pump', 'stop_the_pump',
      'liquidation', 'liquidation',
      'stop_loss',
      'sniper_hole',
      'dip_trap',
      'dev_exit',
      'take_you_with_me'
    ]
  },

  rugged: {
    id: 'rugged',
    name: 'The Rugged',
    character: 'RUGGED',
    quote: '"I didn\'t rug. I did an emergency migration."',
    description: 'Dark occult deck. Steal monsters, corrupt the field, summon the Rug God from the Trenches.',
    difficulty: 5,
    color: '#8B0000',
    boss_card: 'dev_wallet_drainer',
    cards: [
      'dev_wallet_drainer',
      'rug_god',
      'rug_eater', 'rug_eater', 'rug_eater',
      'ghost_wallet', 'ghost_wallet', 'ghost_wallet',
      'narrative_control', 'narrative_control',
      'the_normie', 'the_normie',
      'jeet', 'jeet',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'narrative_shift', 'narrative_shift',
      'market_crash',
      'wallet_scanner', 'wallet_scanner',
      'paper_bag',
      'take_you_with_me', 'take_you_with_me', 'take_you_with_me',
      'tx_rejected', 'tx_rejected',
      'sniper_hole', 'sniper_hole',
      'stop_loss',
      'dip_trap',
      'fomo_trap',
      'locked_liquidity',
      'liquidation'
    ]
  },

  ct_girl: {
    id: 'ct_girl',
    name: 'CT Girl',
    character: 'CT_GIRL',
    quote: '"I called $PEPE at 400k MC. I called $WIF at launch. I am inevitable."',
    description: 'Control and clear. Wipe opponent backrow with CT Wipes the Board. CT Trinity hits directly.',
    difficulty: 3,
    color: '#FF69B4',
    boss_card: 'chart_reader',
    cards: [
      'chart_reader', 'chart_reader',
      'ct_trinity',
      'ct_lady', 'ct_lady', 'ct_lady',
      'degen_ct', 'degen_ct',
      'degen_raider', 'degen_raider', 'degen_raider',
      'alpha_caller', 'alpha_caller',
      'one_thousand_x_caller',
      'the_normie',
      'jeet',
      'ape_in', 'ape_in', 'ape_in',
      'second_chance',
      'ct_wipes_the_board', 'ct_wipes_the_board',
      'elegant_algorithm', 'elegant_algorithm',
      'triangle_chart', 'triangle_chart',
      'market_crash',
      'narrative_shift',
      'ct_shield', 'ct_shield', 'ct_shield',
      'fomo_trap', 'fomo_trap',
      'sniper_hole', 'sniper_hole',
      'stop_loss',
      'dev_exit',
      'locked_liquidity',
      'dip_trap'
    ]
  }

};
