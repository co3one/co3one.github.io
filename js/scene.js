/* ═══════════════════════════════════════════════════════════════════════
   CO3 ONE v8 — WORMHOLE
   Single wireframe geometry. Cinematic grain does the rest.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const M = window.innerWidth < 768;
const ORANGE = new THREE.Color(0xff6700);
const GOLD = new THREE.Color(0xC4A265);
const accent = new THREE.Color().copy(ORANGE);
const aTgt = new THREE.Color().copy(ORANGE);

// ── Renderer ──
const R = new THREE.WebGLRenderer({ antialias: !M, powerPreference: 'high-performance' });
R.setSize(window.innerWidth, window.innerHeight);
R.setPixelRatio(Math.min(window.devicePixelRatio, M ? 1.5 : 2));
R.toneMapping = THREE.ACESFilmicToneMapping;
R.toneMappingExposure = 0.9;
document.getElementById('scene-container').appendChild(R.domElement);

const S = new THREE.Scene();
S.background = new THREE.Color(0x0a0a10);
const cam = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);

// ── Post-processing ──
const pr = Math.min(window.devicePixelRatio, M ? 1.5 : 2);
const rt = new THREE.WebGLRenderTarget(window.innerWidth * pr, window.innerHeight * pr);
const pSc = new THREE.Scene(), pCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postU = { tDiffuse:{value:null}, uTime:{value:0}, uRes:{value:new THREE.Vector2(window.innerWidth, window.innerHeight)} };
const postMat = new THREE.ShaderMaterial({ uniforms: postU,
  vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position,1);}',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 v;
    void main() {
      vec2 u = v; vec2 c = u - 0.5; u += c * dot(c,c) * 0.015;
      float ca = 0.0008 * length(u - 0.5);
      vec3 col = vec3(
        texture2D(tDiffuse, u + vec2(ca, 0.0)).r,
        texture2D(tDiffuse, u).g,
        texture2D(tDiffuse, u - vec2(ca, 0.0)).b
      );
      // Bloom — tight
      vec3 b1 = vec3(0.0); float s1 = 2.5 / uRes.x;
      for (float i = -2.; i <= 2.; i++) for (float j = -2.; j <= 2.; j++) {
        vec3 s = texture2D(tDiffuse, u + vec2(i,j) * s1).rgb;
        b1 += s * smoothstep(0.12, 0.6, dot(s, vec3(0.2126, 0.7152, 0.0722)));
      }
      col += b1 / 25.0 * 0.5;
      // Bloom — wide glow
      vec3 b2 = vec3(0.0); float s2 = 7.0 / uRes.x;
      for (float i = -2.; i <= 2.; i++) for (float j = -2.; j <= 2.; j++) {
        vec3 s = texture2D(tDiffuse, u + vec2(i,j) * s2).rgb;
        b2 += s * smoothstep(0.04, 0.3, dot(s, vec3(0.2126, 0.7152, 0.0722)));
      }
      col += b2 / 25.0 * 0.2;
      col *= vec3(1.02, 0.99, 0.97);
      col *= 1.0 + 0.015 * sin(uTime * 0.08);
      gl_FragColor = vec4(col, 1.0);
    }`
});
pSc.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), postMat));

// ═══════════════════════════════════ WORMHOLE GEOMETRY ═══════════════════════════════════
// Parametric surface of revolution: r(z) = throat * cosh(z / throat)
// Rendered as wireframe line segments — latitude rings + longitude meridians

const THROAT = 3.0;
const Z_MIN = -6.5, Z_MAX = 6.5;
const LAT_COUNT = M ? 40 : 65;   // rings along the length
const LON_COUNT = M ? 48 : 80;   // meridians around circumference
const RING_SEGS = M ? 80 : 128;  // vertices per ring (smoothness)

function wormholeR(z) {
  return THROAT * Math.cosh(z / THROAT);
}

// Build line geometry
const positions = [];

// Latitude rings (circles at each z)
for (let i = 0; i <= LAT_COUNT; i++) {
  const t = i / LAT_COUNT;
  const z = Z_MIN + t * (Z_MAX - Z_MIN);
  const r = wormholeR(z);
  for (let j = 0; j < RING_SEGS; j++) {
    const a1 = (j / RING_SEGS) * Math.PI * 2;
    const a2 = ((j + 1) / RING_SEGS) * Math.PI * 2;
    positions.push(
      Math.cos(a1) * r, z, Math.sin(a1) * r,
      Math.cos(a2) * r, z, Math.sin(a2) * r
    );
  }
}

// Longitude meridians (curves from z_min to z_max at each angle)
for (let j = 0; j < LON_COUNT; j++) {
  const a = (j / LON_COUNT) * Math.PI * 2;
  for (let i = 0; i < LAT_COUNT; i++) {
    const t1 = i / LAT_COUNT;
    const t2 = (i + 1) / LAT_COUNT;
    const z1 = Z_MIN + t1 * (Z_MAX - Z_MIN);
    const z2 = Z_MIN + t2 * (Z_MAX - Z_MIN);
    const r1 = wormholeR(z1);
    const r2 = wormholeR(z2);
    positions.push(
      Math.cos(a) * r1, z1, Math.sin(a) * r1,
      Math.cos(a) * r2, z2, Math.sin(a) * r2
    );
  }
}

const whGeo = new THREE.BufferGeometry();
whGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

const whU = { uAccent: { value: new THREE.Vector3(0.35, 0.35, 0.35) } };
const WH_GREY = new THREE.Vector3(0.35, 0.35, 0.35);
const WH_GOLD = new THREE.Vector3(0.769, 0.635, 0.396);
let whTarget = new THREE.Vector3().copy(WH_GREY);
const whMat = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: whU,
  vertexShader: `
    varying float vDist;
    varying float vDepth;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vDist = length(mv.xyz);
      vDepth = position.y; // Y is the wormhole axis (vertical)
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uAccent;
    varying float vDist;
    varying float vDepth;
    void main() {
      // Distance fade — close lines bright, far lines dim
      float distFade = smoothstep(50.0, 4.0, vDist);
      // Throat glow — lines near throat (y=0) slightly brighter
      float throatGlow = 1.0 + 0.3 * exp(-vDepth * vDepth * 0.15);
      float alpha = distFade * 0.55 * throatGlow;
      gl_FragColor = vec4(uAccent, alpha);
    }`
});

const wormhole = new THREE.LineSegments(whGeo, whMat);
// Orient horizontally initially — Y axis becomes the wormhole axis
// The camera will look down at it
S.add(wormhole);

// ═══════════════════════════════════ CAMERA ═══════════════════════════════════

const states = {
  home:     { pos: [0, 14, 14],    look: [0, -1, 0],   oR: 2.5, oH: 1,   oS: 0.02 },
  product:  { pos: [12, 10, 12],   look: [0, -1, 0],   oR: 1.5, oH: 0.8, oS: 0.015 },
  research: { pos: [-5, 16, 8],    look: [0, -1, 0],   oR: 1.5, oH: 0.6, oS: 0.018 },
  contact:  { pos: [-12, 10, 12],  look: [0, -1, 0],   oR: 1.5, oH: 0.8, oS: 0.015 }
};

let curSt = 'home';
let tPos = new THREE.Vector3(0, 14, 14), tLook = new THREE.Vector3(0, -1, 0);
let cPos = new THREE.Vector3(0, 14, 14), cLook = new THREE.Vector3(0, -1, 0);
let oA = 0, trans = false;
cam.position.copy(cPos); cam.lookAt(cLook);

window.co3Scene = {
  setState(n) {
    if (!states[n] || n === curSt) return;
    curSt = n; const s = states[n];
    tPos.set(s.pos[0], s.pos[1], s.pos[2]);
    tLook.set(s.look[0], s.look[1], s.look[2]);
    trans = true; setTimeout(() => { trans = false; }, 2200);
    aTgt.copy(n === 'product' ? GOLD : ORANGE);
    whTarget.copy(n === 'product' ? WH_GOLD : WH_GREY);
  },
  getState() { return curSt; }
};

// ═══════════════════════════════════ ANIMATION ═══════════════════════════════════

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  // Wormhole color lerp (grey ↔ gold for miji-verse)
  whU.uAccent.value.lerp(whTarget, dt * 1.5);

  // Wormhole slow rotation
  wormhole.rotation.y += dt * 0.02;

  // Camera
  const ls = trans ? 1.2 : 2.5;
  cPos.lerp(tPos, dt * ls);
  cLook.lerp(tLook, dt * ls);

  const s = states[curSt];
  oA += dt * s.oS;

  cam.position.set(
    cPos.x + Math.sin(oA) * s.oR + Math.sin(t * 0.08) * 0.12,
    cPos.y + Math.cos(t * 0.06) * 0.08,
    cPos.z + Math.cos(oA) * s.oR + Math.cos(t * 0.07) * 0.1
  );
  cam.lookAt(cLook.x, cLook.y, cLook.z);

  // Post
  postU.uTime.value = t;
  R.setRenderTarget(rt); R.render(S, cam); R.setRenderTarget(null);
  postU.tDiffuse.value = rt.texture;
  R.render(pSc, pCam);
}
animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  cam.aspect = w / h; cam.updateProjectionMatrix(); R.setSize(w, h);
  const p = Math.min(window.devicePixelRatio, M ? 1.5 : 2);
  rt.setSize(w * p, h * p); postU.uRes.value.set(w, h);
});

})();
