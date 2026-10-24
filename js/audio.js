// Synthesized sound: no audio files, everything is built with WebAudio.
const SFX = (() => {
  let ctx = null, master = null, on = true, pad = null;
  try { on = localStorage.getItem('sss_sound') !== 'off'; } catch (e) {}

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function noiseBuf(sec) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slide = 0) {
    if (!on || !ac()) return;
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.3, freq = 1200, q = 0.7, when = 0, type = 'lowpass') {
    if (!on || !ac()) return;
    const t = ctx.currentTime + when, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf(dur + 0.1); f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.1);
  }
  const buzz = p => { try { if (on && navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  const api = {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('sss_sound', on ? 'on' : 'off'); } catch (e) {} if (!on) api.stopPad(); return on; },
    unlock() { ac(); if (window.MUSIC) MUSIC.kick(); },
    ctx() { return ac(); },
    blip() { tone(520 + Math.random() * 80, 0.03, 'square', 0.025); },
    click() { tone(880, 0.05, 'triangle', 0.08); },
    choose() { tone(660, 0.08, 'triangle', 0.1); tone(990, 0.12, 'triangle', 0.08, 0.06); },
    good() { tone(523, 0.12, 'triangle', 0.12); tone(784, 0.2, 'triangle', 0.12, 0.1); buzz(15); },
    bad() { tone(220, 0.25, 'sawtooth', 0.08, 0, -80); },
    shot() { noise(0.18, 0.5, 2400, 0.8); tone(110, 0.12, 'square', 0.15, 0, -60); },
    hit() { noise(0.12, 0.45, 700, 1); tone(90, 0.15, 'sine', 0.3, 0, -40); buzz(25); },
    whoosh() { noise(0.35, 0.18, 900, 2, 0, 'bandpass'); },
    boom() { noise(1.4, 0.8, 380, 0.6); tone(55, 1.0, 'sine', 0.5, 0, -30); buzz([60, 40, 90]); },
    thunder() { noise(2.2, 0.6, 220, 0.5); },
    heli() { for (let i = 0; i < 10; i++) noise(0.06, 0.15, 300, 3, i * 0.09, 'bandpass'); },
    beep() { tone(1200, 0.08, 'square', 0.06); },
    tick() { tone(1500, 0.02, 'square', 0.04); },
    cut() { noise(0.06, 0.3, 4000, 1, 0, 'highpass'); tone(300, 0.05, 'square', 0.06); },
    dhol() { [0, .22, .33, .55, .66, .88].forEach((w, i) => { tone(i % 2 ? 160 : 80, 0.18, 'sine', 0.35, w, -40); noise(0.05, 0.2, 2000, 1, w); }); },
    fanfare() {
      if (!on || !ac()) return;
      buzz([30, 60, 30, 60, 120]);
      const n = [392, 523, 659, 784, 659, 784, 1046];
      n.forEach((f, i) => { tone(f, i === n.length - 1 ? 0.9 : 0.2, 'sawtooth', 0.06, i * 0.16); tone(f / 2, 0.25, 'triangle', 0.08, i * 0.16); });
      [0, .48, .96].forEach(w => noise(0.1, 0.25, 600, 1, w));
    },
    sad() { [440, 415, 349, 330].forEach((f, i) => tone(f, 0.7, 'sine', 0.08, i * 0.55)); },
    pad(kind = 'calm') {
      if (window.MUSIC) { MUSIC.mood(kind); return; }
      if (!on || !ac()) return;
      api.stopPad();
      const chords = { calm: [130.8, 196, 261.6, 329.6], tense: [110, 164.8, 207.6, 233], sad: [110, 130.8, 164.8, 220], proud: [146.8, 220, 293.7, 370] }[kind] || [130.8, 196, 261.6];
      const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 2);
      const oscs = chords.map((f, i) => { const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (Math.random() - .5) * 12; o.connect(g); o.start(); return o; });
      pad = { g, oscs };
    },
    stopPad() {
      if (window.MUSIC) MUSIC.mood(null);
      if (!pad || !ctx) return;
      const p = pad; pad = null;
      p.g.gain.cancelScheduledValues(ctx.currentTime);
      p.g.gain.setValueAtTime(Math.max(p.g.gain.value, 0.0001), ctx.currentTime);
      p.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      p.oscs.forEach(o => o.stop(ctx.currentTime + 1.3));
    },
  };
  return api;
})();

