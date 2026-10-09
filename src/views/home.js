import { projects, archive, legalLinks } from '../content/data.js';
import { picture } from './kit.js';

const plural = (n) => `${n} photograph${n === 1 ? '' : 's'}`;

// The light table (src/gl/table.js) draws into [data-table]. The index beneath it is the same work as
// a plain list: shown on request, without scripts, and wherever WebGL is unavailable.
export function home() {
  return `<h1 class="sr-only">Storm Nijhuis, fashion designer, stylist and creative director</h1>
  <section class="table" aria-label="Every photograph of the work">
    <div class="table-stage" data-table aria-hidden="true"></div>
    <p class="table-intro">Fashion designer, stylist and creative director in Amsterdam. Drag to look through every photograph of the work, and open one to see its project.</p>
    <p class="table-caption" aria-hidden="true"></p>
    <div class="table-filter" role="group" aria-label="Show photographs from">
      <button type="button" data-filter="all" aria-pressed="true">All <sup>${archive.length}</sup></button>
      ${projects.map((project) => `<button type="button" data-filter="${project.slug}" aria-pressed="false">${project.slug === 'film' ? 'Film' : project.title} <sup>${project.photos.length}</sup></button>`).join('')}
    </div>
    <div class="table-views" role="group" aria-label="View">
      <button type="button" data-view-mode="table" aria-pressed="true">Table</button>
      <button type="button" data-view-mode="index" aria-pressed="false">Index</button>
    </div>
  </section>
  <section class="index" id="index" aria-labelledby="index-title">
    <h2 id="index-title" class="index-heading">Index</h2>
    <ol class="index-list">${projects.map((project) => `<li>
      <a class="index-row" href="${project.href}">
        <span class="index-name">${project.title}</span>
        <span class="index-kind">${project.kind}${project.year ? `, ${project.year}` : ''}</span>
        <span class="index-count">${plural(project.photos.length)}</span>
        <span class="index-peek">${picture(project.cover, { sizes: '22vw', alt: '' })}</span>
      </a>
    </li>`).join('')}</ol>
    <nav class="index-legal" aria-label="Legal and accessibility">${legalLinks.map(([name, href]) => `<a href="${href}">${name}</a>`).join('')}</nav>
  </section>`;
}
