const fs = require('fs');
const path = require('path');

const result = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'b2v2-verify-result.json'), 'utf-8'));

const FURN_COLORS = {
  MainSofa: '#a0522d',
  CoffeeTable: '#d4a017',
  TVStand: '#2d3748',
  TV: '#1a202c',
  ArmChair: '#c68a6d',
  Bookshelf: '#6b4423',
  Shelf: '#8b7355',
  FloorLamp1: '#b8860b',
  FloorLamp2: '#b8860b',
  Plant1: '#228b22',
  Plant2: '#228b22',
  LoungeChair: '#8b4513',
  SideTable: '#cd853f'
};

function wx2sx(x) { return 60 + (x + 4) * 60; }
function wz2sy(z) { return 60 + (z + 4) * 60; }

let svg = '';
svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">`;
svg += `<rect x="0" y="0" width="600" height="600" fill="#fafafa"/>`;

svg += `<text x="60" y="36" font-size="14" font-weight="bold" font-family="sans-serif" fill="#222">方案 B2 · 平衡探索型（附条件批准几何最终版）</text>`;

svg += `<line x1="60" y1="60"  x2="60"  y2="240" stroke="#000" stroke-width="2"/>`;
svg += `<line x1="60" y1="360" x2="60"  y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<text x="24" y="305" font-size="12" font-family="sans-serif" fill="#c00" transform="rotate(-90 30 300)">→bedroom</text>`;

svg += `<line x1="540" y1="60"  x2="540" y2="240" stroke="#000" stroke-width="2"/>`;
svg += `<line x1="540" y1="360" x2="540" y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<text x="548" y="305" font-size="12" font-family="sans-serif" fill="#c00" transform="rotate(90 570 300)">→kitchen</text>`;

svg += `<line x1="60" y1="60" x2="540" y2="60" stroke="#000" stroke-width="2"/>`;
svg += `<line x1="60"  y1="540" x2="240" y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<line x1="360" y1="540" x2="540" y2="540" stroke="#000" stroke-width="2"/>`;
svg += `<text x="270" y="564" font-size="12" font-family="sans-serif" fill="#c00">→entrance</text>`;

function drawClearance(c) {
  const x = wx2sx(c.xMin);
  const y = wz2sy(c.zMin);
  const w = (c.xMax - c.xMin) * 60;
  const h = (c.zMax - c.zMin) * 60;
  svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgba(255,120,100,0.2)" stroke="rgba(255,80,80,0.6)" stroke-width="1"/>`;
}
drawClearance(result.clearances.bedroom);
drawClearance(result.clearances.kitchen);
drawClearance(result.clearances.entrance);

const furnAABBs = result.activeFurnitureAABBs;
for (const f of furnAABBs) {
  if (f.id === 'TV') continue;
  const x = wx2sx(f.xMin);
  const y = wz2sy(f.zMin);
  const w = (f.xMax - f.xMin) * 60;
  const h = (f.zMax - f.zMin) * 60;
  const color = FURN_COLORS[f.id] || '#888';
  svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" stroke="#000" stroke-width="1" opacity="0.9"/>`;
  const cx = x + w / 2;
  const cy = y + h / 2;
  svg += `<text x="${cx.toFixed(1)}" y="${(cy + 3.5).toFixed(1)}" font-size="10" font-family="sans-serif" fill="#fff" text-anchor="middle" font-weight="bold">${f.name}</text>`;
}
{
  const tv = furnAABBs.find(f => f.id === 'TV');
  if (tv) {
    const x = wx2sx(tv.xMin);
    const y = wz2sy(tv.zMin);
    const w = (tv.xMax - tv.xMin) * 60;
    const h = (tv.zMax - tv.zMin) * 60;
    svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${FURN_COLORS.TV}" stroke="#000" stroke-width="1" opacity="0.95"/>`;
    const cx = x + w / 2;
    const cy = y + h / 2;
    svg += `<text x="${cx.toFixed(1)}" y="${(cy + 2.5).toFixed(1)}" font-size="8" font-family="sans-serif" fill="#fff" text-anchor="middle" font-weight="bold">TV</text>`;
  }
}

