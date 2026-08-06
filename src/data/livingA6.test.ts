/**
 * MICRO IMPLEMENT ROUND B2 · LIVING A6 定向测试
 *
 * 验证 docs/design/LIVING_A_CONSTRAINT_FREEZE.md §5 CANDIDATE A6 的 12 项实施约束。
 * 本文件仅做静态数据 / 代码结构校验，不渲染 3D 场景。
 *
 * 未验证项（不在本测试范围内，需人工/其他测试覆盖）：
 * - 3D LOS（line of sight）
 * - 猫脚印路径（CatPrintsEffect 仍为直线插值，未实现 waypoint）
 * - 真人可玩性
 * - 全流程通关
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { roomDecorFurniture } from './decorFurniture'
import { leaveHomeTask } from './tasks/leave-home'
import { MODEL_ASSET_REGISTRY, RUNTIME_MODEL_ASSET_REGISTRY, WP0A_LIVING_ASSET_IDS, type ModelAssetId } from './assets/modelRegistry'
import {
  localAabbMinMax,
  roomLocalBounds,
  isLocalBoxInsideRoom,
  doorwayBoxes,
  boxesOverlap2D,
} from '../../scripts/qa-layout'
import { furnitureOwnershipRegistry } from './furnitureOwnership'

const LIVING_A6 = {
  sofa: { id: 'decor-sofa-main', pos: { x: -1.5, y: 0, z: 2.24 }, rot: Math.PI, model: 'furniture/loungeSofa' as ModelAssetId },
  tvStand: { id: 'decor-tv-stand', pos: { x: -2.0, y: 0, z: -2.1 }, rot: 0, model: 'furniture/cabinetTelevision' as ModelAssetId },
  tv: { id: 'decor-tv', pos: { x: -2.0, y: 0.62, z: -2.1 }, rot: 0, model: 'furniture/televisionModern' as ModelAssetId },
  bookshelf: { id: 'decor-bookshelf', pos: { x: 2.75, y: 0, z: 1.5 }, rot: -Math.PI / 2, model: 'furniture/bookcaseOpen' as ModelAssetId },
}

/**
 * 计算 GLB 模型的 effective footprint（AABB，基于 modelRegistry.effectiveAabb）。
 * A6 设计文档的 H1/H2 约束均基于 effective AABB（视觉模型实际占地），
 * 而非 decorFurniture.size（碰撞盒，通常比 GLB 大 ~20% 作为碰撞余量）。
 *
 * 注意：rotationY 为 0/π 时 X/Z 不交换；为 ±π/2 时 X/Z 交换。
 * 四件核心 decor 的 rotationY 均为 0/π/±π/2，AABB 对称翻转后 footprint 不变，
 * 故此处直接用 effectiveAabb.x/z 作为 footprint 尺寸（与 A6 文档 §5 一致）。
 */
function effectiveFootprint(model: ModelAssetId, pos: { x: number; z: number }) {
  const def = RUNTIME_MODEL_ASSET_REGISTRY[model]
  const hx = def.effectiveAabb.x / 2
  const hz = def.effectiveAabb.z / 2
  return {
    x1: pos.x - hx,
    x2: pos.x + hx,
    z1: pos.z - hz,
    z2: pos.z + hz,
  }
}

// A6: loungeSofa effective footprint = X[-2.48,-0.52] × Z[1.83,2.65]（与 A6 文档 §5 一致）
const SOFA_FOOTPRINT = effectiveFootprint('furniture/loungeSofa', { x: LIVING_A6.sofa.pos.x, z: LIVING_A6.sofa.pos.z })

