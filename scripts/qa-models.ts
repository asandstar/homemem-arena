import { sharedRooms } from '../src/data/rooms'
import { taskTemplates } from '../src/data/tasks'
import { roomDecorFurniture } from '../src/data/decorFurniture'
import { dialogSequences } from '../src/dialog/dialogs'
import { pass, fail, summarize, printSummary, exitWithCode, formatTable } from './qa-shared'
import type { QaResult } from './qa-shared'
import type { TaskConfig } from '../src/types/task'
import type { RoomId } from '../src/types/room'
import fs from 'fs'
import path from 'path'

const CATEGORY = 'models'
const COLLISION_CATEGORY = 'collision'

function checkObjectGeometryColors(): QaResult[] {
  const results: QaResult[] = []
  const geoPath = path.resolve(process.cwd(), 'src', 'components', 'arena3d', 'ObjectGeometries.tsx')
  
  if (!fs.existsSync(geoPath)) {
    results.push(fail('blocker', CATEGORY, 'geometry-file', 'ObjectGeometries.tsx 不存在'))
    return results
  }
  
  const content = fs.readFileSync(geoPath, 'utf-8')
  
  const hasCreateMaterial = /createDefaultMaterial/.test(content)
  if (hasCreateMaterial) {
    results.push(pass(CATEGORY, 'create-material', '存在 createDefaultMaterial 辅助函数'))
  } else {
    results.push(fail('critical', CATEGORY, 'create-material', '缺少 createDefaultMaterial 辅助函数'))
  }
  
  const materialUses = content.match(/material={mat}/g) || []
  if (materialUses.length >= 10) {
    results.push(pass(CATEGORY, 'material-applied', `材质已应用到 ${materialUses.length} 个 mesh`))
  } else if (materialUses.length > 0) {
    results.push(fail('minor', CATEGORY, 'material-applied', `材质只应用到 ${materialUses.length} 个 mesh，可能有遗漏`))
  } else {
    results.push(fail('critical', CATEGORY, 'material-applied', '没有任何 mesh 应用了材质'))
  }
  
  const whiteColorPattern = /color:\s*['"]#ffffff['"]/g
  const whiteUses = content.match(whiteColorPattern) || []
  if (whiteUses.length <= 3) {
    results.push(pass(CATEGORY, 'white-check', `白色材质使用 ${whiteUses.length} 次，在合理范围内`))
  } else {
    results.push(fail('minor', CATEGORY, 'white-check', `白色材质使用 ${whiteUses.length} 次，可能有过多纯白模型`))
  }
  
  const materialTypes = content.match(/MeshStandardMaterial/g) || []
  const createMaterialCalls = content.match(/createDefaultMaterial\(/g) || []
  const totalMaterialUses = materialTypes.length + createMaterialCalls.length
  if (totalMaterialUses >= 15) {
    results.push(pass(CATEGORY, 'material-type', `使用 MeshStandardMaterial ${materialTypes.length} 次 + createDefaultMaterial ${createMaterialCalls.length} 次 = ${totalMaterialUses} 次`))
  } else {
    results.push(fail('major', CATEGORY, 'material-type', `材质使用不足，仅 ${totalMaterialUses} 次`))
  }
  
  return results
}

function checkObjectColors(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const obj of task.objects) {
    if (!obj.color) {
      results.push(fail('minor', CATEGORY, 'obj-color', `${task.id} 物体 ${obj.id} 缺少颜色配置`))
      continue
    }
    
    if (!/^#[0-9A-Fa-f]{6}$/.test(obj.color)) {
      results.push(fail('minor', CATEGORY, 'obj-color-format', `${task.id} 物体 ${obj.id} 颜色格式无效: ${obj.color}`))
    }
    
    const rgb = parseInt(obj.color.slice(1), 16)
    const r = (rgb >> 16) & 255
    const g = (rgb >> 8) & 255
    const b = rgb & 255
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    
    if (brightness > 240) {
      results.push(fail('minor', CATEGORY, 'obj-color-too-bright', `${task.id} 物体 ${obj.id} 颜色过亮(${obj.color})，可能在浅色背景上不可见`))
    }
    
    if (brightness < 20) {
      results.push(fail('minor', CATEGORY, 'obj-color-too-dark', `${task.id} 物体 ${obj.id} 颜色过暗(${obj.color})，可能在深色环境中不可见`))
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'obj-colors', `${task.id} 所有物体颜色配置合理`))
  }
  
  return results
}

