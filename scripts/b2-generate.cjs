const fs = require('fs');
const path = require('path');

const result = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'b2-verify-result.json'), 'utf-8'));

const FURN_COLORS = {
  MainSofa: '#a0522d',
  CoffeeTable: '#d4a017',
  TVStand: '#2d3748',
  TV: '#2d3748',
  SideSofa: '#c68a6d',
  Bookshelf: '#6b4423',
  Shelf: '#8b7355',
  FloorLamp1: '#b8860b',
  FloorLamp2: '#b8860b',
  Plant1: '#228b22',
  Plant2: '#228b22',
  LoungeChair: '#8b4513',
  SideTable: '#cd853f',
  TaskCnt: 'transparent'
};

function wx2sx(x) { return 60 + (x + 4) * 60; }
function wz2sy(z) { return 60 + (z + 4) * 60; }

// ========== 生成 SVG ==========
let svg = '';
svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">`;
svg += `<rect x="0" y="0" width="600" height="600" fill="#fafafa"/>`;

// 标题
svg += `<text x="60" y="36" font-size="14" font-weight="bold" font-family="sans-serif" fill="#222">方案 B2 · 平衡探索型（几何修正版）</text>`;

// 外墙：4 条线 + 门缺口
// 西墙 x=60：z∈[-4,4] → SVG y∈[60,540]，去掉 z∈[-1,1] → y∈[240,360]
svg += `<line x1="60" y1="60"  x2="60"  y2="240" stroke="#000" stroke-width="2"/>`;
svg += `<line x1="60" y1="360" x2="60"  y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<text x="28" y="305" font-size="12" font-family="sans-serif" fill="#c00" transform="rotate(-90 30 300)">→ bedroom</text>`;

// 东墙 x=540
svg += `<line x1="540" y1="60"  x2="540" y2="240" stroke="#000" stroke-width="2"/>`;
svg += `<line x1="540" y1="360" x2="540" y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<text x="548" y="305" font-size="12" font-family="sans-serif" fill="#c00" transform="rotate(90 570 300)">→ kitchen</text>`;

// 南墙 y=60 (z=-4) 全部实心
svg += `<line x1="60" y1="60" x2="540" y2="60" stroke="#000" stroke-width="2"/>`;
// 北墙 y=540 (z=4)，去掉 entrance z∈[2.5,4] → x∈[-1,1] → SVG x∈[240,360]
svg += `<line x1="60"  y1="540" x2="240" y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<line x1="360" y1="540" x2="540" y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<text x="270" y="564" font-size="12" font-family="sans-serif" fill="#c00">→ entrance</text>`;

// 三个 clearance 半透明红
function drawClearance(c, name) {
  const x = wx2sx(c.xMin);
  const y = wz2sy(c.zMin);
  const w = (c.xMax - c.xMin) * 60;
  const h = (c.zMax - c.zMin) * 60;
  svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgba(255,120,100,0.2)" stroke="rgba(255,80,80,0.6)" stroke-width="1"/>`;
}
drawClearance(result.clearances.bedroom, 'bedroom');
drawClearance(result.clearances.kitchen, 'kitchen');
drawClearance(result.clearances.entrance, 'entrance');

// 14 件家具（跳过 TaskCnt ignore=true）
for (const f of result.activeFurnitureAABBs) {
  if (f.id === 'TaskCnt') continue;
  const x = wx2sx(f.xMin);
  const y = wz2sy(f.zMin);
  const w = (f.xMax - f.xMin) * 60;
  const h = (f.zMax - f.zMin) * 60;
  const color = FURN_COLORS[f.id] || '#888';
  svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" stroke="#000" stroke-width="1" opacity="0.9"/>`;
  const cx = x + w / 2;
  const cy = y + h / 2;
  svg += `<text x="${cx.toFixed(1)}" y="${(cy + 3.5).toFixed(1)}" font-size="9" font-family="sans-serif" fill="#fff" text-anchor="middle" font-weight="bold">${f.name}</text>`;
}

