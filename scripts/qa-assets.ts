import fs from 'node:fs'
import path from 'node:path'
import { MODEL_REGISTRY } from '../src/components/arena3d/models/ModelRegistry'
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

function checkPathFormat(modelId: string, modelPath: string): QaResult {
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

function runAssetsCheck(): QaResult[] {
  const results: QaResult[] = []

  console.log('🔍 检查资产目录结构...')
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'props'), 'props'))
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'furniture'), 'furniture'))
  results.push(checkDirectoryExists(path.join(MODELS_DIR, 'decor'), 'decor'))

  console.log('🔍 检查模型注册表...')
  const tableRows: string[][] = []

  for (const [modelId, config] of Object.entries(MODEL_REGISTRY)) {
    results.push(checkPathFormat(modelId, config.path))
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

  return results
}

const results = runAssetsCheck()
const summary = summarize(results)
printSummary(summary, 'QA: Assets Check')
exitWithCode(summary)
