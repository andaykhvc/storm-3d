// The film page's walk through Pieterskerk: scrolling moves down the aisle past the stills, hung in
// pointed-arch tracery, to the altar, where the church still is seen face-on and complete.
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Mesh, Group, Line, LineSegments, LineBasicMaterial, BufferGeometry, Float32BufferAttribute, BufferAttribute, Points, Vector3, Fog, TextureLoader, NoColorSpace, LinearMipmapLinearFilter, MathUtils, QuadraticBezierCurve3, AdditiveBlending, DoubleSide } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { assets } from '../content/data.js';

gsap.registerPlugin(ScrollTrigger);

const SPACING = 5.4;
const PANEL_H = 2.1;
const AISLE_X = 3.2;

const photoVertex = /* glsl */ `
  varying vec2 vUv; varying float vDepth;
  void main() {
    vUv = uv;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }`;
// The still itself, untouched; only distance down the dark aisle mixes it toward black.
const photoFragment = /* glsl */ `
  uniform sampler2D uMap; uniform float uNear, uFar, uOpacity;
  varying vec2 vUv; varying float vDepth;
  void main() {
    float near = 1.0 - smoothstep(uNear, uFar, vDepth);
    gl_FragColor = vec4(mix(vec3(0.0314), texture2D(uMap, vUv).rgb, near * uOpacity), 1.0);
  }`;

const BONE = 0xf3f1ec;

// Points along a circular arc in the x/y plane, from angle a0 to a1.
function arc(cx, cy, r, a0, a1, steps = 24) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = a0 + (a1 - a0) * (i / steps);
    return new Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a), 0);
  });
}

// Consecutive points as line-segment pairs, appended to `out`.
function pairs(points, out) {
  for (let i = 0; i < points.length - 1; i += 1) out.push(points[i], points[i + 1]);
  return out;
}

// An equilateral pointed arch springing from (x0, y) to (x1, y).
function pointedArch(x0, x1, y, steps = 24) {
  const span = x1 - x0;
  return [...arc(x1, y, span, Math.PI, (2 * Math.PI) / 3, steps), ...arc(x0, y, span, Math.PI / 3, 0, steps).slice(1)];
}

// A gothic window around a w × h panel: rectangle sides rising into a pointed arch, and, in the arch
// head above the photograph, two sub-arches on a mullion under a quatrefoil oculus.
function tracery(w, h, margin) {
  const half = w / 2 + margin;
  const top = h / 2 + margin;
  const bottom = -h / 2 - margin;
  const group = new Group();
  const outline = [new Vector3(-half, bottom, 0), ...pointedArch(-half, half, top, 28), new Vector3(half, bottom, 0)];
  group.add(new Line(new BufferGeometry().setFromPoints(outline), new LineBasicMaterial({ color: BONE, transparent: true, opacity: 0.5 })));

  const inner = [];
  pairs([new Vector3(-half, top, 0), new Vector3(half, top, 0)], inner); // transom
  pairs([new Vector3(0, top, 0), new Vector3(0, top + half * 0.866, 0)], inner); // mullion
  pairs(pointedArch(-half, 0, top, 16), inner);
  pairs(pointedArch(0, half, top, 16), inner);
  const cy = top + half * 1.27;
  const r = half * 0.3;
  pairs(arc(0, cy, r, 0, Math.PI * 2, 40), inner); // oculus
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) pairs(arc(dx * r * 0.42, cy + dy * r * 0.42, r * 0.45, 0, Math.PI * 2, 24), inner); // quatrefoil
  group.add(new LineSegments(new BufferGeometry().setFromPoints(inner), new LineBasicMaterial({ color: BONE, transparent: true, opacity: 0.28 })));
  return group;
}

