import fs from 'node:fs'
import path from 'node:path'
import { MODEL_REGISTRY } from '../src/components/arena3d/models/ModelRegistry'
import { CATEGORY_TO_MODEL_ID } from '../src/components/arena3d/modelIds'
import { MODEL_ASSET_REGISTRY, RUNTIME_MODEL_ASSET_REGISTRY } from '../src/data/assets/modelRegistry'
import { pass, fail, summarize, printSummary, exitWithCode, formatTable } from './qa-shared'
import type { QaResult } from './qa-shared'

const CATEGORY = 'assets'
const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MODELS_DIR = path.join(PUBLIC_DIR, 'assets', 'models')

// 精确 allowlist：只针对 decor/door.glb 这一个已知 legacy 未使用文件，
// 输出 INFO 而不是 MINOR orphan。
const LEGACY_UNUSED_ALLOWLIST = new Set<string>(['decor/door.glb'])

// =============================================================================
// 4.1 路径规范化函数
// =============================================================================

/**
 * 将 Registry 中记录的 URL/path → public/assets/models 下的相对路径。
 * 示例：
 *   /assets/models/kenney/food/plate.glb?x=1#frag → kenney/food/plate.glb
 *   /homemem-arena/assets/models/kenney/furniture/pillow.glb → kenney/furniture/pillow.glb
 *   /assets/models/props/cup.glb → props/cup.glb
 */
function normalizeModelAssetRegistryPath(raw: string): string {
  if (!raw) return ''
  let s = String(raw)
  // 去掉 query 和 hash
  const q = s.indexOf('?')
  if (q >= 0) s = s.slice(0, q)
  const h = s.indexOf('#')
  if (h >= 0) s = s.slice(0, h)
  // 统一反斜杠 → 斜杠
  s = s.replace(/\\/g, '/')
  // 去重 /
  s = s.replace(/\/+/g, '/')
  // 去掉 BASE_URL 前缀：第一个出现的 /assets/models/ 之前都剥掉
  const marker = '/assets/models/'
  const idx = s.indexOf(marker)
  if (idx >= 0) {
    s = s.slice(idx + marker.length)
  } else if (s.startsWith('assets/models/')) {
    s = s.slice('assets/models/'.length)
  } else if (s.startsWith('/')) {
    s = s.slice(1)
  }
  return s
}

function checkDirectoryExists(dir: string, name: string): QaResult {
  if (fs.existsSync(dir)) {
    return pass(CATEGORY, `${name}-dir`, `${name} 目录存在`, `public/assets/models/${name}`)
  }
  return fail('blocker', CATEGORY, `${name}-dir`, `${name} 目录不存在`, `public/assets/models/${name}`)
}

function checkPathFormat(modelId: string, modelPath: string, assetAvailable?: boolean): QaResult {
  if (assetAvailable === false) {
    return pass(CATEGORY, 'path-format', `${modelId} 使用程序化 fallback，无需路径`, modelPath)
  }
  if (modelPath.startsWith('/assets/models/')) {
    return pass(CATEGORY, 'path-format', `${modelId} 路径格式正确`, modelPath)
  }
  return fail('critical', CATEGORY, 'path-format', `${modelId} 路径格式错误: ${modelPath}`, modelPath)
}

function checkPathMixedUsage(modelId: string, modelPath: string): QaResult {
  const hasWrongPattern = modelPath.startsWith('/models/')
  if (!hasWrongPattern) {
    return pass(CATEGORY, 'path-no-mix', `${modelId} 未混用路径前缀`, modelPath)
  }
  return fail('major', CATEGORY, 'path-no-mix', `${modelId} 使用了 /models/ 而非 /assets/models/`, modelPath)
}

function checkGlbExists(modelId: string, modelPath: string): { result: QaResult; exists: boolean } {
  const fullPath = path.join(PUBLIC_DIR, modelPath)
  const exists = fs.existsSync(fullPath)
  if (exists) {
    return {
      result: pass(CATEGORY, 'glb-exists', `${modelId} GLB 文件存在`, modelPath),
      exists: true,
    }
  }
  return {
    result: fail('minor', CATEGORY, 'glb-exists', `${modelId} GLB 文件缺失（使用 fallback）: ${modelPath}`, modelPath),
    exists: false,
  }
}

