// Motion for the scrolling pages: smooth scroll, the Hellion turntable and strip, the film's walk
// through Pieterskerk, statements that light up word by word, and titles that bloom out of ink.
// Everything here is an enhancement over complete static pages, and is skipped with reduced motion.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { looks, VIEWS, film } from '../content/data.js';
import { label } from '../views/kit.js';
import { inkTitle } from '../gl/ink.js';

gsap.registerPlugin(ScrollTrigger);

export function smoothScroll() {
  const lenis = new Lenis({ lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return {
    lenis,
    dispose() {
      gsap.ticker.remove(raf);
      lenis.destroy();
    },
  };
}

// The title inks in once `ready` resolves (the opening sheet or the page wash has lifted).
export function titleInk(app, ready, duration = 1.1) {
  const title = app.querySelector('.opening-title');
  if (!title) return () => {};
  let cancel = () => {};
  let alive = true;
  title.style.opacity = '0';
  const image = title.querySelector('img');
  Promise.all([ready, document.fonts.load('400 100px KochSchrift'), image?.decode().catch(() => {})]).then(() => {
    if (!alive) return;
    cancel = inkTitle(title, { duration });
    if (title.style.opacity === '0' && !app.querySelector('.ink-title')) title.style.opacity = '';
  });
  return () => {
    alive = false;
    cancel();
    title.style.opacity = '';
  };
}

function words(element) {
  if (element.dataset.split) return [...element.querySelectorAll('.w')];
  element.dataset.split = 'true';
  element.innerHTML = element.textContent.trim().split(/\s+/).map((word) => `<span class="w">${word}</span>`).join(' ');
  return [...element.querySelectorAll('.w')];
}

function turntable(app) {
  const root = app.querySelector('.turntable');
  if (!root) return;
  const frame = root.querySelector('.turntable-frame');
  const images = [...frame.querySelectorAll('img')];
  const ids = frame.dataset.set.split(',');
  const number = root.querySelector('.turntable-number');
  const caption = root.querySelector('.turntable-caption');
  const marks = [...root.querySelectorAll('.turntable-rail li')];
  let current = -1;
  const show = (i) => {
    if (i === current) return;
    images[current]?.removeAttribute('data-on');
    images[i].setAttribute('data-on', '');
    current = i;
    const look = looks[Math.floor(i / 4)];
    number.textContent = look.number;
    caption.textContent = `Look ${look.number}, ${VIEWS[i % 4].toLowerCase()}`;
    marks.forEach((mark, j) => mark.toggleAttribute('data-on', j === Math.floor(i / 4)));
    frame.dataset.view = ids[i];
  };
  show(0);
  // Start loading the turning figure before it arrives.
  ScrollTrigger.create({ trigger: root, start: 'top 250%', once: true, onEnter: () => images.forEach((img) => { img.loading = 'eager'; }) });
  ScrollTrigger.create({ trigger: root, start: 'top top', end: 'bottom bottom', onUpdate: (self) => show(Math.min(images.length - 1, Math.floor(self.progress * images.length))) });
}

function strip(app) {
  const root = app.querySelector('.strip');
  if (!root) return;
  const row = root.querySelector('.strip-row');
  const distance = () => Math.max(0, row.scrollWidth - innerWidth);
  const size = () => { root.style.height = `calc(100svh + ${distance()}px)`; };
  size();
  ScrollTrigger.addEventListener('refreshInit', size);
  gsap.to(row, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
  return () => ScrollTrigger.removeEventListener('refreshInit', size);
}

function cover(app) {
  const figure = app.querySelector('.cover:not(.film-cover)');
  if (!figure) return;
  gsap.fromTo(figure.firstElementChild, { scale: 0.86 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: figure, start: 'top bottom', end: 'top 20%', scrub: true } });
}

function statements(app) {
  for (const statement of app.querySelectorAll('.prologue p.statement')) {
    gsap.fromTo(words(statement), { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: statement, start: 'top 85%', end: 'bottom 50%', scrub: true } });
  }
}

function nave(app) {
  const section = app.querySelector('.nave');
  if (!section) return () => {};
  let dispose = () => {};
  let alive = true;
  const stage = section.querySelector('.nave-stage');
  const caption = section.querySelector('.nave-caption');
  const hint = section.querySelector('.nave-hint');
  gsap.to(hint, { opacity: 0, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: '+=240', scrub: true } });
  import('../gl/nave.js').then(({ mountNave }) => mountNave(section.querySelector('.nave-track'), stage, {
    altar: film.stills[0],
    aisle: film.stills.slice(1),
    onCaption: (id) => { caption.textContent = label(id); },
  })).then((d) => {
    if (alive) dispose = d;
    else d();
  }).catch(() => {
    // Without WebGL the static cover below the section takes its place.
    document.documentElement.classList.add('no-nave');
  });
  return () => { alive = false; dispose(); };
}

export function mountPage(app, path, { ready, inkDuration }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups = [];
  const scroll = reduced ? null : smoothScroll();
  if (!reduced) {
    cleanups.push(titleInk(app, ready, inkDuration));
    const context = gsap.context(() => {
      turntable(app);
      cleanups.push(strip(app) || (() => {}));
      cover(app);
      statements(app);
    }, app);
    cleanups.push(() => context.revert());
    if (path === '/film/') cleanups.push(nave(app));
    // Layout settles as photographs load; keep scroll positions honest.
    const refresh = () => ScrollTrigger.refresh();
    addEventListener('load', refresh, { once: true });
    cleanups.push(() => removeEventListener('load', refresh));
    requestAnimationFrame(refresh);
  }
  return {
    lenis: scroll?.lenis ?? null,
    dispose() {
      cleanups.reverse().forEach((fn) => fn());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      scroll?.dispose();
    },
  };
}
