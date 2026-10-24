// Life engine: state, year loop, story interpreter, promotions, activities, family, save and endings.
(() => {
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const SAVE_KEY = 'sss_save_v1';

  const RANKS = [
    { n: 'Student', s: 'Student', need: 0, pay: 0 },
    { n: 'Gentleman Cadet', s: 'GC', need: 0, pay: 60 },
    { n: 'Second Lieutenant', s: '2/Lt', need: 0, pay: 1300 },
    { n: 'Lieutenant', s: 'Lt', need: 38, pay: 1500 },
    { n: 'Captain', s: 'Capt', need: 44, pay: 1900 },
    { n: 'Major', s: 'Maj', need: 49, pay: 2500 },
    { n: 'Lieutenant Colonel', s: 'Lt Col', need: 53, pay: 3200 },
    { n: 'Colonel', s: 'Col', need: 56, pay: 3800 },
    { n: 'Brigadier', s: 'Brig', need: 59, pay: 4500 },
    { n: 'Major General', s: 'Maj Gen', need: 62, pay: 5400 },
    { n: 'Lieutenant General', s: 'Lt Gen', need: 65, pay: 6500 },
    { n: 'General', s: 'Gen', need: 68, pay: 8000 },
  ];
  const STATS = [
    ['health', 'Health', '#4fc27a'], ['happy', 'Happiness', '#e8c53a'], ['intellect', 'Intellect', '#5aa0c8'], ['fitness', 'Fitness', '#d98a3c'],
    ['courage', 'Courage', '#d04a33'], ['honor', 'Honour', '#efe9d6'], ['leadership', 'Leadership', '#b08ad8'], ['perf', 'Performance', '#22a95f'],
  ];
  const STAT_NAMES = Object.fromEntries(STATS.map(s => [s[0], s[1]]));
  STAT_NAMES.money = 'Rs'; STAT_NAMES.rel = 'Bond';

  let S = null;            // the life
  let busy = false;
  let lifeBG = null, storyBG = null, titleBG = null;

  // ---------------- state ----------------
  function newLife(name, town, skin, hair) {
    return {
      v: 1, name, town, skin, hair, age: 16, year: 2026, rank: 0, ap: 3,
      health: 82, happy: 70, intellect: 34, fitness: 32, courage: 28, honor: 55, leadership: 18, perf: 50,
      money: 15, passed: 0, pending: null, medals: [], flags: {}, vars: {}, log: [], history: [], seen: {}, ended: null,
      rels: {
        abba: { name: 'Abba', role: 'Father', v: 72, alive: true, npc: 'abba' },
        ammi: { name: 'Ammi', role: 'Mother', v: 84, alive: true, npc: 'ammi' },
        zainab: { name: 'Zainab', role: 'Younger sister', v: 70, alive: true, npc: 'zainab' },
      },
      over: {}, kills: 0, missions: 0, wins: 0, regiment: 'Frontier Force Regiment', wife: null, kids: [],
    };
  }
  const first = () => S.name.split(' ')[0];
  const last = () => S.name.split(' ').slice(-1)[0];
  // Autosave. While a story scene is playing the save stays at the scene's start (a checkpoint), so
  // closing the app mid-scene replays that scene on Continue instead of losing or doubling it.
  let lastSaveNote = 0;
  function save(force) {
    if (!S || (S.cur && !force)) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { return; }
    const now = Date.now(), el = document.getElementById('savedNote');
    if (el && now - lastSaveNote > 4000 && !$('life').hidden) { lastSaveNote = now; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
  }
  function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
  function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  // ---------------- looks ----------------
  function playerLook(mood) {
    const r = S.rank, o = S.over;
    let outfit = r === 0 ? 'student' : r === 1 ? 'cadet' : (r >= 9 ? 'dress' : 'combat');
    if (outfit === 'combat' && S.flags.ssg) outfit = 'ssg';
    if (o.outfit) outfit = o.outfit;
    let hat = r === 0 ? 'none' : r === 1 ? 'beret' : r >= 9 ? 'gencap' : 'beret';
    if (o.hat) hat = o.hat;
    if (outfit === 'kurta' || outfit === 'suit' || outfit === 'sherwani' || outfit === 'student') hat = o.hat || 'none';
    return {
      outfit, hat, rank: r, mood: mood || 'neutral', skin: S.skin, hair: S.hair, age: S.age,
      beretC: S.flags.ssg ? '#6e1526' : (r === 1 ? '#1a1a1a' : '#1f2a1c'),
      moustache: S.age >= 23 && !S.flags.cleanShaven, gray: clamp((S.age - 38) / 24, 0, .9), medals: S.medals.map(m => m.c),
      tape: last(), vest: !!o.vest, lightSide, color: o.color, scar: !!S.flags.scar, glasses: S.age >= 52, waistcoat: o.waistcoat,
    };
  }

  // ---------------- scene lighting on characters ----------------
  let lightSide = 1;
  function applyLight(container, scene) {
    const L = (SCENES.LIGHT || {})[scene]; if (!L || !container) return;
    container.style.setProperty('--cf', `${L[0]} drop-shadow(${L[2] * 2.4}px -1px 1.6px rgba(${L[1]},.5))`);
    return L[2];
  }

  // ---------------- UI: life screen ----------------
  function fmtMoney(k) { const r = k * 1000; if (Math.abs(r) >= 1e7) return 'Rs ' + (r / 1e7).toFixed(1) + ' crore'; if (Math.abs(r) >= 1e5) return 'Rs ' + (r / 1e5).toFixed(1) + ' lakh'; return 'Rs ' + Math.round(r).toLocaleString(); }
  // money rolls to its new value, green when it rises and red when it falls
  let shownMoney = null, moneyRaf = 0;
  function rollMoney(to) {
    const el = $('hudMoney');
    if (shownMoney === null || Math.abs(to - shownMoney) < 1) { shownMoney = to; el.textContent = fmtMoney(to); return; }
    const from = shownMoney, t0 = performance.now(); el.classList.remove('rise', 'fall'); void el.offsetWidth; el.classList.add(to > from ? 'rise' : 'fall');
    cancelAnimationFrame(moneyRaf);
    const step = now => { const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); shownMoney = from + (to - from) * e; el.textContent = fmtMoney(Math.round(shownMoney)); if (k < 1) moneyRaf = requestAnimationFrame(step); else shownMoney = to; };
    moneyRaf = requestAnimationFrame(step);
  }
  function renderHUD() {
    $('hudName').textContent = S.name;
    $('hudRank').textContent = RANKS[S.rank].n;
    $('hudPlace').textContent = S.flags.ssg ? 'SSG · ' + S.town : (S.rank >= 2 ? S.regiment : S.town);
    $('hudAge').textContent = S.age;
    rollMoney(S.money);
    $('insigniaBig').innerHTML = CHAR.insigniaBadge(S.rank) + `<span>${RANKS[S.rank].s}</span>`;
  }
  let lastStats = {};
  function renderStats() {
    $('stats').innerHTML = STATS.map(([k, label, c]) => {
      const v = clamp(Math.round(S[k]), 0, 100), chg = lastStats[k] !== undefined && lastStats[k] !== v ? (v > lastStats[k] ? ' up' : ' down') : ''; lastStats[k] = v;
      const col = k === 'health' || k === 'happy' ? (v < 30 ? '#d04a33' : v < 55 ? '#e8c53a' : c) : c;
      return `<div class="stat${chg}" data-k="${k}"><span>${label}</span><div class="bar"><i style="width:${v}%;background:${col}"></i></div><b>${v}</b></div>`;
    }).join('');
  }
  function renderLog() {
    const L = $('log');
    const byAge = {};
    S.log.forEach(e => { (byAge[e.age] = byAge[e.age] || []).push(e); });
    L.innerHTML = Object.keys(byAge).sort((a, b) => a - b).map(a => `<div class="log-year"><h4>Age ${a} &middot; ${S.year - S.age + +a}</h4>${byAge[a].map(e => `<p class="${e.k || ''}">${e.t}</p>`).join('')}</div>`).join('');
    L.scrollTop = L.scrollHeight;
  }
  function renderLifeChar() { CHAR.render($('lifeChar'), playerLook(S.happy < 35 ? 'sad' : S.happy > 75 ? 'happy' : 'neutral')); }
  // the life-screen character shifts stance now and then and reacts to good or bad news
  setInterval(() => {
    const el = $('lifeChar'); if (!el || $('life').hidden || Math.random() < .4) return;
    el.classList.remove('pose-cross', 'pose-hips'); const r = Math.random();
    if (r < .35) el.classList.add('pose-cross'); else if (r < .6) el.classList.add('pose-hips');
  }, 4800);
  let lifeMood = 0, lifeMoodT = 0;
  function lifeReact(delta) {
    lifeMood += delta; clearTimeout(lifeMoodT);
    lifeMoodT = setTimeout(() => {
      const el = $('lifeChar'); if (!el || $('life').hidden || !lifeMood) { lifeMood = 0; return; }
      const cls = lifeMood > 0 ? 'react-happy' : 'react-sad'; lifeMood = 0;
      el.classList.remove('react-happy', 'react-sad'); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 950);
    }, 120);
  }
  function lifeScene() {
    if (S.vars.scene) return S.vars.scene;
    const r = S.rank;
    if (r === 0) return 'village'; if (r === 1) return 'pma'; return 'barracks';
  }
  function renderAll() { const sc = lifeScene(); lightSide = applyLight($('lifeStage'), sc) || 1; renderHUD(); renderStats(); renderLog(); renderLifeChar(); lifeBG && lifeBG.set(sc); $('btnAge').classList.toggle('pulse', S.ap <= 0); }
  function log(t, k) { S.log.push({ age: S.age, t: interp(t), k }); if (S.log.length > 600) S.log.shift(); }

  // ---------------- floaters / toasts ----------------
  // stat changes rise in a single column so they never overlap; a burst is staggered
  let floatAt = 0;
  function floater(txt, up) {
    const now = performance.now(), delay = Math.max(0, floatAt - now);
    floatAt = now + delay + 180;
    setTimeout(() => {
      let col = $('floaters').querySelector('.floatcol');
      if (!col) { col = document.createElement('div'); col.className = 'floatcol'; $('floaters').appendChild(col); }
      const f = document.createElement('div'); f.className = 'floater ' + (up ? 'up' : 'down'); f.textContent = txt;
      col.appendChild(f); setTimeout(() => f.remove(), 1900);
    }, delay);
  }
  const signed = n => (n > 0 ? '+' : '−') + Math.abs(n);
  function toast(txt) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = txt; ($('story').hidden ? $('floaters') : $('toastZone')).appendChild(t); if ($('story').hidden) { t.style.position = 'absolute'; t.style.right = '16px'; t.style.top = '70px'; } setTimeout(() => t.remove(), 3300); }

  // ---------------- effects ----------------
  function applyFx(str, quiet) {
    if (!str) return;
    str.trim().split(/\s+/).forEach(tok => {
      let m;
      if ((m = tok.match(/^flag:(!?)(\w+)$/))) { if (m[1]) delete S.flags[m[2]]; else S.flags[m[2]] = true; return; }
      if ((m = tok.match(/^rel\.(\w+)([+-]\d+)$/))) { const r = S.rels[m[1]]; if (r) { r.v = clamp(r.v + +m[2], 0, 100); if (!quiet) floater(`${signed(+m[2])} ${r.name}`, +m[2] > 0); } return; }
      if ((m = tok.match(/^var\.(\w+)([+-]\d+)$/))) { S.vars[m[1]] = (S.vars[m[1]] || 0) + +m[2]; return; }
      if ((m = tok.match(/^(\w+)([+-]\d+)$/))) {
        const k = m[1], d = +m[2];
        if (k === 'money') { S.money += d; if (!quiet) floater(`${d > 0 ? '+' : '-'}${fmtMoney(Math.abs(d))}`, d > 0); return; }
        if (S[k] === undefined) return;
        S[k] = clamp(S[k] + d, 0, 100);
        if (!quiet) { floater(`${signed(d)} ${STAT_NAMES[k] || k}`, d > 0); lifeReact(d > 0 ? 1 : -1); }
      }
    });
    if (!$('life').hidden) { renderStats(); renderHUD(); }
  }

  // ---------------- expressions & text ----------------
  function ctxObj() {
    const rel = {}; for (const k in S.rels) rel[k] = S.rels[k].alive ? S.rels[k].v : -1;
    return { health: S.health, happy: S.happy, intellect: S.intellect, fitness: S.fitness, courage: S.courage, honor: S.honor, leadership: S.leadership, perf: S.perf, money: S.money, age: S.age, rank: S.rank, flag: S.flags, rel, win: !!S.vars.lastWin, married: !!S.wife, kids: S.kids.length, v: S.vars, wins: S.wins, missions: S.missions, perk: META.M.perks };
  }
  function evalC(expr) {
    try { return !!(new Function('c', 'with (c) { return (' + expr + '); }'))(ctxObj()); } catch (e) { console.warn('bad cond', expr, e); return false; }
  }
  function interp(t) {
    if (!S || !t) return t;
    return t.replace(/\{(\w+)\}/g, (m, k) => {
      switch (k) {
        case 'name': return S.name; case 'first': return first(); case 'last': return last(); case 'town': return S.town;
        case 'rank': return RANKS[S.rank].n; case 'rankS': return RANKS[S.rank].s; case 'regiment': return S.regiment;
        case 'wife': return S.wife || 'Ayesha'; case 'child': return S.kids[0] ? S.kids[0].name : 'the baby'; case 'child2': return S.kids[1] ? S.kids[1].name : '';
        case 'year': return S.year; case 'age': return S.age; case 'sir': return S.rank >= 2 ? 'Sir' : first();
        default: return m;
      }
    });
  }

  // ---------------- story parser ----------------
  const EVENTS = {}; // age -> [event]
  function parseStory(src) {
    const blocks = src.split(/^===\s*/m).slice(1);
    blocks.forEach(b => {
      const lines = b.split('\n');
      const head = lines.shift().split('|').map(s => s.trim());
      const age = +head[0].replace(/AGE\s*/i, '');
      const ev = { age, bg: head[1] || 'village', title: head[2] || '', cond: null, nodes: [], labels: {}, id: '' };
      head.slice(3).forEach(h => { if (h.startsWith('if:')) ev.cond = h.slice(3).trim(); if (h.startsWith('id:')) ev.id = h.slice(3).trim(); });
      ev.id = ev.id || `${age}-${ev.title || ev.bg}`;
      let i = 0;
      while (i < lines.length) {
        let line = lines[i].trim(); i++;
        if (!line || line.startsWith('//')) continue;
        if (line.startsWith(':')) { ev.labels[line.slice(1).trim()] = ev.nodes.length; continue; }
        if (line.startsWith('@')) {
          const sp = line.indexOf(' ');
          const cmd = sp < 0 ? line.slice(1) : line.slice(1, sp), arg = sp < 0 ? '' : line.slice(sp + 1).trim();
          ev.nodes.push({ t: 'cmd', cmd, arg }); continue;
        }
        if (line.startsWith('?')) {
          let pr = line.slice(1).trim(), timer = 0;
          const tm = pr.match(/^!(\d+)\s*/); if (tm) { timer = +tm[1]; pr = pr.slice(tm[0].length); }
          const node = { t: 'choice', prompt: pr, opts: [], timer };
          while (i < lines.length && lines[i].trim().startsWith('- ')) {
            let o = lines[i].trim().slice(2); i++;
            const opt = { cond: null, fx: '', go: null, text: '' };
            let m;
            if ((m = o.match(/^\[([^\]]+)\]\s*/))) { opt.cond = m[1]; o = o.slice(m[0].length); }
            if ((m = o.match(/\s*->\s*(\w+)\s*$/))) { opt.go = m[1]; o = o.slice(0, m.index); }
            if ((m = o.match(/\s*\{([^}]*)\}\s*$/))) { opt.fx = m[1]; o = o.slice(0, m.index); }
            opt.text = o.trim(); node.opts.push(opt);
          }
          ev.nodes.push(node); continue;
        }
        if (line.startsWith('* ')) { ev.nodes.push({ t: 'say', who: '', mood: '', text: line.slice(2), kind: 'narr' }); continue; }
        const m = line.match(/^([A-Za-z][\w .'-]{0,28}?)(?:\((\w+)\))?:\s+(.*)$/);
        if (m) { ev.nodes.push({ t: 'say', who: m[1].trim(), mood: m[2] || '', text: m[3] }); continue; }
        ev.nodes.push({ t: 'say', who: '', mood: '', text: line, kind: 'narr' });
      }
      (EVENTS[age] = EVENTS[age] || []).push(ev);
    });
  }

  // ---------------- story overlay ----------------
  const NPC = window.NPCS || {};
  let curNpc = null;
  function heroEl() { return $('storyChar'); }
  function showHero(mood) { CHAR.render(heroEl(), playerLook(mood)); }
  function setHeroMood(mood) { CHAR.setMood(heroEl(), playerLook(mood), mood); }
  function npcLook(id, mood) {
    const d = NPC[id]; if (!d) return null;
    const base = typeof d.look === 'function' ? d.look(S) : d.look;
    return Object.assign({}, base, { mood: mood || 'neutral', lightSide });
  }
  function showNpc(id, mood) {
    const el = $('storyNpc');
    if (!id || !NPC[id]) { el.classList.remove('show'); $('story').classList.remove('with-npc'); curNpc = null; return; }
    if (curNpc !== id) { CHAR.render(el, npcLook(id, mood)); curNpc = id; el.classList.remove('walkin', 'slump', 'proud', 'pose-cross', 'pose-hips'); delete el.dataset.lastMood; void el.offsetWidth; el.classList.add('walkin'); }
    else CHAR.setMood(el, npcLook(id, mood), mood || 'neutral');
    el.classList.add('show'); $('story').classList.add('with-npc');
  }
  function npcIdFor(who) {
    const k = who.toLowerCase().replace(/[^a-z]/g, '');
    if (NPC[k]) return k;
    for (const id in NPC) { const n = typeof NPC[id].name === 'function' ? NPC[id].name(S) : NPC[id].name; if (n && n.toLowerCase().replace(/[^a-z]/g, '') === k) return id; }
    return null;
  }
  function openStory(bg, place) {
    $('story').hidden = false; S.over = {};
    $('story').classList.remove('reveal'); void $('story').offsetWidth; $('story').classList.add('reveal');
    storyBG.set(bg); storyBG.start(); lifeBG.stop(); lightSide = applyLight($('story'), bg) || 1;
    $('storyPlace').textContent = place || SCENES.LABELS[bg] || '';
    showNpc(null); showHero('neutral');
    const he = heroEl(); he.classList.remove('enter', 'walkin', 'slump', 'proud', 'pose-cross', 'pose-hips'); void he.offsetWidth; he.classList.add('walkin');
    $('dialog').classList.add('hidden');
    // idle body language: now and then change stance while nobody is talking
    clearInterval(idleT);
    idleT = setInterval(() => {
      [heroEl(), $('storyNpc')].forEach((el, i) => {
        if (!el || el.classList.contains('talking') || el.classList.contains('saluting') || Math.random() < .45) return;
        const female = i === 1 && curNpc && /ayesha|ammi|zainab|nadia|rabia|nida|nwosu|gulmother|daughter/.test(curNpc);
        el.classList.remove('pose-cross', 'pose-hips');
        const r = Math.random(); if (r < .4) el.classList.add(female ? 'pose-hips' : 'pose-cross'); else if (r < .7 && !female) el.classList.add('pose-hips');
      });
    }, 5200);
  }
  let idleT = 0;
  const EMOTE = { happy: ['♥', 'heart'], angry: ['✶', 'anger'], surprised: ['!', 'shock'], sad: ['…', 'sweat'], determined: ['!', 'idea'] };
  function react(el, mood) {
    if (!el || !mood || el.dataset.lastMood === mood) return;
    el.dataset.lastMood = mood;
    el.classList.remove('react-happy', 'react-angry', 'react-shock', 'react-sad', 'slump', 'proud');
    void el.offsetWidth;
    const cls = { happy: 'react-happy', angry: 'react-angry', surprised: 'react-shock', sad: 'react-sad' }[mood];
    if (cls) { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 950); }
    if (mood === 'sad') setTimeout(() => el.classList.add('slump'), 900);
    if (mood === 'determined') el.classList.add('proud');
    const e = EMOTE[mood];
    if (e && Math.random() < .7) {
      const r = el.getBoundingClientRect(), rr = $('story').getBoundingClientRect();
      const em = document.createElement('div'); em.className = 'emote ' + e[1]; em.textContent = e[0];
      em.style.left = (r.left - rr.left + r.width * .66) + 'px'; em.style.top = (r.top - rr.top + r.height * .04) + 'px';
      $('story').appendChild(em); setTimeout(() => em.remove(), 1700);
    }
  }
  function chapter(ev) {
    return new Promise(res => {
      const c = document.createElement('div'); c.className = 'chapter';
      c.innerHTML = `<small>${interp(ev.place || SCENES.LABELS[ev.bg] || '')}</small><b>${interp(ev.title)}</b><span>Age ${S.age} &middot; ${S.year}</span>`;
      let done = false; const end = () => { if (done) return; done = true; c.remove(); res(); };
      c.onclick = end; $('story').appendChild(c); SFX.whoosh(); setTimeout(end, 2900);
    });
  }
  function tease(text) {
    const t = document.createElement('div'); t.className = 'tease'; t.innerHTML = `<small>Coming up</small><p>${interp(text)}</p>`;
    $('story').appendChild(t); setTimeout(() => t.remove(), 4000);
  }
  function closeStory() { clearInterval(idleT); $('story').hidden = true; storyBG.stop(); lifeBG.start(); S.over = {}; SFX.stopPad(); }

  let advance = null;
  function bindAdvance() {
    const go = e => { if (e && e.target && e.target.closest && e.target.closest('.choice')) return; if (advance) advance(); };
    $('dialog').addEventListener('click', go);
    $('story').addEventListener('click', e => { if (e.target === $('storyCanvas') || e.target.closest('.char')) go(e); });
    window.addEventListener('keydown', e => {
      if ($('story').hidden || !$('game').hidden || !$('cut').hidden) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(); }
      if (/^[1-9]$/.test(e.key)) { const b = $('choices').querySelectorAll('.choice:not(.locked)')[+e.key - 1]; if (b) b.click(); }
    });
  }
  function say(who, mood, text, kind) {
    return new Promise(res => {
      const D = $('dialog'), sp = $('speaker'), ln = $('line');
      if (D.classList.contains('hidden')) { D.classList.remove('dlg-in'); void D.offsetWidth; D.classList.add('dlg-in'); }
      D.classList.remove('hidden'); $('choices').innerHTML = ''; $('tapHint').hidden = false;
      text = interp(text);
      let isMe = /^(me|you)$/i.test(who) && who !== '';
      const npcId = !isMe && who ? npcIdFor(who) : null;
      sp.className = 'speaker' + (isMe ? ' me' : !who ? ' narr' : '');
      ln.className = 'line' + (kind === 'narr' ? ' narr' : '') + (/^radio/i.test(who) ? ' radio' : '');
      sp.textContent = isMe ? first() : who ? (npcId ? (typeof NPC[npcId].name === 'function' ? NPC[npcId].name(S) : NPC[npcId].name) : interp(who)) : '';
      if (npcId) { showNpc(npcId, mood); }
      const hero = heroEl(), npcEl = $('storyNpc');
      hero.classList.toggle('dim', !!npcId); npcEl.classList.toggle('dim', isMe);
      if (isMe && mood) setHeroMood(mood);
      if (mood) react(isMe ? hero : npcId ? npcEl : null, mood);
      const talker = isMe ? hero : npcId ? npcEl : null;
      if (talker) talker.classList.add('talking', 'speaking');
      [hero, npcEl].forEach(x => { if (x !== talker) x.classList.remove('speaking'); });
      let gT1 = 0, gT2 = 0;
      if (talker && text.length > 60 && !talker.classList.contains('saluting') && Math.random() < .7) {
        gT1 = setTimeout(() => talker.classList.add('gesture'), 350 + Math.random() * 500);
        gT2 = setTimeout(() => talker.classList.remove('gesture'), 2200 + Math.random() * 1200);
      }
      let i = 0, done = false;
      const speed = { slow: 36, normal: 22, fast: 9, instant: 0 }[META.settings.speed] ?? 22;
      ln.textContent = '';
      const iv = setInterval(() => { i += 1; ln.textContent = text.slice(0, i); if (i % 3 === 0) SFX.blip(); if (i >= text.length) finishType(); }, speed);
      function finishType() { clearInterval(iv); ln.textContent = text; done = true; if (talker) talker.classList.remove('talking'); if (META.settings.auto) setTimeout(() => { if (advance === myAdv) advance(); }, 1100 + text.length * 28); }
      const myAdv = () => { if (!done) { finishType(); return; } clearTimeout(gT1); clearTimeout(gT2); if (talker) talker.classList.remove('gesture'); advance = null; SFX.click(); res(); };
      advance = myAdv;
      if (!speed) finishType();
    });
  }
  function choose(prompt, opts, timer = 0) {
    return new Promise(res => {
      let tmr = 0, done = false; const pick = idx => { if (done) return; done = true; clearInterval(tmr); const bar = $('dialog').querySelector('.ctimer'); if (bar) bar.remove(); res(idx); };
      const D = $('dialog'); D.classList.remove('hidden');
      $('speaker').className = 'speaker me'; $('speaker').textContent = prompt ? first() : 'Decide';
      $('line').className = 'line'; $('line').textContent = interp(prompt || 'What do you do?');
      $('tapHint').hidden = true; advance = null;
      heroEl().classList.remove('dim'); $('storyNpc').classList.add('dim');
      const C = $('choices'); C.innerHTML = '';
      let shown = 0;
      opts.forEach((o, idx) => {
        const ok = !o.cond || evalC(o.cond);
        if (!ok && o.cond && /flag\.|rel\.|married|kids|v\./.test(o.cond)) return; // hidden story-gated options
        const b = document.createElement('button'); b.className = 'choice' + (ok ? '' : ' locked'); b.style.animationDelay = (shown * .07) + 's';
        b.innerHTML = `<span>${interp(o.text)}</span>${!ok ? `<small>Needs ${o.cond.replace(/>=/g, ' ').replace(/(\w+)/, s => STAT_NAMES[s] || s)}</small>` : ''}`;
        if (ok) { b.onclick = () => { SFX.choose(); C.innerHTML = ''; pick(idx); }; b.dataset.idx = idx; }
        C.appendChild(b); shown++;
      });
      if (!shown) return pick(0);
      if (timer) {
        // a split-second decision: if the clock runs out, the last option happens by default
        const t0 = performance.now(), bar = document.createElement('div'); bar.className = 'ctimer'; bar.innerHTML = '<i></i><span>DECIDE</span>'; $('dialog').appendChild(bar);
        const total = (timer + META.perk('tactician')) * 1000;
        tmr = setInterval(() => { const k = 1 - (performance.now() - t0) / total; bar.firstChild.style.width = Math.max(0, k * 100) + '%'; if (k < .35) bar.classList.add('hot'); if (Math.floor(k * 20) !== bar._last) { bar._last = Math.floor(k * 20); if (k < .5) SFX.tick(); }
          if (k <= 0) { const bs = [...C.querySelectorAll('.choice:not(.locked)')]; const last = bs[bs.length - 1]; C.innerHTML = ''; SFX.bad(); pick(last ? +last.dataset.idx : 0); } }, 50);
      }
    });
  }
  async function titleCard(a, b) {
    const tc = $('titleCard'); $('tcA').textContent = interp(a); $('tcB').textContent = interp(b || '');
    tc.hidden = false; tc.style.animation = 'none'; void tc.offsetWidth; tc.style.animation = '';
    [$('tcA'), $('tcB')].forEach(e => { e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; });
    await wait(3400); tc.hidden = true;
  }

  // ---------------- promotions ----------------
  function promoScore() { return S.perf * .6 + S.leadership * .2 + S.honor * .2 + META.perk('staff') * 1.5; }
  async function promote(forced, label) {
    const next = S.rank + 1; if (next >= RANKS.length) return true;
    const need = RANKS[next].need, sc = promoScore();
    const ok = forced || (sc >= need && S.honor >= 25 && !S.flags.inquiry);
    $('dialog').classList.add('hidden');
    if (ok) {
      S.rank = next; S.passed = 0; S.pending = null; S.perf = clamp(Math.max(46, S.perf - 14), 0, 100);
      log(`Promoted to ${RANKS[next].n}.`, 'big'); S.history.push({ age: S.age, t: `Promoted to ${RANKS[next].n}` });
      showHero('happy');
      await CUT.play('promotion');
      heroEl().classList.add('glow', 'saluting'); confetti();
      await wait(1400);
      heroEl().classList.remove('saluting', 'glow');
      META.check(S);
      applyFx('happy+8 leadership+3', false);
      return true;
    }
    S.passed++; S.pending = { at: S.age + 2 };
    log(`Passed over for promotion to ${RANKS[next].n}. (Board score ${sc | 0}, needed ${need}.)`, 'bad');
    SFX.sad(); setHeroMood('sad');
    await say('', '', `The promotion board has passed you over for ${RANKS[next].n}. Board score ${sc | 0}; the cut-off was ${need}.${S.flags.inquiry ? ' The open inquiry against you sank your file.' : ''} You can be considered again in two years.`, 'narr');
    applyFx('happy-10', false);
    if (S.passed >= 3) { await say('', '', 'Three times superseded. A letter arrives from Military Secretary\'s Branch thanking you for your service.', 'narr'); await ending('superseded'); }
    return false;
  }
  async function demote(reason) {
    if (S.rank <= 2) return;
    S.rank--; S.perf = clamp(S.perf - 20, 0, 100);
    log(`Reduced in rank to ${RANKS[S.rank].n}: ${reason}`, 'bad'); S.history.push({ age: S.age, t: `Reduced in rank (${reason})` });
    SFX.bad(); showHero('sad');
    await titleCard('REDUCED IN RANK', RANKS[S.rank].n);
  }

  // ---------------- game rewards ----------------
  const GAME_REWARD = {
    shoot: ['courage+3 perf+6', 'perf-3'], fight: ['courage+4 fitness+2 perf+5', 'health-8 perf-3'], obstacle: ['fitness+4 perf+6', 'fitness+1 perf-3'],
    cipher: ['intellect+4 perf+6', 'perf-4'], stealth: ['courage+3 intellect+2 perf+6', 'perf-5'], defuse: ['courage+5 intellect+3 perf+8', 'health-15 perf-6'],
    memory: ['intellect+4 perf+5', 'perf-3'], assault: ['courage+5 leadership+2 perf+9', 'health-12 perf-5'], sniper: ['courage+3 perf+7', 'perf-4'], deduce: ['intellect+5 perf+7', 'perf-5'], quiz: ['intellect+3 leadership+3 perf+6', 'perf-4'],
  };
  async function playGame(type, opts) {
    const o = Object.assign({ courage: S.courage, fitness: S.fitness, intellect: S.intellect, key: `${type}:${opts.title || type}` }, opts);
    $('dialog').classList.add('hidden');
    const r = await GAMES.run(type, o);
    S.vars.lastWin = r.win; S.missions++; if (r.win) S.wins++; META.check(S); renderStars();
    if (r.civilian) { S.flags.civilianShot = true; applyFx('honor-8', true); }
    const rw = GAME_REWARD[type] || ['perf+5', 'perf-3'];
    applyFx(r.win ? rw[0] : rw[1]);
    if (!r.win && S.health <= 0) S.health = 4;
    return r;
  }

  // ---------------- interpreter ----------------
  async function runEvent(ev) {
    S.cur = ev.id; save(true);
    openStory(ev.bg, ev.place);
    if (ev.title && !ev.noChapter) await chapter(ev);
    S.seen[ev.id] = true;
    let pc = 0;
    while (pc < ev.nodes.length && !S.ended) {
      const n = ev.nodes[pc]; pc++;
      if (n.t === 'say') { await say(n.who, n.mood, n.text, n.kind); continue; }
      if (n.t === 'choice') {
        const idx = await choose(n.prompt, n.opts, n.timer);
        const o = n.opts[idx];
        if (o) { applyFx(o.fx); if (o.go) { if (ev.labels[o.go] === undefined) console.warn('missing label', o.go, ev.id); else pc = ev.labels[o.go]; } }
        continue;
      }
      const a = n.arg;
      switch (n.cmd) {
        case 'bg': storyBG.set(a); $('storyPlace').textContent = SCENES.LABELS[a] || ''; lightSide = applyLight($('story'), a) || 1; showHero(); if (curNpc) { const id = curNpc; curNpc = null; showNpc(id); } break;
        case 'place': $('storyPlace').textContent = interp(a); break;
        case 'cut': $('dialog').classList.add('hidden'); await CUT.play(a); break;
        case 'npc': if (a === 'off') showNpc(null); else { const [id, md] = a.split(/\s+/); showNpc(id, md); } break;
        case 'mood': setHeroMood(a); break;
        case 'outfit': S.over.outfit = a === 'auto' ? undefined : a; showHero(); break;
        case 'hat': S.over.hat = a === 'auto' ? undefined : a; showHero(); break;
        case 'vest': S.over.vest = a !== 'off'; showHero(); break;
        case 'fx': applyFx(a); break;
        case 'flag': S.flags[a] = true; break;
        case 'unflag': delete S.flags[a]; break;
        case 'goto': pc = ev.labels[a] ?? pc; break;
        case 'if': { const m = a.match(/^(.*)->\s*(\w+)\s*$/); if (m && evalC(m[1])) pc = ev.labels[m[2]] ?? pc; break; }
        case 'game': { const sp = a.indexOf(' '); const type = sp < 0 ? a : a.slice(0, sp); let opts = {}; if (sp > 0) { try { opts = JSON.parse(a.slice(sp + 1)); } catch (e) { console.warn('bad game opts', a); } } const DC = window.DEDUCE_CASES || {}; if (opts.caseId) opts.case = DC[opts.caseId]; if (opts.quizId) opts.questions = (window.QUIZZES || {})[opts.quizId]; await playGame(type, opts); break; }
        case 'ifwin': if (S.vars.lastWin) pc = ev.labels[a] ?? pc; break;
        case 'iflose': if (!S.vars.lastWin) pc = ev.labels[a] ?? pc; break;
        case 'promote': await promote(false, a); break;
        case 'setrank': { const r = +a; if (r > S.rank) { S.rank = r; S.pending = null; log(`Now: ${RANKS[r].n}.`, 'big'); SFX.fanfare(); showHero('happy'); heroEl().classList.add('saluting', 'glow'); await titleCard(RANKS[r].n.toUpperCase(), r === 1 ? 'Pakistan Military Academy' : 'Commissioned'); heroEl().classList.remove('saluting', 'glow'); } break; }
        case 'demote': await demote(a); break;
        case 'medal': { const [nm, c, why] = a.split('|').map(s => s.trim()); if (!S.medals.find(m => m.n === nm)) { S.medals.push({ n: nm, c: c || '#0b6b3a', why: interp(why || ''), age: S.age }); log(`Awarded: ${nm}.`, 'good'); S.history.push({ age: S.age, t: `Awarded ${nm}` }); SFX.fanfare(); showHero('happy'); await titleCard(nm, 'Awarded'); } break; }
        case 'log': log(a, a.startsWith('!') ? 'big' : ''); break;
        case 'history': S.history.push({ age: S.age, t: interp(a) }); break;
        case 'title': { const [x, y] = a.split('|'); $('dialog').classList.add('hidden'); await titleCard(x.trim(), (y || '').trim()); break; }
        case 'toast': toast(interp(a)); break;
        case 'tease': tease(a); await wait(1200); break;
        case 'react': react(heroEl(), a); break;
        case 'salute': heroEl().classList.add('saluting'); await wait(1600); heroEl().classList.remove('saluting'); break;
        case 'sfx': SFX[a] && SFX[a](); break;
        case 'pad': a === 'off' ? SFX.stopPad() : SFX.pad(a); break;
        case 'meet': { const [id, v] = a.split(/\s+/); const d = NPC[id]; if (d && !S.rels[id]) S.rels[id] = { name: typeof d.name === 'function' ? d.name(S) : d.name, role: d.role || 'Friend', v: +v || 50, alive: true, npc: id }; break; }
        case 'marry': S.wife = a || 'Ayesha'; if (S.rels.ayesha) S.rels.ayesha.role = 'Wife'; log(`Married ${S.wife}.`, 'big'); S.history.push({ age: S.age, t: `Married ${S.wife}` }); break;
        case 'child': { const [nm, g] = a.split(/\s+/); S.kids.push({ name: nm, g: g || 'm', born: S.age }); S.rels['kid' + S.kids.length] = { name: nm, role: g === 'f' ? 'Daughter' : 'Son', v: 90, alive: true, npc: g === 'f' ? 'daughter' : 'son' }; log(`${nm} is born.`, 'good'); S.history.push({ age: S.age, t: `${g === 'f' ? 'Daughter' : 'Son'} ${nm} born` }); break; }
        case 'death': { const r = S.rels[a]; if (r) { r.alive = false; log(`${r.name} passed away.`, 'bad'); S.history.push({ age: S.age, t: `${r.name} passed away` }); } break; }
        case 'money': applyFx('money' + (a.startsWith('-') ? a : '+' + a)); break;
        case 'set': { const [k, v] = a.split(/\s+/); S.vars[k] = isNaN(+v) ? v : +v; break; }
        case 'scene': S.vars.scene = a; break;
        case 'regiment': S.regiment = a; break;
        case 'wait': await wait(+a * 1000); break;
        case 'end': await ending(a); break;
        default: console.warn('unknown cmd', n.cmd);
      }
    }
    closeStory();
    S.cur = null; save();
  }

  // ---------------- random events ----------------
  let artRaf = 0;
  function cardArt(scene, npc, mood) {
    const cv = $('modalArt'); cancelAnimationFrame(artRaf);
    if (!scene) { cv.hidden = true; return; }
    cv.hidden = false; const ctx = cv.getContext('2d'), st = {}, t0 = performance.now();
    const frame = now => {
      if ($('modal').hidden) return;
      const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== (r.width * d | 0)) { cv.width = r.width * d | 0; cv.height = r.height * d | 0; }
      const w = cv.width / d, h = cv.height / d, t = (now - t0) / 1000;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      try { SCENES.S[scene](ctx, w, h, t + 3, st, 1 / 60); if (npc) CUT.portrait(ctx, w, h, t, npc, mood || 'neutral', { x: .5, crop: 'bust', hgt: 1.15, bottom: 1.18, talk: t < 2.2 }); } catch (e) {}
      artRaf = requestAnimationFrame(frame);
    };
    artRaf = requestAnimationFrame(frame);
  }
  function modal(kicker, title, text, buttons, art) {
    return new Promise(res => {
      cardArt(art && art.scene, art && art.npc, art && art.mood);
      $('modalKicker').textContent = kicker; $('modalTitle').textContent = interp(title); $('modalText').textContent = interp(text);
      const B = $('modalBtns'); B.innerHTML = '';
      buttons.forEach((b, i) => {
        const ok = !b.cond || evalC(b.cond);
        const el = document.createElement('button'); el.className = 'btn' + (i === 0 && buttons.length === 1 ? ' primary' : ''); el.textContent = interp(b.t) + (ok ? '' : '  (locked)');
        el.disabled = !ok; el.onclick = () => { SFX.choose(); $('modal').hidden = true; res(i); };
        B.appendChild(el);
      });
      $('modal').hidden = false;
    });
  }
  async function randomEvent() {
    const pool = (window.RANDOM_EVENTS || []).filter(e => (!e.once || !S.seen['r:' + e.id]) && (!e.cond || evalC(e.cond)) && (!S.vars['cool_' + e.id] || S.vars['cool_' + e.id] <= S.age));
    if (!pool.length) return;
    const e = pool[Math.random() * pool.length | 0];
    S.seen['r:' + e.id] = true; S.vars['cool_' + e.id] = S.age + (e.cool || 6);
    const art = { scene: e.scene || (S.rank === 0 ? 'village' : S.rank === 1 ? 'pma' : ['barracks', 'office', 'home', 'cherat'][S.age % 4]), npc: e.npc, mood: e.mood };
    const i = await modal(e.kicker || 'This year', e.title, e.text, e.opts.map(o => ({ t: o.t, cond: o.cond })), art);
    const o = e.opts[i];
    let res = o.res, fx = o.fx;
    if (o.chance !== undefined) { const okc = Math.random() < (typeof o.chance === 'string' ? evalC(o.chance) ? .8 : .35 : o.chance); res = okc ? o.res : (o.failRes || o.res); fx = okc ? o.fx : (o.failFx || ''); }
    applyFx(fx);
    if (o.flag) S.flags[o.flag] = true;
    log(res || o.t, o.k || '');
    if (o.res) await modal('Outcome', e.title, res, [{ t: 'Continue' }], art);
  }

  // ---------------- yearly tick ----------------
  function yearly() {
    S.age++; S.year++; S.ap = 3;
    const pay = RANKS[S.rank].pay;
    if (pay) { S.money += Math.round(pay * .35); }
    yearlyAssets();
    if (S.rank >= 2) S.perf = clamp(S.perf - 3 + META.perk('staff') * 2, 0, 100);
    S.health = clamp(S.health + META.perk('iron'), 0, 100);
    if (S.age < 45 && S.health < 85) S.health = clamp(S.health + ri(3, 6), 0, 85);
    if (S.age >= 42) S.health = clamp(S.health - ri(1, S.age >= 52 ? 4 : 2), 0, 100);
    if (S.age >= 36) S.fitness = clamp(S.fitness - ri(0, 2), 0, 100);
    for (const k in S.rels) { const r = S.rels[k]; if (r.alive) r.v = clamp(r.v - ri(1, 3), 0, 100); }
    const relAvg = Object.values(S.rels).filter(r => r.alive).reduce((a, r, _, A) => a + r.v / A.length, 0);
    S.happy = clamp(S.happy + (relAvg > 65 ? 2 : relAvg < 35 ? -4 : 0) + (S.health < 30 ? -4 : 0), 0, 100);
  }
  async function ageUp() {
    if (busy || S.ended) return;
    busy = true; SFX.unlock(); SFX.whoosh();
    const ab = $('btnAge'); ab.classList.remove('spin'); void ab.offsetWidth; ab.classList.add('spin');
    const lc = $('lifeChar'); lc.classList.remove('walkin'); void lc.offsetWidth; lc.classList.add('walkin');
    try {
      yearly(); yearFlip(); window.OPS && OPS.track('year');
      log(S.age >= 60 ? 'Another year.' : `You are ${S.age}.`);
      renderAll();
      if (grantsDue().length) await grantsCheck();
      if (S.pending && S.age >= S.pending.at && S.rank >= 2 && S.rank < 11) {
        openStory('office', 'Promotion board'); await say('', '', `The promotion board reconvenes to consider your file again for ${RANKS[S.rank + 1].n}.`, 'narr');
        await promote(false, 'Promoted on re-board'); closeStory();
      }
      let ran = 0;
      for (const ev of (EVENTS[S.age] || [])) {
        if (S.ended) break;
        if (S.seen[ev.id] || (ev.cond && !evalC(ev.cond))) continue;
        await runEvent(ev); ran++; META.check(S); renderAll();
      }
      const evs = { length: ran };
      if (!S.ended && S.health <= 0) await ending('illness');
      if (!S.ended && S.health < 28 && !(S.vars.warnedAt >= S.age - 2)) {
        S.vars.warnedAt = S.age;
        await modal('Health warning', 'Your doctor is worried', `Health is down to ${S.health | 0}. If it reaches zero, this life ends. Use Activities: a medical check-up at CMH, PT, or annual leave.`, [{ t: 'Understood' }]);
      }
      if (!S.ended && Math.random() < (evs.length ? .55 : .95)) await randomEvent();
      if (!S.ended && S.age > 16 && Math.random() < .35) await randomEvent();
      if (!S.ended && S.age >= 61) await ending('retire');
    } catch (e) { console.error(e); }
    save(); if (!S.ended) renderAll(); busy = false;
  }

  function yearFlip() {
    const el = document.createElement('div'); el.className = 'yearflip';
    el.innerHTML = `<b>${S.age}</b><span>${S.year}</span>`; $('lifeStage').appendChild(el); setTimeout(() => el.remove(), 1500);
  }
  function confetti(n = 90) {
    const cv = document.createElement('canvas'); cv.className = 'confetti'; $('app').appendChild(cv);
    const d = Math.min(2, window.devicePixelRatio || 1), W = cv.width = innerWidth * d, H = cv.height = innerHeight * d, ctx = cv.getContext('2d');
    const P = Array.from({ length: n }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .45, vx: (Math.random() - .5) * 18 * d, vy: (-8 - Math.random() * 14) * d, r: Math.random() * 6, s: (5 + Math.random() * 6) * d, c: ['#0b6b3a', '#f4f4ef', '#e0a83e', '#22a95f'][Math.random() * 4 | 0] }));
    let f = 0; const tick = () => { ctx.clearRect(0, 0, W, H); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45 * d; p.vx *= .99; p.r += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }); if (++f < 150) requestAnimationFrame(tick); else cv.remove(); };
    tick();
  }
  function renderStars() { document.querySelectorAll('.starchip b').forEach(b => b.textContent = META.M.stars); }
  function achToast(a) {
    const el = document.createElement('div'); el.className = 'achtoast';
    el.innerHTML = `<i>★</i><div><small>Achievement unlocked</small><b>${a[1]}</b><span>${a[2]} &middot; +${a[3]} Merit Stars</span></div>`;
    $('app').appendChild(el); SFX.good(); setTimeout(() => el.remove(), 4200); renderStars();
  }

  // ---------------- meta screens: perks, achievements, training, settings ----------------
  const DRILLS = [
    ['assault', 'Compound assault', { scene: 'valley', enemies: 6, hostages: 1, length: 8, diff: 2, seed: 3, title: 'Compound Assault' }],
    ['assault', 'Night raid', { scene: 'mountain_night', enemies: 8, hostages: 2, length: 10, diff: 3, seed: 9, boss: true, bossName: 'Commander', title: 'Night Raid' }],
    ['assault', 'Urban sweep', { scene: 'street', enemies: 9, hostages: 2, length: 11, diff: 3, seed: 21, title: 'Urban Sweep' }],
    ['fight', 'Sparring: Kakul ring', { foe: 'Senior Fawad', diff: 2, scene: 'ring', foeColor: '#a02020', pColor: '#1f3fa0', pBeret: null, title: 'Kakul Ring' }],
    ['fight', 'Knife defence', { foe: 'Kamran', diff: 4, scene: 'karachi', knife: true, foeColor: '#1a1a24', title: 'Knife Defence' }],
    ['shoot', 'Firing range', { diff: 2, need: 12, total: 18, title: 'Firing Range' }],
    ['shoot', 'Hostage range', { diff: 4, need: 14, total: 20, title: 'Hostage Range' }],
    ['sniper', 'Long range', { diff: 3, scene: 'snowpost', title: 'Long Range' }],
    ['stealth', 'Shadows of Saddar', { diff: 3, scene: 'street', title: 'Shadows of Saddar' }],
    ['obstacle', 'SSG hell week', { count: 9, diff: 3, title: 'Hell Week' }],
    ['cipher', 'Signals intercept', { messages: ['THE EAGLE LANDS AT DAWN', 'SECOND CONVOY IS A DECOY'], time: 80, title: 'Signals Intercept' }],
    ['defuse', 'Bomb disposal', { time: 45, title: 'Bomb Disposal' }],
    ['memory', 'Recon route', { rounds: 4, start: 5, title: 'Recon Route' }],
  ];
  function starStr(n) { return [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join(''); }
  function openMeta(tab) {
    SFX.click();
    const M = META.M;
    if (tab === 'perks') {
      sheet('Perks', `<p class="sheet-note">Perks are bought with Merit Stars and stay with you in every future life. You have <b class="gold">${M.stars} ★</b>.</p>` + META.PERKS.map(pk => {
        const lv = META.perk(pk.id), c = META.cost(lv);
        return `<div class="row-item"><span class="perk-ic">${pk.ic}</span><div class="meta"><b>${pk.n} <span class="lvl">${'●'.repeat(lv)}${'○'.repeat(3 - lv)}</span></b><span>${pk.d(Math.max(1, lv + (lv < 3 ? 1 : 0)))}</span></div><div class="acts">${lv >= 3 ? '<span class="ap">Max</span>' : `<button class="btn small ${M.stars >= c ? 'primary' : ''}" data-perk="${pk.id}" ${M.stars >= c ? '' : 'disabled'}>${c} ★</button>`}</div></div>`;
      }).join(''));
      $('sheetBody').querySelectorAll('[data-perk]').forEach(b => b.onclick = () => { if (META.buyPerk(b.dataset.perk)) { SFX.fanfare(); confetti(50); META.check(S || { wins: 0, rank: 0, flags: {}, kids: [], medals: [], vars: {}, seen: {} }); renderStars(); openMeta('perks'); } });
    } else if (tab === 'ach') {
      const got = Object.keys(M.ach).length;
      sheet('Achievements', `<p class="sheet-note">${got} of ${META.ACH.length} unlocked. Each one pays Merit Stars.</p><div class="achgrid">` + META.ACH.map(a => `<div class="ach ${M.ach[a[0]] ? 'got' : ''}"><i>${M.ach[a[0]] ? '★' : '☆'}</i><b>${a[1]}</b><span>${a[2]}</span><small>+${a[3]} ★</small></div>`).join('') + '</div>');
    } else if (tab === 'train') {
      sheet('Training Ground', `<p class="sheet-note">Replay any drill for a better rating. Every success earns Merit Stars, and a new best earns more.</p>` + DRILLS.map((d, i) => `<button class="act-btn" data-drill="${i}"><span class="ic">${{ assault: '✦', fight: '⚔', shoot: '◎', sniper: '⌖', stealth: '◐', obstacle: '▲', cipher: '✉', defuse: '✂', memory: '▦' }[d[0]] || '•'}</span><span style="flex:1"><b>${d[1]}</b><span>${d[0] === 'assault' ? 'Playable assault mission' : 'Drill'}</span></span><span class="mst">${starStr(M.best['train:' + i] || 0)}</span></button>`).join(''));
      $('sheetBody').querySelectorAll('[data-drill]').forEach(b => b.onclick = async () => {
        const d = DRILLS[+b.dataset.drill]; closeSheet();
        const wasStory = !$('life').hidden; if (wasStory) lifeBG.stop(); else titleBG && titleBG.stop();
        const o = Object.assign({ key: 'train:' + b.dataset.drill, kicker: 'Training Ground' }, d[2]);
        if (o.questions === undefined && d[0] === 'quiz') o.questions = window.QUIZZES.stadium;
        await GAMES.run(d[0], o); META.trained(); renderStars();
        if (wasStory) lifeBG.start(); else titleBG && titleBG.start();
        openMeta('train');
      });
    } else if (tab === 'settings') {
      const st = META.settings;
      sheet('Settings', `<div class="setrow"><b>Text speed</b><div class="seg">${['slow', 'normal', 'fast', 'instant'].map(v => `<button class="${st.speed === v ? 'on' : ''}" data-speed="${v}">${v}</button>`).join('')}</div></div>
        <div class="setrow"><b>Auto-advance dialogue</b><div class="seg"><button class="${st.auto ? '' : 'on'}" data-auto="0">Off</button><button class="${st.auto ? 'on' : ''}" data-auto="1">On</button></div></div>
        <div class="setrow"><b>Text size</b><div class="seg">${[['s', 'Small'], ['m', 'Normal'], ['l', 'Large']].map(([v, l]) => `<button class="${(st.text || 'm') === v ? 'on' : ''}" data-txt="${v}">${l}</button>`).join('')}</div></div>
        <div class="setrow"><b>Vibration</b><div class="seg"><button class="${st.vibrate !== false ? 'on' : ''}" data-vib="1">On</button><button class="${st.vibrate === false ? 'on' : ''}" data-vib="0">Off</button></div></div>
        <div class="setrow"><b>Reduce motion</b><div class="seg"><button class="${st.calm ? '' : 'on'}" data-calm="0">Off</button><button class="${st.calm ? 'on' : ''}" data-calm="1">On</button></div></div>
        <div class="setrow"><b>Graphics</b><div class="seg">${[['auto', 'Auto'], ['high', 'High'], ['saver', 'Battery saver']].map(([v, l]) => `<button class="${PERF.mode === v ? 'on' : ''}" data-gfx="${v}">${l}</button>`).join('')}</div></div>
        <div class="setrow"><b>Music</b><div class="seg"><button class="${MUSIC.on ? 'on' : ''}" data-mus="1">On</button><button class="${MUSIC.on ? '' : 'on'}" data-mus="0">Off</button></div></div>
        <div class="setrow"><b>Music volume</b><div class="seg">${[['.3', 'Low'], ['.6', 'Medium'], ['1', 'High']].map(([v, l]) => `<button class="${Math.abs(MUSIC.vol - v) < .05 ? 'on' : ''}" data-mvol="${v}">${l}</button>`).join('')}</div></div>
        <div class="setrow"><b>Sound effects</b><div class="seg"><button class="${SFX.on ? 'on' : ''}" data-snd="1">On</button><button class="${SFX.on ? '' : 'on'}" data-snd="0">Off</button></div></div>
        <p class="sheet-note">Lives started: ${M.lives}. Merit Stars earned in total: ${M.totalStars}. Daily ration streak: ${M.daily.streak} day${M.daily.streak === 1 ? '' : 's'}.</p>`);
      $('sheetBody').querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { META.setSetting('speed', b.dataset.speed); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-txt]').forEach(b => b.onclick = () => { META.setSetting('text', b.dataset.txt); POLISH.applySettings(); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-vib]').forEach(b => b.onclick = () => { META.setSetting('vibrate', b.dataset.vib === '1'); if (b.dataset.vib === '1') SFX.good(); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-calm]').forEach(b => b.onclick = () => { META.setSetting('calm', b.dataset.calm === '1'); POLISH.applySettings(); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-mus]').forEach(b => b.onclick = () => { SFX.unlock(); if ((b.dataset.mus === '1') !== MUSIC.on) MUSIC.toggle(); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-mvol]').forEach(b => b.onclick = () => { MUSIC.setVol(+b.dataset.mvol); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-gfx]').forEach(b => b.onclick = () => { PERF.set(b.dataset.gfx); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-auto]').forEach(b => b.onclick = () => { META.setSetting('auto', b.dataset.auto === '1'); openMeta('settings'); });
      $('sheetBody').querySelectorAll('[data-snd]').forEach(b => b.onclick = () => { if ((b.dataset.snd === '1') !== SFX.on) SFX.toggle(); $('btnSound').textContent = 'Sound: ' + (SFX.on ? 'On' : 'Off'); openMeta('settings'); });
    }
  }
  async function dailyRation() {
    if (!META.dailyAvailable() || !$('title')) return;
    // only interrupt at a quiet moment: the title screen or the idle life screen
    const quiet = (!$('title').hidden || (!$('life').hidden && !busy)) && $('story').hidden && $('cut').hidden && $('game').hidden && $('modal').hidden && $('sheet').hidden;
    if (!quiet) { setTimeout(dailyRation, 4000); return; }
    const streak = META.M.daily.streak;
    const r = META.claimDaily();
    await new Promise(res => {
      $('modalKicker').textContent = 'Daily ration'; $('modalTitle').textContent = `+${r} Merit Stars`;
      $('modalText').textContent = `Day ${META.M.daily.streak} of your streak. Come back every day: day 7 brings a Gold Crate for your squad.`;
      $('modalText').insertAdjacentHTML('afterend', POLISH.calendar(META.M.daily.streak));
      if (META.M.daily.streak % 7 === 0 && window.OPS) { OPS.O.crates.gold++; try { localStorage.setItem('sss_ops_v1', JSON.stringify(OPS.O)); } catch (e) {} }
      cardArt('barracks', 'sherkhan', 'happy');
      const B = $('modalBtns'); B.innerHTML = ''; const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = 'Collect'; b.onclick = () => { $('modal').hidden = true; const cal = document.querySelector('#modal .cal'); if (cal) cal.remove(); SFX.fanfare(); confetti(60); renderStars(); res(); }; B.appendChild(b);
      $('modal').hidden = false;
    });
  }

  // ---------------- sheets ----------------
  function sheet(title, html) { $('sheetTitle').textContent = title; $('sheetBody').innerHTML = html; $('sheet').hidden = false; }
  function closeSheet() { $('sheet').hidden = true; }
  function apLine() { return `<p class="ap">Actions left this year: ${'&#9673; '.repeat(S.ap)}${'&#9675; '.repeat(Math.max(0, 3 - S.ap))}</p>`; }
  // Every activity costs something: time away from work, energy, money, or a risk of getting hurt.
  // eff lists what moves (+ up, - down, ? may happen) so the player sees the trade-off before choosing.
  function friendsFx(n) { return Object.entries(S.rels).filter(([, r]) => r.alive && /friend/i.test(r.role)).map(([k]) => `rel.${k}+${n}`).join(' '); }
  function familyFx(n) { return ['ammi', 'abba', 'zainab', 'ayesha'].filter(k => S.rels[k] && S.rels[k].alive).map(k => `rel.${k}${n}`).join(' '); }
  function activities() {
    const r = S.rank, kid = r === 0;
    const A = [
      { id: 'gym', ic: '&#9822;', n: kid ? 'Morning run & push-ups' : 'PT and gym', eff: 'fitness+ health+ happy-', risk: [.12, 'health-7', 'You pull a hamstring and limp for a month.'], fx: () => `fitness+${ri(3, 6)} health+${ri(1, 3)} happy-1` },
      { id: 'study', ic: '&#9998;', n: kid ? 'Study for exams' : r === 1 ? 'Military studies' : 'Read military history', eff: 'intellect+ happy- fitness-', fx: () => `intellect+${ri(3, 6)} happy-2 fitness-1` },
      { id: 'pray', ic: '&#9790;', n: 'Pray at the mosque', eff: 'happy+ honor+ perf-', fx: () => `happy+${ri(3, 5)} honor+${ri(1, 2)}${r >= 2 ? ' perf-1' : ''}` },
      { id: 'friends', ic: '&#9749;', n: kid ? 'Chai with friends at the dhaba' : 'Evening out with old friends', eff: 'happy+ friends+ money- ' + (kid ? 'intellect-' : 'perf-'), fx: () => `happy+${ri(4, 7)} money-${kid ? 2 : 8} ${kid ? 'intellect-2' : 'perf-2'} ${friendsFx(ri(5, 9))}` },
      { id: 'tuition', ic: '&#9997;', n: 'Teach tuition to younger kids', eff: 'money+ intellect+ happy- fitness-', fx: () => `money+${ri(8, 14)} intellect+1 happy-2 fitness-1`, need: () => kid },
      { id: 'rest', ic: '&#9832;', n: 'Rest and sleep properly for a change', eff: 'health+ happy+ ' + (kid ? 'intellect-' : 'perf-') + ' fitness-', fx: () => `health+${ri(4, 7)} happy+2 ${kid ? 'intellect-2' : 'perf-3'} fitness-1` },
      { id: 'work', ic: '&#9733;', n: r <= 1 ? 'Extra drill practice' : 'Volunteer for extra duty', eff: 'perf+ happy- health- family-', fx: () => `perf+${ri(6, 10)} happy-3 health-2 ${familyFx(-3)}`, need: () => r >= 1 },
      { id: 'range', ic: '&#9678;', n: 'Range day', d: 'Play the range. Win: courage and performance up. Costs a day of rest.', game: 'shoot', need: () => r >= 1 },
      { id: 'spar', ic: '&#9876;', n: 'Unarmed combat sparring', d: 'Play a bout. Win: fitness, courage, performance. You will take some hits either way.', game: 'fight', need: () => r >= 1 },
      { id: 'patrol', ic: '&#9873;', n: 'Volunteer for a night patrol', eff: 'courage+ perf+ health- happy-', risk: [.15, 'health-10 courage+3', 'A burst of fire in the dark. You come back with a graze across the ribs.'], fx: () => `courage+${ri(3, 5)} perf+${ri(2, 4)} health-2 happy-2`, need: () => r >= 2 && r <= 6 },
      { id: 'mentor', ic: '&#9873;', n: 'Mentor young officers and soldiers', eff: 'leadership+ perf+ happy-', fx: () => `leadership+${ri(4, 6)} perf+2 happy-1`, need: () => r >= 4 },
      { id: 'troops', ic: '&#9878;', n: 'Walk the lines with your men', eff: 'leadership+ honor+ perf-', fx: () => `leadership+${ri(2, 4)} honor+1 happy+1 perf-1`, need: () => r >= 2 },
      { id: 'doctor', ic: '&#10010;', n: 'Medical check-up at CMH', eff: 'health+ money- perf-', fx: () => `health+${ri(6, 12)} money-15 perf-1`, need: () => S.money >= 15 },
      { id: 'holiday', ic: '&#9728;', n: 'Take annual leave with the family', eff: 'happy+ health+ family+ perf- money-', fx: () => `happy+${ri(8, 12)} health+3 perf-3 money-80 ${familyFx('+' + ri(5, 9))}`, need: () => r >= 2 && S.money >= 80 },
      { id: 'invest', ic: '&#8377;', n: 'Put savings into a friend\'s business', eff: 'money? happy?', gamble: true, need: () => r >= 3 && S.money >= 100 },
      { id: 'cricket', ic: '&#9918;', n: kid ? 'Street cricket with friends' : 'Unit cricket match', eff: 'happy+ fitness+ ' + (kid ? 'intellect-' : 'perf-'), risk: [.1, 'health-5', 'A short ball catches you on the wrist. It swells up like a mango.'], fx: () => `happy+${ri(4, 6)} fitness+2 ${kid ? 'intellect-1' : 'perf-1'} ${friendsFx(3)}` },
    ];
    return A.filter(a => !a.need || a.need());
  }
  const EFF_NAME = { fitness: 'Fitness', health: 'Health', happy: 'Happiness', intellect: 'Intellect', honor: 'Honour', perf: 'Performance', courage: 'Courage', leadership: 'Leadership', money: 'Money', friends: 'Friends', family: 'Family' };
  function effChips(a) {
    if (!a.eff) return '';
    const chips = a.eff.trim().split(/\s+/).map(tok => { const k = tok.slice(0, -1), sg = tok.slice(-1); return `<em class="eff ${sg === '+' ? 'up' : sg === '-' ? 'down' : 'maybe'}">${sg === '+' ? '▲' : sg === '-' ? '▼' : '?'} ${EFF_NAME[k] || k}</em>`; }).join('');
    return `<span class="effs">${chips}${a.risk ? `<em class="eff risk">⚠ ${Math.round(a.risk[0] * 100)}% risk</em>` : ''}</span>`;
  }
  async function doActivity(a) {
    if (S.ap <= 0) return;
    S.ap--; closeSheet(); SFX.click();
    if (a.game) {
      const r = await GAMES.run(a.game, a.game === 'fight' ? { foe: 'Sparring partner', diff: 1 + Math.min(3, S.rank / 3 | 0), scene: 'cherat', courage: S.courage } : { diff: 1 + Math.min(3, S.rank / 3 | 0), need: 10, total: 14, courage: S.courage });
      if (a.game === 'fight') applyFx(r.win ? 'fitness+3 courage+3 perf+3 health-3' : 'health-6 happy-2 courage+1');
      else applyFx(r.win ? 'courage+3 perf+5 happy-1' : 'perf+1 happy-2');
      log(`${a.n}: ${r.win ? 'top of the group' : 'a rough day'}.`);
    } else if (a.gamble) {
      const ok = Math.random() < .5 + S.intellect / 400;
      applyFx(ok ? `money+${ri(60, 140)} happy+4` : `money-${ri(50, 100)} happy-5`);
      log(ok ? 'The business took off. Your share paid back handsomely.' : 'The business folded. Your savings went with it.', ok ? 'good' : 'bad');
    } else {
      applyFx(a.fx()); log(`${a.n}.`);
      if (a.risk && Math.random() < a.risk[0]) { applyFx(a.risk[1]); log(a.risk[2], 'bad'); }
    }
    save(); renderAll();
  }
  function openTab(tab) {
    SFX.click();
    if (tab === 'activities') {
      const html = apLine() + activities().map((a, i) => `<button class="act-btn" data-i="${i}" ${S.ap <= 0 ? 'disabled' : ''}><span class="ic">${a.ic}</span><span><b>${a.n}</b>${a.d ? `<span>${a.d}</span>` : ''}${effChips(a)}</span></button>`).join('') + (S.ap <= 0 ? '<p class="sheet-note">No actions left. Press Age to move to the next year.</p>' : '');
      sheet('Activities', html);
      const list = activities();
      $('sheetBody').querySelectorAll('.act-btn').forEach(b => b.onclick = () => doActivity(list[+b.dataset.i]));
    } else if (tab === 'family') {
      const people = Object.entries(S.rels).filter(([, r]) => r.alive);
      const dead = Object.values(S.rels).filter(r => !r.alive);
      const html = apLine() + people.map(([k, r]) => `<div class="row-item"><div class="meta"><b>${r.name}</b><span>${r.role}</span><div class="bar" style="margin-top:6px"><i style="width:${r.v}%;background:${r.v < 30 ? '#d04a33' : '#22a95f'}"></i></div></div>
        <div class="acts"><button class="btn small" data-k="${k}" data-a="time" ${S.ap <= 0 ? 'disabled' : ''} title="Bond up, happiness up, ${S.rank >= 2 ? 'performance' : 'intellect'} down">Spend time</button><button class="btn small" data-k="${k}" data-a="gift" ${S.ap <= 0 || S.money < 20 ? 'disabled' : ''}>Gift</button></div></div>`).join('')
        + (dead.length ? `<p class="sheet-note">Remembered: ${dead.map(r => `${r.name} (${r.role})`).join(', ')}</p>` : '');
      sheet('Family & Friends', `<p class="sheet-note">Time with people costs time at work or study. A gift costs Rs 20,000.</p>` + html);
      $('sheetBody').querySelectorAll('button[data-k]').forEach(b => b.onclick = () => {
        if (S.ap <= 0) return; const r = S.rels[b.dataset.k]; S.ap--;
        if (b.dataset.a === 'time') { applyFx(`rel.${b.dataset.k}+${ri(6, 12)} happy+2 ${S.rank >= 2 ? 'perf-2' : 'intellect-1'}`); log(`Spent time with ${r.name}.`); }
        else { applyFx(`rel.${b.dataset.k}+${ri(8, 14)} money-20`); log(`Bought ${r.name} a gift.`); }
        save(); renderAll(); openTab('family');
      });
    } else if (tab === 'career') {
      const next = RANKS[S.rank + 1];
      const sc = promoScore() | 0;
      const html = `<dl class="kv"><dt>Rank</dt><dd>${RANKS[S.rank].n}</dd><dt>Unit</dt><dd>${S.rank >= 2 ? (S.flags.ssg ? 'Special Service Group' : S.regiment) : S.rank === 1 ? 'Pakistan Military Academy' : 'Student, ' + S.town}</dd>
        <dt>Service</dt><dd>${S.rank >= 2 ? (S.age - (S.vars.commAge || 20)) + ' years commissioned' : 'Not yet commissioned'}</dd>
        <dt>Missions</dt><dd>${S.wins} succeeded of ${S.missions}</dd>
        ${next && S.rank >= 2 ? `<dt>Next rank</dt><dd>${next.n} &middot; board score ${sc} / ${next.need} needed</dd>` : ''}
        ${S.pending ? `<dt>Status</dt><dd style="color:#f1a08f">Passed over ${S.passed}&times;. Re-board at age ${S.pending.at}.</dd>` : ''}
        ${S.flags.inquiry ? `<dt>Inquiry</dt><dd style="color:#f1a08f">A court of inquiry is open against you.</dd>` : ''}</dl>
        <p class="sheet-note">Board score = 60% Performance + 20% Leadership + 20% Honour. Raise Performance with extra duty, missions and good decisions. An Honour below 25 blocks every promotion.</p>
        <div class="timeline">${RANKS.slice(2).map((r, i) => `<div><b>${i + 2 <= S.rank ? '&#10003;' : i + 2 === S.rank + 1 ? '&#9656;' : '&middot;'}</b><span style="${i + 2 <= S.rank ? 'color:var(--brass)' : ''}">${r.n}</span></div>`).join('')}</div>`;
      sheet('Career', html + careerExtras());
      $('sheetBody').querySelectorAll('[data-course]').forEach(b => b.onclick = () => applyCourse(COURSES.find(c => c.id === b.dataset.course)));
      $('sheetBody').querySelectorAll('[data-as]').forEach(b => b.onclick = () => assetAction(+b.dataset.as, b.dataset.act));
    } else if (tab === 'record') {
      const html = `<h4 style="margin:0;font-family:var(--label);letter-spacing:.1em;text-transform:uppercase;color:var(--khaki)">Ribbons</h4>
        <div class="ribbons">${S.medals.map(m => `<i class="ribbon" style="background:${m.c}" title="${m.n}"></i>`).join('') || '<span class="sheet-note">None yet.</span>'}</div>
        ${S.medals.map(m => `<div class="row-item"><i class="ribbon" style="background:${m.c}"></i><div class="meta"><b>${m.n}</b><span>Age ${m.age}${m.why ? ' &middot; ' + m.why : ''}</span></div></div>`).join('')}
        <h4 style="margin:8px 0 0;font-family:var(--label);letter-spacing:.1em;text-transform:uppercase;color:var(--khaki)">Life milestones</h4>
        <div class="timeline">${S.history.map(h => `<div><b>${h.age}</b><span>${h.t}</span></div>`).join('') || '<span class="sheet-note">Your story has just begun.</span>'}</div>
        <button class="btn danger small" id="btnWipe" style="margin-top:14px;align-self:flex-start">Abandon this life</button><div id="wipeConfirm"></div>`;
      const all = Object.values(EVENTS).flat().filter((e, i, A) => A.findIndex(x => x.id === e.id) === i), seen = all.filter(e => S.seen[e.id]).length;
      sheet('Service Record', `<div class="campaign"><b>Story campaign</b><div class="bar"><i style="width:${(seen / all.length * 100).toFixed(0)}%"></i></div><span>${seen} of ${all.length} chapters seen in this life. Different choices open different chapters.</span></div>` + html);
      $('btnWipe').onclick = () => { $('wipeConfirm').innerHTML = '<p class="sheet-note">This deletes the save. Sure?</p><button class="btn danger small" id="btnWipe2">Yes, start over</button>'; $('btnWipe2').onclick = () => { wipe(); location.reload(); }; };
    }
  }

  // ---------------- pay, perks, property and foreign courses ----------------
  // money is in thousands of rupees. Pay is yearly; roughly a third of it is saved.
  const RANK_PERKS = {
    1: ['Cadet stipend', 'Mess and quarters at Kakul'],
    2: ['Bachelor officers\' quarters', 'A shared batman (orderly)', 'Free treatment at CMH for your family'],
    4: ['Married accommodation in the cantonment', 'Motorcycle and fuel allowance'],
    5: ['Residential plot allotment: 1 kanal'],
    6: ['Commanding officer\'s house', 'Staff car with a driver', 'Personal orderly'],
    7: ['Larger staff house', 'Club membership'],
    8: ['Agricultural land grant: 50 acres', 'Pennant on the staff car'],
    9: ['General officer\'s house', 'Flag car, escort and guard', 'Second residential plot: 2 kanal'],
    10: ['Corps commander\'s residence', 'Security detail'],
    11: ['Army House, Rawalpindi', 'Official aircraft for visits', 'Personal staff'],
  };
  const GRANTS = {
    5: { id: 'plot1', n: 'Residential plot, 1 kanal', kind: 'plot', size: 1, value: 45000 },
    8: { id: 'land', n: 'Agricultural land, 50 acres', kind: 'land', value: 120000 },
    9: { id: 'plot2', n: 'Residential plot, 2 kanal', kind: 'plot', size: 2, value: 95000 },
  };
  const COURSES = [
    { id: 'benning', n: 'Infantry Officers\' Advanced Course', where: 'Fort Benning, USA', city: 'Georgia', min: 3, max: 5, req: () => S.fitness >= 45, reqT: 'Fitness 45', fx: 'perf+7 fitness+3 courage+2 leadership+2', flag: ['#b22234', '#ffffff', '#3c3b6e'], mark: 'flagpole', months: 'six months' },
    { id: 'turkey', n: 'Commando Course', where: 'Eğirdir, Turkey', city: 'Eğirdir', min: 3, max: 5, req: () => S.fitness >= 55 || S.flags.ssg, reqT: 'Fitness 55 or SSG', fx: 'courage+5 fitness+5 perf+5', flag: ['#e30a17', '#ffffff', '#e30a17'], mark: 'mosque', months: 'four months' },
    { id: 'sandhurst', n: 'Exchange instructor, Royal Military Academy', where: 'Sandhurst, UK', city: 'Camberley', min: 4, max: 5, req: () => S.perf >= 55, reqT: 'Performance 55', fx: 'leadership+6 intellect+4 perf+7 money+300', flag: ['#012169', '#ffffff', '#c8102e'], mark: 'clock', months: 'two years' },
    { id: 'saudi', n: 'Training mission on deputation', where: 'Riyadh, Saudi Arabia', city: 'Riyadh', min: 4, max: 7, req: () => true, reqT: '', fx: 'money+900 perf+2 happy-3', flag: ['#006c35', '#ffffff', '#006c35'], mark: 'tower', months: 'two years', away: true },
    { id: 'unmo', n: 'UN military observer', where: 'Western Sahara', city: 'Laayoune', min: 4, max: 6, req: () => S.honor >= 50, reqT: 'Honour 50', fx: 'honor+4 leadership+3 money+400 perf+4', flag: ['#5b92e5', '#ffffff', '#5b92e5'], mark: 'dune', months: 'one year', away: true },
    { id: 'china', n: 'Command and Staff course', where: 'Nanjing, China', city: 'Nanjing', min: 5, max: 6, req: () => S.intellect >= 50, reqT: 'Intellect 50', fx: 'intellect+6 leadership+4 perf+7', flag: ['#de2910', '#de2910', '#de2910'], mark: 'pagoda', months: 'one year' },
    { id: 'leavenworth', n: 'Command and General Staff College', where: 'Fort Leavenworth, USA', city: 'Kansas', min: 5, max: 7, req: () => S.intellect >= 58, reqT: 'Intellect 58', fx: 'intellect+8 perf+9 leadership+2', flag: ['#b22234', '#ffffff', '#3c3b6e'], mark: 'dome', months: 'one year' },
    { id: 'attache', n: 'Defence attaché at an embassy', where: 'Ankara, Turkey', city: 'Ankara', min: 7, max: 8, req: () => S.honor >= 55 && S.intellect >= 55, reqT: 'Honour 55, Intellect 55', fx: 'intellect+5 leadership+3 perf+6 money+700', flag: ['#e30a17', '#ffffff', '#e30a17'], mark: 'mosque', months: 'three years', away: true },
    { id: 'rcds', n: 'Royal College of Defence Studies', where: 'London, UK', city: 'London', min: 8, max: 9, req: () => S.intellect >= 60, reqT: 'Intellect 60', fx: 'intellect+8 perf+10 leadership+3', flag: ['#012169', '#ffffff', '#c8102e'], mark: 'clock', months: 'one year' },
  ];
  function courseChance() { return clamp(.3 + (S.perf - 50) / 120 + (S.intellect - 50) / 160 + (S.honor - 50) / 300, .12, .9); }
  async function applyCourse(c) {
    if (S.ap <= 0 || busy) return;
    busy = true; S.ap--; closeSheet(); SFX.click();
    try {
      S.courses = S.courses || {};
      const p = courseChance();
      if (Math.random() < p) {
        S.courses[c.id] = S.age;
        await modal('Selection board', `Selected: ${c.where}`, `You have been selected for the ${c.n} in ${c.where}. ${c.months.charAt(0).toUpperCase() + c.months.slice(1)} away from home.`, [{ t: 'Pack the bags' }], { scene: 'office', npc: 'co', mood: 'happy' });
        CUT.LIB.__abroad = CUT.abroad(c); await CUT.play('__abroad');
        applyFx(c.fx + (c.away ? ' ' + ['ammi', 'ayesha', 'abba'].filter(k => S.rels[k] && S.rels[k].alive).map(k => `rel.${k}-6`).join(' ') : ''));
        log(`Completed the ${c.n}, ${c.where}.`, 'good'); S.history.push({ age: S.age, t: `${c.n}, ${c.where}` });
        if (Object.keys(S.courses).filter(k => S.courses[k] > 0).length >= 3) META.unlock('globetrotter');
      } else {
        S.courses[c.id] = -S.age;
        await modal('Selection board', 'Not selected this year', `The board picked another officer for ${c.where}. Raise your Performance and Intellect and apply again next year.`, [{ t: 'Next year, then' }], { scene: 'office' });
        applyFx('happy-2');
      }
    } finally { busy = false; save(); renderAll(); }
  }
  function grantsDue() { S.assets = S.assets || []; S.granted = S.granted || {}; return Object.keys(GRANTS).map(Number).filter(r => S.rank >= r && !S.granted[r]); }
  async function grantsCheck() {
    for (const r of grantsDue()) {
      const g = GRANTS[r]; S.granted[r] = 1;
      const a = Object.assign({ built: false, leased: false }, g, { value: g.value });
      S.assets.push(a); log(`Allotted: ${g.n}.`, 'good'); S.history.push({ age: S.age, t: `Allotted ${g.n}` });
      if (g.kind === 'land') {
        const i = await modal('Land grant', g.n, `As a Brigadier you are granted ${g.n.toLowerCase()} (worth about ${fmtMoney(g.value)}). That evening a builder calls: he will "develop" it for free if you sign a change-of-use file for his housing scheme next door.`,
          [{ t: 'Decline. Lease the land to the farmers already on it.' }, { t: 'Sign the file. Everyone does it.' }], { scene: 'village', npc: 'haroon', mood: 'happy' });
        if (i === 0) { a.leased = true; applyFx('honor+4 happy+2'); log('Leased the grant land to the families who farm it.'); }
        else { a.value = Math.round(a.value * 1.6); applyFx('honor-12 money+500'); S.flags.landDeal = true; log('Signed the builder\'s change-of-use file.', 'bad'); }
      } else {
        await modal('Allotment', g.n, `Your ${g.n.toLowerCase()} has been allotted (worth about ${fmtMoney(g.value)}). You can build on it, or sell it, from the Career tab.`, [{ t: 'Good' }], { scene: 'avenue' });
      }
    }
  }
  function yearlyAssets() {
    let inc = 0;
    (S.assets || []).forEach(a => { a.value = Math.round(a.value * 1.06); if (a.kind === 'house') inc += 900 * (a.size || 1); if (a.kind === 'land' && a.leased) inc += 1200; });
    if (inc) { S.money += inc; log(`Rent and lease income: ${fmtMoney(inc)}.`); }
  }
  function assetAction(i, act) {
    const a = S.assets[i]; if (!a) return;
    if (act === 'sell') { S.money += a.value; log(`Sold ${a.n} for ${fmtMoney(a.value)}.`, 'good'); S.assets.splice(i, 1); applyFx('happy+3'); }
    else if (act === 'build') { const c = 18000 * (a.size || 1); if (S.money < c) return; S.money -= c; a.kind = 'house'; a.n = `House on ${a.n.replace('Residential plot, ', '')} plot`; a.value += c; applyFx('happy+6'); log('Built a house on the plot. Rented out to a bank officer\'s family.', 'good'); S.history.push({ age: S.age, t: 'Built a house' }); }
    else if (act === 'lease') { a.leased = true; log('Leased the land to local farmers.'); }
    SFX.choose(); save(); renderAll(); openTab('career');
  }
  const RELS = [['rel_afg', 'Afghanistan'], ['rel_uae', 'UAE'], ['rel_chn', 'China'], ['rel_irn', 'Iran'], ['rel_nbr', 'The neighbour'], ['rel_baloch', 'Baloch tribes']];
  function relationsHtml() {
    const got = RELS.filter(([k]) => S.vars[k] !== undefined); if (!got.length) return '';
    return `<h4 class="sec-h">Foreign relations</h4><p class="sheet-note">How much these partners trust you personally, from your intelligence and command decisions.</p>` + got.map(([k, n]) => { const v = clamp(50 + S.vars[k], 0, 100); return `<div class="relrow"><span>${n}</span><div class="bar"><i style="width:${v}%;background:${v >= 60 ? '#22a95f' : v >= 40 ? '#e0a83e' : '#d04a33'}"></i></div><b>${v}</b></div>`; }).join('');
  }
  function careerExtras() {
    const pay = RANKS[S.rank].pay, next = RANKS[S.rank + 1];
    const perks = Object.entries(RANK_PERKS).filter(([r]) => +r <= S.rank && (S.rank < 2 || +r >= 2)).flatMap(([, l]) => l);
    const nextPerks = next ? (RANK_PERKS[S.rank + 1] || []) : [];
    const assets = (S.assets || []).map((a, i) => `<div class="row-item"><span class="perk-ic">${a.kind === 'land' ? '❦' : a.kind === 'house' ? '⌂' : '▭'}</span><div class="meta"><b>${a.n}</b><span>Worth ${fmtMoney(a.value)}${a.kind === 'house' ? ` · rent ${fmtMoney(900 * (a.size || 1))} a year` : a.kind === 'land' ? (a.leased ? ` · lease ${fmtMoney(1200)} a year` : ' · idle') : ''}</span></div><div class="acts">
      ${a.kind === 'plot' ? `<button class="btn small" data-as="${i}" data-act="build" ${S.money >= 18000 * (a.size || 1) ? '' : 'disabled'}>Build ${fmtMoney(18000 * (a.size || 1))}</button>` : ''}${a.kind === 'land' && !a.leased ? `<button class="btn small" data-as="${i}" data-act="lease">Lease</button>` : ''}<button class="btn small" data-as="${i}" data-act="sell">Sell</button></div></div>`).join('');
    S.courses = S.courses || {};
    const p = Math.round(courseChance() * 100);
    const courses = COURSES.map(c => {
      const done = S.courses[c.id] > 0, tried = S.courses[c.id] < 0 && -S.courses[c.id] === S.age, inRank = S.rank >= c.min && S.rank <= c.max, ok = inRank && c.req();
      const st = done ? '<span class="ap">✓ Done</span>' : tried ? '<span class="ap">Next year</span>' : `<button class="btn small ${ok ? 'primary' : ''}" data-course="${c.id}" ${ok && S.ap > 0 ? '' : 'disabled'}>Apply</button>`;
      return `<div class="row-item ${done ? 'claimed' : ''}"><span class="perk-ic">✈</span><div class="meta"><b>${c.n}</b><span>${c.where} · ${c.months} · ${RANKS[c.min].s} to ${RANKS[c.max].s}${c.reqT ? ' · needs ' + c.reqT : ''}</span></div><div class="acts">${st}</div></div>`;
    }).join('');
    return `<h4 class="sec-h">Pay & benefits</h4>
      <div class="pay-card"><div><small>Monthly pay</small><b>${pay ? fmtMoney(pay / 12) : '—'}</b></div><div><small>Saved a year</small><b>${pay ? fmtMoney(Math.round(pay * .35)) : '—'}</b></div><div><small>Savings</small><b>${fmtMoney(S.money)}</b></div></div>
      ${perks.length ? `<div class="perk-list">${perks.map(x => `<span>✓ ${x}</span>`).join('')}</div>` : ''}
      ${next && S.rank >= 1 ? `<p class="sheet-note">Next rank, ${next.n}: pay ${fmtMoney(next.pay / 12)} a month${nextPerks.length ? ', ' + nextPerks.join(', ').toLowerCase() : ''}.</p>` : ''}
      <h4 class="sec-h">Property</h4>${assets || '<p class="sheet-note">No property yet. Officers are allotted a plot at Major, land at Brigadier and a second plot at Major General.</p>'}
      ${relationsHtml()}
      ${S.rank >= 2 ? `<h4 class="sec-h">Foreign courses & postings</h4><p class="sheet-note">Uses one action. Your chance of selection this year: <b class="gold">${p}%</b> (Performance, Intellect and Honour count). Each course raises your board score.</p>${courses}` : ''}`;
  }

  // ---------------- endings ----------------
  const ENDINGS = window.ENDINGS || {};
  async function ending(id) {
    if (S.ended) return;
    S.ended = id; S.cur = null; save(); META.check(S, id);
    const E = (ENDINGS[id] || ENDINGS.retire)(S, RANKS);
    $('story').hidden = true; $('game').hidden = true; $('cut').hidden = true; $('modal').hidden = true;
    if (E.cut) await CUT.play(E.cut);
    const w = document.createElement('div'); w.className = 'ending-wrap';
    const stats = STATS.map(([k, l]) => `<div class="stat"><span>${l}</span><div class="bar"><i style="width:${S[k] | 0}%;background:var(--brass)"></i></div><b>${S[k] | 0}</b></div>`).join('');
    w.innerHTML = `<div class="ending"><div class="eyebrow">${E.kicker || 'The end of a life in uniform'}</div><h2>${E.title}</h2><p class="epitaph">${interp(E.text)}</p>
      <div class="card"><h3>${S.name} &middot; ${RANKS[S.rank].n}${id === 'retire' || id === 'coas' ? ' (Retd)' : ''}</h3>
        <dl class="kv"><dt>Born</dt><dd>${S.town}, ${S.year - S.age}</dd><dt>Age</dt><dd>${S.age}</dd><dt>Missions</dt><dd>${S.wins} of ${S.missions} succeeded</dd>
        <dt>Family</dt><dd>${S.wife ? 'Married to ' + S.wife : 'Never married'}${S.kids.length ? ', ' + S.kids.map(k => k.name).join(' & ') : ''}</dd><dt>Savings</dt><dd>${fmtMoney(S.money)}</dd></dl></div>
      <div class="card"><h3>Ribbons</h3><div class="ribbons">${S.medals.map(m => `<i class="ribbon" style="background:${m.c}" title="${m.n}"></i>`).join('') || 'None'}</div><p style="margin:8px 0 0;color:var(--khaki);font-size:14px">${S.medals.map(m => m.n).join(' · ')}</p></div>
      <div class="card"><h3>Final stats</h3><div class="stats" style="background:none;border:0;padding:0">${stats}</div></div>
      <div class="card"><h3>Life record</h3><div class="timeline">${S.history.map(h => `<div><b>${h.age}</b><span>${h.t}</span></div>`).join('')}</div></div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn primary" id="btnAgain">Live another life</button></div></div>`;
    $('app').appendChild(w);
    SFX.pad(id === 'coas' ? 'proud' : 'sad');
    $('btnAgain').onclick = () => { wipe(); location.reload(); };
  }

  // ---------------- title & create ----------------
  let createLook = { skin: CHAR.SKINS[2], hair: CHAR.HAIRS[0] };
  function renderCreate() {
    CHAR.render($('createChar'), { outfit: 'student', skin: createLook.skin, hair: createLook.hair, mood: 'happy', age: 16 });
  }
  function initCreate() {
    $('skinRow').innerHTML = CHAR.SKINS.map(c => `<button type="button" class="swatch${c === createLook.skin ? ' on' : ''}" style="background:${c}" data-c="${c}" aria-label="skin tone"></button>`).join('');
    $('hairRow').innerHTML = CHAR.HAIRS.map(c => `<button type="button" class="swatch${c === createLook.hair ? ' on' : ''}" style="background:${c}" data-c="${c}" aria-label="hair colour"></button>`).join('');
    $('skinRow').onclick = e => { const b = e.target.closest('.swatch'); if (!b) return; createLook.skin = b.dataset.c; initCreate(); };
    $('hairRow').onclick = e => { const b = e.target.closest('.swatch'); if (!b) return; createLook.hair = b.dataset.c; initCreate(); };
    renderCreate();
  }
  function show(id) { ['title', 'create', 'life'].forEach(s => $(s).hidden = s !== id); }
  async function startLife(fresh) {
    show('life'); titleBG && titleBG.stop(); lifeBG.start(); renderAll();
    if (!fresh && S.cur) {
      // the app was closed in the middle of a scene: replay it, then any later scenes of the same year
      busy = true;
      try {
        const list = EVENTS[S.age] || [], at = list.findIndex(e => e.id === S.cur); S.cur = null;
        for (const ev of at >= 0 ? list.slice(at) : []) { if (S.ended) break; if (S.seen[ev.id] || (ev.cond && !evalC(ev.cond))) continue; await runEvent(ev); renderAll(); }
      } finally { busy = false; save(); renderAll(); }
      return;
    }
    if (fresh) {
      busy = true;
      log(`You are ${S.age}, the son of a retired havildar in ${S.town}.`);
      for (const ev of (EVENTS[16] || [])) { if (S.ended) break; if (S.seen[ev.id] || (ev.cond && !evalC(ev.cond))) continue; await runEvent(ev); renderAll(); }
      save(); renderAll(); busy = false;
    }
  }

  function makeGrain() {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'), im = x.createImageData(160, 160);
      for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0);
      document.documentElement.style.setProperty('--grain', `url(${c.toDataURL()})`);
      ['story', 'cut', 'lifeStage'].forEach(id => { const g = document.createElement('div'); g.className = 'grain'; $(id).appendChild(g); });
    } catch (e) {}
  }
  function boot() {
    NPC_INIT(); makeGrain();
    (window.STORY_SRC || []).forEach(parseStory);
    titleBG = SCENES.Runner($('titleCanvas')); titleBG.set('title'); titleBG.start();
    CHAR.render($('titleChar'), { outfit: 'dress', rank: 11, hat: 'gencap', age: 56, moustache: true, gray: .7, skin: CHAR.SKINS[2], hair: CHAR.HAIRS[0], mood: 'determined', medals: ['#c9a227', '#b3201e', '#5b1f24', '#e2ae48', '#3b7fd0', '#2aa34f', '#0b6b3a', '#c9a227', '#b3201e'], lightSide: -1 });
    setInterval(() => { const t = $('titleChar'); if (!t || $('title').hidden) return; t.classList.add('saluting'); setTimeout(() => t.classList.remove('saluting'), 2600); }, 7000);
    lifeBG = SCENES.Runner($('lifeCanvas'), $('lifeFg')); storyBG = SCENES.Runner($('storyCanvas'), $('storyFg'));
    bindAdvance();
    const saved = load();
    if (saved && !saved.ended) { $('btnContinue').hidden = false; $('btnContinue').innerHTML = `Continue <small>${RANKS[saved.rank].s} ${saved.name.split(' ')[0]}, ${saved.age}</small>`; }
    $('btnSound').textContent = 'Sound: ' + (SFX.on ? 'On' : 'Off');
    $('btnSound').onclick = () => { const on = SFX.toggle(); $('btnSound').textContent = 'Sound: ' + (on ? 'On' : 'Off'); };
    $('btnNew').onclick = () => { SFX.unlock(); SFX.click(); show('create'); initCreate(); };
    $('btnContinue').onclick = () => { SFX.unlock(); S = load() || saved; S.over = {}; startLife(false); };
    $('btnHome').onclick = () => { if (!busy) { SFX.click(); goTitle(); } };
    $('createBack').onclick = () => { SFX.click(); show('title'); };
    $('createForm').onsubmit = e => {
      e.preventDefault(); SFX.unlock(); SFX.choose();
      const nm = ($('inName').value || 'Ahmed Raza').trim().replace(/\s+/g, ' ').slice(0, 22) || 'Ahmed Raza';
      S = newLife(nm.includes(' ') ? nm : nm + ' Khan', $('inTown').value, createLook.skin, createLook.hair);
      META.newLife(); S.leadership += META.perk('silver') * 3; S.honor += META.perk('silver') * 2;
      wipe(); startLife(true);
    };
    $('btnAge').onclick = ageUp;
    // browsers start audio only after a tap; the first tap anywhere starts the music
    document.addEventListener('pointerdown', () => SFX.unlock(), { passive: true });
    META.onAchievement(achToast);
    document.querySelectorAll('[data-meta]').forEach(b => b.onclick = () => { if (!busy) openMeta(b.dataset.meta); });
    renderStars();
    setTimeout(dailyRation, 900);
    document.querySelectorAll('.navbtn').forEach(b => b.onclick = () => { if (!busy) openTab(b.dataset.tab); });
    $('sheetClose').onclick = closeSheet;
    $('sheet').onclick = e => { if (e.target === $('sheet')) closeSheet(); };
    window.addEventListener('keydown', e => { if (e.key === 'Escape') window.androidBack(); });
  }
  function NPC_INIT() { Object.assign(NPC, window.NPCS || {}); }

  // Android app hooks: the back button closes the top panel; leaving the app silences ambience
  // Back key (Android app, or Escape on a keyboard): close the top-most thing; leave the app only from
  // the title screen, and only after a second press.
  let exitArm = 0;
  const inApp = /; wv\)|Android.*Version\/[\d.]+.*Chrome/.test(navigator.userAgent);
  function goTitle() {
    if (S && !S.ended) save();
    $('story').hidden = true; lifeBG && lifeBG.stop(); show('title'); titleBG && titleBG.start();
    const sv = load(); $('btnContinue').hidden = !(sv && !sv.ended); if (sv && !sv.ended) $('btnContinue').innerHTML = `Continue <small>${RANKS[sv.rank].s} ${sv.name.split(' ')[0]}, ${sv.age}</small>`;
  }
  window.androidBack = () => {
    const vis = id => $(id) && !$(id).hidden;
    if (vis('crate')) { const b = $('lootOk'); if (b) b.click(); return; }
    const bn = document.querySelector('.ops-banner:not(.choice) button'); if (bn) return bn.click();
    if (document.querySelector('.ops-banner.choice')) return toast('Make your decision');
    if (vis('cut')) return $('btnSkip').click();
    if (vis('game')) return GAMES.active ? GAMES.pause() : undefined;
    if (vis('modal')) return toast('Choose one of the options');
    if (vis('sheet')) return closeSheet();
    if (window.OPS && OPS.closeTop()) return;
    if (vis('story')) return toast('Finish this scene first');
    if (document.querySelector('.ending-wrap')) { wipe(); location.reload(); return; }
    if (vis('life')) { if (!busy) goTitle(); return; }
    if (vis('create')) { show('title'); return; }
    if (vis('title')) {
      if (Date.now() - exitArm < 2200) { if (inApp) location.href = 'sipahsalar://exit'; return; }
      exitArm = Date.now(); toast('Press back again to exit');
    }
  };
  window.androidPause = () => { try { SFX.stopPad(); } catch (e) {} if (S) save(); };
  // save whenever the page is hidden or closed, and every 20 seconds while playing
  document.addEventListener('visibilitychange', () => { if (document.hidden && S) save(); });
  window.addEventListener('pagehide', () => { if (S) save(); });
  setInterval(() => { if (S && !S.ended && !$('life').hidden) save(); }, 20000);
  window.GAME = { toast: t => toast(t), STAT_HELP: null, bg: { pause() { titleBG && titleBG.stop(); lifeBG && lifeBG.stop(); }, resume() { if (!$('title').hidden) titleBG && titleBG.start(); else if (!$('life').hidden) lifeBG && lifeBG.start(); } }, renderStars: () => renderStars(), get S() { return S; }, RANKS, EVENTS, ageUp, runEvent, ending, applyFx, look: (mood, extra) => Object.assign(playerLook(mood), extra || {}), rankName: () => S ? RANKS[S.rank].n : '', interp: t => interp(t) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
