# PULSE — 3D Animated Gym Website Template

A high-energy, interactive landing page template for gyms / fitness studios — built to win freelance clients on first sight. Pure HTML/CSS/JS, **no build step, no install required**. All libraries load from CDN.

## What's inside

- **3D animated background** (Three.js) — a heartbeat-driven energy grid + floating particles that reacts to mouse and scroll, and syncs with the light/dark theme.
- **Buttery smooth scroll** (Lenis) + **scroll-driven animations** (GSAP ScrollTrigger): word-by-word title reveals, fade-ups, animated stat counters, a pinned horizontal "Programs" rail, and a gallery mask reveal.
- **Custom cursor**, animated loader, scroll-progress bar, light/dark theme toggle (remembers choice), and a fully responsive layout.

## Sections (everything the client asked for)

1. **Hero** — headline, CTAs, live quick-stats
2. **Programs / Categories** (horizontal rail): Calisthenics · Fat Loss · Muscle Gain · Powerlifting · HIIT & Conditioning · Mobility & Yoga
3. **Equipment / Accessories** — free weights, racks, machines, cardio zone, functional rig, recovery suite
4. **Why Us / Benefits** — coaches, personalised plans, 24/7, nutrition, community, tracking
5. **Coaches** — trainer cards
6. **Stats band** — animated counters
7. **Gallery** — facility photos
8. **Pricing** — 3 membership tiers
9. **Testimonials** — member results
10. **Visit / Location** — info, embedded map, free-session booking form
11. **Footer** — CTA + links

## Run it locally

It's a static site. Easiest ways:

```bash
# Option A — no install, if you have Node (you do):
npx serve .

# Option B — Python:
python -m http.server 8000
```

Then open the printed URL (e.g. http://localhost:8000). Opening `index.html` directly mostly works, but a local server is recommended so the Three.js ES-module import resolves cleanly.

## Make it the client's

Everything is placeholder content — search & replace to rebrand:

- **Name:** `PULSE` → client's gym name (in `index.html`: loader, nav, footer).
- **Accent colors:** edit `--accent` (volt green) and `--accent-2` (ember) at the top of `css/style.css`. One line changes the whole site.
- **Copy / prices / programs:** all in `index.html`.
- **Images:** currently Unsplash URLs — swap `src` attributes for the client's real photos.
- **Map:** replace the `<iframe>` in the Visit section with the client's Google Maps / OpenStreetMap embed.
- **Contact details:** `[Street Address]`, `[your phone number]`, email — search for the brackets.

## Files

```
index.html           # markup + CDN library tags
css/style.css         # all styling + theme tokens + responsive
js/three-scene.js     # the 3D background (ES module)
js/main.js            # scroll animations, cursor, loader, counters, theme
```
