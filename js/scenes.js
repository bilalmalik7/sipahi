// Procedural 2.5D backgrounds. Expensive static layers (terrain, buildings, textures) are rendered once
// into cached canvases; every frame blits them with camera parallax and draws the living parts on top:
// clouds, light, weather, smoke, foliage, people and vehicles.
// Performance manager shared by every renderer. Phones get a lower canvas resolution; if frames
// keep running slow the game drops into battery-saver graphics on its own (no blur, bloom or grain).
const PERF = (() => {
  let mode = 'auto';
  try { mode = localStorage.getItem('sss_gfx') || 'auto'; } catch (e) {}
  const mobile = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
  let low = mode === 'saver' || (mode === 'auto' && mobile && weak), slow = 0, seen = 0;
  const apply = () => { const r = document.documentElement; r.classList.toggle('lowfx', low); };
  if (document.documentElement) apply();
  const api = {
    get low() { return low; }, get mode() { return mode; }, mobile,
    dpr() { const d = window.devicePixelRatio || 1; return Math.min(d, mode === 'high' ? 2 : low ? 1 : mobile ? 1.5 : 2); },
    // renderers call this once per frame with the raw frame time in seconds
    frame(raw) {
      if (mode !== 'auto' || low || document.hidden || raw > .5) return;
      seen++; slow = raw > 1 / 28 ? slow + 1 : Math.max(0, slow - .5);
      if (slow > 50 && seen > 90) { low = true; apply(); }
    },
    set(m) { mode = m; try { localStorage.setItem('sss_gfx', m); } catch (e) {} low = m === 'saver' || (m === 'auto' && mobile && weak); slow = 0; seen = 0; apply(); },
    // a full-screen overlay (mission, cutscene, operations) hides the canvases under it
    covered(canvas) {
      for (const id of ['game', 'cut', 'ops', 'crate']) { const el = document.getElementById(id); if (el && !el.hidden && !el.contains(canvas)) return true; }
      return !!document.querySelector('.ops-banner, .ending-wrap');
    },
  };
  return api;
})();

