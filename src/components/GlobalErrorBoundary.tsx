import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { BASE_URL } from '../utils/env'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * 全局错误边界：捕获任意子组件渲染异常，提供「重试 / 返回首页」兜底，避免整页白屏。
 * 复赛要求"经得起评审反复操作"，此组件是最后防线。
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] 捕获到渲染异常:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    const cleanBase = BASE_URL.replace(/\/$/, '')
    window.location.href = window.location.origin + cleanBase + '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const errorName = this.state.error?.name ?? 'UnknownError'
    const errorMessage = this.state.error?.message ?? '发生了未知错误'

    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: '#0f172a' }}
      >
        <div className="max-w-md w-[90%] bg-slate-800/90 rounded-2xl shadow-2xl border border-red-500/30 p-6 text-center">
          <div className="text-4xl mb-3">😵</div>
          <h2 className="text-lg font-bold text-white mb-2">
            游戏出了点小问题
          </h2>
          <p className="text-sm text-slate-400 mb-1">
            页面遇到了异常，可以尝试重新加载或返回首页。
          </p>
          <p className="text-xs text-slate-600 mb-5 font-mono break-all">
            {errorName}: {errorMessage.slice(0, 200)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95"
            >
              重试
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-600 transition-all active:scale-95"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }
}
