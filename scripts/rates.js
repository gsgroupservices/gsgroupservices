'use strict';

/**
 * The hire rates shown anywhere on the site.
 *
 * Single source of truth: index.html, services.html and the generated area
 * pages all render from these values, and a test fails if a hand-written page
 * drifts from them. Change the commercial terms here, then run
 * `npm run build:locations` and update any page the test reports.
 */

const FROM_RATE = 'From £450 per day';
const DAILY_RATE_SHORT = '£450 per day';

/**
 * `daily: true` marks work that is genuinely sold by the day. Groundworks,
 * vehicle body work and borehole drilling are quoted per project, and putting a
 * day rate against them would mislead about what a customer actually pays.
 */
const RATES = [
  { service: 'Telehandler hire with operator', rate: FROM_RATE, daily: true },
  { service: 'Forklift hire with operator', rate: FROM_RATE, daily: true },
  { service: 'Mini digger &amp; dumper hire with operator', rate: FROM_RATE, daily: true },
  { service: 'Groundworks &amp; site preparation', rate: 'Quoted per project', daily: false },
  { service: 'Vehicle box &amp; curtain-side installation', rate: 'Quoted per vehicle', daily: false },
  { service: 'Borehole &amp; water well drilling', rate: 'Quoted per project', daily: false },
];

const RATE_NOTE =
  'Rates exclude VAT and cover the machine and its operator. The minimum hire '
  + 'is one day, because mobilising plant to site takes a large part of the '
  + 'first day. The final price is confirmed in writing after a site assessment.';

/** The rate table, shared by every page that shows prices. */
function rateTable(caption, indent = '  ') {
  const rows = RATES
    .map((r) => `${indent}    <tr>\n${indent}      <td>${r.service}</td>\n${indent}      <td>${r.rate}</td>\n${indent}    </tr>`)
    .join('\n');

  return [
    `${indent}<table class="rate-table">`,
    `${indent}  <caption>${caption}</caption>`,
    `${indent}  <thead>`,
    `${indent}    <tr>`,
    `${indent}      <th scope="col">Service</th>`,
    `${indent}      <th scope="col">Indicative rate</th>`,
    `${indent}    </tr>`,
    `${indent}  </thead>`,
    `${indent}  <tbody>`,
    rows,
    `${indent}  </tbody>`,
    `${indent}</table>`,
    '',
    `${indent}<p class="rate-note">${RATE_NOTE}</p>`,
  ].join('\n');
}

module.exports = { FROM_RATE, DAILY_RATE_SHORT, RATES, RATE_NOTE, rateTable };
