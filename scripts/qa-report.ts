import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { MODEL_REGISTRY } from '../src/components/arena3d/models/ModelRegistry'
import { sharedRooms } from '../src/data/rooms'
import { taskTemplates } from '../src/data/tasks'
import type { Severity, QaResult } from './qa-shared'

const SEVERITY_ORDER: Severity[] = ['blocker', 'critical', 'major', 'minor', 'info']

const SEVERITY_LABELS: Record<Severity, string> = {
  blocker: 'Blocker',
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
  info: 'Info',
}

const SEVERITY_BADGES: Record<Severity, string> = {
  blocker: '🔴 **BLOCKER**',
  critical: '🟠 **CRITICAL**',
  major: '🟡 **MAJOR**',
  minor: '⚪ MINOR',
  info: '🔵 INFO',
}

function getGitInfo(): { branch: string; commit: string } | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).toString().trim()
    const commit = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim()
    return { branch, commit }
  } catch {
    return null
  }
}

function runBuildCheck(): { passed: boolean; duration?: number } {
  const start = Date.now()
  try {
    execSync('npm run build', { cwd: process.cwd(), stdio: 'pipe', timeout: 120000 })
    return { passed: true, duration: Date.now() - start }
  } catch {
    return { passed: false, duration: Date.now() - start }
  }
}

function runScript(scriptPath: string): QaResult[] {
  const results: QaResult[] = []
  try {
    const scriptFile = path.resolve(process.cwd(), scriptPath)
    const output = execSync(`npx vite-node "${scriptFile}"`, {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 60000,
      encoding: 'utf-8',
    })
    parseFailedChecks(output, results, scriptPath)
  } catch (err: any) {
    const stdout = err.stdout?.toString() || ''
    const stderr = err.stderr?.toString() || ''
    const output = stdout + stderr
    parseFailedChecks(output, results, scriptPath)
    if (results.length === 0) {
      results.push({
        severity: 'blocker',
        category: path.basename(scriptPath, '.ts').replace('qa-', ''),
        check: 'script-execution',
        message: `${scriptPath} 执行失败（退出码 ${err.status}）`,
        passed: false,
      })
    }
  }
  return results
}

function parseFailedChecks(output: string, results: QaResult[], _scriptPath: string): void {
  const lines = output.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('🟠') && !trimmed.startsWith('🔴') && !trimmed.startsWith('🟡')
        && !trimmed.startsWith('⚪') && !trimmed.startsWith('🛑')) {
      continue
    }

    const bracketMatch = trimmed.match(/\[([a-z]+)\]\s+([^:]+):\s+(.+)/)
    if (!bracketMatch) continue

    const checkCategory = bracketMatch[1]
    const check = bracketMatch[2]
    const message = bracketMatch[3]

    let severity: Severity = 'minor'
    if (trimmed.startsWith('🛑')) severity = 'blocker'
    else if (trimmed.startsWith('🔴')) severity = 'critical'
    else if (trimmed.startsWith('🟠')) severity = 'major'
    else if (trimmed.startsWith('🟡')) severity = 'minor'
    else continue

    if (severity !== 'info') {
      results.push({
        severity,
        category: checkCategory,
        check,
        message,
        passed: false,
      })
    }
  }
}

function countBySeverity(results: QaResult[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    blocker: 0, critical: 0, major: 0, minor: 0, info: 0,
  }
  for (const r of results) {
    if (!r.passed) {
      counts[r.severity]++
    }
  }
  return counts
}

function hasBlockingIssues(counts: Record<Severity, number>): boolean {
  return counts.blocker > 0 || counts.critical > 0 || counts.major > 0
}