function checkContainerColors(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const cnt of task.containers) {
    if (!cnt.color) {
      results.push(fail('minor', CATEGORY, 'cnt-color', `${task.id} 容器 ${cnt.id} 缺少颜色配置`))
      continue
    }
    
    if (!/^#[0-9A-Fa-f]{6}$/.test(cnt.color)) {
      results.push(fail('minor', CATEGORY, 'cnt-color-format', `${task.id} 容器 ${cnt.id} 颜色格式无效: ${cnt.color}`))
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'cnt-colors', `${task.id} 所有容器颜色配置合理`))
  }
  
  return results
}

function checkObjectSize(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const obj of task.objects) {
    if (!obj.size) {
      results.push(fail('critical', CATEGORY, 'obj-size', `${task.id} 物体 ${obj.id} 缺少尺寸配置`))
      continue
    }
    
    const minDim = Math.min(obj.size.x, obj.size.y, obj.size.z)
    const maxDim = Math.max(obj.size.x, obj.size.y, obj.size.z)
    
    if (minDim < 0.01) {
      results.push(fail('major', CATEGORY, 'obj-size-too-small', `${task.id} 物体 ${obj.id} 最小维度 ${minDim} 过小`))
    }
    
    if (maxDim > 2.0) {
      results.push(fail('major', CATEGORY, 'obj-size-too-large', `${task.id} 物体 ${obj.id} 最大维度 ${maxDim} 过大`))
    }
    
    const aspectRatio = maxDim / minDim
    if (aspectRatio > 20) {
      results.push(fail('minor', CATEGORY, 'obj-size-aspect', `${task.id} 物体 ${obj.id} 长宽比 ${aspectRatio.toFixed(1)}:1 过大`))
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'obj-sizes', `${task.id} 所有物体尺寸合理`))
  }
  
  return results
}

function checkObjectPositionInRoom(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const obj of task.objects) {
    if (!obj.initialRoom) {
      results.push(fail('critical', CATEGORY, 'obj-no-room', `${task.id} 物体 ${obj.id} 缺少 initialRoom`))
      continue
    }
    
    const room = sharedRooms[obj.initialRoom]
    if (!room) {
      results.push(fail('blocker', CATEGORY, 'obj-room-invalid', `${task.id} 物体 ${obj.id} 的 initialRoom ${obj.initialRoom} 不存在`))
      continue
    }
    
    if (!obj.initialPosition) {
      results.push(fail('critical', CATEGORY, 'obj-no-position', `${task.id} 物体 ${obj.id} 缺少 initialPosition`))
      continue
    }
    
    const halfX = room.size.x / 2
    const halfZ = room.size.z / 2
    
    const absX = Math.abs(obj.initialPosition.x)
    const absZ = Math.abs(obj.initialPosition.z)
    
    if (absX > halfX - 0.5) {
      results.push(fail('major', CATEGORY, 'obj-position-outside', `${task.id} 物体 ${obj.id} 在房间 ${obj.initialRoom} 内位置偏界 x=${obj.initialPosition.x}`))
    }
    
    if (absZ > halfZ - 0.5) {
      results.push(fail('major', CATEGORY, 'obj-position-outside', `${task.id} 物体 ${obj.id} 在房间 ${obj.initialRoom} 内位置偏界 z=${obj.initialPosition.z}`))
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'obj-positions', `${task.id} 所有物体位置在房间边界内`))
  }
  
  return results
}

