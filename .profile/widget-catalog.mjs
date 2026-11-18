export const login = 'BigdataZjk';
export const calendarUrl = `https://github.com/users/${login}/contributions`;

export const sources = {
  fx: { name: 'Contribution FX', url: 'https://github.com/Sur1ive/contribution-fx', checkout: 'contribution-fx' },
  arcade: { name: 'Pac-Man Contribution Graph', url: 'https://github.com/abozanona/pacman-contribution-graph', checkout: 'arcade' },
  snake: { name: 'Platane / snk', url: 'https://github.com/Platane/snk', checkout: 'snake' },
  iso: { name: 'GitHub Profile 3D Contrib', url: 'https://github.com/yoshi389111/github-profile-3d-contrib', checkout: 'isometric' },
  atelier: { name: 'Readme Atelier', url: 'https://github.com/monokernn/readme-atelier', checkout: 'atelier' },
  profile: { name: 'GitHub 公开数据', url: `https://github.com/${login}` },
  local: { name: '本页组件' },
};

export const widgets = [
  { id:'circuit', source:'fx', name:'电路追踪', mode:'循环', note:'发光信号沿电路走线穿过贡献图，点亮真实的活跃日期。', palette:'ocean' },
  { id:'isometric', source:'iso', name:'3D 贡献城市', mode:'开场', note:'近 26 周的活跃日依次升起，柱高采用对数比例。', palette:'ocean' },
  { id:'constellation', source:'fx', name:'贡献星图', mode:'循环', note:'活跃日形成星点，光线沿星座连线逐段亮起。', palette:'purple' },
  { id:'equalizer', source:'fx', name:'动态声谱', mode:'循环', note:'由贡献日历驱动的频谱动画，柱形起落带有余波和峰值。', palette:'ocean' },
  { id:'terminal', source:'atelier', name:'终端启动', mode:'开场', note:'终端命令、名字与技术方向依次出现，模拟启动过程。', palette:'github' },
  { id:'pacman', source:'arcade', name:'吃豆人', mode:'循环', note:'角色与幽灵沿公开贡献格移动，得分随吃到的格子变化。', palette:'sunset' },
  { id:'replay', source:'fx', name:'年度回放', mode:'循环', note:'播放头从旧到新编排日期，贡献格与累计数同步出现。', palette:'github' },
  { id:'snake', source:'snake', name:'贪吃蛇', mode:'循环', note:'蛇沿求解路径拾取贡献格，底部色带记录拾取过程。', palette:'purple' },
  { id:'breakout', source:'arcade', name:'打砖块', mode:'循环', note:'弹球掠过一年的贡献网格，活跃日期成为砖块。', palette:'sunset' },
  { id:'ripple', source:'fx', name:'贡献涟漪', mode:'循环', note:'活跃日是波源，波纹从贡献格向两侧扩散。', palette:'ocean' },
  { id:'warp', source:'fx', name:'超空间折叠', mode:'循环', note:'贡献格随飞行视角伸缩，短暂拉出速度轨迹。', palette:'purple' },
  { id:'gravity', source:'fx', name:'重力坍缩', mode:'循环', note:'格子脱离日历，受重力吸引后重新排回日期位置。', palette:'sunset' },
  { id:'splitflap', source:'fx', name:'机械翻牌', mode:'循环', note:'日历格像车站翻牌屏一样依次翻转。', palette:'sunset' },
  { id:'sort', source:'fx', name:'贡献排序', mode:'循环', note:'格子按活跃度重排，再回到原来的时间位置。', palette:'purple' },
  { id:'pixel', source:'atelier', name:'像素夜景', mode:'循环', note:'从周贡献生成像素天际线，加入窗灯和星空的细节。', palette:'purple' },
  { id:'terminal-ice', source:'atelier', name:'冰蓝终端', mode:'开场', note:'终端启动与 GitHub 数据摘要，配色与电路图一致。', palette:'ocean' },
  { id:'profile-stats', source:'profile', name:'GitHub 数据概览', mode:'开场', note:'公开仓库、获得的 Star、过去一年贡献与连续活跃天数。', palette:'ocean' },
  { id:'weekly-activity', source:'profile', name:'每周活动曲线', mode:'开场', note:'最近 12 周的真实公开贡献，按周汇总。', palette:'ocean' },
  { id:'language-overview', source:'profile', name:'全仓库语言分布', mode:'开场', note:'以公开源码仓库的主语言计数，分段条显示仓库占比。', palette:'ocean' },
  { id:'project-languages', source:'profile', name:'项目语言构成', mode:'开场', note:'四个精选项目中，由 Git 跟踪的源文件代码字节占比。', palette:'purple' },
  { id:'tech-stack', source:'local', name:'技术栈面板', mode:'开场', note:'按 Web、应用、视觉和工具整理常用技术。', palette:'ocean' },
  { id:'project-gantt', source:'local', name:'可点击项目卡', mode:'开场', note:'用项目自己的界面语言呈现精选仓库，点击直达源码。', palette:'ocean' },
];

