// Page titles bloom out of spreading ink and sharpen into their letterforms, then hand back to the
// real text. Works for Koch=Schrift titles (drawn word by word where the browser laid them out, so
// wrapped lines match) and for image titles such as the Hellion logo.
import { gsap } from 'gsap';
import { createQuad, NOISE } from './quad.js';

const FRAGMENT = `
uniform sampler2D uSharp, uHalo;
uniform vec2 uRes;
uniform float uInk, uSettle, uTime;
${NOISE}
void main() {
  vec2 p = vUv * uRes;
  float sharp = texture(uSharp, vUv).a;
  float halo = texture(uHalo, vUv).a;
  float n = fbm(p * 0.011 + vec2(0.0, -uTime * 0.06));
  float th = mix(1.3, 0.34, uInk);
  float bloom = smoothstep(th, th + 0.05, halo * 1.15 + (n - 0.5) * 0.6);
  float ink = mix(bloom * 0.82, sharp, uSettle);
  outColor = vec4(vec3(0.953, 0.945, 0.925) * ink, ink);
}`;

// Paints the title's shape into a canvas covering `box` (page px), optionally as a soft halo.
function paint(title, box, dpr, blur) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.translate(-box.left, -box.top);
  ctx.fillStyle = '#fff';
  if (blur) { ctx.shadowColor = '#fff'; ctx.shadowBlur = blur * dpr; }
  const passes = blur ? 3 : 1;
  const image = title.querySelector('img');
  for (let pass = 0; pass < passes; pass += 1) {
    if (image) {
      const r = image.getBoundingClientRect();
      ctx.drawImage(image, r.left, r.top, r.width, r.height);
      continue;
    }
    const style = getComputedStyle(title);
    ctx.font = `400 ${style.fontSize} KochSchrift`;
    ctx.letterSpacing = style.letterSpacing;
    ctx.textBaseline = 'alphabetic';
    // Each word where it actually sits, so wrapped titles line up exactly.
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (const match of node.textContent.matchAll(/\S+/g)) {
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const r = range.getBoundingClientRect();
        const m = ctx.measureText(match[0]);
        const ink = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        ctx.fillText(match[0], r.left, r.top + (r.height - ink) / 2 + m.actualBoundingBoxAscent);
      }
    }
  }
  return canvas;
}

export function inkTitle(title, { duration = 1.6 } = {}) {
  const dpr = Math.min(devicePixelRatio, 2);
  const rect = title.getBoundingClientRect();
  if (!rect.width) return () => {};
  const size = parseFloat(getComputedStyle(title).fontSize) || rect.height;
  const pad = Math.round(size * 0.35);
  // Canvas in viewport space at mount time; it rides along with the title if the page scrolls.
  const box = { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 };
  const canvas = document.createElement('canvas');
  canvas.className = 'ink-title';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = Math.round(box.width * dpr);
  canvas.height = Math.round(box.height * dpr);
  let quad;
  try {
    quad = createQuad(canvas, FRAGMENT);
  } catch {
    quad = null;
  }
  if (!quad) return () => {};

  quad.texture('uSharp', 0, paint(title, box, dpr, 0));
  quad.texture('uHalo', 1, paint(title, box, dpr, size * 0.12));
  quad.set('uRes', box.width, box.height);
  const host = title.offsetParent || document.body;
  const hostRect = host.getBoundingClientRect();
  Object.assign(canvas.style, { left: `${box.left - hostRect.left}px`, top: `${box.top - hostRect.top}px`, width: `${box.width}px`, height: `${box.height}px` });
  host.append(canvas);
  title.style.opacity = '0';

  const state = { ink: 0, settle: 0 };
  const start = performance.now();
  const draw = () => {
    quad.set('uInk', state.ink);
    quad.set('uSettle', state.settle);
    quad.set('uTime', (performance.now() - start) / 1000);
    quad.draw();
  };
  const finish = () => {
    title.style.opacity = '';
    canvas.remove();
    quad.dispose();
  };
  const timeline = gsap.timeline({ onUpdate: draw, onComplete: finish })
    .to(state, { ink: 1, duration: duration * 0.8, ease: 'power2.out' })
    .to(state, { settle: 1, duration: duration * 0.45, ease: 'power2.inOut' }, duration * 0.5);
  draw();
  return () => {
    if (!timeline.isActive() && !canvas.isConnected) return;
    timeline.kill();
    finish();
  };
}
