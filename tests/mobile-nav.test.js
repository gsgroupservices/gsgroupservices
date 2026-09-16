'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  readModuleSource,
  createEnv,
  installMatchMedia,
  click,
} = require('./helpers/dom');

const SOURCE = readModuleSource('js/nav.js');

const NAV_HTML = `
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
  <nav class="main-nav" id="site-nav">
    <ul>
      <li>
        <a href="/services">Services</a>
        <button class="mega-toggle" type="button" aria-expanded="false" aria-controls="mega-services">Sub</button>
        <div class="mega-menu" id="mega-services">
          <a href="/telehandler-hire-london">Telehandler</a>
        </div>
      </li>
    </ul>
  </nav>`;

/** Boots the nav module with a stubbed matchMedia reporting the given viewport. */
async function boot(bodyHtml = NAV_HTML, isDesktop = false) {
  const env = createEnv(bodyHtml);
  const media = installMatchMedia(env.window, isDesktop);
  await env.run(SOURCE);

  return {
    ...env,
    media,
    nav: env.document.getElementById('site-nav'),
    toggle: env.document.querySelector('.nav-toggle'),
    mega: env.document.getElementById('mega-services'),
    megaToggle: env.document.querySelector('.mega-toggle'),
    navOpen: () => env.document.getElementById('site-nav').classList.contains('is-open'),
    megaOpen: () => env.document.getElementById('mega-services').classList.contains('is-open'),
    pressEscape: () => env.document.dispatchEvent(
      new env.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ),
  };
}

test('does nothing when the page has no nav markup', async () => {
  const env = createEnv('<p>No navigation</p>');
  installMatchMedia(env.window, false);

  await assert.doesNotReject(() => env.run(SOURCE));
});

test('the toggle opens the menu and reflects it in aria-expanded', async () => {
  const ui = await boot();

  click(ui.window, ui.toggle);

  assert.equal(ui.navOpen(), true);
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'true');
});

test('the toggle closes the menu again on a second click', async () => {
  const ui = await boot();

  click(ui.window, ui.toggle);
  click(ui.window, ui.toggle);

  assert.equal(ui.navOpen(), false);
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'false');
});

test('the submenu toggle opens and closes the mega menu', async () => {
  const ui = await boot();

  click(ui.window, ui.megaToggle);
  assert.equal(ui.megaOpen(), true);
  assert.equal(ui.megaToggle.getAttribute('aria-expanded'), 'true');

  click(ui.window, ui.megaToggle);
  assert.equal(ui.megaOpen(), false);
  assert.equal(ui.megaToggle.getAttribute('aria-expanded'), 'false');
});

test('tapping a link on mobile closes the menu and the submenu', async () => {
  const ui = await boot(NAV_HTML, false);
  click(ui.window, ui.toggle);
  click(ui.window, ui.megaToggle);

  click(ui.window, ui.mega.querySelector('a'));

  assert.equal(ui.navOpen(), false);
  assert.equal(ui.megaOpen(), false);
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'false');
});

test('a link click on desktop leaves the menu state alone', async () => {
  const ui = await boot(NAV_HTML, true);
  click(ui.window, ui.toggle);

  click(ui.window, ui.mega.querySelector('a'));

  // The desktop layout has no collapsible menu, so nothing should change.
  assert.equal(ui.navOpen(), true);
});

test('Escape closes an open menu and returns focus to the toggle', async () => {
  const ui = await boot();
  click(ui.window, ui.toggle);

  ui.pressEscape();

  assert.equal(ui.navOpen(), false);
  assert.equal(ui.megaOpen(), false);
  assert.equal(ui.document.activeElement, ui.toggle);
});

test('Escape on a closed menu does not move focus', async () => {
  const ui = await boot();

  ui.pressEscape();

  assert.equal(ui.navOpen(), false);
  assert.notEqual(ui.document.activeElement, ui.toggle);
});

test('resizing up to desktop resets the open state', async () => {
  const ui = await boot(NAV_HTML, false);
  click(ui.window, ui.toggle);
  click(ui.window, ui.megaToggle);
  assert.equal(ui.navOpen(), true);

  ui.media.setMatches(true);

  assert.equal(ui.navOpen(), false);
  assert.equal(ui.megaOpen(), false);
});

test('resizing down to mobile keeps the current state', async () => {
  const ui = await boot(NAV_HTML, true);
  click(ui.window, ui.toggle);

  ui.media.setMatches(false);

  assert.equal(ui.navOpen(), true);
});

test('a page without the submenu still toggles the menu', async () => {
  const ui = await boot(`
    <button class="nav-toggle" type="button" aria-expanded="false">Menu</button>
    <nav id="site-nav"><a href="/">Home</a></nav>`);

  assert.doesNotThrow(() => click(ui.window, ui.toggle));
  assert.equal(ui.navOpen(), true);
});