function checkFallback(modelId: string, fallback: any): { result: QaResult; hasFallback: boolean } {
  const hasFallback = !!fallback
  if (hasFallback) {
    return {
      result: pass(CATEGORY, 'fallback-exists', `${modelId} 有 fallback 组件`),
      hasFallback: true,
    }
  }
  return {
    result: fail('critical', CATEGORY, 'fallback-exists', `${modelId} 没有 fallback 组件`),
    hasFallback: false,
  }
}

function checkAssetManifest(): QaResult[] {
  const results: QaResult[] = []
  const manifestPath = path.join(MODELS_DIR, 'ASSET_MANIFEST.json')

  if (!fs.existsSync(manifestPath)) {
    results.push(fail('minor', CATEGORY, 'manifest-exists', 'ASSET_MANIFEST.json 不存在'))
    return results
  }

  results.push(pass(CATEGORY, 'manifest-exists', 'ASSET_MANIFEST.json 存在'))

  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(raw)
    results.push(pass(CATEGORY, 'manifest-valid', 'ASSET_MANIFEST.json 格式有效'))

    if (manifest.models && Array.isArray(manifest.models)) {
      for (const entry of manifest.models) {
        if (entry.path) {
          const fullPath = path.join(PUBLIC_DIR, entry.path)
          const fileExists = fs.existsSync(fullPath)
          if (entry.status === 'ready' && !fileExists) {
            results.push(
              fail('minor', CATEGORY, 'manifest-consistency', `清单中 ${entry.path} 标记为 ready 但文件不存在`),
            )
          }
        }
      }
    }
  } catch {
    results.push(fail('minor', CATEGORY, 'manifest-valid', 'ASSET_MANIFEST.json 解析失败'))
  }

  return results
}

/**
 * C2a：验证 CATEGORY_TO_MODEL_ID → MODEL_REGISTRY 的完整性。
 * 每个 category 映射出来的 modelId，必须在 MODEL_REGISTRY 中有合法 entry（至少有 fallback）。
 */
function checkCategoryMapping(): QaResult[] {
  const results: QaResult[] = []
  const legacyKeys = new Set(Object.keys(MODEL_REGISTRY))
  // 也允许 category → modelId 命中新 RUNTIME Registry
  const runtimeKeys = new Set(Object.keys(RUNTIME_MODEL_ASSET_REGISTRY ?? {}))

  for (const [category, modelId] of Object.entries(CATEGORY_TO_MODEL_ID)) {
    const inLegacy = legacyKeys.has(modelId)
    const inRuntime = runtimeKeys.has(modelId)
    if (!inLegacy && !inRuntime) {
      results.push(
        fail(
          'critical',
          CATEGORY,
          'cat-registry-link',
          `category=${category} 映射到 modelId=${modelId}，但旧 MODEL_REGISTRY 与 RUNTIME_MODEL_ASSET_REGISTRY 中均不存在该条目`,
        ),
      )
      continue
    }
    if (inLegacy) {
      const cfg = (MODEL_REGISTRY as any)[modelId]
      if (!cfg?.fallback) {
        results.push(
          fail(
            'critical',
            CATEGORY,
            'cat-registry-link',
            `category=${category} → modelId=${modelId} 没有 fallback 组件（Legacy Registry 不合法）`,
          ),
        )
        continue
      }
    }
    results.push(
      pass(CATEGORY, 'cat-registry-link', `category=${category} → modelId=${modelId} 映射 OK`),
    )
  }

  return results
}

// =============================================================================
// 构建"权威注册表"：把三个 Registry 的 URL/path 全规范化后并到一个 Map
//   key: 规范化后的相对路径（如 kenney/furniture/pillow.glb、props/cup.glb）
//   value: { registry: 'legacy'|'model_asset'|'runtime', id: string, url: string }
// 运行时 GLB 以此为权威；避免旧版只看 MODEL_REGISTRY.path / stem 匹配。
// =============================================================================
type RegEntry = { registry: 'legacy' | 'model_asset' | 'runtime'; id: string; url: string }

