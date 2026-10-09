// Opening: a contact sheet of the Hellion lookbook. Each look's four views play in order, so the model
// turns on the spot, while the count runs up to every photograph on the table. The sheet then lifts
// like a curtain onto the page. Plays on every full load; any input skips it; never with reduced motion.
import { assets, looks, VIEWS, archive } from '../content/data.js';

// Five of the seven looks turn, in a different order each time.
const LOOKS_SHOWN = 5;
const FRAME_MS = 75;
const HOLD_MS = 380;
// Never keep the page waiting on slow photographs for longer than this.
const MAX_MS = 3400;

export function playIntro() {
  const root = document.documentElement;
  const sheet = document.querySelector('.intro');
  if (!sheet || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('intro-skip');
    sheet?.remove();
    return Promise.resolve();
  }

  // The look it comes to rest on changes every second, so consecutive visits end on a different
  // photograph without the site storing anything; the others turn in random order before it.
  const last = looks[Math.floor(Date.now() / 1000) % looks.length];
  const others = looks.filter((look) => look !== last).sort(() => Math.random() - 0.5).slice(0, LOOKS_SHOWN - 1);
  const frames = [...others, last].flatMap((look) => look.images.map((id, view) => ({ id, number: look.number, view })));
  frames.push(frames.at(-4)); // the last look completes its turn and rests facing forward
  sheet.innerHTML = `<div class="intro-frame">${frames.map(({ id }) => {
    const { small } = assets.get(id);
    return `<img src="${small.src}" width="${small.width}" height="${small.height}" alt="" decoding="async" fetchpriority="high" />`;
  }).join('')}</div>
    <p class="intro-mark">Storm Nijhuis</p>
    <p class="intro-meta">Hellion lookbook, 2026</p>
    <p class="intro-count">000</p>
    <p class="intro-caption"></p>`;
  const images = [...sheet.querySelectorAll('img')];
  const count = sheet.querySelector('.intro-count');
  const caption = sheet.querySelector('.intro-caption');
  const app = document.querySelector('#app');
  root.classList.add('intro-active');
  app.inert = true;

  return new Promise((resolve) => {
    const start = performance.now();
    let index = -1;
    let next = start + 260;
    let frameId = 0;
    let done = false;
    const inputs = ['pointerdown', 'keydown', 'wheel', 'touchmove'];

    const leave = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frameId);
      inputs.forEach((type) => removeEventListener(type, leave));
      sheet.classList.add('is-leaving');
      root.classList.remove('intro-active');
      app.inert = false;
      resolve();
      const remove = () => sheet.remove();
      sheet.addEventListener('transitionend', (event) => { if (event.target === sheet) remove(); });
      setTimeout(remove, 1200);
    };

    const tick = (now) => {
      frameId = requestAnimationFrame(tick);
      if (now - start > MAX_MS) return leave();
      if (now < next) return;
      const following = index + 1;
      if (following === frames.length) return leave();
      const image = images[following];
      // Wait for the photograph rather than flash an empty frame.
      if (!image.complete || !image.naturalWidth) return;
      images[index]?.removeAttribute('data-on');
      image.setAttribute('data-on', '');
      index = following;
      const { number, view } = frames[index];
      count.textContent = String(Math.round(((index + 1) / frames.length) * archive.length)).padStart(3, '0');
      caption.textContent = `Look ${number}, ${VIEWS[view].toLowerCase()}`;
      next = now + (index === frames.length - 1 ? HOLD_MS : FRAME_MS);
    };
    frameId = requestAnimationFrame(tick);
    inputs.forEach((type) => addEventListener(type, leave, { passive: true }));
  });
}