const SCENES = (() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  function srand(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function hash(i) { let h = Math.imul((i | 0) ^ 0x27d4eb2d, 0x165667b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; return (h >>> 0) / 4294967296; }
  function vnoise(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 7919), hash(i + 1 + seed * 7919), u); }
  function fbm(x, seed = 0, oct = 5) { let a = 0, amp = .5, fr = 1, n = 0; for (let i = 0; i < oct; i++) { a += amp * vnoise(x * fr, seed + i * 13); n += amp; amp *= .5; fr *= 2.03; } return a / n; }
  function ridged(x, seed = 0, oct = 5) { let a = 0, amp = .55, fr = 1, n = 0; for (let i = 0; i < oct; i++) { const v = 1 - Math.abs(vnoise(x * fr, seed + i * 13) * 2 - 1); a += amp * v * v; n += amp; amp *= .48; fr *= 2.1; } return a / n; }
  function rgba(hex, a) { const p = parseInt(hex.slice(1), 16); return `rgba(${p >> 16 & 255},${p >> 8 & 255},${p & 255},${a})`; }
  function mix(a, b, k) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = s => Math.round(lerp(pa >> s & 255, pb >> s & 255, k)); return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1); }

  function grad(ctx, h, stops, y0 = 0) { const g = ctx.createLinearGradient(0, y0, 0, h); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
  function sky(ctx, w, h, stops) { ctx.fillStyle = grad(ctx, h, stops); ctx.fillRect(-w, -h, w * 3, h * 3); }
  function vignette(ctx, w, h, a = .55) {
    const g = ctx.createRadialGradient(w / 2, h * .55, Math.min(w, h) * .25, w / 2, h * .55, Math.max(w, h) * .78);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(-w, -h, w * 3, h * 3);
  }

  // ---------- cache ----------
  const CACHE = new Map();
  function cached(key, w, h, R, fn) {
    const k = key + '|' + (w | 0) + '|' + (h | 0) + '|' + R;
    let c = CACHE.get(k);
    if (!c) {
      c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * R)); c.height = Math.max(1, Math.ceil(h * R));
      const cc = c.getContext('2d'); cc.scale(R, R);
      try { fn(cc, w, h); } catch (e) { console.error(e); }
      CACHE.set(k, c);
      if (CACHE.size > 90) CACHE.delete(CACHE.keys().next().value);
    }
    return c;
  }

  // ---------- terrain ----------
  // mountains drawn into ctx between x = -0.1w and 1.1w
  function mountains(c, w, h, o) {
    const { base, amp, seed = 1, freq = 1.6, top, bot, snow = null, snowLine = .55, light = 1, haze = null, rough = 1, sharp = 1.3 } = o;
    const step = 3, pts = [];
    let minY = h;
    const raw = [];
    let lo = 1, hi = 0;
    for (let x = -w * .1; x <= w * 1.1 + step; x += step) {
      const u = x / w * freq;
      const r = Math.pow(ridged(u, seed, 6), sharp) + .06 * fbm(u * 9, seed + 3) * rough;
      raw.push([x, r]); if (r < lo) lo = r; if (r > hi) hi = r;
    }
    // stretch so the highest peak reaches the full amplitude
    raw.forEach(([x, r]) => { const k = (r - lo) / ((hi - lo) || 1); const y = base - amp * (.08 + .92 * k); pts.push([x, y]); if (y < minY) minY = y; });
    c.save();
    c.beginPath(); c.moveTo(pts[0][0], h); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(pts[pts.length - 1][0], h); c.closePath();
    const g = c.createLinearGradient(0, minY, 0, base + amp * .2); g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.fill(); c.clip();
    // rock-face shading: smoothed slope, drawn as slanted faces that fade downhill
    const N = pts.length, sm = new Array(N).fill(0);
    for (let i = 0; i < N - 1; i++) { let acc = 0, n = 0; for (let k = -4; k <= 4; k++) { const j = clamp(i + k, 0, N - 2); acc += pts[j + 1][1] - pts[j][1]; n++; } sm[i] = acc / n; }
    for (let i = 0; i < N - 1; i++) {
      const [x, y] = pts[i], s = clamp(-sm[i] * light / step, -1.4, 1.4);
      if (Math.abs(s) < .08) continue;
      const lean = -Math.sign(sm[i]) * step * 2.2;
      for (let k = 0; k < 3; k++) {
        const y0 = y + k * amp * .28, y1 = y0 + amp * .3;
        c.fillStyle = s > 0 ? `rgba(255,236,210,${s * .06 * (1 - k * .3)})` : `rgba(0,8,22,${-s * .11 * (1 - k * .3)})`;
        c.beginPath(); c.moveTo(x + lean * k, y0); c.lineTo(x + step + .8 + lean * k, y0 + (pts[i + 1][1] - y) * (k ? 0 : 1)); c.lineTo(x + step + .8 + lean * (k + 1), y1); c.lineTo(x + lean * (k + 1), y1); c.fill();
      }
    }
    // a few rock seams following the slopes
    const rnd = srand(seed * 97 + 3);
    for (let i = 0; i < 90 * rough; i++) {
      const j = (rnd() * (N - 2)) | 0, p = pts[j]; const len = amp * (.06 + rnd() * .22), x0 = p[0], y0 = p[1] + rnd() * amp * .35, lean = -Math.sign(sm[j]) * len * .6;
      c.strokeStyle = rnd() < .65 ? `rgba(0,0,0,${.04 + rnd() * .05})` : `rgba(255,245,230,${.03 + rnd() * .04})`;
      c.lineWidth = .6 + rnd() * 1.1; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + lean * .4, y0 + len * .5, x0 + lean, y0 + len); c.stroke();
    }
    if (snow) {
      const sl = base - amp * snowLine;
      const sy = pts.map(([x]) => sl + (fbm(x / w * 26, seed + 9) - .5) * amp * .45 + Math.max(0, Math.sin(x * .07 + seed)) * amp * .14);
      c.save();
      c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, Math.min(y, sy[i])) : c.moveTo(x, Math.min(y, sy[i])));
      for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0], sy[i]);
      c.closePath();
      const gsn = c.createLinearGradient(0, minY, 0, sl + amp * .25); gsn.addColorStop(0, snow); gsn.addColorStop(1, mix(snow, '#9fb0c6', .35));
      c.fillStyle = gsn; c.fill(); c.clip();
      // shadowed snow faces and wind-carved gullies
      for (let i = 0; i < N - 1; i++) {
        const [x, y] = pts[i], sd = clamp(-sm[i] * light / step, -1.4, 1.4);
        if (sd < -.05) { c.fillStyle = `rgba(70,95,140,${-sd * .22})`; const lean = -Math.sign(sm[i]) * step * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + step + .8, pts[i + 1][1]); c.lineTo(x + step + .8 + lean * 3, y + amp * .6); c.lineTo(x + lean * 3, y + amp * .6); c.fill(); }
      }
      const rs = srand(seed + 77);
      for (let i = 0; i < 40; i++) { const j = (rs() * (N - 2)) | 0, p = pts[j]; const len = amp * (.1 + rs() * .3), lean = -Math.sign(sm[j]) * len * .5; c.strokeStyle = `rgba(80,100,135,${.12 + rs() * .12})`; c.lineWidth = 1 + rs() * 2; c.beginPath(); c.moveTo(p[0], p[1] + 2); c.quadraticCurveTo(p[0] + lean * .3, p[1] + len * .5, p[0] + lean, p[1] + len); c.stroke(); }
      c.restore();
    }
    if (haze) { const hg = c.createLinearGradient(0, minY, 0, base + amp * .25); hg.addColorStop(0, rgba(haze, .0)); hg.addColorStop(1, rgba(haze, .75)); c.fillStyle = hg; c.fillRect(-w, minY, w * 3, h); }
    c.restore();
    return pts;
  }
  function hills(c, w, h, o) { return mountains(c, w, h, Object.assign({ sharp: .7, rough: .5, freq: 1.1 }, o)); }
  function forestBand(c, w, h, y, depth, col, seed, density = 1) {
    const r = srand(seed);
    for (let x = -w * .1; x < w * 1.1; x += (4 + r() * 6) / density) {
      const th = depth * (18 + r() * 26), yy = y + r() * depth * 8;
      c.fillStyle = mix(col, '#000000', r() * .3);
      c.beginPath(); c.moveTo(x, yy - th); c.lineTo(x - th * .28, yy); c.lineTo(x + th * .28, yy); c.fill();
    }
    c.fillStyle = col; c.fillRect(-w * .1, y + depth * 6, w * 1.3, h);
  }
  function groundTex(c, w, h, y0, cols, seed, kind = 'grass') {
    const g = c.createLinearGradient(0, y0, 0, h); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
    c.fillStyle = g; c.fillRect(-w * .1, y0, w * 1.3, h - y0);
    const r = srand(seed);
    const n = kind === 'snow' ? 500 : 1600;
    for (let i = 0; i < n; i++) {
      const k = Math.pow(r(), 1.6), y = y0 + k * (h - y0), x = -w * .1 + r() * w * 1.2, s = .5 + k * 3.2;
      if (kind === 'grass') { c.strokeStyle = r() < .5 ? 'rgba(20,30,10,.25)' : 'rgba(230,220,140,.12)'; c.lineWidth = .4 + k; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - .5) * s * 2, y - s * 3); c.stroke(); }
      else if (kind === 'snow') { c.fillStyle = r() < .5 ? 'rgba(120,140,170,.12)' : 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x, y, s * 6, s * .8, 0, 0, TAU); c.fill(); }
      else { c.fillStyle = r() < .55 ? 'rgba(40,25,10,.16)' : 'rgba(255,240,210,.1)'; c.fillRect(x, y, s * 1.4, s * .7); }
    }
  }

  // ---------- sky dressing ----------
  function starField(c, w, h, n, seed) {
    const r = srand(seed);
    for (let i = 0; i < n; i++) { const x = r() * w, y = Math.pow(r(), 1.4) * h * .7, a = .2 + r() * .8, s = r() < .06 ? 1.8 : .9; c.fillStyle = `rgba(255,${240 + r() * 15 | 0},${220 + r() * 35 | 0},${a})`; c.fillRect(x, y, s, s); }
    // milky band
    for (let i = 0; i < 260; i++) { const k = r(), x = k * w, y = h * (.05 + k * .25) + (r() - .5) * h * .12; c.fillStyle = 'rgba(200,210,255,.035)'; c.beginPath(); c.arc(x, y, 6 + r() * 16, 0, TAU); c.fill(); }
  }
  function stars(ctx, w, h, n, seed, t) {
    const R = ctx.getTransform().a;
    ctx.drawImage(cached('stars' + seed + n, w, h, R, (c) => starField(c, w, h, n, seed)), 0, 0, w, h);
    const r = srand(seed + 1);
    for (let i = 0; i < 24; i++) { const x = r() * w, y = r() * h * .5, a = Math.max(0, Math.sin(t * (1 + r() * 2) + i * 3)); ctx.fillStyle = `rgba(255,255,240,${a * .9})`; ctx.fillRect(x - .5, y - 2, 1, 4); ctx.fillRect(x - 2, y - .5, 4, 1); }
  }
  function sun(ctx, x, y, r, c, glow) {
    const g = ctx.createRadialGradient(x, y, r * .2, x, y, r * 7); g.addColorStop(0, glow); g.addColorStop(.25, rgba('#ffffff', 0.04)); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
    const d = ctx.createRadialGradient(x, y, 0, x, y, r); d.addColorStop(0, '#ffffff'); d.addColorStop(.7, c); d.addColorStop(1, rgba(c.length === 7 ? c : '#ffffff', 0.0));
    ctx.fillStyle = d; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function moon(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x, y, r, x, y, r * 6); g.addColorStop(0, 'rgba(210,220,255,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
    const m = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); m.addColorStop(0, '#fbf8ea'); m.addColorStop(1, '#d9d3bd');
    ctx.fillStyle = m; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(150,145,125,.25)'; [[-.3, -.2, .22], [.25, .1, .16], [-.05, .35, .12], [.35, -.35, .1]].forEach(([a, b, s]) => { ctx.beginPath(); ctx.arc(x + a * r, y + b * r, s * r, 0, TAU); ctx.fill(); });
  }
  function godRays(ctx, x, y, w, h, t, col = '255,220,160', n = 16, a = .05) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const ang = Math.PI * .5 + (i / n - .5) * 2.2 + Math.sin(t * .12 + i * 1.7) * .03;
      const len = Math.max(w, h) * 1.4, wd = .03 + .02 * Math.sin(i * 3.1);
      const g = ctx.createRadialGradient(x, y, 0, x, y, len); g.addColorStop(0, `rgba(${col},${a * (.6 + .4 * Math.sin(t * .3 + i))})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang - wd) * len, y + Math.sin(ang - wd) * len); ctx.lineTo(x + Math.cos(ang + wd) * len, y + Math.sin(ang + wd) * len); ctx.fill();
    }
    ctx.restore();
  }
  function cloudSprite(seed, lit, shade, R) {
    return cached('cloud' + seed + lit + shade, 340, 150, R, (c) => {
      const r = srand(seed);
      const puffs = []; for (let i = 0; i < 22; i++) puffs.push([40 + r() * 260, 70 + (r() - .5) * 50 * (1 - Math.abs(i / 22 - .5)), 22 + r() * 34]);
      puffs.forEach(([x, y, s]) => { const g = c.createRadialGradient(x, y + s * .4, 0, x, y + s * .3, s * 1.2); g.addColorStop(0, rgba(shade, .55)); g.addColorStop(1, rgba(shade, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y + s * .3, s * 1.2, 0, TAU); c.fill(); });
      puffs.forEach(([x, y, s]) => { const g = c.createRadialGradient(x - s * .2, y - s * .35, 0, x, y, s); g.addColorStop(0, rgba(lit, .9)); g.addColorStop(.6, rgba(lit, .35)); g.addColorStop(1, rgba(lit, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); });
    });
  }
  function clouds(ctx, w, h, t, o) {
    const { n = 5, y0 = .05, y1 = .3, lit = '#ffffff', shade = '#9aa8b8', speed = 6, scale = 1, alpha = 1, seed = 3 } = o;
    const R = Math.min(2, ctx.getTransform().a);
    ctx.save(); ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const sp = cloudSprite(seed + i % 4, lit, shade, R);
      const k = hash(i * 31 + seed), sc = scale * (.6 + k * .9) * Math.max(.7, w / 1100);
      const x = ((k * 997 + t * speed * (0.6 + k)) % (w + 400 * sc)) - 340 * sc, y = h * lerp(y0, y1, hash(i * 7 + 1));
      ctx.drawImage(sp, x, y, 340 * sc, 150 * sc);
    }
    ctx.restore();
  }
  function mistBand(ctx, w, h, y, t, col = '#dfe6ee', a = .25, speed = 10) {
    for (let i = 0; i < 6; i++) {
      const x = ((i * 260 + t * speed) % (w + 520)) - 260, g = ctx.createRadialGradient(x, y, 0, x, y, 260);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - 260, y - 70, 520, 140);
    }
  }

  // ---------- props ----------
  function treeSprite(type, seed, R, lit = '#7fa04a', dark = '#2d4320', trunk = '#3a2a1c') {
    return cached(`tree${type}${seed}${lit}`, 240, 300, R, (c) => {
      const r = srand(seed);
      if (type === 'pine') {
        c.fillStyle = trunk; c.fillRect(116, 220, 8, 80);
        for (let i = 0; i < 9; i++) { const y = 40 + i * 24, wd = 14 + i * 9; const g = c.createLinearGradient(120 - wd, 0, 120 + wd, 0); g.addColorStop(0, dark); g.addColorStop(1, lit); c.fillStyle = g; c.beginPath(); c.moveTo(120, y - 26); c.lineTo(120 - wd, y + 18); c.quadraticCurveTo(120, y + 10, 120 + wd, y + 18); c.fill(); }
        return;
      }
      if (type === 'acacia') {
        c.strokeStyle = '#1e160e'; c.lineCap = 'round';
        [[120, 300, 120, 150, 9], [120, 170, 70, 110, 5], [120, 165, 175, 105, 5], [120, 190, 150, 130, 4]].forEach(([a, b, x, y, lw]) => { c.lineWidth = lw; c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); });
        for (let i = 0; i < 60; i++) { c.fillStyle = r() < .5 ? '#20180e' : '#33261a'; c.beginPath(); c.ellipse(40 + r() * 160, 92 + r() * 30, 18 + r() * 14, 7, 0, 0, TAU); c.fill(); }
        return;
      }
      // broadleaf (banyan / sheesham)
      c.strokeStyle = trunk; c.lineCap = 'round';
      const branch = (x, y, a, l, wd, d) => { if (d > 4 || l < 8) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = wd; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); branch(x2, y2, a - .45 - r() * .3, l * .72, wd * .65, d + 1); branch(x2, y2, a + .4 + r() * .3, l * .7, wd * .65, d + 1); };
      branch(120, 300, -Math.PI / 2, 80, 16, 0);
      const blobs = []; for (let i = 0; i < 70; i++) { const a = r() * TAU, d = Math.sqrt(r()); blobs.push([120 + Math.cos(a) * d * 95, 105 + Math.sin(a) * d * 70, 14 + r() * 22]); }
      blobs.sort((a, b) => a[1] - b[1]);
      blobs.forEach(([x, y, s]) => { const k = clamp((x - 40) / 170 * .6 + (160 - y) / 150 * .5, 0, 1); const g = c.createRadialGradient(x - s * .3, y - s * .3, 1, x, y, s); g.addColorStop(0, mix(dark, lit, k)); g.addColorStop(1, mix(dark, '#000000', .25)); c.fillStyle = g; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); });
      for (let i = 0; i < 160; i++) { c.fillStyle = r() < .5 ? rgba(lit, .5) : 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(30 + r() * 180, 40 + r() * 140, 1.5 + r() * 2.5, 0, TAU); c.fill(); }
    });
  }
  function drawTree(ctx, x, y, s, t, type = 'broad', seed = 1, cols, sway = 1) {
    const R = Math.min(2, ctx.getTransform().a);
    const sp = treeSprite(type, seed, R, ...(cols || []));
    const k = Math.sin(t * .9 + x * .01) * .025 * sway + Math.sin(t * 2.3 + seed) * .008 * sway;
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, k, 1, 0, 0); ctx.drawImage(sp, -s * .4, -s, s * .8, s); ctx.restore();
  }
  function house(c, x, y, w, h, col, opt = {}) {
    // flat-roofed brick/mud house with a lit and a shadow face
    const side = w * .22;
    c.fillStyle = mix(col, '#000000', .35); c.beginPath(); c.moveTo(x + w, y - h); c.lineTo(x + w + side, y - h - side * .35); c.lineTo(x + w + side, y - side * .35); c.lineTo(x + w, y); c.fill();
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, mix(col, '#ffffff', .08)); g.addColorStop(1, mix(col, '#000000', .1)); c.fillStyle = g; c.fillRect(x, y - h, w, h);
    c.fillStyle = mix(col, '#000000', .2); c.fillRect(x - 2, y - h - 4, w + 4, 6); c.fillStyle = mix(col, '#000000', .45); c.beginPath(); c.moveTo(x + w + 2, y - h - 4); c.lineTo(x + w + side, y - h - side * .35 - 3); c.lineTo(x + w + side, y - h - side * .35 + 2); c.lineTo(x + w + 2, y - h + 2); c.fill();
    const r = srand(x * 13 + y);
    for (let i = 0; i < 40; i++) { c.fillStyle = r() < .5 ? 'rgba(0,0,0,.06)' : 'rgba(255,240,220,.06)'; c.fillRect(x + r() * w, y - r() * h, 3 + r() * 9, 1 + r() * 3); }
    c.fillStyle = '#2b1d12'; c.fillRect(x + w * .42, y - h * .58, w * .16, h * .58);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + w * .42, y - h * .58, w * .16, 3);
    (opt.windows || [[.12, .55], [.74, .55]]).forEach(([wx, wy]) => { c.fillStyle = '#1b130c'; c.fillRect(x + w * wx, y - h * wy, w * .14, h * .2); if (opt.lit) { c.fillStyle = 'rgba(255,190,100,.85)'; c.fillRect(x + w * wx + 1, y - h * wy + 1, w * .14 - 2, h * .2 - 2); } });
    if (opt.tank) { c.fillStyle = '#c9c4b5'; c.fillRect(x + w * .7, y - h - 18, 16, 14); c.fillStyle = '#9d988a'; c.fillRect(x + w * .7, y - h - 18, 16, 3); }
  }
  function litWindows(ctx, rects, t, warm = '255,200,120') {
    rects.forEach((r, i) => { const f = .75 + .25 * Math.sin(t * (1.3 + (i % 5) * .3) + i) * (i % 7 === 0 ? 1 : .2); ctx.fillStyle = `rgba(${warm},${.7 * f})`; ctx.fillRect(r[0], r[1], r[2], r[3]); });
  }
  function flag(ctx, x, y, fw, fh, t, pole = true, col = '#0b6b3a', emblem = true) {
    if (pole) { const pg = ctx.createLinearGradient(x - 4, 0, x + 2, 0); pg.addColorStop(0, '#888'); pg.addColorStop(.5, '#eee'); pg.addColorStop(1, '#777'); ctx.fillStyle = pg; ctx.fillRect(x - 4, y - 6, 5, fh * 3.4); ctx.fillStyle = '#d8b24a'; ctx.beginPath(); ctx.arc(x - 1.5, y - 7, 4, 0, TAU); ctx.fill(); }
    const strips = 30, wave = (u) => Math.sin(t * 3.6 - u * 7) * fh * .09 * u + Math.sin(t * 5.1 - u * 11) * fh * .03 * u;
    for (let i = 0; i < strips; i++) {
      const u = i / strips, sx = x + u * fw * (1 - .04 * Math.sin(t * 3.6 - u * 7) * u), off = wave(u);
      const slope = wave(u + 1 / strips) - off;
      ctx.fillStyle = (u < .25 && emblem) ? '#f4f4ef' : col; ctx.fillRect(sx, y + off, fw / strips + 1, fh);
      const sh = clamp(slope / (fh * .02), -1, 1);
      ctx.fillStyle = sh > 0 ? `rgba(0,0,0,${sh * .22})` : `rgba(255,255,255,${-sh * .14})`; ctx.fillRect(sx, y + off, fw / strips + 1, fh);
    }
    const u = .62, cx = x + fw * u, cy = y + fh * .5 + wave(u);
    if (!emblem) { const u2 = .5, cx2 = x + fw * u2, cy2 = y + fh * .5 + wave(u2); ctx.strokeStyle = '#f4f4ef'; ctx.lineWidth = Math.max(1, fh * .05); ctx.beginPath(); ctx.arc(cx2, cy2, fh * .22, 0, TAU); ctx.stroke(); return; }
    ctx.fillStyle = '#f4f4ef'; ctx.beginPath(); ctx.arc(cx, cy, fh * .27, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + fh * .09, cy - fh * .05, fh * .245, 0, TAU); ctx.fill();
    starShape(ctx, cx + fh * .2, cy - fh * .13, fh * .085, '#f4f4ef');
  }
  function starShape(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
  function lamp(ctx, x, y, r, t, c = '255,190,90', flick = 1) {
    const f = 1 - flick * (.08 + .08 * Math.sin(t * 9) * Math.sin(t * 5.3));
    const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, `rgba(${c},${.55 * f})`); g.addColorStop(.4, `rgba(${c},${.18 * f})`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function flare(ctx, x, y, s, t, col = '255,240,210') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(${col},.9)`); g.addColorStop(.15, `rgba(${col},.35)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - s, y - s, s * 2, s * 2);
    ctx.fillStyle = `rgba(${col},.18)`; ctx.fillRect(x - s * 2.2, y - 1, s * 4.4, 2);
    ctx.restore();
  }

  // ---------- particles & weather ----------
  function particles(st, key, n, make) { if (!st[key]) { st[key] = []; for (let i = 0; i < n; i++) st[key].push(make(true)); } return st[key]; }
  function snow(ctx, w, h, st, dt, n = 160, wind = 40) {
    const P = particles(st, 'snow', n, () => ({ x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 2.6, v: 18 + Math.random() * 50, p: Math.random() * 9 }));
    P.forEach(p => { p.y += p.v * dt * (p.r * .4 + .6); p.x += (wind + Math.sin(p.y * .02 + p.p) * 20) * dt * (p.r * .4 + .6); if (p.y > h) { p.y = -5; p.x = Math.random() * w; } if (p.x > w + 5) p.x = -5; ctx.fillStyle = `rgba(255,255,255,${.35 + p.r * .2})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); });
  }
  function rain(ctx, w, h, st, dt, n = 220, c = 'rgba(190,210,235,.42)') {
    const P = particles(st, 'rain', n, () => ({ x: Math.random() * (w + 200), y: Math.random() * h, v: 700 + Math.random() * 500, l: 10 + Math.random() * 18 }));
    ctx.strokeStyle = c; ctx.lineWidth = 1.1; ctx.beginPath();
    P.forEach(p => { p.y += p.v * dt; p.x -= p.v * .14 * dt; if (p.y > h) { p.y = -20; p.x = Math.random() * (w + 200); } ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * .14, p.y - p.l); });
    ctx.stroke();
    const S = particles(st, 'splash', 30, () => ({ x: Math.random() * w, t: Math.random() }));
    ctx.strokeStyle = 'rgba(200,220,240,.35)';
    S.forEach(s => { s.t += dt * 3; if (s.t > 1) { s.t = 0; s.x = Math.random() * w; s.y = h * (.75 + Math.random() * .25); } if (s.y) { ctx.beginPath(); ctx.ellipse(s.x, s.y, s.t * 7, s.t * 2, 0, 0, TAU); ctx.stroke(); } });
  }
  function dust(ctx, w, h, st, dt, c = 'rgba(255,235,190,.4)', n = 60) {
    const P = particles(st, 'dust', n, () => ({ x: Math.random() * w, y: Math.random() * h, r: .4 + Math.random() * 1.8, v: 4 + Math.random() * 16, p: Math.random() * 9 }));
    ctx.fillStyle = c;
    P.forEach(p => { p.x += p.v * dt; p.y += Math.sin(p.x * .01 + p.p) * .2; if (p.x > w) { p.x = -5; p.y = Math.random() * h; } ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(p.p + p.x * .02)); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  function fireflies(ctx, w, h, st, dt, t) {
    const P = particles(st, 'ff', 28, () => ({ x: Math.random() * w, y: h * (.5 + Math.random() * .45), p: Math.random() * 10 }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    P.forEach(p => { p.x += Math.sin(t * .7 + p.p) * 14 * dt; p.y += Math.cos(t * .5 + p.p) * 9 * dt; const a = Math.max(0, Math.sin(t * 1.6 + p.p)); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7); g.addColorStop(0, `rgba(220,255,140,${a})`); g.addColorStop(1, 'rgba(220,255,140,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - 7, p.y - 7, 14, 14); });
    ctx.restore();
  }
  function smoke(ctx, st, key, x, y, dt, col = '120,115,110', rate = 3, size = 1) {
    const P = (st[key] = st[key] || []);
    st[key + 't'] = (st[key + 't'] || 0) + dt; if (st[key + 't'] > 1 / rate) { st[key + 't'] = 0; P.push({ x, y, r: 4 * size, a: .35, vx: 6 + Math.random() * 6, vy: -14 - Math.random() * 8 }); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 7 * size * dt; p.a -= .05 * dt; if (p.a <= 0) { P.splice(i, 1); continue; } const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(${col},${p.a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
  }
  function fire(ctx, x, y, s, t, st, dt) {
    lamp(ctx, x, y - s * .5, s * 9, t, '255,140,50', 1.5);
    for (let i = 0; i < 7; i++) { const k = (t * 1.8 + i / 7) % 1, fx = x + Math.sin(i * 2.1 + t * 4) * s * .4 * (1 - k), fy = y - k * s * 2.2, r = s * .55 * (1 - k); const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r); g.addColorStop(0, `rgba(255,${230 - k * 120 | 0},120,${.9 - k * .6})`); g.addColorStop(1, 'rgba(255,80,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, r, 0, TAU); ctx.fill(); }
    const P = particles(st, 'spark', 14, () => ({ x, y, vy: -30 - Math.random() * 50, vx: (Math.random() - .5) * 20, l: Math.random() }));
    P.forEach(p => { p.l += dt * .7; p.x += p.vx * dt; p.y += p.vy * dt; if (p.l > 1) { p.l = 0; p.x = x; p.y = y - s * .4; } ctx.fillStyle = `rgba(255,${180 - p.l * 100 | 0},60,${1 - p.l})`; ctx.fillRect(p.x, p.y, 1.6, 1.6); });
    smoke(ctx, st, 'fsm', x, y - s * 2, dt, '90,85,80', 2, s * .15);
  }
  function lightning(ctx, w, h, t, st) {
    st.flash = st.flash || 0; st.next = st.next || t + 3;
    if (t > st.next) { st.flash = 1; st.next = t + 3 + Math.random() * 5; st.bx = w * (.2 + Math.random() * .6); if (window.SFX) SFX.thunder(); }
    if (st.flash > 0) {
      ctx.fillStyle = `rgba(220,230,255,${st.flash * .5})`; ctx.fillRect(-w, -h, w * 3, h * 3);
      if (st.flash > .55) { ctx.strokeStyle = '#eef'; ctx.shadowColor = '#aac'; ctx.shadowBlur = 14; ctx.lineWidth = 2.5; ctx.beginPath(); let x = st.bx, y = 0; ctx.moveTo(x, y); while (y < h * .55) { x += (Math.random() - .5) * 40; y += 18 + Math.random() * 22; ctx.lineTo(x, y); } ctx.stroke(); ctx.shadowBlur = 0; }
      st.flash -= .045;
    }
  }
  function birds(ctx, w, h, t, n = 6, c = 'rgba(30,22,14,.7)', y0 = .18) {
    ctx.strokeStyle = c; ctx.lineWidth = 1.5;
    for (let i = 0; i < n; i++) {
      const x = ((t * 28 + i * 47 + (i % 3) * 30) % (w + 300)) - 150, y = h * y0 + Math.sin(t * .8 + i) * 8 + (i % 4) * 11, f = Math.sin(t * 9 + i * 1.3) * 4, s = 1 - (i % 3) * .2;
      ctx.beginPath(); ctx.moveTo(x - 8 * s, y - f); ctx.quadraticCurveTo(x - 3 * s, y - 2, x, y); ctx.quadraticCurveTo(x + 3 * s, y - 2, x + 8 * s, y - f); ctx.stroke();
    }
  }
  function grass(ctx, w, h, t, st, y, col = '#4f5f24', tip = '#b5a85a', n = 140, wind = 1) {
    const B = particles(st, 'grass', n, () => ({ x: Math.random() * w * 1.1 - w * .05, l: 14 + Math.random() * 34, p: Math.random() * 9, c: Math.random() }));
    B.forEach(b => {
      const sway = Math.sin(t * 1.4 + b.x * .015 + b.p) * 6 * wind + Math.sin(t * 3.1 + b.p) * 1.5;
      ctx.strokeStyle = mix(col, tip, b.c * .7); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(b.x, y + 4); ctx.quadraticCurveTo(b.x + sway * .4, y - b.l * .5, b.x + sway, y - b.l); ctx.stroke();
    });
  }
  function walker(ctx, x, y, s, t, col, opts = {}) {
    if (!window.FIG) return;
    const k = (Math.sin(t * (opts.speed || 5)) + 1) / 2;
    FIG.draw(ctx, x, y, s, FIG.lerp(FIG.P.march1, FIG.P.march2, k), Object.assign({ color: col, simple: true }, opts));
  }
  function waterSurface(ctx, w, h, y0, t, cols, refl = null) {
    ctx.fillStyle = grad(ctx, h, cols, y0); ctx.fillRect(-w, y0, w * 3, h);
    for (let i = 0; i < 70; i++) {
      const k = i / 70, y = y0 + Math.pow(k, 1.6) * (h - y0), x = ((i * 137.5) % w) + Math.sin(t * .8 + i) * 10, l = 20 + k * 90;
      ctx.fillStyle = `rgba(255,255,255,${.05 + .07 * Math.sin(t * 1.5 + i)})`; ctx.fillRect(x, y, l, 1 + k * 1.5);
    }
    if (refl) refl.forEach(([x, col, wdt]) => { for (let y = y0; y < h; y += 4) { const a = .5 * (1 - (y - y0) / (h - y0)); ctx.fillStyle = `rgba(${col},${a * (.5 + .5 * Math.sin(t * 3 + y * .3))})`; ctx.fillRect(x + Math.sin(t * 2 + y * .15) * 6 - wdt / 2, y, wdt, 2); } });
  }

  // old helpers kept for cutscenes and missions
  function ridge(ctx, w, h, base, amp, seed, color, freq = 1, snowC = null) {
    const R = Math.min(2, ctx.getTransform().a);
    ctx.drawImage(cached(`ridge${base | 0}${amp | 0}${seed}${color}${snowC}`, w, h, R, (c) => mountains(c, w, h, { base, amp, seed, freq: freq * 1.6, top: color, bot: mix(color, '#000000', .25), snow: snowC ? '#f1f4f8' : null })), 0, 0, w, h);
  }
  function tree(ctx, x, y, s, col) { drawTree(ctx, x, y, s * 1.4, 0, 'broad', 3, [col, mix(col, '#000000', .5)], 0); }
  function floor(ctx, w, h, y, c1, c2) { ctx.fillStyle = grad(ctx, h, [c1, c2], y); ctx.fillRect(-w, y, w * 3, h - y + h); }
  function skyline(ctx, w, h, base, seed, c, t, lit = true) {
    const R = Math.min(2, ctx.getTransform().a);
    ctx.drawImage(cached(`sky${seed}${c}${base | 0}`, w, h, R, (cc) => cityBlock(cc, w, h, base, seed, c, .3)), 0, 0, w, h);
  }
  function cityBlock(c, w, h, base, seed, col, tall, litP = .35, warm = true) {
    const r = srand(seed); let x = -w * .1;
    while (x < w * 1.1) {
      const bw = 26 + r() * 70, bh = 30 + r() * h * tall;
      const g = c.createLinearGradient(x, 0, x + bw, 0); g.addColorStop(0, mix(col, '#ffffff', .06)); g.addColorStop(1, mix(col, '#000000', .2)); c.fillStyle = g; c.fillRect(x, base - bh, bw, bh + h);
      if (r() < .3) { c.fillStyle = col; c.fillRect(x + bw * .4, base - bh - 14, 3, 14); }
      for (let wy = base - bh + 7; wy < base - 4; wy += 9) for (let wx = x + 4; wx < x + bw - 5; wx += 7) {
        if (r() < litP) { const k = r(); c.fillStyle = warm ? `rgba(255,${190 + k * 50 | 0},${110 + k * 60 | 0},${.45 + k * .45})` : `rgba(${170 + k * 60 | 0},210,255,${.4 + k * .4})`; c.fillRect(wx, wy, 3.5, 4.5); }
      }
      x += bw + 1 + r() * 5;
    }
  }

  // ---------- camera ----------
  function camera(t, st) { if (st.cam) return st.cam; return { x: Math.sin(t * .045) * .8 + Math.sin(t * .017) * .2, z: 1.045 + Math.sin(t * .031) * .018, y: Math.sin(t * .05) * .004 }; }
  function makeK(name, ctx, w, h, R, cam) {
    const K = {
      par: d => -cam.x * w * .028 * d,
      layer(id, d, fn) { const W = w * 1.2; const c = cached(name + ':' + id, W, h, R, (cc) => { cc.translate(w * .1, 0); fn(cc, w, h); }); ctx.drawImage(c, -w * .1 + K.par(d), 0, W, h); },
      at(d, fn) { ctx.save(); ctx.translate(K.par(d), 0); fn(); ctx.restore(); },
    };
    return K;
  }

  // ---------- scenes ----------
  const D = {}; // scene definitions: (ctx, w, h, t, st, dt, K)

  D.title = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h, ['#03060b', '#0b1420', '#1b2a26', '#4a3a24']);
    K.at(.05, () => { stars(ctx, w, h, 420, 13, t); moon(ctx, w * .18, h * .16, Math.min(w, h) * .028); });
    K.layer('far', .2, (c) => mountains(c, w, h, { base: h * .6, amp: h * .3, seed: 2, top: '#4b5a70', bot: '#1a2430', snow: '#c9d6e6', snowLine: .55, haze: '#24301f', light: -1 }));
    mistBand(ctx, w, h, h * .6, t, '#7a8a80', .12, 8);
    K.layer('mid', .5, (c) => mountains(c, w, h, { base: h * .74, amp: h * .2, seed: 5, top: '#1d2620', bot: '#0d120e', light: -1, haze: '#141c16' }));
    K.at(.6, () => flag(ctx, w * .7, h * .2, Math.min(w * .22, 280), Math.min(w * .14, 175), t));
    K.layer('near', .9, (c) => hills(c, w, h, { base: h * .95, amp: h * .12, seed: 8, top: '#0b0f0c', bot: '#050705' }));
    dust(ctx, w, h, st, dt, 'rgba(224,168,62,.5)', 50);
    vignette(ctx, w, h, .65);
  };

  D.village = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .72, ['#2a4a76', '#7b6f8a', '#d98b55', '#f6c67e']);
    const sx = w * .8 + K.par(.05), sy = h * .5;
    sun(ctx, sx, sy, Math.min(w, h) * .04, '#fff1cc', 'rgba(255,190,110,.55)');
    clouds(ctx, w, h, t, { n: 5, y0: .04, y1: .3, lit: '#ffd9a8', shade: '#8a6a78', speed: 4, alpha: .85 });
    birds(ctx, w, h, t, 7);
    K.layer('far', .15, (c) => hills(c, w, h, { base: h * .6, amp: h * .1, seed: 3, top: '#8a7b8e', bot: '#b48a72', haze: '#e8b07a', light: -1 }));
    K.layer('mid', .35, (c) => { hills(c, w, h, { base: h * .67, amp: h * .06, seed: 7, top: '#6f6a3a', bot: '#5a5a2a', haze: '#c99a62', light: -1 }); });
    K.layer('fields', .55, (c) => {
      groundTex(c, w, h, h * .66, ['#9c8a3c', '#6a6a2a', '#3e4a1e'], 4);
      const vx = w * .5, vy = h * .62;
      for (let i = -14; i < 16; i++) { c.fillStyle = i % 3 === 0 ? 'rgba(232,196,52,.55)' : i % 3 === 1 ? 'rgba(90,120,40,.35)' : 'rgba(150,130,60,.2)'; c.beginPath(); c.moveTo(vx, vy); c.lineTo(w * .5 + i * w * .14, h * 1.1); c.lineTo(w * .5 + (i + 1) * w * .14, h * 1.1); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.0)';
      const g = c.createLinearGradient(0, h * .62, 0, h * .78); g.addColorStop(0, 'rgba(240,190,120,.7)'); g.addColorStop(1, 'rgba(240,190,120,0)'); c.fillStyle = g; c.fillRect(-w * .1, h * .62, w * 1.3, h * .2);
      house(c, w * .04, h * .71, w * .15, h * .12, '#b98d62', { lit: true, tank: true });
      house(c, w * .21, h * .705, w * .1, h * .09, '#a87e57', {});
      house(c, w * .74, h * .715, w * .18, h * .13, '#bf9468', { lit: true, windows: [[.1, .6], [.62, .6]] });
      c.fillStyle = '#9a7650'; c.fillRect(w * .31, h * .69, w * .2, h * .022);
    });
    K.at(.55, () => { smoke(ctx, st, 'ch', w * .16, h * .58, dt, '200,190,180', 1.6, 1.2); });
    // farmer with buffalo
    K.at(.6, () => {
      const bx = ((t * 14) % (w * 1.4)) - w * .2, by = h * .735;
      ctx.fillStyle = '#1e1712'; ctx.beginPath(); ctx.ellipse(bx, by - 16, 26, 12, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(bx + 26, by - 20, 9, 7, .3, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#1e1712'; ctx.lineWidth = 4; ctx.beginPath(); [-16, -6, 10, 18].forEach((o, i) => { const sw = Math.sin(t * 4 + i * 1.6) * 4; ctx.moveTo(bx + o, by - 8); ctx.lineTo(bx + o + sw, by + 4); }); ctx.stroke();
      walker(ctx, bx - 40, by + 4, h * .1, t * .8, '#2a2018');
    });
    K.at(.8, () => { drawTree(ctx, w * .5, h * .76, h * .5, t, 'broad', 11, ['#8aa04a', '#2a3a1a']); drawTree(ctx, w * .66, h * .74, h * .32, t, 'broad', 4, ['#90a855', '#2d4320']); });
    godRays(ctx, sx, sy, w, h, t, '255,210,150', 18, .045);
    // kite
    const kx = w * .32 + Math.sin(t * .8) * 30 + Math.sin(t * 2.1) * 6, ky = h * .2 + Math.cos(t * 1.1) * 14;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(kx, ky + 12); ctx.quadraticCurveTo(kx + 50, h * .5, w * .24 + K.par(.6), h * .74); ctx.stroke();
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(Math.sin(t * 2) * .2); ctx.fillStyle = '#d8333a'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(11, 0); ctx.lineTo(0, 14); ctx.lineTo(-11, 0); ctx.fill(); ctx.fillStyle = '#f4e04a'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(11, 0); ctx.lineTo(0, 0); ctx.fill(); ctx.restore();
    K.at(1, () => grass(ctx, w, h, t, st, h * 1.0, '#3b4a1a', '#c8b060', 160));
    dust(ctx, w, h, st, dt, 'rgba(255,225,170,.45)', 50);
    vignette(ctx, w, h, .42);
  };

  D.home = (ctx, w, h, t, st, dt, K) => {
    K.layer('room', .3, (c) => {
      c.fillStyle = grad(c, h, ['#4a3828', '#3a2a1e', '#2a1d13']); c.fillRect(-w * .1, 0, w * 1.3, h);
      const r = srand(9); for (let i = 0; i < 2600; i++) { c.fillStyle = r() < .5 ? 'rgba(0,0,0,.05)' : 'rgba(255,230,190,.04)'; c.beginPath(); c.arc(-w * .1 + r() * w * 1.3, r() * h * .74, 1 + r() * 6, 0, TAU); c.fill(); }
      c.fillStyle = '#5a4230'; c.fillRect(-w * .1, h * .72, w * 1.3, h * .3); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-w * .1, h * .72, w * 1.3, 4);
      // rug
      c.fillStyle = '#7a2c22'; c.beginPath(); c.moveTo(w * .25, h * .82); c.lineTo(w * .75, h * .82); c.lineTo(w * .85, h * 1.02); c.lineTo(w * .15, h * 1.02); c.fill();
      c.strokeStyle = '#d8a84a'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * .28, h * .85); c.lineTo(w * .72, h * .85); c.lineTo(w * .8, h); c.lineTo(w * .2, h); c.closePath(); c.stroke();
      // window frame
      c.fillStyle = '#2b1f16'; c.fillRect(w * .64, h * .16, w * .22, h * .34);
      // photo of father, shelf
      c.fillStyle = '#5b4330'; c.fillRect(w * .08, h * .38, w * .26, h * .018); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(w * .08, h * .398, w * .26, h * .01);
      c.fillStyle = '#c9a24a'; c.fillRect(w * .12, h * .22, w * .08, h * .15); c.fillStyle = '#d8d0b4'; c.fillRect(w * .127, h * .232, w * .066, h * .126);
      c.fillStyle = '#e8ecf0'; c.fillRect(w * .13, h * .24, w * .06, h * .05); c.fillStyle = '#4c5a36'; c.beginPath(); c.moveTo(w * .14, h * .358); c.lineTo(w * .145, h * .3); c.lineTo(w * .175, h * .3); c.lineTo(w * .18, h * .358); c.fill(); c.fillStyle = '#b0855e'; c.beginPath(); c.arc(w * .16, h * .29, w * .009, 0, TAU); c.fill(); c.fillStyle = '#1f2a1c'; c.beginPath(); c.ellipse(w * .158, h * .278, w * .011, w * .005, -.3, 0, TAU); c.fill();
      c.fillStyle = '#e9e2cc'; c.fillRect(w * .23, h * .3, w * .05, h * .08); c.fillStyle = '#7a3b2a'; c.fillRect(w * .235, h * .31, w * .04, h * .06);
      // charpai
      c.fillStyle = '#6a4a2a'; c.fillRect(w * .02, h * .79, w * .3, h * .03); c.fillRect(w * .03, h * .82, w * .014, h * .1); c.fillRect(w * .3, h * .82, w * .014, h * .1);
      c.strokeStyle = 'rgba(220,190,130,.7)'; c.lineWidth = 1; for (let i = 0; i < 26; i++) { c.beginPath(); c.moveTo(w * .02 + i * w * .0115, h * .79); c.lineTo(w * .02 + i * w * .0115 + 7, h * .82); c.stroke(); }
    });
    K.at(.3, () => {
      ctx.save(); ctx.beginPath(); ctx.rect(w * .655, h * .175, w * .19, h * .31); ctx.clip();
      sky(ctx, w, h * .5, ['#06101e', '#16233a']); stars(ctx, w, h * .6, 120, 3, t); moon(ctx, w * .78, h * .25, h * .025);
      ctx.restore();
      ctx.fillStyle = '#2b1f16'; ctx.fillRect(w * .748, h * .175, 4, h * .31); ctx.fillRect(w * .655, h * .33, w * .19, 4);
      // curtain
      const cw = Math.sin(t * .7) * 6 + Math.sin(t * 1.9) * 2;
      ctx.fillStyle = '#7a3d5a'; ctx.beginPath(); ctx.moveTo(w * .64, h * .14); ctx.lineTo(w * .7, h * .14); ctx.quadraticCurveTo(w * .69 + cw, h * .32, w * .7 + cw, h * .52); ctx.lineTo(w * .64, h * .52); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(w * .66, h * .14, 3, h * .38);
    });
    // swinging lantern
    const lx = w * .48 + Math.sin(t * .9) * 6, ly = h * .28;
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w * .48, 0); ctx.lineTo(lx, ly - 18); ctx.stroke();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(lx - 9, ly - 18, 18, 5); ctx.fillStyle = 'rgba(255,220,150,.9)'; ctx.beginPath(); ctx.ellipse(lx, ly, 8, 12, 0, 0, TAU); ctx.fill();
    lamp(ctx, lx, ly, Math.max(w, h) * .65, t, '255,170,80', 1.4);
    // moths
    for (let i = 0; i < 3; i++) { const a = t * (2 + i) + i * 2; ctx.fillStyle = 'rgba(240,220,180,.8)'; ctx.fillRect(lx + Math.cos(a) * (18 + i * 8), ly + Math.sin(a * 1.3) * 14, 2, 2); }
    vignette(ctx, w, h, .7);
  };

  D.school = (ctx, w, h, t, st, dt, K) => {
    K.layer('room', .3, (c) => {
      c.fillStyle = grad(c, h, ['#e3d9bb', '#cfc4a3']); c.fillRect(-w * .1, 0, w * 1.3, h * .55);
      c.fillStyle = grad(c, h * .74, ['#5c7a5a', '#4a6648'], h * .52); c.fillRect(-w * .1, h * .52, w * 1.3, h * .22);
      c.fillStyle = '#3f5a3f'; c.fillRect(-w * .1, h * .52, w * 1.3, 4);
      const r = srand(4); for (let i = 0; i < 1400; i++) { c.fillStyle = r() < .5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.04)'; c.fillRect(-w * .1 + r() * w * 1.3, r() * h * .72, 2 + r() * 7, 1 + r() * 3); }
      // board
      c.fillStyle = '#6a4a2e'; c.fillRect(w * .1, h * .12, w * .52, h * .34); c.fillStyle = '#26402e'; c.fillRect(w * .115, h * .135, w * .49, h * .31);
      for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(255,255,255,.03)'; c.beginPath(); c.ellipse(w * (.15 + r() * .4), h * (.17 + r() * .25), 30 + r() * 50, 8, r(), 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(245,245,235,.82)'; c.font = `${Math.max(12, h * .034)}px "Share Tech Mono", monospace`;
      c.fillText('Matric Examination 2026', w * .14, h * .2); c.fillText('Physics  Paper II', w * .14, h * .27); c.fillText('Q4.  v = u + at', w * .14, h * .34); c.fillText('Time allowed: 3 hrs', w * .14, h * .41);
      c.fillStyle = '#8a6a44'; c.fillRect(w * .1, h * .46, w * .52, h * .012);
      // window
      c.fillStyle = '#6a5a40'; c.fillRect(w * .7, h * .1, w * .24, h * .38);
      const sg = c.createLinearGradient(0, h * .1, 0, h * .48); sg.addColorStop(0, '#9fc8e8'); sg.addColorStop(1, '#e9f0e0'); c.fillStyle = sg; c.fillRect(w * .71, h * .115, w * .22, h * .35);
      drawTreeStatic(c, w * .78, h * .47, h * .28); c.fillStyle = '#6a5a40'; c.fillRect(w * .815, h * .1, 5, h * .38); c.fillRect(w * .7, h * .29, w * .24, 5);
      // desks
      c.fillStyle = '#6e4e30'; c.fillRect(-w * .1, h * .74, w * 1.3, h * .3);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) { const y = h * (.7 + row * .1), dw = w * (.16 + row * .02), x = -w * .05 + i * w * .25 - row * w * .02; c.fillStyle = mix('#7a5636', '#000000', .1 * row); c.fillRect(x, y, dw, h * .035); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x, y + h * .035, dw, h * .02); c.fillStyle = '#3a2614'; c.fillRect(x + 4, y + h * .055, 5, h * .06); c.fillRect(x + dw - 9, y + h * .055, 5, h * .06); }
    });
    // ceiling fan + shadow
    ctx.save(); ctx.translate(w * .45, h * .03); ctx.rotate(t * 7); ctx.fillStyle = '#5a5040'; for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(w * .06, 0, w * .06, 6, 0, 0, TAU); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#3a3428'; ctx.beginPath(); ctx.arc(w * .45, h * .03, 8, 0, TAU); ctx.fill();
    // sunbeams through the window
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const g = ctx.createLinearGradient(w * .8, h * .2, w * .35, h * .95); g.addColorStop(0, `rgba(255,240,200,${.13 + .03 * Math.sin(t * .5 + i)})`); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * (.72 + i * .05), h * .12); ctx.lineTo(w * (.74 + i * .05), h * .12); ctx.lineTo(w * (.3 + i * .08), h); ctx.lineTo(w * (.22 + i * .08), h); ctx.fill(); }
    ctx.restore();
    dust(ctx, w, h, st, dt, 'rgba(255,245,210,.7)', 70);
    vignette(ctx, w, h, .35);
  };
  function drawTreeStatic(c, x, y, s) { c.fillStyle = '#4a3a24'; c.fillRect(x - 3, y - s * .4, 6, s * .4); const r = srand(x | 0); for (let i = 0; i < 30; i++) { c.fillStyle = r() < .5 ? '#5d7f3a' : '#3d5a26'; c.beginPath(); c.arc(x + (r() - .5) * s * .6, y - s * .55 + (r() - .5) * s * .4, s * (.08 + r() * .08), 0, TAU); c.fill(); } }

  D.issb = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#1c2a48', '#6a4a5a', '#c8704a', '#eba86a']);
    sun(ctx, w * .25 + K.par(.05), h * .58, Math.min(w, h) * .05, '#ffd8a0', 'rgba(255,140,80,.5)');
    clouds(ctx, w, h, t, { n: 4, y0: .05, y1: .25, lit: '#f0a070', shade: '#5a3a50', speed: 3, alpha: .8 });
    K.layer('far', .2, (c) => mountains(c, w, h, { base: h * .6, amp: h * .2, seed: 12, top: '#6a4a46', bot: '#8a5a44', haze: '#d08a5a', light: 1 }));
    K.layer('mid', .45, (c) => {
      hills(c, w, h, { base: h * .68, amp: h * .08, seed: 15, top: '#6a5038', bot: '#4a3828', light: 1 });
      groundTex(c, w, h, h * .66, ['#8a6a48', '#5a4630', '#3a2c1c'], 8, 'dirt');
      c.fillStyle = '#ded4bc'; c.fillRect(w * .06, h * .5, w * .38, h * .16); c.fillStyle = '#b0a690'; c.fillRect(w * .44, h * .51, w * .04, h * .15);
      c.fillStyle = '#9a3b2c'; c.fillRect(w * .05, h * .48, w * .4, h * .028);
      for (let i = 0; i < 8; i++) { c.fillStyle = '#2a2a2e'; c.fillRect(w * (.08 + i * .045), h * .545, w * .024, h * .045); }
      c.fillStyle = '#444'; for (let i = 0; i < 4; i++) c.fillRect(w * (.52 + i * .12), h * .54, 3, h * .12);
    });
    litWindows(ctx, Array.from({ length: 8 }, (_, i) => [w * (.08 + i * .045) + K.par(.45) + 1, h * .546, w * .022, h * .043]), t);
    K.at(.45, () => { for (let i = 0; i < 4; i++) lamp(ctx, w * (.52 + i * .12), h * .54, h * .12, t, '255,210,140', .3); flag(ctx, w * .74, h * .22, w * .12, w * .075, t); });
    K.at(.6, () => { walker(ctx, ((t * 20) % (w * 1.2)) - w * .1, h * .72, h * .09, t, '#2a2420'); drawTree(ctx, w * .92, h * .72, h * .3, t, 'broad', 21, ['#6a6a3a', '#2a2a14']); });
    dust(ctx, w, h, st, dt, 'rgba(255,200,150,.45)', 60);
    vignette(ctx, w, h, .5);
  };

  D.pma = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#3e7fbf', '#79afd9', '#c6e0ef', '#eaf2f0']);
    clouds(ctx, w, h, t, { n: 6, y0: .02, y1: .28, lit: '#ffffff', shade: '#8ea4ba', speed: 5 });
    K.layer('far', .12, (c) => mountains(c, w, h, { base: h * .48, amp: h * .26, seed: 31, top: '#7d93a8', bot: '#a8bccb', snow: '#f6f9fc', snowLine: .5, haze: '#c9dbe6', light: 1 }));
    K.layer('mid', .3, (c) => { hills(c, w, h, { base: h * .6, amp: h * .14, seed: 34, top: '#3c6a46', bot: '#2c5236', light: 1, haze: '#9ab8b0' }); forestBand(c, w, h, h * .58, 1, '#24452c', 6, 1.2); });
    K.layer('acad', .55, (c) => {
      groundTex(c, w, h, h * .66, ['#a39672', '#867a5a', '#6a6046'], 9, 'dirt');
      const bx = w * .08, by = h * .665, bw = w * .84, bh = h * .14;
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(bx, by, bw, h * .02);
      const bg = c.createLinearGradient(0, by - bh, 0, by); bg.addColorStop(0, '#c4603f'); bg.addColorStop(1, '#a24a30'); c.fillStyle = bg; c.fillRect(bx, by - bh, bw, bh);
      const r = srand(2); for (let i = 0; i < 500; i++) { c.fillStyle = r() < .5 ? 'rgba(0,0,0,.08)' : 'rgba(255,220,200,.07)'; c.fillRect(bx + r() * bw, by - r() * bh, 5, 2); }
      const n = 14, aw = (bw - 20) / n;
      for (let i = 0; i < n; i++) { const ax = bx + 10 + i * aw; c.fillStyle = '#ece4d2'; c.beginPath(); c.moveTo(ax + 3, by); c.lineTo(ax + 3, by - bh * .5); c.arc(ax + aw / 2, by - bh * .5, aw / 2 - 3, Math.PI, 0); c.lineTo(ax + aw - 3, by); c.fill(); c.fillStyle = 'rgba(40,30,20,.5)'; c.beginPath(); c.moveTo(ax + 7, by); c.lineTo(ax + 7, by - bh * .46); c.arc(ax + aw / 2, by - bh * .46, aw / 2 - 7, Math.PI, 0); c.lineTo(ax + aw - 7, by); c.fill(); }
      c.fillStyle = '#e8dcc6'; c.fillRect(bx - 4, by - bh - 5, bw + 8, 7);
      const tx = bx + bw * .44, tw = bw * .12; c.fillStyle = '#b5543a'; c.fillRect(tx, by - bh * 1.75, tw, bh * .8); c.fillStyle = '#e8dcc6'; c.fillRect(tx - 4, by - bh * 1.78, tw + 8, 6);
      c.fillStyle = '#f2ead8'; c.beginPath(); c.arc(tx + tw / 2, by - bh * 1.42, bh * .17, 0, TAU); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-w * .1, h * (.73 + i * .06)); c.lineTo(w * 1.2, h * (.73 + i * .06)); c.stroke(); }
    });
    K.at(.55, () => {
      const tx = w * .08 + w * .84 * .44 + w * .84 * .06, ty = h * .665 - h * .14 * 1.42;
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(t * .05) * h * .016, ty + Math.sin(t * .05) * h * .016); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(t * .6) * h * .02, ty + Math.sin(t * .6) * h * .02); ctx.stroke();
      flag(ctx, tx, h * .665 - h * .14 * 2.6, w * .075, w * .047, t);
      // a squad marching across the square
      const sx = ((t * 22) % (w * 1.4)) - w * .2;
      for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) walker(ctx, sx - i * h * .035 - r * 10, h * (.75 + r * .02), h * .08, t * 1.2, '#7a6a48', { rifle: true });
    });
    birds(ctx, w, h, t, 4, 'rgba(40,40,50,.6)', .12);
    godRays(ctx, w * .85 + K.par(.05), -h * .05, w, h, t, '255,250,230', 12, .035);
    vignette(ctx, w, h, .28);
  };

  D.barracks = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#02050c', '#0a1426', '#15233a', '#1f2e3a']);
    K.at(.05, () => { stars(ctx, w, h, 380, 9, t); moon(ctx, w * .82, h * .15, Math.min(w, h) * .028); });
    K.layer('far', .2, (c) => mountains(c, w, h, { base: h * .58, amp: h * .2, seed: 41, top: '#22324a', bot: '#101a26', snow: '#8ea2bc', snowLine: .6, light: -1 }));
    mistBand(ctx, w, h, h * .58, t, '#5a6a80', .1, 6);
    K.layer('ground', .5, (c) => {
      groundTex(c, w, h, h * .64, ['#1d2618', '#141a10', '#0a0d08'], 41, 'dirt');
      for (let i = 0; i < 4; i++) { const x = w * (.02 + i * .25), y = h * .67, tw = w * .19, th = h * .13; c.fillStyle = '#353a26'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + tw / 2, y - th); c.lineTo(x + tw, y); c.fill(); c.fillStyle = '#262a1b'; c.beginPath(); c.moveTo(x + tw / 2, y - th); c.lineTo(x + tw, y); c.lineTo(x + tw * .62, y); c.fill(); c.fillStyle = '#ff9a40'; c.globalAlpha = .45; c.beginPath(); c.moveTo(x + tw * .42, y); c.lineTo(x + tw / 2, y - th * .45); c.lineTo(x + tw * .58, y); c.fill(); c.globalAlpha = 1; }
      c.fillStyle = '#1a1f14'; c.fillRect(w * .78, h * .62, w * .12, h * .05); c.fillRect(w * .8, h * .595, w * .06, h * .03); c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(w * .8, h * .675, h * .015, 0, TAU); c.arc(w * .88, h * .675, h * .015, 0, TAU); c.fill();
    });
    K.at(.5, () => { for (let i = 0; i < 4; i++) lamp(ctx, w * (.02 + i * .25) + w * .095, h * .66, h * .14, t + i, '255,150,70', .6); });
    K.at(.7, () => { fire(ctx, w * .52, h * .78, h * .035, t, st, dt); const sx = w * .2 + Math.sin(t * .15) * w * .15, k = Math.cos(t * .15); walker(ctx, sx, h * .74, h * .13, k * t, '#0a0d08', { rifle: true, facing: k > 0 ? 1 : -1, helmet: '#141a10', speed: 3 }); });
    fireflies(ctx, w, h, st, dt, t);
    vignette(ctx, w, h, .6);
  };

  D.snowpost = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#6d8299', '#a5b6c8', '#d6e0e9']);
    clouds(ctx, w, h, t, { n: 5, y0: .0, y1: .25, lit: '#eef2f6', shade: '#8494a8', speed: 9, alpha: .8 });
    K.layer('far', .12, (c) => mountains(c, w, h, { base: h * .44, amp: h * .32, seed: 51, top: '#5d6f86', bot: '#8394a8', snow: '#f7f9fc', snowLine: .75, haze: '#b4c2d0', light: 1 }));
    mistBand(ctx, w, h, h * .44, t, '#e6edf3', .18, 14);
    K.layer('mid', .35, (c) => mountains(c, w, h, { base: h * .6, amp: h * .2, seed: 54, top: '#4e5a68', bot: '#7a8898', snow: '#ffffff', snowLine: .85, light: 1, haze: '#c8d2dc' }));
    K.layer('ground', .6, (c) => {
      groundTex(c, w, h, h * .66, ['#f2f5f8', '#d9e1e8', '#c4ced8'], 55, 'snow');
      const r = srand(5);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 9 - row; i++) { const x = w * .6 + i * w * .036 + row * w * .018, y = h * .8 - row * h * .032; const g = c.createLinearGradient(0, y - 12, 0, y + 12); g.addColorStop(0, '#c2b48c'); g.addColorStop(1, '#8c7d58'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, w * .021, h * .018, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(x, y - h * .012, w * .016, h * .006, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#1e1e18'; c.fillRect(w * .66, h * .705, w * .17, h * .02);
      c.fillStyle = '#3a3a2c'; c.fillRect(w * .73, h * .7, w * .06, 3);
    });
    K.at(.6, () => flag(ctx, w * .12, h * .33, w * .1, w * .064, t * 1.6));
    mistBand(ctx, w, h, h * .72, t, '#ffffff', .1, 22);
    snow(ctx, w, h, st, dt, 180, 80);
    vignette(ctx, w, h, .3);
  };

  D.valley = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#4e6f8e', '#9bb0b8', '#d9c49c']);
    sun(ctx, w * .2 + K.par(.05), h * .18, Math.min(w, h) * .035, '#fff6dd', 'rgba(255,235,190,.35)');
    clouds(ctx, w, h, t, { n: 3, y0: .02, y1: .2, lit: '#fff8ea', shade: '#a89a88', speed: 3, alpha: .6 });
    K.layer('far', .15, (c) => mountains(c, w, h, { base: h * .52, amp: h * .24, seed: 61, top: '#8a7562', bot: '#b39a7a', haze: '#d8c4a0', light: -1 }));
    K.layer('mid', .35, (c) => mountains(c, w, h, { base: h * .62, amp: h * .14, seed: 64, top: '#7a5c42', bot: '#9a7856', haze: '#c8ad86', light: -1, rough: 1.4 }));
    K.layer('comp', .55, (c) => {
      groundTex(c, w, h, h * .65, ['#b08c62', '#8a6a48', '#5c4630'], 66, 'dirt');
      const g = c.createLinearGradient(w * .5, 0, w * .9, 0); g.addColorStop(0, '#a88660'); g.addColorStop(1, '#8a6a4a'); c.fillStyle = g; c.fillRect(w * .5, h * .58, w * .4, h * .08);
      c.fillStyle = '#7a5c40'; c.fillRect(w * .58, h * .51, w * .11, h * .07); c.fillStyle = '#6a4e36'; c.fillRect(w * .69, h * .52, w * .02, h * .06);
      c.fillStyle = '#2a1e14'; c.fillRect(w * .63, h * .6, w * .03, h * .06); c.fillRect(w * .6, h * .535, w * .015, h * .02);
      c.fillStyle = '#8a6a4a'; c.fillRect(w * .86, h * .46, w * .05, h * .2); c.fillStyle = '#6a4e36'; c.fillRect(w * .855, h * .45, w * .06, h * .015); c.fillStyle = '#1a120c'; c.fillRect(w * .875, h * .48, w * .015, h * .02);
      for (let i = 0; i < 20; i++) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(w * .5 + i * w * .02, h * .58, 1, h * .08); }
    });
    // dust devil
    K.at(.4, () => { const dx = w * .3 + Math.sin(t * .2) * w * .1; for (let i = 0; i < 14; i++) { const k = i / 14, y = h * .62 - k * h * .3, r = 6 + k * 30; ctx.fillStyle = `rgba(190,160,120,${.12 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(dx + Math.sin(t * 6 + i) * r * .3, y, r, r * .3, 0, 0, TAU); ctx.fill(); } });
    K.at(.7, () => { for (let i = 0; i < 5; i++) { const gx = w * (.15 + i * .05) + Math.sin(t * .3 + i) * 10; ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.ellipse(gx, h * .78, 9, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(gx + 6, h * .77, 4, 4); } });
    godRays(ctx, w * .2 + K.par(.05), h * .18, w, h, t, '255,235,190', 12, .04);
    dust(ctx, w, h, st, dt, 'rgba(230,200,150,.45)', 90);
    ctx.fillStyle = 'rgba(220,190,140,.08)'; ctx.fillRect(-w, -h, w * 3, h * 3);
    vignette(ctx, w, h, .45);
  };

  D.cherat = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#2f6aa6', '#86b6d8', '#e6dcc0']);
    sun(ctx, w * .5 + K.par(.05), h * .1, Math.min(w, h) * .04, '#fffbe6', 'rgba(255,250,220,.4)');
    clouds(ctx, w, h, t, { n: 4, y0: .02, y1: .22, speed: 4, alpha: .7 });
    K.layer('far', .2, (c) => mountains(c, w, h, { base: h * .56, amp: h * .18, seed: 71, top: '#8a7a5a', bot: '#a8946c', haze: '#d8ccaa', light: 1 }));
    K.layer('ground', .5, (c) => {
      groundTex(c, w, h, h * .63, ['#b49c70', '#8e7854', '#62523a'], 72, 'dirt');
      c.strokeStyle = '#4a3a24'; c.lineWidth = 7; c.beginPath(); c.moveTo(w * .08, h * .66); c.lineTo(w * .08, h * .34); c.lineTo(w * .3, h * .34); c.lineTo(w * .3, h * .66); c.stroke();
      c.fillStyle = '#5a462c'; c.fillRect(w * .7, h * .48, w * .2, h * .17); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(w * .86, h * .48, w * .04, h * .17);
      c.strokeStyle = 'rgba(70,52,32,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * .33, h * .28); c.lineTo(w * .68, h * .48); c.stroke();
      c.fillStyle = '#3a2a1a'; c.fillRect(w * .33, h * .28, 6, h * .38);
    });
    K.at(.5, () => { ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(w * .1 + i * w * .035, h * .34); ctx.lineTo(w * .1 + i * w * .035 + Math.sin(t * 2 + i) * 4, h * .52); ctx.stroke(); } for (let i = 0; i < 5; i++) walker(ctx, ((t * 40 + i * 50) % (w * 1.3)) - w * .15, h * .7, h * .1, t * 2 + i, '#5c5034', { speed: 9 }); });
    dust(ctx, w, h, st, dt);
    vignette(ctx, w, h, .35);
  };

  D.karachi = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .62, ['#03060e', '#0d1528', '#2a2440', '#5a3a42']);
    K.at(.05, () => { stars(ctx, w, h * .6, 60, 4, t); moon(ctx, w * .14, h * .12, Math.min(w, h) * .022); });
    K.layer('far', .2, (c) => cityBlock(c, w, h, h * .6, 77, '#121a2a', .32, .25));
    const glow = ctx.createLinearGradient(0, h * .4, 0, h * .62); glow.addColorStop(0, 'rgba(255,140,80,0)'); glow.addColorStop(1, 'rgba(255,140,80,.18)'); ctx.fillStyle = glow; ctx.fillRect(-w, h * .4, w * 3, h * .22);
    K.layer('near', .4, (c) => cityBlock(c, w, h, h * .61, 91, '#080c14', .2, .45));
    K.at(.4, () => {
      [[.74, .3], [.86, .34]].forEach(([x, y]) => { ctx.strokeStyle = '#1c2434'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * x, h * .61); ctx.lineTo(w * x, h * y); ctx.lineTo(w * (x - .11), h * y); ctx.moveTo(w * x, h * y); ctx.lineTo(w * (x + .05), h * y); ctx.moveTo(w * x, h * (y - .06)); ctx.lineTo(w * (x - .11), h * y); ctx.stroke(); const on = Math.sin(t * 3 + x * 10) > 0; ctx.fillStyle = on ? '#ff3b30' : '#401010'; ctx.beginPath(); ctx.arc(w * x, h * (y - .065), 3, 0, TAU); ctx.fill(); if (on) lamp(ctx, w * x, h * (y - .065), 18, t, '255,60,40', 0); });
      // coastal road light streaks
      for (let i = 0; i < 8; i++) { const dir = i % 2 ? 1 : -1, x = ((t * 120 * dir + i * 260) % (w * 1.4) + w * 1.4) % (w * 1.4) - w * .2; ctx.fillStyle = dir > 0 ? 'rgba(255,240,200,.9)' : 'rgba(255,60,40,.85)'; ctx.fillRect(x, h * .605 + (i % 2) * 3, 6, 2); const g = ctx.createLinearGradient(x, 0, x - dir * 50, 0); g.addColorStop(0, dir > 0 ? 'rgba(255,240,200,.35)' : 'rgba(255,60,40,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x, x - dir * 50), h * .606 + (i % 2) * 3, 50, 1.5); }
    });
    waterSurface(ctx, w, h, h * .615, t, ['#0b1424', '#050a12'], [[w * .3, '255,170,90', 30], [w * .55, '255,200,140', 16], [w * .8, '255,60,40', 8], [w * .14 + K.par(.05), '230,230,210', 22]]);
    vignette(ctx, w, h, .55);
  };

  D.quetta = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#3e78ae', '#9cc2dc', '#efe4c8']);
    clouds(ctx, w, h, t, { n: 4, y0: .02, y1: .2, speed: 3, alpha: .7 });
    K.layer('far', .15, (c) => mountains(c, w, h, { base: h * .52, amp: h * .28, seed: 81, top: '#8a6e58', bot: '#b09474', snow: '#ffffff', snowLine: .75, haze: '#e4d6b8', light: 1 }));
    K.layer('mid', .4, (c) => {
      hills(c, w, h, { base: h * .63, amp: h * .08, seed: 84, top: '#a68a68', bot: '#8e7454', light: 1 });
      groundTex(c, w, h, h * .66, ['#b9a07a', '#9a8460', '#6f5c40'], 85, 'dirt');
      c.fillStyle = '#e6decd'; c.fillRect(w * .15, h * .5, w * .55, h * .16); c.fillStyle = '#c8bfae'; c.fillRect(w * .62, h * .5, w * .08, h * .16);
      c.fillStyle = '#7d2d26'; c.fillRect(w * .14, h * .48, w * .57, h * .024);
      for (let i = 0; i < 9; i++) { c.fillStyle = '#39424f'; c.fillRect(w * (.18 + i * .055), h * .54, w * .03, h * .06); c.fillStyle = 'rgba(180,210,240,.25)'; c.fillRect(w * (.18 + i * .055), h * .54, w * .03, h * .02); }
    });
    K.at(.4, () => flag(ctx, w * .42, h * .24, w * .07, w * .045, t));
    K.at(.7, () => { drawTree(ctx, w * .06, h * .74, h * .3, t, 'pine', 3, ['#4a6a40', '#1a2a18']); drawTree(ctx, w * .86, h * .73, h * .34, t, 'pine', 5, ['#4a6a40', '#1a2a18']); drawTree(ctx, w * .94, h * .75, h * .26, t, 'pine', 7, ['#4a6a40', '#1a2a18']); });
    dust(ctx, w, h, st, dt, 'rgba(240,220,180,.35)', 40);
    vignette(ctx, w, h, .3);
  };

  D.office = (ctx, w, h, t, st, dt, K) => {
    K.layer('room', .25, (c) => {
      c.fillStyle = grad(c, h, ['#3f3a2e', '#2c281f']); c.fillRect(-w * .1, 0, w * 1.3, h);
      for (let i = 0; i < 26; i++) { const x = -w * .1 + i * w * .055; c.fillStyle = i % 2 ? 'rgba(0,0,0,.06)' : 'rgba(255,230,190,.03)'; c.fillRect(x, h * .4, w * .055, h * .34); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x, h * .4, 2, h * .34); }
      c.fillStyle = '#5a4630'; c.fillRect(-w * .1, h * .395, w * 1.3, 6);
      c.fillStyle = '#d9cfad'; c.fillRect(w * .07, h * .13, w * .43, h * .32); c.strokeStyle = '#5a4a32'; c.lineWidth = 7; c.strokeRect(w * .07, h * .13, w * .43, h * .32);
      c.strokeStyle = 'rgba(70,110,70,.45)'; c.lineWidth = 1.4; for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(w * .08, h * (.15 + i * .021)); for (let x = 0; x <= 40; x++) c.lineTo(w * (.08 + x * .0102), h * (.15 + i * .021) + Math.sin(x * .4 + i) * 5 + Math.sin(x * .13 + i * 2) * 8); c.stroke(); }
      c.strokeStyle = 'rgba(160,60,40,.5)'; c.setLineDash([6, 4]); c.lineWidth = 2; c.beginPath(); c.moveTo(w * .1, h * .4); c.bezierCurveTo(w * .2, h * .3, w * .3, h * .38, w * .48, h * .16); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#4a3220'; c.fillRect(-w * .1, h * .74, w * 1.3, h * .3); c.fillStyle = '#5e4028'; c.fillRect(-w * .1, h * .74, w * 1.3, h * .02);
      c.fillStyle = '#6a4a2e'; c.fillRect(w * .58, h * .7, w * .38, h * .05); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(w * .58, h * .75, w * .38, h * .02);
      c.fillStyle = '#e8e2d0'; c.fillRect(w * .66, h * .68, w * .08, h * .02); c.fillStyle = '#111'; c.fillRect(w * .78, h * .675, w * .05, h * .025);
    });
    // window and blinds
    K.at(.25, () => {
      ctx.fillStyle = '#5a4a32'; ctx.fillRect(w * .6, h * .1, w * .32, h * .44);
      const sg = ctx.createLinearGradient(0, h * .11, 0, h * .53); sg.addColorStop(0, '#9fbfda'); sg.addColorStop(1, '#e2e6dc'); ctx.fillStyle = sg; ctx.fillRect(w * .61, h * .11, w * .3, h * .42);
      ctx.fillStyle = '#5a6a5a'; ctx.beginPath(); ctx.moveTo(w * .61, h * .53); for (let i = 0; i <= 10; i++) ctx.lineTo(w * (.61 + i * .03), h * (.4 + Math.sin(i * 1.7) * .03)); ctx.lineTo(w * .91, h * .53); ctx.fill();
      for (let i = 0; i < 15; i++) { const tilt = .5 + .5 * Math.sin(t * .4 + i * .2); ctx.fillStyle = `rgba(70,62,48,${.8})`; ctx.fillRect(w * .61, h * .11 + i * h * .028, w * .3, h * .012 * (.6 + tilt * .4)); }
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { ctx.fillStyle = `rgba(255,235,200,${.05 + .02 * Math.sin(t * .4 + i)})`; ctx.beginPath(); ctx.moveTo(w * .61, h * (.13 + i * .045)); ctx.lineTo(w * .91, h * (.13 + i * .045)); ctx.lineTo(w * .6, h * (.85 + i * .02)); ctx.lineTo(w * .2, h * (.85 + i * .02)); ctx.fill(); }
    ctx.restore();
    K.at(.25, () => { [[.2, .25], [.33, .3], [.42, .22], [.28, .36]].forEach(([x, y], i) => { const red = i === 1; ctx.fillStyle = red ? `rgba(220,50,40,${.6 + .4 * Math.sin(t * 4)})` : '#1f5d9a'; ctx.beginPath(); ctx.arc(w * x, h * y, 5, 0, TAU); ctx.fill(); if (red) lamp(ctx, w * x, h * y, 30, t, '255,60,40', 0); }); });
    // flag on a stand with folds
    K.at(.4, () => {
      ctx.fillStyle = '#c9a54a'; ctx.fillRect(w * .545, h * .17, 4, h * .58); ctx.beginPath(); ctx.arc(w * .547, h * .165, 5, 0, TAU); ctx.fill();
      for (let i = 0; i < 10; i++) { const k = i / 10; ctx.fillStyle = k < .25 ? '#e8e8e2' : '#0b6b3a'; ctx.beginPath(); ctx.moveTo(w * .549, h * (.18 + k * .03)); ctx.quadraticCurveTo(w * (.565 + Math.sin(i + t * .3) * .004), h * (.3 + k * .05), w * (.555 + k * .006), h * (.45 + k * .02)); ctx.lineTo(w * (.555 + (k + .1) * .006), h * (.45 + k * .02)); ctx.lineTo(w * .549, h * (.18 + (k + .1) * .03)); ctx.fill(); }
    });
    K.at(.6, () => { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(w * .88, h * .62, 4, h * .08); ctx.beginPath(); ctx.moveTo(w * .865, h * .63); ctx.lineTo(w * .9, h * .63); ctx.lineTo(w * .89, h * .6); ctx.lineTo(w * .875, h * .6); ctx.fill(); lamp(ctx, w * .882, h * .64, h * .32, t, '255,210,140', .1); });
    // fan shadow
    ctx.save(); ctx.translate(w * .45, h * .78); ctx.scale(1, .25); ctx.rotate(t * 5); ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(w * .1, 0, w * .1, 14, 0, 0, TAU); ctx.fill(); } ctx.restore();
    dust(ctx, w, h, st, dt, 'rgba(255,240,210,.5)', 40);
    vignette(ctx, w, h, .5);
  };

  D.flood = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#252b33', '#3d4650', '#5c656e']);
    clouds(ctx, w, h, t, { n: 7, y0: -.05, y1: .25, lit: '#7a828c', shade: '#2a3038', speed: 12, scale: 1.4, alpha: .9 });
    K.layer('far', .2, (c) => hills(c, w, h, { base: h * .52, amp: h * .06, seed: 91, top: '#3a4248', bot: '#4a5258', haze: '#5c656e' }));
    K.layer('houses', .45, (c) => {
      house(c, w * .1, h * .64, w * .15, h * .14, '#8f7a62', {}); house(c, w * .7, h * .62, w * .18, h * .16, '#97806a', {});
      c.fillStyle = '#e8e0d0'; c.fillRect(w * .73, h * .455, w * .12, h * .015);
    });
    K.at(.45, () => { for (let i = 0; i < 4; i++) walker(ctx, w * (.74 + i * .03), h * .455, h * (i > 1 ? .05 : .075), 0, '#1a1410', { speed: 0 }); drawTree(ctx, w * .45, h * .64, h * .3, t, 'broad', 33, ['#4a5a3a', '#1a2414'], 1.6); });
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(${84 - i * 7},${76 - i * 6},${58 - i * 4},.93)`;
      ctx.beginPath(); ctx.moveTo(-w, h * 2);
      for (let x = -20; x <= w + 20; x += 10) ctx.lineTo(x, h * (.6 + i * .075) + Math.sin(x * .018 + t * (1 + i * .3)) * (3 + i) + Math.sin(x * .05 - t * 2) * 2);
      ctx.lineTo(w * 2, h * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(200,190,170,.18)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = -20; x <= w + 20; x += 10) { const y = h * (.6 + i * .075) + Math.sin(x * .018 + t * (1 + i * .3)) * (3 + i) + Math.sin(x * .05 - t * 2) * 2; x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    }
    // floating debris
    for (let i = 0; i < 5; i++) { const x = ((t * (12 + i * 4) + i * 230) % (w + 100)) - 50, y = h * (.66 + i * .06) + Math.sin(t * 2 + i) * 3; ctx.fillStyle = '#4a3a28'; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t + i) * .2); ctx.fillRect(-14, -3, 28, 5); ctx.restore(); }
    const hx = ((t * 40) % (w + 300)) - 150, hy = h * .13;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sl = ctx.createLinearGradient(0, hy, 0, h * .8); sl.addColorStop(0, 'rgba(255,255,220,.2)'); sl.addColorStop(1, 'rgba(255,255,220,.03)'); ctx.fillStyle = sl; ctx.beginPath(); ctx.moveTo(hx - 4, hy + 8); ctx.lineTo(hx - 90 + Math.sin(t) * 30, h * .78); ctx.lineTo(hx + 90 + Math.sin(t) * 30, h * .78); ctx.lineTo(hx + 4, hy + 8); ctx.fill(); ctx.restore();
    if (window.FIG) FIG.heli(ctx, hx, hy, h * .06, t, '#1b2420');
    rain(ctx, w, h, st, dt, 300);
    lightning(ctx, w, h, t, st);
    vignette(ctx, w, h, .55);
  };

  D.stadium = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#02040a', '#0a1222', '#16203a']);
    K.layer('stands', .3, (c) => {
      c.fillStyle = '#121826'; c.beginPath(); c.moveTo(-w * .1, h * .63); c.lineTo(w * .08, h * .28); c.quadraticCurveTo(w * .5, h * .22, w * .92, h * .28); c.lineTo(w * 1.1, h * .63); c.fill();
      const r = srand(17); for (let i = 0; i < 2400; i++) { const k = r(), y = h * (.3 + k * .3), x = -w * .05 + r() * w * 1.1; const inside = Math.abs(x - w * .5) < w * (.42 + k * .2); if (!inside) continue; c.fillStyle = ['#0b6b3a', '#f2f2f2', '#c9b98a', '#2a2a40', '#b33', '#4a7ad8'][i % 6]; c.globalAlpha = .55 + r() * .45; c.fillRect(x, y, 2 + k * 2, 2 + k * 2); }
      c.globalAlpha = 1; c.strokeStyle = 'rgba(80,90,110,.5)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-w * .1, h * (.32 + i * .035)); c.quadraticCurveTo(w * .5, h * (.26 + i * .035), w * 1.1, h * (.32 + i * .035)); c.stroke(); }
      const pg = c.createLinearGradient(0, h * .62, 0, h); pg.addColorStop(0, '#2a6a38'); pg.addColorStop(1, '#123018'); c.fillStyle = pg; c.fillRect(-w * .1, h * .62, w * 1.3, h * .4);
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)'; c.beginPath(); c.moveTo(w * .5, h * .5); c.lineTo(-w + i * w * .4, h * 1.1); c.lineTo(-w + (i + 1) * w * .4, h * 1.1); c.fill(); }
      c.fillStyle = '#c8b88a'; c.fillRect(w * .46, h * .7, w * .08, h * .2);
    });
    // crowd shimmer
    for (let i = 0; i < 60; i++) { const x = (hash(i * 3) * w * 1.1) - w * .05 + K.par(.3), y = h * (.3 + hash(i * 5) * .3); if (Math.sin(t * 3 + i) > .7) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(x, y, 2, 2); } }
    [[.12, .08], [.88, .08], [.32, .04], [.68, .04]].forEach(([x, y], i) => {
      const lx = w * x + K.par(.3), ly = h * y;
      ctx.fillStyle = '#1a2030'; ctx.fillRect(lx - 3, ly, 6, h * .28);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(lx, ly, w * .5, h * .9); g.addColorStop(0, 'rgba(255,255,235,.22)'); g.addColorStop(1, 'rgba(255,255,235,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx - 20, ly); ctx.lineTo(w * .3, h); ctx.lineTo(w * .7, h); ctx.lineTo(lx + 20, ly); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#fffbe8'; ctx.fillRect(lx - 22, ly - 12, 44, 13); flare(ctx, lx, ly - 6, 50 + Math.sin(t * 2 + i) * 4, t);
    });
    for (let i = 0; i < 7; i++) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 80); ctx.save(); ctx.translate(w * (.25 + i * .09) + Math.sin(t * .3 + i) * 30, h * .45 - ((t * 10 + i * 30) % 120)); g.addColorStop(0, 'rgba(120,120,130,.2)'); g.addColorStop(1, 'rgba(120,120,130,0)'); ctx.fillStyle = g; ctx.fillRect(-80, -80, 160, 160); ctx.restore(); }
    ctx.fillStyle = `rgba(200,30,30,${.07 + .07 * Math.sin(t * 4)})`; ctx.fillRect(-w, -h, w * 3, h * 3);
    vignette(ctx, w, h, .55);
  };

  D.dam = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#06090e', '#141c26', '#26303c']);
    clouds(ctx, w, h, t, { n: 7, y0: -.05, y1: .22, lit: '#3c4652', shade: '#0a0e14', speed: 18, scale: 1.5 });
    K.layer('far', .2, (c) => mountains(c, w, h, { base: h * .45, amp: h * .2, seed: 101, top: '#121820', bot: '#1a222c', light: -1 }));
    K.layer('dam', .45, (c) => {
      const g = c.createLinearGradient(0, h * .4, 0, h); g.addColorStop(0, '#5a626a'); g.addColorStop(1, '#2a3036'); c.fillStyle = g; c.beginPath(); c.moveTo(-w * .1, h * .4); c.lineTo(w * 1.1, h * .4); c.lineTo(w * 1.2, h); c.lineTo(-w * .2, h); c.fill();
      const r = srand(3); for (let i = 0; i < 900; i++) { c.fillStyle = r() < .5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)'; c.fillRect(-w * .1 + r() * w * 1.3, h * .4 + r() * h * .6, 2 + r() * 10, 1 + r() * 2); }
      for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-w * .1 + i * w * .11, h * .4, 2, h * .6); }
      c.fillStyle = '#6c747c'; c.fillRect(-w * .1, h * .375, w * 1.3, h * .03); c.fillStyle = '#3a4046'; c.fillRect(-w * .1, h * .405, w * 1.3, 3);
    });
    K.at(.45, () => {
      for (let i = 0; i < 5; i++) { const x = w * (.18 + i * .16); const g = ctx.createLinearGradient(0, h * .42, 0, h); g.addColorStop(0, 'rgba(210,225,240,.75)'); g.addColorStop(1, 'rgba(210,225,240,.2)'); ctx.fillStyle = g; ctx.fillRect(x, h * .42, w * .05, h * .58); for (let k = 0; k < 6; k++) { const yy = h * .42 + ((t * 300 + k * 60 + i * 30) % (h * .58)); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + Math.sin(yy * .05) * 3, yy, w * .05, 6); } mistBand(ctx, w, h, h * .95, t + i, '#c8d4e0', .08, 30); }
      for (let i = 0; i < 6; i++) { const lx = w * (.08 + i * .17); ctx.fillStyle = '#222'; ctx.fillRect(lx, h * .32, 3, h * .06); lamp(ctx, lx + 1, h * .32, h * .12, t, '255,220,150', .3); }
    });
    rain(ctx, w, h, st, dt, 340, 'rgba(170,190,220,.5)');
    lightning(ctx, w, h, t, st);
    vignette(ctx, w, h, .6);
  };

  D.parade = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#3279c0', '#80b6e2', '#d8e8f0']);
    clouds(ctx, w, h, t, { n: 5, y0: .02, y1: .2, speed: 4, alpha: .8 });
    const jx = ((t * 140) % (w + 800)) - 400;
    ['#0b6b3a', '#ffffff', '#0b6b3a'].forEach((c, i) => { const y = h * (.12 + i * .028); const g = ctx.createLinearGradient(jx - 700, 0, jx, 0); g.addColorStop(0, rgba(c, 0)); g.addColorStop(1, rgba(c, .85)); ctx.strokeStyle = g; ctx.lineWidth = 10 + i % 2 * 2; ctx.beginPath(); ctx.moveTo(jx - 700, y + Math.sin(t) * 2); ctx.lineTo(jx, y); ctx.stroke(); ctx.fillStyle = '#4a5058'; ctx.beginPath(); ctx.moveTo(jx + 24, y); ctx.lineTo(jx - 8, y - 7); ctx.lineTo(jx - 12, y); ctx.lineTo(jx - 8, y + 7); ctx.fill(); });
    K.layer('stands', .35, (c) => {
      groundTex(c, w, h, h * .55, ['#8a7c62', '#6e6450', '#4f4637'], 111, 'dirt');
      c.fillStyle = '#ece6d8'; c.fillRect(-w * .1, h * .38, w * 1.3, h * .17); c.fillStyle = '#c9c1b0'; c.fillRect(-w * .1, h * .38, w * 1.3, h * .012);
      c.fillStyle = '#0b6b3a'; c.fillRect(-w * .1, h * .35, w * 1.3, h * .03);
      const r = srand(5); for (let i = 0; i < 1200; i++) { c.fillStyle = ['#0b6b3a', '#fff', '#c9b98a', '#2a2a2a', '#b33', '#3a5aa8'][i % 6]; c.beginPath(); c.arc(-w * .1 + r() * w * 1.3, h * .4 + r() * h * .13, 2.6, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-w * .1, h * (.62 + i * .1)); c.lineTo(w * 1.2, h * (.62 + i * .1)); c.stroke(); }
    });
    for (let i = 0; i < 40; i++) { const x = hash(i) * w * 1.1 + K.par(.35), y = h * (.41 + hash(i * 3) * .12) + Math.sin(t * 7 + i) * 1.5; ctx.fillStyle = i % 2 ? '#fff' : '#0b6b3a'; ctx.fillRect(x, y - 4, 3, 5); }
    K.at(.35, () => { for (let i = 0; i < 7; i++) flag(ctx, w * (.04 + i * .14), h * .22, w * .07, w * .045, t + i * .4); });
    K.at(.6, () => { const sx = ((t * 18) % (w * 1.5)) - w * .25; for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) walker(ctx, sx - i * h * .04 - r * 12, h * (.68 + r * .025), h * .1, t * 1.1, '#8f7f52', { rifle: true, beret: '#1f2a1c' }); });
    vignette(ctx, w, h, .3);
  };

  D.camp = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#5a4a6a', '#d8783a', '#f2b860', '#f8dca0']);
    sun(ctx, w * .3 + K.par(.05), h * .52, Math.min(w, h) * .07, '#ffd890', 'rgba(255,150,60,.5)');
    K.layer('far', .2, (c) => hills(c, w, h, { base: h * .62, amp: h * .05, seed: 121, top: '#8a5a3a', bot: '#b0703a', haze: '#f0a050' }));
    K.layer('ground', .5, (c) => {
      groundTex(c, w, h, h * .63, ['#c08a4a', '#8a5e30', '#5a3c1e'], 122, 'grass');
      for (let i = 0; i < 6; i++) { const x = w * (.28 + i * .09); c.fillStyle = i % 2 ? '#ece6d8' : '#d8d0be'; c.beginPath(); c.moveTo(x, h * .67); c.lineTo(x + w * .045, h * .57); c.lineTo(x + w * .09, h * .67); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(x + w * .045, h * .57); c.lineTo(x + w * .09, h * .67); c.lineTo(x + w * .06, h * .67); c.fill(); c.fillStyle = '#3b7fd0'; c.fillRect(x + w * .035, h * .62, w * .02, h * .012); }
    });
    K.at(.45, () => { ctx.fillStyle = '#ccc'; ctx.fillRect(w * .82, h * .34, 3, h * .32); flag(ctx, w * .823, h * .35, w * .07, w * .045, t, false, '#4b92db', false); });
    K.at(.7, () => { drawTree(ctx, w * .12, h * .7, h * .42, t, 'acacia', 4, null, .4); drawTree(ctx, w * .96, h * .69, h * .5, t, 'acacia', 8, null, .4); for (let i = 0; i < 3; i++) walker(ctx, ((t * 15 + i * 140) % (w * 1.2)) - w * .1, h * .74, h * .09, t + i, '#2a1a10'); });
    godRays(ctx, w * .3, h * .52, w, h, t, '255,180,90', 14, .04);
    dust(ctx, w, h, st, dt, 'rgba(255,220,160,.45)', 60);
    vignette(ctx, w, h, .45);
  };

  D.wedding = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h, ['#08050f', '#1c0d26', '#34142a']);
    K.layer('tent', .3, (c) => {
      const pan = ['#b8203c', '#e8b030', '#1f7a48', '#c8402a', '#2a50a0'];
      for (let i = 0; i < 12; i++) { c.fillStyle = pan[i % 5]; c.beginPath(); c.moveTo(-w * .1 + i * w * .11, h * .08); c.lineTo(-w * .1 + (i + 1) * w * .11, h * .08); c.quadraticCurveTo(-w * .1 + (i + .5) * w * .11, h * .26, -w * .1 + i * w * .11, h * .08); c.fill(); }
      c.fillStyle = '#5a1a2a'; c.fillRect(w * .22, h * .46, w * .56, h * .23); c.fillStyle = '#e8b54a'; c.fillRect(w * .22, h * .46, w * .56, h * .014);
      c.fillStyle = '#7a1a2a'; c.fillRect(w * .4, h * .5, w * .2, h * .13); c.fillStyle = '#e8b54a'; c.fillRect(w * .4, h * .5, w * .2, 4);
      groundTex(c, w, h, h * .69, ['#3a1c26', '#1c0c12'], 131, 'dirt');
    });
    for (let s = 0; s < 6; s++) {
      const y0 = h * (.06 + s * .055);
      for (let i = 0; i < 34; i++) { const x = i / 33 * w * 1.1 - w * .05 + K.par(.2), y = y0 + Math.sin(i / 33 * Math.PI) * h * .09; const on = .5 + .5 * Math.sin(t * 3 + i * .7 + s); const col = ['255,210,110', '255,100,140', '120,210,255', '160,255,140'][s % 4]; ctx.fillStyle = `rgba(${col},${.35 + on * .65})`; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); if (on > .8) lamp(ctx, x, y, 12, t, col, 0); }
    }
    // marigold garlands
    K.at(.3, () => { for (let g = 0; g < 8; g++) { const gx = w * (.25 + g * .07); for (let k = 0; k < 10; k++) { ctx.fillStyle = k % 2 ? '#f0a020' : '#f4c430'; ctx.beginPath(); ctx.arc(gx + Math.sin(t + g) * 2, h * (.47 + k * .016), 3.2, 0, TAU); ctx.fill(); } } });
    K.at(.7, () => { for (let i = 0; i < 9; i++) { const k = (Math.sin(t * 6 + i) + 1) / 2; if (window.FIG) FIG.draw(ctx, w * (.05 + i * .11), h * .9 - Math.abs(Math.sin(t * 6 + i)) * h * .015, h * .2, FIG.lerp(FIG.P.jump, FIG.P.guard, k), { color: ['#3a1020', '#10203a', '#203a10', '#3a2a10'][i % 4], simple: true }); } });
    const P = particles(st, 'petal', 60, () => ({ x: Math.random() * w, y: Math.random() * h, v: 18 + Math.random() * 30, r: Math.random() * TAU }));
    P.forEach(p => { p.y += p.v * dt; p.r += dt * 2; if (p.y > h) { p.y = -5; p.x = Math.random() * w; } ctx.save(); ctx.translate(p.x + Math.sin(p.r) * 8, p.y); ctx.rotate(p.r); ctx.fillStyle = p.v > 35 ? '#f0a020' : '#e8355a'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, TAU); ctx.fill(); ctx.restore(); });
    vignette(ctx, w, h, .55);
  };

  D.hospital = (ctx, w, h, t, st, dt, K) => {
    K.layer('ward', .25, (c) => {
      c.fillStyle = grad(c, h, ['#dfe6e8', '#c4cfd2']); c.fillRect(-w * .1, 0, w * 1.3, h * .62);
      c.fillStyle = '#8fb0b5'; c.fillRect(-w * .1, h * .62, w * 1.3, h * .4); c.fillStyle = 'rgba(0,0,0,.1)'; for (let i = 0; i < 20; i++) c.fillRect(-w * .1 + i * w * .07, h * .62, 1, h * .4);
      c.fillStyle = '#e9eef0'; c.fillRect(w * .42, h * .1, w * .2, h * .34); c.fillStyle = '#bcd8ec'; c.fillRect(w * .43, h * .11, w * .18, h * .32); c.fillStyle = '#e9eef0'; c.fillRect(w * .518, h * .1, 4, h * .34);
      c.fillStyle = '#f6f8f8'; c.fillRect(w * .03, h * .54, w * .34, h * .1); c.fillStyle = '#7fa0a6'; c.fillRect(w * .03, h * .5, w * .06, h * .16); c.fillStyle = '#dde6ea'; c.fillRect(w * .09, h * .52, w * .26, h * .03);
      c.fillStyle = '#8a9aa0'; c.fillRect(w * .4, h * .2, 3, h * .44); c.fillStyle = 'rgba(200,230,255,.8)'; c.fillRect(w * .39, h * .2, w * .03, h * .07);
      c.fillStyle = '#1b2224'; c.fillRect(w * .68, h * .2, w * .22, h * .16);
    });
    K.at(.25, () => {
      ctx.strokeStyle = '#4ef08a'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const x = w * .69 + i * w * .2 / 80, ph = (i / 80 * 3 - t * 1.2) % 1, p = ph < 0 ? ph + 1 : ph; const y = h * .28 - (p > .45 && p < .5 ? h * .06 * Math.sin((p - .45) / .05 * Math.PI) : p > .5 && p < .55 ? -h * .02 : 0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.fillStyle = '#4ef08a'; ctx.font = '12px "Share Tech Mono", monospace'; ctx.fillText('HR 78', w * .7, h * .225);
      const cw = Math.sin(t * .6) * 5; ctx.fillStyle = 'rgba(140,180,170,.85)'; ctx.beginPath(); ctx.moveTo(w * .62, h * .05); ctx.lineTo(w * .66, h * .05); ctx.quadraticCurveTo(w * .65 + cw, h * .4, w * .66 + cw, h * .62); ctx.lineTo(w * .62, h * .62); ctx.fill();
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(w * .5, h * .1, w * .3, h); g.addColorStop(0, 'rgba(255,250,235,.16)'); g.addColorStop(1, 'rgba(255,250,235,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * .43, h * .11); ctx.lineTo(w * .61, h * .11); ctx.lineTo(w * .7, h); ctx.lineTo(w * .1, h); ctx.fill(); ctx.restore();
    dust(ctx, w, h, st, dt, 'rgba(255,255,240,.5)', 30);
    vignette(ctx, w, h, .3);
  };

  D.graveyard = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#26304a', '#7a5a5a', '#d08a5a', '#e8b07a']);
    sun(ctx, w * .62 + K.par(.05), h * .6, Math.min(w, h) * .05, '#ffd2a0', 'rgba(255,140,80,.45)');
    clouds(ctx, w, h, t, { n: 4, y0: .05, y1: .3, lit: '#f0a080', shade: '#4a3a50', speed: 2, alpha: .7 });
    K.layer('far', .2, (c) => hills(c, w, h, { base: h * .63, amp: h * .05, seed: 141, top: '#4a4038', bot: '#6a5040', haze: '#c88a5a' }));
    K.layer('ground', .5, (c) => {
      groundTex(c, w, h, h * .65, ['#6b6040', '#4d4430', '#2d2618'], 142);
      for (let i = 0; i < 10; i++) { const x = w * (.04 + i * .1), y = h * (.71 + (i % 3) * .055); const g = c.createLinearGradient(x, 0, x + w * .025, 0); g.addColorStop(0, '#d8d0b8'); g.addColorStop(1, '#a8a088'); c.fillStyle = g; c.fillRect(x, y - h * .065, w * .022, h * .065); c.fillStyle = '#7a6a48'; c.beginPath(); c.ellipse(x + w * .011, y, w * .045, h * .013, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + w * .02, y - h * .065, w * .004, h * .065); }
    });
    K.at(.5, () => { ctx.fillStyle = '#ccc'; ctx.fillRect(w * .5, h * .34, 3, h * .32); flag(ctx, w * .503, h * .44, w * .065, w * .042, t * .7, false); });
    K.at(.75, () => drawTree(ctx, w * .84, h * .72, h * .46, t, 'broad', 41, ['#5a6a3a', '#1e2414']));
    mistBand(ctx, w, h, h * .74, t, '#d8b8a0', .16, 5);
    birds(ctx, w, h, t, 4);
    vignette(ctx, w, h, .5);
  };

  D.mountain_night = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .7, ['#010309', '#081222', '#13213a']);
    K.at(.05, () => { stars(ctx, w, h, 460, 21, t); moon(ctx, w * .2, h * .13, Math.min(w, h) * .025); });
    K.layer('far', .15, (c) => mountains(c, w, h, { base: h * .46, amp: h * .26, seed: 151, top: '#2a3a52', bot: '#16223a', snow: '#a6b8d0', snowLine: .55, light: -1, haze: '#0e1828' }));
    mistBand(ctx, w, h, h * .5, t, '#4a5a78', .12, 6);
    K.layer('mid', .4, (c) => { mountains(c, w, h, { base: h * .62, amp: h * .15, seed: 154, top: '#0e1826', bot: '#0a121c', light: -1 }); forestBand(c, w, h, h * .6, 1.2, '#070d14', 9, 1); });
    K.at(.4, () => { ctx.fillStyle = `rgba(255,170,90,${.6 + .3 * Math.sin(t * 2)})`; ctx.fillRect(w * .7, h * .5, 4, 3); ctx.fillRect(w * .73, h * .52, 3, 3); lamp(ctx, w * .715, h * .51, 30, t, '255,160,80', .5); });
    K.layer('near', .8, (c) => { hills(c, w, h, { base: h * .9, amp: h * .12, seed: 157, top: '#05080c', bot: '#020305' }); });
    snow(ctx, w, h, st, dt, 70, 18);
    vignette(ctx, w, h, .65);
  };

  // ---- new scenes for cutscenes ----
  D.road_night = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#020409', '#0a1220', '#16202e']);
    K.at(.05, () => stars(ctx, w, h * .7, 200, 33, t));
    K.layer('far', .2, (c) => { hills(c, w, h, { base: h * .5, amp: h * .14, seed: 161, top: '#0e1620', bot: '#0a1018' }); forestBand(c, w, h, h * .46, 1, '#081018', 11, 1.5); });
    mistBand(ctx, w, h, h * .55, t, '#506070', .16, 8);
    K.layer('road', .5, (c) => {
      c.fillStyle = '#05080a'; c.fillRect(-w * .1, h * .6, w * 1.3, h * .4);
      c.fillStyle = '#1a1c20'; c.beginPath(); c.moveTo(w * .46, h * .6); c.bezierCurveTo(w * .55, h * .7, w * .2, h * .8, w * .1, h * 1.05); c.lineTo(w * .9, h * 1.05); c.bezierCurveTo(w * .7, h * .8, w * .62, h * .7, w * .5, h * .6); c.fill();
      c.strokeStyle = 'rgba(230,210,120,.6)'; c.setLineDash([16, 18]); c.lineWidth = 3; c.beginPath(); c.moveTo(w * .48, h * .6); c.bezierCurveTo(w * .58, h * .7, w * .42, h * .8, w * .5, h * 1.05); c.stroke(); c.setLineDash([]);
    });
    K.at(.8, () => { for (let i = 0; i < 6; i++) drawTree(ctx, i < 3 ? w * (.02 + i * .07) : w * (.78 + (i - 3) * .08), h * (.78 + (i % 3) * .06), h * (.5 + (i % 2) * .15), t, 'pine', i + 2, ['#16241c', '#05080a'], .3); });
    vignette(ctx, w, h, .6);
  };
  D.port = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#03060c', '#0e1626', '#2a2436']);
    K.at(.05, () => stars(ctx, w, h * .6, 80, 41, t));
    K.layer('ship', .2, (c) => { c.fillStyle = '#121822'; c.beginPath(); c.moveTo(w * .05, h * .5); c.lineTo(w * .7, h * .5); c.lineTo(w * .66, h * .6); c.lineTo(w * .09, h * .6); c.fill(); c.fillStyle = '#1a2230'; c.fillRect(w * .52, h * .38, w * .1, h * .12); const r = srand(4); for (let i = 0; i < 40; i++) { c.fillStyle = ['#7a2a22', '#2a4a7a', '#2a6a3a', '#8a6a22'][i % 4]; c.fillRect(w * (.1 + (i % 10) * .04), h * (.44 + Math.floor(i / 10) * .015), w * .038, h * .014); } });
    K.layer('cranes', .35, (c) => { c.strokeStyle = '#1c2434'; c.lineWidth = 5; [.22, .5, .78].forEach(x => { c.beginPath(); c.moveTo(w * x, h * .7); c.lineTo(w * x, h * .18); c.lineTo(w * (x - .14), h * .18); c.moveTo(w * x, h * .18); c.lineTo(w * (x + .06), h * .18); c.moveTo(w * (x - .02), h * .7); c.lineTo(w * (x - .02), h * .25); c.stroke(); }); });
    K.at(.35, () => [.22, .5, .78].forEach((x, i) => { const on = Math.sin(t * 2.4 + i) > 0; ctx.fillStyle = on ? '#ff3b30' : '#401010'; ctx.beginPath(); ctx.arc(w * x, h * .17, 3, 0, TAU); ctx.fill(); if (on) lamp(ctx, w * x, h * .17, 24, t, '255,60,40', 0); }));
    K.layer('stacks', .6, (c) => {
      c.fillStyle = '#14181e'; c.fillRect(-w * .1, h * .7, w * 1.3, h * .3);
      const r = srand(9); const cols = ['#7a2a22', '#2a4a7a', '#2a6a3a', '#8a6a22', '#5a5a5a', '#6a3a6a'];
      for (let s = 0; s < 3; s++) for (let i = 0; i < 4; i++) { const x = w * (s < 1 ? -.05 : s < 2 ? .62 : .82) + 0, y = h * (.7 - i * .07); if (s === 2 && i > 2) continue; const col = cols[r() * 6 | 0]; const cw = w * .2; const g = c.createLinearGradient(x, 0, x + cw, 0); g.addColorStop(0, mix(col, '#000000', .2)); g.addColorStop(1, mix(col, '#000000', .55)); c.fillStyle = g; c.fillRect(x, y - h * .068, cw, h * .068); c.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 14; k++) c.fillRect(x + k * cw / 14, y - h * .068, 1, h * .068); }
    });
    K.at(.6, () => { for (let i = 0; i < 5; i++) lamp(ctx, w * (.1 + i * .2), h * .5, h * .2, t + i, '255,200,120', .2); });
    waterSurface(ctx, w, h, h * .86, t, ['#08101c', '#03060c'], [[w * .3, '255,200,120', 20], [w * .7, '255,60,40', 8]]);
    vignette(ctx, w, h, .55);
  };
  D.street = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .3, ['#05070c', '#121624']);
    K.layer('shops', .35, (c) => {
      c.fillStyle = '#16141a'; c.fillRect(-w * .1, 0, w * 1.3, h * .62);
      const r = srand(7); for (let i = 0; i < 9; i++) { const x = -w * .08 + i * w * .15; c.fillStyle = mix('#2a2420', '#000000', r() * .4); c.fillRect(x, h * .05, w * .14, h * .57); for (let k = 0; k < 4; k++) { c.fillStyle = r() < .5 ? 'rgba(255,200,120,.6)' : 'rgba(30,30,40,.9)'; c.fillRect(x + w * .02, h * (.08 + k * .09), w * .04, h * .05); c.fillRect(x + w * .08, h * (.08 + k * .09), w * .04, h * .05); } c.fillStyle = '#0a0a0c'; c.fillRect(x + w * .01, h * .46, w * .12, h * .16); }
    });
    const signs = [['CHAI', '255,80,80'], ['HOTEL', '80,200,255'], ['MOBILE', '120,255,120'], ['PHARMACY', '120,255,180'], ['TAILOR', '255,200,80']];
    K.at(.35, () => signs.forEach(([s, col], i) => { const x = -w * .05 + i * w * .23, y = h * .4; const on = Math.sin(t * 3 + i * 2) > -.8 || Math.random() < .5; ctx.save(); ctx.font = `bold ${Math.max(14, h * .045)}px "Barlow Condensed", sans-serif`; ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = on ? 18 : 0; ctx.fillStyle = on ? `rgb(${col})` : `rgba(${col},.25)`; ctx.fillText(s, x, y); ctx.restore(); if (on) lamp(ctx, x + 30, y - 8, 70, t, col, .2); }));
    // wet road with reflections
    ctx.fillStyle = grad(ctx, h, ['#101216', '#060708'], h * .62); ctx.fillRect(-w, h * .62, w * 3, h);
    signs.forEach(([s, col], i) => { const x = -w * .05 + i * w * .23 + K.par(.35); for (let y = h * .64; y < h; y += 5) { ctx.fillStyle = `rgba(${col},${.22 * (1 - (y - h * .62) / (h * .38))})`; ctx.fillRect(x + Math.sin(t * 3 + y * .2) * 4, y, 50, 2); } });
    // a passing rickshaw
    const rx = ((t * 90) % (w * 1.6)) - w * .3;
    ctx.fillStyle = '#2a2a14'; ctx.fillRect(rx, h * .62, 60, 30); ctx.fillStyle = '#e8c53a'; ctx.fillRect(rx, h * .62, 60, 4); lamp(ctx, rx + 60, h * .66, 90, t, '255,240,200', .1); ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(rx + 10, h * .72, 7, 0, TAU); ctx.arc(rx + 50, h * .72, 7, 0, TAU); ctx.fill();
    rain(ctx, w, h, st, dt, 260);
    vignette(ctx, w, h, .55);
  };
  D.avenue = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#02040a', '#0a1222', '#1c2230']);
    K.at(.05, () => { stars(ctx, w, h * .6, 120, 51, t); moon(ctx, w * .82, h * .14, Math.min(w, h) * .022); });
    K.layer('hills', .15, (c) => { hills(c, w, h, { base: h * .48, amp: h * .14, seed: 171, top: '#121a26', bot: '#0e1520' }); forestBand(c, w, h, h * .45, .8, '#0a1018', 13, 1.2); });
    K.layer('tower', .3, (c) => { c.fillStyle = '#1a2030'; c.fillRect(w * .62, h * .2, w * .012, h * .32); c.fillRect(w * .61, h * .26, w * .032, h * .03); cityBlock(c, w, h, h * .56, 181, '#0c1018', .1, .3); });
    K.at(.3, () => { const on = Math.sin(t * 2) > 0; ctx.fillStyle = on ? '#ff3b30' : '#401010'; ctx.beginPath(); ctx.arc(w * .626, h * .2, 3, 0, TAU); ctx.fill(); });
    ctx.fillStyle = grad(ctx, h, ['#16181c', '#08090a'], h * .56); ctx.fillRect(-w, h * .56, w * 3, h);
    for (let i = 0; i < 9; i++) { const k = i / 8, x1 = w * .5 - (w * .05 + k * w * .8), x2 = w * .5 + (w * .05 + k * w * .8), y = h * (.56 + k * k * .44), s = 4 + k * 40; [x1, x2].forEach(x => { ctx.fillStyle = '#222'; ctx.fillRect(x - 1, y - s * 3, 2 + k * 3, s * 3); lamp(ctx, x, y - s * 3, 30 + k * 120, t + i, '255,200,120', .1); }); }
    ctx.strokeStyle = 'rgba(220,220,200,.35)'; ctx.setLineDash([12, 16]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * .5, h * .56); ctx.lineTo(w * .5, h); ctx.stroke(); ctx.setLineDash([]);
    vignette(ctx, w, h, .55);
  };
  D.ring = (ctx, w, h, t, st, dt, K) => {
    ctx.fillStyle = '#07080a'; ctx.fillRect(-w, -h, w * 3, h * 3);
    K.layer('crowd', .3, (c) => { const r = srand(19); for (let i = 0; i < 700; i++) { const k = r(), x = -w * .1 + r() * w * 1.3, y = h * (.3 + k * .35); c.fillStyle = `rgba(${30 + k * 40 | 0},${30 + k * 30 | 0},${30 + k * 20 | 0},1)`; c.beginPath(); c.arc(x, y, 5 + k * 6, 0, TAU); c.fill(); c.fillRect(x - 6 - k * 6, y + 4, 12 + k * 12, 14); } });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(w * .5, 0, 10, w * .5, h * .7, h * .8); g.addColorStop(0, 'rgba(255,245,215,.6)'); g.addColorStop(1, 'rgba(255,245,215,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * .45, 0); ctx.lineTo(w * .55, 0); ctx.lineTo(w * .85, h); ctx.lineTo(w * .15, h); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2a4a8a'; ctx.beginPath(); ctx.moveTo(w * .1, h * .8); ctx.lineTo(w * .9, h * .8); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    [.62, .68, .74].forEach((y, i) => { ctx.strokeStyle = ['#c83030', '#eeeeee', '#3060c8'][i]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .05, h * y + Math.sin(t * 2) * 2); ctx.quadraticCurveTo(w * .5, h * (y + .02), w * .95, h * y); ctx.stroke(); });
    ctx.fillStyle = '#ddd'; ctx.fillRect(w * .05, h * .58, 8, h * .3); ctx.fillRect(w * .95 - 8, h * .58, 8, h * .3);
    for (let i = 0; i < 4; i++) { const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 120); ctx.save(); ctx.translate(w * (.3 + i * .15) + Math.sin(t * .2 + i) * 30, h * .25); g2.addColorStop(0, 'rgba(200,200,190,.08)'); g2.addColorStop(1, 'rgba(200,200,190,0)'); ctx.fillStyle = g2; ctx.fillRect(-120, -120, 240, 240); ctx.restore(); }
    for (let i = 0; i < 6; i++) if (Math.random() < .02) flare(ctx, Math.random() * w, h * (.3 + Math.random() * .3), 30, t);
    vignette(ctx, w, h, .6);
  };
  D.forest_night = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h, ['#03060c', '#0a1420', '#0e1a22']);
    K.at(.05, () => moon(ctx, w * .7, h * .12, Math.min(w, h) * .03));
    for (let L = 0; L < 3; L++) K.at(.2 + L * .3, () => { for (let i = 0; i < 9; i++) drawTree(ctx, w * (i * .13 + L * .05) - w * .05, h * (.7 + L * .12), h * (.5 + L * .25), t, 'pine', i + L * 9, [mix('#1a2a24', '#000000', L * .25), '#04080a'], .3); });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const g = ctx.createLinearGradient(w * .7, 0, w * (.3 + i * .1), h); g.addColorStop(0, 'rgba(170,200,255,.08)'); g.addColorStop(1, 'rgba(170,200,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * (.66 + i * .015), 0); ctx.lineTo(w * (.68 + i * .015), 0); ctx.lineTo(w * (.35 + i * .1), h); ctx.lineTo(w * (.3 + i * .1), h); ctx.fill(); } ctx.restore();
    mistBand(ctx, w, h, h * .8, t, '#5a6a80', .2, 8);
    fireflies(ctx, w, h, st, dt, t);
    vignette(ctx, w, h, .65);
  };
  D.rubble = (ctx, w, h, t, st, dt, K) => {
    sky(ctx, w, h * .6, ['#6a6a62', '#a89a80', '#c8b08a']);
    sun(ctx, w * .7 + K.par(.05), h * .2, Math.min(w, h) * .04, '#fff0d0', 'rgba(255,220,170,.3)');
    K.layer('far', .2, (c) => mountains(c, w, h, { base: h * .5, amp: h * .2, seed: 191, top: '#8a7a68', bot: '#a8967c', haze: '#c8b08a' }));
    K.layer('ruins', .5, (c) => {
      groundTex(c, w, h, h * .62, ['#8a7a62', '#6a5a46', '#4a3e30'], 192, 'dirt');
      const r = srand(4);
      for (let i = 0; i < 9; i++) { const x = -w * .05 + i * w * .13, bw = w * .1, bh = h * (.08 + r() * .15); c.fillStyle = mix('#b0a490', '#000000', r() * .3); c.beginPath(); c.moveTo(x, h * .66); c.lineTo(x, h * .66 - bh * (.5 + r() * .5)); c.lineTo(x + bw * .3, h * .66 - bh); c.lineTo(x + bw * .6, h * .66 - bh * .6); c.lineTo(x + bw, h * .66 - bh * (.3 + r() * .4)); c.lineTo(x + bw, h * .66); c.fill(); c.strokeStyle = '#4a4036'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + r() * bw, h * .66 - r() * bh); c.lineTo(x + r() * bw, h * .66 - r() * bh); c.stroke(); } }
      for (let i = 0; i < 70; i++) { c.fillStyle = mix('#9a8a74', '#000000', r() * .5); c.save(); c.translate(-w * .1 + r() * w * 1.3, h * (.64 + r() * .3)); c.rotate(r() * TAU); c.fillRect(-8 - r() * 16, -4, 16 + r() * 30, 8 + r() * 6); c.restore(); }
    });
    for (let i = 0; i < 5; i++) smoke(ctx, st, 'r' + i, w * (.15 + i * .18) + K.par(.5), h * .6, dt, '160,150,140', .8, 2);
    dust(ctx, w, h, st, dt, 'rgba(220,200,170,.5)', 90);
    ctx.fillStyle = 'rgba(200,180,150,.12)'; ctx.fillRect(-w, -h, w * 3, h * 3);
    vignette(ctx, w, h, .45);
  };
  D.maproom = (ctx, w, h, t, st, dt, K) => {
    ctx.fillStyle = '#0c0e0c'; ctx.fillRect(-w, -h, w * 3, h * 3);
    K.layer('table', .3, (c) => {
      c.fillStyle = '#2a2016'; c.beginPath(); c.moveTo(w * .1, h * .62); c.lineTo(w * .9, h * .62); c.lineTo(w * 1.05, h); c.lineTo(-w * .05, h); c.fill();
      c.fillStyle = '#c8bc94'; c.beginPath(); c.moveTo(w * .14, h * .64); c.lineTo(w * .86, h * .64); c.lineTo(w * .98, h * .98); c.lineTo(w * .02, h * .98); c.fill();
      c.strokeStyle = 'rgba(70,100,60,.5)'; for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(w * .1, h * (.66 + i * .02)); c.bezierCurveTo(w * .3, h * (.64 + i * .022), w * .7, h * (.7 + i * .018), w * .95, h * (.66 + i * .02)); c.stroke(); }
      c.strokeStyle = 'rgba(40,80,160,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * .3, h * .7); c.lineTo(w * .7, h * .72); c.stroke();
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(w * .5, h * .5, 10, w * .5, h * .8, h * .7); g.addColorStop(0, 'rgba(255,235,190,.4)'); g.addColorStop(1, 'rgba(255,235,190,0)'); ctx.fillStyle = g; ctx.fillRect(-w, -h, w * 3, h * 3); ctx.restore();
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.moveTo(w * .44, h * .2); ctx.lineTo(w * .56, h * .2); ctx.lineTo(w * .6, h * .26); ctx.lineTo(w * .4, h * .26); ctx.fill(); ctx.fillRect(w * .498, 0, 4, h * .2);
    const k = (t * .25) % 1; ctx.strokeStyle = 'rgba(200,40,30,.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w * .75, h * .8); ctx.lineTo(w * (.75 - k * .35), h * (.8 - k * .08)); ctx.stroke(); ctx.fillStyle = 'rgba(200,40,30,.9)'; ctx.beginPath(); ctx.arc(w * (.75 - k * .35), h * (.8 - k * .08), 7, 0, TAU); ctx.fill();
    vignette(ctx, w, h, .6);
  };


  // ---------- post-processing: bloom ----------
  const bloomA = document.createElement('canvas'), bloomB = document.createElement('canvas');
  const bA = bloomA.getContext('2d'), bB = bloomB.getContext('2d');
  const canFilter = typeof bB.filter === 'string';
  function bloom(ctx, canvas, strength = .3) {
    if (!canFilter || strength <= 0 || PERF.low) return;
    const W = Math.max(2, canvas.width >> 2), Hh = Math.max(2, canvas.height >> 2);
    if (bloomA.width !== W || bloomA.height !== Hh) { bloomA.width = bloomB.width = W; bloomA.height = bloomB.height = Hh; }
    bA.filter = 'none'; bA.clearRect(0, 0, W, Hh); bA.drawImage(canvas, 0, 0, W, Hh);
    bB.filter = 'brightness(1.15) contrast(2.6) saturate(1.3) blur(4px)'; bB.clearRect(0, 0, W, Hh); bB.drawImage(bloomA, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = strength;
    ctx.drawImage(bloomB, 0, 0, canvas.width, canvas.height); ctx.restore();
  }
  const BLOOM = { title: .55, village: .32, home: .5, school: .25, issb: .4, pma: .2, barracks: .55, snowpost: .18, valley: .22, cherat: .2, karachi: .6, quetta: .2, office: .38, flood: .35, stadium: .55, dam: .5, parade: .2, camp: .42, wedding: .6, hospital: .22, graveyard: .38, mountain_night: .5, road_night: .55, port: .55, street: .65, avenue: .55, ring: .45, forest_night: .45, rubble: .25, maproom: .45 };

  // ---------- foreground depth layer (drawn on a blurred canvas in front of the characters) ----------
  const FGK = { village: 'grass', pma: 'grass', cherat: 'rocks', camp: 'dry', graveyard: 'grass', issb: 'rocks', valley: 'rocks', rubble: 'rubble', quetta: 'rocks',
    snowpost: 'snow', mountain_night: 'snowdark', barracks: 'darkgrass', forest_night: 'ferns', home: 'room', office: 'desk', school: 'desk', hospital: 'room', maproom: 'desk',
    karachi: 'rail', street: 'lens', avenue: 'rail', port: 'rail', road_night: 'ferns', parade: 'crowd', stadium: 'crowd', wedding: 'crowd', ring: 'crowd', flood: 'lens', dam: 'lens', title: 'none' };
  function foreground(ctx, w, h, t, st, name) {
    const k = FGK[name] || 'none';
    ctx.clearRect(0, 0, w, h);
    if (k === 'none') return;
    const r = srand(name.length * 31 + 7);
    const sway = i => Math.sin(t * 1.1 + i * 1.7) * 6;
    if (k === 'grass' || k === 'darkgrass' || k === 'dry' || k === 'ferns') {
      const col = { grass: ['#2c3a14', '#566a24'], darkgrass: ['#05080a', '#121a10'], dry: ['#4a3418', '#8a6a34'], ferns: ['#030605', '#0b1410'] }[k];
      [[-.04, .2], [.82, .28]].forEach(([x0, wid], g) => {
        for (let i = 0; i < 46; i++) { const x = w * (x0 + r() * wid), len = h * (.12 + r() * .22), sw = sway(i + g * 50); ctx.strokeStyle = mix(col[0], col[1], r()); ctx.lineWidth = 3 + r() * 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, h + 10); ctx.quadraticCurveTo(x + sw * .5, h - len * .5, x + sw * 2 + (r() - .5) * 30, h - len); ctx.stroke(); }
      });
    } else if (k === 'rocks' || k === 'rubble') {
      [[-.06, 1.04, .22], [.86, 1.06, .18], [.18, 1.12, .12]].forEach(([x, y, s2], i) => { const g = ctx.createLinearGradient(0, h * (y - s2), 0, h * y); g.addColorStop(0, k === 'rubble' ? '#8a8070' : '#6a5440'); g.addColorStop(1, '#1e160e'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * x - h * s2, h * y); ctx.quadraticCurveTo(w * x - h * s2 * .7, h * (y - s2 * 1.1), w * x, h * (y - s2)); ctx.quadraticCurveTo(w * x + h * s2 * .9, h * (y - s2 * .9), w * x + h * s2 * 1.2, h * y); ctx.fill(); });
      for (let i = 0; i < 10; i++) { ctx.fillStyle = `rgba(230,200,150,${.12 + .1 * Math.sin(t + i)})`; ctx.beginPath(); ctx.arc((i * 137 + t * 20) % w, h * (.9 - (i % 3) * .05), 3 + i % 3, 0, TAU); ctx.fill(); }
    } else if (k === 'snow' || k === 'snowdark') {
      const c1 = k === 'snow' ? '#f4f7fa' : '#6a7a92', c2 = k === 'snow' ? '#c3cfdb' : '#1a2434';
      [[-.05, .3], [.78, .32]].forEach(([x, wid]) => { const g = ctx.createLinearGradient(0, h * .82, 0, h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(w * x, h); ctx.quadraticCurveTo(w * (x + wid * .2), h * .8, w * (x + wid * .5), h * .86); ctx.quadraticCurveTo(w * (x + wid * .8), h * .9, w * (x + wid), h); ctx.fill(); });
      for (let i = 0; i < 14; i++) { const x = (i * 211 + t * 60) % (w + 40), y = (i * 97 + t * 90) % h; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(x, y, 6 + (i % 4) * 3, 0, TAU); ctx.fill(); }
    } else if (k === 'room' || k === 'desk') {
      ctx.fillStyle = k === 'desk' ? '#2a1a0e' : '#2a2018'; ctx.beginPath(); ctx.moveTo(w * .78, h); ctx.lineTo(w * .86, h * .86); ctx.lineTo(w * 1.02, h * .86); ctx.lineTo(w * 1.02, h); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,160,.12)'; ctx.fillRect(w * .86, h * .86, w * .16, 4);
      if (k === 'desk') { ctx.fillStyle = '#e8e2d0'; ctx.fillRect(w * .89, h * .845, w * .07, h * .02); ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-w * .02, h * .9, w * .16, h * .1); }
      else { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(w * .06, h * .98, w * .1, h * .08, 0, Math.PI, 0); ctx.fill(); }
    } else if (k === 'rail') {
      ctx.fillStyle = '#05070b'; ctx.fillRect(-10, h * .9, w + 20, h * .02); for (let i = 0; i < 14; i++) ctx.fillRect(i * w / 13 - 3, h * .9, 6, h * .1);
      for (let i = 0; i < 5; i++) { const x = (i * 263 + t * 15) % w, c = ['255,160,90', '255,220,150', '120,200,255'][i % 3]; const g = ctx.createRadialGradient(x, h * .2 + i * 40, 0, x, h * .2 + i * 40, 30 + i * 6); g.addColorStop(0, `rgba(${c},.25)`); g.addColorStop(.7, `rgba(${c},.12)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(x - 60, h * .2 + i * 40 - 60, 120, 120); }
    } else if (k === 'lens') {
      const D = particles(st, 'drops', 26, () => ({ x: Math.random() * w, y: Math.random() * h, r: 4 + Math.random() * 14, v: 4 + Math.random() * 18 }));
      D.forEach(d => { d.y += d.v * .016; if (d.y > h + 20) { d.y = -20; d.x = Math.random() * w; } const g = ctx.createRadialGradient(d.x - d.r * .3, d.y - d.r * .3, 0, d.x, d.y, d.r); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.6, 'rgba(200,220,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill(); });
    } else if (k === 'crowd') {
      for (let i = 0; i < 9; i++) { const x = w * (i < 4 ? i * .07 - .03 : .76 + (i - 4) * .06), y = h * (1.02 - (i % 2) * .04) + Math.sin(t * 2 + i) * 3, s2 = h * (.09 + (i % 3) * .02); ctx.fillStyle = '#07080a'; ctx.beginPath(); ctx.arc(x, y - s2 * 1.3, s2 * .55, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y, s2 * 1.1, s2 * .9, 0, Math.PI, 0); ctx.fill(); }
    }
  }

  // character lighting per scene: CSS filter + rim light colour and side (+1 = light from the right)
  const LIGHT = {
    title: ['brightness(.7) saturate(.85)', '200,210,255', -1], village: ['sepia(.18) saturate(1.12) brightness(1.03)', '255,190,120', 1],
    home: ['brightness(.78) sepia(.32) saturate(1.15)', '255,170,90', -1], school: ['brightness(1.02) sepia(.06)', '255,240,200', 1],
    issb: ['sepia(.22) saturate(1.1) brightness(.92)', '255,150,90', -1], pma: ['brightness(1.04) saturate(1.05)', '255,255,240', 1],
    barracks: ['brightness(.62) saturate(.8) hue-rotate(-6deg)', '255,150,70', 1], snowpost: ['brightness(1.05) saturate(.8) hue-rotate(8deg)', '220,235,255', 1],
    valley: ['sepia(.2) saturate(1.05) brightness(1)', '255,230,180', -1], cherat: ['brightness(1.04) sepia(.08)', '255,250,230', 1],
    karachi: ['brightness(.68) saturate(.85) hue-rotate(-8deg)', '255,150,90', 1], quetta: ['brightness(1.03) saturate(1.02)', '255,245,225', 1],
    office: ['brightness(.88) sepia(.18)', '255,220,170', 1], flood: ['brightness(.78) saturate(.7)', '220,230,255', 1],
    stadium: ['brightness(.85) saturate(.8)', '255,255,235', -1], dam: ['brightness(.62) saturate(.6) hue-rotate(10deg)', '180,200,255', -1],
    parade: ['brightness(1.04) saturate(1.05)', '255,250,235', 1], camp: ['sepia(.25) saturate(1.15) brightness(.98)', '255,170,90', -1],
    wedding: ['brightness(.88) saturate(1.15) sepia(.12)', '255,200,140', 1], hospital: ['brightness(1.03) saturate(.9)', '235,250,255', -1],
    graveyard: ['sepia(.25) brightness(.86) saturate(1.05)', '255,160,100', 1], mountain_night: ['brightness(.58) saturate(.7) hue-rotate(10deg)', '170,190,255', -1],
    road_night: ['brightness(.6) saturate(.7)', '200,210,255', 1], port: ['brightness(.65) saturate(.8)', '255,190,120', 1], street: ['brightness(.7) saturate(1.1)', '255,90,120', -1],
    avenue: ['brightness(.66) saturate(.8)', '255,200,130', 1], ring: ['brightness(.9) contrast(1.1)', '255,245,215', 1], forest_night: ['brightness(.55) saturate(.7)', '170,200,255', 1],
    rubble: ['sepia(.25) brightness(.95) saturate(.85)', '255,230,190', 1], maproom: ['brightness(.8) sepia(.2)', '255,230,180', 1],
  };

  // public scene functions: (ctx, w, h, t, st, dt) with the camera applied
  const S = {};
  Object.keys(D).forEach(name => {
    S[name] = (ctx, w, h, t, st, dt = .016) => {
      const R = Math.min(2, ctx.getTransform().a);
      const cam = camera(t, st || {});
      const K = makeK(name, ctx, w, h, R, cam);
      ctx.save();
      const cx = w / 2, cy = h * .62;
      ctx.translate(cx, cy + cam.y * h); ctx.scale(cam.z, cam.z); ctx.translate(-cx, -cy);
      D[name](ctx, w, h, t, st || {}, dt, K);
      ctx.restore();
    };
  });
  // Battery saver: behind missions and cutscenes the scenery repaints every third frame from an
  // offscreen copy; whatever is drawn on top (soldiers, bullets, effects) still runs every frame.
  const RAW = Object.assign({}, S);
  Object.keys(RAW).forEach(name => {
    S[name] = (ctx, w, h, t, st, dt = .016) => {
      if (!PERF.low || !st || ctx.canvas.width < 2) return RAW[name](ctx, w, h, t, st, dt);
      const c = st.__bg || (st.__bg = { cv: document.createElement('canvas'), n: 0, acc: 0 });
      const cv = ctx.canvas, T = ctx.getTransform();
      c.acc += dt;
      const fresh = c.cv.width !== cv.width || c.cv.height !== cv.height || c.name !== name || c.T !== `${T.a},${T.d}`;
      if (fresh || c.n++ % 3 === 0) {
        if (c.cv.width !== cv.width || c.cv.height !== cv.height) { c.cv.width = cv.width; c.cv.height = cv.height; }
        const o = c.cv.getContext('2d'); o.setTransform(T); c.name = name; c.T = `${T.a},${T.d}`;
        RAW[name](o, w, h, t, st, Math.min(.1, c.acc)); c.acc = 0;
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c.cv, 0, 0); ctx.restore();
    };
  });

  function Runner(canvas, fgCanvas, opts = {}) {
    const ctx = canvas.getContext('2d'), fctx = fgCanvas ? fgCanvas.getContext('2d') : null;
    let name = 'village', st = {}, raf = 0, last = 0, t0 = performance.now(), running = false;
    let q = 2, slow = 0, skip = 0;
    function size() {
      const r = canvas.getBoundingClientRect(), d = Math.min(PERF.dpr(), q);
      const W = Math.max(1, r.width * d | 0), H = Math.max(1, r.height * d | 0);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; st = {}; }
      return d;
    }
    function frame(now) {
      if (!running) return;
      if (PERF.covered(canvas)) { last = now; raf = requestAnimationFrame(frame); return; }
      // battery saver: background scenes animate at 30 fps
      if (PERF.low && (skip = (skip + 1) % (opts.lowEvery || 2))) { raf = requestAnimationFrame(frame); return; }
      const d = size(), raw = (now - last) / 1000, dt = Math.min(.05, raw || .016); last = now;
      PERF.frame(raw);
      // adaptive quality: drop resolution if frames keep running slow
      slow = raw > 1 / 32 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 45 && q > .75) { q = q > 1 ? 1 : .75; slow = 0; }
      const t = (now - t0) / 1000, w = canvas.width / d, h = canvas.height / d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      try { (RAW[name] || RAW.village)(ctx, w, h, t, st, dt); bloom(ctx, canvas, (BLOOM[name] ?? .3) * (q < 1 ? 0 : 1)); } catch (e) { console.error(e); }
      if (fctx && !PERF.low) {
        const fr = fgCanvas.getBoundingClientRect(), fW = Math.max(1, fr.width * d | 0), fH = Math.max(1, fr.height * d | 0);
        if (fgCanvas.width !== fW || fgCanvas.height !== fH) { fgCanvas.width = fW; fgCanvas.height = fH; }
        fctx.setTransform(d, 0, 0, d, 0, 0);
        try { foreground(fctx, fr.width, fr.height, t, st.fg || (st.fg = {}), name); } catch (e) { console.error(e); }
      }
      raf = requestAnimationFrame(frame);
    }
    return {
      set(n) { if (n && n !== name) { name = S[n] ? n : 'village'; st = {}; } },
      get name() { return name; },
      start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
      stop() { running = false; cancelAnimationFrame(raf); },
    };
  }

  const LABELS = {
    village: 'Home village', home: 'Home, night', school: 'Government High School', issb: 'ISSB, Kohat', pma: 'PMA Kakul, Abbottabad',
    barracks: 'Field camp', snowpost: 'Northern post, 16,000 ft', valley: 'Wadi-e-Noor', cherat: 'SSG School, Cherat', karachi: 'Karachi',
    quetta: 'Command & Staff College, Quetta', office: 'Headquarters', flood: 'Flood zone, Sindh', stadium: 'Shalimar Stadium, Lahore', dam: 'Kohsar Dam',
    parade: 'Parade ground', camp: 'UN mission, Kivara', wedding: 'Wedding night', hospital: 'CMH Rawalpindi', graveyard: 'Village graveyard',
    mountain_night: 'Mountains, night', title: '', road_night: 'Murree road, night', port: 'Port of Karachi', street: 'Saddar, Karachi',
    avenue: 'Constitution Avenue, Islamabad', ring: 'PMA boxing hall', forest_night: 'Night navigation, Kakul', rubble: 'Earthquake zone', maproom: 'War room',
  };
  return { S, Runner, LABELS, LIGHT, bloom, BLOOM, foreground, helpers: { sky, ridge, sun, moon, stars, flag, tree, house, snow, rain, dust, vignette, floor, skyline, lightning, lamp, grad, srand, starShape, mountains, hills, clouds, godRays, mistBand, drawTree, smoke, fire, flare, walker, waterSurface, fireflies, birds, cached, mix, rgba } };
})();

// make the module reachable as window.X too (top-level const is not a window property)
 window.PERF = PERF; window.SCENES = SCENES;