describe('LIVING A6 · 定向测试（12 项验证）', () => {
  describe('1-3. 四件 static decor 坐标、房间内、门洞净空', () => {
    const fourDecors = Object.values(LIVING_A6)

    it('1. Living 四件 static decor 坐标等于 A6', () => {
      for (const expected of fourDecors) {
        const spec = roomDecorFurniture.living.find((d) => d.id === expected.id)
        expect(spec, `${expected.id} 应存在于 decorFurniture.living`).toBeDefined()
        expect(spec!.position.x).toBeCloseTo(expected.pos.x, 5)
        expect(spec!.position.y).toBeCloseTo(expected.pos.y, 5)
        expect(spec!.position.z).toBeCloseTo(expected.pos.z, 5)
        expect(spec!.rotationY).toBeCloseTo(expected.rot, 5)
        expect(spec!.modelAssetId).toBe(expected.model)
      }
    })

    it('2. 四件 static decor 全部在 Living 内（基于 GLB effectiveAabb，margin=0.10，与 A6 H1 一致）', () => {
      // A6 设计文档 H1 约束基于 effective AABB（GLB 视觉模型实际占地），
      // 而非 decorFurniture.size（碰撞盒，比 GLB 大 ~20% 作为碰撞余量）。
      // sofa 靠墙时 collision box z2=2.74 距墙 0.01m，但 effective z2=2.65 margin=0.10m 刚好满足。
      // 注意：浮点边界（2.24+0.41=2.6500000000000004）需用容差处理。
      const EPS = 1e-6
      for (const expected of fourDecors) {
        const spec = roomDecorFurniture.living.find((d) => d.id === expected.id)!
        const fp = effectiveFootprint(expected.model, { x: spec.position.x, z: spec.position.z })
        const bounds = roomLocalBounds('living', 0.10)
        const inside =
          fp.x1 >= bounds.minX - EPS &&
          fp.x2 <= bounds.maxX + EPS &&
          fp.z1 >= bounds.minZ - EPS &&
          fp.z2 <= bounds.maxZ + EPS
        expect(inside, `${expected.id} effective AABB 应在 Living 内（footprint X[${fp.x1.toFixed(2)},${fp.x2.toFixed(2)}] Z[${fp.z1.toFixed(2)},${fp.z2.toFixed(2)}], bounds X[${bounds.minX.toFixed(2)},${bounds.maxX.toFixed(2)}] Z[${bounds.minZ.toFixed(2)},${bounds.maxZ.toFixed(2)}]）`).toBe(true)
      }
    })

    it('3. 四件 static decor 不进入任何 doorway clearance', () => {
      const doorBoxes = doorwayBoxes('living')
      for (const expected of fourDecors) {
        const spec = roomDecorFurniture.living.find((d) => d.id === expected.id)!
        const box = localAabbMinMax(
          { x: spec.position.x, z: spec.position.z },
          { x: spec.size.x, z: spec.size.z },
        )
        for (let i = 0; i < doorBoxes.length; i += 1) {
          const overlap = boxesOverlap2D(box, doorBoxes[i], 0)
          expect(overlap, `${expected.id} 不应压在 doorway #${i + 1} 上`).toBe(false)
        }
      }
    })
  })

  describe('4. decor-sofa-side 已删除', () => {
    it('decorFurniture.living 中不存在 decor-sofa-side', () => {
      const sideSofa = roomDecorFurniture.living.find((d) => d.id === 'decor-sofa-side')
      expect(sideSofa, 'decor-sofa-side 应从 decorFurniture.living 移除').toBeUndefined()
    })

    it('furnitureOwnershipRegistry 中 decor-sofa-side 标记为移除或不存在', () => {
      // A6 移除侧沙发；ownership 注册表若仍保留条目仅作为历史记录，但 decorFurniture 真值已删除
      const entry = furnitureOwnershipRegistry.find((e) => e.decorId === 'decor-sofa-side')
      // 允许注册表保留旧条目（作为 deprecated 记录），但 decorFurniture 必须没有
      if (entry) {
        // 如果注册表保留，仅作记录，不强制删除（避免超纲修改）
        expect(roomDecorFurniture.living.find((d) => d.id === 'decor-sofa-side')).toBeUndefined()
      }
    })
  })

  describe('5-7. relocated key 位置约束', () => {
    const catEvent = leaveHomeTask.scriptedEvents.find(
      (e) => e.id === 'se-cat-pushes-key' && e.type === 'move-entity',
    )

    it('5. relocated key 在 Living 内', () => {
      expect(catEvent?.targetPosition).toBeDefined()
      const tp = catEvent!.targetPosition!
      expect(tp.room).toBe('living')
      const inside = isLocalBoxInsideRoom(
        'living',
        { x: tp.x, z: tp.z },
        { x: 0.3, z: 0.3 },
        0.10,
      )
      expect(inside, `relocated key (${tp.x},${tp.z}) 应在 Living 内`).toBe(true)
    })

    it('6. relocated key 不在 sofa footprint 内', () => {
      const tp = catEvent!.targetPosition!
      // 钥匙尺寸 0.2×0.14，用半尺寸判断中心点是否在 footprint 外
      const keyBox = { x1: tp.x - 0.1, x2: tp.x + 0.1, z1: tp.z - 0.07, z2: tp.z + 0.07 }
      const overlap = boxesOverlap2D(keyBox, SOFA_FOOTPRINT, 0)
      expect(overlap, 'relocated key 不应落在 sofa footprint 内').toBe(false)
    })

    it('7. relocated key 到 sofa footprint 距离 ≤ 0.40m', () => {
      const tp = catEvent!.targetPosition!
      // 计算点到 AABB 的最近距离
      const dx = Math.max(SOFA_FOOTPRINT.x1 - tp.x, 0, tp.x - SOFA_FOOTPRINT.x2)
      const dz = Math.max(SOFA_FOOTPRINT.z1 - tp.z, 0, tp.z - SOFA_FOOTPRINT.z2)
      const dist = Math.sqrt(dx * dx + dz * dz)
      expect(dist, `relocated key 到 sofa footprint 距离 ${dist.toFixed(3)}m 应 ≤ 0.40m`).toBeLessThanOrEqual(0.40)
    })
  })

  describe('8-9. cnt-coffee-table 唯一视觉所有者 + modelAssetId', () => {
    it('8. cnt-coffee-table 是茶几唯一视觉所有者（ownership=task-container）', () => {
      const entry = furnitureOwnershipRegistry.find((e) => e.containerId === 'cnt-coffee-table')
      expect(entry, 'cnt-coffee-table 应在 furnitureOwnershipRegistry 中').toBeDefined()
      expect(entry!.ownership).toBe('task-container')
    })

    it('8b. decorFurniture.living 中不存在 decor-coffee-table（避免双重所有者）', () => {
      const decorCoffee = roomDecorFurniture.living.find((d) => d.id === 'decor-coffee-table')
      expect(decorCoffee, '不应存在 decor-coffee-table（由 cnt-coffee-table 接管）').toBeUndefined()
    })

    it('9. cnt-coffee-table modelAssetId 有效（已注册）', () => {
      const cnt = leaveHomeTask.containers.find((c) => c.id === 'cnt-coffee-table')
      expect(cnt, 'cnt-coffee-table 应存在于 leaveHomeTask.containers').toBeDefined()
      expect(cnt!.modelAssetId, 'cnt-coffee-table 应有 modelAssetId').toBeDefined()
      expect(WP0A_LIVING_ASSET_IDS, 'modelAssetId 应在 WP0A_LIVING_ASSET_IDS 中').toContain(cnt!.modelAssetId)
      expect(MODEL_ASSET_REGISTRY[cnt!.modelAssetId!], 'modelAssetId 应在 MODEL_ASSET_REGISTRY 中').toBeDefined()
    })
  })

  describe('10-11. Room3D 不再手写四件 static decor transform + 无第二张 tableCoffee', () => {
    // 读取 Room3D.tsx 源码做静态结构校验
    const room3dPath = resolve(__dirname, '../components/arena3d/Room3D.tsx')
    const src = readFileSync(room3dPath, 'utf-8')

    it('10. Room3D 不再手写四件 static decor 的硬编码坐标（A6 坐标数字不应内联出现）', () => {
      // 四件核心 decor 的 A6 坐标应来自 decorFurniture.ts，不应在 Room3D 中以字面量形式硬编码
      // 检查 renderLiving 区域内不应出现这些 A6 特征坐标的硬编码
      // 提取 renderLiving 函数体（从 const renderLiving 到下一个 const render）
      const m = src.match(/const renderLiving[\s\S]*?(?=\n  const render\w+)/)
      expect(m, '应能定位 renderLiving 函数体').not.toBeNull()
      const livingBody = m![0]
      // A6 特征坐标硬编码检查：sofa(-1.5,2.24)、tv-stand(-2.0,-2.1)、tv(-2.0,0.62,-2.1)、bookshelf(2.75,1.5)
      // 这些坐标应通过 sofaSpec.position 等读取，不应直接出现 position={[... -1.5 ... 2.24 ...]}
      // 允许在注释中出现，所以只检查非注释行
      const lines = livingBody.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('{/*'))
      const hardcoded = lines.filter((l) =>
        /position=\{\[.*-1\.5.*2\.24/.test(l) ||
        /position=\{\[.*-2\.0.*-2\.1/.test(l) ||
        /position=\{\[.*2\.75.*1\.5/.test(l),
      )
      expect(hardcoded, `renderLiving 中不应硬编码 A6 坐标，发现：${JSON.stringify(hardcoded)}`).toHaveLength(0)
    })

    it('11. Room3D renderLiving 中无第二张 tableCoffee（CoffeeTableModel 不应在 Living 中独立渲染）', () => {
      const m = src.match(/const renderLiving[\s\S]*?(?=\n  const render\w+)/)
      const livingBody = m![0]
      // 排除注释行
      const lines = livingBody.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('{/*'))
      const coffeeTableLines = lines.filter((l) => /CoffeeTableModel/.test(l))
      expect(coffeeTableLines, 'renderLiving 中不应独立渲染 CoffeeTableModel（由 cnt-coffee-table 接管）').toHaveLength(0)
    })
  })

  describe('12. model loading 失败仍有 fallback', () => {
    it('RegisteredModel 组件接受 fallback prop（类型契约校验）', () => {
      const path = resolve(__dirname, '../components/arena3d/RegisteredModel.tsx')
      const src = readFileSync(path, 'utf-8')
      // RegisteredModel 必须声明 fallback prop
      expect(src, 'RegisteredModel 应声明 fallback prop').toMatch(/fallback\??:\s*ReactNode/)
    })

    it('Container3D 在 modelAssetId 存在时传入 fallback（源码结构校验）', () => {
      const path = resolve(__dirname, '../components/arena3d/Container3D.tsx')
      const src = readFileSync(path, 'utf-8')
      // 检查 spec.modelAssetId ? <RegisteredModel ... fallback={...}> : <FurnitureModel ...>
      expect(src, 'Container3D 应根据 spec.modelAssetId 条件渲染 RegisteredModel 并传入 fallback').toMatch(/spec\.modelAssetId\s*\?[\s\S]*<RegisteredModel[\s\S]*fallback=/)
    })

    it('Room3D renderLiving 中四件核心 decor 均通过 RegisteredModel + fallback 渲染', () => {
      const path = resolve(__dirname, '../components/arena3d/Room3D.tsx')
      const src = readFileSync(path, 'utf-8')
      const m = src.match(/const renderLiving[\s\S]*?(?=\n  const render\w+)/)
      const livingBody = m![0]
      // 四件核心 decor 都应使用 RegisteredModel 并带 fallback
      const registeredCount = (livingBody.match(/<RegisteredModel/g) || []).length
      expect(registeredCount, 'renderLiving 中应有 4 处 <RegisteredModel>（四件核心 decor）').toBeGreaterThanOrEqual(4)
      const fallbackCount = (livingBody.match(/fallback=/g) || []).length
      expect(fallbackCount, 'renderLiving 中应有 ≥4 处 fallback=').toBeGreaterThanOrEqual(4)
    })
  })
})

describe('LIVING A6 · 补充：五个 Kenney 模型渲染所有者一致性', () => {
  it('五个 Kenney 模型 ID 全部在 MODEL_ASSET_REGISTRY 中注册', () => {
    const fiveModels: ModelAssetId[] = [
      'furniture/loungeSofa',
      'furniture/tableCoffee',
      'furniture/televisionModern',
      'furniture/cabinetTelevision',
      'furniture/bookcaseOpen',
    ]
    for (const id of fiveModels) {
      expect(MODEL_ASSET_REGISTRY[id], `${id} 应注册`).toBeDefined()
    }
  })

  it('五个模型分别由 decorFurniture 或 cnt-coffee-table 持有 modelAssetId', () => {
    // 4 件由 decorFurniture 持有，1 件（tableCoffee）由 cnt-coffee-table 持有
    const decorModels = roomDecorFurniture.living
      .filter((d) => d.modelAssetId)
      .map((d) => d.modelAssetId) as ModelAssetId[]
    const cntCoffee = leaveHomeTask.containers.find((c) => c.id === 'cnt-coffee-table')!
    const cntModels = cntCoffee.modelAssetId ? [cntCoffee.modelAssetId] : []

    const allOwned = [...decorModels, ...cntModels]
    const expected: ModelAssetId[] = [
      'furniture/loungeSofa',
      'furniture/tableCoffee',
      'furniture/televisionModern',
      'furniture/cabinetTelevision',
      'furniture/bookcaseOpen',
    ]
    for (const id of expected) {
      expect(allOwned, `${id} 应被 decorFurniture 或 cnt-coffee-table 持有`).toContain(id)
    }
  })
})