// The church around the aisle, drawn in the same thin line: clustered piers between the bays,
// pointed transverse arches overhead, crossing ribs in each bay, a ridge rib, and a candlestick at
// each pier's foot. One LineSegments, so it costs a single draw call. Returns the candle positions.
function architecture(bays, startZ) {
  const X = AISLE_X + 1.5;
  const H = 6.4;
  const R = 1.3 * X;
  const theta = Math.acos((X - R) / R);
  const apex = H + R * Math.sin(theta);
  const out = [];
  const flames = [];
  const zs = Array.from({ length: bays + 1 }, (_, i) => startZ - i * SPACING);
  const segment = (a, b) => out.push(a, b);
  for (const z of zs) {
    for (const side of [-1, 1]) {
      // A pier of three shafts.
      for (const [dx, dz] of [[0, 0], [0.12, -0.14], [0.12, 0.14]]) segment(new Vector3(side * (X + dx), 0, z + dz), new Vector3(side * (X + dx), H, z + dz));
      // A three-branched candelabrum at the pier's foot.
      const cx = side * (X - 0.6);
      segment(new Vector3(cx, 0, z), new Vector3(cx, 1.22, z));
      segment(new Vector3(cx - 0.14, 0, z), new Vector3(cx + 0.14, 0, z));
      pairs(arc(cx, 1.08, 0.2, Math.PI, Math.PI * 2, 10).map((p) => p.setZ(z)), out);
      for (const dx of [-0.2, 0.2]) segment(new Vector3(cx + dx, 1.08, z), new Vector3(cx + dx, 1.16, z));
      flames.push(cx - 0.2, 1.24, z, cx, 1.3, z, cx + 0.2, 1.24, z);
    }
    // Transverse pointed arch across the nave.
    const left = arc(-X + R, H, R, Math.PI, theta, 20).map((p) => p.setZ(z));
    const right = arc(X - R, H, R, Math.PI - theta, 0, 20).map((p) => p.setZ(z));
    pairs([...left, ...right.slice(1)], out);
  }
  // Crossing ribs: each bay's diagonals meet on the ridge.
  const lift = 2 * apex - H;
  for (let i = 0; i < zs.length - 1; i += 1) {
    const [z1, z2] = [zs[i], zs[i + 1]];
    for (const side of [-1, 1]) {
      const curve = new QuadraticBezierCurve3(new Vector3(side * X, H, z1), new Vector3(0, lift, (z1 + z2) / 2), new Vector3(-side * X, H, z2));
      pairs(curve.getPoints(20), out);
    }
  }
  segment(new Vector3(0, apex, zs[0]), new Vector3(0, apex, zs.at(-1))); // ridge
  for (const side of [-1, 1]) segment(new Vector3(side * X, H, zs[0]), new Vector3(side * X, H, zs.at(-1))); // wall line
  const lines = new LineSegments(new BufferGeometry().setFromPoints(out), new LineBasicMaterial({ color: BONE, transparent: true, opacity: 0.22 }));
  return { lines, flames, apex };
}

