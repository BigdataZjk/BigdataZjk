import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const home = path.dirname(fileURLToPath(import.meta.url));
const runtime = path.join(home,'widget-runtime');
const manifest = fs.existsSync(path.join(home,'package.json')) ? path.join(home,'package.json') : path.join(runtime,'package.json');
const { build } = createRequire(manifest)('esbuild');
fs.mkdirSync(runtime,{recursive:true});
const checkout = name => path.join(home,'widget-sources',name);
const snake = checkout('snake');
const include= new Set(process.env.PROFILE_MOTION_SOURCES?.split(',')??['atelier','isometric','arcade','snake']);
const definitions={
  atelier:[['renderNamedCard','src/build.ts']],
  isometric:[['create3DContrib','src/create-3d-contrib.ts'],['createCssColors','src/create-css-colors.ts']],
  arcade:[['ArcadeRenderer','src/shared/arcade-renderer.ts'],['Providers','src/shared/providers/providers.ts']],
  snake:[
    ['cellsToGrid','packages/generate-snake-animation/cellsToGrid.ts'], ['getBestRoute','packages/solver/getBestRoute.ts'],
    ['getPathToPose','packages/solver/getPathToPose.ts'],['snake4','packages/types/__fixtures__/snake.ts'],
    ['createSnakeSvg','packages/svg-creator/index.ts','createSvg'],
  ],
};
const modules=Object.entries(definitions).flatMap(([name,exports])=>exports.map(([id,file,original])=>{
  if (!include.has(name)) return `export const ${id}=undefined;`;
  const src=path.join(checkout(name),file).replaceAll('\\','/');
  return `export { ${original ? `${original} as ${id}` : id} } from ${JSON.stringify(src)};`;
}));

await build({
  stdin:{ contents:modules.join('\n'), resolveDir:home, loader:'ts', sourcefile:'widget-vendor.ts' },
  outfile:path.join(runtime,'vendor.mjs'),
  bundle:true,
  platform:'node',
  format:'esm',
  target:'node24',
  tsconfigRaw:{},
  packages:'external',
  // The checked-out snk monorepo uses workspace package names.
  plugins:[{name:'snk-workspaces',setup(builder){
    builder.onResolve({filter:/^@snk\//}, async args => builder.resolve(path.join(snake, 'packages', args.path.slice(5)), { kind:args.kind, resolveDir:args.resolveDir }));
  }}],
});
