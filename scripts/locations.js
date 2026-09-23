'use strict';

/**
 * Area landing pages.
 *
 * These are committed as static HTML because the site has no build step. The
 * renderer below is the single source of truth: a test compares its output with
 * what is on disk, so editing the shared shell in london.html cannot silently
 * leave the area pages stale.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const SITE = 'https://gsgroupservices.co.uk';

// Change these two lines if the commercial terms move.
const FROM_RATE = 'From £450 per day';
const RATE_NOTE =
  'Rates exclude VAT and cover the machine and its operator. The minimum hire '
  + 'is one day, because mobilising plant to site takes a large part of the '
  + 'first day. The final price is confirmed in writing after a site assessment.';

const RATES = [
  ['Telehandler hire with operator', FROM_RATE],
  ['Forklift hire with operator', FROM_RATE],
  ['Mini digger &amp; dumper hire with operator', FROM_RATE],
  ['Groundworks &amp; site preparation', 'Quoted per project'],
  ['Vehicle box &amp; curtain-side installation', 'Quoted per vehicle'],
  ['Borehole &amp; water well drilling', 'Quoted per project'],
];

const LOCATIONS = [
  {
    slug: 'chigwell-ig7-telehandler-and-forklift-hire',
    area: 'Chigwell',
    postcode: 'IG7',
    region: 'the Essex and east London border',
    intro: [
      'GS Group Services supplies telehandler and forklift hire with operator to '
      + 'Chigwell and the surrounding IG7 area. Chigwell sits between east London '
      + 'and Essex, and we work both sides of that boundary from our base in E16.',
      'We support housebuilding, groundworks and civil engineering sites with '
      + 'operated plant, so a machine always arrives with someone competent to use it.',
    ],
    nearby: ['Buckhurst Hill', 'Loughton', 'Woodford', 'Chigwell Row', 'Grange Hill'],
  },
  {
    slug: 'enfield-en1-telehandler-and-forklift-hire',
    area: 'Enfield',
    postcode: 'EN1',
    region: 'north London and the Hertfordshire border',
    intro: [
      'GS Group Services provides telehandler and forklift hire with operator '
      + 'across Enfield and the neighbouring EN postcodes, covering industrial '
      + 'units and residential development sites alike.',
      'We supply operated plant for lifting, material handling and site '
      + 'logistics, working to UK safety standards on every job.',
    ],
    nearby: ['Potters Bar', 'Barnet', 'Cheshunt', 'Waltham Cross', 'Edmonton'],
  },
  {
    slug: 'ilford-ig1-telehandler-and-forklift-hire',
    area: 'Ilford',
    postcode: 'IG1',
    region: 'east London',
    intro: [
      'GS Group Services delivers telehandler and forklift hire with operator to '
      + 'Ilford and the wider IG area, including sites around the A12 and the '
      + 'North Circular.',
      'Operated plant, mini digger and dumper hire and groundworks support are '
      + 'all available on short and long-term hire.',
    ],
    nearby: ['Barking', 'Stratford', 'Dagenham', 'Romford', 'Wanstead'],
  },
  {
    slug: 'watford-wd17-telehandler-and-forklift-hire',
    area: 'Watford',
    postcode: 'WD17',
    region: 'Hertfordshire',
    intro: [
      'GS Group Services covers Watford and the surrounding Hertfordshire area '
      + 'with telehandler and forklift hire with operator, plus groundworks and '
      + 'vehicle body services.',
      'We work with contractors, developers and commercial clients, and can quote '
      + 'for a single day or a long-term placement.',
    ],
    nearby: ['Bushey', 'Rickmansworth', 'St Albans', 'Hemel Hempstead', 'Abbots Langley'],
  },
];

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Splits london.html into the shared head/header/nav and the shared tail, so
 * both stay in step with the rest of the site.
 */
function shell() {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'london.html'), 'utf8');
  const hero = source.indexOf('<section class="hero">');
  const footer = source.indexOf('<footer>');

  if (hero === -1 || footer === -1) {
    throw new Error('london.html no longer has the expected markers');
  }

  return { head: source.slice(0, hero), foot: source.slice(footer) };
}

