import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { select } from 'd3';
import { JSDOM } from 'jsdom';
import { render, fromDailyList, PALETTES } from './widget-sources/contribution-fx/src/index.js';
import * as vendor from './widget-runtime/vendor.mjs';
import { calendarUrl, demos, links, login, projects, sources, widgets } from './widget-catalog.mjs';
import { deriveProfile, fetchProfileData, loadFixtureData, streak } from './profile-data.mjs';
import { profileArt, responsiveAssets } from './profile-artwork.mjs';
import { attribution, heroAsset, writeReadme } from './profile-readme.mjs';

const output = path.resolve(process.env.PROFILE_BUILD_OUTPUT??'outputs/github-motion');
const variant = process.env.PROFILE_VARIANT;
const activeDemos = variant ? demos.filter(demo=>demo.id===variant) : demos;
const isGallery = !variant;
if (!activeDemos.length) throw new Error(`Unknown profile demo ${variant}`);
const wanted = id => isGallery || activeDemos.some(demo=>demo.detail===id || heroAsset(demo)===id);
const sourceRoot = fileURLToPath(new URL('../widget-sources/',import.meta.url));
const assetDir = path.join(output, 'components');
fs.mkdirSync(assetDir, { recursive:true });
const cacheFile = process.env.PROFILE_CACHE_PATH;
const prior = cacheFile && fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile,'utf8')) : {};
const incoming = process.env.PROFILE_FIXTURES ? loadFixtureData(process.env.PROFILE_FIXTURES) : await fetchProfileData(prior);
const {snapshot, profile, repos, cache} = incoming;
const pageData = deriveProfile(incoming);
const calendar = fromDailyList(login, snapshot.days);
const levels = ['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'];

function writeAsset(name, svg) {
  if (typeof svg !== 'string' || !/<svg\b/.test(svg) || /<script\b|<foreignObject\b/i.test(svg)) throw new Error(`Invalid SVG: ${name}`);
  const file=path.join(assetDir,`${name}.svg`);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,svg,'utf8');
}

function freeze(svg) {
  return svg
    .replace(/<(animate(?:Transform|Motion|Color)?|set)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)/gi, '')
    .replace(/<\/svg>\s*$/, '<style>*{animation:none!important;transition:none!important}.ra-in{opacity:1!important}</style></svg>');
}

function optIn(svg) {
  // The preview can opt in to playing even if the desktop defaults to reduced motion.
  const query = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/i;
  let clean = svg;
  for (let match = clean.match(query); match; match = clean.match(query)) {
    let cursor = match.index + match[0].length;
    let depth = 1;
    while (depth && cursor < clean.length) {
      if (clean[cursor] === '{') depth++;
      if (clean[cursor] === '}') depth--;
      cursor++;
    }
    if (depth) throw new Error('Unclosed media query in SVG');
    clean = clean.slice(0, match.index) + clean.slice(cursor);
  }
  return clean;
}

function assets(id, mode, svg) {
  const still = freeze(svg);
  writeAsset(`${id}-${mode}`, svg);
  if (isGallery) writeAsset(`${id}-${mode}-preview`, optIn(svg));
  writeAsset(`${id}-${mode}-still`, still);
}

const chipDark = { levels:['#152a37','#204b62','#28758d','#52b1c7','#9ceafa'], text:'#a5bdca', accent:'#77dbef' };
PALETTES.signal = { light:PALETTES.ocean.light, dark:chipDark };
PALETTES.spectrum = { light:{levels:['#e4ebe8','#acebd5','#65d4b5','#199a82','#176c60'],text:'#4a6a64',accent:'#137666'}, dark:{levels:['#14302c','#206051','#329982','#62d5b2','#a1f9da'],text:'#a6c8bd',accent:'#74edcb'} };

for (const w of widgets.filter(w => w.source === 'fx' && wanted(w.id))) {
  for (const mode of ['dark','light']) {
    const palette = w.id === 'circuit' ? 'signal' : w.id === 'equalizer' ? 'spectrum' : w.palette;
    const background = mode === 'light' ? '#f8fafc' : {
      circuit:'#0d171d', constellation:'#111026', equalizer:'#0d1c1b', replay:'#101a16', gravity:'#1e1414', splitflap:'#1c1815', warp:'#141229',
    }[w.id] ?? '#0d1117';
    const speed = { circuit:1.35, constellation:1.12, replay:1.22, warp:1.05 }[w.id] ?? 1;
    const svg = render(calendar, { theme:w.id, palette, mode, background, speed, label:false });
    assets(w.id, mode, svg);
  }
}

