// The light table: every photograph of the work on one endless surface. Drag, flick or scroll to move
// around; the table bows a little while it moves and lies flat again at rest, where each photograph
// is drawn as its source pixels. Opening one lifts it to full frame and hands over to its project.
import { WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, ShaderMaterial, Mesh, ImageBitmapLoader, Texture, NoColorSpace, LinearSRGBColorSpace, LinearFilter, LinearMipmapLinearFilter, Vector2, Vector4 } from 'three';
import { gsap } from 'gsap';
import { assets } from '../content/data.js';

const vertexShader = /* glsl */ `
  uniform vec4 uRect;   // x, y, width, height in CSS px from the viewport's top left
  uniform vec2 uView;
  uniform float uLens, uZoom;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 p = uRect.xy + vec2(uv.x, 1.0 - uv.y) * uRect.zw;
    vec2 c = (p / uView) * 2.0 - 1.0;
    c.y = -c.y;
    c *= uZoom;
    // While moving, the middle of the table sinks and the edges hold: a shallow bowl.
    vec2 q = vec2(c.x * uView.x / uView.y, c.y);
    float r2 = dot(q, q) / (pow(uView.x / uView.y, 2.0) + 1.0);
    c *= (1.0 + uLens * r2) / (1.0 + uLens);
    gl_Position = vec4(c, 0.0, 1.0);
  }`;

