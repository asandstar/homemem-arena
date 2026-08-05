import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { Toast } from '../ui/Toast'
import {
  stopAllAudioImmediate,
  closeAllAudioContextsBestEffort,
  acquireAudioPlaybackMutex,
  releaseAudioPlaybackMutex,
} from '../../audio/audioManager'

/**
 * 路由级音频生命周期守卫：
 *  1) 进入 /play/* → 申请跨标签页互斥锁（其他 tab 立刻静默，避免两套声音）
 *  2) 离开 /play/* → 释放锁 + 硬停止 + 关闭 AC，避免"点返回/任务列表后声音还在响"
 *  3) pathname 在游戏页内部不变的情况下，组件更新不重复申请/释放
 */
function RouteAudioStopGuard() {
  const { pathname } = useLocation()
  const lastIsPlayRef = useRef(false)
  const mutexOwnerRef = useRef(false)

  useEffect(() => {
    const isPlayRoute = /^\/play(\/|$)/.test(pathname)
    const prevIsPlay = lastIsPlayRef.current
    lastIsPlayRef.current = isPlayRoute

    // 场景 A：首次进入 /play/* 路由
    if (isPlayRoute && !prevIsPlay) {
      const isOwner = acquireAudioPlaybackMutex((owner) => {
        mutexOwnerRef.current = owner
        if (!owner) {
          // 互斥被抢走：立即静默本 tab
          try { stopAllAudioImmediate() } catch { /* ignore */ }
          try { closeAllAudioContextsBestEffort() } catch { /* ignore */ }
        }
      })
      mutexOwnerRef.current = isOwner
      return
    }

    // 场景 B：离开 /play/* 路由（切到 /tasks / /result / /probe / 首页）
    if (!isPlayRoute && prevIsPlay) {
      try { releaseAudioPlaybackMutex() } catch { /* ignore */ }
      mutexOwnerRef.current = false
      try {
        stopAllAudioImmediate()
        closeAllAudioContextsBestEffort()
      } catch { /* ignore */ }
      return
    }

    // 场景 C：非 play 路由 → 额外双保险，任何异常残留音频都停掉
    if (!isPlayRoute) {
      try {
        stopAllAudioImmediate()
        closeAllAudioContextsBestEffort()
      } catch { /* ignore */ }
    }
  }, [pathname])

  // 组件卸载兜底：页面被整体替换（HMR / 外层重载）时也释放锁
  useEffect(() => {
    return () => {
      if (lastIsPlayRef.current || mutexOwnerRef.current) {
        try { releaseAudioPlaybackMutex() } catch { /* ignore */ }
      }
    }
  }, [])

  return null
}

export function Layout() {
  return (
    <div className="flex flex-col h-full min-h-screen">
      <RouteAudioStopGuard />
      <Header />
      <main className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  )
}
