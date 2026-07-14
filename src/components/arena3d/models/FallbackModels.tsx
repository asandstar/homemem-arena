import { PALETTE } from '../materials/palette'

interface FallbackProps {
  size?: { x: number; y: number; z: number }
  isOpen?: boolean
  color?: string
}

const defaultSize = { x: 0.5, y: 0.5, z: 0.5 }

function getSize(size?: { x: number; y: number; z: number }) {
  return size || defaultSize
}

const px = PALETTE.pixelArt

function PixelMaterial({ color, roughness = 0.8, metalness = 0.1 }: { 
  color: string; 
  roughness?: number; 
  metalness?: number 
}) {
  return {
    color,
    roughness,
    metalness,
    flatShading: true as const,
  }
}

export function KeyFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[s.x * 0.18, 0.025, 12, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.35, 0]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
        <torusGeometry args={[s.x * 0.15, 0.015, 8, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.1, 0]}>
        <boxGeometry args={[s.x * 0.65, s.y * 0.14, s.z * 0.12]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.1, s.z * 0.05]}>
        <boxGeometry args={[s.x * 0.6, s.y * 0.1, s.z * 0.03]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.35, s.y * 0.12, 0]}>
        <boxGeometry args={[s.x * 0.1, s.y * 0.18, s.z * 0.12]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <group position={[-s.x * 0.3, s.y * 0.08, 0]}>
        <mesh position={[0, s.y * 0.06, 0]}>
          <boxGeometry args={[s.x * 0.2, s.y * 0.05, s.z * 0.1]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
        </mesh>
        <mesh position={[0, -s.y * 0.05, 0]}>
          <boxGeometry args={[s.x * 0.15, s.y * 0.04, s.z * 0.1]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
        </mesh>
        <mesh position={[s.x * 0.06, s.y * 0.01, 0]}>
          <boxGeometry args={[s.x * 0.08, s.y * 0.06, s.z * 0.1]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
        </mesh>
        <mesh position={[-s.x * 0.05, -s.y * 0.02, 0]}>
          <boxGeometry args={[s.x * 0.06, s.y * 0.03, s.z * 0.1]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.accent_orange, metalness: 0.1 })} />
        </mesh>
      </group>
    </group>
  )
}

export function PhoneFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh>
        <boxGeometry args={[s.x, s.y, s.z * 0.07]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.plastic_black, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, 0, s.z * 0.04]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.88, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.screen_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, 0, -s.z * 0.04]}>
        <boxGeometry args={[s.x * 0.95, s.y * 0.92, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.plastic_black, metalness: 0.2 })} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.4, s.z * 0.05]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.4 })} />
      </mesh>
      <mesh position={[s.x * 0.4, s.y * 0.4, s.z * 0.05]}>
        <sphereGeometry args={[0.012, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.4 })} />
      </mesh>
      <mesh position={[s.x * 0.37, s.y * 0.35, s.z * 0.05]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, -s.y * 0.42, s.z * 0.03]}>
        <boxGeometry args={[s.x * 0.15, s.y * 0.03, s.z * 0.02]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.4 })} />
      </mesh>
      <mesh position={[0, s.y * 0.45, 0]}>
        <cylinderGeometry args={[s.x * 0.02, s.x * 0.02, s.y * 0.02, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.4 })} />
      </mesh>
    </group>
  )
}

export function UmbrellaFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, s.y * 0.55, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.62, s.x * 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[s.x * 0.1, 0.018, 10, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.62, s.x * 0.02]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.01, 0.01, s.x * 0.15, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[s.x * 0.38, s.y * 0.28, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.78, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <coneGeometry args={[s.x * 0.35, s.y * 0.25, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 8
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * s.x * 0.35, s.y * 0.78, Math.sin(angle) * s.x * 0.35]}
            rotation={[0, -angle, Math.PI / 2 - Math.PI / 8]}
          >
            <cylinderGeometry args={[0.006, 0.006, s.y * 0.28, 6]} />
            <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
          </mesh>
        )
      })}
      <mesh position={[0, s.y * 0.95, 0]}>
        <coneGeometry args={[0.018, 0.05, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.97, 0]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function MilkCartonFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.3, 0]}>
        <boxGeometry args={[s.x, s.y * 0.6, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.62, 0]} rotation={[Math.PI / 7, 0, 0]}>
        <boxGeometry args={[s.x, s.y * 0.32, 0.02]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.62, 0]} rotation={[-Math.PI / 7, 0, 0]}>
        <boxGeometry args={[s.x, s.y * 0.32, 0.02]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.62, s.z * 0.45]}>
        <boxGeometry args={[s.x * 0.95, s.y * 0.3, s.z * 0.08]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.62, -s.z * 0.45]}>
        <boxGeometry args={[s.x * 0.95, s.y * 0.3, s.z * 0.08]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.3, s.z / 2 + 0.008]}>
        <boxGeometry args={[s.x * 0.72, s.y * 0.4, 0.01]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_blue, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.25, s.z / 2 + 0.012]}>
        <boxGeometry args={[s.x * 0.5, s.y * 0.1, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.78, 0]}>
        <boxGeometry args={[s.x * 0.18, s.y * 0.06, s.z * 0.18]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.82, 0]}>
        <cylinderGeometry args={[s.x * 0.08, s.x * 0.06, s.y * 0.04, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function CerealBoxFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.food_orange, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, 0, s.z / 2 + 0.008]}>
        <boxGeometry args={[s.x * 0.88, s.y * 0.75, 0.01]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.food_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.6, s.z / 2 + 0.012]}>
        <boxGeometry args={[s.x * 0.6, s.y * 0.2, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.25, s.z / 2 + 0.012]}>
        <boxGeometry args={[s.x * 0.5, s.y * 0.15, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.01, 0]}>
        <boxGeometry args={[s.x * 0.95, 0.015, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.paper, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.025, 0]}>
        <boxGeometry args={[s.x * 0.9, 0.01, s.z * 0.9]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.03, 0]} rotation={[0, 0, Math.PI / 14]}>
        <boxGeometry args={[s.x * 0.08, 0.012, s.z * 0.85]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.food_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.03, 0]} rotation={[0, 0, -Math.PI / 14]}>
        <boxGeometry args={[s.x * 0.08, 0.012, s.z * 0.85]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.food_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.4, s.y * 0.7, 0]}>
        <boxGeometry args={[s.x * 0.05, s.y * 0.15, s.z * 0.05]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_purple, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function CupFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.38, 0]}>
        <cylinderGeometry args={[s.x / 2, s.x / 2 * 0.82, s.y * 0.76, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.82, 0]}>
        <cylinderGeometry args={[s.x / 2 + 0.025, s.x / 2 + 0.025, 0.035, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.83, 0]}>
        <cylinderGeometry args={[s.x / 2 - 0.025, s.x / 2 - 0.025, 0.012, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.7, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.88, s.x / 2 * 0.75, s.y * 0.5, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x / 2 + 0.06, s.y * 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[s.x * 0.18, 0.022, 10, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x / 2 + 0.09, s.y * 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[s.x * 0.14, 0.015, 8, 12]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.12, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.82, s.x / 2 * 0.7, s.y * 0.15, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.05, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.75, s.x / 2 * 0.65, s.y * 0.06, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
    </group>
  )
}

export function BowlFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.28, 0]}>
        <cylinderGeometry args={[s.x / 2, s.x / 2 * 0.65, s.y * 0.56, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.food_orange, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.58, 0]}>
        <cylinderGeometry args={[s.x / 2 + 0.025, s.x / 2 + 0.025, 0.035, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.food_orange, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.59, 0]}>
        <cylinderGeometry args={[s.x / 2 - 0.025, s.x / 2 - 0.025, 0.015, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.food_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.45, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.85, s.x / 2 * 0.55, s.y * 0.35, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.25, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.6, s.x / 2 * 0.5, s.y * 0.2, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.06, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.5, s.x / 2 * 0.4, s.y * 0.08, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.02, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.55, s.x / 2 * 0.48, s.y * 0.04, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_light, metalness: 0.2 })} />
      </mesh>
    </group>
  )
}

