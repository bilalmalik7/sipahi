// Round seven: married life, attacks in Balochistan, and ISI briefings on relations with other
// countries. Each chapter has its own cutscene. Groups and operations are invented.
(() => {
  const S = SCENES.S, H = SCENES.helpers, P = FIG.P, L = CUT.LIB, portrait = CUT.portrait, X = CUT.H2, A = () => GAMES.art;
  const sol = (o = {}) => Object.assign({ color: '#4c5634', helmet: '#3a4028', rifle: true, vest: true, skin: '#a8754e' }, o);
  const fc = (o = {}) => sol(Object.assign({ color: '#6a6a4a', helmet: null, beret: '#2a3a24' }, o));
  const runPose = (t, sp = 10) => FIG.lerp(P.run1, P.run2, (Math.sin(t * sp) + 1) / 2);
  const shot = (d, who, cap, draw, extra = {}) => Object.assign({ d, who, cap, draw }, extra);
  const TENSE = 'contrast(1.18) saturate(.75)', WARM = 'contrast(1.05) saturate(1.1) sepia(.12)';

  Object.assign(window.NPCS, {
    liwei: { name: 'Mr Li Wei', role: 'Project director', look: { outfit: 'suit', hair: '#111', glasses: true, skin: '#e8c6a0', age: 48 } },
    rashid: { name: 'Sheikh Rashid', role: 'Emirati official', look: { outfit: 'kurta', color: '#f4f2ec', hat: 'wrap', wrapC: '#f4f2ec', beard: 'full', skin: '#c99468', age: 52 } },
    bahrami: { name: 'General Bahrami', role: 'Border commander', look: { outfit: 'combat', rank: 8, hat: 'beret', beretC: '#3a3a2a', beard: 'full', gray: .5, skin: '#d4a07a', age: 55 } },
    envoy: { name: 'The envoy', role: 'Back-channel', look: { outfit: 'suit', gray: .8, glasses: true, moustache: true, skin: '#c99468', age: 63 } },
    mengal: { name: 'Sardar Mir Hazar', role: 'Tribal elder', look: { outfit: 'kurta', color: '#e8e2d0', hat: 'wrap', wrapC: '#8a2a2a', beard: 'full', gray: .8, skin: '#a8754e', age: 70 } },
  });

  // ---- painters ----
  function twoShot(scene, a, ma, b, mb, o = {}) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S[scene](ctx, w, h, t, st, dt); X.dark(ctx, w, h, o.dark ?? .3, o.tint || '0,0,0');
      if (o.lamp) H.lamp(ctx, w * .5, h * .45, h * .8, t, '255,200,130', .4);
      if (o.rain) X.rainOver(ctx, w, h, t, .3);
      portrait(ctx, w, h, t, b, mb, { x: .68, crop: 'bust', hgt: .95, bottom: 1.1, light: o.light || '255,215,170', side: -1, talk: o.talkB, over: o.overB });
      portrait(ctx, w, h, t, a, ma, { x: .3, crop: 'bust', hgt: .95, bottom: 1.1, flip: true, light: o.light || '255,215,170', talk: o.talkA, over: o.overA });
    };
  }
  function split(sceneA, sceneB, a, ma, b, mb) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      ctx.save(); ctx.beginPath(); ctx.rect(0, -h * .2, w / 2 - 2, h * 1.4); ctx.clip(); S[sceneA](ctx, w, h, t, st.a || (st.a = {}), dt); X.dark(ctx, w, h, .45, '0,8,20'); portrait(ctx, w, h, t, a, ma, { x: .25, crop: 'bust', hgt: .9, bottom: 1.1, talk: Math.sin(t * .8) > 0, light: '200,215,255' }); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(w / 2 + 2, -h * .2, w / 2, h * 1.4); ctx.clip(); S[sceneB](ctx, w, h, t, st.b || (st.b = {}), dt); X.dark(ctx, w, h, .4); portrait(ctx, w, h, t, b, mb, { x: .75, crop: 'bust', hgt: .9, bottom: 1.1, talk: Math.sin(t * .8) <= 0, light: '255,210,160' }); ctx.restore();
      ctx.fillStyle = '#000'; ctx.fillRect(w / 2 - 2, -h * .2, 4, h * 1.4);
    };
  }
  function desertRoad(dark) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      S.valley(ctx, w, h, t, st, dt); if (dark) X.dark(ctx, w, h, dark, '10,5,0');
      ctx.fillStyle = '#4a4036'; ctx.fillRect(0, h * .82, w, h * .1); ctx.strokeStyle = 'rgba(230,210,150,.6)'; ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 120; ctx.beginPath(); ctx.moveTo(0, h * .87); ctx.lineTo(w, h * .87); ctx.stroke(); ctx.setLineDash([]);
    };
  }
  function isiRoom(country, region, colors, dgLine) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      ctx.fillStyle = '#0a0e12'; ctx.fillRect(0, -h * .2, w, h * 1.4);
      // the wall map with the region lit up
      const mx = w * .52, my = h * .1, mw = w * .44, mh = h * .5;
      ctx.fillStyle = '#122030'; ctx.fillRect(mx, my, mw, mh); ctx.strokeStyle = 'rgba(90,160,220,.25)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(mx + i * mw / 8, my); ctx.lineTo(mx + i * mw / 8, my + mh); ctx.stroke(); }
      for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(mx, my + i * mh / 5); ctx.lineTo(mx + mw, my + i * mh / 5); ctx.stroke(); }
      ctx.fillStyle = 'rgba(60,110,80,.55)'; ctx.beginPath(); ctx.moveTo(mx + mw * .3, my + mh * .2); ctx.lineTo(mx + mw * .52, my + mh * .15); ctx.lineTo(mx + mw * .6, my + mh * .45); ctx.lineTo(mx + mw * .5, my + mh * .8); ctx.lineTo(mx + mw * .32, my + mh * .7); ctx.closePath(); ctx.fill();
      const [rx, ry] = region, pulse = .5 + .5 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(230,80,60,${.35 + pulse * .3})`; ctx.beginPath(); ctx.arc(mx + mw * rx, my + mh * ry, mh * (.08 + pulse * .03), 0, 7); ctx.fill();
      ctx.strokeStyle = '#ffcf4a'; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 30; ctx.beginPath(); ctx.moveTo(mx + mw * .45, my + mh * .45); ctx.lineTo(mx + mw * rx, my + mh * ry); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ffcf4a'; ctx.font = `${Math.max(11, h * .03)}px "Barlow Condensed", sans-serif`; ctx.fillText(country.toUpperCase(), mx + mw * rx + 10, my + mh * ry - 8);
      colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(mx + mw - 46, my + 8 + i * 8, 38, 8); });
      ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let y = my; y < my + mh; y += 3) ctx.fillRect(mx, y, mw, 1);
      ctx.fillStyle = 'rgba(200,30,30,.8)'; ctx.font = `${Math.max(10, h * .025)}px "Share Tech Mono", monospace`; ctx.fillText('TOP SECRET // EYES ONLY', mx, my + mh + h * .04);
      H.lamp(ctx, w * .3, h * .3, h * .7, t, '255,220,170', .2);
      portrait(ctx, w, h, t, 'dg', 'neutral', { x: .26, crop: 'bust', hgt: .95, bottom: 1.1, light: '170,200,255', side: 1, talk: true });
    };
  }
  function cityArrival(mark, colors, sky = ['#7aa4c8', '#dfe8ee']) {
    return (ctx, w, h, p, t, dt, fx, st) => {
      const g = ctx.createLinearGradient(0, -h * .2, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); ctx.fillStyle = g; ctx.fillRect(0, -h * .2, w, h * 1.4);
      H.skyline(ctx, w, h, h * .8, 11, 'rgba(60,70,84,.55)', t, false);
      X.landmark(ctx, mark, w * .7, h * .84, h * .45, '#3a4250');
      ctx.fillStyle = '#5a5e58'; ctx.fillRect(0, h * .84, w, h * .4);
      colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(w * .12, h * .3 + i * h * .03 + Math.sin(t * 3 + i) * 2, w * .1, h * .03); }); ctx.fillStyle = '#aaa'; ctx.fillRect(w * .12 - 3, h * .3, 3, h * .54);
      FIG.car(ctx, w * (-.1 + p * .7), h * .9, h * .09, '#141414', false, 1);
    };
  }

  // ---- married life ----
  L.married_quarters = [
    shot(5, 'Married quarters, block C', 'Two rooms, a veranda, a geyser that works on alternate Thursdays. Your first home together.', twoShot('home', 'hero', 'happy', 'ayesha', 'happy', { lamp: true, talkB: true }), { grade: WARM }),
    shot(4.5, 'The veranda', 'Tea in mismatched cups. She has already rearranged everything twice.', (ctx, w, h, p, t, dt, fx, st) => { S.barracks(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .25, '40,20,0'); FIG.draw(ctx, w * .4, h * .9, h * .38, P.kneel, { color: '#efece4', skin: '#c38c60' }); FIG.draw(ctx, w * .58, h * .9, h * .38, P.kneel, { color: '#7a2d4a', skin: '#e2b48e', facing: -1 }); ctx.fillStyle = '#f2ece0'; ctx.fillRect(w * .48, h * .78, w * .03, h * .025); H.smoke(ctx, st, 'sm_tea', w * .495, h * .77, dt, '255,255,255', 2, .3); }, { grade: WARM }),
  ];
  L.phone_night = [
    shot(6, 'Two places, one phone line', 'You at a post at fourteen thousand feet. She at home with a sick child and a hospital shift at seven.', split('snowpost', 'home', 'hero', 'sad', 'ayesha', 'angry'), { grade: TENSE }),
  ];
  L.anniversary = [
    shot(5.5, 'Margalla Hills, 2100', 'A table by the window, the whole of Islamabad lit up below you.', (ctx, w, h, p, t, dt, fx, st) => { S.avenue(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .35); H.lamp(ctx, w * .5, h * .7, h * .5, t, '255,190,110', 1); portrait(ctx, w, h, t, 'ayesha', 'happy', { x: .68, crop: 'bust', hgt: .9, bottom: 1.1, light: '255,190,120', side: -1, talk: true, over: { outfit: 'female', color: '#7a2d4a', dupatta: '#e0b45a' } }); portrait(ctx, w, h, t, 'hero', 'happy', { x: .3, crop: 'bust', hgt: .9, bottom: 1.1, flip: true, light: '255,190,120', over: { outfit: 'suit', hat: 'none' } }); }, { grade: WARM }),
  ];
  L.school_day = [
    shot(5, 'Annual day, Army Public School', 'Two hundred parents, one folding chair saved in the front row.', (ctx, w, h, p, t, dt, fx, st) => { S.school(ctx, w, h, t, st, dt); for (let i = 0; i < 6; i++) FIG.draw(ctx, w * (.2 + i * .12), h * .9, h * .22, Math.sin(t * 4 + i) > 0 ? P.jump : P.stand, { color: ['#efece4', '#2f6fd6'][i % 2], skin: '#c38c60' }); }, { grade: WARM }),
    shot(4.5, 'Your child', 'Searching the rows for one face.', (ctx, w, h, p, t, dt, fx, st) => { S.school(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .25); const kid = (window.GAME && GAME.S && GAME.S.kids[0] && GAME.S.kids[0].g === 'f') ? 'daughter' : 'son'; portrait(ctx, w, h, t, kid, 'happy', { x: .5, crop: 'bust', hgt: .75, bottom: 1.1, light: '255,230,190' }); }, { grade: WARM }),
  ];
  L.proud_wife = [
    shot(5.5, 'AFIC, Rawalpindi', '"Head of Cardiology: Brigadier Dr Ayesha." The plaque goes up. You clap the loudest.', (ctx, w, h, p, t, dt, fx, st) => { S.hospital(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .1); portrait(ctx, w, h, t, 'ayesha', 'happy', { x: .55, crop: 'bust', hgt: 1.0, bottom: 1.1, light: '235,245,255', over: { outfit: 'doctor', glasses: true } }); if (Math.random() < .3) fx.sparks(w * Math.random(), h * .3 * Math.random(), 3, '255,220,120'); }, {}),
  ];
  L.empty_house = [
    shot(5.5, 'An empty house', 'The children have gone to their own lives. Two plates at the table now. It is very quiet.', twoShot('home', 'hero', 'sad', 'ayesha', 'neutral', { lamp: true, dark: .45 }), { grade: WARM }),
    shot(4.5, 'The veranda, again', 'Tea in the same mismatched cups. Some things you keep.', (ctx, w, h, p, t, dt, fx, st) => { S.village(ctx, w, h, t * .3, st, dt); X.dark(ctx, w, h, .2, '60,30,0'); FIG.draw(ctx, w * .44, h * .9, h * .36, P.kneel, { color: '#e8e2d0', skin: '#c38c60', hair: '#bbb' }); FIG.draw(ctx, w * .56, h * .9, h * .36, P.kneel, { color: '#7a2d4a', skin: '#e2b48e', facing: -1 }); }, { grade: WARM }),
  ];

  // ---- Balochistan ----
  L.convoy_ambush = [
    shot(5, 'Coastal highway, near Turbat', 'A Frontier Corps convoy, four trucks of engineers and their escort. Three hundred kilometres of nothing.', (ctx, w, h, p, t, dt, fx, st) => { desertRoad(0)(ctx, w, h, p, t, dt, fx, st); for (let i = 0; i < 4; i++) A().truck(ctx, w * (-.2 + p * .9 - i * .2), h * .86, h * .08, '#6a6a4a', 'truck', t); }, {}),
    shot(4, 'Kilometre 212', 'The second truck goes up in a sheet of flame.', (ctx, w, h, p, t, dt, fx, st) => { desertRoad(0)(ctx, w, h, p, t, dt, fx, st); A().truck(ctx, w * .3, h * .86, h * .08, '#6a6a4a', 'truck', t); A().truck(ctx, w * .55, h * .86, h * .08, '#2a2620', 'truck', t); H.fire(ctx, w * .55, h * .8, h * .1, t, st, dt); H.smoke(ctx, st, 'sm_ied', w * .55, h * .76, dt, '40,36,32', 7, 2); if (!st.b) { st.b = 1; fx.boom(w * .55, h * .8, 1.4); SFX.boom(); } if (Math.random() < .3) fx.tracer(w * (.8 + Math.random() * .2), h * .6, w * (.35 + Math.random() * .3), h * .8, '255,140,90'); }, { grade: TENSE, flash: true }),
    shot(4.5, 'Quick reaction force', 'You are forty minutes away by road. Eleven by helicopter.', (ctx, w, h, p, t, dt, fx, st) => { S.valley(ctx, w, h, t, st, dt); FIG.heli(ctx, w * (.1 + p * .7), h * (.3 + Math.sin(t * 2) * .01), h * .1, t, '#1d2420'); FIG.heli(ctx, w * (-.05 + p * .7), h * .22, h * .07, t, '#232a26'); if (!st.s || t - st.s > .9) { st.s = t; SFX.heli(); } }, { grade: TENSE }),
  ];
  L.port_attack = [
    shot(5, 'Gwadar, 0200', 'The harbour lights, the cranes, the hotel on the hill where the engineers sleep.', (ctx, w, h, p, t, dt, fx, st) => { S.port(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .2, '0,8,20'); }, { grade: TENSE }),
    shot(4.5, 'Contact', 'Muzzle flashes on the hillside. An RPG streaks across the water.', (ctx, w, h, p, t, dt, fx, st) => { S.port(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .3, '0,8,20'); const k = (p * 2) % 1; ctx.strokeStyle = 'rgba(255,190,90,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .9, h * .5); ctx.lineTo(w * (.9 - k * .6), h * (.5 + k * .2)); ctx.stroke(); if (k > .95 && !st['b' + Math.floor(p * 2)]) { st['b' + Math.floor(p * 2)] = 1; fx.boom(w * .3, h * .7, 1); SFX.boom(); } for (let i = 0; i < 3; i++) if (Math.random() < .3) FIG.muzzle(ctx, w * (.8 + i * .05), h * (.45 + i * .03), 8, 0, -1); }, { grade: TENSE }),
  ];
  L.jirga = [
    shot(5.5, 'Jirga at Dera Bugti', 'Forty elders in a circle on the carpets. Green tea, long silences, longer memories.', (ctx, w, h, p, t, dt, fx, st) => { S.valley(ctx, w, h, t, st, dt); X.dark(ctx, w, h, .25, '40,20,0'); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI, x = w * (.5 + Math.cos(a) * .38), y = h * (.88 - Math.sin(a) * .1); FIG.draw(ctx, x, y, h * .22, P.kneel, { color: ['#e8e2d0', '#d0c8b0', '#f0ece2'][i % 3], skin: '#a8754e', facing: x < w / 2 ? 1 : -1, scarf: null }); } }, { grade: WARM }),
    shot(5, 'Sardar Mir Hazar', '"Your soldiers came with guns before. If you come with schools this time, we will listen."', twoShot('valley', 'hero', 'neutral', 'mengal', 'neutral', { talkB: true, light: '255,200,140' }), { grade: WARM }),
  ];

  // ---- ISI briefings and foreign capitals ----
  L.isi_kabul = [
    shot(5.5, 'ISI headquarters, Aabpara', '"An aid convoy was taken twenty kilometres across the border. One of the hostages is ours. Kabul wants to help, quietly."', isiRoom('Afghanistan', [.36, .3], ['#000', '#c00', '#080'])),
    shot(4.5, 'Kabul', 'A guesthouse near the old city. Your counterpart is late, polite and very careful.', cityArrival('mosque', ['#000', '#b00', '#070'], ['#b8c8d8', '#e8e0d0'])),
  ];
  L.isi_dubai = [
    shot(5.5, 'ISI headquarters, Aabpara', '"The network\'s money moves through Dubai. The Emiratis will open the books, if we ask the right way."', isiRoom('UAE', [.24, .72], ['#00732f', '#fff', '#000'])),
    shot(4.5, 'Dubai', 'Glass towers in the heat haze. Sheikh Rashid receives you in a room colder than Siachen.', cityArrival('tower', ['#00732f', '#fff', '#000'], ['#e8c890', '#f6e8c8'])),
  ];
  L.isi_beijing = [
    shot(5.5, 'ISI headquarters, Aabpara', '"Three threats against the Chinese engineers on the corridor this month. Beijing wants a joint security cell."', isiRoom('China', [.86, .18], ['#de2910', '#de2910', '#de2910'])),
    shot(4.5, 'Beijing', 'A long table, translators on both sides, and more tea than anyone can drink.', cityArrival('pagoda', ['#de2910', '#de2910', '#de2910'], ['#c8b8a0', '#e8dcc8'])),
  ];
  L.isi_tehran = [
    shot(5.5, 'ISI headquarters, Aabpara', '"A border post on the Iranian side was hit from our territory. Tehran is furious. Someone wants us fighting each other."', isiRoom('Iran', [.12, .45], ['#239f40', '#fff', '#da0000'])),
    shot(4.5, 'Taftan border crossing', 'Two flags, one gate, and two generals who both want this to end today.', twoShot('quetta', 'hero', 'determined', 'bahrami', 'neutral', { talkB: true, overA: { outfit: 'combat', hat: 'beret' } })),
  ];
  L.isi_backchannel = [
    shot(5.5, 'ISI headquarters, Aabpara', '"After the border crisis, both capitals want a way down from the tree. Officially, this meeting never happens."', isiRoom('A neighbour', [.78, .52], ['#888', '#bbb', '#888'])),
    shot(5, 'A hotel suite, neutral ground', 'Two old men, two cups of coffee, and no notes taken.', twoShot('office', 'hero', 'neutral', 'envoy', 'neutral', { talkB: true, dark: .45, lamp: true, overA: { outfit: 'suit', hat: 'none' } }), { grade: TENSE }),
  ];

  window.STORY_SRC.push(`
