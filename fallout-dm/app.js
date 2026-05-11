// ============================================================
// VAULT-TEC OVERSEER TERMINAL // Fallout DM Toolkit
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const rand = (n) => Math.floor(Math.random() * n) + 1;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
    const out = [];
    const copy = [...arr];
    for (let i = 0; i < n && copy.length; i++) {
        out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    }
    return out;
};

// SESSION INIT
$('#session-date').textContent = new Date().toISOString().split('T')[0] + ' // 2287.10.23';

// ============================================================
// TABS
// ============================================================
$$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        $$('.tab').forEach(t => t.classList.toggle('active', t === tab));
        $$('.panel').forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
    });
});

document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    const keyMap = {
        '1': 'dice', '2': 'initiative', '3': 'npc', '4': 'loot',
        '5': 'encounter', '6': 'settlement', '7': 'quest',
        '8': 'conditions', '9': 'notes', '0': 'heroes'
    };
    if (keyMap[e.key]) {
        $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === keyMap[e.key]));
        $$('.panel').forEach(p => p.classList.toggle('active', p.id === `tab-${keyMap[e.key]}`));
    }
});

// ============================================================
// DICE ROLLER
// ============================================================
function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

function renderRolls(rolls, sides, mod = 0) {
    const total = rolls.reduce((a, b) => a + b, 0) + mod;
    const detail = rolls.join(' + ');
    let critClass = '';
    if (sides === 20 && rolls.length === 1) {
        if (rolls[0] === 20) critClass = 'crit';
        if (rolls[0] === 1) critClass = 'fail';
    }
    return `&gt; ROLLED ${rolls.length}d${sides}${mod ? (mod >= 0 ? `+${mod}` : mod) : ''}\n&gt; [${detail}]${mod ? ` ${mod >= 0 ? '+' : ''}${mod}` : ''}\n&gt; TOTAL: <span class="total ${critClass}">${total}</span>${critClass === 'crit' ? '\n&gt; *** CRITICAL HIT ***' : ''}${critClass === 'fail' ? '\n&gt; *** CRITICAL FAILURE ***' : ''}`;
}

$$('[data-die]').forEach(btn => {
    btn.addEventListener('click', () => {
        const sides = parseInt(btn.dataset.die);
        const qty = parseInt($('#dice-qty').value) || 1;
        const mod = parseInt($('#dice-mod').value) || 0;
        const rolls = Array.from({ length: qty }, () => rollDie(sides));
        $('#dice-result').innerHTML = renderRolls(rolls, sides, mod);
    });
});

$('#custom-roll').addEventListener('click', () => {
    const sides = parseInt($('#dice-qty').value) || 6;
    const rolls = [rollDie(sides)];
    $('#dice-result').innerHTML = renderRolls(rolls, sides, 0);
});

$('#formula-roll').addEventListener('click', () => {
    const formula = $('#custom-formula').value.trim().toLowerCase();
    const m = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!m) { $('#dice-result').innerHTML = '&gt; ERROR: USE FORMAT XdY+Z (e.g. 2d6+3)'; return; }
    const qty = parseInt(m[1]), sides = parseInt(m[2]), mod = parseInt(m[3] || '0');
    const rolls = Array.from({ length: qty }, () => rollDie(sides));
    $('#dice-result').innerHTML = renderRolls(rolls, sides, mod);
});

$('#roll-special').addEventListener('click', () => {
    const attr = $('#special-attr').value;
    const score = parseInt($('#special-score').value) || 5;
    const diff = parseInt($('#special-diff').value) || 0;
    const target = score + diff;
    const rolls = [rollDie(20), rollDie(20)];
    const best = Math.min(...rolls);
    const pass = best <= target;
    let critClass = '';
    if (best === 1) critClass = 'crit';
    if (best === 20) critClass = 'fail';
    $('#special-result').innerHTML =
        `&gt; ${attr} CHECK (Target: ${target} or lower)\n` +
        `&gt; ROLLED 2d20 (advantage): [${rolls.join(', ')}] // BEST: ${best}\n` +
        `&gt; <span class="total ${critClass}">${pass ? 'SUCCESS ✓' : 'FAILURE ✗'}</span>` +
        (critClass === 'crit' ? '\n&gt; *** CRITICAL SUCCESS ***' : '') +
        (critClass === 'fail' ? '\n&gt; *** CRITICAL FAILURE ***' : '');
});

// ============================================================
// INITIATIVE TRACKER
// ============================================================
let combatants = [];
let currentTurn = 0;
let roundNum = 1;