export function PlateFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.25, 0]}>
        <cylinderGeometry args={[s.x / 2, s.x / 2 * 0.92, s.y * 0.5, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.5, 0]}>
        <cylinderGeometry args={[s.x / 2, s.x / 2 * 0.88, 0.02, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.52, 0]}>
        <cylinderGeometry args={[s.x / 2 + 0.03, s.x / 2 + 0.03, 0.025, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.48, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.8, s.x / 2 * 0.75, s.y * 0.4, 20]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.1, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.6, s.x / 2 * 0.55, s.y * 0.15, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.02, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.7, s.x / 2 * 0.6, s.y * 0.04, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.55, 0]}>
        <ringGeometry args={[s.x / 2 * 0.65, s.x / 2 * 0.75, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function RemoteFallback({ size }: FallbackProps) {
  const s = getSize(size)
  const buttonRows = 6
  const buttonCols = 3
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.plastic_black, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, 0, s.z / 2 + 0.008]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.95, 0.008]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.plastic_black, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.3, s.z / 2 + 0.012]}>
        <boxGeometry args={[s.x * 0.3, s.y * 0.18, 0.01]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.1, s.y * 0.3, s.z / 2 + 0.018]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.1, s.y * 0.3, s.z / 2 + 0.018]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      {Array.from({ length: buttonRows }).map((_, row) =>
        Array.from({ length: buttonCols }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[
              s.x * 0.18 + (col - 1) * s.x * 0.16,
              -s.y * 0.1 + row * s.y * 0.13,
              s.z / 2 + 0.015,
            ]}
          >
            <sphereGeometry args={[0.018, 10, 10]} />
            <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
          </mesh>
        ))
      )}
      <mesh position={[0, -s.y * 0.42, s.z / 2 + 0.01]}>
        <boxGeometry args={[s.x * 0.4, s.y * 0.06, 0.008]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.02, 0, 0]}>
        <boxGeometry args={[0.01, s.y * 0.8, s.z * 0.8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function ClothWhiteFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.55, 0]} rotation={[0, 0, Math.PI / 22]}>
        <boxGeometry args={[s.x, s.y * 0.18, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_cream, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.38, 0]} rotation={[0, 0, -Math.PI / 18]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.15, s.z * 0.92]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_cream, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.22, 0]} rotation={[0, 0, Math.PI / 16]}>
        <boxGeometry args={[s.x * 0.85, s.y * 0.13, s.z * 0.85]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.08, 0]} rotation={[0, 0, -Math.PI / 20]}>
        <boxGeometry args={[s.x * 0.78, s.y * 0.1, s.z * 0.78]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_blue, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.5, 0]} rotation={[0, 0, Math.PI / 8]}>
        <boxGeometry args={[s.x * 0.25, s.y * 0.12, s.z * 0.3]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.25, s.y * 0.35, 0]} rotation={[0, 0, -Math.PI / 10]}>
        <boxGeometry args={[s.x * 0.2, s.y * 0.1, s.z * 0.25]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.62, s.z * 0.15]} rotation={[Math.PI / 12, 0, 0]}>
        <boxGeometry args={[s.x * 0.5, s.y * 0.08, s.z * 0.2]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function ClothDarkFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.58, 0]} rotation={[0, 0, -Math.PI / 20]}>
        <boxGeometry args={[s.x, s.y * 0.16, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.bg_dark, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.42, 0]} rotation={[0, 0, Math.PI / 16]}>
        <boxGeometry args={[s.x * 0.9, s.y * 0.14, s.z * 0.9]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.bg_mid, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.28, 0]} rotation={[0, 0, -Math.PI / 14]}>
        <boxGeometry args={[s.x * 0.82, s.y * 0.12, s.z * 0.82]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_purple, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.15, 0]} rotation={[0, 0, Math.PI / 18]}>
        <boxGeometry args={[s.x * 0.75, s.y * 0.1, s.z * 0.75]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.05, 0]} rotation={[0, 0, -Math.PI / 22]}>
        <boxGeometry args={[s.x * 0.68, s.y * 0.08, s.z * 0.68]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.15, s.y * 0.5, s.z * 0.1]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[s.x * 0.22, s.y * 0.1, s.z * 0.25]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.2, s.y * 0.38, -s.z * 0.1]} rotation={[0, 0, -Math.PI / 8]}>
        <boxGeometry args={[s.x * 0.18, s.y * 0.08, s.z * 0.2]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function TowelFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_blue, metalness: 0.1 })} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, s.y * (0.15 + i * 0.14), 0]}
        >
          <boxGeometry args={[s.x * 0.92, 0.006, s.z * 0.92]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
        </mesh>
      ))}
      <mesh position={[0, 0, s.z / 2 + 0.008]}>
        <boxGeometry args={[s.x * 0.96, s.y * 0.92, 0.006]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_blue, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, 0, -s.z / 2 - 0.008]}>
        <boxGeometry args={[s.x * 0.96, s.y * 0.92, 0.006]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_blue, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.45, s.z / 2 + 0.012]}>
        <boxGeometry args={[s.x * 0.7, s.y * 0.15, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x / 2 + 0.01, 0, 0]}>
        <boxGeometry args={[0.008, s.y * 0.95, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[-s.x / 2 - 0.01, 0, 0]}>
        <boxGeometry args={[0.008, s.y * 0.95, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.8, s.z * 0.2]} rotation={[Math.PI / 10, 0, 0]}>
        <boxGeometry args={[s.x * 0.3, s.y * 0.06, s.z * 0.15]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function TrashFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.28, 0]} rotation={[Math.PI / 10, Math.PI / 6, 0]}>
        <boxGeometry args={[s.x * 0.9, s.y * 0.35, s.z * 0.9]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[s.x * 0.12, s.y * 0.5, s.z * 0.08]} rotation={[-Math.PI / 6, Math.PI / 5, Math.PI / 3]}>
        <boxGeometry args={[s.x * 0.65, s.y * 0.28, s.z * 0.65]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.plastic_black, metalness: 0.2 })} />
      </mesh>
      <mesh position={[-s.x * 0.08, s.y * 0.55, -s.z * 0.1]} rotation={[Math.PI / 5, -Math.PI / 6, -Math.PI / 5]}>
        <boxGeometry args={[s.x * 0.55, s.y * 0.22, s.z * 0.55]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_gray, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.7, 0]} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <sphereGeometry args={[s.x * 0.15, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.65, -s.z * 0.15]} rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
        <sphereGeometry args={[s.x * 0.1, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.15, s.y * 0.45, s.z * 0.2]} rotation={[Math.PI / 6, -Math.PI / 4, Math.PI / 6]}>
        <boxGeometry args={[s.x * 0.35, s.y * 0.15, s.z * 0.3]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.paper, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.05, s.y * 0.35, -s.z * 0.2]} rotation={[-Math.PI / 8, 0, -Math.PI / 3]}>
        <boxGeometry args={[s.x * 0.3, s.y * 0.12, s.z * 0.25]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.2, s.y * 0.6, 0.05]} rotation={[0, Math.PI / 5, Math.PI / 7]}>
        <sphereGeometry args={[s.x * 0.08, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function FridgeFallback({ size, isOpen = false }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.5, s.z / 2 + 0.005]}>
        <boxGeometry args={[0.01, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      {!isOpen && (
        <mesh position={[0, s.y / 2, s.z / 2 + 0.01]}>
          <boxGeometry args={[s.x, s.y, 0.02]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
        </mesh>
      )}
      <mesh
        position={isOpen ? [-s.x * 0.38, s.y * 0.65, s.z / 2 + 0.02] : [s.x * 0.38, s.y * 0.65, s.z / 2 + 0.02]}
        rotation={isOpen ? [-Math.PI / 2.5, 0, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[s.x * 0.42, s.y * 0.55, 0.035]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh
        position={isOpen ? [s.x * 0.38, s.y * 0.65, s.z / 2 + 0.02] : [-s.x * 0.38, s.y * 0.65, s.z / 2 + 0.02]}
        rotation={isOpen ? [Math.PI / 2.5, 0, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[s.x * 0.42, s.y * 0.55, 0.035]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh
        position={isOpen ? [-s.x * 0.35, s.y * 0.25, s.z / 2 + 0.02] : [s.x * 0.35, s.y * 0.25, s.z / 2 + 0.02]}
        rotation={isOpen ? [-Math.PI / 3, 0, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[s.x * 0.45, s.y * 0.35, 0.03]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh
        position={isOpen ? [s.x * 0.35, s.y * 0.25, s.z / 2 + 0.02] : [-s.x * 0.35, s.y * 0.25, s.z / 2 + 0.02]}
        rotation={isOpen ? [Math.PI / 3, 0, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[s.x * 0.45, s.y * 0.35, 0.03]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.4, s.y * 0.5, s.z / 2 + 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, s.y * 0.38, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x * 0.4, s.y * 0.5, s.z / 2 + 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, s.y * 0.38, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x * 0.42, s.y * 0.75, s.z / 2 + 0.03]}>
        <boxGeometry args={[0.01, 0.12, 0.06]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.42, s.y * 0.72, s.z / 2 + 0.05]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0, s.y * 0.15 + i * (s.y * 0.55) / 3, s.z / 2 - 0.02]}>
          <boxGeometry args={[s.x * 0.88, 0.025, s.z * 0.85]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
        </mesh>
      ))}
      <mesh position={[0, s.y * 0.1, s.z / 2 - 0.03]}>
        <boxGeometry args={[s.x * 0.82, 0.06, s.z * 0.8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.45, s.z / 2 - 0.03]}>
        <boxGeometry args={[s.x * 0.82, 0.06, s.z * 0.8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.8, s.z / 2 - 0.03]}>
        <boxGeometry args={[s.x * 0.82, 0.06, s.z * 0.8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.97, 0]}>
        <boxGeometry args={[s.x * 0.9, s.y * 0.04, s.z * 0.9]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function CabinetFallback({ size, isOpen = false }: FallbackProps) {
  const s = getSize(size)
  const isUpper = s.y < s.x
  const shelfCount = Math.max(2, Math.floor(s.y / 0.4))
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.005]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.92, 0.02]} />
      </mesh>
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={i} position={[0, s.y * 0.15 + i * (s.y * 0.7) / shelfCount, s.z / 2 - 0.01]}>
          <boxGeometry args={[s.x * 0.85, 0.02, s.z * 0.8]} />
        </mesh>
      ))}
      <mesh
        position={isOpen ? [0, s.y / 2, s.z / 2 + s.x * 0.35] : [0, s.y / 2, s.z / 2 + 0.03]}
        rotation={isOpen ? [0, -Math.PI / 2.2, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[s.x * 0.96, s.y * 0.94, 0.035]} />
      </mesh>
      <mesh
        position={isOpen ? [-s.x * 0.1, s.y / 2, s.z / 2 + s.x * 0.3] : [s.x * 0.38, s.y / 2, s.z / 2 + 0.05]}
        rotation={isOpen ? [0, -Math.PI / 2.2, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[0.02, 0.1, 0.05]} />
      </mesh>
      {!isUpper && (
        <mesh position={[0, s.y * 0.05, 0]}>
          <boxGeometry args={[s.x * 1.08, s.y * 0.06, s.z * 1.08]} />
        </mesh>
      )}
      <mesh position={[-s.x / 2 + 0.01, s.y / 2, 0]}>
        <boxGeometry args={[0.015, s.y * 0.95, s.z * 0.95]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.01, s.y / 2, 0]}>
        <boxGeometry args={[0.015, s.y * 0.95, s.z * 0.95]} />
      </mesh>
      <mesh position={[0, s.y - 0.01, 0]}>
        <boxGeometry args={[s.x * 0.95, 0.02, s.z * 0.95]} />
      </mesh>
    </group>
  )
}

export function SinkFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.88, 0]}>
        <boxGeometry args={[s.x, s.y * 0.24, s.z]} />
      </mesh>
      <mesh position={[0, s.y * 0.5, 0]}>
        <boxGeometry args={[s.x * 0.75, s.y * 0.5, s.z * 0.75]} />
      </mesh>
      <mesh position={[0, s.y * 0.55, 0]}>
        <cylinderGeometry args={[s.x * 0.28, s.x * 0.22, s.y * 0.42, 20]} />
      </mesh>
      <mesh position={[0, s.y * 0.32, 0]}>
        <cylinderGeometry args={[s.x * 0.22, s.x * 0.18, s.y * 0.1, 16]} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.95, 0]}>
        <cylinderGeometry args={[0.025, 0.025, s.y * 0.22, 10]} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 1.06, s.z * 0.12]}>
        <boxGeometry args={[0.12, 0.022, 0.022]} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 1.06, -s.z * 0.12]}>
        <boxGeometry args={[0.08, 0.022, 0.022]} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.92, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
      </mesh>
      <mesh position={[0, s.y * 0.75, 0]}>
        <cylinderGeometry args={[s.x * 0.3, s.x * 0.3, 0.02, 20]} />
      </mesh>
      <mesh position={[0, s.y * 0.73, 0]}>
        <cylinderGeometry args={[s.x * 0.32, s.x * 0.32, 0.015, 20]} />
      </mesh>
      <mesh position={[-s.x * 0.25, s.y * 0.95, 0]}>
        <cylinderGeometry args={[0.02, 0.02, s.y * 0.08, 8]} />
      </mesh>
      <mesh position={[-s.x * 0.25, s.y * 0.92, 0]}>
        <sphereGeometry args={[0.025, 10, 10]} />
      </mesh>
    </group>
  )
}

