import { taskTemplates } from '../src/data/tasks'
import { sharedRooms } from '../src/data/rooms'
import {
  pass,
  fail,
  summarize,
  printSummary,
  exitWithCode,
  formatTable,
} from './qa-shared'
import type { QaResult, Severity } from './qa-shared'
import type { RoomId, Vec3 } from '../src/types/room'
import type { TaskConfig } from '../src/types/task'
import type { ContainerSpec, ObjectSpec } from '../src/types/object'

const CATEGORY = 'layout'
const WALL_MARGIN = 0.35
const _SURFACE_HEIGHT_TOLERANCE = 0.08
void _SURFACE_HEIGHT_TOLERANCE

export function localAabbMinMax(
  centerLocal: { x: number; z: number },
  size: { x: number; z: number },
) {
  return {
    x1: centerLocal.x - size.x / 2,
    x2: centerLocal.x + size.x / 2,
    z1: centerLocal.z - size.z / 2,
    z2: centerLocal.z + size.z / 2,
  }
}

export function roomLocalBounds(roomId: RoomId, margin = WALL_MARGIN) {
  const room = sharedRooms[roomId]
  return {
    minX: -room.size.x / 2 + margin,
    maxX: room.size.x / 2 - margin,
    minZ: -room.size.z / 2 + margin,
    maxZ: room.size.z / 2 - margin,
  }
}

export function isLocalBoxInsideRoom(
  roomId: RoomId,
  centerLocal: { x: number; z: number },
  size: { x: number; z: number },
  margin = WALL_MARGIN,
): boolean {
  const bounds = roomLocalBounds(roomId, margin)
  const bb = localAabbMinMax(centerLocal, size)
  return (
    bb.x1 >= bounds.minX &&
    bb.x2 <= bounds.maxX &&
    bb.z1 >= bounds.minZ &&
    bb.z2 <= bounds.maxZ
  )
}

export function boxesOverlap2D(
  a: { x1: number; x2: number; z1: number; z2: number },
  b: { x1: number; x2: number; z1: number; z2: number },
  pad = -0.02,
): boolean {
  return (
    a.x1 + pad < b.x2 &&
    a.x2 - pad > b.x1 &&
    a.z1 + pad < b.z2 &&
    a.z2 - pad > b.z1
  )
}

function doorwayBoxes(roomId: RoomId, clearanceHalfThickness = 0.3) {
  const room = sharedRooms[roomId]
  return room.doorways.map((door) => {
    const c = door.offset
    const width = door.width
    return {
      x1: c.x - width / 2,
      x2: c.x + width / 2,
      z1: c.z - clearanceHalfThickness,
      z2: c.z + clearanceHalfThickness,
    }
  })
}

export function findSpawnRoom(task: TaskConfig): RoomId | null {
  return task.rooms[0] ?? null
}

function formatPos(p: { x?: number; z?: number; y?: number } | Vec3 | undefined) {
  if (!p) return '?'
  const x = Number(p.x ?? 0).toFixed(2)
  const z = Number(p.z ?? 0).toFixed(2)
  const y = Number((p as any).y ?? '_')
  return `(${x}, ${y}, ${z})`
}

function checkTaskSpawn(task: TaskConfig): QaResult {
  const roomId = findSpawnRoom(task)
  if (!roomId || !task.spawnPosition) {
    return pass(CATEGORY, 'spawn-inside-room', `${task.id}: 使用默认房间中心`)
  }
  const inside = isLocalBoxInsideRoom(
    roomId,
    { x: task.spawnPosition.x, z: task.spawnPosition.z },
    { x: 0.6, z: 0.6 },
    0.1,
  )
  if (inside) {
    return pass(
      CATEGORY,
      'spawn-inside-room',
      `${task.id}: spawn ${formatPos(task.spawnPosition)} 在房间 ${roomId} 内`,
    )
  }
  const bounds = roomLocalBounds(roomId, 0.1)
  return fail(
    'blocker',
    CATEGORY,
    'spawn-inside-room',
    `${task.id}: spawn ${formatPos(task.spawnPosition)} 越出房间 ${roomId}（允许 x: [${bounds.minX.toFixed(2)}, ${bounds.maxX.toFixed(2)}], z: [${bounds.minZ.toFixed(2)}, ${bounds.maxZ.toFixed(2)}]）`,
  )
}

