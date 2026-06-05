// build-season1-db.js
// Fetches real Season 1 card data from YGOPRODeck API
// Downloads full card images, generates js/cards-data.js
// Run: node build-season1-db.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, 'img', 'cards');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

// ── CHARACTER DECKS ─────────────────────────────────────────────────────────
// Cards as they appeared in the Duelist Kingdom anime arc

const CHARACTER_DECKS = {

  yugi: {
    name: "Yugi Muto",
    description: "The King of Games. Relies on combos, magic, and heart of the cards.",
    color: "#6a0dad",
    quote: "It's not over until the last card is played.",
    difficulty: 3,
    boss_card: "Dark Magician",
    cards: [
      "Dark Magician", "Dark Magician", "Curse of Dragon",
      "Summoned Skull", "Celtic Guardian", "Celtic Guardian",
      "Feral Imp", "Giant Soldier of Stone", "Giant Soldier of Stone",
      "Mammoth Graveyard", "Gaia the Fierce Knight", "Kuriboh", "Kuriboh",
      "Dark Magician Girl", "Big Shield Gardna", "Mystical Elf",
      "Dark Hole", "Monster Reborn", "Change of Heart",
      "Swords of Revealing Light", "Book of Secret Arts",
      "Pot of Greed", "Graceful Charity", "Mage Power",
      "Mirror Force", "Spellbinding Circle", "Magic Cylinder",
      "Magical Hats", "Living Arrow", "Mystical Space Typhoon",
      "Card Destruction", "Premature Burial", "Polymerization",
      "Dark Paladin", "Buster Blader",
    ]
  },

  kaiba: {
    name: "Seto Kaiba",
    description: "CEO of KaibaCorp. Crushes opponents with ultimate dragon power.",
    color: "#1a6ab5",
    quote: "Duel me if you dare. Lose and face total obliteration.",
    difficulty: 4,
    boss_card: "Blue-Eyes White Dragon",
    cards: [
      "Blue-Eyes White Dragon", "Blue-Eyes White Dragon", "Blue-Eyes White Dragon",
      "Judge Man", "Rude Kaiser", "Battle Ox", "Battle Ox",
      "La Jinn the Mystical Genie of the Lamp", "Saggi the Dark Clown",
      "Vorse Raider", "Luster Dragon", "Luster Dragon",
      "Tri-Horned Dragon", "Different Dimension Dragon",
      "Lord of D.", "The Flute of Summoning Dragon",
      "Crush Card Virus", "Ring of Destruction",
      "Monster Reborn", "Pot of Greed", "Polymerization",
      "Enemy Controller", "Soul Exchange", "Shrink",
      "Negate Attack", "Trap Jammer", "Rare Metal Dragon",
      "Kaiser Glider", "Blade Knight", "Cyber Dragon",
      "Blue-Eyes Ultimate Dragon", "XYZ-Dragon Cannon",
    ]
  },

  joey: {
    name: "Joey Wheeler",
    description: "Brooklyn's finest. Uses luck, gambles, and never gives up.",
    color: "#c45c00",
    quote: "I may not have the best cards, but I got heart!",
    difficulty: 2,
    boss_card: "Red-Eyes Black Dragon",
    cards: [
      "Red-Eyes Black Dragon", "Red-Eyes Black Dragon",
      "Time Wizard", "Baby Dragon", "Baby Dragon", "Baby Dragon",
      "Flame Swordsman", "Garoozis", "Axe Raider", "Axe Raider",
      "Copycat", "Alligator's Sword", "Swordsman from a Foreign Land",
      "Goblin Attack Force", "Roulette Barrel",
      "Legendary Fisherman", "Panther Warrior",
      "Graceful Dice", "Skull Dice", "Shield & Sword",
      "Scapegoat", "Heavy Storm", "Premature Burial",
      "Kunai with Chain", "Graverobber", "Trap Hole",
      "Fairy Box", "Skull Dice", "Giant Trunade",
      "Thousand Dragon", "Red-Eyes Black Metal Dragon",
    ]
  },

  mai: {
    name: "Mai Valentine",
    description: "Elegant and deadly. Her Harpies dominate the field.",
    color: "#9b2d7a",
    quote: "My Harpies will tear you apart.",
    difficulty: 3,
    boss_card: "Harpie Lady Sisters",
    cards: [
      "Harpie Lady", "Harpie Lady", "Harpie Lady",
      "Harpie Lady Sisters", "Harpie's Pet Dragon",
      "Sonic Duck", "Cyber Harpie Lady",
      "Amazoness Archer", "Amazoness Chain Master",
      "Harpie's Feather Duster", "Elegant Egotist",
      "Triangle Ecstasy Spark", "Cyber Shield", "Cyber Shield",
      "Rose Whip", "Rose Whip", "Electro-Whip",
      "Mirror Wall", "Shadow of Eyes", "Trap Jammer",
      "Mystical Space Typhoon", "Heavy Storm",
      "Monster Reborn", "Pot of Greed",
      "Gravity Bind", "Level Limit - Area B",
      "Ryu-Kishin Powered", "Sonic Bird",
      "Birdface", "Harpie Lady 1",
    ]
  },

  weevil: {
    name: "Weevil Underwood",
    description: "Sneaky insect duelist. Uses bugs, traps, and dirty tricks.",
    color: "#2d7a2d",
    quote: "Insects will inherit the earth!",
    difficulty: 3,
    boss_card: "Insect Queen",
    cards: [
      "Insect Queen", "Great Moth", "Larvae Moth",
      "Cocoon of Evolution", "Perfectly Ultimate Great Moth",
      "Basic Insect", "Leghul", "Leghul",
      "Hercules Beetle", "Hercules Beetle",
      "Man-Eater Bug", "Man-Eater Bug",
      "Hive Mind", "Flying Kamakiri #1",
      "Insect Soldiers of the Sky", "Parasite Paracide",
      "Insect Barrier", "Spore Dispersal",
      "Eatgaboon", "Trap Hole", "Trap Hole",
      "Pot of Greed", "Heavy Storm",
      "DNA Surgery", "DNA Transplant",
      "Butterfly Dagger - Elma", "Resonance Device",
      "Inzektor Dragonfly", "Doom Dozer", "Resonance Device",
    ]
  },

  rex: {
    name: "Rex Raptor",
    description: "Dino duelist. Overpowers with raw ATK and prehistoric monsters.",
    color: "#8b0000",
    quote: "Dinosaurs ruled this world once, and they will again!",
    difficulty: 2,
    boss_card: "Serpent Night Dragon",
    cards: [
      "Serpent Night Dragon", "Two-Headed King Rex",
      "Two-Headed King Rex", "Sword Arm of Dragon",
      "Trakodon", "Trakodon", "Darkworld Thorns",
      "Uraby", "Uraby", "Black Tyranno",
      "Gilasaurus", "Hydrogeddon", "Hydrogeddon",
      "Kabazauls", "Sabersaurus", "Sabersaurus",
      "Dragon Capture Jar", "Magical Labyrinth",
      "Trap Hole", "Trap Hole", "Giant Trunade",
      "Monster Reborn", "Pot of Greed", "Heavy Storm",
      "Big Evolution Pill", "Hunting Instinct",
      "Jurassic World", "Ultra Evolution Pill",
      "Bottomless Trap Hole", "Earthquake",
    ]
  },

  pegasus: {
    name: "Maximillion Pegasus",
    description: "Creator of Duel Monsters. Toons and mind manipulation.",
    color: "#c0a020",
    quote: "My Millennium Eye sees your every move.",
    difficulty: 5,
    boss_card: "Relinquished",
    cards: [
      "Relinquished", "Relinquished",
      "Toon Summoned Skull", "Toon Mermaid", "Toon Mermaid",
      "Blue-Eyes Toon Dragon", "Toon Dark Magician Girl",
      "Toon Gemini Elf", "Toon Goblin Attack Force",
      "Thousand-Eyes Restrict",
      "Black Illusion Ritual", "Black Illusion Ritual",
      "Toon World", "Toon World",
      "Comic Hand", "Toon Table of Contents", "Toon Table of Contents",
      "Toon Rollback", "Monster Reborn", "Pot of Greed",
      "Change of Heart", "Snatch Steal",
      "Trap Hole", "Bottomless Trap Hole",
      "Magic Cylinder", "Judgment of Anubis",
      "Wall of Illusion", "Jigen Bakudan",
      "Copycat", "Magical Hats",
    ]
  },

  bakura: {
    name: "Ryo Bakura",
    description: "Possessed by dark evil. Stall, control, and the Destiny Board.",
    color: "#3a3a3a",
    quote: "My dark power has no equal.",
    difficulty: 4,
    boss_card: "Dark Necrofear",
    cards: [
      "Dark Necrofear", "Dark Necrofear",
      "Headless Knight", "Headless Knight",
      "Earl of Demise", "Earthbound Spirit",
      "The Dark Spirit of the Silent", "The Dark Spirit of the Silent",
      "Sorcerer of the Doomed", "Morphing Jar",
      "Change of Heart", "Change of Heart",
      "Destiny Board",
      "Spirit Message \"I\"", "Spirit Message \"N\"",
      "Spirit Message \"A\"", "Spirit Message \"L\"",
      "Dark Door", "Dark Sanctuary",
      "Monster Reborn", "Pot of Greed",
      "Ectoplasmer", "Shallow Grave",
      "Nightmare Wheel", "Nightmare Wheel",
      "Fairy Box", "Mask of the Accursed",
      "Call of the Haunted", "Curse of Aging",
      "Demotion", "Michizure",
    ]
  },

};

