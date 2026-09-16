'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  readModuleSource,
  createEnv,
  blockLocalStorage,
  click,
} = require('./helpers/dom');

const SOURCE = readModuleSource('js/analytics.js');
const CONSENT_KEY = 'gsCookieConsent';
const GA_ID = 'G-3YT6HTNT11';

const BANNER_HTML = `
  <div id="cookie-banner" class="cookie-banner">
    <button type="button" class="cookie-reject">Reject</button>
    <button type="button" class="cookie-accept">Accept</button>
  </div>`;

function analyticsScripts(document) {
  return document.querySelectorAll('script[src*="googletagmanager.com"]');
}

function bannerIsVisible(document) {
  return document.getElementById('cookie-banner').classList.contains('is-visible');
}

test('shows the banner when no choice has been stored yet', async () => {
  const env = createEnv(BANNER_HTML);
  await env.run(SOURCE);

  assert.equal(bannerIsVisible(env.document), true);
});

test('does not load GA4 before the visitor makes a choice', async () => {
  const env = createEnv(BANNER_HTML);
  await env.run(SOURCE);

  assert.equal(analyticsScripts(env.document).length, 0);
  assert.equal(env.window.dataLayer, undefined);
});

test('accepting stores consent, hides the banner and loads GA4', async () => {
  const env = createEnv(BANNER_HTML);
  await env.run(SOURCE);

  click(env.window, env.document.querySelector('.cookie-accept'));

  assert.equal(env.window.localStorage.getItem(CONSENT_KEY), 'granted');
  assert.equal(bannerIsVisible(env.document), false);

  const scripts = analyticsScripts(env.document);
  assert.equal(scripts.length, 1);
  assert.equal(
    scripts[0].src,
    `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
  );
  assert.equal(scripts[0].async, true);
});

test('accepting configures GA4 with IP anonymisation', async () => {
  const env = createEnv(BANNER_HTML);
  await env.run(SOURCE);

  click(env.window, env.document.querySelector('.cookie-accept'));

  const calls = Array.from(env.window.dataLayer);
  const config = calls.find((entry) => entry[0] === 'config');
  assert.ok(config, 'expected a gtag config call');
  assert.equal(config[1], GA_ID);
  assert.equal(config[2].anonymize_ip, true);
});

test('rejecting stores the refusal and leaves GA4 unloaded', async () => {
  const env = createEnv(BANNER_HTML);
  await env.run(SOURCE);

  click(env.window, env.document.querySelector('.cookie-reject'));

  assert.equal(env.window.localStorage.getItem(CONSENT_KEY), 'denied');
  assert.equal(bannerIsVisible(env.document), false);
  assert.equal(analyticsScripts(env.document).length, 0);
  assert.equal(env.window.dataLayer, undefined);
});

test('a stored "granted" choice loads GA4 and never shows the banner', async () => {
  const env = createEnv(BANNER_HTML);
  env.window.localStorage.setItem(CONSENT_KEY, 'granted');

  await env.run(SOURCE);

  assert.equal(analyticsScripts(env.document).length, 1);
  assert.equal(bannerIsVisible(env.document), false);
});

test('a stored "denied" choice keeps GA4 off and hides the banner', async () => {
  const env = createEnv(BANNER_HTML);
  env.window.localStorage.setItem(CONSENT_KEY, 'denied');

  await env.run(SOURCE);

  assert.equal(analyticsScripts(env.document).length, 0);
  assert.equal(bannerIsVisible(env.document), false);
});

test('GA4 is only ever injected once, even if the module runs twice', async () => {
  const env = createEnv(BANNER_HTML);
  await env.run(SOURCE);

  click(env.window, env.document.querySelector('.cookie-accept'));
  env.window.eval(SOURCE);

  // A second run would append a duplicate tag if the guard were missing.
  assert.equal(analyticsScripts(env.document).length, 1);
});

test('a page without the banner does not throw', async () => {
  const env = createEnv('<p>No banner here</p>');

  await assert.doesNotReject(() => env.run(SOURCE));
  assert.equal(env.window.dataLayer, undefined);
});

test('accepting still works when localStorage is blocked', async () => {
  const env = createEnv(BANNER_HTML);
  blockLocalStorage(env.window);

  await env.run(SOURCE);
  click(env.window, env.document.querySelector('.cookie-accept'));

  // Storage is unavailable, but the banner is dismissed for this session.
  assert.equal(bannerIsVisible(env.document), false);
  assert.equal(analyticsScripts(env.document).length, 1);
});

test('a stored choice cannot be read when localStorage is blocked', async () => {
  const env = createEnv(BANNER_HTML);
  blockLocalStorage(env.window);

  await env.run(SOURCE);

  // Falling back to "no stored choice" means the banner is offered again.
  assert.equal(bannerIsVisible(env.document), true);
});

test('gsResetCookieChoice clears the stored value and reloads', async () => {
  const env = createEnv(BANNER_HTML);
  await env.run(SOURCE);

  click(env.window, env.document.querySelector('.cookie-accept'));
  assert.equal(env.window.localStorage.getItem(CONSENT_KEY), 'granted');

  env.window.gsResetCookieChoice();

  assert.equal(env.window.localStorage.getItem(CONSENT_KEY), null);
  assert.equal(env.reloadCount(), 1);
});

test('gsResetCookieChoice is exposed even when storage is blocked', async () => {
  const env = createEnv(BANNER_HTML);
  blockLocalStorage(env.window);
  await env.run(SOURCE);

  assert.equal(typeof env.window.gsResetCookieChoice, 'function');
  assert.doesNotThrow(() => env.window.gsResetCookieChoice());
  assert.equal(env.reloadCount(), 1);
});