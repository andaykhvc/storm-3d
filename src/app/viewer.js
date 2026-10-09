// Full-screen photograph viewer, driven by springs (Apple's damping ratio and response) so every
// motion starts from where the photograph is on screen and can be grabbed mid-way.
// - Opens out of the photograph you chose and closes back into it.
// - Drag sideways to browse: the neighbour travels alongside, and momentum decides whether you land.
// - Pull down to close: the photograph shrinks a little and the page shows through as you pull.
// - Keyboard actions are instant. Reduced motion swaps springs for immediate changes.
import { assets, projectOf } from '../content/data.js';
import { describe, label } from '../views/kit.js';
import { createSpring, project, rubberband } from './spring.js';

// Space between neighbouring photographs while they slide.
const GAP = 24;

// The frame photographs are fitted into. The light table lifts into the same frame. Measured from a
// probe laid out with the same CSS variables, so safe-area insets and breakpoints apply.
let probe;
export function viewerRect() {
  if (!probe) {
    probe = document.createElement('div');
    probe.className = 'viewer-probe';
    probe.setAttribute('aria-hidden', 'true');
    document.body.append(probe);
  }
  const { left, top, width, height } = probe.getBoundingClientRect();
  return [left, top, width, height];
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
  const projectLink = dialog.querySelector('.viewer-project');
  const chrome = [...dialog.querySelectorAll('.viewer-caption, .viewer-controls, .viewer-close, .viewer-project')];
  const motion = () => !reducedMotion();
  let set = [];
  let index = 0;
  let trigger = null;
  let box = null;
  let drag = null;
  // Where the open photograph lives outside the viewer. Pages use their thumbnails; the light table
  // configures its own (see configure()).
  const hooks = {
    locate: (id) => visibleThumbnail(id)?.getBoundingClientRect() ?? null,
    onChange: () => {},
    onClose: () => {},
    project: false,
  };

  // Pose of the photograph (offset and scale) and the veil behind it, each its own spring.
  const pose = { x: createSpring(0), y: createSpring(0), s: createSpring(1, 0.001) };
  const veil = createSpring(0, 0.001);
  let outgoing = null; // the previous photograph, sliding away beside the current one
  let frameId = 0;
  let lastTick = 0;
  let onSettle = null;

  function render() {
    const x = pose.x.value;
    const y = pose.y.value;
    // Pulling down shrinks the photograph slightly and lets the page show through: letting go will close.
    const pull = y > 0 ? Math.min(y / (innerHeight * 0.7), 0.75) : 0;
    const scale = pose.s.value * (1 - Math.min(Math.max(y, 0) / 1500, 0.12));
    image.style.transform = x || y || scale !== 1 ? `translate3d(${x}px, ${y}px, 0) scale(${scale})` : '';
    if (outgoing) outgoing.layer.style.transform = `translate3d(${x - outgoing.offset}px, 0, 0)`;
    const v = Math.max(0, Math.min(1, veil.value)) * (1 - pull);
    dialog.style.backgroundColor = `rgb(8 8 8 / ${v})`;
    chrome.forEach((el) => { el.style.opacity = String(v * (1 - pull)); });
  }

  function run(settled) {
    if (settled !== undefined) onSettle = settled;
    if (frameId) return;
    lastTick = performance.now();
    const tick = (now) => {
      const seconds = Math.min((now - lastTick) / 1000, 1 / 30);
      lastTick = now;
      pose.x.step(seconds);
      pose.y.step(seconds);
      pose.s.step(seconds);
      veil.step(seconds);
      render();
      if (drag || !(pose.x.settled && pose.y.settled && pose.s.settled && veil.settled)) {
        frameId = requestAnimationFrame(tick);
        return;
      }
      frameId = 0;
      dropOutgoing();
      const done = onSettle;
      onSettle = null;
      done?.();
    };
    frameId = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    onSettle = null;
  }

  function dropOutgoing() {
    outgoing?.layer.remove();
    outgoing = null;
  }

  function resetPose() {
    stop();
    dropOutgoing();
    pose.x.set(0);
    pose.y.set(0);
    pose.s.set(1);
    render();
  }

  // Lay the photograph out at rest in the viewer frame. `placeholder`: an already-loaded smaller
  // version to show until the large file arrives.
  function place(id, placeholder) {
    const asset = assets.get(id);
    box = fit(id);
    Object.assign(image.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    image.alt = describe(id);
    image.width = asset.width;
    image.height = asset.height;
    const full = new Image();
    full.src = asset.large.src;
    if (placeholder && !full.complete) {
      image.src = placeholder;
      full.decode().catch(() => {}).then(() => { if (set[index] === id && dialog.open) image.src = asset.large.src; });
    } else image.src = asset.large.src;
    caption.textContent = label(id);
    const project = hooks.project && projectOf.get(id);
    projectLink.hidden = !project;
    if (project) { projectLink.href = project.href; projectLink.textContent = project.cta; }
    hooks.onChange(id);
    count.textContent = `${index + 1} of ${set.length}`;
    // Fetch only the next photograph ahead, never the whole set.
    if (set.length > 1) new Image().src = assets.get(set[(index + 1) % set.length]).large.src;
  }

  // The pose that puts the viewer photograph exactly over a rectangle on screen (a thumbnail).
  function thumbnailPose(from) {
    if (!from?.width || !box) return null;
    return { x: from.left + from.width / 2 - (box.x + box.w / 2), y: from.top + from.height / 2 - (box.y + box.h / 2), s: from.width / box.w };
  }

  // A thumbnail of the current photograph that is on screen, if the page shows one.
  function visibleThumbnail(id) {
    return [...root.querySelectorAll(`.photo[data-view="${id}"] img`)].find((img) => {
      const r = img.getBoundingClientRect();
      return r.width && r.bottom > 0 && r.top < innerHeight && getComputedStyle(img).opacity !== '0';
    });
  }

  function open(id, ids, { from = null, instant = false } = {}) {
    set = ids;
    index = Math.max(0, set.indexOf(id));
    trigger = from;
    resetPose();
    const thumbnail = from ? from.querySelector('img[data-on]') || from.querySelector('img') : null;
    place(id, thumbnail?.currentSrc);
    if (!dialog.open) { dialog.showModal(); onToggle(true); }
    document.documentElement.classList.add('has-viewer');
    const start = !instant && motion() && thumbnailPose(thumbnail?.getBoundingClientRect());
    if (!start) {
      // Keyboard, reduced motion, or arriving from the light table already in place.
      veil.set(instant || !motion() ? 1 : 0);
      veil.to(1, { response: 0.25 });
      render();
      run();
      return;
    }
    // Grow out of the thumbnail. It can be grabbed before it lands.
    pose.x.set(start.x);
    pose.y.set(start.y);
    pose.s.set(start.s);
    veil.set(0);
    pose.x.to(0, { response: 0.4 });
    pose.y.to(0, { response: 0.4 });
    pose.s.to(1, { response: 0.4 });
    veil.to(1, { response: 0.3 });
    render();
    run();
  }

  function finish() {
    stop();
    drag = null;
    dropOutgoing();
    if (dialog.open) dialog.close();
    onToggle(false);
    document.documentElement.classList.remove('has-viewer');
    pose.x.set(0);
    pose.y.set(0);
    pose.s.set(1);
    image.style.transform = '';
    hooks.onClose(set[index]);
    const back = trigger?.isConnected ? trigger : visibleThumbnail(set[index])?.closest('.photo');
    back?.focus({ preventScroll: true });
  }

  // Pointer closes shrink back into the thumbnail when it is on screen; keyboard closes are instant.
  function close({ instant = false } = {}) {
    if (!dialog.open) return;
    if (instant || !motion()) return finish();
    const end = thumbnailPose(hooks.locate(set[index]));
    if (end) {
      pose.x.to(end.x, { response: 0.3 });
      pose.y.to(end.y, { response: 0.3 });
      pose.s.to(end.s, { response: 0.3 });
    }
    veil.to(0, { response: end ? 0.3 : 0.22 });
    run(finish);
  }

  // Slide to a neighbour. The incoming photograph starts one photograph away and both travel
  // together, continuing at the speed the finger left off.
  function slideTo(direction, velocity = 0) {
    const x = pose.x.value;
    const oldWidth = box.w;
    dropOutgoing();
    const layer = image.cloneNode();
    layer.className = 'viewer-image viewer-swap';
    layer.alt = '';
    layer.style.transform = '';
    dialog.append(layer);
    index = (index + direction + set.length) % set.length;
    place(set[index]);
    const span = (oldWidth + box.w) / 2 + GAP;
    outgoing = { layer, offset: direction * span };
    pose.x.set(x + direction * span, velocity);
    pose.x.to(0, { response: 0.35 });
    pose.y.to(0, { response: 0.35 });
    pose.s.to(1, { response: 0.35 });
    render();
    run();
  }

  // Arrow keys step instantly; buttons slide (or simply swap, with reduced motion).
  function step(direction, { animate = false } = {}) {
    if (set.length < 2) return;
    if (animate && motion()) return slideTo(direction);
    resetPose();
    index = (index + direction + set.length) % set.length;
    place(set[index]);
  }

  // ---- Direct manipulation: the photograph stays under the finger from where it was grabbed, even
  // mid-animation; on release, momentum decides where it lands and the springs inherit its speed.
  const onDown = (event) => {
    if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const x = pose.x.value;
    const y = pose.y.value;
    pose.x.set(x);
    pose.y.set(y);
    drag = { id: event.pointerId, downX: event.clientX, downY: event.clientY, originX: x, originY: y, axis: x ? 'x' : y ? 'y' : null, samples: [{ t: event.timeStamp, x: event.clientX, y: event.clientY }] };
    try { image.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    run();
  };
  const onMove = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.downX;
    const dy = event.clientY - drag.downY;
    drag.samples.push({ t: event.timeStamp, x: event.clientX, y: event.clientY });
    while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
    // Commit to an axis after 10px, so a slightly diagonal drag doesn't pick the wrong one.
    if (!drag.axis && Math.hypot(dx, dy) > 10) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (drag.axis === 'x') {
      const x = drag.originX + dx;
      pose.x.set(set.length > 1 && motion() ? x : rubberband(x, box.w));
    }
    if (drag.axis === 'y') {
      const y = drag.originY + dy;
      pose.y.set(y > 0 ? y : rubberband(y, box.h));
    }
    render();
  };
  const onUp = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { axis, samples } = drag;
    drag = null;
    const first = samples[0];
    const last = samples.at(-1);
    const seconds = Math.max((last.t - first.t) / 1000, 0.001);
    const vx = (last.x - first.x) / seconds;
    const vy = (last.y - first.y) / seconds;
    // A flick against the drag means "never mind", whatever the distance.
    const agrees = (offset, velocity) => Math.abs(velocity) < 100 || Math.sign(velocity) === Math.sign(offset);
    if (axis === 'x' && set.length > 1) {
      const x = pose.x.value;
      if (motion() && Math.abs(x + project(vx)) > box.w * 0.35 && agrees(x, vx)) return slideTo(x < 0 ? 1 : -1, vx);
      if (!motion() && Math.abs(x) > 80) return step(x < 0 ? 1 : -1);
    }
    if (axis === 'y') {
      const y = pose.y.value;
      if (y > 0 && y + project(vy) > box.h * 0.3 && agrees(y, vy)) {
        if (!motion()) return finish();
        pose.y.to(innerHeight, { response: 0.35, velocity: vy });
        veil.to(0, { response: 0.3 });
        return run(finish);
      }
    }
    if (!motion()) return resetPose();
    // Not far or fast enough: settle back. A released drag carried momentum, so a touch of overshoot.
    pose.x.to(0, { dampingRatio: 0.85, response: 0.35, velocity: axis === 'x' ? vx : 0 });
    pose.y.to(0, { dampingRatio: 0.85, response: 0.35, velocity: axis === 'y' ? vy : 0 });
    pose.s.to(1, { response: 0.35 });
    run();
  };

  const onClick = (event) => {
    const button = event.target.closest('.photo[data-view]');
    if (!button) return;
    // Keyboard activation (detail 0) opens without motion.
    open(button.dataset.view, button.dataset.set.split(','), { from: button, instant: event.detail === 0 });
  };
  const onControl = (event) => {
    // Going to the project: close at once and let the site's router take the link.
    if (event.target.closest('.viewer-project')) return finish();
    if (event.target.closest('.viewer-close')) return close({ instant: event.detail === 0 });
    const stepButton = event.target.closest('[data-step]');
    if (stepButton) return step(Number(stepButton.dataset.step), { animate: event.detail !== 0 });
    if (event.target === dialog || event.target.classList.contains('viewer-stage')) close();
  };
  const onKey = (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
  };
  // Escape closes straight away, through our own clean-up rather than the browser's.
  const onCancel = (event) => { event.preventDefault(); close({ instant: true }); };

  root.addEventListener('click', onClick);
  dialog.addEventListener('click', onControl);
  dialog.addEventListener('keydown', onKey);
  dialog.addEventListener('cancel', onCancel);
  image.addEventListener('pointerdown', onDown);
  image.addEventListener('pointermove', onMove);
  image.addEventListener('pointerup', onUp);
  image.addEventListener('pointercancel', onUp);

  return {
    open,
    configure(options) { Object.assign(hooks, options); },
    dispose() {
      root.removeEventListener('click', onClick);
      dialog.removeEventListener('click', onControl);
      dialog.removeEventListener('keydown', onKey);
      dialog.removeEventListener('cancel', onCancel);
      image.removeEventListener('pointerdown', onDown);
      image.removeEventListener('pointermove', onMove);
      image.removeEventListener('pointerup', onUp);
      image.removeEventListener('pointercancel', onUp);
      stop();
      dropOutgoing();
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('has-viewer');
    },
  };
}
