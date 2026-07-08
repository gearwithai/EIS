---
name: EIS
description: Work on the Bryton Roofs cinematic landing page (static HTML/CSS/JS concept build) — editing sections, animations, the AI estimator, or the pitch docs.
---

# EIS — Bryton Roofs Landing Page

This repo is a static, no-build-step landing page concept for Bryton Roofs
(a roofing company in Ayden/Greenville, NC), built by gearwithai for a
pre-discovery pitch. It has no framework or bundler — just `index.html`,
`css/`, `js/`, and CDN-loaded libraries (Lenis, GSAP + ScrollTrigger,
SplitType).

## When to use

Use this skill when editing `index.html`, `css/`, or `js/` in this repo —
adding/reworking sections, tuning scroll animations, adjusting the AI
instant-quote estimator, before/after sliders, or the booking widget — or
when updating the supporting docs (`STRATEGY-BRIEF.md`, `BLUEPRINT.md`,
`PITCH-SCRIPT.md`).

## Instructions

1. There is no build step. Preview changes by opening `index.html`
   directly or serving locally: `python3 -m http.server 8123`.
2. Respect `prefers-reduced-motion` fallbacks already wired into the GSAP/
   Lenis code — don't strip them when adding new motion.
3. Estimator pricing logic and constants live in `js/main.js`; keep base
   prices/multipliers isolated and easy to tune rather than hardcoding
   values inline in new code.
4. Known placeholders that must stay flagged until the client confirms
   real values (see `README.md` for the full list): the phone/SMS number,
   before/after + gallery images, review sources, and the `BRYTON750`
   promo code. Don't silently invent real-looking data for these.
5. Keep `STRATEGY-BRIEF.md`, `BLUEPRINT.md`, and `PITCH-SCRIPT.md` in sync
   with the live page when a section's copy or structure changes
   meaningfully.
