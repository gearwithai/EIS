/* ============================================================
   Bryton Roofs — motion engine + interactions
============================================================ */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- LOADER (always dismisses; never blocks content) ---------- */
  const loader = document.getElementById('loader');
  const bar = loader.querySelector('.loader__bar span');
  if (!reduceMotion && window.gsap) {
    gsap.to(bar, { width: '100%', duration: 1.0, ease: 'power2.inOut' });
  }
  let heroStarted = false;
  function dismissLoader() {
    if (heroStarted) return;
    heroStarted = true;
    loader.classList.add('is-done');
    startHero();
  }
  if (document.readyState === 'complete') setTimeout(dismissLoader, reduceMotion ? 0 : 400);
  else window.addEventListener('load', () => setTimeout(dismissLoader, reduceMotion ? 0 : 500));
  setTimeout(dismissLoader, 2200);

  /* ---------- HERO SLOW-MOTION VIDEO ---------- */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    const slow = () => { try { heroVideo.playbackRate = 0.55; } catch (e) {} };
    heroVideo.addEventListener('loadedmetadata', slow);
    heroVideo.addEventListener('canplay', () => { slow(); heroVideo.classList.add('is-ready'); });
    heroVideo.addEventListener('loadeddata', () => heroVideo.classList.add('is-ready'));
    const p = heroVideo.play && heroVideo.play();
    if (p && p.catch) p.catch(() => {});
  }

  /* ---------- LENIS SMOOTH SCROLL ---------- */
  let lenis;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, lerp: 0.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(el, { offset: -10 }) : el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- CUSTOM CURSOR ---------- */
  if (!isTouch && !reduceMotion) {
    const cur = document.querySelector('.cursor');
    const dot = cur.querySelector('.cursor__dot');
    const ring = cur.querySelector('.cursor__ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
    (function loop() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    const setState = (s) => { cur.classList.remove('is-hover', 'is-text', 'is-drag'); if (s) cur.classList.add('is-' + s); };
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      setState(t ? t.dataset.cursor : null);
    });
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (!isTouch && !reduceMotion && window.gsap) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * .35, y: (e.clientY - (r.top + r.height / 2)) * .5, duration: .4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' }));
    });
  }

  /* ---------- HERO INTRO ---------- */
  function startHero() {
    if (reduceMotion || !window.gsap) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    document.querySelectorAll('.hero__title .line').forEach(line => {
      const inner = document.createElement('span');
      inner.style.display = 'block';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
      gsap.set(inner, { yPercent: 110 });
    });
    tl.to('.hero__eyebrow', { opacity: 1, y: 0, duration: .8 })
      .to('.hero__title .line span', { yPercent: 0, duration: 1.1, stagger: .12 }, '-=.4')
      .to('.hero__sub', { opacity: 1, y: 0, duration: .8 }, '-=.6')
      .to('.hero__cta', { opacity: 1, y: 0, duration: .8 }, '-=.6');
  }

  /* ---------- SCROLL REVEALS + PARALLAX ---------- */
  if (!reduceMotion && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal-line').forEach(el => {
      let target = el;
      if (window.SplitType) { const s = new SplitType(el, { types: 'lines' }); target = s.lines; }
      gsap.set(target, { opacity: 0, yPercent: 60 });
      ScrollTrigger.create({
        trigger: el, start: 'top 82%',
        onEnter: () => gsap.to(target, { opacity: 1, yPercent: 0, duration: 1, stagger: .1, ease: 'power4.out' })
      });
    });

    document.querySelectorAll('.reveal-up').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') });
    });

    document.querySelectorAll('[data-parallax]').forEach(el => {
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.parallax) * 40,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top top', end: 'bottom top', scrub: true }
      });
    });

    document.querySelectorAll('.num[data-count]').forEach(el => {
      const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to({ v: 0 }, { v: end, duration: 1.6, ease: 'power2.out', onUpdate() { el.textContent = this.targets()[0].v.toFixed(dec); } })
      });
    });
  } else {
    document.querySelectorAll('.reveal-up,.reveal-line').forEach(el => el.classList.add('is-in'));
    document.querySelectorAll('.num[data-count]').forEach(el => el.textContent = (+el.dataset.count).toFixed(+el.dataset.dec || 0));
  }

  /* ---------- NAV + STICKY BAR STATE ---------- */
  const nav = document.getElementById('nav');
  const sticky = document.getElementById('sticky');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 60);
    sticky.classList.toggle('is-show', y > innerHeight * 0.7);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- BEFORE / AFTER SLIDERS (pointer + touch drag) ---------- */
  document.querySelectorAll('.ba').forEach(ba => {
    const range = ba.querySelector('.ba__range');
    const before = ba.querySelector('.ba__before');
    const handle = ba.querySelector('.ba__handle');
    let dragging = false;
    const setPct = (pct) => {
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = pct + '%';
      if (range) range.value = pct;
    };
    const fromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      const cx = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
      setPct((cx - r.left) / r.width * 100);
    };
    ba.addEventListener('pointerdown', e => { dragging = true; try { ba.setPointerCapture(e.pointerId); } catch (x) {} fromEvent(e); });
    ba.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
    ba.addEventListener('pointerup', () => { dragging = false; });
    ba.addEventListener('pointercancel', () => { dragging = false; });
    if (range) range.addEventListener('input', () => setPct(+range.value));
    setPct(50);
  });

  /* ---------- BOOKING WIDGET ---------- */
  const datesWrap = document.getElementById('bookDates');
  if (datesWrap) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bdate'; b.dataset.cursor = 'hover';
      b.innerHTML = `<small>${days[d.getDay()]} ${months[d.getMonth()]}</small><b>${d.getDate()}</b>`;
      b.addEventListener('click', () => { datesWrap.querySelectorAll('.bdate').forEach(x => x.classList.remove('is-sel')); b.classList.add('is-sel'); });
      datesWrap.appendChild(b);
    }
    datesWrap.firstChild.classList.add('is-sel');
    document.querySelectorAll('.time').forEach(t => t.addEventListener('click', () => {
      document.querySelectorAll('.time').forEach(x => x.classList.remove('is-sel')); t.classList.add('is-sel');
    }));
    document.querySelector('.time').classList.add('is-sel');
    document.getElementById('booking').addEventListener('submit', e => {
      e.preventDefault();
      const msg = document.getElementById('bookMsg');
      const date = datesWrap.querySelector('.is-sel b').textContent;
      const time = document.querySelector('.time.is-sel').textContent;
      msg.hidden = false;
      msg.textContent = `You're booked for the ${date}th at ${time}. We'll text a confirmation shortly — see you then!`;
    });
  }
})();
