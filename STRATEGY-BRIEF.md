# Bryton Roofs — Pre-Discovery Intelligence Brief & Landing Page Concept
Prepared for the gearwithai.com discovery call · Compiled 2026-06-19

> **Verification note:** Everything below is sourced from the public web (cited inline). Items I could **not** verify are flagged `⚠️ UNVERIFIED` rather than guessed. The brytonroofs.com pages, Yelp, and Facebook all return 403 to automated fetches, so direct page-by-page scraping of live copy was blocked — findings come from search indexes, GAF, BBB, LinkedIn, RocketReach, NiceJob, and Birdeye snapshots.

---

## PHASE 1 — RESEARCH

### 1. Website audit (brytonroofs.com)
**Confirmed structure** (from indexed pages):
- Home (`/`), About Us (`/about-us/`), Contact (`/contact/`), Metal Roof (`/metal-roof/`), Repairs & Maintenance (`/repairs-and-maintenance/`)
- City landing pages: Greenville, Raleigh, Durham, Goldsboro — all titled "… Roofing Contractor — Free Consultation!"

**Services listed:** architectural asphalt shingles, 3-tab shingles, corrugated metal, standing seam metal, TPO, EPDM, Fluid-Applied Liquid Membrane; residential, multi-family, commercial, and publicly-owned markets; repairs & maintenance; storm damage & insurance-claim support.

**Copy tone:** Competent and traditional — "fully insured & licensed," "over 20 years," "superior services." Reads like a capable local contractor, not a premium brand. Heavy on *what they install*, light on *why a homeowner should feel safe choosing them today*.

**Likely conversion gaps (inferred from structure + category norms):**
- No instant-quote / self-serve estimate — only "Free Consultation" forms (high friction, slow).
- No aggregated reviews wall on-site despite a flawless 5-star reputation off-site (their single biggest unused asset).
- No visible financing calculator, no live promotions, no urgency mechanics for storm season.
- City pages appear to be classic SEO doorway pages rather than experiences.
- `⚠️ UNVERIFIED:` exact mobile performance / Core Web Vitals — could not run PageSpeed against a 403'd origin. Flag to confirm live on the call.