=== 28 | home | Our first home | id: wife_home | if: married
@cut married_quarters
@npc ayesha happy
Ayesha(happy): The CMH in Karachi has offered me a cardiology fellowship. Two years. You are posted to Quetta for at least two more.
? Your wife's career, your posting, and a thousand kilometres between them.
- "Take it. We will manage the distance." {rel.ayesha+12 happy-3 honor+2 flag:ayeshaFellow} -> fel
- "Could you ask them to wait two years?" {rel.ayesha-10 happy+2} -> wait
:fel
Ayesha(happy): I knew you'd say that. I already bought you a phone card.
@goto wh_end
:wait
Ayesha(sad): They won't wait. But all right. For now.
:wh_end
@npc off
@log Set up our first home in married quarters.

=== 30 | quetta | Kilometre 212 | id: baloch_convoy | if: rank>=4
@cut convoy_ambush
* An FC convoy carrying engineers has been ambushed on the coastal highway. You command the quick reaction force.
@game assault {"scene":"quetta","enemies":7,"hostages":2,"length":10,"diff":3,"seed":52,"title":"Kilometre 212","kicker":"Balochistan","intro":"Insurgents have pinned the convoy in a dry riverbed. Two engineers are trapped in a truck cab."}
@ifwin bc_ok
* You get there late. Four men are dead. The engineers survive, barely.
@fx perf-3 happy-5
@goto bc_q
:bc_ok
* The ambushers scatter into the hills. Every engineer goes home.
@fx perf+6 courage+3
:bc_q
? The tracks lead to a village in the next valley.
- Cordon and search the whole village at dawn. {perf+3 honor-4 flag:balochHard} -> bc_end
- Go in with the Levies and talk to the village elder first. {honor+4 leadership+3 flag:balochTalk} -> bc_end
:bc_end
@log Led the quick reaction force to the convoy ambush at Kilometre 212.
@history Convoy ambush on the coastal highway

