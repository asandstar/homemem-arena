#!/usr/bin/env node
/**
 * scripts/assets/scan-local-kenney-library.mjs
 *
 * ROUND R1 §三：扫描本机 ASSET_ROOT 中的 Kenney 资产，
 * 输出完整索引（pack/stem/absPath/size/sha256/rawAabb/材质数）。
 *
 * 用法：
 *   ASSET_ROOT=... GAME_ROOT=... node scripts/assets/scan-local-kenney-library.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { readdirSync, statSync } from 'node:fs'
import { join, resolve, relative } from 'node:path'

const ASSET_ROOT = process.env.ASSET_ROOT || '/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03'
const GAME_ROOT = process.env.GAME_ROOT || '/Users/azq/asandstar/homemem-arena-web-demo'
const OUTPUT = resolve(GAME_ROOT, 'docs/assets/generated/LOCAL_KENNEY_ASSET_INDEX.json')

const PACKS = [
  { id: 'kenney-furniture-kit', dir: 'unpacked/furniture-kit', category: 'furniture' },
  { id: 'kenney-building-kit', dir: 'unpacked/building-kit', category: 'building' },
  { id: 'kenney-food-kit', dir: 'unpacked/food-kit', category: 'food' },
]

function sha256File(path) {
  const buf = readFileSync(path)
  return createHash('sha256').update(buf).digest('hex')
}

/** 解析 GLB JSON+BIN chunk，从 accessor min/max 聚合 raw AABB。 */
function parseGlb(path) {
  const buf = readFileSync(path)
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

  // Header: magic(4) + version(4) + length(4) = 12
  if (buf.length < 12) return { error: 'too small' }
  const magic = view.getUint32(0, true)
  if (magic !== 0x46546c67) return { error: 'not glb' }
  const version = view.getUint32(4, true)
  if (version !== 2) return { error: 'not gltf2' }

  let offset = 12
  let jsonObj = null
  let binBuf = null

  while (offset + 8 <= buf.length) {
    const chunkLen = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    const chunkData = buf.subarray(offset + 8, offset + 8 + chunkLen)
    if (chunkType === 0x4e4f534a) {
      try { jsonObj = JSON.parse(chunkData.toString('utf8')) } catch { return { error: 'bad json' } }
    } else if (chunkType === 0x004e4942) {
      binBuf = chunkData
    }
    offset += 8 + chunkLen
  }

  if (!jsonObj || !jsonObj.accessors) return { error: 'no accessors' }

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  let matCount = 0

  for (const a of jsonObj.accessors) {
    if (a.min && a.min.length === 3) {
      if (a.min[0] < minX) minX = a.min[0]
      if (a.min[1] < minY) minY = a.min[1]
      if (a.min[2] < minZ) minZ = a.min[2]
    }
    if (a.max && a.max.length === 3) {
      if (a.max[0] > maxX) maxX = a.max[0]
      if (a.max[1] > maxY) maxY = a.max[1]
      if (a.max[2] > maxZ) maxZ = a.max[2]
    }
  }

  if (jsonObj.materials) matCount = jsonObj.materials.length

  if (!Number.isFinite(minX)) return { error: 'no position accessor' }

  return {
    rawAabb: {
      x: round(maxX - minX),
      y: round(maxY - minY),
      z: round(maxZ - minZ),
    },
    rawAabbMin: { x: round(minX), y: round(minY), z: round(minZ) },
    rawAabbMax: { x: round(maxX), y: round(maxY), z: round(maxZ) },
    detectedMaterialCount: matCount,
  }
}

function round(n) { return Math.round(n * 1e6) / 1e6 }

function walkGlb(baseDir) {
  const out = []
  function dfs(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, ent.name)
      if (ent.isDirectory()) dfs(full)
      else if (ent.name.toLowerCase().endsWith('.glb')) out.push(full)
    }
  }
  try { dfs(baseDir) } catch {}
  return out
}

function main() {
  console.log('ASSET_ROOT :', ASSET_ROOT, existsSync(ASSET_ROOT) ? 'OK' : 'MISSING')
  console.log('GAME_ROOT  :', GAME_ROOT, existsSync(GAME_ROOT) ? 'OK' : 'MISSING')

  const result = {
    generatedAt: new Date().toISOString(),
    assetRoot: ASSET_ROOT,
    packs: {},
    assets: [],
    stats: { furniture: 0, building: 0, food: 0, total: 0, duplicates: 0, unparseable: 0 },
    duplicateStems: [],
    unparseable: [],
  }

  const seenStems = new Map()

  for (const pack of PACKS) {
    const packDir = join(ASSET_ROOT, pack.dir)
    const files = walkGlb(packDir)
    result.packs[pack.id] = {
      category: pack.category,
      dir: pack.dir,
      glbCount: files.length,
    }
    result.stats[pack.category === 'kenney-furniture-kit' ? 'furniture'
      : pack.category === 'kenney-building-kit' ? 'building' : 'food'] = files.length

    for (const abs of files) {
      const st = statSync(abs)
      const stem = abs.split('/').slice(-1)[0].replace(/\.glb$/i, '')
      const rel = relative(ASSET_ROOT, abs)
      const sha = sha256File(abs)
      const parsed = parseGlb(abs)
      const record = {
        pack: pack.id,
        category: pack.category,
        stem,
        absoluteSourcePath: abs,
        relativeSourcePath: rel,
        fileSize: st.size,
        sha256: sha,
        magicHeader: 'OK',
        sourceStatus: 'unpacked',
      }
      if (parsed.error) {
        record.magicHeader = parsed.error
        result.stats.unparseable += 1
        result.unparseable.push({ stem, pack: pack.id, error: parsed.error, abs })
      } else {
        Object.assign(record, parsed)
      }
      result.assets.push(record)

      const key = pack.category + '::' + stem
      if (seenStems.has(key)) {
        result.stats.duplicates += 1
        result.duplicateStems.push({ stem, category: pack.category, a: seenStems.get(key), b: abs })
      } else {
        seenStems.set(key, abs)
      }
    }
  }

  result.stats.total = result.assets.length

  writeFileSync(OUTPUT, JSON.stringify(result, null, 2))

  console.log('')
  console.log('=== SCAN RESULT ===')
  console.log(' Furniture GLB :', result.stats.furniture)
  console.log(' Building GLB  :', result.stats.building)
  console.log(' Food GLB      :', result.stats.food)
  console.log(' Total         :', result.stats.total)
  console.log(' Duplicates    :', result.stats.duplicates)
  console.log(' Unparseable   :', result.stats.unparseable)
  console.log(' Output        :', relative(GAME_ROOT, OUTPUT))
  console.log('')
  if (result.duplicateStems.length) {
    console.log('Duplicate stems:', result.duplicateStems.length)
    for (const d of result.duplicateStems.slice(0, 5)) console.log('  -', d.category, d.stem)
  }
  if (result.unparseable.length) {
    console.log('Unparseable:', result.unparseable.length)
    for (const u of result.unparseable.slice(0, 5)) console.log('  -', u.stem, u.error)
  }
}

main()
