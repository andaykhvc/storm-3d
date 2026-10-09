import { assets, looks, VIEWS, editorial, presentation, anima, styling, film } from '../content/data.js';
import { photo, pad } from './kit.js';

// A contact sheet: every frame complete, numbered like the edge of a negative strip.
// Portrait and landscape frames sit in separate sheets so neither is forced into the other's shape.
function sheet(ids, { set = ids, start = 1, sizes } = {}) {
  const frame = (id, i) => `<figure class="frame">${photo(id, set, { sizes })}<figcaption>${pad(start + i)}</figcaption></figure>`;
  const portrait = ids.filter((id) => assets.get(id).height >= assets.get(id).width);
  const landscape = ids.filter((id) => assets.get(id).height < assets.get(id).width);
  return `${portrait.length ? `<div class="sheet">${portrait.map((id) => frame(id, ids.indexOf(id))).join('')}</div>` : ''}${landscape.length ? `<div class="sheet sheet--wide">${landscape.map((id) => frame(id, ids.indexOf(id))).join('')}</div>` : ''}`;
}

// The lookbook as one turning figure: scrolling steps through every look's four views.
// Decorative twin of the looks grid below it, which stays for keyboards, screen readers and reduced motion.
function turntable(ids) {
  return `<div class="turntable" aria-hidden="true"><div class="turntable-stage">
    <p class="turntable-number">${looks[0].number}</p>
    <button class="turntable-frame photo" type="button" tabindex="-1" data-view="${ids[0]}" data-set="${ids.join(',')}">${ids.map((id) => {
      const { medium } = assets.get(id);
      return `<img src="${medium.src}" width="${medium.width}" height="${medium.height}" alt="" loading="lazy" decoding="async" />`;
    }).join('')}</button>
    <div class="turntable-side"><p class="turntable-caption">Look ${looks[0].number}, front</p><ol class="turntable-rail">${looks.map(() => '<li></li>').join('')}</ol></div>
  </div></div>`;
}

// A run of photographs that slides sideways as you scroll down. Decorative: the sheet below has them all.
const EDITORIAL_STRIP = ['editorial-v1-01', 'editorial-v2-07', 'editorial-v1-17', 'editorial-v2-19', 'editorial-v1-06', 'editorial-v2-28', 'editorial-v1-15', 'editorial-v2-26', 'editorial-v1-07', 'editorial-v2-29', 'editorial-v1-11'];
function strip(ids, set) {
  return `<div class="strip" aria-hidden="true"><div class="strip-stage"><div class="strip-row">${ids.map((id) => {
    const { medium } = assets.get(id);
    return `<button class="photo" type="button" tabindex="-1" data-view="${id}" data-set="${set.join(',')}"><img src="${medium.src}" width="${medium.width}" height="${medium.height}" alt="" loading="lazy" decoding="async" /></button>`;
  }).join('')}</div></div></div>`;
}

const next = (href, title, lead = 'Next project') => `<nav class="next" aria-label="${lead}"><a href="${href}"><span>${lead}</span><span class="next-title">${title}</span></a></nav>`;

export function hellion() {
  const lookbook = looks.flatMap((look) => look.images);
  return `<article class="project">
    <header class="opening">
      <h1 class="opening-title"><img class="hellion-logo" src="/assets/hellion-logo.png" width="1255" height="430" alt="Hellion" /></h1>
      <p class="opening-line">A 2026 collection by Storm Nijhuis, presented at Lichting.</p>
    </header>
    <figure class="cover">${photo('editorial-v2-29', ['editorial-v2-29'], { eager: true, priority: true, sizes: '100vw' })}</figure>
    <section class="prologue" aria-label="About the collection">
      <p class="statement">They called me a sinner, so I became their hellion.</p>
      <div class="prose">
        <p>Hellion is a fashion protest and a persona. Growing up queer in a small town, I learned what it meant to be seen as different. This collection turns that judgment into a way to claim space.</p>
        <p>Historical silhouettes, sculptural materials and religious symbolism question the line between purity and sin, softness and aggression.</p>
      </div>
      <dl class="facts"><dt>Fashion & material design</dt><dd>Storm Nijhuis</dd><dt>Presented at Lichting</dt><dd>2026</dd></dl>
    </section>
    <section class="chapter" aria-labelledby="looks-title">
      <h2 class="chapter-title" id="looks-title">Lookbook</h2>
      ${turntable(lookbook)}
      <div class="looks">${looks.map((look) => `<div class="look">
        <h3 class="look-number"><span class="sr-only">Look </span>${look.number}</h3>
        <div class="look-views">${look.images.map((id, i) => `<figure class="frame">${photo(id, lookbook, { sizes: '(max-width: 760px) 50vw, 20vw' })}<figcaption>${VIEWS[i]}</figcaption></figure>`).join('')}</div>
      </div>`).join('')}</div>
    </section>
    <section class="chapter" aria-labelledby="editorial-title">
      <h2 class="chapter-title" id="editorial-title">Editorial</h2>
      ${strip(EDITORIAL_STRIP, editorial)}
      <h3 class="chapter-sub">Explore the complete editorial</h3>
      ${sheet(editorial, { sizes: '(max-width: 760px) 50vw, 24vw' })}
    </section>
    <section class="chapter" aria-labelledby="presentation-title">
      <h2 class="chapter-title" id="presentation-title">Behind the collection</h2>
      <p class="chapter-line">From the studio to the presentation. A look at the garments, the research and the person behind them.</p>
      ${sheet(presentation, { sizes: '(max-width: 760px) 50vw, 32vw' })}
    </section>
    ${next('/anima-obscura/', 'Anima Obscura')}
  </article>`;
}