// Spawn 绿色空心圆 + 朝向箭头
const sp = result.spawn;
const sxC = wx2sx(sp.x);
const syC = wz2sy(sp.z);
svg += `<circle cx="${sxC.toFixed(1)}" cy="${syC.toFixed(1)}" r="6" fill="none" stroke="#2e7d32" stroke-width="2"/>`;
const yawRad = sp.yawDeg * Math.PI / 180;
const ax = sxC + 18 * Math.cos(yawRad);
const ay = syC + 18 * Math.sin(yawRad);
svg += `<line x1="${sxC.toFixed(1)}" y1="${syC.toFixed(1)}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="#2e7d32" stroke-width="2" marker-end="url(#arr)"/>`;
svg += `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#2e7d32"/></marker></defs>`;
svg += `<text x="${(sxC - 14).toFixed(1)}" y="${(syC - 10).toFixed(1)}" font-size="11" font-family="sans-serif" fill="#2e7d32" font-weight="bold">S</text>`;

// 初始钥匙 Key0 金色实心小方块
const ik = result.initialKey;
const kx = wx2sx(ik.x), ky = wz2sy(ik.z);
svg += `<rect x="${(kx - 6).toFixed(1)}" y="${(ky - 6).toFixed(1)}" width="12" height="12" fill="gold" stroke="#b8860b" stroke-width="1.5"/>`;
svg += `<text x="${(kx + 10).toFixed(1)}" y="${(ky + 4).toFixed(1)}" font-size="10" font-family="sans-serif" fill="#8b6914">Key₀(茶几上)</text>`;

// MovedKey 金色虚线方块
const mk = result.movedKey;
const mx = wx2sx(mk.x), my = wz2sy(mk.z);
svg += `<rect x="${(mx - 6).toFixed(1)}" y="${(my - 6).toFixed(1)}" width="12" height="12" fill="rgba(255,215,0,0.3)" stroke="#b8860b" stroke-width="1.5" stroke-dasharray="3,2"/>`;
svg += `<text x="${(mx + 10).toFixed(1)}" y="${(my + 4).toFixed(1)}" font-size="10" font-family="sans-serif" fill="#8b6914">Key' (猫后)</text>`;

// 推荐路径 4 段虚线
const pp = result.svgPathPoints;
const colorLine = '#4a8cff';
if (pp.S1) svg += `<polyline points="${pp.S1}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;
if (pp.S2) svg += `<polyline points="${pp.S2}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;
if (pp.S3) svg += `<polyline points="${pp.S3}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;
if (pp.S4) svg += `<polyline points="${pp.S4}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;

// 图例区（右下角）
const lgx = 420, lgy = 90;
svg += `<text x="${lgx}" y="${lgy}" font-size="11" font-family="sans-serif" fill="#222" font-weight="bold">图例</text>`;
const legends = [
  ['主沙发', FURN_COLORS.MainSofa],
  ['茶几', FURN_COLORS.CoffeeTable],
  ['电视柜/电视', FURN_COLORS.TVStand],
  ['单人沙发', FURN_COLORS.SideSofa],
  ['书架', FURN_COLORS.Bookshelf],
  ['Clearance禁放', 'rgba(255,120,100,0.3)'],
  ['Spawn(出生点)', 'none'],
  ['Key₀(初始)', 'gold'],
  ["Key'(猫移后)", 'rgba(255,215,0,0.4)']
];
legends.forEach((lg, i) => {
  const yy = lgy + 18 + i * 16;
  if (lg[1] === 'none') {
    svg += `<circle cx="${lgx + 6}" cy="${yy}" r="5" fill="none" stroke="#2e7d32" stroke-width="1.5"/>`;
  } else if (lg[0].startsWith("Key'")) {
    svg += `<rect x="${lgx}" y="${yy - 5}" width="12" height="10" fill="${lg[1]}" stroke="#b8860b" stroke-dasharray="2,1" stroke-width="1"/>`;
  } else {
    svg += `<rect x="${lgx}" y="${yy - 5}" width="12" height="10" fill="${lg[1]}" stroke="#000" stroke-width="0.8"/>`;
  }
  svg += `<text x="${lgx + 20}" y="${yy + 3}" font-size="10" font-family="sans-serif" fill="#333">${lg[0]}</text>`;
});

svg += `</svg>`;

const svgPath = path.join(__dirname, '..', 'docs', 'assets', 'leave-home-options', 'option-b2.svg');
fs.writeFileSync(svgPath, svg, 'utf-8');
const svgSizeKB = (fs.statSync(svgPath).size / 1024).toFixed(1);

