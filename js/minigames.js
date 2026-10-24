// Playable missions. GAMES.run(type, opts) -> Promise<{ win, score }>.
const GAMES = (() => {
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];
  const B = k => (window.OPS ? OPS.bonus(k) : 0);

  let paused = false, cur = null;
  function makeApi(def, opts) {
    const root = $('game'), area = $('gameArea'), cv = $('gameCanvas'), dom = $('gameDom'), pad = $('gamePad');
    root.hidden = false; dom.innerHTML = ''; pad.innerHTML = ''; $('gameHud').textContent = '';
    $('gameKicker').textContent = opts.kicker || def.kicker;
    $('gameTitle').textContent = opts.title || def.title;
    $('gameBrief').textContent = opts.brief || def.brief;
    const ctx = cv.getContext('2d');
    const cleanups = [];
    let raf = 0, alive = true;
    const api = {
      ctx, cv, dom, area,
      size() {
        const r = area.getBoundingClientRect(), d = PERF.dpr();
        if (cv.width !== (r.width * d | 0) || cv.height !== (r.height * d | 0)) { cv.width = r.width * d | 0; cv.height = r.height * d | 0; }
        ctx.setTransform(d, 0, 0, d, 0, 0);
        return { w: r.width, h: r.height };
      },
      hud(html) { $('gameHud').innerHTML = html; },
      button(label, key, onDown, onUp) {
        const b = document.createElement('button'); b.className = 'btn pad'; b.innerHTML = label;
        const down = e => { e.preventDefault(); onDown && onDown(); }, up = e => { e.preventDefault(); onUp && onUp(); };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up);
        pad.appendChild(b);
        return b;
      },
      keys(map, upMap = {}) {
        const kd = e => { const f = map[e.key] || map[e.code]; if (f) { e.preventDefault(); if (!e.repeat) f(); } };
        const ku = e => { const f = upMap[e.key] || upMap[e.code]; if (f) { e.preventDefault(); f(); } };
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        cleanups.push(() => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); });
      },
      on(el, ev, f) { el.addEventListener(ev, f); cleanups.push(() => el.removeEventListener(ev, f)); },
      loop(f) {
        let last = performance.now();
        let clock = performance.now() / 1000;
        const fr = now => { if (!alive) return; const raw = (now - last) / 1000, dt = Math.min(.05, raw); last = now; if (!paused) { clock += dt; PERF.frame(raw); f(dt, clock); } raf = requestAnimationFrame(fr); };
        raf = requestAnimationFrame(fr);
      },
      stopLoop() { cancelAnimationFrame(raf); },
      end() { alive = false; cancelAnimationFrame(raf); cleanups.forEach(f => f()); cleanups.length = 0; pad.innerHTML = ''; },
    };
    return api;
  }

  function result(api, win, text, canRetry, stars = 0, earned = 0, extra = '') {
    return new Promise(res => {
      const box = document.createElement('div'); box.className = 'gcenter';
      const starRow = `<div class="mstars">${[1, 2, 3].map(i => `<i class="${i <= stars ? 'on' : ''}" style="animation-delay:${.25 + i * .28}s">★</i>`).join('')}</div>`;
      box.innerHTML = `<h4 style="color:${win ? 'var(--pak-hi)' : 'var(--alert)'}">${win ? 'Mission Success' : 'Mission Failed'}</h4>${starRow}<p>${text}</p>${earned ? `<p class="earned">+${earned} Merit Star${earned > 1 ? 's' : ''}</p>` : ''}${extra}<div class="row"></div>`;
      if (win && stars) [1, 2, 3].forEach(i => { if (i <= stars) setTimeout(() => SFX.choose(), 250 + i * 280); });
      const row = box.querySelector('.row');
      const mk = (lbl, cls, v) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = lbl; b.onclick = () => { SFX.click(); res(v); }; row.appendChild(b); };
      if (!win && canRetry) mk('Try again', 'primary', 'retry');
      mk(win ? 'Continue' : 'Accept the outcome', win ? 'primary' : '', 'done');
      api.dom.appendChild(box);
      win ? SFX.good() : SFX.bad();
    });
  }
  function intro(api, text, btn = 'Begin') {
    return new Promise(res => {
      const box = document.createElement('div'); box.className = 'gcenter';
      box.innerHTML = `<p>${text}</p><div class="row"><button class="btn primary">${btn}</button></div>`;
      box.querySelector('button').onclick = () => { SFX.click(); box.remove(); res(); };
      api.dom.appendChild(box);
    });
  }

  const DEF = {};

  // ---------------- SHOOTING RANGE ----------------
  DEF.shoot = {
    kicker: 'Marksmanship', title: 'Firing Range', brief: 'Tap or click the hostile targets (dark silhouettes) before they drop. Never hit the white hostage boards.',
    async play(api, o) {
      const diff = o.diff || 2, need = o.need || 12, total = o.total || 18;
      await intro(api, `Hit at least <b>${need}</b> of ${total} hostile targets. Hostages are white with a blue band.`);
      return new Promise(resolve => {
        let targets = [], spawned = 0, hits = 0, civ = 0, miss = 0, timer = 0.4, mx = -100, my = -100, flash = 0;
        const life = clamp(1.9 - diff * .22 + (o.courage || 0) * .004, .7, 2.2) * (1 + META.perk('marksman') * .12) * (1 + B('steady') * .8);
        const fx = FIG.Fx();
        const shootAt = (x, y) => {
          SFX.shot(); flash = .08;
          for (const t of targets) {
            if (t.dead) continue;
            const s = t.s * t.up;
            if (x > t.x - s * .35 && x < t.x + s * .35 && y > t.y - s && y < t.y) {
              t.dead = true; t.fall = 1; fx.sparks(x, y, 10, t.civ ? '120,160,255' : '255,220,140');
              if (t.civ) { civ++; SFX.bad(); } else hits++;
              return;
            }
          }
          miss++;
        };
        api.on(api.cv, 'pointermove', e => { const r = api.cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
        api.on(api.cv, 'pointerdown', e => { const r = api.cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; shootAt(mx, my); });
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          SCENES.helpers.sky(ctx, w, h, ['#6d8fb0', '#c8d6de', '#c9b48a']);
          SCENES.helpers.ridge(ctx, w, h, h * .4, h * .08, 2, '#7e7458', 1);
          ctx.fillStyle = '#a58e62'; ctx.fillRect(0, h * .4, w, h * .6);
          for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(80,60,40,.25)'; ctx.fillRect(0, h * (.5 + i * .12), w, 3); }
          timer -= dt;
          if (timer <= 0 && spawned < total + Math.floor(total / 4)) {
            const isCiv = spawned > 2 && Math.random() < .2;
            const row = Math.random() * 3 | 0, s = h * (.18 + row * .07);
            targets.push({ x: rnd(w * .1, w * .9), y: h * (.5 + row * .14), s, up: 0, t: 0, life, civ: isCiv, dead: false });
            if (!isCiv) spawned++;
            timer = rnd(.45, 1.1) - diff * .05;
          }
          targets.sort((a, b) => a.y - b.y);
          for (const tg of targets) {
            tg.t += dt;
            if (tg.dead) tg.up = Math.max(0, tg.up - dt * 5);
            else if (tg.t < .15) tg.up = tg.t / .15; else if (tg.t > tg.life) { tg.up = Math.max(0, tg.up - dt * 6); if (tg.up === 0) tg.gone = true; }
            const s = tg.s * tg.up;
            ctx.fillStyle = '#5a4630'; ctx.fillRect(tg.x - 3, tg.y - 4, 6, 8);
            if (s > 2) {
              ctx.fillStyle = tg.civ ? '#f2f2ee' : '#1d2418';
              ctx.beginPath(); ctx.arc(tg.x, tg.y - s * .85, s * .14, 0, 7); ctx.fill();
              ctx.beginPath(); ctx.moveTo(tg.x - s * .32, tg.y); ctx.lineTo(tg.x - s * .26, tg.y - s * .62); ctx.quadraticCurveTo(tg.x, tg.y - s * .74, tg.x + s * .26, tg.y - s * .62); ctx.lineTo(tg.x + s * .32, tg.y); ctx.fill();
              if (tg.civ) { ctx.fillStyle = '#2f6fd6'; ctx.fillRect(tg.x - s * .3, tg.y - s * .4, s * .6, s * .08); }
              else { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tg.x, tg.y - s * .45, s * .12, 0, 7); ctx.stroke(); }
            }
          }
          targets = targets.filter(t => !t.gone && !(t.dead && t.up <= 0));
          fx.update(ctx, dt);
          if (flash > 0) { flash -= dt; ctx.fillStyle = 'rgba(255,240,200,.12)'; ctx.fillRect(0, 0, w, h); }
          ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, 16, 0, 7); ctx.moveTo(mx - 24, my); ctx.lineTo(mx + 24, my); ctx.moveTo(mx, my - 24); ctx.lineTo(mx, my + 24); ctx.stroke();
          api.hud(`HITS ${hits}/${need} <span>HOSTAGES HIT ${civ}</span> <span>LEFT ${Math.max(0, total - spawned)}</span>`);
          if (spawned >= total && targets.filter(t => !t.civ).length === 0) {
            api.stopLoop();
            resolve({ win: hits >= need && civ <= 1, score: hits, text: `${hits} hostiles down, ${civ} hostage boards hit, ${miss} rounds wasted.` });
          }
        });
      });
    },
  };

  // ---------------- HAND-TO-HAND ----------------
  DEF.fight = {
    kicker: 'Close combat', title: 'Fight', brief: 'Read the attack sign over your opponent. HIGH: duck. LOW: jump. STRAIGHT: block. Then STRIKE while they are open.',
    async play(api, o) {
      const diff = o.diff || 2, foe = o.foe || 'Opponent';
      await intro(api, `<b>${foe}</b> is in front of you.<br>Keys: <b>&darr;</b> duck, <b>&uarr;</b> jump, <b>&larr;</b> block, <b>Space</b> or <b>&rarr;</b> strike. Or use the buttons.`);
      return new Promise(resolve => {
        const pl = { hp: 100, pose: 'guard', act: null, at: 0 }, en = { hp: o.foeHp || 100, pose: 'guard', state: 'idle', t: rnd(.8, 1.4), atk: null };
        const fx = FIG.Fx();
        const win0 = clamp(.95 - diff * .1 + (o.courage || 0) * .003, .42, 1.1) + META.perk('commando') * .06;
        let shake = 0, msg = '', msgT = 0, over = false, cur = { p: FIG.P.guard, e: FIG.P.guard };
        const ATK = { high: { icon: '▼', need: 'duck', pose: 'punch', label: 'HIGH' }, low: { icon: '▲', need: 'jump', pose: 'sweep', label: 'LOW' }, mid: { icon: '◀', need: 'block', pose: 'kick', label: 'STRAIGHT' } };
        const say = m => { msg = m; msgT = .9; };
        function act(a) {
          if (over) return;
          if (a === 'strike') {
            pl.pose = Math.random() < .5 ? 'punch' : 'punch2'; pl.at = .28; SFX.whoosh();
            if (en.state === 'open') { const dmg = rnd(18, 26) | 0; en.hp -= dmg; en.pose = 'hit'; en.state = 'stagger'; en.t = .5; fx.impact(0, 0); SFX.hit(); shake = .25; say(`-${dmg}`); }
            else if (en.state === 'idle') { if (Math.random() < .55) { en.pose = 'block'; en.t = .5; say('Blocked'); } else { en.hp -= 8; en.pose = 'hit'; en.t = .45; SFX.hit(); say('-8'); } }
            else { pl.hp -= 4; say('Too early'); }
            return;
          }
          pl.pose = a; pl.at = .45; pl.act = a;
          if (en.state === 'windup') {
            if (ATK[en.atk].need === a) { en.state = 'open'; en.t = .85 + (o.courage || 0) * .002; en.pose = 'guard'; say('Countered! STRIKE!'); SFX.choose(); }
            else { const dmg = rnd(14, 20) | 0; pl.hp -= dmg; pl.pose = 'hit'; pl.at = .45; en.state = 'recover'; en.t = .6; SFX.hit(); shake = .3; say(`Wrong move -${dmg}`); }
          }
        }
        api.keys({ ArrowDown: () => act('duck'), ArrowUp: () => act('jump'), ArrowLeft: () => act('block'), ArrowRight: () => act('strike'), ' ': () => act('strike'), s: () => act('duck'), w: () => act('jump'), a: () => act('block'), d: () => act('strike') });
        api.button('&darr; Duck', 0, () => act('duck')); api.button('&uarr; Jump', 0, () => act('jump')); api.button('&larr; Block', 0, () => act('block')); api.button('Strike &#9670;', 0, () => act('strike'));
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          const scene = SCENES.S[o.scene || 'barracks'];
          ctx.save(); if (shake > 0) { shake -= dt; ctx.translate((Math.random() - .5) * 14 * shake * 3, (Math.random() - .5) * 10 * shake * 3); }
          scene(ctx, w, h, t, api.st || (api.st = {}), dt);
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, w, h);
          // AI
          en.t -= dt;
          if (!over) {
            if (en.state === 'idle' && en.t <= 0) { en.state = 'windup'; en.atk = pick(['high', 'low', 'mid']); en.t = win0 * (o.speed || 1); en.pose = 'guard'; SFX.beep(); }
            else if (en.state === 'windup' && en.t <= 0) { const dmg = rnd(12, 18) | 0; pl.hp -= dmg; pl.pose = 'hit'; pl.at = .45; en.pose = ATK[en.atk].pose; en.state = 'recover'; en.t = .55; SFX.hit(); shake = .3; say(`Too slow -${dmg}`); }
            else if (en.state === 'open' && en.t <= 0) { en.state = 'idle'; en.t = rnd(.6, 1.2) - diff * .06; say(''); }
            else if ((en.state === 'recover' || en.state === 'stagger') && en.t <= 0) { en.state = 'idle'; en.pose = 'guard'; en.t = rnd(.5, 1.1) - diff * .06; }
          }
          pl.at -= dt; if (pl.at <= 0 && pl.pose !== 'guard' && !over) pl.pose = 'guard';
          let ep = en.pose;
          if (en.state === 'windup') ep = en.atk === 'low' ? 'duck' : en.atk === 'high' ? 'guard' : 'block';
          if (en.state === 'recover' && en.t > .35) ep = ATK[en.atk].pose;
          cur.p = FIG.lerp(cur.p, FIG.P[pl.pose], Math.min(1, dt * 16));
          cur.e = FIG.lerp(cur.e, FIG.P[ep], Math.min(1, dt * 14));
          const s = Math.min(h * .55, w * .45), gy = h * .86, px = w * .38, ex = w * .62;
          ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(w / 2, gy + 6, w * .3, 10, 0, 0, 7); ctx.fill();
          FIG.draw(ctx, px, gy, s, cur.p, { color: o.pColor || '#3c4a2c', beret: o.pBeret === undefined ? (o.beret || '#1f2a1c') : o.pBeret, skin: '#a8754e', rim: 'rgba(255,230,190,.35)' });
          FIG.draw(ctx, ex, gy, s, cur.e, { color: o.foeColor || '#3a1414', facing: -1, scarf: o.scarf ? '#2a2420' : null, knife: !!o.knife, skin: o.foeSkin || '#9e6c46', rim: 'rgba(255,200,160,.3)', rimSide: -1 });
          ctx.save(); ctx.translate(w / 2, gy - s * .55); fx.update(ctx, dt); ctx.restore();
          // telegraph
          if (en.state === 'windup') {
            const k = clamp(en.t / win0, 0, 1);
            ctx.fillStyle = '#ffcf4a'; ctx.font = `${Math.max(26, s * .16)}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(ATK[en.atk].icon + ' ' + ATK[en.atk].label, ex, gy - s * 1.15);
            ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ex, gy - s * 1.25 - 26, 16, -Math.PI / 2, -Math.PI / 2 + k * 7); ctx.stroke(); ctx.textAlign = 'left';
          }
          if (en.state === 'open') { ctx.fillStyle = `rgba(80,255,120,${.6 + .4 * Math.sin(t * 20)})`; ctx.font = `${Math.max(24, s * .14)}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('STRIKE!', ex, gy - s * 1.15); ctx.textAlign = 'left'; }
          if (msgT > 0) { msgT -= dt; ctx.fillStyle = `rgba(255,255,255,${msgT})`; ctx.font = '18px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(msg, w / 2, h * .16); ctx.textAlign = 'left'; }
          // bars
          const bar = (x, v, c, label, right) => { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, 14, w * .36, 14); ctx.fillStyle = c; const ww = w * .36 * clamp(v / 100, 0, 1); ctx.fillRect(right ? x + w * .36 - ww : x, 14, ww, 14); ctx.fillStyle = '#efe9d6'; ctx.font = '13px "Barlow Condensed", sans-serif'; ctx.textAlign = right ? 'right' : 'left'; ctx.fillText(label, right ? x + w * .36 : x, 44); ctx.textAlign = 'left'; };
          bar(w * .06, pl.hp, '#22a95f', 'YOU', false); bar(w * .58, en.hp / (o.foeHp || 100) * 100, '#d04a33', foe.toUpperCase(), true);
          ctx.restore();
          if (!over && (pl.hp <= 0 || en.hp <= 0)) {
            over = true; const win = en.hp <= 0;
            if (win) { en.pose = 'down'; } else pl.pose = 'down';
            setTimeout(() => { api.stopLoop(); resolve({ win, score: Math.max(0, pl.hp | 0), text: win ? `${foe} is down. You finished with ${Math.max(0, pl.hp | 0)}% strength.` : `${foe} put you on the ground.` }); }, 1100);
          }
        });
      });
    },
  };

  // ---------------- OBSTACLE / TIMING ----------------
  DEF.obstacle = {
    kicker: 'Physical training', title: 'Obstacle Course', brief: 'Press Space or tap ACT when the needle is inside the green zone to clear each obstacle.',
    async play(api, o) {
      const n = o.count || 8, lives0 = o.lives || 3, diff = o.diff || 2;
      const zone = clamp(.2 - diff * .02 + (o.fitness || 0) * .0012, .07, .3);
      await intro(api, `${n} obstacles. You can stumble ${lives0 - 1} times. Fitness widens the green zone.`);
      return new Promise(resolve => {
        let idx = 0, lives = lives0, needle = 0, dir = 1, speed = .9 + diff * .22, zc = rnd(.3, .7), state = 'run', rx = 0, stT = 0, done = false, flashC = null, flashT = 0;
        const names = o.names || ['Wall', 'Rope climb', 'Monkey bars', 'Ditch', 'Log balance', 'Net crawl', 'Tyre run', 'Ten-foot wall', 'Water jump', 'Final sprint'];
        const press = () => {
          if (done || state !== 'aim') return;
          if (Math.abs(needle - zc) <= zone / 2) { SFX.good(); state = 'clear'; stT = .6; flashC = '80,255,120'; flashT = .3; }
          else { lives--; SFX.bad(); state = 'stumble'; stT = .8; flashC = '255,80,60'; flashT = .4; }
        };
        api.keys({ ' ': press, Enter: press }); api.button('ACT &#9650;', 0, press);
        api.on(api.cv, 'pointerdown', press);
        let pose = FIG.P.run1;
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          SCENES.S.cherat(ctx, w, h, t, api.st || (api.st = {}), dt);
          const gy = h * .8, s = h * .3;
          if (state === 'run') { rx += dt * .6; pose = FIG.lerp(FIG.P.run1, FIG.P.run2, (Math.sin(t * 12) + 1) / 2); if (rx > .35) { state = 'aim'; } }
          else if (state === 'aim') { needle += dir * speed * dt; if (needle > 1) { needle = 1; dir = -1; } if (needle < 0) { needle = 0; dir = 1; } pose = FIG.lerp(pose, FIG.P.guard, dt * 6); }
          else if (state === 'clear') { stT -= dt; pose = FIG.lerp(pose, FIG.P.jump, dt * 10); if (stT <= 0) { idx++; rx = 0; zc = rnd(.2, .8); state = 'run'; speed += .05; } }
          else if (state === 'stumble') { stT -= dt; pose = FIG.lerp(pose, FIG.P.down, dt * 8); if (stT <= 0) { if (lives <= 0) state = 'fail'; else { state = 'aim'; zc = rnd(.2, .8); } } }
          // obstacle
          ctx.fillStyle = '#4a3a24'; const ox = w * .62;
          if (idx < n) { ctx.fillRect(ox, gy - h * .18, w * .05, h * .18); ctx.fillStyle = '#efe9d6'; ctx.font = '16px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(names[idx % names.length].toUpperCase(), ox + w * .025, gy - h * .21); ctx.textAlign = 'left'; }
          FIG.draw(ctx, w * (.15 + rx), gy, s, pose, { color: '#5c5034' });
          // meter
          if (state === 'aim') {
            const mx = w * .15, my = h * .1, mw = w * .7;
            ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(mx, my, mw, 22);
            ctx.fillStyle = '#22a95f'; ctx.fillRect(mx + (zc - zone / 2) * mw, my, zone * mw, 22);
            ctx.fillStyle = '#fff'; ctx.fillRect(mx + needle * mw - 2, my - 6, 4, 34);
          }
          if (flashT > 0) { flashT -= dt; ctx.fillStyle = `rgba(${flashC},${flashT * .5})`; ctx.fillRect(0, 0, w, h); }
          api.hud(`OBSTACLE ${Math.min(idx + 1, n)}/${n} <span>${'&#9829;'.repeat(Math.max(0, lives))}</span>`);
          if (!done && (idx >= n || state === 'fail')) { done = true; api.stopLoop(); const win = idx >= n; resolve({ win, score: lives, text: win ? `Course cleared with ${lives} ${lives === 1 ? 'life' : 'lives'} to spare.` : `You went down at the ${names[idx % names.length].toLowerCase()}.` }); }
        });
      });
    },
  };

  // ---------------- CIPHER ----------------
  DEF.cipher = {
    kicker: 'Intelligence', title: 'Decrypt the Intercept', brief: 'The enemy uses a shift cipher. Turn the dial until the message reads as plain words, then submit.',
    async play(api, o) {
      const msgs = o.messages || [pick(['MEET AT THE OLD PORT', 'THE COURIER MOVES TONIGHT', 'PACKAGE IS IN TRUCK SEVEN', 'HAWK SENDS HIS REGARDS'])];
      let time = (o.time || 75) + (o.intellect || 0) * .3 + META.perk('tactician') * 10, round = 0, shift = 0, keyN = 0;
      const enc = (s, k) => s.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k + 26) % 26 + 65));
      return new Promise(resolve => {
        const wrap = document.createElement('div'); wrap.className = 'cipher-wrap'; api.dom.appendChild(wrap);
        let over = false;
        function setup() {
          keyN = 3 + Math.random() * 20 | 0; shift = 0;
          wrap.innerHTML = `<div class="term">INTERCEPT ${round + 1} OF ${msgs.length}</div><div class="cipher-msg" id="cmsg"></div>
            <div class="dial"><button class="btn" id="cm">&minus;</button><span>SHIFT <b id="cs">0</b></span><button class="btn" id="cp">+</button></div>
            <div class="cipher-out" id="cout"></div><button class="btn primary" id="csub">Submit decryption</button>
            ${o.hint ? `<div class="term" style="color:var(--khaki)">Hint: ${o.hint}</div>` : ''}`;
          $('cmsg').textContent = enc(msgs[round], keyN);
          const upd = () => { $('cs').textContent = shift; $('cout').textContent = enc(enc(msgs[round], keyN), -shift); SFX.tick(); };
          $('cm').onclick = () => { shift = (shift + 25) % 26; upd(); }; $('cp').onclick = () => { shift = (shift + 1) % 26; upd(); };
          $('csub').onclick = () => {
            if (shift === keyN) { SFX.good(); round++; if (round >= msgs.length) finish(true); else setup(); }
            else { SFX.bad(); time -= 8; $('cout').style.color = 'var(--alert)'; setTimeout(() => { const c = $('cout'); if (c) c.style.color = ''; }, 400); }
          };
          upd();
        }
        api.keys({ ArrowLeft: () => $('cm') && $('cm').click(), ArrowRight: () => $('cp') && $('cp').click(), Enter: () => $('csub') && $('csub').click() });
        function finish(win) { if (over) return; over = true; api.stopLoop(); wrap.remove(); resolve({ win, score: time | 0, text: win ? `All intercepts read with ${time | 0}s to spare.` : 'The window closed before you broke the code.' }); }
        setup();
        api.loop(dt => {
          const { w, h } = api.size(), ctx = api.ctx;
          ctx.fillStyle = '#030805'; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = 'rgba(80,255,130,.04)'; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
          time -= dt; api.hud(`TIME ${Math.max(0, time | 0)}s`);
          if (time <= 0) finish(false);
        });
      });
    },
  };

  // ---------------- STEALTH ----------------
  DEF.stealth = {
    kicker: 'Infiltration', title: 'Move Unseen', brief: 'Hold MOVE (or Space) to advance. Release to freeze in the shadows. Do not be inside a light when it is on you.',
    async play(api, o) {
      const diff = o.diff || 2;
      await intro(api, 'Cross to the far side without the alarm meter filling. Crates (dark boxes) always hide you.');
      return new Promise(resolve => {
        let x = .04, moving = false, alarm = 0, done = false;
        const lights = []; const nL = 2 + Math.min(3, diff);
        for (let i = 0; i < nL; i++) lights.push({ c: .2 + i * (.68 / nL) + rnd(0, .05), ph: rnd(0, 6), sp: rnd(.6, 1.1) + diff * .15, r: rnd(.05, .08) });
        const crates = []; for (let i = 0; i < nL + 1; i++) crates.push(.12 + i * (.76 / (nL + 1)) + .03);
        api.keys({ ' ': () => moving = true, ArrowRight: () => moving = true }, { ' ': () => moving = false, ArrowRight: () => moving = false });
        api.button('Hold to MOVE &#9656;', 0, () => moving = true, () => moving = false);
        api.on(api.cv, 'pointerdown', () => moving = true); api.on(api.cv, 'pointerup', () => moving = false); api.on(api.cv, 'pointerleave', () => moving = false);
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          SCENES.S[o.scene || 'karachi'](ctx, w, h, t, api.st || (api.st = {}), dt);
          ctx.fillStyle = 'rgba(0,0,10,.55)'; ctx.fillRect(0, 0, w, h);
          const gy = h * .84, s = h * .2;
          ctx.fillStyle = '#0b0d10'; ctx.fillRect(0, gy, w, h - gy);
          crates.forEach(c => { ctx.fillStyle = '#1a1712'; ctx.fillRect(w * c - w * .03, gy - h * .12, w * .06, h * .12); ctx.strokeStyle = '#2b261c'; ctx.strokeRect(w * c - w * .03, gy - h * .12, w * .06, h * .12); });
          let seen = false;
          const hidden = crates.some(c => Math.abs(x - c) < .028) && !moving;
          lights.forEach(L => {
            const lx = L.c + Math.sin(t * L.sp + L.ph) * .09;
            const g = ctx.createRadialGradient(w * lx, h * .1, 2, w * lx, gy, h * .8); g.addColorStop(0, 'rgba(255,250,210,.4)'); g.addColorStop(1, 'rgba(255,250,210,.05)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * lx - 6, h * .08); ctx.lineTo(w * (lx - L.r), gy); ctx.lineTo(w * (lx + L.r), gy); ctx.lineTo(w * lx + 6, h * .08); ctx.fill();
            ctx.fillStyle = '#ddd'; ctx.fillRect(w * lx - 8, h * .06, 16, 6);
            if (!hidden && Math.abs(x - lx) < L.r * .9) seen = true;
          });
          if (moving && !done) x += dt * (.09 + (o.fitness || 0) * .0004) * (1 + META.perk('commando') * .1);
          alarm = clamp(alarm + (seen ? dt * (moving ? 1.6 : .9) * (1 + diff * .15) : -dt * .35), 0, 1);
          const pose = moving ? FIG.lerp(FIG.P.run1, FIG.P.run2, (Math.sin(t * 9) + 1) / 2) : FIG.P.kneel;
          FIG.draw(ctx, w * x, gy, s, pose, { color: seen ? '#c33' : '#0c0f0c' });
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(w * .2, 12, w * .6, 14); ctx.fillStyle = alarm > .7 ? '#d04a33' : '#e0a83e'; ctx.fillRect(w * .2, 12, w * .6 * alarm, 14);
          ctx.fillStyle = '#efe9d6'; ctx.font = '13px "Barlow Condensed", sans-serif'; ctx.fillText('ALARM', w * .2, 42);
          ctx.fillStyle = 'rgba(80,255,120,.5)'; ctx.fillRect(w * .96, gy - h * .25, 4, h * .25);
          api.hud(`${seen ? '<span style="color:#ff8f78">SPOTTED</span>' : hidden ? 'HIDDEN' : 'IN SHADOW'} <span>${Math.min(100, x / .96 * 100 | 0)}%</span>`);
          if (!done && (alarm >= 1 || x >= .96)) { done = true; api.stopLoop(); const win = x >= .96; resolve({ win, score: (1 - alarm) * 100 | 0, text: win ? 'You slipped through. Nobody will ever know you were there.' : 'A shout, a whistle, running boots. You are blown.' }); }
        });
      });
    },
  };

  // ---------------- DEFUSE ----------------
  DEF.defuse = {
    kicker: 'Bomb disposal', title: 'Defuse the Device', brief: 'Read the defusal card, then cut three wires in the right order. Each wrong cut costs 12 seconds. Two wrong cuts and it blows.',
    async play(api, o) {
      const COLORS = { red: '#d33a2c', blue: '#2f6fd6', yellow: '#e8c53a', green: '#2aa34f', white: '#f1f1ea', black: '#1b1b1b' };
      const names = Object.keys(COLORS);
      let wires, sol;
      // build a puzzle whose rules give a unique 3-cut answer
      for (let tries = 0; tries < 200; tries++) {
        const n = 5 + (Math.random() < .5 ? 1 : 0);
        wires = Array.from({ length: n }, () => pick(names));
        const counts = {}; wires.forEach(c => counts[c] = (counts[c] || 0) + 1);
        const singles = wires.map((c, i) => counts[c] === 1 ? i : -1).filter(i => i >= 0);
        if (singles.length !== 1) continue;
        const a = singles[0];
        let b = -1; for (let i = n - 1; i >= 0; i--) if (wires[i] === 'blue' && i !== a) { b = i; break; }
        if (b < 0) b = [...Array(n).keys()].find(i => i !== a);
        let c = a === 0 ? n - 1 : a - 1; if (c === b) c = [...Array(n).keys()].reverse().find(i => i !== a && i !== b);
        if (c === a) continue;
        sol = [a, b, c]; break;
      }
      let time = (o.time || 50) + (o.intellect || 0) * .15 + META.perk('tactician') * 10, step = 0, wrong = 0, done = false;
      return new Promise(resolve => {
        const wrap = document.createElement('div'); wrap.className = 'defuse-wrap'; api.dom.appendChild(wrap);
        wrap.innerHTML = `<div class="clues"><b>DEFUSAL CARD</b><ol>
          <li>First, cut the only wire whose colour appears exactly once.</li>
          <li>Second, cut the lowest blue wire still intact. If there is none, cut the highest wire still intact.</li>
          <li>Third, cut the wire directly above your first cut. If your first cut was the top wire, cut the bottom wire. If that wire is already cut, cut the lowest wire still intact.</li></ol></div>
          <div class="wires" id="wires"></div><div class="term" id="dstat">Cuts: 0 / 3</div>`;
        const box = $('wires');
        wires.forEach((c, i) => {
          const d = document.createElement('div'); d.className = 'wire'; d.style.background = COLORS[c]; d.title = c + ' wire';
          d.setAttribute('role', 'button'); d.setAttribute('aria-label', `${c} wire, position ${i + 1}`);
          d.onclick = () => {
            if (done || d.classList.contains('cut')) return;
            SFX.cut();
            if (i === sol[step]) { d.classList.add('cut'); step++; $('dstat').textContent = `Cuts: ${step} / 3`; if (step === 3) finish(true); }
            else { wrong++; time -= 12; SFX.bad(); d.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 200); if (wrong >= 2) finish(false); }
          };
          box.appendChild(d);
        });
        function finish(win) { if (done) return; done = true; api.stopLoop(); if (!win) SFX.boom(); resolve({ win, score: time | 0, text: win ? `The timer stops at ${Math.max(0, time) | 0} seconds. You realise you have not breathed for a minute.` : 'A click. A flash. When your hearing returns, people are shouting your name.' }); }
        api.loop(dt => {
          const { w, h } = api.size(), ctx = api.ctx;
          ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, w, h);
          time -= dt;
          api.hud(`<span style="color:${time < 10 ? '#ff8f78' : 'inherit'}">00:${Math.max(0, time | 0).toString().padStart(2, '0')}</span>`);
          if (time <= 0) finish(false);
        });
      });
    },
  };

  // ---------------- MEMORY / RECON ----------------
  DEF.memory = {
    kicker: 'Reconnaissance', title: 'Memorise the Route', brief: 'Watch the route light up on the map grid, then tap the squares in the same order.',
    async play(api, o) {
      const rounds = o.rounds || 3, base = o.start || 4, size = o.grid || 4;
      await intro(api, `${rounds} routes. The first has ${base} waypoints and each one is longer.`);
      return new Promise(resolve => {
        let round = 0, seq = [], input = [], phase = 'show', showT = 0, lit = -1, done = false, flashBad = 0;
        const newSeq = () => { seq = []; const L = base + round; while (seq.length < L) { const c = Math.random() * size * size | 0; if (seq[seq.length - 1] !== c) seq.push(c); } input = []; phase = 'show'; showT = 0; };
        newSeq();
        const cellAt = (mx, my, g) => { const cx = Math.floor((mx - g.x) / g.c), cy = Math.floor((my - g.y) / g.c); return cx >= 0 && cy >= 0 && cx < size && cy < size ? cy * size + cx : -1; };
        let geo = { x: 0, y: 0, c: 1 }, tapFlash = { i: -1, t: 0 };
        api.on(api.cv, 'pointerdown', e => {
          if (phase !== 'input' || done) return;
          const r = api.cv.getBoundingClientRect(), i = cellAt(e.clientX - r.left, e.clientY - r.top, geo);
          if (i < 0) return;
          tapFlash = { i, t: .25 };
          if (seq[input.length] === i) { input.push(i); SFX.tick(); if (input.length === seq.length) { SFX.good(); round++; if (round >= rounds) { done = true; api.stopLoop(); resolve({ win: true, score: round, text: 'Every waypoint, every turn. The route is locked in your head.' }); } else setTimeout(newSeq, 500); phase = 'wait'; } }
          else { SFX.bad(); flashBad = .5; done = true; setTimeout(() => { api.stopLoop(); resolve({ win: false, score: round, text: `You lost the route on waypoint ${input.length + 1}.` }); }, 600); }
        });
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          ctx.fillStyle = '#d8cfae'; ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = 'rgba(70,110,70,.35)'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, h * i / 12); ctx.bezierCurveTo(w * .3, h * i / 12 - 30, w * .6, h * i / 12 + 30, w, h * i / 12); ctx.stroke(); }
          const c = Math.min(w, h) * .82 / size; geo = { x: (w - c * size) / 2, y: (h - c * size) / 2, c };
          if (phase === 'show') { showT += dt; const k = Math.floor(showT / .62); lit = k < seq.length && (showT % .62) < .45 ? seq[k] : -1; if (k >= seq.length) phase = 'input'; }
          for (let i = 0; i < size * size; i++) {
            const x = geo.x + (i % size) * c, y = geo.y + Math.floor(i / size) * c;
            ctx.fillStyle = (i === lit) ? 'rgba(208,74,51,.85)' : (tapFlash.i === i && tapFlash.t > 0) ? 'rgba(15,122,67,.7)' : 'rgba(40,50,30,.12)';
            ctx.fillRect(x + 3, y + 3, c - 6, c - 6); ctx.strokeStyle = 'rgba(40,50,30,.5)'; ctx.strokeRect(x + 3, y + 3, c - 6, c - 6);
            ctx.fillStyle = 'rgba(40,40,30,.5)'; ctx.font = '12px "Share Tech Mono", monospace'; ctx.fillText(String.fromCharCode(65 + (i % size)) + (Math.floor(i / size) + 1), x + 8, y + 18);
          }
          if (tapFlash.t > 0) tapFlash.t -= dt;
          if (flashBad > 0) { flashBad -= dt; ctx.fillStyle = `rgba(200,40,30,${flashBad * .5})`; ctx.fillRect(0, 0, w, h); }
          api.hud(`ROUTE ${Math.min(round + 1, rounds)}/${rounds} <span>${phase === 'show' ? 'WATCH' : phase === 'input' ? `REPEAT ${input.length}/${seq.length}` : ''}</span>`);
        });
      });
    },
  };

  // ---------------- SNIPER ----------------
  DEF.sniper = {
    kicker: 'Long range', title: 'Sniper', brief: 'Aim with mouse or finger. Hold BREATH (Shift or the button) to steady the scope. FIRE on the armed target only.',
    async play(api, o) {
      const diff = o.diff || 2;
      await intro(api, `You have <b>3 rounds</b>. Identify the man with the rifle. Breath runs out if you hold it too long.`);
      return new Promise(resolve => {
        let ax = .5, ay = .5, hold = false, breath = 1, shots = 3, done = false, flash = 0;
        const people = [];
        for (let i = 0; i < 4; i++) people.push({ x: rnd(.15, .85), y: rnd(.45, .7), v: rnd(.02, .05) * (Math.random() < .5 ? -1 : 1), armed: i === 0, down: false });
        const fx = FIG.Fx();
        api.on(api.cv, 'pointermove', e => { const r = api.cv.getBoundingClientRect(); ax = (e.clientX - r.left) / r.width; ay = (e.clientY - r.top) / r.height; });
        const fire = () => {
          if (done || shots <= 0) return;
          shots--; SFX.shot(); flash = .15;
          const { w, h } = api.size();
          const sx = (ax + sway.x), sy = (ay + sway.y);
          let hit = null;
          for (const p of people) { if (p.down) continue; const s = .14; if (Math.abs(sx - p.x) < .025 && sy > p.y - s * .95 && sy < p.y) { hit = p; break; } }
          if (hit) { hit.down = true; fx.blood(hit.x * w, (hit.y - .07) * h); if (hit.armed) { done = true; setTimeout(() => { api.stopLoop(); resolve({ win: true, score: shots, text: 'One shot. The threat is neutralised.' }); }, 700); } else { done = true; setTimeout(() => { api.stopLoop(); resolve({ win: false, score: 0, text: 'That was not the gunman. A civilian is down. This will follow you.', civilian: true }); }, 700); } }
          else if (shots <= 0) { done = true; setTimeout(() => { api.stopLoop(); resolve({ win: false, score: 0, text: 'Three misses. The gunman vanishes into the rocks.' }); }, 500); }
        };
        api.keys({ Shift: () => hold = true, ' ': fire, Enter: fire }, { Shift: () => hold = false });
        api.button('Hold BREATH', 0, () => hold = true, () => hold = false); api.button('FIRE &#9673;', 0, fire);
        api.on(api.cv, 'dblclick', fire);
        const sway = { x: 0, y: 0 };
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          SCENES.S[o.scene || 'snowpost'](ctx, w, h, t, api.st || (api.st = {}), dt);
          people.forEach(p => {
            if (!p.down) { p.x += p.v * dt; if (p.x < .1 || p.x > .9) p.v *= -1; }
            const pose = p.down ? FIG.P.down : FIG.lerp(FIG.P.march1, FIG.P.march2, (Math.sin(t * 3 + p.x * 20) + 1) / 2);
            FIG.draw(ctx, p.x * w, p.y * h, h * .14, pose, { color: p.armed ? '#2a2018' : '#3a3428', rifle: p.armed, facing: p.v > 0 ? 1 : -1, scarf: p.armed ? '#3b2a20' : null });
          });
          fx.update(ctx, dt);
          if (hold && breath > 0) breath = Math.max(0, breath - dt * .32); else { breath = Math.min(1, breath + dt * .2); if (breath === 0) hold = false; }
          const amp = (hold && breath > 0 ? .004 : .03) * (1 + diff * .25) * (1 - META.perk('marksman') * .18) * (1 - B('steady'));
          sway.x = Math.sin(t * 1.3) * amp + Math.sin(t * 3.1) * amp * .4; sway.y = Math.cos(t * 1.7) * amp * .8;
          const cx = (ax + sway.x) * w, cy = (ay + sway.y) * h, R = Math.min(w, h) * .32;
          ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.moveTo(cx + R, cy); ctx.arc(cx, cy, R, 0, Math.PI * 2, true); ctx.fillStyle = 'rgba(0,0,0,.92)'; ctx.fill('evenodd'); ctx.restore();
          ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
          ctx.strokeStyle = '#c33'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.stroke();
          for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 6, cy + i * R / 8); ctx.lineTo(cx + 6, cy + i * R / 8); ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.stroke(); }
          if (flash > 0) { flash -= dt; ctx.fillStyle = `rgba(255,240,200,${flash})`; ctx.fillRect(0, 0, w, h); }
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(16, h - 30, 140, 12); ctx.fillStyle = '#5aa0c8'; ctx.fillRect(16, h - 30, 140 * breath, 12);
          ctx.fillStyle = '#efe9d6'; ctx.font = '12px "Barlow Condensed", sans-serif'; ctx.fillText('BREATH', 16, h - 36);
          api.hud(`ROUNDS ${shots}`);
        });
      });
    },
  };

  // ---------------- DEDUCE ----------------
  DEF.deduce = {
    kicker: 'Counter-intelligence', title: 'Find the Mole', brief: 'Read the clues. Exactly one suspect fits all of them. Choose carefully: you only get one accusation.',
    async play(api, o) {
      const c = o.case;
      return new Promise(resolve => {
        const wrap = document.createElement('div'); wrap.className = 'deduce-wrap'; api.dom.appendChild(wrap);
        wrap.innerHTML = `<div class="clues"><b>${c.title}</b><ul>${c.clues.map(x => `<li>${x}</li>`).join('')}</ul></div><div class="suspects"></div>`;
        const box = wrap.querySelector('.suspects');
        c.suspects.forEach((s, i) => {
          const b = document.createElement('button'); b.className = 'suspect';
          b.innerHTML = `<b>${s.name}</b>${s.facts.map(f => `<span>${f}</span>`).join('')}`;
          b.onclick = () => { SFX.choose(); api.stopLoop(); wrap.remove(); const win = i === c.answer; resolve({ win, score: win ? 1 : 0, text: win ? c.winText : c.loseText }); };
          box.appendChild(b);
        });
        api.loop(() => { const { w, h } = api.size(); api.ctx.fillStyle = '#0b0f0c'; api.ctx.fillRect(0, 0, w, h); });
      });
    },
  };

  // ---------------- TIMED DECISIONS ----------------
  DEF.quiz = {
    kicker: 'Command decisions', title: 'Under Pressure', brief: 'Each decision has a countdown. Pick the best order before the clock runs out.',
    async play(api, o) {
      const qs = o.questions; let i = 0, correct = 0, t = 0, done = false;
      const per = (o.per || 12) + (o.intellect || 0) * .04 + META.perk('tactician') * 2;
      return new Promise(resolve => {
        const wrap = document.createElement('div'); wrap.className = 'deduce-wrap'; api.dom.appendChild(wrap);
        function show() {
          t = per; const q = qs[i];
          wrap.innerHTML = `<div class="clues"><b>${i + 1} / ${qs.length}</b><p style="margin:6px 0 0">${q.q}</p></div><div class="wires" id="qa"></div>`;
          q.a.forEach((a, k) => { const b = document.createElement('button'); b.className = 'btn'; b.style.textTransform = 'none'; b.style.letterSpacing = '0'; b.style.fontFamily = 'var(--body)'; b.style.textAlign = 'left'; b.textContent = a; b.onclick = () => answer(k); $('qa').appendChild(b); });
        }
        function answer(k) { if (done) return; if (k === qs[i].c) { correct++; SFX.good(); } else SFX.bad(); i++; if (i >= qs.length) finish(); else show(); }
        function finish() { done = true; api.stopLoop(); wrap.remove(); const need = o.need || Math.ceil(qs.length * .6); resolve({ win: correct >= need, score: correct, text: `${correct} of ${qs.length} decisions were the right call.` }); }
        show();
        api.loop(dt => {
          const { w, h } = api.size(), ctx = api.ctx; ctx.fillStyle = '#0b0f0c'; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = 'rgba(208,74,51,.25)'; ctx.fillRect(0, h - 8, w * Math.max(0, t / per), 8);
          if (!done) { t -= dt; api.hud(`DECISION ${i + 1}/${qs.length} <span>${Math.max(0, t | 0)}s</span>`); if (t <= 0) answer(-1); }
        });
      });
    },
  };


  // ---------------- ASSAULT: you control the soldier ----------------
  DEF.assault = {
    kicker: 'Assault', title: 'Clear the Objective', brief: 'Move with ◀ ▶ or A/D. Hold CROUCH (S) behind cover. Hold FIRE (Space) when an enemy peeks out. R reloads, G throws a grenade. Clear every hostile and reach the green flag.',
    async play(api, o) {
      const diff = o.diff || 2, P = FIG.P, mk = META.perk('marksman'), ir = META.perk('iron');
      await intro(api, `${o.intro || 'Fight your way to the objective.'}<br><br><b>◀ ▶</b> move &nbsp; <b>CROUCH</b> behind cover &nbsp; <b>FIRE</b> when they peek<br><b>R</b> reload &nbsp; <b>G</b> grenade &nbsp; Pick up green medkits. Never leave a hostage behind.`, 'Go');
      return new Promise(resolve => {
        const rnd = (() => { let q = (o.seed || 7) * 9301 + 49297; return () => ((q = (q * 9301 + 49297) % 233280) / 233280); })();
        const LEN = o.length || 9;
        const covers = [], enemies = [], hostages = [], meds = [];
        let cx = 1.2;
        while (cx < LEN - .8) { covers.push({ x: cx, k: ['sand', 'crate', 'wall', 'car', 'sand'][rnd() * 5 | 0], h: .17 + rnd() * .04 }); cx += .85 + rnd() * .6; }
        const nE = o.enemies || 7;
        for (let i = 0; i < nE; i++) {
          const c = covers[Math.min(covers.length - 1, 1 + Math.floor(i * (covers.length - 1) / nE))];
          const runner = i > 1 && rnd() < .22;
          enemies.push({ x: runner ? c.x + .5 : c.x + .14, hp: 3, max: 3, st: runner ? 'wait' : 'hide', t: .6 + rnd() * 1.5, runner, alive: true, fall: 0, flash: 0 });
        }
        if (o.boss) enemies.push({ x: LEN - .9, hp: 12, max: 12, st: 'hide', t: 1.2, boss: true, name: o.bossName || 'Commander', alive: true, fall: 0, flash: 0 });
        for (let i = 0; i < (o.hostages || 0); i++) hostages.push({ x: 2 + (i + 1) * (LEN - 3) / ((o.hostages || 0) + 1) + .3, saved: false });
        meds.push({ x: LEN * .38, got: false }, { x: LEN * .72, got: false });
        const maxHp = 100 + ir * 15 + B('hp'), MAG = 30 + B('mag'), bud = window.OPS ? OPS.buddy() : null;
        const pl = { x: .4, hp: maxHp, ammo: MAG, gren: 2 + Math.floor(B('gren')), face: 1, reload: 0, cd: 0, hurt: 0, pose: P.aim, step: 0 };
        const keys = { L: 0, R: 0, C: 0, F: 0 };
        const grenades = []; const fx = FIG.Fx(); let over = false, msg = '', msgT = 0, shotsFired = 0, hits = 0, t0 = performance.now();
        const say = m => { msg = m; msgT = 1.6; };
        const doReload = () => { if (pl.reload <= 0 && pl.ammo < MAG) { pl.reload = 1.3; SFX.click(); } };
        const throwG = () => {
          if (pl.gren <= 0 || over) return;
          const tg = enemies.filter(e => e.alive && e.x > pl.x && e.x - pl.x < 3).sort((a, b) => a.x - b.x)[0];
          const tx = tg ? tg.x : pl.x + 2;
          pl.gren--; grenades.push({ x0: pl.x, x1: tx, t: 0 }); SFX.whoosh();
        };
        const set = (k, v) => () => { keys[k] = v; };
        api.keys({ ArrowLeft: set('L', 1), a: set('L', 1), A: set('L', 1), ArrowRight: set('R', 1), d: set('R', 1), D: set('R', 1), ArrowDown: set('C', 1), s: set('C', 1), S: set('C', 1), ' ': set('F', 1), j: set('F', 1), J: set('F', 1), r: doReload, R: doReload, g: throwG, G: throwG },
          { ArrowLeft: set('L', 0), a: set('L', 0), A: set('L', 0), ArrowRight: set('R', 0), d: set('R', 0), D: set('R', 0), ArrowDown: set('C', 0), s: set('C', 0), S: set('C', 0), ' ': set('F', 0), j: set('F', 0), J: set('F', 0) });
        api.button('◀', 0, set('L', 1), set('L', 0)); api.button('▶', 0, set('R', 1), set('R', 0));
        api.button('Crouch', 0, set('C', 1), set('C', 0)); api.button('FIRE ◉', 0, set('F', 1), set('F', 0));
        api.button('R', 0, doReload); api.button('G', 0, throwG);
        let budX = .05, budCd = 1.2, budFlash = 0;
        const protectedFrom = e => keys.C && covers.some(c => c.x > pl.x && c.x - pl.x < .42 && e.x > c.x);
        const st = {};
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx, S = h * .3, gy = h * .86;
          // ---- update ----
          if (!over) {
            const mv = (keys.R - keys.L);
            if (mv) pl.face = mv > 0 ? 1 : -1;
            const sp = (keys.C ? .32 : .78) * (1 + B('speed'));
            pl.x = Math.max(.15, Math.min(LEN - .1, pl.x + mv * sp * dt)); pl.step += Math.abs(mv) * dt * 9;
            if (pl.reload > 0) { pl.reload -= dt; if (pl.reload <= 0) { pl.ammo = MAG; say('Reloaded'); } }
            pl.cd -= dt; pl.hurt = Math.max(0, pl.hurt - dt);
            if (keys.F && pl.reload <= 0 && pl.cd <= 0) {
              if (pl.ammo <= 0) doReload();
              else {
                pl.cd = .12; pl.ammo--; shotsFired++; if (shotsFired % 2) SFX.shot();
                const tg = enemies.filter(e => e.alive && (e.x - pl.x) * pl.face > 0 && Math.abs(e.x - pl.x) < 2.4).sort((a, b) => Math.abs(a.x - pl.x) - Math.abs(b.x - pl.x))[0];
                const mx = (pl.x + pl.face * .2) * h, my = gy - S * (keys.C ? .52 : .78);
                if (tg) {
                  const exposed = tg.st === 'peek' || tg.st === 'run' || tg.st === 'stand';
                  const ty = gy - S * (exposed ? .75 : .35);
                  fx.tracer(mx, my, tg.x * h, ty + (Math.random() - .5) * 14);
                  if (exposed && Math.random() < .5 + mk * .08 - diff * .03 + B('hit')) { tg.hp--; hits++; tg.flash = .12; fx.blood(tg.x * h, ty); if (tg.hp <= 0) { tg.alive = false; tg.fall = 0; SFX.hit(); say(tg.boss ? `${tg.name} is down!` : 'Hostile down'); } }
                  else if (!exposed) fx.sparks((tg.x - .14) * h, gy - h * .17, 4);
                } else fx.tracer(mx, my, mx + pl.face * w * .8, my + (Math.random() - .5) * 20);
                if (pl.ammo === 0) doReload();
              }
            }
            enemies.forEach(e => {
              if (!e.alive) { e.fall = Math.min(1, e.fall + dt * 3); return; }
              e.flash = Math.max(0, e.flash - dt);
              const dist = e.x - pl.x;
              if (dist > 2.7 || dist < -1.5) return;
              e.t -= dt;
              if (e.st === 'wait') { if (dist < 2.4) { e.st = 'run'; } return; }
              if (e.st === 'run') { e.x -= dt * .55; if (e.x - pl.x < 1.05) { e.st = 'stand'; e.t = Math.max(.5, 1.05 - diff * .1); } return; }
              if (e.st === 'hide' && e.t <= 0) { e.st = 'peek'; e.t = Math.max(.45, 1.15 - diff * .12) + (e.boss ? -.1 : 0); }
              else if ((e.st === 'peek' || e.st === 'stand') && e.t <= 0) {
                SFX.shot(); fx.tracer(e.x * h - 10, gy - S * .78, pl.x * h, gy - S * (keys.C ? .5 : .75), '255,140,90');
                const covered = protectedFrom(e), crouchDodge = keys.C && Math.random() < .5;
                if (covered) fx.sparks((pl.x + .3) * h, gy - h * .16, 6);
                else if (!crouchDodge) { const dmg = (8 + diff * 2) * (e.boss ? 1.5 : 1); pl.hp -= dmg; pl.hurt = .35; fx.blood(pl.x * h, gy - S * .7); SFX.hit(); }
                if (e.st === 'stand') { e.t = .9 + Math.random(); } else { e.st = 'hide'; e.t = 1 + Math.random() * 1.4 - diff * .1; }
              }
            });
            grenades.forEach(g => {
              g.t += dt / .9;
              if (g.t >= 1 && !g.done) { g.done = true; fx.boom(g.x1 * h, gy - 10, .7); SFX.boom(); enemies.forEach(e => { if (e.alive && Math.abs(e.x - g.x1) < .5) { e.hp -= e.boss ? 5 : 5; if (e.hp <= 0) { e.alive = false; e.fall = 0; } } }); if (Math.abs(pl.x - g.x1) < .4) { pl.hp -= 25; pl.hurt = .4; } }
            });
            if (bud) {
              budX += (pl.x - .32 * pl.face - budX) * Math.min(1, dt * 2.5); budCd -= dt;
              const bt = enemies.filter(e => e.alive && e.x > budX && e.x - budX < 2.2 && (e.st === 'peek' || e.st === 'stand' || e.st === 'run')).sort((a, b) => a.x - b.x)[0];
              if (bt && budCd <= 0) { budCd = bud.rate; budFlash = .08; SFX.shot(); fx.tracer((budX + .2) * h, gy - S * .7, bt.x * h, gy - S * .72, '160,255,180'); if (Math.random() < .7) { bt.hp--; bt.flash = .12; fx.blood(bt.x * h, gy - S * .72); if (bt.hp <= 0) { bt.alive = false; bt.fall = 0; SFX.hit(); say(`${bud.name.split(' ').slice(-1)[0]} got one!`); } } }
              budFlash = Math.max(0, budFlash - dt);
            }
            hostages.forEach(hg => { if (!hg.saved && Math.abs(pl.x - hg.x) < .18) { hg.saved = true; say('Hostage secured'); SFX.good(); } });
            meds.forEach(m => { if (!m.got && Math.abs(pl.x - m.x) < .15) { m.got = true; const heal = 35 + B('med'); pl.hp = Math.min(maxHp, pl.hp + heal); say(`+${heal} health`); SFX.good(); } });
            const left = enemies.filter(e => e.alive).length;
            if (pl.hp <= 0) {
              over = true; pl.hp = 0; setTimeout(() => { api.stopLoop(); resolve({ win: false, score: 0, text: 'You go down hard. Your team drags you out under covering fire.' }); }, 1200);
            } else if (pl.x >= LEN - .25 && left === 0) {
              over = true;
              const hpK = pl.hp / maxHp, allSaved = hostages.every(x => x.saved);
              const stars = hpK >= .6 && allSaved ? 3 : hpK >= .3 ? 2 : 1;
              if (hpK >= .5) META.unlock('assault');
              const secs = (performance.now() - t0) / 1000 | 0;
              setTimeout(() => { api.stopLoop(); resolve({ win: true, score: pl.hp | 0, stars, text: `Objective secured in ${secs}s. ${hostages.filter(x => x.saved).length}/${hostages.length} hostages rescued, accuracy ${shotsFired ? Math.round(hits / shotsFired * 100) : 0}%.` }); }, 900);
            } else if (pl.x >= LEN - .3 && left > 0 && msgT <= 0) say(`${left} hostile${left > 1 ? 's' : ''} still active`);
          }
          // ---- draw ----
          const camPx = Math.max(0, Math.min(LEN * h - w * .9, pl.x * h - w * .32));
          st.cam = { x: (camPx / Math.max(1, LEN * h - w)) * 2 - 1, z: 1.04, y: 0 };
          (SCENES.S[o.scene || 'valley'])(ctx, w, h, t, st, dt);
          const sk = fx.shake > 0 ? fx.shake * 10 : 0; fx.shake = Math.max(0, fx.shake - dt * 2.4);
          ctx.save(); ctx.translate(-camPx + (Math.random() - .5) * sk, (Math.random() - .5) * sk);
          const gg = ctx.createLinearGradient(0, gy - 6, 0, h); gg.addColorStop(0, o.ground || 'rgba(60,48,34,.55)'); gg.addColorStop(1, 'rgba(10,8,6,.8)');
          ctx.fillStyle = gg; ctx.fillRect(camPx - 10, gy - 6, w + 20, h - gy + 6);
          // exit flag
          const fxp = LEN * h; ctx.fillStyle = '#ccc'; ctx.fillRect(fxp, gy - h * .32, 3, h * .32);
          const clear = enemies.every(e => !e.alive); ctx.fillStyle = clear ? '#22c55e' : '#c0392b'; ctx.beginPath(); ctx.moveTo(fxp + 3, gy - h * .32); ctx.lineTo(fxp + 40 + Math.sin(t * 5) * 3, gy - h * .29); ctx.lineTo(fxp + 3, gy - h * .26); ctx.fill();
          meds.forEach(m => { if (m.got) return; const mx = m.x * h, my = gy - 14 + Math.sin(t * 3) * 3; ctx.fillStyle = '#f2f2ee'; ctx.fillRect(mx - 11, my - 9, 22, 18); ctx.fillStyle = '#22a95f'; ctx.fillRect(mx - 3, my - 7, 6, 14); ctx.fillRect(mx - 7, my - 3, 14, 6); SCENES.helpers.lamp(ctx, mx, my, 30, t, '80,255,140', 0); });
          hostages.forEach(hg => FIG.draw(ctx, hg.x * h, gy, S * .9, hg.saved ? P.stand : P.kneel, { color: '#b8a888', skin: '#c99468', facing: -1 }));
          if (hostages.some(hg => !hg.saved)) hostages.forEach(hg => { if (!hg.saved) { ctx.fillStyle = '#ffcf4a'; ctx.font = 'bold 13px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HOSTAGE', hg.x * h, gy - S * .75); ctx.textAlign = 'left'; } });
          enemies.forEach(e => {
            const ex = e.x * h;
            let pose = e.st === 'hide' ? P.kneel : (e.st === 'run' || e.st === 'wait') ? FIG.lerp(P.run1, P.run2, (Math.sin(t * 10 + e.x) + 1) / 2) : P.aim;
            if (!e.alive) pose = FIG.lerp(P.hit, P.down, e.fall);
            FIG.draw(ctx, ex, gy, S * (e.boss ? 1.1 : 1), pose, { color: e.flash > 0 ? '#ffffff' : (e.boss ? '#121212' : '#2a2420'), facing: -1, rifle: e.alive, scarf: '#3a2a20', flash: e.alive && (e.st === 'peek' || e.st === 'stand') && e.t < .08, skin: '#9e6c46' });
            if (e.alive && (e.st === 'peek' || e.st === 'stand') && Math.abs(e.x - pl.x) < 2.7) {
              const k = 1 - Math.max(0, e.t) / 1.1; ctx.strokeStyle = `rgba(255,40,30,${.25 + k * .6})`; ctx.lineWidth = 1.4; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(ex - 18, gy - S * .78); ctx.lineTo(pl.x * h, gy - S * (keys.C ? .5 : .75)); ctx.stroke(); ctx.setLineDash([]);
              ctx.fillStyle = '#ff3b30'; ctx.font = 'bold 18px "Saira Stencil One", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', ex, gy - S * 1.15); ctx.textAlign = 'left';
            }
            if (e.boss && e.alive) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(ex - 40, gy - S * 1.3, 80, 7); ctx.fillStyle = '#d04a33'; ctx.fillRect(ex - 40, gy - S * 1.3, 80 * e.hp / e.max, 7); ctx.fillStyle = '#efe9d6'; ctx.font = '12px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(e.name.toUpperCase(), ex, gy - S * 1.34); ctx.textAlign = 'left'; }
          });
          covers.forEach(c => {
            const x = c.x * h, ch = h * c.h;
            if (c.k === 'sand') { for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - (r % 2); i++) { const bx = x - h * .1 + i * h * .055 + (r % 2) * h * .027, by = gy - r * ch / 4 - ch / 8; const g = ctx.createLinearGradient(0, by - 8, 0, by + 8); g.addColorStop(0, '#c2b08a'); g.addColorStop(1, '#7c6a48'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(bx, by, h * .03, ch / 8, 0, 0, 7); ctx.fill(); } }
            else if (c.k === 'crate') { const g = ctx.createLinearGradient(x - h * .09, 0, x + h * .09, 0); g.addColorStop(0, '#7a5a34'); g.addColorStop(1, '#4a3420'); ctx.fillStyle = g; ctx.fillRect(x - h * .09, gy - ch, h * .18, ch); ctx.strokeStyle = '#2e2014'; ctx.lineWidth = 3; ctx.strokeRect(x - h * .09, gy - ch, h * .18, ch); ctx.beginPath(); ctx.moveTo(x - h * .09, gy - ch); ctx.lineTo(x + h * .09, gy); ctx.stroke(); }
            else if (c.k === 'wall') { const g = ctx.createLinearGradient(x - h * .1, 0, x + h * .1, 0); g.addColorStop(0, '#a88a64'); g.addColorStop(1, '#6e583e'); ctx.fillStyle = g; ctx.fillRect(x - h * .1, gy - ch * 1.05, h * .2, ch * 1.05); ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 4; i++) ctx.fillRect(x - h * .1, gy - ch * 1.05 + i * ch * .27, h * .2, 2); }
            else { FIG.car(ctx, x, gy, h * .13, '#3a3a38', false, -1); }
          });
          grenades.forEach(g => { if (g.done) return; const k = Math.min(1, g.t), gx = (g.x0 + (g.x1 - g.x0) * k) * h, gyy = gy - S * .8 - Math.sin(k * Math.PI) * h * .25; ctx.fillStyle = '#1a1a14'; ctx.beginPath(); ctx.arc(gx, gyy, 5, 0, 7); ctx.fill(); });
          if (bud) FIG.draw(ctx, budX * h, gy, S * .94, budFlash > 0 || Math.abs(budX - (pl.x - .32 * pl.face)) < .05 ? P.aim : FIG.lerp(P.run1, P.run2, (Math.sin(t * 9) + 1) / 2), { color: '#4a5232', helmet: '#3a4028', rifle: true, vest: true, facing: 1, flash: budFlash > 0, skin: '#b07a52', rim: 'rgba(160,255,180,.3)' });
          // player
          const moving = keys.L || keys.R;
          let pp = keys.C ? (keys.F ? P.crouchAim : P.kneel) : moving ? FIG.lerp(Object.assign({}, P.run1, { ua1: 80, la1: 10 }), Object.assign({}, P.run2, { ua1: 80, la1: 10 }), (Math.sin(pl.step) + 1) / 2) : P.aim;
          if (pl.reload > 0) pp = Object.assign({}, keys.C ? P.kneel : P.stand, { ua1: 40, la1: 90 });
          if (pl.hp <= 0) pp = P.down;
          FIG.draw(ctx, pl.x * h, gy, S, pp, { color: o.pColor || '#4c5634', helmet: o.pBeret ? null : '#3a4028', beret: o.pBeret || null, rifle: true, vest: true, pack: '#3a3e2a', facing: pl.face, flash: keys.F && pl.cd > .06 && pl.reload <= 0 && pl.ammo > 0, skin: '#a8754e', rim: 'rgba(255,230,190,.4)' });
          fx.update(ctx, dt);
          ctx.restore();
          SCENES.bloom(ctx, api.cv, .3);
          // ---- HUD ----
          if (pl.hurt > 0) { const g = ctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .7); g.addColorStop(0, 'rgba(200,0,0,0)'); g.addColorStop(1, `rgba(200,0,0,${pl.hurt * 1.2})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
          ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(14, 14, 200, 14); ctx.fillStyle = pl.hp / maxHp < .3 ? '#d04a33' : '#22a95f'; ctx.fillRect(14, 14, 200 * Math.max(0, pl.hp) / maxHp, 14);
          ctx.fillStyle = '#efe9d6'; ctx.font = '13px "Barlow Condensed", sans-serif'; ctx.fillText(`HEALTH ${Math.max(0, pl.hp | 0)}`, 16, 44);
          ctx.font = '22px "Share Tech Mono", monospace'; ctx.textAlign = 'right'; ctx.fillText(pl.reload > 0 ? 'RELOADING' : `${pl.ammo}/${MAG}`, w - 16, 34); ctx.font = '13px "Barlow Condensed", sans-serif'; ctx.fillText(`GRENADES ${pl.gren}   HOSTILES ${enemies.filter(e => e.alive).length}`, w - 16, 52); ctx.textAlign = 'left';
          const prog = pl.x / LEN; ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(w * .3, h - 14, w * .4, 5); ctx.fillStyle = '#e0a83e'; ctx.fillRect(w * .3, h - 14, w * .4 * prog, 5);
          hostages.forEach(hg => { ctx.fillStyle = hg.saved ? '#22a95f' : '#ffcf4a'; ctx.fillRect(w * .3 + w * .4 * hg.x / LEN - 2, h - 18, 4, 13); });
          if (msgT > 0) { msgT -= dt; ctx.fillStyle = `rgba(255,255,255,${Math.min(1, msgT)})`; ctx.font = '20px "Saira Stencil One", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(msg.toUpperCase(), w / 2, h * .2); ctx.textAlign = 'left'; }
          api.hud(`${Math.round(prog * 100)}% <span>${hostages.filter(x => x.saved).length}/${hostages.length} hostages</span>`);
        });
      });
    },
  };

  function starsFor(type, res, o) {
    if (!res.win) return 0;
    if (res.stars !== undefined) return res.stars;
    const s = res.score || 0;
    switch (type) {
      case 'shoot': return s >= (o.need || 12) + 4 ? 3 : s >= (o.need || 12) + 2 ? 2 : 1;
      case 'fight': return s >= 60 ? 3 : s >= 30 ? 2 : 1;
      case 'obstacle': return s >= (o.lives || 3) ? 3 : s >= (o.lives || 3) - 1 ? 2 : 1;
      case 'cipher': return s >= 40 ? 3 : s >= 20 ? 2 : 1;
      case 'stealth': return s >= 75 ? 3 : s >= 45 ? 2 : 1;
      case 'defuse': return s >= 20 ? 3 : s >= 8 ? 2 : 1;
      case 'sniper': return s >= 2 ? 3 : s >= 1 ? 2 : 1;
      case 'quiz': { const n = (o.questions || []).length; return s >= n ? 3 : s >= n - 1 ? 2 : 1; }
      default: return 3;
    }
  }
  // pause menu: Resume, Restart or Quit. The Back key and the pause button both open it.
  function pauseMenu(on = !paused) {
    if (!cur) return;
    paused = on; const old = document.getElementById('pauseBox'); if (old) old.remove();
    $('gamePause').textContent = paused ? '▶ Resume' : '❚❚ Pause';
    if (!paused) return;
    SFX.click();
    const box = document.createElement('div'); box.className = 'gcenter pausebox'; box.id = 'pauseBox';
    box.innerHTML = `<h4>Paused</h4><p>${$('gameTitle').textContent}</p><div class="row col"><button class="btn primary" data-p="resume">▶ Resume</button><button class="btn" data-p="restart">⟳ Restart mission</button><button class="btn danger" data-p="quit">✕ Quit mission</button></div>`;
    box.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const a = b.dataset.p; SFX.click(); pauseMenu(false); if (a !== 'resume') cur.quit(a); });
    $('gameDom').appendChild(box);
  }
  async function run(type, opts = {}) {
    const def = DEF[type];
    if (!def) return { win: true, score: 0 };
    let res;
    while (true) {
      const api = makeApi(def, opts);
      let quitRes; const quitP = new Promise(r => { quitRes = r; });
      cur = { quit: how => quitRes({ win: false, score: 0, quit: how, text: how === 'restart' ? '' : 'You called off the mission.' }) };
      paused = false; $('gamePause').hidden = false; $('gamePause').textContent = '❚❚ Pause';
      try { res = await Promise.race([def.play(api, opts), quitP]); } catch (e) { console.error(e); res = { win: true, score: 0, text: '' }; }
      cur = null; paused = false; $('gamePause').hidden = true; const pb = document.getElementById('pauseBox'); if (pb) pb.remove();
      api.stopLoop();
      if (res.quit) { api.dom.innerHTML = ''; if (res.quit === 'restart') { api.end(); continue; } }
      res.stars = starsFor(type, res, opts);
      const earned = window.META ? META.recordMission(opts.key || `${type}:${opts.title || def.title}`, res.stars) : 0;
      let extra = '';
      try { if (window.OPS) extra = OPS.rewardHtml(OPS.afterMission(type, res, opts)); } catch (e) { console.error(e); }
      const choice = await result(api, res.win, res.text || '', opts.retry !== false, res.stars, earned, extra);
      api.end(); api.dom.innerHTML = '';
      if (choice !== 'retry') break;
    }
    $('game').hidden = true;
    return res;
  }
  return { run, DEF, pause: () => pauseMenu(), get active() { return !!cur; } };
})();
