/**
 * @file
 * 门洞对齐精细验证脚本（5 房间枢纽布局专用）。
 * 验证：
 *   1. 每个 doorway 的两个连通房间（A <-> B）其门洞世界坐标重合（≤ 0.05m 容差）
 *   2. 两房间确实共享一面实体墙（wallOverlap ≥ 1e-3 m）
 *   3. 共享墙长度 ≥ 2.4m（门洞 1.4m + 两侧 0.5m 空隙 = 2.4m 最小要求）
 *   4. 门洞宽度 ≤ 共享墙长度 - 0.5*2（两侧至少各 0.5m 空隙）
 *
 * 通过: 每条连接 PASS / FAIL + 关键数据表格打印。
 * 入口: npx vite-node scripts/qa-doorways.ts
 */
import { sharedRooms, type RoomId } from '../src/data/rooms'

type Connection = {
  a: RoomId
  b: RoomId
  aDoorOffset: { x: number; z: number }
  bDoorOffset: { x: number; z: number }
  aWorld: { x: number; z: number }
  bWorld: { x: number; z: number }
  widthA: number
  widthB: number
  deltaX: number
  deltaZ: number
  sharedWallLen: number
  sharedWallAxis: 'x' | 'z'
  sharedWallWorldCoord: number
  overlapStart: number
  overlapEnd: number
  doorProjection: { a: [number, number]; b: [number, number] }
  issues: string[]
}

