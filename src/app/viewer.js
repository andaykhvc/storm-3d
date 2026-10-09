// Full-screen photograph viewer. Opens out of the photograph you chose and closes back into it.
// Arrow keys or a swipe step through the set; Escape closes and returns focus.
import { gsap } from 'gsap';
import { assets } from '../content/data.js';
import { describe, label } from '../views/kit.js';

// The frame photographs are fitted into. The light table lifts into the same frame.
export function viewerRect() {
  const style = getComputedStyle(document.documentElement);
  const top = parseFloat(style.getPropertyValue('--viewer-top'));
  const side = parseFloat(style.getPropertyValue('--viewer-side'));
  const bottom = parseFloat(style.getPropertyValue('--viewer-bottom'));
  return [side, top, innerWidth - side * 2, innerHeight - top - bottom];
}

function fit(id) {
  const asset = assets.get(id);
  const [x, y, w, h] = viewerRect();
  const scale = Math.min(w / asset.width, h / asset.height);
  const fw = asset.width * scale;
  const fh = asset.height * scale;
  return { x: x + (w - fw) / 2, y: y + (h - fh) / 2, w: fw, h: fh };
}

export function bindViewer(root, { reducedMotion, onToggle = () => {} }) {
  const dialog = root.querySelector('.viewer');
  if (!dialog) return { open() {}, dispose() {} };
  const image = dialog.querySelector('.viewer-image');
  const caption = dialog.querySelector('.viewer-caption');
  const count = dialog.querySelector('.viewer-count');
  let set = [];
  let index = 0;
  let trigger = null;
  let swipe = null;

  function place(id) {
    const asset = assets.get(id);
    const box = fit(id);
    image.src = asset.large.src;
    image.alt = describe(id);
    image.width = asset.width;
    image.height = asset.height;
    Object.assign(image.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    caption.textContent = label(id);
    count.textContent = `${index + 1} of ${set.length}`;
    return box;
  }

  function open(id, ids, { from = null, instant = false } = {}) {
    set = ids;
    index = Math.max(0, set.indexOf(id));
    trigger = from;
    const box = place(id);
    if (!dialog.open) { dialog.showModal(); onToggle(true); }
    document.documentElement.classList.add('has-viewer');
    gsap.killTweensOf([image, dialog]);
    const rect = from?.querySelector('img')?.getBoundingClientRect();
    if (instant || reducedMotion() || !rect) {
      gsap.set(image, { clearProps: 'transform' });
      gsap.fromTo(dialog, { '--veil': instant ? 1 : 0 }, { '--veil': 1, duration: 0.2, ease: 'power1.out' });
      return;
    }
    gsap.fromTo(dialog, { '--veil': 0 }, { '--veil': 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(image, { x: rect.left - box.x, y: rect.top - box.y, scaleX: rect.width / box.w, scaleY: rect.height / box.h }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.62, ease: 'expo.out' });
  }

  function step(delta) {
    if (set.length < 2) return;
    index = (index + delta + set.length) % set.length;
    place(set[index]);
    if (!reducedMotion()) gsap.fromTo(image, { x: delta * 40, opacity: 0.4 }, { x: 0, opacity: 1, duration: 0.32, ease: 'power3.out' });
  }

  function close() {
    if (!dialog.open) return;
    const id = set[index];
    // Return to the photograph now showing, if it is on the page.
    const back = document.querySelector(`.photo[data-view="${id}"]`) || trigger;
    const rect = back?.querySelector('img')?.getBoundingClientRect();
    const visible = rect && rect.bottom > 0 && rect.top < innerHeight;
    const finish = () => {
      dialog.close();
      onToggle(false);
      document.documentElement.classList.remove('has-viewer');
      gsap.set(image, { clearProps: 'transform,opacity' });
      back?.focus({ preventScroll: true });
    };
    if (reducedMotion() || !visible) {
      gsap.to(dialog, { '--veil': 0, duration: 0.18, ease: 'power1.in', onComplete: finish });
      return;
    }
    const box = fit(id);
    gsap.to(dialog, { '--veil': 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(image, { x: rect.left - box.x, y: rect.top - box.y, scaleX: rect.width / box.w, scaleY: rect.height / box.h, duration: 0.42, ease: 'expo.inOut', onComplete: finish });
  }

  const onClick = (event) => {
    const button = event.target.closest('.photo[data-view]');
    if (!button) return;
    open(button.dataset.view, button.dataset.set.split(','), { from: button });
  };
  const onControl = (event) => {
    if (event.target.closest('.viewer-close')) return close();
    const stepButton = event.target.closest('[data-step]');
    if (stepButton) return step(Number(stepButton.dataset.step));
    if (event.target === dialog || event.target.classList.contains('viewer-stage')) close();
  };
  const onKey = (event) => {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'Escape') { event.preventDefault(); close(); }
  };
  const onDown = (event) => { swipe = { x: event.clientX, y: event.clientY }; };
  const onUp = (event) => {
    if (!swipe) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
  };
  root.addEventListener('click', onClick);
  dialog.addEventListener('click', onControl);
  dialog.addEventListener('keydown', onKey);
  image.addEventListener('pointerdown', onDown);
  image.addEventListener('pointerup', onUp);

  return {
    open,
    dispose() {
      root.removeEventListener('click', onClick);
      dialog.removeEventListener('click', onControl);
      dialog.removeEventListener('keydown', onKey);
      image.removeEventListener('pointerdown', onDown);
      image.removeEventListener('pointerup', onUp);
      gsap.killTweensOf([image, dialog]);
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('has-viewer');
    },
  };
}
