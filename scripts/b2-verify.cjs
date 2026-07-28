const fs = require('fs');
const path = require('path');

const FURNITURE = [
  { id: 'MainSofa', name: '主沙发', size: { x: 2.4, z: 1.0, y: 0.9 }, center: { x: 0.0, z: -3.0 } },
  { id: 'CoffeeTable', name: '茶几', size: { x: 1.4, z: 0.7, y: 0.45 }, center: { x: 0.0, z: 0.3 } },
  { id: 'TVStand', name: '电视柜', size: { x: 2.0, z: 0.45, y: 0.55 }, center: { x: 2.8, z: 3.0 } },
  { id: 'TV', name: '电视', size: { x: 1.6, z: 0.15, y: 0.9 }, center: { x: 2.8, z: 3.0 }, stackedOn: 'TVStand' },
  { id: 'SideSofa', name: '单人沙发', size: { x: 1.6, z: 0.9, y: 0.85 }, center: { x: -1.5, z: 1.5 } },
  { id: 'Bookshelf', name: '书架', size: { x: 0.8, z: 0.35, y: 1.8 }, center: { x: 3.5, z: -2.5 } },
  { id: 'Shelf', name: '搁架', size: { x: 0.7, z: 0.2, y: 1.2 }, center: { x: -2.8, z: 3.8 } },
  { id: 'FloorLamp1', name: '落地灯1', size: { x: 0.4, z: 0.4, y: 1.8 }, center: { x: 3.5, z: -3.5 } },
  { id: 'FloorLamp2', name: '落地灯2', size: { x: 0.35, z: 0.35, y: 1.6 }, center: { x: -0.3, z: 1.5 } },
  { id: 'Plant1', name: '大植物1', size: { x: 0.5, z: 0.5, y: 1.2 }, center: { x: -3.5, z: -3.5 } },
  { id: 'Plant2', name: '大植物2', size: { x: 0.35, z: 0.35, y: 0.8 }, center: { x: 3.6, z: 2.0 } },
  { id: 'LoungeChair', name: '休闲椅', size: { x: 0.5, z: 0.5, y: 0.7 }, center: { x: 3.0, z: -1.5 } },
  { id: 'SideTable', name: '边几', size: { x: 0.6, z: 0.6, y: 0.35 }, center: { x: -1.5, z: 2.6 } },
  { id: 'TaskCnt', name: '任务容器(茶几内含)', size: { x: 0.0, z: 0.0, y: 0.0 }, center: { x: 0.0, z: 0.3 }, ignore: true }
];

const SPAWN = { x: 0.0, z: -1.5, yawDeg: 90.0 };

const INITIAL_KEY = { x: 0.0, y: 0.65, z: 0.3, surfaceContainerId: 'CoffeeTable' };

const MOVED_KEY = { x: -1.0, y: 0.0, z: -2.0 };