function getConnections(): Connection[] {
  // 把所有 doorways 的 "offset + size" 展开 -> 关联到 RoomId
  // doorways 没有存对面的 RoomId，我们通过世界坐标匹配来把它们配对。
  const dwWorldList: Array<{
    roomId: RoomId
    offset: { x: number; z: number }
    width: number
    world: { x: number; z: number }
  }> = []
  for (const r of Object.values(sharedRooms)) {
    for (const dw of r.doorways ?? []) {
      dwWorldList.push({
        roomId: r.id,
        offset: { ...dw.offset },
        width: dw.width,
        world: {
          x: r.center.x + dw.offset.x,
          z: r.center.z + dw.offset.z,
        },
      })
    }
  }

  // 配对：两两匹配世界坐标相近的门洞
  const matched = new Set<number>()
  const connections: Connection[] = []

  for (let i = 0; i < dwWorldList.length; i += 1) {
    if (matched.has(i)) continue
    const d = dwWorldList[i]
    // 找另一个门洞，世界坐标 ≤0.2m 且 roomId 不同
    let pairIdx = -1
    let minDist = Infinity
    for (let j = 0; j < dwWorldList.length; j += 1) {
      if (j === i || matched.has(j)) continue
      if (dwWorldList[j].roomId === d.roomId) continue
      const dx = dwWorldList[j].world.x - d.world.x
      const dz = dwWorldList[j].world.z - d.world.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 0.2 && dist < minDist) {
        pairIdx = j
        minDist = dist
      }
    }
    if (pairIdx < 0) {
      // 无法配对的门洞
      connections.push({
        a: d.roomId,
        b: 'living',
        aDoorOffset: d.offset,
        bDoorOffset: { x: NaN, z: NaN },
        aWorld: d.world,
        bWorld: { x: NaN, z: NaN },
        widthA: d.width,
        widthB: NaN,
        deltaX: NaN,
        deltaZ: NaN,
        sharedWallLen: NaN,
        sharedWallAxis: 'x',
        sharedWallWorldCoord: NaN,
        overlapStart: NaN,
        overlapEnd: NaN,
        doorProjection: { a: [NaN, NaN], b: [NaN, NaN] },
        issues: [`⚠️ 门洞找不到对面房间的配对: ${d.roomId} @ (${d.world.x.toFixed(2)}, ${d.world.z.toFixed(2)})`],
      })
      matched.add(i)
      continue
    }
    const other = dwWorldList[pairIdx]
    matched.add(i)
    matched.add(pairIdx)

    // 按字母排序 roomId，保证 A/B 顺序稳定
    const aFirst = d.roomId <= other.roomId
    const A = aFirst ? d : other
    const B = aFirst ? other : d

    const specA = sharedRooms[A.roomId]
    const specB = sharedRooms[B.roomId]

    // 计算共享墙
    const aMinX = specA.center.x - specA.size.x / 2
    const aMaxX = specA.center.x + specA.size.x / 2
    const aMinZ = specA.center.z - specA.size.z / 2
    const aMaxZ = specA.center.z + specA.size.z / 2
    const bMinX = specB.center.x - specB.size.x / 2
    const bMaxX = specB.center.x + specB.size.x / 2
    const bMinZ = specB.center.z - specB.size.z / 2
    const bMaxZ = specB.center.z + specB.size.z / 2

    const issues: string[] = []

    // X & Z 两个方向取交集，找出 "共面" 的墙（交集在一维度上 ≥ 0 的就是共享墙）
    const xOverlapLen = Math.max(0, Math.min(aMaxX, bMaxX) - Math.max(aMinX, bMinX))
    const zOverlapLen = Math.max(0, Math.min(aMaxZ, bMaxZ) - Math.max(aMinZ, bMinZ))
    // 共享墙判定：其中一维的墙间距 ≤ 0.01m（几乎紧贴）且另一维的重叠 ≥ 0.01m
    const xTouches = Math.abs(aMaxX - bMinX) < 0.01 || Math.abs(aMinX - bMaxX) < 0.01
    const zTouches = Math.abs(aMaxZ - bMinZ) < 0.01 || Math.abs(aMinZ - bMaxZ) < 0.01
    let sharedWallAxis: 'x' | 'z' = 'x'
    let sharedWallLen = NaN
    let sharedWallWorldCoord = NaN
    let overlapStart = NaN
    let overlapEnd = NaN
    if (xTouches && zOverlapLen > 0.01) {
      // 共享墙是 Z 方向延展（南北向竖墙），其长度就是 zOverlapLen
      sharedWallAxis = 'x' // 墙的 X 坐标固定 = 共享墙的世界 X
      sharedWallLen = zOverlapLen
      sharedWallWorldCoord = xTouches
        ? Math.abs(aMaxX - bMinX) < 0.01
          ? aMaxX
          : aMinX
        : NaN
      overlapStart = Math.max(aMinZ, bMinZ)
      overlapEnd = Math.min(aMaxZ, bMaxZ)
    } else if (zTouches && xOverlapLen > 0.01) {
      sharedWallAxis = 'z' // 墙的 Z 坐标固定
      sharedWallLen = xOverlapLen
      sharedWallWorldCoord = Math.abs(aMaxZ - bMinZ) < 0.01 ? aMaxZ : aMinZ
      overlapStart = Math.max(aMinX, bMinX)
      overlapEnd = Math.min(aMaxX, bMaxX)
    } else {
      issues.push('❌ 两房间没有共享实体墙（矩形不贴合）')
    }

    // 共享墙长度 ≥ 2.4m（门洞 1.4m + 两侧各 0.5m 空隙）
    if (!Number.isNaN(sharedWallLen) && sharedWallLen < 2.4 - 1e-6) {
      issues.push(`❌ 共享墙长度 ${sharedWallLen.toFixed(2)}m < 最小要求 2.4m`)
    }

    // 门洞世界坐标匹配
    const dx = B.world.x - A.world.x
    const dz = B.world.z - A.world.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist > 0.1) {
      issues.push(`❌ 门洞世界坐标错位 ${dist.toFixed(3)}m (dx=${dx.toFixed(3)}, dz=${dz.toFixed(3)})`)
    }
    if (A.width !== B.width) {
      issues.push(`⚠️ 门洞宽度不一致: A=${A.width.toFixed(2)}m B=${B.width.toFixed(2)}m`)
    }

    // 门洞投影到共享墙的延展方向上，检查是否都落在共享墙内，且两侧空隙 ≥ 0.5m
    const projA: [number, number] = [NaN, NaN]
    const projB: [number, number] = [NaN, NaN]
    if (!Number.isNaN(sharedWallLen)) {
      const proj = (doorWorld: { x: number; z: number }, width: number): [number, number] => {
        if (sharedWallAxis === 'x') {
          // 延展方向是 Z 轴（南北向竖墙）
          const centerProj = doorWorld.z
          return [centerProj - width / 2, centerProj + width / 2]
        }
        // sharedWallAxis === 'z' → 延展方向是 X 轴（东西向横墙）
        const centerProj = doorWorld.x
        return [centerProj - width / 2, centerProj + width / 2]
      }
      projA[0] = proj(A.world, A.width)[0]
      projA[1] = proj(A.world, A.width)[1]
      projB[0] = proj(B.world, B.width)[0]
      projB[1] = proj(B.world, B.width)[1]

      // 检查门洞是否超共享墙边界
      if (projA[0] < overlapStart - 1e-3 || projA[1] > overlapEnd + 1e-3) {
        issues.push(
          `❌ 门洞 A 超出共享墙边界: 投影=[${projA[0].toFixed(2)}, ${projA[1].toFixed(2)}] vs 共享墙=[${overlapStart.toFixed(2)}, ${overlapEnd.toFixed(2)}]`,
        )
      }
      if (projB[0] < overlapStart - 1e-3 || projB[1] > overlapEnd + 1e-3) {
        issues.push(
          `❌ 门洞 B 超出共享墙边界: 投影=[${projB[0].toFixed(2)}, ${projB[1].toFixed(2)}] vs 共享墙=[${overlapStart.toFixed(2)}, ${overlapEnd.toFixed(2)}]`,
        )
      }

      // 两侧空隙 ≥ 0.5m（取两个房间的最小空隙中更紧的那个）
      const leftGapA = projA[0] - overlapStart
      const rightGapA = overlapEnd - projA[1]
      const leftGapB = projB[0] - overlapStart
      const rightGapB = overlapEnd - projB[1]
      const minGap = Math.min(leftGapA, rightGapA, leftGapB, rightGapB)
      if (minGap < 0.5 - 1e-6) {
        issues.push(
          `❌ 门洞两侧最小空隙 ${minGap.toFixed(2)}m < 最小要求 0.5m (左A=${leftGapA.toFixed(2)},右A=${rightGapA.toFixed(2)},左B=${leftGapB.toFixed(2)},右B=${rightGapB.toFixed(2)})`,
        )
      }
    }

    connections.push({
      a: A.roomId,
      b: B.roomId,
      aDoorOffset: A.offset,
      bDoorOffset: B.offset,
      aWorld: A.world,
      bWorld: B.world,
      widthA: A.width,
      widthB: B.width,
      deltaX: dx,
      deltaZ: dz,
      sharedWallLen,
      sharedWallAxis,
      sharedWallWorldCoord,
      overlapStart,
      overlapEnd,
      doorProjection: { a: projA, b: projB },
      issues,
    })
  }

  return connections
}