=== 31 | snowpost | The posting | id: wife_posting | if: married && rank>=3
@cut phone_night
@npc ayesha angry
Ayesha(angry): Siachen. Again. Do you know your son asked me last week if you were a real person or a voice on the phone?
? She is right, and you are on the list anyway.
- Ask the MS for a family station next year. {rel.ayesha+10 perf-4} -> ask
- Go, and call home every single night. {rel.ayesha+3 perf+3 happy-3} -> call
- "It's the job, Ayesha." {rel.ayesha-12 perf+4} -> job
:ask
Ayesha(sad): You'd do that? ...Thank you.
@goto wp_end
:call
* You call every night for six months, from a satellite phone with a seven-second delay. You both learn to wait before answering.
@goto wp_end
:job
Ayesha(sad): I know it is. I married it too.
:wp_end
@npc off

=== 33 | office | Aabpara | id: isi_kabul_ev | if: rank>=5
@cut isi_kabul
@title Inter-Services Intelligence | On deputation
@npc dg
General Asfandyar: You'll go to Kabul. Their intelligence chief wants this hostage home as much as we do. Trust him as far as the job needs, and no further.
@npc off
@game stealth {"diff":3,"scene":"mountain_night","title":"The Exchange","kicker":"Across the border","brief":"Reach the meeting point unseen. The hostage is being moved tonight."}
@ifwin ik_ok
* The handover goes wrong. The hostage is moved again. It takes three more months and a lot of money to get him back.
@fx perf-3 var.rel_afg-5
@goto ik_q
:ik_ok
* At 0400 a frightened aid worker climbs into your vehicle and asks for water and his mother.
@fx perf+6 var.rel_afg+10
:ik_q
? Your Afghan counterpart asks for the names you have on the network's men in Kabul.
- Share them. Cooperation has to start somewhere. {var.rel_afg+10 honor+2} -> ik_end
- Share half, and keep your best source safe. {var.rel_afg+3 perf+2} -> ik_end
:ik_end
@log Brought an aid worker back from across the Afghan border, working with Kabul.
@history Hostage recovered with Afghan help

