// Round six cutscenes: one for every life-story chapter that had none, and a short cinematic intro
// for each Operations mission type (built per mission, so the theatre's scenery is used).
(() => {
  const S = SCENES.S, H = SCENES.helpers, P = FIG.P, L = CUT.LIB, portrait = CUT.portrait;
  const runPose = (t, sp = 10) => FIG.lerp(P.run1, P.run2, (Math.sin(t * sp) + 1) / 2);
  const marchPose = (t, sp = 4) => FIG.lerp(P.march1, P.march2, (Math.sin(t * sp) + 1) / 2);
  const dark = (ctx, w, h, a, c = '0,0,0') => { ctx.fillStyle = `rgba(${c},${a})`; ctx.fillRect(0, -h * .2, w, h * 1.4); };
  const big = (ctx, w, txt, y, size, color = '#efe9d6', x = w / 2) => { ctx.fillStyle = color; ctx.font = `${size}px "Saira Stencil One", Impact, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(txt, x, y); ctx.textAlign = 'left'; };
  const soldier = { color: '#4c5634', beret: '#1f2a1c', skin: '#a8754e' };
  function paper(ctx, x, y, pw, ph, rot, k, ink = 'rgba(30,30,60,.7)', col = '#eee6d2') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-pw / 2 + 5, -ph / 2 + 6, pw, ph);
    ctx.fillStyle = col; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.fillStyle = ink; const n = Math.floor(k * 12); for (let i = 0; i < n; i++) ctx.fillRect(-pw * .4, -ph * .4 + i * ph * .065, pw * (.62 + (i * 7 % 5) * .05), 1.6);
    ctx.restore();
  }
  function headline(ctx, x, y, s, rot, title, sub) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(-s * .5 + 8, -s * .32 + 8, s, s * .64);
    ctx.fillStyle = '#ece6d6'; ctx.fillRect(-s * .5, -s * .32, s, s * .64);
    ctx.fillStyle = '#1a1a1a'; ctx.font = `${s * .06}px "Saira Stencil One", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('THE DAILY DISPATCH', 0, -s * .23);
    ctx.fillRect(-s * .45, -s * .2, s * .9, 2);
    ctx.font = `${s * .075}px "Barlow Condensed", sans-serif`; ctx.fillText(title, 0, -s * .1);
    ctx.font = `${s * .04}px "Barlow", sans-serif`; ctx.fillStyle = '#444'; ctx.fillText(sub, 0, -s * .03);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; for (let i = 0; i < 9; i++) ctx.fillRect(-s * .45 + (i % 3) * s * .31, s * .03 + Math.floor(i / 3) * s * .07, s * .27, 2);
    ctx.textAlign = 'left'; ctx.restore();
  }
  function rainOver(ctx, w, h, t, a = .35) {
    ctx.strokeStyle = `rgba(180,200,220,${a})`; ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) { const x = (i * 97.7 % w + t * 60) % w, y = ((i * 53.1 + t * 900) % (h * 1.3)) - h * .2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 16); ctx.stroke(); }
  }

  // ------------------------------------------------------------------ life story
  L.results_day = [
    { d: 4, who: 'Results day', cap: 'The matric results are pinned on the school gate. Your name is near the top.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t, st, dt);
      FIG.draw(ctx, w * (.1 + p * .55), h * .88, h * .3, runPose(t, 12), { color: '#efece4', skin: '#c38c60' });
      paper(ctx, w * (.14 + p * .55), h * (.62 + Math.sin(t * 12) * .01), h * .06, h * .08, Math.sin(t * 9) * .3, 1);
      if (p > .7 && Math.random() < .3) fx.sparks(w * .7, h * .6, 3, '255,220,120');
    } },
    { d: 5, who: 'Two roads', cap: 'Chacha Rafiq has a job in Dubai. Abba has a photograph of himself in uniform. Both are looking at you.', cam: [0, 1.0, 0, 1.06], draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); dark(ctx, w, h, .3);
      FIG.plane(ctx, w * (.05 + p * .4), h * .2, h * .05, 'rgba(230,230,230,.6)');
      portrait(ctx, w, h, t, 'chacha', 'happy', { x: .24, crop: 'bust', hgt: .95, bottom: 1.1, light: '255,220,170', side: 1, talk: p < .5 });
      portrait(ctx, w, h, t, 'abba', 'neutral', { x: .76, crop: 'bust', hgt: .95, bottom: 1.1, light: '255,200,140', side: -1, flip: true, talk: p >= .5 });
    } },
  ];
  L.second_chance = [
    { d: 4.2, who: 'One more year', cap: 'Every morning before the azaan: five kilometres on the canal road.', grade: 'contrast(1.1) saturate(1.1)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t * .5, st, dt); dark(ctx, w, h, .35 - p * .3, '20,30,60');
      FIG.draw(ctx, w * (.15 + p * .7), h * .88, h * .28, runPose(t, 11), { color: '#3a4a6a', skin: '#c38c60' });
    } },
    { d: 4, who: 'Every evening', cap: 'The editorials, a dictionary, and a notebook full of words like "ameliorate".', draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); dark(ctx, w, h, .45);
      H.lamp(ctx, w * .62, h * .5, h * .6, t, '255,200,120', .4);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .38, crop: 'bust', hgt: .9, bottom: 1.1, light: '255,200,130', side: 1, over: { outfit: 'student', hat: 'none' } });
      paper(ctx, w * .72, h * .8, h * .3, h * .2, -.06, Math.min(1, p * 1.5));
    } },
    { d: 3.4, who: 'Kohat', cap: 'The second call letter. The same bus, the same pass. A different boy on it.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.issb(ctx, w, h, t, st, dt);
      const bx = w * (-.25 + p * .8); ctx.fillStyle = '#c9542c'; ctx.fillRect(bx, h * .7, w * .22, h * .1); ctx.fillStyle = '#e8c34a'; ctx.fillRect(bx, h * .73, w * .22, h * .012);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(160,200,220,.7)'; ctx.fillRect(bx + 8 + i * w * .034, h * .71, w * .025, h * .025); }
      ctx.fillStyle = '#111'; [bx + w * .04, bx + w * .18].forEach(x => { ctx.beginPath(); ctx.arc(x, h * .8, h * .02, 0, 7); ctx.fill(); });
      H.smoke(ctx, st, 'sm_bus', bx - 4, h * .78, dt, '160,150,130', 5, .8);
    } },
  ];
  L.cmh_rush = [
    { d: 3.8, who: 'GT Road, 0100 hours', cap: 'Zainab\'s voice on the phone. "Bhai, Abba fell in the fields."', grade: 'contrast(1.15) saturate(.8)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.road_night(ctx, w, h, t, st, dt);
      FIG.car(ctx, w * (-.1 + p * 1.1), h * .86, h * .1, '#2a2f3a', true, 1);
      for (let i = 0; i < 6; i++) { const x = ((i * .21 - t * .9) % 1 + 1) % 1 * w; ctx.fillStyle = 'rgba(255,220,150,.5)'; ctx.fillRect(x, h * .9, w * .05, 2); }
    } },
    { d: 4.4, who: 'CMH Rawalpindi', cap: 'A cardiac ward that smells of Dettol, and a doctor who does not look up from the chart.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.hospital(ctx, w, h, t, st, dt); dark(ctx, w, h, .2);
      portrait(ctx, w, h, t, 'ayesha', 'neutral', { x: .64, crop: 'bust', hgt: .95, bottom: 1.1, light: '220,235,255', side: -1 });
      portrait(ctx, w, h, t, 'hero', 'sad', { x: .24, crop: 'bust', hgt: .85, bottom: 1.12, flip: true, alpha: .95 });
    } },
  ];
  L.kakul_return = [
    { d: 4.4, who: 'PMA Kakul, again', cap: 'The gravel square looks smaller than you remember. The shouting sounds exactly the same.', cam: [-.4, 1.02, .4, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.pma(ctx, w, h, t, st, dt);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) FIG.draw(ctx, w * (.05 + ((i * .12 + p * .25 + r * .06) % 1)), h * (.74 + r * .05), h * (.13 + r * .02), marchPose(t + i * .2, 5), { color: '#8f7f52', cap: '#a99a6c', simple: true });
    } },
    { d: 4, who: 'Instructor', cap: 'Twenty years ago you stood here shaking. Now a boy is shaking in front of you.', cam: [0, 1.0, 0, 1.06], draw(ctx, w, h, p, t, dt, fx, st) {
      S.pma(ctx, w, h, t, st, dt); dark(ctx, w, h, .25);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .3, crop: 'bust', hgt: .95, bottom: 1.1, light: '255,230,190', side: 1 });
      FIG.draw(ctx, w * .72, h * .92, h * .5, P.stand, { color: '#8f7f52', cap: '#a99a6c', skin: '#c99468', facing: -1 });
    } },
  ];
  L.concrete = [
    { d: 4.2, who: 'The new hospital', cap: 'Grey pillars rising in the cantonment. Somebody has thinned the concrete.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.barracks(ctx, w, h, t, st, dt);
      for (let i = 0; i < 6; i++) { const x = w * (.12 + i * .15), top = h * (.4 + (i % 2) * .08); const g = ctx.createLinearGradient(x, 0, x + w * .04, 0); g.addColorStop(0, '#9a9690'); g.addColorStop(1, '#5e5a54'); ctx.fillStyle = g; ctx.fillRect(x, top, w * .04, h * .88 - top); for (let k = 0; k < 4; k++) { ctx.strokeStyle = '#3a3a36'; ctx.beginPath(); ctx.moveTo(x + w * .01, top - k * 8); ctx.lineTo(x + w * .01, top - 20 - k * 8); ctx.stroke(); } }
      ctx.strokeStyle = 'rgba(40,40,40,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w * .44, h * .55); ctx.lineTo(w * .45, h * .62); ctx.lineTo(w * .44, h * .68); ctx.stroke();
    } },
    { d: 4.4, who: 'Seth Haroon', cap: 'A fat envelope slides across the desk, very slowly, as if it might be startled.', grade: 'contrast(1.15) saturate(.8)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); dark(ctx, w, h, .4);
      portrait(ctx, w, h, t, 'haroon', 'happy', { x: .66, crop: 'bust', hgt: .95, bottom: 1.1, light: '255,210,150', side: -1, talk: true });
      ctx.save(); ctx.translate(w * (.55 - p * .25), h * .86); ctx.rotate(-.05); ctx.fillStyle = '#c9b07a'; ctx.fillRect(-h * .1, -h * .05, h * .2, h * .1); ctx.fillStyle = '#7a1e1e'; ctx.fillRect(-h * .1, -h * .01, h * .2, h * .02); ctx.fillStyle = 'rgba(70,130,80,.9)'; ctx.fillRect(-h * .08, -h * .07, h * .16, h * .03); ctx.restore();
    } },
  ];
  L.battalion = [
    { d: 4.6, who: 'Your battalion', cap: 'Nine hundred men. Their families, their quarrels, their weddings, their funerals.', cam: [0, 1.0, 0, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t, st, dt);
      H.flag(ctx, w * .85, h * .5, w * .12, w * .075, t, true);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) FIG.draw(ctx, w * (.06 + i * .075), h * (.72 + r * .06), h * (.12 + r * .03), p > .6 ? P.salute : P.stand, Object.assign({}, soldier, { simple: r < 2 }));
      if (p > .6 && !st.f) { st.f = 1; SFX.fanfare(); }
    } },
    { d: 4, who: 'Commanding Officer', cap: 'The first time a whole battalion salutes you, you forget to breathe.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.parade(ctx, w, h, t * .5, st, dt); dark(ctx, w, h, .3);
      H.godRays(ctx, w * .5, -h * .1, w, h, t, '255,230,170', 12, .05);
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .5, crop: 'bust', hgt: 1.0, bottom: 1.1, light: '255,230,180', salute: p > .35 });
    } },
  ];
  L.old_woman = [
    { d: 4.2, who: 'Two days on a bus', cap: 'An old woman in a white chaddar gets off the bus at the cantonment gate and asks for the Colonel.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.barracks(ctx, w, h, t, st, dt);
      const bx = w * (.75 - Math.min(1, p * 2) * .3); ctx.fillStyle = '#2f6b8a'; ctx.fillRect(bx, h * .7, w * .3, h * .12); for (let i = 0; i < 7; i++) { ctx.fillStyle = 'rgba(200,220,230,.6)'; ctx.fillRect(bx + 10 + i * w * .04, h * .72, w * .028, h * .03); }
      if (p > .5) FIG.draw(ctx, w * (.42 - (p - .5) * .3), h * .9, h * .26, FIG.lerp(P.march1, P.march2, (Math.sin(t * 3) + 1) / 2), { color: '#efece2', skin: '#b58058', facing: -1 });
    } },
    { d: 4.6, who: 'Gul Zaman\'s mother', cap: '"I came to ask you one thing only."', grade: 'contrast(1.05) saturate(.85) sepia(.15)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); dark(ctx, w, h, .35);
      portrait(ctx, w, h, t, 'gulmother', 'sad', { x: .5, crop: 'bust', hgt: 1.0 + p * .05, bottom: 1.1, light: '255,215,170', side: 1 });
    } },
  ];
  L.sister_wedding = [
    { d: 4.4, who: 'Zainab\'s wedding', cap: 'Lights in every tree. A dhol that will not stop. Your little sister, in red.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.wedding(ctx, w, h, t, st, dt);
      if (!st.d) { st.d = 1; SFX.dhol(); }
      if (Math.random() < .2) fx.sparks(Math.random() * w, h * (.2 + Math.random() * .3), 3, ['255,200,80', '255,120,160', '255,255,255'][Math.random() * 3 | 0]);
      portrait(ctx, w, h, t, 'zainab', 'happy', { x: .5, crop: 'bust', hgt: .9, bottom: 1.12, light: '255,200,140', over: { outfit: 'female', color: '#b3201e', dupatta: '#e8c34a' } });
    } },
  ];
  L.board = [
    { d: 4.6, who: 'Board of inquiry', cap: 'Five officers behind a long table. A glass of water nobody will drink.', grade: 'contrast(1.18) saturate(.7)', cam: [0, 1.0, 0, 1.05], draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); dark(ctx, w, h, .45);
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(w * .12, h * .64, w * .76, h * .05); ctx.fillStyle = '#0b4a2a'; ctx.fillRect(w * .12, h * .69, w * .76, h * .1);
      for (let i = 0; i < 5; i++) FIG.draw(ctx, w * (.2 + i * .15), h * .66, h * .32, P.stand, { color: '#0e0e0e', cap: '#0e0e0e', simple: true, shadow: false });
      FIG.draw(ctx, w * .5, h * 1.02, h * .6, P.stand, { color: '#1a1a14', beret: '#111', facing: 1, sil: true, shadow: false });
    } },
  ];
  L.valley_school = [
    { d: 4.6, who: 'Wadi-e-Noor, twenty years on', cap: 'The school you used as a firebase is a school again. There is a cricket pitch where the mortar pit was.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt);
      const k = (t * .8) % 1, bx = w * (.35 + k * .35), by = h * (.82 - Math.sin(k * Math.PI) * .3);
      FIG.draw(ctx, w * .32, h * .9, h * .22, k < .1 ? P.punch : P.stand, { color: '#efece4', skin: '#b58058' });
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.55 + i * .1), h * (.88 + (i % 2) * .02), h * .2, k > .5 && i === 1 ? runPose(t) : P.stand, { color: ['#3a6aa8', '#a83a3a', '#efece4', '#3a8a5a'][i], skin: '#b58058', facing: -1 });
      ctx.fillStyle = '#d0302a'; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.fill();
    } },
    { d: 4, who: 'Malik Gul Bahadur', cap: 'The old man is older. His handshake is not.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t * .5, st, dt); dark(ctx, w, h, .2);
      portrait(ctx, w, h, t, 'elder', 'happy', { x: .66, crop: 'bust', hgt: .95, bottom: 1.1, light: '255,220,170', side: -1 });
      portrait(ctx, w, h, t, 'hero', 'happy', { x: .26, crop: 'bust', hgt: .9, bottom: 1.12, flip: true });
    } },
  ];
  L.envelope = [
    { d: 4.2, who: 'Brigadier\'s quarters, midnight', cap: 'No stamp. No knock. An envelope slides under the door.', grade: 'contrast(1.2) saturate(.6)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); dark(ctx, w, h, .6);
      ctx.fillStyle = 'rgba(255,220,150,.5)'; ctx.fillRect(w * .1, h * .88, w * .8, 3);
      ctx.save(); ctx.translate(w * (.75 - Math.min(1, p * 1.5) * .3), h * .86); ctx.fillStyle = '#e6dcc4'; ctx.fillRect(-h * .09, -h * .04, h * .18, h * .08); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.moveTo(-h * .09, -h * .04); ctx.lineTo(0, 0); ctx.lineTo(h * .09, -h * .04); ctx.stroke(); ctx.restore();
    } },
    { d: 5, who: 'A familiar hand', cap: '"You and I are the same. We both believed the oath."', grade: 'contrast(1.1) saturate(.8) sepia(.25)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); dark(ctx, w, h, .55); H.lamp(ctx, w * .5, h * .45, h * .7, t, '255,200,120', .3);
      paper(ctx, w * .5, h * .62, h * .5, h * .62, -.03, Math.min(1, p * 1.3), 'rgba(20,20,20,.8)');
      ctx.fillStyle = 'rgba(20,20,20,.85)'; ctx.font = `italic ${h * .03}px "Barlow", serif`; ctx.textAlign = 'right'; if (p > .7) ctx.fillText('J.K.', w * .5 + h * .2, h * .88); ctx.textAlign = 'left';
    } },
  ];
  L.son_photo = [
    { d: 4.6, who: 'The photograph on the wall', cap: 'Abba in uniform, 1998. You at sixteen staring at it. Now your son is the one staring.', grade: 'contrast(1.05) saturate(.8) sepia(.2)', cam: [0, 1.0, 0, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); dark(ctx, w, h, .3);
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(w * .4, h * .2, w * .2, h * .3); ctx.fillStyle = '#c8b898'; ctx.fillRect(w * .41, h * .215, w * .18, h * .27);
      portrait(ctx, w, h * .5, t, 'abba', 'neutral', { x: .5, crop: 'bust', hgt: .52, bottom: .98, tint: 'rgba(120,90,50,.35)', over: { outfit: 'combat', hat: 'beret', beard: 'none', gray: .1, age: 30, moustache: true } });
      portrait(ctx, w, h, t, 'son', 'determined', { x: .3, crop: 'bust', hgt: .7, bottom: 1.12, flip: true });
    } },
  ];
  L.flag_car = [
    { d: 4.4, who: 'General Officer Commanding', cap: 'A flag on the bonnet and a driver who has opinions about cricket.', cam: [-.4, 1.02, .4, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
      S.avenue(ctx, w, h, t, st, dt);
      const x = w * (-.15 + p * .8); FIG.car(ctx, x, h * .87, h * .12, '#141414', false, 1);
      ctx.fillStyle = '#ccc'; ctx.fillRect(x + h * .1, h * .87 - h * .1, 2, h * .04); ctx.fillStyle = '#b3201e'; ctx.fillRect(x + h * .1 + 2, h * .87 - h * .1, h * .035 + Math.sin(t * 20) * 2, h * .022); ctx.fillStyle = '#e2ae48'; ctx.fillRect(x + h * .113, h * .87 - h * .095, 4, 4); ctx.fillRect(x + h * .122, h * .87 - h * .095, 4, 4);
      for (let i = 0; i < 3; i++) FIG.draw(ctx, w * (.62 + i * .1), h * .9, h * .24, x > w * (.5 + i * .1) ? P.salute : P.stand, Object.assign({}, soldier, { facing: -1 }));
    } },
  ];
  L.ammi_hands = [
    { d: 5.2, who: 'Ammi', cap: 'Her hands are thin and spotted now. They still smell of cardamom.', grade: 'contrast(1.05) saturate(.9) sepia(.15)', cam: [0, 1.0, 0, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
      S.home(ctx, w, h, t, st, dt); dark(ctx, w, h, .25); H.lamp(ctx, w * .3, h * .4, h * .8, t, '255,200,130', .25);
      portrait(ctx, w, h, t, 'ammi', 'happy', { x: .62, crop: 'bust', hgt: 1.0, bottom: 1.1, light: '255,210,160', side: -1, talk: p < .6 });
      portrait(ctx, w, h, t, 'hero', 'sad', { x: .24, crop: 'bust', hgt: .85, bottom: 1.14, flip: true, alpha: .9 });
    } },
  ];
  L.headlines = [
    { d: 4.4, who: 'Corps Commander', cap: 'Your name is in the speculation columns now.', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#121310'; ctx.fillRect(0, -h * .2, w, h * 1.4);
      const S0 = Math.min(w * .7, h * 1.1);
      headline(ctx, w * .3, h * .5, S0 * .8, -.18 + p * .05, 'CORPS COMMANDERS MEET', 'Rawalpindi');
      const k = Math.min(1, p * 1.6), sc = .2 + k * .8;
      ctx.save(); ctx.translate(w * .55, h * .55); ctx.rotate((1 - k) * 6); ctx.scale(sc, sc); headline(ctx, 0, 0, S0, .04, 'WHO WILL BE THE NEXT CHIEF?', 'Three names, one of them yours'); ctx.restore();
      if (p > .55 && !st.f) { st.f = 1; fx.shake = .3; SFX.hit(); }
    } },
  ];
  L.malik_room = [
    { d: 5, who: 'General Tariq Malik', cap: '"Sit. Shut the door. Leave your phone outside."', grade: 'contrast(1.25) saturate(.6)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); dark(ctx, w, h, .55, '0,5,15'); rainOver(ctx, w, h, t, .25);
      if (Math.sin(t * 1.7) > .97) dark(ctx, w, h, .2, '200,220,255');
      portrait(ctx, w, h, t, 'malik', 'neutral', { x: .58, crop: 'bust', hgt: 1.0 + p * .06, bottom: 1.1, light: '255,190,120', side: -1, shade: .65 });
      H.smoke(ctx, st, 'sm_cig', w * .72, h * .7, dt, '200,200,200', 3, .5);
    } },
  ];
  L.pm_house = [
    { d: 4.6, who: 'Prime Minister\'s House', cap: 'Three more years. Some people would give anything for them.', grade: 'contrast(1.1) saturate(.85)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.avenue(ctx, w, h, t, st, dt); dark(ctx, w, h, .3);
      portrait(ctx, w, h, t, 'pm', 'happy', { x: .64, crop: 'bust', hgt: .95, bottom: 1.1, light: '255,230,190', side: -1, talk: true });
      portrait(ctx, w, h, t, 'hero', 'neutral', { x: .26, crop: 'bust', hgt: .92, bottom: 1.12, flip: true });
    } },
  ];
  L.last_drive = [
    { d: 4.4, who: 'Your last day in uniform', cap: 'The staff car drives you home for the last time.', grade: 'contrast(1.05) saturate(1.1) sepia(.15)', cam: [-.5, 1.02, .3, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.road_night(ctx, w, h, t * .3, st, dt); dark(ctx, w, h, .15, '120,60,20');
      FIG.car(ctx, w * (.1 + p * .6), h * .87, h * .11, '#141414', true, 1);
    } },
    { d: 4.2, who: 'The driver', cap: 'He cries a little, and blames the dust.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.village(ctx, w, h, t, st, dt); dark(ctx, w, h, .2, '80,40,10');
      FIG.draw(ctx, w * .4, h * .9, h * .4, P.salute, { color: '#4c5634', cap: '#2a2a20', skin: '#b07a52' });
      FIG.draw(ctx, w * .6, h * .9, h * .42, P.stand, { color: '#e8e2d0', skin: '#c99468', facing: -1 });
    } },
  ];
  L.mess_bet = [
    { d: 4.4, who: 'The mess, Quetta', cap: 'Fifty thousand rupees on a mahogany table, and every major pretending not to look.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.quetta(ctx, w, h, t, st, dt); dark(ctx, w, h, .45); H.lamp(ctx, w * .5, h * .5, h * .8, t, '255,200,120', .3);
      ctx.fillStyle = '#3a1e10'; ctx.fillRect(0, h * .78, w, h * .3);
      for (let i = 0; i < 10; i++) { ctx.save(); ctx.translate(w * (.44 + (i % 5) * .03), h * (.82 - Math.floor(i / 5) * .02)); ctx.rotate((i * 1.3) % .6 - .3); ctx.fillStyle = i % 2 ? '#3a7a5a' : '#2f6a4a'; ctx.fillRect(-h * .05, -h * .02, h * .1, h * .045); ctx.restore(); }
      portrait(ctx, w, h, t, 'danish', 'happy', { x: .75, crop: 'bust', hgt: .8, bottom: .98, light: '255,210,150', side: -1, talk: true });
    } },
  ];
  L.old_file = [
    { d: 4.6, who: 'Directorate archives', cap: 'A brown file, fourteen years in a cabinet. A name on the cover you have tried not to think about.', grade: 'contrast(1.15) saturate(.7)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); dark(ctx, w, h, .5);
      const k = Math.min(1, p * 2.2), y = h * (.3 + k * .5);
      ctx.save(); ctx.translate(w * .5, y); ctx.rotate((1 - k) * .6 - .05); ctx.fillStyle = '#a07a4a'; ctx.fillRect(-h * .2, -h * .14, h * .4, h * .28); ctx.fillStyle = '#7a5a30'; ctx.fillRect(-h * .2, -h * .14, h * .4, h * .03);
      ctx.fillStyle = 'rgba(200,30,30,.85)'; ctx.font = `${h * .045}px "Saira Stencil One", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('SECRET', 0, h * .02); ctx.fillStyle = '#2a1a0a'; ctx.font = `${h * .028}px "Barlow Condensed", sans-serif`; ctx.fillText('CHERAT / K.', 0, h * .08); ctx.textAlign = 'left'; ctx.restore();
      if (k >= 1 && !st.d) { st.d = 1; fx.sparks(w * .5, h * .9, 16, '200,180,140'); SFX.hit(); fx.shake = .2; }
    } },
  ];
  L.gold_card = [
    { d: 4.4, who: 'Brigadier Danish Mirza', cap: 'A gold-edged card. Dinners, golf, the right word in the right ear.', draw(ctx, w, h, p, t, dt, fx, st) {
      S.office(ctx, w, h, t, st, dt); dark(ctx, w, h, .35);
      portrait(ctx, w, h, t, 'danish', 'happy', { x: .3, crop: 'bust', hgt: .95, bottom: 1.1, light: '255,220,170', side: 1, talk: true });
      ctx.save(); ctx.translate(w * .7, h * .62); ctx.rotate(-.1 + Math.sin(t) * .03); const cw = h * .32, ch = h * .2;
      ctx.fillStyle = '#f4efe2'; ctx.fillRect(-cw / 2, -ch / 2, cw, ch); ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 4; ctx.strokeRect(-cw / 2 + 4, -ch / 2 + 4, cw - 8, ch - 8);
      ctx.fillStyle = '#7a5a10'; ctx.font = `italic ${ch * .14}px "Barlow", serif`; ctx.textAlign = 'center'; ctx.fillText('You are cordially invited', 0, -ch * .05); ctx.font = `${ch * .1}px "Barlow", serif`; ctx.fillText('Saturday, eight o\'clock', 0, ch * .15); ctx.textAlign = 'left';
      const sx = -cw / 2 + ((t * .6) % 1.6) * cw; const g = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,240,180,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
      ctx.restore();
    } },
  ];
  L.daughter_letter = [
    { d: 5, who: 'Peshawar postmark', cap: '"Please tell me he was a good teacher."', grade: 'contrast(1.05) saturate(.8) sepia(.25)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.dam(ctx, w, h, t, st, dt); dark(ctx, w, h, .35, '40,20,10');
      portrait(ctx, w, h, t, 'khattak', 'neutral', { x: .3, crop: 'bust', hgt: .9, bottom: 1.1, tint: 'rgba(110,80,40,.4)', alpha: .55 + Math.sin(t) * .05, over: { outfit: 'ssg', hat: 'beret', beretC: '#6e1526', gray: .15, beard: 'none', mask: null } });
      paper(ctx, w * .7, h * .66, h * .34, h * .44, .06, Math.min(1, p * 1.4), 'rgba(40,30,90,.75)', '#f2ece0');
    } },
  ];
  L.night_car = [
    { d: 4.2, who: '2300 hours', cap: 'A car with no number plates idles outside your gate. Its lights stay off.', grade: 'contrast(1.2) saturate(.6)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.road_night(ctx, w, h, t, st, dt); dark(ctx, w, h, .12);
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(w * .3, h * .45, 4, h * .43); H.lamp(ctx, w * .3 + 2, h * .45, h * .45, t, '255,200,120', .6);
      FIG.car(ctx, w * .55, h * .87, h * .12, '#2a2a2e', false, -1);
      FIG.draw(ctx, w * (.75 - Math.min(1, p * 1.5) * .12), h * .9, h * .34, p < .66 ? marchPose(t, 3) : P.stand, { color: '#121212', facing: -1, sil: true });
      if (p > .7) { ctx.fillStyle = `rgba(255,170,80,${.6 + .4 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.arc(w * .63 + 6, h * .9 - h * .29, 2.5, 0, 7); ctx.fill(); }
    } },
  ];

  // ------------------------------------------------------------------ Operations mission intros
  // CUT.missionIntro(type, scene, title, theatre) returns two short shots for a mission's first attempt.
  const sol = (o = {}) => Object.assign({ color: '#4c5634', helmet: '#3a4028', rifle: true, vest: true, pack: '#3a3e2a', skin: '#a8754e' }, o);
  const title = (ctx, w, h, p, kick, name) => {
    const a = Math.min(1, p * 3) * Math.min(1, (1 - p) * 5);
    ctx.fillStyle = `rgba(0,0,0,${.45 * a})`; ctx.fillRect(0, h * .3, w, h * .2);
    ctx.globalAlpha = a; ctx.fillStyle = '#e0a83e'; ctx.font = `${Math.min(16, w * .03)}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'center'; ctx.fillText(kick.toUpperCase(), w / 2, h * .36);
    big(ctx, w, name.toUpperCase(), h * .45, Math.min(w * .075, 52)); ctx.globalAlpha = 1;
  };
  const A = () => GAMES.art;
  const ACTION = {
    shoot: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); FIG.draw(ctx, w * .3, h * .9, h * .42, P.aim, sol({ flash: Math.sin(t * 9) > .8 })); for (let i = 0; i < 4; i++) { const x = w * (.6 + i * .09), up = Math.sin(t * 2 + i * 1.7) > 0; ctx.fillStyle = up ? '#1d2418' : 'rgba(0,0,0,.2)'; if (up) { ctx.beginPath(); ctx.arc(x, h * .66, h * .02, 0, 7); ctx.fill(); ctx.fillRect(x - h * .03, h * .68, h * .06, h * .1); } } if (Math.sin(t * 9) > .8 && Math.random() < .3) SFX.shot(); },
    obstacle: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S.pma(ctx, w, h, t, st, dt); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(w * .5, h * .7, w * .03, h * .2); ctx.fillRect(w * .5, h * .7, w * .2, h * .02); const k = (p * 2) % 1; FIG.draw(ctx, w * (.1 + k * .8), h * (.9 - Math.sin(k * Math.PI) * .12), h * .32, k > .4 && k < .6 ? P.jump : runPose(t, 12), sol({ helmet: null, rifle: false, vest: false, beret: '#1f2a1c' })); },
    fight: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); dark(ctx, w, h, .25); const ph = Math.floor(t * 2.5) % 4; FIG.draw(ctx, w * .4, h * .9, h * .5, [P.guard, P.punch, P.guard, P.kick][ph], { color: '#3c4a2c', beret: '#1f2a1c', skin: '#a8754e' }); FIG.draw(ctx, w * .6, h * .9, h * .5, [P.guard, P.block, P.punch2, P.hit][ph], { color: '#3a1414', facing: -1, skin: '#9e6c46' }); if (ph === 3 && !st['h' + Math.floor(t * 2.5)]) { st['h' + Math.floor(t * 2.5)] = 1; fx.impact(w * .55, h * .62); SFX.hit(); } },
    memory: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S.maproom(ctx, w, h, t, st, dt); dark(ctx, w, h, .3); const n = 5; for (let i = 0; i < n * n; i++) { const x = w * .3 + (i % n) * h * .09, y = h * .3 + Math.floor(i / n) * h * .09, lit = [3, 7, 12, 16, 21].indexOf(i), on = lit >= 0 && lit <= p * 6; ctx.fillStyle = on ? 'rgba(255,207,74,.85)' : 'rgba(255,255,255,.1)'; ctx.fillRect(x, y, h * .08, h * .08); } },
    cipher: (scene) => (ctx, w, h, p, t, dt, fx, st) => { ctx.fillStyle = '#060a07'; ctx.fillRect(0, -h * .2, w, h * 1.4); ctx.fillStyle = 'rgba(80,255,120,.08)'; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1); ctx.font = `${h * .045}px "Share Tech Mono", monospace`; const msg = 'THE SHIP SAILS FRIDAY'; for (let r = 0; r < 6; r++) { let s = ''; for (let i = 0; i < 22; i++) s += r === 3 && i < msg.length && i < p * 30 ? msg[i] : String.fromCharCode(65 + ((i * 7 + r * 13 + Math.floor(t * 12)) % 26)); ctx.fillStyle = r === 3 ? '#9bff9b' : 'rgba(80,220,120,.5)'; ctx.fillText(s, w * .12, h * (.25 + r * .09)); } },
    defuse: (scene) => (ctx, w, h, p, t, dt, fx, st) => { ctx.fillStyle = '#0c0d0b'; ctx.fillRect(0, -h * .2, w, h * 1.4); H.lamp(ctx, w * .5, h * .5, h * .6, t, '255,240,200', .2); ctx.fillStyle = '#3a3a30'; ctx.fillRect(w * .3, h * .4, w * .4, h * .3); ['#d03030', '#3070d0', '#e0c040', '#30a050'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w * .33, h * (.45 + i * .06)); ctx.bezierCurveTo(w * .45, h * (.4 + i * .08), w * .55, h * (.55 - i * .03), w * .67, h * (.45 + i * .06)); ctx.stroke(); }); ctx.fillStyle = '#000'; ctx.fillRect(w * .42, h * .3, w * .16, h * .08); ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff3030' : '#801010'; ctx.font = `${h * .06}px "Share Tech Mono", monospace`; ctx.textAlign = 'center'; ctx.fillText(`00:${String(45 - Math.floor(p * 5)).padStart(2, '0')}`, w * .5, h * .365); ctx.textAlign = 'left'; if (Math.floor(t * 2) !== st.b) { st.b = Math.floor(t * 2); SFX.beep(); } },
    stealth: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); dark(ctx, w, h, .45, '0,10,25'); const bx = w * (.5 + Math.sin(t * .9) * .3); const g = ctx.createRadialGradient(bx, h * .85, 0, bx, h * .85, h * .3); g.addColorStop(0, 'rgba(255,250,200,.35)'); g.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 1.2); FIG.draw(ctx, w * (.05 + p * .5), h * .9, h * .3, FIG.lerp(P.crouchAim, P.kneel, (Math.sin(t * 5) + 1) / 2), sol({ color: '#1a1f16', helmet: '#121410' })); },
    sniper: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); const cx = w * (.5 + Math.sin(t * .8) * .08), cy = h * (.6 + Math.cos(t * 1.1) * .04), R = Math.min(w, h) * .3; FIG.draw(ctx, w * .55, h * .72, h * .14, marchPose(t, 3), { color: '#2a2018', facing: -1, rifle: true, scarf: '#3b2a20' }); ctx.save(); ctx.beginPath(); ctx.rect(0, -h * .2, w, h * 1.4); ctx.moveTo(cx + R, cy); ctx.arc(cx, cy, R, 0, Math.PI * 2, true); ctx.fillStyle = 'rgba(0,0,0,.93)'; ctx.fill('evenodd'); ctx.restore(); ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke(); ctx.strokeStyle = '#c33'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.stroke(); },
    assault: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (-.05 + p * .5 + i * .1), h * (.88 + (i % 2) * .03), h * .3, runPose(t + i * .5), sol()); if (Math.random() < .04) { fx.boom(w * (.75 + Math.random() * .2), h * (.7 + Math.random() * .1), .6); SFX.boom(); } if (Math.random() < .3) fx.tracer(w * .95, h * .7, w * (.3 + Math.random() * .3), h * .7, '255,140,90'); },
    tank: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); const s = Math.min(h * .26, w * .24); A().drawTank(ctx, w * (.1 + p * .3), h * .9, s, Math.sin(t * 4) * .012, -.1, '#56603a', 1, 0, null, true, t); H.smoke(ctx, st, 'sm_dust', w * (.1 + p * .3) - s * .6, h * .88, dt, '170,150,110', 6, 1.3); fx.shake = Math.max(fx.shake, .1); if (p > .6 && !st.f) { st.f = 1; fx.boom(w * .9, h * .76, 1); SFX.boom(); } },
    heli: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); for (let i = 0; i < 3; i++) FIG.heli(ctx, w * (-.1 + p * .9 + i * .12), h * (.3 + i * .08 + Math.sin(t * 2 + i) * .01), h * (.1 - i * .015), t, '#1d2420'); if (Math.floor(t * 8) % 3 === 0 && !st['s' + Math.floor(t * 8)]) { st['s' + Math.floor(t * 8)] = 1; SFX.heli(); } },
    para: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); FIG.plane(ctx, w * (1.1 - p * .9), h * .14, h * .07, '#3a4038'); for (let i = 0; i < 6; i++) { const k = Math.max(0, p * 1.6 - i * .12); if (k > 0) A().canopy(ctx, w * (.9 - i * .12 - p * .1), h * (.2 + k * .3 + (i % 2) * .04), h * .08, Math.sin(t + i) * .1); } },
    defend: (scene) => (ctx, w, h, p, t, dt, fx, st) => { S[scene](ctx, w, h, t, st, dt); dark(ctx, w, h, .3, '10,10,30'); for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { ctx.fillStyle = '#a8966e'; ctx.beginPath(); ctx.ellipse(w * (.05 + i * .06 + (r % 2) * .03), h * (.9 - r * .045), w * .035, h * .025, 0, 0, 7); ctx.fill(); } [.12, .24].forEach((x, i) => FIG.draw(ctx, w * x, h * .9, h * .4, P.crouchAim, sol({ flash: Math.sin(t * 25 + i) > .5 }))); for (let i = 0; i < 6; i++) FIG.draw(ctx, w * (1.05 - ((p * .4 + i * .13) % 1) * .5), h * (.78 + (i % 3) * .04), h * .14, runPose(t + i), { color: '#2a2420', facing: -1, rifle: true, scarf: '#3a2a20', simple: true }); if (Math.random() < .25) fx.tracer(w * .3, h * .62, w * (.6 + Math.random() * .4), h * (.68 + Math.random() * .12)); },
  };
  const LINES = {
    shoot: 'Front sight, breathe out, squeeze. The range officer is watching.', obstacle: 'Walls, ropes, ditches. The clock does not care how tired you are.',
    fight: 'No rifles now. Just hands, feet and whoever reads the other man first.', memory: 'Learn the route. In the dark there is no map.',
    cipher: 'An intercepted signal. Somewhere in the noise is a sentence that matters.', defuse: 'Four wires and a timer. Steady hands, quiet mind.',
    stealth: 'Stay in the shadows. If the light finds you, it is over.', sniper: 'One round, one man, and a crowd of people who must not be hurt.',
    assault: 'Cover to cover. Watch the windows. Bring everyone home.', tank: 'Forty tonnes of steel and a gun that can reach the horizon.',
    heli: 'Rotors up. The convoy below is counting on your gun.', para: 'Twelve thousand feet. The door opens on nothing at all.',
    defend: 'They are coming up the slope. This post does not fall tonight.',
  };
  CUT.missionIntro = (type, scene, name, theatre) => {
    const act = (ACTION[type] || ACTION.assault)(S[scene] ? scene : 'valley');
    return [
      { d: 3.6, who: theatre, cap: LINES[type] || '', cam: [-.4, 1.02, .4, 1.1], draw(ctx, w, h, p, t, dt, fx, st) { act(ctx, w, h, p, t, dt, fx, st); title(ctx, w, h, p, theatre, name); } },
      { d: 2.8, who: 'Your squad', cap: '"Ready, sahib."', cam: [0, 1.0, 0, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
        S[S[scene] ? scene : 'valley'](ctx, w, h, t, st, dt); dark(ctx, w, h, .35);
        portrait(ctx, w, h, t, 'hero', 'determined', { x: .5, crop: 'bust', hgt: .95 + p * .05, bottom: 1.1, light: '255,220,170', over: { outfit: 'combat', hat: type === 'heli' || type === 'para' || type === 'defend' || type === 'assault' ? 'helmet' : 'beret' } });
      } },
    ];
  };

  // ------------------------------------------------------------------ foreign courses and postings
  function landmark(ctx, kind, x, y, s, c) {
    ctx.fillStyle = c;
    if (kind === 'clock') { ctx.fillRect(x - s * .12, y - s * 1.1, s * .24, s * 1.1); ctx.beginPath(); ctx.moveTo(x - s * .15, y - s * 1.1); ctx.lineTo(x, y - s * 1.45); ctx.lineTo(x + s * .15, y - s * 1.1); ctx.fill(); ctx.fillStyle = 'rgba(255,240,190,.85)'; ctx.beginPath(); ctx.arc(x, y - s * .9, s * .08, 0, 7); ctx.fill(); }
    else if (kind === 'dome') { ctx.fillRect(x - s * .5, y - s * .5, s, s * .5); ctx.beginPath(); ctx.arc(x, y - s * .5, s * .3, Math.PI, 0); ctx.fill(); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - s * .45 + i * s * .17, y - s * .45, s * .05, s * .45); } }
    else if (kind === 'mosque') { ctx.beginPath(); ctx.arc(x, y - s * .4, s * .32, Math.PI, 0); ctx.fill(); ctx.fillRect(x - s * .45, y - s * .4, s * .9, s * .4); [-1, 1].forEach(k => { ctx.fillRect(x + k * s * .6 - s * .04, y - s * 1.1, s * .08, s * 1.1); ctx.beginPath(); ctx.moveTo(x + k * s * .6 - s * .05, y - s * 1.1); ctx.lineTo(x + k * s * .6, y - s * 1.28); ctx.lineTo(x + k * s * .6 + s * .05, y - s * 1.1); ctx.fill(); }); }
    else if (kind === 'pagoda') { for (let i = 0; i < 4; i++) { const yy = y - i * s * .28, ww = s * (.6 - i * .1); ctx.fillRect(x - ww * .6, yy - s * .2, ww * 1.2, s * .2); ctx.beginPath(); ctx.moveTo(x - ww, yy - s * .2); ctx.lineTo(x, yy - s * .34); ctx.lineTo(x + ww, yy - s * .2); ctx.fill(); } }
    else if (kind === 'tower') { ctx.beginPath(); ctx.moveTo(x - s * .18, y); ctx.lineTo(x - s * .05, y - s * 1.5); ctx.lineTo(x + s * .05, y - s * 1.5); ctx.lineTo(x + s * .18, y); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y - s * 1.2, s * .16, s * .22, 0, 0, 7); ctx.fill(); }
    else if (kind === 'dune') { ctx.beginPath(); ctx.moveTo(x - s * 2, y); ctx.quadraticCurveTo(x - s * .5, y - s * .7, x + s, y - s * .1); ctx.quadraticCurveTo(x + s * 1.6, y - s * .3, x + s * 2.2, y); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - s * .2, y - s * .5, s * .5, s * .25); ctx.fillStyle = '#5b92e5'; ctx.fillRect(x - s * .2, y - s * .5, s * .5, s * .06); }
    else { ctx.fillRect(x - 2, y - s * 1.2, 4, s * 1.2); }
  }
  CUT.abroad = c => [
    { d: 4, who: 'PIA, 35,000 feet', cap: `Islamabad to ${c.where}. Ammi packed enough parathas for a battalion.`, cam: [-.2, 1.0, .2, 1.05], draw(ctx, w, h, p, t, dt, fx, st) {
      const g = ctx.createLinearGradient(0, -h * .2, 0, h * 1.2); g.addColorStop(0, '#0f2a52'); g.addColorStop(.6, '#e08a4a'); g.addColorStop(1, '#f4c27a'); ctx.fillStyle = g; ctx.fillRect(0, -h * .2, w, h * 1.4);
      for (let i = 0; i < 8; i++) { const x = ((i * .17 - t * .04) % 1.2 + 1.2) % 1.2 * w - w * .1, y = h * (.62 + (i % 3) * .08); ctx.fillStyle = `rgba(255,236,210,${.35 + (i % 3) * .15})`; ctx.beginPath(); ctx.ellipse(x, y, w * .18, h * .05, 0, 0, 7); ctx.fill(); }
      FIG.plane(ctx, w * (.2 + p * .55), h * (.4 - p * .05), h * .12, '#e8ece8'); ctx.fillStyle = '#0b6b3a'; ctx.fillRect(w * (.2 + p * .55) - h * .1, h * (.4 - p * .05) - h * .01, h * .08, h * .02);
    } },
    { d: 4.6, who: c.where, cap: `${c.n}. ${c.months.charAt(0).toUpperCase() + c.months.slice(1)} far from home, learning how other armies think.`, cam: [-.3, 1.02, .3, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
      const g = ctx.createLinearGradient(0, -h * .2, 0, h); g.addColorStop(0, c.mark === 'dune' ? '#e8b878' : '#7aa4c8'); g.addColorStop(1, c.mark === 'dune' ? '#f6dcaa' : '#dfe8ee'); ctx.fillStyle = g; ctx.fillRect(0, -h * .2, w, h * 1.4);
      H.skyline(ctx, w, h, h * .78, 7, c.mark === 'dune' ? 'rgba(150,110,60,.5)' : 'rgba(70,80,96,.55)', t, false);
      landmark(ctx, c.mark, w * .72, h * .82, h * .42, c.mark === 'dune' ? '#c49a5a' : '#3e4652');
      ctx.fillStyle = c.mark === 'dune' ? '#d8b37a' : '#6a7a5a'; ctx.fillRect(0, h * .82, w, h * .4);
      const fw = w * .12, fh = fw * .62, fx0 = w * .14, fy = h * .3; ctx.fillStyle = '#bbb'; ctx.fillRect(fx0 - 3, fy, 3, h * .52);
      c.flag.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(fx0, fy + i * fh / 3 + Math.sin(t * 3 + i) * 2, fw, fh / 3 + 1); });
      portrait(ctx, w, h, t, 'hero', 'happy', { x: .42, crop: 'bust', hgt: .82, bottom: 1.12, light: '255,240,210', over: { outfit: 'combat', hat: 'beret' } });
    } },
  ];
  CUT.H2 = { paper, headline, rainOver, dark, big, landmark };
})();