function renderCity(mode) {
  const dom = new JSDOM('<!doctype html><body><main></main></body>');
  const el = select(dom.window.document.querySelector('main')).append('svg');
  const dark = mode === 'dark';
  const settings = {
    type:'normal', growingAnimation:true,
    backgroundColor:dark ? '#10162a' : '#f1f5ff', foregroundColor:dark ? '#edf2ff' : '#152343',
    strongColor:dark ? '#acbfff' : '#304b91', weakColor:dark ? '#7f92b9' : '#4b6085', radarColor:'#6995fb',
    contribColors:dark ? ['#25334f','#4c69a0','#668ce9','#95acff','#d2e2ff'] : ['#d5dff3','#a0baff','#6a8deb','#446fea','#2f4caa'],
  };
  el.attr('xmlns','http://www.w3.org/2000/svg').attr('width', 900).attr('height', 320).attr('viewBox','0 0 900 320').attr('role','img').attr('aria-label','BigdataZjk’s isometric public contribution calendar for 26 weeks');
  el.append('style').text(vendor.createCssColors(settings));
  const defs = el.append('defs');
  const glow = defs.append('radialGradient').attr('id','terrain-light').attr('cx','78%').attr('cy','70%').attr('r','85%');
  glow.append('stop').attr('stop-color', dark ? '#242a52' : '#e3eaff');
  glow.append('stop').attr('offset','100%').attr('stop-color',settings.backgroundColor);
  el.append('rect').attr('width',900).attr('height',320).attr('fill','url(#terrain-light)');
  el.append('path').attr('d','M36 91H294 M36 91V104 M294 91V104 M864 249V285H834').attr('fill','none').attr('stroke',settings.weakColor).attr('stroke-opacity',.45);
  const recent = calendar.days.filter(d => d.x >= calendar.cols-26);
  const data = recent.map(d => ({ date:new Date(`${d.date}T12:00:00Z`), contributionCount:d.count, contributionLevel:d.level }));
  const group = el.append('g').attr('transform','translate(74 17) scale(1 .61)');
  vendor.create3DContrib(group, { contributionCalendar:data }, 0, 0, 1470, 461, settings);
  const active = recent.filter(d=>d.level>0);
  group.selectAll(':scope > g > g').filter(function(){return this.querySelector('animateTransform');}).each(function(_d,index) {
    const week = active[index].x - (calendar.cols-26);
    const begin = (0.1 + week*.045).toFixed(2);
    select(this).selectAll('animate,animateTransform').attr('begin',`${begin}s`).attr('dur','1.3s')
      .attr('fill','freeze').attr('calcMode','spline').attr('keyTimes','0;1').attr('keySplines','.18 .75 .26 1');
    const heightScale=3.6;
    for (const motion of this.querySelectorAll('animate,animateTransform')) {
      const attr = motion.getAttribute('attributeName');
      const [first,last] = motion.getAttribute('values').split(';');
      const a=first.trim().split(/\s+/).map(Number), b=last.trim().split(/\s+/).map(Number);
      const adjusted=b.map((n,i)=>(a[i]+heightScale*(n-a[i])).toFixed(2)).join(' ');
      motion.setAttribute('values',`${first};${adjusted}`);
      motion.parentNode.setAttribute(attr, attr === 'transform' ? `translate(${first})` : first);
    }
  });
  const note = el.append('g').attr('font-family','Consolas,ui-monospace,monospace');
  note.append('text').attr('x',39).attr('y',58).attr('fill',settings.foregroundColor).attr('font-size',31).attr('font-weight','700').text(login);
  note.append('text').attr('x',39).attr('y',77).attr('fill',settings.weakColor).attr('font-size',12.5).text('Isometric contribution calendar');
  note.append('text').attr('x',39).attr('y',300).attr('fill',settings.weakColor).attr('font-size',12).text(`${recent[0].date}  /  ${recent.at(-1).date}`);
  note.append('text').attr('x',860).attr('y',300).attr('text-anchor','end').attr('fill',settings.strongColor).attr('font-size',13).text(`${recent.reduce((n,d)=>n+d.count,0)} contributions / 26 weeks`);
  const svg = el.node().outerHTML;
  // Preserve the fully grown view for viewers who request reduced motion.
  const parsed = new JSDOM(svg, {contentType:'image/svg+xml'}).window.document;
  for (const motion of parsed.querySelectorAll('animate,animateTransform')) {
    const attr = motion.getAttribute('attributeName');
    const last = motion.getAttribute('values').split(';').at(-1);
    motion.parentNode.setAttribute(attr, attr === 'transform' ? `translate(${last})` : last);
    motion.remove();
  }
  writeAsset(`isometric-${mode}`,svg);
  if (isGallery) writeAsset(`isometric-${mode}-preview`,svg);
  writeAsset(`isometric-${mode}-still`,parsed.documentElement.outerHTML);
}
if (wanted('isometric')) for (const mode of ['dark','light']) renderCity(mode);