export function DishwasherFallback({ size, isOpen = false }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
      </mesh>
      <mesh
        position={isOpen ? [0, -s.y * 0.25, s.z / 2 + 0.03] : [0, s.y / 2, s.z / 2 + 0.03]}
        rotation={isOpen ? [Math.PI / 5, 0, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[s.x * 0.94, s.y * 0.92, 0.045]} />
      </mesh>
      <mesh position={[0, s.y * 0.35, s.z / 2 + 0.05]}>
        <boxGeometry args={[s.x * 0.65, 0.045, 0.065]} />
      </mesh>
      <mesh position={[-s.x * 0.15, s.y * 0.15, s.z / 2 + 0.04]}>
        <sphereGeometry args={[0.022, 10, 10]} />
      </mesh>
      <mesh position={[0, s.y * 0.15, s.z / 2 + 0.04]}>
        <sphereGeometry args={[0.02, 10, 10]} />
      </mesh>
      <mesh position={[s.x * 0.15, s.y * 0.15, s.z / 2 + 0.04]}>
        <sphereGeometry args={[0.02, 10, 10]} />
      </mesh>
      <mesh position={[-s.x * 0.25, s.y * 0.1, s.z / 2 + 0.03]}>
        <boxGeometry args={[0.08, 0.045, 0.025]} />
      </mesh>
      <mesh position={[s.x * 0.25, s.y * 0.1, s.z / 2 + 0.03]}>
        <boxGeometry args={[0.08, 0.045, 0.025]} />
      </mesh>
      <mesh position={[-s.x * 0.35, s.y * 0.15, s.z / 2 + 0.04]}>
        <sphereGeometry args={[0.012, 8, 8]} />
      </mesh>
      <mesh position={[0, s.y * 0.5, s.z / 2 - 0.02]}>
        <cylinderGeometry args={[s.x * 0.3, s.x * 0.3, 0.02, 16]} />
      </mesh>
      <mesh position={[0, s.y * 0.5, s.z / 2 - 0.03]}>
        <cylinderGeometry args={[s.x * 0.25, s.x * 0.25, 0.015, 16]} />
      </mesh>
      {isOpen && (
        <>
          <mesh position={[0, s.y * 0.3, s.z / 2 + 0.1]}>
            <boxGeometry args={[s.x * 0.7, 0.02, s.z * 0.3]} />
          </mesh>
          <mesh position={[-s.x * 0.3, s.y * 0.3, s.z / 2 + 0.1]}>
            <boxGeometry args={[0.02, s.y * 0.2, s.z * 0.3]} />
          </mesh>
          <mesh position={[s.x * 0.3, s.y * 0.3, s.z / 2 + 0.1]}>
            <boxGeometry args={[0.02, s.y * 0.2, s.z * 0.3]} />
          </mesh>
        </>
      )}
    </group>
  )
}

