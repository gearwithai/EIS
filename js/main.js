/* ============================================================
   GearWithAI — main.js
   App-layer orchestration: loader, smooth scroll, GSAP ScrollTrigger
   camera choreography through the persistent 3D scene, text reveals,
   nav behavior, magnetic buttons, chat playback, count-ups, and the
   Book-A-Demo form. Degrades gracefully without WebGL / GSAP and
   respects prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const hasGSAP = !!window.gsap;
  const ST = window.ScrollTrigger;
  if (hasGSAP && ST) gsap.registerPlugin(ST);

  /* ---------------- Reveal guarantee ----------------
     The body is held at opacity 0 to avoid a flash before styling.
     Never let it stay trapped there if the scene/loader hiccups. */
  const revealBody = () => html.classList.add('ready');
  setTimeout(revealBody, 2200);
  window.addEventListener('load', () => setTimeout(revealBody, 60));

  /* ---------------- Loader ---------------- */
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loaderBar');
  let sceneReady = false, minTimeDone = false, hidden = false;

  if (loaderBar) {
    // animate the bar to ~92% while we wait, then finish on ready
    if (hasGSAP) gsap.to(loaderBar, { width: '92%', duration: 1.4, ease: 'power2.out' });
    else loaderBar.style.transition = 'width 1.4s ease', requestAnimationFrame(() => (loaderBar.style.width = '92%'));
  }
  setTimeout(() => { minTimeDone = true; tryHideLoader(); }, 900);
  window.addEventListener('gwai:ready', () => { sceneReady = true; tryHideLoader(); }, { once: true });
  // safety net: never trap the user behind the loader
  setTimeout(() => { sceneReady = true; tryHideLoader(); }, 4000);

  function tryHideLoader() {
    if (hidden || !minTimeDone || !sceneReady) return;
    hidden = true;
    if (loaderBar) loaderBar.style.width = '100%';
    html.classList.add('ready');
    setTimeout(() => loader && loader.classList.add('done'), 260);
  }

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (ST) { lenis.on('scroll', ST.update); }
  }

  // anchor links → smooth scroll + close mobile nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      closeNav();
      if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.1 });
      else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------------- Nav ---------------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  function closeNav() { nav.classList.remove('open'); navToggle && navToggle.setAttribute('aria-expanded', 'false'); }
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------------- Text reveals ---------------- */
  function splitLines() {
    document.querySelectorAll('.reveal-line').forEach(el => {
      if (el.dataset.split) return;
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(w => `<span class="word"><span class="word__i">${w}</span></span>`).join(' ');
      el.dataset.split = '1';
    });
  }

  function initReveals() {
    if (!hasGSAP || !ST || reduced) {
      // no-motion fallback: everything visible
      document.querySelectorAll('.reveal-up').forEach(el => (el.style.opacity = 1, el.style.transform = 'none'));
      return;
    }
    splitLines();

    // headline word reveals
    document.querySelectorAll('.reveal-line').forEach(el => {
      const inner = el.querySelectorAll('.word__i');
      gsap.set(inner, { yPercent: 120 });
      ST.create({
        trigger: el, start: 'top 85%',
        onEnter: () => gsap.to(inner, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.05 })
      });
    });

    // generic up-reveals (batched for performance); hero handled by initHero
    const ups = Array.from(document.querySelectorAll('.reveal-up')).filter(el => !el.closest('.hero'));
    gsap.set(ups, { opacity: 0, y: 26 });
    ST.batch(ups, {
      start: 'top 88%',
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true })
    });
  }

  /* ---------------- Camera choreography ---------------- */
  function initSceneScroll() {
    const S = window.GWAI_SCENE;
    const sections = Array.from(document.querySelectorAll('.chapter[data-scene]'));
    if (!ST) return;

    sections.forEach(sec => {
      const name = sec.dataset.scene;
      const link = document.querySelector(`.nav__links a[href="#${sec.id}"]`);
      ST.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: self => {
          if (self.isActive) {
            if (S && S.ready) S.goto(name);
            setActiveLink(sec.id);
          }
        },
        // subtle within-section parallax nudge on the camera
        onUpdate: self => { if (S && S.ready && self.isActive) S.nudge((self.progress - 0.5) * 0.6, (self.progress - 0.5) * 0.3); }
      });
    });
  }

  function setActiveLink(id) {
    document.querySelectorAll('.nav__links a').forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  }

  /* ---------------- Chat playback (chapter 04) ---------------- */
  function initChat() {
    const chat = document.getElementById('chatDemo');
    if (!chat) return;
    if (reduced) { chat.classList.add('play'); return; }
    if (ST) {
      ST.create({ trigger: chat, start: 'top 75%', once: true, onEnter: () => chat.classList.add('play') });
    } else {
      chat.classList.add('play');
    }
  }

  /* ---------------- Count-ups (chapter 02) ---------------- */
  function initCounts() {
    document.querySelectorAll('.stat__num').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const prefix = (el.dataset.prefix || '').replace('&lt;', '<');
      const suffix = el.dataset.suffix || '';
      const render = v => (el.textContent = prefix + (Number.isInteger(target) ? Math.round(v) : v.toFixed(1)) + suffix);
      if (reduced || !ST) { render(target); return; }
      let done = false;
      ST.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => {
          if (done) return; done = true;
          const obj = { v: 0 };
          if (hasGSAP) gsap.to(obj, { v: target, duration: 1.4, ease: 'power2.out', onUpdate: () => render(obj.v) });
          else render(target);
        }
      });
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  function initMagnetic() {
    if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.magnetic').forEach(el => {
      let hovering = false;
      el.addEventListener('pointerenter', () => (hovering = true));
      el.addEventListener('pointermove', e => {
        if (!hovering) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.4;
        if (hasGSAP) gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' });
        else el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        hovering = false;
        if (hasGSAP) gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
        else el.style.transform = '';
      });
    });
  }

  /* ---------------- Book-A-Demo form ---------------- */
  function initForm() {
    const form = document.getElementById('demoForm');
    if (!form) return;
    const msg = document.getElementById('formMsg');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.querySelector('#f-name');
      const contact = form.querySelector('#f-contact');
      if (!name.value.trim() || !contact.value.trim()) {
        show('Please add your name and an email or phone so we can reach you.', false);
        (!name.value.trim() ? name : contact).focus();
        return;
      }
      const first = name.value.trim().split(' ')[0];
      show(`Thanks, ${first} — your demo request is in. We'll reach out shortly to schedule your walkthrough.`, true);
      form.reset();
    });
    function show(text, ok) {
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = text;
      msg.style.color = ok ? 'var(--mint)' : 'var(--red-2)';
    }
  }

  /* ---------------- Hero intro ---------------- */
  function initHero() {
    const lines = document.querySelectorAll('.hero__title .line');
    lines.forEach(l => { if (!l.querySelector('.line__i')) l.innerHTML = `<span class="line__i">${l.innerHTML}</span>`; });
    const inner = document.querySelectorAll('.hero__title .line__i');
    const heroBits = document.querySelectorAll('.hero .reveal-up');
    if (reduced || !hasGSAP) {
      heroBits.forEach(b => (b.style.opacity = 1, b.style.transform = 'none'));
      return;
    }
    const tl = gsap.timeline({ delay: 0.35 });
    gsap.set(inner, { yPercent: 115 });
    tl.to(inner, { yPercent: 0, duration: 1.0, ease: 'power4.out', stagger: 0.12 })
      .to(heroBits, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }, '-=0.5');
  }

  /* ---------------- Boot ---------------- */
  function start() {
    document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
    initHero();
    initReveals();
    initSceneScroll();
    initChat();
    initCounts();
    initMagnetic();
    initForm();
    if (ST) ST.refresh();
  }

  // main.js is deferred, so DOM is parsed. GSAP/ScrollTrigger are also
  // deferred and appear before this script, so they're available now.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // recalc triggers after full load (fonts/scene can shift layout)
  window.addEventListener('load', () => { if (ST) ST.refresh(); });
})();
