import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { BASE_URL } from './utils/env'

// 走统一 env.ts，避免 (import.meta as any)?.env?.BASE_URL 的可选链使 Vite 静态替换失败
const basename = BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          lazy: async () => ({ Component: (await import('./pages/HomePage')).HomePage }),
        },
        {
          path: 'tasks',
          lazy: async () => ({ Component: (await import('./pages/TaskSelectPage')).TaskSelectPage }),
        },
        {
          path: 'play/:taskId',
          lazy: async () => ({ Component: (await import('./pages/ArenaPage')).ArenaPage }),
        },
        {
          path: 'probe/:taskId?',
          lazy: async () => ({ Component: (await import('./pages/ProbePage')).ProbePage }),
        },
        {
          path: 'result/:taskId',
          lazy: async () => ({ Component: (await import('./pages/ResultPage')).ResultPage }),
        },
        {
          path: 'data/:taskId',
          lazy: async () => ({ Component: (await import('./pages/SessionDataPage')).SessionDataPage }),
        },
        { path: '*', element: <Navigate to="/tasks" replace /> },
      ],
    },
  ],
  { basename },
)