export function SofaFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.22, 0]}>
        <boxGeometry args={[s.x, s.y * 0.44, s.z]} />
      </mesh>
      <mesh position={[0, s.y * 0.55, -s.z / 2 + 0.04]} rotation={[Math.PI / 10, 0, 0]}>
        <boxGeometry args={[s.x, s.y * 0.38, 0.12]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.07, s.y * 0.48, 0]}>
        <boxGeometry args={[0.13, s.y * 0.38, s.z * 0.78]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.07, s.y * 0.48, 0]}>
        <boxGeometry args={[0.13, s.y * 0.38, s.z * 0.78]} />
      </mesh>
      <mesh position={[-s.x * 0.22, s.y * 0.52, -s.z * 0.18]} rotation={[0, 0, -Math.PI / 22]}>
        <boxGeometry args={[s.x * 0.2, s.y * 0.16, s.z * 0.32]} />
      </mesh>
      <mesh position={[0, s.y * 0.52, -s.z * 0.18]} rotation={[0, 0, Math.PI / 28]}>
        <boxGeometry args={[s.x * 0.2, s.y * 0.16, s.z * 0.32]} />
      </mesh>
      <mesh position={[s.x * 0.22, s.y * 0.52, -s.z * 0.18]} rotation={[0, 0, -Math.PI / 28]}>
        <boxGeometry args={[s.x * 0.2, s.y * 0.16, s.z * 0.32]} />
      </mesh>
      <mesh position={[0, s.y * 0.28, s.z / 2 + 0.005]}>
        <boxGeometry args={[s.x * 0.88, s.y * 0.04, s.z * 0.88]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.05, s.y * 0.08, s.z / 2 - 0.05]}>
        <boxGeometry args={[0.06, s.y * 0.12, 0.06]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.05, s.y * 0.08, s.z / 2 - 0.05]}>
        <boxGeometry args={[0.06, s.y * 0.12, 0.06]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.05, s.y * 0.08, -s.z / 2 + 0.05]}>
        <boxGeometry args={[0.06, s.y * 0.12, 0.06]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.05, s.y * 0.08, -s.z / 2 + 0.05]}>
        <boxGeometry args={[0.06, s.y * 0.12, 0.06]} />
      </mesh>
    </group>
  )
}

export function CoffeeTableFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.85, 0]}>
        <boxGeometry args={[s.x, s.y * 0.15, s.z]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.08, s.y * 0.4, -s.z / 2 + 0.08]} rotation={[0, 0, Math.PI / 10]}>
        <cylinderGeometry args={[0.035, 0.035, s.y * 0.65, 10]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.08, s.y * 0.4, -s.z / 2 + 0.08]} rotation={[0, 0, -Math.PI / 10]}>
        <cylinderGeometry args={[0.035, 0.035, s.y * 0.65, 10]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.08, s.y * 0.4, s.z / 2 - 0.08]} rotation={[0, 0, -Math.PI / 10]}>
        <cylinderGeometry args={[0.035, 0.035, s.y * 0.65, 10]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.08, s.y * 0.4, s.z / 2 - 0.08]} rotation={[0, 0, Math.PI / 10]}>
        <cylinderGeometry args={[0.035, 0.035, s.y * 0.65, 10]} />
      </mesh>
      <mesh position={[0, s.y * 0.35, 0]}>
        <boxGeometry args={[s.x * 0.82, s.y * 0.05, s.z * 0.82]} />
      </mesh>
      <mesh position={[-s.x * 0.18, s.y * 0.9, -s.z * 0.12]}>
        <boxGeometry args={[s.x * 0.12, s.y * 0.08, s.z * 0.08]} />
      </mesh>
      <mesh position={[s.x * 0.12, s.y * 0.9, s.z * 0.18]}>
        <cylinderGeometry args={[0.025, 0.025, s.y * 0.07, 10]} />
      </mesh>
      <mesh position={[0, s.y * 0.9, 0]}>
        <cylinderGeometry args={[0.045, 0.045, s.y * 0.05, 12]} />
      </mesh>
      <mesh position={[-s.x * 0.1, s.y * 0.9, s.z * 0.15]}>
        <sphereGeometry args={[0.02, 10, 10]} />
      </mesh>
      <mesh position={[0, s.y * 0.82, 0]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.02, s.z * 0.92]} />
      </mesh>
    </group>
  )
}

