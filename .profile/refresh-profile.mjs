import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { demos, sources, widgets } from './widget-catalog.mjs';

const toolkit=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(toolkit,'..');
const dataCache=path.join(toolkit,'data-cache.json');
const config=JSON.parse(fs.readFileSync(path.join(toolkit,'variant.json'),'utf8'));
if (!/^0[1-7]$/.test(config.id) || !/^[a-z]+$/.test(config.slug)) throw new Error('Invalid profile variant');
const demo=demos.find(item=>item.id===config.id && item.slug===config.slug);
if (!demo) throw new Error('Variant does not match the profile catalog');
const effect=widgets.find(widget=>widget.id===demo.detail);
const names=new Set(['contribution-fx',sources[effect.source].checkout]);
if (demo.hero==='terminal' || demo.hero==='terminal-ice') names.add('atelier');
const upstreams=JSON.parse(fs.readFileSync(path.join(toolkit,'upstreams.json'),'utf8')).filter(upstream=>names.has(upstream.name));

function git(cwd,args,capture=false) {
  return execFileSync('git',['-C',cwd,...args],{stdio:capture?['ignore','pipe','inherit']:'inherit',encoding:'utf8',timeout:120000});
}

function prepareUpstreams() {
  for (const {name,repository,revision,paths} of upstreams) {
    if (!/^[a-z-]+$/.test(name) || !/^https:\/\/github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\.git$/.test(repository) || !/^[a-f0-9]{40}$/.test(revision)) {
      throw new Error(`Invalid pinned source ${name}`);
    }
    const dir=path.join(toolkit,'widget-sources',name);
    fs.mkdirSync(dir,{recursive:true});
    if (!fs.existsSync(path.join(dir,'.git'))) {
      git(dir,['init','--quiet']);
      git(dir,['remote','add','origin',repository]);
      git(dir,['config','remote.origin.promisor','true']);
      git(dir,['config','remote.origin.partialclonefilter','blob:none']);
      git(dir,['fetch','--quiet','--depth=1','--no-tags','--filter=blob:none','origin',revision]);
      git(dir,['sparse-checkout','set','--no-cone','--skip-checks',...paths.map(part=>`/${part}`)]);
      git(dir,['checkout','--quiet','--detach','FETCH_HEAD']);
    }
    if (git(dir,['rev-parse','HEAD'],true).trim()!==revision) throw new Error(`Pinned source changed: ${name}`);
  }
}

const stage=fs.mkdtempSync(path.join(os.tmpdir(),'profile-build-'));
try {
  prepareUpstreams();
  process.env.PROFILE_MOTION_SOURCES=[...names].join(',');
  await import(new URL('./widget-vendor.mjs',import.meta.url));
  process.env.PROFILE_BUILD_OUTPUT=stage;
  process.env.PROFILE_VARIANT=config.id;
  process.env.PROFILE_CACHE_PATH=dataCache;
  await import(new URL('./build-profile.mjs',import.meta.url));

  const draft=path.join(stage,'demos',`${config.id}-${config.slug}`);
  const markdown=fs.readFileSync(path.join(draft,'README.md'),'utf8');
  const filenames=[...new Set([...markdown.matchAll(/(?:src|srcset)="\.\/assets\/([^"/]+)"/g)].map(match=>match[1]))];
  if (filenames.length<20) throw new Error('Incomplete profile: too few linked assets');
  for (const name of filenames) {
    const data=fs.readFileSync(path.join(draft,'assets',name),'utf8');
    const parsed=new JSDOM(data,{contentType:'image/svg+xml'}).window.document;
    if (parsed.documentElement.localName!=='svg' || parsed.querySelector('script,foreignObject,parsererror')) throw new Error(`Invalid asset ${name}`);
  }

  if (process.argv.includes('--check')) {
    console.log(`Verified README and ${filenames.length} linked assets. Repository files were not changed.`);
  } else {
    const assetsDir=path.join(repo,'assets');
    fs.mkdirSync(assetsDir,{recursive:true});
    for (const name of filenames) fs.copyFileSync(path.join(draft,'assets',name),path.join(assetsDir,name));
    fs.copyFileSync(path.join(stage,'data-cache.json'),dataCache);
    fs.copyFileSync(path.join(draft,'README.md'),path.join(repo,'README.md'));
  }
} finally {
  fs.rmSync(stage,{recursive:true,force:true});
}
