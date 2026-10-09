// Everything the site says and shows. Views render from this; nothing else holds copy.
import manifest from '../../public/assets/manifest.json' with { type: 'json' };

export const assets = new Map(manifest.map((asset) => [asset.id, asset]));
const group = (name) => manifest.filter((asset) => asset.group === name).map((asset) => asset.id);

// The lookbook was shot as nine sets of four views (front, side, back, other side). Sets 06 and 08
// are not shown; the seven that are get numbered 01–07 for display.
const OMITTED_SETS = ['06', '08'];
const lookbookSource = group('lookbook');
export const looks = Array.from({ length: lookbookSource.length / 4 }, (_, i) => ({
  source: String(i + 1).padStart(2, '0'),
  images: lookbookSource.slice(i * 4, i * 4 + 4),
}))
  .filter((look) => !OMITTED_SETS.includes(look.source))
  .map((look, i) => ({ ...look, number: String(i + 1).padStart(2, '0') }));
export const VIEWS = ['Front', 'Side', 'Back', 'Alternate view'];

export const editorial = [...group('editorial-v1'), ...group('editorial-v2')];
export const presentation = ['presentation-8536', 'presentation-8537', 'presentation-8535', 'presentation-8540', 'presentation-8538', 'presentation-8539'];
export const anima = group('anima');
export const styling = group('styling');
export const studio = group('about');

export const film = {
  title: 'Hellion',
  format: 'A short fashion film',
  status: 'Upcoming',
  logline: 'Made alongside the Hellion collection, the film follows a mischievous outsider into an otherworldly church, where he challenges the religious judgement that made him feel like a sinner.',
  synopsis: [
    'As the church bells ring, Hellion arrives in a place where sacred rules decide what is good and what is sinful. He interrupts its rituals and acts on the desires he was taught to fear. His rebellion brings him into conflict with the Nun, who stands for the rules he is trying to escape.',
    'The film comes from my experience of growing up queer in a small town surrounded by Catholic beliefs. It asks who gets to define purity and sin, and how those ideas affect the way we see ourselves. Hellion approaches these questions through humour, religious symbolism and a character who refuses to behave.',
  ],
  concept: [
    'The film was made alongside my Hellion collection. The garments become the characters’ clothing: oversized collars, horns and sculptural silhouettes exaggerate the authority and expectations associated with religious dress.',
    'I developed the fashion design, concept and creative direction for the project. The treatment brings together the clothing, casting and setting, with distorted perspectives, warm light and the sound of church bells. The film was shot in Pieterskerk in Utrecht.',
  ],
  // Viewing order, not file order.
  stills: ['film-13', 'film-12', 'film-08', 'film-02', 'film-04', 'film-05', 'film-03', 'film-06', 'film-07', 'film-01', 'film-09', 'film-10', 'film-11'],
};

// The work, in the order the site presents it. `photos` is what each project contributes to the table.
export const projects = [
  {
    slug: 'hellion', href: '/hellion/', title: 'Hellion', short: 'Hellion', cta: 'View the Hellion collection', kind: 'Collection · Lookbook · Editorial', year: '2026', cover: 'editorial-v1-17',
    photos: [...looks.flatMap((look) => look.images), ...editorial, ...presentation],
  },
  { slug: 'anima-obscura', href: '/anima-obscura/', title: 'Anima Obscura', short: 'Anima Obscura', cta: 'View Anima Obscura', kind: 'Fashion editorial · With Denise Bakker', cover: 'anima-08', photos: anima },
  { slug: 'styling', href: '/styling/', title: 'Styling', short: 'Styling', cta: 'View the styling', kind: 'Internship · Styling assistance', cover: 'styling-9337', photos: styling },
  { slug: 'film', href: '/film/', title: 'Hellion, a short fashion film', short: 'Film', cta: 'View the film', kind: 'Upcoming', cover: 'film-08', photos: film.stills },
  { slug: 'studio', href: '/about/', title: 'Studio', short: 'Studio', cta: 'Meet Storm', kind: 'In the studio', cover: 'about-02', photos: studio },
];
export const projectOf = new Map(projects.flatMap((project) => project.photos.map((id) => [id, project])));
// Every photograph the public site shows, once.
export const archive = projects.flatMap((project) => project.photos);

export const biography = [
  'I’m Storm Nijhuis, a fashion designer, stylist and creative director based in Amsterdam. I grew up in Zutphen, where being queer often meant feeling out of place. Fashion became a way to express myself and explore things I couldn’t always put into words.',
  'I learned to work with my hands at a Rudolf Steiner school, then studied product and textile design at CIBAP and fashion design at AMFI. During an exchange at the Swedish School of Textiles, I explored how materials can shape a garment from the very beginning.',
  'My work includes latex, textile development and historical pattern cutting. I also work in styling, where I enjoy responding to different people and different briefs. Through my brand Hellion, I explore identity and religious symbolism with exaggerated silhouettes, humour and contrast.',
];

