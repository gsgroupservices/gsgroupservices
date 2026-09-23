'use strict';

/**
 * The "Get a Free Quote" form.
 *
 * Single source of truth for the hero form on the homepage and the generated
 * area pages. The field names match the form on contact.html exactly, so every
 * submission lands in the Formspree inbox with the same shape regardless of the
 * page it came from.
 */

const FORM_ACTION = 'https://formspree.io/f/mzdazrgn';

const SERVICES = [
  'Telehandler Hire',
  'Forklift Hire',
  'Groundworks',
  'Mini Digger & Dumper',
  'Vehicle Box Services',
  'Borehole Drilling',
];

/** Field names every quote form must carry, honeypot included. */
const FIELDS = ['website', 'name', 'email', 'phone', 'service', 'location', 'message'];

/** Short claims already made elsewhere on the site, plus the headline rate. */
const HERO_POINTS = [
  'Operated telehandler &amp; forklift hire',
  'From £450 per day, machine and operator',
  'Mini digger, dumper and groundworks support',
  'Experienced operators, full UK safety compliance',
  'Covering London and the wider UK',
];

const PHONE_DISPLAY = '07459 672693';
const PHONE_HREF = 'tel:+447459672693';

/**
 * The form markup. `u` prefixes the field ids and label targets so two forms
 * on one page cannot collide.
 */
function quoteForm(u = 'hero', indent = '      ') {
  const p = indent;

  return `${p}<form action="${FORM_ACTION}" method="POST" class="quote-form">
${p}  <!-- Honeypot field - hidden from users, catches bots -->
${p}  <input type="text" name="website" class="honeypot-field" tabindex="-1" autocomplete="off">

${p}  <label for="${u}-name">Full Name *</label>
${p}  <input type="text" id="${u}-name" name="name" required aria-required="true">

${p}  <label for="${u}-phone">Phone *</label>
${p}  <input type="tel" id="${u}-phone" name="phone" required aria-required="true" placeholder="07XXX XXXXXX">

${p}  <label for="${u}-email">Email *</label>
${p}  <input type="email" id="${u}-email" name="email" required aria-required="true">

${p}  <label for="${u}-service">Service Required *</label>
${p}  <select id="${u}-service" name="service" required aria-required="true">
${p}    <option value="">Select a service</option>
${SERVICES.map((s) => `${p}    <option value="${s}">${s}</option>`).join('\n')}
${p}  </select>

${p}  <label for="${u}-location">Project Location</label>
${p}  <input type="text" id="${u}-location" name="location" placeholder="e.g. London, Enfield, Ilford">

${p}  <label for="${u}-message">Project Details</label>
${p}  <textarea id="${u}-message" name="message" rows="4" placeholder="Tell us about your project requirements..."></textarea>

${p}  <button type="submit" class="button">Get a Free Quote</button>
${p}</form>`;
}

/** The two-column hero: copy and phone on the left, the form on the right. */
function heroFormSection({ title, lead, area, indent = '  ' }) {
  const p = indent;
  const leadText = area
    ? `Operated plant hire, groundworks and site logistics across ${area}.`
    : lead;

  return `${p}<section class="hero hero-split">
${p}  <div class="hero-copy">
${p}    <h1>${title}</h1>
${p}    <p>${leadText}</p>

${p}    <ul class="hero-points">
${HERO_POINTS.map((point) => `${p}      <li>${point}</li>`).join('\n')}
${p}    </ul>

${p}    <a href="${PHONE_HREF}" class="button hero-call">Call ${PHONE_DISPLAY}</a>
${p}  </div>

${p}  <div class="hero-form">
${p}    <h2>Get a Free Quote</h2>
${p}    <p class="hero-form-lead">Send us the details and we will come back with a price.</p>

${quoteForm('hero', `${p}    `)}
${p}  </div>
${p}</section>`;
}

module.exports = {
  FORM_ACTION,
  FIELDS,
  SERVICES,
  HERO_POINTS,
  PHONE_DISPLAY,
  PHONE_HREF,
  quoteForm,
  heroFormSection,
};
