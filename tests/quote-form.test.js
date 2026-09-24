'use strict';

/**
 * Unit tests for scripts/quote-form.js.
 *
 * The hero and the contact form are both generated, and the generator is the
 * only place where a typo would silently produce markup that still looks fine
 * in a browser but posts nothing useful. These tests exercise the generator
 * directly, without going through the built pages, so a broken generator is
 * reported against the generator.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const {
  FORM_ACTION,
  FIELDS,
  HERO_FIELDS,
  NAV_FIELDS,
  PHONE_HREF,
  escapeAttribute,
  heroQuoteForm,
  fullQuoteForm,
  heroFormSection,
} = require('../scripts/quote-form');

/** Parses a generated fragment into a document. */
function parse(html) {
  return new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
}

test('escapeAttribute neutralises the characters that break out of an attribute', () => {
  // Used for the area name on the location pages, so it has to survive a
  // double quote in the value rather than terminate the attribute early.
  assert.equal(escapeAttribute('Chigwell'), 'Chigwell');
  assert.equal(escapeAttribute('a"b'), 'a&quot;b');
  // Only `&` and `"` can end a double-quoted attribute, so `<` and `>` are
  // deliberately left alone: escaping them here would show as `&gt;` in the
  // rendered alt text.
  assert.equal(
    escapeAttribute('" onload="alert(1)'),
    '&quot; onload=&quot;alert(1)',
  );
  // Ampersands are escaped first, or the escaping above would be double-encoded.
  assert.equal(escapeAttribute('&"'), '&amp;&quot;');
  // Non-strings are coerced rather than throwing.
  assert.equal(escapeAttribute(0), '0');
  assert.equal(escapeAttribute(null), 'null');
});

test('escapeAttribute keeps a hostile value inside the attribute it was put in', () => {
  // The real failure mode: a quote in the value escaping into a new attribute.
  const dom = parse(`<meta content="${escapeAttribute('x" onload="alert(1)')}">`);
  const meta = dom.querySelector('meta');

  assert.equal(meta.getAttribute('onload'), null);
  assert.equal(meta.getAttribute('content'), 'x" onload="alert(1)');
});

test('both forms post to the same endpoint', () => {
  const hero = parse(heroQuoteForm()).querySelector('form');
  const full = parse(fullQuoteForm()).querySelector('form');

  assert.equal(hero.getAttribute('action'), FORM_ACTION);
  assert.equal(full.getAttribute('action'), FORM_ACTION);
  assert.equal(hero.getAttribute('method'), 'POST');
  assert.equal(full.getAttribute('method'), 'POST');
});

test('the hero form carries exactly the hero fields, plus the honeypot', () => {
  const form = parse(heroQuoteForm()).querySelector('form');
  const names = [...form.querySelectorAll('[name]')].map((el) => el.getAttribute('name')).sort();

  assert.deepEqual(names, [...HERO_FIELDS].sort());

  // The honeypot is the one field a user never sees, so it must stay hidden
  // from assistive tech and out of the tab order.
  const honeypot = form.querySelector('[name="website"]');
  assert.ok(honeypot.classList.contains('honeypot-field'));
  assert.equal(honeypot.getAttribute('tabindex'), '-1');
  assert.equal(honeypot.getAttribute('aria-hidden'), 'true');
  assert.equal(honeypot.getAttribute('required'), null);
});

test('the full form carries exactly the full field set, plus the honeypot', () => {
  const form = parse(fullQuoteForm()).querySelector('form');
  const names = [...form.querySelectorAll('[name]')].map((el) => el.getAttribute('name')).sort();

  assert.deepEqual(names, [...FIELDS].sort());
});

test('every hero field name is also a full-form field name', () => {
  // Both forms feed one Formspree inbox. A hero-only field name would arrive
  // under a key the contact form never produces.
  for (const name of HERO_FIELDS) {
    assert.ok(FIELDS.includes(name), `hero field "${name}" is not in FIELDS`);
  }
});

test('every label points at an input that exists', () => {
  // A label whose `for` matches nothing looks fine and breaks clicking.
  for (const html of [heroQuoteForm(), fullQuoteForm(), heroFormSection({ title: 'T', subtitle: 'S' })]) {
    const dom = parse(html);
    const labels = [...dom.querySelectorAll('label')];

    assert.ok(labels.length > 0, 'expected at least one label');
    for (const label of labels) {
      const target = label.getAttribute('for');
      assert.ok(target, 'a label has no for attribute');
      assert.ok(dom.getElementById(target), `label for="${target}" has no matching element`);
    }
  }
});

