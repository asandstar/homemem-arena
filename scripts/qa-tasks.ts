import fs from 'node:fs'
import path from 'node:path'
import { taskTemplates } from '../src/data/tasks'
import { MODEL_REGISTRY } from '../src/components/arena3d/models/ModelRegistry'
import { RUNTIME_MODEL_ASSET_REGISTRY } from '../src/data/assets/modelRegistry'
import { pass, fail, summarize, printSummary, exitWithCode, formatTable } from './qa-shared'
import type { QaResult } from './qa-shared'
import type { TaskConfig } from '../src/types/task'

const CATEGORY = 'tasks'

function checkUniqueTaskIds(tasks: TaskConfig[]): QaResult {
  const ids = tasks.map((t) => t.id)
  const unique = new Set(ids)
  if (ids.length === unique.size) {
    return pass(CATEGORY, 'unique-task-ids', `所有 ${ids.length} 个任务 ID 唯一`)
  }
  return fail('blocker', CATEGORY, 'unique-task-ids', '存在重复的任务 ID')
}

function checkHasGoals(task: TaskConfig): QaResult {
  if (task.goals && task.goals.length > 0) {
    return pass(CATEGORY, 'has-goals', `${task.id} 有 ${task.goals.length} 个目标`)
  }
  return fail('blocker', CATEGORY, 'has-goals', `${task.id} 没有目标`)
}

function checkTimeLimit(task: TaskConfig): QaResult {
  if (task.timeLimit === undefined) {
    return fail('critical', CATEGORY, 'time-limit', `${task.id} 没有设置 timeLimit`)
  }
  if (task.timeLimit > 0) {
    return pass(CATEGORY, 'time-limit', `${task.id} timeLimit=${task.timeLimit}s`)
  }
  return fail('critical', CATEGORY, 'time-limit', `${task.id} timeLimit=${task.timeLimit} 无效`)
}

function checkUniqueObjectIds(task: TaskConfig): QaResult {
  const ids = task.objects.map((o) => o.id)
  const unique = new Set(ids)
  if (ids.length === unique.size) {
    return pass(CATEGORY, 'unique-obj-ids', `${task.id}: ${ids.length} 个物体 ID 唯一`)
  }
  return fail('critical', CATEGORY, 'unique-obj-ids', `${task.id} 存在重复物体 ID`)
}

function checkUniqueContainerIds(task: TaskConfig): QaResult {
  const ids = task.containers.map((c) => c.id)
  const unique = new Set(ids)
  if (ids.length === unique.size) {
    return pass(CATEGORY, 'unique-cnt-ids', `${task.id}: ${ids.length} 个容器 ID 唯一`)
  }
  return fail('critical', CATEGORY, 'unique-cnt-ids', `${task.id} 存在重复容器 ID`)
}

function checkGoalReferences(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const objIds = new Set(task.objects.map((o) => o.id))
  const cntIds = new Set(task.containers.map((c) => c.id))

  for (const goal of task.goals) {
    const predicateStr = goal.predicate.toString()
    const configIdMatches = predicateStr.match(/configId\s*===\s*['"]([^'"]+)['"]/g) || []

    for (const match of configIdMatches) {
      const id = match.match(/['"]([^'"]+)['"]/)?.[1] || ''
      if (!objIds.has(id)) {
        results.push(
          fail('blocker', CATEGORY, 'goal-configid-ref',
            `${task.id} 目标 ${goal.id} 引用不存在的物体: ${id}`),
        )
      }
    }

    const placedInMatches = predicateStr.match(/placedIn\s*===\s*['"]([^'"]+)['"]/g) || []
    for (const match of placedInMatches) {
      const id = match.match(/['"]([^'"]+)['"]/)?.[1] || ''
      if (!cntIds.has(id)) {
        results.push(
          fail('blocker', CATEGORY, 'goal-placedin-ref',
            `${task.id} 目标 ${goal.id} 引用不存在的容器: ${id}`),
        )
      }
    }
  }

  if (results.length === 0) {
    results.push(pass(CATEGORY, 'goal-refs', `${task.id} 所有目标引用有效`))
  }

  return results
}