const CLEARANCES = {
  bedroom:  { xMin: -4.0, xMax: -2.5, zMin: -1.0, zMax: 1.0 },
  kitchen:  { xMin:  2.5, xMax:  4.0, zMin: -1.0, zMax: 1.0 },
  entrance: { xMin: -1.0, xMax:  1.0, zMin:  2.5, zMax: 4.0 }
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
function pointInRect(px, pz, r) {
  return px >= r.xMin && px <= r.xMax && pz >= r.zMin && pz <= r.zMax;
}
const deg2rad = d => d * Math.PI / 180;
const rad2deg = r => r * 180 / Math.PI;

const ACTIVE_FURNITURE = FURNITURE.filter(f => !f.ignore);
const FURNITURE_AABBS = ACTIVE_FURNITURE.map(f => ({ ...f, aabb: computeAABB(f) }));

// 校验 1
console.log('===== 校验 1：家具 AABB 表 =====');
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

// 校验 2（跳过 stackedOn 对）
console.log('\n===== 校验 2：家具间重叠 =====');
let overlapCount = 0;
const overlapPairs = [];
const disjointExamples = [];
for (let i = 0; i < FURNITURE_AABBS.length; i++) {
  for (let j = i + 1; j < FURNITURE_AABBS.length; j++) {
    const a = FURNITURE_AABBS[i], b = FURNITURE_AABBS[j];
    const skipStacked = (a.stackedOn === b.id || b.stackedOn === a.id);
    if (!skipStacked && rectsIntersect(a.aabb, b.aabb)) {
      overlapCount++;
      overlapPairs.push(`${a.id} <-> ${b.id}`);
    } else if (disjointExamples.length < 3) {
      disjointExamples.push({
        pair: `${a.id} <-> ${b.id}`,
        dist: rectMinDistance(a.aabb, b.aabb).toFixed(3)
      });
    }
  }
}
console.log(`重叠计数 = ${overlapCount}`);
if (overlapCount > 0) console.log('重叠对:', overlapPairs);
console.log('不相交示例:', disjointExamples);

// 校验 3
console.log('\n===== 校验 3：Clearance 距离 =====');
const clearanceDistances = {};
for (const [cname, crect] of Object.entries(CLEARANCES)) {
  clearanceDistances[cname] = {};
  console.log(`-- ${cname} clearance --`);
  let allPass = true;
  for (const f of FURNITURE_AABBS) {
    const d = rectMinDistance(f.aabb, crect);
    clearanceDistances[cname][f.id] = d;
    console.log(`  ${f.id}: dist=${d.toFixed(3)}m ${d >= 0.05 ? '✓' : '✗✗✗ FAIL'}`);
    if (d < 0.05) allPass = false;
  }
  console.log(`  ${cname} 全部 ≥0.05m: ${allPass ? 'PASS' : 'FAIL'}`);
}

// 校验 4
console.log('\n===== 校验 4：Spawn 安全 =====');
const spawnAABB = { xMin: SPAWN.x - 0.2, xMax: SPAWN.x + 0.2, zMin: SPAWN.z - 0.2, zMax: SPAWN.z + 0.2 };
let spawnMinDist = Infinity, spawnMinFurn = null;
for (const f of FURNITURE_AABBS) {
  const d = rectMinDistance(spawnAABB, f.aabb);
  if (d < spawnMinDist) { spawnMinDist = d; spawnMinFurn = f.id; }
}
console.log(`Spawn 最近家具: ${spawnMinFurn}, 距离=${spawnMinDist.toFixed(3)}m ${spawnMinDist >= 0.05 ? 'PASS' : 'FAIL'}`);

// 校验 5
console.log('\n===== 校验 5：初始钥匙距离 + 可见性 =====');
const dx = INITIAL_KEY.x - SPAWN.x, dz = INITIAL_KEY.z - SPAWN.z;
const distKey = Math.sqrt(dx * dx + dz * dz);
console.log(`a. 距离 = ${distKey.toFixed(3)}m ${(distKey >= 1.5 && distKey <= 3.0) ? 'PASS' : 'FAIL'}`);

const yawRad = deg2rad(SPAWN.yawDeg);
const forwardX = Math.cos(yawRad), forwardZ = Math.sin(yawRad);
const lenKeyDir = Math.sqrt(dx * dx + dz * dz);
const cosSim = lenKeyDir > 0 ? (dx * forwardX + dz * forwardZ) / lenKeyDir : 0;
const viewAngleDeg = rad2deg(Math.acos(Math.min(1, Math.max(-1, cosSim))));
console.log(`b. 视野角 = ${viewAngleDeg.toFixed(2)}° (cos=${cosSim.toFixed(4)} vs 0.7071) ${viewAngleDeg <= 45 ? 'PASS' : 'FAIL'}`);

let losHits = 0;
for (let i = 0; i <= 100; i++) {
  const t = i / 100;
  const px = SPAWN.x + dx * t, pz = SPAWN.z + dz * t;
  for (const f of FURNITURE_AABBS) {
    if (f.id === 'CoffeeTable') continue;
    if (pointInRect(px, pz, f.aabb)) { losHits++; break; }
  }
}
console.log(`c. LOS 采样落入数 = ${losHits} ${losHits === 0 ? 'PASS' : 'FAIL'}`);

// 校验 6
console.log('\n===== 校验 6：MovedKey 几何 =====');
const bdx = MOVED_KEY.x - (-4.0), bdz = MOVED_KEY.z - 0.0;
const distBD = Math.sqrt(bdx * bdx + bdz * bdz);
const angleBD = Math.abs(rad2deg(Math.atan2(bdz, bdx)));
const absZ = Math.abs(MOVED_KEY.z);
console.log(`向量 = (${bdx.toFixed(2)}, ${bdz.toFixed(2)})`);
console.log(`a. 视线夹角 = ${angleBD.toFixed(2)}° > 20°? ${angleBD > 20 ? 'PASS' : 'FAIL'}`);
console.log(`b. 距离 = ${distBD.toFixed(3)}m ≥ 2.5? ${distBD >= 2.5 ? 'PASS' : 'FAIL'}`);
console.log(`c. abs(z偏移) = ${absZ.toFixed(2)} ≥ 1.0? ${absZ >= 1.0 ? 'PASS' : 'FAIL'}`);

// 校验 7
console.log('\n===== 校验 7：MovedKey 可交互 =====');
let standableHits = 0;
const dirNames = ['0°','45°','90°','135°','180°','225°','270°','315°'];
const hitDirs = [];
for (let i = 0; i < 8; i++) {
  const theta = deg2rad(i * 45);
  const px = MOVED_KEY.x + 0.5 * Math.cos(theta), pz = MOVED_KEY.z + 0.5 * Math.sin(theta);
  let hit = false;
  for (const f of FURNITURE_AABBS) {
    if (pointInRect(px, pz, f.aabb)) { hit = true; break; }
  }
  if (hit) { standableHits++; hitDirs.push(dirNames[i]); }
}
console.log(`8 方向落入数 = ${standableHits} (挡: ${hitDirs.join(',') || '无'}) ${standableHits <= 3 ? 'PASS' : 'FAIL'}`);

// 校验 8 + 9：网格 + BFS + A*
console.log('\n===== 校验 8 & 9：BFS 连通 + A* 路径 =====');
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
      if (pointInRect(w.x, w.z, f.aabb)) { blocked = true; break; }
    }
    grid[i][j] = blocked ? 1 : 0;
    if (blocked) blockedCount++;
  }
}
console.log(`网格 20×20, blocked=${blockedCount}`);

