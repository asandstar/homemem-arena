export type Severity = 'blocker' | 'critical' | 'major' | 'minor' | 'info'

export interface QaResult {
  severity: Severity
  category: string
  check: string
  message: string
  file?: string
  passed: boolean
}

export interface QaSummary {
  total: number
  passed: number
  failed: number
  bySeverity: Record<Severity, number>
  results: QaResult[]
}

const SEVERITY_ORDER: Severity[] = ['blocker', 'critical', 'major', 'minor', 'info']

const SEVERITY_LABELS: Record<Severity, string> = {
  blocker: 'BLOCKER',
  critical: 'CRITICAL',
  major: 'MAJOR',
  minor: 'MINOR',
  info: 'INFO',
}

const SEVERITY_ICONS: Record<Severity, string> = {
  blocker: '🛑',
  critical: '🔴',
  major: '🟠',
  minor: '🟡',
  info: '🔵',
}

export function pass(category: string, check: string, message: string, file?: string): QaResult {
  return { severity: 'info', category, check, message, file, passed: true }
}

export function fail(
  severity: Exclude<Severity, 'info'>,
  category: string,
  check: string,
  message: string,
  file?: string,
): QaResult {
  return { severity, category, check, message, file, passed: false }
}

export function summarize(results: QaResult[]): QaSummary {
  const bySeverity: Record<Severity, number> = {
    blocker: 0,
    critical: 0,
    major: 0,
    minor: 0,
    info: 0,
  }

  let passed = 0
  let failed = 0

  for (const r of results) {
    bySeverity[r.severity]++
    if (r.passed) passed++
    else failed++
  }

  return {
    total: results.length,
    passed,
    failed,
    bySeverity,
    results: [...results].sort((a, b) => {
      const ai = SEVERITY_ORDER.indexOf(a.severity)
      const bi = SEVERITY_ORDER.indexOf(b.severity)
      return ai - bi
    }),
  }
}

export function hasBlockingIssues(summary: QaSummary): boolean {
  return summary.bySeverity.blocker > 0 || summary.bySeverity.critical > 0 || summary.bySeverity.major > 0
}

export function printSummary(summary: QaSummary, title: string): void {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log(`${'='.repeat(60)}`)

  for (const sev of SEVERITY_ORDER) {
    if (summary.bySeverity[sev] > 0 || sev === 'info') {
      const label = SEVERITY_LABELS[sev]
      const icon = SEVERITY_ICONS[sev]
      const count = summary.bySeverity[sev]
      console.log(`  ${icon} ${label.padEnd(9)}: ${count}`)
    }
  }

  console.log(`  ---`)
  console.log(`  ✅ Passed : ${summary.passed}`)
  console.log(`  ❌ Failed : ${summary.failed}`)
  console.log(`  📊 Total  : ${summary.total}`)

  if (summary.failed > 0) {
    console.log(`\n  Failed checks:`)
    for (const r of summary.results) {
      if (!r.passed) {
        const icon = SEVERITY_ICONS[r.severity]
        console.log(`    ${icon} [${r.category}] ${r.check}: ${r.message}`)
      }
    }
  }

  console.log(`${'='.repeat(60)}\n`)
}

export function formatTable(rows: string[][], headers: string[]): string {
  const colWidths = headers.map((h, i) => {
    let max = h.length
    for (const row of rows) {
      if (row[i] && row[i].length > max) max = row[i].length
    }
    return max
  })

  const sep = colWidths.map((w) => '-'.repeat(w + 2)).join('+')
  const headerLine = headers.map((h, i) => ` ${h.padEnd(colWidths[i])} `).join('|')

  const lines = [`+${sep}+`, `|${headerLine}|`, `+${sep}+`]
  for (const row of rows) {
    const line = row.map((cell, i) => ` ${cell.padEnd(colWidths[i])} `).join('|')
    lines.push(`|${line}|`)
  }
  lines.push(`+${sep}+`)

  return lines.join('\n')
}

export function exitWithCode(summary: QaSummary): void {
  if (hasBlockingIssues(summary)) {
    process.exit(1)
  }
  process.exit(0)
}
