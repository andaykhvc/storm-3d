# Storm Nijhuis

Portfolio of Storm Nijhuis, fashion designer, stylist and creative director in Amsterdam. Rebuilt from scratch: the homepage is a light table holding every photograph of the work, and each project opens from it.

Black and bone white, Koch=Schrift for names, Helvetica for everything else. Photographs are never filtered or cropped.

## Run

```sh
pnpm install
pnpm dev      # http://127.0.0.1:5180
pnpm build    # checks, bundle, pre-rendered pages in dist/
```

## How it is built

- `src/content/data.js`: all copy, projects, looks and routes. Photographs come from `public/assets/manifest.json`.
- `src/views/`: HTML for every page, shared by the browser and the build (`scripts/build.mjs` pre-renders each route).
- `src/app/`: the router, opening contact sheet, photograph viewer and homepage controls.
- `src/gl/table.js`: the WebGL light table (three.js), loaded only on the homepage.
- `src/gl/nave.js`: the film page's walk through Pieterskerk (three.js), loaded only there.
- `src/gl/ink.js`, `src/gl/wash.js`: titles that bloom out of ink, and the ink that covers the screen between pages (plain WebGL2).
- `src/app/pages.js`: smooth scrolling (Lenis with ScrollTrigger), the Hellion turntable and editorial strip, and statements that light up word by word.
- `scripts/validate.mjs`: checks the photographs, links, headings and the no-filter, no-crop rule.

Every cinematic section has a complete static twin. Reduced motion switches off the opening, the ink, the turntable, the strip and the walk, and shows the plain pages; without WebGL or scripts the homepage shows the Index, a plain list of the projects. Old URLs (`/design/…`, `/creative-direction/`) redirect in `vercel.json`.
