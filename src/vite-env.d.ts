/**
 * src/vite-env.d.ts (WP0A)
 *
 * - 保持 ImportMetaEnv 的 vite 基类；
 * - 增加 VITE_USE_KENNEY_LIVING_ASSETS（§十一 feature flag，仅 DEV 有效）。
 * - 若此文件已存在（§二 glob 未返回），新增覆盖写入（§十四允许）。
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  /** §十一：true=DEV 环境下 Living 用 Kenney GLB 替换 5 个视觉家具；false（默认）= 保持现有程序化家具 */
  readonly VITE_USE_KENNEY_LIVING_ASSETS?: 'true' | 'false' | '1' | '0' | ''
  readonly VITE_E2E?: string
  readonly [key: string]: unknown
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