function generateReport(): string {
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  const gitInfo = getGitInfo()

  console.log('📦 运行构建检查...')
  const buildResult = runBuildCheck()

  console.log('🔍 运行资产检查...')
  const assetResults = runScript('scripts/qa-assets.ts')

  console.log('🏠 运行房间检查...')
  const roomResults = runScript('scripts/qa-rooms.ts')

  console.log('📋 运行任务检查...')
  const taskResults = runScript('scripts/qa-tasks.ts')

  const allResults = [...assetResults, ...roomResults, ...taskResults]
  const counts = countBySeverity(allResults)

  const overallPassed = buildResult.passed && !hasBlockingIssues(counts)

  const lines: string[] = []

  lines.push('# QA Report - Echo House: Memory Butler')
  lines.push('')
  lines.push(`**检查时间**: ${timestamp}`)
  if (gitInfo) {
    lines.push(`**Git 分支**: \`${gitInfo.branch}\``)
    lines.push(`**Git Commit**: \`${gitInfo.commit}\``)
  }
  lines.push('')

  lines.push('## 总览')
  lines.push('')
  lines.push('| 项目 | 状态 |')
  lines.push('|------|------|')
  lines.push(`| 整体 | ${overallPassed ? '✅ **通过**' : '❌ **失败**'} |`)
  lines.push(`| 构建 | ${buildResult.passed ? '✅ 通过' : '❌ 失败'} |`)
  lines.push(`| 资产检查 | ${assetResults.filter(r => !r.passed && ['blocker', 'critical', 'major'].includes(r.severity)).length === 0 ? '✅ 通过' : '⚠️ 有问题'} |`)
  lines.push(`| 房间检查 | ${roomResults.filter(r => !r.passed && ['blocker', 'critical', 'major'].includes(r.severity)).length === 0 ? '✅ 通过' : '⚠️ 有问题'} |`)
  lines.push(`| 任务检查 | ${taskResults.filter(r => !r.passed && ['blocker', 'critical', 'major'].includes(r.severity)).length === 0 ? '✅ 通过' : '⚠️ 有问题'} |`)
  lines.push('')

  lines.push('## 问题统计')
  lines.push('')
  lines.push('| 级别 | 数量 |')
  lines.push('|------|------|')
  for (const sev of SEVERITY_ORDER) {
    if (sev === 'info') continue
    lines.push(`| ${SEVERITY_LABELS[sev]} | ${counts[sev]} |`)
  }
  lines.push('')

  lines.push('## 失败项列表')
  lines.push('')
  const failedResults = allResults.filter((r) => !r.passed)
  if (failedResults.length === 0) {
    lines.push('_🎉 没有失败项！_')
  } else {
    const sorted = [...failedResults].sort((a, b) => {
      return SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    })
    lines.push('| 级别 | 模块 | 检查项 | 描述 |')
    lines.push('|------|------|--------|------|')
    for (const r of sorted) {
      const badge = SEVERITY_BADGES[r.severity]
      lines.push(`| ${badge} | ${r.category} | ${r.check} | ${r.message} |`)
    }
  }
  lines.push('')

  lines.push('## 建议修复顺序')
  lines.push('')
  if (failedResults.length === 0) {
    lines.push('_✅ 当前无待修复项_')
  } else {
    let order = 1
    for (const sev of SEVERITY_ORDER) {
      if (sev === 'info') continue
      const items = failedResults.filter((r) => r.severity === sev)
      if (items.length > 0) {
        lines.push(`### ${SEVERITY_BADGES[sev]}`)
        lines.push('')
        for (const item of items) {
          lines.push(`${order}. **[${item.category}] ${item.check}**: ${item.message}`)
          order++
        }
        lines.push('')
      }
    }
  }

  lines.push('## 资产概览')
  lines.push('')
  lines.push(`- 模型总数: ${Object.keys(MODEL_REGISTRY).length}`)
  const readyCount = Object.values(MODEL_REGISTRY).filter((m) =>
    fs.existsSync(path.join(process.cwd(), 'public', m.path))
  ).length
  lines.push(`- 有 GLB 模型: ${readyCount}`)
  lines.push(`- 使用 fallback: ${Object.keys(MODEL_REGISTRY).length - readyCount}`)
  lines.push('- 目录: props / furniture / decor')
  lines.push('')

  lines.push('## 房间概览')
  lines.push('')
  lines.push(`- 房间总数: ${Object.keys(sharedRooms).length}`)
  const roomList = Object.values(sharedRooms).map((r) => r.name).join('、')
  lines.push(`- 房间列表: ${roomList}`)
  lines.push('')

  lines.push('## 任务概览')
  lines.push('')
  lines.push(`- 关卡总数: ${taskTemplates.length}`)
  for (const task of taskTemplates) {
    lines.push(`  - **${task.name}** (\`${task.id}\`): ${task.goals.length} 个目标, ${task.objects.length} 个物体, ${task.containers.length} 个容器`)
  }
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push('_本报告由 `npm run qa:report` 自动生成_')

  return lines.join('\n')
}

const report = generateReport()
const reportPath = path.resolve(process.cwd(), 'QA_REPORT.md')
fs.writeFileSync(reportPath, report, 'utf-8')
console.log(`\n📄 QA 报告已生成: ${reportPath}\n`)
