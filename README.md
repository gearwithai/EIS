# Bryton Roofs — Luxury Motion Landing Page (Concept Build)

A cinematic, AI-enhanced landing page concept for **Bryton Roofs** (Ayden / Greenville, NC), built by gearwithai.com for the pre-discovery pitch. Motion language is inspired by [Samana Studio](https://samanastudio.es) — immersive, momentum-scrolled, text-revealing.

## Run it
No build step. Open `index.html`, or serve locally:
```bash
python3 -m http.server 8123   # then visit http://localhost:8123
```

## Stack
- **Lenis** — momentum smooth scroll
- **GSAP + ScrollTrigger** — line/parallax reveals, count-ups, magnetic buttons
- **SplitType** — per-line headline reveals
- Vanilla JS for the AI estimator, before/after sliders, financing calculator, and booking widget
- Loaded via CDN; fully static; `prefers-reduced-motion` fallbacks included

## What's interactive
- **AI Instant Quote** (`#quote`) — 5-step branching estimator → animated price range + financing + storm/insurance branch + lead capture
- **Before/After** sliders, **financing** payment slider, **booking** date/time picker, **sticky** call/text/quote bar, **custom cursor**, **storm mode**

## The docs
- `STRATEGY-BRIEF.md` — Phase 1 research + Phase 2 strategy (sourced, with unverified items flagged)
- `BLUEPRINT.md` — Phase 3 section-by-section blueprint
- `PITCH-SCRIPT.md` — Phase 4 call opener + discovery questions

## Before going live — replace placeholders
- **Phone/text number** (`tel:`/`sms:` in `index.html`) — could not verify; origin blocked automated reads. Confirm with client.
- **Before/After + gallery images** — swap CSS placeholders for the 24+ Facebook/Yelp project photos.
- **Reviews** — wire Google/Yelp/Facebook APIs; current quotes are real themes surfaced in research.
- **Estimator pricing constants** (`js/main.js`) — tune base/multipliers to Bryton's real pricing.
- **Promo** (`BRYTON750`) — confirm or replace with a live offer.
