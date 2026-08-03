#!/usr/bin/env node
/* eslint-disable no-console */
'use strict'

const fs = require('fs')
const path = require('path')

const root = process.cwd()
const viteCache = path.join(root, 'node_modules', '.vite')
const depsDir = path.join(viteCache, 'deps')
const metadataPath = path.join(depsDir, '_metadata.json')

function exists(p) {
  try {
    fs.accessSync(p)
    return true
  } catch {
    return false
  }
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function totalSize(dir) {
  if (!exists(dir)) return 0
  let total = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) total += totalSize(full)
    else if (entry.isFile()) total += fs.statSync(full).size
  }
  return total
}

console.log('=== Vite 预编译缓存诊断 ===')
console.log(`项目根目录: ${root}`)
console.log(`node_modules/.vite 存在: ${exists(viteCache) ? '是' : '否'}`)
console.log(`预编译 deps 存在:  ${exists(depsDir) ? '是' : '否'}`)
console.log(`_metadata.json 存在: ${exists(metadataPath) ? '是' : '否'}`)

if (exists(depsDir)) {
  const files = fs.readdirSync(depsDir).filter((n) => /\.js(\.map)?$/.test(n))
  const size = totalSize(depsDir)
  console.log(`缓存产物数:       ${files.length}`)
  console.log(`缓存总大小:         ${formatSize(size)}`)

  const candidates = ['lucide-react.js', 'react-dom_client.js', 'react-router-dom.js', '@react-three_fiber.js', '@react-three_drei.js']
  for (const c of candidates) {
    const p = path.join(depsDir, c)
    console.log(`  · ${c}: ${exists(p) ? '✓' : '✗'}`)
  }

  if (exists(metadataPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
      const hash = (meta && (meta.hash || (meta.optimized && meta.optimized.hash))) || 'unknown'
      console.log(`optimizeDeps 哈希:   ${hash}`)
    } catch (err) {
      console.log(`optimizeDeps 哈希:   无法解析 (${err.message})`)
    }
  }
}

console.log('')
console.log('=== 何时建议清理缓存？ ===')
console.log('  1. 升级 Vite / esbuild / Rolldown 大版本之后')
console.log('  2. 切换 Git 分支，package.json deps 版本发生变化')
console.log('  3. Node.js 主版本 / PATH 发生变化')
console.log('  4. 浏览器出现 net::ERR_ABORTED + SyntaxError "Unexpected identifier"')
console.log('  5. HMR 不更新 / 页面行为与源码明显不一致')
console.log('')
console.log('执行清理命令:')
console.log('  npm run cache:clean      # 清理 .vite + .tmp（推荐）')
console.log('  npm run dev:clean        # 清理后以默认参数启动 dev')
console.log('  npm run dev:e2e:clean    # 清理后以 e2e 模式启动 127.0.0.1:4173')
