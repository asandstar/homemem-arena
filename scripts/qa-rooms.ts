import { sharedRooms } from '../src/data/rooms'
import { taskTemplates } from '../src/data/tasks'
import { pass, fail, summarize, printSummary, exitWithCode, formatTable } from './qa-shared'
import type { QaResult } from './qa-shared'
import type { RoomId, RoomSpec } from '../src/types/room'

const CATEGORY = 'rooms'

function checkUniqueIds(rooms: Record<string, RoomSpec>): QaResult {
  const ids = Object.keys(rooms)
  const unique = new Set(ids)
  if (ids.length === unique.size) {
    return pass(CATEGORY, 'unique-ids', `所有 ${ids.length} 个房间 ID 唯一`)
  }
  return fail('blocker', CATEGORY, 'unique-ids', '存在重复的房间 ID')
}

function checkSizeValid(rooms: Record<string, RoomSpec>): QaResult[] {
  const results: QaResult[] = []
  for (const [id, room] of Object.entries(rooms)) {
    if (room.size.x > 0 && room.size.z > 0) {
      results.push(pass(CATEGORY, 'size-valid', `${id} 尺寸有效 (${room.size.x}x${room.size.z})`))
    } else {
      results.push(
        fail('blocker', CATEGORY, 'size-valid', `${id} 尺寸无效 x=${room.size.x} z=${room.size.z}`),
      )
    }
  }
  return results
}

const ROOM_EPSILON = 0.01 // 共享墙/浮点误差容差，小于该厚度不算真实重叠

export function roomsOverlap(a: RoomSpec, b: RoomSpec): boolean {
  const ax1 = a.center.x - a.size.x / 2
  const ax2 = a.center.x + a.size.x / 2
  const az1 = a.center.z - a.size.z / 2
  const az2 = a.center.z + a.size.z / 2
  const bx1 = b.center.x - b.size.x / 2
  const bx2 = b.center.x + b.size.x / 2
  const bz1 = b.center.z - b.size.z / 2
  const bz2 = b.center.z + b.size.z / 2
  // AABB 严格重叠：交叠厚度必须 > ROOM_EPSILON 才算真实重叠
  const xOverlap = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1))
  const zOverlap = Math.max(0, Math.min(az2, bz2) - Math.max(az1, bz1))
  return xOverlap > ROOM_EPSILON && zOverlap > ROOM_EPSILON
}

function checkNoOverlap(rooms: Record<string, RoomSpec>): QaResult[] {
  const results: QaResult[] = []
  const ids = Object.keys(rooms) as RoomId[]
  let hasOverlap = false

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = rooms[ids[i]]
      const b = rooms[ids[j]]
      if (roomsOverlap(a, b)) {
        hasOverlap = true
        results.push(
          fail('blocker', CATEGORY, 'no-overlap', `${ids[i]} 与 ${ids[j]} 位置重叠`),
        )
      }
    }
  }

  if (!hasOverlap) {
    results.push(pass(CATEGORY, 'no-overlap', `所有 ${ids.length} 个房间无重叠`))
  }

  return results
}

function checkDoorways(rooms: Record<string, RoomSpec>): QaResult[] {
  const results: QaResult[] = []
  const roomIds = new Set(Object.keys(rooms))
  const forwardConnections = new Map<string, Set<string>>()

  for (const [id, room] of Object.entries(rooms)) {
    forwardConnections.set(id, new Set())
    for (const door of room.doorways) {
      if (roomIds.has(door.connectsTo)) {
        results.push(
          pass(CATEGORY, 'doorway-valid', `${id} → ${door.connectsTo} 门连接有效`),
        )
        forwardConnections.get(id)!.add(door.connectsTo)
      } else {
        results.push(
          fail('blocker', CATEGORY, 'doorway-valid', `${id} 的门指向不存在的房间: ${door.connectsTo}`),
        )
      }
    }
  }

  for (const [from, targets] of forwardConnections.entries()) {
    for (const target of targets) {
      const reverse = forwardConnections.get(target)
      if (!reverse || !reverse.has(from)) {
        results.push(
          fail('minor', CATEGORY, 'bidirectional-door', `${from} → ${target} 没有反向门`),
        )
      }
    }
  }

  return results
}

function checkTaskRooms(): QaResult[] {
  const results: QaResult[] = []
  const roomIds = new Set(Object.keys(sharedRooms))

  for (const task of taskTemplates) {
    const missing = task.rooms.filter((r) => !roomIds.has(r))
    if (missing.length === 0) {
      results.push(
        pass(CATEGORY, 'task-rooms-valid', `${task.id} 引用的 ${task.rooms.length} 个房间都存在`),
      )
    } else {
      results.push(
        fail('blocker', CATEGORY, 'task-rooms-valid', `${task.id} 引用不存在的房间: ${missing.join(', ')}`),
      )
    }
  }

  return results
}

function checkLevel1Requirements(): QaResult[] {
  const results: QaResult[] = []
  // Three-level MVP: L1 餐桌整理 / task-clean-table（Symbolic Memory 教学关，只需 dining 餐厨）
  const level1 = taskTemplates.find((t) => t.id === 'task-clean-table')

  if (!level1) {
    results.push(fail('critical', CATEGORY, 'level1-exists', '找不到 L1 餐桌整理（task-clean-table）'))
    return results
  }
  results.push(pass(CATEGORY, 'level1-exists', `L1 餐桌整理已找到（id=${level1.id}, name=${level1.name}）`))

  const required: string[] = ['dining']
  for (const roomId of required) {
    if (level1.rooms.includes(roomId as RoomId)) {
      results.push(pass(CATEGORY, 'level1-room', `L1 餐桌整理包含 ${roomId}`))
    } else {
      results.push(fail('critical', CATEGORY, 'level1-room', `L1 餐桌整理缺少房间: ${roomId}`))
    }
  }

  return results
}

