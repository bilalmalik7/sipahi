// Side-view skeletal figures with interpolated poses, plus shared effects (explosions, flashes, vehicles).
const FIG = (() => {
  const D = Math.PI / 180;
  // angles in degrees. torso: 0 = upright, + leans toward facing. limbs: 0 = straight down, + swings forward.
  const P = {
    stand: { torso: 0, head: 0, ua1: 8, la1: 6, ua2: -8, la2: 6, th1: 4, sh1: 0, th2: -4, sh2: 0, dy: 0 },
    guard: { torso: 8, head: 4, ua1: 45, la1: 105, ua2: 30, la2: 120, th1: 22, sh1: -12, th2: -22, sh2: -14, dy: .02 },
    punch: { torso: 20, head: 6, ua1: 92, la1: 0, ua2: 25, la2: 115, th1: 34, sh1: -10, th2: -32, sh2: -4, dy: .02 },
    punch2: { torso: 22, head: 6, ua1: 30, la1: 110, ua2: 94, la2: 0, th1: 30, sh1: -12, th2: -30, sh2: -6, dy: .02 },
    kick: { torso: -18, head: -4, ua1: 40, la1: 95, ua2: -35, la2: 60, th1: 98, sh1: 0, th2: -8, sh2: 0, dy: -.02 },
    hit: { torso: -28, head: -24, ua1: -25, la1: 35, ua2: -45, la2: 40, th1: 12, sh1: -20, th2: -18, sh2: 0, dy: .01 },
    duck: { torso: 42, head: 10, ua1: 55, la1: 100, ua2: 45, la2: 115, th1: 75, sh1: -115, th2: -10, sh2: -100, dy: .17 },
    jump: { torso: 10, head: 0, ua1: 140, la1: 20, ua2: 120, la2: 30, th1: 70, sh1: -95, th2: 25, sh2: -95, dy: -.22 },
    block: { torso: -4, head: -6, ua1: 62, la1: 112, ua2: 52, la2: 122, th1: 16, sh1: -10, th2: -24, sh2: -6, dy: .02 },
    down: { torso: -92, head: -10, ua1: -60, la1: 20, ua2: -100, la2: 10, th1: 80, sh1: 0, th2: 95, sh2: -10, dy: .38, rot: 0 },
    kneel: { torso: 5, head: 10, ua1: 20, la1: 10, ua2: -5, la2: 5, th1: 85, sh1: -85, th2: -5, sh2: -100, dy: .14 },
    run1: { torso: 16, head: 4, ua1: 55, la1: 65, ua2: -45, la2: 75, th1: 50, sh1: -30, th2: -38, sh2: -75, dy: 0 },
    run2: { torso: 16, head: 4, ua1: -45, la1: 75, ua2: 55, la2: 65, th1: -38, sh1: -75, th2: 50, sh2: -30, dy: 0 },
    aim: { torso: 6, head: 6, ua1: 78, la1: 12, ua2: 62, la2: 40, th1: 14, sh1: -6, th2: -16, sh2: 0, dy: .01 },
    crouchAim: { torso: 10, head: 8, ua1: 80, la1: 10, ua2: 64, la2: 40, th1: 85, sh1: -95, th2: -8, sh2: -105, dy: .13 },
    hang: { torso: 0, head: -6, ua1: 175, la1: 0, ua2: 172, la2: 0, th1: 10, sh1: -10, th2: -6, sh2: -14, dy: 0 },
    fall: { torso: 0, head: 0, ua1: 120, la1: 30, ua2: -120, la2: -30, th1: 30, sh1: -40, th2: -30, sh2: -40, dy: 0 },
    salute: { torso: 0, head: 0, ua1: 95, la1: 100, ua2: -6, la2: 6, th1: 2, sh1: 0, th2: -2, sh2: 0, dy: 0 },
    march1: { torso: 2, head: 0, ua1: 50, la1: 10, ua2: -30, la2: 10, th1: 40, sh1: -8, th2: -20, sh2: -10, dy: 0 },
    march2: { torso: 2, head: 0, ua1: -30, la1: 10, ua2: 50, la2: 10, th1: -20, sh1: -10, th2: 40, sh2: -8, dy: 0 },
    sweep: { torso: 30, head: 10, ua1: 60, la1: 60, ua2: -40, la2: 60, th1: 100, sh1: -10, th2: -10, sh2: -110, dy: .16 },
    slash: { torso: 18, head: 6, ua1: 120, la1: -40, ua2: 30, la2: 100, th1: 30, sh1: -10, th2: -30, sh2: -4, dy: .02 },
  };
  function lerp(a, b, k) { const o = {}; for (const key in a) o[key] = a[key] + ((b[key] ?? a[key]) - a[key]) * k; return o; }
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  function lum(c) { if (!c || c[0] !== '#' || c.length !== 7) return .1; const p = parseInt(c.slice(1), 16); return ((p >> 16 & 255) * .299 + (p >> 8 & 255) * .587 + (p & 255) * .114) / 255; }
  // tapered capsule between two points
  function capsule(ctx, a, b, w0, w1) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * w0, a[1] + ny * w0); ctx.lineTo(b[0] + nx * w1, b[1] + ny * w1);
    ctx.arc(b[0], b[1], w1, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI);
    ctx.lineTo(a[0] - nx * w0, a[1] - ny * w0);
    ctx.arc(a[0], a[1], w0, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI);
    ctx.closePath(); ctx.fill();
  }
  const style = {};
  function draw(ctx, x, y, s, pose, o = {}) {
    o = Object.assign({}, style, o);
    const f = o.facing || 1, col = o.color || '#0d0d0d';
    const sil = lum(col) < .1 || o.sil;
    const back = o.backColor || shadeC(col);
    const skin = o.skin || (sil ? col : '#a8754e');
    const skinB = sil ? back : shadeC(skin);
    const boot = sil ? shadeC(col) : (o.boot || '#1c1813');
    const L = { t: .31 * s, ua: .155 * s, la: .15 * s, th: .235 * s, sh: .235 * s, hr: .068 * s };
    const W = { th: [.072, .052], sh: [.05, .036], ua: [.046, .038], la: [.038, .03], hip: .082, chest: .118 };
    const dir = a => [Math.sin(a * D) * f, Math.cos(a * D)];
    const tor = pose.torso * D;
    const sh = [Math.sin(tor) * L.t * f, -Math.cos(tor) * L.t];
    const seg = (p, ang, len) => { const d = dir(ang); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
    const hip = [0, 0];
    const kneeB = seg(hip, pose.th2, L.th), footB = seg(kneeB, pose.th2 + pose.sh2, L.sh);
    const kneeF = seg(hip, pose.th1, L.th), footF = seg(kneeF, pose.th1 + pose.sh1, L.sh);
    const elbB = seg(sh, pose.ua2, L.ua), handB = seg(elbB, pose.ua2 + pose.la2, L.la);
    const elbF = seg(sh, pose.ua1, L.ua), handF = seg(elbF, pose.ua1 + pose.la1, L.la);
    const ha = tor + (pose.head || 0) * D;
    const neck = [sh[0] + Math.sin(tor) * L.hr * .4 * f, sh[1] - Math.cos(tor) * L.hr * .4];
    const hx = sh[0] + Math.sin(ha) * L.hr * 1.75 * f, hy = sh[1] - Math.cos(ha) * L.hr * 1.75;
    const dyy = (pose.dy || 0) * s;

    function bootShape(knee, foot, c) {
      const ang = Math.atan2(foot[1] - knee[1], foot[0] - knee[0]);
      const fx = Math.cos(ang - Math.PI / 2 * f), fy = Math.sin(ang - Math.PI / 2 * f);
      ctx.fillStyle = c; ctx.beginPath();
      ctx.moveTo(foot[0] - fx * s * .02, foot[1] - fy * s * .02 - s * .02);
      ctx.lineTo(foot[0] + fx * s * .075, foot[1] + fy * s * .075);
      ctx.lineTo(foot[0] + fx * s * .07 + Math.cos(ang) * s * .025, foot[1] + fy * s * .07 + Math.sin(ang) * s * .025);
      ctx.lineTo(foot[0] - fx * s * .03 + Math.cos(ang) * s * .025, foot[1] - fy * s * .03 + Math.sin(ang) * s * .025);
      ctx.closePath(); ctx.fill();
    }
    function body(rim) {
      const C = c => rim || c;
      // back leg & arm
      ctx.fillStyle = C(back); capsule(ctx, hip, kneeB, W.th[0] * s, W.th[1] * s); capsule(ctx, kneeB, footB, W.th[1] * s, W.sh[1] * s);
      bootShape(kneeB, footB, C(sil ? back : shadeC(boot)));
      if (o.pack && !rim) { ctx.fillStyle = C(shadeC(o.pack)); const bx = sh[0] * .55 - f * s * .085, by = sh[1] * .55; ctx.save(); ctx.translate(bx, by); ctx.rotate(tor * f); ctx.fillRect(-s * .05, -s * .12, s * .1, s * .2); ctx.restore(); }
      ctx.fillStyle = C(back); capsule(ctx, sh, elbB, W.ua[0] * s, W.ua[1] * s); capsule(ctx, elbB, handB, W.la[0] * s, W.la[1] * s);
      ctx.fillStyle = C(skinB); ctx.beginPath(); ctx.arc(handB[0], handB[1], s * .028, 0, Math.PI * 2); ctx.fill();
      // torso: hips to chest
      const nx = Math.cos(tor), ny = Math.sin(tor) * f, ux = Math.sin(tor) * f, uy = -Math.cos(tor), Wh = W.hip * s, Wc = W.chest * s;
      ctx.fillStyle = C(col); ctx.beginPath();
      ctx.moveTo(-nx * Wh, -ny * Wh); ctx.lineTo(nx * Wh, ny * Wh);
      ctx.lineTo(sh[0] + nx * Wc, sh[1] + ny * Wc);
      ctx.quadraticCurveTo(sh[0] + ux * s * .05, sh[1] + uy * s * .05, sh[0] - nx * Wc, sh[1] - ny * Wc);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(hip[0], hip[1], W.hip * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sh[0], sh[1] + s * .015, W.chest * s * .62, 0, Math.PI * 2); ctx.fill();
      if (!rim && !sil && !o.simple) {
        // chest shading, belt, vest
        ctx.save(); ctx.translate(sh[0] * .12, sh[1] * .12); ctx.rotate(tor * f); ctx.fillStyle = 'rgba(25,22,16,.75)'; ctx.fillRect(-W.hip * s * 1.05, -s * .012, W.hip * s * 2.1, s * .028); ctx.restore();
        if (o.vest) { ctx.save(); ctx.translate(sh[0] * .5, sh[1] * .5); ctx.rotate(tor * f); ctx.fillStyle = 'rgba(40,40,28,.85)'; ctx.fillRect(-s * .085, -s * .12, s * .17, s * .2); ctx.fillStyle = 'rgba(0,0,0,.3)'; [-.05, 0, .05].forEach(k => ctx.fillRect(k * s - s * .02, s * .0, s * .04, s * .06)); ctx.restore(); }
      }
      // neck & head
      ctx.fillStyle = C(skin); capsule(ctx, sh, neck, s * .025, s * .025);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ha * f);
      ctx.fillStyle = C(skin); ctx.beginPath(); ctx.ellipse(0, 0, L.hr * .92, L.hr * 1.08, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(f * L.hr * .8, -L.hr * .1); ctx.lineTo(f * L.hr * 1.08, L.hr * .2); ctx.lineTo(f * L.hr * .78, L.hr * .32); ctx.fill();
      if (!rim && !sil && !o.simple) {
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(-f * L.hr * .3, L.hr * .1, L.hr * .6, L.hr * .9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = o.hair || '#1a1410'; ctx.beginPath(); ctx.ellipse(-f * L.hr * .15, -L.hr * .55, L.hr * .9, L.hr * .55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = shadeC(skin); ctx.beginPath(); ctx.ellipse(-f * L.hr * .05, L.hr * .05, L.hr * .16, L.hr * .24, 0, 0, Math.PI * 2); ctx.fill();
        if (o.scarf) { ctx.fillStyle = o.scarf; ctx.fillRect(-L.hr, L.hr * .05, L.hr * 2.1, L.hr * .9); }
      } else if (o.scarf) { ctx.fillStyle = C(o.scarf); ctx.fillRect(-L.hr, L.hr * .05, L.hr * 2.1, L.hr * .9); }
      if (o.helmet) { ctx.fillStyle = C(o.helmet); ctx.beginPath(); ctx.ellipse(-f * L.hr * .05, -L.hr * .32, L.hr * 1.18, L.hr * .95, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-L.hr * 1.25 - (f > 0 ? L.hr * .05 : -L.hr * .05), -L.hr * .36, L.hr * 2.45, L.hr * .22); }
      if (o.beret) { ctx.fillStyle = C(o.beret); ctx.beginPath(); ctx.ellipse(-f * L.hr * .25, -L.hr * .78, L.hr * 1.08, L.hr * .42, -.25 * f, 0, Math.PI * 2); ctx.fill(); if (!rim) { ctx.fillStyle = '#d8a840'; ctx.beginPath(); ctx.arc(f * L.hr * .45, -L.hr * .72, L.hr * .14, 0, Math.PI * 2); ctx.fill(); } }
      if (o.cap) { ctx.fillStyle = C(o.cap); ctx.beginPath(); ctx.ellipse(0, -L.hr * .78, L.hr * 1.05, L.hr * .38, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C('#111'); ctx.fillRect(f > 0 ? 0 : -L.hr * 1.4, -L.hr * .6, L.hr * 1.4, L.hr * .14); if (!rim) { ctx.fillStyle = '#b3201e'; ctx.fillRect(-L.hr, -L.hr * .74, L.hr * 2, L.hr * .16); } }
      ctx.restore();
      // front leg
      ctx.fillStyle = C(col); capsule(ctx, hip, kneeF, W.th[0] * s, W.th[1] * s); capsule(ctx, kneeF, footF, W.th[1] * s, W.sh[1] * s);
      bootShape(kneeF, footF, C(boot));
      // front arm
      ctx.fillStyle = C(col); capsule(ctx, sh, elbF, W.ua[0] * s, W.ua[1] * s); capsule(ctx, elbF, handF, W.la[0] * s, W.la[1] * s);
      ctx.fillStyle = C(skin); ctx.beginPath(); ctx.arc(handF[0], handF[1], s * .03, 0, Math.PI * 2); ctx.fill();
      if (o.rifle) {
        const ang = (pose.ua1 + pose.la1) * D, dx = Math.sin(ang) * f, dy = Math.cos(ang), px = -dy * f, py = dx * f;
        const P = k => [handF[0] + dx * s * k, handF[1] + dy * s * k];
        const rc = C(o.rifleColor || '#141414');
        ctx.fillStyle = rc; ctx.strokeStyle = rc; ctx.lineCap = 'round';
        const a = P(-.16), b = P(.12), c = P(.34);
        ctx.lineWidth = s * .03; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.lineWidth = s * .014; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
        const m = P(.02); ctx.lineWidth = s * .022; ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.quadraticCurveTo(m[0] + px * s * .05, m[1] + py * s * .05, m[0] + px * s * .07 - dx * s * .02, m[1] + py * s * .07 - dy * s * .02); ctx.stroke();
        const st = P(-.16); ctx.lineWidth = s * .04; ctx.beginPath(); ctx.moveTo(st[0], st[1]); ctx.lineTo(st[0] + px * s * .03, st[1] + py * s * .03); ctx.stroke();
        if (o.flash && !rim) muzzle(ctx, c[0], c[1], s * .12, ang, f);
      }
      if (o.knife) { const ang = (pose.ua1 + pose.la1) * D; ctx.strokeStyle = rim || '#d8dce4'; ctx.lineWidth = s * .014; ctx.beginPath(); ctx.moveTo(handF[0], handF[1]); ctx.lineTo(handF[0] + Math.sin(ang) * f * s * .11, handF[1] + Math.cos(ang) * s * .11); ctx.stroke(); }
    }
    ctx.save(); ctx.translate(x, y + dyy);
    if (pose.rot) ctx.rotate(pose.rot * D * f);
    if (o.shadow !== false && !pose.rot) {
      const gy = Math.max(footB[1], footF[1]) + s * .03 - dyy * (dyy < 0 ? 1 : 0);
      const g = ctx.createRadialGradient(0, gy, 0, 0, gy, s * .2); g.addColorStop(0, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.save(); ctx.translate(0, gy); ctx.scale(1, .22); ctx.beginPath(); ctx.arc(0, 0, s * .2, 0, Math.PI * 2); ctx.restore(); ctx.fill();
    }
    if (o.rim) { ctx.save(); ctx.translate((o.rimSide || 1) * s * .012, -s * .006); body(o.rim); ctx.restore(); }
    body(null);
    ctx.restore();
    return { hand: [x + handF[0], y + handF[1] + dyy], head: [x + hx, y + hy + dyy] };
  }
  function shadeC(c) { if (c[0] !== '#' || c.length !== 7) return c; return CHAR.mix(c, '#000000', .35); }
  function muzzle(ctx, x, y, r, ang, f) {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.6); g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(.4, 'rgba(255,190,60,.8)'); g.addColorStop(1, 'rgba(255,120,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(-ang * f + (f < 0 ? Math.PI : 0)); ctx.fillStyle = 'rgba(255,240,180,.9)';
    ctx.beginPath(); ctx.moveTo(0, -r * .25); ctx.lineTo(r * 1.8, 0); ctx.lineTo(0, r * .25); ctx.fill();
    ctx.restore();
  }

  // --- particle effects ---
  function Fx() {
    const parts = [];
    return {
      shake: 0,
      boom(x, y, s = 1) {
        this.shake = Math.min(1.4, this.shake + .9 * s * (window.META && META.settings.calm ? .25 : 1));
        for (let i = 0; i < 46 * s; i++) { const a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 260) * s; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80 * s, life: .5 + Math.random() * .8, max: 1.3, r: (4 + Math.random() * 14) * s, k: 'fire' }); }
        for (let i = 0; i < 24 * s; i++) parts.push({ x, y, vx: (Math.random() - .5) * 80, vy: -20 - Math.random() * 60, life: 2 + Math.random() * 2, max: 4, r: (14 + Math.random() * 24) * s, k: 'smoke' });
        parts.push({ x, y, life: .25, max: .25, r: 140 * s, k: 'flash' });
      },
      sparks(x, y, n = 14, c = '255,220,140') { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 220; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .3 + Math.random() * .3, max: .6, r: 2, k: 'spark', c }); } },
      impact(x, y) { parts.push({ x, y, life: .18, max: .18, r: 60, k: 'ring' }); this.sparks(x, y, 10, '255,255,255'); },
      tracer(x1, y1, x2, y2, c = '255,220,120') { parts.push({ x: x1, y: y1, x2, y2, life: .12, max: .12, k: 'tracer', c }); },
      blood(x, y) { for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .4, max: .4, r: 2.4, k: 'spark', c: '140,20,20' }); } },
      update(ctx, dt) {
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
          const k = p.life / p.max;
          if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy = p.vy * .96 + (p.k === 'smoke' ? -10 : 160) * dt; }
          if (p.k === 'fire') { ctx.fillStyle = `rgba(255,${120 + 120 * k | 0},${40 * k | 0},${k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.3 - k * .3), 0, 7); ctx.fill(); }
          else if (p.k === 'smoke') { ctx.fillStyle = `rgba(50,48,46,${.45 * k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (2 - k), 0, 7); ctx.fill(); }
          else if (p.k === 'flash') { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(255,250,220,${k})`); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
          else if (p.k === 'spark') { ctx.fillStyle = `rgba(${p.c},${k})`; ctx.fillRect(p.x, p.y, p.r, p.r); }
          else if (p.k === 'ring') { ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - k) + 6, 0, 7); ctx.stroke(); }
          else if (p.k === 'tracer') { ctx.strokeStyle = `rgba(${p.c},${k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x2, p.y2); ctx.stroke(); }
        }
      },
      get count() { return parts.length; },
      clear() { parts.length = 0; },
    };
  }

  function heli(ctx, x, y, s, t, c = '#151a1c', f = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 0, s * .5, s * .2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-s * 1.1, -s * .06, s * .7, s * .1);
    ctx.fillRect(-s * 1.15, -s * .22, s * .08, s * .26);
    ctx.fillStyle = 'rgba(160,200,220,.5)'; ctx.beginPath(); ctx.ellipse(s * .28, -s * .03, s * .17, s * .1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c; ctx.lineWidth = s * .03; ctx.beginPath(); ctx.moveTo(-s * .3, s * .3); ctx.lineTo(s * .35, s * .3); ctx.moveTo(-s * .2, s * .2); ctx.lineTo(-s * .2, s * .3); ctx.moveTo(s * .2, s * .2); ctx.lineTo(s * .2, s * .3); ctx.stroke();
    const r = Math.cos(t * 40) * s * 1.1;
    ctx.fillStyle = c; ctx.fillRect(-s * .05, -s * .3, s * .1, s * .12);
    ctx.strokeStyle = 'rgba(20,20,20,.85)'; ctx.lineWidth = s * .04; ctx.beginPath(); ctx.moveTo(-r, -s * .3); ctx.lineTo(r, -s * .3); ctx.stroke();
    ctx.fillStyle = 'rgba(30,30,30,.15)'; ctx.beginPath(); ctx.ellipse(0, -s * .3, s * 1.1, s * .05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function plane(ctx, x, y, s, c = '#2a2f33') {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * .14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * .1, 0); ctx.lineTo(-s * .4, s * .6); ctx.lineTo(-s * .2, s * .6); ctx.lineTo(s * .2, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * .8, 0); ctx.lineTo(-s * .95, -s * .35); ctx.lineTo(-s * .75, -s * .35); ctx.lineTo(-s * .6, 0); ctx.fill();
    ctx.restore();
  }
  function car(ctx, x, y, s, c = '#1e2a3a', lights = true, f = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(-s, -s * .3); ctx.lineTo(-s * .5, -s * .35); ctx.lineTo(-s * .3, -s * .6); ctx.lineTo(s * .35, -s * .6); ctx.lineTo(s * .6, -s * .35); ctx.lineTo(s, -s * .3); ctx.lineTo(s, 0); ctx.fill();
    ctx.fillStyle = 'rgba(150,190,220,.4)'; ctx.fillRect(-s * .25, -s * .55, s * .25, s * .18); ctx.fillRect(s * .05, -s * .55, s * .28, s * .18);
    ctx.fillStyle = '#0a0a0a'; [-s * .6, s * .6].forEach(wx => { ctx.beginPath(); ctx.arc(wx, 0, s * .2, 0, Math.PI * 2); ctx.fill(); });
    if (lights) { const g = ctx.createLinearGradient(s, 0, s * 4, 0); g.addColorStop(0, 'rgba(255,250,210,.6)'); g.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s, -s * .25); ctx.lineTo(s * 4, -s * .6); ctx.lineTo(s * 4, s * .2); ctx.fill(); ctx.fillStyle = '#ff3020'; ctx.fillRect(-s * 1.02, -s * .26, s * .06, s * .1); }
    ctx.restore();
  }
  return { P, lerp, ease, draw, Fx, heli, plane, car, muzzle, style };
})();

// make the module reachable as window.X too (top-level const is not a window property)
 window.FIG = FIG;