// ── HELPERS ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PADRE-CardGame/2.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve(); return; }
    const file = fs.createWriteStream(dest);
    const get = (u) => https.get(u, { headers: { 'User-Agent': 'PADRE-CardGame/2.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) { file.close(); get(res.headers.location); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, ()=>{}); reject(err); });
    get(url);
  });
}

function safeId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function cardType(apiCard) {
  const t = (apiCard.type || '').toLowerCase();
  if (t.includes('spell')) return 'spell';
  if (t.includes('trap')) return 'trap';
  return 'monster';
}

function cardSubtype(apiCard) {
  const t = (apiCard.type || '').toLowerCase();
  if (t.includes('spell')) {
    if (t.includes('continuous')) return 'continuous';
    if (t.includes('field')) return 'field';
    if (t.includes('equip')) return 'equip';
    if (t.includes('ritual')) return 'ritual';
    if (t.includes('quick')) return 'quick';
    return 'normal';
  }
  if (t.includes('trap')) {
    if (t.includes('continuous')) return 'continuous';
    if (t.includes('counter')) return 'counter';
    return 'normal';
  }
  // monster subtypes
  if (t.includes('ritual')) return 'ritual';
  if (t.includes('fusion')) return 'fusion';
  if (t.includes('flip')) return 'flip';
  if (t.includes('toon')) return 'toon';
  if (t.includes('effect')) return 'effect';
  return 'normal';
}

