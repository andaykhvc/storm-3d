import { routes, contact, legalLinks } from '../content/data.js';
import { normalizePath } from './kit.js';
import { home } from './home.js';
import { hellion, animaObscura, stylingPage, filmPage } from './projects.js';
import { about, contactPage, privacy, businessDetails, cookies, accessibility, terms, notFound } from './info.js';

const pages = {
  '/': home, '/hellion/': hellion, '/anima-obscura/': animaObscura, '/styling/': stylingPage, '/film/': filmPage,
  '/about/': about, '/contact/': contactPage, '/privacy/': privacy, '/legal/': businessDetails, '/cookies/': cookies,
  '/accessibility/': accessibility, '/terms/': terms,
};
const nav = [['Work', '/'], ['Film', '/film/'], ['About', '/about/'], ['Contact', '/contact/']];

function header(path) {
  const current = (href) => (href === '/' ? ['/', '/hellion/', '/anima-obscura/', '/styling/'].includes(path) : path === href);
  return `<header class="bar">
    <a class="bar-mark" href="/" aria-label="Storm Nijhuis, all work">Storm Nijhuis</a>
    <nav class="bar-nav" aria-label="Main">${nav.map(([name, href]) => `<a href="${href}"${current(href) ? ' aria-current="page"' : ''}>${name}</a>`).join('')}</nav>
  </header>`;
}

function footer(path) {
  return `<footer class="foot">
    <a class="foot-mail" href="mailto:${contact.email}">${contact.email}</a>
    <div class="foot-row">
      <p class="foot-mark">Storm Nijhuis</p>
      <ul class="foot-links">
        <li><a href="${contact.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><a href="${contact.cv}" target="_blank" rel="noopener">CV</a></li>
        <li>Amsterdam</li>
        <li>© ${new Date().getUTCFullYear()}</li>
      </ul>
    </div>
    <nav class="foot-legal" aria-label="Legal and accessibility">${legalLinks.map(([name, href]) => `<a href="${href}"${path === href ? ' aria-current="page"' : ''}>${name}</a>`).join('')}</nav>
  </footer>`;
}

const viewer = `<dialog class="viewer" aria-label="Photograph viewer">
  <button type="button" class="viewer-close" autofocus>Close</button>
  <a class="viewer-project" href="/" hidden></a>
  <div class="viewer-stage"><img class="viewer-image" alt="" draggable="false" /></div>
  <p class="viewer-caption" aria-live="polite"></p>
  <div class="viewer-controls">
    <button type="button" data-step="-1">Previous</button>
    <span class="viewer-count"></span>
    <button type="button" data-step="1">Next</button>
  </div>
</dialog>`;

export function renderPage(rawPath) {
  const path = normalizePath(rawPath);
  const page = pages[path] || notFound;
  const isHome = path === '/';
  return `${header(path)}<main id="main" data-route="${path}" tabindex="-1">${page()}</main>${isHome ? '' : footer(path)}${viewer}`;
}

export function pageMeta(rawPath) {
  const path = normalizePath(rawPath);
  const meta = routes[path] || { title: 'Page not found', description: 'Explore the work of Storm Nijhuis.' };
  return { ...meta, title: path === '/' ? meta.title : `${meta.title} — Storm Nijhuis` };
}
