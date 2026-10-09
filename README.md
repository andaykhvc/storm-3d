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
- `scripts/validate.mjs`: checks the photographs, links, headings and the no-filter, no-crop rule.

Reduced motion switches off the opening and the table's motion; without WebGL or scripts the homepage shows the Index, a plain list of the projects.
