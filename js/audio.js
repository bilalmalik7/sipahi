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
    unlock() { ac(); },
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
      if (!on || !ac()) return;
      api.stopPad();
      const chords = { calm: [130.8, 196, 261.6, 329.6], tense: [110, 164.8, 207.6, 233], sad: [110, 130.8, 164.8, 220], proud: [146.8, 220, 293.7, 370] }[kind] || [130.8, 196, 261.6];
      const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 2);
      const oscs = chords.map((f, i) => { const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (Math.random() - .5) * 12; o.connect(g); o.start(); return o; });
      pad = { g, oscs };
    },
    stopPad() {
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