export function BedFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.22, 0]}>
        <boxGeometry args={[s.x, s.y * 0.44, s.z]} />
      </mesh>
      <mesh position={[0, s.y * 0.48, 0]}>
        <boxGeometry args={[s.x * 1.02, s.y * 0.08, s.z * 1.02]} />
      </mesh>
      <mesh position={[0, s.y * 0.62, 0]}>
        <boxGeometry args={[s.x * 0.95, s.y * 0.18, s.z * 0.95]} />
      </mesh>
      <mesh position={[0, s.y * 0.7, 0]}>
        <boxGeometry args={[s.x * 0.9, s.y * 0.08, s.z * 0.9]} />
      </mesh>
      <mesh position={[0, s.y * 0.5, -s.z / 2 + 0.08]}>
        <boxGeometry args={[s.x, s.y * 0.5, 0.14]} />
      </mesh>
      <mesh position={[-s.x * 0.18, s.y * 0.68, -s.z * 0.28]} rotation={[Math.PI / 10, 0, Math.PI / 20]}>
        <boxGeometry args={[s.x * 0.22, s.y * 0.14, s.z * 0.35]} />
      </mesh>
      <mesh position={[s.x * 0.18, s.y * 0.68, -s.z * 0.28]} rotation={[Math.PI / 10, 0, -Math.PI / 20]}>
        <boxGeometry args={[s.x * 0.22, s.y * 0.14, s.z * 0.35]} />
      </mesh>
      <mesh position={[0, s.y * 0.7, -s.z * 0.22]} rotation={[Math.PI / 8, 0, 0]}>
        <boxGeometry args={[s.x * 0.16, s.y * 0.1, s.z * 0.3]} />
      </mesh>
      <mesh position={[0, s.y * 0.32, 0]}>
        <boxGeometry args={[s.x * 0.88, s.y * 0.03, s.z * 0.88]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.04, s.y * 0.06, s.z / 2 - 0.04]}>
        <boxGeometry args={[0.05, s.y * 0.1, 0.05]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.04, s.y * 0.06, s.z / 2 - 0.04]}>
        <boxGeometry args={[0.05, s.y * 0.1, 0.05]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.04, s.y * 0.06, -s.z / 2 + 0.04]}>
        <boxGeometry args={[0.05, s.y * 0.1, 0.05]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.04, s.y * 0.06, -s.z / 2 + 0.04]}>
        <boxGeometry args={[0.05, s.y * 0.1, 0.05]} />
      </mesh>
    </group>
  )
}

export function DeskFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.85, 0]}>
        <boxGeometry args={[s.x, s.y * 0.15, s.z]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.06, s.y * 0.4, -s.z / 2 + 0.06]}>
        <boxGeometry args={[0.05, s.y * 0.75, 0.05]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.06, s.y * 0.4, -s.z / 2 + 0.06]}>
        <boxGeometry args={[0.05, s.y * 0.75, 0.05]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.06, s.y * 0.4, s.z / 2 - 0.06]}>
        <boxGeometry args={[0.05, s.y * 0.75, 0.05]} />
      </mesh>
      <mesh position={[0, s.y * 0.5, -s.z / 2 + 0.04]}>
        <boxGeometry args={[s.x * 0.85, s.y * 0.45, 0.07]} />
      </mesh>
      <mesh position={[0, s.y * 0.32, -s.z / 2 + 0.08]}>
        <boxGeometry args={[s.x * 0.8, 0.02, s.z * 0.035]} />
      </mesh>
      <mesh position={[0, s.y * 0.52, -s.z / 2 + 0.08]}>
        <boxGeometry args={[s.x * 0.8, 0.02, s.z * 0.035]} />
      </mesh>
      <mesh position={[0, s.y * 0.72, -s.z / 2 + 0.08]}>
        <boxGeometry args={[s.x * 0.8, 0.02, s.z * 0.035]} />
      </mesh>
      <mesh position={[-s.x * 0.18, s.y * 0.42, -s.z / 2 + 0.1]}>
        <boxGeometry args={[0.02, 0.05, 0.025]} />
      </mesh>
      <mesh position={[s.x * 0.18, s.y * 0.42, -s.z / 2 + 0.1]}>
        <boxGeometry args={[0.02, 0.05, 0.025]} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.92, s.z * 0.22]}>
        <boxGeometry args={[0.05, 0.04, 0.05]} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 1.15, s.z * 0.22]}>
        <cylinderGeometry args={[0.012, 0.012, s.y * 0.28, 8]} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 1.28, s.z * 0.22]} rotation={[-Math.PI / 5, 0, 0]}>
        <coneGeometry args={[0.07, 0.1, 10]} />
      </mesh>
      <mesh position={[0, s.y * 0.82, 0]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.02, s.z * 0.92]} />
      </mesh>
      <mesh position={[-s.x * 0.25, s.y * 0.9, s.z * 0.15]}>
        <boxGeometry args={[s.x * 0.1, s.y * 0.06, s.z * 0.08]} />
      </mesh>
    </group>
  )
}

export function LaundryBasketFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.38, 0]}>
        <cylinderGeometry args={[s.x / 2, s.x / 2 * 0.82, s.y * 0.76, 20]} />
      </mesh>
      <mesh position={[0, s.y * 0.8, 0]}>
        <cylinderGeometry args={[s.x / 2 + 0.03, s.x / 2 + 0.03, 0.045, 20]} />
      </mesh>
      <mesh position={[0, s.y * 0.82, 0]}>
        <cylinderGeometry args={[s.x / 2 - 0.02, s.x / 2 - 0.02, 0.025, 20]} />
      </mesh>
      <mesh position={[0, s.y * 0.12, 0]}>
        <cylinderGeometry args={[s.x / 2 + 0.02, s.x / 2 + 0.02, 0.035, 16]} />
      </mesh>
      <mesh position={[s.x * 0.18, s.y * 0.5, s.z / 2 + 0.01]}>
        <boxGeometry args={[0.12, 0.08, 0.015]} />
      </mesh>
      <mesh position={[s.x * 0.18, s.y * 0.5, s.z / 2 + 0.018]}>
        <boxGeometry args={[0.1, 0.06, 0.006]} />
      </mesh>
      <mesh position={[0, s.y * 0.35, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.78, s.x / 2 * 0.78, s.y * 0.45, 16]} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, s.y * 0.18 + i * (s.y * 0.4) / 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[s.x / 2 * 0.72, s.x / 2 * 0.72, 0.018, 16]} />
        </mesh>
      ))}
      <mesh position={[0, s.y * 0.78, 0]}>
        <cylinderGeometry args={[s.x / 2 + 0.01, s.x / 2 + 0.01, 0.025, 16]} />
      </mesh>
      <mesh position={[0, s.y * 0.05, 0]}>
        <cylinderGeometry args={[s.x / 2 * 0.75, s.x / 2 * 0.68, s.y * 0.08, 14]} />
      </mesh>
    </group>
  )
}

export function EntranceTrayFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.012, 0]}>
        <boxGeometry args={[s.x * 0.94, s.y * 0.35, s.z * 0.94]} />
      </mesh>
      <mesh position={[0, s.y * 0.1, 0]}>
        <boxGeometry args={[s.x * 1.06, 0.025, s.z * 1.06]} />
      </mesh>
      <mesh position={[0, s.y * 0.12, 0]}>
        <boxGeometry args={[s.x * 1.03, 0.012, s.z * 1.03]} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`x-${i}`} position={[s.x * (-0.4 + i * 0.2), s.y / 2 + 0.006, 0]}>
          <boxGeometry args={[0.012, s.y * 0.18, s.z * 0.88]} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`z-${i}`} position={[0, s.y / 2 + 0.006, s.z * (-0.4 + i * 0.2)]}>
          <boxGeometry args={[s.x * 0.88, s.y * 0.18, 0.012]} />
        </mesh>
      ))}
      <mesh position={[0, s.y / 2 + 0.025, 0]}>
        <boxGeometry args={[s.x * 0.58, s.y * 0.012, s.z * 0.58]} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.032, 0]}>
        <boxGeometry args={[s.x * 0.62, s.y * 0.006, s.z * 0.62]} />
      </mesh>
      <mesh position={[-s.x * 0.28, s.y / 2 + 0.04, -s.z * 0.28]} rotation={[Math.PI / 6, 0, Math.PI / 4]}>
        <boxGeometry args={[s.x * 0.08, s.y * 0.12, s.z * 0.08]} />
      </mesh>
      <mesh position={[s.x * 0.28, s.y / 2 + 0.04, s.z * 0.28]} rotation={[-Math.PI / 6, 0, -Math.PI / 4]}>
        <boxGeometry args={[s.x * 0.08, s.y * 0.12, s.z * 0.08]} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.05, s.z * 0.1]}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>
    </group>
  )
}