function rarity(apiCard) {
  const name = (apiCard.name || '');
  // rough rarity based on card fame / power level
  const UR = ['Blue-Eyes White Dragon','Dark Magician','Red-Eyes Black Dragon','Exodia the Forbidden One','Relinquished','Thousand-Eyes Restrict','Dark Necrofear','Insect Queen','Blue-Eyes Ultimate Dragon','Dark Paladin'];
  const SR = ['Summoned Skull','Harpie Lady Sisters','Gaia the Fierce Knight','Curse of Dragon','Serpent Night Dragon','Toon Summoned Skull','Flame Swordsman','Vorse Raider','Tri-Horned Dragon'];
  const R  = ['Mirror Force','Monster Reborn','Change of Heart','Pot of Greed','Dark Hole','Swords of Revealing Light','Crush Card Virus','Black Illusion Ritual','Polymerization'];
  if (UR.includes(name)) return 'ultra';
  if (SR.includes(name)) return 'super';
  if (R.includes(name))  return 'rare';
  return 'common';
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  // Collect all unique card names across all decks
  const allNames = new Set();
  for (const deck of Object.values(CHARACTER_DECKS)) {
    deck.cards.forEach(n => allNames.add(n));
    allNames.add(deck.boss_card);
  }

  console.log(`\nFetching data for ${allNames.size} unique cards...\n`);

  const cardDB = {}; // id → card object

  for (const name of allNames) {
    const id = safeId(name);
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`;

    try {
      const data = await fetchJSON(url);
      if (!data.data || !data.data[0]) {
        console.log(`  ✗ miss  "${name}"`);
        await sleep(120);
        continue;
      }
      const c = data.data[0];
      const imgFile = path.join(IMG_DIR, `${id}.jpg`);
      const imgUrl = c.card_images[0].image_url;

      await downloadFile(imgUrl, imgFile);

      cardDB[id] = {
        id,
        name: c.name,
        stars: c.level || 0,
        type: cardType(c),
        subtype: cardSubtype(c),
        attribute: c.attribute || '',
        atk: c.atk != null ? c.atk : null,
        def: c.def != null ? c.def : null,
        rarity: rarity(c),
        image: `img/cards/${id}.jpg`,
        effect: (c.desc || '').replace(/\r?\n/g, ' ').substring(0, 200),
      };

      console.log(`  ✓  ${c.name} (${cardType(c)}, ${c.atk ?? '-'}/${c.def ?? '-'})`);
    } catch(err) {
      console.log(`  ✗ err  "${name}": ${err.message}`);
    }

    await sleep(120);
  }

  console.log(`\nBuilding character decks...\n`);

  // Build PADRE_DECKS — map card names to IDs, skip missing
  const builtDecks = {};
  for (const [deckId, deckDef] of Object.entries(CHARACTER_DECKS)) {
    const cardIds = deckDef.cards
      .map(n => safeId(n))
      .filter(id => cardDB[id]);
    const bossId = safeId(deckDef.boss_card);

    builtDecks[deckId] = {
      id: deckId,
      name: deckDef.name,
      description: deckDef.description,
      color: deckDef.color,
      quote: deckDef.quote,
      difficulty: deckDef.difficulty,
      boss_card: bossId,
      cards: cardIds,
    };

    console.log(`  ${deckDef.name}: ${cardIds.length} cards`);
  }

  // Write js/cards-data.js
  const out = `// AUTO-GENERATED by build-season1-db.js — do not edit manually
// Season 1 / Duelist Kingdom card database

window.PADRE_CARDS = ${JSON.stringify(cardDB, null, 2)};

window.PADRE_DECKS = ${JSON.stringify(builtDecks, null, 2)};
`;

  fs.writeFileSync(path.join(__dirname, 'js', 'cards-data.js'), out);
  console.log(`\n✅  js/cards-data.js written (${Object.keys(cardDB).length} cards, ${Object.keys(builtDecks).length} decks)`);
  console.log(`\nNow run:\n  git add img/cards js/cards-data.js && git commit -m "Season 1 card database" && git push\n`);
}

main().catch(console.error);
