// Story threads added in round five: jump wings, the night attack on Bana Top, the tank battle at
// Chhamb and the gunship escort. Each one plays one of the new missions and has its own cutscene.
(() => {
  const S = SCENES.S, P = FIG.P, H = SCENES.helpers, A = GAMES.art;
  const runPose = (t, sp = 10) => FIG.lerp(P.run1, P.run2, (Math.sin(t * sp) + 1) / 2);
  const soldier = { color: '#4c5634', helmet: '#3a4028', rifle: true, pack: '#3a3e2a', skin: '#a8754e' };

  CUT.LIB.c130_jump = [
    { d: 4.2, who: 'C-130, 12,000 feet', cap: 'Red light. The ramp groans open on a sky with nothing in it.', grade: 'contrast(1.15) saturate(.85)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0e0c0b'; ctx.fillRect(0, -h * .2, w, h * 1.4);
      const open = Math.min(1, p * 1.6), gx = w * .5, gw = w * .42 * open;
      const g = ctx.createLinearGradient(0, h * .1, 0, h * .9); g.addColorStop(0, '#2a4f84'); g.addColorStop(1, '#9cc0e0');
      ctx.fillStyle = g; ctx.fillRect(gx - gw / 2, h * .12, gw, h * .78);
      for (let i = 0; i < 5; i++) { const cx = gx + Math.sin(i * 2.3 + t * .3) * gw * .4, cy = h * .3 + ((i * .21 + t * .08) % 1) * h * .6; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(cx, cy, w * .08, h * .03, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = `rgba(200,20,20,${.25 + .1 * Math.sin(t * 5)})`; ctx.fillRect(0, -h * .2, w, h * 1.4);
      for (let i = 0; i < 5; i++) FIG.draw(ctx, w * (.08 + i * .07), h * .9, h * .5, P.stand, Object.assign({}, soldier, { rifle: false, simple: true, color: '#1c1f16', helmet: '#121410' }));
      for (let i = 0; i < 4; i++) FIG.draw(ctx, w * (.92 - i * .07), h * .9, h * .5, P.stand, Object.assign({}, soldier, { rifle: false, simple: true, color: '#1c1f16', helmet: '#121410', facing: -1 }));
    } },
    { d: 3.4, who: 'Jumpmaster', cap: '"GREEN LIGHT! GO! GO! GO!"', grade: 'contrast(1.1)', draw(ctx, w, h, p, t, dt, fx, st) {
      ctx.fillStyle = '#0e0c0b'; ctx.fillRect(0, -h * .2, w, h * 1.4);
      const g = ctx.createLinearGradient(0, h * .1, 0, h * .9); g.addColorStop(0, '#2a4f84'); g.addColorStop(1, '#9cc0e0'); ctx.fillStyle = g; ctx.fillRect(w * .29, h * .12, w * .42, h * .78);
      ctx.fillStyle = 'rgba(40,200,80,.18)'; ctx.fillRect(0, -h * .2, w, h * 1.4);
      for (let i = 0; i < 4; i++) { const k = (p * 2.2 - i * .35); if (k < 0) FIG.draw(ctx, w * (.2 + i * .02), h * .9, h * .5, runPose(t + i), Object.assign({}, soldier, { rifle: false, color: '#1c1f16', simple: true })); else if (k < 1) { ctx.save(); ctx.translate(w * (.42 + k * .1), h * (.6 + k * .5)); ctx.rotate(k * 2); FIG.draw(ctx, 0, 0, h * .5 * (1 - k * .6), P.fall, Object.assign({}, soldier, { rifle: false, color: '#1c1f16', simple: true, shadow: false })); ctx.restore(); } }
    } },
    { d: 4.6, who: 'Over Peshawar', cap: 'Forty canopies blossom across the morning. One of them is yours.', cam: [-.3, 1.0, .3, 1.08], draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt);
      FIG.plane(ctx, w * (1.1 - p * .9), h * .16, h * .08, '#3a4038');
      for (let i = 0; i < 9; i++) { const k = Math.max(0, p * 1.5 - i * .08); if (k <= 0) continue; A.canopy(ctx, w * (.95 - i * .1 - p * .1), h * (.25 + i % 3 * .06 + k * .25), h * (.09 - i % 3 * .015), Math.sin(t + i) * .1, i % 2 ? '#2e6b3a' : '#4a6a3a'); }
    } },
  ];

  CUT.LIB.post_night = [
    { d: 4.2, who: 'Bana Top, 0240 hours', cap: 'A trip flare. Then another. Then the whole ridge is alight.', grade: 'contrast(1.2) saturate(.75)', draw(ctx, w, h, p, t, dt, fx, st) {
      S.mountain_night(ctx, w, h, t, st, dt);
      for (let i = 0; i < 3; i++) { const k = Math.max(0, p * 1.4 - i * .25); if (!k) continue; const x = w * (.3 + i * .25), y = h * (.5 - Math.min(1, k) * .35); H.lamp(ctx, x, y, h * .3, t, '255,200,120', 1); ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
      ctx.fillStyle = `rgba(255,200,120,${.06 + .04 * Math.sin(t * 9)})`; ctx.fillRect(0, -h * .2, w, h * 1.4);
      for (let i = 0; i < 8; i++) FIG.draw(ctx, w * (1.05 - ((p * .35 + i * .09) % 1) * .6), h * (.74 + (i % 3) * .04), h * .12, runPose(t + i * .6), { color: '#141210', facing: -1, rifle: true, scarf: '#2a2420', simple: true });
    } },
    { d: 4, who: 'Havildar Sher Khan', cap: '"Hold your fire... hold... NOW!"', draw(ctx, w, h, p, t, dt, fx, st) {
      S.snowpost(ctx, w, h, t, st, dt); ctx.fillStyle = 'rgba(0,10,30,.45)'; ctx.fillRect(0, -h * .2, w, h * 1.4);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const bx = w * .05 + i * w * .07 + (r % 2) * w * .035, by = h * .9 - r * h * .05; ctx.fillStyle = '#9a8a68'; ctx.beginPath(); ctx.ellipse(bx, by, w * .04, h * .028, 0, 0, 7); ctx.fill(); }
      [.14, .3, .46].forEach((x, i) => FIG.draw(ctx, w * x, h * .9, h * .42, P.crouchAim, Object.assign({}, soldier, { flash: p > .4 && Math.sin(t * 30 + i) > .3 })));
      if (p > .4) { for (let i = 0; i < 2; i++) fx.tracer(w * (.2 + Math.random() * .3), h * .62, w * (.7 + Math.random() * .3), h * (.5 + Math.random() * .2)); if (Math.random() < .05) { fx.boom(w * (.7 + Math.random() * .25), h * .65, .6); SFX.boom(); } }
    } },
  ];

  CUT.LIB.tank_column = [
    { d: 4.4, who: 'Chhamb sector', cap: 'Dawn. Forty tonnes of steel per machine, and the ground shakes like a drum.', cam: [-.5, 1.02, .4, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt);
      const s = Math.min(h * .2, w * .18);
      for (let i = 0; i < 4; i++) { const x = w * (-.2 + p * .6 + i * .28), y = h * (.86 + (i % 2) * .03); A.drawTank(ctx, x, y, s * (1 - (i % 2) * .15), Math.sin(t * 3 + i) * .015, -.08, '#56603a', 1, 0, null, i === 0, t); H.smoke(ctx, st, 'sm_d' + i, x - s * .6, y - s * .1, dt, '170,150,110', 6, 1.4); }
      fx.shake = Math.max(fx.shake, .12);
    } },
    { d: 3.8, who: 'Contact front', cap: '"Enemy armour, two thousand metres! FIRE!"', flash: true, draw(ctx, w, h, p, t, dt, fx, st) {
      S.valley(ctx, w, h, t, st, dt);
      const s = Math.min(h * .32, w * .3);
      A.drawTank(ctx, w * .36, h * .9, s, 0, -.12 + (p < .2 ? p : .2) * -.2, '#56603a', 1, 0, null, true, t);
      if (!st.f && p > .25) { st.f = 1; FIG.muzzle(ctx, w * .36 + s * .65, h * .9 - s * .5, s * .3, Math.PI / 2, 1); fx.boom(w * .36 + s * .7, h * .9 - s * .5, .7); SFX.boom(); setTimeout(() => { st.hit = 1; }, 700); }
      if (st.hit && !st.h2) { st.h2 = 1; fx.boom(w * .9, h * .78, 1.2); SFX.boom(); }
    } },
  ];

  CUT.LIB.gunship_dawn = [
    { d: 4.4, who: 'Army Aviation', cap: 'Four gunships lift off at first light. The convoy is already moving.', cam: [.4, 1.0, -.4, 1.1], draw(ctx, w, h, p, t, dt, fx, st) {
      S.cherat(ctx, w, h, t, st, dt);
      for (let i = 0; i < 4; i++) FIG.heli(ctx, w * (.15 + i * .22 + p * .1), h * (.82 - Math.min(1, Math.max(0, p * 1.4 - i * .12)) * (.4 + i % 2 * .08)), h * (.09 - i % 2 * .015), t, '#1d2420');
      if (p < .5) for (let i = 0; i < 6; i++) fx.sparks(w * (.15 + Math.random() * .7), h * .86, 1, '200,180,140');
    } },
    { d: 4, who: 'Door gunner', cap: '"Contact, three o\'clock! Hostiles on the ridge!"', draw(ctx, w, h, p, t, dt, fx, st) {
      st.cam = { x: Math.sin(t * .2) * .6, z: 1.08, y: 0 }; st._own = 1;
      S.cherat(ctx, w, h, t, st, dt);
      ctx.fillStyle = '#0a0c0b'; ctx.fillRect(0, -h * .2, w * .14, h * 1.4); ctx.fillRect(w * .86, -h * .2, w * .14, h * 1.4); ctx.fillRect(0, -h * .2, w, h * .3);
      for (let i = 0; i < 3; i++) A.truck(ctx, w * (.9 - ((p * .4 + i * .3) % 1) * .7), h * (.78 + i * .04), h * .07, '#6a5e44', i === 1 ? 'jeep' : 'truck', t);
      if (p > .3 && Math.random() < .6) fx.tracer(w * .82, h * 1.0, w * (.3 + Math.random() * .4), h * (.75 + Math.random() * .1));
      if (p > .5 && !st.b) { st.b = 1; fx.boom(w * .5, h * .78, .8); SFX.boom(); }
    } },
  ];

  window.STORY_SRC.push(`
=== 21 | barracks | Jump wings | id: jumpwings | if: rank>=2
@cut c130_jump
@npc sherkhan
Havildar Sher Khan: Sahib, everyone is afraid the first time. The ones who say they are not are lying, or they are stupid.
? The jumpmaster waves you to the door.
- "Then I'll be afraid and jump anyway." {courage+3 rel.sherkhan+5} -> j
- Ask him to check your harness one more time. {intellect+2} -> j
:j
@npc off
@game para {"diff":1,"scene":"valley","title":"Jump Wings","kicker":"Parachute Training School"}
@ifwin jw_ok
* You land hard, wide of the smoke, and limp back carrying your canopy. The instructor makes you do it again the next morning. The second jump is clean.
@fx health-4 courage+2
@goto jw_end
:jw_ok
* Feet together, knees bent, roll. You stand up in the middle of the drop zone, grinning like a boy.
@fx courage+3 fitness+3 perf+3
@medal Parachute Wings | #2f6fd6 | Basic parachute course, Peshawar
:jw_end
@log Earned my jump wings at the Parachute Training School.

=== 23 | snowpost | Bana Top | id: banatop | if: rank>=2
@cut post_night
@outfit combat
@hat helmet
* Your platoon holds a post of sandbags and ice at twenty thousand feet. Tonight, someone wants it more than you do.
@npc sherkhan
?!8 Sher Khan wants an order. The wire is already cut.
- "Hold fire until they reach the wire." {leadership+3} -> hold
- "Fire the flares and hit them now." {courage+2} -> hold
:hold
@npc off
@game defend {"waves":3,"diff":2,"scene":"snowpost","title":"Bana Top","kicker":"Night attack, 20,000 ft"}
@ifwin bt_ok
* At dawn the post is still yours, but only because the company on the next ridge sent a section across the ice to save you.
@fx perf-3 health-8
@goto bt_end
:bt_ok
* At dawn the attackers are gone. Sher Khan brews tea on a kerosene stove and hands you the first cup.
@fx leadership+4 courage+3 perf+5 rel.sherkhan+8
@medal Tamgha-e-Basalat | #c9a227 | Defence of a high-altitude post
:bt_end
@log Held Bana Top through a night attack.

=== 28 | valley | Steel on the border | id: tankduel | if: rank>=3
@cut tank_column
* You are on attachment to an armoured regiment when the ceasefire on the border collapses.
@npc co
Colonel Rizvi: Their armour is coming through the gap. You have three tanks and a ridge. Make the ridge count.
@npc off
@game tank {"enemies":2,"diff":2,"scene":"valley","title":"The Gap","kicker":"Armoured clash"}
@ifwin td_ok
* Your tank is hit and burns. The crew gets out. The gap is held by the infantry behind you, at a price.
@fx health-10 happy-4
@goto td_end
:td_ok
* Two enemy tanks burn in the gap. The rest turn back. The armoured regiment paints a small crescent on your turret.
@fx courage+4 perf+5 leadership+2
:td_end
@log Fought an armoured action in the Chhamb sector.

=== 32 | cherat | The convoy | id: gunship | if: rank>=4
@cut gunship_dawn
* A supply convoy for three border posts is coming up the valley road. Someone has promised to burn it.
? You are offered a seat in the lead gunship.
- Take the door gun yourself. {courage+3} -> g
- Direct from the co-pilot's seat. {leadership+3} -> g
:g
@game heli {"need":10,"time":40,"diff":2,"scene":"cherat","title":"The Convoy","kicker":"Army Aviation"}
@ifwin gs_ok
* Two trucks are lost. The posts go short of food and fuel for a fortnight, and every man up there knows why.
@fx perf-3 happy-3
@goto gs_end
:gs_ok
* Every truck reaches the posts. A havildar on the last one waves a loaf of bread at your gunship as you pass.
@fx perf+5 courage+2 honor+2
:gs_end
@log Flew escort for the valley convoy.
`);
})();