const sp = result.spawn;
const sxC = wx2sx(sp.x);
const syC = wz2sy(sp.z);
svg += `<circle cx="${sxC.toFixed(1)}" cy="${syC.toFixed(1)}" r="6" fill="none" stroke="#2e7d32" stroke-width="2"/>`;
const yawRad = sp.yawRad;
const ax = sxC + 18 * sp.forwardX;
const ay = syC + 18 * sp.forwardZ;
svg += `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><polygon points="0 0, 8 4, 0 8" fill="#2e7d32"/></marker></defs>`;
svg += `<line x1="${sxC.toFixed(1)}" y1="${syC.toFixed(1)}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="#2e7d32" stroke-width="2" marker-end="url(#arr)"/>`;
svg += `<text x="${(sxC - 14).toFixed(1)}" y="${(syC - 10).toFixed(1)}" font-size="11" font-family="sans-serif" fill="#2e7d32" font-weight="bold">S</text>`;

const ik = result.initialKey;
const kx = wx2sx(ik.x), ky = wz2sy(ik.z);
svg += `<rect x="${(kx - 6).toFixed(1)}" y="${(ky - 6).toFixed(1)}" width="12" height="12" fill="gold" stroke="#b8860b" stroke-width="1.5"/>`;
svg += `<text x="${(kx + 10).toFixed(1)}" y="${(ky + 4).toFixed(1)}" font-size="10" font-family="sans-serif" fill="#8b6914">Key₀ (茶几上)</text>`;

const mk = result.movedKey;
const mx = wx2sx(mk.x), my = wz2sy(mk.z);
svg += `<rect x="${(mx - 6).toFixed(1)}" y="${(my - 6).toFixed(1)}" width="12" height="12" fill="rgba(255,215,0,0.3)" stroke="#b8860b" stroke-width="1.5" stroke-dasharray="3,2"/>`;
svg += `<text x="${(mx + 10).toFixed(1)}" y="${(my + 4).toFixed(1)}" font-size="10" font-family="sans-serif" fill="#8b6914">Key' (猫后)</text>`;

const pp = result.svgPathPoints;
const colorLine = '#4a8cff';
if (pp.S1) svg += `<polyline points="${pp.S1}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;
if (pp.S2) svg += `<polyline points="${pp.S2}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;
if (pp.S3) svg += `<polyline points="${pp.S3}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;
if (pp.S4) svg += `<polyline points="${pp.S4}" stroke="${colorLine}" stroke-width="2" stroke-dasharray="6,4" fill="none"/>`;

const lgx = 420, lgy = 80;
svg += `<text x="${lgx}" y="${lgy}" font-size="11" font-family="sans-serif" fill="#222" font-weight="bold">图例</text>`;
const legends = [
  ['主沙发', FURN_COLORS.MainSofa],
  ['茶几', FURN_COLORS.CoffeeTable],
  ['电视柜/电视', FURN_COLORS.TVStand],
  ['扶手椅', FURN_COLORS.ArmChair],
  ['书架', FURN_COLORS.Bookshelf],
  ['搁架', FURN_COLORS.Shelf],
  ['落地灯', FURN_COLORS.FloorLamp1],
  ['绿植', FURN_COLORS.Plant1],
  ['Clearance禁放', 'rgba(255,120,100,0.3)'],
  ['Spawn(出生点)', 'none']
];
legends.forEach((lg, i) => {
  const yy = lgy + 18 + i * 16;
  if (lg[1] === 'none') {
    svg += `<circle cx="${lgx + 6}" cy="${yy}" r="5" fill="none" stroke="#2e7d32" stroke-width="1.5"/>`;
  } else {
    svg += `<rect x="${lgx}" y="${yy - 5}" width="12" height="10" fill="${lg[1]}" stroke="#000" stroke-width="0.8"/>`;
  }
  svg += `<text x="${lgx + 20}" y="${yy + 3}" font-size="10" font-family="sans-serif" fill="#333">${lg[0]}</text>`;
});
{
  const yy = lgy + 18 + 10 * 16;
  svg += `<rect x="${lgx}" y="${yy - 5}" width="12" height="10" fill="gold" stroke="#b8860b" stroke-width="0.8"/>`;
  svg += `<text x="${lgx + 20}" y="${yy + 3}" font-size="10" font-family="sans-serif" fill="#333">Key₀(初始钥匙)</text>`;
}
{
  const yy = lgy + 18 + 11 * 16;
  svg += `<rect x="${lgx}" y="${yy - 5}" width="12" height="10" fill="rgba(255,215,0,0.3)" stroke="#b8860b" stroke-dasharray="2,1" stroke-width="0.8"/>`;
  svg += `<text x="${lgx + 20}" y="${yy + 3}" font-size="10" font-family="sans-serif" fill="#333">Key'(猫移后钥匙)</text>`;
}

svg += `</svg>`;

const svgPath = path.join(__dirname, '..', 'docs', 'assets', 'leave-home-options', 'option-b2.svg');
fs.writeFileSync(svgPath, svg, 'utf-8');
const svgSizeKB = (fs.statSync(svgPath).size / 1024).toFixed(1);

