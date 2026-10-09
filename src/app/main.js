import '../styles/main.css';
import { renderPage, pageMeta } from '../views/layout.js';
import { normalizePath } from '../views/kit.js';
import { playIntro } from './intro.js';
import { bindViewer } from './viewer.js';
import { mountHome } from './home.js';
import { createWash } from '../gl/wash.js';

const app = document.querySelector('#app');
const root = document.documentElement;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => motionQuery.matches;
// Cinematic sections (turntable, strip, the walk through Pieterskerk) only run with motion allowed.
root.classList.toggle('cinema', !reducedMotion());
const intro = playIntro();
const wash = reducedMotion() ? null : createWash();
let teardown = () => {};
let busy = false;
// Smooth scrolling and the page chapters (Lenis, ScrollTrigger) are not needed on the light table.
let pages = null;
const loadPages = () => import('./pages.js').then((module) => (pages = module));

function setMeta(path) {
  const { title, description } = pageMeta(path);
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
}

// `ready` resolves when the page is uncovered (opening sheet or ink wash lifting): entrances wait for it.
function mount(path, { ready = Promise.resolve(), inkDuration = 1.1 } = {}) {
  const isHome = path === '/';
  root.classList.toggle('is-home', isHome);
  let page = null;
  let alive = true;
  const start = () => { if (alive) page = pages.mountPage(app, path, { ready, inkDuration }); };
  if (!isHome) {
    if (pages) start();
    else loadPages().then(start);
  }
  const viewer = bindViewer(app, { reducedMotion, onToggle: (open) => (open ? page?.lenis?.stop() : page?.lenis?.start()) });
  const unmountHome = isHome ? mountHome(app, { gate: ready, reducedMotion, viewer }) : () => {};
  teardown = () => {
    alive = false;
    unmountHome();
    viewer.dispose();
    page?.dispose();
  };
}

async function navigate(href, { push = true, instant = false } = {}) {
  if (busy) return;
  const url = new URL(href, location.href);
  const path = normalizePath(url.pathname);
  if (push) history.pushState(null, '', path + url.hash);
  let uncover = () => {};
  const ready = new Promise((resolve) => { uncover = resolve; });
  const update = () => {
    teardown();
    app.innerHTML = renderPage(path);
    setMeta(path);
    window.scrollTo(0, 0);
    mount(path, { ready });
    app.querySelector('main')?.focus({ preventScroll: true });
    if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
  };
  busy = true;
  try {
    if (instant) {
      // Back and forward are too frequent to animate.
      update();
      uncover();
    } else if (!wash) {
      if (document.startViewTransition && !reducedMotion()) await document.startViewTransition(update).finished.catch(() => {});
      else update();
      uncover();
    } else {
      // Fetch the page code while the ink covers the screen, so the new page mounts in one go.
      await Promise.all([wash.cover(), path === '/' || pages ? null : loadPages().catch(() => {})]);
      update();
      uncover();
      await wash.reveal();
    }
  } finally {
    busy = false;
  }
}

// Site links navigate in place; files, other sites, new tabs and modified clicks behave as usual.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target === '_blank' || link.hasAttribute('download')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || url.pathname.startsWith('/assets/')) return;
  const path = normalizePath(url.pathname);
  if (path === normalizePath(location.pathname) && url.hash) return; // in-page anchor
  event.preventDefault();
  if (path === normalizePath(location.pathname)) return;
  navigate(url.href);
});
addEventListener('popstate', () => navigate(location.href, { push: false, instant: true }));
// iOS Safari applies :active only once a touch listener exists.
document.addEventListener('touchstart', () => {}, { passive: true });

const path = normalizePath(location.pathname);
if (app.querySelector('main')?.dataset.route !== path) app.innerHTML = renderPage(path);
setMeta(path);
mount(path, { ready: intro, inkDuration: 1.6 });
// On the homepage, fetch the page code once the browser is idle, ready for the first link.
if (path === '/') (window.requestIdleCallback || setTimeout)(() => loadPages().catch(() => {}), { timeout: 4000 });
