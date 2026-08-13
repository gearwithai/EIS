# GearWithAI V2 — Flagship Website

A cinematic, premium marketing site for **GearWithAI** and its product **GWAI**, the always-on AI assistant for home improvement contractors — answering calls, booking appointments, and following up 24/7.

The whole experience is built around one continuous cinematic background video: content scrolls *over* the construction footage, which never restarts between sections.

## Run it

No build step, no dependencies. Open `index.html`, or serve locally:

```bash
python3 -m http.server 8123   # then visit http://localhost:8123
```

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `about.html` | About Us |
| `services.html` | Services |
| `faqs.html` | FAQs |
| `contact.html` | Book a Demo |
| `privacy.html` | Privacy Policy |
| `terms.html` | Terms & Conditions |

Top navigation is GearWithAI (home) · About Us · Services · FAQs · Book Demo. Privacy and Terms live in the footer only.

## Design system

Four brand colors, used exclusively (`css/style.css` tokens):

| Token | Hex | Use |
| --- | --- | --- |
| Lavender Mist | `#E6E6FA` | Body text on video, content panels |
| Charcoal Gray | `#333333` | Text inside lavender panels |
| Forest Green | `#0E300E` | Primary CTAs, deep backgrounds |
| Antique Gold | `#A4863D` | Accents, eyebrows, hover states |

Type is **Fraunces** (display serif) + **Inter** (UI/body), self-hosted as `woff2` with `unicode-range` subsetting so browsers fetch only what they render.

The core visual idea: the darkened video is the cinematic stage, and lavender panels float over it as the "documents" holding detailed content.

## Key components

- **Cinematic stage** (`.stage`) — fixed full-bleed muted video with overlay, film grain, and a scroll-driven scrim that deepens toward the footer.
- **Live call demo** (`.callcard`) — an animated, looping GWAI call: incoming call → conversation → *Lead secured*.
- **Integrated Network** — an SVG constellation (pulsing GWAI core with data-flow lines to each trade) plus dual marquees of partner businesses.
- **GearBot** (`.gearbot`) — floating glass chatbot with quick replies. Keyword-matched responses today; ready for a real AI backend.
- **Logo mark** (`.gmark`) — half-circle with engraved lines rotating anti-clockwise around a static upward arrow.

## Stack

- **GSAP + ScrollTrigger + SplitText** — reveals, parallax, counters, headline line-splits
- **Lenis** — momentum smooth scroll
- Vanilla JS (`js/app.js`) for the video controller, nav, FAQ accordion, form, call demo, and chatbot

All libraries are **self-hosted** in `assets/js/` — no CDN dependency at runtime.

## Accessibility & performance

- Progressive enhancement: all content is visible without JS; reveal animations only apply when JS runs.
- Full `prefers-reduced-motion` support — decorative motion is disabled and the video is never fetched.
- `Save-Data` is honored (poster only, no video download).
- Skip link, keyboard-accessible accordion/menu/chatbot, ARIA labels, and semantic landmarks throughout.
- Video is `preload="none"` and loads after first paint so it never competes with LCP.

## Before going live

- **Form endpoint** — `contact.html` has `data-endpoint=""` on the form. Add a Formspree (or similar) URL to POST submissions; until then it falls back to a `mailto:` so no lead is lost.
- **Social URLs** — footer links point at `/gearwithai` handles; confirm each profile.
- **Media kit** — the footer "Download assets" button opens an email request; swap for a real asset URL when available.
- **Video encode** — `assets/video/cinematic.mp4` (H.264, 1280×720, 2.6 MB) has a single keyframe, so it is played as a continuous ambient loop rather than scroll-scrubbed. If scrubbing is ever wanted, re-encode with a dense keyframe interval first.

## Notes

Static pages are generated from a script kept outside the repo, which bakes the shared head/nav/footer into each file. The committed HTML is the source of truth — edit it directly.
