import { assets, looks, VIEWS } from '../content/data.js';

export const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const normalizePath = (path) => (path === '/' ? '/' : `/${path.split('/').filter(Boolean).join('/')}/`);
export const pad = (n, width = 2) => String(n).padStart(width, '0');

const written = {
  'about-02': 'Storm Nijhuis wearing glasses while adjusting a sculptural Hellion garment in the studio.',
  'editorial-v2-28': 'Two models in Hellion: a sculptural horned silhouette and a black tailored look with a white collar.',
  'editorial-v2-07': 'Full-length Hellion look with sculptural sleeves, a latex blouse and a fitted skirt.',
  'editorial-v2-19': 'Full-length Hellion look with a feathered headpiece and a sheer skirt with a sweeping train.',
  'editorial-v2-29': 'Two Hellion silhouettes photographed against a textured wall.',
  'editorial-v1-17': 'A model in a sculptural Hellion look of black feathered strips, with a tall horned headpiece.',
  'editorial-v1-15': 'A model in a white horned headpiece and a black beaded Hellion look.',
  'presentation-8537': 'Storm Nijhuis presenting his collection book alongside the Hellion garments and models.',
  'presentation-8536': 'Storm Nijhuis speaking about his collection, with models wearing Hellion behind him.',
  'presentation-8539': 'Five models wearing Hellion at a collection presentation.',
  'presentation-8535': 'A sculptural Hellion headpiece on a table beside the collection research.',
  'presentation-8540': 'Hellion garments hanging on a rail at the collection presentation.',
  'presentation-8538': 'Two models wearing sculptural Hellion looks at a collection presentation.',
};

// Alt text, also used for the light table's captions.
export function describe(id) {
  if (written[id]) return written[id];
  const asset = assets.get(id);
  const n = Number(id.split('-').at(-1));
  if (asset.group === 'lookbook') {
    const look = looks.find((entry) => entry.images.includes(id));
    return `Hellion lookbook, look ${look.number}, ${VIEWS[look.images.indexOf(id)].toLowerCase()} view. The full garment silhouette.`;
  }
  if (asset.group.startsWith('editorial')) return `Hellion editorial photograph ${n}, series ${asset.group.endsWith('v1') ? 'one' : 'two'}.`;
  if (asset.group === 'anima') return `Anima Obscura, a black and white fashion editorial by Storm Nijhuis and Denise Bakker, photograph ${n}.`;
  if (asset.group === 'styling') return `Fashion portrait from Storm Nijhuis’s styling assistance with Annet Veerbeek, image ${n}.`;
  if (asset.group === 'film') return `Still ${n} from Hellion, an upcoming short fashion film.`;
  return id === 'about-01' ? 'Portrait of Storm Nijhuis.' : 'Storm Nijhuis working on the sculptural garments for Hellion in the studio.';
}

// Short label for a photograph: where it belongs, in a few words.
export function label(id) {
  const asset = assets.get(id);
  const n = Number(id.split('-').at(-1));
  if (asset.group === 'lookbook') {
    const look = looks.find((entry) => entry.images.includes(id));
    return `Hellion, look ${look.number}, ${VIEWS[look.images.indexOf(id)].toLowerCase()}`;
  }
  if (asset.group.startsWith('editorial')) return `Hellion, editorial ${n}`;
  if (asset.group === 'presentation') return 'Hellion, the presentation';
  if (asset.group === 'anima') return `Anima Obscura, ${n}`;
  if (asset.group === 'styling') return 'Styling, Annet Veerbeek';
  if (asset.group === 'film') return `Hellion, film still ${n}`;
  return 'Storm in the studio';
}

// Complete frames only: intrinsic dimensions are always set, and nothing here crops.
export function picture(id, { eager = false, priority = false, sizes = '(max-width: 760px) 100vw, 50vw', className = '', alt = describe(id) } = {}) {
  const asset = assets.get(id);
  if (!asset) throw new Error(`Missing asset: ${id}`);
  const { small, medium, large } = asset;
  return `<img class="${className}" src="${large.src}" srcset="${small.src} ${small.width}w, ${medium.src} ${medium.width}w, ${large.src} ${large.width}w" sizes="${sizes}" width="${asset.width}" height="${asset.height}" alt="${escape(alt)}" loading="${eager ? 'eager' : 'lazy'}"${priority ? ' fetchpriority="high"' : ''} decoding="async" data-photo="${id}" />`;
}

// A photograph that opens the full-screen viewer. `set` is the sequence the viewer steps through.
export function photo(id, set, options = {}) {
  return `<button class="photo" type="button" data-view="${id}" data-set="${set.join(',')}" aria-label="View full screen: ${escape(describe(id))}">${picture(id, options)}</button>`;
}