function checkScriptedEventTargets(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const objIds = new Set(task.objects.map((o) => o.id))

  for (const event of task.scriptedEvents || []) {
    if (event.targetId && !objIds.has(event.targetId)) {
      results.push(
        fail('critical', CATEGORY, 'event-target-ref',
          `${task.id} 事件 ${event.id} 目标物体不存在: ${event.targetId}`),
      )
    }
  }

  if (results.length === 0 && (task.scriptedEvents?.length || 0) > 0) {
    results.push(pass(CATEGORY, 'event-refs', `${task.id} 所有事件目标引用有效`))
  }

  return results
}

function checkHiddenInContainer(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const cntIds = new Set(task.containers.map((c) => c.id))

  for (const obj of task.objects) {
    if (obj.hiddenInContainer && !cntIds.has(obj.hiddenInContainer)) {
      results.push(
        fail('critical', CATEGORY, 'hidden-container-ref',
          `${task.id} 物体 ${obj.id} 的 hiddenInContainer 不存在: ${obj.hiddenInContainer}`),
      )
    }
  }

  if (results.length === 0) {
    results.push(pass(CATEGORY, 'hidden-refs', `${task.id} 所有 hiddenInContainer 引用有效`))
  }

  return results
}

function checkObjectCategories(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  // 合并 MODEL_REGISTRY（legacy 短名）+ RUNTIME_MODEL_ASSET_REGISTRY（{pack}/{assetStem} 命名空间，data/assets/modelRegistry.ts）
  const legacyIds = Object.keys(MODEL_REGISTRY ?? {})
  const newIds = Object.keys(RUNTIME_MODEL_ASSET_REGISTRY ?? {})
  const modelIds = new Set([...legacyIds, ...newIds])
  // 快速后缀索引：stem → full id（furniture/books → 建立 books → furniture/books）
  const stemIndex = new Map<string, string>()
  for (const id of modelIds) {
    const parts = id.split('/')
    const stem = parts[parts.length - 1]
    // 先到先得（避免冲突时覆盖）
    if (!stemIndex.has(stem)) stemIndex.set(stem, id)
  }

  const categoryToModel: Record<string, string> = {
    'key': 'key',
    'phone': 'phone',
    'umbrella': 'umbrella',
    'cup': 'cup',
    'plate': 'plate',
    'remote': 'remote',
    'towel': 'towel',
    'milk': 'milk_carton',
    'cereal': 'cereal_box',
    'bowl': 'bowl',
    'trash': 'trash',
    'white-clothes': 'cloth_white',
    'dark-clothes': 'cloth_dark',
    'spoon': 'food/utensil-spoon',
    'tissue': 'tissue',
    // Three-level MVP 新增映射：category → MODEL_REGISTRY id（带 pack 前缀，data/assets/modelRegistry.ts）
    'book': 'furniture/books',
    'mug': 'food/mug',
    'fork': 'food/utensil-fork',
    'utensil-fork': 'food/utensil-fork',
    'utensil-spoon': 'food/utensil-spoon',
    'toy': 'furniture/bear',
    'pillow': 'furniture/pillow',
    'dining-table': 'furniture/table',
    'coffee-table': 'furniture/tableCoffee',
  }

  for (const obj of task.objects) {
    let modelId = categoryToModel[obj.category] || obj.category
    let matched = modelIds.has(modelId)
    // 如果没匹配成功：再按 category 作为 stem 做后缀匹配（如 'book' → 找 '.../books' 或 '.../book'）
    if (!matched) {
      const direct = stemIndex.get(obj.category)
      if (direct) {
        modelId = direct
        matched = true
      } else {
        // 复数兜底：book→books, toy→toys；furniture/toy 等常见变体直接尾段查找
        for (const id of modelIds) {
          const tail = id.split('/').pop() ?? id
          if (tail === obj.category || tail === `${obj.category}s`) {
            modelId = id
            matched = true
            break
          }
        }
      }
    }
    if (matched) {
      results.push(pass(CATEGORY, 'obj-category-model',
        `${task.id}: ${obj.id} (${obj.category}) → ${modelId}`))
    } else {
      results.push(
        fail('minor', CATEGORY, 'obj-category-model',
          `${task.id} 物体 ${obj.id} 的 category "${obj.category}" 在 MODEL_REGISTRY 中无对应模型（使用几何体 fallback）`),
      )
    }
  }

  return results
}