function renderInitiative() {
    const tbody = $('#init-list');
    tbody.innerHTML = '';
    combatants.forEach((c, i) => {
        const tr = document.createElement('tr');
        if (i === currentTurn) tr.classList.add('current');
        if (c.hp <= 0) tr.classList.add('dead');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${c.name}</td>
            <td>${c.init}</td>
            <td><input type="number" value="${c.hp}" data-i="${i}" class="hp-input" style="width:60px"></td>
            <td>${c.ac}</td>
            <td>${c.status || '-'}</td>
            <td>
                <button class="icon-btn" data-act="status" data-i="${i}">STAT</button>
                <button class="icon-btn danger" data-act="remove" data-i="${i}">DEL</button>
            </td>`;
        tbody.appendChild(tr);
    });
    $('#round-num').textContent = roundNum;

    $$('.hp-input').forEach(inp => {
        inp.addEventListener('change', (e) => {
            combatants[parseInt(e.target.dataset.i)].hp = parseInt(e.target.value);
            renderInitiative();
        });
    });
    $$('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.i);
            if (btn.dataset.act === 'remove') {
                combatants.splice(i, 1);
                if (currentTurn >= combatants.length) currentTurn = 0;
                renderInitiative();
            } else if (btn.dataset.act === 'status') {
                const s = prompt(`Status for ${combatants[i].name}? (e.g. Crippled, Bleeding, Radiated)`);
                if (s !== null) { combatants[i].status = s; renderInitiative(); }
            }
        });
    });
}

$('#add-combatant').addEventListener('click', () => {
    const name = $('#init-name').value.trim();
    const init = parseInt($('#init-roll').value) || rand(20);
    const hp = parseInt($('#init-hp').value) || 10;
    const ac = parseInt($('#init-ac').value) || 0;
    if (!name) return;
    combatants.push({ name, init, hp, ac, status: '' });
    combatants.sort((a, b) => b.init - a.init);
    $('#init-name').value = ''; $('#init-roll').value = '';
    $('#init-hp').value = ''; $('#init-ac').value = '';
    renderInitiative();
});

$('#next-turn').addEventListener('click', () => {
    if (!combatants.length) return;
    currentTurn = (currentTurn + 1) % combatants.length;
    if (currentTurn === 0) roundNum++;
    renderInitiative();
});

$('#clear-init').addEventListener('click', () => {
    if (confirm('Clear all combatants?')) {
        combatants = []; currentTurn = 0; roundNum = 1;
        renderInitiative();
    }
});

// ============================================================
// NPC GENERATOR
// ============================================================
const NPC_DATA = {
    wastelander: {
        firstNames: ['Mara', 'Jeb', 'Sarge', 'Lulu', 'Otis', 'Wren', 'Boone', 'Pickman', 'Tessa', 'Cricket', 'Marcus', 'Sully', 'Doc', 'Pip', 'Hazel'],
        lastNames: ['Sutherland', 'Dawes', 'Kemper', 'Riley', 'Quincey', 'Howe', 'Vance', 'Wright', 'Mason', 'Bickford'],
        traits: ['Coughs constantly', 'Missing two fingers', 'Distrusts outsiders', 'Speaks in third person', 'Always hungry', 'Hums old pre-war jingles', 'Wears a lucky bottle cap', 'Twitching eye', 'Quietly devout to Atom'],
        jobs: ['Scavenger', 'Brahmin Herder', 'Caravan Guard', 'Drifter', 'Junk Trader', 'Farmer', 'Town Drunk', 'Smuggler', 'Mechanic', 'Bartender'],
        goals: ['Save up for a pre-war pocket watch', 'Find their missing sibling', 'Avenge their slain settlement', 'Pay off a debt to a raider boss', 'Open their own scrap shop']
    },
    raider: {
        firstNames: ['Tank', 'Spike', 'Maul', 'Crusher', 'Vex', 'Ripper', 'Bones', 'Razor', 'Scab', 'Vinny', 'Lash', 'Rotgut'],
        lastNames: ['the Skinner', 'Hellgore', 'Madeye', 'Coldsteel', 'Bloodfist', 'Rad-King', 'Killtongue', 'the Butcher'],
        traits: ['Wears a string of ears', 'Laughs at inappropriate times', 'Addicted to Jet', 'Painted skull face', 'Cybernetic eye', 'Trophy necklaces from kills', 'Sharpened teeth'],
        jobs: ['Gang Lieutenant', 'Slaver', 'Chem Cook', 'Enforcer', 'Scout', 'Champion of the pit', 'Self-styled prophet'],
        goals: ['Take over the next outpost', 'Score the biggest Jet stash in the wastes', 'Kill someone bigger than them', 'Build a throne of fusion cores']
    },
    brotherhood: {
        firstNames: ['Paladin Cross', 'Knight-Sergeant Vance', 'Scribe Lyons', 'Initiate Park', 'Star Paladin Reyes', 'Elder Maxson', 'Proctor Quinlan'],
        lastNames: [],
        traits: ['Bone-deep discipline', 'Suspicious of synths', 'Obsessed with codex protocol', 'Always armored', 'Tradition over mercy'],
        jobs: ['Patrol Paladin', 'Field Scribe', 'Knight-Captain', 'Recon Lancer', 'Tech Acquisitions'],
        goals: ['Recover lost pre-war tech', 'Eradicate Super Mutants in the region', 'Promote to Star Paladin', 'Uncover a hidden Vault']
    },
    enclave: {
        firstNames: ['Colonel Autumn', 'Sergeant Granite', 'President Eden', 'Major Vance', 'Lt. Williams'],
        lastNames: [],
        traits: ['Ramrod posture', 'Speaks of "true Americans"', 'Disdain for mutants of any kind', 'Loyal beyond reason'],
        jobs: ['Sigma Squad operative', 'Vertibird pilot', 'Field Researcher', 'Eden propagandist'],
        goals: ['Cleanse a region of "impure" mutants', 'Recover a pre-war battle plan', 'Establish a new outpost in secret']
    },
    ncr: {
        firstNames: ['Ranger Hanlon', 'Major Polatli', 'Lt. Boyd', 'Caesar', 'Trooper Reese'],
        lastNames: [],
        traits: ['Sun-burned face', 'Coffee addiction', 'Carries letters from home', 'Worn duster'],
        jobs: ['NCR Ranger', 'Heavy Trooper', 'Quartermaster', 'Diplomatic envoy'],
        goals: ['Annex the next region for the Republic', 'Find a long-lost friend in the wastes', 'Earn the Star of Carolina']
    },
    legion: {
        firstNames: ['Vulpes Inculta', 'Lucius', 'Aurelius of Phoenix', 'Cursor Lucullus', 'Decanus Severus'],
        lastNames: [],
        traits: ['Latin mottos under breath', 'Football pad armor', 'Brand of slavery (or slaver)', 'Stoic, unreadable face'],
        jobs: ['Frumentarius spy', 'Centurion', 'Praetorian guard', 'Slaver'],
        goals: ['Crucify a notable dissident', 'Capture a town for the Legion', 'Hunt an escaped slave']
    },
    institute: {
        firstNames: ['Dr. Li', 'Father', 'Justin Ayo', 'Dr. Watson', 'Coursers C12-77', 'X6-88'],
        lastNames: [],
        traits: ['Eerily clean', 'Talks down to surface dwellers', 'Carries an Institute pistol', 'Cold, clinical curiosity'],
        jobs: ['Courser', 'BioScience researcher', 'Synth Retention Bureau', 'Director'],
        goals: ['Recover a runaway synth', 'Retrieve a pre-war genetic sample', 'Replace a key wastelander with a synth duplicate']
    },
    ghoul: {
        firstNames: ['Hancock', 'Daisy', 'Kent', 'Carol', 'Roy Phillips', 'Charon', 'Raul', 'Cooke', 'Mister House (jokingly)'],
        lastNames: [],
        traits: ['Pre-war accent', 'Skin sloughing in places', 'Remembers the bombs falling', 'Addicted to Mentats', 'Goes feral if pushed'],
        jobs: ['Mayor of a ghoul town', 'Mercenary', 'Smoothskin liaison', 'Comic book collector', 'Bartender of 200 years'],
        goals: ['Find the rest of their pre-war family', 'Get revenge on a forgotten enemy', 'Protect their last surviving friend']
    },
    supermutant: {
        firstNames: ['Strong', 'Marcus', 'Lily', 'Tabitha', 'Erickson', 'Fawkes', 'Uncle Leo'],
        lastNames: [],
        traits: ['Hoards "shiny things"', 'Quotes Shakespeare badly', 'Carries a metal door as shield', 'Surprisingly gentle', 'Hates Brotherhood especially'],
        jobs: ['Warband leader', 'Lone wanderer', 'Sniper of the Hills', 'Cage-fighter', 'Self-appointed mayor'],
        goals: ['Find "milk of human kindness"', 'Build the perfect ham radio', 'Kill all "little humans"', 'Save other mutants from feral state']
    },
    vault: {
        firstNames: ['Vault 111 Survivor', 'Overseer\'s Daughter', 'Resident 84', 'Lone Wanderer', 'Sole Survivor', 'Chosen One'],
        lastNames: [],
        traits: ['Stiff, unweathered Vault suit', 'Naïvely trusting', 'Pip-Boy on wrist', 'Apologizes too much', 'Talks like a 1950s ad'],
        jobs: ['Vault tech apprentice', 'Hydroponics aide', 'Security trainee', 'Pip-Boy programmer', 'Lottery "winner"'],
        goals: ['Find a missing parent or child', 'Bring fresh water back to the vault', 'Repair the GECK', 'Escape the wasteland forever']
    },
    trader: {
        firstNames: ['Cricket', 'Trashcan Carla', 'Lucas Miller', 'Doc Hoff', 'Crow', 'Wolfgang'],
        lastNames: [],
        traits: ['Always armed Brahmin pack', 'Knows everyone\'s gossip', 'Quick math, slow tempers', 'Caps belt charm bracelet'],
        jobs: ['Caravan Master', 'Chem Specialist', 'Armor Trader', 'Junk Buyer', 'Information Broker'],
        goals: ['Strike a route no one else dares', 'Sell a rare pre-war artifact', 'Find a fabled buried cache']
    }
};

function generateNPC(faction) {
    if (faction === 'random') {
        const keys = Object.keys(NPC_DATA);
        faction = pick(keys);
    }
    const f = NPC_DATA[faction];
    const first = pick(f.firstNames);
    const last = f.lastNames.length ? ' ' + pick(f.lastNames) : '';
    const name = first + last;
    const trait = pick(f.traits);
    const job = pick(f.jobs);
    const goal = pick(f.goals);
    const SPECIAL = {
        S: rand(8) + 2, P: rand(8) + 2, E: rand(8) + 2,
        C: rand(8) + 2, I: rand(8) + 2, A: rand(8) + 2, L: rand(8) + 2
    };
    const hp = SPECIAL.E * 5 + rand(10);
    const factionLabel = faction.toUpperCase().replace('SUPERMUTANT', 'SUPER MUTANT');
    return `╔════════════════════════════════════════════╗
║ NAME:     ${name.padEnd(33)}║
║ FACTION:  ${factionLabel.padEnd(33)}║
║ ROLE:     ${job.padEnd(33)}║
╠════════════════════════════════════════════╣
║ S:${SPECIAL.S}  P:${SPECIAL.P}  E:${SPECIAL.E}  C:${SPECIAL.C}  I:${SPECIAL.I}  A:${SPECIAL.A}  L:${SPECIAL.L}        ║
║ HP: ${String(hp).padEnd(38)}║
╠════════════════════════════════════════════╣
║ TRAIT:    ${trait.slice(0, 33).padEnd(33)}║
║ GOAL:     ${goal.slice(0, 33).padEnd(33)}║
╚════════════════════════════════════════════╝`;
}

$('#gen-npc').addEventListener('click', () => {
    $('#npc-output').textContent = generateNPC($('#npc-faction').value);
});
$('#gen-npc-party').addEventListener('click', () => {
    const out = [];
    for (let i = 0; i < 5; i++) out.push(generateNPC($('#npc-faction').value));
    $('#npc-output').textContent = out.join('\n\n');
});

// ============================================================
// LOOT GENERATOR
// ============================================================
const LOOT_TABLES = {
    raider: {
        common: ['{n} bottle caps', 'Rusted pipe pistol with {a} rounds', 'Jet x{x}', 'Stimpak', 'Combat knife', 'Bloodstained leather chest piece', 'Half-eaten InstaMash', 'Cigarettes x{x}', 'Filthy rag', 'Pre-war money $${n}'],
        uncommon: ['Sawed-off shotgun + {a} shells', 'Psycho x{x}', 'Tribal armor (leather)', 'Frag grenade x{x}', 'Sledgehammer', 'Bottle of whiskey', 'Ear necklace (16 caps)', 'Stash of Mentats'],
        rare: ['Ripper (powered)', 'Combat armor torso', 'Junk jet schematic', 'Mini-nuke shell (empty)', 'Raider Power Armor frame piece'],
        legendary: ['Two-Shot 10mm Pistol', 'Painted Power Armor helmet (functional)', 'Pre-war Chinese Officer\'s Sword', 'Bloody mess perk magazine']
    },
    ammobox: {
        common: ['5mm ammo x{aa}', '.38 ammo x{aa}', '.308 ammo x{a}', 'Shotgun shells x{a}', '10mm rounds x{a}', '2mm EC x{x}', 'Energy cell x{a}'],
        uncommon: ['Frag grenade x{x}', 'Plasma cartridge x{a}', '.50 cal x{a}', 'Pulse grenade x{x}', 'Molotov x{x}'],
        rare: ['Mini-nuke', 'Missile x{x}', 'Fusion cell x{aa}', 'Plasma core'],
        legendary: ['Fat Man with mini-nuke loaded', 'Tesla Coils (3)', 'Fusion Core x3']
    },
    firstaid: {
        common: ['Stimpak x{x}', 'RadAway', 'Rad-X', 'Bandages x{x}', 'Purified water', 'Antiseptic'],
        uncommon: ['Stimpak x3', 'Med-X', 'Buffout', 'Doctor\'s bag (tools)', 'Snake Oil'],
        rare: ['Super stimpak', 'Day Tripper', 'Pre-war medical journal', 'Pristine Vault-Tec medkit'],
        legendary: ['Auto-Doc surgical kit', 'GECK seed pod', 'Experimental serum']
    },
    safe: {
        common: ['Pre-war money $${n}', '{n} caps', 'Wedding ring', 'Letters (personal)', 'Locket with photo'],
        uncommon: ['Bottle caps x{n}', 'Silver chain', 'Skill magazine', 'Holotape (mysterious)', 'Gold pocket watch'],
        rare: ['Mini-nuke', 'Plasma pistol', 'Unique key (asks "to what?")', 'Pre-war bond worth {n} caps if forged'],
        legendary: ['Cryolator', 'T-51b Power Armor schematic', 'Sealed Vault-Tec lottery ticket']
    },
    toolbox: {
        common: ['Wrench', 'Screwdrivers x2', 'Duct tape', 'Wonderglue', 'Hammer', 'Saw blade', 'Junk: gears, screws, circuits'],
        uncommon: ['Pipe wrench (weapon)', 'Soldering iron + flux', 'Welding torch (fuel low)', 'Tool magazine'],
        rare: ['Mr. Handy fuel', 'Repair kit (full)', 'Schematic: shishkebab'],
        legendary: ['Power armor repair kit', 'Pre-war Atomic-Powered drill (functional)']
    },
    desk: {
        common: ['Office stationery', 'Half-eaten lunch (rotten)', 'Holotape - office memo', 'Pen + clipboard', 'Pre-war calendar (1077)'],
        uncommon: ['Stash of caps {n}', 'Skill magazine', 'Personal letters revealing a secret', 'Half a bottle of vodka'],
        rare: ['Encrypted holotape - corporate', 'Pre-war passport', 'Vault-Tec experimental key'],
        legendary: ['Senior employee terminal password', 'Sealed orders from a Vault-Tec Overseer']
    },
    mailbox: {
        common: ['Junk mail', 'Pre-war bill', 'Faded postcard', 'Bottle cap (1)'],
        uncommon: ['Letter hinting at a hidden cache', 'Holotape postcard', 'Box of bullets x{a}'],
        rare: ['Pre-war bond bundle', 'Sealed orders from a missing General'],
        legendary: ['Letter from the dead, written today']
    },
    fridge: {
        common: ['Nuka-Cola x{x}', 'InstaMash', 'Pork n\' Beans', 'Squirrel stew (cold)', 'BlamCo Mac n\' Cheese'],
        uncommon: ['Nuka-Cola Quantum', 'Iguana on a stick', 'Cram x{x}', 'Sugar Bombs'],
        rare: ['Nuka-Cola Quartz', 'Mirelurk eggs (chilled)', 'Pre-war steak (somehow fresh?)'],
        legendary: ['Nuka-Cola Victory (mint sealed)', 'GECK starter kit']
    },
    brotherhood: {
        common: ['Laser pistol + 3 cells', 'Recon armor padding', 'Holotag chain', 'Power Armor service manual'],
        uncommon: ['Laser rifle + cells x{a}', 'T-45 helmet (functional)', 'Field scribe holotape'],
        rare: ['Plasma rifle', 'T-51b chest plate', 'Field repair drone'],
        legendary: ['X-01 Power Armor leg', 'Sentinel\'s laser saber', 'Encrypted Codex fragment']
    },
    vault: {
        common: ['Vault-Tec lunchbox', 'Pip-Boy 2000 (busted)', 'Vault jumpsuit (clean)', 'Vault water (purified)'],
        uncommon: ['Vault security baton', 'Vault dweller holotape', 'Vault-Tec branded BB gun'],
        rare: ['Pip-Boy 3000 (working)', 'Vault overseer\'s key', 'Experimental Vault drug'],
        legendary: ['Sealed Vault GECK', 'Overseer\'s journal (full experiment log)', 'Vault-Tec executive override card']
    },
    dumpster: {
        common: ['Tin can', 'Wonderglue', 'Pre-war money $${n}', 'Half-burned holotape', 'Broken doll', 'Dirty rag'],
        uncommon: ['Switchblade', 'Stash of {n} caps', 'Drug paraphernalia', 'Bloody bag'],
        rare: ['Severed hand wearing a Vault ring', 'Wrapped corpse with a clue'],
        legendary: ['Discarded Synth component (Institute traceable)']
    }
};

function fillLootText(text) {
    return text
        .replace('{n}', rand(50) + 10)
        .replace('{aa}', rand(40) + 20)
        .replace('{a}', rand(20) + 5)
        .replace('{x}', rand(5) + 1);
}

function generateLoot(type, tier) {
    if (type === 'random') type = pick(Object.keys(LOOT_TABLES));
    const tierMap = { 1: 'common', 2: 'uncommon', 3: 'rare', 4: 'legendary' };
    const table = LOOT_TABLES[type];
    const count = tier == 1 ? rand(3) + 1 : tier == 2 ? rand(2) + 2 : tier == 3 ? rand(2) + 2 : rand(2) + 3;

    const items = [];
    for (let i = 0; i < count; i++) {
        let category = 'common';
        const roll = Math.random();
        if (tier == 4) category = roll < 0.5 ? 'legendary' : (roll < 0.8 ? 'rare' : 'uncommon');
        else if (tier == 3) category = roll < 0.15 ? 'legendary' : (roll < 0.55 ? 'rare' : 'uncommon');
        else if (tier == 2) category = roll < 0.1 ? 'rare' : (roll < 0.5 ? 'uncommon' : 'common');
        else category = roll < 0.05 ? 'rare' : (roll < 0.25 ? 'uncommon' : 'common');
        const pool = table[category] || table.common;
        items.push(`[${category.toUpperCase().padEnd(9)}] ${fillLootText(pick(pool))}`);
    }
    return `&gt; CONTAINER: ${type.toUpperCase()} // TIER ${tier}\n&gt; SEARCHING...\n&gt; ${'='.repeat(46)}\n` + items.join('\n');
}

$('#gen-loot').addEventListener('click', () => {
    $('#loot-output').textContent = generateLoot($('#loot-type').value, parseInt($('#loot-tier').value));
});

// ============================================================
// ENCOUNTERS
// ============================================================
const CREATURES = {
    wasteland: ['Mole rats (3-5)', 'Bloatfly swarm', 'Yao Guai pair', 'Radroach swarm', 'Bloodbug pack', 'Stingwings (2-3)', 'Wild Brahmin'],
    city: ['Feral Ghoul horde (8+)', 'Synth patrol', 'Raider squad', 'Mister Gutsy', 'Protectron malfunctioning', 'Mirelurk on the move', 'Sentry Bot guarding ruin'],
    vault: ['Mole rats (infected)', 'Feral Ghoul reclaimed Vault Dweller', 'Rogue protectron security', 'Radroach swarm', 'Experiment subject (mutated)', 'Synth retention squad'],
    metro: ['Ghoul ambush from dark tunnel', 'Cave Cricket swarm', 'Mole Rat queen', 'Hollowed Tunnel Snake', 'Albino Radscorpion'],
    forest: ['Feral Ghoul Reaver', 'Glowing One', 'Yao Guai alpha', 'Hatchling Deathclaw (lone)', 'Mutant hounds (4)'],
    coast: ['Mirelurk hunters (3)', 'Mirelurk Queen (rare)', 'Bog-walking Anglers', 'Gulper pack', 'Fog Crawler'],
    desert: ['Cazadores swarm', 'Geckos', 'NCR patrol', 'Legion scouts', 'Bark scorpions', 'Lakelurks'],
    commonwealth: ['Synth Courser', 'Gunner patrol', 'Super Mutant Suicider', 'Mirelurk hunters', 'Children of Atom zealots'],
    capital: ['Enclave Vertibird patrol', 'Talon Company mercs', 'Super Mutant Brutes (2)', 'Brotherhood patrol', 'Yao Guai']
};

const EVENTS = [
    'A burning Vertibird crash-lands nearby — survivors are factional and hostile',
    'A trader pleads for a guard escort to the next settlement',
    'A child hides under a wrecked car, mute and clutching a Vault key',
    'A roaming preacher of Atom blocks the road, demanding tribute or worship',
    'A Mr. Handy butler greets the party as if pre-war, offering tea',
    'Distant nuclear lightning storm rolls in — Geiger ticks climb',
    'Slavers chain-marching a line of captives crosses the road',
    'A holotape from a passing dust-storm carries a desperate cry for help',
    'A wounded Brotherhood Knight in busted Power Armor offers loot for rescue',
    'A wandering bot insists the war is over and "everyone come home"',
    'A travelling caravan was just slaughtered — tracks lead two ways',
    'A radiated puddle conceals a glowing artifact worth several caps',
    'A swarm of bloodbugs erupts from a corpse mid-conversation',
    'Two raider gangs fight to the death — a third party can change the outcome'
];

function genEncounter(region, threat) {
    if (region === 'random') region = pick(Object.keys(CREATURES));
    const creature = pick(CREATURES[region]);
    const event = pick(EVENTS);
    const distance = pick(['30 meters', '60 meters', '15 meters (ambush!)', '80 meters', '100+ meters']);
    const time = pick(['Dawn', 'Midday', 'Dusk', 'Deep Night', 'Radstorm Twilight']);
    const weather = pick(['Clear', 'Rad-storm rolling in', 'Toxic fog', 'Light rain (slightly irradiated)', 'Dust cloud reducing visibility']);
    const threatLabel = ['LOW', 'MODERATE', 'SEVERE', 'DEATHCLAW-TIER'][threat - 1];

    return `&gt; LOCATION: ${region.toUpperCase()} // THREAT: ${threatLabel}
&gt; TIME OF DAY: ${time}
&gt; WEATHER:     ${weather}
&gt; DISTANCE:    ${distance}
&gt; ${'='.repeat(46)}
&gt; HOSTILE: ${creature}
&gt; EVENT:   ${event}
&gt; ${'='.repeat(46)}
&gt; SURPRISE ROLL (d20): ${rand(20)}
&gt; LOOT TIER: ${threat}`;
}

$('#gen-encounter').addEventListener('click', () => {
    $('#enc-output').textContent = genEncounter($('#enc-region').value, parseInt($('#enc-threat').value));
});

// ============================================================
// SETTLEMENTS & POIs
// ============================================================
const SETTLE_PREFIX = ['New', 'Old', 'Fort', 'Camp', 'Junktown', 'Megaton', 'Diamond', 'Goodneighbor', 'Hopeville', 'Sanctuary', 'Cinder', 'Salvage'];
const SETTLE_SUFFIX = ['Hollow', 'Hills', 'Springs', 'Junction', 'Crossing', 'Roost', 'Hill', 'Ridge', 'Reach', 'Refuge', 'Stand', 'Watch', 'Crater', 'Hub'];
const SETTLE_FEATURES = ['Brahmin pen at the gates', 'Single rusted water tower', 'A heavily reinforced wall of car doors', 'Pre-war billboard repurposed as a shrine', 'Open-air radio station broadcasting to the wastes', 'A working diner from before the war', 'A black market chem den in the back alley', 'Bottle cap mint operation', 'Mutated brahmin used as labor', 'Wandering preacher of Atom set up in the square'];
const SETTLE_PROBLEMS = ['Raider gang demands monthly tribute', 'Water purifier broken — desperate', 'Settlers vanishing one by one', 'Brahmin plague is spreading', 'Mayor is secretly a synth', 'Two families at the brink of civil war', 'A ghoul lives in the basement and no one\'s sure if it\'s feral yet', 'Vault-Tec sealed the basement with something inside', 'Children sneaking out to the ruins at night', 'A pre-war bunker just opened a half mile away'];
const SETTLE_LEADERS = ['Mayor Hennings, ex-Brotherhood deserter', 'Sheriff Marlowe, fast draw, slow tongue', 'Madam Quincey, runs the place from the saloon', 'Elder Brand, the only one who remembers pre-war', 'The Council of Three (all retired raiders)', 'A Mr. Handy with delusions of leadership', 'A Vault-Tec rep who never left'];

const POI_TYPES = ['Abandoned gas station', 'Pre-war drive-in theater', 'Collapsed parking garage', 'Crashed Vertibird', 'Sealed Vault entrance', 'Old elementary school', 'Crater filled with mutated plants', 'Drained reservoir with a shanty inside', 'Pre-war diner with skeletons still seated', 'Broken military checkpoint', 'Rusted nuclear submarine in dry dock', 'Pre-war hotel with intact lobby', 'Caved-in subway tunnel', 'Slaver auction ring on a rooftop', 'Children of Atom shrine in a glowing pit', 'Pre-war factory still partly running', 'Drug den in a wrecked tour bus'];
const POI_HOOKS = ['Holotape inside reveals a hidden cache nearby', 'Survivor inside, near death, begs to be saved', 'A trap was set here by someone watching now', 'Tracks of a Deathclaw lead in and not out', 'A working terminal contains an unsent message', 'Glowing ghouls are dormant — and waking', 'Faction patrol arrives in 1d4 hours', 'Spent fusion core hums faintly, perhaps salvageable'];

$('#gen-settlement').addEventListener('click', () => {
    const name = pick(SETTLE_PREFIX) + ' ' + pick(SETTLE_SUFFIX);
    const pop = rand(140) + 12;
    const feats = pickN(SETTLE_FEATURES, 3);
    const prob = pick(SETTLE_PROBLEMS);
    const leader = pick(SETTLE_LEADERS);
    const def = pick(['Lightly armed militia', 'Hired mercenaries', 'Two homemade turrets', 'A Mr. Gutsy gone feral but loyal', 'A whole damn Sentry Bot in the square']);
    $('#settlement-output').textContent =
        `&gt; SETTLEMENT NAME:  ${name}\n` +
        `&gt; POPULATION:       ${pop}\n` +
        `&gt; LEADER:           ${leader}\n` +
        `&gt; DEFENSES:         ${def}\n` +
        `&gt; ${'='.repeat(46)}\n` +
        `&gt; NOTABLE FEATURES:\n` +
        feats.map(f => `&gt;   - ${f}`).join('\n') + '\n' +
        `&gt; ${'='.repeat(46)}\n` +
        `&gt; CURRENT PROBLEM:  ${prob}`;
});

$('#gen-poi').addEventListener('click', () => {
    const type = pick(POI_TYPES);
    const hook = pick(POI_HOOKS);
    const loot = ['Tier I', 'Tier II', 'Tier III', 'Tier IV'][rand(4) - 1];
    const danger = rand(20);
    $('#settlement-output').textContent =
        `&gt; POINT OF INTEREST\n` +
        `&gt; ${'='.repeat(46)}\n` +
        `&gt; SITE:    ${type}\n` +
        `&gt; HOOK:    ${hook}\n` +
        `&gt; LOOT:    ${loot}\n` +
        `&gt; THREAT:  d20 = ${danger} (${danger < 6 ? 'Trivial' : danger < 12 ? 'Moderate' : danger < 17 ? 'Dangerous' : 'Lethal'})`;
});

// ============================================================
// QUEST HOOKS
// ============================================================
const QUEST_HOOKS = {
    rescue: [
        'A child\'s holotape washes ashore — they were taken by slavers heading west.',
        'A Brotherhood Knight is trapped in a sealed Vault and her squad has gone silent.',
        'A merchant\'s entire caravan was taken — but he can only afford to pay in promises.',
        'A ghoul mother begs the party to find her smoothskin daughter, kidnapped by Children of Atom.'
    ],
    combat: [
        'A raider warlord has declared a bounty on the local sheriff and his deputies — open season starts at dusk.',
        'A Behemoth has wandered into a populated area and is curiously, dangerously calm.',
        'Two NCR patrols have not returned from the desert in 3 days. Their last fix was in Legion territory.',
        'A pack of Cazadores has nested in the town water supply. Removing them will be hell.'
    ],
    mystery: [
        'Every night at 3:47 AM, a single radio broadcast plays the same nursery rhyme. No transmitter has been found.',
        'Settlers wake covered in bruises with no memory. The traveling Mr. Handy is acting strangely.',
        'A pre-war photograph keeps appearing in the players\' pockets, regardless of who picks it up.',
        'Bodies in the wasteland have begun standing upright, not feral, not alive, simply waiting.'
    ],
    moral: [
        'A Vault-Tec experiment is still running — the inhabitants don\'t know. Should they be told? Released? Spared?',
        'A captured raider is, in fact, a settler\'s long-lost brother. The settler wants vengeance regardless.',
        'A Brotherhood patrol asks the party to surrender a synth they\'ve grown to trust.',
        'A child of Atom offers the party a glowing artifact — if they pledge their unborn child to the Glow.'
    ],
    exploration: [
        'A holotape map points to a Pre-War CIA blacksite no one believes exists.',
        'A wandering trader sells, for a single cap, a key labeled only "VAULT 13 — DO NOT RETURN".',
        'A radioactive forest is regrowing in odd geometric patterns. Something is shaping it.',
        'A long-dead road sign has been freshly repainted to point in a direction that wasn\'t on any pre-war map.'
    ],
    faction: [
        'The NCR and Brotherhood both want the players to deliver the same package — to different people.',
        'An Enclave defector wants to give intel — but only to a party that\'ll burn its bridges to do it.',
        'The Institute has offered to "improve" the local water supply. The Railroad has issued a quiet warning.',
        'Caesar\'s Legion has crucified a town\'s mayor. The town has now invited the players to dinner.'
    ],
    horror: [
        'A miner\'s settlement has gone silent. The doors are locked from the inside. The shafts hum.',
        'A pre-war clown statue greets you by your true names — names you have not used in years.',
        'Children whisper that the well "talks back now" — and offers gifts you\'ll regret accepting.',
        'A glowing one is being kept docile by a Vault-Tec recording on infinite loop. Stopping it will not be quiet.'
    ]
};

function genHook(tone) {
    if (tone === 'random') tone = pick(Object.keys(QUEST_HOOKS));
    const hook = pick(QUEST_HOOKS[tone]);
    const reward = pick(['200 caps + a strange holotape', '1 fusion core + faction favor', 'A pre-war family heirloom', 'Information they need badly', 'A working Pip-Boy 2000', 'A clean Vault jumpsuit (intact)', 'Mini-nuke + 50 caps', 'A weapon mod schematic', 'A safe house in the city']);
    const twist = pick(['The contact is already dead by the time you arrive.', 'The reward was looted from someone the players cared about.', 'A rival faction is also racing for the same prize.', 'The objective is sentient and has its own opinions.', 'The whole job was a Vault-Tec social experiment.', 'It was much, much worse than the rumor implied.', 'A child is involved. The players will not be able to walk away clean.']);
    return `&gt; TONE:    ${tone.toUpperCase()}\n&gt; HOOK:    ${hook}\n&gt; TWIST:   ${twist}\n&gt; REWARD:  ${reward}\n&gt; ${'='.repeat(46)}`;
}

$('#gen-quest').addEventListener('click', () => {
    $('#quest-output').textContent = genHook($('#quest-tone').value);
});
$('#gen-quest-three').addEventListener('click', () => {
    $('#quest-output').textContent = [genHook($('#quest-tone').value), genHook($('#quest-tone').value), genHook($('#quest-tone').value)].join('\n\n');
});

// ============================================================
// CHARACTER STATUS / CONDITIONS
// ============================================================
let characters = JSON.parse(localStorage.getItem('fallout-chars') || '[]');
const CONDITIONS = ['Crippled Arm', 'Crippled Leg', 'Bleeding', 'Radiated', 'Addicted', 'Poisoned', 'Concussed', 'Burned', 'Frozen', 'Charmed'];

function saveChars() { localStorage.setItem('fallout-chars', JSON.stringify(characters)); }

function renderChars() {
    const list = $('#character-list');
    list.innerHTML = '';
    characters.forEach((c, i) => {
        const hpPct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
        const apPct = Math.max(0, Math.min(100, (c.ap / c.maxAp) * 100));
        const radPct = Math.max(0, Math.min(100, (c.rad / 1000) * 100));
        const card = document.createElement('div');
        card.className = 'char-card';
        card.innerHTML = `
            <h4>${c.name} <button class="icon-btn danger" data-i="${i}" data-act="del">REMOVE</button></h4>
            <div class="stat-bar">
                <label>HP</label>
                <div class="bar"><div class="bar-fill ${hpPct < 30 ? 'low' : ''}" style="width:${hpPct}%"></div></div>
                <input type="number" value="${c.hp}" data-i="${i}" data-field="hp"> / <input type="number" value="${c.maxHp}" data-i="${i}" data-field="maxHp">
            </div>
            <div class="stat-bar">
                <label>AP</label>
                <div class="bar"><div class="bar-fill" style="width:${apPct}%; background: #00b3ff"></div></div>
                <input type="number" value="${c.ap}" data-i="${i}" data-field="ap"> / <input type="number" value="${c.maxAp}" data-i="${i}" data-field="maxAp">
            </div>
            <div class="stat-bar">
                <label>RADS</label>
                <div class="bar"><div class="bar-fill rad" style="width:${radPct}%"></div></div>
                <input type="number" value="${c.rad}" data-i="${i}" data-field="rad"> / 1000
            </div>
            <div class="stat-bar">
                <label>CAPS</label>
                <input type="number" value="${c.caps}" data-i="${i}" data-field="caps" style="width:90px">
            </div>
            <div class="conditions">
                Conditions: ${c.conditions.length ? c.conditions.join(', ') : 'None'}
                <br>
                <button class="icon-btn" data-i="${i}" data-act="addcond">+ Condition</button>
                <button class="icon-btn" data-i="${i}" data-act="clearcond">Clear All</button>
            </div>
        `;
        list.appendChild(card);
    });

    list.querySelectorAll('input[data-field]').forEach(inp => {
        inp.addEventListener('change', (e) => {
            characters[parseInt(e.target.dataset.i)][e.target.dataset.field] = parseInt(e.target.value) || 0;
            saveChars(); renderChars();
        });
    });
    list.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.i);
            if (btn.dataset.act === 'del') {
                if (confirm('Remove character?')) { characters.splice(i, 1); saveChars(); renderChars(); }
            } else if (btn.dataset.act === 'addcond') {
                const cond = prompt('Condition (or pick: ' + CONDITIONS.join(', ') + ')');
                if (cond) { characters[i].conditions.push(cond); saveChars(); renderChars(); }
            } else if (btn.dataset.act === 'clearcond') {
                characters[i].conditions = []; saveChars(); renderChars();
            }
        });
    });
}

