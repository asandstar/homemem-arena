import { useMemo } from 'react'
import { Text, Billboard } from '@react-three/drei'
import type { RoomSpec } from '../../types/room'
import { MATERIAL_CONFIG } from './colors'
import { Door3D } from './Door3D'
import { FallbackColorizer, RoomDecorPiece } from './models/ModelAsset'
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
  BookshelfFallback,
  ChairFallback,
  TVFallback,
  ClockFallback,
  PaintingFallback,
  ShelfFallback,
  DresserFallback,
} from './models/FallbackModels'
import { RegisteredModel } from './RegisteredModel'
import { roomDecorFurniture } from '../../data/decorFurniture'

/** §十一 feature flag: 默认启用 Kenney Living GLB 模型（DEV + PROD 均启用）。
 *  可通过 VITE_USE_KENNEY_LIVING_ASSETS=false 显式关闭（用于回归对比、A/B 验证）。
 *  注意：不以 hook 形式定义，避免在 renderLiving 子函数中调用触发 hooks 规则警告。
 */
function shouldUseKenneyLiving(): boolean {
  try {
    const env = import.meta.env
    const flag = String(env?.VITE_USE_KENNEY_LIVING_ASSETS ?? '')
    if (flag === 'false' || flag === '0') return false
    return true
  } catch {
    return true
  }
}

interface Room3DProps {
  spec: RoomSpec
}

