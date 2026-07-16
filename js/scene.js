/* ============================================================
   GearWithAI — Scene.js
   The 3D villa build-up + AI-activation layer.

   A procedural modern villa is assembled on mount, group by group
   (ground → foundation → structure → walls → roof → glass → details
   → landscaping), then an invisible layer of AI intelligence
   switches on: incoming signals answered, routed, and booked.

   No external GLB is required (fully self-contained, GitHub-Pages
   friendly). Camera keyframes for each narrative chapter are driven
   from main.js through window.GWAI_SCENE.

   Deliberate engineering choices for performance & resilience:
   - WebGL capability + prefers-reduced-motion detection with a
     graceful CSS fallback.
   - Device-pixel-ratio capped; a cheap blob "contact shadow" instead
     of real-time shadow maps; a single hemisphere + key + rim light.
   - One shared animation loop; full resource disposal on unload.
   ============================================================ */

import * as THREE from 'three';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 820px)').matches;

/* -------- WebGL capability check -------- */
function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) { return false; }
}

const canvas = document.getElementById('webgl');

if (!webglOK() || !canvas) {
  document.documentElement.classList.add('no-webgl');
  window.dispatchEvent(new CustomEvent('gwai:ready'));
} else {
  boot();
}

function boot() {
  const gsap = window.gsap; // optional; a tiny fallback tween is used if absent

  /* ---------------- Renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance'
  });
  const DPR_CAP = isMobile ? 1.4 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  /* ---------------- Scene & camera ---------------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060a0b, 0.017);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(12, 5.6, 16.5);

  // Camera rig: we lerp toward target pos / look each frame for cinematic ease.
  const camTarget = new THREE.Vector3(12, 5.6, 16.5);
  const lookTarget = new THREE.Vector3(0.3, 2.4, 0);
  const lookCurrent = new THREE.Vector3(0.3, 2.4, 0);

  /* ---------------- Lighting ---------------- */
  scene.add(new THREE.AmbientLight(0x2a3a3a, 0.5));

  const hemi = new THREE.HemisphereLight(0x9fb8ad, 0x0a1012, 0.7);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(10, 14, 12);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x34d3a6, 0.55);
  rim.position.set(-11, 6, -8);
  scene.add(rim);

  const fill = new THREE.PointLight(0x9ff0d0, 0.5, 60);
  fill.position.set(-4, 5, 10);
  scene.add(fill);

  /* ---------------- Materials ---------------- */
  const M = {
    wall:   new THREE.MeshStandardMaterial({ color: 0xeef2ee, roughness: 0.92, metalness: 0.02 }),
    trim:   new THREE.MeshStandardMaterial({ color: 0x141b1d, roughness: 0.7,  metalness: 0.2 }),
    roof:   new THREE.MeshStandardMaterial({ color: 0x232d30, roughness: 0.5,  metalness: 0.3 }),
    column: new THREE.MeshStandardMaterial({ color: 0xf2f5f1, roughness: 0.85, metalness: 0.02 }),
    found:  new THREE.MeshStandardMaterial({ color: 0x0d1416, roughness: 0.95, metalness: 0.05 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x0b1512, emissive: 0x9ff0d0, emissiveIntensity: 0.0, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.62 }),
    door:   new THREE.MeshStandardMaterial({ color: 0x0e1618, emissive: 0x34d3a6, emissiveIntensity: 0.0, roughness: 0.4, metalness: 0.3 }),
    ground: new THREE.MeshStandardMaterial({ color: 0x070c0d, roughness: 1.0, metalness: 0.0 }),
    drive:  new THREE.MeshStandardMaterial({ color: 0x0d1315, roughness: 0.95, metalness: 0.02 }),
    shrub:  new THREE.MeshStandardMaterial({ color: 0x15302a, roughness: 0.9, metalness: 0.0 }),
    trunk:  new THREE.MeshStandardMaterial({ color: 0x1c2426, roughness: 0.9, metalness: 0.0 })
  };
  const glassMats = [];   // collected to animate emissive on activation
  const disposables = new Set();

  /* ---------------- Build groups ---------------- */
  const groups = {
    ground:     new THREE.Group(),
    foundation: new THREE.Group(),
    structure:  new THREE.Group(),
    walls:      new THREE.Group(),
    roof:       new THREE.Group(),
    glass:      new THREE.Group(),
    details:    new THREE.Group(),
    landscape:  new THREE.Group()
  };
  Object.values(groups).forEach(g => scene.add(g));

  const villa = new THREE.Group();
  scene.add(villa);

  // helper: box whose base sits at y = baseY (pivot at bottom → clean vertical "rise")
  function box(w, h, d, mat, x, z, baseY = 0) {
    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(0, h / 2, 0);
    disposables.add(geo);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, baseY, z);
    return m;
  }

  /* ---- GROUND ---- */
  {
    const gGeo = new THREE.PlaneGeometry(120, 120);
    disposables.add(gGeo);
    const ground = new THREE.Mesh(gGeo, M.ground);
    ground.rotation.x = -Math.PI / 2;
    groups.ground.add(ground);

    // driveway paver field in front of the house
    const dGeo = new THREE.PlaneGeometry(26, 20);
    disposables.add(dGeo);
    const drive = new THREE.Mesh(dGeo, M.drive);
    drive.rotation.x = -Math.PI / 2;
    drive.position.set(1, 0.02, 12);
    groups.ground.add(drive);

    // soft "contact shadow" blob under the house (cheap, no shadow maps)
    const sGeo = new THREE.PlaneGeometry(30, 20);
    disposables.add(sGeo);
    const shadowTex = radialShadowTexture();
    const sMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.55, depthWrite: false });
    disposables.add(sMat);
    const blob = new THREE.Mesh(sGeo, sMat);
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(1, 0.03, 0.5);
    groups.ground.add(blob);
  }

  /* ---- FOUNDATION ---- */
  groups.foundation.add(box(11, 0.55, 8, M.found, -1.5, 0, 0));   // main slab
  groups.foundation.add(box(6, 0.5, 6, M.found, 5.5, 0, 0.5));    // wing slab
  groups.foundation.add(box(9, 0.35, 4.5, M.found, 0.5, 6.4, 0)); // porch/deck slab

  const BASE = 0.5; // walls start atop the slab

  /* ---- WALLS (main house = separate panels so it visibly assembles) ---- */
  const Hm = 3.4, Hw = 3.0, T = 0.28;
  // main house footprint: x[-6.5..3.5] (w10, cx -1.5), z[-3.5..3.5] (d7)
  groups.walls.add(box(10, Hm, T, M.wall, -1.5, -3.5, BASE));        // back wall
  groups.walls.add(box(T, Hm, 7, M.wall, -6.5, 0, BASE));            // left wall
  groups.walls.add(box(T, Hm, 7, M.wall, 3.5, 0, BASE));             // right wall (to wing)
  groups.walls.add(box(3.2, Hm, T, M.wall, -5.0, 3.5, BASE));        // front-left segment
  groups.walls.add(box(3.0, Hm, T, M.wall, 2.1, 3.5, BASE));         // front-right segment (gap = entrance/glass)
  // wing footprint: x[3.5..9] (w5.5 cx6.25), z[-2..3]
  groups.walls.add(box(5.5, Hw, T, M.wall, 6.25, -2.0, BASE));       // wing back
  groups.walls.add(box(T, Hw, 5, M.wall, 9.0, 0.5, BASE));           // wing right
  groups.walls.add(box(5.5, Hw, T, M.wall, 6.25, 3.0, BASE));        // wing front
  // low charcoal base band + a garden wall for depth
  groups.details.add(box(10.4, 0.55, 7.4, M.trim, -1.5, 0, BASE - 0.05)); // plinth main
  const boundary = box(0.3, 1.2, 9, M.trim, -8.6, 4, 0);
  groups.details.add(boundary);

  /* ---- STRUCTURE (porch columns + beams) ---- */
  for (let i = 0; i < 4; i++) {
    const cGeo = new THREE.CylinderGeometry(0.16, 0.16, Hm + 0.3, 16);
    cGeo.translate(0, (Hm + 0.3) / 2, 0);
    disposables.add(cGeo);
    const col = new THREE.Mesh(cGeo, M.column);
    col.position.set(-4.2 + i * 2.4, BASE, 5.6);
    groups.structure.add(col);
  }
  groups.structure.add(box(9.2, 0.4, 0.4, M.wall, -1.0, 5.6, BASE + Hm)); // front beam
  groups.structure.add(box(0.4, 0.4, 2.4, M.wall, -4.2, 4.4, BASE + Hm)); // side beam

  /* ---- ROOF (low hip roofs, drop in from above) ---- */
  function hipRoof(w, d, h, mat, x, z, y) {
    const geo = new THREE.ConeGeometry(1, h, 4);
    geo.rotateY(Math.PI / 4);
    disposables.add(geo);
    const m = new THREE.Mesh(geo, mat);
    const k = 1 / 0.7071;
    m.scale.set((w / 2) * k * 1.14, 1, (d / 2) * k * 1.14);
    m.position.set(x, y, z);
    return m;
  }
  const roofMain = hipRoof(11.4, 8.4, 2.3, M.roof, -1.5, 0, BASE + Hm + 1.15);
  const roofWing = hipRoof(6.6, 6.0, 1.7, M.roof, 6.25, 0.5, BASE + Hw + 0.85);
  const roofPorch = box(8.6, 0.3, 3.4, M.roof, 0.2, 5.5, BASE + Hm); // flat porch canopy
  groups.roof.add(roofMain, roofWing, roofPorch);
  // fascia trims
  groups.details.add(box(11.6, 0.3, 8.6, M.trim, -1.5, 0, BASE + Hm - 0.02));

  /* ---- GLASS (windows + entrance) ---- */
  function glassPanel(w, h, x, z, ry = 0) {
    const g = new THREE.PlaneGeometry(w, h);
    disposables.add(g);
    const mat = M.glass.clone();
    glassMats.push(mat);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, BASE + 0.2 + h / 2, z);
    m.rotation.y = ry;
    return m;
  }
  groups.glass.add(glassPanel(2.2, 2.4, -0.6, 3.52));      // entrance glass (front gap)
  groups.glass.add(glassPanel(2.6, 1.8, -5.0, 3.52));      // front-left window
  groups.glass.add(glassPanel(4.6, 2.2, 6.25, 3.02));      // wing front glass
  groups.glass.add(glassPanel(4.4, 2.0, 9.02, 0.5, Math.PI / 2)); // wing side glass
  groups.glass.add(glassPanel(3.0, 2.0, -6.52, 0, Math.PI / 2));  // main left window

  /* ---- DETAILS (door, chimney, planters) ---- */
  groups.details.add(box(1.2, 2.6, 0.15, M.door, 0.9, 3.5, BASE));   // entry door
  groups.details.add(box(0.9, 1.6, 0.9, M.trim, -4.5, -3.0, BASE + Hm + 0.6)); // chimney
  groups.details.add(box(2.0, 0.5, 0.6, M.trim, -0.6, 4.0, BASE));   // entry step planter

  /* ---- LANDSCAPE (shrubs, trees, planters) ---- */
  function shrub(x, z, r) {
    const g = new THREE.IcosahedronGeometry(r, 1);
    disposables.add(g);
    const m = new THREE.Mesh(g, M.shrub);
    m.position.set(x, r * 0.75, z);
    m.scale.y = 0.8;
    return m;
  }
  function tree(x, z) {
    const t = new THREE.Group();
    const tg = new THREE.CylinderGeometry(0.12, 0.16, 1.6, 8);
    tg.translate(0, 0.8, 0); disposables.add(tg);
    t.add(new THREE.Mesh(tg, M.trunk));
    const cg = new THREE.IcosahedronGeometry(0.95, 1); disposables.add(cg);
    const canopy = new THREE.Mesh(cg, M.shrub);
    canopy.position.y = 2.1; canopy.scale.set(1, 1.15, 1);
    t.add(canopy);
    t.position.set(x, 0, z);
    return t;
  }
  [[-6, 6, 0.6], [-5, 6.8, 0.45], [4.4, 5.2, 0.5], [3.4, 6.1, 0.4], [-7.2, 2, 0.55]]
    .forEach(([x, z, r]) => groups.landscape.add(shrub(x, z, r)));
  groups.landscape.add(tree(-8.5, 7.5), tree(9.5, 6.5));
  groups.landscape.add(box(3.2, 0.6, 1.0, M.trim, -6.4, 8.2, 0)); // long planter

  /* ---------------- AI ACTIVATION LAYER ---------------- */
  const fx = new THREE.Group();
  scene.add(fx);

  // drifting intelligence particles around the property
  let particles;
  {
    const N = isMobile ? 140 : 300;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    disposables.add(pGeo);
    const pMat = new THREE.PointsMaterial({
      color: 0x9ff0d0, size: 0.06, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    disposables.add(pMat);
    particles = new THREE.Points(pGeo, pMat);
    fx.add(particles);
  }

  // traveling signal dots on curved paths → "incoming call answered, routed, booked"
  const signalCurves = [
    new THREE.CatmullRomCurve3([ new THREE.Vector3(20, 1, 14), new THREE.Vector3(9, 4, 8), new THREE.Vector3(1, 5.5, 2), new THREE.Vector3(-2, 6.5, -2) ]),
    new THREE.CatmullRomCurve3([ new THREE.Vector3(-20, 1, -10), new THREE.Vector3(-9, 4, -4), new THREE.Vector3(-2, 6, 1), new THREE.Vector3(2, 7, 4) ]),
    new THREE.CatmullRomCurve3([ new THREE.Vector3(1, 7, 1), new THREE.Vector3(8, 6, 6), new THREE.Vector3(14, 4, 12), new THREE.Vector3(22, 2, 16) ]),
    new THREE.CatmullRomCurve3([ new THREE.Vector3(1, 7, 0), new THREE.Vector3(-8, 6, 5), new THREE.Vector3(-14, 4, 10), new THREE.Vector3(-22, 2, 14) ])
  ];
  const signals = [];
  {
    const sGeo = new THREE.SphereGeometry(0.14, 12, 12);
    disposables.add(sGeo);
    const trailGeo = new THREE.SphereGeometry(0.30, 12, 12);
    disposables.add(trailGeo);
    signalCurves.forEach((curve, i) => {
      const incoming = i < 2;              // first two arrive from outside (red → answered teal)
      const mat = new THREE.MeshBasicMaterial({ color: incoming ? 0xff4b3e : 0x34d3a6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      disposables.add(mat);
      const dot = new THREE.Mesh(sGeo, mat);
      const glowMat = new THREE.MeshBasicMaterial({ color: incoming ? 0xff4b3e : 0x9ff0d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      disposables.add(glowMat);
      const glow = new THREE.Mesh(trailGeo, glowMat);
      dot.add(glow);
      fx.add(dot);
      signals.push({ curve, dot, mat, glowMat, incoming, t: Math.random(), speed: 0.06 + Math.random() * 0.05 });
    });
  }

  /* ---------------- Build-up timeline (on mount) ---------------- */
  let activated = false;
  function activateAI() {
    activated = true;
    tween(M.glass && null, 0, 1, 1.6, v => {           // glow the glass
      glassMats.forEach(m => (m.emissiveIntensity = 0.9 * v));
      M.door.emissiveIntensity = 0.6 * v;
    });
    tween(null, 0, 1, 2.0, v => (particles.material.opacity = 0.5 * v));
    signals.forEach((s, i) => tween(null, 0, 1, 1.4, v => {
      s.mat.opacity = 0.95 * v; s.glowMat.opacity = 0.5 * v;
    }, i * 0.25));
  }

  function runConstruction() {
    if (prefersReduced) {
      // Reduced motion: present the finished, lit villa immediately.
      glassMats.forEach(m => (m.emissiveIntensity = 0.9));
      M.door.emissiveIntensity = 0.6;
      particles.material.opacity = 0.4;
      signals.forEach(s => { s.mat.opacity = 0.9; s.glowMat.opacity = 0.45; });
      activated = true;
      return;
    }

    const order = ['ground', 'foundation', 'structure', 'walls', 'roof', 'glass', 'details', 'landscape'];

    if (gsap) {
      const tl = gsap.timeline({ onComplete: activateAI });
      // ground settles
      groups.ground.scale.set(0.85, 0.85, 0.85);
      tl.from(groups.ground.scale, { x: 0.75, y: 0.75, z: 0.75, duration: 1.0, ease: 'power2.out' }, 0)
        .to(groups.ground.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'power2.out' }, 0.2);

      // foundation rises
      groups.foundation.children.forEach((m, i) => {
        m.scale.y = 0.001;
        tl.to(m.scale, { y: 1, duration: 0.5, ease: 'power3.out' }, 0.5 + i * 0.12);
      });
      // structure columns
      groups.structure.children.forEach((m, i) => {
        m.scale.y = 0.001;
        tl.to(m.scale, { y: 1, duration: 0.5, ease: 'back.out(1.6)' }, 1.0 + i * 0.06);
      });
      // walls assemble
      groups.walls.children.forEach((m, i) => {
        m.scale.y = 0.001;
        tl.to(m.scale, { y: 1, duration: 0.55, ease: 'power3.out' }, 1.2 + i * 0.09);
      });
      // roof drops from the sky
      groups.roof.children.forEach((m, i) => {
        const finalY = m.position.y;
        m.position.y = finalY + 9;
        m.material.opacity !== undefined && (m.material.transparent = true, m.material.opacity = 0);
        tl.to(m.position, { y: finalY, duration: 0.75, ease: 'power4.out' }, 2.3 + i * 0.14);
      });
      // glass resolves
      groups.glass.children.forEach((m, i) => {
        m.scale.set(0.01, 0.01, 0.01);
        tl.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power2.out' }, 2.9 + i * 0.07);
      });
      // details pop
      groups.details.children.forEach((m, i) => {
        m.scale.set(0.01, 0.01, 0.01);
        tl.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(1.5)' }, 3.1 + i * 0.05);
      });
      // landscaping grows
      groups.landscape.children.forEach((m, i) => {
        m.scale.set(0.01, 0.01, 0.01);
        tl.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(1.7)' }, 3.4 + i * 0.08);
      });
    } else {
      // No GSAP → drive the same sequence with our tiny tween helper.
      const seq = [];
      let t = 0.4;
      order.forEach(name => {
        groups[name].children.forEach((m, i) => {
          const isRoof = name === 'roof';
          const finalY = m.position.y;
          if (isRoof) m.position.y = finalY + 9; else m.scale.set(name === 'ground' ? 1 : 0.01, 0.01, name === 'ground' ? 1 : 0.01);
          seq.push({ m, isRoof, finalY, delay: t });
          t += 0.05;
        });
        t += 0.15;
      });
      seq.forEach(s => {
        if (s.isRoof) tween(null, 0, 1, 0.7, v => (s.m.position.y = s.finalY + 9 * (1 - v)), s.delay);
        else tween(null, 0, 1, 0.55, v => s.m.scale.setScalar(Math.max(0.01, v)), s.delay);
      });
      setTimeout(activateAI, (t + 0.6) * 1000);
    }
  }

  /* ---------------- Camera chapter views ---------------- */
  const VIEWS = {
    hero:         { pos: [12, 5.6, 16.5], look: [0.3, 2.4, 0] },
    problem:      { pos: [-13, 5, 13],   look: [0, 2.2, 0] },
    solution:     { pos: [0.5, 8, 18],   look: [0.5, 2.6, 0] },
    comms:        { pos: [9, 4.2, 12],   look: [2, 2.2, 3] },
    journey:      { pos: [15, 8.5, 6],   look: [1, 2.4, 0] },
    followup:     { pos: [-11, 6, -10],  look: [0, 2.6, 0] },
    capabilities: { pos: [0.5, 15, 17],  look: [0.5, 1.4, 0] },
    industries:   { pos: [13, 4.2, -9],  look: [0, 2.2, 0] },
    how:          { pos: [-13, 7.5, 13], look: [0, 2.5, 0] },
    final:        { pos: [11, 6, 16],    look: [0.5, 2.4, 0] }
  };

  /* ---------------- Public API for main.js ---------------- */
  window.GWAI_SCENE = {
    ready: true,
    reduced: prefersReduced,
    goto(name, instant = false) {
      const v = VIEWS[name] || VIEWS.hero;
      camTarget.set(v.pos[0], v.pos[1], v.pos[2]);
      lookTarget.set(v.look[0], v.look[1], v.look[2]);
      if (instant) {
        camera.position.copy(camTarget);
        lookCurrent.copy(lookTarget);
      }
    },
    // subtle scroll-linked parallax nudge within a chapter (0..1)
    nudge(dx, dy) { parallax.x = dx; parallax.y = dy; }
  };
  const parallax = { x: 0, y: 0 };

  /* ---------------- Render loop ---------------- */
  const clock = new THREE.Clock();
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', e => {
    mouse.x = (e.clientX / window.innerWidth - 0.5);
    mouse.y = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  let firstFrame = false;
  const camLerp = prefersReduced ? 1 : 0.045;

  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // cinematic camera easing toward target + gentle drift + pointer parallax
    const drift = prefersReduced ? 0 : Math.sin(t * 0.18) * 0.6;
    const px = prefersReduced ? 0 : (mouse.x * 1.6 + parallax.x * 2);
    const py = prefersReduced ? 0 : (-mouse.y * 0.9 + parallax.y);
    camera.position.x += (camTarget.x + drift + px - camera.position.x) * camLerp;
    camera.position.y += (camTarget.y + py - camera.position.y) * camLerp;
    camera.position.z += (camTarget.z - camera.position.z) * camLerp;
    lookCurrent.lerp(lookTarget, camLerp * 1.4);
    camera.lookAt(lookCurrent);

    // living scene once activated
    if (activated && !prefersReduced) {
      particles.rotation.y = t * 0.02;
      particles.material.opacity = 0.4 + Math.sin(t * 0.8) * 0.08;

      signals.forEach(s => {
        s.t += dt * s.speed;
        if (s.t > 1) s.t -= 1;
        const p = s.curve.getPointAt(s.t);
        s.dot.position.copy(p);
        const pulse = 0.7 + Math.sin(t * 6 + s.t * 10) * 0.3;
        s.dot.scale.setScalar(pulse);
        // incoming signals shift red → teal as they reach the house (answered)
        if (s.incoming) {
          const answered = Math.min(1, s.t * 1.6);
          s.mat.color.setHex(answered > 0.55 ? 0x34d3a6 : 0xff4b3e);
          s.glowMat.color.setHex(answered > 0.55 ? 0x9ff0d0 : 0xff6a5f);
        }
      });
      // faint window breathing
      const b = 0.9 + Math.sin(t * 1.1) * 0.12;
      glassMats.forEach(m => (m.emissiveIntensity = b));
    }

    renderer.render(scene, camera);

    if (!firstFrame) {
      firstFrame = true;
      window.dispatchEvent(new CustomEvent('gwai:ready'));
    }
    rafId = requestAnimationFrame(render);
  }

  /* ---------------- Resize ---------------- */
  let resizeRAF;
  function onResize() {
    cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    });
  }
  window.addEventListener('resize', onResize);

  /* ---------------- Cleanup ---------------- */
  let rafId;
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    disposables.forEach(d => d.dispose && d.dispose());
    Object.values(M).forEach(m => m.dispose && m.dispose());
    renderer.dispose();
  });

  /* ---------------- Kick off ---------------- */
  window.GWAI_SCENE.goto('hero', true);
  runConstruction();
  render();

  /* ============ tiny tween + texture helpers ============ */
  function tween(_unused, from, to, dur, onUpdate, delay = 0) {
    const start = performance.now() + delay * 1000;
    function step(now) {
      if (now < start) { requestAnimationFrame(step); return; }
      const k = Math.min(1, (now - start) / (dur * 1000));
      const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
      onUpdate(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function radialShadowTexture() {
    const s = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    disposables.add(tex);
    return tex;
  }
}