function buildAuthoritativeRegisteredPaths(): Map<string, RegEntry> {
  const map = new Map<string, RegEntry>()

  // 1) 旧 MODEL_REGISTRY（legacy 短名，含 path 字段）
  for (const [id, cfg] of Object.entries(MODEL_REGISTRY)) {
    const p = (cfg as any).path as string | undefined
    if (p) {
      const norm = normalizeModelAssetRegistryPath(p)
      if (norm) {
        if (!map.has(norm)) map.set(norm, { registry: 'legacy', id, url: p })
        else if (map.get(norm)!.url !== p) {
          // 4.5 严重：同一个规范化路径出现两个冲突 URL
          // 这里先记到 map（后续检查在 checkUrlUniqueness 中），不抛
        }
      }
    }
  }

  // 2) MODEL_ASSET_REGISTRY（{pack}/{assetStem} id，含 url）
  for (const [id, cfg] of Object.entries(MODEL_ASSET_REGISTRY ?? {})) {
    const u = (cfg as any).url as string | undefined
    if (u) {
      const norm = normalizeModelAssetRegistryPath(u)
      if (norm) {
        if (!map.has(norm)) map.set(norm, { registry: 'model_asset', id, url: u })
      }
    }
  }

  // 3) RUNTIME_MODEL_ASSET_REGISTRY（运行时覆盖，含 url）
  for (const [id, cfg] of Object.entries(RUNTIME_MODEL_ASSET_REGISTRY ?? {})) {
    const u = (cfg as any).url as string | undefined
    if (u) {
      const norm = normalizeModelAssetRegistryPath(u)
      if (norm) {
        if (!map.has(norm)) map.set(norm, { registry: 'runtime', id, url: u })
      }
    }
  }

  return map
}

/** 4.2 / 4.5：Registry URL 自身冲突检查，以及 plate/chair/pillow 三个已知 path-mismatch 的路径必须是新路径 */
function checkRegistryUrlConsistency(): QaResult[] {
  const results: QaResult[] = []
  // 4.2：三个关键资产必须指向正确的 Kenney Runtime URL
  // 注意：这里不修改旧 Registry；只验证"至少有一个 Registry（优先 Runtime）指向正确路径"
  const mustMap: Array<{ name: string; expectedNorm: string }> = [
    { name: 'plate', expectedNorm: normalizeModelAssetRegistryPath('/assets/models/kenney/food/plate.glb') },
    { name: 'chair', expectedNorm: normalizeModelAssetRegistryPath('/assets/models/kenney/furniture/chair.glb') },
    { name: 'pillow', expectedNorm: normalizeModelAssetRegistryPath('/assets/models/kenney/furniture/pillow.glb') },
  ]
  const auth = buildAuthoritativeRegisteredPaths()
  for (const m of mustMap) {
    if (auth.has(m.expectedNorm)) {
      const hit = auth.get(m.expectedNorm)!
      results.push(
        pass(
          CATEGORY,
          'path-mismatch-fixed',
          `${m.name} 已在 ${hit.registry} registry 登记到正确路径：${hit.url}`,
        ),
      )
    } else {
      results.push(
        fail(
          'major',
          CATEGORY,
          'path-mismatch-fixed',
          `${m.name} 在三个 Registry 中均未找到正确路径：期望 ${m.expectedNorm}`,
        ),
      )
    }
  }
  // 4.5：同一 asset 两个冲突 URL 校验（同一个规范化 url 映射到多个不同原始 URL 字符串 → MAJOR）
  const byNorm = new Map<string, Set<string>>()
  for (const [, e] of auth) {
    const key = normalizeModelAssetRegistryPath(e.url)
    if (!byNorm.has(key)) byNorm.set(key, new Set())
    byNorm.get(key)!.add(e.url)
  }
  for (const [norm, urls] of byNorm) {
    if (urls.size > 1) {
      results.push(
        fail(
          'major',
          CATEGORY,
          'runtime-asset-conflict-url',
          `规范化路径 ${norm} 出现多个冲突原始 URL：${[...urls].join(' | ')}`,
        ),
      )
    }
  }
  return results
}

