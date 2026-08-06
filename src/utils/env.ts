/**
 * 环境变量统一访问层。
 * 集中处理 import.meta.env 的类型安全和异常兜底，
 * 替代各处重复的 (import.meta as any)?.env + try/catch 模式。
 *
 * 类型定义见 src/vite-env.d.ts（vite/client + ImportMetaEnv）。
 */

function safeGetEnv(): ImportMetaEnv | undefined {
  try {
    return import.meta.env
  } catch {
    return undefined
  }
}

const _env = safeGetEnv()

/** Vite BASE_URL（basename，默认 '/'） */
export const BASE_URL: string = _env?.BASE_URL ?? '/'

/** 是否开发环境 */
export const IS_DEV: boolean = _env?.DEV ?? false

/** 是否生产环境 */
export const IS_PROD: boolean = _env?.PROD ?? false

/** Vite MODE（'development' | 'production' | 'e2e' | ...） */
export const MODE: string = _env?.MODE ?? 'production'

/** 是否 E2E 测试环境（MODE === 'e2e' 或 VITE_E2E === 'true'） */
export const IS_E2E: boolean = MODE === 'e2e' || String(_env?.VITE_E2E ?? '') === 'true'
