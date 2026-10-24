// OPERATIONS: the replayable campaign. Seven theatres of eight missions each, a service level,
// an armory, a squad you recruit from supply crates, and daily orders. Every mission played anywhere
// in the game (story, training, operations) pays XP and supplies, so both modes feed each other.
const OPS = (() => {
  const $ = id => document.getElementById(id);
  const KEY = 'sss_ops_v1';
  const def = () => ({ sup: 60, xp: 0, lvl: 1, gear: {}, cards: {}, buddy: null, prog: {}, crates: { field: 1, gold: 0 }, orders: { day: '', list: [], bonus: false }, stand: 0, intro: {}, cleared: {}, opened: 0 });
  let O = def();
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) O = Object.assign(def(), s, { crates: Object.assign(def().crates, s.crates || {}), orders: Object.assign(def().orders, s.orders || {}) }); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) {} };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rndI = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // ---------------- armory ----------------
  const GEAR = [
    { id: 'rifle', ic: '⌖', n: 'Service Rifle', tiers: ['Issue rifle', 'Tuned rifle', 'Red-dot sight', 'Marksman rifle', 'Special forces rifle', 'Legend rifle'], d: lv => `+${lv * 4}% hit chance, +${lv * 4} rounds per magazine, tighter door-gun spread.`, base: 70 },
    { id: 'armour', ic: '⛨', n: 'Body Armour', tiers: ['Combat shirt', 'Flak vest', 'Ceramic plates', 'Level IV vest', 'Assault armour', 'Ghazi armour'], d: lv => `+${lv * 15} health in assaults, tanks, gunships and posts.`, base: 70 },
    { id: 'scope', ic: '◎', n: 'Optics', tiers: ['Iron sights', '4x scope', '8x scope', 'Stabilised scope', 'Thermal scope', 'Hawk-eye scope'], d: lv => `${lv * 10}% steadier sniper scope, longer tank aim line, cooler door gun.`, base: 60 },
    { id: 'grenades', ic: '✹', n: 'Grenade Pouch', tiers: ['No pouch', '1 extra grenade', '2 extra', '3 extra', '4 extra', '5 extra'], d: lv => `+${lv} grenade${lv === 1 ? '' : 's'} in assaults, +${Math.floor(lv / 2)} airstrike${Math.floor(lv / 2) === 1 ? '' : 's'} on the post.`, base: 55 },
    { id: 'boots', ic: '▲', n: 'Para Boots', tiers: ['Drill boots', 'Desert boots', 'Para boots', 'Mountain boots', 'Commando boots', 'Cheetah boots'], d: lv => `+${lv * 6}% move speed, sharper steering on HALO jumps.`, base: 45 },
    { id: 'medkit', ic: '✚', n: 'Field Medkit', tiers: ['Bandage', 'First-aid kit', 'Combat kit', 'Medic bag', 'Surgeon kit', 'Field hospital'], d: lv => `Medkits heal +${lv * 8} more, the post repairs +${lv * 8} between waves.`, base: 55 },
  ];
  const gearLv = id => O.gear[id] || 0;
  const gearCost = (id, lv) => Math.round(GEAR.find(g => g.id === id).base * [1, 2.2, 3.8, 6, 9][lv]);

  // ---------------- squad ----------------
  const RAR = [{ n: 'Common', c: '#9aa58e' }, { n: 'Rare', c: '#4aa3e0' }, { n: 'Epic', c: '#b06ae6' }, { n: 'Legendary', c: '#f0b43a' }];
  const SQ = [
    { id: 'gul', n: 'Sepoy Gul Zaman', role: 'Rifleman', rar: 0, key: 'hit', val: .012, npc: 'gul' },
    { id: 'bashir', n: 'Lance Naik Bashir', role: 'Medic', rar: 0, key: 'med', val: 3, look: { outfit: 'combat', rank: 0, hat: 'helmet', moustache: true, skin: '#c38c60', age: 26 } },
    { id: 'arif', n: 'Sepoy Arif', role: 'Grenadier', rar: 0, key: 'gren', val: .25, look: { outfit: 'combat', rank: 0, hat: 'beret', beretC: '#1f2a1c', skin: '#9e6c46', age: 22 } },
    { id: 'sherzaman', n: 'Naik Sher Zaman', role: 'Scout', rar: 0, key: 'speed', val: .015, look: { outfit: 'combat', rank: 0, hat: 'wrap', wrapC: '#5a5444', beard: 'stubble', skin: '#b07a52', age: 30 } },
    { id: 'pervez', n: 'Sepoy Pervez', role: 'Signaller', rar: 0, key: 'time', val: 3, look: { outfit: 'combat', rank: 0, hat: 'helmet', glasses: true, skin: '#d4a07a', age: 24 } },
    { id: 'ilyas', n: 'Havildar Ilyas', role: 'Marksman', rar: 0, key: 'steady', val: .02, look: { outfit: 'combat', rank: 0, hat: 'beret', beretC: '#1f2a1c', moustache: true, gray: .2, skin: '#c99468', age: 34 } },
    { id: 'rasool', n: 'Havildar Ghulam Rasool', role: 'Machine Gunner', rar: 1, key: 'hit', val: .02, look: { outfit: 'combat', rank: 0, hat: 'helmet', moustache: true, beard: 'full', skin: '#a8754e', age: 38 } },
    { id: 'akram', n: 'Naib Subedar Akram', role: 'Sniper', rar: 1, key: 'steady', val: .035, look: { outfit: 'ssg', rank: 0, hat: 'beret', beretC: '#6e1526', moustache: true, skin: '#b58058', age: 36 } },
    { id: 'raja', n: 'Subedar Raja', role: 'Veteran', rar: 1, key: 'hp', val: 5, look: { outfit: 'combat', rank: 0, hat: 'beret', beretC: '#1f2a1c', moustache: true, gray: .55, skin: '#c38c60', age: 46, medals: ['#0b6b3a', '#c9a227'] } },
    { id: 'sana', n: 'Captain Sana', role: 'Intelligence', rar: 1, key: 'xp', val: .04, look: { outfit: 'combat', female: true, rank: 4, hat: 'beret', beretC: '#1f2a1c', hair: '#1a1410', skin: '#e0b48c', age: 29 } },
    { id: 'cheetah', n: 'Major Tariq "Cheetah"', role: 'SSG Commando', rar: 2, key: 'hit', val: .03, look: { outfit: 'ssg', rank: 5, hat: 'beret', beretC: '#6e1526', moustache: true, scar: true, skin: '#b07a52', age: 35, medals: ['#b3201e', '#0b6b3a'] } },
    { id: 'zoya', n: 'Captain Zoya', role: 'Field Surgeon', rar: 2, key: 'med', val: 7, look: { outfit: 'doctor', female: true, hair: '#1d140e', skin: '#e2b48e', age: 31, glasses: true } },
    { id: 'bahadur', n: 'Subedar Major Khan Bahadur', role: 'Iron Sergeant', rar: 2, key: 'hp', val: 9, look: { outfit: 'combat', rank: 0, hat: 'beret', beretC: '#1f2a1c', moustache: true, beard: 'full', gray: .7, skin: '#a8754e', age: 52, medals: ['#0b6b3a', '#c9a227', '#b3201e'] } },
    { id: 'nida', n: 'Major Nida', role: 'Commander', rar: 3, key: 'steady', val: .06, npc: 'nida' },
    { id: 'sherkhan', n: 'Havildar Sher Khan', role: 'Mountain Legend', rar: 3, key: 'hp', val: 14, npc: 'sherkhan' },
    { id: 'saeed', n: 'Captain Saeed', role: 'Quartermaster', rar: 3, key: 'sup', val: .06, npc: 'saeed' },
  ];
  const sqById = Object.fromEntries(SQ.map(c => [c.id, c]));
  const npcOf = c => c.npc || 'sq_' + c.id;
  function regNpcs() { window.NPCS = window.NPCS || {}; SQ.forEach(c => { if (!c.npc) window.NPCS['sq_' + c.id] = { name: c.n, look: c.look }; }); }
  const copies = id => (O.cards[id] || 0);
  const cardLv = id => { const n = copies(id); return n >= 11 ? 5 : n >= 7 ? 4 : n >= 4 ? 3 : n >= 2 ? 2 : n >= 1 ? 1 : 0; };
  const nextAt = lv => [1, 2, 4, 7, 11][lv] ?? null;
  const KEYNAME = { hit: 'hit chance', med: 'healing', gren: 'grenades', speed: 'speed', time: 'seconds on puzzles', steady: 'steadiness', hp: 'health', xp: 'XP', sup: 'supplies' };
  const fmtBonus = (key, v) => ['hit', 'speed', 'steady', 'xp', 'sup'].includes(key) ? `+${Math.round(v * 100)}% ${KEYNAME[key]}` : key === 'gren' ? `+${v.toFixed(2).replace(/\.?0+$/, '')} ${KEYNAME[key]}` : `+${Math.round(v)} ${KEYNAME[key]}`;

  function bonus(k) {
    let v = 0;
    const g = gearLv;
    if (k === 'hit') v += g('rifle') * .04;
    if (k === 'mag') v += g('rifle') * 4;
    if (k === 'hp') v += g('armour') * 15;
    if (k === 'steady') v += g('scope') * .1;
    if (k === 'gren') v += g('grenades');
    if (k === 'speed') v += g('boots') * .06;
    if (k === 'med') v += g('medkit') * 8;
    SQ.forEach(c => { if (c.key === k) v += c.val * cardLv(c.id); });
    if (k === 'steady') v = Math.min(.7, v);
    return v;
  }
  function buddy() { const c = O.buddy && sqById[O.buddy]; if (!c || !cardLv(c.id)) return null; return { id: c.id, name: c.n, rate: [2.4, 1.9, 1.5, 1.1][c.rar] - cardLv(c.id) * .08 }; }

  // ---------------- campaign ----------------
  const m = (type, n, o = {}) => ({ type, n, o });
  const THEATRES = [
    { id: 'kakul', n: 'Kakul', sub: 'The Making of an Officer', scene: 'pma', gate: 0, briefer: 'cmdt', boss: { n: 'Directing Staff', look: { outfit: 'combat', rank: 6, hat: 'beret', beretC: '#1a1a1a', moustache: true, gray: .5, skin: '#c99468', age: 45 } },
      lines: ['Gentleman cadet, the Army does not care where you came from. It cares what you do in the next eight tests.', 'Pass all eight and the Directing Staff will try to break you on the final exercise.', 'Final exercise. Clear the compound before dawn. The Directing Staff are playing the enemy, and they never lose.', 'The Directing Staff shake your hand. The Commandant writes one word in your file: officer.'],
      missions: [m('shoot', 'First Range', { diff: 1, need: 8, total: 12 }), m('obstacle', 'Assault Course', { count: 6, diff: 1 }), m('para', 'Jump Wings', { diff: 1, scene: 'pma' }), m('fight', 'Boxing Night', { foe: 'Senior Fawad', diff: 1, scene: 'ring', foeColor: '#a02020', pColor: '#1f3fa0', pBeret: null }), m('memory', 'Night Navigation', { rounds: 3, start: 4 }), m('tank', 'Armour Demonstration', { enemies: 1, diff: 1, scene: 'pma', wind: 0 }), m('defend', 'Mock Defence', { waves: 2, diff: 1, scene: 'forest_night' }), m('assault', 'Passing-Out Exercise', { scene: 'forest_night', enemies: 5, hostages: 1, length: 8, diff: 1, boss: true, bossName: 'Directing Staff', seed: 2 })] },
    { id: 'siachen', n: 'Siachen', sub: 'War at 20,000 Feet', scene: 'snowpost', gate: 8, briefer: 'sherkhan', boss: { n: 'Ridge Commander', look: { outfit: 'black', hat: 'wrap', wrapC: '#d8d2c0', beard: 'full', skin: '#c99468', scar: true, age: 44 } },
      lines: ['Up here the cold kills more men than bullets, sahib. Keep moving, keep your gloves on, and trust the rope.', 'Every post on this glacier is held by a handful of men. Lose one and the whole ridge falls.', 'The enemy has taken the saddle on Saltoro Ridge. Their commander knows this ice better than anyone. Take it back.', 'The saddle is ours again. Sher Khan plants the flag in the snow and says nothing for a long time.'],
      missions: [m('sniper', 'Ridge Watch', { diff: 2, scene: 'snowpost' }), m('defend', 'Bana Post', { waves: 3, diff: 2, scene: 'snowpost' }), m('para', 'Supply Drop', { diff: 2, scene: 'snowpost' }), m('heli', 'Glacier Run', { need: 10, time: 40, diff: 2, scene: 'snowpost', earth: 'rgba(222,228,234,.85)' }), m('obstacle', 'Crevasse Field', { count: 8, diff: 2 }), m('shoot', 'Whiteout Range', { diff: 2, need: 12, total: 17 }), m('defend', 'Night Attack', { waves: 4, diff: 2, scene: 'mountain_night' }), m('assault', 'Saltoro Ridge', { scene: 'mountain_night', enemies: 7, hostages: 1, length: 10, diff: 2, boss: true, bossName: 'Ridge Commander', seed: 5 })] },
    { id: 'loc', n: 'Line of Control', sub: 'The Long Border', scene: 'valley', gate: 22, briefer: 'co', boss: { n: 'Camp Commander', look: { outfit: 'black', hat: 'wrap', wrapC: '#2a2420', beard: 'full', mask: '#2a2420', skin: '#b58058', age: 40 } },
      lines: ['Shelling every night, infiltration every week. The villages behind us are counting on this line.', 'Their armour is massing below Hill 702. Their snipers are already in the orchards.', 'We have found the launch pad. The man who sends the infiltrators is there tonight. Bring back the hostages.', 'The launch pad is silent. In the village, a mosque loudspeaker announces that the children can go back to school.'],
      missions: [m('tank', 'Border Armour', { enemies: 2, diff: 2, scene: 'valley' }), m('memory', 'Minefield Route', { rounds: 4, start: 5 }), m('sniper', 'Orchard Sniper', { diff: 3, scene: 'valley' }), m('heli', 'Convoy Escort', { need: 12, time: 45, diff: 3, scene: 'valley' }), m('defuse', 'Bridge Charge', { time: 50 }), m('defend', 'Forward Post', { waves: 4, diff: 3, scene: 'valley' }), m('tank', 'Hill 702', { enemies: 3, diff: 3, scene: 'valley', hilly: 1.4 }), m('assault', 'Launch Pad Raid', { scene: 'valley', enemies: 8, hostages: 2, length: 11, diff: 3, boss: true, bossName: 'Camp Commander', seed: 11 })] },
    { id: 'frontier', n: 'The Frontier', sub: 'Mountains of Fire', scene: 'cherat', gate: 38, briefer: 'nida', boss: { n: 'The Emir', look: { outfit: 'black', hat: 'wrap', wrapC: '#1a1714', beard: 'full', gray: .4, skin: '#b07a52', age: 50, glasses: false } },
      lines: ['These valleys have swallowed armies for a thousand years. We are not here to be swallowed.', 'The Emir runs his war from caves no map shows. Every compound we clear brings us one ridge closer.', 'The cave complex. He is inside with hostages and fifty fighters. SSG goes in first. You lead.', 'The Emir is in cuffs. Outside the caves, an old man brings your soldiers green tea and will not take money.'],
      missions: [m('assault', 'Compound Clear', { scene: 'cherat', enemies: 6, hostages: 1, length: 8, diff: 3, seed: 4 }), m('heli', 'Valley Sweep', { need: 14, time: 45, diff: 3, scene: 'cherat' }), m('defuse', 'Roadside Bomb', { time: 45 }), m('stealth', 'Mountain Shadows', { diff: 3, scene: 'mountain_night' }), m('para', 'Night HALO', { diff: 3, scene: 'mountain_night' }), m('fight', 'Cave Ambush', { foe: 'Militant', diff: 3, scene: 'mountain_night', foeColor: '#2a2420', knife: true, scarf: true }), m('defend', 'Picket Hold', { waves: 5, diff: 3, scene: 'cherat' }), m('assault', 'The Cave Complex', { scene: 'mountain_night', enemies: 9, hostages: 2, length: 12, diff: 4, boss: true, bossName: 'The Emir', seed: 17 })] },
    { id: 'karachi', n: 'Karachi', sub: 'City of Lights', scene: 'karachi', gate: 56, briefer: 'rabia', boss: { n: 'The Don', look: { outfit: 'suit', moustache: true, glasses: true, gray: .3, hair: '#1a1410', skin: '#c38c60', age: 48 } },
      lines: ['Twenty million people, and somewhere among them a man who sells guns, bombs and children.', 'He owns the police on three streets and the harbour after midnight. Follow the money, then follow his men.', 'The Don is moving his shipment tonight from the docks. Hostages are aboard. No second chances.', 'The Don is on the floor of his own warehouse. By morning, the city reads the story over chai and samosas.'],
      missions: [m('stealth', 'Saddar Tail', { diff: 3, scene: 'street' }), m('shoot', 'Hostage Bus', { diff: 4, need: 14, total: 20 }), m('cipher', 'Phone Intercept', { messages: ['THE SHIP SAILS FRIDAY'], time: 75 }), m('fight', 'Knife Alley', { foe: 'Enforcer', diff: 4, scene: 'karachi', knife: true, foeColor: '#1a1a24' }), m('defuse', 'Market Bomb', { time: 42 }), m('heli', 'Harbour Pursuit', { need: 12, time: 45, diff: 4, scene: 'port' }), m('sniper', 'Rooftop Overwatch', { diff: 4, scene: 'karachi' }), m('assault', 'The Docks', { scene: 'port', enemies: 10, hostages: 3, length: 12, diff: 4, boss: true, bossName: 'The Don', seed: 23 })] },
    { id: 'desert', n: 'Balochistan', sub: 'The Burning Sands', scene: 'quetta', gate: 76, briefer: 'deputy', boss: { n: 'The Warlord', look: { outfit: 'black', hat: 'wrap', wrapC: '#8a6a3a', beard: 'full', gray: .6, scar: true, skin: '#a8754e', age: 55 } },
      lines: ['A thousand kilometres of sand and rock, and a warlord who thinks the desert belongs to him.', 'He has tanks he bought from three wars and a fort he says no army can take.', 'His fort sits on the only well for fifty miles. He has hostages on the walls. Take it.', 'The warlord\'s flag comes down. The well is open to every village again.'],
      missions: [m('tank', 'Desert Armour', { enemies: 3, diff: 4, scene: 'quetta', earth: '#a08a5a', grass: '#b8a06a' }), m('heli', 'Smugglers\' Road', { need: 15, time: 50, diff: 4, scene: 'quetta' }), m('defend', 'Fort Abbas', { waves: 5, diff: 4, scene: 'quetta' }), m('para', 'Desert HALO', { diff: 4, scene: 'quetta' }), m('sniper', 'Pass Overwatch', { diff: 5, scene: 'quetta' }), m('defuse', 'Pipeline Charge', { time: 38 }), m('tank', 'Tank Battle', { enemies: 4, diff: 5, scene: 'quetta', hilly: 1.3, earth: '#a08a5a', grass: '#b8a06a' }), m('assault', 'The Warlord\'s Fort', { scene: 'quetta', enemies: 11, hostages: 2, length: 13, diff: 5, boss: true, bossName: 'The Warlord', seed: 31 })] },
    { id: 'isi', n: 'ISI: The Long Game', sub: 'Shadows Across Borders', scene: 'maproom', gate: 96, briefer: 'dg', boss: { n: 'The Banker', look: { outfit: 'suit', beard: 'full', gray: .4, glasses: true, skin: '#c99468', age: 54 } },
      lines: ['The network that funds every attack you have fought has a treasurer. We call him the Banker. He has friends in four countries.', 'Kabul, Dubai, Istanbul, the corridor, Gwadar, Taftan. Each partner gives us a piece, if we treat them as partners.', 'The Banker is in a mountain safe house with his ledgers and his hostages. Bring all three out.', 'The ledgers go to six capitals at once. For a week, every intelligence service in the region is on the same side.'],
      missions: [m('stealth', 'Kabul Night', { diff: 4, scene: 'mountain_night' }), m('cipher', 'The Dubai Ledger', { messages: ['TRANSFER VIA AL NOOR TRADING'], time: 70 }), m('memory', 'Istanbul Dead Drop', { rounds: 5, start: 5 }), m('sniper', 'Corridor Overwatch', { diff: 4, scene: 'valley' }), m('defend', 'The Hotel on the Hill', { waves: 5, diff: 4, scene: 'port' }), m('heli', 'Taftan Patrol', { need: 15, time: 48, diff: 4, scene: 'quetta' }), m('fight', 'The Courier', { foe: 'The courier', diff: 4, scene: 'street', knife: true, foeColor: '#1a1a24' }), m('assault', 'The Banker\'s Safe House', { scene: 'mountain_night', enemies: 12, hostages: 3, length: 14, diff: 5, boss: true, bossName: 'The Banker', seed: 37 })] },
    { id: 'final', n: 'Operation Sipahsalar', sub: 'The Last Mission', scene: 'road_night', gate: 116, briefer: 'malik', boss: { n: 'Shikari', npc: 'shikari' },
      lines: ['Every network you broke answered to one man. We call him Shikari, the Hunter. Tonight we hunt him.', 'He knows you are coming. Every step from here is a trap he has built for you.', 'Shikari is in the ruins with the last of his men and three hostages. End it.', 'Shikari is taken alive. On the drive back, your soldiers sing, badly, all the way to Rawalpindi.'],
      missions: [m('heli', 'Night Insertion', { need: 16, time: 50, diff: 5, scene: 'road_night' }), m('para', 'Into the Dark', { diff: 5, scene: 'mountain_night' }), m('stealth', 'Silent Approach', { diff: 5, scene: 'forest_night' }), m('defend', 'Hold the Bridge', { waves: 6, diff: 5, scene: 'dam' }), m('tank', 'Armoured Breakthrough', { enemies: 4, diff: 5, scene: 'valley', hilly: 1.5 }), m('sniper', 'One Shot', { diff: 5, scene: 'mountain_night' }), m('fight', 'Final Duel', { foe: 'Shikari\'s bodyguard', diff: 5, scene: 'mountain_night', foeColor: '#121212', knife: true, scarf: true }), m('assault', 'Operation Sipahsalar', { scene: 'rubble', enemies: 13, hostages: 3, length: 15, diff: 5, boss: true, bossName: 'Shikari', seed: 41 })] },
  ];
  const TYPE = {
    shoot: ['◎', 'Range'], obstacle: ['▲', 'Course'], fight: ['⚔', 'Close combat'], memory: ['▦', 'Recon'], cipher: ['✉', 'Intercept'], defuse: ['✂', 'Bomb disposal'],
    stealth: ['◐', 'Stealth'], sniper: ['⌖', 'Sniper'], assault: ['✦', 'Assault'], tank: ['▬', 'Tank duel'], heli: ['✈', 'Gunship'], para: ['☂', 'HALO jump'], defend: ['⛨', 'Hold the post'],
  };
  // command decision before every mission: how you choose to fight changes the mission and the pay
  const PLAN_TXT = {
    assault: ['Wait for a second platoon: fewer hostiles', 'Clear it the standard way', 'Go in now before they dig in: more hostiles, more glory'],
    tank: ['Call artillery first: one tank fewer', 'Engage as briefed', 'Charge the gap: an extra enemy tank'],
    heli: ['Fly high and safe: fewer kills needed', 'Escort as briefed', 'Low and fast: more kills needed, less time'],
    para: ['Jump in daylight: calmer winds', 'Jump as briefed', 'Night jump: rough winds, big reward'],
    defend: ['Pull back to the inner wall: one wave fewer', 'Hold the line as briefed', 'Hold the forward trench: an extra wave'],
    shoot: ['Take your time: fewer hits needed', 'Standard qualification', 'Expert badge attempt: more hits needed'],
    sniper: ['Wait for better light', 'Take the shot as briefed', 'Shoot through the wind'],
    stealth: ['Wait for the moon to set', 'Move as briefed', 'Go now while the guards change'],
    fight: ['Feel him out first', 'Fight your fight', 'Go straight for him'],
    obstacle: ['Shortened course', 'Full course', 'Full course with a heavy pack'],
    cipher: ['Ask for more time', 'Work as briefed', 'Crack it before the courier moves'],
    defuse: ['Ask for the robot first: more time', 'Defuse as briefed', 'No time for the robot: less time'],
    memory: ['Study the map longer', 'Standard route', 'Longer route, fewer looks'],
  };
  const PLANS = [{ n: 'Cautious', mult: .8, d: -1 }, { n: 'By the book', mult: 1, d: 0 }, { n: 'Bold', mult: 1.45, d: 1 }];
  function applyPlan(type, o, d) {
    if (!d) return o; o = Object.assign({}, o);
    const lim = (v, a, b) => Math.max(a, Math.min(b, v));
    if (o.diff) o.diff = lim(o.diff + d, 1, 5);
    if (type === 'assault') o.enemies = lim((o.enemies || 7) + d * 2, 3, 16);
    if (type === 'tank') o.enemies = lim((o.enemies || 2) + d, 1, 5);
    if (type === 'heli') { o.need = lim((o.need || 12) + d * 3, 6, 22); if (d > 0) o.time = (o.time || 45) - 5; }
    if (type === 'defend') o.waves = lim((o.waves || 3) + d, 2, 8);
    if (type === 'shoot') o.need = lim((o.need || 12) + d * 2, 6, (o.total || 18) - 1);
    if (type === 'obstacle') o.count = lim((o.count || 8) + d * 2, 4, 12);
    if (type === 'cipher' || type === 'defuse') o.time = (o.time || 60) - d * 15;
    if (type === 'memory') o.rounds = lim((o.rounds || 3) + d, 2, 6);
    return o;
  }
  const mid = (ti, mi) => `${THEATRES[ti].id}:${mi}`;
  const best = (ti, mi) => O.prog[mid(ti, mi)] || 0;
  const tStars = ti => THEATRES[ti].missions.reduce((a, _, mi) => a + best(ti, mi), 0);
  const allStars = () => THEATRES.reduce((a, _, ti) => a + tStars(ti), 0);
  const tUnlocked = ti => ti === 0 || (!!O.cleared[THEATRES[ti - 1].id] && allStars() >= THEATRES[ti].gate);
  const mUnlocked = (ti, mi) => tUnlocked(ti) && (mi === 0 || best(ti, mi - 1) > 0);
  function nextMission() { for (let ti = 0; ti < THEATRES.length; ti++) { if (!tUnlocked(ti)) return null; for (let mi = 0; mi < 8; mi++) if (!best(ti, mi)) return [ti, mi]; } return null; }

  // ---------------- level & rewards ----------------
  const need = l => 80 + (l - 1) * 35;
  const pending = [];
  function addXp(n) {
    n = Math.round(n * (1 + bonus('xp'))); O.xp += n;
    while (O.xp >= need(O.lvl)) {
      O.xp -= need(O.lvl); O.lvl++;
      const r = { lvl: O.lvl, sup: 40 + O.lvl * 10, field: O.lvl % 2 === 0 ? 1 : 0, gold: O.lvl % 5 === 0 ? 1 : 0 };
      O.sup += r.sup; O.crates.field += r.field; O.crates.gold += r.gold; pending.push(r);
      if (O.lvl >= 10) META.unlock('lvl10'); if (O.lvl >= 25) META.unlock('lvl25');
    }
    return n;
  }
  function addSup(n) { n = Math.round(n * (1 + bonus('sup'))); O.sup += n; return n; }

  // called by GAMES.run after every mission, wherever it was played
  function afterMission(type, res, opts) {
    const stars = res.stars || 0, ctx = opts.ops;
    let xp, sup, crate = null, first = false;
    if (ctx) {
      const ti = ctx.ti, key = mid(ctx.ti, ctx.mi), prev = O.prog[key] || 0, base = 18 + ti * 9, boss = ctx.mi === 7;
      if (res.win) {
        first = !prev; xp = (22 + ti * 9 + stars * 7) * (boss ? 2 : 1) * (ctx.mult || 1); sup = ((base + stars * base * .45) * (boss ? 2 : 1) + (first ? base : 0)) * (ctx.mult || 1);
        if (stars > prev) O.prog[key] = stars;
        if (boss && first) { crate = 'gold'; O.cleared[THEATRES[ti].id] = 1; META.unlock('ops_' + THEATRES[ti].id); if (THEATRES.every(t => O.cleared[t.id])) META.unlock('ops_all'); }
        else if (Math.random() < (stars === 3 ? .3 : .16)) crate = 'field';
        track('opwin'); track('opstar', stars);
      } else { xp = 8 + ti * 2; sup = 6 + ti * 2; }
    } else {
      xp = res.win ? 14 + stars * 6 : 6; sup = res.win ? 10 + stars * 6 : 3;
      if (res.win && Math.random() < .08) crate = 'field';
    }
    if (res.win) track('win:' + type);
    xp = addXp(xp); sup = addSup(sup);
    if (crate) O.crates[crate]++;
    save(); renderHud();
    return { xp, sup, crate, first };
  }
  function rewardHtml(r) {
    if (!r) return '';
    return `<div class="op-reward"><span class="rw xp"><b>+${r.xp}</b> XP</span><span class="rw sup"><b>+${r.sup}</b> ⛁ Supplies</span>${r.crate ? `<span class="rw crate ${r.crate}">▣ ${r.crate === 'gold' ? 'Gold' : 'Field'} crate!</span>` : ''}</div>
      <div class="op-lvl"><span>Service Level ${O.lvl}</span><i style="--k:${(O.xp / need(O.lvl) * 100).toFixed(1)}%"></i></div>`;
  }

  // ---------------- daily orders ----------------
  const ORDERS = [
    { id: 'win', n: k => `Win ${k} operations`, ev: 'opwin', need: () => rndI(3, 5) },
    { id: 'stars', n: k => `Earn ${k} stars in Operations`, ev: 'opstar', need: () => rndI(6, 10) },
    { id: 'tank', n: () => 'Win a Tank Duel', ev: 'win:tank', need: () => 1 },
    { id: 'heli', n: () => 'Win a Gunship mission', ev: 'win:heli', need: () => 1 },
    { id: 'para', n: () => 'Land a HALO jump', ev: 'win:para', need: () => 1 },
    { id: 'defend', n: () => 'Hold a post', ev: 'win:defend', need: () => 1 },
    { id: 'assault', n: () => 'Win an assault', ev: 'win:assault', need: () => 1 },
    { id: 'crate', n: k => `Open ${k} crates`, ev: 'crate', need: () => 2 },
    { id: 'year', n: k => `Live ${k} years in your life story`, ev: 'year', need: () => rndI(3, 5) },
    { id: 'stand', n: k => `Hold ${k} waves in Last Stand`, ev: 'stand', need: () => rndI(3, 6), max: true },
    { id: 'upgrade', n: () => 'Upgrade any gear in the Armory', ev: 'upgrade', need: () => 1 },
  ];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function ensureOrders() {
    if (O.orders.day === today() && O.orders.list.length) return;
    const pool = ORDERS.slice().sort(() => Math.random() - .5).slice(0, 3);
    O.orders = { day: today(), bonus: false, list: pool.map(o => { const k = o.need(); return { id: o.id, need: k, prog: 0, claimed: false, sup: 70 + k * 10, xp: 40 }; }) };
    save();
  }
  function track(ev, n = 1) {
    ensureOrders();
    let ping = false;
    O.orders.list.forEach(it => {
      const d = ORDERS.find(o => o.id === it.id); if (!d || d.ev !== ev || it.prog >= it.need) return;
      it.prog = d.max ? Math.max(it.prog, n) : Math.min(it.need, it.prog + n); if (it.prog >= it.need) ping = true;
    });
    save(); renderHud();
    if (ping) toast('Daily order complete! Claim it in Orders');
  }
  const claimable = () => { ensureOrders(); return O.orders.list.filter(i => i.prog >= i.need && !i.claimed).length + (O.orders.list.every(i => i.claimed) && !O.orders.bonus ? 1 : 0); };

  function recordStand(waves) { if (waves > O.stand) O.stand = waves; if (waves >= 10) META.unlock('stand10'); track('stand', waves); save(); }

  // ---------------- crates ----------------
  function rollCard(gold, floor = 0) {
    const w = gold ? [0, 55, 33, 12] : [62, 28, 8.5, 1.5];
    let r = Math.random() * w.reduce((a, b) => a + b), rar = 0; for (let i = 0; i < 4; i++) { if (r < w[i]) { rar = i; break; } r -= w[i]; }
    rar = Math.max(rar, floor);
    const pool = SQ.filter(c => c.rar === rar); return pool[Math.random() * pool.length | 0];
  }
  function openCrate(kind) {
    if (O.crates[kind] <= 0) return null;
    O.crates[kind]--; O.opened++;
    const cards = kind === 'gold' ? [rollCard(true, 2), rollCard(true)] : [rollCard(false)];
    const sup = kind === 'gold' ? rndI(110, 180) : rndI(30, 65);
    const out = cards.map(c => { const before = cardLv(c.id); O.cards[c.id] = copies(c.id) + 1; const after = cardLv(c.id); return { c, isNew: before === 0, up: after > before && before > 0, lv: after }; });
    O.sup += sup;
    if (!O.buddy) O.buddy = out[0].c.id;
    if (Object.keys(O.cards).length >= 8) META.unlock('squad8');
    if (out.some(x => x.c.rar === 3)) META.unlock('legend');
    save(); track('crate');
    return { sup, out };
  }

  // ---------------- UI ----------------
  let runner = null, ti = 0, back = null, busy = false;
  function toast(t) { const d = document.createElement('div'); d.className = 'ops-toast'; d.textContent = t; document.getElementById('app').appendChild(d); setTimeout(() => d.remove(), 2800); }
  function inject() {
    const app = $('app');
    const sec = document.createElement('section'); sec.id = 'ops'; sec.className = 'screen ops'; sec.hidden = true;
    sec.innerHTML = `<canvas id="opsCanvas"></canvas><canvas id="opsFg" class="fg-layer"></canvas><div class="ops-shade"></div>
      <header class="ops-top">
        <button class="chipbtn" id="opsBack" aria-label="Back">◀ Back</button>
        <div class="lvl"><div class="lvl-badge"><small>LV</small><b id="opsLvl">1</b></div><div class="lvl-meta"><div class="lvl-bar"><i id="opsXp"></i></div><small id="opsXpTxt"></small></div></div>
        <div class="res"><span class="sup">⛁ <b id="opsSup">0</b></span><span class="stars">★ <b id="opsStars">0</b></span></div>
      </header>
      <div class="ops-tabs" id="opsTabs"></div>
      <div class="ops-head"><div class="kick" id="opsSub"></div><h2 id="opsName"></h2><div class="prog" id="opsProg"></div></div>
      <div class="ops-map" id="opsMap"><svg id="opsPath" preserveAspectRatio="none" viewBox="0 0 100 100"></svg><div id="opsNodes"></div></div>
      <nav class="ops-dock">
        <button data-ops="armory"><i>⚙</i>Armory</button>
        <button data-ops="squad"><i>☻</i>Squad</button>
        <button data-ops="crates"><i>▣</i>Crates<em id="opsCrateN" hidden></em></button>
        <button data-ops="orders"><i>☰</i>Orders<em id="opsOrderN" hidden></em></button>
        <button data-ops="stand"><i>⚑</i>Last Stand</button>
      </nav>
      <div class="ops-brief" id="opsBrief" hidden></div>`;
    app.appendChild(sec);
    const cr = document.createElement('div'); cr.id = 'crate'; cr.className = 'crate-ov'; cr.hidden = true; app.appendChild(cr);
    $('opsBack').onclick = close;
    sec.querySelectorAll('[data-ops]').forEach(b => b.onclick = () => { SFX.click(); ({ armory, squad, crates: cratesSheet, orders, stand: lastStand })[b.dataset.ops](); });
    runner = SCENES.Runner($('opsCanvas'), $('opsFg'), { lowEvery: 4 });
  }
  function renderHud() {
    if (!$('ops')) return;
    $('opsLvl').textContent = O.lvl; $('opsXp').style.width = (O.xp / need(O.lvl) * 100).toFixed(1) + '%'; $('opsXpTxt').textContent = `${O.xp} / ${need(O.lvl)} XP`;
    $('opsSup').textContent = O.sup; $('opsStars').textContent = allStars();
    const cn = O.crates.field + O.crates.gold, on = claimable();
    $('opsCrateN').hidden = !cn; $('opsCrateN').textContent = cn; $('opsOrderN').hidden = !on; $('opsOrderN').textContent = on;
    document.querySelectorAll('.ops-badge').forEach(b => { const n = cn + on; b.hidden = !n; b.textContent = n; });
    document.querySelectorAll('.ops-lvchip').forEach(b => b.textContent = 'LV ' + O.lvl);
  }
  function renderTabs() {
    $('opsTabs').innerHTML = THEATRES.map((t, i) => `<button class="otab ${i === ti ? 'on' : ''} ${tUnlocked(i) ? '' : 'locked'} ${O.cleared[t.id] ? 'done' : ''}" data-t="${i}"><b>${i + 1}</b><span>${t.n}</span><small>${tUnlocked(i) ? `${tStars(i)}/24 ★` : `🔒 ${t.gate} ★`}</small></button>`).join('');
    $('opsTabs').querySelectorAll('.otab').forEach(b => b.onclick = () => { SFX.click(); const i = +b.dataset.t; if (!tUnlocked(i)) { const t = THEATRES[i]; toast(!O.cleared[THEATRES[i - 1].id] ? `Defeat ${THEATRES[i - 1].boss.n} in ${THEATRES[i - 1].n} first` : `Earn ${t.gate - allStars()} more ★ to unlock. Replay missions for 3 stars.`); return; } ti = i; renderMap(); });
    const on = $('opsTabs').querySelector('.on'); on && on.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  const PTS = [[18, 88], [48, 80], [80, 70], [60, 58], [26, 50], [42, 37], [74, 27], [50, 11]];
  function pathD(pts) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2; d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`; }
    return d;
  }
  function renderMap(popIdx) {
    const T = THEATRES[ti];
    runner.set(T.scene);
    $('opsSub').textContent = `Theatre ${ti + 1} · ${T.sub}`; $('opsName').textContent = T.n;
    const rp = O.rep || 0;
    $('opsProg').innerHTML = `<i style="--k:${(tStars(ti) / 24 * 100).toFixed(0)}%"></i><span>${tStars(ti)} / 24 ★${O.cleared[T.id] ? ' · cleared' : ''}</span><span class="rep ${rp > 0 ? 'good' : rp < 0 ? 'bad' : ''}">⚖ Name ${rp > 0 ? '+' + rp : rp}</span>`;
    let done = 0; for (let i = 0; i < 8; i++) if (best(ti, i)) done = i + 1;
    const all = pathD(PTS), part = done > 0 ? pathD(PTS.slice(0, Math.min(8, done + 1))) : '';
    $('opsPath').innerHTML = `<path d="${all}" class="p-all"/>${part ? `<path d="${part}" class="p-done"/>` : ''}`;
    const nx = nextMission(), cur = nx && nx[0] === ti ? nx[1] : -1;
    $('opsNodes').innerHTML = T.missions.map((ms, i) => {
      const un = mUnlocked(ti, i), b = best(ti, i), boss = i === 7, [ic] = TYPE[ms.type];
      return `<button class="onode ${boss ? 'boss' : ''} ${un ? '' : 'locked'} ${b ? 'won' : ''} ${i === cur ? 'next' : ''} ${i === popIdx ? 'pop' : ''}" data-m="${i}" style="left:${PTS[i][0]}%;top:${PTS[i][1]}%;animation-delay:${i * .05}s">
        <span class="disc"><i>${un ? (boss ? '☠' : ic) : '🔒'}</i></span><span class="lbl">${i + 1}. ${ms.n}</span>${un ? `<span class="nst">${[1, 2, 3].map(k => `<em class="${k <= b ? 'on' : ''}">★</em>`).join('')}</span>` : ''}${i === cur ? '<span class="here">▼</span>' : ''}</button>`;
    }).join('');
    $('opsNodes').querySelectorAll('.onode').forEach(b => b.onclick = () => { const i = +b.dataset.m; if (!mUnlocked(ti, i)) { SFX.bad(); toast('Win the mission before this one first'); return; } SFX.click(); brief(ti, i); });
    renderTabs(); renderHud();
  }
  function artFrame(cv, scene, who, mood) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, r.width * d | 0); cv.height = Math.max(1, r.height * d | 0);
    const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); const w = r.width, h = r.height, st = {};
    let t0 = performance.now(), alive = true;
    let n = 0;
    const fr = now => { if (!alive || !cv.isConnected) return; n++; if (n % 2 && n > 2) { requestAnimationFrame(fr); return; } if (PERF.low && n > 24) return; const t = (now - t0) / 1000; try { SCENES.S[scene](ctx, w, h, t + 3, st, .016); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 0, w, h); if (who) CUT.portrait(ctx, w, h, t, who, mood, { x: .74, crop: 'bust', hgt: 1.05, bottom: 1.05, light: '255,190,150' }); } catch (e) {} requestAnimationFrame(fr); };
    requestAnimationFrame(fr);
    return () => { alive = false; };
  }
  let stopArt = null, plan = 1;
  function brief(t, i) {
    const T = THEATRES[t], ms = T.missions[i], boss = i === 7, [ic, tn] = TYPE[ms.type], b = best(t, i);
    const base = 18 + t * 9, supEst = Math.round((base + 3 * base * .45) * (boss ? 2 : 1) + (b ? 0 : base)), xpEst = (22 + t * 9 + 21) * (boss ? 2 : 1);
    const bd = buddy(), D = GAMES.DEF[ms.type];
    const el = $('opsBrief'); el.hidden = false; runner.stop();
    el.innerHTML = `<div class="ob-card ${boss ? 'boss' : ''}"><button class="x" id="obX" aria-label="Close">&times;</button>
      <canvas class="ob-art" id="obArt"></canvas>
      <div class="ob-body">
        <div class="ob-kick">${T.n} · Mission ${i + 1} of 8${boss ? ' · <b>BOSS</b>' : ''}</div>
        <h3>${ms.n}</h3>
        <div class="ob-type"><span>${ic}</span>${tn}${boss ? ` vs <b>${T.boss.n}</b>` : ''}</div>
        <p>${D ? D.brief : ''}</p>
        <div class="ob-row"><div class="ob-best">${[1, 2, 3].map(k => `<em class="${k <= b ? 'on' : ''}">★</em>`).join('')}<small>${b ? 'Your best' : 'Not yet won'}</small></div>
        <div class="ob-rw"><span>up to <b>${supEst}</b> ⛁</span><span>up to <b>${xpEst}</b> XP</span>${boss && !b ? '<span class="gold">▣ Gold crate</span>' : '<span>▣ crate chance</span>'}</div></div>
        <div class="ob-plan"><div class="ob-plan-h">Command decision</div>${PLANS.map((pl, k) => `<button class="plan ${k === plan ? 'on' : ''}" data-plan="${k}"><b>${pl.n}</b><span>${(PLAN_TXT[ms.type] || [])[k] || ''}</span><em>${pl.mult === 1 ? 'normal pay' : pl.mult > 1 ? '+45% pay' : '-20% pay'}</em></button>`).join('')}</div>
        <div class="ob-buddy">${bd ? `Squad buddy: <b>${bd.name}</b> fights beside you` : 'No squad buddy yet. Open a crate to recruit one.'} <button class="chipbtn" id="obSquad">Squad</button></div>
        <button class="btn primary deploy" id="obGo">Deploy ▶</button>
      </div></div>`;
    if (stopArt) stopArt();
    requestAnimationFrame(() => { const cv = $('obArt'); if (cv) stopArt = artFrame(cv, ms.o.scene || T.scene, boss ? (T.boss.npc || 'boss_' + T.id) : T.briefer, boss ? 'angry' : 'serious'); });
    $('obX').onclick = () => { SFX.click(); closeBrief(); };
    $('obSquad').onclick = () => { SFX.click(); squad(); };
    el.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => { plan = +b.dataset.plan; SFX.click(); el.querySelectorAll('[data-plan]').forEach(x => x.classList.toggle('on', +x.dataset.plan === plan)); });
    $('obGo').onclick = () => { SFX.choose(); closeBrief(); deploy(t, i, plan); };
  }
  function closeBrief() { const was = !$('opsBrief').hidden; $('opsBrief').hidden = true; if (stopArt) { stopArt(); stopArt = null; } if (was && !$('ops').hidden && !busy) runner.start(); }

  async function deploy(t, i, pl = 1) {
    if (busy) return; busy = true;
    const T = THEATRES[t], ms = T.missions[i], boss = i === 7;
    runner.stop();
    try {
      if (i === 0 && !O.intro[T.id]) { O.intro[T.id] = 1; save(); await CUT.play('ops_in_' + T.id); }
      O.seen = O.seen || {};
      if (boss && !best(t, i)) await CUT.play('ops_boss_' + T.id);
      else if (!O.seen[mid(t, i)] && CUT.missionIntro) { CUT.LIB.__opm = CUT.missionIntro(ms.type, ms.o.scene || T.scene, ms.n, `${T.n} · Mission ${i + 1}`); await CUT.play('__opm'); }
      O.seen[mid(t, i)] = 1; save();
      const o = Object.assign(applyPlan(ms.type, ms.o, PLANS[pl].d), { key: 'ops:' + mid(t, i), kicker: `${T.n} · ${i + 1}/8 · ${PLANS[pl].n}`, title: ms.n, ops: { ti: t, mi: i, mult: PLANS[pl].mult } });
      if (o.time && ['cipher', 'defuse'].includes(ms.type)) o.time += bonus('time');
      const wasCleared = !!O.cleared[T.id];
      const res = await GAMES.run(ms.type, o);
      if (window.GAME && GAME.renderStars) GAME.renderStars();
      if (boss && res.win && !wasCleared) {
        const alive = await choiceFx(T);
        O.rep = (O.rep || 0) + (alive ? 1 : -1); O.choice = O.choice || {}; O.choice[T.id] = alive ? 'alive' : 'killed'; save();
        CUT.LIB['ops_win_' + T.id][0].cap = alive ? `${T.boss.n} is on his knees, hands tied. He will stand trial.` : `${T.boss.n} does not get up again. Nobody says anything on the walk back.`;
        CUT.LIB['ops_win_' + T.id][1].cap = T.id === 'final' ? ((O.rep || 0) >= 3 ? 'Shikari stands trial in an open court. The country watches an army that kept its word, even to him.' : 'It is over. The men are quiet. Some victories leave a taste you never quite rinse away.') : alive ? T.lines[3] : T.lines[3] + ' But in the villages, people lower their voices when your unit drives past.';
        await CUT.play('ops_win_' + T.id);
        await bannerFx(`${T.n} cleared`, THEATRES[t + 1] ? `Next theatre: ${THEATRES[t + 1].n}` : 'Every theatre cleared. You are a legend of the Army.');
      }
      await drainRewards();
      runner.start();
      if (res.win) {
        if (boss && THEATRES[t + 1] && tUnlocked(t + 1)) { ti = t + 1; renderMap(0); }
        else renderMap(Math.min(7, i + 1));
        // keep the momentum: the next mission's briefing opens by itself
        const nx = nextMission();
        if (nx && nx[0] === ti) setTimeout(() => { if (!$('ops').hidden && $('opsBrief').hidden && $('sheet').hidden && !busy) brief(nx[0], nx[1]); }, 1100);
      } else renderMap();
    } finally { busy = false; runner.start(); }
  }
  async function drainRewards() {
    while (pending.length) await levelUp(pending.shift());
    const kinds = ['gold', 'field'];
    for (const k of kinds) if (O.crates[k] > 0 && O._autoCrate !== false && lastCrates[k] < O.crates[k]) { await crateFlow(k); }
    lastCrates = { field: O.crates.field, gold: O.crates.gold };
  }
  let lastCrates = { field: O.crates.field, gold: O.crates.gold };

  function choiceFx(T) {
    return new Promise(res => {
      const d = document.createElement('div'); d.className = 'ops-banner choice';
      d.innerHTML = `<div class="bn-in"><small>Your decision</small><h2>${T.boss.n}</h2><p>He is wounded and unarmed. Your men are looking at you. Whatever you decide will follow your unit.</p>
        <div class="row col"><button class="btn primary" data-c="1">Take him alive for trial</button><button class="btn danger" data-c="0">Let the men settle it</button></div><p class="sheet-note">Mercy builds your name. Revenge costs it.</p></div>`;
      $('app').appendChild(d); SFX.pad('tense');
      d.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { SFX.choose(); SFX.stopPad(); d.remove(); res(b.dataset.c === '1'); });
    });
  }
  function bannerFx(title, sub) {
    return new Promise(res => {
      const d = document.createElement('div'); d.className = 'ops-banner';
      d.innerHTML = `<div class="rays"></div><div class="bn-in"><small>${/⛁/.test(title) ? 'Squad pay' : 'Theatre complete'}</small><h2>${title}</h2><p>${sub}</p><button class="btn primary">Continue</button></div>`;
      $('app').appendChild(d); SFX.fanfare(); confetti();
      d.querySelector('button').onclick = () => { SFX.click(); d.remove(); res(); };
    });
  }
  function levelUp(r) {
    return new Promise(res => {
      const d = document.createElement('div'); d.className = 'ops-banner lvlup';
      d.innerHTML = `<div class="rays"></div><div class="bn-in"><small>Promotion in service</small><div class="big-lv"><span>LEVEL</span><b>${r.lvl}</b></div><div class="lv-rw"><span>+${r.sup} ⛁</span>${r.field ? '<span>▣ Field crate</span>' : ''}${r.gold ? '<span class="gold">▣ Gold crate</span>' : ''}</div><button class="btn primary">Collect</button></div>`;
      $('app').appendChild(d); SFX.fanfare(); confetti(); SFX.buzz && SFX.buzz(40);
      d.querySelector('button').onclick = () => { SFX.click(); d.remove(); res(); };
    });
  }
  function confetti() {
    const c = document.createElement('canvas'); c.className = 'confetti'; $('app').appendChild(c);
    const ctx = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight, ps = [];
    for (let i = 0; i < 110; i++) ps.push({ x: W / 2 + (Math.random() - .5) * 80, y: H * .45, vx: (Math.random() - .5) * 900, vy: -300 - Math.random() * 700, r: Math.random() * 6.28, c: ['#e0a83e', '#22a95f', '#ffffff', '#f0d080', '#0f7a43'][i % 5] });
    let t0 = performance.now();
    const fr = now => { const t = (now - t0) / 1000; ctx.clearRect(0, 0, W, H); ps.forEach(p => { p.vy += 900 * .016; p.vx *= .985; p.x += p.vx * .016; p.y += p.vy * .016; p.r += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }); if (t < 2.6) requestAnimationFrame(fr); else c.remove(); };
    requestAnimationFrame(fr);
  }

  // card face with a live portrait
  function cardHtml(c, extra = '') { const lv = cardLv(c.id); return `<div class="sqcard r${c.rar} ${lv ? '' : 'unknown'}" data-card="${c.id}"><canvas></canvas><div class="sq-meta"><b>${lv ? c.n : '???'}</b><span>${c.role}</span><small>${RAR[c.rar].n}${lv ? ` · LV ${lv}` : ''}</small>${lv ? `<em>${fmtBonus(c.key, c.val * lv)}</em>` : ''}</div>${extra}</div>`; }
  function paintCards(root, loop = false) {
    const list = [...root.querySelectorAll('.sqcard')];
    let t0 = performance.now(), frames = 0;
    const fr = now => {
      if (!root.isConnected || (root.hidden)) return;
      const t = (now - t0) / 1000; frames++;
      if (frames > 2 && frames % 3) { if (loop || frames < 40) requestAnimationFrame(fr); return; }
      list.forEach(el => {
        const cv = el.querySelector('canvas'), c = sqById[el.dataset.card]; if (!cv || !c) return;
        const r = cv.getBoundingClientRect(); if (!r.width) return; const d = Math.min(2, window.devicePixelRatio || 1);
        if (cv.width !== (r.width * d | 0)) { cv.width = r.width * d | 0; cv.height = r.height * d | 0; }
        const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); const w = r.width, h = r.height;
        const g = x.createRadialGradient(w / 2, h * .35, 4, w / 2, h * .5, h * .8); g.addColorStop(0, CHAR.mix(RAR[c.rar].c, '#ffffff', .2)); g.addColorStop(1, CHAR.mix(RAR[c.rar].c, '#000000', .75));
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        if (c.rar >= 2) { x.save(); x.globalAlpha = .18; x.translate(w / 2, h * .4); x.rotate(t * .4); x.fillStyle = '#fff'; for (let k = 0; k < 8; k++) { x.rotate(Math.PI / 4); x.beginPath(); x.moveTo(0, 0); x.lineTo(w, -w * .12); x.lineTo(w, w * .12); x.fill(); } x.restore(); }
        try { CUT.portrait(x, w, h, t + c.rar, npcOf(c), c.rar === 3 ? 'proud' : 'neutral', { crop: 'bust', hgt: 1.02, bottom: 1.02, tint: cardLv(c.id) ? null : 'rgba(0,0,0,.92)' }); } catch (e) {}
      });
      if ((loop && !PERF.low) || frames < 40) requestAnimationFrame(fr);
    };
    requestAnimationFrame(fr);
  }

  function sheet(title, html) { $('sheetTitle').textContent = title; $('sheetBody').innerHTML = html; $('sheet').hidden = false; }
  function armory() {
    sheet('Armory', `<p class="sheet-note">Spend supplies on gear. Upgrades work everywhere: Operations, Training Ground and your life story. You have <b class="gold">${O.sup} ⛁</b>.</p>` + GEAR.map(g => {
      const lv = gearLv(g.id), c = lv < 5 ? gearCost(g.id, lv) : 0;
      return `<div class="row-item gear"><span class="perk-ic">${g.ic}</span><div class="meta"><b>${g.n} <span class="lvl">${'●'.repeat(lv)}${'○'.repeat(5 - lv)}</span></b><span class="tier">${g.tiers[lv]}${lv < 5 ? ` → <i>${g.tiers[lv + 1]}</i>` : ''}</span><span>${g.d(Math.max(1, lv < 5 ? lv + 1 : lv))}</span></div><div class="acts">${lv >= 5 ? '<span class="ap">Max</span>' : `<button class="btn small ${O.sup >= c ? 'primary' : ''}" data-g="${g.id}" ${O.sup >= c ? '' : 'disabled'}>${c} ⛁</button>`}</div></div>`;
    }).join(''));
    $('sheetBody').querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      const id = b.dataset.g, lv = gearLv(id), c = gearCost(id, lv); if (O.sup < c || lv >= 5) return;
      O.sup -= c; O.gear[id] = lv + 1; save(); SFX.fanfare(); confetti(); track('upgrade'); if (lv + 1 >= 5) META.unlock('gearmax'); renderHud(); armory();
    });
  }
  function squad() {
    const own = SQ.filter(c => cardLv(c.id)).length, bd = buddy();
    const keys = ['hit', 'hp', 'steady', 'med', 'speed', 'gren', 'time', 'xp', 'sup'];
    const tot = keys.map(k => { const v = SQ.reduce((a, c) => a + (c.key === k ? c.val * cardLv(c.id) : 0), 0); return v ? `<span>${fmtBonus(k, v)}</span>` : ''; }).join('');
    sheet('Squad', `<p class="sheet-note">${own} of ${SQ.length} recruited. Every soldier you own adds a bonus; duplicates from crates level them up. Tap one to make them your <b>buddy</b>: they fight beside you in assaults and on the post.</p>${tot ? `<div class="sq-tot">${tot}</div>` : ''}<div class="sqgrid">` + SQ.slice().sort((a, b) => (cardLv(b.id) ? 1 : 0) - (cardLv(a.id) ? 1 : 0) || b.rar - a.rar).map(c => cardHtml(c, cardLv(c.id) ? `${bd && bd.id === c.id ? '<i class="bud">BUDDY</i>' : ''}${nextAt(cardLv(c.id)) ? `<i class="cp">${copies(c.id)}/${nextAt(cardLv(c.id))}</i>` : ''}` : '')).join('') + '</div>');
    const body = $('sheetBody'); paintCards(body);
    body.querySelectorAll('.sqcard').forEach(el => el.onclick = () => { const id = el.dataset.card; if (!cardLv(id)) { SFX.bad(); return; } O.buddy = id; save(); SFX.choose(); squad(); });
  }
  function cratesSheet() {
    sheet('Supply Crates', `<p class="sheet-note">Crates hold supplies and new soldiers for your squad. You earn them from bosses, level-ups, daily orders and lucky missions, or buy them here. You have <b class="gold">${O.sup} ⛁</b>.</p>
      <div class="crate-row"><div class="crate-mini field"><div class="lid"></div><div class="bx"></div></div><div class="meta"><b>Field Crate × ${O.crates.field}</b><span>1 soldier (any rarity) + 30–65 ⛁</span></div><div class="acts">${O.crates.field ? '<button class="btn small primary" data-open="field">Open</button>' : ''}<button class="btn small ${O.sup >= 120 ? '' : 'ghost'}" data-buy="field" ${O.sup >= 120 ? '' : 'disabled'}>Buy 120 ⛁</button></div></div>
      <div class="crate-row"><div class="crate-mini gold"><div class="lid"></div><div class="bx"></div></div><div class="meta"><b>Gold Crate × ${O.crates.gold}</b><span>2 soldiers, one Epic or better + 110–180 ⛁</span></div><div class="acts">${O.crates.gold ? '<button class="btn small primary" data-open="gold">Open</button>' : ''}<button class="btn small ${O.sup >= 420 ? '' : 'ghost'}" data-buy="gold" ${O.sup >= 420 ? '' : 'disabled'}>Buy 420 ⛁</button></div></div>
      <p class="sheet-note">Odds, field crate: Common 62%, Rare 28%, Epic 8.5%, Legendary 1.5%. Gold crate: Rare 55%, Epic 33%, Legendary 12%. Supplies are earned only by playing; there is nothing to buy with real money.</p>`);
    $('sheetBody').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const k = b.dataset.buy, c = k === 'gold' ? 420 : 120; if (O.sup < c) return; O.sup -= c; O.crates[k]++; save(); SFX.choose(); renderHud(); cratesSheet(); });
    $('sheetBody').querySelectorAll('[data-open]').forEach(b => b.onclick = async () => { $('sheet').hidden = true; await crateFlow(b.dataset.open); lastCrates = { field: O.crates.field, gold: O.crates.gold }; cratesSheet(); });
  }
  function crateFlow(kind) {
    return new Promise(res => {
      const ov = $('crate'); ov.hidden = false; ov.className = 'crate-ov ' + kind;
      ov.innerHTML = `<div class="rays"></div><div class="crate-stage"><div class="crate-box ${kind}"><div class="lid"><span>${kind === 'gold' ? '★ GOLD ★' : 'FIELD SUPPLY'}</span></div><div class="bx"><span>PAK ARMY · ${kind === 'gold' ? 'SPECIAL' : 'ISSUE'}</span></div></div><div class="crate-tip">Tap the crate to open</div></div><div class="crate-loot"></div>`;
      let taps = 0;
      const box = ov.querySelector('.crate-box');
      SFX.whoosh();
      box.onclick = () => {
        taps++; box.classList.remove('hit'); void box.offsetWidth; box.classList.add('hit'); SFX.hit();
        if (taps < 3) { ov.querySelector('.crate-tip').textContent = taps === 1 ? 'Again!' : 'One more!'; return; }
        box.onclick = null; const r = openCrate(kind); if (!r) { ov.hidden = true; res(); return; }
        box.classList.add('open'); ov.classList.add('burst'); SFX.boom(); setTimeout(() => SFX.fanfare(), 300);
        ov.querySelector('.crate-tip').textContent = '';
        const loot = ov.querySelector('.crate-loot');
        setTimeout(() => {
          loot.innerHTML = `<div class="loot-sup">+<b data-n="${r.sup}">0</b> ⛁</div><div class="loot-cards">${r.out.map((x, k) => `<div class="flip" style="animation-delay:${.35 + k * .45}s">${cardHtml(x.c, x.isNew ? '<i class="new">NEW!</i>' : x.up ? `<i class="new up">LEVEL ${x.lv}!</i>` : `<i class="cp">${copies(x.c.id)}/${nextAt(cardLv(x.c.id)) ?? 'max'}</i>`)}</div>`).join('')}</div><button class="btn primary" id="lootOk">Collect</button>`;
          const num = loot.querySelector('[data-n]'); let v = 0; const tgt = r.sup; const iv = setInterval(() => { v = Math.min(tgt, v + Math.ceil(tgt / 18)); num.textContent = v; SFX.tick(); if (v >= tgt) clearInterval(iv); }, 40);
          r.out.forEach((x, k) => setTimeout(() => { if (x.c.rar >= 2) { SFX.fanfare(); confetti(); } else SFX.good(); }, 500 + k * 450));
          paintCards(loot, true);
          $('lootOk').onclick = () => { SFX.click(); ov.hidden = true; ov.innerHTML = ''; renderHud(); res(); };
        }, 450);
      };
    });
  }
  function orders() {
    ensureOrders();
    const allDone = O.orders.list.every(i => i.claimed);
    sheet('Daily Orders', `<p class="sheet-note">Three new orders every day. Finish all three for a <b class="gold">Gold Crate</b>.</p>` + O.orders.list.map((it, k) => {
      const d = ORDERS.find(o => o.id === it.id), done = it.prog >= it.need;
      return `<div class="row-item order ${it.claimed ? 'claimed' : ''}"><span class="perk-ic">${it.claimed ? '✓' : done ? '!' : '☰'}</span><div class="meta"><b>${d ? d.n(it.need) : it.id}</b><div class="obar"><i style="width:${Math.min(100, it.prog / it.need * 100)}%"></i></div><span>${Math.min(it.prog, it.need)} / ${it.need} · reward ${it.sup} ⛁ + ${it.xp} XP</span></div><div class="acts">${it.claimed ? '<span class="ap">Done</span>' : `<button class="btn small ${done ? 'primary' : ''}" data-claim="${k}" ${done ? '' : 'disabled'}>Claim</button>`}</div></div>`;
    }).join('') + `<div class="row-item order bonus"><span class="perk-ic">▣</span><div class="meta"><b>All three orders</b><span>Gold Crate</span></div><div class="acts">${O.orders.bonus ? '<span class="ap">Done</span>' : `<button class="btn small ${allDone ? 'primary' : ''}" id="ordBonus" ${allDone ? '' : 'disabled'}>Claim</button>`}</div></div><p class="sheet-note">New orders in ${hoursLeft()}.</p>`);
    $('sheetBody').querySelectorAll('[data-claim]').forEach(b => b.onclick = async () => { const it = O.orders.list[+b.dataset.claim]; if (it.claimed || it.prog < it.need) return; it.claimed = true; addSup(it.sup); addXp(it.xp); save(); SFX.fanfare(); confetti(); renderHud(); orders(); if (pending.length) { $('sheet').hidden = true; await drainRewards(); orders(); } });
    const bb = $('ordBonus'); if (bb) bb.onclick = async () => { O.orders.bonus = true; O.crates.gold++; save(); $('sheet').hidden = true; await crateFlow('gold'); lastCrates = { field: O.crates.field, gold: O.crates.gold }; renderHud(); orders(); };
  }
  function hoursLeft() { const n = new Date(), m2 = new Date(n); m2.setHours(24, 0, 0, 0); const h = Math.floor((m2 - n) / 36e5), mi = Math.floor((m2 - n) % 36e5 / 6e4); return `${h}h ${mi}m`; }
  async function lastStand() {
    const sc = THEATRES[Math.min(THEATRES.length - 1, Math.max(0, ti))].scene;
    if (busy) return; busy = true; runner.stop();
    try {
      await GAMES.run('defend', { endless: true, diff: 2, scene: sc === 'pma' ? 'snowpost' : sc, title: 'Last Stand', kicker: `Endless · best ${O.stand} waves`, key: 'ops:stand', retry: true });
      await drainRewards();
    } finally { busy = false; runner.start(); renderMap(); }
  }

  // ---------------- cutscenes for each theatre ----------------
  function buildCuts() {
    const S = SCENES.S, P = FIG.P, H = SCENES.helpers;
    const runPose = (t, sp = 10) => FIG.lerp(P.run1, P.run2, (Math.sin(t * sp) + 1) / 2);
    THEATRES.forEach(T => {
      if (!T.boss.npc) window.NPCS['boss_' + T.id] = { name: T.boss.n, look: T.boss.look };
      const bossNpc = T.boss.npc || 'boss_' + T.id, night = /night|road/.test(T.scene);
      CUT.LIB['ops_in_' + T.id] = [
        { d: 4.2, who: `Theatre ${THEATRES.indexOf(T) + 1}`, cap: `${T.n.toUpperCase()}: ${T.sub}`, cam: [-.6, 1.02, .6, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
          S[T.scene](ctx, w, h, t, st, dt);
          FIG.heli(ctx, w * (-.15 + p * 1.2), h * (.32 + Math.sin(t * 1.4) * .015), h * .09, t, '#1d2420');
          FIG.heli(ctx, w * (-.35 + p * 1.2), h * (.24 + Math.sin(t * 1.2 + 1) * .015), h * .065, t, '#232a26');
          ctx.fillStyle = `rgba(239,233,214,${Math.min(1, p * 3) * (1 - Math.max(0, p - .8) * 5)})`; ctx.font = `${Math.min(w * .1, 76)}px "Saira Stencil One", sans-serif`; ctx.textAlign = 'center'; ctx.fillText(T.n.toUpperCase(), w / 2, h * .52); ctx.textAlign = 'left';
        } },
        { d: 5.2, who: () => (window.NPCS[T.briefer] && (typeof window.NPCS[T.briefer].name === 'function' ? 'Briefing' : window.NPCS[T.briefer].name)) || 'Briefing', cap: T.lines[0], cam: [0, 1.0, 0, 1.06], draw(ctx, w, h, p, t, dt, fx, st) {
          S.maproom(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 0, w, h * 1.2);
          CUT.portrait(ctx, w, h, t, T.briefer, 'serious', { x: .62, crop: 'bust', hgt: 1.05, bottom: 1.1, talk: true, light: '255,220,170', side: -1 });
          CUT.portrait(ctx, w, h, t, 'hero', 'determined', { x: .2, crop: 'bust', hgt: .9, bottom: 1.12, flip: true, alpha: .95 });
        } },
        { d: 4.4, who: 'Mission', cap: T.lines[1], draw(ctx, w, h, p, t, dt, fx, st) {
          S[T.scene](ctx, w, h, t, st, dt); if (night) { ctx.fillStyle = 'rgba(0,10,20,.25)'; ctx.fillRect(0, 0, w, h * 1.2); }
          for (let i = 0; i < 6; i++) { const x = w * (-.1 + ((p * .9 + i * .14) % 1.2)); FIG.draw(ctx, x, h * (.86 + (i % 2) * .03), h * (.22 + (i % 2) * .03), runPose(t + i * .7), { color: '#4c5634', helmet: '#3a4028', rifle: true, pack: '#3a3e2a', skin: '#a8754e' }); }
          if (Math.random() < .03) { fx.boom(w * (.6 + Math.random() * .4), h * (.55 + Math.random() * .2), .5); SFX.boom(); }
        } },
      ];
      CUT.LIB['ops_boss_' + T.id] = [
        { d: 4.6, who: `Target: ${T.boss.n}`, cap: T.lines[2], grade: 'contrast(1.18) saturate(.8)', cam: [.3, 1.0, -.3, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
          S[T.scene](ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(30,0,0,.4)'; ctx.fillRect(0, 0, w, h * 1.2);
          CUT.portrait(ctx, w, h, t, bossNpc, 'angry', { x: .55, crop: 'bust', hgt: 1.08 + p * .06, bottom: 1.1, light: '255,120,80', side: 1, shade: .55 });
          ctx.fillStyle = `rgba(208,74,51,${.6 + .4 * Math.sin(t * 4)})`; ctx.font = `${Math.min(w * .07, 48)}px "Saira Stencil One", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('BOSS: ' + T.boss.n.toUpperCase(), w / 2, h * .36); ctx.textAlign = 'left';
        } },
        { d: 3.6, who: 'Your squad', cap: '"On your command, sahib." Safety catches click off down the line.', draw(ctx, w, h, p, t, dt, fx, st) {
          S[T.scene](ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, w, h * 1.2);
          [.22, .38, .62, .78].forEach((x, i) => FIG.draw(ctx, w * x, h * .9, h * (.4 - Math.abs(x - .5) * .2), i % 2 ? P.crouchAim : P.aim, { color: '#4c5634', helmet: '#3a4028', rifle: true, vest: true, facing: x < .5 ? 1 : -1, skin: '#a8754e' }));
          CUT.portrait(ctx, w, h, t, 'hero', 'determined', { x: .5, crop: 'bust', hgt: .95, bottom: 1.12 });
        } },
      ];
      CUT.LIB['ops_win_' + T.id] = [
        { d: 4.2, who: 'Objective secured', cap: `${T.boss.n} is down.`, flash: true, draw(ctx, w, h, p, t, dt, fx, st) {
          S[T.scene](ctx, w, h, t, st, dt);
          FIG.draw(ctx, w * .55, h * .9, h * .36, P.kneel, { color: '#1a1714', facing: -1, scarf: '#3a2a20' });
          FIG.draw(ctx, w * .4, h * .9, h * .42, P.aim, { color: '#4c5634', helmet: '#3a4028', rifle: true, vest: true, skin: '#a8754e' });
          FIG.draw(ctx, w * .72, h * .9, h * .4, P.aim, { color: '#4c5634', helmet: '#3a4028', rifle: true, vest: true, facing: -1, skin: '#a8754e' });
          if (p < .2 && !st.b) { st.b = 1; fx.boom(w * .85, h * .6, 1); SFX.boom(); }
        } },
        { d: 5.4, who: T.n, cap: T.lines[3], cam: [0, 1.0, 0, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
          S[T.scene](ctx, w, h, t, st, dt);
          H.godRays(ctx, w * .5, -h * .1, w, h, t, '255,230,170', 14, .05);
          H.flag(ctx, w * .5, h * (.86 - Math.min(1, p * 1.6) * .42), w * .16, w * .1, t, true);
          for (let i = 0; i < 7; i++) FIG.draw(ctx, w * (.12 + i * .127), h * .92, h * .3, p > .5 ? P.salute : P.stand, { color: '#4c5634', helmet: '#3a4028', facing: i < 3.5 ? 1 : -1, skin: '#a8754e' });
          if (p > .5 && !st.f) { st.f = 1; SFX.fanfare(); }
          if (p > .5 && Math.random() < .3) fx.sparks(Math.random() * w, Math.random() * h * .5, 5, ['255,220,120', '255,255,255', '60,200,120'][Math.random() * 3 | 0]);
        } },
      ];
    });
  }

  function open(fromWhere) {
    SFX.unlock && SFX.unlock(); SFX.click();
    back = fromWhere || null;
    if (window.GAME && GAME.bg) GAME.bg.pause();
    ensureOrders();
    const nx = nextMission(); ti = nx ? nx[0] : Math.max(0, THEATRES.findIndex((t, i) => !tUnlocked(i + 1)));
    if (ti < 0) ti = THEATRES.length - 1;
    $('ops').hidden = false; runner.start(); renderMap();
    lastCrates = { field: O.crates.field, gold: O.crates.gold };
    // squad pay while you were away: up to 8 hours, more with a bigger squad and a higher level
    const now = Date.now(), away = O.lastVisit ? (now - O.lastVisit) / 36e5 : 0; O.lastVisit = now; save();
    if (away >= 1 && O.lvl >= 2) {
      const hrs = Math.min(8, away), squad = Object.keys(O.cards).length, pay = Math.round(hrs * (8 + O.lvl * 2) * (1 + squad * .05));
      O.sup += pay; save(); renderHud();
      setTimeout(() => bannerFx(`+${pay} ⛁`, `While you were away (${hrs >= 8 ? '8+' : Math.floor(hrs)} hours), your squad of ${squad || 'recruits'} ran patrols and drew pay. Up to 8 hours are paid, so come back often.`), 500);
    }
    if (!O.tut) { O.tut = 1; save(); setTimeout(() => { if (!$('ops').hidden) toast('Tap the glowing mission to start. Win to unlock the next!'); }, 600); }
  }
  function close() { SFX.click(); O.lastVisit = Date.now(); save(); closeBrief(); $('ops').hidden = true; runner.stop(); if (window.GAME && GAME.bg) GAME.bg.resume(); document.dispatchEvent(new Event('ops-closed')); }
  function quick() { open(); const nx = nextMission(); if (nx) brief(nx[0], nx[1]); }

  function init() {
    regNpcs(); inject(); buildCuts(); ensureOrders(); renderHud();
    document.querySelectorAll('[data-open-ops]').forEach(b => b.onclick = () => open());
    document.querySelectorAll('[data-quick-ops]').forEach(b => b.onclick = () => quick());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { bonus, buddy, afterMission, rewardHtml, track, recordStand, open, close, quick, get O() { return O; }, THEATRES, SQ, GEAR, get isOpen() { return $('ops') && !$('ops').hidden; }, closeTop() { if (!$('crate').hidden) return true; if (!$('opsBrief').hidden) { closeBrief(); return true; } if (!$('ops').hidden) { close(); return true; } return false; } };
})();

// make the module reachable as window.X too (top-level const is not a window property)
 window.OPS = OPS;