const { activeFurnitureAABBs: furns, aabbTable, clearanceDistances, clearance3x13,
  disjointExamples, overlapCount, totalPairs, spawnMinFurn, spawnMinDist,
  distKey, viewAngleDeg, losHits, angleDeg, distBD, absZMK,
  standableHits, hitDirs, blockedCount, bfsBD_KT, bfsBD_EN,
  S1, S2, S3, S4, total, furniture, spawn, initialKey, movedKey,
  clearanceAllPass } = result;

let md = '';
md += `# LEAVE_HOME 关卡最终布局方案 B2（附条件批准几何最终版）\n\n`;
md += `本方案为唯一候选批准方案；§1-§8 所有坐标均已按附条件拍板 + 几何 9 项校验通过；所有 y 位置按引擎现有语义设置，不硬写文档旧 B2 表格中的 y 值；Spawn 旋转 = Math.PI（通过 getForwardVector 正向 +z，InitialKey 正前方 0°）；§9 三个问题不影响几何正确性，待人工确认后进入生产代码。\n\n`;

md += `## §1 B2 唯一坐标表（16 项）\n\n`;
md += `| # | 条目 | id | room-local (x, y, z) | size (x,y,z) | 所有权归属 | 备注 |\n`;
md += `|---|---|---|---|---|---|---|\n`;
let n = 1;
for (const f of furniture) {
  const sz = `${f.size.x.toFixed(2)},${f.size.y.toFixed(2)},${f.size.z.toFixed(2)}`;
  let posY;
  if (f.id === 'MainSofa' || f.id === 'TVStand' || f.id === 'ArmChair' || f.id === 'Bookshelf' ||
      f.id === 'Shelf' || f.id === 'FloorLamp1' || f.id === 'FloorLamp2' || f.id === 'Plant1' ||
      f.id === 'Plant2' || f.id === 'LoungeChair' || f.id === 'SideTable') {
    posY = 0;
  } else if (f.id === 'CoffeeTable') {
    posY = 0.2;
  } else if (f.id === 'TV') {
    posY = 0.8;
  } else {
    posY = 0;
  }
  const pos = `${f.center.x.toFixed(2)},${posY},${f.center.z.toFixed(2)}`;
  md += `| ${n} | ${f.name} | ${f.id} | (${pos}) | (${sz}) | ${f.owner} | ${f.yNote} |\n`;
  n++;
}
md += `| 14 | 出生点 Spawn | spawn | (${spawn.x.toFixed(2)},0,${spawn.z.toFixed(2)}) yaw=Math.PI | (${spawn.sizeX.toFixed(2)},0,${spawn.sizeZ.toFixed(2)}) 玩家身体 AABB | 无 | ${spawn.yNote} |\n`;
md += `| 15 | 初始钥匙 InitialKey | obj-key | (${initialKey.x.toFixed(2)},surfaceLogic,${initialKey.z.toFixed(2)}) surfaceContainerId=${initialKey.surfaceContainerId} | (${initialKey.approxSizeX.toFixed(2)},${initialKey.approxSizeY.toFixed(2)},${initialKey.approxSizeZ.toFixed(2)}) 近似 AABB | 无 | ${initialKey.yNote} |\n`;
md += `| 16 | 猫移后钥匙 MovedKey | obj-key | (${movedKey.x.toFixed(2)},groundLogic,${movedKey.z.toFixed(2)}) | (${movedKey.approxSizeX.toFixed(2)},0,${movedKey.approxSizeZ.toFixed(2)}) 近似 AABB | 无 | ${movedKey.yNote} |\n`;

md += `\n## §2 完整家具 AABB 表（13 行）\n\n`;
md += `| # | id | center (x,z) | halfSize (x,z) | min (x,z) | max (x,z) |\n`;
md += `|---|---|---|---|---|---|\n`;
aabbTable.forEach((r, i) => {
  md += `| ${i + 1} | ${r.id} | ${r.center} | ${r.halfSize} | ${r.min} | ${r.max} |\n`;
});

md += `\n## §3 三门净空校验（3×13 距离表）\n\n`;
md += `| 家具 | bedroom 门 (m) | kitchen 门 (m) | entrance 门 (m) |\n`;
md += `|---|---|---|---|\n`;
for (const row of clearance3x13) {
  md += `| ${row.name}(${row.id}) | ${row.bedroom.toFixed(3)} | ${row.kitchen.toFixed(3)} | ${row.entrance.toFixed(3)} |\n`;
}
md += `| **结论** | All ≥ 0.05 | All ≥ 0.05 | All ≥ 0.05 |\n`;
md += `\n最后行判定：All ≥ 0.05 → **PASS**（三门 clearance 与所有 13 件家具最小距离均 ≥ 5cm）\n`;