test('every required field says so to assistive tech as well', () => {
  for (const html of [heroQuoteForm(), fullQuoteForm()]) {
    const dom = parse(html);
    for (const el of dom.querySelectorAll('[required]')) {
      assert.equal(
        el.getAttribute('aria-required'),
        'true',
        `${el.getAttribute('name')} is required but not aria-required`,
      );
    }
  }
});

test('the two forms use different input ids so they cannot collide', () => {
  const hero = [...parse(heroQuoteForm('hero')).querySelectorAll('[id]')].map((el) => el.id);
  const full = [...parse(fullQuoteForm('contact')).querySelectorAll('[id]')].map((el) => el.id);

  assert.ok(hero.length > 0);
  assert.deepEqual(hero.filter((id) => full.includes(id)), []);
});

test('a custom uid flows through to every id and label', () => {
  // The location generator passes a uid, and a half-applied prefix is the kind
  // of thing that only shows up as a broken label in production.
  const dom = parse(heroQuoteForm('chigwell'));
  const ids = [...dom.querySelectorAll('[id]')].map((el) => el.id);

  assert.ok(ids.length > 0);
  for (const id of ids) {
    assert.match(id, /^chigwell-/, `id "${id}" does not carry the uid prefix`);
  }
  for (const label of dom.querySelectorAll('label[for]')) {
    assert.match(label.getAttribute('for'), /^chigwell-/);
  }
});

test('indentation is applied to every line of the fragment', () => {
  // The fragments are pasted into templates, so a line that escaped the indent
  // would show up as misaligned markup in the generated file. Nested lines add
  // their own spaces on top, so the check is that every line starts with the
  // requested prefix.
  const indent = '    ';
  const lines = heroQuoteForm('hero', indent).split('\n');
  const content = lines.filter((line) => line.trim().length > 0);

  assert.ok(content.length > 5);
  for (const line of content) {
    assert.ok(
      line.startsWith(indent),
      `line does not start with the indent: ${JSON.stringify(line.slice(0, 40))}`,
    );
  }

  // The whole fragment shifts when the indent does.
  const deeper = heroQuoteForm('hero', '        ').split('\n').filter((line) => line.trim().length > 0);
  assert.equal(deeper.length, content.length);
  for (const line of deeper) {
    assert.ok(line.startsWith('        '));
  }
});

test('the hero section leads with the title and subtitle it was given', () => {
  const html = heroFormSection({ title: 'Hire in Chigwell', subtitle: 'Operated plant hire.' });
  const dom = parse(html);
  const section = dom.querySelector('.hero');

  assert.equal(section.querySelector('h1').textContent, 'Hire in Chigwell');
  assert.equal(section.querySelector('.hero-subtitle').textContent, 'Operated plant hire.');
});

test('the hero section puts the copy before the form', () => {
  // The two-column grid puts the first child on the left, so the form only
  // lands on the right if the copy comes first in source order.
  const dom = parse(heroFormSection({ title: 'T', subtitle: 'S' }));
  const section = dom.querySelector('.hero');
  const children = [...section.children].map((el) => el.className);

  assert.deepEqual(children, ['hero-copy', 'hero-form']);
});

test('the hero call button dials the number and shows no digits', () => {
  // The button says what it does and dials the right number, but the number
  // itself is left to the header so the hero is not shouting it twice.
  const dom = parse(heroFormSection({ title: 'T', subtitle: 'S' }));
  const call = dom.querySelector('.hero-call');

  assert.equal(call.getAttribute('href'), PHONE_HREF);
  assert.match(call.textContent.trim(), /call/i);
  assert.doesNotMatch(call.textContent, /\d/);
  assert.equal(call.querySelector('.call-number'), null);
  assert.equal(call.querySelector('.call-label'), null);
});

test('the hero section accepts custom points instead of the defaults', () => {
  const dom = parse(heroFormSection({
    title: 'T',
    subtitle: 'S',
    points: ['First claim', 'Second claim'],
  }));
  const points = [...dom.querySelectorAll('.hero-points li')].map((li) => li.textContent);

  assert.deepEqual(points, ['First claim', 'Second claim']);
});

test('the service dropdown offers exactly the advertised services', () => {
  // The values are what lands in the inbox, so the list is part of the
  // contract with whoever reads the submissions.
  const dom = parse(fullQuoteForm());
  const options = [...dom.querySelectorAll('select[name="service"] option')]
    .map((o) => o.getAttribute('value'));

  assert.equal(options[0], '', 'the first option should be the empty placeholder');

  const services = options.slice(1);
  assert.deepEqual(services, NAV_FIELDS);
  // Every service is a real, selectable value.
  for (const service of services) {
    assert.ok(service.length > 0);
  }
});