// Background music, generated live so the app stays small: a lookahead sequencer plays one of several
// pieces (military-band march, rabab and flute over a drone with tabla, tension, action, sadness, pride,
// the Operations map, a wedding dhol) and crossfades when the screen or the mood changes.
const MUSIC = (() => {
  let on = true, vol = .6;
  try { on = localStorage.getItem('sss_music') !== 'off'; vol = +(localStorage.getItem('sss_mvol') || .6); } catch (e) {}
  let c = null, out = null, verb = null, noise = null, timer = 0, tr = null, name = null, step = 0, nextT = 0, drone = [], mood = null, want = null, switching = false;
  const hz = (root, semi) => root * Math.pow(2, semi / 12);
  function ctx() {
    if (!c) { c = SFX.ctx(); if (!c) return null; out = c.createGain(); out.gain.value = 0; out.connect(c.destination);
      // a cheap "room": a short feedback delay, filtered
      verb = c.createDelay(); verb.delayTime.value = .11; const fb = c.createGain(); fb.gain.value = .32; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; const wet = c.createGain(); wet.gain.value = .25;
      verb.connect(lp); lp.connect(fb); fb.connect(verb); lp.connect(wet); wet.connect(out);
      noise = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return c;
  }
  function env(g, t, a, peak, dur, rel = .08) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel)); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }
  function voice(type, f, t, dur, v, o = {}) {
    const g = c.createGain(); let last = g;
    if (o.lp) { const fl = c.createBiquadFilter(); fl.type = o.bp ? 'bandpass' : 'lowpass'; fl.frequency.setValueAtTime(o.lp, t); if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur); fl.Q.value = o.q || .8; g.connect(fl); last = fl; }
    last.connect(out); if (o.wet) last.connect(verb);
    (o.det || [0]).forEach(dt => { const os = c.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t); os.detune.value = dt;
      if (o.bend) os.frequency.exponentialRampToValueAtTime(f * o.bend, t + Math.min(dur, .12));
      if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.2; lg.gain.value = f * .012; l.connect(lg); lg.connect(os.frequency); l.start(t + .15); l.stop(t + dur + .05); }
      os.connect(g); os.start(t); os.stop(t + dur + .05); });
    env(g, t, o.a || .01, v, dur, o.r || .08);
  }
  const pluck = (f, t, v = .12, dur = .7) => voice('sawtooth', f, t, dur, v, { lp: 3200, lpTo: 500, a: .004, r: dur * .8, det: [-4, 5], wet: true });
  const flute = (f, t, dur, v = .07) => voice('sine', f, t, dur, v, { a: .09, r: .2, vib: true, wet: true });
  const shehnai = (f, t, dur, v = .05) => voice('sawtooth', f, t, dur, v, { lp: 1400, q: 3, bp: true, a: .04, r: .1, vib: true });
  const brass = (f, t, dur, v = .06) => voice('sawtooth', f, t, dur, v, { lp: 1600, a: .03, r: .12, det: [-6, 6], wet: true });
  const strings = (f, t, dur, v = .035) => voice('sawtooth', f, t, dur, v, { lp: 1100, a: .5, r: .6, det: [-8, 0, 8], wet: true });
  const bass = (f, t, dur, v = .14) => voice('triangle', f, t, dur, v, { a: .01, r: .1 });
  function hit(t, f0, f1, dur, v) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .6); o.connect(g); g.connect(out); env(g, t, .003, v, dur); o.start(t); o.stop(t + dur + .02); }
  function nz(t, dur, v, f, type = 'bandpass', q = 1) { const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); fl.connect(g); g.connect(out); env(g, t, .002, v, dur, dur * .8); s.start(t, Math.random() * .5); s.stop(t + dur + .02); }
  const kick = (t, v = .5) => hit(t, 130, 42, .28, v);
  const dha = (t, v = .3) => { hit(t, 110, 60, .35, v); nz(t, .06, v * .3, 2400); };
  const na = (t, v = .14) => { nz(t, .07, v, 2800, 'bandpass', 4); hit(t, 520, 480, .08, v * .5); };
  const snare = (t, v = .16) => { nz(t, .16, v, 1800, 'highpass', .7); hit(t, 190, 160, .08, v * .5); };
  const hat = (t, v = .04) => nz(t, .03, v, 7000, 'highpass', .7);
  const taiko = (t, v = .45) => { hit(t, 90, 38, .6, v); nz(t, .1, v * .2, 300, 'lowpass'); };
  function startDrone(root, v = .025) { stopDrone(); [0, 7, 12].forEach((s, i) => { const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = hz(root, s) / 2; o.detune.value = (i - 1) * 4; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0; g.gain.linearRampToValueAtTime(v / (i ? 1.6 : 1), c.currentTime + 2); o.connect(f); f.connect(g); g.connect(out); o.start(); drone.push({ o, g }); }); }
  function stopDrone() { const now = c ? c.currentTime : 0; drone.forEach(d => { try { d.g.gain.cancelScheduledValues(now); d.g.gain.setValueAtTime(d.g.gain.value, now); d.g.gain.linearRampToValueAtTime(0, now + .8); d.o.stop(now + .9); } catch (e) {} }); drone = []; }
  // a little seeded randomness so loops vary without wandering off
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const KAFI = [0, 2, 3, 5, 7, 9, 10, 12, 14, 15], MAJ = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16], MIN = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15];
  const TR = {
    title: { bpm: 108, root: 146.83, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 4;
      if (b % 4 === 0) snare(t, .12); if (b === 14 || b === 15) snare(t, .08); if (b === 0 || b === 8) kick(t, .4);
      const M = [[0, 7, 4], [2, 9, 4], [4, 7, 2], [6, 5, 2], [8, 4, 4], [12, 2, 4], [0, 4, 4], [2, 5, 2], [4, 7, 2], [6, 9, 2], [8, 11, 4], [12, 12, 4]];
      M.filter(m => m[0] === b && ((bar % 2 === 0) === (M.indexOf(m) < 6))).forEach(m => brass(hz(this.root, m[1]), t, q * m[2] * .95, .055));
      if (b === 0) [0, 4, 7].forEach(x => strings(hz(this.root, [0, 5, 7, 0][bar] + x - 12), t, q * 16, .022)); if (b % 8 === 0) bass(hz(this.root, [0, 5, 7, 0][bar] - 24), t, q * 4); } },
    life: { bpm: 84, root: 146.83, drone: true, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 8;
      if (b % 2 === 0) { const arp = [0, 7, 12, 7, 3, 7, 12, 14]; pluck(hz(this.root, arp[(b / 2 + bar) % 8]), t, .07, .9); }
      if (b === 0) dha(t, .18); if (b === 6 || b === 10) na(t, .07); if (b === 8) dha(t, .1); if (b === 12) na(t, .1);
      if (bar % 2 === 1 && b % 4 === 0 && rnd() < .6) flute(hz(this.root * 2, KAFI[(rnd() * 7) | 0]), t, q * (rnd() < .5 ? 4 : 2), .05); } },
    tense: { bpm: 116, root: 73.42, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 4;
      if (b % 2 === 0) bass(hz(this.root, [0, 0, 1, 0, 0, 0, 3, 1][(b / 2) | 0]), t, q * 1.6, .12);
      if (b === 0 || b === 6 || b === 10) taiko(t, .35); if (b % 2 === 1) hat(t, .025);
      if (b === 0 && bar % 2 === 0) [0, 1, 6].forEach(x => strings(hz(this.root * 2, x), t, q * 30, .02)); } },
    action: { bpm: 136, root: 73.42, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 4;
      if (b % 4 === 0) kick(t, .45); if (b === 4 || b === 12) snare(t, .14); if (b % 2 === 1) hat(t, .03); if (b === 3 || b === 11) dha(t, .14);
      bass(hz(this.root, [0, 0, 12, 0, 3, 0, 10, 0][b % 8] + [0, 0, 5, 3][bar]), t, q * .9, .1);
      if (b === 0) [0, 3, 7].forEach(x => brass(hz(this.root * 2, x + [0, 0, 5, 3][bar]), t, q * 2, .035)); } },
    sad: { bpm: 62, root: 146.83, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 4, ch = [[0, 3, 7], [-2, 2, 5], [-5, -2, 3], [-3, 1, 4]][bar];
      if (b === 0) ch.forEach(x => strings(hz(this.root, x), t, q * 16, .03)); if (b === 0) bass(hz(this.root, ch[0] - 24), t, q * 16, .08);
      if (b % 4 === 2 && rnd() < .55) flute(hz(this.root * 2, MIN[(rnd() * 6) | 0]), t, q * 6, .045); } },
    proud: { bpm: 96, root: 146.83, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 4, prog = [0, 5, 7, 0][bar];
      if (b === 0) { [0, 4, 7, 12].forEach(x => brass(hz(this.root, prog + x), t, q * 7, .04)); taiko(t, .3); }
      if (b === 8) [0, 4, 7].forEach(x => brass(hz(this.root, prog + x + (bar === 2 ? 2 : 0)), t, q * 7, .035));
      if (b % 4 === 0) snare(t, .09); if (b >= 12 && bar === 3) snare(t, .07); if (b % 8 === 0) bass(hz(this.root, prog - 24), t, q * 8); } },
    ops: { bpm: 100, root: 110, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 4;
      if (b % 2 === 0) bass(hz(this.root / 2, [0, 0, 0, 3, 0, 0, 5, 3][(b / 2) | 0] + [0, 0, -2, -4][bar]), t, q * 1.5, .09);
      if (b === 0 || b === 10) taiko(t, .25); if (b === 4 || b === 12) na(t, .06); if (b % 2) hat(t, .018);
      if (b === 0 && bar === 0) [0, 7, 12].forEach(x => strings(hz(this.root, x), t, q * 60, .02)); } },
    wedding: { bpm: 128, root: 196, play(s, t, q) { const b = s % 16, bar = (s >> 4) % 4;
      [0, 3, 6, 8, 11, 14].includes(b) ? dha(t, b === 0 || b === 8 ? .3 : .18) : (b % 2 === 0 && na(t, .08));
      const mel = [0, 2, 4, 2, 4, 5, 7, 5, 4, 2, 4, 2, 0, -1, 0, 2]; if (b % 2 === 0) shehnai(hz(this.root * 2, MAJ[(mel[(b / 2 + bar * 2) % 16] + 7) % 10] - 12 + (bar === 3 ? 2 : 0)), t, q * 1.9, .045);
      if (b % 4 === 0) bass(hz(this.root / 2, [0, 5, 7, 0][bar]), t, q * 2, .1); } },
  };
  function tick() {
    if (!c || !tr) return;
    const q = 60 / tr.bpm / 4;
    while (nextT < c.currentTime + .25) { try { tr.play(step, nextT, q); } catch (e) {} nextT += q; step++; }
  }
  function begin(n) {
    if (!ctx()) return;
    name = n; tr = TR[n]; step = 0; seed = 7 + n.length; nextT = c.currentTime + .08;
    stopDrone(); if (tr.drone) startDrone(tr.root);
    out.gain.cancelScheduledValues(c.currentTime); out.gain.setValueAtTime(Math.max(out.gain.value, .0001), c.currentTime); out.gain.linearRampToValueAtTime(vol * .55, c.currentTime + 1.6);
    if (!timer) timer = setInterval(tick, 90);
  }
  function stop(fast) {
    if (!c) return; clearInterval(timer); timer = 0; tr = null; name = null; stopDrone();
    out.gain.cancelScheduledValues(c.currentTime); out.gain.setValueAtTime(out.gain.value, c.currentTime); out.gain.linearRampToValueAtTime(0, c.currentTime + (fast ? .2 : .9));
  }
  function to(n) {
    if (!on || document.hidden) return;
    if (n === name || switching) return;
    if (!ctx() || c.state !== 'running') return;
    if (!name) return begin(n);
    switching = true; out.gain.cancelScheduledValues(c.currentTime); out.gain.setValueAtTime(out.gain.value, c.currentTime); out.gain.linearRampToValueAtTime(0, c.currentTime + .7);
    setTimeout(() => { switching = false; if (on) begin(want || n); }, 750);
  }
  // pick the piece from what is on screen, so screens need no music code of their own
  const vis = id => { const e = document.getElementById(id); return e && !e.hidden; };
  function choose() {
    if (vis('game')) return 'action';
    if (vis('cut') || vis('story') || document.querySelector('.ops-banner, .ending-wrap')) return mood || (vis('story') ? 'life' : 'proud');
    if (vis('ops')) return 'ops';
    if (vis('life')) return 'life';
    return 'title';
  }
  setInterval(() => { if (!on || !c) return; want = choose(); to(want); }, 600);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(true); });
  return {
    get on() { return on; }, get vol() { return vol; }, get playing() { return name; },
    kick() { if (on && ctx()) { want = choose(); to(want); } },
    mood(m) { mood = { calm: 'life', tense: 'tense', sad: 'sad', proud: 'proud', wedding: 'wedding', action: 'action' }[m] || null; },
    toggle() { on = !on; try { localStorage.setItem('sss_music', on ? 'on' : 'off'); } catch (e) {} if (!on) stop(); else this.kick(); return on; },
    setVol(v) { vol = v; try { localStorage.setItem('sss_mvol', v); } catch (e) {} if (c && name) { out.gain.cancelScheduledValues(c.currentTime); out.gain.linearRampToValueAtTime(vol * .55, c.currentTime + .3); } },
  };
})();

// make the module reachable as window.X too (top-level const is not a window property)
 window.SFX = SFX; window.MUSIC = MUSIC;