export function LampFallback({ size }: FallbackProps) {
  const s = getSize(size)
  const isFloor = s.y > 1.0
  return (
    <group>
      <mesh position={[0, s.y * 0.06, 0]}>
        <cylinderGeometry args={[s.x * 0.28, s.x * 0.35, s.y * 0.12, 14]} />
      </mesh>
      <mesh position={[0, s.y * 0.35, 0]}>
        <cylinderGeometry args={[0.018, 0.018, isFloor ? s.y * 0.55 : s.y * 0.32, 10]} />
      </mesh>
      <mesh position={[0, s.y * (isFloor ? 0.68 : 0.55), 0]}>
        <cylinderGeometry args={[0.015, 0.015, s.y * 0.08, 8]} />
      </mesh>
      <mesh position={[0, s.y * (isFloor ? 0.82 : 0.72), 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[s.x * (isFloor ? 0.55 : 0.45), s.y * (isFloor ? 0.25 : 0.22), 16]} />
      </mesh>
      <mesh position={[0, s.y * (isFloor ? 0.92 : 0.82), 0]}>
        <cylinderGeometry args={[s.x * (isFloor ? 0.38 : 0.3), s.x * (isFloor ? 0.35 : 0.28), 0.02, 14]} />
      </mesh>
      <mesh position={[0, s.y * (isFloor ? 0.75 : 0.65), 0]}>
        <cylinderGeometry args={[s.x * (isFloor ? 0.15 : 0.12), s.x * (isFloor ? 0.12 : 0.1), s.y * (isFloor ? 0.12 : 0.1), 12]} />
      </mesh>
      <mesh position={[0, s.y * (isFloor ? 0.88 : 0.78), 0]}>
        <sphereGeometry args={[s.x * (isFloor ? 0.08 : 0.06), 12, 12]} />
      </mesh>
    </group>
  )
}

export function PlantFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.06, 0]}>
        <cylinderGeometry args={[s.x * 0.25, s.x * 0.22, s.y * 0.12, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.12, 0]}>
        <cylinderGeometry args={[s.x * 0.22, s.x * 0.22, 0.02, 16]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.09, 0]}>
        <cylinderGeometry args={[s.x * 0.18, s.x * 0.15, s.y * 0.05, 12]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.18, 0]}>
        <cylinderGeometry args={[0.03, 0.025, s.y * 0.18, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x * 0.08, s.y * 0.28, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.02, 0.015, s.y * 0.15, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[-s.x * 0.08, s.y * 0.26, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.02, 0.015, s.y * 0.12, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.45, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <sphereGeometry args={[s.x * 0.2, 12, 12]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.42, s.z * 0.1]} rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
        <sphereGeometry args={[s.x * 0.15, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.18, s.y * 0.38, -s.z * 0.08]} rotation={[-Math.PI / 3, -Math.PI / 5, 0]}>
        <sphereGeometry args={[s.x * 0.14, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.35, s.z * 0.18]} rotation={[-Math.PI / 5, 0, Math.PI / 6]}>
        <sphereGeometry args={[s.x * 0.12, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.12, s.y * 0.52, -s.z * 0.12]} rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
        <sphereGeometry args={[s.x * 0.13, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.1, s.y * 0.48, s.z * 0.1]} rotation={[-Math.PI / 3, -Math.PI / 4, 0]}>
        <sphereGeometry args={[s.x * 0.11, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
    </group>
  )
}

export function RugFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[s.x, s.z, s.y]} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.006, 0]}>
        <boxGeometry args={[s.x * 0.96, s.y * 0.4, s.z * 0.96]} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={`z-${i}`}
          position={[0, s.y / 2 + 0.01, s.z * (-0.42 + i * 0.14)]}
        >
          <boxGeometry args={[s.x * 0.78, 0.004, s.z * 0.06]} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={`x-${i}`}
          position={[s.x * (-0.38 + i * 0.19), s.y / 2 + 0.01, 0]}
        >
          <boxGeometry args={[s.x * 0.08, 0.004, s.z * 0.75]} />
        </mesh>
      ))}
      <mesh position={[0, s.y / 2 + 0.012, 0]}>
        <boxGeometry args={[s.x * 0.4, s.y * 0.005, s.z * 0.4]} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.008, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[s.x * 0.25, s.y * 0.003, s.z * 0.25]} />
      </mesh>
      <mesh position={[0, s.y / 2 - 0.005, 0]}>
        <boxGeometry args={[s.x * 1.02, s.y * 0.02, s.z * 1.02]} />
      </mesh>
    </group>
  )
}

export function PillowFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]} rotation={[Math.PI / 10, 0, Math.PI / 15]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.01, 0]} rotation={[Math.PI / 10, 0, Math.PI / 15]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.78, s.z * 0.92]} />
      </mesh>
      <mesh position={[0, s.y * 0.28, 0]} rotation={[Math.PI / 8, 0, Math.PI / 12]}>
        <boxGeometry args={[s.x * 0.82, s.y * 0.45, s.z * 0.82]} />
      </mesh>
      <mesh position={[s.x * 0.15, s.y * 0.6, s.z * 0.1]} rotation={[Math.PI / 6, Math.PI / 8, Math.PI / 10]}>
        <boxGeometry args={[s.x * 0.25, s.y * 0.15, s.z * 0.2]} />
      </mesh>
      <mesh position={[-s.x * 0.12, s.y * 0.55, -s.z * 0.08]} rotation={[Math.PI / 8, -Math.PI / 10, -Math.PI / 12]}>
        <boxGeometry args={[s.x * 0.2, s.y * 0.12, s.z * 0.18]} />
      </mesh>
      <mesh position={[0, s.y * 0.72, 0]} rotation={[Math.PI / 12, 0, Math.PI / 8]}>
        <boxGeometry args={[s.x * 0.5, s.y * 0.1, s.z * 0.4]} />
      </mesh>
    </group>
  )
}

export function ShoesFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[-s.x * 0.2, s.y * 0.2, 0]} rotation={[0, Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.35, s.y * 0.15, s.z * 0.8]} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.2, 0]} rotation={[0, -Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.35, s.y * 0.15, s.z * 0.8]} />
      </mesh>
      <mesh position={[-s.x * 0.2, s.y * 0.08, 0]} rotation={[0, Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.38, s.y * 0.08, s.z * 0.85]} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.08, 0]} rotation={[0, -Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.38, s.y * 0.08, s.z * 0.85]} />
      </mesh>
      <mesh position={[-s.x * 0.2, s.y * 0.32, -s.z * 0.25]} rotation={[0, Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.3, s.y * 0.12, s.z * 0.25]} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.32, -s.z * 0.25]} rotation={[0, -Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.3, s.y * 0.12, s.z * 0.25]} />
      </mesh>
      <mesh position={[-s.x * 0.2, s.y * 0.3, s.z * 0.3]} rotation={[0, Math.PI / 12, Math.PI / 8]}>
        <boxGeometry args={[s.x * 0.25, s.y * 0.08, s.z * 0.15]} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.3, s.z * 0.3]} rotation={[0, -Math.PI / 12, -Math.PI / 8]}>
        <boxGeometry args={[s.x * 0.25, s.y * 0.08, s.z * 0.15]} />
      </mesh>
      <mesh position={[-s.x * 0.28, s.y * 0.15, s.z * 0.2]} rotation={[0, Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.08, s.y * 0.15, s.z * 0.3]} />
      </mesh>
      <mesh position={[s.x * 0.28, s.y * 0.15, s.z * 0.2]} rotation={[0, -Math.PI / 12, 0]}>
        <boxGeometry args={[s.x * 0.08, s.y * 0.15, s.z * 0.3]} />
      </mesh>
      <mesh position={[-s.x * 0.2, s.y * 0.05, -s.z * 0.35]} rotation={[0, Math.PI / 12, 0]}>
        <sphereGeometry args={[s.x * 0.12, 10, 10]} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.05, -s.z * 0.35]} rotation={[0, -Math.PI / 12, 0]}>
        <sphereGeometry args={[s.x * 0.12, 10, 10]} />
      </mesh>
    </group>
  )
}