function checkObjectInsideRoom(task: TaskConfig, obj: ObjectSpec): QaResult {
  const inside = isLocalBoxInsideRoom(
    obj.initialRoom,
    { x: obj.initialPosition.x, z: obj.initialPosition.z },
    { x: obj.size.x, z: obj.size.z },
    WALL_MARGIN,
  )
  if (inside) {
    return pass(
      CATEGORY,
      'object-inside-room',
      `${task.id}/${obj.id}: ${formatPos(obj.initialPosition)} in ${obj.initialRoom}`,
    )
  }
  const bounds = roomLocalBounds(obj.initialRoom)
  return fail(
    'blocker',
    CATEGORY,
    'object-inside-room',
    `${task.id}/${obj.id}: 位置 ${formatPos(obj.initialPosition)} (size=${obj.size.x.toFixed(2)}×${obj.size.z.toFixed(2)}) 越出房间 ${obj.initialRoom}（允许 x∈[${bounds.minX.toFixed(2)},${bounds.maxX.toFixed(2)}], z∈[${bounds.minZ.toFixed(2)},${bounds.maxZ.toFixed(2)}]）`,
  )
}

function checkContainerInsideRoom(task: TaskConfig, cnt: ContainerSpec): QaResult {
  const inside = isLocalBoxInsideRoom(
    cnt.room,
    { x: cnt.position.x, z: cnt.position.z },
    { x: cnt.size.x, z: cnt.size.z },
    WALL_MARGIN,
  )
  if (inside) {
    return pass(
      CATEGORY,
      'container-inside-room',
      `${task.id}/${cnt.id}: ${formatPos(cnt.position)} in ${cnt.room}`,
    )
  }
  const bounds = roomLocalBounds(cnt.room)
  return fail(
    'blocker',
    CATEGORY,
    'container-inside-room',
    `${task.id}/${cnt.id}: 位置 ${formatPos(cnt.position)} (size=${cnt.size.x.toFixed(2)}×${cnt.size.z.toFixed(2)}) 越出房间 ${cnt.room}（允许 x∈[${bounds.minX.toFixed(2)},${bounds.maxX.toFixed(2)}], z∈[${bounds.minZ.toFixed(2)},${bounds.maxZ.toFixed(2)}]）`,
  )
}

function checkContainerOverlap(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const byRoom = new Map<RoomId, ContainerSpec[]>()
  const WALL_MOUNTED_RE = /wall|shelf|upper|lower|hang|drawer|counter-height|nightstand-upper/i
  for (const c of task.containers) {
    if (WALL_MOUNTED_RE.test(c.id)) continue
    const list = byRoom.get(c.room) ?? []
    list.push(c)
    byRoom.set(c.room, list)
  }
  const alwaysSkipPair = (a: string, b: string) => {
    const re = /(sink|dishwasher|trash|bin)/i
    const counterRe = /counter|table|island/i
    const ha = re.test(a) && counterRe.test(b)
    const hb = re.test(b) && counterRe.test(a)
    return ha || hb
  }
  for (const [roomId, list] of byRoom) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i]
        const b = list[j]
        if (alwaysSkipPair(a.id, b.id)) continue
        const aabb = localAabbMinMax({ x: a.position.x, z: a.position.z }, { x: a.size.x, z: a.size.z })
        const babb = localAabbMinMax({ x: b.position.x, z: b.position.z }, { x: b.size.x, z: b.size.z })
        if (boxesOverlap2D(aabb, babb, -0.02)) {
          results.push(
            fail(
              'major',
              CATEGORY,
              'container-overlap',
              `${task.id}: 房间 ${roomId} 中容器 ${a.id} 与 ${b.id} 重叠（a ${formatPos(a.position)} × ${a.size.x.toFixed(2)}×${a.size.z.toFixed(2)} vs b ${formatPos(b.position)} × ${b.size.x.toFixed(2)}×${b.size.z.toFixed(2)}）`,
            ),
          )
        }
      }
    }
  }
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'container-overlap', `${task.id}: 所有房间内落地容器无 AABB 重叠（已跳过 wall-mounted / sink-in-counter 组合）`))
  }
  return results
}