$('#add-character').addEventListener('click', () => {
    const name = $('#cond-name').value.trim();
    if (!name) return;
    characters.push({ name, hp: 100, maxHp: 100, ap: 60, maxAp: 60, rad: 0, caps: 50, conditions: [] });
    $('#cond-name').value = '';
    saveChars(); renderChars();
});

renderChars();

// ============================================================
// SESSION NOTES
// ============================================================
let notes = JSON.parse(localStorage.getItem('fallout-notes') || '[]');

function saveNotes() { localStorage.setItem('fallout-notes', JSON.stringify(notes)); }

function renderNotes() {
    const list = $('#notes-list');
    list.innerHTML = '';
    notes.forEach((n, i) => {
        const div = document.createElement('div');
        div.className = 'note-entry';
        div.innerHTML = `
            <h4>${n.title} <span class="timestamp">${n.time} <button class="icon-btn danger" data-i="${i}">✕</button></span></h4>
            <p>${n.body.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`;
        list.appendChild(div);
    });
    list.querySelectorAll('.icon-btn.danger').forEach(btn => {
        btn.addEventListener('click', () => {
            notes.splice(parseInt(btn.dataset.i), 1);
            saveNotes(); renderNotes();
        });
    });
}

$('#add-note').addEventListener('click', () => {
    const title = $('#note-title').value.trim() || 'Untitled Entry';
    const body = $('#note-body').value.trim();
    if (!body) return;
    notes.unshift({ title, body, time: new Date().toLocaleString() });
    $('#note-title').value = ''; $('#note-body').value = '';
    saveNotes(); renderNotes();
});

