import { siAndroid, siGit, siGo, siKotlin, siLinux, siOpencv, siPython, siQt, siReact, siRust, siSqlite, siTypescript } from 'simple-icons';

export const responsiveAssets = ['profile-stats','weekly-activity','language-overview','project-languages','tech-stack'];
export const escapeXml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fmt=new Intl.NumberFormat('en-US');
const colors={ TypeScript:'#5899e8', Go:'#44bfd9', Rust:'#f0a67e', React:'#64d9ff', Python:'#5db1dc', Kotlin:'#b882f4',
  JavaScript:'#e0c46d', Java:'#bc8d6e', Vue:'#6cc9a5', HTML:'#e89171', CSS:'#ba95f1', Shell:'#8eb866',
  PowerShell:'#799eea', SQL:'#adabc8', Other:'#8390a4' };
const colorFor=name=>colors[name]??'#82afd7';
const percentage=value=>value>=10 ? `${value.toFixed(0)}%` : `${value.toFixed(1)}%`;
const sans="'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif";
const mono="Consolas,'SFMono-Regular',monospace";

function palette(mode, accent) {
  const dark=mode==='dark';
  return dark ? {bg:'#0e1520',bg2:'#131f2d',ink:'#eef5ff',sub:'#a7b8ce',muted:'#8ea4bb',line:'#2a3a50',track:'#25364a',accent} :
    {bg:'#f8fbff',bg2:'#edf3fb',ink:'#192d47',sub:'#435a73',muted:'#536983',line:'#d6e1ee',track:'#e0eaf5',accent:'#205b8d'};
}