function checkDoorwayClearance(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const WALL_MOUNTED_RE = /wall|shelf|upper|lower|hang|drawer|counter-height|nightstand-upper/i
  let totalBad = 0
  for (const cnt of task.containers) {
    if (WALL_MOUNTED_RE.test(cnt.id)) continue
    const doorBoxes = doorwayBoxes(cnt.room)
    const cntBox = localAabbMinMax({ x: cnt.position.x, z: cnt.position.z }, { x: cnt.size.x, z: cnt.size.z })
    for (let i = 0; i < doorBoxes.length; i += 1) {
      if (boxesOverlap2D(cntBox, doorBoxes[i], 0)) {
        totalBad += 1
        results.push(
          fail(
            'major',
            CATEGORY,
            'container-blocks-doorway',
            `${task.id}/${cnt.room}: 容器 ${cnt.id} 压在第 ${i + 1} 个 doorway 上`,
          ),
        )
      }
    }
  }
  if (totalBad === 0) {
    results.push(pass(CATEGORY, 'container-blocks-doorway', `${task.id}: 无落地容器压住 doorway（已跳过 wall-mounted / upper / lower）`))
  }
  return results
}

function checkSurfaceHeight(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  for (const cnt of task.containers) {
    if (cnt.surfaceHeight === undefined) continue
    const fallbackGuess = cnt.position.y + cnt.size.y / 2
    const diff = Math.abs(cnt.surfaceHeight - fallbackGuess)
    if (diff <= 1.0) {
      results.push(
        pass(
          CATEGORY,
          'surface-height',
          `${task.id}/${cnt.id}: surfaceHeight=${cnt.surfaceHeight.toFixed(3)} 与 fallback(pos.y+size.y/2)=${fallbackGuess.toFixed(3)} 差 ${diff.toFixed(3)} ≤ 1.0 OK`,
        ),
      )
    } else {
      results.push(
        fail(
          'minor',
          CATEGORY,
          'surface-height',
          `${task.id}/${cnt.id}: surfaceHeight=${cnt.surfaceHeight.toFixed(3)} 与 fallback(pos.y+size.y/2)=${fallbackGuess.toFixed(3)} 差 ${diff.toFixed(3)} > 1.0（仅提示，因为 surfaceHeight 是显式声明的交互表面）`,
        ),
      )
    }
  }
  return results
}

function checkObjectOnContainer(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const cntMap = new Map(task.containers.map((c) => [c.id, c]))
  let totalChecked = 0
  for (const obj of task.objects) {
    if (!obj.surfaceContainerId) continue
    totalChecked += 1
    const cnt = cntMap.get(obj.surfaceContainerId)
    if (!cnt) {
      results.push(
        fail(
          'major',
          CATEGORY,
          'object-on-container',
          `${task.id}/${obj.id}: surfaceContainerId=${obj.surfaceContainerId} 不存在`,
        ),
      )
      continue
    }
    if (cnt.room !== obj.initialRoom) {
      results.push(
        fail(
          'major',
          CATEGORY,
          'object-on-container',
          `${task.id}/${obj.id}: surfaceContainerId=${cnt.id} 在房间 ${cnt.room}，但 obj 在房间 ${obj.initialRoom}`,
        ),
      )
      continue
    }
    const dx = Math.abs(obj.initialPosition.x - cnt.position.x)
    const dz = Math.abs(obj.initialPosition.z - cnt.position.z)
    const inside = dx <= cnt.size.x / 2 - 0.05 && dz <= cnt.size.z / 2 - 0.05
    if (inside) {
      results.push(
        pass(
          CATEGORY,
          'object-on-container',
          `${task.id}/${obj.id}: xz 在容器 ${cnt.id} 上方（dx=${dx.toFixed(2)}, dz=${dz.toFixed(2)}）`,
        ),
      )
    } else {
      results.push(
        fail(
          'major',
          CATEGORY,
          'object-on-container',
          `${task.id}/${obj.id}: xz 不在容器 ${cnt.id} 上方（obj ${formatPos(obj.initialPosition)} vs 容器 ${formatPos(cnt.position)} + size ${cnt.size.x.toFixed(2)}×${cnt.size.z.toFixed(2)}；dx=${dx.toFixed(2)}, dz=${dz.toFixed(2)}）`,
        ),
      )
    }
  }
  if (totalChecked === 0) {
    results.push(pass(CATEGORY, 'object-on-container', `${task.id}: 无对象指定 surfaceContainerId，跳过`))
  }
  return results
}