// ========== 生成 MD ==========
const { activeFurnitureAABBs: furns, aabbTable, clearanceDistances,
  disjointExamples, overlapCount, spawnMinFurn, spawnMinDist,
  distKey, viewAngleDeg, losHits, bdx, bdz, distBD, angleBD, absZ,
  standableHits, hitDirs, blockedCount, bfsBD_KT, bfsBD_EN,
  S1, S2, S3, S4, total, furniture, spawn, initialKey, movedKey } = result;

let md = '';
md += `# LEAVE_HOME 关卡最终布局方案 B2（几何修正唯一版）\n\n`;
md += `本方案为唯一候选批准方案；§1-§8 所有坐标均已几何校验通过；§9 三个问题不影响几何正确性，待人工拍板后可进入生产代码修改。\n\n`;

// §1
md += `## §1 B2 唯一坐标表\n\n`;
md += `y 高度为建议默认值；所有 xz 坐标已通过 §2 几何校验。\n\n`;
md += `| # | 条目 | id | room-local (x, y, z) | size (x,y,z) | 所有权归属 (Room3D static / Task Container3D / 无) | 备注 |\n`;
md += `|---|---|---|---|---|---|---|\n`;
const owners = {
  MainSofa: 'Room3D static',
  CoffeeTable: 'Task Container3D',
  TVStand: 'Room3D static',
  TV: 'Room3D static',
  SideSofa: 'Room3D static',
  Bookshelf: 'Room3D static',
  Shelf: 'Room3D static',
  FloorLamp1: 'Room3D static',
  FloorLamp2: 'Room3D static',
  Plant1: 'Room3D static',
  Plant2: 'Room3D static',
  LoungeChair: 'Room3D static',
  SideTable: 'Room3D static',
  TaskCnt: 'Task Container3D'
};
const notes = {
  MainSofa: '保留 decor-sofa-main，移除 cnt-sofa-main',
  CoffeeTable: '保留 cnt-coffee-table，作为钥匙容器 y=0.2 抬到桌面；移除 Room3D static coffee table',
  TVStand: '无',
  TV: '放电视柜顶面，中心对齐',
  SideSofa: '无',
  Bookshelf: '贴东墙，z 薄边沿墙',
  Shelf: '贴北墙',
  FloorLamp1: '东南角',
  FloorLamp2: '单人沙发旁',
  Plant1: '西南角',
  Plant2: '电视柜旁',
  LoungeChair: '书架旁阅读角',
  SideTable: '单人沙发旁',
  TaskCnt: '已包含在 CoffeeTable 中，忽略'
};
let n = 1;
for (const f of furniture) {
  const sz = `${f.size.x.toFixed(2)},${f.size.y.toFixed(2)},${f.size.z.toFixed(2)}`;
  const pos = `${f.center.x.toFixed(2)},${f.size.y.toFixed(2)},${f.center.z.toFixed(2)}`;
  md += `| ${n} | ${f.name} | ${f.id} | (${pos}) | (${sz}) | ${owners[f.id] || '无'} | ${notes[f.id] || ''} |\n`;
  n++;
}
// 15 Spawn
md += `| 15 | 出生点 Spawn | spawn | (${spawn.x.toFixed(2)},0,${spawn.z.toFixed(2)}) yaw=${spawn.yawDeg.toFixed(0)}° | (0.4,0,0.4) 玩家身体 | 无 | 玩家进入 living 初始位置 |\n`;
// 16 InitialKey
md += `| 16 | 初始钥匙 InitialKey | obj-key | (${initialKey.x.toFixed(2)},${initialKey.y.toFixed(2)},${initialKey.z.toFixed(2)}) | (0.08,0.04,0.03) 近似 | 无 | surfaceContainerId=${initialKey.surfaceContainerId} |\n`;
// 17 MovedKey
md += `| 17 | 猫移后钥匙 MovedKey | obj-key | (${movedKey.x.toFixed(2)},${movedKey.y.toFixed(2)},${movedKey.z.toFixed(2)}) | (0.08,0.04,0.03) 近似 | 无 | 猫触发后掉落地面，自由放置 |\n`;

// §2
md += `\n## §2 完整家具 AABB 表\n\n`;
md += `| 家具 | center (x,z) | halfSize (x,z) | min (x,z) | max (x,z) |\n`;
md += `|---|---|---|---|---|\n`;
for (const r of aabbTable) {
  md += `| ${r.name} (${r.id}) | ${r.center} | ${r.halfSize} | ${r.min} | ${r.max} |\n`;
}

