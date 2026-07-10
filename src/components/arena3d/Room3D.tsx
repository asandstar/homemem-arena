import { useMemo } from 'react'
import { Text, Billboard } from '@react-three/drei'
import type { RoomSpec } from '../../types/room'
import { sharedRooms } from '../../data/rooms'
import { MATERIAL_CONFIG } from './colors'
import { FallbackColorizer } from './models/ModelAsset'
import {
  ShoeCabinetModel,
  TowelRackModel,
  TVStandModel,
  WardrobeModel,
  NightstandModel,
  ChandelierModel,
  SofaModel,
  CoffeeTableModel,
  BedModel,
  DeskModel,
  WashingMachineGeometry,
  LaundryBasketModel,
  TableGeometry,
  ChairGeometry,
} from './ObjectGeometries'
import {
  LampFallback,
  PlantFallback,
  RugFallback,
  PillowFallback,
  ShoesFallback,
  HookFallback,
  TrashFallback,
  TowelFallback,
  EntranceTrayFallback,
} from './models/FallbackModels'

interface Room3DProps {
  spec: RoomSpec
}

function RoomDecorations({ spec }: { spec: RoomSpec }) {
  const { id, center, size } = spec

  const renderEntrance = () => (
    <group>
      <FallbackColorizer modelId="rug" color="#8b7355">
        <group position={[center.x, 0, center.z + size.z / 2 - 0.6]} receiveShadow>
          <RugFallback size={{ x: 1.4, y: 0.04, z: 0.8 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#8b5a2b">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z - 0.3]} castShadow receiveShadow>
          <ShoeCabinetModel size={{ x: 1.0, y: 1.0, z: 0.35 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="shoes" color="#4a4a4a">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z + 0.5]} receiveShadow>
          <ShoesFallback size={{ x: 0.3, y: 0.15, z: 0.4 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="hook" color="#4a4a4a">
        <group position={[center.x + size.x / 2 - 0.3, 1.4, center.z]} receiveShadow>
          <HookFallback size={{ x: 0.8, y: 0.25, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="entray" color="#d4a574">
        <group position={[center.x - 0.3, 0, center.z - size.z / 2 + 0.6]} receiveShadow>
          <EntranceTrayFallback size={{ x: 0.4, y: 0.08, z: 0.3 }} />
        </group>
      </FallbackColorizer>

      <mesh position={[center.x + 0.6, 0.35, center.z - size.z / 2 + 0.8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.7, 8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[center.x + 0.6, 0.74, center.z - size.z / 2 + 0.8]} receiveShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>

      <FallbackColorizer modelId="plant" color="#22c55e">
        <group position={[center.x - size.x / 2 + 1.2, 0, center.z + 0.8]} receiveShadow>
          <PlantFallback size={{ x: 0.25, y: 0.6, z: 0.25 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  const renderLiving = () => (
    <group>
      <FallbackColorizer modelId="rug" color="#a0522d">
        <group position={[center.x, 0, center.z - 0.3]} receiveShadow>
          <RugFallback size={{ x: 3.5, y: 0.04, z: 2.5 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="sofa" color="#8b5a2b">
        <group position={[center.x, 0, center.z - 0.8]} castShadow receiveShadow>
          <SofaModel size={{ x: 2.2, y: 0.9, z: 0.9 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="pillow" color="#ff6b6b">
        <group position={[-0.8, 0.45, center.z - 0.9]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </FallbackColorizer>
      <FallbackColorizer modelId="pillow" color="#4ecdc4">
        <group position={[0, 0.45, center.z - 0.95]} rotation={[0, -Math.PI / 8, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </FallbackColorizer>
      <FallbackColorizer modelId="pillow" color="#ffe66d">
        <group position={[0.8, 0.45, center.z - 0.9]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="coffee_table" color="#8b7355">
        <group position={[center.x, 0, center.z + 0.6]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 1.2, y: 0.4, z: 0.6 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#4a4a4a">
        <group position={[center.x, 0, center.z + size.z / 2 - 0.6]} castShadow receiveShadow>
          <TVStandModel size={{ x: 2.0, y: 0.5, z: 0.4 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="lamp" color="#f5d49a">
        <group position={[center.x + size.x / 2 - 1.2, 0, center.z - 1.2]} receiveShadow>
          <LampFallback size={{ x: 0.4, y: 1.8, z: 0.4 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="lamp" color="#e8d5b7">
        <group position={[center.x - size.x / 2 + 1.2, 0, center.z + 0.8]} receiveShadow>
          <LampFallback size={{ x: 0.35, y: 1.6, z: 0.35 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="plant" color="#16a34a">
        <group position={[center.x - size.x / 2 + 0.8, 0, center.z - 1.5]} receiveShadow>
          <PlantFallback size={{ x: 0.5, y: 1.2, z: 0.5 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="plant" color="#22c55e">
        <group position={[center.x + size.x / 2 - 0.8, 0, center.z + 1.2]} receiveShadow>
          <PlantFallback size={{ x: 0.35, y: 0.8, z: 0.35 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  const renderKitchen = () => (
    <group>
      <FallbackColorizer modelId="rug" color="#7a7a7a">
        <group position={[center.x, 0, center.z]} receiveShadow>
          <RugFallback size={{ x: 2.5, y: 0.04, z: 1.5 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#6b7280">
        <group position={[center.x + size.x / 2 - 0.5, 0, center.z - size.z / 2 + 0.8]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.8, y: 0.9, z: 0.6 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#6b7280">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z - size.z / 2 + 0.8]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.8, y: 0.9, z: 0.6 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#6b7280">
        <group position={[center.x, 0, center.z + size.z / 2 - 0.6]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 1.5, y: 0.9, z: 0.6 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="plant" color="#22c55e">
        <group position={[center.x - 0.5, 0, center.z + size.z / 2 - 0.5]} receiveShadow>
          <PlantFallback size={{ x: 0.2, y: 0.35, z: 0.2 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="trash" color="#374151">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z + 0.5]} receiveShadow>
          <TrashFallback size={{ x: 0.3, y: 0.4, z: 0.3 }} />
        </group>
      </FallbackColorizer>

      <mesh position={[center.x + 0.6, 1.0, center.z + size.z / 2 - 0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.2, 0.08]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[center.x + 0.6, 1.15, center.z + size.z / 2 - 0.5]} receiveShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  )

  const renderBedroom = () => (
    <group>
      <FallbackColorizer modelId="rug" color="#9e7a7a">
        <group position={[center.x, 0, center.z]} receiveShadow>
          <RugFallback size={{ x: 2.5, y: 0.04, z: 1.8 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="bed" color="#d4c5b0">
        <group position={[center.x, 0, center.z - 0.5]} castShadow receiveShadow>
          <BedModel size={{ x: 1.8, y: 1.0, z: 2.2 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="pillow" color="#fec8d8">
        <group position={[-0.5, 0.65, center.z - 1.2]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.4, y: 0.18, z: 0.3 }} />
        </group>
      </FallbackColorizer>
      <FallbackColorizer modelId="pillow" color="#e0bbe4">
        <group position={[0.5, 0.65, center.z - 1.2]} rotation={[0, -Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.4, y: 0.18, z: 0.3 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#8b7355">
        <group position={[center.x + 1.3, 0, center.z - 1.3]} castShadow receiveShadow>
          <NightstandModel size={{ x: 0.5, y: 0.55, z: 0.4 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="lamp" color="#f5d49a">
        <group position={[center.x + 1.3, 0.55, center.z - 1.3]} receiveShadow>
          <LampFallback size={{ x: 0.2, y: 0.45, z: 0.2 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#8b7355">
        <group position={[center.x - size.x / 2 + 0.8, 0, center.z - 1.3]} castShadow receiveShadow>
          <NightstandModel size={{ x: 0.5, y: 0.55, z: 0.4 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="lamp" color="#e8d5b7">
        <group position={[center.x - size.x / 2 + 0.8, 0.55, center.z - 1.3]} receiveShadow>
          <LampFallback size={{ x: 0.2, y: 0.45, z: 0.2 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="desk" color="#8b7355">
        <group position={[center.x + 1.4, 0, center.z + 0.8]} castShadow receiveShadow>
          <DeskModel size={{ x: 1.2, y: 0.75, z: 0.6 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="lamp" color="#f5d49a">
        <group position={[center.x + 1.0, 0.75, center.z + 0.7]} receiveShadow>
          <LampFallback size={{ x: 0.18, y: 0.4, z: 0.18 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#d4c5b0">
        <group position={[center.x - size.x / 2 + 0.8, 0, center.z + 0.8]} castShadow receiveShadow>
          <WardrobeModel size={{ x: 1.6, y: 2.0, z: 0.6 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="towel" color="#ff6b6b">
        <group position={[center.x + 0.6, 0, center.z + 1.4]} rotation={[Math.PI / 12, Math.PI / 6, Math.PI / 8]} receiveShadow>
          <TowelFallback size={{ x: 0.5, y: 0.1, z: 0.4 }} />
        </group>
      </FallbackColorizer>
      <FallbackColorizer modelId="towel" color="#4ecdc4">
        <group position={[center.x + 0.9, 0, center.z + 1.2]} rotation={[-Math.PI / 10, -Math.PI / 8, Math.PI / 12]} receiveShadow>
          <TowelFallback size={{ x: 0.45, y: 0.08, z: 0.4 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="plant" color="#22c55e">
        <group position={[center.x - size.x / 2 + 1.5, 0.45, center.z + 1.5]} receiveShadow>
          <PlantFallback size={{ x: 0.4, y: 0.9, z: 0.4 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  const renderLaundry = () => (
    <group>
      <mesh position={[center.x - 0.5, 0.55, center.z - size.z / 2 + 1.2]} castShadow receiveShadow>
        <WashingMachineGeometry size={{ x: 0.6, y: 1.1, z: 0.6 }} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      <mesh position={[center.x + 0.5, 0.55, center.z - size.z / 2 + 1.2]} castShadow receiveShadow>
        <WashingMachineGeometry size={{ x: 0.6, y: 1.1, z: 0.6 }} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      <FallbackColorizer modelId="laundry_basket" color="#ef4444">
        <group position={[center.x - 1.0, 0.25, center.z - 0.3]} castShadow receiveShadow>
          <LaundryBasketModel size={{ x: 0.45, y: 0.5, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="laundry_basket" color="#3b82f6">
        <group position={[center.x, 0.25, center.z - 0.3]} castShadow receiveShadow>
          <LaundryBasketModel size={{ x: 0.45, y: 0.5, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="laundry_basket" color="#22c55e">
        <group position={[center.x + 1.0, 0.25, center.z - 0.3]} castShadow receiveShadow>
          <LaundryBasketModel size={{ x: 0.45, y: 0.5, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="cabinet" color="#6b7280">
        <group position={[center.x + size.x / 2 - 0.4, 0.8, center.z]} castShadow receiveShadow>
          <TowelRackModel size={{ x: 1.0, y: 1.5, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="towel" color="#fbbf24">
        <group position={[center.x + size.x / 2 - 0.35, 0.9, center.z + 0.1]} receiveShadow>
          <TowelFallback size={{ x: 0.25, y: 0.5, z: 0.08 }} />
        </group>
      </FallbackColorizer>
      <FallbackColorizer modelId="towel" color="#a855f7">
        <group position={[center.x + size.x / 2 - 0.35, 0.9, center.z - 0.2]} receiveShadow>
          <TowelFallback size={{ x: 0.25, y: 0.5, z: 0.08 }} />
        </group>
      </FallbackColorizer>

      <mesh position={[center.x - 0.3, 1.225, center.z - size.z / 2 + 1.2]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.25, 0.08]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <mesh position={[center.x - 0.3, 1.38, center.z - size.z / 2 + 1.2]} receiveShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.06, 8]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>

      <FallbackColorizer modelId="towel" color="#fbbf24">
        <group position={[center.x - 0.6, 0.1, center.z + 1.2]} rotation={[Math.PI / 8, Math.PI / 6, Math.PI / 10]} receiveShadow>
          <TowelFallback size={{ x: 0.45, y: 0.08, z: 0.35 }} />
        </group>
      </FallbackColorizer>
      <FallbackColorizer modelId="towel" color="#a855f7">
        <group position={[center.x + 0.4, 0.08, center.z + 1.5]} rotation={[-Math.PI / 10, -Math.PI / 8, -Math.PI / 12]} receiveShadow>
          <TowelFallback size={{ x: 0.4, y: 0.07, z: 0.3 }} />
        </group>
      </FallbackColorizer>
      <FallbackColorizer modelId="towel" color="#ec4899">
        <group position={[center.x - 0.1, 0.06, center.z + 1.8]} rotation={[Math.PI / 12, -Math.PI / 6, Math.PI / 8]} receiveShadow>
          <TowelFallback size={{ x: 0.5, y: 0.09, z: 0.4 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  const renderDining = () => (
    <group>
      <FallbackColorizer modelId="rug" color="#8b7355">
        <group position={[center.x, 0.02, center.z]} receiveShadow>
          <RugFallback size={{ x: 3.0, y: 0.04, z: 2.0 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="dining_table" color="#8b7355">
        <group position={[center.x, 0.45, center.z]} castShadow receiveShadow>
          <TableGeometry size={{ x: 1.8, y: 0.9, z: 0.9 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="chair" color="#8b5a2b">
        <group position={[center.x - 1.0, 0.35, center.z - 0.5]} castShadow receiveShadow>
          <ChairGeometry size={{ x: 0.45, y: 0.7, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="chair" color="#8b5a2b">
        <group position={[center.x + 1.0, 0.35, center.z - 0.5]} castShadow receiveShadow>
          <ChairGeometry size={{ x: 0.45, y: 0.7, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="chair" color="#8b5a2b">
        <group position={[center.x - 1.0, 0.35, center.z + 0.5]} castShadow receiveShadow>
          <ChairGeometry size={{ x: 0.45, y: 0.7, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="chair" color="#8b5a2b">
        <group position={[center.x + 1.0, 0.35, center.z + 0.5]} castShadow receiveShadow>
          <ChairGeometry size={{ x: 0.45, y: 0.7, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <mesh position={[center.x - 0.5, 0.92, center.z - 0.25]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.1} />
      </mesh>

      <mesh position={[center.x + 0.5, 0.92, center.z - 0.25]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.4} metalness={0.1} />
      </mesh>

      <mesh position={[center.x - 0.5, 0.92, center.z + 0.25]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
        <meshStandardMaterial color="#fdf2f8" roughness={0.4} metalness={0.1} />
      </mesh>

      <mesh position={[center.x + 0.5, 0.92, center.z + 0.25]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.1} />
      </mesh>

      <mesh position={[center.x, 0.91, center.z]} rotation={[Math.PI / 12, 0, Math.PI / 8]} receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} metalness={0.05} />
      </mesh>

      <FallbackColorizer modelId="lamp" color="#f5d49a">
        <group position={[center.x, 2.7, center.z]} castShadow receiveShadow>
          <ChandelierModel size={{ x: 0.6, y: 0.5, z: 0.6 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="plant" color="#22c55e">
        <group position={[center.x - size.x / 2 + 0.8, 0.35, center.z - size.z / 2 + 0.8]} receiveShadow>
          <PlantFallback size={{ x: 0.3, y: 0.7, z: 0.3 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  switch (id) {
    case 'entrance':
      return renderEntrance()
    case 'living':
      return renderLiving()
    case 'kitchen':
      return renderKitchen()
    case 'bedroom':
      return renderBedroom()
    case 'laundry':
      return renderLaundry()
    case 'dining':
      return renderDining()
    default:
      return null
  }
}

export function Room3D({ spec }: Room3DProps) {
  const walls = useMemo(() => {
    const { center, size, doorways, wallColor } = spec
    const w = size.x
    const d = size.z
    const h = size.y
    const t = 0.1

    type WallMesh = { position: [number, number, number]; size: [number, number, number]; color: string; isDoor: boolean }
    const wallList: WallMesh[] = []

    wallList.push({ position: [center.x - w / 2, h / 2, center.z], size: [t, h, d], color: wallColor, isDoor: false })
    wallList.push({ position: [center.x + w / 2, h / 2, center.z], size: [t, h, d], color: wallColor, isDoor: false })
    wallList.push({ position: [center.x, h / 2, center.z - d / 2], size: [w, h, t], color: wallColor, isDoor: false })
    wallList.push({ position: [center.x, h / 2, center.z + d / 2], size: [w, h, t], color: wallColor, isDoor: false })

    for (const door of doorways) {
      const dx = door.offset.x
      const dz = door.offset.z
      const ww = door.width
      const hh = door.height

      if (Math.abs(dx) > Math.abs(dz)) {
        const isEast = dx > 0
        const x = isEast ? center.x + w / 2 : center.x - w / 2
        const sign = isEast ? -1 : 1

        wallList.push({
          position: [x, h - (h - hh) / 2, center.z + dz],
          size: [t, h - hh, d - Math.abs(dz) * 2],
          color: wallColor,
          isDoor: false,
        })

        if (dz - ww / 2 > -d / 2) {
          wallList.push({
            position: [x, h / 2, center.z - d / 2 + (dz - ww / 2 + d / 2) / 2],
            size: [t, hh, dz - ww / 2 + d / 2],
            color: wallColor,
            isDoor: false,
          })
        }

        if (dz + ww / 2 < d / 2) {
          wallList.push({
            position: [x, h / 2, center.z + d / 2 - (d / 2 - dz - ww / 2) / 2],
            size: [t, hh, d / 2 - dz - ww / 2],
            color: wallColor,
            isDoor: false,
          })
        }

        wallList.push({
          position: [x + sign * t, hh / 2, center.z + dz],
          size: [0.05, hh + 0.05, ww],
          color: '#8b5a2b',
          isDoor: true,
        })
      } else {
        const isNorth = dz > 0
        const z = isNorth ? center.z + d / 2 : center.z - d / 2
        const sign = isNorth ? -1 : 1

        wallList.push({
          position: [center.x + dx, h - (h - hh) / 2, z],
          size: [w - Math.abs(dx) * 2, h - hh, t],
          color: wallColor,
          isDoor: false,
        })

        if (dx - ww / 2 > -w / 2) {
          wallList.push({
            position: [center.x - w / 2 + (dx - ww / 2 + w / 2) / 2, h / 2, z],
            size: [dx - ww / 2 + w / 2, hh, t],
            color: wallColor,
            isDoor: false,
          })
        }

        if (dx + ww / 2 < w / 2) {
          wallList.push({
            position: [center.x + w / 2 - (w / 2 - dx - ww / 2) / 2, h / 2, z],
            size: [w / 2 - dx - ww / 2, hh, t],
            color: wallColor,
            isDoor: false,
          })
        }

        wallList.push({
          position: [center.x + dx, hh / 2, z + sign * t],
          size: [ww, hh + 0.05, 0.05],
          color: '#8b5a2b',
          isDoor: true,
        })
      }
    }

    return wallList
  }, [spec])

  return (
    <group>
      <mesh
        position={[spec.center.x, 0, spec.center.z]}
        receiveShadow
      >
        <boxGeometry args={[spec.size.x, 0.1, spec.size.z]} />
        <meshStandardMaterial
          color={spec.floorColor}
          roughness={MATERIAL_CONFIG.wood.roughness}
          metalness={MATERIAL_CONFIG.wood.metalness}
        />
      </mesh>

      {walls.map((wall, i) => (
        <mesh
          key={i}
          position={wall.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={wall.size} />
          <meshStandardMaterial
            color={wall.color}
            roughness={0.8}
            metalness={0.05}
          />
        </mesh>
      ))}

      <Billboard position={[spec.center.x, spec.size.y + 0.15, spec.center.z]}>
        <mesh>
          <boxGeometry args={[1.2, 0.15, 0.02]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.9} />
        </mesh>
        <Text
          position={[0, 0.01, 0.005]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {spec.name}
        </Text>
      </Billboard>

      {spec.doorways.map((door, i) => {
        const dx = door.offset.x
        const dz = door.offset.z
        const ww = door.width
        const hh = door.height

        // 发光门框
        const doorFrameColor = '#10b981'
        const targetRoomName = sharedRooms[door.connectsTo as keyof typeof sharedRooms]?.name || door.connectsTo

        return (
          <group key={`door-${i}`}>
            {/* 发光边框 - 左 */}
            <mesh
              position={[
                Math.abs(dx) > Math.abs(dz)
                  ? dx > 0 ? spec.center.x + spec.size.x / 2 : spec.center.x - spec.size.x / 2
                  : spec.center.x + dx - ww / 2,
                hh / 2,
                Math.abs(dz) > Math.abs(dx)
                  ? dz > 0 ? spec.center.z + spec.size.z / 2 : spec.center.z - spec.size.z / 2
                  : spec.center.z + dz
              ]}
            >
              <boxGeometry args={[0.08, hh, 0.08]} />
              <meshStandardMaterial color={doorFrameColor} emissive={doorFrameColor} emissiveIntensity={0.5} />
            </mesh>
            {/* 发光边框 - 右 */}
            <mesh
              position={[
                Math.abs(dx) > Math.abs(dz)
                  ? dx > 0 ? spec.center.x + spec.size.x / 2 : spec.center.x - spec.size.x / 2
                  : spec.center.x + dx + ww / 2,
                hh / 2,
                Math.abs(dz) > Math.abs(dx)
                  ? dz > 0 ? spec.center.z + spec.size.z / 2 : spec.center.z - spec.size.z / 2
                  : spec.center.z + dz
              ]}
            >
              <boxGeometry args={[0.08, hh, 0.08]} />
              <meshStandardMaterial color={doorFrameColor} emissive={doorFrameColor} emissiveIntensity={0.5} />
            </mesh>
            {/* 发光边框 - 上 */}
            <mesh
              position={[
                Math.abs(dx) > Math.abs(dz)
                  ? dx > 0 ? spec.center.x + spec.size.x / 2 : spec.center.x - spec.size.x / 2
                  : spec.center.x + dx,
                hh,
                Math.abs(dz) > Math.abs(dx)
                  ? dz > 0 ? spec.center.z + spec.size.z / 2 : spec.center.z - spec.size.z / 2
                  : spec.center.z + dz
              ]}
              rotation={[Math.abs(dx) > Math.abs(dz) ? 0 : Math.PI / 2, 0, 0]}
            >
              <boxGeometry args={[0.08, ww + 0.16, 0.08]} />
              <meshStandardMaterial color={doorFrameColor} emissive={doorFrameColor} emissiveIntensity={0.5} />
            </mesh>
            {/* 地面通行提示箭头 */}
            <mesh
              position={[
                Math.abs(dx) > Math.abs(dz)
                  ? dx > 0 ? spec.center.x + spec.size.x / 2 - 0.5 : spec.center.x - spec.size.x / 2 + 0.5
                  : spec.center.x + dx,
                0.02,
                Math.abs(dz) > Math.abs(dx)
                  ? dz > 0 ? spec.center.z + spec.size.z / 2 - 0.5 : spec.center.z - spec.size.z / 2 + 0.5
                  : spec.center.z + dz
              ]}
              rotation={[-Math.PI / 2, 0, Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? Math.PI : 0) : (dz > 0 ? Math.PI / 2 : -Math.PI / 2)]}
            >
              <coneGeometry args={[0.2, 0.4, 4]} />
              <meshStandardMaterial color={doorFrameColor} emissive={doorFrameColor} emissiveIntensity={0.3} />
            </mesh>
            {/* 门洞上方房间名标签 */}
            <Billboard
              position={[
                Math.abs(dx) > Math.abs(dz)
                  ? dx > 0 ? spec.center.x + spec.size.x / 2 + 0.3 : spec.center.x - spec.size.x / 2 - 0.3
                  : spec.center.x + dx,
                hh + 0.2,
                Math.abs(dz) > Math.abs(dx)
                  ? dz > 0 ? spec.center.z + spec.size.z / 2 + 0.3 : spec.center.z - spec.size.z / 2 - 0.3
                  : spec.center.z + dz
              ]}
            >
              <Text
                fontSize={0.12}
                color={doorFrameColor}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#1f2937"
              >
                → {targetRoomName}
              </Text>
            </Billboard>
          </group>
        )
      })}

      <RoomDecorations spec={spec} />
    </group>
  )
}
