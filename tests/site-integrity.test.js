'use strict';

/**
 * Guards the static site against the class of bug that shipped a scrambled
 * build: page files whose names did not match their content, missing assets,
 * and dangling internal links. Everything here is filesystem-only, so it runs
 * without a browser.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { REPO_ROOT } = require('./helpers/dom');

/** Pages that are part of the shipped site. */
const PAGES = fs
  .readdirSync(REPO_ROOT)
  .filter((name) => name.endsWith('.html') && name !== 'LEGGIMI.txt');

/**
 * Error and confirmation pages are intentionally kept out of the index, so they
 * carry no canonical URL.
 */
const NOINDEX_PAGES = ['404.html', 'thank-you.html'];

const INDEXABLE_PAGES = PAGES.filter((name) => !NOINDEX_PAGES.includes(name));

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i;

function readPage(name) {
  return fs.readFileSync(path.join(REPO_ROOT, name), 'utf8');
}

function attributeValues(html, attribute) {
  const pattern = new RegExp(`${attribute}="([^"]+)"`, 'gi');
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function localReferences(html) {
  const refs = [
    ...attributeValues(html, 'src'),
    ...attributeValues(html, 'href'),
  ];

  for (const value of attributeValues(html, 'srcset')) {
    for (const candidate of value.split(',')) {
      refs.push(candidate.trim().split(/\s+/)[0]);
    }
  }

  return refs.filter((ref) => ref && !EXTERNAL.test(ref));
}

/** Maps a site path such as /contact to the file Cloudflare Pages would serve. */
function resolveSitePath(sitePath) {
  const clean = sitePath.split('#')[0].split('?')[0];
  const relative = clean.replace(/^\//, '');

  if (relative === '') return 'index.html';
  if (path.extname(relative)) return relative;
  return `${relative}.html`;
}

test('every indexable page has a title and a canonical URL matching its filename', () => {
  for (const name of INDEXABLE_PAGES) {
    const html = readPage(name);

    const title = html.match(/<title>([^<]*)<\/title>/i);
    assert.ok(title, `${name} has no <title>`);
    assert.notEqual(title[1].trim(), '', `${name} has an empty <title>`);

    const canonical = html.match(/rel="canonical" href="([^"]*)"/i);
    assert.ok(canonical, `${name} has no canonical link`);

    // /contact -> contact.html; the root page is index.html.
    const expected = name === 'index.html' ? '/' : `/${name.replace(/\.html$/, '')}`;
    const actual = canonical[1].replace('https://gsgroupservices.co.uk', '');
    assert.equal(actual, expected, `${name} canonical does not match its filename`);
  }
});

test('error and confirmation pages stay out of the index', () => {
  for (const name of NOINDEX_PAGES) {
    assert.match(readPage(name), /<meta name="robots" content="noindex/, `${name} is indexable`);
  }
});

test('the homepage is the only page claiming the site root', () => {
  const claimants = PAGES.filter((name) => {
    const canonical = readPage(name).match(/rel="canonical" href="([^"]*)"/i);
    return canonical && canonical[1] === 'https://gsgroupservices.co.uk/';
  });

  assert.deepEqual(claimants, ['index.html']);
});

/** References to files shipped in the repository (as opposed to site routes). */
function localAssetReferences(html) {
  return localReferences(html).filter((ref) =>
    /\.(?:js|css|png|jpe?g|webp|svg|ico|gif|avif|woff2?|ttf)$/i.test(ref),
  );
}

test('every local asset referenced by a page exists', () => {
  const missing = [];

  for (const name of PAGES) {
    for (const ref of localAssetReferences(readPage(name))) {
      // Root-absolute asset paths resolve from the site root, not the page.
      const target = ref.startsWith('/') ? ref.slice(1) : ref;
      if (!fs.existsSync(path.join(REPO_ROOT, target))) {
        missing.push(`${name} -> ${ref}`);
      }
    }
  }

  assert.deepEqual(missing, [], `broken asset references:\n  ${missing.join('\n  ')}`);
});

test('every internal link points at a page that exists', () => {
  const broken = [];

  for (const name of PAGES) {
    for (const ref of localReferences(readPage(name))) {
      if (!ref.startsWith('/')) continue;
      const target = resolveSitePath(ref);
      if (!fs.existsSync(path.join(REPO_ROOT, target))) {
        broken.push(`${name} -> ${ref}`);
      }
    }
  }

  assert.deepEqual(broken, [], `dangling internal links:\n  ${broken.join('\n  ')}`);
});

test('every page loads the shared nav and analytics modules', () => {
  for (const name of PAGES) {
    const html = readPage(name);
    assert.match(html, /src="\/?js\/nav\.js"/, `${name} does not load js/nav.js`);
    assert.match(html, /src="\/?js\/analytics\.js"/, `${name} does not load js/analytics.js`);
    assert.match(html, /href="\/?css\/style\.css"/, `${name} does not load the stylesheet`);
  }
});

test('every page carries the cookie banner the consent module expects', () => {
  for (const name of PAGES) {
    const html = readPage(name);
    assert.match(html, /id="cookie-banner"/, `${name} has no cookie banner`);
    assert.match(html, /class="cookie-accept"/, `${name} has no accept button`);
    assert.match(html, /class="cookie-reject"/, `${name} has no reject button`);
  }
});

test('the mobile nav markup the module binds to is present', () => {
  for (const name of PAGES) {
    const html = readPage(name);
    assert.match(html, /class="nav-toggle"/, `${name} has no nav toggle`);
    assert.match(html, /id="site-nav"/, `${name} has no #site-nav`);
  }
});

test('the contact page exposes the quote form', () => {
  const html = readPage('contact.html');
  assert.match(html, /<form[^>]+action="https:\/\/formspree\.io\//);
  assert.match(html, /name="email"/);
});

test('the client-side modules are JavaScript, not mislabelled binaries', () => {
  for (const name of ['js/nav.js', 'js/analytics.js']) {
    const source = fs.readFileSync(path.join(REPO_ROOT, name), 'utf8');
    assert.doesNotMatch(source, /[\u0000-\u0008\u000E-\u001F]/, `${name} looks binary`);
    assert.match(source, /\(function \(\) \{/, `${name} is not the expected module`);
  }
});

test('sitemap.xml lists exactly the public pages', () => {
  const sitemap = fs.readFileSync(path.join(REPO_ROOT, 'sitemap.xml'), 'utf8');
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replace('https://gsgroupservices.co.uk', ''),
  );

  const expected = PAGES.filter((name) => name !== '404.html' && name !== 'thank-you.html')
    .map((name) => (name === 'index.html' ? '/' : `/${name.replace(/\.html$/, '')}`))
    .sort();

  assert.deepEqual([...listed].sort(), expected);
});

test('a deprecated PHP handler is not shipped', () => {
  // Cloudflare Pages serves static assets only, so a .php file here would be
  // downloaded as plain text rather than executed.
  const phpFiles = fs.readdirSync(REPO_ROOT).filter((name) => name.endsWith('.php'));
  assert.deepEqual(phpFiles, []);
});

test('the 404 page is served for unknown routes', () => {
  const config = fs.readFileSync(path.join(REPO_ROOT, 'wrangler.jsonc'), 'utf8');
  assert.match(config, /"not_found_handling"\s*:\s*"404-page"/);
  assert.ok(fs.existsSync(path.join(REPO_ROOT, '404.html')));
});

test('the 404 page loads its assets from the site root', () => {
  // Cloudflare serves 404.html for arbitrary paths such as /a/b/c, where a
  // relative asset path would resolve to /a/b/css/style.css and 404 itself.
  const refs = localAssetReferences(readPage('404.html'));
  assert.ok(refs.length > 0, '404.html references no assets');
  for (const ref of refs) {
    assert.ok(ref.startsWith('/'), `404.html uses a relative asset path: ${ref}`);
  }
});

/** Every file the site publishes, modelled on the deployment. */
function publishedFiles() {
  const found = [];
  const skip = new Set(['.git', 'node_modules']);

  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
      else found.push(rel);
    }
  };

  walk(REPO_ROOT, '');
  return found;
}

test('no credentials are committed to the published tree', () => {
  // Cloudflare Pages publishes the repository root, so anything committed here
  // is downloadable. Flag the high-signal credential patterns.
  const patterns = [
    /gh[pousr]_[A-Za-z0-9]{16,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /sk-[A-Za-z0-9]{20,}/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  ];
  const offenders = [];

  for (const rel of publishedFiles()) {
    let content;
    try {
      content = fs.readFileSync(path.join(REPO_ROOT, rel));
    } catch {
      continue;
    }
    if (content.includes(0)) continue; // binary
    const text = content.toString('utf8');
    for (const pattern of patterns) {
      if (pattern.test(text)) offenders.push(`${rel} matches ${pattern}`);
    }
  }

  assert.deepEqual(offenders, [], `possible credentials in published files:\n  ${offenders.join('\n  ')}`);
});

test('the desktop hover rule cannot be the only way to open the submenu', () => {
  // A touch device wider than 768px has no hover, so the submenu has to be
  // reachable some other way or the Services links are unreachable entirely.
  const css = fs.readFileSync(path.join(REPO_ROOT, 'css/style.css'), 'utf8');

  assert.ok(
    /\.js\s+\.mega-toggle\s*\{[^}]*display:\s*inline-flex/.test(css),
    '.mega-toggle is not displayed for JS-enabled clients at all widths',
  );
  assert.ok(
    /\.mega-menu\.is-open\s*\{[^}]*display:\s*grid/.test(css),
    '.mega-menu.is-open has no display rule outside the mobile media query',
  );
});

test('the submenu toggle is not confined to the mobile media query', () => {
  const css = fs.readFileSync(path.join(REPO_ROOT, 'css/style.css'), 'utf8');

  // Split the stylesheet into the mobile media query and everything else.
  const mobileStart = css.indexOf('@media (max-width: 768px)');
  const outsideMobile = mobileStart === -1 ? css : css.slice(0, mobileStart);

  assert.ok(
    /\.js\s+\.mega-toggle\s*\{[^}]*display:\s*(inline-flex|block)/.test(outsideMobile),
    '.js .mega-toggle is only displayed inside the mobile media query, so the '
      + 'submenu is unreachable on a touch device wider than 768px',
  );
  assert.ok(
    /\.mega-menu\.is-open\s*\{[^}]*display:\s*grid/.test(outsideMobile),
    '.mega-menu.is-open is only honoured inside the mobile media query',
  );
});

test('_redirects keeps the development files off the public site', () => {
  // Pages publishes the repository root and cannot return 404 from _redirects,
  // so these paths are redirected to the homepage instead of served.
  const source = fs.readFileSync(path.join(REPO_ROOT, '_redirects'), 'utf8');
  const rules = new Map();

  for (const line of source.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [from, to, status] = trimmed.split(/\s+/);
    rules.set(from, { to, status });
  }

  for (const blocked of [
    '/package.json',
    '/package-lock.json',
    '/wrangler.jsonc',
    '/AGENTS.md',
    '/LEGGIMI.txt',
    '/.assetsignore',
    '/.gitignore',
    '/tests/*',
  ]) {
    const rule = rules.get(blocked);
    assert.ok(rule, `_redirects has no rule for ${blocked}`);
    assert.equal(rule.to, '/', `${blocked} should redirect to the homepage`);
    assert.equal(rule.status, '301', `${blocked} should use a 301`);
  }

  // A wildcard that caught real content would break the site.
  for (const page of PAGES) {
    for (const from of rules.keys()) {
      if (!from.includes('*')) continue;
      const prefix = from.slice(0, from.indexOf('*'));
      assert.ok(!page.startsWith(prefix), `_redirects ${from} would block ${page}`);
    }
  }
});

test('.assetsignore lists the development files', () => {
  // .assetsignore is only honoured when deploying with Wrangler (Workers).
  // The live site is published by Cloudflare Pages from a Git push, which
  // ignores this file and uploads the whole repository, so keeping it in sync
  // is a prerequisite for a Workers migration rather than a live guarantee.
  const ignore = fs.readFileSync(path.join(REPO_ROOT, '.assetsignore'), 'utf8');
  const patterns = ignore
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  for (const required of ['node_modules', 'tests', 'package.json', 'AGENTS.md', 'LEGGIMI.txt']) {
    assert.ok(patterns.includes(required), `.assetsignore does not list ${required}`);
  }
});