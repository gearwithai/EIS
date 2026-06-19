# Landing Page Blueprint — Bryton Roofs
Section order optimized for conversion logic. Built live in `index.html` with Samana-Studio-style cinematic motion (Lenis smooth scroll + GSAP/ScrollTrigger, text reveals, parallax, magnetic CTAs, custom cursor).

Every "wow" element below is implemented and interactive in the build.

---

### 0. Sticky contact bar (persistent)
- **Purpose:** never let intent cool — Call / Text / Get Quote always one tap away.
- **Headline copy:** *"Roof emergency? We answer."* / *"Talk to Will's crew now — or lock a quote in 60 seconds."*
- **Wow element:** appears on scroll with a magnetic "Instant Quote" button; on mobile collapses to call/text/schedule icons.
- **Beats competitors:** local rivals bury the phone number; this follows the user down the page.

### 1. Hero — instant trust + primary CTA
- **Purpose:** in 3 seconds, establish *flawless + modern*.
- **Headline:** **"Eastern NC's only roofer with a perfect record."**
- **Copy:** *"20 years. License #87794. GAF-certified. A 5.0 rating with zero complaints — and a quote you can start right now, not next week."*
- **Wow element:** cinematic line-by-line text reveal, parallax roofline backdrop, animated trust ticker (5.0 ★ · 0 complaints · GAF Certified · #87794) and a magnetic "Get my instant quote" CTA.
- **Beats competitors:** rivals open with a stock photo and a phone number; this opens with a claim no one else can make plus an action.

### 2. AI-powered instant roof quote tool ⭐ flagship
- **Purpose:** convert cold traffic into priced, self-qualified leads 24/7.
- **Headline:** **"Your ballpark roof price — in 60 seconds, no callback required."**
- **Copy:** *"Answer five quick questions. Our estimator does the math GAF-certified crews use, then locks your number while we confirm details."*
- **UX flow (implemented):**
  1. Project type — Replace / Repair / Storm damage / New build / Inspection
  2. Roof material — Architectural shingle / Metal (standing seam or corrugated) / Flat-commercial (TPO·EPDM·liquid)
  3. Home size band — under 1,500 / 1,500–2,500 / 2,500–4,000 / 4,000+ sq ft
  4. Roof story — single / two-story / steep & complex (drives a complexity multiplier)
  5. Timeline / urgency — emergency / 30 days / planning
  → Animated calculation, then an **estimated range** + monthly financing figure + "Lock this quote & book" capturing name/phone. Storm-damage answers branch into an insurance-claim assist message.
- **Wow element:** live animated number count-up, branching logic, progress ring, instant financing math — feels like a fintech flow, not a contact form.
- **Beats competitors:** **no roofer in this market offers any instant number.** This alone earns the "wow."

### 3. Storm / 24-7 availability + live call-text widget
- **Purpose:** capture panic traffic during NC storm season.
- **Headline:** **"Storm hit? We're already on it — 24/7."**
- **Copy:** *"Active leak or wind damage can't wait for business hours. Tap to call or text now and we'll triage before more water gets in."*
- **Wow element:** pulsing "live" status dot, click-to-call + click-to-text, and a dynamic line that flips to "Storm mode active" styling.
- **Beats competitors:** turns a 2am leak into a booked job instead of a missed call.

### 4. Services grid
- **Purpose:** show full capability without a wall of text.
- **Headline:** **"One crew. Every roof in Eastern NC."**
- **Copy:** *"Residential and commercial, repair to full replacement, shingle to standing seam — installed by a GAF-certified team that's done it for two decades."*
- **Cards:** Residential · Commercial · Repair & Maintenance · Full Replacement · Metal (standing seam/corrugated) · Flat/Commercial (TPO·EPDM·liquid) · Gutters · Inspections · Emergency · Insurance Claims.
- **Wow element:** scroll-revealed cards with magnetic hover tilt and accent sweep.

### 5. Interactive Before/After gallery
- **Purpose:** proof beats promises.
- **Headline:** **"Drag to see the difference."**
- **Copy:** *"Real Eastern NC roofs, before and after Bryton's crew. Storm-stripped to showroom in days."*
- **Wow element:** draggable before/after clip slider per project (keyboard + touch friendly).
- **Production note:** images pull from their Facebook/Yelp portfolio (24 photos available). Build ships with clearly-labeled placeholders until assets are provided.
- **Beats competitors:** rivals show static thumbnails; this is hands-on proof.

### 6. Financing + active promotions
- **Purpose:** remove the price objection.
- **Headline:** **"A new roof for the price of a coffee a day?"**
- **Copy:** *"Flexible financing turns a $14k replacement into a low monthly payment. Slide your project size to see your number."*
- **Wow element:** interactive monthly-payment slider tied to the quote tool, plus a live "limited-time" promo card.
- **Beats competitors:** makes affordability visual and immediate.

### 7. Reviews wall (Google + Yelp + Facebook)
- **Purpose:** aggregate the flawless reputation on-site so no one has to leave to verify.
- **Headline:** **"5.0 stars. Zero complaints. Twenty years."**
- **Copy:** *"We pulled every review into one place so you don't have to take our word for it."*
- **Wow element:** auto-scrolling marquee of real review themes with source badges; aggregate score counts up on scroll.
- **Reviews used are real themes surfaced in research** (prompt response, Will explains before repairing, Taylor Burns barrel-tile job, "kept on speed dial"). Live build connects to Google/Yelp/FB APIs.

### 8. Service-area map
- **Purpose:** answer "do you cover me?" instantly.
- **Headline:** **"From Ayden to Raleigh — your county's covered."**
- **Copy:** *"Greenville, Ayden, Durham, Raleigh, Goldsboro and across Central & Eastern NC."*
- **Wow element:** stylized animated map with pulsing city markers.

### 9. Insurance / warranty / licensing trust bar
- **Purpose:** stack risk-reversal right before the ask.
- **Headline:** **"Backed in writing."**
- **Items:** License #87794 · GAF Certified · 10-Year Craftsmanship Warranty · Fully Insured · Insurance-claim specialists.
- **Wow element:** badge row that animates in with subtle shine.

### 10. Booking widget (calendar + form)
- **Purpose:** the close.
- **Headline:** **"Pick a time. We'll bring the ladder."**
- **Copy:** *"Choose a slot for your free inspection — confirmed by text, no phone tag."*
- **Wow element:** lightweight date/time picker + minimal form pre-filled from the quote tool.

---

**Motion system (all sections):** Lenis momentum smooth-scroll, GSAP ScrollTrigger reveals, SplitType character/line reveals on headlines, parallax layers, a custom blended cursor, magnetic buttons, grain overlay, and reduced-motion fallbacks for accessibility.
