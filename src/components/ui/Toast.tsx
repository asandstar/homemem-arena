import { useToastStore } from '../../store/useToastStore'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export function Toast() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  const iconMap = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  }

  const styleMap = {
    success: 'bg-success text-success-foreground',
    error: 'bg-danger text-danger-foreground',
    info: 'bg-secondary text-secondary-foreground',
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-[var(--shadow-float)] animate-slide-up ${styleMap[toast.type]}`}
        >
          {iconMap[toast.type]}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}