// Light falling from high windows on the left across the aisle: crossed soft planes, additive.
function shafts(bays, startZ) {
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vDepth;
      void main() {
        vUv = uv;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vDepth = -view.z;
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAlpha;
      varying vec2 vUv; varying float vDepth;
      void main() {
        float along = smoothstep(0.0, 0.4, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
        float across = smoothstep(0.0, 0.4, vUv.x) * (1.0 - smoothstep(0.6, 1.0, vUv.x));
        float breathe = 0.85 + 0.15 * sin(uTime * 0.5 + vDepth * 0.2);
        // Fade in the distance, and when walking through a shaft.
        float depth = (1.0 - smoothstep(12.0, 30.0, vDepth)) * smoothstep(1.5, 4.5, vDepth);
        gl_FragColor = vec4(vec3(0.953, 0.945, 0.925), 0.075 * along * across * breathe * depth * uAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const group = new Group();
  const plane = new PlaneGeometry(1.8, 13);
  for (let i = 1; i < bays; i += 2) {
    const shaft = new Group();
    shaft.add(new Mesh(plane, material), new Mesh(plane, material).rotateY(Math.PI / 2));
    shaft.position.set(0, 5.6, startZ - i * SPACING - SPACING / 2);
    shaft.rotation.set(0, 0.25, 0.42);
    group.add(shaft);
  }
  return { group, material };
}

// Candle flames: a bright core and a soft halo, each flickering on its own phase.
function candles(positions, pixelRatio) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new Float32BufferAttribute(positions.filter((_, i) => i % 3 === 0).map(() => Math.random() * 10), 1));
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 }, uScale: { value: pixelRatio } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime, uAlpha, uScale;
      varying float vAlpha;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        float flicker = 0.82 + 0.12 * sin(uTime * 9.0 + seed * 13.0) + 0.06 * sin(uTime * 23.0 + seed * 7.0);
        vAlpha = flicker * uAlpha * (1.0 - smoothstep(14.0, 32.0, -view.z)) * smoothstep(0.8, 2.0, -view.z);
        gl_PointSize = min(300.0 / -view.z, 80.0) * uScale * (0.92 + 0.12 * flicker);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        // A flame is taller than it is wide.
        float flame = 1.0 - smoothstep(0.02, 0.11, length(vec2(c.x * 2.4, c.y * 1.15 + 0.04)));
        float halo = pow(1.0 - smoothstep(0.0, 0.5, length(c)), 2.0) * 0.32;
        gl_FragColor = vec4(vec3(0.953, 0.945, 0.925), (flame + halo) * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  return new Points(geometry, material);
}

// The lookbook's diagonal floor tiles, receding into the dark.
function floor(length) {
  const positions = [];
  const width = 16;
  for (let d = -width; d <= length + width; d += 0.9) {
    positions.push(-width / 2, 0, -d + width / 2, width / 2, 0, -d - width / 2);
    positions.push(width / 2, 0, -d + width / 2, -width / 2, 0, -d - width / 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new LineSegments(geometry, new LineBasicMaterial({ color: 0x3a3936, transparent: true, opacity: 0.55 }));
}

function dust(count, length) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) positions.set([(Math.random() - 0.5) * 9, Math.random() * 5, 8 - Math.random() * (length + 12)], i * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return new Points(geometry, new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uAlpha;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * 0.07 + sin(uTime * 0.3 + p.z) * 0.1, 5.0);
        p.x += sin(uTime * 0.2 + p.y * 2.0) * 0.08;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        vAlpha = (1.0 - smoothstep(4.0, 22.0, -view.z)) * smoothstep(0.6, 2.0, -view.z) * 0.5 * uAlpha;
        gl_PointSize = min(2.0 * (6.0 / -view.z), 3.0);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.953, 0.945, 0.925), vAlpha * (1.0 - smoothstep(0.2, 0.5, d))); }`,
    transparent: true,
    depthWrite: false,
  }));
}

function load(src) {
  return new Promise((resolve, reject) => new TextureLoader().load(src, (t) => {
    t.colorSpace = NoColorSpace;
    t.minFilter = LinearMipmapLinearFilter;
    t.anisotropy = 4;
    resolve(t);
  }, undefined, reject));
}

export async function mountNave(track, stage, { altar, aisle, onCaption }) {
  const textures = await Promise.all([...aisle.map((id) => load(assets.get(id).medium.src)), load(assets.get(altar).large.src)]);
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x080808, 1);
  const canvas = renderer.domElement;
  canvas.className = 'nave-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);

  const scene = new Scene();
  scene.fog = new Fog(0x080808, 6, 30);
  const camera = new PerspectiveCamera(48, 1, 0.1, 90);
  const materials = [];
  const photo = (texture, near, far) => {
    const m = new ShaderMaterial({ uniforms: { uMap: { value: texture }, uNear: { value: near }, uFar: { value: far }, uOpacity: { value: 1 } }, vertexShader: photoVertex, fragmentShader: photoFragment });
    materials.push(m);
    return m;
  };

  // Stills alternate left and right of the aisle, angled toward whoever walks in.
  const stops = aisle.map((id, i) => {
    const asset = assets.get(id);
    const w = PANEL_H * (asset.width / asset.height);
    const side = i % 2 === 0 ? -1 : 1;
    const group = new Group();
    group.add(new Mesh(new PlaneGeometry(w, PANEL_H), photo(textures[i], 7, 30)), tracery(w, PANEL_H, 0.14));
    group.position.set(side * AISLE_X, 1.8, -i * SPACING - 3);
    group.rotation.y = -side * 0.92;
    scene.add(group);
    return { id, z: group.position.z };
  });
  const altarAsset = assets.get(altar);
  const altarZ = -aisle.length * SPACING - 7;
  const altarW = 7.4;
  const altarH = altarW * (altarAsset.height / altarAsset.width);
  const altarGroup = new Group();
  altarGroup.add(new Mesh(new PlaneGeometry(altarW, altarH), photo(textures.at(-1), 9, 44)), tracery(altarW, altarH, 0.3));
  altarGroup.position.set(0, 2.2, altarZ);
  const motes = dust(800, -altarZ);
  const church = architecture(aisle.length, -3 + SPACING / 2);
  const light = shafts(aisle.length, -3);
  const flames = candles(church.flames, renderer.getPixelRatio());
  scene.add(altarGroup, floor(-altarZ + 10), church.lines, light.group, flames, motes);

  // Camera path: the entrance to the point where the altar still fills the frame without cropping.
  const path = { progress: 0 };
  const pointer = { x: 0, y: 0 };
  const look = { x: 0, y: 0 };
  let endZ = altarZ + 6;
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // A wider lens on tall screens, so the stills either side of the aisle stay in view.
    camera.fov = camera.aspect < 0.8 ? 66 : 48;
    camera.updateProjectionMatrix();
    const half = Math.tan(MathUtils.degToRad(camera.fov) / 2);
    endZ = altarZ + Math.max((altarH * 1.06) / 2 / half, (altarW * 1.06) / 2 / half / camera.aspect);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  const onPointer = (event) => {
    pointer.x = (event.clientX / innerWidth) * 2 - 1;
    pointer.y = (event.clientY / innerHeight) * 2 - 1;
  };
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) addEventListener('pointermove', onPointer);

  let visible = false;
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  visibility.observe(track);
  let caption = null;
  const tick = (time) => {
    if (!visible) return;
    const p = path.progress;
    const eased = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
    const settle = 1 - MathUtils.smoothstep(p, 0.82, 1);
    look.x += (pointer.x - look.x) * 0.05;
    look.y += (pointer.y - look.y) * 0.05;
    camera.position.set(Math.sin(p * Math.PI * 2.2) * 0.35 * settle, MathUtils.lerp(1.6, 2.2, eased), MathUtils.lerp(9, endZ, eased));
    camera.rotation.set(-look.y * 0.04 * settle, (-look.x * 0.06 + Math.sin(p * Math.PI * 3) * 0.05) * settle, 0);
    // Dust, light and candles drift and flicker; at the altar they clear, so the still is seen untouched.
    for (const material of [motes.material, light.material, flames.material]) {
      material.uniforms.uTime.value = time;
      material.uniforms.uAlpha.value = settle;
    }
    // Name whichever still the camera is passing.
    const nearest = p > 0.9 ? altar : stops.reduce((a, b) => (Math.abs(b.z - camera.position.z + 4) < Math.abs(a.z - camera.position.z + 4) ? b : a)).id;
    if (nearest !== caption) { caption = nearest; onCaption(nearest); }
    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);
  const walk = gsap.to(path, { progress: 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.9 } });

  return () => {
    gsap.ticker.remove(tick);
    walk.scrollTrigger?.kill();
    walk.kill();
    observer.disconnect();
    visibility.disconnect();
    removeEventListener('pointermove', onPointer);
    scene.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    renderer.dispose();
    canvas.remove();
  };
}
