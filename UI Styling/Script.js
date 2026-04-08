/* ================================================
   THE LIFE OF A DEVELOPER — script.js
   by Shwetank Patil
   ================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ── helpers ── */
const $ = id => document.getElementById(id);
const isMobile = window.innerWidth <= 768;
const isTouch  = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

/* ════════════════════════
   LOADER
════════════════════════ */
const lmsgs = [
  '$ npm install life...',
  '⚠ 312 vulnerabilities found',
  '$ npm run dev',
  'compiling... ████░░ 67%',
  'compiled (barely)',
  '🚀 ready on localhost:3000'
];
let li = 0;
const lint = setInterval(() => {
  if (li < lmsgs.length) $('lmsg').textContent = lmsgs[li++];
  else clearInterval(lint);
}, 390);
setTimeout(() => $('loader').classList.add('out'), 2600);

/* ════════════════════════
   STAR CURSOR
════════════════════════ */
const cur = $('cur'), trail = $('cur-trail');
if (window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    cur.style.left   = e.clientX + 'px';
    cur.style.top    = e.clientY + 'px';
    trail.style.left = e.clientX + 'px';
    trail.style.top  = e.clientY + 'px';
  }, { passive: true });

  document.querySelectorAll('a,button,.chip,.btab,.badge,.cof-btn,.ndot,.tl-item,.stat,.ctr').forEach(el => {
    el.addEventListener('mouseenter', () => { cur.classList.add('hovered'); trail.classList.add('hovered'); });
    el.addEventListener('mouseleave', () => { cur.classList.remove('hovered'); trail.classList.remove('hovered'); });
  });
}

/* ════════════════════════
   THREE.JS PARTICLE FIELD
════════════════════════ */
(function initThree() {
  const canvas = $('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });

  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const N = isMobile ? 1000 : 3000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const palette = [
    new THREE.Color('#39ff8f'), new THREE.Color('#3d8fff'),
    new THREE.Color('#ff2d55'), new THREE.Color('#ffb800'),
    new THREE.Color('#ffffff')
  ];
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 130;
    pos[i*3+1] = (Math.random() - 0.5) * 90;
    pos[i*3+2] = (Math.random() - 0.5) * 70;
    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: isMobile ? 0.18 : 0.22, vertexColors: true, transparent: true, opacity: 0.7, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // Grid lines (desktop only)
  if (!isMobile) {
    const gm = new THREE.LineBasicMaterial({ color: 0x39ff8f, transparent: true, opacity: 0.03 });
    for (let i = -10; i <= 10; i += 2) {
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-65, i*4, 0), new THREE.Vector3(65, i*4, 0)]), gm));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i*6.5, -45, 0), new THREE.Vector3(i*6.5, 45, 0)]), gm));
    }
  }

  let mx = 0, my = 0, sy = 0;
  if (!isTouch) {
    window.addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth  - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }
  window.addEventListener('scroll', () => { sy = window.scrollY; }, { passive: true });

  // Pause render when tab is hidden (saves battery)
  let tabActive = true;
  document.addEventListener('visibilitychange', () => { tabActive = !document.hidden; });

  // 60fps cap
  let lastT = 0;
  function animate(ts) {
    requestAnimationFrame(animate);
    if (!tabActive || ts - lastT < 16) return;
    lastT = ts;
    const t = ts * 0.0003;
    pts.rotation.y = t * 0.15 + mx * 0.07;
    pts.rotation.x = t * 0.08 + my * 0.04;
    pts.rotation.z = t * 0.04;
    camera.position.y = -sy * 0.008;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }, { passive: true });
})();