function checkContainerPositionInRoom(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const cnt of task.containers) {
    const room = sharedRooms[cnt.room]
    if (!room) {
      results.push(fail('blocker', CATEGORY, 'cnt-room-invalid', `${task.id} 容器 ${cnt.id} 的 room ${cnt.room} 不存在`))
      continue
    }
    
    const halfX = room.size.x / 2
    const halfZ = room.size.z / 2
    
    const absX = Math.abs(cnt.position.x)
    const absZ = Math.abs(cnt.position.z)
    
    if (absX > halfX - 0.5) {
      results.push(fail('major', CATEGORY, 'cnt-position-outside', `${task.id} 容器 ${cnt.id} 在房间 ${cnt.room} 内位置偏界 x=${cnt.position.x}`))
    }
    
    if (absZ > halfZ - 0.5) {
      results.push(fail('major', CATEGORY, 'cnt-position-outside', `${task.id} 容器 ${cnt.id} 在房间 ${cnt.room} 内位置偏界 z=${cnt.position.z}`))
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'cnt-positions', `${task.id} 所有容器位置在房间边界内`))
  }
  
  return results
}

function checkObjectContainerDistance(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const obj of task.objects) {
    if (!obj.surfaceContainerId) continue
    
    const container = task.containers.find((c) => c.id === obj.surfaceContainerId)
    if (!container) {
      results.push(fail('critical', CATEGORY, 'obj-container-missing', `${task.id} 物体 ${obj.id} 引用的 surfaceContainerId ${obj.surfaceContainerId} 不存在`))
      continue
    }
    
    if (container.room !== obj.initialRoom) {
      results.push(fail('critical', CATEGORY, 'obj-container-room-mismatch', `${task.id} 物体 ${obj.id} 与容器 ${container.id} 不在同一房间`))
      continue
    }
    
    const dx = obj.initialPosition.x - container.position.x
    const dz = obj.initialPosition.z - container.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    
    if (dist > 1.0) {
      results.push(fail('minor', CATEGORY, 'obj-container-distance', `${task.id} 物体 ${obj.id} 距离其容器 ${container.id} 较远 (${dist.toFixed(2)}m)`))
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'obj-container-dist', `${task.id} 所有物体与容器距离合理`))
  }
  
  return results
}

function checkContainerSurfaceHeight(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const cnt of task.containers) {
    if (!cnt.surfaceHeight) {
      results.push(fail('minor', CATEGORY, 'cnt-no-surface-height', `${task.id} 容器 ${cnt.id} 缺少 surfaceHeight`))
      continue
    }
    
    if (cnt.surfaceHeight < 0.1) {
      results.push(fail('minor', CATEGORY, 'cnt-surface-height-low', `${task.id} 容器 ${cnt.id} surfaceHeight ${cnt.surfaceHeight} 过低`))
    }
    
    if (cnt.surfaceHeight > 2.0) {
      results.push(fail('minor', CATEGORY, 'cnt-surface-height-high', `${task.id} 容器 ${cnt.id} surfaceHeight ${cnt.surfaceHeight} 过高`))
    }
    
    if (cnt.surfaceHeight < cnt.size.y) {
      results.push(fail('minor', CATEGORY, 'cnt-surface-height-logic', `${task.id} 容器 ${cnt.id} surfaceHeight(${cnt.surfaceHeight}) 小于 size.y(${cnt.size.y})`))
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'cnt-surface-heights', `${task.id} 所有容器表面高度合理`))
  }
  
  return results
}

function checkAcceptedCategories(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  const objCategories = new Set(task.objects.map((o) => o.category))
  
  for (const cnt of task.containers) {
    if (cnt.acceptedCategories.length === 0) continue
    
    for (const cat of cnt.acceptedCategories) {
      if (!objCategories.has(cat)) {
        results.push(fail('minor', CATEGORY, 'cnt-category-no-object', `${task.id} 容器 ${cnt.id} 接受类别 ${cat}，但任务中没有该类别的物体`))
      }
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'cnt-categories', `${task.id} 所有容器接受类别合理`))
  }
  
  return results
}