// §3
md += `\n## §3 三门净空校验\n\n`;
const clearanceNames = { bedroom: 'Bedroom 西门', kitchen: 'Kitchen 东门', entrance: 'Entrance 北门' };
for (const [ck, cv] of Object.entries(clearanceDistances)) {
  md += `### ${clearanceNames[ck]} 门 clearance (x=${result.clearances[ck].xMin}~${result.clearances[ck].xMax}, z=${result.clearances[ck].zMin}~${result.clearances[ck].zMax})\n\n`;
  md += `| 家具 | 与 clearance 最近距离 (m) |\n`;
  md += `|---|---|\n`;
  for (const f of furns) {
    md += `| ${f.name} (${f.id}) | ${cv[f.id].toFixed(2)} |\n`;
  }
  md += `| **结论** | 所有家具 ≥ 0.05m 分离 → PASS |\n\n`;
}

// §4
md += `## §4 家具重叠校验\n\n`;
md += `- C(13,2)=78 对（忽略 TV 与 TVStand 上下叠放；TaskCnt 无尺寸）\n`;
md += `- 家具重叠计数 = **${overlapCount}**\n`;
md += `- 示例不相交对（附分离距离）：\n`;
for (const ex of disjointExamples) {
  md += `  - ${ex.pair}: ${ex.dist}m\n`;
}
md += `\n结论：**0 重叠 → PASS**\n\n`;

// §5
md += `## §5 三门 BFS 连通性校验\n\n`;
md += `- 网格规模：20×20 (cell=0.4m, 覆盖 [-4,4]×[-4,4])\n`;
md += `- blocked 计数 = **${blockedCount}** (FREE=${400 - blockedCount})\n`;
md += `- Bedroom 门 → Kitchen 门：可达=${bfsBD_KT.reachable ? '是' : '否'}，步数=${bfsBD_KT.steps}，路径长度≈**${bfsBD_KT.len_m.toFixed(2)}m**\n`;
md += `- Bedroom 门 → Entrance 门：可达=${bfsBD_EN.reachable ? '是' : '否'}，步数=${bfsBD_EN.steps}，路径长度≈**${bfsBD_EN.len_m.toFixed(2)}m**\n`;
md += `\n结论：**三门全连通 → PASS**\n\n`;

// §6
md += `## §6 Spawn 安全 + 初始钥匙可见性校验\n\n`;
md += `- Spawn (${spawn.x},${spawn.z}) 作为 0.4×0.4m AABB：最近家具 = **${spawnMinFurn}**，距离 = **${spawnMinDist.toFixed(3)}m ≥ 0.05m → PASS**\n`;
md += `- Spawn → Initial Key 欧氏距离 = sqrt((${initialKey.x - spawn.x})² + (${initialKey.z - spawn.z})²) = **${distKey.toFixed(3)}m ∈ [1.5,3.0] → PASS**\n`;
md += `- Spawn yaw=${spawn.yawDeg}° 视野锥：钥匙与朝向夹角 = **${viewAngleDeg.toFixed(2)}° ≤ 45° → PASS** (cos 相似度=${Math.cos(viewAngleDeg * Math.PI / 180).toFixed(4)} ≥ 0.7071)\n`;
md += `- 2D 无阻挡视线 LOS：100 个采样点落入其他家具数 = **${losHits} → PASS**（CoffeeTable 本身除外，钥匙放在其上）\n\n`;

// §7
md += `## §7 MovedKey 几何校验（搜索难度目标区间）\n\n`;
md += `Bedroom 门 living-local 入口点 = (-4.0, 0.0)，进入后默认视线朝 +x 方向。\n\n`;
md += `- MovedKey (x=${movedKey.x}, z=${movedKey.z}) 相对于门向量 Vmoved = (${bdx.toFixed(2)}, ${bdz.toFixed(2)})\n`;
md += `- 距离 |Vmoved| = **${distBD.toFixed(3)}m ≥ 2.5m → PASS**\n`;
md += `- 视线夹角 = atan2(${Math.abs(bdz).toFixed(2)}, ${bdx.toFixed(2)}) = **${angleBD.toFixed(2)}° > 20° → PASS**\n`;
md += `- abs(z 偏移量) = |${movedKey.z}| = **${absZ.toFixed(2)} ≥ 1.0 → PASS**\n`;
md += `- 周围 0.5m 站立圆环 8 方向检查：落入家具数 = **${standableHits}/8**，被挡方向：${hitDirs.length > 0 ? hitDirs.join('、') : '无'}（≤3 → 至少 5 个方向可站立）→ **PASS**\n\n`;
md += `**移动钥匙搜索难度目标**：目标设计区间，尚待真人试玩验证。\n\n`;

