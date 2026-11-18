import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { calendarUrl, links, login, projects } from './widget-catalog.mjs';

const dayMs = 86400000;
const sourceExtensions = {
  ts:'TypeScript', tsx:'TypeScript', js:'JavaScript', jsx:'JavaScript', mjs:'JavaScript', cjs:'JavaScript',
  go:'Go', rs:'Rust', kt:'Kotlin', kts:'Kotlin', java:'Java', py:'Python', php:'PHP',
  html:'HTML', css:'CSS', scss:'SCSS', vue:'Vue', sql:'SQL', sh:'Shell', bash:'Shell', ps1:'PowerShell',
  c:'C', h:'C', cpp:'C++', hpp:'C++', cs:'C#', swift:'Swift', rb:'Ruby',
};
const apiBase = 'https://api.github.com';
const blogOrigin = new URL(links.find(link => link.name.includes('个人博客')).url).origin;

export function readCalendar(html) {
  const doc = new JSDOM(html).window.document;
  const counts = new Map([...doc.querySelectorAll('tool-tip[for]')].map(tooltip => [tooltip.getAttribute('for'), tooltip.textContent.trim()]));
  const days = [...doc.querySelectorAll('.ContributionCalendar-day[data-date][data-level]')].map(cell => {
    const label = counts.get(cell.id) ?? '';
    const count = /^No contributions\b/.test(label) ? 0 : Number(label.match(/^([\d,]+) contributions?\b/)?.[1].replaceAll(',', ''));
    const { date } = cell.dataset;
    const level = Number(cell.dataset.level);
    if (!Number.isInteger(count) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(level) || level<0 || level>4) {
      throw new Error(`Could not read contribution day ${date}`);
    }
    return { date, level, count };
  }).sort((a,b)=>a.date.localeCompare(b.date));
  const total = Number(doc.getElementById('js-contribution-activity-description')?.textContent.match(/[\d,]+/)?.[0].replaceAll(',', ''));
  if (days.length < 360 || days.length > 372 || new Set(days.map(day=>day.date)).size !== days.length || days.reduce((sum,day)=>sum+day.count,0) !== total) {
    throw new Error('Day-level contributions do not match the public calendar total. Keeping the last published profile.');
  }
  return { days, total, start:days[0].date, through:days.at(-1).date, active:days.filter(day=>day.count>0).length };
}

export function readArticles(html) {
  const doc=new JSDOM(html).window.document;
  const found=new Map();
  for (const element of doc.querySelectorAll('a.a-link[href]')) {
    let url;
    try { url=new URL(element.getAttribute('href'),blogOrigin); } catch { continue; }
    const title=element.textContent.trim().replace(/\s+/g,' ');
    if (url.origin!==blogOrigin || !/^\/\d+\.html$/.test(url.pathname) || !title || title.length>120) continue;
    found.set(url.href,{name:title,url:url.href});
    if (found.size===3) break;
  }
  if (!found.size) throw new Error('Blog feed did not contain recognized articles');
  return [...found.values()];
}

function summarizeTree(entries) {
  const filtered=entries.filter(entry => entry.type==='blob' && entry.mode!=='120000' && Number.isInteger(entry.size) && entry.size>0);
  const qtLayouts=new Set(filtered.filter(e=>e.path.toLowerCase().endsWith('.ui')).map(e=>path.posix.basename(e.path,'.ui').toLowerCase()));
  const qtResources=new Set(filtered.filter(e=>e.path.toLowerCase().endsWith('.qrc')).map(e=>e.path.toLowerCase().slice(0,-4)));
  const counts={};
  for (const entry of filtered) {
    const lower=entry.path.toLowerCase();
    const base=path.posix.basename(lower);
    if (/(^|\/)(?:vendor|node_modules|third_party|dist|build|target|coverage|generated|\.tools|\.cache|\.gradle|\.git)(\/|$)/.test(lower)) continue;
    if (/\.min\.[a-z]+$|\.generated\.[a-z]+$|\.gen\.(?:ts|js)$|_rc\.py$|^package-lock\.json$/.test(base)) continue;
    if (lower.startsWith('ui/') && base.endsWith('.py') && qtLayouts.has(base.slice(0,-3))) continue;
    if (lower.endsWith('.cpp') && qtResources.has(lower.slice(0,-4))) continue;
    const language=sourceExtensions[base.split('.').at(-1)];
    if (language) counts[language]=(counts[language]??0)+entry.size;
  }
  if (!Object.keys(counts).length) throw new Error('No recognized source code in repository tree');
  return Object.fromEntries(Object.entries(counts).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])));
}

