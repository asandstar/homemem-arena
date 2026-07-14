import { useMemo } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { sharedRooms } from '../../data/rooms'
import type { RoomId } from '../../types/room'

interface UncollectedItem {
  id: string
  name: string
  room: RoomId
  roomName: string
  worldX: number
  worldZ: number
  isHidden: boolean
}

export function ItemHintIndicator() {
  const { task, entities, achievedGoalIds, robotPosition, robotRotation, stepCount, phase } = useGameStore()

  const uncollectedItems = useMemo<UncollectedItem[]>(() => {
    if (!task || phase !== 'playing' || stepCount < 3) return []

    const items: UncollectedItem[] = []

    task.objects.forEach((obj) => {
      const entity = entities.find((e) => e.configId === obj.id)
      if (!entity) return

      const isCollected = task.goals.some((goal) => {
        if (achievedGoalIds.has(goal.id)) return true
        const snap = {
          configId: entity.configId,
          status: entity.status,
          currentRoom: entity.currentRoom,
          placedIn: entity.placedIn,
          category: entity.category,
          properties: entity.properties,
        }
        try {
          return goal.predicate([snap])
        } catch {
          return false
        }
      })

      if (isCollected) return
      if (entity.status === 'held') return

      const room = sharedRooms[entity.currentRoom]
      if (!room) return

      const worldX = room.center.x + entity.position.x
      const worldZ = room.center.z + entity.position.z

      items.push({
        id: obj.id,
        name: obj.name,
        room: entity.currentRoom,
        roomName: room.name,
        worldX,
        worldZ,
        isHidden: entity.status === 'hidden',
      })
    })

    return items
  }, [task, entities, achievedGoalIds, stepCount, phase])

  if (uncollectedItems.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {uncollectedItems.map((item) => (
        <DirectionalArrow
          key={item.id}
          item={item}
          robotX={robotPosition.x}
          robotZ={robotPosition.z}
          robotRotation={robotRotation}
        />
      ))}
    </div>
  )
}

function DirectionalArrow({
  item,
  robotX,
  robotZ,
  robotRotation,
}: {
  item: UncollectedItem
  robotX: number
  robotZ: number
  robotRotation: number
}) {
  const { angle, distance, screenX, screenY } = useMemo(() => {
    const dx = item.worldX - robotX
    const dz = item.worldZ - robotZ
    const dist = Math.sqrt(dx * dx + dz * dz)

    const itemAngle = Math.atan2(dx, -dz)
    let diff = itemAngle - robotRotation
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2

    const normalizedAngle = diff / Math.PI
    const screenPosX = 50 + normalizedAngle * 45
    const clampedX = Math.max(8, Math.min(92, screenPosX))

    let posY = 50
    if (Math.abs(normalizedAngle) > 0.85) {
      posY = normalizedAngle > 0 ? 88 : 12
    }

    return {
      angle: diff,
      distance: dist,
      screenX: clampedX,
      screenY: posY,
    }
  }, [item, robotX, robotZ, robotRotation])

  const isBehind = Math.abs(angle) > Math.PI * 0.75
  const isClose = distance < 3.5
  const arrowRotation = angle * (180 / Math.PI)

  if (isClose) {
    return (
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
        style={{ left: `${screenX}%`, top: `${screenY}%` }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-green-500/80 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
            {item.name} 就在附近！
          </div>
          <div className="text-[10px] text-green-300/80">{item.roomName}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{ left: `${screenX}%`, top: `${screenY}%` }}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-sm transition-all ${
            isBehind
              ? 'bg-amber-600/70 text-amber-100'
              : 'bg-blue-500/70 text-blue-100'
          } ${item.isHidden ? 'border border-purple-400/50' : ''}`}
        >
          <div
            className="flex h-4 w-4 items-center justify-center transition-transform"
            style={{ transform: `rotate(${isBehind ? 180 : arrowRotation}deg)` }}
          >
            {isBehind ? '▲' : '▼'}
          </div>
          <span className="text-xs font-bold">
            {item.isHidden && '🔒 '}
            {item.name}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/60">
          <span>{item.roomName}</span>
          <span>·</span>
          <span>{distance.toFixed(1)}m</span>
        </div>
      </div>
    </div>
  )
}
