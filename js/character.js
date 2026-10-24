// Front-facing character built as SVG. Uniform, insignia, ribbons, headgear and age all come from options.
const CHAR = (() => {
  let uid = 0;
  const SKINS = ['#f1cba5', '#dcab80', '#c38c60', '#9e6c46', '#7b5033'];
  const HAIRS = ['#15110e', '#3a291c', '#5b3e25', '#7b5a3a'];

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  const shade = (c, t) => mix(c, '#000000', t);
  const tint = (c, t) => mix(c, '#ffffff', t);

  // ---------- insignia ----------
  function star(x, y, r, fill) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(2) + ' ' + (y + Math.sin(a) * rr).toFixed(2);
    }
    return `<path d="${d}Z" fill="${fill}" stroke="${shade(fill, .35)}" stroke-width="${r * 0.08}"/>`;
  }
  function crescentStar(x, y, r, fill) {
    return `<path d="M${x + r * .35} ${y - r} A${r} ${r} 0 1 0 ${x + r * .35} ${y + r} A${r * .78} ${r * .78} 0 1 1 ${x + r * .35} ${y - r}Z" fill="${fill}" transform="rotate(-25 ${x} ${y})"/>` + star(x + r * .45, y - r * .1, r * .42, fill);
  }
  function swordBaton(x, y, r, fill) {
    return `<g stroke="${fill}" stroke-width="${r * .28}" stroke-linecap="round"><line x1="${x - r}" y1="${y + r}" x2="${x + r}" y2="${y - r}"/><line x1="${x + r}" y1="${y + r}" x2="${x - r}" y2="${y - r}"/></g><circle cx="${x}" cy="${y}" r="${r * .3}" fill="${fill}"/>`;
  }
  function rankItems(rank) {
    const S = 'star', C = 'cs', B = 'sb';
    return [[], ['gc'], [S], [S, S], [S, S, S], [C], [C, S], [C, S, S], [C, S, S, S], [S, B], [C, B], [S, C, B]][rank] || [];
  }
  function drawItem(it, x, y, r, gold) {
    if (it === 'star') return star(x, y, r, gold);
    if (it === 'cs') return crescentStar(x, y, r, gold);
    if (it === 'sb') return swordBaton(x, y, r, gold);
    if (it === 'gc') return `<rect x="${x - r * 1.1}" y="${y - r * .35}" width="${r * 2.2}" height="${r * .7}" fill="#f4f1e6"/>`;
    return '';
  }
  // vertical stack for the chest tab
  function insigniaStack(rank, cx, top, step, r) {
    const items = rankItems(rank), gold = '#e6b14a';
    return items.map((it, i) => drawItem(it, cx, top + i * step, r, gold)).join('');
  }
  // horizontal badge for the HUD
  function insigniaBadge(rank) {
    const items = rankItems(rank);
    if (!items.length) return `<svg viewBox="0 0 40 30"><text x="20" y="20" text-anchor="middle" font-size="14" fill="#c9b98a" font-family="sans-serif">&#9998;</text></svg>`;
    const w = items.length * 26 + 8;
    return `<svg viewBox="0 0 ${w} 30"><rect x="1" y="1" width="${w - 2}" height="28" rx="4" fill="#3a4a2f" stroke="#e0a83e" stroke-width="1"/>${items.map((it, i) => drawItem(it, 17 + i * 26, 15, 9, '#e6b14a')).join('')}</svg>`;
  }

  // ---------- face ----------
  const BROWS = {
    neutral: ['M80 82 Q88 79 96 82', 'M104 82 Q112 79 120 82'],
    happy: ['M80 80 Q88 75 96 79', 'M104 79 Q112 75 120 80'],
    sad: ['M80 83 Q88 82 96 77', 'M104 77 Q112 82 120 83'],
    angry: ['M80 77 Q89 79 97 85', 'M103 85 Q111 79 120 77'],
    determined: ['M80 80 Q89 81 96 84', 'M104 84 Q111 81 120 80'],
    surprised: ['M80 76 Q88 70 96 76', 'M104 76 Q112 70 120 76'],
  };
  function mouths(skin, female) {
    const U = mix(skin, female ? '#a03a44' : '#7a2e2a', female ? .55 : .42), Lw = mix(skin, female ? '#c04a52' : '#9a4a40', female ? .5 : .38), line = '#3e1a14';
    return {
      neutral: `<path d="M90.5 114 Q95.5 111.6 100 112.8 Q104.5 111.6 109.5 114 Q100 115.4 90.5 114Z" fill="${U}"/><path d="M91.5 114.3 Q100 119.4 108.5 114.3 Q100 115.8 91.5 114.3Z" fill="${Lw}"/><path d="M90.5 114 Q100 115.3 109.5 114" stroke="${line}" stroke-width="1" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="116.6" rx="3.2" ry=".8" fill="#fff" opacity=".18"/>`,
      happy: `<path d="M88 111.5 Q100 115 112 111.5 Q108 121.5 100 122 Q92 121.5 88 111.5Z" fill="#4a1a16"/><path d="M90 112.6 Q100 115.6 110 112.6 L109 115 Q100 117.4 91 115Z" fill="#f2ece2"/><path d="M88 111.5 Q94 109.6 100 111 Q106 109.6 112 111.5 Q100 113.6 88 111.5Z" fill="${U}"/><path d="M90.5 117.5 Q100 124.5 109.5 117.5 Q100 121.6 90.5 117.5Z" fill="${Lw}"/>`,
      sad: `<path d="M91 116 Q100 112.4 109 116 Q100 115 91 116Z" fill="${U}"/><path d="M92 116.2 Q100 118.6 108 116.2 Q100 116 92 116.2Z" fill="${Lw}"/><path d="M91 116.2 Q100 113.4 109 116.2" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
      angry: `<path d="M90 115.4 Q100 112.6 110 115.4 Q100 115.2 90 115.4Z" fill="${U}"/><path d="M90 115.6 Q100 113.4 110 115.6" stroke="${line}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M93 116.4 Q100 118 107 116.4" stroke="${Lw}" stroke-width="1.6" fill="none"/>`,
      determined: `<path d="M90.5 114.2 Q100 113 109.5 114.2" stroke="${line}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M91.5 113.4 Q100 111.8 108.5 113.4" stroke="${U}" stroke-width="1.6" fill="none"/><path d="M93 115.6 Q100 117.6 107 115.6" stroke="${Lw}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      surprised: `<ellipse cx="100" cy="115.6" rx="4.6" ry="5.4" fill="#3a1410"/><path d="M95.4 115 Q100 109.6 104.6 115" stroke="${U}" stroke-width="1.8" fill="none"/><path d="M95.4 116.4 Q100 121.6 104.6 116.4" stroke="${Lw}" stroke-width="2" fill="none"/>`,
      talk: `<path d="M91 113 Q100 110.6 109 113 Q106.5 120.5 100 121 Q93.5 120.5 91 113Z" fill="#3a1410"/><path d="M93 113.2 Q100 112.2 107 113.2 L106.4 114.6 Q100 115.4 93.6 114.6Z" fill="#efe8de"/><path d="M91 113 Q95.5 110.8 100 111.8 Q104.5 110.8 109 113 Q100 113.4 91 113Z" fill="${U}"/><path d="M93 118 Q100 122.6 107 118 Q100 120.6 93 118Z" fill="${Lw}"/>`,
    };
  }
  function face(o) {
    const skin = o.skin, mood = o.mood || 'neutral', hair = o.hairC;
    const dk = shade(skin, .22), dk2 = shade(skin, .42), lt = tint(skin, .22);
    const br = BROWS[mood] || BROWS.neutral, M = mouths(skin, o.female);
    let s = '';
    // facial contours
    s += `<path d="M72 96 Q73 122 88 131 Q100 137.5 112 131 Q127 122 128 96 Q125 118 113 124.5 Q100 129 87 124.5 Q75 118 72 96Z" fill="${dk}" opacity=".32"/>`;
    s += `<ellipse cx="104" cy="72" rx="13" ry="6" fill="${lt}" opacity=".32"/><ellipse cx="118" cy="103" rx="5" ry="4" fill="${lt}" opacity=".22"/><ellipse cx="82" cy="104" rx="5" ry="4" fill="${dk}" opacity=".14"/>`;
    [88, 112].forEach(x => { s += `<ellipse cx="${x}" cy="89.4" rx="9.4" ry="5.6" fill="${dk2}" opacity=".2"/>`; });
    // eyes
    [88, 112].forEach((x, i) => {
      const lowered = mood === 'sad' ? 1.6 : (mood === 'determined' || mood === 'angry') ? 1.1 : mood === 'surprised' ? -1.2 : 0;
      s += `<path d="M${x - 7.2} 92 Q${x} ${87.2 + lowered * .4} ${x + 7.2} 92 Q${x} 95.8 ${x - 7.2} 92Z" fill="#f4eee2"/>`;
      s += `<g class="iris"><circle cx="${x}" cy="${92.1 + (mood === 'sad' ? .9 : 0)}" r="3.25" fill="#3b2617"/><circle cx="${x}" cy="${92.1 + (mood === 'sad' ? .9 : 0)}" r="2.2" fill="#24170d"/><circle cx="${x}" cy="${92.1 + (mood === 'sad' ? .9 : 0)}" r="1.35" fill="#0b0705"/><circle cx="${x + 1.2}" cy="${91 + (mood === 'sad' ? .9 : 0)}" r=".85" fill="#fff" opacity=".95"/></g>`;
      if (lowered > 0) s += `<path d="M${x - 7.6} 92 Q${x} ${86.2} ${x + 7.6} 92 L${x + 7.6} ${89.2 + lowered} Q${x} ${86.6 + lowered * 1.6} ${x - 7.6} ${89.2 + lowered}Z" fill="${skin}"/>`;
      s += `<path d="M${x - 7.8} 92.2 Q${x} ${86.6 + lowered * 1.5} ${x + 7.6} 91.6" stroke="#1d120c" stroke-width="${o.female ? 2 : 1.5}" fill="none" stroke-linecap="round"/>`;
      const outer = i ? x + 7.4 : x - 7.6, dir = i ? 1 : -1;
      s += `<path d="M${outer} 91.8 l${dir * 1.8} -1.4" stroke="#1d120c" stroke-width="${o.female ? 1.3 : .9}" stroke-linecap="round"/>`;
      s += `<path d="M${x - 6} 93.6 Q${x} 96.2 ${x + 6} 93.4" stroke="${dk2}" stroke-width=".7" fill="none" opacity=".55"/>`;
      s += `<path d="M${x - 6.4} ${88.4 + lowered * .6} Q${x} ${85 + lowered} ${x + 6.4} ${88.2 + lowered * .6}" stroke="${dk2}" stroke-width=".8" fill="none" opacity=".5"/>`;
      s += `<rect class="lid" x="${x - 8}" y="86.2" width="16" height="10.6" fill="${skin}"/>`;
    });
    // brows: thick base stroke plus fine hair strokes
    s += '<g class="brows">';
    br.forEach((d, i) => {
      s += `<path d="${d}" stroke="${hair}" stroke-width="${o.female ? 2.4 : 3.6}" fill="none" stroke-linecap="round"/>`;
      s += `<path d="${d}" stroke="${tint(hair, .2)}" stroke-width=".8" fill="none" opacity=".35" transform="translate(0 -.8)"/>`;
    });
    s += '</g>';
    // nose
    s += `<path d="M102.6 92 Q105 100 105.2 104 Q103.4 103.2 101.6 96Z" fill="${dk}" opacity=".45"/>`;
    s += `<path d="M98.8 91 Q97.4 100.5 95.4 104.8 Q96.6 108.4 100 108.6 Q103.4 108.4 104.8 105.4" stroke="${dk2}" stroke-width="1.25" fill="none" stroke-linecap="round" opacity=".75"/>`;
    s += `<ellipse cx="97.2" cy="106.6" rx="1.5" ry=".9" fill="${shade(skin, .55)}" opacity=".7"/><ellipse cx="102.8" cy="106.6" rx="1.5" ry=".9" fill="${shade(skin, .55)}" opacity=".7"/><ellipse cx="100.4" cy="104" rx="2.2" ry="1.6" fill="${lt}" opacity=".4"/>`;
    s += `<path d="M99 109 L98.6 112 M101 109 L101.4 112" stroke="${dk}" stroke-width=".7" opacity=".45"/>`;
    // mouth
    s += `<g class="mouth-rest">${M[mood] || M.neutral}</g><g class="mouth-talk">${M.talk}</g>`;
    s += `<path d="M94.5 121.5 Q100 124.4 105.5 121.5" stroke="${dk}" stroke-width="1.3" fill="none" opacity=".45"/>`;
    // five o'clock shadow for adult men
    if (!o.female && o.age >= 19 && !o.noStubble) s += `<path d="M73.5 103 Q75 128 89.5 134.5 Q100 139.5 110.5 134.5 Q125 128 126.5 103 Q122.5 122.5 112 126.5 Q100 131 88 126.5 Q77.5 122.5 73.5 103Z M90 109.8 Q100 104.6 110 109.8 L110 112.4 Q100 108.6 90 112.4Z" fill="${hair}" opacity="${o.age >= 30 ? .16 : .1}"/>`;
    if (o.moustache) {
      s += `<path d="M86.6 110.2 Q92 103.6 100 106.4 Q108 103.6 113.4 110.2 Q107 109.2 100 108.8 Q93 109.2 86.6 110.2Z" fill="${hair}"/>`;
      s += `<path d="M90 108.6 l1.6 -2.6 M93 108 l1 -3 M96 107.8 l.6 -2.6 M104 107.8 l-.6 -2.6 M107 108 l-1 -3 M110 108.6 l-1.6 -2.6" stroke="${tint(hair, .2)}" stroke-width=".6" opacity=".7"/>`;
    }
    if (o.age >= 44) s += `<path d="M77 98 q-2.6 1.4 -4.4 3 M77 100.6 q-2 1 -3.2 2.4 M123 98 q2.6 1.4 4.4 3 M123 100.6 q2 1 3.2 2.4 M90.6 110.4 q-2.6 4 -2 8.4 M109.4 110.4 q2.6 4 2 8.4 M86 78 q14 -3 28 0" stroke="${dk2}" stroke-width=".8" fill="none" opacity="${Math.min(.65, (o.age - 40) / 25)}"/>`;
    if (o.scar) s += `<path d="M116 95 L123 113" stroke="#9b4c43" stroke-width="2.2" stroke-linecap="round"/><path d="M116.6 95.4 L123.4 112.6" stroke="#e0a090" stroke-width=".6" opacity=".6"/>`;
    if (o.glasses) s += `<g fill="none" stroke="#1b1b1b" stroke-width="1.7"><rect x="79" y="86" width="18" height="12.4" rx="3"/><rect x="103" y="86" width="18" height="12.4" rx="3"/><path d="M97 91 Q100 89.6 103 91 M79 89 L71 88 M121 89 L129 88"/></g><path d="M82 88 l5 -1 M106 88 l5 -1" stroke="#fff" stroke-width="1.2" opacity=".5"/>`;
    if (mood === 'happy' || o.female) s += `<ellipse cx="80" cy="106" rx="5.4" ry="3.2" fill="#e0726a" opacity="${mood === 'happy' ? .2 : .1}"/><ellipse cx="120" cy="106" rx="5.4" ry="3.2" fill="#e0726a" opacity="${mood === 'happy' ? .2 : .1}"/>`;
    return s;
  }

  // ---------- outfits ----------
  const TORSO = 'M60 150 C72 141 128 141 140 150 L147 174 L139 280 L61 280 L53 174 Z';
  const KURTA = 'M60 150 C72 141 128 141 140 150 L147 174 L152 350 Q100 358 48 350 L53 174 Z';
  const DRESS_F = 'M62 150 C74 141 126 141 138 150 L146 176 L156 372 Q100 382 44 372 L54 176 Z';

  function camoDefs(id, base, a, b, c) {
    return `<pattern id="${id}" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="46" height="46" fill="${base}"/>
      <path d="M2 4 q7 -5 13 0 q5 5 -2 9 q-7 3 -11 -2z M24 18 q8 -6 15 1 q4 6 -4 9 q-9 2 -11 -4z M6 30 q6 -3 9 2 q1 6 -6 6 q-5 -2 -3 -8z" fill="${a}"/>
      <path d="M14 22 q5 -4 9 0 q2 5 -4 6 q-5 0 -5 -6z M30 2 q6 -2 9 3 q0 5 -6 4 q-5 -2 -3 -7z M34 34 q5 -3 9 1 q1 6 -5 6 q-6 -1 -4 -7z" fill="${b}"/>
      <path d="M0 18 q4 -3 7 1 q-1 4 -6 3z M19 38 q4 -3 8 0 q0 4 -5 4z M40 14 q3 -2 5 1 q-1 3 -4 2z M20 6 q3 -2 5 1 q-1 3 -4 2z" fill="${c}"/></pattern>`;
  }

  function handPath(x, y, skin, flip = 1) {
    const dk = shade(skin, .25);
    return `<path d="M${x - 7.5} ${y - 10} Q${x - 9.5} ${y} ${x - 6.5} ${y + 8} Q${x - 2} ${y + 13} ${x + 4} ${y + 9.5} Q${x + 8.6} ${y + 2} ${x + 7.5} ${y - 10}Z" fill="${skin}"/>` +
      `<path d="M${x + 7 * flip} ${y - 6} Q${x + 10.5 * flip} ${y - 1} ${x + 7.5 * flip} ${y + 3}" stroke="${skin}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M${x - 4} ${y + 1} L${x - 4.2} ${y + 9} M${x - .8} ${y + 2} L${x - .8} ${y + 11} M${x + 2.4} ${y + 1.4} L${x + 2.6} ${y + 9.6}" stroke="${dk}" stroke-width=".8" opacity=".55"/>` +
      `<path d="M${x - 7.5} ${y - 10} Q${x - 9.5} ${y} ${x - 6.5} ${y + 8}" stroke="${dk}" stroke-width="2" fill="none" opacity=".35"/>`;
  }
  function arms(color, skin, id) {
    const w = 21;
    const shL = `url(#${id}aL)`, shR = `url(#${id}aR)`;
    let s = '';
    // character's left (viewer right), rest
    s += `<g class="arm-rest-l"><path d="M139 160 Q151 220 148 280" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="M139 160 Q151 220 148 280" stroke="${shR}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M143 214 q5 3 9 1" stroke="#000" stroke-width="1" opacity=".18" fill="none"/>${handPath(148, 291, skin, 1)}</g>`;
    // gesture arm (explaining)
    s += `<g class="arm-gesture"><path d="M139 160 Q152 205 149 236 L124 212" stroke="${color}" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M139 160 Q152 205 149 236" stroke="${shR}" stroke-width="${w - 1}" fill="none" stroke-linecap="round"/>`;
    s += `<g transform="rotate(-125 120 206)">${handPath(120, 206, skin, 1)}</g></g>`;
    // character's right (viewer left), rest
    s += `<g class="arm-rest-r"><path d="M61 160 Q49 220 52 280" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="M61 160 Q49 220 52 280" stroke="${shL}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M57 214 q-5 3 -9 1" stroke="#000" stroke-width="1" opacity=".18" fill="none"/>${handPath(52, 291, skin, -1)}</g>`;
    // arms crossed over the chest
    s += `<g class="arm-cross"><path d="M139 160 Q152 200 146 222 L76 206" stroke="${color}" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M139 160 Q152 200 146 222" stroke="${shR}" stroke-width="${w - 1}" fill="none" stroke-linecap="round"/><ellipse cx="72" cy="205" rx="8" ry="6.5" fill="${skin}"/>`;
    s += `<path d="M61 160 Q48 202 56 224 L126 214" stroke="${color}" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M61 160 Q48 202 56 224" stroke="${shL}" stroke-width="${w - 1}" fill="none" stroke-linecap="round"/><path d="M60 222 L124 213" stroke="#000" stroke-width="1.2" opacity=".2"/><ellipse cx="130" cy="213" rx="8" ry="6.5" fill="${skin}"/></g>`;
    // hands on hips
    s += `<g class="arm-hips"><path d="M61 160 Q38 196 42 210 L66 258" stroke="${color}" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M61 160 Q38 196 42 210 L66 258" stroke="${shL}" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="68" cy="262" rx="7" ry="9" fill="${skin}" transform="rotate(-30 68 262)"/>`;
    s += `<path d="M139 160 Q162 196 158 210 L134 258" stroke="${color}" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M139 160 Q162 196 158 210 L134 258" stroke="${shR}" stroke-width="${w - 1}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="132" cy="262" rx="7" ry="9" fill="${skin}" transform="rotate(30 132 262)"/></g>`;
    // salute
    s += `<g class="arm-salute"><path d="M62 160 L32 154 L78 96" stroke="${color}" stroke-width="${w - 2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M62 160 L32 154 L78 96" stroke="${shL}" stroke-width="${w - 2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M72 93 L91 85 Q94 89 91 92 L74 100Z" fill="${skin}"/><path d="M76 96 L90 89" stroke="${shade(skin, .25)}" stroke-width=".8" opacity=".5"/></g>`;
    return s;
  }

  function legs(color, kind, id) {
    const ov = `url(#${id}lg)`;
    if (kind === 'shalwar') { const d = 'M60 340 L100 340 L96 430 L70 430 Q62 380 60 340Z M100 340 L140 340 Q138 380 130 430 L104 430Z'; return `<path d="${d}" fill="${color}"/><path d="${d}" fill="${ov}"/><path d="M70 424 L96 424 M104 424 L130 424" stroke="${shade(color, .2)}" stroke-width="5"/><path d="M74 360 Q80 390 76 420 M88 356 Q92 392 90 424 M112 356 Q108 392 110 424 M126 360 Q120 390 124 420" stroke="#000" stroke-width="1" opacity=".1" fill="none"/>`; }
    if (kind === 'churidar') { const d = 'M64 340 L98 340 L95 432 L76 432Z M102 340 L136 340 L124 432 L105 432Z'; return `<path d="${d}" fill="${color}"/><path d="${d}" fill="${ov}"/><path d="M78 400 q8 3 16 0 M78 410 q8 3 16 0 M106 400 q8 3 16 0 M106 410 q8 3 16 0 M78 420 q8 3 16 0 M106 420 q8 3 16 0" stroke="#000" stroke-width=".8" opacity=".15" fill="none"/>`; }
    const d = 'M64 276 L99 276 L97 432 L71 432 Z M101 276 L136 276 L129 432 L103 432 Z';
    return `<path d="${d}" fill="${color}"/><path d="${d}" fill="${ov}"/><path d="M100 280 L100 300" stroke="${shade(color, .25)}" stroke-width="1.5"/>` +
      `<path d="M83 290 L84 428 M117 290 L116 428" stroke="#fff" stroke-width=".8" opacity=".12"/>` +
      `<path d="M72 352 q11 4 24 0 M104 352 q11 4 24 0 M73 360 q10 3 22 0 M105 360 q10 3 22 0 M72 416 q12 5 25 0 M103 416 q12 5 25 0" stroke="#000" stroke-width="1" opacity=".14" fill="none"/>`;
  }
  function shoes(kind) {
    const c = kind === 'boots' ? '#1d1a14' : kind === 'khussa' ? '#8b5a24' : '#111';
    const L = 'M66 428 L98 428 L99 446 Q78 451 60 447 Q60 434 66 428Z', R = 'M102 428 L134 428 Q140 434 140 447 Q122 451 101 446Z';
    let s = `<path d="${L}" fill="${c}"/><path d="${R}" fill="${c}"/><path d="M60 445 Q78 450 99 445 L99 447.5 Q78 452 60 448Z M101 445 Q122 450 140 445 L140 448 Q122 452 101 447.5Z" fill="#000" opacity=".55"/>`;
    s += `<ellipse cx="74" cy="440" rx="6" ry="1.8" fill="#fff" opacity="${kind === 'khussa' ? .15 : .22}"/><ellipse cx="126" cy="440" rx="6" ry="1.8" fill="#fff" opacity="${kind === 'khussa' ? .15 : .22}"/>`;
    if (kind === 'boots') s += `<path d="M76 431 l14 0 M77 435 l12 0 M110 431 l14 0 M111 435 l12 0" stroke="#4a4436" stroke-width="1"/>`;
    if (kind === 'khussa') s += `<path d="M64 438 q-6 -2 -6 -8 M136 438 q6 -2 6 -8" stroke="#c9a03a" stroke-width="2" fill="none"/><path d="M68 434 q14 3 28 0 M104 434 q14 3 28 0" stroke="#e2c060" stroke-width="1.6" fill="none"/>`;
    return s;
  }

  function ribbons(list) {
    let s = '';
    list.slice(0, 12).forEach((c, i) => {
      const row = Math.floor(i / 3), col = i % 3;
      const x = 108 + col * 9.6, y = 171 - row * 5.2;
      s += `<rect x="${x}" y="${y}" width="9" height="4.6" fill="${c}" stroke="#00000055" stroke-width=".5"/><rect x="${x + 3.6}" y="${y}" width="1.8" height="4.6" fill="${i % 2 ? '#f4f1e6' : '#0b6b3a'}" opacity=".75"/><rect x="${x}" y="${y}" width="9" height="1.2" fill="#fff" opacity=".2"/>`;
    });
    return s;
  }

  function build(o) {
    o = Object.assign({ outfit: 'student', skin: SKINS[2], hair: HAIRS[0], mood: 'neutral', rank: 0, age: 16, medals: [], hat: 'none', gray: 0 }, o);
    const id = 'c' + (++uid); o.__id = id;
    const skin = o.skin;
    const hairC = mix(o.hair, '#cfccc6', Math.min(1, o.gray || 0));
    const F = Object.assign({}, o, { hairC });
    let defs = `<radialGradient id="${id}au" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#e2ae48"/><stop offset="1" stop-color="#7a5418"/></radialGradient><pattern id="${id}fb" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="2" fill="rgba(0,0,0,.035)"/></pattern>`, back = '', body = '', head = '', hat = '';
    let sleeve = '#f3f2ee', torsoFill = '#f3f2ee', trouser = '#5d646d', legKind = 'trouser', shoeKind = 'shoe';
    const gold = '#e2ae48', goldG = `url(#${o.__id || 'x'}au)`;

    // ----- body by outfit -----
    const of = o.outfit;
    if (of === 'student') {
      torsoFill = sleeve = '#f4f3ee'; trouser = '#5c636c';
      body += `<path d="${TORSO}" fill="${torsoFill}"/><path d="M84 145 L100 165 L116 145" stroke="#d8d6cf" stroke-width="3" fill="none"/><path d="M100 165 L100 276" stroke="#d8d6cf" stroke-width="1.4"/>`;
      body += `<path d="M95 158 L105 158 L108 232 L100 242 L92 232Z" fill="#1f3f6e"/><path d="M95 158 L105 158 L102 166 L98 166Z" fill="#183357"/>`;
      body += `<rect x="108" y="180" width="20" height="18" fill="none" stroke="#d8d6cf" stroke-width="1.4"/><rect x="113" y="174" width="3" height="12" fill="#1f3f6e"/>`;
      body += `<rect x="61" y="268" width="78" height="10" fill="#222"/><rect x="95" y="268" width="10" height="10" fill="#9aa1a8"/>`;
    } else if (of === 'kurta' || of === 'sherwani' || of === 'elder') {
      const c = of === 'sherwani' ? '#efe0bb' : (o.color || '#e8e3d4');
      torsoFill = sleeve = c; trouser = of === 'sherwani' ? '#f6f3ea' : c; legKind = of === 'sherwani' ? 'churidar' : 'shalwar';
      shoeKind = of === 'sherwani' ? 'khussa' : 'shoe';
      body += `<path d="${KURTA}" fill="${c}"/><path d="M90 146 L90 214 L110 214 L110 146" fill="none" stroke="${shade(c, .14)}" stroke-width="1.6"/>`;
      body += `<path d="M86 146 Q100 154 114 146" stroke="${shade(c, .16)}" stroke-width="3" fill="none"/>`;
      if (of === 'sherwani') {
        body += `<path d="M100 150 L100 350" stroke="${goldG}" stroke-width="2.4"/>` + [170, 195, 220, 245, 270, 295].map(y => `<circle cx="100" cy="${y}" r="3" fill="${goldG}"/>`).join('');
        body += `<path d="M54 176 L147 174 M50 350 Q100 358 152 350" stroke="${goldG}" stroke-width="3" fill="none" opacity=".75"/>`;
        body += `<path d="M86 146 L100 160 L114 146" stroke="${goldG}" stroke-width="3" fill="none"/>`;
      } else {
        body += [165, 182, 199].map(y => `<circle cx="100" cy="${y}" r="2" fill="${shade(c, .25)}"/>`).join('');
      }
      if (o.waistcoat) body += `<path d="M60 152 L86 148 L100 214 L100 285 L60 285 Z M140 152 L114 148 L100 214 L100 285 L140 285Z" fill="${o.waistcoat}"/>`;
    } else if (of === 'cadet') {
      torsoFill = sleeve = '#b8a676'; trouser = '#a69468'; shoeKind = 'boots';
      body += `<path d="${TORSO}" fill="${torsoFill}"/><path d="M82 144 L100 164 L118 144 L124 152 L100 172 L76 152Z" fill="${shade(torsoFill, .12)}"/>`;
      body += `<path d="M100 172 L100 276" stroke="${shade(torsoFill, .2)}" stroke-width="1.4"/>` + [190, 215, 240].map(y => `<circle cx="100" cy="${y}" r="2.2" fill="${shade(torsoFill, .35)}"/>`).join('');
      body += `<rect x="66" y="180" width="24" height="22" fill="none" stroke="${shade(torsoFill, .2)}" stroke-width="1.4"/><rect x="110" y="180" width="24" height="22" fill="none" stroke="${shade(torsoFill, .2)}" stroke-width="1.4"/>`;
      body += `<path d="M56 152 L78 148 L78 156 L58 160Z M144 152 L122 148 L122 156 L142 160Z" fill="#f2efe4"/>`;
      body += `<rect x="61" y="266" width="78" height="12" fill="#2d4a2a"/><rect x="94" y="266" width="12" height="12" fill="${goldG}"/>`;
    } else if (of === 'combat' || of === 'ssg') {
      defs += camoDefs(id + 'cm', '#6c6a47', '#3f4a2b', '#8d7d55', '#2b3121');
      torsoFill = sleeve = `url(#${id}cm)`; trouser = `url(#${id}cm)`; shoeKind = 'boots';
      body += `<path d="${TORSO}" fill="${torsoFill}"/><path d="M82 144 L100 164 L118 144 L124 152 L100 172 L76 152Z" fill="#00000030"/>`;
      body += `<rect x="64" y="186" width="27" height="26" rx="2" fill="#00000022" stroke="#00000040"/><rect x="109" y="186" width="27" height="26" rx="2" fill="#00000022" stroke="#00000040"/>`;
      body += `<rect x="66" y="174" width="24" height="7" fill="#2b2f20"/><text x="78" y="179.6" font-size="5" text-anchor="middle" fill="#e8e1c8" font-family="sans-serif" letter-spacing=".3">${(o.tape || 'PAKISTAN').slice(0, 9).toUpperCase()}</text>`;
      body += `<rect x="93" y="176" width="14" height="${Math.max(18, rankItems(o.rank).length * 9 + 6)}" rx="1.5" fill="#3c3f2a" stroke="#22241a"/>` + insigniaStack(o.rank, 100, 182, 9, 4);
      body += ribbons(o.medals);
      body += `<rect x="61" y="266" width="78" height="12" fill="#343826"/><rect x="94" y="265" width="12" height="14" fill="#6a6a58"/>`;
      if (of === 'ssg') body += `<path d="M110 200 q10 -8 20 0 q-10 -3 -20 0Z" fill="${goldG}"/><rect x="118" y="196" width="4" height="10" fill="${goldG}"/>`;
      if (o.vest) body += `<path d="M60 160 L140 160 L138 262 L62 262Z" fill="#3a3c2b" opacity=".95"/>` + [70, 95, 120].map(x => `<rect x="${x}" y="225" width="18" height="24" rx="2" fill="#2c2e20"/>`).join('');
    } else if (of === 'dress') {
      torsoFill = sleeve = '#ab9b6d'; trouser = '#a1915f';
      body += `<path d="${TORSO}" fill="${torsoFill}"/><path d="M80 144 L100 170 L120 144 L126 152 L100 182 L74 152Z" fill="${shade(torsoFill, .14)}"/>`;
      body += `<path d="M94 152 L100 170 L106 152Z" fill="#f2efe6"/><path d="M97 158 L103 158 L101 180 L99 180Z" fill="#2c2a22"/>`;
      body += [190, 214, 238, 260].map(y => `<circle cx="100" cy="${y}" r="2.8" fill="${goldG}"/>`).join('');
      body += `<path d="M64 194 L92 194 L92 204 L64 204Z M108 194 L136 194 L136 204 L108 204Z" fill="${shade(torsoFill, .1)}"/>`;
      body += `<path d="M126 150 L68 268" stroke="#5a3a1d" stroke-width="5"/><rect x="61" y="262" width="78" height="10" fill="#5a3a1d"/><rect x="95" y="261" width="10" height="12" fill="${goldG}"/>`;
      body += ribbons(o.medals);
      body += `<path d="M56 151 L78 147 L78 156 L58 160Z M144 151 L122 147 L122 156 L142 160Z" fill="${shade(torsoFill, .18)}"/>`;
      // shoulder rank, drawn small along each epaulette (outer to inner)
      const items = rankItems(o.rank);
      items.forEach((it, i) => { body += drawItem(it, 62 + i * 6, 154 - i * 1.2, 2.8, gold); });
      items.forEach((it, i) => { body += drawItem(it, 138 - i * 6, 154 - i * 1.2, 2.8, gold); });
    } else if (of === 'suit') {
      torsoFill = sleeve = '#2a2e35'; trouser = '#24272d';
      body += `<path d="${TORSO}" fill="${torsoFill}"/><path d="M86 146 L100 230 L114 146Z" fill="#e9e7e2"/><path d="M97 152 L103 152 L102 214 L100 220 L98 214Z" fill="#5b1f24"/>`;
      body += `<path d="M84 146 L100 232 L80 186 L90 168Z M116 146 L100 232 L120 186 L110 168Z" fill="${shade(torsoFill, .25)}"/>`;
    } else if (of === 'black') {
      torsoFill = sleeve = '#1d1d20'; trouser = '#1a1a1c'; shoeKind = 'boots'; legKind = 'trouser';
      body += `<path d="${KURTA}" fill="${torsoFill}"/><path d="M84 146 L100 168 L116 146" stroke="#000" stroke-width="2" fill="none"/>`;
      body += `<path d="M60 160 L140 160 L138 262 L62 262Z" fill="#2c2a24"/>` + [70, 95, 120].map(x => `<rect x="${x}" y="222" width="18" height="24" rx="2" fill="#1d1b17"/>`).join('');
      body += `<path d="M138 150 L64 262" stroke="#4a3b2a" stroke-width="6"/>`;
    } else if (of === 'female' || of === 'doctor') {
      const c = o.color || '#3c6e8f';
      torsoFill = sleeve = c; trouser = o.trouser || tint(c, .55); legKind = 'churidar';
      body += `<path d="${DRESS_F}" fill="${c}"/><path d="M86 146 Q100 160 114 146" stroke="${shade(c, .2)}" stroke-width="3" fill="none"/>`;
      body += `<path d="M60 300 Q100 312 146 300" stroke="${tint(c, .35)}" stroke-width="5" fill="none" opacity=".7"/>`;
      if (of === 'doctor') {
        body += `<path d="M58 150 L86 146 L96 280 L96 372 L48 372 L54 176Z M142 150 L114 146 L104 280 L104 372 L152 372 L146 176Z" fill="#f4f6f7"/>`;
        body += `<path d="M86 160 Q80 210 94 230 M114 160 Q120 210 106 230" stroke="#5d6a72" stroke-width="2.2" fill="none"/><circle cx="100" cy="232" r="5" fill="#8b979e"/>`;
        sleeve = '#f4f6f7';
      }
      if (o.dupatta) body += `<path d="M58 152 Q100 200 142 152 L146 176 Q100 222 54 176Z" fill="${o.dupatta}" opacity=".95"/>`;
    }

    // ----- light & shade -----
    const torsoPath = (of === 'kurta' || of === 'sherwani' || of === 'elder' || of === 'black') ? KURTA : (of === 'female' || of === 'doctor') ? DRESS_F : TORSO;
    const L = o.lightSide || 1, dkS = 'rgba(10,6,2,.34)', ltS = 'rgba(255,248,230,.10)';
    defs += `<linearGradient id="${id}ts" gradientUnits="userSpaceOnUse" x1="52" y1="0" x2="148" y2="0"><stop offset="0" stop-color="${L > 0 ? dkS : ltS}"/><stop offset=".28" stop-color="rgba(0,0,0,0)"/><stop offset=".72" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="${L > 0 ? 'rgba(10,6,2,.18)' : dkS}"/></linearGradient>`;
    defs += `<linearGradient id="${id}tv" gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="380"><stop offset="0" stop-color="rgba(255,250,235,.10)"/><stop offset=".25" stop-color="rgba(0,0,0,0)"/><stop offset=".55" stop-color="rgba(0,0,0,.06)"/><stop offset="1" stop-color="rgba(0,0,0,.22)"/></linearGradient>`;
    defs += `<linearGradient id="${id}lg" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="140" y2="0"><stop offset="0" stop-color="rgba(0,0,0,.32)"/><stop offset=".22" stop-color="rgba(255,255,255,.05)"/><stop offset=".47" stop-color="rgba(0,0,0,.22)"/><stop offset=".53" stop-color="rgba(0,0,0,.22)"/><stop offset=".78" stop-color="rgba(255,255,255,.05)"/><stop offset="1" stop-color="rgba(0,0,0,.3)"/></linearGradient>`;
    defs += `<linearGradient id="${id}aL" gradientUnits="userSpaceOnUse" x1="38" y1="0" x2="72" y2="0"><stop offset="0" stop-color="rgba(0,0,0,.38)"/><stop offset=".55" stop-color="rgba(0,0,0,.04)"/><stop offset="1" stop-color="rgba(255,250,235,.08)"/></linearGradient>`;
    defs += `<linearGradient id="${id}aR" gradientUnits="userSpaceOnUse" x1="128" y1="0" x2="162" y2="0"><stop offset="0" stop-color="rgba(255,250,235,.08)"/><stop offset=".45" stop-color="rgba(0,0,0,.04)"/><stop offset="1" stop-color="rgba(0,0,0,.38)"/></linearGradient>`;
    defs += `<radialGradient id="${id}sk" cx="${L > 0 ? .58 : .42}" cy=".42" r=".66"><stop offset="0" stop-color="${tint(skin, .1)}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, .22)}"/></radialGradient>`;
    defs += `<linearGradient id="${id}nk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(skin, .38)}"/><stop offset=".6" stop-color="${shade(skin, .12)}"/><stop offset="1" stop-color="${skin}"/></linearGradient>`;
    body += `<path d="${torsoPath}" fill="url(#${id}fb)"/><path d="${torsoPath}" fill="url(#${id}ts)"/><path d="${torsoPath}" fill="url(#${id}tv)"/>`;
    body += `<path d="M63 168 Q67 192 64 214 M137 168 Q133 192 136 214" stroke="#000" stroke-width="2.4" opacity=".14" fill="none" stroke-linecap="round"/>`;
    body += `<path d="M70 252 Q80 258 92 253 M108 253 Q120 258 130 252 M74 236 Q84 241 95 237 M105 237 Q116 241 126 236 M80 160 Q92 172 96 186 M120 160 Q108 172 104 186" stroke="#000" stroke-width="1" opacity=".13" fill="none"/>`;
    // ----- neck & arms -----
    const neck = `<path d="M88.5 116 L111.5 116 L113.5 150 Q100 157 86.5 150Z" fill="url(#${id}nk)"/><path d="M89 141 Q100 148 111 141" stroke="${shade(skin, .22)}" stroke-width="1.6" fill="none" opacity=".7"/><path d="M96 128 L95 146 M104 128 L105 146" stroke="${shade(skin, .3)}" stroke-width="1" opacity=".3"/>`;
    // gorget patches for brigadier and above
    let gorget = '';
    if (o.rank >= 8 && (of === 'dress' || of === 'combat' || of === 'ssg')) gorget = `<rect x="80" y="149" width="9" height="12" fill="#b3201e" transform="rotate(35 84 155)"/><rect x="111" y="149" width="9" height="12" fill="#b3201e" transform="rotate(-35 116 155)"/><path d="M80 151 L88 160 M120 151 L112 160" stroke="${goldG}" stroke-width="1.2"/>`;

    // ----- head -----
    const faceShape = o.female
      ? 'M71 90 Q71 52 100 53 Q129 52 129 90 Q129 118 117 130 Q100 140 83 130 Q71 118 71 90Z'
      : 'M70 90 Q70 50 100 52 Q130 50 130 90 Q131 120 117 132 Q100 141 83 132 Q69 120 70 90Z';
    if (o.female && o.hat !== 'hijab') back += `<path d="M66 82 Q60 150 74 178 L126 178 Q140 150 134 82Z" fill="${hairC}"/>`;
    if (o.hat === 'hijab') back += `<path d="M62 96 Q58 40 100 41 Q142 40 138 96 Q140 140 152 172 L48 172 Q60 140 62 96Z" fill="${o.hijabC || '#6b3d55'}"/>`;
    head += `<ellipse cx="70" cy="97" rx="5.5" ry="9.4" fill="${shade(skin, .08)}"/><ellipse cx="130" cy="97" rx="5.5" ry="9.4" fill="${shade(skin, .08)}"/><path d="M71 92 q-3 4 -1 10 M129 92 q3 4 1 10" stroke="${shade(skin, .35)}" stroke-width="1.2" fill="none"/>`;
    head += `<path d="${faceShape}" fill="url(#${id}sk)"/>`;
    if (o.beard === 'full' || o.beard === 'white') {
      const bc = o.beard === 'white' ? '#e6e3dc' : hairC;
      head += `<path d="M70 94 Q69 142 100 146 Q131 142 130 94 Q127 120 114 123 Q100 128 86 123 Q73 120 70 94Z" fill="${bc}"/>`;
    } else if (o.beard === 'stubble') {
      head += `<path d="M71 96 Q71 138 100 141 Q129 138 129 96 Q126 121 113 124 Q100 128 87 124 Q74 121 71 96Z" fill="${hairC}" opacity=".22"/>`;
    }
    head += `<g class="face">${face(F)}</g>`;
    if (o.mask) head += `<path d="M69 101 Q100 112 131 101 L130 130 Q100 146 70 130Z" fill="${o.mask}"/><path d="M70 104 Q100 116 130 104" stroke="#00000044" stroke-width="2" fill="none"/>`;
    // hair
    if (o.hat !== 'hijab' && o.hat !== 'gencap' && o.hat !== 'cap' && o.hat !== 'helmet') {
      if (o.female) head += `<path d="M68 92 Q64 48 100 49 Q136 48 132 92 Q124 62 104 62 Q92 72 76 70 Q70 78 68 92Z" fill="${hairC}"/><path d="M72 86 Q74 60 98 54 M104 58 Q124 60 128 86 M84 66 Q98 56 116 60" stroke="${tint(hairC, .25)}" stroke-width="1" fill="none" opacity=".55"/>`;
      else if (o.hairStyle === 'bald') head += `<path d="M68 92 Q68 78 72 74 L74 92Z M132 92 Q132 78 128 74 L126 92Z" fill="${hairC}"/>`;
      else head += `<path d="M68 90 Q63 50 100 48 Q137 50 132 90 Q129 70 118 64 Q104 70 88 64 Q73 68 68 90Z" fill="${hairC}"/><path d="M70 84 Q72 62 88 56 M76 78 Q82 60 102 54 M88 62 Q104 52 122 60 M104 60 Q122 58 130 80 M96 58 Q112 54 126 70 M72 74 Q78 62 92 58" stroke="${tint(hairC, .22)}" stroke-width=".9" fill="none" opacity=".6"/><path d="M80 70 Q92 60 108 62 M90 66 Q104 58 120 66" stroke="${shade(hairC, .4)}" stroke-width="1" fill="none" opacity=".5"/><path d="M69 88 Q70 80 74 76 M131 88 Q130 80 126 76" stroke="${hairC}" stroke-width="3" fill="none" opacity=".6"/><path d="M84 60 Q100 52 118 58" stroke="rgba(255,255,255,.22)" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    } else if (o.hat !== 'hijab') {
      head += `<path d="M69 88 Q68 74 74 70 L76 88Z M131 88 Q132 74 126 70 L124 88Z" fill="${hairC}"/>`;
    }
    if (o.hat === 'hijab') head += `<path d="M66 86 Q64 46 100 46 Q136 46 134 86 Q128 58 100 58 Q72 58 66 86Z" fill="${o.hijabC || '#6b3d55'}"/>`;
    // hats
    if (o.hat === 'beret') {
      const bc = o.beretC || '#1f2a1c';
      hat += `<path d="M63 76 Q56 44 98 40 Q138 38 140 60 Q141 70 132 72 Q100 62 68 78Z" fill="${bc}"/><path d="M66 78 Q100 64 134 71" stroke="${shade(bc, .4)}" stroke-width="4" fill="none"/>`;
      hat += `<g transform="translate(80 64)"><circle r="6.2" fill="${goldG}"/><circle r="3.8" fill="${shade(gold, .3)}"/>${crescentStar(0, 0, 2.6, '#f8e3a2')}</g>`;
    } else if (o.hat === 'cap' || o.hat === 'gencap') {
      const crown = o.hat === 'gencap' ? '#a99a6c' : (o.capC || '#a99a6c');
      const band = o.hat === 'gencap' ? '#b3201e' : (o.bandC || '#5b4a2a');
      hat += `<path d="M60 66 Q62 34 100 32 Q138 34 140 66 Q100 58 60 66Z" fill="${crown}"/><path d="M64 62 L136 62 L136 76 L64 76Z" fill="${band}"/>`;
      hat += `<path d="M62 75 Q100 92 138 75 L138 79 Q100 98 62 79Z" fill="#141414"/>`;
      if (o.hat === 'gencap') hat += `<path d="M66 79 Q100 95 134 79" stroke="${goldG}" stroke-width="2.6" fill="none" stroke-dasharray="4 2"/><path d="M68 76 L132 76" stroke="${goldG}" stroke-width="1.6"/>`;
      hat += `<g transform="translate(100 60)"><circle r="7" fill="${goldG}"/>${crescentStar(0, 0, 3.3, '#fff3c4')}</g>`;
    } else if (o.hat === 'topi') {
      hat += `<path d="M69 72 Q69 50 100 50 Q131 50 131 72Z" fill="#f2efe6"/><path d="M70 66 L130 66" stroke="#d8d3c5" stroke-width="2"/>`;
    } else if (o.hat === 'helmet') {
      hat += `<path d="M62 84 Q58 38 100 37 Q142 38 138 84 Q100 72 62 84Z" fill="#4f5638"/><path d="M64 70 Q100 54 136 70 M66 56 Q100 44 134 56" stroke="#2f3322" stroke-width="2" fill="none"/>`;
    } else if (o.hat === 'wrap') {
      hat += `<path d="M64 80 Q60 42 100 40 Q140 42 136 80 Q100 66 64 80Z" fill="${o.wrapC || '#3b322a'}"/><path d="M66 72 Q100 60 134 72" stroke="#00000055" stroke-width="3" fill="none"/>`;
    } else if (o.hat === 'kulla') {
      hat += `<path d="M64 74 Q62 36 100 30 Q138 36 136 74 Q100 64 64 74Z" fill="#e6c77a"/><path d="M66 70 Q100 58 134 70 M68 58 Q100 46 132 58" stroke="#b88a2c" stroke-width="2.4" fill="none"/><path d="M118 40 Q140 20 128 8" stroke="#e6c77a" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    }

    defs += `<radialGradient id="${id}gs"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
    const shadow = `<ellipse cx="${100 - (o.lightSide || 1) * 14}" cy="448" rx="78" ry="11" fill="url(#${id}gs)"/>`;
    const HS = 'translate(100 146) scale(.86) translate(-100 -146)';
    const svg = `<svg viewBox="0 0 200 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${shadow}
      <g class="sway"><g class="body"><g transform="${HS}">${back}</g>${legs(trouser, legKind, id)}${shoes(shoeKind)}${neck}${body}${gorget}${arms(sleeve, skin, id)}
        <g class="headg"><g transform="${HS}">${head}${hat}</g></g>
      </g></g></svg>`;
    return svg;
  }

  // small idle life: eyes glance around now and then
  // ---- living characters ----
  // One shared loop moves every visible character like a person: weight shifts on springs, breathing
  // that lifts the shoulders, the head following the eyes, arms that lag behind the body, random blinks,
  // glances, nods and shrugs, and a livelier head and brows while talking.
  const LIVE = new Set(); let liveRaf = 0, liveLast = 0, liveAcc = 0;
  const rr = (a, b) => a + Math.random() * (b - a);
  function spring(o, target, k, damp, dt) { o.v += ((target - o.x) * k - o.v * damp) * dt; o.x += o.v * dt; }
  function newState() {
    return { t: Math.random() * 10, sway: { x: 0, v: 0 }, swayT: 0, swayNext: rr(1, 3), arm: { x: 0, v: 0 }, head: { x: 0, v: 0 }, look: 0, lookY: 0, lookNext: rr(.5, 2),
      breathF: rr(.2, .27), blink: rr(1, 4), lid: 0, nod: 0, shrug: 0, idleNext: rr(6, 12), brow: { x: 0, v: 0 }, browNext: 1, tilt: { x: 0, v: 0 } };
  }
  function parts(el) {
    const svg = el.querySelector('svg');
    if (el._svg !== svg) {
      el._svg = svg;
      const q = c => el.querySelector(c), qa = c => [...el.querySelectorAll(c)];
      el._p = { sway: q('.sway'), body: q('.body'), head: q('.headg'), iris: qa('.iris'), lids: qa('.lid'), brows: q('.brows'), armL: q('.arm-rest-l'), armR: q('.arm-rest-r') };
      if (el._p.armL) { el._p.armL.style.transformOrigin = '139px 160px'; el._p.armL.style.transformBox = 'view-box'; }
      if (el._p.armR) { el._p.armR.style.transformOrigin = '61px 160px'; el._p.armR.style.transformBox = 'view-box'; }
      if (el._p.brows) { el._p.brows.style.transformOrigin = '100px 90px'; el._p.brows.style.transformBox = 'view-box'; }
    }
    return el._p;
  }
  function animate(el, dt) {
    const s = el._st, P = parts(el); if (!P.sway) return;
    s.t += dt;
    const talking = el.classList.contains('talking');
    // weight shift: pick a new stance every few seconds and settle into it on a spring
    if ((s.swayNext -= dt) <= 0) { s.swayT = rr(-1, 1) * (Math.random() < .3 ? .3 : 1); s.swayNext = rr(2.5, 6.5); }
    spring(s.sway, s.swayT, 6, 4.2, dt);
    spring(s.arm, s.sway.x + s.sway.v * .25, 9, 3.2, dt);
    // where the eyes look; the head follows a moment later
    if ((s.lookNext -= dt) <= 0) { const big = Math.random() < .2; s.look = Math.random() < .4 ? 0 : rr(-1, 1) * (big ? 1.5 : .8); s.lookY = rr(-.5, .4); s.lookNext = big ? rr(.8, 1.6) : rr(1.2, 3.6); if (big && Math.random() < .5) s.lookNext += 0; }
    const talkRot = talking ? Math.sin(s.t * 5.1) * 1.3 + Math.sin(s.t * 2.3 + 1) * .9 : 0;
    spring(s.head, s.look * 3.2 - s.sway.x * .7 + talkRot, talking ? 14 : 5, 4.5, dt);
    spring(s.tilt, (talking ? Math.sin(s.t * 1.7) * .8 : 0) + s.lookY * 1.2, 4, 3, dt);
    // occasional idle moments: a nod, a shrug, or a long glance away
    if ((s.idleNext -= dt) <= 0) { const r = Math.random(); if (r < .4) s.nod = 1; else if (r < .65) s.shrug = 1; else { s.look = rr(-1, 1) > 0 ? 1.6 : -1.6; s.lookNext = rr(1, 1.8); } s.idleNext = rr(7, 15); }
    if (talking && Math.random() < dt * .7) s.nod = Math.max(s.nod, .6);
    s.nod = Math.max(0, s.nod - dt * 1.6); s.shrug = Math.max(0, s.shrug - dt * 1.4);
    const nodY = Math.sin((1 - s.nod) * Math.PI * 2) * s.nod * 2.2, shrugY = Math.sin((1 - s.shrug) * Math.PI) * s.shrug * 3;
    // brows lift with emphasis while talking, and a little on big glances
    if ((s.browNext -= dt) <= 0) { s.browNext = talking ? rr(.6, 1.8) : rr(3, 7); s.brow.v -= talking ? rr(6, 14) : rr(0, 5); }
    spring(s.brow, 0, 18, 6, dt);
    // breathing
    const b = Math.sin(s.t * s.breathF * Math.PI * 2), deep = 1 + Math.max(0, Math.sin(s.t * .09)) * .6;
    // blinking, sometimes twice
    if ((s.blink -= dt) <= 0) { s.lid = .13; s.blink = Math.random() < .15 ? .22 : rr(2, 5.5); }
    s.lid = Math.max(0, s.lid - dt);
    const sw = s.sway.x;
    P.sway.style.transform = `translateX(${sw * 2.2}px) rotate(${sw * 1.1}deg)`;
    P.body.style.transform = `translateY(${-b * .7 * deep}px) scale(1, ${1 + b * .007 * deep})`;
    const hy = nodY - shrugY * .5 - b * .4;
    if (P.head) P.head.style.transform = `translate(${s.tilt.x * .4}px, ${hy}px) rotate(${s.head.x}deg)`;
    const armSwing = (s.arm.x - sw) * 3.2, shoulder = -b * .6 * deep - shrugY;
    if (P.armL) P.armL.style.transform = `translateY(${shoulder}px) rotate(${-1 - armSwing + sw * .4}deg)`;
    if (P.armR) P.armR.style.transform = `translateY(${shoulder}px) rotate(${1 - armSwing + sw * .4}deg)`;
    const ix = s.look * 1.9, iy = s.lookY * 1.1;
    P.iris.forEach(g => { g.style.transform = `translate(${ix}px, ${iy}px)`; });
    P.lids.forEach(l => { l.style.transform = `scaleY(${s.lid > 0 ? 1 : 0})`; });
    if (P.brows) P.brows.style.transform = `translateY(${s.brow.x * .12}px)`;
  }
  function liveTick(now) {
    liveRaf = 0;
    const raw = Math.min(.1, (now - (liveLast || now)) / 1000); liveLast = now; liveAcc += raw;
    // 30 fps is plenty for this, and 20 in battery saver
    if (liveAcc >= (window.PERF && PERF.low ? 1 / 20 : 1 / 30)) {
      const dt = Math.min(.1, liveAcc); liveAcc = 0;
      LIVE.forEach(el => {
        if (!el.isConnected) { LIVE.delete(el); el._alive = false; return; }
        if (el.offsetParent === null || (window.PERF && PERF.covered(el))) return;
        try { animate(el, dt); } catch (e) {}
      });
    }
    if (LIVE.size) liveRaf = requestAnimationFrame(liveTick);
  }
  function life(el) {
    if (!el._alive) { el._alive = true; el._st = newState(); el.classList.add('alive'); LIVE.add(el); }
    if (!liveRaf) liveRaf = requestAnimationFrame(liveTick);
  }
  function render(el, o) { el.innerHTML = build(o); el.dataset.mood = o.mood || 'neutral'; life(el); }
  function setMood(el, o, mood) {
    const g = el.querySelector('.face');
    if (!g) return render(el, Object.assign({}, o, { mood }));
    const hairC = mix(o.hair || HAIRS[0], '#cfccc6', Math.min(1, o.gray || 0));
    g.innerHTML = face(Object.assign({}, o, { hairC, mood }));
  }
  // the character as an <img> for canvas cutscenes; variants for blinking, talking and saluting
  const imgCache = new Map();
  function image(o, v = {}) {
    const key = JSON.stringify(o) + JSON.stringify(v);
    let im = imgCache.get(key);
    if (im) return im;
    const css = `.lid{transform:scaleY(${v.blink ? 1 : 0})}.mouth-talk{opacity:${v.talk ? 1 : 0}}.mouth-rest{opacity:${v.talk ? 0 : 1}}.arm-gesture{display:none}.arm-cross{display:none}.arm-hips{display:none}${v.salute ? '.arm-rest-r{display:none}' : '.arm-salute{display:none}'}`;
    const svg = build(o).replace('<svg viewBox="0 0 200 460"', '<svg width="800" height="1840" viewBox="0 0 200 460"').replace('<defs>', `<style>${css}</style><defs>`);
    im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    imgCache.set(key, im); if (imgCache.size > 80) imgCache.delete(imgCache.keys().next().value);
    return im;
  }
  return { build, render, setMood, insigniaBadge, SKINS, HAIRS, rankItems, mix, image };
})();

// make the module reachable as window.X too (top-level const is not a window property)
 window.CHAR = CHAR;