// Texture rows run top-down (ImageBitmap, no flip). Colour is passed straight through.
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uReady, uAlpha;
  varying vec2 vUv;
  const vec3 NIGHT = vec3(0.0314);
  const vec3 SOOT = vec3(0.071, 0.071, 0.067);
  void main() {
    vec3 photo = texture2D(uMap, vec2(vUv.x, 1.0 - vUv.y)).rgb;
    vec3 col = mix(SOOT, photo, uReady);
    gl_FragColor = vec4(mix(NIGHT, col, uAlpha), 1.0);
  }`;

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Deterministic shuffle, so the table is laid out the same way on every visit.
function shuffle(list, seed = 7) {
  const out = [...list];
  let s = seed;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const MAX_TEXTURES = 110;
const blank = new Texture();

export function mountTable(stage, { onHover, onOpen, viewerRect, reducedMotion }) {
  // Very large screens already have plenty of pixels; 1.5x keeps photographs sharp at lower GPU cost.
  const dpr = Math.min(devicePixelRatio, innerWidth * devicePixelRatio > 3200 ? 1.5 : 2);
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x080808, 1);
  renderer.outputColorSpace = LinearSRGBColorSpace; // the shader writes display values
  const canvas = renderer.domElement;
  stage.append(canvas);
  const scene = new Scene();
  const camera = new OrthographicCamera(); // unused by the shaders, required by render()
  const geometry = new PlaneGeometry(1, 1, 12, 12);
  const view = new Vector2();

  // ---- Photographs: decoded off the main thread, kept within a budget, uploaded a few per frame.
  const loader = new ImageBitmapLoader();
  loader.setOptions({ imageOrientation: 'none', premultiplyAlpha: 'none' });
  const textures = new Map(); // id -> { texture, used, ready }
  const pending = new Set();
  const queue = [];
  let size = 'small';

  function want(id, now) {
    const entry = textures.get(id);
    if (entry) { entry.used = now; return entry.ready ? entry.texture : null; }
    if (!pending.has(id)) { pending.add(id); queue.push(id); }
    return null;
  }
  let loading = 0;
  function pump() {
    while (loading < 6 && queue.length) {
      const id = queue.shift();
      // A fast fling queues photographs it has already passed; fetch only what is still on screen.
      if (!onScreen.has(id)) { pending.delete(id); continue; }
      loading += 1;
      loader.load(assets.get(id)[size].src, (bitmap) => {
        loading -= 1;
        pending.delete(id);
        if (disposed) return bitmap.close?.();
        const texture = new Texture(bitmap);
        texture.flipY = false;
        texture.colorSpace = NoColorSpace;
        texture.minFilter = LinearMipmapLinearFilter;
        texture.magFilter = LinearFilter;
        texture.anisotropy = 4;
        texture.needsUpdate = true;
        textures.set(id, { texture, used: performance.now(), ready: false, bitmap });
        uploads.push(id);
        pump();
      }, undefined, () => { loading -= 1; pending.delete(id); pump(); });
    }
  }
  const uploads = [];
  function evict() {
    if (textures.size <= MAX_TEXTURES) return;
    const oldest = [...textures.entries()].sort((a, b) => a[1].used - b[1].used).slice(0, textures.size - MAX_TEXTURES);
    for (const [id, entry] of oldest) {
      entry.texture.dispose();
      entry.bitmap.close?.();
      textures.delete(id);
    }
  }

  // ---- Layout: columns of complete frames, each column looping on its own height.
  let columns = [];
  let tileW = 0;
  let gap = 0;
  let sheetW = 0;
  let ids = [];
  function layout(list) {
    ids = list;
    const vw = innerWidth;
    const across = vw < 560 ? 2.35 : vw < 900 ? 3.5 : vw < 1500 ? 5.2 : 6.4;
    gap = Math.round(clamp(vw * 0.016, 10, 28));
    tileW = Math.round(vw / across - gap);
    size = tileW * dpr > 520 ? 'medium' : 'small';
    let count = Math.max(Math.ceil(vw / (tileW + gap)) + 2, 4);
    // Small sets repeat so every column has frames and the surface still feels endless.
    let items = [...list];
    while (items.length < count * 3) items = items.concat(list);
    count = Math.min(count, Math.max(4, Math.ceil(items.length / 3)));
    columns = Array.from({ length: count }, (_, j) => ({ items: [], height: 0, offset: [0, 0.42, 0.16, 0.63, 0.3][j % 5] * tileW }));
    for (const id of items) {
      const asset = assets.get(id);
      const h = Math.round(tileW * (asset.height / asset.width));
      const column = columns.reduce((a, b) => (b.height < a.height ? b : a));
      column.items.push({ id, y: column.height, h });
      column.height += h + gap;
    }
    sheetW = count * (tileW + gap);
  }

  // ---- Motion: the table follows a target; drags move the target 1:1, flicks project it forward.
  const pos = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const last = { x: 0, y: 0 };
  const fx = { zoom: 1, lens: 0, alpha: 0 };
  let speed = 0;
  let drag = null;
  let keyed = false; // arrow keys: follow quickly, keyboard moves should feel immediate

  const instances = [];
  const onScreen = new Set();
  function collect() {
    instances.length = 0;
    onScreen.clear();
    const vw = view.x;
    const vh = view.y;
    const margin = 80;
    columns.forEach((column, j) => {
      const baseX = j * (tileW + gap) + pos.x;
      for (let x = mod(baseX + tileW + margin, sheetW) - tileW - margin; x < vw + margin; x += sheetW) {
        const start = mod(column.offset + pos.y, column.height) - column.height;
        for (let y = start; y < vh + margin; y += column.height) {
          for (const item of column.items) {
            const top = y + item.y;
            if (top + item.h < -margin || top > vh + margin) continue;
            instances.push({ id: item.id, x, y: top, w: tileW, h: item.h });
            onScreen.add(item.id);
          }
        }
      }
    });
  }

  // ---- Meshes: a pool, re-pointed at whichever frames are on screen this frame.
  const pool = [];
  function createMesh() {
    const material = new ShaderMaterial({
      uniforms: { uRect: { value: new Vector4() }, uView: { value: view }, uLens: { value: 0 }, uZoom: { value: 1 }, uMap: { value: blank }, uReady: { value: 0 }, uAlpha: { value: 1 } },
      vertexShader, fragmentShader, depthTest: false, depthWrite: false,
    });
    const m = new Mesh(geometry, material);
    m.frustumCulled = false;
    scene.add(m);
    return m;
  }
  const mesh = (i) => (pool[i] ??= createMesh());

  // Per-frame fade for photographs as their textures arrive.
  const arrival = new Map();
  let opening = null; // { mesh, rect, others } while a photograph lifts to full frame
  // Skip drawing when nothing on the table has changed since the last frame.
  let lastState = '';
  let fading = false;
  // The photograph open in the viewer: its place on the table stays empty until it comes back.
  let held = null;
  let hovered = null;
  let pointer = null;

  function frame(now) {
    // A few uploads per frame keeps a fast fling from stuttering.
    const uploaded = uploads.length > 0;
    for (let n = 0; n < 3 && uploads.length; n += 1) {
      const id = uploads.shift();
      const entry = textures.get(id);
      if (!entry) continue;
      renderer.initTexture(entry.texture);
      entry.ready = true;
      arrival.set(id, now);
    }
    evict();

    const ease = 1 - Math.exp(-(drag || keyed ? 30 : 9) * (1 / 60));
    if (keyed && Math.hypot(target.x - pos.x, target.y - pos.y) < 0.5) keyed = false;
    pos.x += (target.x - pos.x) * ease;
    pos.y += (target.y - pos.y) * ease;
    speed = Math.hypot(pos.x - last.x, pos.y - last.y);
    last.x = pos.x;
    last.y = pos.y;
    if (!reducedMotion()) fx.lens += (clamp(speed / 60, 0, 1) * 0.14 - fx.lens) * 0.12;

    const state = `${pos.x.toFixed(2)},${pos.y.toFixed(2)},${fx.zoom.toFixed(4)},${fx.lens.toFixed(4)},${fx.alpha.toFixed(3)},${view.x},${view.y},${held}`;
    const idle = state === lastState && !uploaded && !fading && !opening && !queue.length && !loading;
    lastState = state;
    if (!idle) draw(now);
    hover();
  }

  function draw(now) {
    fading = false;
    collect();
    instances.forEach((tile, i) => {
      const m = mesh(i);
      const u = m.material.uniforms;
      const texture = want(tile.id, now);
      const born = arrival.get(tile.id);
      const shown = texture ? (born ? clamp((now - born) / 450, 0, 1) : 1) : 0;
      if (texture && shown < 1) fading = true;
      u.uMap.value = texture || blank;
      u.uReady.value = shown * shown * (3 - 2 * shown);
      u.uRect.value.set(tile.x, tile.y, tile.w, tile.h);
      u.uAlpha.value = tile.id === held ? 0 : opening ? opening.others : fx.alpha;
      u.uLens.value = fx.lens;
      u.uZoom.value = fx.zoom;
      m.visible = true;
    });
    for (let i = instances.length; i < pool.length; i += 1) pool[i].visible = false;
    if (opening) opening.mesh.material.uniforms.uRect.value.set(...opening.rect);
    pump();
    renderer.render(scene, camera);
  }

  function hover() {
    if (pointer && !drag && !opening && speed < 0.5) {
      const tile = hit(pointer.x, pointer.y);
      if (tile?.id !== hovered?.id) { hovered = tile; onHover(tile?.id ?? null, pointer); }
      else if (tile) onHover(tile.id, pointer);
    } else if (hovered && (drag || speed >= 0.5)) {
      hovered = null;
      onHover(null, pointer);
    }
  }

  function hit(x, y) {
    for (let i = instances.length - 1; i >= 0; i -= 1) {
      const t = instances[i];
      if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) return t;
    }
    return null;
  }

  // ---- Input.
  const onDown = (event) => {
    if (opening || event.button > 0) return;
    keyed = false;
    try { canvas.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    drag = { id: event.pointerId, sx: event.clientX, sy: event.clientY, x: event.clientX, y: event.clientY, t: performance.now(), vx: 0, vy: 0, moved: 0 };
    if (!reducedMotion()) gsap.to(fx, { zoom: 0.94, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
    stage.classList.add('is-dragging');
  };
  const onMove = (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!drag || event.pointerId !== drag.id) return;
    const now = performance.now();
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const dt = Math.max(1, now - drag.t);
    // Velocity in px per ms, smoothed so a single noisy sample does not decide the flick.
    drag.vx = drag.vx * 0.6 + (dx / dt) * 0.4;
    drag.vy = drag.vy * 0.6 + (dy / dt) * 0.4;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.t = now;
    drag.moved = Math.max(drag.moved, Math.hypot(event.clientX - drag.sx, event.clientY - drag.sy));
    target.x += dx;
    target.y += dy;
  };
  const onUp = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { moved, vx, vy } = drag;
    drag = null;
    stage.classList.remove('is-dragging');
    gsap.to(fx, { zoom: 1, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });
    if (moved < 6) {
      const tile = hit(event.clientX, event.clientY);
      if (tile) open(tile);
      return;
    }
    // Project the flick: where it would come to rest under deceleration.
    if (!reducedMotion()) {
      target.x += clamp(vx, -4, 4) * 260;
      target.y += clamp(vy, -4, 4) * 260;
    }
  };
  const onWheel = (event) => {
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 32 : 1;
    target.x -= (event.shiftKey ? event.deltaY : event.deltaX) * scale;
    target.y -= (event.shiftKey ? 0 : event.deltaY) * scale;
  };
  const onLeave = () => { pointer = null; if (hovered) { hovered = null; onHover(null, null); } };
  const onKey = (event) => {
    if (opening || held || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const step = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
    if (!step) return;
    event.preventDefault();
    keyed = true;
    target.x += step[0] * (tileW + gap);
    target.y += step[1] * (tileW + gap);
  };
  canvas.addEventListener('pointerdown', onDown);
  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerleave', onLeave);
  addEventListener('keydown', onKey);

  // ---- Opening a photograph: it lifts to the viewer's frame while the rest of the table goes dark.
  function open(tile) {
    hovered = null;
    onHover(null, null);
    const [vx, vy, vw, vh] = viewerRect();
    const scale = Math.min(vw / tile.w, vh / tile.h);
    const to = [vx + (vw - tile.w * scale) / 2, vy + (vh - tile.h * scale) / 2, tile.w * scale, tile.h * scale];
    const state = { p: 0 };
    const from = [tile.x, tile.y, tile.w, tile.h];
    // The lifting frame gets its own mesh, drawn above the table.
    const lift = createMesh();
    lift.renderOrder = 1;
    const u = lift.material.uniforms;
    u.uMap.value = textures.get(tile.id)?.texture ?? blank;
    u.uReady.value = textures.get(tile.id)?.ready ? 1 : 0;
    u.uAlpha.value = 1;
    opening = { mesh: lift, rect: [...from], others: 1 };
    gsap.to(state, {
      p: 1,
      duration: reducedMotion() ? 0.01 : 0.75,
      ease: 'expo.inOut',
      onUpdate: () => {
        opening.rect = from.map((v, i) => v + (to[i] - v) * state.p);
        opening.others = 1 - Math.min(1, state.p * 1.6);
      },
      onComplete: () => onOpen(tile.id),
    });
  }

  // ---- Lifecycle.
  function resize() {
    const w = innerWidth;
    const h = innerHeight;
    view.set(w, h);
    renderer.setSize(w, h, false);
    const ratio = sheetW ? pos.x / sheetW : 0;
    layout(ids);
    pos.x = target.x = last.x = ratio * sheetW;
  }
  let disposed = false;
  let frameId = 0;
  const loop = (now) => {
    frameId = requestAnimationFrame(loop);
    if (!document.hidden) frame(now);
  };
  view.set(innerWidth, innerHeight);
  renderer.setSize(innerWidth, innerHeight, false);
  addEventListener('resize', resize);

  return {
    // Shows a set of photographs. `wait` holds the entrance (the table still loads underneath).
    show(list, { first = false, wait = null } = {}) {
      const enter = () => {
        // The first entrance is the showpiece; switching filters is a control and stays quick.
        gsap.fromTo(fx, { alpha: 0 }, { alpha: 1, duration: reducedMotion() ? 0.2 : first ? 1.1 : 0.45, ease: 'power2.out' });
        if (!reducedMotion()) gsap.fromTo(fx, { zoom: first ? 1.22 : 1.04 }, { zoom: 1, duration: first ? 1.8 : 0.55, ease: 'expo.out' });
      };
      const swap = () => {
        layout(shuffle(list, list.length));
        // Start centred across the sheet, slightly into the first row.
        pos.x = target.x = last.x = -Math.round(sheetW / 2 - innerWidth / 2);
        pos.y = target.y = last.y = -Math.round(tileW * 0.4);
        fx.alpha = 0;
        if (wait) wait.then(() => { if (!disposed) enter(); });
        else enter();
      };
      if (first || !ids.length) swap();
      else gsap.to(fx, { alpha: 0, duration: 0.18, ease: 'power2.out', overwrite: true, onComplete: swap });
    },
    start() { frameId = requestAnimationFrame(loop); },
    // After a lift: drop the lifted copy and bring the table back (the viewer now covers it).
    settle() {
      if (!opening) return;
      gsap.killTweensOf(fx);
      scene.remove(opening.mesh);
      opening.mesh.material.dispose();
      opening = null;
      fx.alpha = 1;
      fx.zoom = 1;
    },
    hold(id) { held = id; },
    release() { held = null; },
    // Where a photograph sits on screen right now (the copy nearest the middle), or null.
    rectOf(id) {
      let best = null;
      let distance = Infinity;
      for (const t of instances) {
        if (t.id !== id || t.x + t.w < 0 || t.x > view.x || t.y + t.h < 0 || t.y > view.y) continue;
        const d = Math.hypot(t.x + t.w / 2 - view.x / 2, t.y + t.h / 2 - view.y / 2);
        if (d < distance) { distance = d; best = t; }
      }
      return best && { left: best.x, top: best.y, width: best.w, height: best.h };
    },
    pause(paused) {
      cancelAnimationFrame(frameId);
      if (!paused) frameId = requestAnimationFrame(loop);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      gsap.killTweensOf(fx);
      canvas.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerleave', onLeave);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', resize);
      for (const entry of textures.values()) { entry.texture.dispose(); entry.bitmap.close?.(); }
      pool.forEach((m) => m.material.dispose());
      opening?.mesh.material.dispose();
      geometry.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
