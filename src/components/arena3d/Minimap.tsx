import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { sharedRooms } from '../../data/rooms'
import { roomDecorFurniture } from '../../data/decorFurniture'
import { useUiStore } from '../../store/useUiStore'
import type { RoomId } from '../../types/room'
import type { EntityState } from '../../types/object'
import type { MemorySlot } from '../../store/gameTypes'
import type { ContainerSpec } from '../../types/object'

interface MinimapProps {
  currentRoom: RoomId
  visitedRooms: RoomId[]
  robotPosition: { x: number; y: number; z: number }
  robotRotation?: number
  observedObjects: EntityState[]
  isVisible?: boolean
  taskRooms?: RoomId[]
  isMobile?: boolean
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  memorySlots?: (MemorySlot | null)[]
  /** 当前房间的任务容器（不传则不画容器图标；仅读取坐标/尺寸/目标区标记，不改任何值） */
  roomContainers?: ContainerSpec[]
}

const MIN_ZOOM = 0.3
const MAX_ZOOM = 6.0
const WHEEL_SENSITIVITY = 0.001
const FOLLOW_LERP = 0.12

const ROOM_SHORT_NAME: Record<string, string> = {
  living: '客厅',
  bedroom: '卧室',
  kitchen: '厨房',
  entrance: '玄关',
  laundry: '洗衣房',
  dining: '餐厅',
}