=== 35 | home | The anniversary | id: wife_anniv | if: married
@cut anniversary
? Ten years married. A corps commanders' dinner the same evening, and your boss expects you there.
- Book the table on the hills and tell the boss you are ill. {rel.ayesha+14 happy+5 perf-3 money-20}
- Go to the dinner, and send flowers. {rel.ayesha-8 perf+3 money-5}
- Bring her to the dinner, and leave early to walk on the hills. {rel.ayesha+8 happy+3}
@log Our tenth anniversary.

=== 37 | office | Follow the money | id: isi_dubai_ev | if: rank>=5
@cut isi_dubai
@npc rashid
Sheikh Rashid: We do not like our banks used for this, General. Show us the accounts, and we will freeze them by Friday.
@npc off
@game cipher {"messages":["TRANSFER VIA AL NOOR TRADING","FRIDAY BEFORE PRAYERS"],"time":80,"title":"The Ledger","kicker":"Dubai"}
@ifwin id_ok
* Half the money is gone before the freeze. The other half stays frozen for years.
@fx var.rel_uae+3
@goto id_end
:id_ok
* Forty-one accounts frozen on a Friday morning. The network's payroll stops the same day.
@fx perf+6 intellect+3 var.rel_uae+12
:id_end
@log Worked with the Emiratis to freeze the network's money in Dubai.