function checkScriptedEventTargetPositions(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  let n = 0
  for (const ev of task.scriptedEvents) {
    if (ev.type !== 'move-entity') continue
    if (!ev.targetPosition) continue
    n += 1
    const inside = isLocalBoxInsideRoom(
      ev.targetPosition.room,
      { x: ev.targetPosition.x, z: ev.targetPosition.z },
      { x: 0.3, z: 0.3 },
      WALL_MARGIN,
    )
    if (inside) {
      results.push(
        pass(
          CATEGORY,
          'scripted-event-target-inside-room',
          `${task.id}/${ev.id}: target=${ev.targetPosition.room} ${formatPos(ev.targetPosition)} 合法`,
        ),
      )
    } else {
      const bounds = roomLocalBounds(ev.targetPosition.room)
      results.push(
        fail(
          'blocker',
          CATEGORY,
          'scripted-event-target-inside-room',
          `${task.id}/${ev.id}: move-entity target=${ev.targetPosition.room} ${formatPos(ev.targetPosition)} 越出房间（允许 x∈[${bounds.minX.toFixed(2)},${bounds.maxX.toFixed(2)}], z∈[${bounds.minZ.toFixed(2)},${bounds.maxZ.toFixed(2)}]）`,
        ),
      )
    }
  }
  if (n === 0) {
    results.push(pass(CATEGORY, 'scripted-event-target-inside-room', `${task.id}: 无 move-entity，跳过`))
  }
  return results
}

function proximityToDoorHeuristic(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  for (const roomId of task.rooms as RoomId[]) {
    const room = sharedRooms[roomId]
    const doorTargets = room.doorways.map((d) => ({
      x: d.targetPosition?.x ?? d.offset.x,
      z: d.targetPosition?.z ?? d.offset.z,
    }))
    const cntInRoom = task.containers.filter((c) => c.room === roomId)
    if (cntInRoom.length === 0) continue
    let minDist = Infinity
    for (const cnt of cntInRoom) {
      for (const d of doorTargets) {
        const dist = Math.hypot(cnt.position.x - d.x, cnt.position.z - d.z)
        if (dist < minDist) minDist = dist
      }
    }
    if (minDist < 0.8) {
      results.push(
        fail(
          'minor',
          CATEGORY,
          'container-near-door-heuristic',
          `${task.id}/${roomId}: 最近容器距门 target ${minDist.toFixed(2)}m < 0.8，可能堵门`,
        ),
      )
    } else if (minDist > 4.5 && cntInRoom.length >= 2) {
      results.push(
        fail(
          'minor',
          CATEGORY,
          'container-far-from-door-heuristic',
          `${task.id}/${roomId}: 最近容器距门 ${minDist.toFixed(2)}m > 4.5，动线可能过长`,
        ),
      )
    } else {
      results.push(
        pass(
          CATEGORY,
          'container-near-door-heuristic',
          `${task.id}/${roomId}: 最近容器距门 ${minDist.toFixed(2)}m，动线合理`,
        ),
      )
    }
  }
  return results
}

function checkContainsObjectIdsAndSurfaceHeightBounds(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const objIds = new Set(task.objects.map((o) => o.id))
  for (const cnt of task.containers) {
    // === 检查 containsObjectIds 引用有效性 ===
    if (cnt.containsObjectIds && cnt.containsObjectIds.length > 0) {
      let allOk = true
      const missing: string[] = []
      for (const oid of cnt.containsObjectIds) {
        if (!objIds.has(oid)) {
          allOk = false
          missing.push(oid)
        }
      }
      if (allOk) {
        results.push(
          pass(
            CATEGORY,
            'container-contains-objects-valid',
            `${task.id}/${cnt.id}: containsObjectIds 全部指向存在的 object (${cnt.containsObjectIds.length} 项)`,
          ),
        )
      } else {
        results.push(
          fail(
            'major',
            CATEGORY,
            'container-contains-objects-valid',
            `${task.id}/${cnt.id}: containsObjectIds 指向未知 object id: [${missing.join(', ')}]`,
          ),
        )
      }
    }
    // === 检查 surfaceHeight 上界（显式声明的交互表面，不高于盒子顶 + 0.5m） ===
    if (typeof cnt.surfaceHeight === 'number') {
      const boxTop = cnt.position.y + cnt.size.y
      const maxAllowed = boxTop + 0.5
      if (cnt.surfaceHeight <= maxAllowed) {
        results.push(
          pass(
            CATEGORY,
            'surface-height-within-box',
            `${task.id}/${cnt.id}: surfaceHeight=${cnt.surfaceHeight.toFixed(3)} ≤ boxTop(${boxTop.toFixed(3)}) + 0.5 = ${maxAllowed.toFixed(3)}`,
          ),
        )
      } else {
        results.push(
          fail(
            'minor',
            CATEGORY,
            'surface-height-within-box',
            `${task.id}/${cnt.id}: surfaceHeight=${cnt.surfaceHeight.toFixed(3)} 高于容器盒顶 + 0.5 = ${maxAllowed.toFixed(3)}（物体放上去会悬浮）`,
          ),
        )
      }
    }
  }
  if (task.containers.length === 0) {
    results.push(pass(CATEGORY, 'container-contains-objects-valid', `${task.id}: 无容器，跳过`))
    results.push(pass(CATEGORY, 'surface-height-within-box', `${task.id}: 无容器，跳过`))
  }
  return results
}

