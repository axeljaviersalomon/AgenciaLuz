# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single static landing page for "Agencia Luz" (marketing/dev agency), written as plain HTML + CSS + vanilla JS. No build step, no npm, no framework, no bundler. It's meant to be uploaded as-is to any host (FTP, Netlify, Cloudflare Pages, GitHub Pages) or opened directly via `file://` by double-clicking `index.html`.

## Commands

There is no package.json, no build, no lint, no test suite. To preview:

```
npx serve
```
(or any static file server) from the repo root. Double-clicking `index.html` also works since scripts load without `type="module"`.

## File map

```
index.html      → all page content, one section per HTML comment block
styles.css      → all styles; numbered index in the file's own header comment
main.js         → single IIFE with all interaction/animation logic
lib/gsap.min.js + lib/ScrollTrigger.min.js  → vendored locally, not loaded from a CDN
lib/manifest.js → window.__LUZ__ global: brand data + form status strings
.htaccess       → Apache/LiteSpeed cache headers (ignored on Netlify/Cloudflare/Nginx)
assets/credits.json → attribution for the placeholder stock photos
```

## Architecture

- **No modules, one global.** `lib/manifest.js` sets `window.__LUZ__` (contact info, form status text) as the only piece of "data" separated from markup. `main.js` is a single `"use strict"` IIFE reading from it — no ES imports anywhere, by design, so the site behaves identically served over HTTP or opened as a local file.
- **Progressive enhancement is load-bearing, not decorative.** All content is visible in raw HTML/CSS with no JS. `main.js` boots each feature (`initNav`, `initAnchors`, `initLuz`, `initForm`, then GSAP-dependent `initHero`/`initReveals`/`initParallax`) wrapped in a `safe()` try/catch, and GSAP-based animation only runs `if (window.gsap && window.ScrollTrigger)`. Never make a section's content or functionality depend on JS/GSAP succeeding.
- **The signature interaction is `initLuz`**: a warm radial gradient that follows the cursor, implemented as a single `requestAnimationFrame` loop lerping into two CSS custom properties (`--mx`/`--my`) read by `styles.css`. Respects `prefers-reduced-motion` (freezes in place) and non-fine-pointer devices (drifts on a slow `setInterval` instead of tracking `mousemove`).
- **Reveal animations are centralized**: any element with class `.reveal` gets faded in via `ScrollTrigger.batch` in `initReveals`. Adding a new animated section is just adding the `.reveal` class — don't hand-roll a new GSAP trigger per section. There's a 6s safety-net `setTimeout` that force-shows anything left unrevealed.
- **The contact form has no backend.** `initForm` in `main.js` checks `form.getAttribute("data-endpoint")` on `#contactForm` in `index.html`: empty means simulate success (`setTimeout` + fake OK message), non-empty means real `fetch(endpoint, {method: "POST", body: new FormData(form)})`. The `_honey` hidden input is an anti-spam honeypot — never remove or "fix" it, a filled value silently fakes a success response instead of submitting.
- **`styles.css` is one file organized as 18 numbered sections** (tokens, reset, utilities, background layers, buttons, nav, hero, manifesto, services, dev block, process, audience, FAQ, contact, footer, reveals, breakpoints, reduced-motion). All color/type/spacing values are CSS custom properties under `:root` in section 1 — change the palette there, nowhere else. Mobile-first: base styles are phone-sized, `min-width` media queries add space going up.
- **Cache-busting is manual.** `index.html` loads `styles.css` and `main.js` (and `lib/manifest.js`) with a `?v=YYYYMMDD-n` query string. Whenever `styles.css` or `main.js` changes, bump that version string in all references at the bottom of `index.html`, or browsers may keep serving stale cached assets (see `.htaccess`, which tells Apache/LiteSpeed hosts not to cache HTML/CSS/JS but to cache images long-term — this has no effect on Netlify/Cloudflare Pages/Nginx).

## Placeholders that must be replaced before publishing

Search for `TU-` to find them all. They appear in both `index.html` (hero button, contact section, floating WhatsApp button, JSON-LD schema, canonical/OG URLs) and `lib/manifest.js` (must be kept in sync in both places):
- `TU-NUMERO` — WhatsApp number, international format with no punctuation (e.g. `5491122334455`)
- `TU-EMAIL@dominio.com` — contact email
- `TU-USUARIO` — Instagram handle
- `TU-DOMINIO.com` — canonical domain

The one remaining image in `assets/img/` (`luz-dev.jpg`, laptop/hands with data-panel overlay, used in the Desarrollo section) is a stock placeholder (credited in `assets/credits.json`). The former `luz-ciudad.jpg` banda photo was replaced by a CSS-only animated background (glowing circles, see `.banda` in `styles.css`); the Proceso column (`luz-escena.jpg`, then briefly `luz-proceso.jpg`) dropped its image entirely and is now a single-column timeline (`.proceso__inner` in `styles.css`) — don't re-add a figure there without being asked. If replacing `luz-dev.jpg` with a different aspect ratio, update the `width`/`height` attributes on its `<img>` in `index.html` to avoid layout shift.