function checkLevel1Requirements(tasks: TaskConfig[]): QaResult[] {
  const results: QaResult[] = []
  // Three-level MVP: L1 = task-clean-table（Symbolic Memory 教学关，dining 单房间，无需猫/手机/托盘）
  const level1 = tasks.find((t) => t.id === 'task-clean-table')

  if (!level1) {
    results.push(fail('critical', CATEGORY, 'level1-exists', '找不到第一关 task-clean-table'))
    return results
  }

  results.push(pass(CATEGORY, 'level1-exists', '找到第一关 task-clean-table'))

  // L1 必须包含"猫移动任务物体"的扰动事件（制造记忆与现实冲突，符合 5 条设计原则）
  const catMoveEvent = level1.scriptedEvents?.find((e) =>
    e.type === 'move-entity' ||
    e.description?.includes('猫') ||
    (e as any).entityConfigId ||
    e.message?.includes('猫'),
  )
  if (catMoveEvent) {
    results.push(pass(CATEGORY, 'level1-cat-event', '第一关有猫扰动事件（制造记忆冲突）'))
  } else {
    results.push(fail('major', CATEGORY, 'level1-cat-event', '第一关缺少猫移动扰动事件（记忆与现实冲突的戏剧来源）'))
  }

  // L1 不需要 entrance tray / 手机响铃（单房间 dining 教学关）

  return results
}

