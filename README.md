# GearWithAI — Cinematic 3D Website

A premium, scroll-driven, cinematic marketing site for **GearWithAI** — the AI
customer-experience and automation platform built for home-service contractors
(roofing, HVAC, plumbing, electrical, landscaping, painting, remodeling, solar,
restoration, pest control, garage doors, general contracting).

The concept — **"The Intelligent Home-Service Ecosystem"** — anchors the whole
site on a procedurally-built modern villa that assembles itself on load, then
switches on an invisible layer of AI intelligence (incoming signals answered,
routed, booked, and followed up) as the visitor scrolls through ten narrative
chapters.

The single message a contractor should get in five seconds:
> An always-on AI system that captures leads, responds instantly 24/7, books
> appointments, and follows up automatically — so no opportunity slips away.

## Run it

No build step. Serve the folder statically:

```bash
python3 -m http.server 8137    # then open http://localhost:8137
```

Deploys as-is to GitHub Pages (`.nojekyll` is included).

## Stack & architecture

- **Three.js** (ES module via importmap) — the persistent, fixed-canvas 3D scene.
- **GSAP + ScrollTrigger** — construction timeline and scroll choreography.
- **Lenis** — momentum smooth scrolling.
- **Vanilla JS + modern CSS** — UI layer, no framework/bundler required.

All libraries are **vendored locally** under `js/vendor/` — there is no runtime
CDN dependency, so the site loads fast, works offline, and can't break from a
CDN outage.

### Files

| File | Role |
|------|------|
| `index.html` | Semantic layout, all ten chapters, full final copy, SEO/JSON-LD. |
| `css/style.css` | Design system (deep-charcoal base · pistachio/teal accent · red for urgency only), all section styling, responsive + reduced-motion. |
| `js/scene.js` | **The 3D villa.** Procedural geometry grouped into construction stages (ground → foundation → structure → walls → roof → glass → details → landscaping), a mount-time build-up timeline, the AI-activation signal/particle layer, and per-chapter camera keyframes. Exposes `window.GWAI_SCENE`. |
| `js/main.js` | App orchestration: loader, smooth scroll, ScrollTrigger camera choreography, text reveals, magnetic buttons, chat playback, stat count-ups, and the Book-A-Demo form. |
| `js/vendor/` | Self-hosted Three.js, GSAP, ScrollTrigger, Lenis. |

> **Note on the R3F/GLB brief:** this repo deploys as a no-build GitHub Pages
> site, so the React-Three-Fiber + Draco-GLB concept is implemented with the
> deployable equivalent — Three.js + a procedural villa split into the same
> construction groups and animated in sequence on mount. Same cinematic result,
> zero build tooling, no external asset to fetch.

## The ten chapters

1. **Hero** — the villa assembles, then the AI layer activates.
2. **The Missed Opportunity** — the cost of a missed call (quantified).
3. **GearWithAI Activates** — before/after the intelligent layer switches on.
4. **Customer Communication** — an animated instant-reply conversation.
5. **Appointment Journey** — inquiry → qualified → slot → confirmed → booked.
6. **Intelligent Follow-Up** — automatic follow-up and old-lead re-engagement.
7. **Automation Ecosystem** — the full capability set as one connected system.
8. **Built for Contractors** — the served trades.
9. **How It Works** — Integration → Automation → Growth, plus "Why GearWithAI."
10. **Final Conversion** — the ecosystem fully alive; Book A Demo.

## Performance, fallbacks & accessibility

- WebGL capability check → graceful CSS gradient fallback (`no-webgl`).
- `prefers-reduced-motion` respected — the villa presents finished and still,
  animations and marquees disabled.
- Device-pixel-ratio capped; cheap blob "contact shadow" instead of shadow maps;
  a single hemisphere + key + rim + ambient lighting rig; capped particle count
  on mobile; full resource disposal on unload.
- The page is never trapped behind the loader (independent reveal guarantee).
- All copy is real, semantic HTML (never trapped in canvas); keyboard-accessible
  nav and CTAs; skip link; sufficient contrast; SEO meta + JSON-LD.

## Before going live — replace placeholders

- **Book-A-Demo form** submits client-side (confirmation message only). Wire it
  to the real CRM / scheduling endpoint.
- **Social links** in the footer point to `#` — swap in real profiles.
- **Privacy / Terms** footer links are placeholders.
- Stat figures in the Problem chapter reflect widely-cited home-services and
  lead-response industry benchmarks; confirm against GearWithAI's own sources.
