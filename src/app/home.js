// Homepage: the light table, its filters and the Table / Index switch.
import { gsap } from 'gsap';
import { archive, projects, projectOf } from '../content/data.js';
import { label } from '../views/kit.js';
import { viewerRect } from './viewer.js';

const root = document.documentElement;

function webgl2() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

export function mountHome(app, { gate, reducedMotion, onOpen }) {
  const stage = app.querySelector('[data-table]');
  const caption = app.querySelector('.table-caption');
  const filters = [...app.querySelectorAll('[data-filter]')];
  const modes = [...app.querySelectorAll('[data-view-mode]')];
  let table = null;
  let alive = true;
  // The caption trails the pointer slightly rather than being nailed to it.
  const captionX = gsap.quickTo(caption, 'x', { duration: 0.25, ease: 'power3.out' });
  const captionY = gsap.quickTo(caption, 'y', { duration: 0.25, ease: 'power3.out' });
  let captionShown = false;

  const setMode = (mode) => {
    modes.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.viewMode === mode)));
    root.classList.toggle('view-index', mode === 'index');
    table?.pause(mode === 'index');
    window.scrollTo(0, 0);
  };
  const onMode = (event) => {
    const button = event.target.closest('[data-view-mode]');
    if (button) setMode(button.dataset.viewMode);
  };
  const onFilter = (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    const project = projects.find((p) => p.slug === button.dataset.filter);
    table?.show(project ? project.photos : archive);
  };
  app.addEventListener('click', onMode);
  app.addEventListener('click', onFilter);

  const onHover = (id, pointer) => {
    if (!id || !pointer) { caption.classList.remove('is-on'); captionShown = false; return; }
    caption.textContent = label(id);
    // The first appearance lands in place; after that it follows.
    if (!captionShown) gsap.set(caption, { x: pointer.x + 18, y: pointer.y + 18 });
    else { captionX(pointer.x + 18); captionY(pointer.y + 18); }
    captionShown = true;
    caption.classList.add('is-on');
    stage.classList.add('is-pointing');
  };

  if (!webgl2()) {
    root.classList.add('no-table');
    setMode('index');
  } else {
    import('../gl/table.js').then(({ mountTable }) => {
      if (!alive) return;
      table = mountTable(stage, {
        reducedMotion,
        viewerRect,
        onHover: (id, pointer) => { onHover(id, pointer); if (!id) stage.classList.remove('is-pointing'); },
        onOpen: (id) => onOpen(id, projectOf.get(id)),
      });
      // Lay the table out now so photographs load behind the opening; reveal it as the sheet lifts.
      table.show(archive, { first: true, wait: gate });
      table.start();
      if (root.classList.contains('view-index')) table.pause(true);
    }).catch(() => {
      root.classList.add('no-table');
      setMode('index');
    });
  }

  return () => {
    alive = false;
    app.removeEventListener('click', onMode);
    app.removeEventListener('click', onFilter);
    root.classList.remove('view-index');
    table?.dispose();
  };
}