=== 39 | port | Gwadar | id: baloch_port | if: rank>=6
@cut port_attack
* Attackers have hit the hotel where foreign engineers working on the port are staying.
@game defend {"waves":4,"diff":3,"scene":"port","title":"The Hotel on the Hill","kicker":"Gwadar"}
@ifwin bp_ok
* The hotel holds, but two guards and a cook are killed. The engineers fly home the next week.
@fx perf-2 happy-4 var.rel_chn-5
@goto bp_end
:bp_ok
* Every guest walks out at dawn. The project director shakes your hand for a full minute.
@fx perf+6 leadership+3 var.rel_chn+8
@medal Tamgha-e-Basalat | #c9a227 | Defence of the hotel, Gwadar
:bp_end
@log Defended the hotel at Gwadar.

=== 41 | school | Annual day | id: wife_school | if: married && kids>0
@cut school_day
? Annual day at the school, and a divisional exercise starts the same morning.
- Go to the school. The exercise can start without you for two hours. {rel.kid1+12 rel.ayesha+6 happy+5 perf-3}
- Go to the exercise, and ask Ayesha to film it. {rel.kid1-8 perf+3}
@log Annual day at the children's school.

=== 42 | office | The corridor | id: isi_beijing_ev | if: rank>=7
@cut isi_beijing
@npc liwei
Mr Li Wei: Our workers trust your soldiers, General. Their families in Xinjiang and Sichuan trust them less. Help me make them trust you.
@npc off
? How do you set up the joint security cell?
- Pakistani command, Chinese liaison officers inside it. {var.rel_chn+8 leadership+3 honor+2}
- Let them run their own private security. {var.rel_chn+3 honor-4}
@game sniper {"diff":3,"scene":"valley","title":"Overwatch","kicker":"Corridor convoy","brief":"A gunman is waiting above the convoy route. Find the armed man; the others are shepherds."}
@ifwin ib_ok
@fx perf-2 var.rel_chn-4
@goto ib_end
:ib_ok
@fx perf+5 var.rel_chn+6
:ib_end
@log Set up the joint security cell for the economic corridor with Beijing.