function svg(width,height,title,label,theme,content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d">
<title id="t">${escapeXml(title)}</title><desc id="d">${escapeXml(label)}</desc>
<defs>
  <linearGradient id="panel" x2="1" y2="1"><stop stop-color="${theme.bg}"/><stop offset="1" stop-color="${theme.bg2}"/></linearGradient>
  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${theme.accent}" stop-opacity=".18"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></linearGradient>
  <clipPath id="frame"><rect width="${width}" height="${height}" rx="10"/></clipPath>
</defs>
<style>
text{font-family:${sans}}.mono{font-family:${mono}}.in{animation:appear .6s both cubic-bezier(.2,.75,.3,1);animation-delay:var(--d,0s)}
.grow{transform-origin:left center;transform-box:fill-box;animation:grow .85s both cubic-bezier(.17,.75,.31,1);animation-delay:var(--d,0s)}
.draw{stroke-dasharray:100;stroke-dashoffset:0;animation:draw 1.55s both cubic-bezier(.3,.7,.35,1)}
@keyframes appear{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes grow{from{transform:scaleX(.02);opacity:.55}to{transform:none;opacity:1}}@keyframes draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<g clip-path="url(#frame)"><rect width="${width}" height="${height}" fill="url(#panel)"/>${content}</g>
<rect x=".5" y=".5" width="${width-1}" height="${height-1}" rx="9.5" fill="none" stroke="${theme.line}"/></svg>`;
}

function text(x,y,value,options={}) {
  const {size=15,fill='white',weight=400,anchor='start',cls='',ext=''}=options;
  return `<text class="${cls}" x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" ${ext}>${escapeXml(value)}</text>`;
}

function stats(profile, theme, mobile) {
  const width=mobile?520:900, height=mobile?262:140;
  const rows=[
    {metric:profile.publicRepos, label:'Public repositories', unit:'GitHub'},
    {metric:profile.stars, label:'Stars earned', unit:'Public repositories'},
    {metric:profile.total, label:'Contributions', unit:'Past year'},
    {metric:profile.streak.current, label:'Current streak', unit:`Best ${profile.streak.longest} days · past year`},
  ];
  const body=rows.map(({metric,label,unit},i)=>{
    const x=mobile?26+(i%2)*252:27+i*222;
    const y=mobile?i>1?190:86:74;
    const content=text(x,y-34,label,{size:mobile?19:15,fill:theme.sub,weight:550})+
      text(x,y+13,fmt.format(metric),{size:mobile?46:43,fill:theme.ink,weight:650,cls:'mono'})+
      text(x,y+41,unit,{size:mobile?15:12.5,fill:theme.muted});
    return `<g class="in" style="--d:${i*.09}s">${content}</g>`;
  }).join('');
  const line=mobile?`M25 136H495 M260 22V114 M260 157V237`:'M225 28V111 M449 28V111 M674 28V111';
  return svg(width,height,'GitHub stats',rows.map(row=>`${row.label}: ${row.metric}, ${row.unit}`).join('. '),theme,
    `<path d="${line}" fill="none" stroke="${theme.line}"/><path d="M28 17h19" stroke="${theme.accent}" stroke-width="2"/>${body}`);
}

function weekly(profile,theme,mobile) {
  const width=mobile?520:900, height=mobile?212:182;
  const points=profile.weekly;
  const total=points.reduce((sum,row)=>sum+row.count,0);
  const maximum=Math.max(...points.map(row=>row.count),1);
  const midpoint=Math.max(Math.round(maximum/2),1);
  const inset=mobile?34:37, yTop=69, baseline=height-42;
  const xx=i=>(inset+i*(width-inset*2-26)/(points.length-1)).toFixed(2);
  const yy=count=>(baseline-(baseline-yTop)*count/maximum).toFixed(2);
  const trace='M'+points.map((row,i)=>`${xx(i)} ${yy(row.count)}`).join('L');
  const last=points.length-1;
  const guides=[...new Set([0,midpoint,maximum])].map(value=>`<path d="M${inset} ${yy(value)}H${width-38}" stroke="${theme.line}" stroke-dasharray="2 5"/>${text(width-22,Number(yy(value))+4,value,{size:mobile?13:11,fill:theme.muted,cls:'mono',anchor:'end'})}`).join('');
  const dots=points.map((row,i)=>row.count?`<circle class="in" style="--d:${.045*i}s" cx="${xx(i)}" cy="${yy(row.count)}" r="${i===last?4.2:2.9}" fill="${theme.accent}"><title>Week of ${row.date}: ${row.count}</title></circle>`:'').join('');
  const summary=points.map(row=>`${row.date}: ${row.count}`).join(', ');
  return svg(width,height,'Recent contribution activity',summary,theme,
    text(inset,36,'Weekly activity',{size:mobile?22:19,fill:theme.ink,weight:625})+
    text(width-31,36,`${total} in 12 weeks`,{size:mobile?16:14,fill:theme.accent,anchor:'end',cls:'mono'})+
    guides+`<path d="${trace} L${xx(last)} ${baseline} H${xx(0)}Z" fill="url(#area)" class="in"/><path d="${trace}" class="draw" pathLength="100" stroke="${theme.accent}" stroke-width="${mobile?2.7:2.3}" stroke-linejoin="round" stroke-linecap="round" fill="none"/>`+dots+
    text(inset,height-17,points[0].date.slice(5).replace('-','/'),{size:mobile?14:12,fill:theme.muted,cls:'mono'})+
    text(width-35,height-17,profile.through.slice(5).replace('-','/'),{size:mobile?14:12,fill:theme.muted,cls:'mono',anchor:'end'}));
}

function segmentBar(segments,x,y,width,height,id,theme) {
  let left=x;
  const blocks=segments.map(entry=>{
    const w=entry.percent/100*width;
    const block=`<rect x="${left.toFixed(3)}" y="${y}" width="${w.toFixed(3)}" height="${height}" fill="${colorFor(entry.name)}"><title>${escapeXml(entry.name)}: ${entry.percent.toFixed(1)}%</title></rect>`;
    left+=w;
    return block;
  }).join('');
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height/2}"/></clipPath></defs><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height/2}" fill="${theme.track}"/><g clip-path="url(#${id})"><g class="grow">${blocks}</g></g>`;
}

function languageOverview(profile,theme,mobile) {
  const entries=profile.primary.entries;
  const width=mobile?520:900, cols=mobile?2:3;
  const h=mobile?127+Math.ceil(entries.length/cols)*48:126+Math.ceil(entries.length/cols)*39;
  const x0=mobile?28:30, columnWidth=(width-2*x0)/cols;
  const legends=entries.map((entry,i)=>{
    const x=x0+(i%cols)*columnWidth, y=117+Math.floor(i/cols)*(mobile?48:39);
    return `<g class="in" style="--d:${.065*i}s"><circle cx="${x+5}" cy="${y-5}" r="4.5" fill="${colorFor(entry.name)}"/>${text(x+17,y,entry.name,{size:mobile?19:16,fill:theme.ink,weight:575})}${text(x+columnWidth-18,y,`${entry.value} · ${percentage(entry.percent)}`,{size:mobile?15:13,fill:theme.sub,cls:'mono',anchor:'end'})}</g>`;
  }).join('');
  const alt=entries.map(entry=>`${entry.name}: ${entry.value} repositories (${entry.percent.toFixed(1)}%)`).join(', ');
  return svg(width,h,'Primary languages across public source repositories',alt,theme,
    text(x0,34,'Primary languages',{size:mobile?23:21,fill:theme.ink,weight:650})+
    text(width-x0,34,`${profile.primary.total} repositories`,{size:mobile?15:14,fill:theme.muted,anchor:'end',cls:'mono'})+
    segmentBar(entries,x0,58,width-x0*2,mobile?19:17,'dist',theme)+legends);
}

function projectLanguages(profile,theme,mobile) {
  const projects=profile.featured.filter(item=>item.code);
  const width=mobile?520:900, rowHeight=mobile?93:69;
  const h=70+rowHeight*projects.length;
  const inset=mobile?27:30;
  const all=projects.map((item,i)=>{
    const y=76+i*rowHeight;
    const segments=item.code.entries;
    const legends=segments.slice(0,3).map(entry=>`${entry.name} ${percentage(entry.percent)}`).join('   /   ');
    const small=text(mobile?inset:width-inset,y+(mobile?53:29),legends,{size:mobile?15:12.5,fill:theme.sub,cls:'mono',anchor:mobile?'start':'end'});
    return text(inset,y,item.name,{size:mobile?21:17,weight:600,fill:theme.ink})+
      segmentBar(segments,mobile?inset:240,mobile?y+15:y-12,mobile?width-inset*2:width-240-inset,mobile?14:11,'code'+i,theme)+small;
  }).join('');
  return svg(width,h,'Source code makeup in selected repositories',projects.map(item=>`${item.name}: ${item.code.entries.map(entry=>`${entry.name} ${entry.percent.toFixed(1)}%`).join(', ')}`).join('. '),theme,
    text(inset,33,'Selected projects',{size:mobile?23:20,fill:theme.ink,weight:650})+
    text(width-inset,33,'Code bytes',{size:mobile?15:13,fill:theme.muted,cls:'mono',anchor:'end'})+all);
}

const techGroups=[
  {name:'Web',icons:[[siTypescript,'TypeScript','Gantt','TypeScript'],[siReact,'React','Gantt','TypeScript'],[siGo,'Go','Gantt','Go'],[siSqlite,'SQLite','Gantt','Go']]},
  {name:'Apps',icons:[[siRust,'Rust','GameReady','Rust'],[siKotlin,'Kotlin','MilkTrackerAPP','Kotlin'],[siAndroid,'Android','MilkTrackerAPP','Kotlin']]},
  {name:'Vision & tooling',icons:[[siPython,'Python','YOLOv8-PySide6-GUI','Python'],[siQt,'PySide6','YOLOv8-PySide6-GUI','Python'],[siOpencv,'OpenCV','YOLOv8-PySide6-GUI','Python'],[siGit,'Git'],[siLinux,'Linux']]},
];

function selectedTechGroups(profile) {
  const projects=new Map(profile.featured.map(project=>[project.repo,new Set(project.code?.entries.map(entry=>entry.name)??[])]));
  return techGroups.map(group=>({name:group.name,icons:group.icons.filter(([, ,repo,language])=>!repo || projects.get(repo)?.has(language))})).filter(group=>group.icons.length);
}

function stack(profile,theme,mobile) {
  const tracks=selectedTechGroups(profile);
  const width=mobile?520:900, height=mobile?280:206, rowGap=mobile?81:52;
  const body=tracks.map((group,i)=>{
    const y=mobile?35+i*rowGap:56+i*rowGap;
    const title=text(29,y,group.name,{size:mobile?20:17,fill:theme.sub,weight:650});
    const icons=group.icons.map(([icon,label],idx)=>{
      const x=mobile?29+idx*98:240+idx*119;
      const iconY=mobile?y+13:y-15;
      return `<g class="in" style="--d:${(i*.08+idx*.045).toFixed(3)}s"><rect x="${x-5}" y="${iconY-5}" width="34" height="31" rx="6" fill="${theme.track}"/><path d="${icon.path}" transform="translate(${x+1} ${iconY+1}) scale(.73)" fill="${theme.accent}"/>${text(x+35,iconY+16,label,{size:mobile?13:14,fill:theme.ink,weight:525})}</g>`;
    }).join('');
    return title + icons;
  }).join('');
  return svg(width,height,'Selected technology stack',techSummary(profile).map(group=>`${group.name}: ${group.items.join(', ')}`).join('. '),theme,body);
}

function projectTile(project,theme) {
  const width=430,h=128;
  const color=theme.accent;
  const illustrations={
    Gantt:`<g transform="translate(267 23)"><path d="M0 0V86M28 0V86M56 0V86M84 0V86M112 0V86M140 0V86" stroke="${theme.line}"/><rect x="4" y="9" width="61" height="11" rx="3" fill="${color}" opacity=".56"/><rect class="grow" x="43" y="33" width="67" height="11" rx="3" fill="${color}" opacity=".77"/><rect class="grow" style="--d:.19s" x="81" y="57" width="58" height="11" rx="3" fill="${color}"/><path d="M65 14H75V33M110 39h9v18" fill="none" stroke="${theme.muted}"/></g>`,
    GameReady:`<g transform="translate(266 23)"><rect width="140" height="83" rx="8" fill="${theme.bg}" stroke="${theme.line}"/><path d="M0 19H140" stroke="${theme.line}"/><circle cx="11" cy="10" r="2" fill="${color}"/><circle cx="18" cy="10" r="2" fill="${theme.muted}"/><circle cx="25" cy="10" r="2" fill="${theme.muted}"/><path d="M14 34H68M14 51H77M14 68H60" stroke="${theme.line}" stroke-width="4" stroke-linecap="round"/><rect class="grow" x="92" y="29" width="34" height="12" rx="6" fill="${color}"/><circle cx="119" cy="35" r="4" fill="${theme.bg}"/><rect x="92" y="47" width="34" height="12" rx="6" fill="${theme.track}"/><circle cx="100" cy="53" r="4" fill="${theme.muted}"/></g>`,
    MilkTrackerAPP:`<g transform="translate(290 16)"><rect width="64" height="97" rx="11" fill="${theme.bg}" stroke="${theme.muted}"/><rect x="20" y="7" width="24" height="3" rx="1.5" fill="${theme.line}"/><path d="M12 71H53" stroke="${theme.line}"/><rect x="15" y="48" width="6" height="18" rx="1.5" fill="${color}" opacity=".55"/><rect x="26" y="36" width="6" height="30" rx="1.5" fill="${color}" opacity=".7"/><rect x="37" y="42" width="6" height="24" rx="1.5" fill="${color}" opacity=".83"/><rect class="in" x="48" y="26" width="6" height="40" rx="1.5" fill="${color}"/><path d="M77 43H116M77 53H104" stroke="${theme.line}" stroke-width="3" stroke-linecap="round"/></g>`,
    'YOLOv8-PySide6-GUI':`<g transform="translate(269 23)"><rect width="140" height="83" rx="7" fill="${theme.bg}" stroke="${theme.line}"/><path d="M0 28H140M0 56H140M35 0V83M70 0V83M105 0V83" stroke="${theme.line}" opacity=".6"/><path class="draw" pathLength="100" d="M21 34V18H44 M66 18H85V33 M21 48V64H44 M65 64H85V48" stroke="${color}" stroke-width="2" fill="none"/><rect class="in" x="21" y="12" width="30" height="6" rx="1" fill="${color}"/><path d="M93 38h25v24H93z" fill="none" stroke="${theme.muted}"/></g>`,
  };
  const typeSize=project.name.length>13?24:29;
  return svg(width,h,project.name,project.tags,theme,
    `<path d="M210 127L290 0H430V128Z" fill="${theme.track}" opacity=".28"/>`+
    text(19,31,project.kind,{size:12,fill:theme.accent,weight:550,cls:'mono'})+
    text(18,73,project.name,{size:typeSize,fill:theme.ink,weight:640})+
    text(19,100,project.tags.replaceAll(' / ',' · '),{size:11.7,fill:theme.sub})+illustrations[project.repo]);
}

export function profileArt(profile, mode, accent, mobile=false) {
  const theme=palette(mode,accent);
  const renderer={
    'profile-stats':stats,'weekly-activity':weekly,'language-overview':languageOverview,
    'project-languages':projectLanguages, 'tech-stack':stack,
  };
  const charts=Object.fromEntries(Object.entries(renderer).map(([id,render])=>[id,render(profile,theme,mobile)]));
  if (mobile) return charts;
  const tileAccents={Gantt:accent,GameReady:mode==='dark'?'#ffc08f':'#a04720',MilkTrackerAPP:mode==='dark'?'#9de5b5':'#236144','YOLOv8-PySide6-GUI':mode==='dark'?'#bfb0fd':'#5942a7'};
  for (const project of profile.featured) charts[project.tile]=projectTile(project,{...theme,accent:tileAccents[project.repo]});
  return charts;
}

export const techSummary=profile=>selectedTechGroups(profile).map(group=>({name:group.name,items:group.icons.map(([,label])=>label)}));