function RoomDecorations({ spec }: { spec: RoomSpec }) {
  const { id, center, size } = spec

  const renderEntrance = () => (
    <group>
      <RoomDecorPiece modelId="rug" color="#8b7355">
        <group position={[center.x, 0, center.z + size.z / 2 - 0.8]} receiveShadow>
          <RugFallback size={{ x: 2.0, y: 0.04, z: 1.2 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#8b5a2b">
        <group position={[center.x - size.x / 2 + 0.6, 0, center.z - 0.5]} castShadow receiveShadow>
          <ShoeCabinetModel size={{ x: 1.2, y: 1.1, z: 0.4 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="shoes" color="#4a4a4a">
        <group position={[center.x - size.x / 2 + 0.6, 0, center.z + 0.3]} receiveShadow>
          <ShoesFallback size={{ x: 0.35, y: 0.15, z: 0.45 }} />
        </group>
      </RoomDecorPiece>

      <group position={[center.x - size.x / 2 + 0.9, 0.15, center.z + 0.2]} receiveShadow>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.25, 0.12, 0.08]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
      </group>
      <group position={[center.x - size.x / 2 + 1.2, 0.12, center.z + 0.15]} receiveShadow>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.22, 0.1, 0.08]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.4} />
        </mesh>
      </group>

      <group position={[center.x - 0.4, 0.12, center.z - size.z / 2 + 0.7]} receiveShadow>
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.15, 0.1, 0.1]} />
          <meshStandardMaterial color="#6b4e3d" roughness={0.4} />
        </mesh>
        <mesh position={[-0.15, 0, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} />
        </mesh>
        <mesh position={[-0.15, 0, 0.08]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} />
        </mesh>
      </group>

      <RoomDecorPiece modelId="hook" color="#4a4a4a">
        <group position={[center.x + size.x / 2 - 0.3, 1.5, center.z]} receiveShadow>
          <HookFallback size={{ x: 1.0, y: 0.3, z: 0.05 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="entrance_tray" color="#d4a574">
        <group position={[center.x - 0.4, 0, center.z - size.z / 2 + 0.7]} receiveShadow>
          <EntranceTrayFallback size={{ x: 0.5, y: 0.1, z: 0.35 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="umbrella" color="#ef4444">
        <group position={[center.x + 0.8, 0.4, center.z - size.z / 2 + 0.7]} castShadow receiveShadow>
          <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.25, 0.2, 8]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="umbrella" color="#3b82f6">
        <group position={[center.x + 0.5, 0.4, center.z - size.z / 2 + 0.7]} castShadow receiveShadow>
          <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.45, 8]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
            <coneGeometry args={[0.22, 0.18, 8]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="painting" color="#8b5a2b">
        <group position={[center.x, 1.0, center.z + size.z / 2 - 0.3]} rotation={[0, Math.PI, 0]} receiveShadow>
          <PaintingFallback size={{ x: 0.6, y: 0.45, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="clock" color="#d4a574">
        <group position={[center.x + size.x / 2 - 0.3, 1.6, center.z + 1.0]} receiveShadow>
          <ClockFallback size={{ x: 0.3, y: 0.3, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <RoomDecorPiece modelId="plant" color="#22c55e">
        <group position={[center.x - size.x / 2 + 1.0, 0, center.z + 0.8]} receiveShadow>
          <PlantFallback size={{ x: 0.3, y: 0.7, z: 0.3 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#15803d">
        <group position={[center.x + size.x / 2 - 1.0, 0, center.z - 0.5]} receiveShadow>
          <PlantFallback size={{ x: 0.25, y: 0.6, z: 0.25 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="shelf" color="#9ca3af">
        <group position={[center.x + size.x / 2 - 0.5, 0, center.z + 1.5]} castShadow receiveShadow>
          <ShelfFallback size={{ x: 0.4, y: 0.8, z: 0.15 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  const renderLiving = () => {
    // A6 单一数据源：四件核心 static decor 的 transform 来自 decorFurniture.ts
    // Room3D 不再手写这四件的 position/rotation，避免与碰撞/小地图坐标漂移。
    const livingDecor = roomDecorFurniture.living
    const sofaSpec = livingDecor.find((d) => d.id === 'decor-sofa-main')
    const tvStandSpec = livingDecor.find((d) => d.id === 'decor-tv-stand')
    const tvSpec = livingDecor.find((d) => d.id === 'decor-tv')
    const bookshelfSpec = livingDecor.find((d) => d.id === 'decor-bookshelf')
    const decorWorld = (pos: { x: number; y: number; z: number }): [number, number, number] => [
      center.x + pos.x,
      pos.y,
      center.z + pos.z,
    ]
    return (
    <group>
      <RoomDecorPiece modelId="rug" color="#a0522d">
        <group position={[center.x, 0, center.z - 0.5]} receiveShadow>
          <RugFallback size={{ x: 4.0, y: 0.04, z: 3.0 }} />
        </group>
      </RoomDecorPiece>

      {/* 主沙发：decorFurniture 单一数据源（A6: (-1.5, 0, 2.24) rot=π） */}
      {sofaSpec && shouldUseKenneyLiving() && sofaSpec.modelAssetId ? (
        <RegisteredModel
          assetId={sofaSpec.modelAssetId}
          position={decorWorld(sofaSpec.position)}
          rotationY={sofaSpec.rotationY ?? 0}
          fallback={<SofaModel size={{ x: sofaSpec.size.x, y: sofaSpec.size.y, z: sofaSpec.size.z }} />}
        />
      ) : sofaSpec ? (
        <FallbackColorizer modelId="sofa" color="#8b5a2b">
          <group position={decorWorld(sofaSpec.position)} rotation={[0, sofaSpec.rotationY ?? 0, 0]} castShadow receiveShadow>
            <SofaModel size={{ x: sofaSpec.size.x, y: sofaSpec.size.y, z: sofaSpec.size.z }} />
          </group>
        </FallbackColorizer>
      ) : null}

      {/* 枕头：跟随主沙发 A6 位置（南墙 z=+2.24，沙发 X 跨度 [-2.7, -0.3]） */}
      <RoomDecorPiece modelId="pillow" color="#ff6b6b">
        <group position={[center.x - 2.4, 0.45, center.z + 2.0]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#4ecdc4">
        <group position={[center.x - 1.5, 0.45, center.z + 2.0]} rotation={[0, -Math.PI / 8, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#ffe66d">
        <group position={[center.x - 0.6, 0.45, center.z + 2.0]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </RoomDecorPiece>

      {/* decor-sofa-side 已删除（A6 移除：侵入 Bedroom-Entrance 走廊） */}
      {/* 茶几视觉由 cnt-coffee-table (Container3D) 唯一承担，不再在此渲染第二张 */}
      {/* 旧茶几上的书本/果盘装饰随旧茶几位置失效，已移除 */}

      <FallbackColorizer modelId="cat" color="#8b7355">
        <group position={[center.x + 0.3, 0.45, center.z - 1.4]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.25, 0.3]} />
            <meshStandardMaterial color="#8b7355" roughness={0.3} />
          </mesh>
          <mesh position={[-0.15, 0.15, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#8b7355" roughness={0.3} />
          </mesh>
          <mesh position={[-0.22, 0.18, -0.05]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#8b7355" roughness={0.3} />
          </mesh>
          <mesh position={[-0.08, 0.18, -0.05]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#8b7355" roughness={0.3} />
          </mesh>
          <mesh position={[-0.23, 0.17, -0.02]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#1f2937" roughness={0.1} />
          </mesh>
          <mesh position={[-0.09, 0.17, -0.02]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#1f2937" roughness={0.1} />
          </mesh>
        </group>
      </FallbackColorizer>

      {/* 电视柜：decorFurniture 单一数据源（A6: (-2.0, 0, -2.1) rot=0） */}
      {tvStandSpec && shouldUseKenneyLiving() && tvStandSpec.modelAssetId ? (
        <RegisteredModel
          assetId={tvStandSpec.modelAssetId}
          position={decorWorld(tvStandSpec.position)}
          rotationY={tvStandSpec.rotationY ?? 0}
          fallback={<TVStandModel size={{ x: tvStandSpec.size.x, y: tvStandSpec.size.y, z: tvStandSpec.size.z }} />}
        />
      ) : tvStandSpec ? (
        <FallbackColorizer modelId="cabinet" color="#4a4a4a">
          <group position={decorWorld(tvStandSpec.position)} rotation={[0, tvStandSpec.rotationY ?? 0, 0]} castShadow receiveShadow>
            <TVStandModel size={{ x: tvStandSpec.size.x, y: tvStandSpec.size.y, z: tvStandSpec.size.z }} />
          </group>
        </FallbackColorizer>
      ) : null}

      {/* 电视：decorFurniture 单一数据源（A6: (-2.0, 0.62, -2.1) rot=0, collisionMode=none） */}
      {tvSpec && shouldUseKenneyLiving() && tvSpec.modelAssetId ? (
        <RegisteredModel
          assetId={tvSpec.modelAssetId}
          position={decorWorld(tvSpec.position)}
          rotationY={tvSpec.rotationY ?? 0}
          fallback={<TVFallback size={{ x: tvSpec.size.x, y: tvSpec.size.y, z: tvSpec.size.z }} />}
        />
      ) : tvSpec ? (
        <FallbackColorizer modelId="tv" color="#1f2937">
          <group position={decorWorld(tvSpec.position)} rotation={[0, tvSpec.rotationY ?? 0, 0]} castShadow receiveShadow>
            <TVFallback size={{ x: tvSpec.size.x, y: tvSpec.size.y, z: tvSpec.size.z }} />
          </group>
        </FallbackColorizer>
      ) : null}

      {/* 书架：decorFurniture 单一数据源（A6: (2.75, 0, 1.5) rot=-π/2） */}
      {bookshelfSpec && shouldUseKenneyLiving() && bookshelfSpec.modelAssetId ? (
        <RegisteredModel
          assetId={bookshelfSpec.modelAssetId}
          position={decorWorld(bookshelfSpec.position)}
          rotationY={bookshelfSpec.rotationY ?? 0}
          fallback={<BookshelfFallback size={{ x: bookshelfSpec.size.x, y: bookshelfSpec.size.y, z: bookshelfSpec.size.z }} />}
        />
      ) : bookshelfSpec ? (
        <FallbackColorizer modelId="bookshelf" color="#6b4423">
          <group position={decorWorld(bookshelfSpec.position)} rotation={[0, bookshelfSpec.rotationY ?? 0, 0]} castShadow receiveShadow>
            <BookshelfFallback size={{ x: bookshelfSpec.size.x, y: bookshelfSpec.size.y, z: bookshelfSpec.size.z }} />
          </group>
        </FallbackColorizer>
      ) : null}

      <FallbackColorizer modelId="shelf" color="#9ca3af">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z + 1.0]} castShadow receiveShadow>
          <ShelfFallback size={{ x: 0.7, y: 1.2, z: 0.2 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="painting" color="#8b5a2b">
        <group position={[center.x - size.x / 2 + 0.3, 1.2, center.z + 1.5]} rotation={[0, Math.PI, 0]} receiveShadow>
          <PaintingFallback size={{ x: 0.8, y: 0.6, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="clock" color="#d4a574">
        <group position={[center.x + size.x / 2 - 0.3, 1.8, center.z]} receiveShadow>
          <ClockFallback size={{ x: 0.4, y: 0.4, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <RoomDecorPiece modelId="lamp" color="#f5d49a">
        <group position={[center.x + size.x / 2 - 1.0, 0, center.z - 2.0]} receiveShadow>
          <LampFallback size={{ x: 0.4, y: 1.8, z: 0.4 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="lamp" color="#e8d5b7">
        <group position={[center.x - size.x / 2 + 1.0, 0, center.z + 0.5]} receiveShadow>
          <LampFallback size={{ x: 0.35, y: 1.6, z: 0.35 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#16a34a">
        <group position={[center.x - size.x / 2 + 0.6, 0, center.z - 2.0]} receiveShadow>
          <PlantFallback size={{ x: 0.5, y: 1.2, z: 0.5 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#22c55e">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z + 2.0]} receiveShadow>
          <PlantFallback size={{ x: 0.35, y: 0.8, z: 0.35 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#15803d">
        <group position={[center.x + 1.5, 0, center.z - 2.0]} receiveShadow>
          <PlantFallback size={{ x: 0.4, y: 1.0, z: 0.4 }} />
        </group>
      </RoomDecorPiece>

      {/* decor-chair 已删除（A6：与核心布局无关的旧落地家具） */}
      {/* 第二张 coffee_table 已删除（A6-H7：cnt-coffee-table 唯一视觉所有者） */}
    </group>
    )
  }

  const renderDiningKitchen = () => (
    <group>
      <RoomDecorPiece modelId="rug" color="#7a7a7a">
        <group position={[center.x, 0, center.z - 0.5]} receiveShadow>
          <RugFallback size={{ x: 3.0, y: 0.04, z: 2.0 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z - size.z / 2 + 0.6]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.8, y: 0.9, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z + 0.5]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.8, y: 0.9, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z + size.z / 2 - 0.6]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.8, y: 0.9, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x, 0, center.z + size.z / 2 - 0.5]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 1.6, y: 0.9, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x + size.x / 2 - 0.5, 0, center.z + size.z / 2 - 0.6]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.8, y: 0.9, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x + size.x / 2 - 0.5, 0, center.z + 0.5]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.8, y: 0.9, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="fridge" color="#f9fafb">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z - size.z / 2 + 0.8]} castShadow receiveShadow>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[0.7, 2.0, 0.6]} />
            <meshStandardMaterial color="#f9fafb" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh position={[0, 1.6, 0.31]}>
            <boxGeometry args={[0.3, 0.7, 0.02]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.1} metalness={0.2} />
          </mesh>
          <mesh position={[0.25, 1.6, 0.32]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.25, 1.2, 0.32]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="sink" color="#9ca3af">
        <group position={[center.x - 0.5, 0.85, center.z + size.z / 2 - 0.5]} castShadow receiveShadow>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.6, 0.3, 0.4]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.1} metalness={0.1} />
          </mesh>
          <mesh position={[0.15, 0.4, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.3} />
          </mesh>
          <mesh position={[0.15, 0.48, 0.08]}>
            <boxGeometry args={[0.06, 0.02, 0.02]} />
            <meshStandardMaterial color="#6b7280" metalness={0.3} />
          </mesh>
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="stove" color="#374151">
        <group position={[center.x + 0.5, 0.85, center.z + size.z / 2 - 0.5]} castShadow receiveShadow>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.7, 0.2, 0.5]} />
            <meshStandardMaterial color="#374151" roughness={0.2} metalness={0.2} />
          </mesh>
          <mesh position={[-0.15, 0.2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
            <meshStandardMaterial color="#1f2937" roughness={0.1} metalness={0.3} />
          </mesh>
          <mesh position={[0.15, 0.2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
            <meshStandardMaterial color="#1f2937" roughness={0.1} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.22, -0.12]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 12]} />
            <meshStandardMaterial color="#1f2937" roughness={0.1} metalness={0.3} />
          </mesh>
          <mesh position={[0.25, 0.15, 0.18]}>
            <boxGeometry args={[0.04, 0.06, 0.03]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="microwave" color="#1f2937">
        <group position={[center.x + 0.5, 1.5, center.z + size.z / 2 - 0.5]} castShadow receiveShadow>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.35, 0.4]} />
            <meshStandardMaterial color="#1f2937" roughness={0.2} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.02, 0.21]}>
            <boxGeometry args={[0.35, 0.25, 0.01]} />
            <meshStandardMaterial color="#0ea5e9" roughness={0.1} metalness={0.1} />
          </mesh>
          <mesh position={[0.15, -0.05, 0.22]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      </FallbackColorizer>

      <RoomDecorPiece modelId="plant" color="#22c55e">
        <group position={[center.x - 0.8, 0, center.z + size.z / 2 - 0.5]} receiveShadow>
          <PlantFallback size={{ x: 0.25, y: 0.45, z: 0.25 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="trash" color="#374151">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z - 1.0]} receiveShadow>
          <TrashFallback size={{ x: 0.35, y: 0.45, z: 0.35 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="shelf" color="#9ca3af">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z + 2.0]} castShadow receiveShadow>
          <ShelfFallback size={{ x: 0.5, y: 1.0, z: 0.15 }} />
        </group>
      </FallbackColorizer>

      <mesh position={[center.x + 0.8, 1.0, center.z + size.z / 2 - 0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.2, 0.08]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[center.x + 0.8, 1.15, center.z + size.z / 2 - 0.5]} receiveShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      <FallbackColorizer modelId="chair" color="#6b4e3d">
        <group position={[center.x + 1.5, 0, center.z - 1.0]} castShadow receiveShadow>
          <ChairFallback size={{ x: 0.45, y: 0.65, z: 0.45 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  const renderBedroom = () => (
    <group>
      <RoomDecorPiece modelId="rug" color="#9e7a7a">
        <group position={[center.x, 0, center.z - 0.3]} receiveShadow>
          <RugFallback size={{ x: 3.0, y: 0.04, z: 2.2 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="bed" color="#d4c5b0">
        <group position={[center.x, 0, center.z - 0.8]} castShadow receiveShadow>
          <BedModel size={{ x: 2.0, y: 1.0, z: 2.4 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="pillow" color="#fec8d8">
        <group position={[-0.6, 0.65, center.z - 1.5]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.4, y: 0.18, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#e0bbe4">
        <group position={[0.6, 0.65, center.z - 1.5]} rotation={[0, -Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.4, y: 0.18, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#fef3c7">
        <group position={[0, 0.62, center.z - 1.4]} rotation={[0, Math.PI / 8, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.28 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#8b7355">
        <group position={[center.x + 1.5, 0, center.z - 1.5]} castShadow receiveShadow>
          <NightstandModel size={{ x: 0.55, y: 0.55, z: 0.45 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="lamp" color="#f5d49a">
        <group position={[center.x + 1.5, 0.55, center.z - 1.5]} receiveShadow>
          <LampFallback size={{ x: 0.22, y: 0.45, z: 0.22 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#8b7355">
        <group position={[center.x - size.x / 2 + 0.85, 0, center.z - 1.5]} castShadow receiveShadow>
          <NightstandModel size={{ x: 0.55, y: 0.55, z: 0.45 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="lamp" color="#e8d5b7">
        <group position={[center.x - size.x / 2 + 0.85, 0.55, center.z - 1.5]} receiveShadow>
          <LampFallback size={{ x: 0.22, y: 0.45, z: 0.22 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="desk" color="#8b7355">
        <group position={[center.x + 1.6, 0, center.z + 1.0]} castShadow receiveShadow>
          <DeskModel size={{ x: 1.3, y: 0.75, z: 0.65 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="lamp" color="#f5d49a">
        <group position={[center.x + 1.2, 0.75, center.z + 0.9]} receiveShadow>
          <LampFallback size={{ x: 0.18, y: 0.4, z: 0.18 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="chair" color="#6b4e3d">
        <group position={[center.x + 2.5, 0, center.z + 1.0]} castShadow receiveShadow rotation={[0, Math.PI, 0]}>
          <ChairFallback size={{ x: 0.45, y: 0.65, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <RoomDecorPiece modelId="cabinet" color="#d4c5b0">
        <group position={[center.x - size.x / 2 + 0.85, 0, center.z + 0.6]} castShadow receiveShadow>
          <WardrobeModel size={{ x: 1.8, y: 2.1, z: 0.65 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="dresser" color="#c4a7a7">
        <group position={[center.x - 1.5, 0, center.z + 1.5]} castShadow receiveShadow>
          <DresserFallback size={{ x: 1.2, y: 0.9, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="bookshelf" color="#6b4423">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z + 1.0]} castShadow receiveShadow>
          <BookshelfFallback size={{ x: 0.7, y: 1.6, z: 0.3 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="painting" color="#8b5a2b">
        <group position={[center.x, 1.2, center.z + size.z / 2 - 0.3]} rotation={[0, Math.PI, 0]} receiveShadow>
          <PaintingFallback size={{ x: 0.7, y: 0.5, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="clock" color="#d4a574">
        <group position={[center.x + size.x / 2 - 0.3, 1.8, center.z - 1.5]} receiveShadow>
          <ClockFallback size={{ x: 0.35, y: 0.35, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <RoomDecorPiece modelId="towel" color="#ff6b6b">
        <group position={[center.x + 0.8, 0, center.z + 1.6]} rotation={[Math.PI / 12, Math.PI / 6, Math.PI / 8]} receiveShadow>
          <TowelFallback size={{ x: 0.5, y: 0.1, z: 0.4 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="towel" color="#4ecdc4">
        <group position={[center.x + 1.1, 0, center.z + 1.4]} rotation={[-Math.PI / 10, -Math.PI / 8, Math.PI / 12]} receiveShadow>
          <TowelFallback size={{ x: 0.45, y: 0.08, z: 0.4 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#22c55e">
        <group position={[center.x - size.x / 2 + 1.2, 0, center.z + 2.0]} receiveShadow>
          <PlantFallback size={{ x: 0.4, y: 0.9, z: 0.4 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#15803d">
        <group position={[center.x + 1.0, 0, center.z + 2.5]} receiveShadow>
          <PlantFallback size={{ x: 0.35, y: 0.75, z: 0.35 }} />
        </group>
      </RoomDecorPiece>
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

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z - size.z / 2 + 0.6]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.6, y: 0.9, z: 0.5 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z + 0.5]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.6, y: 0.9, z: 0.5 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x - size.x / 2 + 0.5, 0, center.z + size.z / 2 - 0.6]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 0.6, y: 0.9, z: 0.5 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="shelf" color="#9ca3af">
        <group position={[center.x + size.x / 2 - 0.5, 0, center.z + 1.5]} castShadow receiveShadow>
          <ShelfFallback size={{ x: 0.5, y: 1.0, z: 0.15 }} />
        </group>
      </FallbackColorizer>

      <RoomDecorPiece modelId="laundry_basket" color="#ef4444">
        <group position={[center.x - 1.0, 0.25, center.z - 0.3]} castShadow receiveShadow>
          <LaundryBasketModel size={{ x: 0.45, y: 0.5, z: 0.45 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="laundry_basket" color="#3b82f6">
        <group position={[center.x, 0.25, center.z - 0.3]} castShadow receiveShadow>
          <LaundryBasketModel size={{ x: 0.45, y: 0.5, z: 0.45 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="laundry_basket" color="#22c55e">
        <group position={[center.x + 1.0, 0.25, center.z - 0.3]} castShadow receiveShadow>
          <LaundryBasketModel size={{ x: 0.45, y: 0.5, z: 0.45 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b7280">
        <group position={[center.x + size.x / 2 - 0.4, 0.8, center.z]} castShadow receiveShadow>
          <TowelRackModel size={{ x: 1.0, y: 1.5, z: 0.05 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="towel" color="#fbbf24">
        <group position={[center.x + size.x / 2 - 0.35, 0.9, center.z + 0.1]} receiveShadow>
          <TowelFallback size={{ x: 0.25, y: 0.5, z: 0.08 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="towel" color="#a855f7">
        <group position={[center.x + size.x / 2 - 0.35, 0.9, center.z - 0.2]} receiveShadow>
          <TowelFallback size={{ x: 0.25, y: 0.5, z: 0.08 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="towel" color="#ec4899">
        <group position={[center.x + size.x / 2 - 0.35, 0.9, center.z + 0.4]} receiveShadow>
          <TowelFallback size={{ x: 0.25, y: 0.5, z: 0.08 }} />
        </group>
      </RoomDecorPiece>

      <mesh position={[center.x - 0.3, 1.225, center.z - size.z / 2 + 1.2]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.25, 0.08]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <mesh position={[center.x - 0.3, 1.38, center.z - size.z / 2 + 1.2]} receiveShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.06, 8]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>

      <RoomDecorPiece modelId="towel" color="#fbbf24">
        <group position={[center.x - 0.6, 0.1, center.z + 1.2]} rotation={[Math.PI / 8, Math.PI / 6, Math.PI / 10]} receiveShadow>
          <TowelFallback size={{ x: 0.45, y: 0.08, z: 0.35 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="towel" color="#a855f7">
        <group position={[center.x + 0.4, 0.08, center.z + 1.5]} rotation={[-Math.PI / 10, -Math.PI / 8, -Math.PI / 12]} receiveShadow>
          <TowelFallback size={{ x: 0.4, y: 0.07, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="towel" color="#ec4899">
        <group position={[center.x - 0.1, 0.06, center.z + 1.8]} rotation={[Math.PI / 12, -Math.PI / 6, Math.PI / 8]} receiveShadow>
          <TowelFallback size={{ x: 0.5, y: 0.09, z: 0.4 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#22c55e">
        <group position={[center.x + size.x / 2 - 0.8, 0, center.z - 0.5]} receiveShadow>
          <PlantFallback size={{ x: 0.25, y: 0.6, z: 0.25 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="trash" color="#374151">
        <group position={[center.x - size.x / 2 + 0.6, 0, center.z - 1.0]} receiveShadow>
          <TrashFallback size={{ x: 0.3, y: 0.4, z: 0.3 }} />
        </group>
      </RoomDecorPiece>

      <mesh position={[center.x + 0.5, 1.2, center.z - 0.8]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.15, 0.15]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      <mesh position={[center.x + 0.8, 1.2, center.z - 0.8]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.12, 0.12]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  )

  const renderDining = () => (
    <group>
      <RoomDecorPiece modelId="rug" color="#8b7355">
        <group position={[center.x, 0, center.z]} receiveShadow>
          <RugFallback size={{ x: 4.0, y: 0.04, z: 3.0 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="cabinet" color="#6b4e3d">
        <group position={[center.x + size.x / 2 - 0.6, 0, center.z]} castShadow receiveShadow>
          <CoffeeTableModel size={{ x: 1.2, y: 0.85, z: 0.5 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="shelf" color="#9ca3af">
        <group position={[center.x + size.x / 2 - 0.5, 0, center.z + 1.5]} castShadow receiveShadow>
          <ShelfFallback size={{ x: 0.5, y: 1.0, z: 0.15 }} />
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

      <mesh position={[center.x - 0.2, 0.88, center.z]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[center.x + 0.2, 0.88, center.z]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      <RoomDecorPiece modelId="lamp" color="#f5d49a">
        <group position={[center.x, 2.7, center.z]} castShadow receiveShadow>
          <ChandelierModel size={{ x: 0.6, y: 0.5, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="painting" color="#8b5a2b">
        <group position={[center.x - size.x / 2 + 0.3, 1.2, center.z + 1.0]} rotation={[0, Math.PI, 0]} receiveShadow>
          <PaintingFallback size={{ x: 0.7, y: 0.55, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="clock" color="#d4a574">
        <group position={[center.x + size.x / 2 - 0.3, 1.8, center.z - 1.0]} receiveShadow>
          <ClockFallback size={{ x: 0.35, y: 0.35, z: 0.05 }} />
        </group>
      </FallbackColorizer>

      <RoomDecorPiece modelId="plant" color="#22c55e">
        <group position={[center.x - size.x / 2 + 0.8, 0, center.z - size.z / 2 + 0.8]} receiveShadow>
          <PlantFallback size={{ x: 0.35, y: 0.8, z: 0.35 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="plant" color="#15803d">
        <group position={[center.x - size.x / 2 + 0.8, 0, center.z + size.z / 2 - 0.8]} receiveShadow>
          <PlantFallback size={{ x: 0.3, y: 0.7, z: 0.3 }} />
        </group>
      </RoomDecorPiece>

      <FallbackColorizer modelId="chair" color="#6b4e3d">
        <group position={[center.x + 2.0, 0, center.z - 0.8]} castShadow receiveShadow rotation={[0, -Math.PI / 2, 0]}>
          <ChairFallback size={{ x: 0.45, y: 0.65, z: 0.45 }} />
        </group>
      </FallbackColorizer>

      <FallbackColorizer modelId="chair" color="#8b7355">
        <group position={[center.x + 2.0, 0, center.z + 0.8]} castShadow receiveShadow rotation={[0, -Math.PI / 2, 0]}>
          <ChairFallback size={{ x: 0.45, y: 0.65, z: 0.45 }} />
        </group>
      </FallbackColorizer>
    </group>
  )

  switch (id) {
    case 'entrance':
      return renderEntrance()
    case 'living':
      return renderLiving()
    case 'bedroom':
      return renderBedroom()
    case 'laundry':
      return renderLaundry()
    case 'dining':
      // §A1.5: kitchen merged into dining — render both dining and kitchen visual elements
      return (
        <group>
          {renderDining()}
          {renderDiningKitchen()}
        </group>
      )
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

    type WallMesh = { position: [number, number, number]; size: [number, number, number]; color: string }
    const wallList: WallMesh[] = []

    // 按墙分组门洞：X 墙（左/右）和 Z 墙（前/后）
    // X 墙的门洞：offset.x 绝对值大（门在左或右墙）
    // Z 墙的门洞：offset.z 绝对值大（门在前或后墙）
    const doorsOnXWalls = doorways.filter((door) => Math.abs(door.offset.x) > Math.abs(door.offset.z))
    const doorsOnZWalls = doorways.filter((door) => Math.abs(door.offset.z) >= Math.abs(door.offset.x))

    // 分离到具体的某一面墙
    const leftWallDoors = doorsOnXWalls.filter((door) => door.offset.x < 0) // x = -w/2
    const rightWallDoors = doorsOnXWalls.filter((door) => door.offset.x > 0) // x = +w/2
    const frontWallDoors = doorsOnZWalls.filter((door) => door.offset.z < 0) // z = -d/2
    const backWallDoors = doorsOnZWalls.filter((door) => door.offset.z > 0) // z = +d/2

    /**
     * 为一面墙生成墙段（门洞处留空）
     * doors = 该墙上的门洞
     * half = 墙的半长
     * getOffset = 从门洞提取沿墙方向的偏移
     */
    function buildWallSegments(
      doors: typeof doorways,
      half: number,
      getOffset: (door: typeof doorways[number]) => number,
    ): Array<{ start: number; end: number }> {
      const holes = doors.map((door) => ({
        start: getOffset(door) - door.width / 2,
        end: getOffset(door) + door.width / 2,
      }))
      holes.sort((a, b) => a.start - b.start)

      const segments: Array<{ start: number; end: number }> = []
      let cursor = -half
      for (const hole of holes) {
        const hs = Math.max(hole.start, -half)
        const he = Math.min(hole.end, half)
        if (hs > cursor) {
          segments.push({ start: cursor, end: hs })
        }
        cursor = Math.max(cursor, he)
      }
      if (cursor < half) {
        segments.push({ start: cursor, end: half })
      }
      return segments
    }

    // --- 左墙 (x = -w/2)，沿 z 方向 ---
    {
      const x = center.x - w / 2
      const segments = buildWallSegments(leftWallDoors, d / 2, (door) => door.offset.z)
      for (const seg of segments) {
        const segLen = seg.end - seg.start
        const segCenterZ = center.z + (seg.start + seg.end) / 2
        wallList.push({
          position: [x, h / 2, segCenterZ],
          size: [t, h, segLen],
          color: wallColor,
        })
      }
      // 门洞上方过梁
      for (const door of leftWallDoors) {
        const lintelH = h - door.height
        if (lintelH > 0.01) {
          wallList.push({
            position: [x, door.height + lintelH / 2, center.z + door.offset.z],
            size: [t, lintelH, door.width],
            color: wallColor,
          })
        }
      }
    }

    // --- 右墙 (x = +w/2)，沿 z 方向 ---
    {
      const x = center.x + w / 2
      const segments = buildWallSegments(rightWallDoors, d / 2, (door) => door.offset.z)
      for (const seg of segments) {
        const segLen = seg.end - seg.start
        const segCenterZ = center.z + (seg.start + seg.end) / 2
        wallList.push({
          position: [x, h / 2, segCenterZ],
          size: [t, h, segLen],
          color: wallColor,
        })
      }
      for (const door of rightWallDoors) {
        const lintelH = h - door.height
        if (lintelH > 0.01) {
          wallList.push({
            position: [x, door.height + lintelH / 2, center.z + door.offset.z],
            size: [t, lintelH, door.width],
            color: wallColor,
          })
        }
      }
    }

    // --- 前墙 (z = -d/2)，沿 x 方向 ---
    {
      const z = center.z - d / 2
      const segments = buildWallSegments(frontWallDoors, w / 2, (door) => door.offset.x)
      for (const seg of segments) {
        const segLen = seg.end - seg.start
        const segCenterX = center.x + (seg.start + seg.end) / 2
        wallList.push({
          position: [segCenterX, h / 2, z],
          size: [segLen, h, t],
          color: wallColor,
        })
      }
      for (const door of frontWallDoors) {
        const lintelH = h - door.height
        if (lintelH > 0.01) {
          wallList.push({
            position: [center.x + door.offset.x, door.height + lintelH / 2, z],
            size: [door.width, lintelH, t],
            color: wallColor,
          })
        }
      }
    }

    // --- 后墙 (z = +d/2)，沿 x 方向 ---
    {
      const z = center.z + d / 2
      const segments = buildWallSegments(backWallDoors, w / 2, (door) => door.offset.x)
      for (const seg of segments) {
        const segLen = seg.end - seg.start
        const segCenterX = center.x + (seg.start + seg.end) / 2
        wallList.push({
          position: [segCenterX, h / 2, z],
          size: [segLen, h, t],
          color: wallColor,
        })
      }
      for (const door of backWallDoors) {
        const lintelH = h - door.height
        if (lintelH > 0.01) {
          wallList.push({
            position: [center.x + door.offset.x, door.height + lintelH / 2, z],
            size: [door.width, lintelH, t],
            color: wallColor,
          })
        }
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

      {spec.doorways
        .filter((door) => spec.id < door.connectsTo)
        .map((door, i) => (
          <Door3D
            key={`door-${i}`}
            roomId={spec.id}
            roomCenter={spec.center}
            roomSize={spec.size}
            door={door}
          />
        ))}

      <RoomDecorations spec={spec} />
    </group>
  )
}
