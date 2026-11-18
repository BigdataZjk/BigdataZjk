import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const home=path.dirname(fileURLToPath(import.meta.url));
const runtime=path.join(home,'widget-runtime');
const manifest=fs.existsSync(path.join(home,'package.json')) ? path.join(home,'package.json') : path.join(runtime,'package.json');
const {build}=createRequire(manifest)('esbuild');
await build({
  entryPoints:[path.join(home,'render-widgets.mjs')],
  outfile:path.join(runtime,'render-profile.mjs'),
  bundle:true,
  platform:'node',
  format:'esm',
  target:'node24',
  packages:'external',
});
await import(new URL('./widget-runtime/render-profile.mjs',import.meta.url));
