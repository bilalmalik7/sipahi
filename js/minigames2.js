// More playable missions, all one-finger: tank duel, gunship, HALO jump, hold the post.
// Gear and squad bonuses from Operations (OPS.bonus) make them easier as you level up.
(() => {
  const DEF = GAMES.DEF;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];
  const B = k => (window.OPS ? OPS.bonus(k) : 0);
  const buddy = () => (window.OPS ? OPS.buddy() : null);
  const font = (px, f = 'Barlow Condensed') => `${px}px "${f}", sans-serif`;

  function intro(api, text, btn = 'Begin') {
    return new Promise(res => {
      const box = document.createElement('div'); box.className = 'gcenter';
      box.innerHTML = `<p>${text}</p><div class="row"><button class="btn primary">${btn}</button></div>`;
      box.querySelector('button').onclick = () => { SFX.click(); box.remove(); res(); };
      api.dom.appendChild(box);
    });
  }
  // floating combat text
  function Pops() {
    const list = [];
    return {
      add(x, y, txt, c = '#fff', size = 18) { list.push({ x, y, txt, c, size, t: 0 }); },
      draw(ctx, dt) {
        ctx.textAlign = 'center';
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i]; p.t += dt; if (p.t > 1.1) { list.splice(i, 1); continue; }
          const k = p.t / 1.1, sc = p.t < .12 ? .6 + p.t / .12 * .6 : 1.2 - Math.min(.2, (p.t - .12));
          ctx.globalAlpha = 1 - k * k; ctx.fillStyle = p.c; ctx.font = font(p.size * sc, 'Saira Stencil One');
          ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3; ctx.strokeText(p.txt, p.x, p.y - k * 40); ctx.fillText(p.txt, p.x, p.y - k * 40);
        }
        ctx.globalAlpha = 1; ctx.textAlign = 'left';
      },
    };
  }
  function bar(ctx, x, y, w, k, c, label) {
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = c; ctx.fillRect(x, y, w * clamp(k, 0, 1), 12);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.strokeRect(x + .5, y + .5, w - 1, 11);
    if (label) { ctx.fillStyle = '#efe9d6'; ctx.font = font(12); ctx.fillText(label, x, y - 4); }
  }
  function banner(ctx, w, h, txt, sub, k) {
    if (k <= 0) return;
    const a = Math.min(1, k * 2);
    ctx.fillStyle = `rgba(0,0,0,${.45 * a})`; ctx.fillRect(0, h * .36, w, h * .2);
    ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,207,74,${a})`; ctx.font = font(Math.min(54, w * .09), 'Saira Stencil One');
    ctx.fillText(txt, w / 2 + (1 - a) * 60, h * .47);
    if (sub) { ctx.fillStyle = `rgba(239,233,214,${a})`; ctx.font = font(16); ctx.fillText(sub, w / 2, h * .53); }
    ctx.textAlign = 'left';
  }

  // ======================= TANK DUEL =======================
  function drawTank(ctx, x, y, s, slope, aim, col, face, flash, hpK, isPlayer, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(slope);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 2, s * .62, s * .06, 0, 0, 7); ctx.fill();
    // tracks
    ctx.fillStyle = '#1a1a16'; ctx.beginPath(); ctx.arc(-s * .46, -s * .1, s * .1, Math.PI / 2, Math.PI * 1.5); ctx.arc(s * .46, -s * .1, s * .1, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3a32'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-s * .45 + i * s * .18, -s * .1, s * .065, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; for (let i = 0; i < 14; i++) { const k = ((i / 14 + t * .3 * (isPlayer ? 0 : 0)) % 1); ctx.beginPath(); ctx.moveTo(-s * .54 + k * s * 1.08, -s * .2); ctx.lineTo(-s * .54 + k * s * 1.08, -s * .17); ctx.stroke(); }
    // hull
    const g = ctx.createLinearGradient(0, -s * .38, 0, -s * .18); g.addColorStop(0, CHAR.mix(col, '#ffffff', .18)); g.addColorStop(1, CHAR.mix(col, '#000000', .35));
    ctx.fillStyle = flash > 0 ? '#ffffff' : g; ctx.beginPath();
    ctx.moveTo(-s * .58 * face, -s * .2); ctx.lineTo(-s * .5 * face, -s * .36); ctx.lineTo(s * .42 * face, -s * .36); ctx.lineTo(s * .62 * face, -s * .22); ctx.lineTo(s * .55 * face, -s * .2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-s * .45, -s * .27, s * .9, s * .025);
    // barrel
    ctx.save(); ctx.translate(s * .02 * face, -s * .44); ctx.rotate(aim);
    ctx.fillStyle = CHAR.mix(col, '#000000', .3); ctx.fillRect(0, -s * .03, s * .62, s * .06); ctx.fillRect(s * .56, -s * .045, s * .08, s * .09);
    ctx.restore();
    // turret
    const tg = ctx.createRadialGradient(-s * .05, -s * .5, 2, 0, -s * .42, s * .26); tg.addColorStop(0, CHAR.mix(col, '#ffffff', .25)); tg.addColorStop(1, CHAR.mix(col, '#000000', .3));
    ctx.fillStyle = flash > 0 ? '#ffffff' : tg; ctx.beginPath(); ctx.ellipse(s * .02 * face, -s * .38, s * .24, s * .13, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-s * .22 + s * .02 * face, -s * .4, s * .48, s * .05);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(-s * .06 * face, -s * .5, s * .04, 0, 7); ctx.fill();
    // antenna
    ctx.strokeStyle = 'rgba(20,20,20,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-s * .16 * face, -s * .46); ctx.quadraticCurveTo(-s * .2 * face + Math.sin(t * 3) * 3, -s * .7, -s * .24 * face + Math.sin(t * 3 + 1) * 5, -s * .9); ctx.stroke();
    if (isPlayer) { ctx.fillStyle = '#01411c'; ctx.fillRect(-s * .24 * face, -s * .9, s * .12 * face, s * .08); ctx.fillStyle = '#fff'; ctx.fillRect(-s * .24 * face, -s * .9, s * .03 * face, s * .08); }
    ctx.restore();
    if (hpK !== null) bar(ctx, x - s * .4, y - s * 1.05, s * .8, hpK, hpK > .5 ? '#22a95f' : hpK > .25 ? '#e0a83e' : '#d04a33');
  }

  DEF.tank = {
    kicker: 'Armour', title: 'Tank Duel', brief: 'Drag back from anywhere and let go to fire, like a slingshot. The dotted arc shows your aim. Wind pushes the shell.',
    async play(api, o) {
      const diff = o.diff || 2, nE = o.enemies || 2;
      await intro(api, `Destroy <b>${nE}</b> enemy tank${nE > 1 ? 's' : ''} before they find your range.<br><br><b>Drag back</b> and <b>let go</b> to fire. Pull further for more power.`, 'Mount up');
      return new Promise(resolve => {
        const N = 140, gnd = [], sd = Math.random() * 10, hilly = o.hilly ?? 1;
        for (let i = 0; i <= N; i++) { const x = i / N; gnd.push(.76 + Math.sin(x * 5 + sd) * .035 + Math.sin(x * 13 + sd * 2) * .018 - Math.sin(x * Math.PI) * .12 * hilly); }
        const flatten = xf => { const c = Math.round(xf * N); for (let i = c - 5; i <= c + 5; i++) if (gnd[i] !== undefined) gnd[i] = gnd[i] * .4 + gnd[c] * .6; };
        const gy = xf => { const f = clamp(xf, 0, 1) * N, i = Math.floor(f), k = f - i; return (gnd[i] ?? gnd[N]) * (1 - k) + (gnd[i + 1] ?? gnd[N]) * k; };
        const slope = xf => Math.atan2((gy(xf + .02) - gy(xf - .02)), .04 * (16 / 9));
        const maxHp = 100 + B('hp');
        const pl = { x: .1, hp: maxHp, aim: -.6, cd: 0, flash: 0, dead: false };
        flatten(pl.x);
        const enemies = [];
        for (let i = 0; i < nE; i++) { const x = nE === 1 ? .82 : .6 + i * (.32 / (nE - 1)); flatten(x); enemies.push({ x, hp: 100, cd: rnd(2.6, 4) + i * 1.2, err: .22 - diff * .015, flash: 0, aim: Math.PI + .7, dead: false, fall: 0 }); }
        let wind = o.wind ?? rnd(-1, 1) * (.4 + diff * .25);
        const shells = [], fx = FIG.Fx(), pops = Pops(); const st = {};
        let drag = null, over = false, shots = 0, hits = 0, msg = 'DRAG BACK & RELEASE', msgT = 3.5;
        const toPx = (e) => { const r = api.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        api.on(api.cv, 'pointerdown', e => { if (over) return; drag = { a: toPx(e), b: toPx(e) }; api.cv.setPointerCapture && api.cv.setPointerCapture(e.pointerId); });
        api.on(api.cv, 'pointermove', e => { if (drag) drag.b = toPx(e); });
        const release = () => {
          if (!drag) return; const d = drag; drag = null;
          const { h } = api.size(); const dx = d.a[0] - d.b[0], dy = d.a[1] - d.b[1], len = Math.hypot(dx, dy);
          if (len < 12 || pl.cd > 0 || over) return;
          fire(pl, Math.atan2(dy, dx), clamp(len / (h * .4), .15, 1), true);
        };
        api.on(api.cv, 'pointerup', release); api.on(api.cv, 'pointercancel', release);
        let lastAim = { a: -.75, p: .6 };
        const shootLast = () => { if (pl.cd <= 0 && !over) fire(pl, lastAim.a, lastAim.p, true); };
        api.button('Fire again ◉', 0, shootLast);
        api.keys({ ' ': shootLast, Enter: shootLast });
        function muzzlePt(tk, w, h, s) { const x = tk.x * w, y = gy(tk.x) * h; const sl = slope(tk.x); const bx = x + Math.cos(sl) * 0 - Math.sin(sl) * (-s * .44), by = y + Math.sin(sl) * 0 + Math.cos(sl) * (-s * .44); return [bx + Math.cos(tk.aim + sl) * s * .64, by + Math.sin(tk.aim + sl) * s * .64]; }
        function fire(tk, ang, pow, own) {
          const { w, h } = api.size(), s = Math.min(h * .13, w * .12);
          tk.aim = ang - slope(tk.x);
          const [mx, my] = muzzlePt(tk, w, h, s), v = pow * h * 1.75;
          shells.push({ x: mx, y: my, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, own, t: 0, trail: [] });
          fx.sparks(mx, my, 10, '255,210,120'); SFX.boom(); tk.cd = own ? 1.1 : rnd(3.2, 4.8) - diff * .3;
          if (own) { shots++; lastAim = { a: ang, p: pow }; wind = clamp(wind + rnd(-.25, .25), -1.6, 1.6); }
        }
        function explode(x, y, own) {
          const { w, h } = api.size(), s = Math.min(h * .13, w * .12), R = s * .85;
          fx.boom(x, y, .8); SFX.boom();
          const c = x / w * N, r = R / w * N;
          for (let i = Math.floor(c - r); i <= Math.ceil(c + r); i++) if (gnd[i] !== undefined) { const k = 1 - Math.pow((i - c) / r, 2); if (k > 0) gnd[i] = Math.min(.97, gnd[i] + k * .028); }
          const hurt = (tk, isPl) => {
            if (tk.dead) return; const tx = tk.x * w, ty = gy(tk.x) * h - s * .3, d = Math.hypot(tx - x, ty - y);
            if (d < R * 1.15) {
              const dmg = Math.round((isPl ? (.75 + diff * .1) : 1) * (60 * (1 - d / (R * 1.15)) + 18));
              tk.hp -= dmg; tk.flash = .15; pops.add(tx, ty - s * .5, `-${dmg}`, isPl ? '#ff8a7a' : '#ffcf4a', d < R * .4 ? 26 : 18);
              if (!isPl && own) { hits++; if (d < R * .4) { msg = 'DIRECT HIT!'; msgT = 1.2; } }
              if (tk.hp <= 0) { tk.dead = true; tk.hp = 0; fx.boom(tx, ty, 1.3); SFX.boom(); if (!isPl) { msg = 'TANK DESTROYED'; msgT = 1.5; } }
            }
          };
          hurt(pl, true); enemies.forEach(e => hurt(e, false));
          SFX.hit();
        }
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx, s = Math.min(h * .13, w * .12), g = h * 1.1, ax = wind * h * .14;
          // AI
          if (!over) enemies.forEach(e => {
            e.flash = Math.max(0, e.flash - dt); if (e.dead) { e.fall += dt; return; }
            e.cd -= dt;
            if (e.cd <= 0) {
              const th = 50 * Math.PI / 180, ex = e.x * w, ey = gy(e.x) * h - s * .44, X = ex - pl.x * w, Y = ey - (gy(pl.x) * h - s * .2);
              let den = 2 * Math.cos(th) ** 2 * (X * Math.tan(th) + Y); let v = den > 0 ? Math.sqrt(g * X * X / den) : h * 1.2;
              v -= (ax * (X / Math.max(1, v)) * .4); v *= 1 + (Math.random() * 2 - 1) * e.err; e.err = Math.max(.025, e.err * .68);
              fire(e, Math.PI + th, clamp(v / (h * 1.75), .15, 1.1), false);
            }
          });
          pl.cd -= dt; pl.flash = Math.max(0, pl.flash - dt);
          if (drag) { const dx = drag.a[0] - drag.b[0], dy = drag.a[1] - drag.b[1]; if (Math.hypot(dx, dy) > 8) pl.aim = Math.atan2(dy, dx) - slope(pl.x); }
          // background & terrain
          st.cam = { x: -.3, z: 1.02, y: 0 };
          SCENES.S[o.scene || 'valley'](ctx, w, h, t, st, dt);
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, 0, w, h);
          const tg = ctx.createLinearGradient(0, h * .55, 0, h); tg.addColorStop(0, o.earth || '#7a6a44'); tg.addColorStop(1, '#2a2216');
          ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(0, h); for (let i = 0; i <= N; i++) ctx.lineTo(i / N * w, gnd[i] * h); ctx.lineTo(w, h); ctx.fill();
          ctx.strokeStyle = o.grass || '#6b7a3c'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i <= N; i++) ctx[i ? 'lineTo' : 'moveTo'](i / N * w, gnd[i] * h + 1); ctx.stroke();
          // shells
          for (let i = shells.length - 1; i >= 0; i--) {
            const sh = shells[i]; sh.t += dt; sh.vy += g * dt; sh.vx += ax * dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
            sh.trail.push([sh.x, sh.y]); if (sh.trail.length > 14) sh.trail.shift();
            let boom = sh.y >= gy(sh.x / w) * h;
            if (!boom && sh.t > .15) for (const tk of [pl, ...enemies]) { if (tk.dead) continue; if (Math.hypot(tk.x * w - sh.x, gy(tk.x) * h - s * .3 - sh.y) < s * .45) boom = true; }
            if (boom) { explode(sh.x, Math.min(sh.y, gy(sh.x / w) * h), sh.own); shells.splice(i, 1); continue; }
            if (sh.x < -w * .2 || sh.x > w * 1.2 || sh.y > h * 1.2) { shells.splice(i, 1); continue; }
            ctx.strokeStyle = 'rgba(255,220,160,.5)'; ctx.lineWidth = 3; ctx.beginPath(); sh.trail.forEach((p, k) => ctx[k ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.stroke();
            ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(sh.x, sh.y, 4, 0, 7); ctx.fill(); SCENES.helpers.lamp(ctx, sh.x, sh.y, 18, t, '255,200,120', 0);
          }
          // tanks
          drawTank(ctx, pl.x * w, gy(pl.x) * h, s, slope(pl.x), pl.aim, '#56603a', 1, pl.flash, pl.hp / maxHp, true, t);
          enemies.forEach(e => {
            if (e.dead) { ctx.save(); ctx.globalAlpha = Math.max(.35, 1 - e.fall * .4); drawTank(ctx, e.x * w, gy(e.x) * h, s, slope(e.x) + .12, e.aim - .5, '#2a2622', -1, 0, null, false, t); ctx.restore(); SCENES.helpers.smoke(ctx, st, 'sm_tk' + e.x, e.x * w, gy(e.x) * h - s * .4, dt, '60,55,50', 6, 1.2); SCENES.helpers.fire(ctx, e.x * w, gy(e.x) * h - s * .3, s * .3, t, st, dt); return; }
            drawTank(ctx, e.x * w, gy(e.x) * h, s, slope(e.x), e.aim - slope(e.x), o.enemyColor || '#6a6250', -1, e.flash, e.hp / 100, false, t);
            if (e.cd < 1 && !over) { ctx.fillStyle = `rgba(255,60,40,${.5 + .5 * Math.sin(t * 18)})`; ctx.font = font(22, 'Saira Stencil One'); ctx.textAlign = 'center'; ctx.fillText('!', e.x * w, gy(e.x) * h - s * 1.2); ctx.textAlign = 'left'; }
          });
          // aim preview
          if (drag && !over) {
            const dx = drag.a[0] - drag.b[0], dy = drag.a[1] - drag.b[1], len = Math.hypot(dx, dy);
            if (len > 8) {
              const pow = clamp(len / (h * .4), .15, 1), ang = Math.atan2(dy, dx), v = pow * h * 1.75;
              let [x, y] = muzzlePt(pl, w, h, s), vx = Math.cos(ang) * v, vy = Math.sin(ang) * v;
              const steps = 22 + B('steady') * 60 | 0;
              for (let i = 0; i < steps; i++) { for (let k = 0; k < 3; k++) { vy += g * .012; vx += ax * .012; x += vx * .012; y += vy * .012; } ctx.fillStyle = `rgba(255,255,255,${.85 - i / steps * .7})`; ctx.beginPath(); ctx.arc(x, y, 3.2 - i / steps * 2, 0, 7); ctx.fill(); }
              ctx.strokeStyle = 'rgba(255,207,74,.6)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(drag.a[0], drag.a[1]); ctx.lineTo(drag.b[0], drag.b[1]); ctx.stroke(); ctx.setLineDash([]);
              ctx.fillStyle = '#efe9d6'; ctx.font = font(15); ctx.fillText(`POWER ${Math.round(pow * 100)}%`, drag.b[0] + 12, drag.b[1] + 4);
            }
          }
          fx.update(ctx, dt); pops.draw(ctx, dt);
          SCENES.bloom(ctx, api.cv, .3);
          // HUD: wind
          ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(w / 2 - 70, 12, 140, 30); ctx.fillStyle = '#efe9d6'; ctx.font = font(13); ctx.textAlign = 'center';
          const arrows = wind > 0 ? '▶'.repeat(Math.ceil(Math.abs(wind) * 2)) : '◀'.repeat(Math.ceil(Math.abs(wind) * 2));
          ctx.fillText(`WIND ${Math.abs(wind) < .08 ? 'CALM' : arrows}`, w / 2, 32); ctx.textAlign = 'left';
          if (msgT > 0) { msgT -= dt; ctx.fillStyle = `rgba(255,207,74,${Math.min(1, msgT * 2)})`; ctx.font = font(24, 'Saira Stencil One'); ctx.textAlign = 'center'; ctx.fillText(msg, w / 2, h * .2); ctx.textAlign = 'left'; }
          api.hud(`HULL ${Math.max(0, pl.hp | 0)} <span>ENEMY ${enemies.filter(e => !e.dead).length}</span> <span>SHOTS ${shots}</span>`);
          if (!over) {
            if (pl.hp <= 0) { over = true; setTimeout(() => { api.stopLoop(); resolve({ win: false, score: 0, text: 'Your tank brews up. The crew bails out under smoke.' }); }, 1400); }
            else if (enemies.every(e => e.dead)) {
              over = true; const k = pl.hp / maxHp, stars = k >= .7 ? 3 : k >= .35 ? 2 : 1;
              setTimeout(() => { api.stopLoop(); resolve({ win: true, score: pl.hp | 0, stars, text: `${nE} enemy tank${nE > 1 ? 's' : ''} destroyed with ${shots} rounds. Hull at ${Math.round(k * 100)}%.` }); }, 1500);
            }
          }
        });
      });
    },
  };

  // ======================= GUNSHIP =======================
  function truck(ctx, x, y, s, c, kind, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, s * .9, s * .1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; [-s * .55, -s * .15, s * .5].forEach(wx => { ctx.beginPath(); ctx.arc(wx, -s * .1, s * .14, 0, 7); ctx.fill(); });
    const g = ctx.createLinearGradient(0, -s * .7, 0, -s * .1); g.addColorStop(0, CHAR.mix(c, '#fff', .15)); g.addColorStop(1, CHAR.mix(c, '#000', .35));
    ctx.fillStyle = g;
    if (kind === 'truck') { ctx.fillRect(-s * .85, -s * .7, s * 1.15, s * .55); ctx.fillRect(s * .32, -s * .5, s * .45, s * .35); ctx.fillStyle = 'rgba(160,200,220,.5)'; ctx.fillRect(s * .5, -s * .46, s * .2, s * .14); ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 4; i++) ctx.fillRect(-s * .8 + i * s * .28, -s * .7, 2, s * .55); }
    else if (kind === 'jeep') { ctx.fillRect(-s * .7, -s * .4, s * 1.4, s * .26); ctx.fillRect(-s * .3, -s * .56, s * .5, s * .18); ctx.strokeStyle = '#111'; ctx.lineWidth = s * .05; ctx.beginPath(); ctx.moveTo(-s * .1, -s * .56); ctx.lineTo(-s * .5, -s * .8); ctx.stroke(); FIG.draw(ctx, -s * .05, -s * .4, s * .7, FIG.P.aim, { color: '#2a2420', facing: -1, scarf: '#3a2a20', shadow: false }); }
    else if (kind === 'aa') { ctx.fillRect(-s * .8, -s * .4, s * 1.6, s * .28); ctx.save(); ctx.translate(0, -s * .45); ctx.rotate(-.9); ctx.fillStyle = '#222'; ctx.fillRect(0, -s * .07, s * .8, s * .05); ctx.fillRect(0, s * .03, s * .8, s * .05); ctx.restore(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, -s * .45, s * .16, 0, 7); ctx.fill(); }
    else if (kind === 'civ') { ctx.restore(); FIG.car(ctx, x, y - s * .05, s * .75, '#e8e6df', false, -1); ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#2f6fd6'; ctx.fillRect(-s * .7, -s * .26, s * 1.4, s * .06); }
    ctx.restore();
  }
  DEF.heli = {
    kicker: 'Air assault', title: 'Gunship', brief: 'Hold your finger on a target to fire the door gun. Red AA guns shoot back, so kill them first. Never fire on white civilian cars.',
    async play(api, o) {
      const diff = o.diff || 2, need = o.need || 12, dur = o.time || 45;
      await intro(api, `Destroy <b>${need}</b> hostile vehicles in ${dur} seconds.<br><br><b>Hold your finger</b> on a target to fire. Red <b>AA guns</b> shoot back, kill them first.<br>White cars with a blue stripe are civilians.`, 'Lift off');
      return new Promise(resolve => {
        const maxHp = 100 + B('hp'), fx = FIG.Fx(), pops = Pops(), st = {};
        let hp = maxHp, kills = 0, civ = 0, heat = 0, lock = false, firing = false, cx = .5, cy = .6, cd = 0, spawn = 1, left = dur, over = false, scroll = 0, hurtT = 0;
        const targets = [];
        const pos = e => { const r = api.cv.getBoundingClientRect(); cx = (e.clientX - r.left) / r.width; cy = (e.clientY - r.top) / r.height; };
        api.on(api.cv, 'pointerdown', e => { pos(e); firing = true; }); api.on(api.cv, 'pointermove', e => pos(e));
        api.on(api.cv, 'pointerup', () => firing = false); api.on(api.cv, 'pointercancel', () => firing = false); api.on(api.cv, 'pointerleave', () => firing = false);
        api.keys({ ' ': () => firing = true }, { ' ': () => firing = false });
        const kinds = () => { const r = Math.random(); return r < .12 ? 'civ' : r < .12 + .1 + diff * .03 ? 'aa' : r < .55 ? 'truck' : r < .8 ? 'jeep' : 'men'; };
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          if (!over) { left -= dt; scroll += dt; }
          st.cam = { x: Math.sin(scroll * .05) * .9, z: 1.06 + Math.sin(t * .7) * .01, y: Math.sin(t * 1.3) * .004 };
          const bob = Math.sin(t * 2.2) * 6, sway = Math.sin(t * 1.1) * 4;
          ctx.save(); ctx.translate(sway, bob);
          SCENES.S[o.scene || 'valley'](ctx, w, h, t, st, dt);
          // ground band with streaking details for speed
          const gg = ctx.createLinearGradient(0, h * .58, 0, h); gg.addColorStop(0, 'rgba(90,76,52,.0)'); gg.addColorStop(.25, o.earth || 'rgba(96,82,56,.85)'); gg.addColorStop(1, 'rgba(40,32,22,.95)');
          ctx.fillStyle = gg; ctx.fillRect(-20, h * .58, w + 40, h * .5);
          for (let i = 0; i < 30; i++) { const lane = (i * .37) % 1, y = h * (.64 + lane * .34), sp = (.3 + lane * .9) * w * .5, x = ((i * 97.3 - scroll * sp) % (w + 80) + w + 80) % (w + 80) - 40; ctx.fillStyle = `rgba(30,24,16,${.25 + lane * .3})`; ctx.beginPath(); ctx.ellipse(x, y, 6 + lane * 18, 2 + lane * 5, 0, 0, 7); ctx.fill(); }
          // spawn & move
          spawn -= dt;
          if (!over && spawn <= 0 && left > 2) { const lane = Math.random(); targets.push({ x: 1.1, lane, kind: kinds(), hp: 0, t: 0, alive: true, flash: 0, fall: 0, charge: 0, vx: rnd(-.04, .03) }); const tg = targets[targets.length - 1]; tg.hp = { truck: 4, jeep: 3, aa: 5, civ: 2, men: 1 }[tg.kind]; spawn = rnd(.7, 1.3) - diff * .08; }
          const vis = targets.slice().sort((a, b) => a.lane - b.lane);
          for (const tg of vis) {
            const sp = (.06 + tg.lane * .09) + tg.vx; tg.x -= sp * dt; tg.t += dt; tg.flash = Math.max(0, tg.flash - dt);
            const s = Math.min(h, w * 1.3) * (.07 + tg.lane * .1), x = tg.x * w, y = h * (.64 + tg.lane * .3);
            tg.box = [x - s * .9, y - s * .8, s * 1.8, s * .85];
            if (!tg.alive) { tg.fall += dt; ctx.globalAlpha = Math.max(0, 1 - tg.fall * .5); truck(ctx, x, y, s, '#1c1a18', tg.kind === 'men' ? 'jeep' : tg.kind, t); ctx.globalAlpha = 1; SCENES.helpers.smoke(ctx, st, 'sm_h' + tg.t.toFixed(0) + tg.lane, x, y - s * .5, dt, '50,46,42', 5, s / 60); continue; }
            if (tg.kind === 'men') { for (let k = 0; k < 3; k++) FIG.draw(ctx, x + (k - 1) * s * .45, y, s * 1.2, FIG.lerp(FIG.P.run1, FIG.P.run2, (Math.sin(t * 9 + k * 2) + 1) / 2), { color: tg.flash > 0 ? '#fff' : '#2a2420', facing: -1, rifle: true, scarf: '#3a2a20' }); }
            else truck(ctx, x, y, s, tg.flash > 0 ? '#ffffff' : { truck: '#6a5e44', jeep: '#4e4a3a', aa: '#5a3a30' }[tg.kind] || '#e8e6df', tg.kind, t);
            if (tg.kind === 'aa' && !over) {
              tg.charge += dt / (2.8 - diff * .25);
              ctx.strokeStyle = `rgba(255,50,40,${.6 + .4 * Math.sin(t * 16)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - s * .5, s * .9, -Math.PI / 2, -Math.PI / 2 + Math.min(1, tg.charge) * Math.PI * 2); ctx.stroke();
              if (tg.charge >= 1) { tg.charge = 0; const d = Math.round(10 + diff * 2); hp -= d; hurtT = .5; SFX.boom(); fx.shake = .8; pops.add(w * .5, h * .25, `FLAK -${d}`, '#ff8a7a', 22); for (let k = 0; k < 4; k++) fx.boom(rnd(.2, .8) * w, rnd(.1, .4) * h, .35); }
            }
            if (tg.kind === 'civ') { ctx.fillStyle = 'rgba(80,160,255,.9)'; ctx.font = font(11); ctx.textAlign = 'center'; ctx.fillText('CIVILIAN', x, y - s * .9); ctx.textAlign = 'left'; }
          }
          for (let i = targets.length - 1; i >= 0; i--) if (targets[i].x < -.2 || targets[i].fall > 2) targets.splice(i, 1);
          // fire
          cd -= dt;
          if (firing && !lock && !over) {
            heat += dt * (38 - B('steady') * 30);
            if (heat >= 100) { heat = 100; lock = true; pops.add(w * .5, h * .35, 'OVERHEAT', '#ff8a7a', 22); SFX.bad(); }
            if (cd <= 0) {
              cd = .075; SFX.shot();
              const spread = Math.max(6, 26 - B('hit') * 200);
              const px = cx * w + rnd(-spread, spread), py = cy * h + rnd(-spread, spread);
              fx.tracer(w * .86, h * 1.02, px, py, '255,230,140');
              let hit = null;
              for (const tg of vis.slice().reverse()) { if (!tg.alive || !tg.box) continue; const [bx, by, bw, bh] = tg.box; if (px > bx && px < bx + bw && py > by && py < by + bh) { hit = tg; break; } }
              if (hit) {
                hit.hp--; hit.flash = .06; fx.sparks(px, py, 6);
                if (hit.hp <= 0) {
                  hit.alive = false; const s = Math.min(h, w * 1.3) * (.07 + hit.lane * .1); fx.boom(hit.x * w, h * (.64 + hit.lane * .3) - s * .4, .5 + hit.lane * .6); SFX.boom();
                  if (hit.kind === 'civ') { civ++; pops.add(px, py - 20, 'CIVILIAN!', '#7ab8ff', 20); kills = Math.max(0, kills - 1); }
                  else { kills++; pops.add(px, py - 20, hit.kind === 'aa' ? 'AA DOWN +1' : '+1', '#ffcf4a', hit.kind === 'aa' ? 22 : 18); }
                }
              } else fx.sparks(px, py, 3, '200,180,140');
            }
          } else { heat = Math.max(0, heat - dt * 32); if (lock && heat < 35) lock = false; }
          fx.update(ctx, dt); pops.draw(ctx, dt);
          ctx.restore();
          // door frame & gun
          const fr = ctx.createLinearGradient(0, 0, w * .12, 0); fr.addColorStop(0, '#0a0c0b'); fr.addColorStop(1, 'rgba(10,12,11,0)'); ctx.fillStyle = fr; ctx.fillRect(0, 0, w * .12, h);
          const fr2 = ctx.createLinearGradient(w, 0, w * .9, 0); fr2.addColorStop(0, '#0a0c0b'); fr2.addColorStop(1, 'rgba(10,12,11,0)'); ctx.fillStyle = fr2; ctx.fillRect(w * .88, 0, w * .12, h);
          ctx.fillStyle = '#121513'; ctx.fillRect(0, 0, w, h * .05); ctx.fillStyle = '#1a1e1b'; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * .93); ctx.lineTo(w, h * .96); ctx.lineTo(w, h); ctx.fill();
          if (Math.sin(t * 52) > .6) { ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(0, 0, w, h); }
          const ga = Math.atan2(cy * h - h * 1.02, cx * w - w * .86);
          { const G = Math.min(h, w * 1.2) * .2, kick = firing && !lock ? Math.sin(t * 80) * G * .02 : 0;
            ctx.save(); ctx.translate(w * .86, h * 1.04); ctx.rotate(ga); ctx.translate(-kick, 0);
            ctx.fillStyle = '#121310'; ctx.beginPath(); ctx.moveTo(-G * .25, -G * .12); ctx.lineTo(G * .45, -G * .1); ctx.lineTo(G * .45, G * .1); ctx.lineTo(-G * .25, G * .14); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#2a2b26'; ctx.fillRect(G * .05, -G * .16, G * .22, G * .07); ctx.fillStyle = '#3a3c34'; ctx.fillRect(-G * .2, -G * .06, G * .5, G * .03);
            ctx.fillStyle = '#1b1c18'; ctx.fillRect(G * .45, -G * .035, G * .62, G * .07); for (let k = 0; k < 6; k++) { ctx.fillStyle = '#0c0d0b'; ctx.fillRect(G * (.5 + k * .07), -G * .05, G * .02, G * .1); }
            ctx.fillStyle = `rgba(255,${120 + (100 - heat)},40,${heat / 130})`; ctx.fillRect(G * .75, -G * .04, G * .32, G * .08);
            if (firing && !lock && cd > .04) FIG.muzzle(ctx, G * 1.1, 0, G * .2, Math.PI / 2, 1); ctx.restore(); }
          // crosshair
          const X = cx * w, Y = cy * h; ctx.strokeStyle = lock ? '#ff6a50' : '#ffe08a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, 18, 0, 7); ctx.moveTo(X - 28, Y); ctx.lineTo(X - 10, Y); ctx.moveTo(X + 10, Y); ctx.lineTo(X + 28, Y); ctx.moveTo(X, Y - 28); ctx.lineTo(X, Y - 10); ctx.moveTo(X, Y + 10); ctx.lineTo(X, Y + 28); ctx.stroke();
          if (hurtT > 0) { hurtT -= dt; const g = ctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .7); g.addColorStop(0, 'rgba(200,0,0,0)'); g.addColorStop(1, `rgba(200,0,0,${hurtT})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
          bar(ctx, 16, 22, Math.min(200, w * .3), hp / maxHp, hp / maxHp > .35 ? '#22a95f' : '#d04a33', `AIRFRAME ${Math.max(0, hp | 0)}`);
          bar(ctx, 16, 54, Math.min(200, w * .3), heat / 100, lock ? '#ff6a50' : '#e0a83e', lock ? 'GUN OVERHEATED' : 'GUN HEAT');
          api.hud(`KILLS ${kills}/${need} <span>${Math.max(0, left | 0)}s</span>${civ ? ` <span>CIVILIANS ${civ}</span>` : ''}`);
          if (!over && (hp <= 0 || left <= 0)) {
            over = true; firing = false; const win = hp > 0 && kills >= need && civ <= 1, k = hp / maxHp;
            const stars = !win ? 0 : k >= .7 && civ === 0 && kills >= need + 3 ? 3 : k >= .4 ? 2 : 1;
            setTimeout(() => { api.stopLoop(); resolve({ win, score: kills, stars, text: hp <= 0 ? 'The gunship is hit and limps home trailing smoke.' : `${kills} hostiles destroyed${civ ? `, ${civ} civilian vehicle${civ > 1 ? 's' : ''} hit` : ''}. Airframe at ${Math.round(k * 100)}%.` }); }, 1200);
          }
        });
      });
    },
  };

  // ======================= HALO JUMP =======================
  function canopy(ctx, x, y, s, tilt, c1 = '#2e6b3a', c2 = '#e8e2cc') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    ctx.strokeStyle = 'rgba(30,30,30,.7)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(-s * .9 + i * s * .3, -s * 1.05 + Math.abs(i - 3) * s * .05); ctx.lineTo(0, -s * .32); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? c2 : c1; ctx.beginPath(); const a = -s * .9 + i * s * .3; ctx.moveTo(a, -s * 1.05 + Math.abs(i - 3) * s * .05); ctx.quadraticCurveTo(a + s * .15, -s * 1.45 + Math.abs(i - 2.5) * s * .08, a + s * .3, -s * 1.05 + Math.abs(i - 2) * s * .05); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, -s * 1.08, s * .9, s * .06, 0, 0, 7); ctx.fill();
    FIG.draw(ctx, 0, 0, s * .9, FIG.P.hang, { color: '#4c5634', helmet: '#3a4028', pack: '#3a3e2a', shadow: false });
    ctx.restore();
  }
  DEF.para = {
    kicker: 'Airborne', title: 'HALO Jump', brief: 'Steer by sliding your finger left and right. Fly through the rings, dodge the birds, PULL in the green zone, then land on the smoke.',
    async play(api, o) {
      const diff = o.diff || 2;
      await intro(api, `Jump from <b>12,000 ft</b>.<br><br><b>Slide</b> left and right to steer through the rings and dodge birds.<br>Press <b>PULL</b> when the altimeter is <b style="color:#5fe08a">green</b>.<br>Then steer onto the <b>green smoke</b> to land.`, 'Jump');
      return new Promise(resolve => {
        let phase = 'fall', alt = 12000, px = .5, tx = .5, rings = 0, ringsTotal = 0, ctl = 3, tumble = 0, pullAlt = 0, over = false, msg = '', msgT = 0, vx = 0;
        const fx = FIG.Fx(), pops = Pops(), st = {}, clouds = [], items = [];
        for (let i = 0; i < 9; i++) clouds.push({ x: Math.random(), y: Math.random(), r: rnd(.12, .3), sp: rnd(.25, .6), a: rnd(.25, .6) });
        let spawn = .8, wind = 0, gust = 0, zx = rnd(.3, .7), steer = 0;
        const say = (m, d = 1.4) => { msg = m; msgT = d; };
        api.on(api.cv, 'pointerdown', e => { const r = api.cv.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; if (phase === 'canopy') steer = tx < px ? -1 : 1; });
        api.on(api.cv, 'pointermove', e => { const r = api.cv.getBoundingClientRect(); if (e.buttons || e.pointerType === 'mouse') tx = (e.clientX - r.left) / r.width; if (phase === 'canopy' && e.buttons) steer = tx < px ? -1 : 1; });
        api.on(api.cv, 'pointerup', () => steer = 0);
        const pull = () => {
          if (phase !== 'fall' || over) return;
          pullAlt = alt; phase = 'canopy'; SFX.whoosh(); fx.shake = .5;
          if (alt > 3600) say('EARLY PULL: more drift'); else if (alt < 2000) say('LOW PULL!'); else say('GOOD CANOPY');
          wind = (alt > 3600 ? .09 : .045) * (Math.random() < .5 ? -1 : 1) * (1 + diff * .15);
        };
        const pb = api.button('PULL ⇡', 0, pull); pb.classList.add('primary');
        api.button('◀', 0, () => { steer = -1; tx = Math.max(0, px - .2); }, () => steer = 0); api.button('▶', 0, () => { steer = 1; tx = Math.min(1, px + .2); }, () => steer = 0);
        api.keys({ ' ': pull, ArrowLeft: () => { steer = -1; tx = Math.max(0, px - .25); }, ArrowRight: () => { steer = 1; tx = Math.min(1, px + .25); } }, { ArrowLeft: () => steer = 0, ArrowRight: () => steer = 0 });
        const finish = (win, stars, text) => { if (over) return; over = true; setTimeout(() => { api.stopLoop(); resolve({ win, score: rings, stars, text }); }, 1300); };
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          const ctrlK = 1 + B('speed') * 2;
          if (phase === 'fall') {
            const rate = 440; if (!over) alt -= rate * dt;
            if (tumble > 0) tumble -= dt; else px += (tx - px) * Math.min(1, dt * 4 * ctrlK);
            px = clamp(px, .06, .86);
            const k = clamp(1 - alt / 12000, 0, 1);
            SCENES.helpers.sky(ctx, w, h, [CHAR.mix('#0b1a3a', '#4f86c6', k), CHAR.mix('#3a6aa8', '#a8c8e6', k), CHAR.mix('#8fb2d6', '#d9e6ee', k)]);
            if (alt < 5000) { const gk = 1 - alt / 5000, gyv = h * (1.25 - gk * .35); ctx.fillStyle = 'rgba(88,100,70,.9)'; ctx.beginPath(); ctx.moveTo(0, h); for (let i = 0; i <= 20; i++) ctx.lineTo(i / 20 * w, gyv + Math.sin(i * 1.3) * h * .02); ctx.lineTo(w, h); ctx.fill(); }
            clouds.forEach(c => { c.y -= c.sp * dt * .5; if (c.y < -.3) { c.y = 1.3; c.x = Math.random(); } const g = ctx.createRadialGradient(c.x * w, c.y * h, 0, c.x * w, c.y * h, c.r * w); g.addColorStop(0, `rgba(255,255,255,${c.a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(c.x * w - c.r * w, c.y * h - c.r * w, c.r * w * 2, c.r * w * 2); });
            // speed lines
            ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; for (let i = 0; i < 18; i++) { const x = (i * 71.3 % 1) * w, y = ((i * .37 - t * 1.6) % 1 + 1) % 1 * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 40); ctx.stroke(); }
            spawn -= dt;
            if (spawn <= 0 && alt > 2600 && !over) { const bird = Math.random() < .28 + diff * .05; items.push({ x: rnd(.1, .8), y: 1.15, bird, vx: bird ? rnd(-.12, .12) : 0, got: false }); if (!bird) ringsTotal++; spawn = rnd(.7, 1.1); }
            const py = .38;
            for (let i = items.length - 1; i >= 0; i--) {
              const it = items[i]; it.y -= dt * .42; it.x += it.vx * dt;
              const X = it.x * w, Y = it.y * h, R = Math.min(w, h) * .08;
              if (!it.got && Math.abs(it.y - py) < .03) {
                if (Math.abs(it.x - px) < (it.bird ? .06 : .085)) {
                  it.got = true;
                  if (it.bird) { ctl--; tumble = .9; SFX.hit(); fx.shake = .6; pops.add(px * w, py * h - 30, 'BIRD STRIKE', '#ff8a7a', 20); if (ctl <= 0) { say('YOU LOSE CONTROL'); finish(false, 0, 'Tumbling out of control, you fire the reserve and land kilometres from the drop zone.'); } }
                  else { rings++; SFX.choose(); fx.sparks(X, Y, 14, '255,220,120'); pops.add(X, Y - 20, `RING ${rings}`, '#ffcf4a', 18); }
                }
              }
              if (it.y < -.2) { items.splice(i, 1); continue; }
              if (it.bird) { ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 3; const f = Math.sin(t * 14 + i) * 8; ctx.beginPath(); ctx.moveTo(X - 16, Y - f); ctx.quadraticCurveTo(X - 6, Y - 6, X, Y); ctx.quadraticCurveTo(X + 6, Y - 6, X + 16, Y - f); ctx.stroke(); }
              else if (!it.got) { ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(X, Y, R, R * .35, 0, 0, 7); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); }
            }
            const wob = tumble > 0 ? t * 14 : Math.sin(t * 3) * .08 + (tx - px) * .8;
            ctx.save(); ctx.translate(px * w, py * h); ctx.rotate(wob);
            FIG.draw(ctx, 0, h * .09, h * .18, FIG.P.fall, { color: '#4c5634', helmet: '#3a4028', pack: '#3a3e2a', shadow: false, rim: 'rgba(255,255,255,.4)' });
            ctx.restore();
            if (alt <= 1200 && !over) { say('RESERVE CHUTE!'); finish(false, 0, 'You fell through the pull window. The automatic reserve opens far too low and you land hard, off the zone.'); }
          } else {
            // canopy over the real terrain
            const descent = pullAlt > 3600 ? 210 : 230; if (!over) alt -= descent * dt;
            gust += dt; const g = Math.sin(gust * .7) * wind + Math.sin(gust * 2.1) * wind * .4;
            vx += ((steer * .16 * ctrlK) + g - vx) * Math.min(1, dt * 2.2); px = clamp(px + vx * dt, .03, .97);
            st.cam = { x: (px - .5) * .6, z: 1.05, y: 0 };
            SCENES.S[o.scene || 'valley'](ctx, w, h, t, st, dt);
            const gyv = h * .88, zX = zx * w;
            ctx.fillStyle = 'rgba(60,140,70,.35)'; ctx.beginPath(); ctx.ellipse(zX, gyv, w * .06, h * .02, 0, 0, 7); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(zX, gyv, w * .02, h * .007, 0, 0, 7); ctx.stroke();
            SCENES.helpers.smoke(ctx, st, 'sm_zone', zX, gyv, dt, '90,220,120', 7, 1.1);
            const k = clamp(alt / Math.max(1, pullAlt), 0, 1), y = gyv - k * h * .72 - h * .02;
            canopy(ctx, px * w, y, h * .16, vx * 1.6 + Math.sin(t * 1.5) * .04);
            if (alt <= 0 && !over) {
              const d = Math.abs(px - zx), lowPull = pullAlt < 2000;
              let stars = d < .035 ? 3 : d < .08 ? 2 : d < .16 ? 1 : 0;
              if (stars && (ctl < 2 || lowPull)) stars = Math.max(1, stars - 1);
              if (stars && rings < ringsTotal / 3) stars = Math.max(1, stars - 1);
              fx.sparks(px * w, gyv, 18, '200,180,140'); SFX.hit();
              if (stars) { say(stars === 3 ? 'BULLSEYE!' : 'ON THE ZONE'); finish(true, stars, `You land ${Math.round(d * 1000)} m from the marker. ${rings} of ${ringsTotal} rings flown.`); }
              else { say('OFF THE ZONE'); finish(false, 0, `You land ${Math.round(d * 1000)} m wide of the smoke. The team has to come and find you.`); }
            }
          }
          fx.update(ctx, dt); pops.draw(ctx, dt);
          // altimeter
          const ax = w - 46, ay = h * .12, ah = h * .7;
          ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(ax, ay, 22, ah);
          const zy = v => ay + ah * (1 - v / 12000);
          ctx.fillStyle = 'rgba(80,220,120,.55)'; ctx.fillRect(ax, zy(3600), 22, zy(2000) - zy(3600));
          ctx.fillStyle = 'rgba(220,60,40,.5)'; ctx.fillRect(ax, zy(1200), 22, zy(0) - zy(1200));
          ctx.fillStyle = '#fff'; ctx.fillRect(ax - 6, zy(Math.max(0, alt)) - 2, 34, 4);
          ctx.fillStyle = '#efe9d6'; ctx.font = font(13, 'Share Tech Mono'); ctx.textAlign = 'right'; ctx.fillText(`${Math.max(0, alt | 0)} ft`, ax - 8, zy(Math.max(0, alt)) + 4); ctx.textAlign = 'left';
          if (phase === 'fall' && alt < 3600 && alt > 2000) { pb.classList.add('pulse'); ctx.fillStyle = `rgba(95,224,138,${.6 + .4 * Math.sin(t * 12)})`; ctx.font = font(30, 'Saira Stencil One'); ctx.textAlign = 'center'; ctx.fillText('PULL NOW!', w / 2, h * .75); ctx.textAlign = 'left'; } else pb.classList.remove('pulse');
          if (msgT > 0) { msgT -= dt; ctx.fillStyle = `rgba(255,207,74,${Math.min(1, msgT * 2)})`; ctx.font = font(26, 'Saira Stencil One'); ctx.textAlign = 'center'; ctx.fillText(msg, w / 2, h * .18); ctx.textAlign = 'left'; }
          api.hud(`RINGS ${rings} <span>CONTROL ${'●'.repeat(Math.max(0, ctl))}${'○'.repeat(3 - Math.max(0, ctl))}</span>`);
        });
      });
    },
  };

  GAMES.art = { drawTank, truck, canopy };

  // ======================= HOLD THE POST =======================
  DEF.defend = {
    kicker: 'Defence', title: 'Hold the Post', brief: 'Tap an attacker to shoot him. Aim for the head for an instant kill. Shoot rockets out of the air. AIRSTRIKE clears a crowd.',
    async play(api, o) {
      const diff = o.diff || 2, endless = !!o.endless, waves = o.waves || 3;
      await intro(api, `${endless ? '<b>Last Stand.</b> The waves never stop. How long can you hold?' : `Hold the post for <b>${waves} waves</b>.`}<br><br><b>Tap</b> an attacker to shoot. <b>Head</b> = instant kill.<br>Tap incoming <b>rockets</b> to shoot them down. <b>AIRSTRIKE</b> hits the biggest crowd.`, 'Stand to');
      return new Promise(resolve => {
        const maxHp = 100 + B('hp'), MAG = 10 + Math.round(B('mag') / 2), fx = FIG.Fx(), pops = Pops(), st = {};
        let hp = maxHp, ammo = MAG, reload = 0, wave = 0, queue = 0, spawnT = 0, between = 2.2, over = false, kills = 0, heads = 0, flash = 0, hurtT = 0, strikes = o.strikes ?? 1 + Math.floor(B('gren') / 2), combo = 0, comboT = 0;
        const foes = [], rockets = [], bud = buddy(); let budT = 1.5;
        const P = FIG.P;
        function startWave() { wave++; queue = (endless ? 4 + wave * 2 : 4 + wave * 2 + diff) | 0; spawnT = .4; if (wave > 1) { hp = Math.min(maxHp, hp + 6 + B('med')); } SFX.beep(); }
        function spawn() {
          const r = Math.random(), lane = Math.random();
          const kind = wave >= 3 && r < .12 ? 'jeep' : wave >= 2 && r < .3 ? 'rpg' : r < .5 + wave * .02 && wave >= 2 ? 'heavy' : 'rifle';
          foes.push({ kind, lane, x: 1.08, stop: rnd(.42, .82), hp: { rifle: 1, heavy: 3, rpg: 1, jeep: 6 }[kind], max: { rifle: 1, heavy: 3, rpg: 1, jeep: 6 }[kind], st: 'move', t: rnd(1, 2), flash: 0, alive: true, fall: 0, sp: (kind === 'heavy' ? .07 : kind === 'jeep' ? .14 : .1) * (1 + diff * .08 + (endless ? wave * .03 : 0)) });
        }
        const geom = (f, w, h) => { const U = Math.min(h, w * 1.15), y = h * (.66 + f.lane * .24), s = U * (.17 + f.lane * .14); return { x: f.x * w, y, s }; };
        function damage(f, n, w, h, head) {
          f.hp -= n; f.flash = .1; const g = geom(f, w, h);
          if (f.hp <= 0 || head) {
            f.alive = false; f.fall = 0; kills++; combo++; comboT = 1.6;
            if (head && f.kind !== 'jeep') { heads++; pops.add(g.x, g.y - g.s * 1.05, 'HEADSHOT', '#ffcf4a', 20); }
            if (combo >= 3) pops.add(g.x, g.y - g.s * 1.3, `x${combo} COMBO`, '#7ef0a0', 16 + Math.min(10, combo));
            if (f.kind === 'jeep') { fx.boom(g.x, g.y - g.s * .2, .9); SFX.boom(); } else SFX.hit();
          }
        }
        const tapAt = (X, Y) => {
          if (over) return; const { w, h } = api.size();
          for (const r of rockets) if (!r.dead && Math.hypot(r.x * w - X, r.y - Y) < 34) { r.dead = true; fx.boom(r.x * w, r.y, .4); SFX.boom(); pops.add(r.x * w, r.y - 20, 'ROCKET DOWN', '#7ef0a0', 18); return; }
          if (reload > 0) return;
          if (ammo <= 0) { reload = 1.1; SFX.click(); return; }
          ammo--; SFX.shot(); flash = .06;
          fx.tracer(w * .2, h * .74, X + rnd(-4, 4), Y + rnd(-4, 4));
          const list = foes.filter(f => f.alive).sort((a, b) => b.lane - a.lane);
          for (const f of list) {
            const g = geom(f, w, h), half = f.kind === 'jeep' ? g.s * .9 : g.s * .2;
            const top = f.kind === 'jeep' ? g.y - g.s * .7 : g.y - g.s * 1.0;
            if (X > g.x - half - 8 && X < g.x + half + 8 && Y > top - 8 && Y < g.y + 4) {
              const head = f.kind !== 'jeep' && Y < g.y - g.s * .78; fx.blood(X, Y); damage(f, 1, w, h, head); if (ammo === 0) reload = 1.1; return;
            }
          }
          fx.sparks(X, Y, 4, '200,180,140'); if (ammo === 0) reload = 1.1;
        };
        api.on(api.cv, 'pointerdown', e => { const r = api.cv.getBoundingClientRect(); tapAt(e.clientX - r.left, e.clientY - r.top); });
        const strike = () => {
          if (strikes <= 0 || over) return; const alive = foes.filter(f => f.alive); if (!alive.length) return;
          strikes--; const cx = alive.reduce((a, f) => a + f.x, 0) / alive.length; const { w, h } = api.size();
          SFX.heli(); setTimeout(() => { [-.08, 0, .08].forEach((d, i) => setTimeout(() => { fx.boom((cx + d) * w, h * .78, 1.1); SFX.boom(); }, i * 140)); foes.forEach(f => { if (f.alive && Math.abs(f.x - cx) < .2) damage(f, 99, w, h, false); }); }, 500);
          pops.add(w / 2, h * .3, 'AIRSTRIKE INBOUND', '#ffcf4a', 24);
        };
        const doReload = () => { if (ammo < MAG && reload <= 0) { reload = 1.1; SFX.click(); } };
        const sb = api.button('AIRSTRIKE ✈', 0, strike); api.button('Reload ⟳', 0, doReload);
        api.keys({ g: strike, G: strike, r: doReload, R: doReload });
        api.loop((dt, t) => {
          const { w, h } = api.size(), ctx = api.ctx;
          // waves
          if (!over) {
            if (between > 0) { between -= dt; if (between <= 0) startWave(); }
            else {
              spawnT -= dt; if (queue > 0 && spawnT <= 0) { spawn(); queue--; spawnT = rnd(.6, 1.4) - Math.min(.5, wave * .05) - diff * .06; }
              if (queue === 0 && foes.every(f => !f.alive)) { if (!endless && wave >= waves) { over = true; const k = hp / maxHp, stars = k >= .7 ? 3 : k >= .4 ? 2 : 1; setTimeout(() => { api.stopLoop(); resolve({ win: true, score: kills, stars, text: `The post holds. ${kills} attackers down, ${heads} headshots. Wall at ${Math.round(k * 100)}%.` }); }, 1200); } else { between = 2.6; } }
            }
            if (reload > 0) { reload -= dt; if (reload <= 0) ammo = MAG; }
            comboT -= dt; if (comboT <= 0) combo = 0;
          }
          st.cam = { x: .2, z: 1.03, y: 0 };
          SCENES.S[o.scene || 'snowpost'](ctx, w, h, t, st, dt);
          const gg = ctx.createLinearGradient(0, h * .62, 0, h); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = gg; ctx.fillRect(0, h * .62, w, h * .38);
          // wire line
          ctx.strokeStyle = 'rgba(40,36,30,.8)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let x = 0; x < 40; x++) { const X = w * .3 + x * 6, Y = h * (.7 + i * .08) + Math.sin(x * 2.3) * 4; ctx[x ? 'lineTo' : 'moveTo'](X, Y); } ctx.stroke(); }
          // foes
          foes.sort((a, b) => a.lane - b.lane);
          for (const f of foes) {
            const g = geom(f, w, h);
            if (!f.alive) { f.fall = Math.min(1, f.fall + dt * 3); if (f.kind === 'jeep') { ctx.globalAlpha = .7; truck(ctx, g.x, g.y, g.s * .6, '#1a1816', 'jeep', t); ctx.globalAlpha = 1; SCENES.helpers.fire(ctx, g.x, g.y - g.s * .3, g.s * .3, t, st, dt); } else FIG.draw(ctx, g.x, g.y, g.s, FIG.lerp(P.hit, P.down, f.fall), { color: '#2a2420', facing: -1, scarf: '#3a2a20', skin: '#9e6c46' }); continue; }
            f.flash = Math.max(0, f.flash - dt);
            if (!over) {
              if (f.st === 'move') { f.x -= f.sp * dt; if (f.x <= f.stop) { f.st = 'aim'; f.t = rnd(.9, 1.6); } }
              else { f.t -= dt; if (f.t <= 0) {
                if (f.kind === 'rpg') { rockets.push({ x: f.x - .03, y: g.y - g.s * .8, dead: false }); SFX.whoosh(); f.t = rnd(3.5, 5); }
                else { const d = (f.kind === 'jeep' ? 6 : f.kind === 'heavy' ? 5 : 3) + diff; hp -= d; hurtT = .3; SFX.shot(); fx.tracer(g.x - g.s * .2, g.y - g.s * .76, w * .19, h * .74, '255,140,90'); fx.sparks(w * .2, h * .76, 4); f.t = rnd(1.4, 2.4) - diff * .1; f.fired = .1; }
              } }
            }
            f.fired = Math.max(0, (f.fired || 0) - dt);
            if (f.kind === 'jeep') { truck(ctx, g.x, g.y, g.s * .6, f.flash > 0 ? '#fff' : '#4e4a3a', 'jeep', t); bar(ctx, g.x - 30, g.y - g.s * .85, 60, f.hp / f.max, '#d04a33'); continue; }
            const pose = f.st === 'move' ? FIG.lerp(P.run1, P.run2, (Math.sin(t * 10 + f.lane * 9) + 1) / 2) : P.aim;
            FIG.draw(ctx, g.x, g.y, g.s, pose, { color: f.flash > 0 ? '#fff' : f.kind === 'heavy' ? '#1a1a18' : '#2a2420', facing: -1, rifle: f.kind !== 'rpg', helmet: f.kind === 'heavy' ? '#222' : null, scarf: '#3a2a20', skin: '#9e6c46', flash: f.fired > 0 });
            if (f.kind === 'rpg') { ctx.fillStyle = '#3a3a2a'; ctx.save(); ctx.translate(g.x, g.y - g.s * .78); ctx.rotate(.08); ctx.fillRect(-g.s * .3, -g.s * .035, g.s * .5, g.s * .07); ctx.fillStyle = '#6a5a3a'; ctx.beginPath(); ctx.moveTo(-g.s * .3, -g.s * .06); ctx.lineTo(-g.s * .42, 0); ctx.lineTo(-g.s * .3, g.s * .06); ctx.fill(); ctx.restore(); if (f.st === 'aim' && f.t < 1) { ctx.fillStyle = `rgba(255,60,40,${.5 + .5 * Math.sin(t * 20)})`; ctx.font = font(20, 'Saira Stencil One'); ctx.textAlign = 'center'; ctx.fillText('RPG!', g.x, g.y - g.s * 1.2); ctx.textAlign = 'left'; } }
            if (f.kind === 'heavy') bar(ctx, g.x - 20, g.y - g.s * 1.15, 40, f.hp / f.max, '#d04a33');
          }
          for (let i = foes.length - 1; i >= 0; i--) if (!foes[i].alive && foes[i].fall >= 1 && foes.length > 24) foes.splice(i, 1);
          // rockets
          for (const r of rockets) {
            if (r.dead) continue; if (!over) r.x -= dt * .2; const X = r.x * w;
            ctx.fillStyle = '#3a3a2a'; ctx.fillRect(X - 14, r.y - 4, 28, 8); ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.moveTo(X - 14, r.y - 5); ctx.lineTo(X - 24, r.y); ctx.lineTo(X - 14, r.y + 5); ctx.fill();
            FIG.muzzle(ctx, X + 16, r.y, 10, -Math.PI / 2, 1); ctx.strokeStyle = `rgba(255,255,255,${.5 + .5 * Math.sin(t * 20)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, r.y, 26, 0, 7); ctx.stroke();
            if (r.x < .2) { r.dead = true; fx.boom(w * .19, h * .74, 1); SFX.boom(); const d = 16 + diff * 2; hp -= d; hurtT = .5; pops.add(w * .2, h * .6, `-${d}`, '#ff8a7a', 24); }
          }
          // buddy
          if (bud && !over) { budT -= dt; if (budT <= 0) { const tg = foes.filter(f => f.alive && f.st === 'aim').sort((a, b) => a.x - b.x)[0] || foes.filter(f => f.alive)[0]; if (tg) { const g = geom(tg, w, h); fx.tracer(w * .1, h * .8, g.x, g.y - g.s * .6, '160,255,180'); damage(tg, 1, w, h, false); SFX.shot(); } budT = bud.rate; } }
          // the post: sandbags and our soldiers
          const U = Math.min(h, w * 1.15);
          if (bud) FIG.draw(ctx, w * .1, h * .9, U * .3, P.crouchAim, { color: '#4c5634', helmet: '#3a4028', rifle: true, vest: true, skin: '#a8754e', flash: budT > bud.rate - .08 });
          FIG.draw(ctx, w * .17, h * .9, U * .36, P.crouchAim, { color: '#56603a', helmet: '#3a4028', rifle: true, vest: true, skin: '#a8754e', flash: flash > 0, rim: 'rgba(255,230,190,.4)' });
          for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const bx = w * .2 + i * U * .06 + (r % 2) * U * .03 - U * .06, by = h * .9 - r * U * .045; const g2 = ctx.createLinearGradient(0, by - 10, 0, by + 10); g2.addColorStop(0, '#c2b08a'); g2.addColorStop(1, '#7c6a48'); ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(bx, by, U * .034, U * .024, 0, 0, 7); ctx.fill(); }
          if (flash > 0) flash -= dt;
          fx.update(ctx, dt); pops.draw(ctx, dt);
          SCENES.bloom(ctx, api.cv, .28);
          if (hurtT > 0) { hurtT -= dt; const g = ctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .7); g.addColorStop(0, 'rgba(200,0,0,0)'); g.addColorStop(1, `rgba(200,0,0,${hurtT * 1.2})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
          bar(ctx, 16, 22, Math.min(200, w * .32), hp / maxHp, hp / maxHp > .35 ? '#22a95f' : '#d04a33', `POST ${Math.max(0, hp | 0)}`);
          ctx.fillStyle = '#efe9d6'; ctx.font = font(20, 'Share Tech Mono'); ctx.textAlign = 'right'; ctx.fillText(reload > 0 ? 'RELOADING' : `${ammo}/${MAG}`, w - 16, 34); ctx.font = font(13); ctx.fillText(`AIRSTRIKES ${strikes}`, w - 16, 52); ctx.textAlign = 'left';
          sb.disabled = strikes <= 0;
          banner(ctx, w, h, `WAVE ${wave + 1}`, endless ? (wave ? `${wave} wave${wave > 1 ? 's' : ''} held` : 'Last Stand') : `of ${waves}`, between > 0 && !over ? Math.min(1, between) : 0);
          api.hud(`WAVE ${Math.max(1, wave)}${endless ? '' : '/' + waves} <span>KILLS ${kills}</span>`);
          if (!over && hp <= 0) {
            over = true; hp = 0; const held = Math.max(0, wave - 1);
            if (endless) { const stars = held >= 15 ? 3 : held >= 9 ? 2 : held >= 4 ? 1 : 0; if (window.OPS) OPS.recordStand(held); setTimeout(() => { api.stopLoop(); resolve({ win: held >= 1, score: held, stars, waves: held, text: `You held for ${held} wave${held === 1 ? '' : 's'}. ${kills} attackers down, ${heads} headshots.` }); }, 1300); }
            else setTimeout(() => { api.stopLoop(); resolve({ win: false, score: kills, text: 'The post is overrun. You fall back to the second line.' }); }, 1300);
          }
        });
      });
    },
  };
})();
