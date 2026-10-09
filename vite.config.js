import { readFile } from 'node:fs/promises';

// The browser only needs each photograph's id, group, dimensions and derivatives.
// Source paths and hashes stay in public/assets/manifest.json for the record and the checks.
const slimManifest = {
  name: 'slim-asset-manifest',
  enforce: 'pre',
  async load(id) {
    if (!id.endsWith('/public/assets/manifest.json')) return null;
    const manifest = JSON.parse(await readFile(id, 'utf8'));
    return JSON.stringify(manifest.map(({ id: assetId, group, width, height, large, medium, small }) => ({ id: assetId, group, width, height, large, medium, small })));
  },
};

export default { plugins: [slimManifest] };
