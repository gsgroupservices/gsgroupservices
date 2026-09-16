# AGENTS.md

## Project

Static marketing site for GS Group Services (plant hire and groundworks, London).
Plain HTML/CSS/JS with no build step and no framework. Deployed to Cloudflare
Pages via `wrangler.jsonc`.

## Layout

- `*.html` — one file per route. Internal links are extensionless (`/contact`),
  because that is how Cloudflare Pages serves them. Opening the files directly
  from disk will look like broken links; that is expected.
- `css/style.css` — the single stylesheet.
- `js/nav.js`, `js/analytics.js` — the only client-side modules (mobile nav;
  cookie consent + GA4). Loaded by every page.
- `images/` — logo, favicon, social preview, hero images.
- `sitemap.xml`, `robots.txt` — SEO.

## Testing

`npm test` runs the Node test runner over `tests/**/*.test.js` (no global
install; `jsdom` is the only devDependency).

- `tests/helpers/dom.js` builds a jsdom environment and executes module source
  from `js/` against a real DOM.
- `cookie-consent.test.js`, `mobile-nav.test.js` — behavioural tests for the two
  modules.
- `site-integrity.test.js` — filesystem checks that every page's filename matches
  its content, that all assets and internal links resolve, and that shared markup
  is present on every page.

## Conventions and gotchas

- `LEGGIMI.txt` is the maintainer's publish notes (Italian). The authoritative
  site content may be supplied as a zip inside the repo; when it is, copy it over
  the working tree rather than hand-editing pages.
- Cloudflare Pages serves static files only. Do not add `.php` files; they would
  be downloaded as plain text (an incomplete `send.php` was removed for this
  reason). The contact form posts to Formspree.
- Asset uploads have previously landed with filenames that did not match their
  content. Identify assets by file magic bytes, not by extension, and keep
  `site-integrity.test.js` green.
