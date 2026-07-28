const fs = require('fs');
const path = require('path');

const FURNITURE = [
  { id: 'MainSofa', name: '主沙发', size: { x: 2.4, y: 0.9, z: 1.0 }, center: { x: 0.00, z: -3.00 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'CoffeeTable', name: '茶几', size: { x: 1.4, y: 0.45, z: 0.7 }, center: { x: 0.00, z: 0.30 }, yNote: 'y=0.2，Task 容器抬高语义 surfaceHeight=0.45', owner: 'Task Container3D' },
  { id: 'TVStand', name: '电视柜', size: { x: 2.0, y: 0.55, z: 0.45 }, center: { x: 2.80, z: 3.00 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'TV', name: '电视', size: { x: 1.6, y: 1.0, z: 0.15 }, center: { x: 2.80, z: 3.00 }, stackedOn: 'TVStand', yNote: 'y=0.8，引擎电视默认悬空高度', owner: 'Room3D static' },
  { id: 'ArmChair', name: '扶手椅', size: { x: 1.4, y: 0.8, z: 0.85 }, center: { x: -1.50, z: 1.50 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'Bookshelf', name: '书架', size: { x: 0.8, y: 1.8, z: 0.35 }, center: { x: 3.50, z: -2.50 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'Shelf', name: '搁架', size: { x: 0.7, y: 1.2, z: 0.20 }, center: { x: -2.80, z: 3.80 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'FloorLamp1', name: '落地灯1', size: { x: 0.4, y: 1.8, z: 0.4 }, center: { x: 3.50, z: -3.50 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'FloorLamp2', name: '落地灯2', size: { x: 0.35, y: 1.6, z: 0.35 }, center: { x: -0.30, z: 1.50 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'Plant1', name: '大植物1', size: { x: 0.5, y: 1.2, z: 0.5 }, center: { x: -3.50, z: -3.50 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'Plant2', name: '大植物2', size: { x: 0.35, y: 0.8, z: 0.35 }, center: { x: 3.60, z: 2.00 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'LoungeChair', name: '休闲椅', size: { x: 0.5, y: 0.7, z: 0.5 }, center: { x: 3.00, z: -1.50 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' },
  { id: 'SideTable', name: '边几', size: { x: 0.6, y: 0.35, z: 0.6 }, center: { x: -1.50, z: 2.60 }, yNote: 'y=0，引擎 floor-base 默认语义', owner: 'Room3D static' }
];

const SPAWN = {
  x: 0.00, z: -1.50,
  yawRad: Math.PI,
  yawDeg: 180.0,
  forwardX: Math.sin(Math.PI),
  forwardZ: -Math.cos(Math.PI),
  sizeX: 0.4, sizeZ: 0.4,
  yNote: 'Spawn yaw=Math.PI，通过 getForwardVector 面朝 +z，需 Browser Preview 实际验证'
};

const INITIAL_KEY = {
  x: 0.00, z: 0.30,
  surfaceContainerId: 'cnt-coffee-table',
  approxSizeX: 0.1, approxSizeY: 0.1, approxSizeZ: 0.05,
  yNote: 'InitialKey y 由 surfaceContainerId + surfaceHeight 放置逻辑决定，不硬编码'
};

const MOVED_KEY = {
  x: -1.00, z: -2.00,
  approxSizeX: 0.1, approxSizeZ: 0.1,
  yNote: 'MovedKey y 由引擎物体地面偏移机制自动抬升，不硬编码 0'
};

const CLEARANCES = {
  bedroom:  { xMin: -4.00, xMax: -2.50, zMin: -1.00, zMax: 1.00 },
  kitchen:  { xMin:  2.50, xMax:  4.00, zMin: -1.00, zMax: 1.00 },
  entrance: { xMin: -1.00, xMax:  1.00, zMin:  2.50, zMax: 4.00 }
};

function computeAABB(f) {
  const hx = f.size.x / 2, hz = f.size.z / 2;
  return {
    centerX: f.center.x, centerZ: f.center.z, halfX: hx, halfZ: hz,
    xMin: f.center.x - hx, xMax: f.center.x + hx,
    zMin: f.center.z - hz, zMax: f.center.z + hz
  };
}
function rectsIntersect(a, b) {
  return a.xMin < b.xMax && a.xMax > b.xMin && a.zMin < b.zMax && a.zMax > b.zMin;
}
function rectMinDistance(a, b) {
  const dx = Math.max(b.xMin - a.xMax, a.xMin - b.xMax, 0);
  const dz = Math.max(b.zMin - a.zMax, a.zMin - b.zMax, 0);
  if (dx === 0 && dz === 0) {
    const ox = Math.min(a.xMax, b.xMax) - Math.max(a.xMin, b.xMin);
    const oz = Math.min(a.zMax, b.zMax) - Math.max(a.zMin, b.zMin);
    return -Math.min(ox, oz);
  }
  return Math.sqrt(dx * dx + dz * dz);
}
function pointInRectInterior(px, pz, r) {
  return px > r.xMin && px < r.xMax && pz > r.zMin && pz < r.zMax;
}
function pointInRectInclusive(px, pz, r) {
  return px >= r.xMin && px <= r.xMax && pz >= r.zMin && pz <= r.zMax;
}
const deg2rad = d => d * Math.PI / 180;
const rad2deg = r => r * 180 / Math.PI;

const ACTIVE_FURNITURE = FURNITURE;
const FURNITURE_AABBS = ACTIVE_FURNITURE.map(f => ({ ...f, aabb: computeAABB(f) }));

console.log('======== B2v2 几何 9 项校验 ========\n');

console.log('===== 校验 1：完整家具 AABB 表（13 行）=====');
const aabbTable = FURNITURE_AABBS.map(f => {
  const a = f.aabb;
  return {
    id: f.id, name: f.name,
    center: `(${a.centerX.toFixed(2)}, ${a.centerZ.toFixed(2)})`,
    halfSize: `(${a.halfX.toFixed(2)}, ${a.halfZ.toFixed(2)})`,
    min: `(${a.xMin.toFixed(2)}, ${a.zMin.toFixed(2)})`,
    max: `(${a.xMax.toFixed(2)}, ${a.zMax.toFixed(2)})`
  };
});
aabbTable.forEach(r => console.log(JSON.stringify(r)));

console.log('\n===== 校验 2：任意家具间 overlap（C(13,2)=78 对，跳过 TV-TVStand）=====');
let overlapCount = 0;
const overlapPairs = [];
const disjointExamples = [];
const totalPairs = FURNITURE_AABBS.length * (FURNITURE_AABBS.length - 1) / 2;
for (let i = 0; i < FURNITURE_AABBS.length; i++) {
  for (let j = i + 1; j < FURNITURE_AABBS.length; j++) {
    const a = FURNITURE_AABBS[i], b = FURNITURE_AABBS[j];
    const skipStacked = (a.stackedOn === b.id || b.stackedOn === a.id);
    if (!skipStacked && rectsIntersect(a.aabb, b.aabb)) {
      overlapCount++;
      overlapPairs.push(`${a.id} <-> ${b.id}`);
    } else if (!skipStacked && disjointExamples.length < 3) {
      disjointExamples.push({
        pair: `${a.id} <-> ${b.id}`,
        dist: rectMinDistance(a.aabb, b.aabb).toFixed(3)
      });
    }
  }
}
console.log(`总对数 = ${totalPairs}`);
console.log(`检测到重叠对数 = ${overlapCount}`);
if (overlapCount > 0) {
  console.log('重叠对:', overlapPairs);
  console.log('STOP: overlap>0，需要微调家具后重新计算');
  process.exit(1);
}
console.log('不相交示例（3对）：', disjointExamples);
console.log('结论：overlap=0 → PASS');

console.log('\n===== 校验 3：三门 clearance overlap（最小距离≥0.05m）=====');
const clearanceDistances = {};
let clearanceAllPass = true;
const clearance3x13 = [];
for (const furn of FURNITURE_AABBS) {
  const row = { id: furn.id, name: furn.name };
  for (const [cname, crect] of Object.entries(CLEARANCES)) {
    if (!clearanceDistances[cname]) clearanceDistances[cname] = {};
    const d = rectMinDistance(furn.aabb, crect);
    clearanceDistances[cname][furn.id] = d;
    row[cname] = d;
    if (d < 0.05) {
      clearanceAllPass = false;
      console.log(`  FAIL: ${furn.id} vs ${cname} clearance = ${d.toFixed(3)}m < 0.05m`);
    }
  }
  clearance3x13.push(row);
}
console.log('3×13 距离表（家具 × 门）：');
const hdr = '| 家具 | bedroom(m) | kitchen(m) | entrance(m) |';
const sep = '|---|---|---|---|';
console.log(hdr);
console.log(sep);
for (const row of clearance3x13) {
  console.log(`| ${row.name}(${row.id}) | ${row.bedroom.toFixed(3)} | ${row.kitchen.toFixed(3)} | ${row.entrance.toFixed(3)} |`);
}
console.log(`最后行结论：All ≥ 0.05 → ${clearanceAllPass ? 'PASS' : 'FAIL'}`);
if (!clearanceAllPass) {
  console.log('STOP: clearance FAIL，需要微调家具后重新计算');
  process.exit(1);
}

console.log('\n===== 校验 4：Spawn 与所有家具 blocking AABB 最小距离 =====');
const spawnAABB = {
  xMin: SPAWN.x - SPAWN.sizeX / 2, xMax: SPAWN.x + SPAWN.sizeX / 2,
  zMin: SPAWN.z - SPAWN.sizeZ / 2, zMax: SPAWN.z + SPAWN.sizeZ / 2
};
let spawnMinDist = Infinity, spawnMinFurn = null;
for (const f of FURNITURE_AABBS) {
  const d = rectMinDistance(spawnAABB, f.aabb);
  if (d < spawnMinDist) { spawnMinDist = d; spawnMinFurn = f.id; }
}
const spawnOverlap = rectsIntersect(spawnAABB, spawnAABB) ? 0 : 0;
console.log(`Spawn AABB: x=[${spawnAABB.xMin},${spawnAABB.xMax}], z=[${spawnAABB.zMin},${spawnAABB.zMax}]`);
console.log(`最近家具 = ${spawnMinFurn}，距离 = ${spawnMinDist.toFixed(3)}m`);
console.log(`Spawn 无重叠 + 距离≥0.05m → ${(spawnMinDist >= 0.05) ? 'PASS' : 'FAIL'}`);
if (spawnMinDist < 0.05) process.exit(1);

console.log('\n===== 校验 5：Spawn → InitialKey 视线与距离 =====');
const kdx = INITIAL_KEY.x - SPAWN.x, kdz = INITIAL_KEY.z - SPAWN.z;
const distKey = Math.sqrt(kdx * kdx + kdz * kdz);
console.log(`a. Euclidean 距离 = ${distKey.toFixed(3)}m ∈ [1.5, 3.0] → ${(distKey >= 1.5 && distKey <= 3.0) ? 'PASS' : 'FAIL'}`);

const fwdX = SPAWN.forwardX, fwdZ = SPAWN.forwardZ;
console.log(`  Spawn forward = (${fwdX.toFixed(4)}, ${fwdZ.toFixed(4)})`);
const lenKeyDir = Math.sqrt(kdx * kdx + kdz * kdz);
const cosSim = lenKeyDir > 0 ? (kdx * fwdX + kdz * fwdZ) / (lenKeyDir * 1.0) : 0;
const cos45 = Math.cos(deg2rad(45));
const viewAngleDeg = rad2deg(Math.acos(Math.min(1, Math.max(-1, cosSim))));
console.log(`b. 视野锥夹角 = ${viewAngleDeg.toFixed(2)}° ≤ 45° → ${(viewAngleDeg <= 45) ? 'PASS' : 'FAIL'} (cos=${cosSim.toFixed(4)} vs 45°cos=${cos45.toFixed(4)})`);

let losHits = 0;
const losSampled = [];
for (let i = 0; i <= 100; i++) {
  const t = i / 100;
  const px = SPAWN.x + kdx * t, pz = SPAWN.z + kdz * t;
  for (const f of FURNITURE_AABBS) {
    if (f.id === 'CoffeeTable') continue;
    if (pointInRectInterior(px, pz, f.aabb)) {
      losHits++;
      losSampled.push({ t: i, px, pz, furn: f.id });
      break;
    }
  }
}
console.log(`c. LOS 线段采样 100 点，落入家具（严格 interior，不算边）数量 = ${losHits} → ${losHits === 0 ? 'PASS' : 'FAIL'}`);
if (losHits > 0) console.log('  阻挡点：', losSampled.slice(0, 5));
if (distKey < 1.5 || distKey > 3.0 || viewAngleDeg > 45 || losHits > 0) process.exit(1);

console.log('\n===== 校验 6：Bedroom 门 → MovedKey 视线夹角 + 距离 =====');
const BD_ENTRY = { x: -4.00, z: 0.00 };
const MK = { x: MOVED_KEY.x, z: MOVED_KEY.z };
const V = { x: MK.x - BD_ENTRY.x, z: MK.z - BD_ENTRY.z };
console.log(`Bedroom 门入口 BD = (${BD_ENTRY.x}, ${BD_ENTRY.z})`);
console.log(`MovedKey MK = (${MK.x}, ${MK.z})`);
console.log(`向量 V = MK-BD = (${V.x.toFixed(2)}, ${V.z.toFixed(2)})`);

const inDirX = 1.0, inDirZ = 0.0;
const angleRad = Math.atan2(Math.abs(V.z), V.x);
const angleDeg = rad2deg(angleRad);
const distBD = Math.sqrt(V.x * V.x + V.z * V.z);
const absZMK = Math.abs(MK.z);

console.log(`a. 视线夹角（进门朝 +x=(1,0)，atan2(|V.z|,V.x)）= ${angleDeg.toFixed(2)}° ≥ 20° → ${angleDeg >= 20 ? 'PASS' : 'FAIL'}`);
console.log(`b. 距离 |V| = ${distBD.toFixed(3)}m ≥ 2.5 → ${distBD >= 2.5 ? 'PASS' : 'FAIL'}`);
console.log(`c. |MK.z| = ${absZMK.toFixed(2)} ≥ 1.0 → ${absZMK >= 1.0 ? 'PASS' : 'FAIL'}`);
if (angleDeg < 20 || distBD < 2.5 || absZMK < 1.0) process.exit(1);

console.log('\n===== 校验 7：MovedKey 周围 0.5m 可交互圆环（8 方向）=====');
let standableHits = 0;
const dirNames = ['0°','45°','90°','135°','180°','225°','270°','315°'];
const hitDirs = [];
const dirDetail = [];
for (let i = 0; i < 8; i++) {
  const theta = deg2rad(i * 45);
  const px = MK.x + 0.5 * Math.cos(theta), pz = MK.z + 0.5 * Math.sin(theta);
  let hitFurn = null;
  for (const f of FURNITURE_AABBS) {
    if (pointInRectInclusive(px, pz, f.aabb)) { hitFurn = f.id; break; }
  }
  if (hitFurn) { standableHits++; hitDirs.push(dirNames[i]); }
  dirDetail.push({ dir: dirNames[i], px: px.toFixed(2), pz: pz.toFixed(2), hit: hitFurn || 'NONE' });
}
console.log('方向详情：', dirDetail);
console.log(`8 方向落入家具数 = ${standableHits}/8 ≤ 3 → ${standableHits <= 3 ? 'PASS' : 'FAIL'}`);
console.log(`被挡方向：${hitDirs.length > 0 ? hitDirs.join('、') : '无'}`);
if (standableHits > 3) process.exit(1);

console.log('\n===== 校验 8：三门 BFS 连通性（20×20 网格 cell=0.4m）=====');
const GRID_N = 20, CELL = 0.4, GRID_MIN = -4.0;
function cellToWorld(ci, cj) { return { x: GRID_MIN + (ci + 0.5) * CELL, z: GRID_MIN + (cj + 0.5) * CELL }; }
function worldToCell(wx, wz) { return { ci: Math.floor((wx - GRID_MIN) / CELL), cj: Math.floor((wz - GRID_MIN) / CELL) }; }
const grid = [];
let blockedCount = 0;
for (let i = 0; i < GRID_N; i++) {
  grid[i] = [];
  for (let j = 0; j < GRID_N; j++) {
    const w = cellToWorld(i, j);
    let blocked = false;
    for (const f of FURNITURE_AABBS) {
      if (f.stackedOn) continue;
      if (pointInRectInclusive(w.x, w.z, f.aabb)) { blocked = true; break; }
    }
    grid[i][j] = blocked ? 1 : 0;
    if (blocked) blockedCount++;
  }
}
console.log(`网格 20×20, FREE=${400 - blockedCount}, BLOCKED=${blockedCount}`);

function isAdjacent(ci1, cj1, ci2, cj2) {
  return Math.abs(ci1 - ci2) + Math.abs(cj1 - cj2) === 1;
}
function bfsFlex(startCi, startCj, endCi, endCj) {
  const endIsBlocked = grid[endCi]?.[endCj] === 1;
  if (grid[startCi][startCj] === 1) return { reachable: false, steps: -1 };
  if (!endIsBlocked && startCi === endCi && startCj === endCj) return { reachable: true, steps: 0 };
  const visited = Array.from({length: GRID_N}, () => Array(GRID_N).fill(false));
  const queue = [[startCi, startCj, 0]];
  visited[startCi][startCj] = true;
  while (queue.length > 0) {
    const [i, j, d] = queue.shift();
    if (!endIsBlocked && i === endCi && j === endCj) return { reachable: true, steps: d };
    if (endIsBlocked && isAdjacent(i, j, endCi, endCj)) return { reachable: true, steps: d + 1 };
    for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const ni = i + di, nj = j + dj;
      if (ni >= 0 && ni < GRID_N && nj >= 0 && nj < GRID_N && !visited[ni][nj] && grid[ni][nj] === 0) {
        visited[ni][nj] = true;
        queue.push([ni, nj, d + 1]);
      }
    }
  }
  return { reachable: false, steps: -1 };
}

const bdCell = worldToCell(-3.25, 0.00);
const ktCell = worldToCell(3.25, 0.00);
const enCell = worldToCell(0.00, 3.25);
console.log(`BD中心(${(-3.25).toFixed(2)},0.00)→cell(${bdCell.ci},${bdCell.cj}) KT中心(3.25,0.00)→cell(${ktCell.ci},${ktCell.cj}) EN中心(0.00,3.25)→cell(${enCell.ci},${enCell.cj})`);
const r_bd_kt = bfsFlex(bdCell.ci, bdCell.cj, ktCell.ci, ktCell.cj);
const r_bd_en = bfsFlex(bdCell.ci, bdCell.cj, enCell.ci, enCell.cj);
const bd_kt_len = r_bd_kt.reachable ? r_bd_kt.steps * CELL : -1;
const bd_en_len = r_bd_en.reachable ? r_bd_en.steps * CELL : -1;
console.log(`BD→KT: reachable=${r_bd_kt.reachable}, steps=${r_bd_kt.steps}, len=${bd_kt_len.toFixed(2)}m`);
console.log(`BD→EN: reachable=${r_bd_en.reachable}, steps=${r_bd_en.steps}, len=${bd_en_len.toFixed(2)}m`);
console.log(`两门都可达 → ${(r_bd_kt.reachable && r_bd_en.reachable) ? 'PASS' : 'FAIL'}`);
if (!r_bd_kt.reachable || !r_bd_en.reachable) process.exit(1);

console.log('\n===== 校验 9：A* 网格最短路径 4 段（20×20，Euclidean 启发）=====');
function astarFlex(startCi, startCj, endCi, endCj) {
  const endIsBlocked = grid[endCi]?.[endCj] === 1;
  const startIsBlocked = grid[startCi]?.[startCj] === 1;
  if (!endIsBlocked && startCi === endCi && startCj === endCj && !startIsBlocked)
    return { found: true, steps: 0, path: [[startCi,startCj]] };
  const h = (i, j) => Math.sqrt((i - endCi) ** 2 + (j - endCj) ** 2);
  const kstr = (i, j) => `${i},${j}`;
  const gScore = Array.from({length: GRID_N}, () => Array(GRID_N).fill(Infinity));
  const fScore = Array.from({length: GRID_N}, () => Array(GRID_N).fill(Infinity));
  const cameFrom = new Map();
  const open = new Map();
  if (startIsBlocked) {
    for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const ni = startCi + di, nj = startCj + dj;
      if (ni >= 0 && ni < GRID_N && nj >= 0 && nj < GRID_N && grid[ni][nj] === 0) {
        gScore[ni][nj] = 1;
        fScore[ni][nj] = 1 + h(ni, nj);
        cameFrom.set(kstr(ni, nj), [startCi, startCj]);
        open.set(kstr(ni, nj), [ni, nj]);
      }
    }
  } else {
    gScore[startCi][startCj] = 0;
    fScore[startCi][startCj] = h(startCi, startCj);
    open.set(kstr(startCi, startCj), [startCi, startCj]);
  }
  while (open.size > 0) {
    let bestK = null, bestF = Infinity;
    for (const [kk, [i, j]] of open) {
      if (fScore[i][j] < bestF) { bestF = fScore[i][j]; bestK = kk; }
    }
    const [ci, cj] = open.get(bestK);
    open.delete(bestK);
    if (!endIsBlocked && ci === endCi && cj === endCj) {
      const path = []; let ck = kstr(ci, cj), cur = [ci, cj];
      while (ck) { path.unshift(cur); const prev = cameFrom.get(ck); if (!prev) break; cur = prev; ck = kstr(cur[0], cur[1]); }
      return { found: true, steps: gScore[ci][cj], path };
    }
    if (endIsBlocked && isAdjacent(ci, cj, endCi, endCj)) {
      const path = []; let ck = kstr(ci, cj), cur = [ci, cj];
      while (ck) { path.unshift(cur); const prev = cameFrom.get(ck); if (!prev) break; cur = prev; ck = kstr(cur[0], cur[1]); }
      path.push([endCi, endCj]);
      return { found: true, steps: gScore[ci][cj] + 1, path };
    }
    for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || ni >= GRID_N || nj < 0 || nj >= GRID_N || grid[ni][nj] === 1) continue;
      const tentativeG = gScore[ci][cj] + 1;
      if (tentativeG < gScore[ni][nj]) {
        cameFrom.set(kstr(ni, nj), [ci, cj]);
        gScore[ni][nj] = tentativeG;
        fScore[ni][nj] = tentativeG + h(ni, nj);
        open.set(kstr(ni, nj), [ni, nj]);
      }
    }
  }
  return { found: false, steps: -1, path: [] };
}

const spawnCell = worldToCell(SPAWN.x, SPAWN.z);
const key0Cell = worldToCell(INITIAL_KEY.x, INITIAL_KEY.z);
const mkCell = worldToCell(MOVED_KEY.x, MOVED_KEY.z);
console.log(`spawn(${SPAWN.x},${SPAWN.z})→cell(${spawnCell.ci},${spawnCell.cj}) key0(${INITIAL_KEY.x},${INITIAL_KEY.z})→cell(${key0Cell.ci},${key0Cell.cj}) mk(${MOVED_KEY.x},${MOVED_KEY.z})→cell(${mkCell.ci},${mkCell.cj})`);

function runSeg(name, s, e) {
  const r = astarFlex(s.ci, s.cj, e.ci, e.cj);
  const len = r.found ? r.steps * CELL : -1;
  console.log(`${name}: found=${r.found}, steps=${r.steps}, len=${len.toFixed(2)}m`);
  return { ...r, len };
}
const R1 = runSeg('S1 Spawn→InitialKey', spawnCell, key0Cell);
const R2 = runSeg('S2 InitialKey→BD门', key0Cell, bdCell);
const R3 = runSeg('S3 BD门→MovedKey', bdCell, mkCell);
const R4 = runSeg('S4 MovedKey→EN门', mkCell, enCell);
const allSegsFound = R1.found && R2.found && R3.found && R4.found;
const totalFlow = allSegsFound ? (R1.len + R2.len + R3.len + R4.len) : -1;
console.log(`四段全可达 → ${allSegsFound ? 'PASS' : 'FAIL'}`);
console.log(`Total flow (S1+S2+S3+S4，无系数) = ${totalFlow.toFixed(2)}m`);
if (!allSegsFound) process.exit(1);

console.log('\n===== 全部 9 项校验：数值全部 PASS =====');

function cellPathToSvgPoints(pathCells) {
  return pathCells.map(([ci, cj]) => {
    const w = cellToWorld(ci, cj);
    const sx = 60 + (w.x + 4) * 60;
    const sy = 60 + (w.z + 4) * 60;
    return `${sx.toFixed(1)},${sy.toFixed(1)}`;
  }).join(' ');
}
const svgPathPoints = {
  S1: R1.found ? cellPathToSvgPoints(R1.path) : '',
  S2: R2.found ? cellPathToSvgPoints(R2.path) : '',
  S3: R3.found ? cellPathToSvgPoints(R3.path) : '',
  S4: R4.found ? cellPathToSvgPoints(R4.path) : ''
};

const result = {
  furniture: FURNITURE,
  activeFurnitureAABBs: FURNITURE_AABBS.map(f => ({
    id: f.id, name: f.name, yNote: f.yNote, owner: f.owner,
    sizeX: f.size.x, sizeY: f.size.y, sizeZ: f.size.z,
    centerX: f.aabb.centerX, centerZ: f.aabb.centerZ,
    halfX: f.aabb.halfX, halfZ: f.aabb.halfZ,
    xMin: f.aabb.xMin, xMax: f.aabb.xMax, zMin: f.aabb.zMin, zMax: f.aabb.zMax,
    stackedOn: f.stackedOn || null
  })),
  spawn: SPAWN, initialKey: INITIAL_KEY, movedKey: MOVED_KEY, clearances: CLEARANCES,
  aabbTable, totalPairs, overlapCount, overlapPairs, disjointExamples, clearanceDistances, clearance3x13,
  spawnMinDist, spawnMinFurn, distKey, viewAngleDeg, losHits,
  V, angleDeg, distBD, absZMK, standableHits, hitDirs, dirDetail,
  blockedCount,
  bfsBD_KT: { ...r_bd_kt, len_m: +bd_kt_len.toFixed(2) },
  bfsBD_EN: { ...r_bd_en, len_m: +bd_en_len.toFixed(2) },
  S1: +R1.len.toFixed(2), S2: +R2.len.toFixed(2), S3: +R3.len.toFixed(2), S4: +R4.len.toFixed(2),
  total: totalFlow.toFixed(2), svgPathPoints,
  cells: { spawnCell, key0Cell, bdCell, ktCell, enCell, mkCell },
  allPass: true,
  clearanceAllPass,
  BD_ENTRY, MK_V: V
};

fs.writeFileSync(path.join(__dirname, '..', 'docs', 'b2v2-verify-result.json'), JSON.stringify(result, null, 2));
console.log('\n结果已导出到 docs/b2v2-verify-result.json');
console.log(`\nB2v2：9校验/ PASS，overlap=${overlapCount}，clearance=全≥0.05，BFS=2/2通，A*=Total ${totalFlow.toFixed(2)}m`);
process.exit(0);
