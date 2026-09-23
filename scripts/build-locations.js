'use strict';

/**
 * Writes the area landing pages into location/. Run after changing
 * scripts/locations.js or the shared shell in london.html.
 *
 *   node scripts/build-locations.js
 */

const fs = require('node:fs');
const path = require('node:path');

const { LOCATIONS, renderLocationPage, REPO_ROOT } = require('./locations');

const OUT = path.join(REPO_ROOT, 'location');

fs.mkdirSync(OUT, { recursive: true });

for (const loc of LOCATIONS) {
  const target = path.join(OUT, `${loc.slug}.html`);
  fs.writeFileSync(target, renderLocationPage(loc));
  console.log(`wrote ${path.relative(REPO_ROOT, target)}`);
}
