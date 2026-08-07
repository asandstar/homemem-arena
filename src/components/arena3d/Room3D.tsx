import { useMemo } from 'react'
import { Text, Billboard } from '@react-three/drei'
import type { RoomSpec } from '../../types/room'
import { MATERIAL_CONFIG } from './colors'
import { Door3D } from './Door3D'
import { FallbackColorizer, RoomDecorPiece } from './models/ModelAsset'
import {
  TVStandModel,
  ChandelierModel,
  SofaModel,
  BedModel,
  WashingMachineGeometry,
} from './ObjectGeometries'
import {
  RugFallback,
  PillowFallback,
  BookshelfFallback,
  ChairFallback,
  TVFallback,
} from './models/FallbackModels'
import { RegisteredModel } from './RegisteredModel'
import { roomDecorFurniture } from '../../data/decorFurniture'
import { useGameStore } from '../../store/useGameStore'

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

  const renderEntrance = () => {
    const entranceDecor = roomDecorFurniture.entrance
    const decorWorld = (pos: { x: number; y: number; z: number }): [number, number, number] => [
      center.x + pos.x,
      pos.y,
      center.z + pos.z,
    ]
    return (
    <group>
      {/* ============== Entrance 通用 decor 循环（所有带 modelAssetId 的家具，包括地毯+挂衣架） ============== */}
      {entranceDecor.filter((d) => d.modelAssetId).map((d) => (
        <RegisteredModel
          key={d.id}
          assetId={d.modelAssetId!}
          position={decorWorld(d.position)}
          rotationY={d.rotationY ?? 0}
          fallback={
            <FallbackColorizer modelId="rug" color="#8b7355">
              <group position={decorWorld(d.position)} rotation={[0, d.rotationY ?? 0, 0]} receiveShadow>
                <mesh>
                  <boxGeometry args={[Math.max(0.1, d.size.x), Math.max(0.05, d.size.y), Math.max(0.1, d.size.z)]} />
                  <meshStandardMaterial color="#8b7355" roughness={0.85} />
                </mesh>
              </group>
            </FallbackColorizer>
          }
        />
      ))}

      {/* Fallback：如果 entranceDecor 中无任何地毯条目，仍然画一块程序化门垫（避免极端情况全空） */}
      {entranceDecor.findIndex((d) => d.id.startsWith('decor-entrance-rug')) === -1 ? (
        <RoomDecorPiece modelId="rug" color="#8b7355">
          <group position={[center.x, 0, center.z + size.z / 2 - 0.8]} receiveShadow>
            <RugFallback size={{ x: 2.0, y: 0.04, z: 1.2 }} />
          </group>
        </RoomDecorPiece>
      ) : null}

      {/* MVP C1: Entrance 装饰原则
        - entrance tray → cnt-entrance-tray (Container3D) 唯一渲染
        - umbrella stand → cnt-umbrella-stand (Container3D) 唯一渲染
        - 删除鞋柜、鞋、hook、装饰托盘、2 伞装饰、挂画、时钟、2 植物、墙架
        - 避免与 task container 重复所有者，确保玩家第一眼看到 tray */}
    </group>
    )
  }

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

      {/* 枕头：跟随主沙发 A6 位置 (x=-1.5, z=0.8) 座面上方 y≈0.45，X 分布对齐沙发 2m 跨度 [-2.5,-0.5] */}
      <RoomDecorPiece modelId="pillow" color="#ff6b6b">
        <group position={[center.x - 2.3, 0.45, center.z + 0.85]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#4ecdc4">
        <group position={[center.x - 1.5, 0.45, center.z + 0.9]} rotation={[0, -Math.PI / 8, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#ffe66d">
        <group position={[center.x - 0.7, 0.45, center.z + 0.85]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
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

      {/* ============== Living 通用 decor 循环（A6 四件已单独渲染，这里渲染其他所有新增家具） ============== */}
      {livingDecor
        .filter((d) => d.modelAssetId && !['decor-sofa-main', 'decor-tv-stand', 'decor-tv', 'decor-bookshelf'].includes(d.id))
        .map((d) => (
          <RegisteredModel
            key={d.id}
            assetId={d.modelAssetId!}
            position={decorWorld(d.position)}
            rotationY={d.rotationY ?? 0}
            fallback={
              <FallbackColorizer modelId="cabinet" color="#78716c">
                <group position={decorWorld(d.position)} rotation={[0, d.rotationY ?? 0, 0]} castShadow receiveShadow>
                  <mesh>
                    <boxGeometry args={[Math.max(0.1, d.size.x), Math.max(0.05, d.size.y), Math.max(0.1, d.size.z)]} />
                    <meshStandardMaterial color="#78716c" roughness={0.8} />
                  </mesh>
                </group>
              </FallbackColorizer>
            }
          />
        ))}

      {/* MVP C1: 删除非必要落地灯、植物、墙架、挂画、时钟，减少视觉噪声 */}
      {/* decor-chair 已删除（A6：与核心布局无关的旧落地家具） */}
      {/* 第二张 coffee_table 已删除（A6-H7：cnt-coffee-table 唯一视觉所有者） */}
    </group>
    )
  }

  const renderDiningKitchen = () => {
    // ROUND R2A：Kitchen 视觉已迁移到 decorFurniture（kitchenCabinetDrawer/kitchenSink）
    // 并由 renderDining() 的 diningDecor.filter(...).map(...) 统一渲染。
    // 此函数保留为空 group 以维持 switch 结构兼容，不再渲染任何旧程序化几何。
    return <group />
  }

  const renderBedroom = () => {
    const bedroomDecor = roomDecorFurniture.bedroom
    const bedSpec = bedroomDecor.find((d) => d.id === 'decor-bed')
    const rugSpec = bedroomDecor.find((d) => d.id === 'decor-bedroom-rug')
    const decorWorld = (pos: { x: number; y: number; z: number }): [number, number, number] => [
      center.x + pos.x,
      pos.y,
      center.z + pos.z,
    ]
    return (
    <group>
      {/* ROUND R1 §八：卧室地毯由单一系统（static-decor）渲染，decor-bedroom-rug 条目为唯一所有者 */}
      {rugSpec?.modelAssetId ? (
        <RegisteredModel
          assetId={rugSpec.modelAssetId}
          position={decorWorld(rugSpec.position)}
          fallback={
            <RoomDecorPiece modelId="rug" color="#9e7a7a">
              <group position={decorWorld(rugSpec.position)} receiveShadow>
                <RugFallback size={{ x: Math.max(rugSpec.size.x, 3.0), y: 0.04, z: Math.max(rugSpec.size.z, 2.2) }} />
              </group>
            </RoomDecorPiece>
          }
        />
      ) : null}

      {/* W1B: bed 使用 Kenney bedSingle GLB，transform 来自 decorFurniture 单一数据源 */}
      {bedSpec && bedSpec.modelAssetId ? (
        <RegisteredModel
          assetId={bedSpec.modelAssetId}
          position={decorWorld(bedSpec.position)}
          fallback={
            <RoomDecorPiece modelId="bed" color="#d4c5b0">
              <group position={decorWorld(bedSpec.position)} castShadow receiveShadow>
                <BedModel size={{ x: bedSpec.size.x, y: bedSpec.size.y, z: bedSpec.size.z }} />
              </group>
            </RoomDecorPiece>
          }
        />
      ) : bedSpec ? (
        <RoomDecorPiece modelId="bed" color="#d4c5b0">
          <group position={decorWorld(bedSpec.position)} castShadow receiveShadow>
            <BedModel size={{ x: bedSpec.size.x, y: bedSpec.size.y, z: bedSpec.size.z }} />
          </group>
        </RoomDecorPiece>
      ) : null}

      {/* 3 个枕头：跟随床头 A6 位置 (x: [-1.35, 0, 1.35] 对应床头柜间距, z=-2.0 床头区)，
           卧室局部坐标，X 必须加 center.x，高度 y=0.58 对齐 bed effectiveAabb 床面 */}
      <RoomDecorPiece modelId="pillow" color="#fec8d8">
        <group position={[center.x - 0.6, 0.58, center.z - 2.0]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.4, y: 0.18, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#e0bbe4">
        <group position={[center.x + 0.6, 0.58, center.z - 2.0]} rotation={[0, -Math.PI / 6, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.4, y: 0.18, z: 0.3 }} />
        </group>
      </RoomDecorPiece>
      <RoomDecorPiece modelId="pillow" color="#fef3c7">
        <group position={[center.x + 0, 0.55, center.z - 1.9]} rotation={[0, Math.PI / 8, 0]} receiveShadow>
          <PillowFallback size={{ x: 0.35, y: 0.15, z: 0.28 }} />
        </group>
      </RoomDecorPiece>

      {/* ============== Bedroom 通用 decor 循环（bed + rug 已单独渲染，这里渲染其他所有新增家具） ============== */}
      {bedroomDecor
        .filter((d) => d.modelAssetId && !['decor-bed', 'decor-bedroom-rug'].includes(d.id))
        .map((d) => (
          <RegisteredModel
            key={d.id}
            assetId={d.modelAssetId!}
            position={decorWorld(d.position)}
            rotationY={d.rotationY ?? 0}
            fallback={
              <FallbackColorizer modelId="cabinet" color="#a8a29e">
                <group position={decorWorld(d.position)} rotation={[0, d.rotationY ?? 0, 0]} castShadow receiveShadow>
                  <mesh>
                    <boxGeometry args={[Math.max(0.1, d.size.x), Math.max(0.05, d.size.y), Math.max(0.1, d.size.z)]} />
                    <meshStandardMaterial color="#a8a29e" roughness={0.8} />
                  </mesh>
                </group>
              </FallbackColorizer>
            }
          />
        ))}

      {/* MVP C1: 删除非必要家具（2 装饰床头柜、2 灯、书桌、椅子、衣柜、梳妆台、书架、挂画、时钟、2 毛巾、2 植物）*/}
      {/* 床头柜仅由 task container cnt-nightstand (Container3D) 渲染，避免重复所有者 */}
    </group>
  )
  }

  const renderLaundry = () => {
    // ROUND R2A：Laundry 视觉由 decorFurniture（washer/dryer/utility-shelf）
    // + task containers（cnt-white/dark/towel-basket 程序化篮子）唯一承担。
    // Room3D 不再渲染旧 WashingMachineGeometry 黑色机器模型、重复橱柜、毛巾架等遮挡物。
    const laundryDecor = roomDecorFurniture.laundry
    const decorWorld = (pos: { x: number; y: number; z: number }): [number, number, number] => [
      center.x + pos.x,
      pos.y,
      center.z + pos.z,
    ]
    return (
    <group>
      {/* 洗衣机 / 烘干机 / 矮置物架：decorFurniture 单一数据源（R2A） */}
      {laundryDecor.filter((d) => d.modelAssetId).map((d) => (
        <RegisteredModel
          key={d.id}
          assetId={d.modelAssetId!}
          position={decorWorld(d.position)}
          rotationY={d.rotationY ?? 0}
          fallback={
            <FallbackColorizer modelId="cabinet" color="#6b7280">
              <group position={decorWorld(d.position)} rotation={[0, d.rotationY ?? 0, 0]} castShadow receiveShadow>
                <WashingMachineGeometry size={{ x: d.size.x, y: d.size.y, z: d.size.z }} />
              </group>
            </FallbackColorizer>
          }
        />
      ))}

      {/* R2A：删除所有旧程序化家具 */}
      {/* 旧 WashingMachineGeometry 黑色机器 → 由 GLB washer/dryer 取代 */}
      {/* 旧 3 LaundryBasketModel 红蓝绿装饰篮 → 由 task-container cnt-white/dark/towel-basket 唯一渲染 */}
      {/* 旧 3 CoffeeTableModel 西墙橱柜 → 遮挡三个任务篮，删除 */}
      {/* 旧 TowelRackModel + 3 TowelFallback → 遮挡东墙通道，删除 */}
      {/* 旧 3 散落 TowelFallback + Plant + Trash + 装饰方块 → 视觉噪声，删除 */}
    </group>
    )
  }

  const renderDining = () => {
    // ROUND R2A：Dining 视觉由 decorFurniture（chairs/kitchenCabinetDrawer/kitchenSink）
    // + task containers（cnt-dining-table/cnt-dishwasher/cnt-trash-bin/cnt-utensil-rack）唯一承担。
    // Room3D 仅保留非冲突的氛围装饰（地毯、吊灯、墙饰）。
    // —— 关键修复：只有任务配置了 cnt-dining-table（餐桌容器）时才渲染 4 把餐椅，
    //    否则（如 L2 钥匙猫任务）会出现"有椅子围着一张不存在的桌子"造成悬浮感。
    const diningDecor = roomDecorFurniture.dining
    const hasDiningTableContainer = useGameStore((s) =>
      !!s.task?.containers?.find?.((c) => c.id === 'cnt-dining-table'),
    )
    const decorWorld = (pos: { x: number; y: number; z: number }): [number, number, number] => [
      center.x + pos.x,
      pos.y,
      center.z + pos.z,
    ]
    return (
    <group>
      <RoomDecorPiece modelId="rug" color="#8b7355">
        <group position={[center.x, 0, center.z]} receiveShadow>
          <RugFallback size={{ x: 3.0, y: 0.04, z: 2.0 }} />
        </group>
      </RoomDecorPiece>

      <RoomDecorPiece modelId="lamp" color="#f5d49a">
        <group position={[center.x, 2.7, center.z]} castShadow receiveShadow>
          <ChandelierModel size={{ x: 0.6, y: 0.5, z: 0.6 }} />
        </group>
      </RoomDecorPiece>

      {/* 餐椅（仅当任务有 cnt-dining-table 餐桌容器时渲染，避免 L2 等任务出现"4 椅围空"的悬浮感）、厨房工作区、墙饰：decorFurniture 单一数据源（R2A） */}
      {diningDecor.filter((d) => {
        if (!d.modelAssetId) return false
        // 4 把餐椅仅在餐桌容器存在时渲染
        if (d.id.startsWith('decor-chair-')) return hasDiningTableContainer
        return true
      }).map((d) => (
        <RegisteredModel
          key={d.id}
          assetId={d.modelAssetId!}
          position={decorWorld(d.position)}
          rotationY={d.rotationY ?? 0}
          fallback={
            <FallbackColorizer modelId="cabinet" color="#6b4e3d">
              <group position={decorWorld(d.position)} rotation={[0, d.rotationY ?? 0, 0]} castShadow receiveShadow>
                <ChairFallback size={{ x: d.size.x, y: d.size.y, z: d.size.z }} />
              </group>
            </FallbackColorizer>
          }
        />
      ))}

      {/* R2A：删除所有与 L1 无关或重复的旧程序化家具（橱柜/杯子/盘子/椅子/冰箱/炉灶/微波炉/植物/垃圾架/装饰几何） */}
      {/* 餐桌 → cnt-dining-table (task-container, furniture/table) */}
      {/* 垃圾桶 → cnt-trash-bin (task-container, furniture/trashcan) */}
      {/* 洗碗机 → cnt-dishwasher (task-container, furniture/kitchenCabinetDrawer proxy) */}
      {/* 餐具架 → cnt-utensil-rack (task-container, 程序化高辨识度) */}
    </group>
    )
  }

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
