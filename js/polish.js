// Finishing touches: splash screen with tips, the 7-day login calendar, a first-time guided tour,
// tappable stat explanations, text size and reduced-motion settings.
const POLISH = (() => {
  const $ = id => document.getElementById(id);
  const TIPS = [
    'Bold plans in Operations pay 45% more, but the mission gets harder.',
    'Every mission, anywhere in the game, earns XP and supplies for Operations.',
    'Honour below 25 blocks every promotion. Some shortcuts cost more than they look.',
    'Foreign courses raise your promotion score. Apply from the Career tab.',
    'Your squad buddy fights beside you in assaults and on the post.',
    'Tap any stat on the life screen to see what it does.',
    'Spending time with family costs work time. Neglect costs more.',
    'Day 7 of your login streak brings a Gold Crate.',
    'Battery saver graphics switch on by themselves if your phone struggles.',
    'Perks bought with Merit Stars carry into every future life.',
  ];
  const STAT_HELP = {
    health: ['Health', 'Falls with age, injuries and stress. At zero, your story ends. Rest, PT and check-ups raise it.'],
    happy: ['Happiness', 'Family time, friends, leave and good news raise it. Long postings and neglect lower it.'],
    intellect: ['Intellect', 'Study and courses raise it. It opens staff college, intelligence work and foreign courses.'],
    fitness: ['Fitness', 'PT, sport and courses raise it. It falls slowly after 36. Commando courses need it.'],
    courage: ['Courage', 'Raised by missions and brave choices. It makes you steadier in fights and on the range.'],
    honor: ['Honour', 'Your integrity. Counts 20% at every promotion board; below 25 you cannot be promoted at all.'],
    leadership: ['Leadership', 'How your men follow you. Counts 20% at promotion boards. Raised by command and mentoring.'],
    perf: ['Performance', 'Your service record. Counts 60% at promotion boards and drifts down every year unless you keep working.'],
  };

  // ---------- splash ----------
  function splash() {
    const d = document.createElement('div'); d.className = 'splash'; d.id = 'splash';
    d.innerHTML = `<div class="sp-in"><div class="crest"><svg viewBox="0 0 100 100"><defs><radialGradient id="spg" cx="40%" cy="35%"><stop offset="0" stop-color="#f6d27a"/><stop offset="1" stop-color="#9a6210"/></radialGradient></defs>
      <circle cx="50" cy="50" r="46" fill="#0b4a2a" stroke="url(#spg)" stroke-width="4"/><circle cx="46" cy="53" r="23" fill="#f4f2ea"/><circle cx="54" cy="48" r="20" fill="#0b4a2a"/><path d="M66 33l2.6 6 6.4.5-4.9 4.2 1.5 6.3-5.6-3.4-5.6 3.4 1.5-6.3-4.9-4.2 6.4-.5z" fill="#f4f2ea"/>
      <path d="M22 80L78 24M78 80L22 24" stroke="url(#spg)" stroke-width="3" stroke-linecap="round" opacity=".55"/></svg></div>
      <h1>Sipahi<span>se</span>Sipahsalar</h1><div class="sp-bar"><i></i></div><p class="sp-tip">${TIPS[(Math.random() * TIPS.length) | 0]}</p><button class="btn primary sp-go" hidden>Tap to begin</button></div>`;
    document.getElementById('app').appendChild(d);
    setTimeout(() => { d.querySelector('.sp-go').hidden = false; d.classList.add('ready'); }, 1100);
    const go = () => { if (!d.classList.contains('ready')) return; try { SFX.unlock(); SFX.choose(); } catch (e) {} d.classList.add('out'); setTimeout(() => d.remove(), 450); };
    // close on click (not pointerup) and keep blocking taps while fading, so the same tap never lands on a button underneath
    d.addEventListener('click', e => { e.stopPropagation(); go(); });
  }

  // ---------- 7-day calendar for the daily ration ----------
  function calendar(streak) {
    const day = ((streak - 1) % 7) + 1;
    const rewards = [1, 2, 3, 4, 5, 6, 7].map(i => i === 7 ? '▣ Gold' : `★ ${Math.min(30, 5 + (streak - day + i) * 3)}`);
    return `<div class="cal">${rewards.map((r, i) => `<div class="cal-d ${i + 1 < day ? 'got' : i + 1 === day ? 'today' : ''} ${i === 6 ? 'big' : ''}"><small>Day ${i + 1}</small><b>${r}</b>${i + 1 < day ? '<em>✓</em>' : ''}</div>`).join('')}</div>`;
  }

  // ---------- first-time guided tour of the life screen ----------
  const TOUR = [
    ['#btnAge', 'Tap AGE to live through the next year. Every year brings new scenes, decisions and pay.'],
    ['[data-tab="activities"]', 'You get 3 actions a year. Each activity shows what goes up (green) and what it costs (red).'],
    ['[data-tab="career"]', 'Your pay, perks, property and foreign courses are in Career.'],
    ['.opschip', 'Operations is the mission campaign. Missions there make your officer stronger everywhere.'],
    ['#stats', 'Tap any stat to see what it does and how to raise it.'],
    ['#btnHome', 'Main menu. Your progress saves itself, so you can leave any time.'],
  ];
  function tour() {
    let i = 0; const ov = document.createElement('div'); ov.className = 'tour'; ov.innerHTML = '<div class="tour-ring"></div><div class="tour-tip"><p></p><div class="row"><button class="btn small ghost" data-t="skip">Skip</button><button class="btn small primary" data-t="next">Next</button></div></div>';
    document.getElementById('app').appendChild(ov);
    const ring = ov.querySelector('.tour-ring'), tip = ov.querySelector('.tour-tip');
    const show = () => {
      const [sel, txt] = TOUR[i], el = document.querySelector(sel);
      if (!el || el.offsetParent === null) { i++; return i < TOUR.length ? show() : end(); }
      const r = el.getBoundingClientRect(), pad = 6;
      Object.assign(ring.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
      tip.querySelector('p').textContent = txt; tip.querySelector('[data-t="next"]').textContent = i === TOUR.length - 1 ? 'Got it' : 'Next';
      const below = r.top < innerHeight / 2; tip.style.top = below ? r.bottom + 14 + 'px' : ''; tip.style.bottom = below ? '' : innerHeight - r.top + 14 + 'px';
      tip.classList.remove('pop'); void tip.offsetWidth; tip.classList.add('pop');
    };
    const end = () => { ov.remove(); try { localStorage.setItem('sss_tour', '1'); } catch (e) {} };
    ov.addEventListener('click', e => { const t = e.target.closest('[data-t]'); try { SFX.click(); } catch (er) {} if (t && t.dataset.t === 'skip') return end(); i++; if (i >= TOUR.length) end(); else show(); });
    show();
  }
  function maybeTour() {
    let done = false; try { done = localStorage.getItem('sss_tour') === '1'; } catch (e) {}
    if (done) return;
    const quiet = () => ['story', 'cut', 'game', 'modal', 'sheet'].every(id => $(id).hidden) && !$('life').hidden && !document.getElementById('splash');
    const iv = setInterval(() => { if (quiet()) { clearInterval(iv); setTimeout(() => { if (quiet()) tour(); else maybeTour(); }, 900); } }, 800);
  }

  // ---------- stat explanations ----------
  function statHelp() {
    $('stats').addEventListener('click', e => {
      const s = e.target.closest('.stat'); if (!s || !STAT_HELP[s.dataset.k]) return;
      document.querySelectorAll('.stat-pop').forEach(x => x.remove());
      const [n, t] = STAT_HELP[s.dataset.k], pop = document.createElement('div'); pop.className = 'stat-pop';
      pop.innerHTML = `<b>${n}</b><span>${t}</span>`; s.appendChild(pop); try { SFX.click(); } catch (er) {}
      setTimeout(() => pop.remove(), 4200);
    });
  }

  function applySettings() {
    const st = (window.META && META.settings) || {}, r = document.documentElement;
    r.classList.toggle('txt-s', st.text === 's'); r.classList.toggle('txt-l', st.text === 'l'); r.classList.toggle('calm', !!st.calm);
  }

  // automated tests set window.__NOSPLASH to skip the splash and tour
  function init() { applySettings(); if (!window.__NOSPLASH) { splash(); maybeTour(); } statHelp(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { calendar, applySettings, tour, TIPS };
})();
window.POLISH = POLISH;