function checkAudio(): QaResult[] {
  const results: QaResult[] = []
  const audioPath = path.resolve(process.cwd(), 'src', 'audio', 'sfx.ts')

  if (!fs.existsSync(audioPath)) {
    results.push(fail('blocker', 'audio', 'sfx-file', 'src/audio/sfx.ts 不存在'))
    return results
  }
  results.push(pass('audio', 'sfx-file', 'src/audio/sfx.ts 存在'))

  const content = fs.readFileSync(audioPath, 'utf-8')

  const requiredSfx = [
    'pick', 'place_success', 'place_error', 'memory_save', 'memory_outdated',
    'cat_event', 'phone_ring', 'level_complete', 'chaos_warning',
  ]
  const missingSfx: string[] = []
  for (const sfxId of requiredSfx) {
    const pattern = new RegExp(`${sfxId}\\s*[:=]`)
    if (!pattern.test(content)) {
      missingSfx.push(sfxId)
    }
  }
  if (missingSfx.length === 0) {
    results.push(pass('audio', 'sfx-defined', `所有 ${requiredSfx.length} 种音效已定义`))
  } else {
    results.push(
      fail('critical', 'audio', 'sfx-defined',
        `缺少音效: ${missingSfx.join(', ')}`),
    )
  }

  const hasPlaySfx = /export\s+function\s+playSfx/.test(content)
  const hasSetEnabled = /export\s+function\s+setAudioEnabled/.test(content)
  const hasIsEnabled = /export\s+function\s+isAudioEnabled/.test(content)
  const hasPlayChaos = /export\s+function\s+playChaosWarning/.test(content)

  if (hasPlaySfx) results.push(pass('audio', 'export-playsfx', 'playSfx 已导出'))
  else results.push(fail('major', 'audio', 'export-playsfx', 'playSfx 未导出'))

  if (hasSetEnabled) results.push(pass('audio', 'export-setenabled', 'setAudioEnabled 已导出'))
  else results.push(fail('major', 'audio', 'export-setenabled', 'setAudioEnabled 未导出'))

  if (hasIsEnabled) results.push(pass('audio', 'export-isenabled', 'isAudioEnabled 已导出'))
  else results.push(fail('major', 'audio', 'export-isenabled', 'isAudioEnabled 未导出'))

  if (hasPlayChaos) results.push(pass('audio', 'export-chaos', 'playChaosWarning 已导出'))
  else results.push(fail('major', 'audio', 'export-chaos', 'playChaosWarning 未导出'))

  const hasThrottle = /lastChaosWarningTime/.test(content)
  if (hasThrottle) {
    results.push(pass('audio', 'chaos-throttle', 'chaos_warning 有限流逻辑'))
  } else {
    results.push(fail('major', 'audio', 'chaos-throttle', 'chaos_warning 缺少限流逻辑'))
  }

  const hasEnabledCheck = /!isEnabled/.test(content) || /isEnabled\s*===/.test(content)
  if (hasEnabledCheck) {
    results.push(pass('audio', 'enabled-check', 'playSfx 有关闭检查'))
  } else {
    results.push(fail('major', 'audio', 'enabled-check', 'playSfx 缺少关闭检查'))
  }

  const hasInitAudio = /export\s+function\s+initAudio/.test(content)
  const topLevelNew = /^(?!.*export function initAudio).*new AudioContext/m
  if (hasInitAudio && !topLevelNew.test(content)) {
    results.push(pass('audio', 'init-lazy', 'AudioContext 懒初始化（用户交互后）'))
  } else {
    results.push(fail('critical', 'audio', 'init-lazy', 'AudioContext 可能在模块加载时立即创建'))
  }

  return results
}

function printTaskTable(tasks: TaskConfig[]): void {
  const rows = tasks.map((t) => [
    t.id,
    t.name,
    t.rooms.join(','),
    t.objects.length.toString(),
    t.containers.length.toString(),
    t.goals.length.toString(),
    (t.scriptedEvents?.length || 0).toString(),
    t.timeLimit?.toString() || '-',
  ])
  console.log('\n📋 任务配置表:')
  console.log(formatTable(rows,
    ['id', 'name', 'rooms', 'objs', 'cnts', 'goals', 'events', 'time']))
}

function runTasksCheck(): QaResult[] {
  const results: QaResult[] = []

  console.log('🔍 检查任务 ID 唯一性...')
  results.push(checkUniqueTaskIds(taskTemplates))

  console.log('🔍 检查任务基础配置...')
  for (const task of taskTemplates) {
    results.push(checkHasGoals(task))
    results.push(checkTimeLimit(task))
    results.push(checkUniqueObjectIds(task))
    results.push(checkUniqueContainerIds(task))
  }

  console.log('🔍 检查目标引用...')
  for (const task of taskTemplates) {
    results.push(...checkGoalReferences(task))
  }

  console.log('🔍 检查脚本事件...')
  for (const task of taskTemplates) {
    results.push(...checkScriptedEventTargets(task))
  }

  console.log('🔍 检查 hiddenInContainer 引用...')
  for (const task of taskTemplates) {
    results.push(...checkHiddenInContainer(task))
  }

  console.log('🔍 检查物体 category 与模型映射...')
  for (const task of taskTemplates) {
    results.push(...checkObjectCategories(task))
  }

  console.log('🔍 检查第一关关键配置...')
  results.push(...checkLevel1Requirements(taskTemplates))

  console.log('🔍 检查音效系统...')
  results.push(...checkAudio())

  printTaskTable(taskTemplates)

  return results
}

const results = runTasksCheck()
const summary = summarize(results)
printSummary(summary, 'QA: Tasks & Audio Check')
exitWithCode(summary)