function renderLocationPage(loc) {
  const { head, foot } = shell();

  const title = `Telehandler & Forklift Hire in ${loc.area} ${loc.postcode} | GS Group Services`;
  const description =
    `Telehandler and forklift hire with operator in ${loc.area} ${loc.postcode}. `
    + 'Operated plant, mini digger and dumper hire, groundworks and site '
    + `logistics across ${loc.region}.`;
  const canonical = `${SITE}/location/${loc.slug}`;

  const schema = `<!-- Schema.org LocalBusiness -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "GS Group Services",
    "url": "https://gsgroupservices.co.uk",
    "logo": "https://gsgroupservices.co.uk/images/logo.png",
    "image": "https://gsgroupservices.co.uk/images/og-image.jpg",
    "email": "info@gsgroupservices.co.uk",
    "telephone": "+447459672693",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "62 Fulmer Road",
      "addressLocality": "London",
      "postalCode": "E16 3TF",
      "addressCountry": "GB"
    },
    "description": "${escapeAttribute(description)}",
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "${loc.area}"
    }
  }
  </script>`;

  // These pages live one level below the site root, so every asset path has to
  // be site-absolute or it would resolve to /location/css/style.css.
  const pageHead = head
    .replace(/(href|src)="(css|js|images)\//g, '$1="/$2/')
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${escapeAttribute(description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/,
      `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${escapeAttribute(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${escapeAttribute(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/,
      `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta property="og:image:alt" content="[^"]*">/,
      `<meta property="og:image:alt" content="${escapeAttribute(`Telehandler and forklift hire in ${loc.area}`)}">`)
    .replace(/<!-- Schema\.org LocalBusiness -->[\s\S]*?<\/script>/, schema);

  const body = `
<!-- HERO -->
<section class="hero">
  <h1>Telehandler &amp; Forklift Hire in ${loc.area} ${loc.postcode}</h1>
  <p>
    Operated plant hire, groundworks and site logistics across ${loc.area}
    and ${loc.region}.
  </p>
</section>

<!-- INTRO -->
<section class="content">
  <h2>Plant Hire with Operator Covering ${loc.area} ${loc.postcode}</h2>
${loc.intro.map((paragraph) => `  <p>\n    ${paragraph}\n  </p>`).join('\n\n')}
</section>

<!-- SERVICES -->
<section class="services">
  <article class="service">
    <h3>Telehandler Hire with Operator in ${loc.area}</h3>
    <p>
      Telehandler hire with an experienced operator for lifting, material
      handling and site logistics in ${loc.area}. Machines are available with
      a range of reach and lift capacities to suit the site.
    </p>
  </article>

  <article class="service">
    <h3>Forklift Hire with Operator in ${loc.area}</h3>
    <p>
      Forklift hire with operator for loading, unloading and moving materials
      around ${loc.area}, including rough terrain machines for unpaved ground.
    </p>
  </article>

  <article class="service">
    <h3>Groundworks &amp; Excavation in ${loc.area}</h3>
    <p>
      Excavation, trenching and site preparation using mini diggers and dumpers,
      supporting residential and commercial projects in ${loc.area}.
    </p>
  </article>

  <article class="service">
    <h3>Vehicle Box &amp; Curtain-Side Services in ${loc.area}</h3>
    <p>
      Luton box replacement, curtain-side installation and vehicle body work for
      commercial fleets operating in and around ${loc.area}.
    </p>
  </article>

  <article class="service">
    <h3>Borehole &amp; Water Well Drilling in ${loc.area}</h3>
    <p>
      Borehole and water well drilling for private and commercial use, delivered
      by experienced teams in compliance with UK standards.
    </p>
  </article>
</section>

<!-- RATES -->
<section class="content">
  <h2>Indicative Hire Rates in ${loc.area}</h2>
  <p>
    Hire is quoted from a day rate rather than an hourly one, because moving
    plant to and from site takes up a large part of the first day. The figures
    below are a starting point for budgeting work in ${loc.area}.
  </p>

  <table class="rate-table">
    <caption>Plant hire with operator, indicative rates</caption>
    <thead>
      <tr>
        <th scope="col">Service</th>
        <th scope="col">Indicative rate</th>
      </tr>
    </thead>
    <tbody>
${RATES.map(([service, rate]) => `      <tr>\n        <td>${service}</td>\n        <td>${rate}</td>\n      </tr>`).join('\n')}
    </tbody>
  </table>

  <p class="rate-note">${RATE_NOTE}</p>
</section>

<!-- AREAS -->
<section class="areas">
  <h2>Areas Near ${loc.area} We Also Cover</h2>
  <p>
    As well as ${loc.area} ${loc.postcode}, we work across
    ${loc.nearby.join(', ')} and the wider area across ${loc.region}.
    <a href="/london">See every area we cover in London</a>.
  </p>
</section>

<!-- CTA -->
<section class="cta">
  <h2>Need Plant Hire in ${loc.area}?</h2>
  <p>
    Tell us the access, the lift and the duration, and we will come back with a
    firm price for ${loc.area} ${loc.postcode}.
  </p>
  <a href="/contact" class="button">Request a Quote</a>
</section>
`;

  return `${pageHead}${body}\n${foot}`;
}

module.exports = {
  LOCATIONS,
  RATES,
  RATE_NOTE,
  FROM_RATE,
  renderLocationPage,
  REPO_ROOT,
  SITE,
};