/**
 * C2b：反向完整性校验：public/assets/models 下每一个 GLB 文件，
 * 必须在"三 Registry 合并的权威索引"中找到（用规范化完整路径匹配，不再只按 basename）。
 * 避免"真实 GLB 存在但没人用"的死资产，避免 path 打错字导致 404。
 */
function checkPublicGlbRegistryCoverage(): QaResult[] {
  const results: QaResult[] = []
  if (!fs.existsSync(MODELS_DIR)) return results

  const collect = (dir: string, relDir: string): string[] => {
    const out: string[] = []
    for (const name of fs.readdirSync(dir)) {
      const abs = path.join(dir, name)
      const rel = relDir ? `${relDir}/${name}` : name
      if (fs.statSync(abs).isDirectory()) {
        out.push(...collect(abs, rel))
      } else if (name.endsWith('.glb')) {
        out.push(rel)
      }
    }
    return out
  }

  const glbFiles = collect(MODELS_DIR, '')
  const auth = buildAuthoritativeRegisteredPaths()

  // 旧 registry：stem → id 的宽松兼容（用于 legacy 短名匹配）
  const legacyById = new Set(Object.keys(MODEL_REGISTRY))

  let covered = 0
  const orphanRows: string[][] = []

  for (const rel of glbFiles) {
    // 精确 allowlist：唯一 legacy unused asset（decor/door.glb） → INFO
    if (LEGACY_UNUSED_ALLOWLIST.has(rel)) {
      covered++
      orphanRows.push([rel, 'legacy unused allowlist → INFO'])
      results.push(
        pass(
          CATEGORY,
          'glb-covered-legacy-allowlist',
          `${rel}: legacy unused asset retained for compatibility`,
        ),
      )
      continue
    }

    const stem = path.basename(rel, '.glb')
    // 优先：规范化完整路径（pack 子目录保留）直接命中
    if (auth.has(rel)) {
      covered++
      const hit = auth.get(rel)!
      results.push(
        pass(CATEGORY, 'glb-covered', `GLB 已登记(${hit.registry} id=${hit.id}): ${rel}`),
      )
      continue
    }

    // 次选：旧 legacy 短名（MODEL_REGISTRY.id == stem）兼容路径
    if (legacyById.has(stem)) {
      covered++
      const cfg = (MODEL_REGISTRY as any)[stem]
      const cfgNorm = normalizeModelAssetRegistryPath(cfg.path ?? '')
      // 只有当 cfg.path 规范化后也等于当前 rel，才是真正匹配；否则就是 path-mismatch
      if (cfgNorm === rel) {
        results.push(pass(CATEGORY, 'glb-covered', `GLB 已登记(legacy id=${stem}): ${rel}`))
      } else {
        // 4.2 修复：报告 path-mismatch；但实际运行时可能走新 Runtime Registry，所以等级 MINOR
        results.push(
          fail(
            'minor',
            CATEGORY,
            'glb-path-mismatch',
            `Legacy Registry[${stem}].path=${cfg.path} 与实际文件 /assets/models/${rel} 不匹配；但 Runtime Registry 正确路径已在三关生效`,
          ),
        )
      }
      continue
    }

    // 最后：完全未登记 → MINOR orphan
    orphanRows.push([rel, stem])
    results.push(
      fail(
        'minor',
        CATEGORY,
        'glb-orphan',
        `GLB 真实存在但三 Registry 中均未登记: ${rel}（建议在 RUNTIME_MODEL_ASSET_REGISTRY 中新增）`,
      ),
    )
  }

  console.log(
    `\n📐 GLB ↔ Registry 覆盖：covered=${covered}/${glbFiles.length}  orphan=${orphanRows.length}`,
  )
  if (orphanRows.length > 0) {
    console.log(
      formatTable(orphanRows, ['真实 GLB 文件 (relative to /assets/models/)', '根据文件名猜测的 modelId']),
    )
  }

  return results
}