$('#export-notes').addEventListener('click', () => {
    const text = notes.map(n => `=== ${n.title} (${n.time}) ===\n${n.body}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fallout-dm-log-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
});

$('#clear-notes').addEventListener('click', () => {
    if (confirm('PURGE all notes? Cannot be undone.')) {
        notes = []; saveNotes(); renderNotes();
    }
});

renderNotes();

// ============================================================
// HERO IMAGE PROMPTS
// ============================================================
const HERO_TEMPLATES = {
    archetypes: [
        'a grizzled Vault Dweller in a torn blue-and-yellow Vault 111 jumpsuit',
        'a stoic Brotherhood of Steel Paladin in scratched T-60 power armor',
        'a charismatic ghoul gunslinger in a long duster and cowboy hat',
        'a hulking Super Mutant with patched-together armor and a steel sledgehammer',
        'a sharp-eyed NCR Ranger in patched riot armor and a duster',
        'a Caesar\'s Legion centurion in plumed helmet and salvaged football pads',
        'a quick-fingered Wasteland scavenger in mismatched leather and goggles',
        'a wide-eyed Vault-Tec scientist in a stained lab coat carrying a working Pip-Boy 3000',
        'a Children of Atom zealot in glowing rags, eyes radiated bright green',
        'an Institute Courser in a sleek black coat, calm and inhuman'
    ],
    actions: [
        'standing on a hill overlooking a ruined city skyline at sunset',
        'kneeling beside a campfire with a Mr. Handy hovering nearby',
        'aiming a laser rifle down a fog-choked metro tunnel',
        'walking away from a burning Vertibird, untouched, with a 10mm pistol drawn',
        'hauling salvage past a half-buried Statue of Liberty',
        'crouched behind a rusted car as a Deathclaw roars in the distance',
        'sharing a Nuka-Cola Quantum with a battered Mister Handy',
        'sitting cross-legged on top of a working Sentry Bot, dust storm rising',
        'climbing a cracked highway overpass beneath a green sky',
        'staring up at a mushroom cloud frozen in the distance'
    ],
    settings: [
        'in the irradiated ruins of post-nuclear Boston',
        'inside a Vault corridor lit only by red emergency lights',
        'on a Mojave salt flat at high noon',
        'in a glowing forest with twisted, luminescent trees',
        'on the shattered streets of the Capital Wasteland',
        'inside the rusted hull of a beached pre-war aircraft carrier',
        'in a flickering pre-war diner overgrown with vines',
        'at the edge of the Glowing Sea with green storm clouds',
        'on a windswept dust-blown overpass',
        'inside a half-collapsed parking garage strewn with skeletons'
    ],
    styles: [
        'in the style of 1950s atomic-age pulp poster art, dramatic lighting, retrofuturistic, hand-painted feel',
        'cinematic key art, dramatic chiaroscuro, photoreal CG render, Bethesda Game Studios style',
        'hand-painted oil concept art, muted post-apocalyptic palette, soft grain, NCR propaganda poster aesthetic',
        'gritty graphic novel ink wash, hard shadows, sepia tone with a single splash of radioactive green',
        'detailed digital matte painting, golden hour, dust motes, painterly atmosphere',
        'Pip-Boy CRT phosphor green vector silhouette, terminal-screen aesthetic, scanlines'
    ]
};

function makeHeroPrompt() {
    const arche = pick(HERO_TEMPLATES.archetypes);
    const action = pick(HERO_TEMPLATES.actions);
    const setting = pick(HERO_TEMPLATES.settings);
    const style = pick(HERO_TEMPLATES.styles);
    return `${arche}, ${action}, ${setting}. ${style}. Atmospheric, cinematic composition, post-apocalyptic Fallout vibe, rule of thirds, dramatic depth of field.`;
}

$('#gen-hero-prompt').addEventListener('click', () => {
    $('#hero-output').textContent = '&gt; PROMPT GENERATED:\n\n' + makeHeroPrompt();
});

$('#gen-hero-all').addEventListener('click', () => {
    const prompts = [];
    for (let i = 0; i < 8; i++) prompts.push(`[${i + 1}] ${makeHeroPrompt()}`);
    $('#hero-output').textContent = prompts.join('\n\n');
});

$('#copy-all-prompts').addEventListener('click', async () => {
    const text = $('#hero-output').textContent;
    try {
        await navigator.clipboard.writeText(text);
        const orig = $('#copy-all-prompts').textContent;
        $('#copy-all-prompts').textContent = 'COPIED ✓';
        setTimeout(() => { $('#copy-all-prompts').textContent = orig; }, 1400);
    } catch (e) { alert('Copy failed: ' + e.message); }
});

// CURATED PROMPTS — ready-to-use hero art prompts
const CURATED_HERO_PROMPTS = [
    {
        title: 'Title Banner — Wasteland Vista',
        text: 'A panoramic wide-angle vista of a post-nuclear American wasteland at golden hour: rusted gas stations, the shattered silhouette of a city skyline, a single power-armored figure walking down a cracked highway toward the viewer, brahmin grazing in the foreground. Dust motes in shafts of light. Painted 1950s atomic-age propaganda poster style, retrofuturistic, hand-painted feel, ultrawide cinematic banner composition. No text.'
    },
    {
        title: 'Hero Portrait — The Vault Dweller',
        text: 'Close-up character portrait of a determined Vault 111 dweller, blue-and-yellow jumpsuit torn at the shoulder, a working Pip-Boy 3000 on the left wrist glowing soft amber, a 10mm pistol holstered, smudge of soot on the cheek. Cinematic key art lighting, neutral grey ruined backdrop, photoreal CG render, Bethesda Game Studios style. Square 1:1 composition.'
    },
    {
        title: 'Hero Portrait — Brotherhood Paladin',
        text: 'A scratched and battle-worn T-60 power armor paladin standing tall in a dust storm, the Brotherhood of Steel cog-and-sword emblem chipped on the chestplate, glowing red optics in the helmet, a laser rifle held low and ready. Cinematic dramatic side-lighting, hand-painted oil concept art, muted post-apocalyptic palette, soft grain.'
    },
    {
        title: 'Hero Portrait — Ghoul Gunslinger',
        text: 'A weathered ghoul gunslinger in a long dust-blown duster and battered cowboy hat, glowing eyes, leathery cracked skin, holding a customized hunting revolver low at his hip, standing in front of a ruined Nuka-Cola sign. Cinematic chiaroscuro, retrofuturistic 1950s pulp poster aesthetic, dramatic hard shadows.'
    },
    {
        title: 'Hero Portrait — NCR Ranger',
        text: 'A lone NCR Ranger in iconic riot armor and trenchcoat, antique gas mask up to reveal a sun-weathered face, lever-action rifle slung over the shoulder, standing in a Mojave salt flat at high noon, sun bleaching the scene. Hand-painted propaganda poster style, dramatic backlighting, painterly grain.'
    },
    {
        title: 'Hero Portrait — Super Mutant Champion',
        text: 'A hulking Super Mutant warrior, deep green muscled skin, patched salvage armor of street signs and tire rubber, a homemade sledgehammer made from a fire hydrant, standing protectively in front of a tiny scared human child. Cinematic key art, dramatic warm orange backlight from a burning building, dust in the air.'
    },
    {
        title: 'Hero Portrait — Children of Atom Zealot',
        text: 'A robed Children of Atom zealot, eyes glowing radiation-green, skin softly luminescent, raising a Nuka-Cola Quantum bottle like a holy chalice in front of a swirling Glowing Sea storm. Painted concept art, sickly green palette, dramatic god-rays, painterly atmosphere, horror-tinged Fallout aesthetic.'
    },
    {
        title: 'Hero Portrait — Institute Courser',
        text: 'A pale, eerily calm Institute Courser in a sleek black synth-coat, glowing blue Institute pistol drawn, hood up, ruined urban Boston setting behind, eyes catching the light unnaturally. Cinematic moody cyan-and-amber palette, photoreal CG render, sharp focus, cold atmosphere.'
    },
    {
        title: 'Hero Portrait — Raider Warlord',
        text: 'A snarling raider warlord with a painted skull face mask, salvaged football pads and metal scrap armor, a chainsaw-arm "Ripper" weapon revving, standing on a throne of car doors and traffic signs, fires burning behind. Gritty graphic novel ink wash, hard shadows, sepia palette with a single splash of orange firelight.'
    },
    {
        title: 'Hero Portrait — Caravan Trader',
        text: 'A weathered caravan trader leading a brahmin packed with crates and salvage, lever-action rifle across the back, fingerless gloves and a wide-brim hat, walking along a cracked desert road at dusk. Painted concept art, warm sunset palette, propaganda poster composition, painterly atmosphere.'
    },
    {
        title: 'Splash Art — V.A.T.S. Combat',
        text: 'Stylized action splash: the camera frozen mid-V.A.T.S. as a wasteland hero takes aim, semi-transparent green Pip-Boy HUD overlay showing percentage-to-hit reticles on targets, sparks frozen in air, slowed time effect. Pip-Boy CRT phosphor green color treatment, scanlines, retrofuturistic UI elements.'
    },
    {
        title: 'Splash Art — Deathclaw Encounter',
        text: 'A massive Deathclaw rearing in a burning city ruin, claws raised, glowing red eyes, party of four wasteland survivors silhouetted in the foreground bracing for the charge, a Vertibird crashed in the background. Cinematic horror key art, dramatic firelight, photoreal CG render, full-spread banner composition.'
    }
];

function renderCuratedPrompts() {
    const grid = $('#curated-prompts');
    grid.innerHTML = '';
    CURATED_HERO_PROMPTS.forEach((p) => {
        const div = document.createElement('div');
        div.className = 'prompt-card';
        div.innerHTML = `
            <h4>&gt; ${p.title}</h4>
            <p>${p.text}</p>
            <button class="copy-btn">COPY PROMPT</button>`;
        div.querySelector('.copy-btn').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(p.text);
                const btn = div.querySelector('.copy-btn');
                btn.textContent = 'COPIED ✓';
                setTimeout(() => { btn.textContent = 'COPY PROMPT'; }, 1400);
            } catch (e) { alert('Copy failed: ' + e.message); }
        });
        grid.appendChild(div);
    });
}

renderCuratedPrompts();

// Boot greeting
console.log('%c> VAULT-TEC OVERSEER TERMINAL ONLINE', 'color: #38ff7a; font-family: monospace; font-size: 16px');
console.log('%c> ALL SYSTEMS NOMINAL', 'color: #38ff7a; font-family: monospace');
