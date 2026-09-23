'use strict';

/**
 * The hero block: headline and subtitle, what we do on the left with a phone
 * number, and the quote form on the right.
 *
 * The form is deliberately short. It sits above the fold, so it has to fit in
 * the viewport alongside the headline; every field added pushes the submit
 * button out of sight on a laptop. The full-length form, with service and
 * project details, lives on /contact.
 *
 * Field names stay identical across both forms so every submission reaches the
 * Formspree inbox with the same shape.
 */

const FORM_ACTION = 'https://formspree.io/f/mzdazrgn';

/** Full-length form on /contact.html. */
const NAV_FIELDS = [
  'Telehandler Hire',
  'Forklift Hire',
  'Groundworks',
  'Mini Digger & Dumper',
  'Vehicle Box Services',
  'Borehole Drilling',
];

/** The hero form. Short enough to stay above the fold. */
const HERO_FIELDS = ['website', 'name', 'phone', 'email', 'message'];

/** Full form on /contact.html. */
const FIELDS = ['website', 'name', 'email', 'phone', 'service', 'location', 'message'];

/**
 * Short claims. These are the same commitments the rest of the site makes, so
 * this list has to be kept in step with the copy on /services.
 */
const HERO_POINTS = [
  'Operated plant hire, telehandler and forklift',
  'Mini digger, dumper and groundworks support',
  'From £450 per day, machine and operator included',
  'Full UK safety compliance, experienced operators',
];

const PHONE_DISPLAY = '07459 672693';
const PHONE_HREF = 'tel:+447459672693';

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** The short hero form. `u` prefixes ids so two forms cannot collide. */
function heroQuoteForm(u = 'hero', indent = '        ') {
  const p = indent;

  return `${p}<form action="${FORM_ACTION}" method="POST" class="quote-form quote-form--hero">
${p}  <!-- Honeypot field - hidden from users, catches bots -->
${p}  <input type="text" name="website" class="honeypot-field" tabindex="-1" autocomplete="off" aria-hidden="true">

${p}  <label for="${u}-name">Name</label>
${p}  <input type="text" id="${u}-name" name="name" required aria-required="true" autocomplete="name">

${p}  <label for="${u}-phone">Phone</label>
${p}  <input type="tel" id="${u}-phone" name="phone" required aria-required="true" autocomplete="tel" placeholder="07XXX XXXXXX">

${p}  <label for="${u}-email">Email</label>
${p}  <input type="email" id="${u}-email" name="email" required aria-required="true" autocomplete="email">

${p}  <label for="${u}-message">What do you need?</label>
${p}  <textarea id="${u}-message" name="message" rows="2" placeholder="Machine, dates, site postcode..."></textarea>

${p}  <button type="submit" class="button">Request a Quote</button>
${p}</form>`;
}

/** The full form, used on /contact.html. */
function fullQuoteForm(u = 'contact', indent = '    ') {
  const p = indent;

  return `${p}<form action="${FORM_ACTION}" method="POST" class="quote-form quote-form--full">
${p}  <!-- Honeypot field - hidden from users, catches bots -->
${p}  <input type="text" name="website" class="honeypot-field" tabindex="-1" autocomplete="off" aria-hidden="true">

${p}  <label for="${u}-name">Full Name *</label>
${p}  <input type="text" id="${u}-name" name="name" required aria-required="true" autocomplete="name">

${p}  <label for="${u}-email">Email *</label>
${p}  <input type="email" id="${u}-email" name="email" required aria-required="true" autocomplete="email">

${p}  <label for="${u}-phone">Phone *</label>
${p}  <input type="tel" id="${u}-phone" name="phone" required aria-required="true" autocomplete="tel" placeholder="07XXX XXXXXX">

${p}  <label for="${u}-service">Service Required *</label>
${p}  <select id="${u}-service" name="service" required aria-required="true">
${p}    <option value="">Select a service</option>
${NAV_FIELDS.map((s) => `${p}    <option value="${s}">${s}</option>`).join('\n')}
${p}  </select>

${p}  <label for="${u}-location">Project Location</label>
${p}  <input type="text" id="${u}-location" name="location" placeholder="e.g. London, Enfield, Ilford">

${p}  <label for="${u}-message">Project Details</label>
${p}  <textarea id="${u}-message" name="message" rows="5" placeholder="Tell us about your project requirements..."></textarea>

${p}  <button type="submit" class="button">Get a Free Quote</button>
${p}</form>`;
}

/**
 * The hero. `title` is the headline, `subtitle` the line under it, and `area`
 * the coverage phrase echoed back on the area pages.
 */
function heroFormSection({
  title,
  subtitle,
  points = HERO_POINTS,
  uid = 'hero',
  indent = '  ',
}) {
  const p = indent;

  return `${p}<section class="hero">
${p}  <div class="hero-copy">
${p}    <h1>${title}</h1>
${p}    <p class="hero-subtitle">${subtitle}</p>

${p}    <ul class="hero-points">
${points.map((point) => `${p}      <li>${point}</li>`).join('\n')}
${p}    </ul>

${p}    <div class="hero-actions">
${p}      <a href="${PHONE_HREF}" class="hero-call">
${p}        <span class="call-label">Call us today</span>
${p}        <span class="call-number">${PHONE_DISPLAY}</span>
${p}      </a>
${p}    </div>
${p}  </div>

${p}  <div class="hero-form">
${p}    <h2>Request a Quote</h2>
${p}    <p class="hero-form-lead">Tell us what you need and we will come back with a price.</p>

${heroQuoteForm(uid, `${p}    `)}
${p}  </div>
${p}</section>`;
}

module.exports = {
  FORM_ACTION,
  FIELDS,
  HERO_FIELDS,
  NAV_FIELDS,
  HERO_POINTS,
  PHONE_DISPLAY,
  PHONE_HREF,
  escapeAttribute,
  heroQuoteForm,
  fullQuoteForm,
  heroFormSection,
};