if (wanted('snake')) {
  const grid = vendor.cellsToGrid(calendar.days);
  const chain = vendor.getBestRoute(grid,vendor.snake4);
  if (!chain?.length) throw new Error('No route found for the contributions calendar');
  chain.push(...vendor.getPathToPose(chain.at(-1),vendor.snake4) ?? []);
  for (const mode of ['dark','light']) {
    const dark = mode === 'dark';
    const colors = PALETTES.purple[mode].levels;
    let svg = vendor.createSnakeSvg(grid,calendar.days,chain,{
      colorDots:colors,colorEmpty:colors[0],colorDotBorder:dark?'#ffffff0b':'#1b1f230a',colorSnake:dark?'#d6bbff':'#6d43b0',
      sizeCell:16,sizeDot:12,sizeDotBorderRadius:2,
    },{stepDurationMs:56});
    svg=svg.replace('</desc>',`</desc><rect x="-16" y="-32" width="${(grid.width+2)*16}" height="${(grid.height+5)*16}" fill="${dark?'#171225':'#faf7ff'}"/>`);
    assets('snake',mode,svg);
  }
}

const games=['pacman','breakout'].filter(wanted);
if (games.length) vendor.Providers.fetchContributions = async () => snapshot.days.map(d=>({ date:new Date(`${d.date}T00:00:00Z`), count:d.count, level:levels[d.level], color:'' }));
for (const game of games) {
  for (const mode of ['dark','light']) {
    let svg;
    const renderer = new vendor.ArcadeRenderer({
      game, platform:'github', username:login, gameTheme:mode==='dark'?'github-dark':'github',
      svgCallback:value=>{svg=value}, gameOverCallback:()=>{}, pointsIncreasedCallback:()=>{}, showMonthLabels:true,
    });
    await renderer.start();
    const quicker = svg.replace(/dur="([0-9.]+)ms"/g, (_match,time) => `dur="${(Number(time)*.72).toFixed(1)}ms"`);
    assets(game,mode,quicker);
  }
}

const atelierProfile = {
  login, name:login, bio:'', avatarUrl:profile.avatar_url, followers:profile.followers, following:profile.following, publicRepos:profile.public_repos,
  createdAt:profile.created_at, fetchedAt:snapshot.through, source:'partial',
  stats:{ stars:repos.reduce((n,r)=>n+r.stargazers_count,0), commits:snapshot.total, contributions:snapshot.total },
  calendar:snapshot.days, streak:streak(snapshot.days), languages:[], repos:[],
};
for (const id of ['terminal','terminal-ice','pixel'].filter(wanted)) {
  const theme=id==='terminal-ice'?'terminal':id;
  const accent={terminal:'#bcf58f','terminal-ice':'#8ce7ff',pixel:'#efbbff'}[id];
  const cfg={username:login,theme,name:login,tagline:'I build software and tools.',about:['React / Go   ·   Rust / Windows','Kotlin / Android   ·   Python / Vision'],accent};
  let svg=await vendor.renderNamedCard(atelierProfile,cfg,'header','dark');
  if (theme==='terminal') {
    // This snapshot is the public contribution calendar, which includes more than commits.
    svg=svg.replace('>Commits</tspan>','>Contrib.</tspan>').replace('>Streak</tspan>','>Streak / yr</tspan>');
  }
  if (id==='terminal-ice') {
    for (const [before,after] of Object.entries({'#07090a':'#071017','#0e1511':'#0f1d27','#c8f7d4':'#d2edfb','#5f8a6c':'#7595ab','#14211a':'#142633','#1c2b22':'#243849'})) svg=svg.replaceAll(before,after);
  }
  assets(id,'dark',svg);
  assets(id,'light',svg);
}

