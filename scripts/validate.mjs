import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { assets, archive, looks, projects, routes, film } from '../src/content/data.js';
import { renderPage } from '../src/views/layout.js';

// The work: seven looks of four views; every shown photograph exists, once, with its derivatives.
assert.equal(looks.length, 7, 'Seven looks are shown.');
assert.deepEqual(looks.map((l) => l.source), ['01', '02', '03', '04', '05', '07', '09'], 'Lookbook sets 06 and 08 stay out.');
assert.equal(new Set(archive).size, archive.length, 'Each photograph appears on the table once.');
assert.equal(film.stills.length, 13);
for (const id of archive) {
  const asset = assets.get(id);
  assert(asset, `Unknown photograph: ${id}`);
  for (const size of ['small', 'medium', 'large']) {
    await access(`public${asset[size].src}`);
    assert(Math.abs(asset[size].width / asset[size].height - asset.width / asset.height) < 0.007, `Changed proportions: ${id}`);
  }
}
for (const project of projects) assert(project.photos.includes(project.cover), `${project.title} cover belongs to the project.`);

const links = new Set();
for (const path of Object.keys(routes)) {
  const html = renderPage(path);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `One main heading: ${path}`);
  assert(!/<video|<iframe/i.test(html), 'No film playback before release.');
  for (const [, id] of html.matchAll(/data-view="([^"]+)"/g)) assert(assets.has(id));
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) links.add(href);
}
for (const href of links) {
  if (href.startsWith('/assets/')) await access(`public${href}`);
  else assert(href in routes, `Broken internal link: ${href}`);
}
for (const file of await readdir('public/assets')) assert(!/\.(mp4|mov|pptx|tif)$/i.test(file), `Private source exposed: ${file}`);

let css = '';
for (const file of await readdir('src/styles')) css += await readFile(`src/styles/${file}`, 'utf8');
assert(!/(^|[^-])filter\s*:|object-fit\s*:\s*cover/im.test(css), 'Photographs are never filtered or cropped.');
assert(css.includes('prefers-reduced-motion'), 'Reduced motion is respected.');
console.log(`Checks passed: ${Object.keys(routes).length} pages, ${archive.length} photographs on the table, links valid.`);
