'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * The site's client-side modules live in js/ and are served as static assets.
 * Tests execute that source against a real DOM.
 */
function readModuleSource(fileName) {
  return fs.readFileSync(path.join(REPO_ROOT, fileName), 'utf8');
}

/**
 * Builds a browser-like environment. jsdom reports calls that trigger real
 * navigation (such as location.reload) on its virtual console instead of
 * performing them; `events` captures those messages so tests can assert them.
 */
function createEnv(bodyHtml = '') {
  const events = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (err) => events.push(err.message));

  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body>${bodyHtml}</body></html>`,
    {
      url: 'https://gsgroupservices.co.uk/',
      runScripts: 'outside-only',
      virtualConsole,
    },
  );

  const { window } = dom;

  return {
    dom,
    window,
    document: window.document,
    events,
    reloadCount() {
      return events.filter((msg) => /navigation/i.test(msg)).length;
    },
    /** Runs a module the way a completed page load would: readyState complete. */
    async run(source) {
      await whenReady(window);
      window.eval(source);
    },
  };
}

function whenReady(window) {
  if (window.document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

/**
 * jsdom does not implement matchMedia, so the mobile-nav module needs a stub.
 * The returned handle can flip `matches` and fire the registered change
 * listeners, mirroring what a viewport resize would do.
 */
function installMatchMedia(window, initialMatches = false) {
  const listeners = new Set();
  const mql = {
    media: '(min-width: 769px)',
    matches: initialMatches,
    addEventListener(type, listener) {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'change') listeners.delete(listener);
    },
    addListener(listener) {
      listeners.add(listener);
    },
    removeListener(listener) {
      listeners.delete(listener);
    },
  };

  window.matchMedia = () => mql;

  return {
    mql,
    setMatches(value) {
      mql.matches = value;
      for (const listener of listeners) {
        listener({ matches: value, media: mql.media });
      }
    },
  };
}

/**
 * Replaces window.localStorage with an implementation whose methods throw,
 * reproducing the "storage blocked" (private mode / cookies disabled) case.
 */
function blockLocalStorage(window) {
  const throwing = {
    getItem() { throw new Error('storage blocked'); },
    setItem() { throw new Error('storage blocked'); },
    removeItem() { throw new Error('storage blocked'); },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => throwing,
  });
}

function click(window, element) {
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

module.exports = {
  REPO_ROOT,
  readModuleSource,
  createEnv,
  whenReady,
  installMatchMedia,
  blockLocalStorage,
  click,
};
