/**
 * DEV 调试用全局变量封装。
 * 集中管理 window.__HOMEMEM_* 调试变量，提供类型安全访问，
 * 替代各处 (window as any).__HOMEMEM_* 模式。
 *
 * 所有操作仅在 DEV 模式下有效（由调用方通过 IS_DEV 守卫）。
 */

import type { ModelLoadStats } from '../components/arena3d/models/ModelAsset'

// ============ Render Ready Signal ============

export interface HommemRenderReady {
  sceneMounted: boolean
  firstFrameRendered: boolean
  modelTotal: number
  modelPending: number
  modelLoaded: number
  modelFailed: number
  fallbackCount: number
  webglContextLost: boolean
  [key: string]: unknown
}

const RENDER_READY_KEY = '__HOMEMEM_RENDER_READY__'

/** 读取 render-ready 信号（不存在时返回空对象） */
export function getRenderReady(): Partial<HommemRenderReady> {
  return (window as any)[RENDER_READY_KEY] ?? {}
}

/** 全量写入 render-ready 信号 */
export function setRenderReady(value: HommemRenderReady): void {
  ;(window as any)[RENDER_READY_KEY] = value
}

/** 补丁式更新 render-ready 信号 */
export function patchRenderReady(patch: Partial<HommemRenderReady>): void {
  const cur = getRenderReady()
  ;(window as any)[RENDER_READY_KEY] = { ...cur, ...patch }
}

// ============ Model Stats Snapshot ============

const MODEL_STATS_SNAP_KEY = '__HOMEMEM_MODEL_STATS_SNAP__'
const MODEL_STATS_KEY = '__HOMEMEM_MODEL_STATS__'

/** 读取 model stats 快照 */
export function getModelStatsSnap(): (ModelLoadStats & { failedIds: string[] }) | undefined {
  return (window as any)[MODEL_STATS_SNAP_KEY]
}

/** 写入 model stats 快照 */
export function setModelStatsSnap(value: ModelLoadStats & { failedIds: string[] }): void {
  ;(window as any)[MODEL_STATS_SNAP_KEY] = value
}

/** 定义 model stats getter（仅调用一次） */
export function defineModelStatsGetter(getter: () => ModelLoadStats): void {
  Object.defineProperty(window, MODEL_STATS_KEY, {
    configurable: true,
    enumerable: true,
    get: getter,
  })
}