export function readGitTree(list) {
  const rows=list.trim().split(/[\r\n\0]+/).flatMap(line=>{
    const match=line.match(/^(\d+) (blob|commit) \w+\s+(\d+|-)\t(.+)$/);
    return match ? [{mode:match[1],type:match[2],size:Number(match[3]),path:match[4]}] : [];
  });
  return summarizeTree(rows);
}

const languageKey=repo=>`${repo.default_branch}@${repo.pushed_at}`;
const dateOnly=value=>String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
const readFile=file=>fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');

function cacheRelease(tag, url) {
  if (typeof tag!=='string' || !/^[a-zA-Z0-9][a-zA-Z0-9._+\-]{0,48}$/.test(tag)) return null;
  return { tag, url:`${url}/releases/latest` };
}

export function loadFixtureData(folder) {
  const profile=JSON.parse(readFile(path.join(folder,'profile.json')));
  const repos=JSON.parse(readFile(path.join(folder,'repos.json')));
  const snapshot=readCalendar(readFile(path.join(folder,'calendar-refresh.asset')));
  const byProject={};
  for (const project of projects) {
    const repo=repos.find(candidate=>candidate.name===project.repo);
    if (!repo) throw new Error(`Repository fixture not found for ${project.repo}`);
    byProject[repo.name]={key:languageKey(repo), counts:readGitTree(readFile(path.join(folder,'languages',`${repo.name}.tree`)))};
  }
  const releaseUrl=readFile(path.join(folder,'gameready-release.txt')).trim();
  const endpoint=`https://github.com/${login}/GameReady`;
  const tag=releaseUrl.startsWith(`${endpoint}/releases/tag/`) ? decodeURIComponent(releaseUrl.split('/').at(-1)) : null;
  const cache={byProject, articles:readArticles(readFile(path.join(folder,'personal-blog.html'))), release:cacheRelease(tag,endpoint)};
  return {profile,repos,snapshot,cache};
}

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function request(url, { token, expected404=false, accept='*/*', publicFallback=false }={}) {
  const headers={'Accept':accept,'User-Agent':`${login}-profile-refresh`};
  if (token && new URL(url).origin===apiBase) headers.Authorization=`Bearer ${token}`;
  for (let attempt=0;attempt<3;attempt++) {
    let response;
    try {
      response=await fetch(url,{headers,signal:AbortSignal.timeout(16000),redirect:headers.Authorization?'error':'follow'});
    } catch(error) {
      if (attempt===2) throw error;
      await wait(700*(attempt+1));
      continue;
    }
    if (response.ok) return response;
    if (headers.Authorization && publicFallback && [401,403,404].includes(response.status)) {
      delete headers.Authorization;
      continue;
    }
    if (expected404 && response.status===404) return null;
    if (attempt===2 || (response.status!==429 && response.status<500)) throw new Error(`HTTP ${response.status} for ${new URL(url).pathname}`);
    await wait(700*(attempt+1));
  }
  throw new Error(`Unable to read ${new URL(url).pathname}`);
}

