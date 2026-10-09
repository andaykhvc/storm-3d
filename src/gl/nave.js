// The film page's walk through Pieterskerk: scrolling moves down the aisle past the stills, hung in
// pointed-arch tracery, to the altar, where the church still is seen face-on and complete.
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Mesh, Group, Line, LineSegments, LineBasicMaterial, BufferGeometry, Float32BufferAttribute, BufferAttribute, Points, Vector3, Fog, TextureLoader, NoColorSpace, LinearMipmapLinearFilter, MathUtils } from 'three';
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

// Rectangle sides rising into an equilateral pointed arch around a w × h panel.
function tracery(w, h, margin) {
  const half = w / 2 + margin;
  const top = h / 2 + margin;
  const span = half * 2;
  const points = [new Vector3(-half, -h / 2 - margin, 0), new Vector3(-half, top, 0)];
  const steps = 28;
  for (let i = 1; i <= steps; i += 1) {
    const a = Math.PI - (Math.PI / 3) * (i / steps);
    points.push(new Vector3(half + span * Math.cos(a), top + span * Math.sin(a), 0));
  }
  for (let i = steps - 1; i >= 0; i -= 1) {
    const a = (Math.PI / 3) * (i / steps);
    points.push(new Vector3(-half + span * Math.cos(a), top + span * Math.sin(a), 0));
  }
  points.push(new Vector3(half, -h / 2 - margin, 0));
  return new Line(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color: 0xf3f1ec, transparent: true, opacity: 0.5 }));
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
  scene.add(altarGroup, floor(-altarZ + 10), motes);

  // Camera path: the entrance to the point where the altar still fills the frame without cropping.
  const path = { progress: 0 };
  const pointer = { x: 0, y: 0 };
  const look = { x: 0, y: 0 };
  let endZ = altarZ + 6;
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
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
    motes.material.uniforms.uTime.value = time;
    // Clear the air at the altar, so the still is seen untouched.
    motes.material.uniforms.uAlpha.value = settle;
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
