import '../styles/main.css';
import { renderPage, pageMeta } from '../views/layout.js';
import { normalizePath } from '../views/kit.js';
import { playIntro } from './intro.js';
import { bindViewer } from './viewer.js';
import { mountHome } from './home.js';
import { mountPage } from './pages.js';
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

function setMeta(path) {
  const { title, description } = pageMeta(path);
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
}

// `ready` resolves when the page is uncovered (opening sheet or ink wash lifting): entrances wait for it.
function mount(path, { ready = Promise.resolve(), then } = {}) {
  const isHome = path === '/';
  root.classList.toggle('is-home', isHome);
  const page = isHome ? null : mountPage(app, path, { ready });
  const viewer = bindViewer(app, { reducedMotion, onToggle: (open) => (open ? page?.lenis?.stop() : page?.lenis?.start()) });
  const unmountHome = isHome
    ? mountHome(app, {
      gate: ready,
      reducedMotion,
      // A photograph opened on the table: go to its project, already showing it full frame.
      onOpen: (id, project) => navigate(project.href, { then: (v) => v.open(id, project.photos, { instant: true }) }),
    })
    : () => {};
  teardown = () => {
    unmountHome();
    viewer.dispose();
    page?.dispose();
  };
  then?.(viewer);
}

async function navigate(href, { push = true, then } = {}) {
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
    mount(path, { ready, then });
    if (!then) app.querySelector('main')?.focus({ preventScroll: true });
    if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
  };
  busy = true;
  try {
    if (then || !wash) {
      // From the light table the photograph itself is the transition; elsewhere a cross-fade.
      if (document.startViewTransition && !reducedMotion()) await document.startViewTransition(update).finished.catch(() => {});
      else update();
      uncover();
    } else {
      await wash.cover();
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
addEventListener('popstate', () => navigate(location.href, { push: false }));
// iOS Safari applies :active only once a touch listener exists.
document.addEventListener('touchstart', () => {}, { passive: true });

const path = normalizePath(location.pathname);
if (app.querySelector('main')?.dataset.route !== path) app.innerHTML = renderPage(path);
setMeta(path);
mount(path, { ready: intro });
