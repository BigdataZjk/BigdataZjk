import { calendarUrl, links, login, sources, widgets } from './widget-catalog.mjs';
import { escapeXml, responsiveAssets, techSummary } from './profile-artwork.mjs';

export function heroAsset(demo) {
  const ready={city:'isometric',terminal:'terminal','terminal-ice':'terminal-ice'};
  return ready[demo.hero]??`identity-${demo.slug}`;
}

export function picture(name, alt, { width=900, mobile=responsiveAssets.includes(name), play=false }={}) {
  const conditions=[];
  if (mobile && !play) conditions.push(
    ['(max-width: 760px) and (prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)','mobile-dark-still'],
    ['(max-width: 760px) and (prefers-reduced-motion: reduce)','mobile-light-still'],
  );
  if (!play) conditions.push(
    ['(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)','dark-still'],
    ['(prefers-reduced-motion: reduce)','light-still'],
  );
  if (mobile) conditions.push(
    ['(max-width: 760px) and (prefers-color-scheme: dark)','mobile-dark'],
    ['(max-width: 760px)','mobile-light'],
  );
  conditions.push(['(prefers-color-scheme: dark)','dark']);
  const tags=conditions.map(([media,suffix])=>`<source media="${media}" srcset="./assets/${name}-${suffix}.svg">`);
  return `<picture>${tags.join('')}<img src="./assets/${name}-light.svg" alt="${escapeXml(alt)}" width="${width}"></picture>`;
}

export function attribution(demo) {
  const widget=widgets.find(item=>item.id===demo.detail);
  const used=[widget.source];
  if (demo.hero==='terminal'||demo.hero==='terminal-ice') used.push('atelier');
  return [...new Set(used)].map(name=>sources[name]);
}

function projectTable(profile) {
  const rows=[];
  for (let i=0;i<profile.featured.length;i+=2) {
    const chips=profile.featured.slice(i,i+2).map(project=>{
      const tile=picture(project.tile,`${project.name} · ${project.tags}`,{width:430});
      const indicators=[project.pushed ? `更新于 ${escapeXml(project.pushed)}` : '', project.stars ? `${project.stars} Star` : ''];
      if (project.repo==='GameReady' && profile.release) indicators.push(`<a href="${escapeXml(profile.release.url)}">发布 ${escapeXml(profile.release.tag)}</a>`);
      return `<td valign="top" width="50%"><a href="${escapeXml(project.url)}">${tile}</a><br><strong><a href="${escapeXml(project.url)}">${escapeXml(project.name)}</a></strong><br>${escapeXml(project.desc)}<br><sub>${indicators.filter(Boolean).join(' &nbsp;·&nbsp; ')}</sub></td>`;
    });
    rows.push(`<tr>${chips.join('')}</tr>`);
  }
  return `<table>${rows.join('')}</table>`;
}

function languageDetails(profile) {
  const primary=profile.primary.entries.map(entry=>`${entry.name} ${entry.value} 个（${entry.percent.toFixed(1)}%）`).join('，');
  const selected=profile.featured.filter(item=>item.code).map(item=>`- **${item.name}** ${item.code.entries.map(entry=>`${entry.name} ${entry.percent.toFixed(1)}%`).join(' / ')}`).join('\n');
  return `<details>\n<summary>查看语言数据与统计口径</summary>\n\n**主语言**　非归档、非分叉的公开仓库，以 GitHub 标记的主语言计数。${primary}。\n\n**项目构成**　精选项目默认分支中 Git 记录的源文件字节，过滤依赖目录、构建产物和已识别的生成文件。\n\n${selected}\n\n</details>`;
}

function posts(profile) {
  if (!profile.articles.length) return '';
  const items=profile.articles.map(article=>`<li><a href="${escapeXml(article.url)}">${escapeXml(article.name)}</a></li>`).join('');
  return `## 博客文章\n\n<ul>${items}</ul>`;
}

function footerLinks() {
  const parts=links.map(link=>`<tr><td><strong><a href="${escapeXml(link.url)}">${escapeXml(link.name)}</a></strong></td><td>${escapeXml(link.description)}</td></tr>`);
  parts.push('<tr><td><strong>QQ</strong></td><td><code>22432832</code></td></tr>');
  return `<table>${parts.join('')}</table>`;
}

export function writeReadme(demo,profile) {
  const main=heroAsset(demo);
  const arcadeMotion=demo.slug==='arcade';
  const contribution=widgets.find(widget=>widget.id===demo.detail);
  const dataSummary=`${profile.publicRepos} 个公开仓库，${profile.stars} 个 Star，过去一年 ${profile.total} 次贡献，连续 ${profile.streak.current} 天，年度最长 ${profile.streak.longest} 天`;
  const layout=[
    '<!-- 此页由 .profile 与 GitHub Actions 生成 -->',
    picture(main,main==='isometric'?'BigdataZjk 最近 26 周的等距贡献城市':`${login} · Software & tools`,{play:arcadeMotion}),
    '**Web 应用 · Windows 工具 · Android · 计算机视觉**\n\n[项目](#精选项目)　/　[语言](#语言分布)　/　[博客](#博客文章)　/　[链接](#链接与交流)',
    '## GitHub 概览\n\n'+picture('profile-stats',dataSummary),
    '## 贡献与活动\n\n'+[
      ...(main===demo.detail ? [] : [picture(demo.detail,`${contribution.name} · ${login} 的公开贡献日历`,{play:arcadeMotion})]),
      picture('weekly-activity',`近 12 周每周贡献：${profile.weekly.map(week=>`${week.date} ${week.count} 次`).join('；')}`),
      `<sub>截至 ${profile.through} · <a href="${calendarUrl}">GitHub 公开贡献日历</a>${arcadeMotion?' · <a href="./assets/identity-arcade-dark-still.svg">静态横幅</a> · <a href="./assets/pacman-dark-still.svg">静态贡献图</a>':''}</sub>`,
    ].join('\n\n'),
    `## 精选项目\n\n${projectTable(profile)}\n\n[查看全部公开仓库](${links[0].url})`,
    `## 语言分布\n\n${picture('language-overview','公开源码仓库按主语言统计：'+profile.primary.entries.map(entry=>`${entry.name} ${entry.value} 个`).join('，'))}\n\n${picture('project-languages','精选项目默认分支的源文件字节占比')}\n\n${languageDetails(profile)}`,
    `## 技术栈\n\n${picture('tech-stack',techSummary(profile).map(group=>`${group.name}：${group.items.join('、')}`).join('；'))}`,
    posts(profile),
    `## 链接与交流\n\n${footerLinks()}`,
    `<sub>动效组件 ${attribution(demo).map(source=>`<a href="${source.url}">${source.name}</a>`).join(' · ')}</sub>`,
  ];
  return layout.filter(Boolean).join('\n\n')+'\n';
}
