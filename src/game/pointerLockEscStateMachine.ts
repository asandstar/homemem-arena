// 桌面端 Pointer Lock + ESC 双次按键状态机（纯函数，便于 Vitest 独立测试）
// -----------------------------------------------------------------------------
// 目标交互（比赛桌面版）：
//   点击画面          → 真正进入 Pointer Lock
//   第一次 ESC        → 只退出 Pointer Lock，显示鼠标，冻结视角
//   第二次 ESC（独立）→ 打开暂停菜单
//   暂停后点击继续    → 保持未锁定，显示"点击画面继续控制"，再点一次才锁定
//
// 浏览器竞争：ESC 会同时触发"退出 pointerlock"和"keydown Escape"。
//   必须避免同一次用户操作既解锁又顺带开暂停——用冷却时间戳区分。
// -----------------------------------------------------------------------------

export type EscapeInput =
  | 'KEYDOWN_ESCAPE' // 用户按下 ESC 键
  | 'POINTERLOCKCHANGE_UNLOCKED' // 浏览器发出 pointerlockchange，pointerLockElement 已离开 canvas

export interface EscapeStateContext {
  pointerLocked: boolean // document.pointerLockElement === canvas
  isPaused: boolean
  inGamePhase: boolean // phase === 'playing' || phase === 'briefing'
  /** 上次因 ESC 触发退出 Pointer Lock 的时间戳（performance.now），0 表示从未发生 */
  escapeReleasedUnlockAtMs: number
  /** 当前调用时的 performance.now() */
  nowMs: number
  /** 冷却窗口（ms），窗口内视为"同一次 ESC 按键"，不开暂停 */
  cooldownMs: number
}

export type EscapeAction =
  | 'EXIT_LOCK' // 调用 document.exitPointerLock，并设置 escapeReleasedUnlockAtMs
  | 'OPEN_PAUSE' // 调用 setPaused(true)；之前要 EXIT_LOCK（若仍锁定）
  | 'CLOSE_PAUSE' // 调用 setPaused(false)；保持未锁定
  | 'NO_OP' // 什么也不做（冷却期内或当前阶段不接受）

export interface EscapeDecision {
  action: EscapeAction
  /** 非空时调用方应把 escapeReleasedUnlockAtRef.current 赋值为此值 */
  setUnlockTimestampToMs?: number
}

const isRecentUnlock = (ctx: EscapeStateContext): boolean => {
  return ctx.nowMs - ctx.escapeReleasedUnlockAtMs < ctx.cooldownMs
}

/**
 * 纯状态机：给定当前输入 + 环境快照 → 返回一个 EscapeDecision。
 * 不访问 DOM、不访问 React store，全部决策走入参。
 */
export function decideEscapeAction(
  input: EscapeInput,
  ctx: EscapeStateContext,
): EscapeDecision {
  // POINTERLOCKCHANGE_UNLOCKED：浏览器告诉我们锁没了。
  // 我们只记"锁确实丢了"这件事，但不在这个事件里开暂停——暂停只能由独立的 KEYDOWN_ESCAPE 触发。
  if (input === 'POINTERLOCKCHANGE_UNLOCKED') {
    return { action: 'NO_OP' }
  }

  // 后续只处理 KEYDOWN_ESCAPE
  if (!ctx.inGamePhase) {
    // 非游戏阶段：锁定中才解锁，否则忽略
    if (ctx.pointerLocked) {
      return { action: 'EXIT_LOCK', setUnlockTimestampToMs: ctx.nowMs }
    }
    return { action: 'NO_OP' }
  }

  // === inGamePhase ===
  if (ctx.isPaused) {
    // 暂停中按 ESC：关闭暂停，保持未锁定（不恢复 Pointer Lock）
    return { action: 'CLOSE_PAUSE' }
  }

  if (ctx.pointerLocked) {
    // 未暂停 + 锁定中 → 第一次 ESC：只解锁，不开暂停，并设置冷却时间戳
    return { action: 'EXIT_LOCK', setUnlockTimestampToMs: ctx.nowMs }
  }

  // 未暂停 + 未锁定：判断是不是冷却期内
  if (isRecentUnlock(ctx)) {
    // 冷却期内 → 视为第一次 ESC 的尾巴，NO_OP
    return { action: 'NO_OP' }
  }
  // 已过冷却期 → 独立第二次 ESC：开暂停
  return { action: 'OPEN_PAUSE' }
}
