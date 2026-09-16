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
  return localReferences(html).filter((ref) => {
    if (ref.startsWith('/')) return false; // site route, checked separately
    return /\.(?:js|css|png|jpe?g|webp|svg|ico|gif|avif|woff2?|ttf)$/i.test(ref);
  });
}

test('every local asset referenced by a page exists', () => {
  const missing = [];

  for (const name of PAGES) {
    for (const ref of localAssetReferences(readPage(name))) {
      const target = path.join(REPO_ROOT, ref);
      if (!fs.existsSync(target)) missing.push(`${name} -> ${ref}`);
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
    assert.match(html, /src="js\/nav\.js"/, `${name} does not load js/nav.js`);
    assert.match(html, /src="js\/analytics\.js"/, `${name} does not load js/analytics.js`);
    assert.match(html, /href="css\/style\.css"/, `${name} does not load the stylesheet`);
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