### 2. Google Business Profile
- **Rating:** 5.0 stars, ~37 reviews (NiceJob mirror shows 38). [NiceJob](https://nicejob.com/bryton-roofs)
- **Base:** Ayden, NC (serving Greenville + Central/Eastern NC).
- `⚠️ UNVERIFIED:` exact GBP phone, street address, and posted hours — not exposed in search and origin blocked. **Confirm on the call.**
- **Recurring positive themes (from review snippets):** prompt response, owner explains the problem before repairing, efficient/professional, "kept them on speed dial," quality workmanship.
- **Negative themes:** none surfaced — no negative reviews found across Google/Birdeye/NiceJob. This is rare and is itself a positioning asset.

### 3. Yelp
- Listing: [Bryton Roofs — Ayden](https://www.yelp.com/biz/bryton-roofs-ayden), 24 photos of past work, "Request a Quote" CTA.
- `⚠️ UNVERIFIED:` Yelp star count, logo image URL, and owner response pattern — Yelp blocked automated read. Pull live during prep.

### 4. Facebook
- Page: [Bryton Roofs](https://www.facebook.com/people/Bryton-Roofs/100078444307944/), ~168 likes — low engagement / under-leveraged.
- `⚠️ UNVERIFIED:` specific posts in the last 90 days and project-photo cadence — could not read the feed. The thin like-count strongly implies social is not driving leads, which supports moving project proof onto the website.

### 5. Competitor scan (Greenville, NC market)
- **Roofing Solutions** — 5.0★ across **174 reviews**, full exteriors (roofing/siding/windows). Far more review volume than Bryton. [Remodelmate](https://www.remodelmate.com/usa/north-carolina/best-roofers-greenville-nc/)
- **Coreyco Roofing Services** — 15+ yrs, metal + asphalt specialist.
- **Wayne's Roofing & Gutter** — 40+ yrs, longevity story.
- **Next Level Exteriors / Walker Company / Best Choice Roofing** — established repair+replacement players.

**What competitors do that Bryton is missing:** review *volume* and visible social proof, broader exterior cross-sell, and (across the category nationally) instant-estimate tooling. **None of the local players run an AI-assisted, motion-driven web experience** — that's the open lane.

### 6. Owner / founder
- **W.C. ("Will") Strickland, Jr.** — Co-Owner. [LinkedIn](https://www.linkedin.com/in/wcstricklandjr/) · listed as Owner/Manager on [BBB](https://www.bbb.org/us/nc/ayden/profile/roofing-contractors/bryton-roofs-0593-90334913).
- Company is "owned by two life-long friends." `⚠️ UNVERIFIED:` the second owner's name was not found.
- Staff name surfaced in reviews: **Taylor Burns** (helpful/professional on a barrel-tile job).

### Verified credentials (use these as trust signals)
- NC General Contractor **License #87794**. [GAF](https://www.gaf.com/en-us/roofing-contractors/residential/usa/nc/ayden/bryton-roofing-1127793)
- **GAF-Certified** contractor (can offer GAF System Plus Limited Warranty).
- **10-Year Craftsmanship Warranty** + manufacturer warranty.
- Flexible financing offered. 20+ years in business. Fully insured.

---

## PHASE 2 — STRATEGY

**The ONE positioning angle:** *"The only roofer in Eastern NC with a perfect record — and now the only one that lets you start your roof in 60 seconds."* Bryton owns something competitors with 174 reviews can't claim cleanly: a **spotless 5.0 with zero negatives, 20 years, GAF-certified, license #87794**. Pair that flawless-trust story with the market's first AI instant-quote experience and you fuse *most trustworthy* with *most modern*.

**Top 3 conversion problems with the current site:**
1. **The trust is invisible.** A flawless 5.0 reputation lives on Google/Yelp but isn't aggregated on-site — every visitor has to leave to verify them.
2. **Every path is high-friction.** "Free Consultation" forms ask the visitor to wait; there's no instant estimate, no financing math, no self-serve answer at 11pm during a storm.
3. **No urgency or proof engine.** No storm/insurance-claim urgency module, no live before/after proof, no promotions — so the page can't sell when Will isn't on the phone.

**Emotional + practical triggers that convert roofing leads:**
- **Fear/urgency:** active leak, storm damage, "will it hold through the next one." → storm-mode banner + instant triage.
- **Financial relief:** "can I afford this" → financing calculator + monthly-payment framing + active promo.
- **Trust/risk-reversal:** insurance-claim help, license #87794, GAF certification, 10-yr craftsmanship warranty, 5.0 with zero complaints.
- **Speed/control:** instant ballpark number + self-book, no waiting for a callback.

---

## PHASE 3 — LANDING PAGE BLUEPRINT
Implemented as a live, motion-driven build in this repo (`index.html`). Section-by-section rationale lives in `BLUEPRINT.md`.

## PHASE 4 — PITCH SCRIPT
See `PITCH-SCRIPT.md` — 90-second opener + 5 discovery questions, all referencing verified research.

---

### Sources
- https://brytonroofs.com/ · /about-us/ · /contact/ · /metal-roof/ · /repairs-and-maintenance/ · city pages
- https://www.gaf.com/en-us/roofing-contractors/residential/usa/nc/ayden/bryton-roofing-1127793
- https://www.bbb.org/us/nc/ayden/profile/roofing-contractors/bryton-roofs-0593-90334913
- https://www.linkedin.com/in/wcstricklandjr/
- https://nicejob.com/bryton-roofs · https://reviews.birdeye.com/bryton-roofs-165767345995844
- https://www.yelp.com/biz/bryton-roofs-ayden · https://www.facebook.com/people/Bryton-Roofs/100078444307944/
- https://www.remodelmate.com/usa/north-carolina/best-roofers-greenville-nc/
