import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Toast } from '../ui/Toast'

export function Layout() {
  return (
    <div className="flex flex-col h-full min-h-screen">
      <Header />
      <main className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  )
}
