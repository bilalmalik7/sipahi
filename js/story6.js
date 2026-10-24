// Round six: the martial-law branch for a Chief of the Army Staff. A choice with consequences either
// way, about four and a half minutes of cutscenes (the night, the curfew, the address, the oath as
// President, the years after), decisions in office, and two new endings. Fiction, like the rest.
(() => {
  const S = SCENES.S, H = SCENES.helpers, P = FIG.P, L = CUT.LIB, portrait = CUT.portrait, X = CUT.H2, A = () => GAMES.art;
  const UNI = { outfit: 'dress', rank: 11, hat: 'gencap', gray: .8, moustache: true, medals: ['#c9a227', '#b3201e', '#5b1f24', '#e2ae48', '#3b7fd0', '#2aa34f', '#0b6b3a'] };
  const PRES = { outfit: 'sherwani', hat: 'none', gray: .85, moustache: true };
  const CAMO = { outfit: 'combat', hat: 'helmet' };
  const sol = (o = {}) => Object.assign({ color: '#4c5634', helmet: '#3a4028', rifle: true, vest: true, skin: '#a8754e' }, o);
  const runPose = (t, sp = 10) => FIG.lerp(P.run1, P.run2, (Math.sin(t * sp) + 1) / 2);
  const marchPose = (t, sp = 4) => FIG.lerp(P.march1, P.march2, (Math.sin(t * sp) + 1) / 2);
  const night = (ctx, w, h, a = .45) => X.dark(ctx, w, h, a, '0,8,20');

  // ---- reusable shot painters ----
  function convoy(scene, dark) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); if (dark) night(ctx, w, h, dark);
      for (let i = 0; i < 5; i++) { const x = w * (-.3 + p * 1.1 - i * .24), y = h * .88; A().truck(ctx, x, y, h * .09, '#4e5638', 'truck', t); if (dark) { const g = ctx.createLinearGradient(x + h * .08, 0, x + h * .5, 0); g.addColorStop(0, 'rgba(255,240,200,.5)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + h * .07, y - h * .05); ctx.lineTo(x + h * .5, y - h * .1); ctx.lineTo(x + h * .5, y + h * .02); ctx.fill(); } }
      fx.shake = Math.max(fx.shake, .06);
    };
  }
  function tanks(scene, dark) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); if (dark) night(ctx, w, h, dark);
      const s = Math.min(h * .2, w * .17);
      for (let i = 0; i < 3; i++) { const x = w * (1.15 - p * .8 - i * .3); A().drawTank(ctx, x, h * (.88 + (i % 2) * .02), s, Math.sin(t * 3 + i) * .01, Math.PI + .15, '#56603a', -1, 0, null, false, t); H.smoke(ctx, st, 'sm_tk' + i, x + s * .6, h * .86, dt, '120,110,100', 5, 1); }
      fx.shake = Math.max(fx.shake, .1);
    };
  }
  function helis(scene, dark) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); if (dark) night(ctx, w, h, dark);
      for (let i = 0; i < 3; i++) { const x = w * (-.15 + p * 1.2 - i * .16), y = h * (.22 + i * .07); FIG.heli(ctx, x, y + Math.sin(t * 2 + i) * 4, h * (.08 - i * .012), t, '#1d2420'); if (dark) { const g = ctx.createLinearGradient(x, y, x - h * .1, h * .9); g.addColorStop(0, 'rgba(255,250,220,.35)'); g.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x - h * .25, h * .95); ctx.lineTo(x + h * .1, h * .95); ctx.fill(); } }
      if (!st.s || t - st.s > .9) { st.s = t; SFX.heli(); }
    };
  }
  function jets(scene) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt);
      [[0, '#ffffff'], [1, '#2aa34f'], [2, '#ffffff']].forEach(([i, smoke]) => { const x = w * (1.2 - p * 1.6) + i * h * .12, y = h * (.2 + i * .05); ctx.strokeStyle = smoke === '#ffffff' ? 'rgba(255,255,255,.7)' : 'rgba(42,163,79,.75)'; ctx.lineWidth = h * .02; ctx.beginPath(); ctx.moveTo(x + h * .05, y); ctx.lineTo(w * 1.3, y + h * .01); ctx.stroke(); FIG.plane(ctx, x, y, h * .06, '#3a4048'); });
      if (p > .3 && !st.r) { st.r = 1; SFX.boom(); }
    };
  }
  function checkpoint(scene, dark = .4) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); night(ctx, w, h, dark);
      ctx.fillStyle = '#c33'; ctx.fillRect(w * .32, h * .78, w * .36, h * .02); ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) ctx.fillRect(w * (.33 + i * .06), h * .78, w * .025, h * .02);
      FIG.car(ctx, w * (.95 - Math.min(1, p * 2) * .2), h * .88, h * .09, '#3a3e48', true, -1);
      FIG.draw(ctx, w * .5, h * .9, h * .32, P.stand, sol({ facing: 1 }));
      FIG.draw(ctx, w * .62, h * .9, h * .32, FIG.lerp(P.stand, P.aim, .4), sol({ facing: 1 }));
      const bx = w * .62 + h * .06, g = ctx.createLinearGradient(bx, 0, w, 0); g.addColorStop(0, 'rgba(255,250,210,.5)'); g.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx, h * .65); ctx.lineTo(w, h * (.55 + Math.sin(t) * .05)); ctx.lineTo(w, h * (.85 + Math.sin(t) * .05)); ctx.fill();
    };
  }
  function emptyStreet(scene, word = 'CURFEW') {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); night(ctx, w, h, .5);
      A().truck(ctx, w * (1.1 - p * .7), h * .88, h * .08, '#4e5638', 'jeep', t);
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 3) * .85; X.big(ctx, w, word, h * .4, Math.min(w * .12, 80), 'rgba(220,60,40,.85)'); ctx.restore();
      ctx.fillStyle = 'rgba(255,220,140,.6)'; for (let i = 0; i < 6; i++) if (Math.sin(t * .7 + i * 9) > .7) ctx.fillRect(w * (.1 + i * .15), h * (.5 + (i % 2) * .08), 6, 8);
    };
  }
  function tv(title, sub, who, mood, over, tick) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S.home(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .55);
      const tw = Math.min(w * .62, h * 1.2), th = tw * .58, x0 = w / 2 - tw / 2, y0 = h * .14;
      ctx.fillStyle = '#111'; ctx.fillRect(x0 - 10, y0 - 10, tw + 20, th + 20);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, tw, th); ctx.clip();
      const g = ctx.createLinearGradient(0, y0, 0, y0 + th); g.addColorStop(0, '#1b3a2a'); g.addColorStop(1, '#0b1a12'); ctx.fillStyle = g; ctx.fillRect(x0, y0, tw, th);
      H.flag(ctx, x0 + tw * .82, y0 + th * .1, tw * .14, tw * .09, t, false);
      portrait(ctx, w, y0 + th, t, who, mood, { x: .5, crop: 'bust', hgt: (th * .95) / (y0 + th), bottom: 1, talk: true, light: '255,240,210', over });
      ctx.fillStyle = 'rgba(180,20,20,.92)'; ctx.fillRect(x0, y0 + th * .84, tw, th * .16); ctx.fillStyle = '#fff'; ctx.font = `${th * .07}px "Barlow Condensed", sans-serif`; ctx.fillText(title, x0 + 8, y0 + th * .91);
      ctx.font = `${th * .055}px "Barlow", sans-serif`; const tk = `${tick || sub}   •   `; const tx = x0 + tw - ((t * 60) % (tw + ctx.measureText(tk).width * 2)); ctx.fillText(tk + tk, tx, y0 + th * .975);
      ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let y = y0; y < y0 + th; y += 3) ctx.fillRect(x0, y, tw, 1);
      ctx.restore();
      ctx.fillStyle = 'rgba(120,170,255,.08)'; ctx.fillRect(0, -h * .2, w, h * 1.4);
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.18 + i * .2), h * 1.02, h * .42, P.stand, { color: '#0a0a0a', sil: true, shadow: false, facing: i < 2 ? 1 : -1 });
    };
  }
  function face(scene, who, mood, over, o = {}) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); X.dark(ctx, w, h, o.dark ?? .35, o.tint || '0,0,0');
      if (o.rain) X.rainOver(ctx, w, h, t, .3);
      portrait(ctx, w, h, t, who, mood, Object.assign({ x: .5, crop: 'bust', hgt: 1.0 + p * .05, bottom: 1.1, light: o.light || '255,220,170', side: o.side || 1, talk: o.talk, over }, o.p || {}));
      if (o.who2) portrait(ctx, w, h, t, o.who2, o.mood2 || 'neutral', { x: .2, crop: 'bust', hgt: .85, bottom: 1.14, flip: true, over: o.over2 });
    };
  }
  function crowd(scene, kind) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); if (kind === 'protest') night(ctx, w, h, .25);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) {
        const x = w * ((i + .5) / 16 + (r % 2) * .03), y = h * (.8 + r * .06), s = h * (.14 + r * .05), raise = Math.sin(t * 3 + i * 1.7 + r) > .3;
        FIG.draw(ctx, x, y, s, raise ? P.jump : P.stand, { color: ['#3a3a42', '#5a4a3a', '#2a3a4a', '#4a2a2a'][(i + r) % 4], simple: true, shadow: false, facing: i % 2 ? 1 : -1 });
        if (kind === 'protest' && i % 4 === r) { ctx.fillStyle = '#eee'; ctx.fillRect(x - s * .12, y - s * 1.25, s * .24, s * .16); ctx.fillStyle = '#b3201e'; ctx.fillRect(x - s * .1, y - s * 1.2, s * .2, s * .03); }
        if (kind === 'cheer' && i % 5 === r) { ctx.fillStyle = '#0b6b3a'; ctx.fillRect(x, y - s * 1.3, s * .2, s * .13); ctx.fillStyle = '#fff'; ctx.fillRect(x, y - s * 1.3, s * .05, s * .13); }
      }
      if (kind === 'protest' && Math.random() < .03) { fx.sparks(w * Math.random(), h * .7, 8, '200,200,200'); }
    };
  }
  function generals(dark = .45) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S.maproom(ctx, w, h, t, st, dt); X.dark(ctx, w, h, dark);
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(w * .1, h * .7, w * .8, h * .05);
      for (let i = 0; i < 6; i++) FIG.draw(ctx, w * (.16 + i * .136), h * .72, h * .3, P.stand, { color: '#8f7f52', cap: '#a99a6c', skin: '#c99468', simple: true, shadow: false, facing: i < 3 ? 1 : -1 });
      portrait(ctx, w, h, t, 'hero', 'determined', { x: .5, crop: 'bust', hgt: .75, bottom: 1.12, light: '255,190,120', over: UNI });
    };
  }
  function motorcade(scene) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt);
      for (let i = 0; i < 4; i++) { const x = w * (-.2 + p * 1.1 - i * .12); ctx.fillStyle = '#e8e8e8'; FIG.draw(ctx, x, h * .88, h * .14, P.stand, { color: '#1a1a1a', helmet: '#f0f0f0', shadow: false, simple: true }); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x - h * .03, h * .88, h * .02, 0, 7); ctx.arc(x + h * .03, h * .88, h * .02, 0, 7); ctx.fill(); }
      const cx = w * (-.7 + p * 1.1); FIG.car(ctx, cx, h * .88, h * .12, '#101010', true, 1); ctx.fillStyle = '#0b6b3a'; ctx.fillRect(cx + h * .1, h * .88 - h * .1, h * .03, h * .02);
      FIG.car(ctx, cx - w * .2, h * .88, h * .11, '#1a1a1a', true, 1);
    };
  }
  function oath(over) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S.office(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .25);
      H.godRays(ctx, w * .5, -h * .1, w, h, t, '255,230,180', 14, .06);
      H.flag(ctx, w * .82, h * .2, w * .12, w * .075, t, true);
      portrait(ctx, w, h, t, 'hero', 'neutral', { x: .45, crop: 'bust', hgt: 1.0, bottom: 1.1, light: '255,230,190', talk: p > .2 && p < .8, over });
      for (let i = 0; i < 14; i++) if (Math.random() < .02) fx.sparks(w * Math.random(), h * .2 * Math.random(), 4, '255,240,200');
    };
  }
  function guns(scene) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt);
      for (let i = 0; i < 4; i++) { const x = w * (.15 + i * .22), y = h * .88; ctx.fillStyle = '#3a4030'; ctx.beginPath(); ctx.arc(x, y - h * .03, h * .035, 0, 7); ctx.fill(); ctx.save(); ctx.translate(x, y - h * .05); ctx.rotate(-.5); ctx.fillRect(0, -h * .01, h * .16, h * .02); ctx.restore(); FIG.draw(ctx, x - h * .07, y, h * .25, P.stand, sol({ helmet: null, beret: '#1f2a1c', rifle: false })); }
      const k = Math.floor(p * 7); if (k !== st.k) { st.k = k; const i = k % 4; fx.boom(w * (.15 + i * .22) + h * .14, h * .88 - h * .12, .35); SFX.boom(); }
    };
  }
  function montageCard(text, sub, scene) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); X.dark(ctx, w, h, .55);
      X.headline(ctx, w * .5, h * .5, Math.min(w * .7, h * 1.1), -.04 + Math.sin(t * .5) * .02, text, sub);
    };
  }
  const shot = (d, who, cap, draw, extra = {}) => Object.assign({ d, who, cap, draw }, extra);
  const TENSE = 'contrast(1.2) saturate(.7)';

  L.ml_night = [
    shot(6, 'GHQ, 2300 hours', 'Six corps commanders around one table. Nobody has touched the tea.', generals(), { grade: TENSE }),
    shot(5.5, 'The order', '"Operation Fair Dawn. Execute."', face('office', 'hero', 'determined', UNI, { dark: .55, light: '255,170,110', p: { shade: .65 } }), { grade: TENSE, cam: [0, 1.0, 0, 1.12] }),
    shot(5.5, 'Rawalpindi cantonment, 2340', 'The gates open. The trucks roll out with their lights on.', convoy('road_night', .2), { grade: TENSE }),
    shot(5.5, 'Murree Road', 'Mile after mile of them. Drivers who were asleep an hour ago.', convoy('avenue', .45), { grade: TENSE }),
    shot(6, 'Constitution Avenue, 0010', 'Armour on the avenue for the first time in a generation.', tanks('avenue', .4), { grade: TENSE }),
    shot(5.5, 'Over Islamabad', 'Searchlights sweep the roofs of the parliament.', helis('avenue', .5), { grade: TENSE }),
    shot(5.5, 'PTV headquarters, 0025', 'A captain asks the night editor, very politely, to step away from the controls.', checkpoint('office', .5), { grade: TENSE }),
    shot(5.5, 'Prime Minister\'s House, 0040', 'Two companies surround the building. The lights inside go out one by one.', checkpoint('avenue', .5), { grade: TENSE }),
    shot(5, 'Telephone exchange, 0100', 'Every phone line in the capital goes dead at the same moment.', (ctx, w, h, p, t, dt, fx, st) => { ctx.fillStyle = '#050505'; ctx.fillRect(0, -h * .2, w, h * 1.4); for (let i = 0; i < 500; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * .35 * (1 - p)})`; ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 40, 1.5); } X.big(ctx, w, 'NO SIGNAL', h * .5, Math.min(w * .1, 60), `rgba(239,233,214,${1 - p * .6})`); }, { grade: TENSE }),
  ];
  L.ml_curfew = [
    shot(5.5, 'Karachi, 0600', 'The biggest city in the country wakes up to silence.', emptyStreet('karachi'), { grade: TENSE }),
    shot(5.5, 'Lahore, Mall Road', 'Shutters down. A patrol jeep, a stray dog, nothing else.', emptyStreet('street'), { grade: TENSE }),
    shot(5.5, 'Every city', 'Checkpoints at every bridge and every crossing.', checkpoint('road_night', .3), { grade: TENSE }),
    shot(5.5, 'Peshawar', 'Trucks of soldiers outside the governor\'s house.', convoy('quetta', 0), {}),
    shot(5.5, 'Over the capital, 1000', 'Jets fly low over Islamabad. Everybody is meant to hear them.', jets('avenue'), {}),
    shot(5.5, 'A village near ' + '{town}', 'Your father\'s old friends gather around the only television in the village.', tv('BREAKING NEWS', 'Martial law declared across the country', 'hero', 'determined', UNI, 'Curfew in all major cities  •  Parliament dissolved  •  Constitution suspended'), {}),
    shot(5.5, 'A balcony in Rawalpindi', 'A boy watches the tanks from behind his mother\'s dupatta.', tanks('street', .15), {}),
    shot(5, 'Ayesha', '"You promised me. You promised your father."', face('home', 'ayesha', 'sad', null, { dark: .4, rain: true, light: '200,210,240' }), { grade: TENSE }),
    shot(5, 'Bilal', '"I always said you would become a general and forget me. I did not think you would forget everything else too."', face('home', 'bilal', 'angry', null, { dark: .45 }), { grade: TENSE }),
  ];
  L.ml_address = [
    shot(5.5, 'PTV studio, 2100', 'The lights. The flag behind you. A teleprompter that somebody else wrote.', face('office', 'hero', 'neutral', UNI, { dark: .2, light: '255,250,235' }), { cam: [0, 1.0, 0, 1.08] }),
    shot(6.5, 'Address to the nation', '"Mere aziz hamwatno. My dear countrymen. I did not seek this responsibility."', tv('ADDRESS TO THE NATION', 'Chief Martial Law Administrator', 'hero', 'determined', UNI, 'Live from Rawalpindi'), {}),
    shot(6, 'Address to the nation', '"The institutions of the state had stopped working. The army has stepped in only to restore order."', face('office', 'hero', 'determined', UNI, { dark: .25, talk: true, light: '255,245,225' }), { cam: [0, 1.04, 0, 1.12] }),
    shot(6, 'Address to the nation', '"Elections will be held as soon as conditions allow." Somewhere a speechwriter winces.', tv('ADDRESS TO THE NATION', '', 'hero', 'neutral', UNI, 'Elections "as soon as conditions allow"'), {}),
    shot(5.5, 'Outside the press club', 'Some cheer. The traders want order and cheaper flour.', crowd('street', 'cheer'), {}),
    shot(5.5, 'Outside the High Court', 'Some do not. Lawyers in black coats sit down on the road.', crowd('avenue', 'protest'), { grade: TENSE }),
    shot(5.5, 'Foreign capitals', 'Statements of "deep concern". Aid is "under review".', montageCard('WORLD URGES RETURN TO DEMOCRACY', 'Aid programmes under review', 'office'), {}),
    shot(5, 'Your study, midnight', 'Abba\'s photograph on the wall. You turn it to face the other way.', face('home', 'hero', 'sad', UNI, { dark: .55, light: '255,190,120', p: { shade: .7 } }), { grade: TENSE }),
  ];
  L.ml_president = [
    shot(5.5, 'Two years later', 'A referendum. One question. A yes that is very, very large.', montageCard('98% SAY YES', 'Turnout figures disputed', 'avenue'), {}),
    shot(6, 'Aiwan-e-Sadr', 'You put away the uniform for the first time in forty years.', face('office', 'hero', 'neutral', PRES, { dark: .2, light: '255,235,200' }), { cam: [0, 1.0, 0, 1.08] }),
    shot(6.5, 'The oath', '"I do solemnly swear..." The words are the same words. The room is not.', oath(PRES), {}),
    shot(5.5, 'Twenty-one guns', 'The salute rolls across the capital.', guns('parade'), {}),
    shot(5.5, 'The President', 'Outriders, sirens, a road cleared for twenty kilometres.', motorcade('valley'), {}),
    shot(5.5, 'Guard of honour', 'The same parade ground where you once stood shaking as a cadet.', (ctx, w, h, p, t, dt, fx, st) => { S.parade(ctx, w, h, t, st, dt); for (let i = 0; i < 9; i++) FIG.draw(ctx, w * (.08 + i * .1), h * .86, h * .26, P.salute, sol({ helmet: null, beret: '#1f2a1c', rifle: false })); FIG.draw(ctx, w * (.1 + p * .7), h * .93, h * .34, marchPose(t, 3), { color: '#efe0bb', skin: '#c38c60' }); if (!st.f) { st.f = 1; SFX.fanfare(); } }, {}),
    shot(5.5, 'State visit', 'Red carpets in foreign capitals. Handshakes that last exactly as long as the cameras.', (ctx, w, h, p, t, dt, fx, st) => { const g = ctx.createLinearGradient(0, -h * .2, 0, h); g.addColorStop(0, '#7aa4c8'); g.addColorStop(1, '#dfe8ee'); ctx.fillStyle = g; ctx.fillRect(0, -h * .2, w, h * 1.4); ctx.fillStyle = '#8a8e88'; ctx.fillRect(0, h * .84, w, h * .4); FIG.plane(ctx, w * (.3 + p * .1), h * .72, h * .22, '#eef0ee'); ctx.fillStyle = '#0b6b3a'; ctx.fillRect(w * (.3 + p * .1) - h * .18, h * .71, h * .12, h * .025); ctx.fillStyle = '#9a1e1e'; ctx.beginPath(); ctx.moveTo(w * .42, h * .86); ctx.lineTo(w * 1.05, h * .86); ctx.lineTo(w * 1.05, h * .92); ctx.lineTo(w * .4, h * .92); ctx.fill(); for (let i = 0; i < 5; i++) FIG.draw(ctx, w * (.6 + i * .08), h * .86, h * .26, i === 0 ? P.salute : P.stand, { color: i === 0 ? '#efe0bb' : '#1a1a2a', skin: '#c99468', facing: -1 }); [.55, .95].forEach(x => H.flag(ctx, x * w, h * .45, w * .08, w * .05, t, true)); }, {}),
    shot(5, 'The President', 'Everyone says yes now. That is the most dangerous thing of all.', face('office', 'hero', 'neutral', PRES, { dark: .45, light: '255,200,150', p: { shade: .6 } }), { grade: TENSE }),
  ];
  L.ml_years = [
    shot(5.5, 'Year three', 'A motorway opens. You cut the ribbon. The cameras love it.', montageCard('NEW MOTORWAY OPENED', 'President inaugurates 400 km road', 'valley'), {}),
    shot(5.5, 'Year three', 'A new dam on the Indus. Ten thousand workers. Your name on the plaque.', montageCard('KOHSAR DAM PROJECT LAUNCHED', 'President lays foundation stone', 'dam'), {}),
    shot(5.5, 'Year four', 'Eid at home. Your son\'s chair is empty. He sent a message: "Busy."', face('home', 'ayesha', 'sad', null, { dark: .4, light: '255,200,140', who2: 'hero', mood2: 'sad', over2: PRES }), {}),
    shot(5.5, 'Year four', 'Flour prices fall. Then rise again. The traders stop cheering.', crowd('street', 'protest'), {}),
    shot(5.5, 'Year five', 'Journalists who ask the wrong questions find their channels taken off the air.', tv('PROGRAMME SUSPENDED', '', 'rabia', 'angry', null, 'Licence of private channel cancelled'), { grade: TENSE }),
    shot(5.5, 'Year six', 'The lawyers march again. This time, the students march with them.', crowd('avenue', 'protest'), { grade: TENSE }),
    shot(5.5, 'Year six', 'Riot police, tear gas, a burning tyre on Mall Road.', (ctx, w, h, p, t, dt, fx, st) => { S.street(ctx, w, h, t, st, dt); night(ctx, w, h, .3); SCENES.helpers.fire(ctx, w * .5, h * .86, h * .12, t, st, dt); H.smoke(ctx, st, 'sm_gas', w * .5, h * .8, dt, '200,200,200', 8, 2); for (let i = 0; i < 6; i++) FIG.draw(ctx, w * (.08 + i * .06), h * .9, h * .28, P.stand, { color: '#1a2a3a', helmet: '#222', simple: true }); for (let i = 0; i < 8; i++) FIG.draw(ctx, w * (.62 + i * .05), h * (.88 + (i % 2) * .02), h * .24, runPose(t + i), { color: '#4a3a2a', simple: true, facing: -1 }); }, { grade: TENSE }),
    shot(5.5, 'GHQ', 'Your own corps commanders begin to meet without you.', generals(.55), { grade: TENSE }),
    shot(5, 'The President', 'You wanted to save the country. Somewhere along the way you became the thing it needed saving from.', face('office', 'hero', 'sad', PRES, { dark: .55, light: '200,200,230', p: { shade: .7 } }), { grade: TENSE }),
  ];
  L.ml_handover = [
    shot(6, 'Polling day', 'Free elections, under observers from twenty countries. Queues around the block.', crowd('village', 'cheer'), {}),
    shot(6, 'Aiwan-e-Sadr', 'You hand the seal of office to an elected Prime Minister, and walk out without looking back.', oath({ outfit: 'suit', hat: 'none', gray: .9 }), {}),
    shot(5.5, 'The village', 'The road home is the same road. The photograph on the wall faces the room again.', (ctx, w, h, p, t, dt, fx, st) => { S.village(ctx, w, h, t, st, dt); FIG.car(ctx, w * (.1 + p * .5), h * .87, h * .1, '#2a2a2a', false, 1); }, {}),
  ];
  L.ml_exile = [
    shot(5.5, 'Rawalpindi, 0400', 'The corps commanders come to see you together. They do not sit down.', generals(.6), { grade: TENSE }),
    shot(6, 'Chaklala airbase', 'A plane on the runway with its engines already running. One suitcase.', (ctx, w, h, p, t, dt, fx, st) => { S.road_night(ctx, w, h, t, st, dt); night(ctx, w, h, .3); FIG.plane(ctx, w * (.4 + Math.max(0, p - .5) * 1.6), h * (.8 - Math.max(0, p - .6) * .9), h * .2, '#d8dcd8'); }, { grade: TENSE }),
    shot(5.5, 'London', 'A flat in the rain. Newspapers from home, two days late.', face('home', 'hero', 'sad', { outfit: 'suit', hat: 'none', gray: 1 }, { dark: .5, rain: true, light: '190,200,230' }), { grade: TENSE }),
  ];

  window.STORY_SRC.push(`
=== 58 | office | The emergency | id: ml_crisis | if: rank==11 && !flag.junta
* A disputed election. Six weeks of riots. The rupee in free fall. Every channel shouting.
@npc malik
General Tariq Malik: The corps commanders are with you, Chief. One word and we restore order by morning. Nobody will blame you. Half the country is begging for it.
@npc pm
The Prime Minister: General, I know what they are telling you. I am asking you, as a soldier who took an oath: give us ninety days and the courts.
@npc off
?!20 The country is waiting for your answer.
- Back the courts and the election commission. The army stays in its barracks. {honor+14 leadership+4 flag:heldOath} -> oath
- Impose martial law. Somebody has to fix this. {honor-25 courage+4 flag:martial} -> ml
:oath
* You go on television in uniform for ninety seconds. "The army is with the constitution." The riots do not stop overnight. But they stop.
@log Refused to impose martial law during the election crisis.
@history Held to the oath in the emergency
@goto ml_end
:ml
@title Operation Fair Dawn | 2300 hours
@cut ml_night
? The Prime Minister is under guard. What happens to him?
- House arrest, with his family, and a doctor. {honor-2} -> pm1
- Let him fly abroad tonight. {honor+2 flag:pmExile} -> pm1
- Charge him with corruption. A trial will make the people trust us. {honor-8 flag:pmTrial} -> pm1
:pm1
@cut ml_curfew
? Every channel is asking to go back on air.
- Keep the press open. Let them criticise. {honor+5 flag:freePress} -> pr
- Take them off air until things calm down. {honor-6 perf+3 flag:censor} -> pr
:pr
@cut ml_address
? The speech is drafted. One line is left blank: when will there be elections?
- "Within ninety days." {honor+4 flag:promised90}
- "As soon as conditions allow." {honor-4}
@fx happy-6
@log Imposed martial law as Chief of the Army Staff. Curfew across the country.
@history Imposed martial law
@cut ml_president
@log Took the oath as President.
@history Sworn in as President
:ml_end

=== 59 | office | The President | id: ml_years_ev | if: flag.martial
@cut ml_years
* Six years in the President's House. The rooms are very large and very quiet.
@npc rabia
Rabia Qazi: Off the record, Mr President. Is there anything you would do differently?
@npc off
?!20 The lawyers are on Constitution Avenue again. Your corps commanders have asked for a meeting. Tonight you decide how this ends.
- Announce free elections under international observers, and step down when they are done. {honor+18 happy+6 flag:handover} -> hand
- Stay. The country still needs you. {honor-10 flag:stayed} -> stay
:hand
@cut ml_handover
@end restored
:stay
@if honor<35 -> ex
@end junta
:ex
@cut ml_exile
@end exile
`);

  Object.assign(window.ENDINGS, {
    restored: S => ({ kicker: 'President (Retd)', title: 'The General Who Gave It Back', text: `General ${S.name} took power on a night of tanks and curfews, ruled for six years, and then did the one thing almost nobody in his chair ever does: held a free election and walked out of the President's House. Historians still argue about the first part. Nobody argues about the last.` }),
    exile: S => ({ kicker: 'Exile', title: 'A Flat in London', text: `General ${S.name}, President of Pakistan, left the country at four in the morning with one suitcase, after his own corps commanders told him it was over. He spent his last years in a rented flat in London, reading newspapers from home two days late, and writing a memoir that nobody published.` }),
  });
})();
