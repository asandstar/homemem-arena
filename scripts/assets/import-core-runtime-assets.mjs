#!/usr/bin/env node
/**
 * scripts/assets/import-core-runtime-assets.mjs
 *
 * ROUND R1 §五：从 ASSET_ROOT 复制 core-runtime-assets.json 中选中的 GLB
 * 到 public/assets/models/kenney/{furniture,food,building}/ 目录。
 *
 * 幂等、SHA 校验、不覆盖未知来源同名文件。
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
  copyFileSync, unlinkSync, statSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { join, resolve, relative, dirname, basename } from 'node:path'

const GAME_ROOT = process.env.GAME_ROOT || '/Users/azq/asandstar/homemem-arena-web-demo'
const ASSET_ROOT = process.env.ASSET_ROOT || '/Users/azq/asandstar/homemem-arena-asset-audit-2026-08-03'
const INDEX_PATH = resolve(GAME_ROOT, 'docs/assets/generated/LOCAL_KENNEY_ASSET_INDEX.json')
const SELECTION_PATH = resolve(GAME_ROOT, 'assets/selection/core-runtime-assets.json')
const PUBLIC_ROOT = resolve(GAME_ROOT, 'public/assets/models/kenney')
const REPORT_PATH = resolve(GAME_ROOT, 'docs/assets/generated/CORE_RUNTIME_IMPORT_REPORT.md')

function sha256File(p) {
  return createHash('sha256').update(readFileSync(p)).digest('hex')
}

function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

function main() {
  if (!existsSync(INDEX_PATH)) { console.error('Missing index:', INDEX_PATH); process.exit(1) }
  if (!existsSync(SELECTION_PATH)) { console.error('Missing selection:', SELECTION_PATH); process.exit(1) }

  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'))
  const sel = JSON.parse(readFileSync(SELECTION_PATH, 'utf8'))
  const indexMap = new Map()
  for (const a of index.assets) indexMap.set(a.category + '::' + a.stem, a)

  const rows = []
  let nCopied = 0, nSkipped = 0, nFailed = 0, nMissing = 0

  for (const item of sel.selection) {
    const key = item.category + '::' + item.stem
    const src = indexMap.get(key)
    if (!src) {
      rows.push({ item, status: 'MISSING_NOT_IN_INDEX' })
      nMissing += 1
      continue
    }
    const targetDir = join(PUBLIC_ROOT, item.runtimeSubdir)
    ensureDir(targetDir)
    const targetPath = join(targetDir, item.stem + '.glb')
    const targetExists = existsSync(targetPath)
    const srcSha = src.sha256

    if (targetExists) {
      const tSha = sha256File(targetPath)
      if (tSha === srcSha) {
        rows.push({ item, src, targetPath, status: 'ALREADY_IDENTICAL', sha: srcSha })
        nSkipped += 1
        continue
      } else {
        // 未知来源同名文件（legacy bed.glb 等），除非 SHA 与来源匹配，否则不覆盖
        rows.push({ item, src, targetPath, status: 'SKIPPED_EXISTING_UNKNOWN_SOURCE', srcSha, existingSha: tSha })
        nFailed += 1
        continue
      }
    }

    // 复制并校验
    copyFileSync(src.absoluteSourcePath, targetPath)
    const copiedSha = sha256File(targetPath)
    if (copiedSha !== srcSha) {
      unlinkSync(targetPath)
      rows.push({ item, src, targetPath, status: 'COPY_SHA_MISMATCH_DELETED', expected: srcSha, actual: copiedSha })
      nFailed += 1
    } else {
      const sz = statSync(targetPath).size
      rows.push({ item, src, targetPath, status: 'COPIED_OK', sha: srcSha, fileSize: sz })
      nCopied += 1
    }
  }

  // 报告
  let md = '# CORE RUNTIME ASSET IMPORT REPORT · ROUND R1\n\n'
  md += `GeneratedAt: ${new Date().toISOString()}\n\n`
  md += `AssetRoot: \`${ASSET_ROOT}\`  \n`
  md += `GameRoot: \`${relative(process.cwd(), GAME_ROOT)}\`  \n`
  md += `Selection: \`${relative(process.cwd(), SELECTION_PATH)}\` (${sel.selection.length} items)  \n`
  md += `Index: \`${relative(process.cwd(), INDEX_PATH)}\` (${index.assets.length} assets)  \n\n`
  md += '## Summary\n\n'
  md += `| Item | N |\n|---|---|\n`
  md += `| Copied (new) | ${nCopied} |\n`
  md += `| Already identical (skip) | ${nSkipped} |\n`
  md += `| Skipped: unknown source conflict | ${nFailed} |\n`
  md += `| Missing in index | ${nMissing} |\n`
  md += `| Total selected | ${sel.selection.length} |\n\n`
  md += '## Detail Rows\n\n'
  md += '| id | category | stem | status | fileSize | sha256 (prefix) | srcAbsPath (tail) |\n'
  md += '|---|---|---|---|---|---|---|\n'
  for (const r of rows) {
    const it = r.item
    const sz = r.fileSize ?? (r.src ? r.src.fileSize : '—')
    const sha = (r.sha ?? r.srcSha ?? r.expected ?? '—').toString().slice(0, 12)
    const tail = (r.src?.absoluteSourcePath || '—').split('/').slice(-3).join('/')
    md += `| ${it.id} | ${it.category} | ${it.stem} | ${r.status} | ${sz} | ${sha} | ${tail} |\n`
  }
  md += '\n## Existing Unknown-Source Conflicts (未覆盖)\n\n'
  for (const r of rows.filter(x => x.status === 'SKIPPED_EXISTING_UNKNOWN_SOURCE')) {
    md += `- \`${r.item.runtimeSubdir}/${r.item.stem}.glb\`: existingSha=${r.existingSha?.slice(0,12)}, expected=${r.srcSha?.slice(0,12)}  \n`
  }
  writeFileSync(REPORT_PATH, md)

  console.log('')
  console.log('=== IMPORT RESULT ===')
  console.log(' Copied          :', nCopied)
  console.log(' Already OK      :', nSkipped)
  console.log(' Unknown source  :', nFailed)
  console.log(' Missing in index:', nMissing)
  console.log(' Report          :', relative(GAME_ROOT, REPORT_PATH))
  if (nMissing > 0 || nFailed > 0) {
    console.log('')
    console.log('MISSING / SKIPPED rows:')
    for (const r of rows.filter(x => x.status.startsWith('MISSING') || x.status.startsWith('SKIPPED'))) {
      console.log('  ', r.item.id, '=>', r.status)
    }
  }
}

main()
