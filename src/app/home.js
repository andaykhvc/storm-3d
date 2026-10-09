// Homepage: the light table, its filters and the Table / Index switch.
import { gsap } from 'gsap';
import { archive, projectOf } from '../content/data.js';
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

export function mountHome(app, { gate, reducedMotion, viewer }) {
  const stage = app.querySelector('[data-table]');
  const caption = app.querySelector('.table-caption');
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
  app.addEventListener('click', onMode);

  const onHover = (id, pointer) => {
    if (!id || !pointer || root.classList.contains('has-viewer')) {
      caption.classList.remove('is-on');
      stage.classList.remove('is-pointing');
      captionShown = false;
      return;
    }
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
        onHover,
        // The photograph has lifted into the viewer's frame: the viewer takes over in place, and its
        // gap stays open on the table until it returns. Browsing moves the gap; closing fills it.
        onOpen: (id) => {
          const project = projectOf.get(id);
          viewer.open(id, project.photos, { instant: true });
          table.settle();
          table.hold(id);
        },
      });
      viewer.configure({
        project: true,
        locate: (id) => table.rectOf(id),
        onChange: (id) => table.hold(id),
        onClose: () => table.release(),
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
    root.classList.remove('view-index');
    table?.dispose();
  };
}
