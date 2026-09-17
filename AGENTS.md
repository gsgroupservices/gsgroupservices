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

- `LEGGIMI.txt` is the maintainer's publish notes (Italian). The authoritative
  site content may be supplied as a zip inside the repo; when it is, copy it over
  the working tree rather than hand-editing pages.
- Cloudflare Pages serves static files only. Do not add `.php` files; they would
  be downloaded as plain text (an incomplete `send.php` was removed for this
  reason).
- Asset uploads have previously landed with filenames that did not match their
  content. Identify assets by file magic bytes, not by extension, and keep
  `site-integrity.test.js` green.