function checkGoalAchievability(task: TaskConfig): QaResult[] {
  const results: QaResult[] = []
  
  for (const goal of task.goals) {
    const predicateStr = goal.predicate.toString()
    
    if (predicateStr.includes('placedIn')) {
      const placedInMatches = predicateStr.match(/placedIn\s*===\s*['"]([^'"]+)['"]/g) || []
      for (const match of placedInMatches) {
        const containerId = match.match(/['"]([^'"]+)['"]/)?.[1] || ''
        const container = task.containers.find((c) => c.id === containerId)
        if (!container) continue
        
        const goalConfigIdMatch = predicateStr.match(/configId\s*===\s*['"]([^'"]+)['"]/)
        if (goalConfigIdMatch) {
          const configId = goalConfigIdMatch[1]
          const obj = task.objects.find((o) => o.id === configId)
          if (!obj) continue
          
          if (!container.acceptedCategories.includes(obj.category)) {
            results.push(fail('critical', CATEGORY, 'goal-unachievable', `${task.id} 目标 ${goal.id}: 物体 ${obj.id}(${obj.category}) 不能放入容器 ${container.id}(${container.acceptedCategories.join(',')})`))
          }
        }
      }
    }
  }
  
  if (results.length === 0) {
    results.push(pass(CATEGORY, 'goal-achievable', `${task.id} 所有目标均可达成`))
  }
  
  return results
}

function printObjectTable(task: TaskConfig): void {
  const rows = task.objects.map((o) => [
    o.id,
    o.name,
    o.category,
    o.color || '-',
    `${o.size.x?.toFixed(2)}x${o.size.y?.toFixed(2)}x${o.size.z?.toFixed(2)}`,
    o.initialRoom,
    `(${o.initialPosition?.x?.toFixed(1)}, ${o.initialPosition?.z?.toFixed(1)})`,
    o.surfaceContainerId || '-',
  ])
  console.log(`\n📋 ${task.id} 物体配置表:`)
  console.log(formatTable(rows, ['id', 'name', 'category', 'color', 'size', 'room', 'position', 'container']))
}

function printContainerTable(task: TaskConfig): void {
  const rows = task.containers.map((c) => [
    c.id,
    c.name,
    c.room,
    c.color || '-',
    `${c.size.x?.toFixed(2)}x${c.size.y?.toFixed(2)}x${c.size.z?.toFixed(2)}`,
    `(${c.position?.x?.toFixed(1)}, ${c.position?.z?.toFixed(1)})`,
    c.surfaceHeight?.toFixed(2) || '-',
    c.acceptedCategories.length > 0 ? c.acceptedCategories.join(',') : '-',
    c.isTargetZone ? '✓' : '-',
  ])
  console.log(`\n📋 ${task.id} 容器配置表:`)
  console.log(formatTable(rows, ['id', 'name', 'room', 'color', 'size', 'position', 'surfaceH', 'accepts', 'target']))
}

function checkCollisionCompleteness(): QaResult[] {
  const results: QaResult[] = []
  console.log('\n🔍 检查碰撞系统完整性...')
  
  const allRoomIds: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'dining', 'laundry']
  
  for (const roomId of allRoomIds) {
    const decorCount = roomDecorFurniture[roomId]?.length || 0
    if (decorCount === 0) {
      results.push(fail('major', COLLISION_CATEGORY, 'decor-missing', `房间 ${roomId} 没有配置装饰家具碰撞体`))
    } else {
      results.push(pass(COLLISION_CATEGORY, 'decor-count', `房间 ${roomId} 有 ${decorCount} 个装饰家具碰撞体`))
    }
  }
  
  for (const roomId of allRoomIds) {
    const room = sharedRooms[roomId]
    if (!room) continue
    
    const decorItems = roomDecorFurniture[roomId] || []
    for (const decor of decorItems) {
      const halfX = room.size.x / 2
      const halfZ = room.size.z / 2
      
      if (Math.abs(decor.position.x) > halfX - 0.5) {
        results.push(fail('minor', COLLISION_CATEGORY, 'decor-position-outside', `房间 ${roomId} 装饰 ${decor.id} 位置偏界 x=${decor.position.x}`))
      }
      
      if (Math.abs(decor.position.z) > halfZ - 0.5) {
        results.push(fail('minor', COLLISION_CATEGORY, 'decor-position-outside', `房间 ${roomId} 装饰 ${decor.id} 位置偏界 z=${decor.position.z}`))
      }
      
      if (!decor.size || decor.size.x <= 0 || decor.size.z <= 0) {
        results.push(fail('critical', COLLISION_CATEGORY, 'decor-size-invalid', `房间 ${roomId} 装饰 ${decor.id} 尺寸无效`))
      }
    }
  }
  
  const totalDecorCount = allRoomIds.reduce((sum, id) => sum + (roomDecorFurniture[id]?.length || 0), 0)
  results.push(pass(COLLISION_CATEGORY, 'total-decor', `总共有 ${totalDecorCount} 个装饰家具碰撞体`))
  
  return results
}

