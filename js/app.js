/* =============================================================================
   GearWithAI V2 — Application layer
   Cinematic background video · Lenis smooth scroll · GSAP scroll motion
   Navigation · FAQ accordion · Contact form
   Progressive enhancement: content is fully usable without JS or with motion off.
   ========================================================================== */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  var isTouch = window.matchMedia("(hover: none)").matches;
  var hasGSAP = !!window.gsap;

  /* -------------------------------------------------------------------------
     1. Cinematic background video
     Ambient, muted, looped, never seeked (source has a single keyframe, so
     scrubbing/seeking would be janky — forward playback + loop stays smooth).
     ---------------------------------------------------------------------- */
  function initVideo() {
    var video = document.querySelector(".stage__video");
    if (!video) return;

    // Reduced-motion / Save-Data: don't fetch the video, keep the poster still.
    if (prefersReduced || saveData) {
      video.removeAttribute("autoplay");
      video.pause();
      // Show the poster frame instead of a blank element.
      video.classList.add("is-ready");
      return;
    }

    // As soon as the real video has painted a frame, cross-fade over the poster.
    var reveal = function () { video.classList.add("is-ready"); };
    video.addEventListener("loadeddata", reveal, { once: true });
    video.addEventListener("canplay", reveal, { once: true });
    video.addEventListener("playing", reveal, { once: true });
    if (video.readyState >= 2) reveal();

    // The autoplay attribute drives playback; call play() as a backup and, if the
    // browser blocks it, resume on the first user interaction.
    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === "function") {
        p.then(reveal).catch(function () {
          var resume = function () {
            video.play().then(reveal).catch(function () {});
            window.removeEventListener("pointerdown", resume);
            window.removeEventListener("touchstart", resume);
            window.removeEventListener("keydown", resume);
          };
          window.addEventListener("pointerdown", resume, { once: true });
          window.addEventListener("touchstart", resume, { once: true });
          window.addEventListener("keydown", resume, { once: true });
        });
      }
    };
    tryPlay();

    // Pause when the tab is hidden to save battery/CPU; resume when visible.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) video.pause();
      else tryPlay();
    });
  }

  /* -------------------------------------------------------------------------
     2. Smooth scroll (Lenis) + GSAP ScrollTrigger integration
     ---------------------------------------------------------------------- */
  var lenis = null;
  function initSmoothScroll() {
    if (prefersReduced || !window.Lenis) return;
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      lerp: 0.09,
      wheelMultiplier: 1
    });
    docEl.classList.add("lenis");

    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    // Anchor links go through Lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90, duration: 1.2 });
      });
    });
  }

  /* -------------------------------------------------------------------------
     3. Reveal animations
     GSAP when available; IntersectionObserver fallback keeps parity.
     ---------------------------------------------------------------------- */
  function initReveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    if (prefersReduced) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }

    if (hasGSAP && window.ScrollTrigger) {
      var gsap = window.gsap;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      items.forEach(function (el) {
        var delay = parseFloat(el.getAttribute("data-delay") || "0");
        var top = el.getBoundingClientRect().top;
        if (top < vh * 0.92) {
          // Already in view on load — play an immediate intro (no scroll dependency).
          gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "power3.out", delay: 0.15 + delay });
        } else {
          gsap.to(el, {
            opacity: 1, y: 0, scale: 1,
            duration: 1.0, ease: "power3.out", delay: delay,
            scrollTrigger: { trigger: el, start: "top 88%", once: true }
          });
        }
      });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
      items.forEach(function (el) { io.observe(el); });
    }
  }

  /* -------------------------------------------------------------------------
     4. Hero headline split-line reveal
     ---------------------------------------------------------------------- */
  function initHeroText() {
    if (prefersReduced || !hasGSAP) return;
    var gsap = window.gsap;
    document.querySelectorAll("[data-split]").forEach(function (el) {
      if (!window.SplitText) {
        gsap.from(el, { opacity: 0, y: 30, duration: 1, ease: "power3.out" });
        return;
      }
      var split = new window.SplitText(el, { type: "lines", linesClass: "split-line" });
      gsap.set(el, { opacity: 1 });
      gsap.from(split.lines, {
        yPercent: 118, opacity: 0,
        duration: 1.15, ease: "power4.out", stagger: 0.10,
        delay: parseFloat(el.getAttribute("data-split-delay") || "0.15")
      });
    });
  }

  /* -------------------------------------------------------------------------
     5. Number counters
     ---------------------------------------------------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      if (prefersReduced) { el.textContent = prefix + target.toFixed(decimals); return; }
      var start = null, dur = 1600;
      var tick = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toFixed(decimals);
      };
      requestAnimationFrame(tick);
    };

    if (hasGSAP && window.ScrollTrigger) {
      nums.forEach(function (el) {
        window.ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () { run(el); } });
      });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
      }, { threshold: 0.5 });
      nums.forEach(function (el) { io.observe(el); });
    }
  }

  /* -------------------------------------------------------------------------
     6. Background parallax + progressive scrim toward footer
     ---------------------------------------------------------------------- */
  function initStageMotion() {
    if (prefersReduced || !hasGSAP || !window.ScrollTrigger) return;
    var gsap = window.gsap;
    var video = document.querySelector(".stage__video");
    var scrim = document.querySelector(".stage__scrim");

    if (video) {
      gsap.to(video, {
        scale: 1.14, yPercent: 6, ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 }
      });
    }
    // Deepen the scrim as the visitor nears the footer (video resolves into the dark).
    var footer = document.querySelector(".footer");
    if (scrim && footer) {
      gsap.to(scrim, {
        opacity: 0.6, ease: "none",
        scrollTrigger: { trigger: footer, start: "top 80%", end: "top 20%", scrub: true }
      });
    }
  }

  /* -------------------------------------------------------------------------
     7. Navigation: scroll state, mobile menu, active link
     ---------------------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var toggle = nav.querySelector(".nav__toggle");
    var links = nav.querySelector(".nav__links");

    var progress = document.querySelector(".scroll-progress span");
    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle("is-scrolled", y > 24);
      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? Math.min(1, y / h) * 100 : 0) + "%";
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    };
    if (toggle) toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    if (links) links.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });

    // Active link
    var here = location.pathname.replace(/\/index\.html$/, "/").split("/").pop() || "index.html";
    nav.querySelectorAll(".nav__link").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href) return;
      var base = href.split("/").pop();
      if (base === here || (here === "" && base === "index.html")) a.setAttribute("aria-current", "page");
    });
  }

  /* -------------------------------------------------------------------------
     8. Micro-interactions: magnetic buttons + card pointer glow (desktop)
     ---------------------------------------------------------------------- */
  function initMicro() {
    if (prefersReduced || isTouch) return;

    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 0.28;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });

    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  }

  /* -------------------------------------------------------------------------
     9. FAQ accordion (accessible, animated height)
     ---------------------------------------------------------------------- */
  function initFAQ() {
    var items = document.querySelectorAll(".faq__item");
    if (!items.length) return;
    items.forEach(function (item) {
      var q = item.querySelector(".faq__q");
      var a = item.querySelector(".faq__a");
      if (!q || !a) return;
      q.addEventListener("click", function () {
        var open = item.classList.contains("is-open");
        // close siblings for a clean single-open accordion
        items.forEach(function (other) {
          if (other !== item && other.classList.contains("is-open")) {
            other.classList.remove("is-open");
            other.querySelector(".faq__q").setAttribute("aria-expanded", "false");
            var oa = other.querySelector(".faq__a");
            oa.style.height = oa.scrollHeight + "px";
            requestAnimationFrame(function () { oa.style.height = "0px"; });
          }
        });
        if (open) {
          a.style.height = a.scrollHeight + "px";
          requestAnimationFrame(function () { a.style.height = "0px"; });
          item.classList.remove("is-open");
          q.setAttribute("aria-expanded", "false");
        } else {
          item.classList.add("is-open");
          q.setAttribute("aria-expanded", "true");
          a.style.height = a.scrollHeight + "px";
          a.addEventListener("transitionend", function te() {
            if (item.classList.contains("is-open")) a.style.height = "auto";
            a.removeEventListener("transitionend", te);
          });
        }
        if (hasGSAP && window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 520);
      });
    });
  }

  /* -------------------------------------------------------------------------
     10. Contact / Book Demo form
     Client-side validation + graceful submit. If a real endpoint is set on the
     form's data-endpoint (e.g. a Formspree URL), it POSTs there; otherwise it
     falls back to composing a mailto so no lead is ever lost.
     ---------------------------------------------------------------------- */
  function initForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    var status = form.querySelector(".form__status");

    // Service interest chips -> hidden input
    var chips = form.querySelectorAll(".chip");
    var hidden = form.querySelector('input[name="service"]');
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var on = chip.getAttribute("aria-pressed") === "true";
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", on ? "false" : "true");
        if (hidden) hidden.value = on ? "" : chip.textContent.trim();
      });
    });

    var setError = function (field, msg) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("invalid", !!msg);
      var e = wrap.querySelector(".error-msg");
      if (e) e.textContent = msg || "";
    };

    var validate = function () {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (field) {
        var v = (field.value || "").trim();
        if (!v) { setError(field, "This field is required."); ok = false; return; }
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          setError(field, "Please enter a valid email address."); ok = false; return;
        }
        setError(field, "");
      });
      return ok;
    };

    form.querySelectorAll("[required]").forEach(function (field) {
      field.addEventListener("blur", function () {
        var v = (field.value || "").trim();
        if (!v) setError(field, "This field is required.");
        else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) setError(field, "Please enter a valid email address.");
        else setError(field, "");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (status) { status.className = "form__status"; status.textContent = ""; }
      if (!validate()) {
        if (status) { status.className = "form__status err"; status.textContent = "Please fix the highlighted fields."; }
        return;
      }
      var endpoint = form.getAttribute("data-endpoint");
      var data = new FormData(form);
      var btn = form.querySelector('button[type="submit"]');
      var done = function (ok) {
        if (!status) return;
        if (ok) {
          status.className = "form__status ok";
          status.textContent = "Thank you — your request is in. We'll reply within one business day.";
          form.reset();
          chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        } else {
          status.className = "form__status err";
          status.textContent = "Something went wrong. Please email us directly at hello@gearwithai.com.";
        }
        if (btn) { btn.disabled = false; btn.textContent = btn.getAttribute("data-label") || "Send request"; }
      };

      if (btn) { btn.setAttribute("data-label", btn.textContent); btn.disabled = true; btn.textContent = "Sending…"; }

      if (endpoint && /^https?:\/\//.test(endpoint)) {
        fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (r) { done(r.ok); })
          .catch(function () { done(false); });
      } else {
        // No backend configured — compose a mailto so the lead still reaches us.
        var lines = [];
        data.forEach(function (val, key) { if (val) lines.push(key + ": " + val); });
        var subject = encodeURIComponent("Demo request — " + (data.get("name") || "GearWithAI"));
        var body = encodeURIComponent(lines.join("\n"));
        window.location.href = "mailto:hello@gearwithai.com?subject=" + subject + "&body=" + body;
        setTimeout(function () { done(true); }, 400);
      }
    });
  }

  /* -------------------------------------------------------------------------
     11. GWAI live-call demo animation
     ---------------------------------------------------------------------- */
  function initCallCard() {
    var card = document.querySelector("[data-callcard]");
    if (!card) return;
    var steps = Array.prototype.slice.call(card.querySelectorAll("[data-b]"));
    if (!steps.length) return;
    if (prefersReduced) { card.classList.add("is-live"); steps.forEach(function (s) { s.classList.add("show"); }); return; }

    var timers = [];
    var run = function () {
      card.classList.add("is-live");
      steps.forEach(function (s) { s.classList.remove("show"); });
      steps.forEach(function (s, i) {
        timers.push(setTimeout(function () { s.classList.add("show"); }, 700 + i * 1150));
      });
      // hold, then replay the conversation
      timers.push(setTimeout(function () {
        steps.forEach(function (s) { s.classList.remove("show"); });
        timers.push(setTimeout(run, 800));
      }, 700 + steps.length * 1150 + 3400));
    };

    var started = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !started) { started = true; run(); }
        else if (!en.isIntersecting && started) { started = false; timers.forEach(clearTimeout); timers = []; }
      });
    }, { threshold: 0.25 });
    io.observe(card);
  }

  /* -------------------------------------------------------------------------
     12. GearBot floating chatbot (UI shell, ready for AI integration)
     ---------------------------------------------------------------------- */
  function initChatbot() {
    var root = document.querySelector("[data-gearbot]");
    if (!root) return;
    var launch = root.querySelector(".gearbot__launch");
    var panel = root.querySelector(".gearbot__panel");
    var closeBtn = root.querySelector(".gearbot__close");
    var log = root.querySelector("#gearbot-log");
    var form = root.querySelector("[data-gearbot-form]");
    var input = form.querySelector("input");
    var chipsWrap = root.querySelector("[data-gearbot-chips]");

    var open = function () {
      root.classList.add("is-open"); panel.hidden = false;
      launch.setAttribute("aria-expanded", "true");
      setTimeout(function () { input.focus(); }, 80);
    };
    var close = function () {
      root.classList.remove("is-open");
      launch.setAttribute("aria-expanded", "false");
      setTimeout(function () { panel.hidden = true; }, 320);
    };
    launch.addEventListener("click", function () { root.classList.contains("is-open") ? close() : open(); });
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("is-open")) close(); });

    var addMsg = function (html, who) {
      var d = document.createElement("div");
      d.className = "gearbot__msg gearbot__msg--" + who;
      d.innerHTML = html;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    };
    var reply = function (q) {
      var t = q.toLowerCase(), r;
      if (/cost|price|pricing|much|budget/.test(t))
        r = "Pricing depends on your call volume and the features you turn on — and because GWAI captures jobs you'd otherwise lose, it usually pays for itself fast (up to 10X ROI). The best way to get a real number is a quick demo: <a href='contact.html'>book one here</a>.";
      else if (/demo|book|talk|contact|call you|get started|sign up/.test(t))
        r = "Love it. You can <a href='contact.html'>book a demo here</a> — 30 minutes and we'll show GWAI answering exactly the way it would for your business.";
      else if (/integrat|crm|calendar|tool|software|connect/.test(t))
        r = "GWAI connects to 75+ CRM, calendar, dispatch, and marketing tools, with custom integrations on request. Tell us your stack on a <a href='contact.html'>quick demo</a>.";
      else if (/work|how|what|do you|does it|feature/.test(t))
        r = "GWAI answers your calls, texts, and web chats 24/7 — qualifying the customer, booking the appointment into your calendar, and following up automatically. Want to see it live? <a href='contact.html'>Book a demo</a>.";
      else
        r = "Great question. GWAI is the always-on AI assistant for contractors — it answers, books, and follows up 24/7. The fastest way to get specifics is a <a href='contact.html'>quick demo</a>.";
      setTimeout(function () { addMsg(r, "bot"); }, 650);
    };
    var send = function (q) { if (!q) return; addMsg(q.replace(/</g, "&lt;"), "user"); reply(q); };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q) return;
      input.value = ""; send(q);
    });
    if (chipsWrap) chipsWrap.addEventListener("click", function (e) {
      var c = e.target.closest(".gearbot__chip"); if (c) send(c.textContent.trim());
    });
  }

  /* -------------------------------------------------------------------------
     13. Footer year
     ---------------------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* -------------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  function boot() {
    if (hasGSAP && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
    initVideo();
    initSmoothScroll();
    initNav();
    initReveals();
    initHeroText();
    initCounters();
    initStageMotion();
    initMicro();
    initFAQ();
    initForm();
    initCallCard();
    initChatbot();
    initYear();

    if (hasGSAP && window.ScrollTrigger) {
      // Recalculate once fonts settle to avoid mis-triggered reveals.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
      }
      window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