export function HookFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
      </mesh>
      <mesh position={[0, s.y / 2 + 0.01, 0]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.25, s.z * 0.92]} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={i}
          position={[s.x * (-0.32 + i * 0.21), s.y * 0.62, 0]}
        >
          <boxGeometry args={[0.028, s.y * 0.32, 0.028]} />
        </mesh>
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={`hook-${i}`}
          position={[s.x * (-0.32 + i * 0.21), s.y * 0.78, s.z * 0.06]}
          rotation={[0, 0, Math.PI / 4]}
        >
          <cylinderGeometry args={[0.018, 0.018, s.y * 0.18, 10]} />
        </mesh>
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={`tip-${i}`}
          position={[s.x * (-0.32 + i * 0.21) + s.y * 0.1, s.y * 0.85, s.z * 0.06 + s.y * 0.1]}
        >
          <sphereGeometry args={[0.02, 8, 8]} />
        </mesh>
      ))}
      <mesh position={[0, s.y * 0.2, 0]}>
        <boxGeometry args={[s.x * 0.8, s.y * 0.1, s.z * 0.8]} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.02, s.y / 2, 0]}>
        <boxGeometry args={[0.015, s.y * 0.9, s.z * 0.9]} />
      </mesh>
      <mesh position={[s.x / 2 - 0.02, s.y / 2, 0]}>
        <boxGeometry args={[0.015, s.y * 0.9, s.z * 0.9]} />
      </mesh>
    </group>
  )
}

