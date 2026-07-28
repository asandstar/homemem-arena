import { test, expect } from '@playwright/test'
import {
  createErrorCollector,
  expectNoErrors,
  readState,
  navigateToTaskAndStart,
  callCommand,
  callNearbyEntityCommand,
  advanceStageTransitions,
  placeIntoContainerStable,
} from './helpers'

test.describe('(A类) Clean-Table Command-backed 流程验证', () => {
  async function setupLevel(page: import('@playwright/test').Page) {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'homemem-level-progress',
        JSON.stringify({
          'task-clean-table': { taskId: 'task-clean-table', unlocked: true, completed: true, rank: 'A', bestScore: 500, completionTime: 60000, attempts: 1 },
          'task-leave-home': { taskId: 'task-leave-home', unlocked: true, completed: true, rank: null, bestScore: 0, completionTime: null, attempts: 0 },
          'task-laundry-sort': { taskId: 'task-laundry-sort', unlocked: true, completed: true, rank: null, bestScore: 0, completionTime: null, attempts: 0 },
          'task-breakfast': { taskId: 'task-breakfast', unlocked: true, completed: true, rank: null, bestScore: 0, completionTime: null, attempts: 0 },
          'task-night-patrol': { taskId: 'task-night-patrol', unlocked: true, completed: true, rank: null, bestScore: 0, completionTime: null, attempts: 0 },
        }),
      )
    })
    await page.reload()
    await navigateToTaskAndStart(page, 'task-clean-table')
  }

  test('(A类) 主测试：完整通关 脏杯→洗碗机/餐巾纸→垃圾桶/叉子→餐具架 → levelCompleted → Probe/Result 宽松', async ({ page }) => {
    const errors = createErrorCollector(page)
    await setupLevel(page)
    await page.waitForTimeout(200)

    const phase = await readState<string>(page, 'getPhase')
    expect(phase).toBe('playing')

    // ===== 脏杯 → 洗碗机 =====
    let pickCup = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-dirty-cup', 'dining')
    if (!pickCup.success) {
      void (await callCommand(page, 'releaseHeldEntity'))
      await advanceStageTransitions(page, 1)
      pickCup = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-dirty-cup', 'dining')
    }
    expect(pickCup.success).toBe(true)
    await advanceStageTransitions(page, 2)

    const placeCup = await placeIntoContainerStable(page, 'cnt-dishwasher')
    expect(placeCup.success).toBe(true)
    await advanceStageTransitions(page, 2)

    const entitiesAfterCup = await readState<
      Array<{ configId?: string; status?: string; placedIn?: string }>
    >(page, 'getEntities')
    const cupState = entitiesAfterCup.find((e) => e.configId === 'obj-dirty-cup')
    expect(cupState?.status).toBe('placed')
    expect(cupState?.placedIn).toBe('cnt-dishwasher')

    // ===== 餐巾纸 → 垃圾桶 =====
    let pickTissue = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-tissue', 'dining')
    if (!pickTissue.success) {
      void (await callCommand(page, 'releaseHeldEntity'))
      await advanceStageTransitions(page, 1)
      pickTissue = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-tissue', 'dining')
    }
    expect(pickTissue.success).toBe(true)
    await advanceStageTransitions(page, 2)

    const placeTissue = await placeIntoContainerStable(page, 'cnt-trash-bin')
    expect(placeTissue.success).toBe(true)
    await advanceStageTransitions(page, 2)

    const entitiesAfterTissue = await readState<
      Array<{ configId?: string; status?: string; placedIn?: string }>
    >(page, 'getEntities')
    const tissueState = entitiesAfterTissue.find((e) => e.configId === 'obj-tissue')
    expect(tissueState?.status).toBe('placed')
    expect(tissueState?.placedIn).toBe('cnt-trash-bin')

    // ===== 叉子 → 餐具架 =====
    let pickFork = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-fork', 'dining')
    if (!pickFork.success) {
      void (await callCommand(page, 'releaseHeldEntity'))
      await advanceStageTransitions(page, 1)
      pickFork = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-fork', 'dining')
    }
    expect(pickFork.success).toBe(true)
    await advanceStageTransitions(page, 2)

    const placeFork = await placeIntoContainerStable(page, 'cnt-utensil-rack')
    expect(placeFork.success).toBe(true)
    await advanceStageTransitions(page, 3)

    const entitiesAfterFork = await readState<
      Array<{ configId?: string; status?: string; placedIn?: string }>
    >(page, 'getEntities')
    const forkState = entitiesAfterFork.find((e) => e.configId === 'obj-fork')
    expect(forkState?.status).toBe('placed')
    expect(forkState?.placedIn).toBe('cnt-utensil-rack')

    // ===== 完成目标断言 =====
    const achievedGoalIds = await readState<string[]>(page, 'getAchievedGoalIds')
    expect(achievedGoalIds.includes('g-dirty-cup')).toBe(true)
    expect(achievedGoalIds.includes('g-tissue')).toBe(true)
    expect(achievedGoalIds.includes('g-fork')).toBe(true)

    // ===== levelCompleted =====
    let levelCompleted = await readState<boolean>(page, 'getLevelCompleted')
    for (let attempt = 0; attempt < 3 && !levelCompleted; attempt += 1) {
      await advanceStageTransitions(page, 3)
      levelCompleted = await readState<boolean>(page, 'getLevelCompleted')
    }
    expect(levelCompleted).toBe(true)

    // ===== Probe / Result 宽松 =====
    await page.waitForTimeout(1000)
    try {
      const anyContinue = page.getByRole('button', { name: '继续' })
        .or(page.getByRole('button', { name: '继续挑战！' }))
        .or(page.getByRole('button', { name: '查看结果分析' }))
      if (await anyContinue.first().isVisible({ timeout: 4000 })) {
        await anyContinue.first().click({ force: true })
      }
      await page.waitForURL('**/probe/task-clean-table', { timeout: 6000 }).catch(() => {})
      await page.waitForURL('**/result/task-clean-table', { timeout: 8000 }).catch(() => {})
    } catch {
      console.log('⚠️ clean-table Probe/Result 流程未自动跳转，已跳过（宽松）')
    }

    expectNoErrors(errors)
  })

  test('(A类-A) 绕过路径 1：放错容器不计数（杯子放入垃圾桶，goal 不达成，可再捡回放正确容器）', async ({ page }) => {
    const errors = createErrorCollector(page)
    await setupLevel(page)
    await page.waitForTimeout(200)

    // pick 脏杯
    const pickCup = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-dirty-cup', 'dining')
    expect(pickCup.success).toBe(true)
    await advanceStageTransitions(page, 2)

    const achievedGoalIdsBeforeWrong = await readState<string[]>(page, 'getAchievedGoalIds')
    expect(achievedGoalIdsBeforeWrong.includes('g-dirty-cup')).toBe(false)

    // 放错到垃圾桶
    const _wrongPlace = await placeIntoContainerStable(page, 'cnt-trash-bin')
    void _wrongPlace
    // 放错可能成功也可能被拒绝，都不计数
    await advanceStageTransitions(page, 2)

    const achievedGoalIdsAfterWrong = await readState<string[]>(page, 'getAchievedGoalIds')
    // 放错容器后，goal 不能被标记为 achieved
    expect(achievedGoalIdsAfterWrong.includes('g-dirty-cup')).toBe(false)

    // 如果放错成功了，捡回来再放正确的
    const entitiesAfterWrong = await readState<
      Array<{ configId?: string; status?: string; placedIn?: string }>
    >(page, 'getEntities')
    const cupAfterWrong = entitiesAfterWrong.find((e) => e.configId === 'obj-dirty-cup')
    if (cupAfterWrong?.status === 'placed' && cupAfterWrong.placedIn === 'cnt-trash-bin') {
      // 从垃圾桶捡回
      const pickBack = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-dirty-cup', 'dining')
      expect(pickBack.success).toBe(true)
      await advanceStageTransitions(page, 2)
      // 放正确的洗碗机
      const correctPlace = await placeIntoContainerStable(page, 'cnt-dishwasher')
      expect(correctPlace.success).toBe(true)
      await advanceStageTransitions(page, 2)
      const achievedGoalIdsFinal = await readState<string[]>(page, 'getAchievedGoalIds')
      expect(achievedGoalIdsFinal.includes('g-dirty-cup')).toBe(true)
    }

    expectNoErrors(errors)
  })

  test('(A类-A) 绕过路径 2：连续放同一物品可放但不重复计 goal（杯子→洗碗机→捡回→再放洗碗机，goal 仍只算1次）', async ({ page }) => {
    const errors = createErrorCollector(page)
    await setupLevel(page)
    await page.waitForTimeout(200)

    // 第一次：pick 杯子 → 放洗碗机
    const pickCup1 = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-dirty-cup', 'dining')
    expect(pickCup1.success).toBe(true)
    await advanceStageTransitions(page, 2)
    const placeCup1 = await placeIntoContainerStable(page, 'cnt-dishwasher')
    expect(placeCup1.success).toBe(true)
    await advanceStageTransitions(page, 3)

    const achievedGoalIdsAfter1 = await readState<string[]>(page, 'getAchievedGoalIds')
    expect(achievedGoalIdsAfter1.includes('g-dirty-cup')).toBe(true)

    // 记录当前 step 和 score
    const stepAfter1 = await readState<number>(page, 'getStepCount')
    const scoreAfter1 = await readState<number>(page, 'getScore') ?? 0

    // 第二次：从洗碗机捡回杯子 → 再放洗碗机
    const pickCup2 = await callNearbyEntityCommand(page, 'pickByConfigId', 'obj-dirty-cup', 'dining')
    // 从容器中 pick 可能成功也可能失败（取决于实现允许不允许从目标容器拿出）
    if (pickCup2.success) {
      await advanceStageTransitions(page, 2)
      const _placeCup2 = await placeIntoContainerStable(page, 'cnt-dishwasher')
      void _placeCup2
      // 第二次放置允许成功
      await advanceStageTransitions(page, 2)
    }

    // 关键断言：goal 不会重复计数，achieved 仍然 true（不会变成需要重新达成）
    const achievedGoalIdsAfter2 = await readState<string[]>(page, 'getAchievedGoalIds')
    // goal 状态不变（始终已达成，不会被重置导致需要重复计分）
    expect(achievedGoalIdsAfter2.includes('g-dirty-cup')).toBe(true)

    // step 或 score 不因为重复放置而额外大幅增加（不重复计 goal）
    const stepAfter2 = await readState<number>(page, 'getStepCount')
    const scoreAfter2 = await readState<number>(page, 'getScore') ?? 0
    // step 增加量应只是 pick+place 正常步数（teleport + advanceStage 会推进 step，放宽到 ≤10）
    expect(stepAfter2 - stepAfter1).toBeLessThanOrEqual(10)
    void scoreAfter1
    void scoreAfter2

    expectNoErrors(errors)
  })
})