// About page, "Background".
export const background = [
  'I grew up in Zutphen, where I never quite felt like I fitted in. Making and styling clothes gave me a way to express myself.',
  'I studied Product Design with a focus on textiles at CIBAP. Alongside sewing and material development, I worked with 3D sculpting and 3D printing. At AMFI, I explored fashion design, historical pattern cutting and the relationship between the body and the materials around it.',
  'During an exchange at the Swedish School of Textiles, I experimented with designing from materials. At Untitled Rubber, I worked with latex clothing and construction. I still use material experimentation as a starting point for garments.',
  'My brand Hellion looks at how we are judged and how we choose to express ourselves. The 2026 collection draws on my experience of growing up queer, using religious symbolism and exaggerated historical silhouettes.',
];

export const experience = {
  education: [['2022–2026', 'AMFI', 'Fashion Design'], ['Exchange', 'Swedish School of Textiles', 'Material research'], ['2018–2022', 'CIBAP', 'Product Design · Textiles']],
  internships: [['Untitled Rubber', 'Design & fabrication'], ['Annet Veerbeek', 'Styling assistance'], ['Zyanya Keizer', 'Couture & garment construction'], ['House of Useless', 'Atelier & pattern cutting'], ['Liesbeth Sterkenburg', 'Atelier & pattern cutting']],
  work: [['2025', 'Zipper Vintage', 'Styling & visual merchandising'], ['2022', 'H&M', 'Garment alterations & sales'], ['2026', 'Lichting', 'Finalist']],
  skills: 'Pattern cutting, latex, draping, textile development, tufting, 3D sculpting and garment construction.',
};

export const contact = {
  email: 'storm.nijhuis@gmail.com',
  phone: '+31 6 4001 1837',
  telephone: '+31640011837',
  instagram: 'https://www.instagram.com/hellion.sin/',
  handle: '@hellion.sin',
  cv: '/assets/storm-nijhuis-cv.pdf',
};

// Public legal information. Fill with confirmed details only; null renders as "to be confirmed".
export const legal = {
  updated: '2026-10-09',
  controllerName: 'Storm Nijhuis',
  business: { registeredName: null, tradingName: null, address: null, addressShielded: null, kvkNumber: null, vatId: null, vatApplicable: null },
  privacy: { enquiryRetention: null, hostingLogRetention: null, transferSafeguards: null },
  deploymentPrivacyVerified: false,
};

export const legalLinks = [['Privacy', '/privacy/'], ['Business details', '/legal/'], ['Cookies', '/cookies/'], ['Accessibility', '/accessibility/'], ['Enquiries & commissions', '/terms/']];

export const routes = {
  '/': { title: 'Storm Nijhuis — Fashion Design, Styling & Creative Direction', description: 'Amsterdam-based fashion designer, stylist and creative director. Selected work, collections and film by Storm Nijhuis.' },
  '/hellion/': { title: 'Hellion', description: 'Hellion, a 2026 collection by Storm Nijhuis. The complete lookbook, editorial photography and presentation.' },
  '/anima-obscura/': { title: 'Anima Obscura', description: 'A fashion editorial by Storm Nijhuis and Denise Bakker. Explore the complete photographic series.' },
  '/styling/': { title: 'Styling', description: 'Selected styling assistance work by Storm Nijhuis, during his internship with Annet Veerbeek.' },
  '/film/': { title: 'Hellion, a short fashion film', description: 'Hellion, an upcoming short fashion film based on Storm Nijhuis’s collection. A rebellious outsider challenges religious judgement in an otherworldly church.' },
  '/about/': { title: 'About', description: 'Meet Storm Nijhuis. Fashion designer, stylist, creative director and Lichting finalist based in Amsterdam.' },
  '/contact/': { title: 'Contact', description: 'Contact Storm Nijhuis for fashion design, styling, creative direction and collaborations.' },
  '/privacy/': { title: 'Privacy', description: 'How Storm Nijhuis handles enquiries and personal data, including website hosting, service providers and your privacy rights.' },
  '/legal/': { title: 'Business details', description: 'Business identification and contact information for Storm Nijhuis, a fashion designer, stylist and creative director in Amsterdam.' },
  '/cookies/': { title: 'Cookies', description: 'Information about cookies, browser storage and external services on the Storm Nijhuis portfolio website.' },
  '/accessibility/': { title: 'Accessibility', description: 'Accessibility features, keyboard controls and how to request help using the Storm Nijhuis portfolio and CV.' },
  '/terms/': { title: 'Enquiries & commissions', description: 'How to enquire about fashion design, styling and creative direction, and how commission details and consumer rights are agreed.' },
};
