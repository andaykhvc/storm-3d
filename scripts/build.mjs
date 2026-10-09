import { build } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { routes } from '../src/content/data.js';
import { renderPage, pageMeta } from '../src/views/layout.js';
import { escape } from '../src/views/kit.js';

await build();
const shell = await readFile('dist/index.html', 'utf8');
const page = (path) => {
  const { title, description } = pageMeta(path);
  return shell
    .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace('<div id="app"></div>', `<div id="app">${renderPage(path)}</div>`);
};
for (const path of Object.keys(routes)) {
  await mkdir(`dist${path}`, { recursive: true });
  await writeFile(`dist${path}index.html`, page(path));
}
await writeFile('dist/404.html', page('/404/'));
console.log(`Pre-rendered ${Object.keys(routes).length} pages and the 404 page.`);