/* ════════════════════════
   SCROLL PROGRESS BAR
════════════════════════ */
const pbar = $('bar');
window.addEventListener('scroll', () => {
  pbar.style.width = (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
  updateDots();
}, { passive: true });

/* ════════════════════════
   NAV DOTS
════════════════════════ */
const sIds  = ['s-hero','s-hello','s-bugs','s-deadline','s-end'];
const ndots = document.querySelectorAll('.ndot');
function goTo(i) { $(sIds[i]).scrollIntoView({ behavior: 'smooth' }); }
function updateDots() {
  sIds.forEach((id, i) => {
    const r = $(id).getBoundingClientRect();
    ndots[i].classList.toggle('on', r.top < innerHeight / 2 && r.bottom > innerHeight / 2);
  });
}

/* ════════════════════════
   HERO — GSAP entry animations
════════════════════════ */
gsap.timeline({ delay: 0.4 })
  .to('#h-eye',   { opacity: 1, y: 0, duration: .8, ease: 'power3.out' })
  .to('#h-title', { opacity: 1, y: 0, duration: 1,  ease: 'power3.out' }, '-=.55')
  .to('#h-sub',   { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.6')
  .to('#h-cue',   { opacity: 1,       duration: .7                      }, '-=.3');

// Hero shrinks & fades as you scroll away
gsap.to('#hero-inner', {
  scale: 0.82, opacity: 0, y: -40,
  scrollTrigger: { trigger: '#s-hero', start: 'top top', end: 'bottom top', scrub: 1.3 }
});

/* ════════════════════════
   HORIZONTAL SCROLL — § 2
════════════════════════ */
const hzTrack = $('hz-track');
gsap.to(hzTrack, {
  x: () => -(hzTrack.scrollWidth - innerWidth),
  ease: 'none',
  scrollTrigger: {
    trigger: '#s-hello', start: 'top top',
    end: () => '+=' + (hzTrack.scrollWidth - innerWidth),
    pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: self => { if (self.progress > 0.73) animateBars(); }
  }
});

// Slide content reveals — progress-based (works inside pinned sections)
const hzSlides = document.querySelectorAll('.hz-slide');
const hzTotal  = hzSlides.length;
let lastActive = -1;

hzSlides.forEach(slide => {
  gsap.set(slide.querySelectorAll('.s-label,.rule,.s-title,.s-body,.editor,.timeline,.mem-bars'), { opacity: 0, y: 22 });
});

// Reveal slide 0 immediately on load
gsap.to(hzSlides[0].querySelectorAll('.s-label,.rule,.s-title,.s-body'), {
  opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08, delay: 0.1
});
lastActive = 0;

ScrollTrigger.create({
  trigger: '#s-hello',
  start: 'top top',
  end: () => '+=' + (hzTrack.scrollWidth - innerWidth),
  scrub: 1,
  onUpdate(self) {
    const active = Math.min(Math.round(self.progress * (hzTotal - 1)), hzTotal - 1);
    if (active === lastActive) return;
    const oldItems = hzSlides[lastActive].querySelectorAll('.s-label,.rule,.s-title,.s-body,.editor,.timeline,.mem-bars');
    gsap.to(oldItems, { opacity: 0, y: -14, duration: 0.2, ease: 'power2.in', overwrite: true });
    const newItems = hzSlides[active].querySelectorAll('.s-label,.rule,.s-title,.s-body,.editor,.timeline,.mem-bars');
    gsap.fromTo(newItems, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.07, overwrite: true });
    lastActive = active;
  }
});

let barsOn = false;
function animateBars() {
  if (barsOn) return; barsOn = true;
  document.querySelectorAll('#mem-bars .mb-fill').forEach(el => {
    gsap.to(el, { width: el.getAttribute('data-w'), duration: 1.1, ease: 'power2.out', delay: Math.random() * 0.25 });
  });
}

/* ════════════════════════
   BUG ZONE — § 3
════════════════════════ */
gsap.fromTo('#bug-left',  { opacity: 0, x: isMobile ? 0 : -55 }, {
  opacity: 1, x: 0, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '#s-bugs', start: 'top 68%', toggleActions: 'play none none reverse' }
});
gsap.fromTo('#bug-right', { opacity: 0, x: isMobile ? 0 : 55 }, {
  opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: .15,
  scrollTrigger: { trigger: '#s-bugs', start: 'top 68%', toggleActions: 'play none none reverse' }
});

// Animated counters
let cntd = false;
ScrollTrigger.create({ trigger: '#s-bugs', start: 'top 60%', onEnter: () => {
  if (cntd) return; cntd = true;
  cnt('c-cof', 0, 23,  1800);
  cnt('c-so',  0, 47,  2200);
  cnt('c-log', 0, 312, 2000);
  cnt('c-wk',  0, 8,   1400);
}});
function cnt(id, from, to, dur) {
  const el = $(id), s = performance.now();
  (function tick(now) {
    const p = Math.min((now - s) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(tick);
  })(s);
}

// Bug squash interaction
let sq = 0;
function squash(el) {
  if (el.classList.contains('fixed')) return;
  el.classList.add('fixed');
  el.textContent = el.textContent.replace('🐛', '✓');
  sq++;
  $('bug-msg').textContent = `✓ ${sq} squashed — but ${sq*4} more appeared 🐛`;
  gsap.fromTo(el, { scale: 1.18 }, { scale: 1, duration: .3, ease: 'back.out(3)' });
}

/* ════════════════════════
   DEADLINE — § 4
════════════════════════ */
gsap.fromTo('#dl-left',  { opacity: 0, y: 50 }, {
  opacity: 1, y: 0, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '#s-deadline', start: 'top 68%', toggleActions: 'play none none reverse' }
});
gsap.fromTo('#dl-right', { opacity: 0, y: 50 }, {
  opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: .18,
  scrollTrigger: { trigger: '#s-deadline', start: 'top 68%', toggleActions: 'play none none reverse' }
});

// Real countdown clock
function tickClock() {
  const n = new Date(), e = new Date(n);
  e.setHours(23, 59, 59, 0);
  const d = e - n;
  const h = String(Math.floor(d / 3600000)).padStart(2, '0');
  const m = String(Math.floor(d % 3600000 / 60000)).padStart(2, '0');
  const s = String(Math.floor(d % 60000 / 1000)).padStart(2, '0');
  $('clock').textContent      = `${h}:${m}:${s}`;
  $('clock-stat').textContent = `${h}:${m}`;
}
tickClock(); setInterval(tickClock, 1000);

// Coffee interaction
let cofLvl = 0, cofCups = 0;
function drinkCoffee() {
  if (cofLvl >= 100) { cofLvl = 0; cofCups++; } else cofLvl = Math.min(cofLvl + 20, 100);
  $('fuel-fill').style.width = cofLvl + '%';
  $('fuel-pct').textContent  = cofLvl + '%';
  $('cup-count').textContent = cofCups;
  $('prod-lbl').textContent  = cofLvl < 20 ? 'LOW' : cofLvl < 60 ? 'MEDIUM' : cofLvl < 90 ? 'HIGH' : '🚀 OVERDRIVE';
  const fl = cofLvl / 100 * 122;
  $('cof-liq').setAttribute('y',      175 - fl);
  $('cof-liq').setAttribute('height', fl);
  $('cof-foam').setAttribute('cy',    175 - fl);
}

/* ════════════════════════
   CONCLUSION — § 5
════════════════════════ */
// Starfield
const se = $('end-stars');
const ss = document.createElement('style');
ss.textContent = '@keyframes tw{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.05;transform:scale(.3)}}';
document.head.appendChild(ss);
const starCount = isMobile ? 70 : 160;
for (let i = 0; i < starCount; i++) {
  const s  = document.createElement('div');
  const sz = Math.random() > 0.85 ? 2 : 1;
  s.style.cssText = `position:absolute;border-radius:50%;background:#fff;
    left:${Math.random()*100}%;top:${Math.random()*100}%;
    width:${sz}px;height:${sz}px;
    opacity:${(.1+Math.random()*.5).toFixed(2)};
    animation:tw ${(2+Math.random()*4).toFixed(1)}s ${(-Math.random()*4).toFixed(1)}s ease-in-out infinite`;
  se.appendChild(s);
}

// Staggered entry animations
['#et','#eh','#eb','#ebadges','#efinal'].forEach((sel, i) => {
  gsap.fromTo(sel, { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: i * 0.13,
    scrollTrigger: { trigger: '#s-end', start: 'top 68%', toggleActions: 'play none none reverse' }
  });
});

/* ════════════════════════
   CANVAS OPACITY SHIFT
════════════════════════ */
const cnv = $('bg-canvas');
ScrollTrigger.create({
  trigger: '#s-bugs', start: 'top center', end: 'bottom center',
  onEnter:     () => gsap.to(cnv, { opacity: .25, duration: .8 }),
  onLeave:     () => gsap.to(cnv, { opacity: .5,  duration: .8 }),
  onEnterBack: () => gsap.to(cnv, { opacity: .25, duration: .8 }),
  onLeaveBack: () => gsap.to(cnv, { opacity: .5,  duration: .8 }),
});

/* ════════════════════════
   TYPEWRITER
════════════════════════ */
const phrases = [
  'It compiles on my machine.',
  'Have you tried turning it off?',
  'git push --force (just once)',
  "That's not a bug, it's a feature.",
  'console.log("why")',
  'undefined is not a function.'
];
let pi = 0, ci = 0, del = false;
const twEl = $('tw');
function type() {
  const ph = phrases[pi];
  if (!del) {
    twEl.textContent = ph.slice(0, ++ci);
    if (ci === ph.length) { del = true; setTimeout(type, 1800); return; }
  } else {
    twEl.textContent = ph.slice(0, --ci);
    if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
  }
  setTimeout(type, del ? 35 : 72);
}
setTimeout(type, 3000);