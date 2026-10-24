// Letterboxed cinematic cutscenes. Each is a list of shots: { d: seconds, cap, who, draw(ctx, w, h, p, t, dt, fx, st) }.
const CUT = (() => {
  const H = SCENES.helpers, S = SCENES.S, P = FIG.P;
  function seqPose(seq, t) {
    // seq: [[time, poseName|poseObj], ...]
    const get = v => typeof v === 'string' ? P[v] : v;
    if (t <= seq[0][0]) return get(seq[0][1]);
    for (let i = 0; i < seq.length - 1; i++) {
      const [t0, a] = seq[i], [t1, b] = seq[i + 1];
      if (t >= t0 && t < t1) return FIG.lerp(get(a), get(b), FIG.ease((t - t0) / (t1 - t0)));
    }
    return get(seq[seq.length - 1][1]);
  }
  const runPose = (t, sp = 9) => FIG.lerp(P.run1, P.run2, (Math.sin(t * sp) + 1) / 2);
  const marchPose = (t, sp = 4) => FIG.lerp(P.march1, P.march2, (Math.sin(t * sp) + 1) / 2);
  function bg(name) { return (ctx, w, h, t, st, dt) => S[name](ctx, w, h, t, st, dt); }
  function dark(ctx, w, h, a) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, w, h); }
  function nvg(ctx, w, h) {
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#5cff7a'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(40,255,90,.06)'; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    const g = ctx.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.95)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function staticNoise(ctx, w, h, a = .25) {
    for (let i = 0; i < 400; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * a})`; ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 40, 1.5); }
  }
  function textBig(ctx, w, h, txt, y, size, color = '#efe9d6', font = '"Saira Stencil One", Impact, sans-serif') {
    ctx.fillStyle = color; ctx.font = `${size}px ${font}`; ctx.textAlign = 'center'; ctx.fillText(txt, w / 2, y); ctx.textAlign = 'left';
  }
  function crowdLine(ctx, w, y, n, s, t, color, pose = 'stand', opts = {}) {
    for (let i = 0; i < n; i++) FIG.draw(ctx, (i + .5) * w / n, y, s, typeof pose === 'function' ? pose(t + i * .3) : P[pose], Object.assign({ color }, opts));
  }
  function coffin(ctx, x, y, s) { ctx.fillStyle = '#0b6b3a'; ctx.fillRect(x - s, y - s * .25, s * 2, s * .25); ctx.fillStyle = '#f6f6f2'; ctx.fillRect(x - s, y - s * .25, s * .5, s * .25); }

  const LIB = {};

  LIB.prologue = [
    { d: 4.2, who: 'GHQ, Rawalpindi', cap: 'Forty years from today. 0300 hours.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); dark(ctx, w, h, .45);
      ctx.fillStyle = `rgba(200,30,30,${.15 + .1 * Math.sin(t * 6)})`; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a1e14'; ctx.fillRect(w * .2, h * .66, w * .6, h * .06);
      const g = ctx.createRadialGradient(w / 2, h * .66, 5, w / 2, h * .66, w * .35); g.addColorStop(0, 'rgba(120,200,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      [.25, .38, .62, .75].forEach((x, i) => FIG.draw(ctx, w * x, h * .66, h * .42, P.stand, { color: '#0a0a0a', facing: x < .5 ? 1 : -1, beret: i === 1 ? '#5a1010' : null }));
    } },
    { d: 4.4, who: 'Staff officer', cap: '"General, the Prime Minister is on the line. Everyone is waiting for your decision."', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); dark(ctx, w, h, .55);
      const z = 1 + p * .15; ctx.save(); ctx.translate(w / 2, h * .62); ctx.scale(z, z);
      ctx.fillStyle = '#a99a6c'; ctx.beginPath(); ctx.ellipse(0, -h * .04, w * .16, h * .07, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b3201e'; ctx.fillRect(-w * .14, -h * .03, w * .28, h * .05); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, h * .03, w * .17, h * .03, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#e2ae48'; ctx.beginPath(); ctx.arc(0, -h * .03, h * .025, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } },
    { d: 3.4, cap: 'But every general was once a boy who had not yet chosen who to be.', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); staticNoise(ctx, w, h, .35 * (1 - p));
      textBig(ctx, w, h, 'REWIND', h * .5, Math.min(w * .12, 90), `rgba(239,233,214,${1 - p})`);
    } },
    { d: 4.6, who: 'Your village', cap: 'The year 2026. A soldiers\' village. You are sixteen.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t, st, dt);
      const x = w * (.1 + p * .5);
      FIG.draw(ctx, x, h * .82, h * .22, runPose(t, 11), { color: '#2a2018' });
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - p * 3)})`; ctx.fillRect(0, 0, w, h);
    } },
  ];

  LIB.issb = [
    { d: 4, who: 'Kohat Pass', cap: 'The bus climbs toward Kohat. Thirty boys, thirty dreams, four days of tests.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.issb(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#3b3328'; ctx.fillRect(0, h * .78, w, h * .06);
      ctx.strokeStyle = '#d8c58a'; ctx.setLineDash([20, 20]); ctx.lineDashOffset = -t * 100; ctx.beginPath(); ctx.moveTo(0, h * .81); ctx.lineTo(w, h * .81); ctx.stroke(); ctx.setLineDash([]);
      const bx = w * (.05 + p * .6); ctx.fillStyle = '#c9542c'; ctx.fillRect(bx, h * .69, w * .22, h * .1); ctx.fillStyle = '#e8c34a'; ctx.fillRect(bx, h * .72, w * .22, h * .012);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(160,200,220,.7)'; ctx.fillRect(bx + 8 + i * w * .034, h * .7, w * .025, h * .025); }
      ctx.fillStyle = '#111'; [bx + w * .04, bx + w * .18].forEach(x => { ctx.beginPath(); ctx.arc(x, h * .79, h * .02, 0, 7); ctx.fill(); });
    } },
    { d: 3.6, who: 'Inter Services Selection Board', cap: '"Candidates! Chest numbers on. From this moment, we are watching everything."', draw(ctx, w, h, p, t, dt, fx, st) {
      S.issb(ctx, w, h, t, st, dt);
      crowdLine(ctx, w * .9, h * .86, 8, h * .26, t, '#2b2a26', 'stand');
      FIG.draw(ctx, w * .92, h * .86, h * .3, P.stand, { color: '#24301f', facing: -1, beret: '#1a2418' });
    } },
  ];

  LIB.pma = [
    { d: 4, who: 'Pakistan Military Academy, Kakul', cap: 'The gates close behind you. Two years. Nobody here cares who your father was.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.pma(ctx, w, h, t, st, dt);
      const z = 1 + p * .1; ctx.save(); ctx.translate(w / 2, h); ctx.scale(z, z); ctx.translate(-w / 2, -h);
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(w * .15, h * .5, w * .05, h * .4); ctx.fillRect(w * .8, h * .5, w * .05, h * .4);
      ctx.strokeStyle = '#1c1c1c'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const x = w * .2 + i * w * .05 * (1 - p * .9); ctx.beginPath(); ctx.moveTo(x, h * .55); ctx.lineTo(x, h * .92); ctx.stroke(); }
      ctx.restore();
    } },
    { d: 4.2, who: 'Drill Sergeant', cap: '"Faster! You run like civilians! By the end of this term, you will run like soldiers or you will run home!"', draw(ctx, w, h, p, t, dt, fx, st) {
      S.pma(ctx, w, h, t, st, dt);
      for (let i = 0; i < 9; i++) FIG.draw(ctx, ((w * (p * .8) + i * w * .1) % (w * 1.1)) - w * .05, h * .86, h * .24, runPose(t + i * .4, 12), { color: '#a69468' });
      FIG.draw(ctx, w * .85, h * .9, h * .3, FIG.lerp(P.stand, P.punch, (Math.sin(t * 5) + 1) / 4), { color: '#24301f', facing: -1, beret: '#111' });
    } },
  ];

  LIB.passing_out = [
    { d: 4.4, who: 'Passing Out Parade', cap: 'The band strikes up. Six hundred cadets. Your mother is somewhere in the stands.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t, st, dt);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) FIG.draw(ctx, ((i * w * .11 + p * w * .25 + r * 20) % (w * 1.2)) - w * .05, h * (.7 + r * .1), h * (.16 + r * .04), marchPose(t), { color: r === 2 ? '#8f7f52' : '#a69468', rifle: true });
    } },
    { d: 4.2, who: '', cap: 'Slow march. The old tune that every officer remembers for the rest of their life.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t, st, dt); dark(ctx, w, h, .15);
      FIG.draw(ctx, w * .5, h * .95, h * .55, marchPose(t, 1.8), { color: '#8f7f52', rifle: true, beret: '#1f2a1c' });
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,220,150,.2)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    } },
    { d: 3.8, who: 'Commissioned', cap: 'Caps go on. Pips go on. You are an officer of the Pakistan Army.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t, st, dt);
      if (Math.random() < .3) fx.sparks(Math.random() * w, Math.random() * h * .4, 6, ['255,220,120', '255,255,255', '60,200,120'][Math.random() * 3 | 0]);
      crowdLine(ctx, w, h * .9, 7, h * .3, t, '#8f7f52', 'salute');
    } },
  ];

  LIB.avalanche = [
    { d: 3.6, who: 'Northern post', cap: 'Dawn. A crack like a gunshot echoes off the glacier.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.snowpost(ctx, w, h, t, st, dt);
      if (p > .4 && !st.c) { st.c = 1; SFX.boom(); }
      if (p > .4) { ctx.save(); ctx.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8); ctx.restore(); }
      crowdLine(ctx, w * .5, h * .86, 3, h * .24, t, '#3f4a2b', 'stand', { helmet: '#e8ecef' });
    } },
    { d: 4.4, who: '', cap: 'A white wall pours down the mountain toward the forward bunker.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.snowpost(ctx, w, h, t, st, dt);
      const y = -h * .3 + p * h * 1.2;
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(250,252,255,${.6 + Math.random() * .4})`; ctx.beginPath(); ctx.arc((i / 39) * w + Math.sin(t * 4 + i) * 20, y + Math.sin(i) * 30, h * .12 + Math.random() * 30, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(250,252,255,.95)'; ctx.fillRect(0, 0, w, Math.max(0, y));
      crowdLine(ctx, w * .5, h * .86, 3, h * .24, t, '#3f4a2b', t2 => runPose(t2, 14), { helmet: '#e8ecef', facing: 1 });
      ctx.save(); ctx.translate((Math.random() - .5) * 10 * p, (Math.random() - .5) * 10 * p); ctx.restore();
    } },
    { d: 2.6, cap: 'Then, silence.', draw(ctx, w, h, p, t) { ctx.fillStyle = `rgb(${250 - p * 220},${252 - p * 222},${255 - p * 215})`; ctx.fillRect(0, 0, w, h); } },
  ];

  LIB.ambush = [
    { d: 4, who: 'Night patrol', cap: 'Three kilometres from the post. The smugglers\' trail is quiet. Too quiet.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      for (let i = 0; i < 5; i++) FIG.draw(ctx, w * (.1 + i * .12 + p * .1), h * .86, h * .24, FIG.lerp(P.march1, P.march2, (Math.sin(t * 3 + i) + 1) / 2), { color: '#0c120c', rifle: true, helmet: '#141c12' });
    } },
    { d: 4.6, who: 'CONTACT!', cap: 'Muzzle flashes ripple along the ridge. Tracers crack overhead.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      if (Math.random() < .5) { const x = w * (.55 + Math.random() * .4), y = h * (.48 + Math.random() * .08); fx.tracer(x, y, w * (.1 + Math.random() * .4), h * (.7 + Math.random() * .15)); FIG.muzzle(ctx, x, y, 10, 0, -1); if (Math.random() < .3) SFX.shot(); }
      if (p > .5 && !st.b) { st.b = 1; fx.boom(w * .42, h * .82, 1.2); SFX.boom(); }
      for (let i = 0; i < 5; i++) { const fl = Math.random() < .25; FIG.draw(ctx, w * (.12 + i * .1), h * .86, h * .24, P.crouchAim, { color: '#0c120c', rifle: true, helmet: '#141c12', flash: fl }); if (fl) fx.tracer(w * (.2 + i * .1), h * .78, w * (.6 + Math.random() * .3), h * .5); }
    } },
    { d: 3.4, who: 'You', cap: '"Covering fire! Section two, flank left. MOVE!"', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * .5, h * .98, h * .62, P.crouchAim, { color: '#0c120c', rifle: true, helmet: '#141c12', flash: Math.random() < .3 });
      if (Math.random() < .2) fx.tracer(w * .9, h * .4, w * .2, h * .6);
    } },
  ];

  LIB.raid = [
    { d: 4, who: 'Wadi-e-Noor, 0445 hours', cap: 'Two helicopters skim the valley floor without lights.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt); dark(ctx, w, h, .35);
      if (!st.s) { st.s = 1; SFX.heli(); }
      FIG.heli(ctx, w * (-.2 + p * .9), h * .3 + Math.sin(t * 2) * 6, h * .14, t); FIG.heli(ctx, w * (-.45 + p * .9), h * .22 + Math.sin(t * 2 + 1) * 6, h * .11, t);
    } },
    { d: 4.2, who: 'Fast rope', cap: 'Ropes drop. Boots hit the roof in eleven seconds.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt); dark(ctx, w, h, .3);
      const hx = w * .5, hy = h * .2 + Math.sin(t * 2) * 4; FIG.heli(ctx, hx, hy, h * .18, t);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, hy + h * .05); ctx.lineTo(hx, h * .62); ctx.stroke();
      for (let i = 0; i < 3; i++) { const k = (p * 1.6 - i * .3); if (k > 0 && k < 1) FIG.draw(ctx, hx + 6, hy + h * .1 + k * h * .38, h * .2, P.hang, { color: '#1a1e14', helmet: '#2a2e20' }); }
      for (let i = 0; i < 3; i++) if (p * 1.6 - i * .3 >= 1) FIG.draw(ctx, w * (.58 + i * .06), h * .66, h * .2, P.crouchAim, { color: '#1a1e14', rifle: true, helmet: '#2a2e20' });
    } },
    { d: 3.6, who: 'Breach', cap: '"Charge set... BREACHING!"', draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt); dark(ctx, w, h, .25);
      if (p > .35 && !st.b) { st.b = 1; fx.boom(w * .63, h * .6, 1.4); SFX.boom(); }
      FIG.draw(ctx, w * .4, h * .9, h * .4, p > .45 ? runPose(t, 12) : P.crouchAim, { color: '#1a1e14', rifle: true, helmet: '#2a2e20' });
    } },
  ];

  LIB.halo = [
    { d: 3.6, who: '28,000 feet', cap: 'The ramp opens to black sky. Oxygen on. Red light.', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0a0d10'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#04060c'; ctx.fillRect(w * .25, h * .2, w * .5, h * .6); H.stars(ctx, w * .5, h * .6, 40, 2, t);
      ctx.fillStyle = `rgba(255,30,30,${.25 + .15 * Math.sin(t * 6)})`; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.12 + i * .06), h * .88, h * .3, P.stand, { color: '#050505', helmet: '#111' });
    } },
    { d: 3.2, who: 'Green light', cap: 'GO. GO. GO.', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0a0d10'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#04060c'; ctx.fillRect(w * .25, h * .2, w * .5, h * .6);
      ctx.fillStyle = 'rgba(30,255,80,.18)'; ctx.fillRect(0, 0, w, h);
      if (!st.w) { st.w = 1; SFX.whoosh(); }
      FIG.draw(ctx, w * (.3 + p * .4), h * (.8 + p * .3), h * .3, FIG.lerp(P.run1, P.fall, p), { color: '#050505', helmet: '#111' });
    } },
    { d: 4.4, who: 'Freefall', cap: 'You fall through the stars for two full minutes.', draw(ctx, w, h, p, t, dt, fx, st) {
      H.sky(ctx, w, h, ['#02040a', '#0d1830', '#2a3f5c']); H.stars(ctx, w, h, 100, 5, t);
      for (let i = 0; i < 14; i++) { const y = ((i * 130 - t * 600) % (h + 200) + h + 200) % (h + 200) - 100; ctx.fillStyle = 'rgba(220,230,240,.22)'; ctx.beginPath(); ctx.ellipse((i * 211) % w, y, 120, 30, 0, 0, 7); ctx.fill(); }
      const pose = Object.assign({}, P.fall, { rot: 90 + Math.sin(t * 2) * 6 });
      FIG.draw(ctx, w * .5, h * .5, h * .3, pose, { color: '#060606', helmet: '#111' });
    } },
    { d: 3.6, who: '', cap: 'Canopy. A ghost under silk, gliding twenty kilometres into the valley.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      const x = w * (.3 + p * .3), y = h * (.25 + p * .2);
      ctx.fillStyle = '#1b2230'; ctx.beginPath(); ctx.ellipse(x, y - h * .14, h * .16, h * .05, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#1b2230'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - h * .16, y - h * .14); ctx.lineTo(x, y); ctx.lineTo(x + h * .16, y - h * .14); ctx.stroke();
      FIG.draw(ctx, x, y + h * .06, h * .1, P.hang, { color: '#050505' });
    } },
  ];

  LIB.wedding = [
    { d: 4.2, who: 'Mehndi night', cap: 'Dhol drums. Your cousins dance until the neighbours join in.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.wedding(ctx, w, h, t, st, dt);
      if (!st.d || t - st.d > 1.1) { st.d = t; SFX.dhol(); }
      for (let i = 0; i < 7; i++) { const k = (Math.sin(t * 7 + i) + 1) / 2; FIG.draw(ctx, w * (.1 + i * .13), h * .9 + Math.abs(Math.sin(t * 7 + i)) * -h * .02, h * .26, FIG.lerp(P.jump, P.guard, k), { color: ['#3a1020', '#10203a', '#203a10'][i % 3] }); }
    } },
    { d: 4.2, who: 'Rukhsati', cap: 'And then a quiet moment, two people at the start of a long road.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.wedding(ctx, w, h, t, st, dt); dark(ctx, w, h, .3);
      if (Math.random() < .15) fx.sparks(w * Math.random(), h * .2 * Math.random() + h * .1, 18, ['255,210,120', '255,120,160', '140,220,255'][Math.random() * 3 | 0]);
      FIG.draw(ctx, w * .44, h * .92, h * .44, P.stand, { color: '#2a1a10', facing: 1 });
      FIG.draw(ctx, w * .56, h * .92, h * .4, P.stand, { color: '#5a0f1f', facing: -1 });
    } },
  ];

  LIB.chase = [
    { d: 4.2, who: 'Shahrah-e-Faisal, 2340 hrs', cap: 'The courier\'s car jumps the signal. You floor it.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.karachi(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#111'; ctx.fillRect(0, h * .78, w, h * .22);
      for (let i = 0; i < 8; i++) { const x = ((i * 200 - t * 900) % (w + 200) + w + 200) % (w + 200) - 100; ctx.fillStyle = '#e8d070'; ctx.fillRect(x, h * .86, 60, 4); ctx.fillStyle = '#333'; ctx.fillRect(x + 30, h * .4, 4, h * .38); H.lamp(ctx, x + 32, h * .4, 60, t, '255,200,120'); }
      FIG.car(ctx, w * (.7 + Math.sin(t * 2) * .02), h * .84, h * .09, '#7a1d1d');
      FIG.car(ctx, w * (.3 + Math.sin(t * 2.3) * .03), h * .86, h * .1, '#1e2a3a');
    } },
    { d: 3.6, who: '', cap: 'Shots through the rear window. Glass everywhere.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.karachi(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#111'; ctx.fillRect(0, h * .78, w, h * .22);
      for (let i = 0; i < 8; i++) { const x = ((i * 200 - t * 900) % (w + 200) + w + 200) % (w + 200) - 100; ctx.fillStyle = '#e8d070'; ctx.fillRect(x, h * .86, 60, 4); }
      FIG.car(ctx, w * .68, h * .84, h * .09, '#7a1d1d');
      FIG.car(ctx, w * .36, h * .86, h * .1, '#1e2a3a');
      if (Math.random() < .3) { fx.tracer(w * .62, h * .78, w * .4, h * .8); SFX.shot(); fx.sparks(w * .42, h * .8, 6); }
    } },
    { d: 3.4, who: 'PIT manoeuvre', cap: 'You clip his rear bumper. The world turns over.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.karachi(ctx, w, h, t, st, dt); ctx.fillStyle = '#111'; ctx.fillRect(0, h * .78, w, h * .22);
      ctx.save(); ctx.translate(w * (.55 + p * .2), h * (.84 - Math.sin(p * Math.PI) * .15)); ctx.rotate(p * Math.PI * 2.2); FIG.car(ctx, 0, 0, h * .09, '#7a1d1d', false); ctx.restore();
      if (p > .8 && !st.b) { st.b = 1; fx.boom(w * .75, h * .84, .9); SFX.boom(); }
      FIG.car(ctx, w * .3, h * .86, h * .1, '#1e2a3a');
    } },
  ];

  const duelSeq = (who) => who === 'a'
    ? [[0, 'guard'], [.6, 'punch'], [.9, 'guard'], [1.5, 'block'], [2.0, 'guard'], [2.4, 'kick'], [2.9, 'guard'], [3.4, 'duck'], [3.8, 'sweep'], [4.3, 'guard'], [4.8, 'punch2'], [5.2, 'punch'], [5.6, 'guard']]
    : [[0, 'guard'], [.6, 'block'], [.9, 'guard'], [1.5, 'slash'], [2.0, 'guard'], [2.4, 'hit'], [2.9, 'guard'], [3.4, 'slash'], [3.8, 'jump'], [4.3, 'guard'], [4.8, 'hit'], [5.2, 'hit'], [5.6, 'down']];

  function duelShot(sceneName, cap, who, colorA, colorB, knife = true) {
    return { d: 5.8, who, cap, draw(ctx, w, h, p, t, dt, fx, st) {
      S[sceneName](ctx, w, h, t, st, dt); dark(ctx, w, h, .25);
      const T = p * 5.8;
      const pa = seqPose(duelSeq('a'), T), pb = seqPose(duelSeq('b'), T);
      const dx = Math.sin(T * 1.3) * w * .02;
      FIG.draw(ctx, w * .42 + dx, h * .86, h * .42, pa, { color: colorA });
      FIG.draw(ctx, w * .58 + dx, h * .86, h * .42, pb, { color: colorB, facing: -1, knife });
      st.hits = st.hits || {};
      [.6, 2.4, 3.8, 4.8, 5.2].forEach(k => { if (T > k && !st.hits[k]) { st.hits[k] = 1; fx.impact(w * .54 + dx, h * .55); SFX.hit(); } });
      [1.5, 3.4].forEach(k => { if (T > k && !st.hits[k]) { st.hits[k] = 1; fx.sparks(w * .47 + dx, h * .58, 10); SFX.whoosh(); } });
    } };
  }

  LIB.rooftop = [
    { d: 3.4, who: 'Saddar rooftops', cap: 'He runs. You follow, rooftop to rooftop, over a sleeping city.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.karachi(ctx, w, h, t, st, dt); ctx.fillStyle = '#05070c'; ctx.fillRect(0, h * .8, w * .45, h * .2); ctx.fillRect(w * .55, h * .78, w * .45, h * .22);
      const k = p; FIG.draw(ctx, w * (.1 + k * .7), h * (k > .4 && k < .6 ? .7 : .8), h * .22, k > .4 && k < .6 ? P.jump : runPose(t, 14), { color: '#030305' });
      FIG.draw(ctx, w * (.0 + k * .6), h * (k > .55 && k < .75 ? .7 : .8), h * .22, k > .55 && k < .75 ? P.jump : runPose(t + 1, 14), { color: '#0f1a12' });
    } },
    duelShot('karachi', 'He pulls a blade. You have nothing but your training.', 'Hand to hand', '#0f1a12', '#030305'),
  ];

  LIB.flood_rescue = [
    { d: 4.2, who: 'Flood relief', cap: 'A family on a rooftop. Water rising a foot an hour.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.flood(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#6b5a48'; ctx.fillRect(w * .4, h * .62, w * .2, h * .02);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.43 + i * .045), h * .62, h * (i > 1 ? .1 : .15), P.stand, { color: '#1a1410' });
    } },
    { d: 4.6, who: '', cap: 'You go down the winch line yourself. One by one, the children first.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.flood(ctx, w, h, t, st, dt);
      if (!st.s) { st.s = 1; SFX.heli(); }
      const hx = w * .5, hy = h * .15; FIG.heli(ctx, hx, hy, h * .16, t, '#26302a');
      const ly = h * (.2 + (p < .5 ? p * .8 : (1 - p) * .8));
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, hy + h * .05); ctx.lineTo(hx, ly); ctx.stroke();
      FIG.draw(ctx, hx, ly + h * .02, h * .14, P.hang, { color: '#3f4a2b', helmet: '#2a2e20' });
      if (p > .5) FIG.draw(ctx, hx + 8, ly + h * .1, h * .08, P.hang, { color: '#1a1410' });
      ctx.fillStyle = '#6b5a48'; ctx.fillRect(w * .4, h * .62, w * .2, h * .02);
    } },
  ];

  LIB.bilal_video = [
    { d: 4.4, who: 'Encrypted file received', cap: 'A video. A man tied to a chair. You know that face.', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0b0b0a'; ctx.fillRect(0, 0, w, h);
      H.lamp(ctx, w / 2, h * .3, h * .6, t, '255,230,180');
      ctx.fillStyle = '#2a241c'; ctx.fillRect(w * .44, h * .62, w * .12, h * .04); ctx.fillRect(w * .45, h * .66, 6, h * .22); ctx.fillRect(w * .54, h * .66, 6, h * .22);
      FIG.draw(ctx, w * .5, h * .66, h * .4, P.kneel, { color: '#4a4136' });
      FIG.draw(ctx, w * .7, h * .9, h * .5, P.stand, { color: '#050505', facing: -1, scarf: '#2a2420' });
      staticNoise(ctx, w, h, .2); if (Math.random() < .08) { ctx.fillStyle = 'rgba(255,0,0,.2)'; ctx.fillRect(0, Math.random() * h, w, 20); }
      ctx.fillStyle = '#e33'; ctx.font = '14px "Share Tech Mono", monospace'; ctx.fillText('REC ' + (t | 0).toString().padStart(2, '0') + ':' + ((t * 60 | 0) % 60).toString().padStart(2, '0'), 20, h * .16);
    } },
    { d: 3.8, who: 'The Hunter', cap: '"Your friend says you are a good man. Let us find out how good."', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); staticNoise(ctx, w, h, .5);
      textBig(ctx, w, h, 'SHIKARI', h * .52, Math.min(w * .14, 110), `rgba(200,40,30,${.6 + .4 * Math.random()})`);
    } },
  ];

  LIB.nvg = [
    { d: 4.2, who: 'Night vision', cap: 'The compound sits on a ledge at 3,000 metres. Four sentries. One road in.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.1 + i * .08 + p * .1), h * .9, h * .22, P.crouchAim, { color: '#101010', rifle: true, helmet: '#151515' });
      ctx.fillStyle = '#222'; ctx.fillRect(w * .65, h * .55, w * .2, h * .1); FIG.draw(ctx, w * .75, h * .55, h * .12, P.stand, { color: '#111', rifle: true, facing: -1 });
      nvg(ctx, w, h);
    } },
    { d: 3.6, who: '', cap: 'Suppressed shots. Four sentries drop without a sound.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#222'; ctx.fillRect(w * .65, h * .55, w * .2, h * .1);
      FIG.draw(ctx, w * .75, h * .55, h * .12, p > .4 ? P.down : P.stand, { color: '#111', facing: -1 });
      FIG.draw(ctx, w * .35, h * .98, h * .5, P.aim, { color: '#101010', rifle: true, helmet: '#151515', flash: p > .38 && p < .42 });
      nvg(ctx, w, h);
    } },
    { d: 3.6, who: 'Breach', cap: 'Flashbang. Door. Two hostiles. Bilal, alive.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      if (p > .2 && !st.b) { st.b = 1; fx.boom(w * .7, h * .6, .8); SFX.boom(); }
      FIG.draw(ctx, w * .5, h * .9, h * .4, runPose(t, 12), { color: '#101010', rifle: true, helmet: '#151515' });
      nvg(ctx, w, h);
    } },
  ];

  LIB.stadium = [
    { d: 4, who: 'Lahore, 2105 hrs', cap: 'Forty thousand spectators. Six gunmen. One bomb they have not found yet.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.stadium(ctx, w, h, t, st, dt);
      for (let i = 0; i < 6; i++) FIG.draw(ctx, w * (.2 + i * .1), h * .75, h * .14, P.aim, { color: '#050505', rifle: true });
    } },
    { d: 4, who: 'SSG teams in', cap: 'Your teams flow in from three gates at once, exactly as you planned.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.stadium(ctx, w, h, t, st, dt);
      for (let i = 0; i < 6; i++) FIG.draw(ctx, w * (-.1 + p * .5 + i * .07), h * .9, h * .24, runPose(t + i, 12), { color: '#1a1e14', rifle: true, beret: '#6a1020' });
      if (Math.random() < .3) { fx.tracer(w * .3, h * .7, w * .8, h * .6); SFX.shot(); }
      if (p > .6 && !st.f) { st.f = 1; fx.boom(w * .7, h * .7, .6); SFX.boom(); }
    } },
  ];

  LIB.duel = [
    { d: 4.4, who: 'Kohsar Dam', cap: 'The storm breaks as you reach the crest. He is waiting, as you knew he would be.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.dam(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * (.1 + p * .25), h * .38, h * .2, p < .9 ? runPose(t, 10) : P.guard, { color: '#0d140e' });
      FIG.draw(ctx, w * .7, h * .38, h * .2, P.stand, { color: '#030303', facing: -1 });
    } },
    { d: 4, who: 'Shikari', cap: '"I taught you everything you know, cadet. Did you think I would not save something for myself?"', draw(ctx, w, h, p, t, dt, fx, st) {
      S.dam(ctx, w, h, t, st, dt); dark(ctx, w, h, .25);
      FIG.draw(ctx, w * .6, h * 1.02, h * .7, P.guard, { color: '#030303', facing: -1, knife: true });
    } },
    duelShot('dam', 'Steel, rain, and forty years of the same lessons, turned against each other.', 'The last fight', '#0d140e', '#030303'),
    { d: 3.8, who: '', cap: 'He slips at the edge. You catch his wrist. For one second, the choice is yours.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.dam(ctx, w, h, t, st, dt); dark(ctx, w, h, .35);
      FIG.draw(ctx, w * .45, h * .42, h * .3, Object.assign({}, P.duck, { ua1: 150, la1: 0 }), { color: '#0d140e' });
      FIG.draw(ctx, w * .56, h * .74, h * .3, P.hang, { color: '#030303' });
    } },
  ];

  LIB.coas = [
    { d: 4.4, who: 'Change of command', cap: 'The outgoing Chief hands over the baton. Forty years end and begin in one gesture.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * .44, h * .92, h * .46, p > .5 ? P.salute : P.stand, { color: '#8f7f52', beret: null });
      FIG.draw(ctx, w * .56, h * .92, h * .46, FIG.lerp(P.stand, Object.assign({}, P.stand, { ua1: 70, la1: 10 }), Math.min(1, p * 2)), { color: '#8f7f52', facing: -1 });
    } },
    { d: 4, who: 'Flypast', cap: 'Green and white smoke across the sky.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t * 2.5, st, dt);
      if (!st.j) { st.j = 1; SFX.whoosh(); setTimeout(() => SFX.whoosh(), 400); }
      crowdLine(ctx, w, h * .95, 9, h * .26, t, '#8f7f52', 'salute');
    } },
  ];

  LIB.janaza = [
    { d: 4.6, who: 'The village graveyard', cap: 'They carry him wrapped in the flag he served. The whole village walks behind.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.graveyard(ctx, w, h, t, st, dt);
      const x = w * (.1 + p * .4);
      coffin(ctx, x, h * .74, h * .09);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, x - h * .08 + i * h * .055, h * .86, h * .2, marchPose(t * .4 + i), { color: '#1a1810' });
      for (let i = 0; i < 8; i++) FIG.draw(ctx, x - h * .2 - i * w * .05, h * .87, h * .18, marchPose(t * .4 + i * .7), { color: '#2a2418' });
    } },
    { d: 3.6, cap: 'A single bugle plays the Last Post.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.graveyard(ctx, w, h, t, st, dt); dark(ctx, w, h, .3 + p * .4);
      FIG.draw(ctx, w * .5, h * .94, h * .5, P.salute, { color: '#1a1810' });
    } },
  ];

  LIB.un = [
    { d: 4, who: 'UN mission, Kivara', cap: 'Pakistani blue helmets have guarded this camp for six months. Tonight, the militia comes.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.camp(ctx, w, h, t, st, dt); dark(ctx, w, h, .2 + p * .3);
      for (let i = 0; i < 3; i++) FIG.car(ctx, w * (1.1 - p * .4 + i * .15), h * .7, h * .06, '#3a3020', true, -1);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.1 + i * .08), h * .9, h * .24, P.crouchAim, { color: '#2a3020', rifle: true, helmet: '#3b7fd0' });
    } },
    { d: 4, who: '', cap: '"Hold the line. Not one of these families gets touched tonight."', draw(ctx, w, h, p, t, dt, fx, st) {
      S.camp(ctx, w, h, t, st, dt); dark(ctx, w, h, .5);
      if (Math.random() < .35) { fx.tracer(w * .85, h * .66, w * .25, h * .8, '255,140,80'); SFX.shot(); }
      if (Math.random() < .3) fx.tracer(w * .2, h * .78, w * .8, h * .66);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.1 + i * .08), h * .9, h * .24, P.crouchAim, { color: '#2a3020', rifle: true, helmet: '#3b7fd0', flash: Math.random() < .2 });
    } },
  ];

  LIB.sunset = [
    { d: 5, who: '', cap: 'An old man walks the field path with a child who asks too many questions.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * (.25 + p * .2), h * .86, h * .3, marchPose(t * .3, 2), { color: '#2a2018' });
      FIG.draw(ctx, w * (.31 + p * .2), h * .86, h * .17, marchPose(t * .3 + 1, 3), { color: '#2a2018' });
    } },
  ];

  LIB.earthquake = [
    { d: 4.2, who: 'Northern areas, 0850 hrs', cap: 'The ground ripples like water. Whole villages slide down the hillsides.', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.save(); ctx.translate((Math.random() - .5) * 18 * (1 - p), (Math.random() - .5) * 18 * (1 - p));
      S.valley(ctx, w, h, t, st, dt); ctx.restore();
      if (!st.b) { st.b = 1; SFX.boom(); }
      for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(120,100,80,.25)'; ctx.beginPath(); ctx.arc(w * (.2 + i * .12), h * .6 - p * 60, 30 + p * 50, 0, 7); ctx.fill(); }
    } },
  ];


  // ---------- vehicles and props for the newer cutscenes ----------
  function tank(ctx, x, y, s, t, f = 1, col = '#2c3324') {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s * .95, 0); ctx.quadraticCurveTo(s * 1.1, -s * .12, s * .9, -s * .22); ctx.lineTo(-s * .9, -s * .22); ctx.quadraticCurveTo(-s * 1.1, -s * .12, -s, 0); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(-s * .75 + i * s * .3, -s * .1, s * .09, 0, 7); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s * .75 + i * s * .3, -s * .1); ctx.lineTo(-s * .75 + i * s * .3 + Math.cos(t * 8) * s * .08, -s * .1 + Math.sin(t * 8) * s * .08); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, -s * .5, 0, -s * .2); g.addColorStop(0, CHAR.mix(col, '#ffffff', .12)); g.addColorStop(1, CHAR.mix(col, '#000000', .3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s * .95, -s * .22); ctx.lineTo(-s * .85, -s * .42); ctx.lineTo(s * .8, -s * .42); ctx.lineTo(s, -s * .22); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * .45, -s * .42); ctx.lineTo(-s * .38, -s * .66); ctx.lineTo(s * .3, -s * .66); ctx.lineTo(s * .42, -s * .42); ctx.fill();
    ctx.fillStyle = CHAR.mix(col, '#000000', .2); ctx.fillRect(s * .3, -s * .58, s * 1.05, s * .07);
    ctx.fillStyle = '#ffeaa0'; ctx.beginPath(); ctx.arc(s * .95, -s * .3, s * .035, 0, 7); ctx.fill();
    ctx.restore();
    const lg = ctx.createLinearGradient(x + f * s, 0, x + f * s * 5, 0); lg.addColorStop(0, 'rgba(255,240,190,.35)'); lg.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x + f * s * .95, y - s * .3); ctx.lineTo(x + f * s * 5, y - s * .7); ctx.lineTo(x + f * s * 5, y + s * .3); ctx.fill();
  }
  function busShape(ctx, x, y, s, col = '#c9542c') {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, -s * .5, 0, 0); g.addColorStop(0, CHAR.mix(col, '#ffffff', .15)); g.addColorStop(1, CHAR.mix(col, '#000000', .3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s, -s * .08); ctx.lineTo(-s, -s * .48); ctx.quadraticCurveTo(-s, -s * .55, -s * .9, -s * .55); ctx.lineTo(s * .88, -s * .55); ctx.quadraticCurveTo(s, -s * .52, s, -s * .4); ctx.lineTo(s, -s * .08); ctx.fill();
    ctx.fillStyle = '#e8c34a'; ctx.fillRect(-s, -s * .3, s * 2, s * .04); ctx.fillStyle = '#2a7a4a'; ctx.fillRect(-s, -s * .25, s * 2, s * .03);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(30,40,50,.85)'; ctx.fillRect(-s * .92 + i * s * .225, -s * .5, s * .19, s * .16); ctx.fillStyle = 'rgba(200,230,255,.15)'; ctx.fillRect(-s * .92 + i * s * .225, -s * .5, s * .19, s * .04); }
    ctx.fillStyle = '#111'; [-.65, .6].forEach(k => { ctx.beginPath(); ctx.arc(s * k, -s * .06, s * .12, 0, 7); ctx.fill(); ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(s * k, -s * .06, s * .05, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; });
    ctx.restore();
  }
  function trainShape(ctx, x, y, s, t, n = 6) {
    for (let i = 0; i < n; i++) {
      const cx = x - i * s * 2.1;
      ctx.fillStyle = i === 0 ? '#1d2a22' : '#24432e'; ctx.fillRect(cx - s, y - s * .62, s * 2, s * .55);
      ctx.fillStyle = '#c9b06a'; ctx.fillRect(cx - s, y - s * .3, s * 2, s * .03);
      if (i) for (let k = 0; k < 6; k++) { const on = (k + i) % 3 !== 0; ctx.fillStyle = on ? `rgba(255,210,130,${.75 + .2 * Math.sin(t * 3 + k)})` : 'rgba(20,20,20,.9)'; ctx.fillRect(cx - s * .9 + k * s * .3, y - s * .52, s * .2, s * .15); }
      ctx.fillStyle = '#0c0c0c'; [-.6, .6].forEach(k => { ctx.beginPath(); ctx.arc(cx + s * k, y - s * .04, s * .09, 0, 7); ctx.fill(); });
    }
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(x - s * 2.1 * n, y, s * 2.1 * n + s, s * .05);
  }
  function compass(ctx, x, y, r, t) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#2a3a30'); g.addColorStop(1, '#0b100c'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7ad89a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * .92, 0, 7); ctx.stroke();
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2, l = i % 9 === 0 ? .16 : .07; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9); ctx.lineTo(x + Math.cos(a) * r * (.9 - l), y + Math.sin(a) * r * (.9 - l)); ctx.stroke(); }
    ctx.fillStyle = '#7ad89a'; ctx.font = `${r * .22}px "Saira Stencil One", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('N', x, y - r * .55); ctx.textAlign = 'left';
    const a = Math.sin(t * 1.3) * .5 + Math.sin(t * 3.1) * .08;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#e04030'; ctx.beginPath(); ctx.moveTo(0, -r * .7); ctx.lineTo(r * .07, 0); ctx.lineTo(-r * .07, 0); ctx.fill(); ctx.fillStyle = '#d8d8d0'; ctx.beginPath(); ctx.moveTo(0, r * .7); ctx.lineTo(r * .07, 0); ctx.lineTo(-r * .07, 0); ctx.fill(); ctx.restore();
    H.lamp(ctx, x, y, r * 2, t, '120,255,160', 0);
  }
  function digits(ctx, x, y, size, txt, col = '#ff3b30') {
    ctx.save(); ctx.font = `${size}px "Share Tech Mono", monospace`; ctx.textAlign = 'center'; ctx.shadowColor = col; ctx.shadowBlur = size * .4; ctx.fillStyle = col; ctx.fillText(txt, x, y); ctx.restore();
  }
  function crowdCircle(ctx, cx, cy, rx, ry, n, s, t, col) {
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + .3; if (Math.sin(a) > .2) continue; FIG.draw(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, s, FIG.lerp(P.stand, P.guard, (Math.sin(t * 6 + i) + 1) / 4), { color: col, facing: Math.cos(a) > 0 ? -1 : 1, simple: true }); }
  }

  LIB.school_fight = [
    { d: 4, who: 'Behind the banyan tree', cap: 'A circle forms. Somebody shouts "Maar! Maar!" Nobody calls a teacher.', cam: [-.4, 1.03, .3, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t, st, dt);
      crowdCircle(ctx, w * .5, h * .8, w * .3, h * .06, 12, h * .2, t, '#e8e4da');
      FIG.draw(ctx, w * .44, h * .86, h * .32, P.guard, { color: '#efece4', skin: '#b07a52' });
      FIG.draw(ctx, w * .58, h * .86, h * .34, FIG.lerp(P.guard, P.stand, .3), { color: '#efece4', skin: '#9e6c46', facing: -1 });
    } },
    { d: 4.4, who: 'Slow motion', cap: 'Time slows. You see the punch coming a full second before he throws it.', grade: 'contrast(1.15) saturate(.8) sepia(.15)', cam: [0, 1.15, 0, 1.25], draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t * .2, st, dt * .2);
      const T = p * 2.2;
      FIG.draw(ctx, w * .44, h * .95, h * .5, seqPose([[0, 'guard'], [.9, 'duck'], [1.4, 'punch'], [2.2, 'guard']], T), { color: '#efece4', skin: '#b07a52' });
      FIG.draw(ctx, w * .6, h * .95, h * .52, seqPose([[0, 'guard'], [.7, 'punch'], [1.4, 'hit'], [2.2, 'hit']], T), { color: '#efece4', skin: '#9e6c46', facing: -1 });
      if (T > 1.4 && !st.h) { st.h = 1; fx.impact(w * .53, h * .55); SFX.hit(); }
    } },
  ];

  LIB.train = [
    { d: 4.6, who: 'Tezgam Express', cap: 'The night train climbs north toward Havelian. You do not sleep at all.', grade: 'contrast(1.08) saturate(1.05)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.issb(ctx, w, h, t, st, dt);
      ctx.fillStyle = 'rgba(10,8,20,.35)'; ctx.fillRect(0, 0, w, h);
      trainShape(ctx, w * (.4 + p * .5), h * .8, h * .1, t, 7);
      H.smoke(ctx, st, 'tsm', w * (.4 + p * .5) + h * .05, h * .72, dt, '200,190,180', 6, 1.6);
    } },
    { d: 4.4, who: '', cap: 'Pine forests slide past the window. Somewhere ahead are the mountains of Kakul.', cam: [0, 1.06, 0, 1.06], draw(ctx, w, h, p, t, dt, fx, st) {
      st._own = 1; st.cam = { x: t * 3, z: 1.05, y: 0 };
      S.mountain_night(ctx, w, h, t, st, dt);
      for (let i = 0; i < 10; i++) { const x = ((i * 160 - t * 700) % (w + 300) + w + 300) % (w + 300) - 150; H.drawTree(ctx, x, h * 1.02, h * .7, 0, 'pine', i, ['#0e1a14', '#030605'], 0); }
      ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, w, h * .12); ctx.fillRect(0, h * .78, w, h * .22); ctx.fillRect(0, 0, w * .1, h); ctx.fillRect(w * .9, 0, w * .1, h);
      FIG.draw(ctx, w * .82, h * .98, h * .6, Object.assign({}, P.stand, { head: -8 }), { color: '#0d0a08', facing: -1 });
      H.lamp(ctx, w * .5, h * .1, h * .4, t, '255,200,120', .2);
    } },
  ];

  LIB.boxing = [
    { d: 3.8, who: 'Term boxing finals', cap: 'Six hundred cadets packed into the hall. Your opponent: Senior Fawad.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.ring(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * .4, h * .86, h * .4, FIG.lerp(P.guard, P.stand, (Math.sin(t * 5) + 1) / 6), { color: '#1f3fa0', skin: '#b07a52' });
      FIG.draw(ctx, w * .6, h * .86, h * .42, FIG.lerp(P.guard, P.stand, (Math.sin(t * 5 + 2) + 1) / 6), { color: '#a02020', skin: '#b98258', facing: -1 });
    } },
    { d: 5, who: 'Round three', cap: 'Jab. Slip. Jab. Your arms are made of lead. His are made of fire.', cam: [-.3, 1.12, .3, 1.2], draw(ctx, w, h, p, t, dt, fx, st) {
      S.ring(ctx, w, h, t, st, dt);
      const T = p * 5;
      FIG.draw(ctx, w * .42, h * .92, h * .52, seqPose([[0, 'guard'], [.6, 'punch'], [1, 'guard'], [1.8, 'duck'], [2.3, 'punch2'], [2.8, 'guard'], [3.6, 'block'], [4.2, 'punch'], [5, 'guard']], T), { color: '#1f3fa0', skin: '#b07a52' });
      FIG.draw(ctx, w * .6, h * .92, h * .54, seqPose([[0, 'guard'], [.6, 'hit'], [1, 'guard'], [1.8, 'punch'], [2.3, 'hit'], [2.8, 'guard'], [3.6, 'punch2'], [4.2, 'hit'], [5, 'hit']], T), { color: '#a02020', skin: '#b98258', facing: -1 });
      st.hits = st.hits || {}; [.6, 2.3, 4.2].forEach(k => { if (T > k && !st.hits[k]) { st.hits[k] = 1; fx.impact(w * .53, h * .5); SFX.hit(); } });
      if (Math.random() < .05) H.flare(ctx, Math.random() * w, h * .3, 40, t);
    } },
  ];

  LIB.night_nav = [
    { d: 4.4, who: 'Night navigation', cap: 'Twelve kilometres, four checkpoints, one compass and no torch until the last one.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.forest_night(ctx, w, h, t, st, dt);
      for (let i = 0; i < 3; i++) FIG.draw(ctx, w * (.2 + i * .12 + p * .15), h * .9, h * .28, FIG.lerp(P.march1, P.march2, (Math.sin(t * 3 + i) + 1) / 2), { color: '#0a0e0c', pack: '#1a1f18' });
    } },
    { d: 3.8, who: '', cap: 'Bearing 047. Six hundred paces. Then the stream, then the white rock.', grade: 'contrast(1.2) saturate(.9)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#030504'; ctx.fillRect(0, 0, w, h);
      compass(ctx, w * .5, h * .5, Math.min(w, h) * .3 * (1 + p * .08), t);
      ctx.fillStyle = 'rgba(176,122,82,.9)'; ctx.beginPath(); ctx.ellipse(w * .5 + Math.min(w, h) * .33, h * .62, Math.min(w, h) * .12, Math.min(w, h) * .2, -.4, 0, 7); ctx.fill();
    } },
  ];

  LIB.sniper_duel = [
    { d: 3.6, who: 'The ridge', cap: 'A glint on the third rock from the left. He is looking right at you.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      if (Math.sin(t * 4) > .6) H.flare(ctx, w * .72, h * .44, 26, t, '255,250,230');
      FIG.draw(ctx, w * .25, h * .96, h * .5, P.crouchAim, { color: '#0a0e0a', rifle: true, helmet: '#141a12' });
    } },
    { d: 4.2, who: 'One breath', cap: 'Exhale. The world goes silent. You squeeze.', grade: 'contrast(1.25) saturate(.6)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t * .15, st, dt * .15);
      const bx = w * (.1 + p * .65), by = h * (.75 - p * .3);
      ctx.strokeStyle = 'rgba(255,240,200,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * .1, h * .75); ctx.lineTo(bx, by); ctx.stroke();
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(255,255,255,${.08 - i * .01})`; ctx.beginPath(); ctx.arc(bx - i * 14, by + i * 6, 6 + i * 4, 0, 7); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, 7); ctx.fill();
      if (p > .97 && !st.h) { st.h = 1; fx.sparks(w * .75, h * .45, 16); SFX.shot(); }
    } },
  ];

  LIB.hellweek = [
    { d: 4.4, who: 'SSG selection, week two', cap: 'Rain for three days. The log weighs ninety kilos. Your team carries it up the hill eleven times.', grade: 'contrast(1.12) saturate(.75)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.cherat(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(30,40,50,.35)'; ctx.fillRect(0, 0, w, h); H.rain(ctx, w, h, st, dt, 260);
      const x = w * (.15 + p * .4);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, x + i * h * .09, h * .9, h * .3, FIG.lerp(Object.assign({}, P.run1, { ua1: 160, la1: -20 }), Object.assign({}, P.run2, { ua1: 160, la1: -20 }), (Math.sin(t * 6 + i) + 1) / 2), { color: '#4a4632', skin: '#a8754e' });
      ctx.fillStyle = '#5a3e24'; ctx.save(); ctx.translate(x + h * .14, h * .655 + Math.sin(t * 6) * 3); ctx.rotate(-.02); ctx.fillRect(-h * .22, -h * .025, h * .44, h * .05); ctx.restore();
    } },
    { d: 3.8, who: 'Rope', cap: 'Thirty feet of wet rope. Hands that stopped feeling anything two days ago.', cam: [0, 1.1, 0, 1.18], draw(ctx, w, h, p, t, dt, fx, st) {
      S.cherat(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(30,40,50,.35)'; ctx.fillRect(0, 0, w, h); H.rain(ctx, w, h, st, dt, 260);
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * .55, 0); ctx.lineTo(w * .55 + Math.sin(t * 2) * 4, h); ctx.stroke();
      FIG.draw(ctx, w * .55, h * (.85 - p * .45), h * .32, FIG.lerp(P.hang, Object.assign({}, P.hang, { ua1: 150, ua2: 178, th1: 40, sh1: -60 }), (Math.sin(t * 4) + 1) / 2), { color: '#4a4632', skin: '#a8754e' });
    } },
  ];

  LIB.bus_siege = [
    { d: 4.4, who: 'Karakoram Highway', cap: 'Bus 14 sits in the middle of the bridge. Forty-one passengers. Six gunmen.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#4a4036'; ctx.fillRect(-w, h * .7, w * 3, h * .04); for (let i = 0; i < 12; i++) ctx.fillRect(i * w / 11, h * .74, 6, h * .26);
      ctx.fillStyle = 'rgba(60,90,110,.6)'; ctx.fillRect(-w, h * .9, w * 3, h * .1);
      busShape(ctx, w * .5, h * .7, h * .16);
      for (let i = 0; i < 3; i++) FIG.draw(ctx, w * (.3 + i * .32 * (i % 2 ? 1 : .5)), h * .7, h * .14, P.aim, { color: '#2a2018', rifle: true, scarf: '#3a2a20', facing: i % 2 ? -1 : 1 });
    } },
    { d: 4, who: 'Under the bridge', cap: 'Your team climbs the girders from below, invisible from the road.', grade: 'contrast(1.1) saturate(.85)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2a241e'; ctx.fillRect(-w, h * .2, w * 3, h * .06); ctx.strokeStyle = '#2a241e'; ctx.lineWidth = 8; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * w / 5, h * .26); ctx.lineTo(i * w / 5 + w / 10, h * .7); ctx.lineTo(i * w / 5 + w / 5, h * .26); ctx.stroke(); }
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.2 + i * .15), h * (.75 - p * .35 + i * .03), h * .2, P.hang, { color: '#1a1e14', helmet: '#2a2e20', beret: null });
    } },
    { d: 3, who: 'Breach', cap: 'Flashbangs through both doors at once.', flash: true, draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt);
      busShape(ctx, w * .5, h * .8, h * .3);
      if (p > .2 && !st.b) { st.b = 1; fx.boom(w * .3, h * .6, .6); fx.boom(w * .7, h * .6, .6); SFX.boom(); }
      if (p > .2 && p < .35) { ctx.fillStyle = `rgba(255,255,255,${1 - (p - .2) / .15})`; ctx.fillRect(0, 0, w, h); }
    } },
  ];

  LIB.karachi_tail = [
    { d: 4.6, who: 'Saddar, Thursday night', cap: 'Kamran never looks back. You never get closer than forty metres.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.street(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * (.55 + p * .3), h * .9, h * .3, FIG.lerp(P.march1, P.march2, (Math.sin(t * 4.5) + 1) / 2), { color: '#121418', skin: '#9e6c46' });
      FIG.draw(ctx, w * (.1 + p * .3), h * .96, h * .38, FIG.lerp(P.march1, P.march2, (Math.sin(t * 4.5 + 1) + 1) / 2), { color: '#262a30', skin: '#b07a52' });
      ctx.fillStyle = '#121212'; ctx.beginPath(); ctx.ellipse(w * (.1 + p * .3) + h * .03, h * .55, h * .12, h * .04, 0, Math.PI, 0); ctx.fill();
    } },
    { d: 3.8, who: '', cap: 'He turns into a tea stall. You buy a paper and read the same line nine times.', cam: [.2, 1.15, .1, 1.22], draw(ctx, w, h, p, t, dt, fx, st) {
      S.street(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * .3, h * .98, h * .55, Object.assign({}, P.stand, { ua1: 60, la1: 80, ua2: 50, la2: 90, head: 12 }), { color: '#262a30', skin: '#b07a52' });
      ctx.fillStyle = '#e8e2d0'; ctx.fillRect(w * .33, h * .55, h * .14, h * .18); ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i < 6; i++) ctx.fillRect(w * .335, h * (.57 + i * .025), h * .12, 2);
    } },
  ];

  LIB.port_bomb = [
    { d: 4, who: 'Berth nine, 0310', cap: 'Between the containers, a fuel tanker. And somewhere inside it, a timer.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.port(ctx, w, h, t, st, dt);
      for (let i = 0; i < 3; i++) FIG.draw(ctx, w * (.1 + p * .4 + i * .08), h * .86, h * .26, FIG.lerp(P.run1, P.run2, (Math.sin(t * 10 + i) + 1) / 2), { color: '#0d1014', skin: '#9e6c46' });
    } },
    { d: 3.8, who: '', cap: 'Four minutes and eleven seconds. Ten. Nine.', grade: 'contrast(1.25) saturate(.8)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#050506'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1a1c1e'; ctx.fillRect(w * .25, h * .3, w * .5, h * .4);
      ['#d33a2c', '#2f6fd6', '#e8c53a', '#2aa34f'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(w * .25, h * (.4 + i * .07)); ctx.bezierCurveTo(w * .1, h * (.5 + i * .05), w * .2, h * .9, w * .05, h); ctx.stroke(); });
      const sec = Math.max(0, 251 - Math.floor(t)); digits(ctx, w * .5, h * .55, h * .14, `0${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`);
      if (Math.floor(t * 2) % 2 === 0 && !st['b' + Math.floor(t)]) { st['b' + Math.floor(t)] = 1; SFX.beep(); }
    } },
  ];

  LIB.wargame = [
    { d: 4.6, who: 'Exercise Steel Curtain', cap: 'Five days. Two divisions on paper. Every decision marked by a colonel with a red pen.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.maproom(ctx, w, h, t, st, dt);
      [.18, .32, .68, .82].forEach((x, i) => FIG.draw(ctx, w * x, h * .78, h * .42, Object.assign({}, P.stand, { torso: 25, ua1: 40, la1: 30, head: 18 }), { color: '#0c0d0b', facing: x < .5 ? 1 : -1 }));
    } },
  ];

  LIB.kidnap = [
    { d: 4.4, who: 'Murree road, 2350', cap: 'A car across the road. A man waving a torch. Bilal slows down. He always was too kind.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.road_night(ctx, w, h, t, st, dt);
      FIG.car(ctx, w * (.2 + p * .25), h * .86, h * .1, '#2a3040', true);
      FIG.car(ctx, w * .74, h * .82, h * .09, '#141414', false, -1);
      FIG.draw(ctx, w * .66, h * .84, h * .22, Object.assign({}, P.stand, { ua1: 120 + Math.sin(t * 6) * 30, la1: 10 }), { color: '#050505', scarf: '#2a2420' });
      H.lamp(ctx, w * .66, h * .6, h * .12, t, '255,250,220', 1);
    } },
    { d: 3.6, who: '', cap: 'Then four more men out of the trees.', grade: 'contrast(1.2) saturate(.7)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.road_night(ctx, w, h, t, st, dt);
      FIG.car(ctx, w * .45, h * .86, h * .1, '#2a3040', true);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.85 - p * .3 - i * .05), h * (.86 + i * .02), h * .24, FIG.lerp(P.run1, P.run2, (Math.sin(t * 10 + i) + 1) / 2), { color: '#050505', scarf: '#2a2420', rifle: i % 2 === 0, facing: -1 });
      if (p > .7) { ctx.fillStyle = `rgba(0,0,0,${(p - .7) / .3})`; ctx.fillRect(0, 0, w, h); }
    } },
  ];

  LIB.quake_rescue = [
    { d: 4.4, who: 'Day two', cap: 'A child\'s voice under a concrete slab. Six soldiers, one jack, no machines.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.rubble(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#8a8070'; ctx.save(); ctx.translate(w * .5, h * .8); ctx.rotate(-.06 - p * .08); ctx.fillRect(-w * .2, -h * .05, w * .4, h * .07); ctx.restore();
      for (let i = 0; i < 5; i++) FIG.draw(ctx, w * (.33 + i * .085), h * .92, h * .3, Object.assign({}, P.kneel, { ua1: 150, la1: -20, torso: 15 }), { color: '#4a4a32', skin: '#a8754e', helmet: '#3a3e2a' });
    } },
    { d: 3.8, who: '', cap: 'Forty minutes later, a hand. Then a face covered in dust. Then a smile.', cam: [0, 1.12, 0, 1.2], draw(ctx, w, h, p, t, dt, fx, st) {
      S.rubble(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * .46, h * .96, h * .55, Object.assign({}, P.stand, { ua1: 70, la1: 40, ua2: 60, la2: 50 }), { color: '#4a4a32', skin: '#a8754e', helmet: '#3a3e2a' });
      FIG.draw(ctx, w * .55, h * .78, h * .22, Object.assign({}, P.hang, { ua1: 100, ua2: 80 }), { color: '#a87a5a', skin: '#c99468', shadow: false });
      H.godRays(ctx, w * .7, h * .1, w, h, t, '255,230,190', 10, .06);
    } },
  ];

  LIB.coup_tanks = [
    { d: 4.6, who: 'Islamabad, 0100 hours', cap: 'Tanks on Constitution Avenue. The street lights flicker as they pass.', grade: 'contrast(1.15) saturate(.75)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.avenue(ctx, w, h, t, st, dt);
      for (let i = 0; i < 3; i++) tank(ctx, w * (-.1 + p * .5 + i * .22), h * (.86 + i * .03), h * (.11 + i * .015), t, 1);
      if (!st.s) { st.s = 1; SFX.boom(); }
    } },
    { d: 3.8, who: '', cap: 'On television, patriotic songs. In a hundred thousand homes, people wait to see who is in charge.', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1c1c20'; ctx.fillRect(w * .3, h * .25, w * .4, h * .42);
      const g = ctx.createLinearGradient(0, h * .27, 0, h * .65); g.addColorStop(0, '#0b6b3a'); g.addColorStop(1, '#073d22'); ctx.fillStyle = g; ctx.fillRect(w * .32, h * .27, w * .36, h * .38);
      H.flag(ctx, w * .4, h * .36, w * .2, w * .13, t, false);
      for (let y = 0; y < h; y += 3) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(w * .32, h * .27 + (y % (h * .38)), w * .36, 1); }
      H.lamp(ctx, w * .5, h * .46, h * .8, t, '80,200,130', .5);
      FIG.draw(ctx, w * .2, h * 1.02, h * .5, Object.assign({}, P.kneel, { head: 10 }), { color: '#050506', shadow: false });
    } },
  ];

  LIB.tv_station = [
    { d: 5, who: 'The TV station gate', cap: 'A brigade with rifles raised. A general walking across the car park alone, hands open.', grade: 'contrast(1.18) saturate(.7)', cam: [-.2, 1.05, .2, 1.14], draw(ctx, w, h, p, t, dt, fx, st) {
      S.avenue(ctx, w, h, t, st, dt);
      for (let i = 0; i < 9; i++) FIG.draw(ctx, w * (.55 + i * .05), h * (.8 + (i % 2) * .02), h * .22, P.aim, { color: '#0a0c08', rifle: true, helmet: '#141810', facing: -1 });
      FIG.draw(ctx, w * (.1 + p * .3), h * .92, h * .34, FIG.lerp(Object.assign({}, P.march1, { ua1: 30, ua2: 25, la1: 20, la2: 20 }), Object.assign({}, P.march2, { ua1: 25, ua2: 30, la1: 20, la2: 20 }), (Math.sin(t * 2.4) + 1) / 2), { color: '#3a3626', cap: '#a99a6c', skin: '#a8754e' });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sx = w * .85 + Math.sin(t * .7) * w * .1; const g = ctx.createLinearGradient(sx, 0, w * .3, h); g.addColorStop(0, 'rgba(255,255,230,.25)'); g.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(w * (.1 + p * .3) - 60, h); ctx.lineTo(w * (.1 + p * .3) + 60, h); ctx.fill(); ctx.restore();
    } },
    { d: 3.6, who: '', cap: 'One by one, the rifles come down.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.avenue(ctx, w, h, t, st, dt);
      for (let i = 0; i < 9; i++) { const k = Math.min(1, Math.max(0, p * 2.5 - i * .15)); FIG.draw(ctx, w * (.4 + i * .06), h * (.86 + (i % 2) * .02), h * .26, FIG.lerp(P.aim, Object.assign({}, P.stand, { ua1: 20, la1: 40 }), k), { color: '#0a0c08', rifle: true, helmet: '#141810', facing: -1 }); }
      FIG.draw(ctx, w * .3, h * .94, h * .38, P.stand, { color: '#3a3626', cap: '#a99a6c', skin: '#a8754e' });
    } },
  ];

  LIB.epilogue = [
    { d: 4.4, who: '', cap: 'Forty-three years. Snow, sand, floods, a stadium, a dam in the rain.', grade: 'sepia(.25) contrast(1.05)', draw(ctx, w, h, p, t, dt, fx, st) { S.snowpost(ctx, w, h, t, st, dt); FIG.draw(ctx, w * .5, h * .9, h * .4, P.stand, { color: '#3f4a2b', helmet: '#e8ecef' }); } },
    { d: 4.4, who: '', cap: 'Men he carried down mountains. Men he could not.', grade: 'sepia(.3) contrast(1.05) saturate(.8)', draw(ctx, w, h, p, t, dt, fx, st) { S.graveyard(ctx, w, h, t, st, dt); FIG.draw(ctx, w * .45, h * .92, h * .45, P.salute, { color: '#2a2418' }); } },
    { d: 4.6, who: '', cap: 'And a parade ground where it started, the gravel exactly as he remembered it.', draw(ctx, w, h, p, t, dt, fx, st) { S.pma(ctx, w, h, t, st, dt); for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) FIG.draw(ctx, ((i * w * .12 + p * w * .2 + r * 20) % (w * 1.2)) - w * .05, h * (.74 + r * .08), h * (.16 + r * .04), marchPose(t), { color: '#8f7f52', rifle: true, beret: '#1a1a1a' }); } },
    { d: 4.4, who: '', cap: 'Somewhere in a soldiers\' village, a boy is flying a kite.', draw(ctx, w, h, p, t, dt, fx, st) { S.village(ctx, w, h, t, st, dt); FIG.draw(ctx, w * (.3 + p * .1), h * .9, h * .22, runPose(t, 8), { color: '#efece4', skin: '#b07a52' }); } },
    { d: 3.6, cap: '', draw(ctx, w, h, p, t) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); textBig(ctx, w, h, 'SIPAHI SE SIPAHSALAR', h * .5, Math.min(w * .07, 64), `rgba(239,233,214,${Math.min(1, p * 2)})`); } },
  ];


  // ---------- character close-ups ----------
  const DEFAULT_S = { skin: CHAR.SKINS[2], hair: CHAR.HAIRS[0], age: 34, rank: 6, flags: {}, vars: {}, kids: [], wife: 'Ayesha' };
  function look(who, mood, over) {
    let L;
    if (who === 'hero') L = window.GAME && GAME.S ? GAME.look(mood) : { outfit: 'combat', rank: 5, hat: 'beret', moustache: true, age: 30, skin: CHAR.SKINS[2], hair: CHAR.HAIRS[0], tape: 'RAZA', medals: ['#0b6b3a', '#b3201e'] };
    else { const d = window.NPCS[who]; const S = (window.GAME && GAME.S) || DEFAULT_S; L = typeof d.look === 'function' ? d.look(S) : d.look; }
    return Object.assign({}, L, over || {}, { mood: mood || 'neutral' });
  }
  const off = document.createElement('canvas'), offc = off.getContext('2d'), off2 = document.createElement('canvas'), off2c = off2.getContext('2d');
  // o: x (centre 0..1), bottom (0..1), hgt (visible crop height as fraction of h), crop face|bust|waist|full,
  //    light 'r,g,b', side ±1, talk, salute, flip, alpha
  function portrait(ctx, w, h, t, who, mood, o = {}) {
    const L = look(who, mood, o.over);
    const blink = (t % 4.1) > 3.95;
    const talk = o.talk && Math.floor(t * 7.5) % 2 === 0;
    const im = CHAR.image(L, { blink, talk, salute: o.salute });
    const base = CHAR.image(L, { salute: o.salute });
    const img = im.complete && im.naturalWidth ? im : base;
    if (!img.complete || !img.naturalWidth) return;
    const crop = { face: [52, 34, 96, 118], bust: [22, 26, 156, 230], waist: [0, 20, 200, 300], full: [0, 0, 200, 460] }[o.crop || 'bust'];
    const k = 4, sx = crop[0] * k, sy = crop[1] * k, sw = crop[2] * k, sh = crop[3] * k;
    const breathe = 1 + Math.sin(t * 1.7) * .006;
    const dh = h * (o.hgt || .9) * breathe, dw = dh * sw / sh;
    const cx = w * (o.x ?? .5), by = h * (o.bottom ?? 1.0);
    off.width = Math.ceil(dw + 8); off.height = Math.ceil(dh + 8);
    offc.clearRect(0, 0, off.width, off.height);
    offc.save(); if (o.flip) { offc.translate(off.width, 0); offc.scale(-1, 1); }
    offc.drawImage(img, sx, sy, sw, sh, 4, 4, dw, dh); offc.restore();
    // directional light and shade, kept inside the character's silhouette
    const side = o.side || 1, lc = o.light || '255,235,205';
    offc.globalCompositeOperation = 'source-atop';
    const g = offc.createLinearGradient(side > 0 ? off.width : 0, 0, side > 0 ? 0 : off.width, 0);
    g.addColorStop(0, `rgba(${lc},.22)`); g.addColorStop(.45, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,10,${o.shade ?? .38})`);
    offc.fillStyle = g; offc.fillRect(0, 0, off.width, off.height);
    if (o.tint) { offc.fillStyle = o.tint; offc.fillRect(0, 0, off.width, off.height); }
    offc.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
    // a living pose: slow weight shift and head bob, livelier while speaking
    { const seed = (who.length * 7 + (o.x || .5) * 13), talkK = o.talk ? 1 : 0;
      const rot = Math.sin(t * .55 + seed) * .012 + Math.sin(t * 1.3 + seed * 2) * .004 + talkK * Math.sin(t * 4.6 + seed) * .012;
      const sx = Math.sin(t * .42 + seed) * dw * .012, sy = Math.sin(t * 2.6 + seed) * talkK * dh * .004;
      ctx.translate(cx + sx, by + sy); ctx.rotate(rot); ctx.translate(-cx, -by); }
    // rim light: a tinted copy just behind, offset toward the light
    off2.width = off.width; off2.height = off.height; off2c.drawImage(off, 0, 0); off2c.globalCompositeOperation = 'source-in'; off2c.fillStyle = `rgb(${o.rim || lc})`; off2c.fillRect(0, 0, off2.width, off2.height); off2c.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = (o.alpha ?? 1) * .6; ctx.drawImage(off2, cx - dw / 2 - 4 + side * 3, by - dh - 4 - 1); ctx.globalAlpha = o.alpha ?? 1;
    ctx.drawImage(off, cx - dw / 2 - 4, by - dh - 4);
    ctx.restore();
  }
  function rainOver(ctx, w, h, st, dt) { H.rain(ctx, w, h, st, dt, 160, 'rgba(200,215,240,.35)'); }
  function tear(ctx, x, y, p) { if (p < .3) return; const k = Math.min(1, (p - .3) * 2); ctx.fillStyle = 'rgba(210,230,255,.85)'; ctx.beginPath(); ctx.ellipse(x, y + k * 30, 3, 4.5, 0, 0, 7); ctx.fill(); }
  function badgeZoom(ctx, w, h, p, t) {
    if (!window.GAME || !GAME.S) return;
    const k = Math.min(1, p * 1.6), sz = h * (.4 - k * .22), x = w * (.72 - k * .1), y = h * (.36 + k * .08);
    const im = badgeImg(GAME.S.rank);
    if (im.complete && im.naturalWidth) { ctx.save(); ctx.globalAlpha = Math.min(1, p * 4); ctx.drawImage(im, x - sz * im.naturalWidth / im.naturalHeight / 2, y - sz / 2, sz * im.naturalWidth / im.naturalHeight, sz); ctx.restore(); }
    if (k >= 1) for (let i = 0; i < 3; i++) H.flare(ctx, x + Math.cos(t * 2 + i * 2) * 30, y + Math.sin(t * 2 + i * 2) * 14, 24, t, '255,220,140');
  }
  const badgeCache = {};
  function badgeImg(r) { if (badgeCache[r]) return badgeCache[r]; const svg = CHAR.insigniaBadge(r).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" preserveAspectRatio="xMidYMid meet" '); const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); badgeCache[r] = im; return im; }

  LIB.promotion = [
    { d: 3.6, who: () => 'Promotion parade', cap: () => `The Commanding Officer steps forward with a small box. The battalion is silent.`, draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * .42, h * .9, h * .42, p > .55 ? P.salute : P.stand, { color: '#4c5634', beret: '#1f2a1c', skin: '#a8754e' });
      FIG.draw(ctx, w * .58, h * .9, h * .44, FIG.lerp(P.march1, P.stand, Math.min(1, p * 1.6)), { color: '#8f7f52', cap: '#a99a6c', skin: '#b58a64', facing: -1 });
      for (let i = 0; i < 8; i++) FIG.draw(ctx, w * (.04 + i * .12), h * .7, h * .16, P.stand, { color: '#4c5634', beret: '#1f2a1c', simple: true });
    } },
    { d: 4.6, who: () => 'Promoted', cap: () => (window.GAME && GAME.S ? GAME.rankName() : 'Promoted'), cam: [0, 1.0, 0, 1.05], draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t * .5, st, dt); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'happy', { x: .38, crop: 'bust', hgt: 1.0, bottom: 1.1, light: '255,225,170', salute: p > .45 });
      badgeZoom(ctx, w, h, p, t);
      if (p > .5 && !st.f) { st.f = 1; SFX.fanfare(); }
      if (p > .5 && Math.random() < .4) fx.sparks(Math.random() * w, Math.random() * h * .6, 6, ['255,220,120', '255,255,255', '60,200,120'][Math.random() * 3 | 0]);
    } },
  ];

  LIB.abba_farewell = [
    { d: 5.2, who: 'CMH Rawalpindi, 0410', cap: 'The monitors are very quiet. So is he.', grade: 'contrast(1.08) saturate(.8) sepia(.12)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.hospital(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(10,15,30,.45)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'abba', 'sad', { x: .62, crop: 'bust', hgt: .95, bottom: 1.08, light: '210,225,255', side: -1, talk: p > .3 && p < .8 });
    } },
    { d: 4.4, who: '', cap: 'You hold his hand and say nothing, because there is nothing big enough to say.', cam: [0, 1.06, 0, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
      S.hospital(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(10,15,30,.55)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'sad', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '210,225,255', side: 1 });
      tear(ctx, w * .5, h * .5, p);
    } },
  ];

  LIB.reveal = [
    { d: 5, who: 'Directorate, operations room', cap: 'Fourteen years of reports, pinned to one wall. Every red thread ends at the same photograph.', grade: 'contrast(1.12) saturate(.85)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#2a2116'; ctx.fillRect(0, 0, w, h * 1.2);
      const r = SCENES.helpers.srand(5); for (let i = 0; i < 26; i++) { const x = w * (.05 + r() * .9), y = h * (.12 + r() * .66); ctx.fillStyle = '#e8e0cc'; ctx.save(); ctx.translate(x, y); ctx.rotate((r() - .5) * .2); ctx.fillRect(-28, -20, 56, 40); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 4; k++) ctx.fillRect(-22, -12 + k * 7, 40, 2); ctx.restore(); ctx.strokeStyle = 'rgba(200,30,30,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(w * .5, h * .45); ctx.stroke(); }
      ctx.save(); ctx.translate(w * .5, h * .45); ctx.rotate(-.03); ctx.fillStyle = '#f1ead8'; ctx.fillRect(-h * .16, -h * .2, h * .32, h * .4); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(w * .5 - h * .14, h * .27, h * .28, h * .32); ctx.clip();
      portrait(ctx, w, h, t, 'khattak', 'angry', { x: .5, crop: 'face', hgt: .34, bottom: .6, over: { outfit: 'black', hat: 'wrap', wrapC: '#2a2420', beard: 'full', gray: .7 }, tint: 'rgba(120,90,50,.25)', light: '255,220,170' });
      ctx.restore();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(w * .5, h * .27, 6, 0, 7); ctx.fill();
      H.lamp(ctx, w * .5, h * .1, h * .7, t, '255,220,160', .2);
    } },
    { d: 4, who: 'Colonel (Retd) Jamshed Khattak', cap: 'The man who taught you how to hunt.', cam: [0, 1.0, 0, 1.18], grade: 'contrast(1.2) saturate(.7)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'khattak', 'angry', { x: .5, crop: 'face', hgt: 1.0, bottom: 1.04, over: { outfit: 'black', hat: 'wrap', wrapC: '#2a2420', beard: 'full', gray: .7 }, light: '255,200,140', side: -1, shade: .6 });
    } },
  ];

  LIB.interview = [
    { d: 4.6, who: 'The Prime Minister\'s House', cap: '"One question, General. And I want an honest answer."', grade: 'contrast(1.06) saturate(.95)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'pm', 'neutral', { x: .62, crop: 'bust', hgt: .95, bottom: 1.1, talk: true, light: '255,230,190', side: -1 });
    } },
    { d: 3.6, who: '', cap: 'Forty years of service, and it comes down to one sentence.', cam: [0, 1.06, 0, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .4, crop: 'face', hgt: 1.0, bottom: 1.06, light: '255,230,190' });
    } },
  ];

  LIB.letter = [
    { d: 5.2, who: 'Battalion headquarters, 0200', cap: '"Respected mother, it is my duty and my honour to tell you about your son..."', grade: 'contrast(1.1) saturate(.85) sepia(.2)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, w, h * 1.2);
      H.lamp(ctx, w * .7, h * .55, h * .7, t, '255,200,120', .3);
      portrait(ctx, w, h, t, 'hero', 'sad', { x: .4, crop: 'bust', hgt: .95, bottom: 1.08, light: '255,200,130', side: 1, shade: .55 });
      ctx.fillStyle = '#eee6d2'; ctx.save(); ctx.translate(w * .72, h * .78); ctx.rotate(-.08); ctx.fillRect(-h * .14, -h * .1, h * .28, h * .2); ctx.fillStyle = 'rgba(30,30,60,.7)'; const lines = Math.floor(p * 8); for (let i = 0; i < lines; i++) ctx.fillRect(-h * .12, -h * .08 + i * h * .022, h * (.2 + (i % 3) * .02), 1.5); ctx.restore();
    } },
  ];

  // close-ups added to existing cinematics
  LIB.prologue.splice(2, 0, { d: 4.2, who: 'The Chief of the Army Staff', cap: 'Your own face, forty years older. You already know what you will say. Do you?', grade: 'contrast(1.15) saturate(.8)', cam: [0, 1.0, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
    S.office(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,10,.55)'; ctx.fillRect(0, 0, w, h * 1.2);
    ctx.fillStyle = `rgba(200,30,30,${.12 + .08 * Math.sin(t * 6)})`; ctx.fillRect(0, 0, w, h * 1.2);
    portrait(ctx, w, h, t, 'hero', 'determined', { x: .5, crop: 'face', hgt: 1.0, bottom: 1.05, over: { outfit: 'dress', rank: 11, hat: 'gencap', age: 57, gray: .85, glasses: true, moustache: true, medals: ['#c9a227', '#b3201e', '#5b1f24', '#e2ae48', '#3b7fd0', '#2aa34f'] }, light: '140,190,255', side: -1, shade: .55 });
  } });
  LIB.duel.splice(1, 1,
    { d: 3.6, who: 'Shikari', cap: '"I taught you everything you know, cadet."', grade: 'contrast(1.2) saturate(.6)', cam: [0, 1.02, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.dam(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,10,.45)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'khattak', 'angry', { x: .58, crop: 'face', hgt: 1.0, bottom: 1.05, over: { outfit: 'black', hat: 'wrap', wrapC: '#1a1714', beard: 'full', gray: .7 }, light: '190,210,255', side: -1, shade: .6, talk: true });
      rainOver(ctx, w, h, st, dt);
    } },
    { d: 3.2, who: 'You', cap: '"Did you think I would not save something for myself?"', grade: 'contrast(1.2) saturate(.6)', cam: [0, 1.02, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.dam(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,10,.45)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .42, crop: 'face', hgt: 1.0, bottom: 1.05, light: '190,210,255', side: 1, shade: .6, over: { hat: 'helmet' } });
      rainOver(ctx, w, h, st, dt);
    } });
  LIB.wedding.push({ d: 4.6, who: 'The couple', cap: 'For one night, nobody mentions the army at all.', cam: [0, 1.02, 0, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
    S.wedding(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, w, h * 1.2);
    portrait(ctx, w, h, t, 'hero', 'happy', { x: .38, crop: 'waist', hgt: 1.05, bottom: 1.12, over: { outfit: 'sherwani', hat: 'kulla' }, light: '255,200,140' });
    portrait(ctx, w, h, t, 'ayesha', 'happy', { x: .64, crop: 'waist', hgt: 1.0, bottom: 1.12, over: { outfit: 'female', color: '#a01828', dupatta: '#e0b040', hat: 'hijab', hijabC: '#b01e30' }, light: '255,200,140', side: -1 });
    if (Math.random() < .2) fx.sparks(Math.random() * w, Math.random() * h * .4, 10, '255,210,120');
  } });
  LIB.bilal_video.splice(1, 0, { d: 3.6, who: 'Proof of life', cap: 'His eyes find the camera. He is trying to tell you something.', grade: 'contrast(1.3) saturate(.5)', draw(ctx, w, h, p, t, dt, fx, st) {
    ctx.fillStyle = '#0b0b0a'; ctx.fillRect(0, 0, w, h * 1.2); H.lamp(ctx, w / 2, h * .2, h * .7, t, '255,230,180', .5);
    portrait(ctx, w, h, t, 'bilal', 'sad', { x: .5 + Math.sin(t * 13) * .004, crop: 'face', hgt: 1.0, bottom: 1.06, over: { outfit: 'kurta', color: '#6a6458', hat: 'none', beard: 'stubble' }, light: '255,230,180', shade: .5 });
    for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * .2})`; ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 30, 1.2); }
  } });
  LIB.coas.splice(1, 0, { d: 4.2, who: () => (window.GAME && GAME.S ? 'General ' + GAME.S.name : 'The Chief'), cap: 'A havildar\'s son from a soldiers\' village, wearing four stars.', cam: [0, 1.0, 0, 1.07], draw(ctx, w, h, p, t, dt, fx, st) {
    S.parade(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, 0, w, h * 1.2);
    portrait(ctx, w, h, t, 'hero', 'happy', { x: .45, crop: 'bust', hgt: 1.0, bottom: 1.1, salute: true, light: '255,240,210' });
    H.flare(ctx, w * .82, h * .12, 70, t);
  } });
  LIB.un.splice(1, 0, { d: 3.6, who: 'Commander Dube', cap: '"Fifty thousand dollars, Pakistani. Who would know?"', grade: 'contrast(1.12) sepia(.2)', draw(ctx, w, h, p, t, dt, fx, st) {
    S.camp(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, w, h * 1.2);
    portrait(ctx, w, h, t, 'militia', 'angry', { x: .6, crop: 'bust', hgt: .95, bottom: 1.08, talk: true, light: '255,170,90', side: -1 });
  } });
  LIB.epilogue.splice(4, 0, { d: 4.2, who: '', cap: 'He smiles, and goes home.', grade: 'sepia(.2) contrast(1.05)', cam: [0, 1.0, 0, 1.06], draw(ctx, w, h, p, t, dt, fx, st) {
    S.village(ctx, w, h, t, st, dt);
    portrait(ctx, w, h, t, 'hero', 'happy', { x: .45, crop: 'bust', hgt: 1.0, bottom: 1.1, over: { outfit: 'kurta', color: '#efece2', hat: 'none', age: 60, gray: .9, glasses: true }, light: '255,200,140' });
  } });
  LIB.sherkhan = [
    { d: 4.4, who: 'Havildar Sher Khan', cap: '"Three young lieutenants before you, Sahib. Two were good. One cried a lot."', grade: 'contrast(1.08) saturate(.85)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.snowpost(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'sherkhan', 'happy', { x: .6, crop: 'bust', hgt: .95, bottom: 1.08, talk: true, over: { hat: 'helmet' }, light: '230,240,255', side: -1 });
      H.snow(ctx, w, h, st, dt, 120, 60);
    } },
  ];

  // ---------- story cinematics (round 3) ----------
  function scratches(ctx, w, h, t) {
    ctx.fillStyle = 'rgba(255,240,200,.05)'; ctx.fillRect(0, 0, w, h * 1.2);
    for (let i = 0; i < 4; i++) if (Math.random() < .5) { ctx.fillStyle = `rgba(255,255,240,${Math.random() * .25})`; ctx.fillRect(Math.random() * w, 0, 1, h * 1.2); }
    for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }
  function phoneGlow(ctx, x, y, s, t, label) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
    ctx.fillStyle = '#0c0c0e'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-s * .3, -s * .55, s * .6, s * 1.1, s * .06) : ctx.rect(-s * .3, -s * .55, s * .6, s * 1.1); ctx.fill();
    const g = ctx.createLinearGradient(0, -s * .5, 0, s * .5); g.addColorStop(0, '#1d3a5a'); g.addColorStop(1, '#0d1a2a'); ctx.fillStyle = g; ctx.fillRect(-s * .27, -s * .5, s * .54, s);
    ctx.fillStyle = '#e8f0ff'; ctx.font = `${s * .08}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'center'; ctx.fillText(label, 0, -s * .2);
    ctx.font = `${s * .05}px "Share Tech Mono", monospace`; ctx.fillText('INCOMING CALL', 0, -s * .1);
    const pulse = .5 + .5 * Math.sin(t * 6); ctx.fillStyle = `rgba(40,200,90,${.6 + pulse * .4})`; ctx.beginPath(); ctx.arc(-s * .12, s * .32, s * .07, 0, 7); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(s * .12, s * .32, s * .07, 0, 7); ctx.fill();
    ctx.textAlign = 'left'; ctx.restore();
    H.lamp(ctx, x, y, s * 2.4, t, '120,170,255', 0);
  }
  const SHIKARI_LOOK = { outfit: 'black', hat: 'wrap', wrapC: '#1a1714', beard: 'full', gray: .75 };

  LIB.compass_gift = [
    { d: 4.8, who: 'The night before Kakul', cap: '"Twenty-two years this compass pointed me home. Now it points you."', grade: 'contrast(1.06) sepia(.12)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'abba', 'happy', { x: .6, crop: 'bust', hgt: .95, bottom: 1.1, talk: p < .75, light: '255,190,110', side: -1 });
    } },
    { d: 3.8, who: '', cap: 'Brass, scratched, the glass cracked in one corner. The needle still true.', cam: [0, 1.0, 0, 1.15], draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, w, h * 1.2); H.lamp(ctx, w * .5, h * .3, h * .9, t, '255,180,100', .6);
      ctx.fillStyle = '#a8754e'; ctx.beginPath(); ctx.ellipse(w * .5, h * .78, h * .36, h * .16, 0, 0, 7); ctx.fill();
      compass(ctx, w * .5, h * .58, h * .2, t);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w * .5 + h * .08, h * .45); ctx.lineTo(w * .5 + h * .16, h * .52); ctx.stroke();
    } },
    { d: 3.6, who: '', cap: 'You will carry it for the next forty years.', cam: [0, 1.04, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '255,190,110' });
    } },
  ];

  LIB.glacier_1999 = [
    { d: 5, who: 'Siachen, 1999', cap: 'A blizzard at twenty thousand feet. A young sepoy named Sher Khan, a bullet in his leg.', grade: 'sepia(.85) contrast(1.25) brightness(.9)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.snowpost(ctx, w, h, t, st, dt); H.snow(ctx, w, h, st, dt, 260, 140); scratches(ctx, w, h, t);
      FIG.draw(ctx, w * .55, h * .9, h * .3, P.down, { color: '#3f4a2b', helmet: '#d8dde0' });
      FIG.draw(ctx, w * (.2 + p * .25), h * .9, h * .34, FIG.lerp(P.run1, P.run2, (Math.sin(t * 6) + 1) / 2), { color: '#3f4a2b', helmet: '#d8dde0', rifle: true });
    } },
    { d: 5.2, who: '', cap: 'A havildar carried him down eleven kilometres of ice. The name on that havildar\'s chest was your father\'s.', grade: 'sepia(.85) contrast(1.25) brightness(.9)', cam: [-.3, 1.08, .3, 1.16], draw(ctx, w, h, p, t, dt, fx, st) {
      S.snowpost(ctx, w, h, t, st, dt); H.snow(ctx, w, h, st, dt, 300, 160); scratches(ctx, w, h, t);
      const x = w * (.3 + p * .3), y = h * .86, k = (Math.sin(t * 3) + 1) / 2;
      FIG.draw(ctx, x, y, h * .4, FIG.lerp(Object.assign({}, P.march1, { torso: 22, ua1: 150, la1: -30 }), Object.assign({}, P.march2, { torso: 22, ua1: 150, la1: -30 }), k), { color: '#3f4a2b', helmet: '#d8dde0' });
      FIG.draw(ctx, x + h * .02, y - h * .4, h * .3, Object.assign({}, P.down, { ua1: -10, la1: 30, ua2: -30, la2: 20, th1: 70, sh1: -40, th2: 80, sh2: -30 }), { color: '#4a5634', shadow: false, facing: -1 });
    } },
    { d: 4.6, who: 'Havildar Sher Khan', cap: '"Your father, Sahib. Every breath I have taken since that night, I owe to him."', grade: 'contrast(1.08)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.barracks(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'sherkhan', 'sad', { x: .6, crop: 'bust', hgt: .95, bottom: 1.1, talk: true, light: '255,150,70', side: -1, over: { hat: 'beret' } });
    } },
  ];

  LIB.overheard = [
    { d: 4.8, who: 'Cherat, 0130', cap: '"...the Consortium\'s money is not the point. The point is that they listen to me."', grade: 'contrast(1.2) saturate(.6) brightness(.85)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.cherat(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,5,20,.72)'; ctx.fillRect(0, 0, w, h * 1.2); H.stars(ctx, w, h * .6, 80, 7, t);
      FIG.draw(ctx, w * .66, h * .9, h * .36, Object.assign({}, P.stand, { ua1: 150, la1: 40 }), { color: '#0a0a0a', beret: '#3a0a12' });
      H.lamp(ctx, w * .66 + h * .02, h * .9 - h * .32, h * .1, t, '120,170,255', 0);
      FIG.car(ctx, w * .82, h * .9, h * .08, '#141412', false, -1);
    } },
    { d: 3.8, who: '', cap: 'Major Khattak. Your instructor. You stand very still in the dark.', cam: [0, 1.05, 0, 1.12], grade: 'contrast(1.25) saturate(.6)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#04060a'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'surprised', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '140,170,255', side: 1, shade: .7 });
    } },
  ];

  LIB.nadia_end = [
    { d: 4.8, who: 'Nadia', cap: '"If anything happens, tell my mother I was a schoolteacher. She always wanted that."', grade: 'contrast(1.12) saturate(.85)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.street(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'nadia', 'sad', { x: .6, crop: 'bust', hgt: .95, bottom: 1.1, talk: true, light: '255,120,160', side: -1 });
    } },
    { d: 4.8, who: '', cap: 'You get there four minutes too late.', grade: 'contrast(1.25) saturate(.45)', cam: [.3, 1.05, -.2, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
      S.street(ctx, w, h, t * .4, st, dt * .4);
      H.lamp(ctx, w * .5, h * .8, h * .5, t, '255,200,140', .3);
      FIG.draw(ctx, w * .5, h * .94, h * .32, P.down, { color: '#6a4a8a', skin: '#d6a47c', rim: 'rgba(255,200,150,.6)' });
      const ux = w * (.58 + p * .2), uy = h * .9; ctx.save(); ctx.translate(ux, uy); ctx.rotate(p * 4); ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(0, 0, h * .07, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, h * .07); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(255,40,40,.7)'; ctx.fillRect(w * (.85 + p * .3), h * .8, 12, 5);
    } },
    { d: 4, who: '', cap: 'Kamran\'s men. This was a message. It was meant for you.', grade: 'contrast(1.2) saturate(.5)', cam: [0, 1.04, 0, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
      S.street(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'angry', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '255,90,120', over: { outfit: 'suit', hat: 'none' } });
      H.rain(ctx, w, h, st, dt, 200);
    } },
  ];
  LIB.nadia_saved = [
    { d: 4.6, who: 'Jinnah International, 0610', cap: 'Two days later she boards a flight to Toronto with a new name.', grade: 'contrast(1.05) saturate(1.05) sepia(.1)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.karachi(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(255,170,90,.18)'; ctx.fillRect(0, 0, w, h * 1.2);
      FIG.plane(ctx, w * (-.1 + p * 1.2), h * (.35 - p * .2), h * .1, '#d8dce0');
      portrait(ctx, w, h, t, 'nadia', 'happy', { x: .6, crop: 'bust', hgt: .9, bottom: 1.1, light: '255,200,140', side: -1 });
    } },
    { d: 3.4, who: '', cap: 'At the gate she turns and mouths two words: thank you.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.karachi(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(255,170,90,.2)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'happy', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '255,200,140', over: { outfit: 'suit', hat: 'none' } });
    } },
  ];

  LIB.rival = [
    { d: 5, who: 'Major Danish Mirza', cap: '"My father commands a corps. Yours was a havildar, I hear? How very... inspiring."', grade: 'contrast(1.06) saturate(1.05)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.quetta(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'danish', 'happy', { x: .6, crop: 'bust', hgt: .95, bottom: 1.1, talk: true, light: '255,240,210', side: -1 });
    } },
    { d: 3.4, who: '', cap: 'He smiles like a man who has never once been told no.', cam: [0, 1.04, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.quetta(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '255,240,210' });
    } },
  ];

  LIB.birth = [
    { d: 5, who: 'CMH Rawalpindi', cap: 'A very small, very loud person. Ayesha says he has your nose, and apologises for it.', grade: 'contrast(1.04) saturate(1.05)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.hospital(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'ayesha', 'happy', { x: .58, crop: 'bust', hgt: .95, bottom: 1.1, talk: p > .4, light: '255,250,235', side: -1, over: { outfit: 'female', color: '#9fb8c8', dupatta: null } });
      ctx.save(); ctx.translate(w * .58, h * .8); ctx.rotate(-.18);
      const g = ctx.createLinearGradient(0, -h * .07, 0, h * .07); g.addColorStop(0, '#fdfbf6'); g.addColorStop(1, '#cfd8e2'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-h * .15, -h * .02); ctx.quadraticCurveTo(-h * .14, -h * .08, -h * .05, -h * .075); ctx.quadraticCurveTo(h * .12, -h * .07, h * .15, 0); ctx.quadraticCurveTo(h * .12, h * .07, -h * .02, h * .07); ctx.quadraticCurveTo(-h * .15, h * .06, -h * .15, -h * .02); ctx.fill();
      ctx.strokeStyle = 'rgba(120,140,160,.35)'; ctx.lineWidth = 1.5; [[-.02, .06], [.04, .05], [.09, .03]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(h * a, -h * b); ctx.quadraticCurveTo(h * (a + .02), 0, h * a, h * b); ctx.stroke(); });
      const fg = ctx.createRadialGradient(-h * .085, -h * .01, 1, -h * .08, 0, h * .042); fg.addColorStop(0, '#f2c4a2'); fg.addColorStop(1, '#d9a07c'); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(-h * .08, 0, h * .038, 0, 7); ctx.fill();
      ctx.strokeStyle = '#6a3a2a'; ctx.lineWidth = 1.2; [-.095, -.07].forEach(ex => { ctx.beginPath(); ctx.arc(h * ex, -h * .006, h * .007, .2, Math.PI - .2); ctx.stroke(); });
      ctx.fillStyle = '#d0706a'; ctx.beginPath(); ctx.arc(-h * .082, h * .016, h * .005, 0, 7); ctx.fill();
      ctx.fillStyle = '#fdfbf6'; ctx.beginPath(); ctx.arc(-h * .08, -h * .025, h * .045, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      ctx.restore();
      H.godRays(ctx, w * .9, 0, w, h, t, '255,250,235', 8, .05);
    } },
    { d: 3.6, who: '', cap: 'You have faced gunmen, avalanches and Senior Fawad. Nothing has ever frightened you like this.', cam: [0, 1.04, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.hospital(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'hero', 'happy', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '255,250,235' });
      tear(ctx, w * .5, h * .48, p);
    } },
  ];

  LIB.shikari_call = [
    { d: 3.8, who: '0247 hours', cap: 'UNKNOWN NUMBER.', grade: 'contrast(1.2) saturate(.7)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,0,10,.75)'; ctx.fillRect(0, 0, w, h * 1.2);
      phoneGlow(ctx, w * .5, h * .55, h * .5, t, 'UNKNOWN');
      if (!st.r || t - st.r > .8) { st.r = t; SFX.beep(); }
    } },
    { d: 4.4, who: 'Shikari', cap: '"Still awake, General? So am I. Old soldiers never sleep. They only wait."', grade: 'contrast(1.3) saturate(.5)', cam: [0, 1.04, 0, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#020204'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'khattak', 'angry', { x: .55, crop: 'face', hgt: 1.0, bottom: 1.06, over: SHIKARI_LOOK, light: '255,120,80', side: -1, shade: .75, talk: true });
    } },
    { d: 3.6, who: '', cap: 'Your phone screen is the only light in the house.', grade: 'contrast(1.2) saturate(.6)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#020306'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '120,170,255', side: 1, shade: .7, tint: 'rgba(40,80,160,.2)', over: { outfit: 'kurta', hat: 'none' } });
    } },
  ];

  LIB.trial = [
    { d: 4.6, who: 'Special Court, Rawalpindi', cap: 'He refuses a lawyer. He refuses to stand. He looks at nobody but you.', grade: 'contrast(1.1) saturate(.8) sepia(.15)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(30,20,10,.45)'; ctx.fillRect(0, 0, w, h * 1.2);
      portrait(ctx, w, h, t, 'khattak', 'neutral', { x: .6, crop: 'bust', hgt: .95, bottom: 1.1, over: Object.assign({}, SHIKARI_LOOK, { outfit: 'kurta', color: '#8a8478', hat: 'none' }), light: '255,220,170', side: -1 });
    } },
    { d: 5.2, who: 'Jamshed Khattak', cap: '"Tell the cadets I was a good soldier once. Then tell them exactly when it stopped mattering to me. That is the lesson."', grade: 'contrast(1.15) saturate(.7)', cam: [0, 1.04, 0, 1.12], draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0c0906'; ctx.fillRect(0, 0, w, h * 1.2); H.lamp(ctx, w * .55, h * .2, h * .8, t, '255,220,170', .2);
      portrait(ctx, w, h, t, 'khattak', 'sad', { x: .55, crop: 'face', hgt: 1.0, bottom: 1.06, over: Object.assign({}, SHIKARI_LOOK, { outfit: 'kurta', color: '#8a8478', hat: 'none' }), light: '255,220,170', side: -1, talk: true });
    } },
  ];

  LIB.eid = [
    { d: 5, who: 'Eid ul-Fitr', cap: 'Ammi insists on cooking everything herself. Nobody is allowed in the kitchen. Everybody goes in anyway.', grade: 'contrast(1.05) saturate(1.12) sepia(.08)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'ammi', 'happy', { x: .62, crop: 'bust', hgt: .92, bottom: 1.1, talk: true, light: '255,200,140', side: -1 });
      for (let i = 0; i < 3; i++) if (Math.random() < .1) fx.sparks(Math.random() * w, Math.random() * h * .4, 8, '255,220,140');
    } },
    { d: 3.8, who: '', cap: 'She is smaller than you remember. She still fixes your collar.', cam: [0, 1.04, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'hero', 'happy', { x: .45, crop: 'bust', hgt: 1.0, bottom: 1.1, light: '255,200,140', over: { outfit: 'kurta', color: '#efece2', hat: 'none' } });
    } },
  ];

  LIB.son_parade = [
    { d: 4.6, who: 'Pakistan Military Academy, Kakul', cap: 'Six hundred cadets. You are looking for only one of them.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.pma(ctx, w, h, t, st, dt); for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) FIG.draw(ctx, ((i * w * .12 + p * w * .2 + r * 20) % (w * 1.2)) - w * .05, h * (.74 + r * .08), h * (.16 + r * .04), marchPose(t), { color: '#a69468', rifle: true, beret: '#1a1a1a' });
    } },
    { d: 4.8, who: () => (window.GAME && GAME.S && GAME.S.kids[0] ? 'Second Lieutenant ' + GAME.S.kids[0].name : 'Your son'), cap: 'In his breast pocket, a brass compass with a cracked glass.', cam: [0, 1.02, 0, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
      S.pma(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'son', 'determined', { x: .55, crop: 'bust', hgt: 1.0, bottom: 1.1, salute: p > .3, light: '255,245,225', over: { outfit: 'combat', rank: 2, hat: 'beret', beretC: '#1f2a1c', age: 21, moustache: false } });
      H.flare(ctx, w * .85, h * .1, 60, t);
    } },
    { d: 3.8, who: '', cap: 'Somewhere a havildar who carried a sepoy off a glacier would be laughing at the three of you.', cam: [0, 1.04, 0, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.pma(ctx, w, h, t, st, dt);
      portrait(ctx, w, h, t, 'hero', 'happy', { x: .45, crop: 'face', hgt: 1.0, bottom: 1.06, light: '255,245,225' });
      tear(ctx, w * .5, h * .48, p);
    } },
  ];
  // ---------- player ----------
  let running = null;
  function play(name) {
    const shots = LIB[name];
    if (!shots) return Promise.resolve();
    const el = document.getElementById('cut'), cv = document.getElementById('cutCanvas'), cap = document.getElementById('cutCaption');
    const ctx = cv.getContext('2d');
    el.hidden = false;
    const fx = FIG.Fx();
    return new Promise(resolve => {
      let i = 0, start = performance.now(), last = start, st = {}, done = false;
      const tension = /ambush|raid|chase|rooftop|duel|stadium|nvg|bilal|avalanche|un|earthquake|kidnap|coup|tv_station|bus|port|sniper|school_fight|hellweek/.test(name);
      const baseGrade = tension ? 'contrast(1.12) saturate(.88)' : 'contrast(1.06) saturate(1.06)';
      const baseRim = tension ? 'rgba(255,190,140,.42)' : 'rgba(255,238,210,.3)';
      const moodOf = /wedding|eid|sister_wedding/.test(name) ? 'wedding' : /janaza|abba_farewell|letter|daughter|exile|ammi|nadia_end|old_woman|last_drive|envelope|son_photo/.test(name) ? 'sad'
        : /ml_president|ml_handover|promotion|coas|passing_out|battalion|flag_car|^ops_win|abroad/.test(name) ? 'proud' : /results_day|second_chance|kakul_return|valley_school|cmh_rush/.test(name) ? 'calm' : (tension || /^ml_|^ops_|__opm|malik|board|old_file|night_car|post_night|tank_column|gunship|c130/.test(name)) ? 'tense' : 'proud';
      SFX.pad(moodOf);
      function setCap() { const s = shots[i]; const tx = v => typeof v === 'function' ? v() : (window.GAME && GAME.S ? GAME.interp(v || '') : (v || '')); cap.innerHTML = (s.who ? `<span class="who">${tx(s.who)}</span>` : '') + tx(s.cap); cap.style.animation = 'none'; void cap.offsetWidth; cap.style.animation = 'capIn .6s both'; }
      setCap();
      function finish() { if (done) return; done = true; cancelAnimationFrame(running); delete FIG.style.rim; delete FIG.style.rimSide; cv.style.filter = ''; SFX.stopPad(); el.hidden = true; cap.textContent = ''; document.getElementById('btnSkip').onclick = null; resolve(); }
      document.getElementById('btnSkip').onclick = finish;
      function frame(now) {
        if (done) return;
        const r = cv.getBoundingClientRect(), d = PERF.dpr();
        if (cv.width !== (r.width * d | 0)) { cv.width = r.width * d | 0; cv.height = r.height * d | 0; }
        const w = cv.width / d, h = cv.height / d, dt = Math.min(.05, (now - last) / 1000); PERF.frame((now - last) / 1000); last = now;
        const s = shots[i], el2 = (now - start) / 1000, p = Math.min(1, el2 / s.d);
        // frame the action between the letterbox bars: lift the picture so ground-level action clears the bottom bar
        const sk = fx.shake > 0 ? fx.shake * 9 : 0; fx.shake = Math.max(0, fx.shake - dt * 2.2);
        ctx.setTransform(d, 0, 0, d, (Math.random() - .5) * sk * d, -h * .095 * d + (Math.random() - .5) * sk * d);
        // slow cinematic camera move on every shot unless the shot sets its own
        const cm = s.cam || [(i % 2 ? .5 : -.5), 1.04, (i % 2 ? -.5 : .5), 1.11];
        if (!st._own) st.cam = { x: cm[0] + (cm[2] - cm[0]) * p, z: cm[1] + (cm[3] - cm[1]) * p, y: 0 };
        const grade = s.grade || baseGrade;
        if (cv.style.filter !== grade) cv.style.filter = grade;
        FIG.style.rim = s.rim || baseRim; FIG.style.rimSide = i % 2 ? -1 : 1;
        try { s.draw(ctx, w, h, p, el2, dt, fx, st); } catch (e) { console.error(e); }
        if (s.flash && el2 < .25) { ctx.fillStyle = `rgba(255,255,255,${1 - el2 / .25})`; ctx.fillRect(0, 0, w, h); }
        fx.update(ctx, dt);
        SCENES.bloom(ctx, cv, s.bloom ?? (tension ? .42 : .32));
        const fade = Math.min(1, el2 / .35, (s.d - el2) / .35);
        if (fade < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - Math.max(0, fade)})`; ctx.fillRect(0, 0, w, h * 1.2); }
        if (el2 >= s.d) { i++; st = {}; fx.clear(); if (i >= shots.length) return finish(); start = now; setCap(); }
        running = requestAnimationFrame(frame);
      }
      running = requestAnimationFrame(frame);
    });
  }
  return { play, LIB, seqPose, portrait };
})();

// make the module reachable as window.X too (top-level const is not a window property)
 window.CUT = CUT;