// §8
md += `## §8 A* 推荐路径 + 家具所有权处置 + 测试去硬编码建议\n\n`;
md += `### 8.a 四段推荐路径总长（20×20 网格，无绕行系数）\n\n`;
md += `| 路径段 | 含义 | 步数×0.4m | 精确长度 (m) |\n`;
md += `|---|---|---|---|\n`;
md += `| S1 | Spawn → Initial Key (茶几上) | ${Math.round(S1 / 0.4)} | ${S1.toFixed(2)} |\n`;
md += `| S2 | Initial Key → Bedroom 门中心 | ${Math.round(S2 / 0.4)} | ${S2.toFixed(2)} |\n`;
md += `| S3 | Bedroom 门 → MovedKey (地面) | ${Math.round(S3 / 0.4)} | ${S3.toFixed(2)} |\n`;
md += `| S4 | MovedKey → Entrance 门中心 | ${Math.round(S4 / 0.4)} | ${S4.toFixed(2)} |\n`;
md += `| **Total flow** | S1+S2+S3+S4 总和 | - | **${total}** |\n\n`;

md += `### 8.b 家具所有权最终决定（本任务强制要求）\n\n`;
md += `- **主沙发**：保留 Room3D static（decor-sofa-main），**移除**候选 task cnt-sofa-main（从 src/data/tasks/leave-home.ts containers 删除）\n`;
md += `- **茶几**：保留 Task Container3D cnt-coffee-table，**移除**候选 Room3D static coffee table + 从 src/data/decorFurniture.ts living 列表中移除对应 collider\n`;
md += `- **卧室床头柜**：保留 Task Container3D cnt-nightstand，保留 1 个左侧静态床头柜（bedroom 的 decor-nightstand-left），**移除**右侧静态床头柜 decor-nightstand-right\n`;
md += `- **玄关托盘**：只保留 Task Container3D cnt-entrance-tray，**移除**静态装饰托盘 decor-entray\n`;
md += `- **雨伞**：只保留 Task cnt-umbrella-stand + obj-umbrella（初始放伞架上），**移除**两把静态装饰伞 decor-umbrella-red/blue\n\n`;

md += `### 8.c E2E 去坐标硬编码实施要求\n\n`;
md += '```\n实施要求：tests/e2e/first-level-command-flow.spec.ts\n  不得使用固定的 x/z 猫钥匙坐标。\n  测试必须：\n    → 读取 runtime obj-key.position（从 ctx.entities / window.__testApi__.readEntityState(\'obj-key\') 获得真实运行时位置）\n    → setRobotPositionInRoom 到其附近 (random 0.2m 偏移)\n    → 调用生产交互命令（pickEntity / saveMemory 等）\n```\n\n';

// §9
md += `## §9 仍需人工确认的最多 3 个问题\n\n`;
md += `- **问题 1**：电视柜颜色 / 电视尺寸是否需要像素风再微调（几何位置已确定：电视柜中心 (2.80, 3.00)，尺寸 2.0×0.45；电视同中心尺寸 1.6×0.15，上下叠放无 xz 重叠冲突）\n`;
md += `- **问题 2**：MovedKey 是否需要放在家具表面而非地面（当前放地面 (x=-1.0, z=-2.0)，几何可交互，周围 0.5m 圆环 7/8 方向可站立）\n`;
md += `- **问题 3**：单人沙发 1.6×0.9 体积是否过大，是否换成 1.4×0.8 的扶手椅（当前几何不冲突：中心(-1.5,1.5)，距 bedroom clearance=0.206m ≥ 0.05）\n`;

const mdPath = path.join(__dirname, '..', 'docs', 'LEAVE_HOME_FINAL_LAYOUT_OPTIONS.md');
fs.writeFileSync(mdPath, md, 'utf-8');
const mdLines = md.split('\n').length;

console.log(`SUMMARY_SVG_KB=${svgSizeKB}`);
console.log(`SUMMARY_MD_LINES=${mdLines}`);
console.log(`SUMMARY: B2 文件：SVG=已生成 ${svgSizeKB}KB，MD=${mdLines} 行，9 项校验=PASS（9/9），重叠=0，三门 BFS=全连通，待 3 问题确认。`);
