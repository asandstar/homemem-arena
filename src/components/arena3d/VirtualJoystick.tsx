import { useRef, useState, useCallback, useEffect } from 'react'

interface JoystickOutput {
  x: number
  y: number
  active: boolean
}

interface VirtualJoystickProps {
  onMove: (output: JoystickOutput) => void
  size?: number
}

export function VirtualJoystick({ onMove, size = 120 }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const centerRef = useRef({ x: 0, y: 0 })
  const touchIdRef = useRef<number | null>(null)

  const radius = size / 2

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = clientX - centerX
    const dy = clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const normalizedDistance = Math.min(distance, radius) / radius

    const angle = Math.atan2(dy, dx)
    const x = Math.cos(angle) * normalizedDistance
    const y = Math.sin(angle) * normalizedDistance

    setPosition({ x: x * radius, y: y * radius })
    onMove({ x, y, active: true })
  }, [radius, onMove])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
    touchIdRef.current = touch.identifier
    centerRef.current = { x: touch.clientX, y: touch.clientY }
    setActive(true)
    updatePosition(touch.clientX, touch.clientY)
  }, [updatePosition])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchIdRef.current === null) return
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current)
    if (touch) {
      updatePosition(touch.clientX, touch.clientY)
    }
  }, [updatePosition])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current)
    if (touch) {
      touchIdRef.current = null
      setActive(false)
      setPosition({ x: 0, y: 0 })
      onMove({ x: 0, y: 0, active: false })
    }
  }, [onMove])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div
      ref={containerRef}
      className="absolute bottom-6 left-6 touch-none"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full bg-slate-800/60 backdrop-blur-md border border-slate-600/50"
        style={{ transform: 'translate(-50%, 0)' }}
      />
      {active && (
        <div
          className="absolute inset-0 rounded-full bg-purple-500/20 border border-purple-500/40"
          style={{ transform: 'translate(-50%, 0)' }}
        />
      )}
      <div
        ref={knobRef}
        className={`absolute w-20 h-20 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg border-4 border-slate-200/50 transition-transform will-change-transform ${
          active ? 'scale-110' : 'scale-100'
        }`}
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      >
        <div className="absolute inset-2 rounded-full bg-slate-400/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-slate-600/30" />
        </div>
      </div>
    </div>
  )
}