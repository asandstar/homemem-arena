/**
 * src/utils/resolveFallbackSize.ts
 *
 * F1 · GLB fallback AABB 对齐 — 纯函数工具（零 React/Three 依赖）。
 * 抽成独立模块以支持 vitest 直接导入，避免在测试中触发 @react-three/fiber 的
 * useFrame/useGLTF 等 hooks（jsdom 无 WebGL，hooks 会抛错）。
 *
 * 规则优先级：
 *   1) 显式传入且每维 > 0 的 explicitSize 优先；
 *   2) 若 modelId → MODEL_ID_TO_ASSET_ID 映射到 MODEL_ASSET_REGISTRY 有 effectiveAabb，取之；
 *   3) 否则返回 undefined，保持 FallbackModels 原尺寸（0.5×0.5×0.5，对小道具影响小）。
 */
import { RUNTIME_MODEL_ASSET_REGISTRY, type ModelAssetId } from '../data/assets/modelRegistry'

const MODEL_ID_TO_ASSET_ID: Record<string, ModelAssetId> = {
  sofa: 'furniture/loungeSofa',
  coffee_table: 'furniture/tableCoffee',
  bed: 'furniture/bedDouble',
  desk: 'furniture/table',
  cabinet: 'furniture/kitchenCabinetDrawer',
  sink: 'furniture/kitchenSink',
  bookshelf: 'furniture/bookcaseOpen',
  chair: 'furniture/chair',
  pillow: 'furniture/pillow',
  trash: 'furniture/trashcan',
  plant: 'furniture/pottedPlant',
  lamp: 'furniture/lampRoundTable',
}

export function resolveFallbackSize(
  modelId: string,
  explicitSize?: { x: number; y: number; z: number },
): { x: number; y: number; z: number } | undefined {
  if (
    explicitSize &&
    explicitSize.x > 0 &&
    explicitSize.y > 0 &&
    explicitSize.z > 0
  ) {
    return explicitSize
  }
  const assetId = MODEL_ID_TO_ASSET_ID[modelId]
  if (assetId) {
    const def = RUNTIME_MODEL_ASSET_REGISTRY[assetId]
    if (def?.effectiveAabb) {
      return {
        x: def.effectiveAabb.x,
        y: def.effectiveAabb.y,
        z: def.effectiveAabb.z,
      }
    }
  }
  return undefined
}
