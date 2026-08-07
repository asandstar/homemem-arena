/**
 * src/game/lineOfSight.ts
 *
 * F4 · 视线遮挡（Line of Sight）判定 —— 纯数学，零 React/Three 依赖。
 *
 * 背景：TaskTargetGlow / proximityGlow / demoHighlight 三类高亮此前只看距离或状态，
 * 不检查中间是否有家具遮挡，导致钥匙在沙发后面时高亮环穿透沙发显示。
 *
 * 方案：Ray-AABB Slab method 纯数学实现，不依赖 THREE.Raycaster / mesh 注册。
 * - 从玩家眼睛（y=1.6）射向物体中心，检查射线是否在到达目标前进入任何遮挡物 AABB。
 * - 遮挡物 = 当前房间的 decorFurniture（过滤 collisionMode='none'）+ task.containers。
 */

import type { Vec3, RoomId } from '../types/room'
import { roomDecorFurniture } from '../data/decorFurniture'
import { sharedRooms } from '../data/rooms'

/** 轴对齐包围盒（世界坐标） */
export interface OccluderAABB {
  min: Vec3
  max: Vec3
}

/** 容器最小接口（只需要 position/size/room 即可构建 AABB） */
export interface ContainerLike {
  position: Vec3
  size: Vec3
  room: RoomId
}

/** 第一人称眼睛高度（与 playerControls.ts PLAYER_HEIGHT 一致） */
const EYE_HEIGHT = 1.6

/**
 * Ray-AABB 相交测试（Slab method）。
 *
 * @param origin 射线起点
 * @param dir    射线方向（已归一化）
 * @param min    AABB 最小角
 * @param max    AABB 最大角
 * @returns 射线进入 AABB 的参数 t（>0 表示在前方相交），null 表示不相交或起点在盒内
 */
function rayAabbEnter(origin: Vec3, dir: Vec3, min: Vec3, max: Vec3): number | null {
  let tMin = -Infinity
  let tMax = Infinity

  // X 轴 slab
  if (Math.abs(dir.x) < 1e-9) {
    if (origin.x < min.x || origin.x > max.x) return null
  } else {
    let t1 = (min.x - origin.x) / dir.x
    let t2 = (max.x - origin.x) / dir.x
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return null
  }

  // Y 轴 slab
  if (Math.abs(dir.y) < 1e-9) {
    if (origin.y < min.y || origin.y > max.y) return null
  } else {
    let t1 = (min.y - origin.y) / dir.y
    let t2 = (max.y - origin.y) / dir.y
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return null
  }

  // Z 轴 slab
  if (Math.abs(dir.z) < 1e-9) {
    if (origin.z < min.z || origin.z > max.z) return null
  } else {
    let t1 = (min.z - origin.z) / dir.z
    let t2 = (max.z - origin.z) / dir.z
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return null
  }

  // tMin 是射线进入 AABB 的参数
  // tMin < 0 表示射线起点在 AABB 内部 → 物体在遮挡物内部不算被挡
  if (tMin < 0) return null
  return tMin
}

/**
 * 判断从 fromPos 到 targetPos 的视线是否被任何遮挡物 AABB 挡住。
 *
 * @param fromPos   观察者位置（世界坐标）
 * @param targetPos 目标位置（世界坐标）
 * @param occluders 遮挡物 AABB 列表（世界坐标）
 * @returns true = 视线通畅（无遮挡），false = 被遮挡
 */
export function hasLineOfSight(
  fromPos: Vec3,
  targetPos: Vec3,
  occluders: OccluderAABB[],
): boolean {
  const dx = targetPos.x - fromPos.x
  const dy = targetPos.y - fromPos.y
  const dz = targetPos.z - fromPos.z
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
  if (dist < 0.01) return true // 太近，不需要遮挡判断

  const dir: Vec3 = { x: dx / dist, y: dy / dist, z: dz / dist }

  for (const occ of occluders) {
    const tEnter = rayAabbEnter(fromPos, dir, occ.min, occ.max)
    if (tEnter !== null && tEnter < dist) {
      // 射线在到达目标之前就进入了遮挡物 → 被遮挡
      return false
    }
  }
  return true
}

/**
 * 构建指定房间的遮挡物 AABB 列表（世界坐标）。
 *
 * 数据来源：
 *  - roomDecorFurniture[roomId]：背景家具，过滤 collisionMode === 'none'（画/钟/地毯等）
 *  - containers：任务容器，只取 room 匹配的
 *
 * 坐标转换：decorFurniture / container 的 position 是房间局部坐标，
 * 需叠加 sharedRooms[roomId].center 得到世界坐标。
 */
export function buildRoomOccluders(
  roomId: RoomId,
  containers: ContainerLike[] = [],
): OccluderAABB[] {
  const room = sharedRooms[roomId]
  if (!room) return []
  const cx = room.center.x
  const cz = room.center.z

  const occluders: OccluderAABB[] = []

  // 装饰家具（过滤不参与碰撞的纯装饰）
  const decors = roomDecorFurniture[roomId] ?? []
  for (const d of decors) {
    if (d.collisionMode === 'none') continue
    const wx = cx + d.position.x
    const wz = cz + d.position.z
    occluders.push({
      min: { x: wx - d.size.x / 2, y: d.position.y, z: wz - d.size.z / 2 },
      max: { x: wx + d.size.x / 2, y: d.position.y + d.size.y, z: wz + d.size.z / 2 },
    })
  }

  // 任务容器
  for (const c of containers) {
    if (c.room !== roomId) continue
    const wx = cx + c.position.x
    const wz = cz + c.position.z
    occluders.push({
      min: { x: wx - c.size.x / 2, y: c.position.y, z: wz - c.size.z / 2 },
      max: { x: wx + c.size.x / 2, y: c.position.y + c.size.y, z: wz + c.size.z / 2 },
    })
  }

  return occluders
}

/**
 * 计算玩家眼睛位置（世界坐标）。
 * robotPosition.y 通常为 0（地面），眼睛在 PLAYER_HEIGHT 高度。
 */
export function getEyePosition(robotPosition: Vec3): Vec3 {
  return { x: robotPosition.x, y: EYE_HEIGHT, z: robotPosition.z }
}

/**
 * 两个 Set<string> 内容是否相同（用于 React state 引用稳定化）。
 */
export function stringSetEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const id of a) {
    if (!b.has(id)) return false
  }
  return true
}
