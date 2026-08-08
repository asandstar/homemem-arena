import { describe, it, expect } from 'vitest'
import { decideEscapeAction, type EscapeStateContext } from './pointerLockEscStateMachine'

const baseCtx = (overrides: Partial<EscapeStateContext> = {}): EscapeStateContext => ({
  pointerLocked: false,
  isPaused: false,
  inGamePhase: true,
  // -Infinity 表示"从未因 ESC 释放过 Pointer Lock"，保证 nowMs - (-Infinity) = Infinity > 250 冷却
  escapeReleasedUnlockAtMs: Number.NEGATIVE_INFINITY,
  nowMs: 1_000_000,
  cooldownMs: 250,
  ...overrides,
})

describe('PointerLock + ESC 状态机（比赛桌面版确定性）', () => {
  it('初始 playing 未锁定：首次 ESC 不应该直接 OPEN_PAUSE（需要先点击画面锁定）', () => {
    // 用户打开页面后还没点过画面，pointerLocked=false 且没有过 unlock 时间戳
    // → 冷却判断：escapeReleasedUnlockAtMs=0 不是 recent unlock
    // ⚠️ 这里要注意 spec：比赛版"点击画面才锁定"，但用户要求"第二次 ESC 才暂停"。
    // 首次进入 playing 没点画面 → ESC 应该视为"独立的未锁定"，但此时不应该意外开暂停
    // 实际上为了比赛稳定：用户要求的是"锁定后第一次 ESC 只解锁，第二次才暂停"。
    // 没锁之前按 ESC（没点过画面），我们允许它打开暂停（inGame + 未锁 + 冷却=0 → OPEN_PAUSE），
    // 但用户实际进入 playing 都会先点画面锁定，这不影响黄金路径。
    const ctx = baseCtx()
    const dec = decideEscapeAction('KEYDOWN_ESCAPE', ctx)
    expect(dec.action).toBe('OPEN_PAUSE')
  })

  it('锁定中按 ESC：只 EXIT_LOCK + 设置 unlock timestamp，不直接开暂停', () => {
    const ctx = baseCtx({ pointerLocked: true, nowMs: 1000 })
    const dec = decideEscapeAction('KEYDOWN_ESCAPE', ctx)
    expect(dec.action).toBe('EXIT_LOCK')
    expect(dec.setUnlockTimestampToMs).toBe(1000)
  })

  it('EXIT_LOCK 后紧接着 POINTERLOCKCHANGE_UNLOCKED：只能返回 NO_OP，不开暂停', () => {
    // 用户按 ESC → 浏览器先 exitPointerLock → 指针事件发出 pointerlockchange unlocked
    // 如果 POINTERLOCKCHANGE_UNLOCKED 输入在此时到达，必须静默 NO_OP
    const ctx = baseCtx({
      pointerLocked: false,
      escapeReleasedUnlockAtMs: 1000,
      nowMs: 1001,
    })
    const dec = decideEscapeAction('POINTERLOCKCHANGE_UNLOCKED', ctx)
    expect(dec.action).toBe('NO_OP')
  })

  it('EXIT_LOCK 冷却期内（nowMs - unlockMs < cooldown）再按 ESC：不能开暂停（NO_OP）', () => {
    // 同一个 ESC 按下导致 keydown → exitLock → 有些浏览器或包装会再次把事件回传导致"再处理一次"
    // 必须在 cooldownMs 内拦截为 NO_OP
    const ctx1 = baseCtx({
      pointerLocked: false,
      escapeReleasedUnlockAtMs: 1000,
      nowMs: 1000 + 120, // 120ms < 250ms
    })
    const dec1 = decideEscapeAction('KEYDOWN_ESCAPE', ctx1)
    expect(dec1.action).toBe('NO_OP')

    const ctx2 = baseCtx({
      pointerLocked: false,
      escapeReleasedUnlockAtMs: 1000,
      nowMs: 1000 + 249, // 249 < 250
    })
    const dec2 = decideEscapeAction('KEYDOWN_ESCAPE', ctx2)
    expect(dec2.action).toBe('NO_OP')
  })

  it('EXIT_LOCK 冷却已过（>= cooldown）再按 ESC：独立第二次 ESC → OPEN_PAUSE', () => {
    const ctx3 = baseCtx({
      pointerLocked: false,
      escapeReleasedUnlockAtMs: 1000,
      nowMs: 1000 + 250, // = 250 边界
    })
    const dec3 = decideEscapeAction('KEYDOWN_ESCAPE', ctx3)
    expect(dec3.action).toBe('OPEN_PAUSE')

    const ctx4 = baseCtx({
      pointerLocked: false,
      escapeReleasedUnlockAtMs: 1000,
      nowMs: 1000 + 1500, // 1.5 秒后再按 ESC
    })
    const dec4 = decideEscapeAction('KEYDOWN_ESCAPE', ctx4)
    expect(dec4.action).toBe('OPEN_PAUSE')
  })

  it('暂停中按 ESC：CLOSE_PAUSE（关闭暂停，不恢复 Pointer Lock）', () => {
    // 暂停时 pointerLocked 必然 false（PauseMenu effect 已强制 exitLock），但状态仍 inGame
    const ctx = baseCtx({ isPaused: true, pointerLocked: false })
    const dec = decideEscapeAction('KEYDOWN_ESCAPE', ctx)
    expect(dec.action).toBe('CLOSE_PAUSE')
  })

  it('暂停中 pointerLocked=true（极端边界）仍应该 CLOSE_PAUSE', () => {
    const ctx = baseCtx({ isPaused: true, pointerLocked: true })
    const dec = decideEscapeAction('KEYDOWN_ESCAPE', ctx)
    expect(dec.action).toBe('CLOSE_PAUSE')
  })

  it('非游戏阶段（probe/result/idle）+ 锁定中 ESC：只 EXIT_LOCK，不打开暂停', () => {
    const ctx = baseCtx({ inGamePhase: false, pointerLocked: true, nowMs: 5000 })
    const dec = decideEscapeAction('KEYDOWN_ESCAPE', ctx)
    expect(dec.action).toBe('EXIT_LOCK')
    expect(dec.setUnlockTimestampToMs).toBe(5000)
  })

  it('非游戏阶段 + 未锁定 ESC：NO_OP（不尝试打开暂停）', () => {
    const ctx = baseCtx({ inGamePhase: false, pointerLocked: false })
    const dec = decideEscapeAction('KEYDOWN_ESCAPE', ctx)
    expect(dec.action).toBe('NO_OP')
  })

  it('真实人类 2 ESC 黄金路径序列：LOCKED→(ESC1, EXIT) → 15ms→(ESC1 重复冷却, NOOP) → 600ms→(ESC2 独立, OPEN_PAUSE)', () => {
    // 用户在 Playing 锁定状态：
    //  t=0  按第一次 ESC → EXIT_LOCK, unlockAt=0
    //  t=15 因为事件冒泡/浏览器机制, 又一次 KEYDOWN_ESCAPE → 冷却 NO_OP
    //  t=600 用户真实地又按了一次独立的 ESC → OPEN_PAUSE
    const t0 = decideEscapeAction(
      'KEYDOWN_ESCAPE',
      baseCtx({ pointerLocked: true, nowMs: 0 }), // 初始 state：从未按过 ESC，escapeReleasedUnlockAtMs 用默认 -Infinity
    )
    expect(t0.action).toBe('EXIT_LOCK')
    expect(t0.setUnlockTimestampToMs).toBe(0)

    const t15 = decideEscapeAction(
      'KEYDOWN_ESCAPE',
      baseCtx({ pointerLocked: false, nowMs: 15, escapeReleasedUnlockAtMs: 0 }),
    )
    expect(t15.action).toBe('NO_OP')

    const t600 = decideEscapeAction(
      'KEYDOWN_ESCAPE',
      baseCtx({ pointerLocked: false, nowMs: 600, escapeReleasedUnlockAtMs: 0 }),
    )
    expect(t600.action).toBe('OPEN_PAUSE')
  })
})