export function BookshelfFallback({ size }: FallbackProps) {
  const s = getSize(size)
  const shelfCount = 5
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.005]}>
        <boxGeometry args={[s.x * 0.95, s.y * 0.95, 0.02]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_light, metalness: 0.1 })} />
      </mesh>
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={i} position={[0, s.y * 0.12 + i * (s.y * 0.76) / shelfCount, s.z / 2 - 0.01]}>
          <boxGeometry args={[s.x * 0.92, 0.03, s.z * 0.88]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
        </mesh>
      ))}
      {Array.from({ length: shelfCount }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => {
          const bookColors = [px.accent_red, px.accent_cyan, px.accent_green, px.accent_yellow, px.accent_purple]
          const bookWidth = s.x * 0.15
          const bookHeight = s.y * 0.12 + Math.random() * s.y * 0.04
          return (
            <mesh
              key={`${row}-${col}`}
              position={[s.x * (-0.36 + col * 0.18), s.y * 0.12 + row * (s.y * 0.76) / shelfCount + bookHeight / 2, s.z / 2 - 0.02]}
              rotation={[0, 0, (Math.random() - 0.5) * 0.08]}
            >
              <boxGeometry args={[bookWidth, bookHeight, s.z * 0.025]} />
              <meshStandardMaterial {...PixelMaterial({ color: bookColors[col % bookColors.length], metalness: 0.1 })} />
            </mesh>
          )
        })
      )}
      <mesh position={[0, s.y * 0.98, 0]}>
        <boxGeometry args={[s.x * 1.05, 0.03, s.z * 1.05]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.015, s.y / 2, 0]}>
        <boxGeometry args={[0.02, s.y * 0.95, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[s.x / 2 - 0.015, s.y / 2, 0]}>
        <boxGeometry args={[0.02, s.y * 0.95, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
    </group>
  )
}

export function ChairFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.38, 0]}>
        <boxGeometry args={[s.x * 0.85, s.y * 0.08, s.z * 0.85]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[-s.x * 0.32, s.y * 0.2, s.z * 0.32]}>
        <boxGeometry args={[0.05, s.y * 0.42, 0.05]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[s.x * 0.32, s.y * 0.2, s.z * 0.32]}>
        <boxGeometry args={[0.05, s.y * 0.42, 0.05]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[-s.x * 0.32, s.y * 0.2, -s.z * 0.32]}>
        <boxGeometry args={[0.05, s.y * 0.42, 0.05]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[s.x * 0.32, s.y * 0.2, -s.z * 0.32]}>
        <boxGeometry args={[0.05, s.y * 0.42, 0.05]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.72, 0]} rotation={[-Math.PI / 12, 0, 0]}>
        <boxGeometry args={[s.x, s.y * 0.35, s.z * 0.8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_cream, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.05, s.y * 0.55, 0]}>
        <boxGeometry args={[0.06, s.y * 0.45, s.z * 0.75]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[s.x / 2 - 0.05, s.y * 0.55, 0]}>
        <boxGeometry args={[0.06, s.y * 0.45, s.z * 0.75]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[-s.x * 0.35, s.y * 0.05, s.z * 0.35]}>
        <boxGeometry args={[0.04, 0.03, 0.04]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.05, s.z * 0.35]}>
        <boxGeometry args={[0.04, 0.03, 0.04]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[-s.x * 0.35, s.y * 0.05, -s.z * 0.35]}>
        <boxGeometry args={[0.04, 0.03, 0.04]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.05, -s.z * 0.35]}>
        <boxGeometry args={[0.04, 0.03, 0.04]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function TVFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y * 0.45, 0]}>
        <boxGeometry args={[s.x, s.y * 0.85, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.plastic_black, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.45, s.z / 2 + 0.005]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.75, 0.01]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.screen_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.45, s.z / 2 + 0.01]}>
        <boxGeometry args={[s.x * 0.88, s.y * 0.7, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.42, s.y * 0.25, s.z / 2 + 0.02]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.2, s.z / 2 + 0.02]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.28, s.y * 0.15, s.z / 2 + 0.02]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.92, 0]}>
        <boxGeometry args={[s.x * 0.95, 0.02, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.fabric_gray, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.08, 0]}>
        <boxGeometry args={[s.x * 0.9, 0.02, s.z * 0.9]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[-s.x * 0.35, s.y * 0.04, -s.z * 0.3]}>
        <boxGeometry args={[0.02, 0.06, 0.06]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x * 0.35, s.y * 0.04, -s.z * 0.3]}>
        <boxGeometry args={[0.02, 0.06, 0.06]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function ClockFallback({ size }: FallbackProps) {
  const s = getSize(size)
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <cylinderGeometry args={[s.x / 2, s.x / 2, s.z, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.005]}>
        <cylinderGeometry args={[s.x / 2 - 0.02, s.x / 2 - 0.02, 0.015, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.bg_light, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.015]}>
        <cylinderGeometry args={[s.x / 2 + 0.03, s.x / 2 + 0.03, 0.01, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.02]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_red, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.6, s.z / 2 + 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, s.x * 0.25, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.y * 0.15, s.y / 2, s.z / 2 + 0.02]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, s.x * 0.18, 8]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 12
        const isHour = i % 3 === 0
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * s.x * 0.35, s.y / 2 + (isHour ? 0.015 : 0.01), Math.sin(angle) * s.x * 0.35 + s.z / 2 + 0.02]}
          >
            {isHour ? (
              <boxGeometry args={[0.015, 0.015, 0.005]} />
            ) : (
              <sphereGeometry args={[0.008, 8, 8]} />
            )}
            <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
          </mesh>
        )
      })}
      <mesh position={[0, s.y / 2, -s.z / 2 - 0.005]}>
        <cylinderGeometry args={[s.x / 2 - 0.02, s.x / 2 - 0.02, 0.02, 24]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function PaintingFallback({ size }: FallbackProps) {
  const s = getSize(size)
  const frameColors = [px.wood_dark, px.metal_gold, px.wood_medium]
  const canvasColors = [px.accent_pink, px.accent_cyan, px.accent_yellow, px.accent_purple]
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: frameColors[0], metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.005]}>
        <boxGeometry args={[s.x * 0.88, s.y * 0.88, 0.008]} />
        <meshStandardMaterial {...PixelMaterial({ color: canvasColors[0], metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.4, s.z / 2 + 0.01]}>
        <boxGeometry args={[s.x * 0.6, s.y * 0.5, 0.005]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_cyan, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.65, s.z / 2 + 0.012]}>
        <boxGeometry args={[s.x * 0.5, s.y * 0.3, 0.003]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_yellow, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x * 0.2, s.y * 0.5, s.z / 2 + 0.01]}>
        <boxGeometry args={[s.x * 0.25, s.y * 0.35, 0.004]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_pink, metalness: 0.1 })} />
      </mesh>
      <mesh position={[s.x * 0.2, s.y * 0.55, s.z / 2 + 0.01]}>
        <sphereGeometry args={[s.x * 0.12, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.accent_green, metalness: 0.1 })} />
      </mesh>
      <mesh position={[-s.x / 2 + 0.03, s.y / 2, 0]}>
        <boxGeometry args={[0.03, s.y * 0.95, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: frameColors[1], metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x / 2 - 0.03, s.y / 2, 0]}>
        <boxGeometry args={[0.03, s.y * 0.95, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: frameColors[1], metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y - 0.02, 0]}>
        <boxGeometry args={[s.x * 0.95, 0.03, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: frameColors[1], metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[s.x * 0.95, 0.03, s.z * 0.95]} />
        <meshStandardMaterial {...PixelMaterial({ color: frameColors[1], metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function ShelfFallback({ size }: FallbackProps) {
  const s = getSize(size)
  const shelfCount = 3
  return (
    <group>
      <mesh position={[-s.x / 2 + 0.02, s.y / 2, 0]}>
        <boxGeometry args={[0.03, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      <mesh position={[s.x / 2 - 0.02, s.y / 2, 0]}>
        <boxGeometry args={[0.03, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={i} position={[0, s.y * 0.15 + i * (s.y * 0.7) / shelfCount, s.z / 2 - 0.01]}>
          <boxGeometry args={[s.x, 0.025, s.z]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
        </mesh>
      ))}
      {Array.from({ length: shelfCount }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[s.x * (-0.35 + col * 0.35), s.y * 0.15 + row * (s.y * 0.7) / shelfCount + 0.1, s.z / 2 - 0.05]}
          >
            <boxGeometry args={[s.x * 0.15, s.y * 0.15, s.z * 0.08]} />
            <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
          </mesh>
        ))
      )}
      <mesh position={[0, s.y * 0.95, s.z / 2 - 0.01]}>
        <boxGeometry args={[s.x, 0.03, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_silver, metalness: 0.3 })} />
      </mesh>
    </group>
  )
}

export function DresserFallback({ size }: FallbackProps) {
  const s = getSize(size)
  const drawerCount = 6
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_light, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.005]}>
        <boxGeometry args={[s.x * 0.94, s.y * 0.94, 0.02]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.88, 0]}>
        <boxGeometry args={[s.x * 0.9, 0.03, s.z * 0.9]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y * 0.92, 0]}>
        <boxGeometry args={[s.x * 0.85, 0.02, s.z * 0.85]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.ceramic_white, metalness: 0.1 })} />
      </mesh>
      <mesh position={[0, s.y * 0.95, 0]}>
        <sphereGeometry args={[0.025, 10, 10]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      {Array.from({ length: drawerCount }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        return (
          <mesh
            key={i}
            position={[s.x * (-0.3 + col * 0.3), s.y * 0.12 + row * (s.y * 0.55) / 2 + (s.y * 0.22) / 2, s.z / 2 + 0.02]}
          >
            <boxGeometry args={[s.x * 0.24, s.y * 0.22, 0.015]} />
            <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
          </mesh>
        )
      })}
      {Array.from({ length: drawerCount }).map((_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        return (
          <mesh
            key={`knob-${i}`}
            position={[s.x * (-0.3 + col * 0.3), s.y * 0.12 + row * (s.y * 0.55) / 2 + (s.y * 0.22) / 2, s.z / 2 + 0.04]}
          >
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
          </mesh>
        )
      })}
      <mesh position={[0, s.y * 0.05, 0]}>
        <boxGeometry args={[s.x * 1.05, 0.04, s.z * 1.05]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
    </group>
  )
}

export function CabinetFallback2({ size, isOpen = false }: FallbackProps) {
  const s = getSize(size)
  const shelfCount = 4
  return (
    <group>
      <mesh position={[0, s.y / 2, 0]}>
        <boxGeometry args={[s.x, s.y, s.z]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_medium, metalness: 0.2 })} />
      </mesh>
      <mesh position={[0, s.y / 2, s.z / 2 + 0.005]}>
        <boxGeometry args={[s.x * 0.92, s.y * 0.92, 0.025]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_light, metalness: 0.2 })} />
      </mesh>
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={i} position={[0, s.y * 0.15 + i * (s.y * 0.7) / shelfCount, s.z / 2 - 0.01]}>
          <boxGeometry args={[s.x * 0.85, 0.02, s.z * 0.8]} />
          <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
        </mesh>
      ))}
      <mesh
        position={isOpen ? [0, s.y / 2, s.z / 2 + s.x * 0.4] : [0, s.y / 2, s.z / 2 + 0.03]}
        rotation={isOpen ? [0, -Math.PI / 2, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[s.x * 0.96, s.y * 0.94, 0.035]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_light, metalness: 0.2 })} />
      </mesh>
      <mesh
        position={isOpen ? [-s.x * 0.1, s.y / 2, s.z / 2 + s.x * 0.35] : [s.x * 0.38, s.y / 2, s.z / 2 + 0.05]}
        rotation={isOpen ? [0, -Math.PI / 2, 0] : [0, 0, 0]}
      >
        <boxGeometry args={[0.02, 0.08, 0.04]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.metal_gold, metalness: 0.3 })} />
      </mesh>
      <mesh position={[0, s.y * 0.05, 0]}>
        <boxGeometry args={[s.x * 1.08, 0.05, s.z * 1.08]} />
        <meshStandardMaterial {...PixelMaterial({ color: px.wood_dark, metalness: 0.2 })} />
      </mesh>
    </group>
  )
}
