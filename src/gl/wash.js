// Page transitions: ink rises from the bottom of the screen to cover the page, the page changes
// beneath it, and the ink drains away upwards. One persistent canvas, idle and hidden between uses.
import { gsap } from 'gsap';
import { createQuad, NOISE } from './quad.js';

const FRAGMENT = `
uniform vec2 uRes;
uniform float uCover, uReveal, uSeed;
${NOISE}
void main() {
  vec2 p = vUv * uRes / min(uRes.x, uRes.y);
  // Low at the bottom: the ink arrives there first and leaves there first.
  float field = fbm(p * 2.4 + uSeed) * 0.45 + vUv.y * 0.55;
  float tc = uCover * 1.2 - 0.08;
  float tr = uReveal * 1.2 - 0.08;
  float covered = 1.0 - smoothstep(tc - 0.012, tc, field);
  float kept = smoothstep(tr - 0.012, tr, field);
  float ink = min(covered, kept);
  // A thin wet edge where the ink is moving.
  float edge = (smoothstep(tc - 0.03, tc - 0.012, field) * (1.0 - step(0.999, uCover)))
             + (1.0 - smoothstep(tr, tr + 0.018, field)) * step(0.001, uReveal);
  vec3 col = mix(vec3(0.0314), vec3(0.188, 0.188, 0.18), clamp(edge, 0.0, 1.0));
  outColor = vec4(col * ink, ink);
}`;

export function createWash() {
  const canvas = document.createElement('canvas');
  canvas.className = 'wash';
  canvas.setAttribute('aria-hidden', 'true');
  let quad;
  try {
    quad = createQuad(canvas, FRAGMENT);
  } catch {
    quad = null;
  }
  if (!quad) return null;
  document.body.append(canvas);
  const state = { cover: 0, reveal: 0 };
  const size = () => {
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    quad.set('uRes', innerWidth, innerHeight);
  };
  const draw = () => {
    quad.set('uCover', state.cover);
    quad.set('uReveal', state.reveal);
    quad.draw();
  };

  return {
    // Resolves once the screen is fully covered.
    cover() {
      size();
      quad.set('uSeed', Math.random() * 40);
      state.cover = 0;
      state.reveal = 0;
      canvas.classList.add('is-on');
      return new Promise((resolve) => gsap.to(state, { cover: 1, duration: 0.5, ease: 'power2.inOut', onUpdate: draw, onComplete: resolve }));
    },
    reveal() {
      return new Promise((resolve) => gsap.to(state, {
        reveal: 1,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: draw,
        onComplete: () => { canvas.classList.remove('is-on'); resolve(); },
      }));
    },
  };
}