export const demos = [
  { id:'07', slug:'complete', name:'冰蓝工程台', subtitle:'终端开场＋电路动效＋完整主页', lead:'circuit', detail:'circuit', hero:'terminal-ice', accent:'#7fe5ff' },
  { id:'01', slug:'circuit', name:'电路追踪', subtitle:'发光信号穿过全年贡献格', lead:'circuit', detail:'circuit', hero:'chip', accent:'#7fe5ff', path:'工程感最强' },
  { id:'02', slug:'isometric', name:'3D 贡献城市', subtitle:'等距柱体按时间从地面升起', lead:'isometric', detail:'isometric', hero:'city', accent:'#a5baff', path:'立体数据' },
  { id:'03', slug:'constellation', name:'贡献星图', subtitle:'活跃日连成一张带光迹的星图', lead:'constellation', detail:'constellation', hero:'orbit', accent:'#c7b0ff', path:'安静、精致' },
  { id:'04', slug:'equalizer', name:'动态声谱', subtitle:'把贡献强度转为带余波的声谱', lead:'equalizer', detail:'equalizer', hero:'spectrum', accent:'#7becd5', path:'有节奏感' },
  { id:'05', slug:'terminal', name:'终端启动', subtitle:'命令加载与年度贡献回放', lead:'terminal', detail:'replay', hero:'terminal', accent:'#b9f590', path:'开发者风格' },
  { id:'06', slug:'arcade', name:'街机贡献图', subtitle:'吃豆人逐格穿过贡献地图', lead:'pacman', detail:'pacman', hero:'arcade', accent:'#ffc685', path:'更活泼' },
];

export const projects = [
  { name:'RSM / Gantt', repo:'Gantt', tile:'project-gantt', kind:'Planning', desc:'用需求池、甘特图和工作日历协作排期。', tags:'React / TypeScript / Go / SQLite' },
  { name:'GameReady', repo:'GameReady', tile:'project-gameready', kind:'Desktop', desc:'便携的 Windows 游戏配置工具，支持 NAS 备份。', tags:'Rust / Windows' },
  { name:'MilkTrackerAPP', repo:'MilkTrackerAPP', tile:'project-milktracker', kind:'Android', desc:'记录宝宝的喂养时间与奶量。', tags:'Kotlin / Android' },
  { name:'YOLO GUI', repo:'YOLOv8-PySide6-GUI', tile:'project-vision', kind:'Vision', desc:'为 YOLO 系列视觉模型提供图形界面。', tags:'Python / PySide6' },
];

export const links = [
  { name:'GitHub · 全部仓库', url:`https://github.com/${login}?tab=repositories`, description:'源码与项目发布' },
  { name:'科记 · 个人博客', url:'https://blog.zhangjinke.com:11443/', description:'技术实践与项目记录' },
  { name:'CSDN · 春马与夏', url:'https://blog.csdn.net/qq_43376286', description:'技术文章与旧笔记' },
];
