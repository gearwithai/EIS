/* ============================================================
   Bryton Roofs — motion engine + interactions
============================================================ */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- LOADER ---------- */
  const loader = document.getElementById('loader');
  const bar = loader.querySelector('.loader__bar span');
  if (!reduceMotion && window.gsap) {
    gsap.to(bar, { width: '100%', duration: 1.0, ease: 'power2.inOut' });
  }
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('is-done');
      startHero();
    }, reduceMotion ? 0 : 700);
  });

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
  // anchor links → smooth
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

    // line reveals on h2 via SplitType
    document.querySelectorAll('.reveal-line').forEach(el => {
      let target = el;
      if (window.SplitType) { const s = new SplitType(el, { types: 'lines' }); target = s.lines; }
      gsap.set(target, { opacity: 0, yPercent: 60 });
      ScrollTrigger.create({
        trigger: el, start: 'top 82%',
        onEnter: () => gsap.to(target, { opacity: 1, yPercent: 0, duration: 1, stagger: .1, ease: 'power4.out' })
      });
    });

    // generic reveal-up
    document.querySelectorAll('.reveal-up').forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') });
    });

    // parallax
    document.querySelectorAll('[data-parallax]').forEach(el => {
      gsap.to(el, {
        yPercent: parseFloat(el.dataset.parallax) * 40,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top top', end: 'bottom top', scrub: true }
      });
    });

    // count-up stats
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

  /* ============================================================
     AI INSTANT QUOTE ESTIMATOR
  ============================================================ */
  const est = {
    step: 1, total: 5,
    data: { base: 14000, mult: 1, cmult: 1 },
    els: {
      steps: [...document.querySelectorAll('.step')],
      progress: document.getElementById('estProgress'),
      back: document.getElementById('estBack'),
      calc: document.getElementById('calc'),
      result: document.getElementById('result'),
    }
  };
  function showStep(n) {
    est.step = n;
    est.els.steps.forEach(s => s.classList.toggle('is-active', +s.dataset.step === n));
    est.els.progress.style.width = Math.min(n, est.total) / est.total * 100 + '%';
    est.els.back.hidden = n === 1;
  }
  document.querySelectorAll('.opt').forEach(opt => {
    opt.addEventListener('click', () => {
      // mark selected within step
      opt.parentElement.querySelectorAll('.opt').forEach(o => o.classList.remove('is-sel'));
      opt.classList.add('is-sel');
      const k = opt.dataset;
      if (k.base) est.data.base = +k.base;
      if (k.mult) est.data.mult = +k.mult;
      if (k.cmult) est.data.cmult = +k.cmult;
      if (k.key === 'project') est.data.project = k.val;
      if (k.key === 'timeline') est.data.timeline = k.val;
      if (k.key === 'material') est.data.material = k.val;
      setTimeout(() => est.step < est.total ? showStep(est.step + 1) : runCalc(), 240);
    });
  });
  est.els.back.addEventListener('click', () => { if (est.step > 1) showStep(est.step - 1); });

  function runCalc() {
    showStep(6);
    est.els.calc.style.display = 'flex';
    est.els.result.hidden = true;
    const mid = est.data.base * est.data.mult * est.data.cmult;
    const low = Math.round(mid * 0.85 / 500) * 500;
    const high = Math.round(mid * 1.18 / 500) * 500;
    const monthly = Math.round(mid * 1.0 * (0.09990 / 12) / (1 - Math.pow(1 + 0.0999 / 12, -84)));
    setTimeout(() => {
      est.els.calc.style.display = 'none';
      est.els.result.hidden = false;
      countTo(document.getElementById('estLow'), low);
      countTo(document.getElementById('estHigh'), high);
      countTo(document.getElementById('estMonthly'), monthly, '/mo');
      const storm = /storm|emergency/i.test((est.data.project || '') + (est.data.timeline || ''));
      document.getElementById('stormNote').hidden = !storm;
    }, reduceMotion ? 0 : 1500);
  }
  function countTo(el, val, suffix = '') {
    if (reduceMotion || !window.gsap) { el.textContent = '$' + val.toLocaleString() + suffix; return; }
    gsap.to({ v: 0 }, { v: val, duration: 1.1, ease: 'power2.out', onUpdate() { el.textContent = '$' + Math.round(this.targets()[0].v).toLocaleString() + suffix; } });
  }
  document.getElementById('lockForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    f.innerHTML = `<p style="font-family:'Fraunces',serif;font-size:24px;color:var(--ember-2)">Quote locked, ${f.name.value.split(' ')[0] || 'thanks'}! 🎉</p><p style="color:var(--ink-soft);margin-top:10px">A Bryton crew will text ${f.phone.value} within the hour to confirm your free inspection.</p>`;
  });

  /* ---------- STORM SECTION MODE ---------- */
  // visually intensify storm section when emergency chosen
  const stormSection = document.getElementById('storm');
  document.querySelectorAll('.opt[data-key="timeline"]').forEach(o => {
    o.addEventListener('click', () => stormSection.classList.toggle('is-active', /emergency/i.test(o.dataset.val)));
  });

  /* ---------- BEFORE / AFTER SLIDERS ---------- */
  document.querySelectorAll('.ba').forEach(ba => {
    const range = ba.querySelector('.ba__range');
    const before = ba.querySelector('.ba__before');
    const handle = ba.querySelector('.ba__handle');
    const update = () => {
      const v = range.value;
      before.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
      handle.style.left = v + '%';
    };
    range.addEventListener('input', update); update();
  });

  /* ---------- FINANCE SLIDER ---------- */
  const finRange = document.getElementById('finRange');
  const finProject = document.getElementById('finProject');
  const finMonthly = document.getElementById('finMonthly');
  const calcMonthly = p => Math.round(p * (0.0999 / 12) / (1 - Math.pow(1 + 0.0999 / 12, -84)));
  finRange.addEventListener('input', () => {
    const p = +finRange.value;
    finProject.textContent = '$' + p.toLocaleString();
    finMonthly.textContent = '$' + calcMonthly(p) + '/mo';
  });
  finRange.dispatchEvent(new Event('input'));

  /* ---------- BOOKING WIDGET ---------- */
  const datesWrap = document.getElementById('bookDates');
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
})();
