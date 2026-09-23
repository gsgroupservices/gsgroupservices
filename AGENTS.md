# AGENTS.md

## Project

Static marketing site for GS Group Services (plant hire and groundworks, London).
Plain HTML/CSS/JS with no build step and no framework. Deployed to Cloudflare
Pages via `wrangler.jsonc`.

## Layout

- `*.html` — one file per route. Internal links are extensionless (`/contact`),
  because that is how Cloudflare Pages serves them. Opening the files directly
  from disk will look like broken links; that is expected.
- `location/*.html` — area landing pages (telehandler/forklift hire in a named
  town and postcode, with indicative day rates). These are **generated**: edit
  `scripts/locations.js`, then run `node scripts/build-locations.js`. A test
  compares the committed files with the renderer's output, so they cannot drift.
  They live one level below the root, so every asset path in them must be
  root-absolute (`/css/style.css`), never relative.
- `css/style.css` — the single stylesheet.
- `js/nav.js`, `js/analytics.js` — the only client-side modules (mobile nav;
  cookie consent + GA4). Loaded by every page.
- `images/` — logo, favicon, social preview, hero images.
- `scripts/` — Node-only helpers used at authoring time. Not part of the served
  site; `_redirects` blocks the path on Pages.
- `scripts/rates.js` — the hire rates. Single source of truth: the area pages
  render from it, and a test fails if `index.html` or `services.html` drift from
  it. Change the commercial terms there, rebuild the area pages, then bring the
  hand-written tables into line.
- `scripts/quote-form.js` — the hero "Get a Free Quote" form. Shared by the
  homepage and the area pages so all submissions reach the same Formspree inbox
  with the same field names as `contact.html`.
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

## Deployment

The site is published by **Cloudflare Pages**, wired to this GitHub repo: pushing
to `main` deploys automatically. There is no CI workflow in the repo.

Consequences worth knowing:

- `wrangler.jsonc` describes a Workers deployment and is **not** what serves
  production. Local `wrangler dev` is still useful for previewing routing.
- `.assetsignore` is honoured only by Wrangler. Pages ignores it, so every file
  in the repository root is published, including `package.json`, `LEGGIMI.txt`
  and `AGENTS.md`. Do not commit credentials here: the repository is public and
  the Pages output is public, so both are readable. `_redirects` cannot help,
  since Pages supports only redirect statuses (301/302/303/307/308) and not
  rewrites or a 404 response. Excluding these files needs a Pages build command
  that deletes them, or a move to a Workers deploy. This is tidiness, not a
  disclosure: the files are already readable on GitHub, so Pages adds no new
  exposure.
- A top-level `404.html` is what makes Pages return a real 404. Without it Pages
  assumes a single-page app, serves `index.html` with a 200 for every unknown
  URL (a soft 404), and Google may index those URLs.
- `404.html` must reference its assets with root-absolute paths (`/css/style.css`).
  Pages serves it for arbitrary paths such as `/a/b/c`, where a relative path
  would resolve to `/a/b/css/style.css` and fail to load.
- Pages cannot execute PHP, so `.php` files are served as plain text. The contact
  form posts to Formspree instead.

## Conventions and gotchas

- `scripts/build-locations.js` regenerates `location/*.html` from
  `london.html`'s head/footer plus `renderLocationPage`. Run
  `npm run build:locations` after editing that template; running
  `scripts/locations.js` directly is a no-op and writes nothing.
- The hero has two shapes. The homepage and the location pages carry a
  two-column hero (`.hero:has(.hero-form)`: copy left, short form right);
  every other page has a plain centred text-only hero. When changing hero
  CSS, scope it to one shape or the other, and check a `services.html`
  style page as well as `index.html`.
- The hero form is the short version (name, phone, email, short request).
  The full form with the service dropdown and project details lives on
  `/contact`. `site-integrity.test.js` fails if a hero field name is not
  also on the contact form, so the two cannot drift apart.
- CSS layout is checked against a real browser, not estimated. jsdom does
  no layout, so it cannot catch an overlap or a form pushed below the
  fold. Headless Chromium is at `/usr/bin/chromium` (no Playwright or
  Puppeteer); the working recipe is a `--dump-dom` run against a page with
  a probe `<script>` appended that measures `getBoundingClientRect()` and
  writes the result into a `<pre id="__probe__">`. Check widths 1440,
  1366, 1280, 1024, 900, 768 and 390, and assert no overlapping text and
  no horizontal overflow. Write the probe to its own `.js` file and load
  it with `<script src>`: inlining it through a shell here-string mangles
  the quotes.
- `LEGGIMI.txt` is the maintainer's publish notes (Italian). The authoritative
  site content may be supplied as a zip inside the repo; when it is, copy it over
  the working tree rather than hand-editing pages.
- Cloudflare Pages serves static files only. Do not add `.php` files; they would
  be downloaded as plain text (an incomplete `send.php` was removed for this
  reason).
- Asset uploads have previously landed with filenames that did not match their
  content. Identify assets by file magic bytes, not by extension, and keep
  `site-integrity.test.js` green.