export function Minimap({
  currentRoom,
  visitedRooms,
  robotPosition,
  robotRotation = 0,
  observedObjects,
  isVisible = true,
  taskRooms,
  isMobile = false,
  isFullscreen = false,
  onToggleFullscreen,
  memorySlots = [],
  roomContainers = [],
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  )
  const [dimensions, setDimensions] = useState({ width: 260, height: 260 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const panStartRef = useRef({ x: 0, y: 0 })
  const smoothedPanRef = useRef({ x: 0, y: 0 })
  const manualZoomRef = useRef(false)

  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const minimapZoom = useUiStore((s) => s.minimapZoom)
  const minimapPan = useUiStore((s) => s.minimapPan)
  const minimapFollowPlayer = useUiStore((s) => s.minimapFollowPlayer)
  const minimapOpen = useUiStore((s) => s.minimapOpen)
  const setMinimapZoom = useUiStore((s) => s.setMinimapZoom)
  const setMinimapPan = useUiStore((s) => s.setMinimapPan)
  const setMinimapFollowPlayer = useUiStore((s) => s.setMinimapFollowPlayer)
  const toggleMinimap = useUiStore((s) => s.toggleMinimap)

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const panelPx: { w: number; h: number } = useMemo(() => {
    if (isFullscreen) return { w: 0, h: 0 }
    if (isMobile) return { w: 200, h: 220 }
    if (viewportWidth >= 1600) return { w: 260, h: 280 }
    if (viewportWidth >= 1280) return { w: 230, h: 250 }
    return { w: 200, h: 220 }
  }, [viewportWidth, isFullscreen, isMobile])

  const roomsToShow = useMemo(() => {
    const ids = taskRooms && taskRooms.length > 0 ? taskRooms : (Object.keys(sharedRooms) as RoomId[])
    return ids.map((id) => [id, sharedRooms[id]] as [RoomId, typeof sharedRooms[RoomId]])
  }, [taskRooms])

  const currentRoomSpec = sharedRooms[currentRoom]

  // 当 currentRoom 变化 或 尺寸变化 → 重新拟合当前房间（占画布 70%~85%）
  const computeFitZoomCurrentRoom = useCallback((): { zoom: number; pan: { x: number; y: number } } => {
    const { width, height } = dimensions
    if (!currentRoomSpec || width <= 0 || height <= 0) return { zoom: 1, pan: { x: 0, y: 0 } }
    const paddingPx = Math.max(20, Math.min(28, Math.floor(Math.min(width, height) * 0.12)))
    const usableWidth = Math.max(40, width - paddingPx * 2)
    const usableHeight = Math.max(40, height - paddingPx * 2)
    const roomX = Math.max(1, currentRoomSpec.size.x)
    const roomZ = Math.max(1, currentRoomSpec.size.z)
    const fitScale = Math.min(usableWidth / roomX, usableHeight / roomZ)

    // 在 room-local 坐标系中：room 中心 = currentRoomSpec.center；canvas 中心 = room center 所在位置
    // pan = -room.center * scale，这样 room.center 正好落在 (width/2, height/2)
    const panX = -currentRoomSpec.center.x * fitScale
    const panY = currentRoomSpec.center.z * fitScale
    return { zoom: fitScale, pan: { x: panX, y: panY } }
  }, [dimensions, currentRoomSpec])

  // 当 room 或 dimensions 变化时重置（相当于 fit）
  useEffect(() => {
    if (!currentRoomSpec) return
    const { zoom, pan } = computeFitZoomCurrentRoom()
    console.log('[MINIMAP EFFECT FIT] zoom=', zoom.toFixed(3), 'pan=(' + pan.x.toFixed(1) + ',' + pan.y.toFixed(1) + ') manualZoom=', manualZoomRef.current, 'dim=(' + dimensions.width.toFixed(0) + ',' + dimensions.height.toFixed(0) + ') currentRoom=', currentRoom)
    setMinimapZoom(zoom)
    setMinimapPan(pan)
    manualZoomRef.current = false
    smoothedPanRef.current = { ...pan }
  }, [currentRoom, computeFitZoomCurrentRoom, currentRoomSpec, setMinimapZoom, setMinimapPan, dimensions])

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const newW = rect.width * dpr
        const newH = rect.height * dpr
        console.log('[MINIMAP EFFECT SIZE] updateSize: rect=', Math.round(rect.width),'x',Math.round(rect.height), '→ newDim=', newW.toFixed(0),'x',newH.toFixed(0), 'panelPx=', panelPx.w, 'x', panelPx.h, 'isFullscreen=', isFullscreen)
        setDimensions({ width: newW, height: newH })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [panelPx, isFullscreen])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(true)
    setMinimapFollowPlayer(false)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    panStartRef.current = { ...minimapPan }
    manualZoomRef.current = true
    if (canvasRef.current) {
      canvasRef.current.setPointerCapture(e.pointerId)
    }
  }, [minimapPan, setMinimapFollowPlayer])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    e.stopPropagation()
    e.preventDefault()
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setMinimapPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    })
  }, [isDragging, setMinimapPan])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(false)
    if (canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(e.pointerId)
      } catch {}
    }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const delta = e.deltaY * WHEEL_SENSITIVITY
    setMinimapZoom((prev) => {
      manualZoomRef.current = true
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev - delta))
    })
  }, [setMinimapZoom])

  const handleReset = useCallback(() => {
    const { zoom, pan } = computeFitZoomCurrentRoom()
    setMinimapZoom(zoom)
    setMinimapPan(pan)
    setMinimapFollowPlayer(false)
    manualZoomRef.current = false
    smoothedPanRef.current = { ...pan }
  }, [computeFitZoomCurrentRoom, setMinimapZoom, setMinimapPan, setMinimapFollowPlayer])

  const handleZoomIn = useCallback(() => {
    setMinimapZoom((prev) => Math.min(MAX_ZOOM, prev * 1.2))
    manualZoomRef.current = true
  }, [setMinimapZoom])

  const handleZoomOut = useCallback(() => {
    setMinimapZoom((prev) => Math.max(MIN_ZOOM, prev / 1.2))
    manualZoomRef.current = true
  }, [setMinimapZoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)

    const scale = minimapZoom

    let offsetX = width / 2 + minimapPan.x
    let offsetY = height / 2 + minimapPan.y

    if (minimapFollowPlayer) {
      const targetPanX = -robotPosition.x * scale
      const targetPanY = robotPosition.z * scale
      smoothedPanRef.current.x += (targetPanX - smoothedPanRef.current.x) * FOLLOW_LERP
      smoothedPanRef.current.y += (targetPanY - smoothedPanRef.current.y) * FOLLOW_LERP
      offsetX = width / 2 + smoothedPanRef.current.x
      offsetY = height / 2 + smoothedPanRef.current.y
    } else {
      smoothedPanRef.current.x = minimapPan.x
      smoothedPanRef.current.y = minimapPan.y
    }

    const adjacentRoomIds = new Set<RoomId>(
      sharedRooms[currentRoom]?.doorways.map((d) => d.connectsTo) ?? []
    )

    // 全屏模式下绘制全部房间
    if (isFullscreen) {
      roomsToShow.forEach(([roomId, roomSpec]) => {
        const isVisited = visitedRooms.includes(roomId as RoomId)
        const isCurrent = currentRoom === roomId
        const isAdjacent = adjacentRoomIds.has(roomId as RoomId)

        const x = roomSpec.center.x * scale + offsetX
        const y = -roomSpec.center.z * scale + offsetY
        const w = roomSpec.size.x * scale
        const h = roomSpec.size.z * scale

        ctx.fillStyle = isCurrent
          ? 'rgba(245, 158, 11, 0.35)'
          : isVisited
          ? 'rgba(96, 165, 250, 0.22)'
          : 'rgba(75, 85, 99, 0.12)'
        ctx.strokeStyle = isCurrent ? '#f59e0b' : isAdjacent ? '#22c55e' : isVisited ? '#60a5fa' : '#4b5563'
        ctx.lineWidth = isCurrent ? 4 : isAdjacent ? 3 : 2

        ctx.beginPath()
        ctx.roundRect(x - w / 2, y - h / 2, w, h, 8)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = isCurrent ? '#fbbf24' : isVisited ? '#93c5fd' : '#9ca3af'
        const fontSize = Math.max(10, Math.min(14, scale * 0.9))
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(roomSpec.name, x, y)
      })
    } else {
      // ============== 默认模式：只高亮当前房间 + 绘制门洞 ==============
      if (currentRoomSpec) {
        const room = currentRoomSpec
        const cx = room.center.x * scale + offsetX
        const cy = -room.center.z * scale + offsetY
        const rw = room.size.x * scale
        const rh = room.size.z * scale
        const left = cx - rw / 2
        const top = cy - rh / 2
        const right = cx + rw / 2
        const bottom = cy + rh / 2
        const borderW = Math.max(3, Math.round(scale * 0.35))
        const gapColor = '#0f172a'

        // Step1: 先填充房间底色
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)'
        ctx.fillRect(left, top, rw, rh)

        // Step2: 计算每个 doorway 墙体缺口（doorways.offset 是 room center 为原点的偏移，门口宽 doorway.width）
        // 墙体绘制思路：先画完整外框，再用 gapColor 擦除缺口段，最后在缺口处叠加绿色通行细线与房间简称文字
        const doorways = room.doorways ?? []
        const gapSegments: Array<{ ax: number; ay: number; bx: number; by: number; side: string; connectsTo: string; width: number; offsetPx: number }> = []

        for (const dw of doorways) {
          const offX = dw.offset.x * scale
          const offZ = -dw.offset.z * scale
          const dwCenterX = cx + offX
          const dwCenterY = cy + offZ
          const dwWidthPx = Math.max(12, dw.width * scale)
          // 判断在哪面墙：offset.x === -size.x/2 -> 西墙；+size.x/2 -> 东墙；offset.z === -size.z/2 -> 北墙；+size.z/2 -> 南墙（注意 z 翻转）
          const roomHalfX = room.size.x * scale / 2
          const roomHalfZ = room.size.z * scale / 2
          const EPS = Math.max(2, scale * 0.1)
          let side = 'unknown'
          if (Math.abs(offX + roomHalfX) < EPS) side = 'west'
          else if (Math.abs(offX - roomHalfX) < EPS) side = 'east'
          else if (Math.abs(offZ + roomHalfZ) < EPS) side = 'north' // Three.js -z 前进 -> minimap 上侧
          else if (Math.abs(offZ - roomHalfZ) < EPS) side = 'south'

          let ax = dwCenterX, ay = dwCenterY, bx = dwCenterX, by = dwCenterY
          if (side === 'west' || side === 'east') {
            ay = dwCenterY - dwWidthPx / 2
            by = dwCenterY + dwWidthPx / 2
          } else {
            ax = dwCenterX - dwWidthPx / 2
            bx = dwCenterX + dwWidthPx / 2
          }
          gapSegments.push({ ax, ay, bx, by, side, connectsTo: dw.connectsTo, width: dwWidthPx, offsetPx: 0 })
        }

        // Step3: 画完整墙框
        ctx.save()
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = borderW
        ctx.lineJoin = 'round'
        ctx.strokeRect(left, top, rw, rh)
        ctx.restore()

        // Step4: 在缺口处用 gapColor 画矩形擦除（把门口涂成底色）
        ctx.save()
        ctx.strokeStyle = gapColor
        ctx.lineWidth = borderW + 2
        ctx.lineCap = 'butt'
        for (const g of gapSegments) {
          ctx.beginPath()
          ctx.moveTo(g.ax, g.ay)
          ctx.lineTo(g.bx, g.by)
          ctx.stroke()
        }
        ctx.restore()

        // Step5: 在缺口位置画绿色通行段 + 相邻房间简称
        ctx.save()
        ctx.lineCap = 'round'
        ctx.font = `bold ${Math.max(10, Math.min(12, Math.floor(scale * 0.55)))}px sans-serif`
        ctx.textBaseline = 'middle'
        for (const g of gapSegments) {
          // 绿色门段
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.95)'
          ctx.lineWidth = Math.max(4, borderW * 0.9)
          ctx.beginPath()
          ctx.moveTo(g.ax, g.ay)
          ctx.lineTo(g.bx, g.by)
          ctx.stroke()

          const mx = (g.ax + g.bx) / 2
          const my = (g.ay + g.by) / 2
          const shortName = ROOM_SHORT_NAME[g.connectsTo] ?? g.connectsTo
          const measure = ctx.measureText(shortName)
          const tw = measure.width + 10
          const th = 18
          let bx0 = mx - tw / 2
          let by0 = my - th / 2
          let align: CanvasTextAlign = 'center'
          // 根据墙侧将文字拉到房间外，避免压在门框上
          if (g.side === 'west') { bx0 = left - tw - 4; by0 = my - th / 2; align = 'left' }
          else if (g.side === 'east') { bx0 = right + 4; by0 = my - th / 2; align = 'left' }
          else if (g.side === 'north') { bx0 = mx - tw / 2; by0 = top - th - 4; align = 'center' }
          else if (g.side === 'south') { bx0 = mx - tw / 2; by0 = bottom + 4; align = 'center' }
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
          ctx.fillRect(bx0, by0, tw, th)
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)'
          ctx.lineWidth = 1
          ctx.strokeRect(bx0, by0, tw, th)
          ctx.fillStyle = '#86efac'
          ctx.textAlign = align
          const tx = align === 'left' ? bx0 + 5 : (align === 'center' ? bx0 + tw / 2 : bx0 + tw - 5)
          const ty = by0 + th / 2
          ctx.fillText(shortName, tx, ty + 1)
        }
        ctx.restore()
      }
    }

    // ============== F1：大号家具简化矩形（只读 decorFurniture 坐标/尺寸，不改任何值）==============
    // 视觉原则：只画 footprint >= 0.8㎡ 的大件，跳过纯墙上挂件（collisionMode==='none'）和极小装饰，避免地图过乱
    const decorList = (roomDecorFurniture as any)[currentRoom] ?? []
    for (const dec of decorList) {
      if (dec.collisionMode === 'none') continue
      const sx = Number(dec.size?.x ?? 0)
      const sz = Number(dec.size?.z ?? 0)
      if (sx < 0.5 || sz < 0.5) continue
      if (sx * sz < 0.8) continue
      const cx = Number(dec.position?.x ?? 0) * scale + offsetX
      const cy = -Number(dec.position?.z ?? 0) * scale + offsetY
      const w = sx * scale
      const h = sz * scale
      ctx.save()
      ctx.fillStyle = 'rgba(148, 163, 184, 0.18)'
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, Math.max(2, scale * 0.25))
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    // ============== F2：关键任务容器图标（只读 task.containers 的坐标/尺寸/目标区标记）==============
    for (const c of roomContainers) {
      const cx = Number(c.position?.x ?? 0) * scale + offsetX
      const cy = -Number(c.position?.z ?? 0) * scale + offsetY
      const sx = Number(c.size?.x ?? 0)
      const sz = Number(c.size?.z ?? 0)
      const w = Math.max(8, sx * scale)
      const h = Math.max(8, sz * scale)
      const isTarget = Boolean((c as any).isTargetZone)
      const isDrawer = Boolean((c as any).isDrawer)
      ctx.save()
      if (isTarget) {
        // 目标区：金色外发光 + 金色双线框
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 1.1)
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)')
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)')
        ctx.fillStyle = glow
        ctx.fillRect(cx - w * 1.2, cy - h * 1.2, w * 2.4, h * 2.4)
        ctx.fillStyle = 'rgba(251, 191, 36, 0.28)'
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.95)'
        ctx.lineWidth = 2.2
      } else if (isDrawer) {
        // 抽屉：深棕描边 + 虚线内部表示"可开合"
        ctx.fillStyle = 'rgba(120, 53, 15, 0.22)'
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.8)'
        ctx.lineWidth = 1.8
      } else {
        // 普通容器：青色细框
        ctx.fillStyle = 'rgba(34, 211, 238, 0.14)'
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)'
        ctx.lineWidth = 1.4
      }
      ctx.beginPath()
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, Math.max(2, scale * 0.15))
      ctx.fill()
      ctx.stroke()
      // 目标区再加中心星/靶心，便于一眼识别
      if (isTarget) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.95)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(cx, cy, Math.min(w, h) * 0.22, 0, Math.PI * 2)
        ctx.moveTo(cx - Math.min(w, h) * 0.32, cy)
        ctx.lineTo(cx + Math.min(w, h) * 0.32, cy)
        ctx.moveTo(cx, cy - Math.min(w, h) * 0.32)
        ctx.lineTo(cx, cy + Math.min(w, h) * 0.32)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ============== 过期记忆空间标记（灰红虚线圆 + ×）= 用旧记忆位置，不泄露新位置 ==============
    for (let i = 0; i < memorySlots.length; i++) {
      const slot = memorySlots[i]
      if (!slot || !slot.outdated || !slot.position) continue
      const px = slot.position.x * scale + offsetX
      const py = -slot.position.z * scale + offsetY
      ctx.save()
      ctx.setLineDash([4, 3])
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'
      ctx.fillStyle = 'rgba(127, 29, 29, 0.18)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])
      // ×
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.95)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(px - 6, py - 6)
      ctx.lineTo(px + 6, py + 6)
      ctx.moveTo(px + 6, py - 6)
      ctx.lineTo(px - 6, py + 6)
      ctx.stroke()
      ctx.restore()
    }

    // ============== F3：有效记忆点（非过期 + 有 position + 有 entity 绑定）= 蓝绿渐变点 + 锁纹 ==============
    for (let i = 0; i < memorySlots.length; i++) {
      const slot = memorySlots[i]
      if (!slot) continue
      if (slot.outdated) continue
      if (!slot.position) continue
      if (!slot.entityConfigId) continue
      const px = slot.position.x * scale + offsetX
      const py = -slot.position.z * scale + offsetY
      const locked = Boolean(slot.locked)
      const conf = Number(slot.confidence ?? 0.5)
      ctx.save()
      // 外圈：颜色按 confidence 从 cyan(高) → blue(中) → slate(低)
      let outer = 'rgba(34, 211, 238, 0.95)'
      let fill = 'rgba(34, 211, 238, 0.35)'
      if (conf < 0.35) {
        outer = 'rgba(100, 116, 139, 0.95)'
        fill = 'rgba(100, 116, 139, 0.2)'
      } else if (conf < 0.7) {
        outer = 'rgba(59, 130, 246, 0.95)'
        fill = 'rgba(59, 130, 246, 0.28)'
      }
      ctx.strokeStyle = outer
      ctx.fillStyle = fill
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.arc(px, py, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // 内圈：实心点
      ctx.fillStyle = outer
      ctx.beginPath()
      ctx.arc(px, py, 3.4, 0, Math.PI * 2)
      ctx.fill()
      // 锁定记忆：加一个小 L 角标在右上角
      if (locked) {
        ctx.fillStyle = 'rgba(22, 163, 74, 0.95)'
        ctx.beginPath()
        ctx.arc(px + 6, py - 6, 3.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 7px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('L', px + 6, py - 6 + 0.5)
      }
      ctx.restore()
    }

    // ============== 观察到的任务物品（小圆点，分层圆环，hidden/held 已在外层过滤）==============
    const objMap = new Map<string, EntityState[]>()
    for (const obj of observedObjects) {
      const key = `${obj.position.x.toFixed(2)}:${obj.position.z.toFixed(2)}`
      if (!objMap.has(key)) objMap.set(key, [])
      objMap.get(key)!.push(obj)
    }
    for (const list of objMap.values()) {
      const o0 = list[0]
      const px = o0.position.x * scale + offsetX
      const py = -o0.position.z * scale + offsetY
      ctx.save()
      // 外层实心
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ecfdf5'
      ctx.lineWidth = 1.5
      ctx.stroke()
      // 多个叠 -> 画内层橘色环表示多物
      if (list.length > 1) {
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(px, py, 2.2, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ============== 玩家位置（高对比描边 + 12~14px 方向箭头）==============
    const robotX = robotPosition.x * scale + offsetX
    const robotY = -robotPosition.z * scale + offsetY

    const glow = ctx.createRadialGradient(robotX, robotY, 0, robotX, robotY, 18)
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.55)')
    glow.addColorStop(1, 'rgba(239, 68, 68, 0)')
    ctx.save()
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(robotX, robotY, 18, 0, Math.PI * 2)
    ctx.fill()

    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(robotX, robotY, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ef4444'
    ctx.lineWidth = 2.2
    const arrowLen = 13
    const aw = 5.2
    const fx = robotX + Math.sin(robotRotation) * arrowLen
    const fy = robotY - Math.cos(robotRotation) * arrowLen
    // 左/右舷
    const leftX = robotX + Math.sin(robotRotation - Math.PI / 2) * aw
    const leftY = robotY - Math.cos(robotRotation - Math.PI / 2) * aw
    const rightX = robotX + Math.sin(robotRotation + Math.PI / 2) * aw
    const rightY = robotY - Math.cos(robotRotation + Math.PI / 2) * aw
    ctx.beginPath()
    ctx.moveTo(fx, fy)
    ctx.lineTo(leftX, leftY)
    ctx.lineTo(rightX, rightY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }, [currentRoom, visitedRooms, robotPosition, robotRotation, observedObjects, dimensions, taskRooms, minimapPan, minimapZoom, roomsToShow, currentRoomSpec, minimapFollowPlayer, memorySlots, isFullscreen, roomContainers])

  if (!isVisible) return null

  if (!minimapOpen) {
    return (
      <button
        onClick={toggleMinimap}
        className="bg-slate-800/90 hover:bg-slate-700 text-white text-sm rounded border border-slate-600/50 px-3 py-2 pointer-events-auto"
        aria-label="展开小地图"
        title="展开小地图"
      >
        🗺️ 地图
      </button>
    )
  }

  // 外层宽度：由 panelPx.w 决定（<1280 可折叠意味着：<1280 下 minimapOpen=false 才折叠；打开时仍然显示 panel 最小宽度）
  const outerW = isFullscreen ? 'auto' : panelPx.w > 0 ? `${panelPx.w}px` : '260px'
  const outerAspect = isFullscreen ? '16 / 10' : '1 / 1'
  const outerMinH = panelPx.h > 0 ? `${panelPx.h}px` : '260px'

  return (
    <div
      ref={containerRef}
      className={`minimap-container ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
      style={{
        touchAction: 'none',
        width: outerW,
        minWidth: isFullscreen ? undefined : '200px',
        minHeight: isFullscreen ? undefined : outerMinH,
        aspectRatio: outerAspect,
        height: isFullscreen ? 'auto' : undefined,
        position: isFullscreen ? 'fixed' : 'relative',
        backgroundColor: isFullscreen ? 'rgba(17, 24, 39, 0.95)' : 'transparent',
        borderRadius: isFullscreen ? '16px' : '8px',
        padding: isFullscreen ? '16px' : '0',
        boxShadow: isFullscreen ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none',
        border: isFullscreen ? '2px solid #374151' : 'none',
      }}
    >
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button
          onClick={handleZoomIn}
          className={`flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white text-xs rounded border border-slate-600/50 pointer-events-auto ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
          aria-label="放大"
          title="放大"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className={`flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white text-xs rounded border border-slate-600/50 pointer-events-auto ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
          aria-label="缩小"
          title="缩小"
        >
          −
        </button>
        {!isMobile && (
          <button
            onClick={handleReset}
            className="w-6 h-6 flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white text-xs rounded border border-slate-600/50 pointer-events-auto"
            aria-label="重新居中（当前房间）"
            title="重新居中（当前房间）"
          >
            ⟳
          </button>
        )}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="w-6 h-6 flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white text-xs rounded border border-slate-600/50 pointer-events-auto"
            aria-label={isFullscreen ? '退出全屏' : '全屏地图'}
            title={isFullscreen ? '退出全屏' : '全屏地图'}
          >
            {isFullscreen ? '▢' : '⛶'}
          </button>
        )}
        <button
          onClick={() => {
            if (isFullscreen && onToggleFullscreen) {
              onToggleFullscreen()
            } else {
              toggleMinimap()
            }
          }}
          className={`flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white text-xs rounded border border-slate-600/50 pointer-events-auto ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
          aria-label="收起小地图"
          title="收起小地图"
        >
          ×
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          border: '2px solid #374151',
          cursor: isDragging ? 'grabbing' : minimapFollowPlayer ? 'default' : 'grab',
          backgroundColor: '#0f172a',
        }}
      />
    </div>
  )
}