export function animaObscura() {
  return `<article class="project">
    <header class="opening">
      <h1 class="opening-title gothic">Anima Obscura</h1>
      <p class="opening-line">A fashion editorial exploring the hidden self, made with Denise Bakker.</p>
    </header>
    <figure class="cover cover--narrow">${photo('anima-08', anima, { eager: true, priority: true, sizes: '(max-width: 760px) 100vw, 60vw' })}</figure>
    <section class="prologue" aria-label="About the editorial">
      <p class="statement">Between a dream and a nightmare.</p>
      <div class="prose">
        <p>A fashion editorial exploring the hidden self. Inspired by Jung’s idea of the dark anima, the series moves between intimacy and estrangement, light and shadow.</p>
        <p>Fashion design and styling by Storm Nijhuis. Concept and creative direction with Denise Bakker.</p>
      </div>
      <dl class="facts">
        <dt>Concept & creative direction</dt><dd>Storm Nijhuis & Denise Bakker</dd>
        <dt>Fashion design & styling</dt><dd>Storm Nijhuis</dd>
        <dt>Photography</dt><dd>Denise Bakker</dd>
        <dt>Models</dt><dd>Luanda Schuster (UNS Models)<br />Jakob Weissbarth (IZAIO Models)</dd>
        <dt>Make-up</dt><dd>Milena Lazija</dd>
        <dt>Hair</dt><dd>Alina Tupalova</dd>
        <dt>Set & styling assistance</dt><dd>Nora Gustafsson</dd>
      </dl>
    </section>
    <section class="chapter" aria-labelledby="series-title">
      <h2 class="chapter-title" id="series-title">Explore the complete series</h2>
      ${sheet(anima, { sizes: '(max-width: 760px) 50vw, 24vw' })}
    </section>
    ${next('/styling/', 'Styling', 'Explore more')}
  </article>`;
}

export function stylingPage() {
  return `<article class="project">
    <header class="opening">
      <h1 class="opening-title gothic">Styling</h1>
      <p class="opening-line">Styling assistance during my internship with Annet Veerbeek.</p>
    </header>
    <section class="chapter chapter--first" aria-labelledby="internship-title">
      <h2 class="chapter-title" id="internship-title">Annet Veerbeek</h2>
      <p class="chapter-line">Internship · Styling assistance</p>
      ${sheet(styling, { sizes: '(max-width: 760px) 50vw, 24vw' })}
    </section>
    ${next('/film/', 'Hellion, a short fashion film')}
  </article>`;
}

export function filmPage() {
  const [first, ...rest] = film.stills;
  return `<article class="project">
    <header class="opening">
      <h1 class="opening-title gothic">${film.title}</h1>
      <p class="opening-line">${film.format}. ${film.status}. The full film will be shared after its public release.</p>
    </header>
    <section class="nave" aria-label="A walk through Pieterskerk, past the stills to the altar">
      <div class="nave-track"><div class="nave-stage">
        <p class="nave-hint">Scroll to walk into Pieterskerk</p>
        <p class="nave-caption" aria-hidden="true"></p>
      </div></div>
    </section>
    <figure class="cover film-cover">${photo(first, film.stills, { eager: true, priority: true, sizes: '100vw' })}</figure>
    <section class="prologue" aria-label="About the film">
      <p class="statement">${film.logline}</p>
      <div class="prose">${film.synopsis.map((p) => `<p>${p}</p>`).join('')}</div>
    </section>
    <section class="chapter" aria-labelledby="stills-title">
      <h2 class="chapter-title" id="stills-title">Film stills</h2>
      ${sheet(rest, { set: film.stills, start: 2, sizes: '(max-width: 760px) 100vw, 48vw' })}
    </section>
    <section class="prologue" aria-labelledby="concept-title">
      <h2 class="statement" id="concept-title">The collection and the film</h2>
      <div class="prose">${film.concept.map((p) => `<p>${p}</p>`).join('')}<p><a class="inline" href="/hellion/">View the Hellion collection</a></p></div>
    </section>
    ${next('/hellion/', 'Hellion')}
  </article>`;
}