export async function fetchProfileData(saved={}) {
  const token=process.env.GITHUB_TOKEN;
  const apiOptions={token,accept:'application/vnd.github+json',publicFallback:true};
  const json=async (endpoint,options={})=>(await request(apiBase+endpoint,{...apiOptions,...options}))?.json();
  const endpoint=`/users/${login}`;
  const [profile,repos,snapshot]=await Promise.all([
    json(endpoint),
    (async()=>{
      const all=[];
      for (let pageNumber=1;pageNumber<=20;pageNumber++) {
        const batch=await json(`${endpoint}/repos?type=owner&per_page=100&page=${pageNumber}`);
        if (!Array.isArray(batch)) throw new Error('Repository list format changed');
        all.push(...batch);
        if (batch.length<100) return all;
      }
      throw new Error('Too many repositories to calculate a complete breakdown');
    })(),
    request(calendarUrl,{accept:'text/html'}).then(result=>result.text()).then(readCalendar),
  ]);
  const sinceToday=Math.floor((Date.now()-Date.parse(snapshot.through+'T23:59:59Z'))/dayMs);
  if (sinceToday>3) throw new Error('The public contribution calendar was unexpectedly old');

  const warn=(message,error)=>console.warn(`${message}: ${error instanceof Error ? error.message : 'data unavailable'}`);
  const lookupProject=async project=>{
    const repo=repos.find(candidate=>candidate.name===project.repo);
    const prior=saved.byProject?.[project.repo];
    if (!repo || repo.archived) return undefined;
    const key=languageKey(repo);
    if (prior?.key===key && prior.counts) return prior;
    try {
      const result=await json(`/repos/${login}/${repo.name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
      if (result.truncated || !Array.isArray(result.tree)) throw new Error('GitHub returned an incomplete tree');
      return {key,counts:summarizeTree(result.tree)};
    } catch(error) {
      warn(`Keeping previous language data for ${project.repo}`,error);
      return prior;
    }
  };

  const [languageEntries,articles,release]=await Promise.all([
    Promise.all(projects.map(async project=>[project.repo,await lookupProject(project)])),
    request(`${blogOrigin}/`,{accept:'text/html'}).then(result=>result.text()).then(readArticles).catch(error=>{
      warn('Keeping previous blog links',error);
      return saved.articles??[];
    }),
    json(`/repos/${login}/GameReady/releases/latest`,{expected404:true}).then(result=>result ? cacheRelease(result.tag_name,`https://github.com/${login}/GameReady`) : null).catch(error=>{
      warn('Keeping previous release label',error);
      return saved.release??null;
    }),
  ]);
  return {profile,repos,snapshot,cache:{byProject:Object.fromEntries(languageEntries.filter(([,entry])=>entry)),articles,release}};
}

export function streak(days) {
  let run=0, longest=0;
  for (const day of days) { run=day.count ? run+1 : 0; longest=Math.max(run,longest); }
  const recent=days.at(-1).count ? days : days.slice(0,-1);
  let current=0;
  for (const day of [...recent].reverse()) { if (!day.count) break; current++; }
  return {current,longest};
}

function shares(counts, totalLimit, itemLimit, units='code') {
  const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
  const number=ranked.reduce((sum,[,count])=>sum+count,0);
  const entries=ranked.slice(0,itemLimit);
  if (ranked.length>itemLimit) entries.push(['Other',ranked.slice(itemLimit).reduce((sum,[,count])=>sum+count,0)]);
  const total=totalLimit??number;
  return {total, units, entries:entries.map(([name,value])=>({name,value,percent:total ? value/total*100 : 0}))};
}

export function deriveProfile({profile,repos,snapshot,cache}) {
  if (profile.login?.toLowerCase()!==login.toLowerCase() || !Number.isInteger(profile.public_repos) || !Array.isArray(repos)) throw new Error('Expected the public profile of the requested account');
  if (repos.some(repo=>repo.owner?.login?.toLowerCase()!==login.toLowerCase() || !Number.isInteger(repo.stargazers_count))) throw new Error('Repository list contains unexpected data');
  const visible=repos.filter(repo=>repo.private===false);
  if (visible.length!==profile.public_repos) throw new Error('The public repository list was incomplete or changed while refreshing');
  const tracked=visible.filter(repo=>!repo.fork && !repo.archived && repo.language);
  const primary={};
  for (const repo of tracked) primary[repo.language]=(primary[repo.language]??0)+1;
  const weekly=new Map();
  for (const day of snapshot.days) {
    const date=new Date(`${day.date}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate()-date.getUTCDay());
    const key=date.toISOString().slice(0,10);
    weekly.set(key,(weekly.get(key)??0)+day.count);
  }
  const featured=[];
  for (const project of projects) {
    const repo=visible.find(candidate=>candidate.name===project.repo);
    if (!repo) continue;
    const code=cache.byProject?.[project.repo]?.counts;
    featured.push({...project, url:`https://github.com/${login}/${project.repo}`, pushed:dateOnly(repo.pushed_at), stars:repo.stargazers_count, code:code ? shares(code,undefined,4) : null});
  }
  return {
    login, through:snapshot.through, total:snapshot.total, active:snapshot.active, publicRepos:profile.public_repos,
    stars:visible.reduce((sum,repo)=>sum+repo.stargazers_count,0), streak:streak(snapshot.days),
    primary:shares(primary,tracked.length,6,'repositories'),
    weekly:[...weekly].slice(-12).map(([date,count])=>({date,count})), featured,
    articles:cache.articles??[], release:cache.release??null,
  };
}
