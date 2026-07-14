import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { sharedRooms } from '../../data/rooms'
import { useUiStore } from '../../store/useUiStore'
import type { RoomId } from '../../types/room'
import type { EntityState } from '../../types/object'

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
}

const MIN_ZOOM = 0.3
const MAX_ZOOM = 3.0
const WHEEL_SENSITIVITY = 0.001
const FOLLOW_LERP = 0.12

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
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 280, height: 280 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const panStartRef = useRef({ x: 0, y: 0 })
  const smoothedPanRef = useRef({ x: 0, y: 0 })

  const {
    minimapZoom,
    minimapPan,
    minimapFollowPlayer,
    minimapOpen,
    setMinimapZoom,
    setMinimapPan,
    setMinimapFollowPlayer,
    toggleMinimap,
  } = useUiStore()

  const roomsToShow = useMemo(() => {
    const ids = taskRooms && taskRooms.length > 0 ? taskRooms : (Object.keys(sharedRooms) as RoomId[])
    return ids.map((id) => [id, sharedRooms[id]] as [RoomId, typeof sharedRooms[RoomId]])
  }, [taskRooms])

  const bounds = useMemo(() => {
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    roomsToShow.forEach(([_, spec]) => {
      const halfX = spec.size.x / 2
      const halfZ = spec.size.z / 2
      minX = Math.min(minX, spec.center.x - halfX)
      maxX = Math.max(maxX, spec.center.x + halfX)
      minZ = Math.min(minZ, spec.center.z - halfZ)
      maxZ = Math.max(maxZ, spec.center.z + halfZ)
    })
    if (!isFinite(minX)) {
      return { minX: -10, maxX: 10, minZ: -10, maxZ: 10, centerX: 0, centerZ: 0 }
    }
    return {
      minX,
      maxX,
      minZ,
      maxZ,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
    }
  }, [roomsToShow])

  const computeFitZoom = useCallback(() => {
    const { width, height } = dimensions
    const rangeX = Math.max(bounds.maxX - bounds.minX, 1)
    const rangeZ = Math.max(bounds.maxZ - bounds.minZ, 1)
    const paddingFactor = 0.95
    const scaleX = width / (rangeX * paddingFactor)
    const scaleY = height / (rangeZ * paddingFactor)
    return Math.min(scaleX, scaleY)
  }, [dimensions, bounds])

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        setDimensions({ width: rect.width * dpr, height: rect.height * dpr })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const prevBoundsRef = useRef(bounds)

  useEffect(() => {
    if (
      prevBoundsRef.current.centerX !== bounds.centerX ||
      prevBoundsRef.current.centerZ !== bounds.centerZ
    ) {
      const fitZoom = computeFitZoom()
      setMinimapZoom(fitZoom)
      setMinimapPan({ x: 0, y: 0 })
    }
    prevBoundsRef.current = bounds
  }, [bounds, computeFitZoom, setMinimapZoom, setMinimapPan])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(true)
    setMinimapFollowPlayer(false)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    panStartRef.current = { ...minimapPan }
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
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev - delta))
    })
  }, [setMinimapZoom])

  const handleReset = useCallback(() => {
    const fitZoom = computeFitZoom()
    setMinimapZoom(fitZoom)
    setMinimapPan({ x: 0, y: 0 })
    setMinimapFollowPlayer(false)
  }, [computeFitZoom, setMinimapZoom, setMinimapPan, setMinimapFollowPlayer])

  const handleToggleFollow = useCallback(() => {
    setMinimapFollowPlayer((prev) => !prev)
  }, [setMinimapFollowPlayer])

  const handleZoomIn = useCallback(() => {
    setMinimapZoom((prev) => Math.min(MAX_ZOOM, prev * 1.2))
  }, [setMinimapZoom])

  const handleZoomOut = useCallback(() => {
    setMinimapZoom((prev) => Math.max(MIN_ZOOM, prev / 1.2))
  }, [setMinimapZoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    canvas.width = width
    canvas.height = height

    ctx.fillStyle = '#1f2937'
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

      if (isCurrent) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 2])
        ctx.beginPath()
        ctx.roundRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, 10)
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.fillStyle = isCurrent ? '#fbbf24' : isVisited ? '#93c5fd' : '#9ca3af'
      const fontSize = Math.max(10, Math.min(14, scale * 0.9))
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(roomSpec.name, x, y)
    })

    const robotX = robotPosition.x * scale + offsetX
    const robotY = -robotPosition.z * scale + offsetY

    const gradient = ctx.createRadialGradient(robotX, robotY, 0, robotX, robotY, 14)
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)')
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(robotX, robotY, 14, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(robotX, robotY, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(robotX, robotY, 5, 0, Math.PI * 2)
    ctx.stroke()

    const arrowLen = 6
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(robotX, robotY)
    ctx.lineTo(
      robotX + Math.sin(robotRotation) * arrowLen,
      robotY - Math.cos(robotRotation) * arrowLen
    )
    ctx.stroke()
    ctx.lineCap = 'butt'

    observedObjects.forEach((obj) => {
      const objX = obj.position.x * scale + offsetX
      const objY = -obj.position.z * scale + offsetY

      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(objX, objY, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [currentRoom, visitedRooms, robotPosition, robotRotation, observedObjects, dimensions, taskRooms, minimapPan, minimapZoom, roomsToShow, bounds, minimapFollowPlayer])

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

  return (
    <div
      ref={containerRef}
      className={`minimap-container ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
      style={{
        touchAction: 'none',
        width: isFullscreen ? 'auto' : '100%',
        height: isFullscreen ? 'auto' : 'auto',
        aspectRatio: isFullscreen ? '16 / 10' : '1 / 1',
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
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className={`flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white text-xs rounded border border-slate-600/50 pointer-events-auto ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
          aria-label="缩小"
        >
          −
        </button>
        {!isMobile && (
          <button
            onClick={handleReset}
            className="w-6 h-6 flex items-center justify-center bg-slate-800/90 hover:bg-slate-700 text-white text-xs rounded border border-slate-600/50 pointer-events-auto"
            aria-label="重置视图"
            title="重置视图"
          >
            ⟳
          </button>
        )}
        {!isMobile && (
          <button
            onClick={handleToggleFollow}
            className={`w-6 h-6 flex items-center justify-center text-xs rounded border pointer-events-auto ${
              minimapFollowPlayer
                ? 'bg-amber-600/90 hover:bg-amber-500 text-white border-amber-400/50'
                : 'bg-slate-800/90 hover:bg-slate-700 text-white border-slate-600/50'
            }`}
            aria-label={minimapFollowPlayer ? '取消跟随' : '跟随玩家'}
            title={minimapFollowPlayer ? '取消跟随' : '跟随玩家'}
          >
            ⌖
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
        }}
      />
    </div>
  )
}