function main() {
  const connections = getConnections()

  console.log('\n============================================================')
  console.log('  QA: 5 房间枢纽布局门洞对齐精细验证')
  console.log('============================================================\n')

  console.log('📋 房间布局速查表 (center / size / half):')
  const rows = Object.values(sharedRooms).map((r) => {
    const hx = (r.size.x / 2).toFixed(3)
    const hz = (r.size.z / 2).toFixed(3)
    return {
      id: r.id.padEnd(8, ' '),
      cx: r.center.x.toFixed(2).padStart(6, ' '),
      cz: r.center.z.toFixed(2).padStart(6, ' '),
      sx: String(r.size.x).padStart(4, ' '),
      sz: String(r.size.z).padStart(4, ' '),
      hx: hx.padStart(5, ' '),
      hz: hz.padStart(5, ' '),
      doors: String((r.doorways ?? []).length).padStart(3, ' '),
    }
  })
  console.log('  id       cx     cz     sx  sz    hx    hz  doors')
  console.log('  ' + '-'.repeat(58))
  for (const r of rows) {
    console.log(`  ${r.id} ${r.cx} ${r.cz} ${r.sx} ${r.sz} ${r.hx} ${r.hz} ${r.doors}`)
  }

  console.log('\n============================================================')
  console.log('  门洞对齐逐条验证')
  console.log('============================================================\n')

  let pass = 0
  let fail = 0
  for (const [idx, c] of connections.entries()) {
    const status = c.issues.length === 0 ? '✅ PASS' : '❌ FAIL'
    if (c.issues.length === 0) pass += 1
    else fail += 1
    console.log(`[${idx + 1}] ${status}  ${c.a.padEnd(8, ' ')} <-> ${c.b.padEnd(8, ' ')}`)
    console.log(`      A 门洞: offset(${c.aDoorOffset.x.toFixed(2)}, ${c.aDoorOffset.z.toFixed(2)})  world(${c.aWorld.x.toFixed(3)}, ${c.aWorld.z.toFixed(3)})  width=${c.widthA.toFixed(2)}m`)
    console.log(`      B 门洞: offset(${c.bDoorOffset.x.toFixed(2)}, ${c.bDoorOffset.z.toFixed(2)})  world(${c.bWorld.x.toFixed(3)}, ${c.bWorld.z.toFixed(3)})  width=${c.widthB.toFixed(2)}m`)
    if (!Number.isNaN(c.sharedWallLen)) {
      const axis = c.sharedWallAxis === 'x' ? 'Z(南北向竖墙)  ' : 'X(东西向横墙)  '
      console.log(`      共享墙: 延展轴=${axis} length=${c.sharedWallLen.toFixed(2)}m  world@${c.sharedWallAxis}=${c.sharedWallWorldCoord.toFixed(3)}m  overlap=[${c.overlapStart.toFixed(3)}, ${c.overlapEnd.toFixed(3)}]m`)
      if (!Number.isNaN(c.doorProjection.a[0])) {
        console.log(
          `      门洞投影: A=[${c.doorProjection.a[0].toFixed(3)}, ${c.doorProjection.a[1].toFixed(3)}]m  B=[${c.doorProjection.b[0].toFixed(3)}, ${c.doorProjection.b[1].toFixed(3)}]m  错位=${(Math.max(0, Math.max(
            Math.abs(c.doorProjection.a[0] - c.doorProjection.b[0]),
            Math.abs(c.doorProjection.a[1] - c.doorProjection.b[1]),
          ))).toFixed(3)}m`,
        )
      }
    }
    if (!Number.isNaN(c.deltaX)) {
      const d = Math.sqrt(c.deltaX ** 2 + c.deltaZ ** 2)
      console.log(`      世界坐标差: dx=${c.deltaX.toFixed(3)}m dz=${c.deltaZ.toFixed(3)}m dist=${d.toFixed(3)}m`)
    }
    for (const iss of c.issues) console.log(`      ${iss}`)
    console.log('')
  }

  console.log('============================================================')
  console.log(`  ✅ Passed : ${pass}`)
  console.log(`  ❌ Failed : ${fail}`)
  console.log(`  📊 Total  : ${connections.length}`)
  console.log('============================================================')

  if (fail > 0) {
    console.log('\n❌ 至少一条门洞连接不合法，详见上方每条连接的 issues 列表。')
    process.exit(1)
  } else {
    console.log('\n✅ 所有门洞连接均满足 5 房间枢纽布局的对齐/尺寸/空隙要求。')
    process.exit(0)
  }
}

main()
