/* ============================================================
   PULSE — ambient 3D scene
   - animated wave grid (energy field / equalizer)
   - floating volt particles
   - heartbeat "pulse" that ripples through the grid
   - mouse parallax + scroll-driven camera
   - theme-aware, GPU-friendly
   ============================================================ */
import * as THREE from 'three';

const canvas = document.getElementById('bg-canvas');

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene  = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0b0d, 0.055);

/* theme palettes */
const THEMES = {
  dark:  { fog: 0x0a0b0d, grid: 0xc6ff3a, particle: 0xc6ff3a, ember: 0xff5e3a, density: 0.055, gridOpacity: 0.55 },
  light: { fog: 0xf3f2ee, grid: 0x4a7c0f, particle: 0x4a7c0f, ember: 0xd83a16, density: 0.04,  gridOpacity: 0.4  }
};
let theme = THEMES.dark;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4.5, 13);
camera.lookAt(0, 0, -6);

/* ============================================================
   1. WAVE GRID — a plane of points that ripples like an energy field
   ============================================================ */
const GRID_W = 60, GRID_D = 60, SPACING = 0.7;
const gridCount = GRID_W * GRID_D;
const gridPos = new Float32Array(gridCount * 3);
const baseXZ  = new Float32Array(gridCount * 2);

let p = 0, q = 0;
for (let z = 0; z < GRID_D; z++){
  for (let x = 0; x < GRID_W; x++){
    const px = (x - GRID_W / 2) * SPACING;
    const pz = (z - GRID_D / 2) * SPACING;
    gridPos[p++] = px;
    gridPos[p++] = 0;
    gridPos[p++] = pz;
    baseXZ[q++] = px;
    baseXZ[q++] = pz;
  }
}

const gridGeom = new THREE.BufferGeometry();
gridGeom.setAttribute('position', new THREE.BufferAttribute(gridPos, 3));

/* soft round sprite shared by grid + particles */
function makeSprite(){
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0,   'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1,   'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const sprite = makeSprite();

const gridMat = new THREE.PointsMaterial({
  size: 0.12,
  map: sprite,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: theme.grid,
  opacity: theme.gridOpacity
});
const grid = new THREE.Points(gridGeom, gridMat);
grid.position.z = -8;
scene.add(grid);

/* ============================================================
   2. FLOATING PARTICLES — drifting volt motes for depth
   ============================================================ */
const COUNT = 900;
const pPos   = new Float32Array(COUNT * 3);
const pSpeed = new Float32Array(COUNT);
const pPhase = new Float32Array(COUNT);
for (let i = 0; i < COUNT; i++){
  pPos[i*3+0] = (Math.random() - 0.5) * 50;
  pPos[i*3+1] = Math.random() * 22 - 2;
  pPos[i*3+2] = -Math.random() * 50 + 10;
  pSpeed[i]   = 0.15 + Math.random() * 0.5;
  pPhase[i]   = Math.random() * Math.PI * 2;
}
const partGeom = new THREE.BufferGeometry();
partGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const partMat = new THREE.PointsMaterial({
  size: 0.09,
  map: sprite,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: theme.particle,
  opacity: 0.7
});
const particles = new THREE.Points(partGeom, partMat);
scene.add(particles);

/* ============================================================
   3. THEME SYNC
   ============================================================ */
function applyTheme(name){
  theme = THEMES[name] || THEMES.dark;
  scene.fog.color.setHex(theme.fog);
  scene.fog.density = theme.density;
  gridMat.color.setHex(theme.grid);
  gridMat.opacity = theme.gridOpacity;
  partMat.color.setHex(theme.particle);
}
window.addEventListener('theme-change', (e) => applyTheme(e.detail && e.detail.theme));
applyTheme(document.body.classList.contains('light') ? 'light' : 'dark');

/* ============================================================
   4. POINTER + SCROLL
   ============================================================ */
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('mousemove', (e) => {
  pointer.tx = (e.clientX / window.innerWidth)  * 2 - 1;
  pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

let scrollY = 0;
window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, { passive: true });

/* pause render when tab hidden (saves battery) */
let running = true;
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) tick();
});

/* ============================================================
   5. ANIMATE
   ============================================================ */
const clock = new THREE.Clock();
const gridAttr = gridGeom.getAttribute('position');
const partAttr = partGeom.getAttribute('position');

/* heartbeat envelope: two quick beats then rest, looping ~ every 1.1s */
function heartbeat(t){
  const cycle = t % 1.1;
  const b1 = Math.exp(-Math.pow((cycle - 0.10) * 14, 2));
  const b2 = Math.exp(-Math.pow((cycle - 0.34) * 14, 2)) * 0.6;
  return b1 + b2;
}

function tick(){
  if (!running) return;
  const t = clock.getElapsedTime();
  const beat = heartbeat(t);

  pointer.x += (pointer.tx - pointer.x) * 0.045;
  pointer.y += (pointer.ty - pointer.y) * 0.045;

  /* ripple the grid: radial waves + travelling swell + heartbeat lift */
  for (let i = 0; i < gridCount; i++){
    const bx = baseXZ[i*2], bz = baseXZ[i*2+1];
    const dist = Math.sqrt(bx*bx + bz*bz);
    const wave =
        Math.sin(dist * 0.6 - t * 1.8) * 0.45
      + Math.sin(bx * 0.35 + t * 0.9) * 0.25
      + Math.cos(bz * 0.4  - t * 1.1) * 0.25;
    const ripple = Math.sin(dist * 0.9 - t * 4.0) * beat * 0.6;
    gridAttr.array[i*3 + 1] = wave + ripple;
  }
  gridAttr.needsUpdate = true;

  /* particles rise + gentle sway; recycle at top */
  for (let i = 0; i < COUNT; i++){
    const iy = i*3 + 1;
    partAttr.array[iy] += pSpeed[i] * 0.012 * (1 + beat * 0.8);
    partAttr.array[i*3] += Math.sin(t * 0.4 + pPhase[i]) * 0.004;
    if (partAttr.array[iy] > 20){ partAttr.array[iy] = -2; }
  }
  partAttr.needsUpdate = true;

  /* grid material breathes with the beat */
  gridMat.size = 0.12 + beat * 0.06;
  gridMat.opacity = theme.gridOpacity + beat * 0.2;

  /* camera parallax + scroll dolly */
  const sc = Math.min(scrollY, 6000);
  camera.position.x = pointer.x * 1.4;
  camera.position.y = 4.5 - pointer.y * 0.8 + sc * 0.0006;
  camera.position.z = 13 + sc * 0.0012;
  camera.lookAt(0, sc * 0.0004, -6);

  grid.rotation.z = pointer.x * 0.04;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