function checkDialogCompleteness(): QaResult[] {
  const results: QaResult[] = []
  console.log('\n🔍 检查对话系统完整性...')
  
  const taskIds = taskTemplates.map(t => t.id)
  const startDialogs = new Set(dialogSequences.filter(d => d.trigger.type === 'start').map(d => d.trigger.value))
  const roomEnterDialogs = new Set(dialogSequences.filter(d => d.trigger.type === 'roomEnter').map(d => d.trigger.value))
  const goalCompleteDialogs = new Set(dialogSequences.filter(d => d.trigger.type === 'goalComplete').map(d => d.trigger.value))
  const eventDialogs = new Set(dialogSequences.filter(d => d.trigger.type === 'event').map(d => d.trigger.value))
  
  for (const taskId of taskIds) {
    if (startDialogs.has(taskId)) {
      results.push(pass('dialog', 'start-dialog', `任务 ${taskId} 有开场对话`))
    } else {
      results.push(fail('minor', 'dialog', 'start-dialog-missing', `任务 ${taskId} 缺少开场对话`))
    }
  }
  
  const allRooms: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'dining', 'laundry']
  for (const roomId of allRooms) {
    if (roomEnterDialogs.has(roomId)) {
      results.push(pass('dialog', 'room-enter-dialog', `房间 ${roomId} 有进入对话`))
    }
  }
  
  const totalDialogCount = dialogSequences.length
  results.push(pass('dialog', 'total-dialogs', `总共有 ${totalDialogCount} 个对话序列`))
  
  const speakers = new Set(dialogSequences.flatMap(d => d.nodes.map(n => n.speaker)))
  results.push(pass('dialog', 'speaker-variety', `使用了 ${speakers.size} 种说话者类型: ${Array.from(speakers).join(', ')}`))
  
  for (const seq of dialogSequences) {
    for (const node of seq.nodes) {
      if (!node.text || node.text.length < 5) {
        results.push(fail('minor', 'dialog', 'dialog-text-short', `对话节点 ${node.id} 文本过短`))
      }
    }
  }
  
  return results
}

function runModelsCheck(): QaResult[] {
  const results: QaResult[] = []
  
  console.log('🔍 检查 ObjectGeometries.tsx 材质配置...')
  results.push(...checkObjectGeometryColors())
  
  for (const task of taskTemplates) {
    console.log(`\n🔍 检查任务: ${task.id}`)
    
    console.log('  - 检查物体颜色...')
    results.push(...checkObjectColors(task))
    
    console.log('  - 检查容器颜色...')
    results.push(...checkContainerColors(task))
    
    console.log('  - 检查物体尺寸...')
    results.push(...checkObjectSize(task))
    
    console.log('  - 检查物体位置...')
    results.push(...checkObjectPositionInRoom(task))
    
    console.log('  - 检查容器位置...')
    results.push(...checkContainerPositionInRoom(task))
    
    console.log('  - 检查物体与容器距离...')
    results.push(...checkObjectContainerDistance(task))
    
    console.log('  - 检查容器表面高度...')
    results.push(...checkContainerSurfaceHeight(task))
    
    console.log('  - 检查容器接受类别...')
    results.push(...checkAcceptedCategories(task))
    
    console.log('  - 检查目标可达性...')
    results.push(...checkGoalAchievability(task))
    
    printObjectTable(task)
    printContainerTable(task)
  }
  
  results.push(...checkCollisionCompleteness())
  results.push(...checkDialogCompleteness())
  
  return results
}

const results = runModelsCheck()
const summary = summarize(results)
printSummary(summary, 'QA: Models & Objects Check')
exitWithCode(summary)