function identity(demo) {
  const color=demo.accent;
  const tones={chip:'#10202c',orbit:'#22203b',spectrum:'#102823',arcade:'#2b211b'};
  const bg=tones[demo.hero];
  let ornament='';
  if (demo.hero==='chip') {
    const traces=['M900 28H811l-37 33h-57l-21 21h-28','M900 47h-64l-45 40h-83l-22 22h-37','M900 70h-69l-45 43h-71l-17 17h-31','M900 142h-130l-29-27h-36','M900 166h-163l-42-33h-32','M870 11h-85l-42 36h-38'];
    ornament=traces.map((p,i)=>`<path d="${p}" class="wire"/><path d="${p}" class="signal" pathLength="100" style="animation-delay:-${i*.72}s"/>`).join('');
    ornament+='<path d="M592 67h55l21 21v39l-21 21h-55l-20-21V88z" fill="#0d1924" stroke="#407787"/><path d="M611 93h20l9 10v12l-9 9h-20l-9-9v-12z" fill="none" stroke="#87e5ff"/><circle cx="621" cy="108" r="3" fill="#cff6ff"/>';
  } else if (demo.hero==='orbit') {
    ornament=[0,1,2].map(i=>`<ellipse cx="731" cy="94" rx="${126-i*20}" ry="${28+i*10}" transform="rotate(${i*40-45} 731 94)" fill="none" stroke="${color}" opacity="${.45-i*.09}"/>`).join('');
    ornament+='<circle cx="731" cy="94" r="44" fill="url(#core)" opacity=".7"/><circle cx="731" cy="94" r="19" fill="none" stroke="#c7b0ff" stroke-opacity=".35"/><g class="orbit"><circle cx="804" cy="41" r="3.7" fill="#f4eaff"/><circle cx="659" cy="147" r="2.2" fill="#c7b0ff"/></g>';
  } else if (demo.hero==='spectrum') {
    ornament=Array.from({length:37},(_,index)=>{
      const n=index/36;
      const h=(Math.sin(n*Math.PI)**2*(.3+(Math.sin(index*1.08)**2)*.7))*91+4;
      return `<rect class="bar" x="${568+index*8}" y="${93-h/2}" width="3" height="${h.toFixed(2)}" rx="1.5" fill="${color}" opacity="${.25+.6*n}" style="animation-delay:-${(n*3.6).toFixed(2)}s"/>`;
    }).join('');
    ornament+=' <path d="M552 93H874" stroke="#7becd5" opacity=".2" stroke-dasharray="2 5"/>';
  } else {
    ornament=Array.from({length:133},(_,i)=>{
      const col=i%19, row=Math.floor(i/19);
      const op=(row*7+col*3)%11<4 ? .6 : .15;
      return `<rect x="${554+col*17}" y="${39+row*17}" width="11" height="11" rx="1.7" fill="${color}" opacity="${op}"/>`;
    }).join('');
    ornament+='<rect class="pixel" x="554" y="90" width="11" height="11" rx="1.7" fill="#fff1d8"/>';
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="188" viewBox="0 0 900 188" role="img" aria-label="${login}">
<defs><linearGradient id="body"><stop stop-color="#0d1118"/><stop offset=".68" stop-color="${bg}"/><stop offset="1" stop-color="#10131c"/></linearGradient><radialGradient id="core"><stop stop-color="${color}" stop-opacity=".65"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient><pattern id="mesh" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="${color}" opacity=".12"/></pattern></defs>
<style>.wire,.signal{fill:none;stroke:${color};stroke-width:1.2}.wire{opacity:.32}.signal{stroke:#d0f9ff;stroke-width:1.7;stroke-dasharray:10 90;animation:flow 3.9s linear infinite}@keyframes flow{from{stroke-dashoffset:106}to{stroke-dashoffset:6}}.orbit{transform-origin:731px 94px;animation:orbit 8s linear infinite}@keyframes orbit{to{transform:rotate(360deg)}}.bar{transform-origin:center;transform-box:fill-box;animation:gain 2.9s ease-in-out infinite alternate}@keyframes gain{from{transform:scaleY(.55)}to{transform:scaleY(1.16)}}.pixel{animation:pixel 3s steps(18,end) infinite}@keyframes pixel{to{transform:translateX(306px)}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<rect width="900" height="188" rx="11" fill="url(#body)"/><rect x="550" y="1" width="349" height="186" fill="url(#mesh)" opacity=".55"/>
${ornament}<path d="M38 49h30" stroke="${color}" stroke-width="2"/>
<text x="36" y="111" fill="#f2f6ff" font-family="'Segoe UI',Arial,sans-serif" font-weight="670" font-size="55" letter-spacing="-2">${login}</text>
<text x="38" y="141" fill="#aab9cd" font-family="Consolas,ui-monospace,monospace" font-size="15" letter-spacing=".4">Software &amp; tools</text>
</svg>`;
}

for (const demo of activeDemos) {
  if (['city','terminal','terminal-ice'].includes(demo.hero)) continue;
  const svg=identity(demo);
  assets(`identity-${demo.slug}`,'dark',svg);
  assets(`identity-${demo.slug}`,'light',svg);
}

const artIds=[...responsiveAssets,...pageData.featured.map(project=>project.tile)];
const catalog = { login, calendarUrl, total:snapshot.total, active:snapshot.active, from:snapshot.start, through:snapshot.through, widgets, demos, sources, projects, links, artIds, responsiveAssets };
if (isGallery) fs.writeFileSync(path.join(output,'catalog.json'),JSON.stringify(catalog,null,2),'utf8');

for (const demo of activeDemos) {
  const main=heroAsset(demo);
  for (const mode of ['dark','light']) for (const mobile of [false,true]) {
    const all=profileArt(pageData,mode,demo.accent,mobile);
    for (const [id,svg] of Object.entries(all)) assets(`${demo.slug}/${id}${mobile?'-mobile':''}`,mode,svg);
  }
  const folder=path.join(output,'demos',`${demo.id}-${demo.slug}`);
  const repoAssets=path.join(folder,'assets');
  fs.mkdirSync(repoAssets,{recursive:true});
  const required=[...new Set([main,demo.detail,...artIds,...responsiveAssets.map(id=>`${id}-mobile`)])];
  for (const id of required) for (const suffix of ['dark','light','dark-still','light-still']) {
    const filename=`${id}-${suffix}.svg`;
    const customized=artIds.includes(id) || id.endsWith('-mobile');
    fs.copyFileSync(path.join(assetDir,customized?demo.slug:'',filename),path.join(repoAssets,filename));
  }
  fs.writeFileSync(path.join(folder,'README.md'),writeReadme(demo,pageData),'utf8');
  for (const source of attribution(demo)) {
    const licenseDir=path.join(sourceRoot,source.checkout);
    const licenses=['LICENSE','LICENSES.md','fonts/LICENSES.md'];
    for (const file of licenses) {
      const original=path.join(licenseDir,file);
      if (!fs.existsSync(original)) continue;
      const target=path.join(folder,'licenses');
      fs.mkdirSync(target,{recursive:true});
      fs.copyFileSync(original,path.join(target,`${source.checkout}-${file.replaceAll('/','-')}.txt`));
    }
  }
}

fs.writeFileSync(path.join(output,'data-cache.json'),JSON.stringify(cache,null,2)+'\n','utf8');

console.log(`${login}: ${calendar.total} public contributions across ${snapshot.days.length} days, ${snapshot.start}–${snapshot.through}`);
console.log(isGallery ? `Generated ${demos.length} complete README drafts and ${widgets.length} component previews` : `Generated profile ${activeDemos[0].id}`);