function checkLevel2Requirements(): QaResult[] {
  const results: QaResult[] = []
  // L2 钥匙猫的清晨恶作剧 / task-leave-home（Spatial Memory 旗舰关，4 房间跨房间寻物）
  // 设计文档 docs/DESIGN_LEVEL_TASKS.md §3.2.3：living、bedroom、dining、entrance
  const level2 = taskTemplates.find((t) => t.id === 'task-leave-home')

  if (!level2) {
    results.push(fail('critical', CATEGORY, 'level2-exists', '找不到 L2 钥匙猫的清晨恶作剧（task-leave-home）'))
    // 后续餐厨一体检查仍然执行，直接返回
  } else {
    results.push(pass(CATEGORY, 'level2-exists', `L2 钥匙猫的清晨恶作剧已找到（id=${level2.id}, name=${level2.name}）`))
    const required: string[] = ['living', 'bedroom', 'dining', 'entrance']
    for (const roomId of required) {
      if (level2.rooms.includes(roomId as RoomId)) {
        results.push(pass(CATEGORY, 'level2-room', `L2 钥匙猫的清晨恶作剧包含 ${roomId}`))
      } else {
        results.push(fail('critical', CATEGORY, 'level2-room', `L2 钥匙猫的清晨恶作剧缺少房间: ${roomId}`))
      }
    }
  }

  // A1.5 后合并 kitchen 与 dining 为一个 dining（餐厨一体），只要包含 dining 即视为同时有餐厨能力
  const diningLevels = taskTemplates.filter((t) => t.rooms.includes('dining' as RoomId))

  if (diningLevels.length === 0) {
    results.push(fail('critical', CATEGORY, 'dining-level', '没有包含餐厨（dining）的关卡'))
    return results
  }

  for (const task of diningLevels) {
    results.push(pass(CATEGORY, 'dining-kitchen', `${task.id} 包含 dining（餐厨一体）`))
  }

  return results
}

function checkLevel3Requirements(): QaResult[] {
  const results: QaResult[] = []
  // Three-level MVP: L3 洗衣分拣 / task-laundry-sort（Integrated Memory 整合记忆，只需 laundry 洗衣房）
  const level3 = taskTemplates.find((t) => t.id === 'task-laundry-sort')

  if (!level3) {
    results.push(fail('critical', CATEGORY, 'level3-exists', '找不到 L3 洗衣分拣（task-laundry-sort）'))
    return results
  }
  results.push(pass(CATEGORY, 'level3-exists', `L3 洗衣分拣已找到（id=${level3.id}, name=${level3.name}）`))

  const required: string[] = ['laundry']
  for (const roomId of required) {
    if (level3.rooms.includes(roomId as RoomId)) {
      results.push(pass(CATEGORY, 'level3-room', `L3 洗衣分拣包含 ${roomId}`))
    } else {
      results.push(fail('critical', CATEGORY, 'level3-room', `L3 洗衣分拣缺少房间: ${roomId}`))
    }
  }

  return results
}

function checkLaundryNoLivingOverlap(): QaResult[] {
  const results: QaResult[] = []
  const laundry = sharedRooms['laundry' as RoomId]
  const living = sharedRooms['living' as RoomId]

  if (laundry && living) {
    if (!roomsOverlap(laundry, living)) {
      results.push(pass(CATEGORY, 'laundry-no-living-overlap', '洗衣房与客厅不重叠'))
    } else {
      results.push(fail('major', CATEGORY, 'laundry-no-living-overlap', '洗衣房与客厅位置重叠'))
    }
  }

  return results
}

function printRoomTable(): void {
  const rows = Object.entries(sharedRooms).map(([id, room]) => [
    id,
    room.name,
    `(${room.center.x}, ${room.center.z})`,
    `${room.size.x}x${room.size.z}`,
    room.doorways.length.toString(),
  ])
  console.log('\n📋 房间布局表:')
  console.log(formatTable(rows, ['id', 'name', 'center(x,z)', 'size', 'doors']))
}

function runRoomsCheck(): QaResult[] {
  const results: QaResult[] = []

  console.log('🔍 检查房间 ID 唯一性...')
  results.push(checkUniqueIds(sharedRooms))

  console.log('🔍 检查房间尺寸...')
  results.push(...checkSizeValid(sharedRooms))

  console.log('🔍 检查房间重叠...')
  results.push(...checkNoOverlap(sharedRooms))

  console.log('🔍 检查门连接...')
  results.push(...checkDoorways(sharedRooms))

  console.log('🔍 检查任务房间引用...')
  results.push(...checkTaskRooms())

  console.log('🔍 检查第一关要求...')
  results.push(...checkLevel1Requirements())

  console.log('🔍 检查第二关要求...')
  results.push(...checkLevel2Requirements())

  console.log('🔍 检查第三关要求...')
  results.push(...checkLevel3Requirements())

  console.log('🔍 检查洗衣房位置...')
  results.push(...checkLaundryNoLivingOverlap())

  printRoomTable()

  return results
}

if (typeof process !== 'undefined' && process.env.VITEST !== 'true') {
  const results = runRoomsCheck()
  const summary = summarize(results)
  printSummary(summary, 'QA: Rooms Check')
  exitWithCode(summary)
}