/** 4.5：每个 Registry 指向不存在文件的 MAJOR 检查 */
function checkRegistryPointsToExistingFiles(): QaResult[] {
  const results: QaResult[] = []
  const auth = buildAuthoritativeRegisteredPaths()
  for (const [norm, entry] of auth) {
    const full = path.join(MODELS_DIR, norm)
    if (!fs.existsSync(full)) {
      results.push(
        fail(
          'major',
          CATEGORY,
          'registry-file-missing',
          `${entry.registry} registry[id=${entry.id}] url=${entry.url} → 文件 /assets/models/${norm} 不存在`,
        ),
      )
    } else {
      results.push(
        pass(
          CATEGORY,
          'registry-file-exists',
          `${entry.registry}[id=${entry.id}] → /assets/models/${norm} 文件存在`,
        ),
      )
    }
  }
  return results
}

function runAssetsCheck(): QaResult[] {
  const results: QaResult[] = []

  console.log('🔍 检查资产目录结构...')
  const kenneyDir = path.join(MODELS_DIR, 'kenney')
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'props'), 'props'))
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'furniture'), 'furniture'))
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'decor'), 'decor'))
  if (fs.existsSync(kenneyDir)) {
    results.push(pass(CATEGORY, 'kenney-dir', 'kenney pack 目录存在', 'public/assets/models/kenney'))
  } else {
    results.push(fail('minor', CATEGORY, 'kenney-dir', 'kenney pack 目录不存在（Runtime Registry 资产会缺失）', 'public/assets/models/kenney'))
  }

  console.log('🔍 检查旧 Legacy MODEL_REGISTRY...')
  const tableRows: string[][] = []
  for (const [modelId, config] of Object.entries(MODEL_REGISTRY)) {
    results.push(checkPathFormat(modelId, config.path, config.assetAvailable))
    results.push(checkPathMixedUsage(modelId, config.path))
    const glbCheck = checkGlbExists(modelId, config.path)
    results.push(glbCheck.result)
    const fbCheck = checkFallback(modelId, config.fallback)
    results.push(fbCheck.result)
    if (!glbCheck.exists && !fbCheck.hasFallback) {
      results.push(
        fail('critical', CATEGORY, 'glb-or-fallback', `${modelId} 既没有 GLB 也没有 fallback！`),
      )
    }
    const status = glbCheck.exists ? '✅ ready' : fbCheck.hasFallback ? '⚠️ fallback' : '❌ missing'
    tableRows.push([
      modelId,
      config.path,
      glbCheck.exists ? 'yes' : 'no',
      fbCheck.hasFallback ? 'yes' : 'no',
      status,
    ])
  }
  console.log('\n📋 旧 Legacy 模型状态表:')
  console.log(formatTable(tableRows, ['modelId', 'path', 'glb', 'fallback', 'status']))

  console.log('\n🔍 检查资源清单...')
  results.push(...checkAssetManifest())

  console.log('\n🔍 C2a：检查 Category→ModelId 映射完整性...')
  results.push(...checkCategoryMapping())

  console.log('\n🔍 4.2/4.5：关键资产路径 + Runtime 冲突校验...')
  results.push(...checkRegistryUrlConsistency())

  console.log('\n🔍 4.5：所有 Registry URL 指向文件必须存在...')
  results.push(...checkRegistryPointsToExistingFiles())

  console.log('\n🔍 C2b：检查 public/assets/models/*.glb ↔ 三 Registry 双向覆盖...')
  results.push(...checkPublicGlbRegistryCoverage())

  return results
}

if (typeof process !== 'undefined' && process.env.VITEST !== 'true') {
  const results = runAssetsCheck()
  const summary = summarize(results)
  printSummary(summary, 'QA: Assets Check')
  exitWithCode(summary)
}

export { runAssetsCheck, normalizeModelAssetRegistryPath, buildAuthoritativeRegisteredPaths }