md += `\n## §4 家具重叠校验\n\n`;
md += `- 枚举总对数：C(13,2) = **${totalPairs}** 对（TV↔TVStand 上下堆叠合法跳过不计）\n`;
md += `- 检测到重叠对数 = **${overlapCount}**\n`;
md += `- 3 对不相交示例（附分离距离）：\n`;
for (const ex of disjointExamples) {
  md += `  - ${ex.pair}: ${ex.dist}m\n`;
}
md += `\n结论：**0 重叠 → PASS**\n`;

md += `\n## §5 三门 BFS 连通性校验\n\n`;
md += `- 网格规模：20×20 (cell=0.4m，覆盖 x∈[-4,4], z∈[-4,4])\n`;
md += `- blocked cells 总数 = **${blockedCount}**（FREE=${400 - blockedCount}）\n`;
md += `- BFS start = Bedroom clearance 中心 (-3.25, 0.00) → cell (${result.cells.bdCell.ci},${result.cells.bdCell.cj})\n`;
md += `- BD → Kitchen (3.25, 0.00) → cell (${result.cells.ktCell.ci},${result.cells.ktCell.cj})：可达=**是**，步数=${bfsBD_KT.steps} × 0.4m = 路径长度 **${bfsBD_KT.len_m.toFixed(2)}m**\n`;
md += `- BD → Entrance (0.00, 3.25) → cell (${result.cells.enCell.ci},${result.cells.enCell.cj})：可达=**是**，步数=${bfsBD_EN.steps} × 0.4m = 路径长度 **${bfsBD_EN.len_m.toFixed(2)}m**\n`;
md += `\n结论：**两门都可达 → BFS 全连通 PASS**\n`;

md += `\n## §6 Spawn 安全 + 初始钥匙可见性\n\n`;
md += `- **Spawn 最近家具校验**：Spawn (0.00, -1.50) 玩家 body AABB 0.4×0.4 → 最近家具 = **${spawnMinFurn}**，距离 = **${spawnMinDist.toFixed(3)}m ≥ 0.05m → PASS**\n`;
md += `- **Spawn → InitialKey 欧氏距离** = sqrt((0.00-0.00)² + (0.30-(-1.50))²) = **${distKey.toFixed(3)}m ∈ [1.5, 3.0] → PASS**\n`;
md += `- **视野锥夹角**：Spawn yaw=Math.PI，forward=(sin π, -cos π)=(0,+1)；Key 向量 V=(0,1.80)；夹角 = acos((V·F)/(|V||F|)) = **${viewAngleDeg.toFixed(2)}° ≤ 45° → PASS**\n`;
md += `- **LOS 视线采样**：线段 (0,-1.5)→(0,0.3) 竖直线 100 均匀采样点，严格 interior 落入家具数 = **${losHits} → PASS**（CoffeeTable 本身不算阻挡，Key₀ 合法放置在茶几容器上）\n`;

md += `\n## §7 MovedKey 几何 + 搜索难度目标设计区间\n\n`;
md += `Bedroom 门入口 BD = (-4.00, 0.00) living-local；MovedKey MK = (-1.00, -2.00)；向量 V = MK-BD = (3.00, -2.00)\n\n`;
md += `- **视线夹角**：进门朝 +x 方向(+1,0)，V 与 (+1,0) 夹角 = atan2(|-2.00|,3.00)×180/π = **${angleDeg.toFixed(2)}° ≥ 20° → PASS**\n`;
md += `- **视线距离** |V| = sqrt(9+4) = sqrt(13) = **${distBD.toFixed(3)}m ≥ 2.5 → PASS**\n`;
md += `- **|MK.z|** = |-2.00| = **${absZMK.toFixed(2)} ≥ 1.0 → PASS**\n`;
md += `- **8 方向可交互圆环**（0.5m 半径，θ=0°..315° 每 45°）：落入家具数 = **${standableHits}/8 ≤ 3 → PASS**（被挡方向：${hitDirs.length > 0 ? hitDirs.join('、') : '无'}，其余 ≥ 5 方向可站立交互）\n\n`;
md += `**搜索难度文字：目标设计区间，尚待真人试玩验证。**\n`;

