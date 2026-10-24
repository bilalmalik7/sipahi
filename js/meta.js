// Progress that survives between lives: Merit Stars, perks, achievements, mission records,
// daily reward streak and settings. Stored separately from the current life's save.
const META = (() => {
  const KEY = 'sss_meta_v1';
  const def = () => ({ stars: 0, totalStars: 0, perks: {}, ach: {}, best: {}, plays: {}, daily: { last: '', streak: 0 }, lives: 0, settings: { speed: 'normal', auto: false, shake: true } });
  let M = def();
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) M = Object.assign(def(), s, { settings: Object.assign(def().settings, s.settings || {}) }); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(M)); } catch (e) {} };
  const listeners = [];
  const changed = () => { save(); listeners.forEach(f => { try { f(M); } catch (e) {} }); };

  // ---------- perks ----------
  const PERKS = [
    { id: 'marksman', ic: '◎', n: 'Marksman', d: lv => `Targets stay up ${lv * 12}% longer, steadier sniper scope, +${lv * 8}% hit chance in assaults.` },
    { id: 'commando', ic: '⚔', n: 'Commando', d: lv => `Wider counter window in fights, ${lv * 10}% faster when moving unseen.` },
    { id: 'iron', ic: '♥', n: 'Iron Body', d: lv => `+${lv * 15} health in assaults, +${lv} health recovered every year.` },
    { id: 'tactician', ic: '♞', n: 'Tactician', d: lv => `+${lv * 10}s on ciphers and bomb timers, +${lv * 2}s per command decision.` },
    { id: 'silver', ic: '✦', n: 'Silver Tongue', d: lv => `+${lv * 3} Leadership and +${lv * 2} Honour at the start of each life; opens persuasive answers.` },
    { id: 'staff', ic: '★', n: 'Staff Officer', d: lv => `+${lv * 2} Performance every year in uniform; promotion boards look kindly on you.` },
  ];
  const cost = lv => [20, 45, 90][lv] ?? Infinity;
  const perk = id => M.perks[id] || 0;
  function buyPerk(id) { const lv = perk(id); const c = cost(lv); if (lv >= 3 || M.stars < c) return false; M.stars -= c; M.perks[id] = lv + 1; changed(); return true; }

  // ---------- achievements ----------
  const ACH = [
    ['first_blood', 'Behind the Banyan Tree', 'Win your first fight.', 5],
    ['issb', 'Recommended', 'Pass the ISSB.', 5],
    ['commission', 'Pips on the Shoulder', 'Be commissioned as an officer.', 10],
    ['sword', 'Sword of Honour', 'Graduate as the best cadet of your course.', 20],
    ['ssg', 'Maroon Beret', 'Pass SSG selection.', 15],
    ['married', 'Two Careers, One Home', 'Marry Ayesha.', 10],
    ['family', 'Full House', 'Raise two children.', 10],
    ['major', 'Crescent and Star', 'Reach the rank of Major.', 10],
    ['colonel', 'Full Colonel', 'Reach the rank of Colonel.', 15],
    ['general', 'Two Stars', 'Become a Major General.', 20],
    ['chief', 'Sipahsalar', 'Become Chief of the Army Staff.', 50],
    ['medals5', 'Chest of Colour', 'Earn five medals in one life.', 15],
    ['jurat', 'Sitara-e-Jurat', 'Earn the gallantry award for the Neelum rescue.', 20],
    ['incorruptible', 'Incorruptible', 'Finish a life with Honour of 90 or more.', 25],
    ['mole', 'Mole Hunter', 'Unmask the mole in the Directorate.', 10],
    ['shikari', 'The Hunter Hunted', 'Bring Shikari in alive.', 20],
    ['coup', 'Guardian of the Constitution', 'Stop the coup.', 25],
    ['iron_chair', 'The Iron Chair', 'See the martial-law ending.', 10],
    ['civvy', 'The Road Not Taken', 'See a civilian ending.', 5],
    ['wins10', 'Seasoned', 'Win 10 missions in one life.', 10],
    ['wins25', 'Veteran', 'Win 25 missions in one life.', 20],
    ['three_star', 'Flawless', 'Earn three stars on any mission.', 5],
    ['three_star10', 'Perfectionist', 'Earn three stars on 10 different missions.', 25],
    ['trainer', 'Range Rat', 'Play 15 Training Ground drills.', 10],
    ['assault', 'Point Man', 'Clear an assault mission without losing half your health.', 15],
    ['streak3', 'Regular', 'Collect the daily ration three days in a row.', 10],
    ['streak7', 'Old Soldier', 'Collect the daily ration seven days in a row.', 25],
    ['second_life', 'Born Again', 'Start a second life.', 5],
    ['perk_max', 'Specialist', 'Raise any perk to level 3.', 15],
    ['all_endings', 'Historian', 'See five different endings.', 40],
    ['ops_kakul', 'Field Commission', 'Clear the Kakul theatre in Operations.', 10],
    ['ops_siachen', 'Top of the World', 'Clear Siachen in Operations.', 15],
    ['ops_loc', 'Line Holder', 'Clear the Line of Control in Operations.', 15],
    ['ops_frontier', 'Mountain Lion', 'Clear the Frontier in Operations.', 20],
    ['ops_karachi', 'City Guardian', 'Clear Karachi in Operations.', 20],
    ['ops_desert', 'Desert Fox', 'Clear Balochistan in Operations.', 25],
    ['ops_final', 'The Hunter Caught', 'Win Operation Sipahsalar.', 40],
    ['ops_all', 'Legend of the Army', 'Clear every Operations theatre.', 50],
    ['lvl10', 'Seasoned Officer', 'Reach Service Level 10.', 15],
    ['lvl25', 'Old Warhorse', 'Reach Service Level 25.', 30],
    ['squad8', 'Band of Brothers', 'Recruit 8 squad members.', 15],
    ['legend', 'Legend in the Ranks', 'Recruit a Legendary soldier.', 20],
    ['stand10', 'The Last Stand', 'Hold 10 waves in Last Stand.', 20],
    ['gearmax', 'Fully Kitted', 'Upgrade any gear to its top level.', 15],
    ['globetrotter', 'Globetrotter', 'Complete three foreign courses or postings in one life.', 20],
  ];
  const achById = Object.fromEntries(ACH.map(a => [a[0], a]));
  let toastFn = null;
  function unlock(id) {
    if (M.ach[id] || !achById[id]) return;
    M.ach[id] = Date.now(); M.stars += achById[id][3]; M.totalStars += achById[id][3]; changed();
    toastFn && toastFn(achById[id]);
  }
  function check(S, endingId) {
    if (!S) return;
    if (S.wins >= 1) unlock('first_blood');
    if (S.rank >= 1) unlock('issb');
    if (S.rank >= 2) unlock('commission');
    if (S.flags.swordOfHonour) unlock('sword');
    if (S.flags.ssg) unlock('ssg');
    if (S.wife) unlock('married');
    if (S.kids.length >= 2) unlock('family');
    if (S.rank >= 5) unlock('major');
    if (S.rank >= 7) unlock('colonel');
    if (S.rank >= 9) unlock('general');
    if (S.rank >= 11) unlock('chief');
    if (S.medals.length >= 5) unlock('medals5');
    if (S.medals.some(m => m.n === 'Sitara-e-Jurat')) unlock('jurat');
    if (S.vars.karachi >= 3 && !S.flags.wrongMole && S.seen['29-The mole']) unlock('mole');
    if (S.flags.khattakTrial) unlock('shikari');
    if (S.flags.reportedCoup || S.flags.turned) unlock('coup');
    if (S.wins >= 10) unlock('wins10');
    if (S.wins >= 25) unlock('wins25');
    if (Object.values(M.perks).some(v => v >= 3)) unlock('perk_max');
    if (endingId) {
      M.endings = M.endings || {}; M.endings[endingId] = 1; save();
      if (S.honor >= 90) unlock('incorruptible');
      if (endingId === 'junta') unlock('iron_chair');
      if (endingId === 'civilian' || endingId === 'civilian2') unlock('civvy');
      if (Object.keys(M.endings).length >= 5) unlock('all_endings');
    }
  }

  // ---------- missions ----------
  function recordMission(key, stars) {
    M.plays[key] = (M.plays[key] || 0) + 1;
    const prev = M.best[key] || 0;
    let earned = 0;
    if (stars > prev) { earned = stars - prev; M.best[key] = stars; }
    earned += stars > 0 ? 1 : 0; // a star for every success, extra for new bests
    M.stars += earned; M.totalStars += earned;
    changed();
    if (stars >= 3) unlock('three_star');
    if (Object.values(M.best).filter(v => v >= 3).length >= 10) unlock('three_star10');
    return earned;
  }

  // ---------- daily ration ----------
  function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function dailyAvailable() { return M.daily.last !== today(); }
  function claimDaily() {
    if (!dailyAvailable()) return 0;
    const y = new Date(Date.now() - 864e5); const yesterday = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    M.daily.streak = M.daily.last === yesterday ? M.daily.streak + 1 : 1;
    M.daily.last = today();
    const reward = Math.min(30, 5 + M.daily.streak * 3);
    M.stars += reward; M.totalStars += reward; changed();
    if (M.daily.streak >= 3) unlock('streak3');
    if (M.daily.streak >= 7) unlock('streak7');
    return reward;
  }

  return {
    get M() { return M; }, PERKS, ACH, cost, perk, buyPerk, unlock, check, recordMission, dailyAvailable, claimDaily,
    onChange(f) { listeners.push(f); }, onAchievement(f) { toastFn = f; },
    newLife() { M.lives++; if (M.lives >= 2) unlock('second_life'); changed(); },
    trained() { M.trainings = (M.trainings || 0) + 1; if (M.trainings >= 15) unlock('trainer'); changed(); },
    setSetting(k, v) { M.settings[k] = v; changed(); },
    get settings() { return M.settings; },
  };
})();