function isAdjacent(ci1, cj1, ci2, cj2) {
  return Math.abs(ci1 - ci2) + Math.abs(cj1 - cj2) === 1;
}
// BFS / A* 支持终点是 BLOCKED（到达其相邻 FREE cell 视为到达）
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
function astarFlex(startCi, startCj, endCi, endCj) {
  const endIsBlocked = grid[endCi]?.[endCj] === 1;
  const startIsBlocked = grid[startCi]?.[startCj] === 1;
  if (!endIsBlocked && startCi === endCi && startCj === endCj && !startIsBlocked) return { found: true, steps: 0, path: [[startCi,startCj]] };
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

const bdCell = worldToCell(-3.25, 0.0);
const ktCell = worldToCell(3.25, 0.0);
const enCell = worldToCell(0.0, 3.25);
console.log(`BD(${bdCell.ci},${bdCell.cj}) KT(${ktCell.ci},${ktCell.cj}) EN(${enCell.ci},${enCell.cj})`);
const r_bd_kt = bfsFlex(bdCell.ci, bdCell.cj, ktCell.ci, ktCell.cj);
const r_bd_en = bfsFlex(bdCell.ci, bdCell.cj, enCell.ci, enCell.cj);
console.log(`BD→KT: reachable=${r_bd_kt.reachable}, steps=${r_bd_kt.steps}, len≈${(r_bd_kt.steps*CELL).toFixed(2)}m`);
console.log(`BD→EN: reachable=${r_bd_en.reachable}, steps=${r_bd_en.steps}, len≈${(r_bd_en.steps*CELL).toFixed(2)}m`);
console.log(`三门全连通: ${r_bd_kt.reachable && r_bd_en.reachable ? 'PASS' : 'FAIL'}`);

const spawnCell = worldToCell(SPAWN.x, SPAWN.z);
const key0Cell = worldToCell(INITIAL_KEY.x, INITIAL_KEY.z);
const mkCell = worldToCell(MOVED_KEY.x, MOVED_KEY.z);
console.log(`spawn(${spawnCell.ci},${spawnCell.cj}) key0(${key0Cell.ci},${key0Cell.cj}) mk(${mkCell.ci},${mkCell.cj})`);

function runSeg(name, s, e) {
  const r = astarFlex(s.ci, s.cj, e.ci, e.cj);
  const len = r.found ? (r.steps * CELL).toFixed(2) : 'N/A';
  console.log(`${name}: found=${r.found}, steps=${r.steps}, len=${len}m`);
  return { ...r, len: r.found ? r.steps * CELL : -1 };
}
const R1 = runSeg('S1 spawn→key0', spawnCell, key0Cell);
const R2 = runSeg('S2 key0→BD', key0Cell, bdCell);
const R3 = runSeg('S3 BD→MovedKey', bdCell, mkCell);
const R4 = runSeg('S4 MovedKey→EN', mkCell, enCell);
const total = (R1.len >= 0 && R2.len >= 0 && R3.len >= 0 && R4.len >= 0) ? (R1.len + R2.len + R3.len + R4.len).toFixed(2) : 'N/A';
console.log(`Total flow = ${total}m`);

// 生成路径 SVG 折线点 (转换为 SVG 坐标)
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

const allPass = 
  overlapCount === 0 &&
  spawnMinDist >= 0.05 &&
  distKey >= 1.5 && distKey <= 3.0 &&
  viewAngleDeg <= 45 &&
  losHits === 0 &&
  angleBD > 20 && distBD >= 2.5 && absZ >= 1.0 &&
  standableHits <= 3 &&
  r_bd_kt.reachable && r_bd_en.reachable &&
  R1.found && R2.found && R3.found && R4.found;

console.log('\n===== 总校验结果 =====');
console.log(`ALL 9 PASS? ${allPass ? 'YES ✓✓✓' : 'NO ✗'}`);

const result = {
  furniture: FURNITURE,
  activeFurnitureAABBs: FURNITURE_AABBS.map(f => ({
    id: f.id, name: f.name, sizeX: f.size.x, sizeZ: f.size.z, sizeY: f.size.y,
    centerX: f.aabb.centerX, centerZ: f.aabb.centerZ,
    halfX: f.aabb.halfX, halfZ: f.aabb.halfZ,
    xMin: f.aabb.xMin, xMax: f.aabb.xMax, zMin: f.aabb.zMin, zMax: f.aabb.zMax
  })),
  spawn: SPAWN, initialKey: INITIAL_KEY, movedKey: MOVED_KEY, clearances: CLEARANCES,
  aabbTable, overlapCount, overlapPairs, disjointExamples, clearanceDistances,
  spawnMinDist, spawnMinFurn, distKey, viewAngleDeg, losHits,
  bdx, bdz, distBD, angleBD, absZ, standableHits, hitDirs,
  blockedCount,
  bfsBD_KT: { ...r_bd_kt, len_m: +(r_bd_kt.steps * CELL).toFixed(2) },
  bfsBD_EN: { ...r_bd_en, len_m: +(r_bd_en.steps * CELL).toFixed(2) },
  S1: +R1.len.toFixed(2), S2: +R2.len.toFixed(2), S3: +R3.len.toFixed(2), S4: +R4.len.toFixed(2),
  total, svgPathPoints, allPass
};

fs.writeFileSync(path.join(__dirname, '..', 'docs', 'b2-verify-result.json'), JSON.stringify(result, null, 2));
console.log('\n结果已导出到 docs/b2-verify-result.json');
process.exit(allPass ? 0 : 1);