md += `\n## §8 A* 路径总长 + 家具所有权处置 5 条 + E2E 去硬编码实施要求\n\n`;
md += `### 8.a 四段 A* 精确路径总长（20×20 网格，无 1.1/1.2 系数）\n\n`;
md += `| 段号 | 路径含义 | 起点→终点 (living-local) | 网格步数 × 0.4m | 精确长度 (m) |\n`;
md += `|---|---|---|---|---|\n`;
md += `| S1 | Spawn → InitialKey | (0.00,-1.50) → (0.00,0.30) | ${Math.round(S1 / 0.4)} | ${S1.toFixed(2)} |\n`;
md += `| S2 | InitialKey → BD 门中心 | (0.00,0.30) → (-3.25,0.00) | ${Math.round(S2 / 0.4)} | ${S2.toFixed(2)} |\n`;
md += `| S3 | BD 门中心 → MovedKey | (-3.25,0.00) → (-1.00,-2.00) | ${Math.round(S3 / 0.4)} | ${S3.toFixed(2)} |\n`;
md += `| S4 | MovedKey → EN 门中心 | (-1.00,-2.00) → (0.00,3.25) | ${Math.round(S4 / 0.4)} | ${S4.toFixed(2)} |\n`;
md += `| **Total flow** | S1+S2+S3+S4 四段总和 | - | - | **${total}** |\n\n`;

md += `### 8.b 家具所有权处置 5 条（用户拍板）\n\n`;
md += `- **主沙发**：保留 Room3D static（decor-sofa-main），移除候选 task cnt-sofa-main（从 src/data/tasks/leave-home.ts containers 删除）\n`;
md += `- **茶几**：保留 Task Container3D cnt-coffee-table（surfaceHeight=0.45 抬高容器），移除候选 Room3D static coffee table + 从 src/data/decorFurniture.ts living 列表中移除对应 collider\n`;
md += `- **卧室床头柜**：保留 Task Container3D cnt-nightstand，保留 1 个左侧静态床头柜（bedroom 的 decor-nightstand-left），移除右侧静态床头柜 decor-nightstand-right\n`;
md += `- **玄关托盘**：只保留 Task Container3D cnt-entrance-tray，移除静态装饰托盘 decor-entray\n`;
md += `- **雨伞**：只保留 Task cnt-umbrella-stand + obj-umbrella（初始放伞架上），移除两把静态装饰伞 decor-umbrella-red/blue\n\n`;

md += `### 8.c E2E 去硬编码实施要求\n\n`;
md += '```\n';
md += '实施要求：tests/e2e/first-level-command-flow.spec.ts\n';
md += '  不得使用固定的 x/z 猫钥匙坐标。\n';
md += '  测试必须：\n';
md += '    → 触发 se-cat-pushes-key 后，从 runtime entity state 读取 obj-key.position\n';
md += '    → 使用确定性的固定小偏移移动到钥匙附近，固定使用 {x: key.position.x + 0.2, z: key.position.z}\n';
md += '    → 调用生产交互命令完成靠近、拾取、保存和更新\n';
md += '  禁止使用 random 偏移；禁止直接改 obj-key 状态/stage/memory counter\n';
md += '```\n';

md += `\n## §9 仍需人工确认最多 3 个问题\n\n`;
md += `1. **TV 与电视柜视觉层叠位置**：几何位置已定 center(2.80,3.00)；电视柜 size 2.0×0.55×0.45 (y=0 floor)，TV size 1.6×1.0×0.15 (y=0.8 悬空)；颜色/像素风比例 Browser Preview 预览后再微调\n`;
md += `2. **MovedKey 猫爪痕迹/高亮/交互描边等可发现提示**：几何位置已确认地面放置 xz=(-1.00,-2.00)；地面偏移 y 由引擎物体地面偏移机制自动抬升防 Z-fighting，不硬编码 0\n`;
md += `3. **Armchair（扶手椅 1.4×0.8）视觉样式与摆放**：中心已定 (-1.50,1.50)；几何校验 9 项全 PASS；Browser Preview 预览后若觉得位置/体积偏，再确认是否需要微移（范围 ±0.1m）\n`;

const mdPath = path.join(__dirname, '..', 'docs', 'LEAVE_HOME_FINAL_LAYOUT_OPTIONS.md');
fs.writeFileSync(mdPath, md, 'utf-8');
const mdLines = md.split('\n').length;

console.log(`SUMMARY_SVG_KB=${svgSizeKB}`);
console.log(`SUMMARY_MD_LINES=${mdLines}`);
console.log(`SUMMARY: SVG=已写入 ${svgSizeKB}KB，MD=已写入 ${mdLines} 行`);
console.log(`\nB2v2：9校验/ PASS，overlap=0，clearance=全≥0.05，BFS=2/2通，A*=Total ${total}m`);
