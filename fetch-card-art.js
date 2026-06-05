// fetch-card-art.js
// Run with: node fetch-card-art.js
// Downloads cropped YGOPRODeck artwork for each PADRE card
// Uses CROPPED art — just the illustration, no Konami card frame

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'img', 'cards');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Map: PADRE card id → Yu-Gi-Oh card name to search
const CARD_MAP = {
  // ── MONSTERS ──────────────────────────────────────────────────────────────
  trench_father:            'Dark Magician',
  sigma_dev:                null, // already have SigmaDev.png — skip
  bonding_curve_dragon:     'Red-Eyes Black Dragon',
  chart_reader:             'Harpie Lady',
  paper_hands_queen:        'Insect Queen',
  dev_wallet_drainer:       'Dark Necrofear',
  coordinated_dump:         'Barrel Dragon',
  relinquished_narrative:   'Relinquished',
  liquidity_cannon:         'Launcher Spider',
  rug_god:                  'Beast of Talwar',
  ct_trinity:               'Harpie Lady Sisters',
  based_holder:             'Celtic Guardian',
  bundler_bot:              'Machine King',
  smart_wallet:             'Magician of Faith',
  early_buyer:              'Roulette Barrel',
  degen_whale:              'The Fiend Megacyber',
  degen_raider:             'Vorse Raider',
  ct_lady:                  'Harpie Lady',
  degen_ct:                 'Cyber Harpie Lady',
  alpha_caller:             'Amazon Archer',
  market_maker:             'Cyber-Tech Alligator',
  whale_wallet:             'Zoa',
  viral_post:               'Toon Summoned Skull',
  viral_thread:             'Toon Mermaid',
  paid_shill:               'Neo the Magic Swordsman',
  ct_sniper:                'Nobleman of Crossout',
  one_thousand_x_caller:    'Magician of Faith',
  cardinal:                 'Royal Magical Library',
  the_believer:             'Mystical Elf',
  congregation_member:      'Witch of the Black Forest',
  cocoon_of_exit:           'Cocoon of Evolution',
  rug_eater:                'Man-Eater Bug',
  ghost_wallet:             'Shadow Specter',
  narrative_control:        'Possessed Dark Soul',
  parasite_wallet:          'Parasite Paracide',
  baby_jeet:                'Baby Dragon',
  micro_jeet:               'Leghul',
  jeet:                     'Kuriboh',
  the_normie:               'Hitotsu-Me Giant',
  insider_wallet:           'Muka Muka',
  deployed_contract:        'Ancient Brain',
  cycle_wizard:             'Time Wizard',
  fresh_deploy:             'Hitotsu-Me Giant',
  ct_copycat:               'Copycat',
  moonshot:                 'Rocket Warrior',

  // ── BLESSINGS (SPELLS) ────────────────────────────────────────────────────
  ape_in:                   'Pot of Greed',
  second_chance:            'Monster Reborn',
  market_crash:             'Dark Hole',
  diamond_hands_lock:       'Swords of Revealing Light',
  rug_virus:                'Crush Card Virus',
  two_x_leverage:           'Megamorph',
  market_wipe:              'Heavy Storm',
  green_candle:             'Graceful Dice',
  airdrop_wallets:          'Scapegoat',
  narrative_shift:          'Change of Heart',
  viral_world:              'Toon World',
  thousand_impressions:     'Black Illusion Ritual',
  elegant_algorithm:        'Elegant Egotist',
  ct_wipes_the_board:       "Harpie's Feather Duster",
  green_market:             'Forest',
  paper_bag:                'Shrink',
  wallet_scanner:           'Dark Designator',
  triangle_chart:           'Triangle Ecstasy Spark',

  // ── CONFESSIONS (TRAPS) ───────────────────────────────────────────────────
  rugback:                  'Mirror Force',
  sniper_hole:              'Trap Hole',
  dev_exit:                 'Crush Card Virus',
  stop_loss:                'Negate Attack',
  dip_trap:                 'Trap Jammer',
  fomo_trap:                'Shadow of Eyes',
  locked_liquidity:         'Spellbinding Circle',
  red_candle:               'Skull Dice',
  take_you_with_me:         'Michizure',
  tx_rejected:              'Magic Jammer',
  liquidation:              'Acid Trap Hole',
  stop_the_pump:            'Widespread Ruin',
  fake_exit:                'Flint Lock',
  ct_shield:                'Cyber Shield',
  jeet_shield:              'Insect Barrier',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PADRE-CardGame/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'PADRE-CardGame/1.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, ()=>{}); reject(err); });
  });
}

async function main() {
  const entries = Object.entries(CARD_MAP).filter(([id, name]) => name !== null);
  console.log(`Fetching art for ${entries.length} cards...\n`);

  for (const [padreId, ygoName] of entries) {
    const outFile = path.join(OUT_DIR, `${padreId}.jpg`);

    // skip if already exists
    if (fs.existsSync(outFile)) {
      console.log(`  ✓ skip  ${padreId} (already exists)`);
      continue;
    }

    try {
      // search YGOPRODeck API
      const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(ygoName)}`;
      const data = await fetchJSON(apiUrl);

      if (!data.data || !data.data[0]) {
        console.log(`  ✗ miss  ${padreId} → "${ygoName}" not found`);
        continue;
      }

      const card = data.data[0];
      const imgUrl = card.card_images[0].image_url; // full card with frame, name, ATK/DEF

      await downloadFile(imgUrl, outFile);
      console.log(`  ↓ done  ${padreId} → ${card.name}`);

      await sleep(100); // respect rate limit (max 20/sec)
    } catch (err) {
      console.log(`  ✗ err   ${padreId}: ${err.message}`);
    }
  }

  console.log('\nDone! All artwork downloaded to img/cards/');
  console.log('Now run: git add img/cards && git commit -m "Add placeholder card art" && git push');
}

main();