=== 45 | hospital | Brigadier Dr Ayesha | id: wife_promo | if: married
@cut proud_wife
@npc ayesha happy
Ayesha(happy): Did you see the Corps Commander's face when they announced me? He still thinks I am "your wife".
ME(happy): You'll always be Dr Ayesha first. I'm just the husband of the head of cardiology.
@npc off
@fx rel.ayesha+8 happy+5
@log Ayesha became head of cardiology at AFIC.

=== 46 | quetta | The jirga | id: baloch_jirga | if: rank>=8
@cut jirga
? The elders will stop the attacks in their area if the army leaves the valley and the government builds schools and a hospital.
- Agree. Pull back to the main road and push the provincial government on the schools. {honor+8 leadership+5 var.rel_baloch+15 flag:balochPeace}
- Agree to the schools, but keep the posts in the valley. {perf+3 var.rel_baloch+5}
- Refuse. Peace comes after the last gun is handed in. {perf+4 honor-4 var.rel_baloch-10}
@log Sat with the jirga at Dera Bugti.

=== 47 | quetta | Taftan | id: isi_tehran_ev | if: rank>=8
@cut isi_tehran
@npc bahrami
General Bahrami: Your soil, General. Our soldiers. Tell me why I should not answer this myself.
@npc off
?!14 Both countries' newspapers are shouting.
- Give him the evidence: the attackers were the same network that hits your own posts. Propose joint patrols. {var.rel_irn+12 honor+4 intellect+2} -> it_ok
- Deny everything and reinforce the border. {var.rel_irn-10 perf+2} -> it_ok
:it_ok
@log Defused a border crisis with Iran at Taftan.

=== 50 | home | Two plates | id: wife_nest | if: married && kids>0
@cut empty_house
@npc ayesha
Ayesha: Do you remember the geyser in block C? I miss it. Isn't that ridiculous?
? Your wife is smiling at you across a very quiet table.
- "Let's go back to the hills. The same table." {rel.ayesha+10 happy+6 money-10}
- Hold her hand, and say nothing at all. {rel.ayesha+8 happy+4}
@npc off

=== 53 | office | Neutral ground | id: isi_back_ev | if: rank>=9
@cut isi_backchannel
@npc envoy
The envoy: My prime minister cannot be seen to blink first. Neither can yours. So, General: who blinks?
@npc off
?!16 Two armies are still on alert along the border.
- Both sides pull back the same distance, on the same night, and nobody announces it. {honor+8 var.rel_nbr+15 intellect+3 flag:backchannel}
- Demand they move first. {perf+3 var.rel_nbr-10}
@log Opened a quiet back-channel that took two armies off alert.
@history Back-channel talks on neutral ground
`);
})();