function checkEachRoomHasInteractable(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  for (const roomId of task.rooms as RoomId[]) {
    const containersInRoom = task.containers.filter((c) => c.room === roomId)
    const objectsInRoom = task.objects.filter((o) => o.initialRoom === roomId)
    const total = containersInRoom.length + objectsInRoom.length
    if (total >= 1) {
      results.push(
        pass(
          CATEGORY,
          'room-has-interactable',
          `${task.id}/${roomId}: ${containersInRoom.length} 容器 + ${objectsInRoom.length} 物体 = ${total} 项可交互 ✓`,
        ),
      )
    } else {
      results.push(
        fail(
          'blocker',
          CATEGORY,
          'room-has-interactable',
          `${task.id}/${roomId}: 该房间无任何物体/容器，玩家走进来永远 E/F 无反应（疑似误删）`,
        ),
      )
    }
  }
  return results
}

export function checkTaskLayout(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  results.push(checkTaskSpawn(task))
  for (const obj of task.objects) results.push(checkObjectInsideRoom(task, obj))
  for (const cnt of task.containers) results.push(checkContainerInsideRoom(task, cnt))
  results.push(...checkContainerOverlap(task))
  results.push(...checkDoorwayClearance(task))
  results.push(...checkSurfaceHeight(task))
  results.push(...checkObjectOnContainer(task))
  results.push(...checkScriptedEventTargetPositions(task))
  results.push(...proximityToDoorHeuristic(task))
  results.push(...checkContainsObjectIdsAndSurfaceHeightBounds(task))
  results.push(...checkEachRoomHasInteractable(task))
  return results
}

function severityEmoji(s: Severity) {
  return { blocker: '🛑', critical: '🔴', major: '🟠', minor: '🟡', info: '🔵' }[s]
}

export function runLayoutCheckMainAndExit(): never | void {
  const results: QaResult[] = []
  for (const t of taskTemplates) {
    results.push(...checkTaskLayout(t))
  }
  const summary = summarize(results)
  printSummary(summary, 'QA 布局合法性审查（scripts/qa-layout.ts）')

  const rows: string[][] = []
  for (const t of taskTemplates) {
    const sub = summarize(checkTaskLayout(t))
    rows.push([
      t.id,
      `${sub.bySeverity.blocker}`,
      `${sub.bySeverity.critical}`,
      `${sub.bySeverity.major}`,
      `${sub.bySeverity.minor}`,
      `${sub.passed}/${sub.total}`,
    ])
  }
  console.log('\n📋 按任务拆分:')
  console.log(formatTable(rows, ['taskId', 'Blocker', 'Critical', 'Major', 'Minor', 'Pass/Total']))

  if (summary.failed > 0) {
    console.log('\n🔴 失败条目 TOP 30（按严重级）:')
    let shown = 0
    for (const r of summary.results) {
      if (r.passed) continue
      if (shown >= 30) break
      shown += 1
      console.log(
        `  ${severityEmoji(r.severity)} [${String(r.severity).toUpperCase()}] ${r.check}  ${r.message}`,
      )
    }
  }

  if (typeof process !== 'undefined' && process.env.VITEST !== 'true') {
    exitWithCode(summary)
  }
}

if (typeof process !== 'undefined' && process.env.VITEST !== 'true') {
  runLayoutCheckMainAndExit()
}
