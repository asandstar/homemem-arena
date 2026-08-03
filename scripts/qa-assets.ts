import fs from 'node:fs'
import path from 'node:path'
import { MODEL_REGISTRY } from '../src/components/arena3d/models/ModelRegistry'
import { CATEGORY_TO_MODEL_ID } from '../src/components/arena3d/modelIds'
import { pass, fail, summarize, printSummary, exitWithCode, formatTable } from './qa-shared'
import type { QaResult } from './qa-shared'

const CATEGORY = 'assets'
const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const MODELS_DIR = path.join(PUBLIC_DIR, 'assets', 'models')

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
  const registryKeys = new Set(Object.keys(MODEL_REGISTRY))

  for (const [category, modelId] of Object.entries(CATEGORY_TO_MODEL_ID)) {
    if (!registryKeys.has(modelId)) {
      results.push(
        fail(
          'critical',
          CATEGORY,
          'cat-registry-link',
          `category=${category} 映射到 modelId=${modelId}，但 MODEL_REGISTRY 中不存在该条目`,
        ),
      )
      continue
    }
    const cfg = (MODEL_REGISTRY as any)[modelId]
    if (!cfg?.fallback) {
      results.push(
        fail(
          'critical',
          CATEGORY,
          'cat-registry-link',
          `category=${category} → modelId=${modelId} 没有 fallback 组件（Registry 不合法）`,
        ),
      )
      continue
    }
    results.push(
      pass(CATEGORY, 'cat-registry-link', `category=${category} → modelId=${modelId} 映射 OK`),
    )
  }

  return results
}

/**
 * C2b：反向完整性校验：public/assets/models 下每一个 GLB 文件，必须：
 *   1) 在 MODEL_REGISTRY 中存在同名条目 id == <filename_without_ext>
 *   2) MODEL_REGISTRY[id].path 指向这个真实文件
 *
 * 防止"真实 GLB 存在但没人用"的死资产，也防止 path 打错字导致 404。
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
  const registryByPath = new Map<string, string>()
  for (const [id, cfg] of Object.entries(MODEL_REGISTRY)) {
    const p = (cfg as any).path as string | undefined
    if (p?.startsWith('/assets/models/')) {
      registryByPath.set(p.slice('/assets/models/'.length), id)
    }
  }
  const registryByIds = new Set(Object.keys(MODEL_REGISTRY))

  let covered = 0
  const orphanRows: string[][] = []
  for (const rel of glbFiles) {
    const idFromPath = registryByPath.get(rel)
    const stem = path.basename(rel, '.glb')
    if (idFromPath && registryByIds.has(idFromPath)) {
      covered++
      results.push(pass(CATEGORY, 'glb-covered', `GLB 已在 Registry 中登记: ${rel}`))
    } else if (registryByIds.has(stem)) {
      covered++
      // 文件名 = id，但 path 指向别处？打个 warning
      const cfg = (MODEL_REGISTRY as any)[stem]
      if (cfg.path !== `/assets/models/${rel}`) {
        results.push(
          fail(
            'minor',
            CATEGORY,
            'glb-path-mismatch',
            `Registry[${stem}].path=${cfg.path} 与实际文件 /assets/models/${rel} 不匹配`,
          ),
        )
      } else {
        results.push(pass(CATEGORY, 'glb-covered', `GLB 已在 Registry 中登记: ${rel}`))
      }
    } else {
      orphanRows.push([rel, stem])
      results.push(
        fail(
          'minor',
          CATEGORY,
          'glb-orphan',
          `GLB 真实存在但 Registry 未登记: ${rel}（建议在 MODEL_REGISTRY 中新增 id=${stem}）`,
        ),
      )
    }
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

function runAssetsCheck(): QaResult[] {
  const results: QaResult[] = []

  console.log('🔍 检查资产目录结构...')
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'props'), 'props'))
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'furniture'), 'furniture'))
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'decor'), 'decor'))

  console.log('🔍 检查模型注册表...')
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

  console.log('\n📋 模型状态表:')
  console.log(formatTable(tableRows, ['modelId', 'path', 'glb', 'fallback', 'status']))

  console.log('\n🔍 检查资源清单...')
  results.push(...checkAssetManifest())

  console.log('\n🔍 C2a：检查 Category→ModelId 映射完整性...')
  results.push(...checkCategoryMapping())

  console.log('\n🔍 C2b：检查 public/assets/models/*.glb ↔ MODEL_REGISTRY 双向覆盖...')
  results.push(...checkPublicGlbRegistryCoverage())

  return results
}

const results = runAssetsCheck()
const summary = summarize(results)
printSummary(summary, 'QA: Assets Check')
exitWithCode(summary)
