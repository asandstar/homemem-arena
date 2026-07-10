import { useState, useEffect, useCallback } from 'react'
import { X, HelpCircle } from 'lucide-react'
import { helpTabs } from './helpContent'

interface HelpPanelProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: string
}

export function HelpPanel({ isOpen, onClose, defaultTab = 'controls' }: HelpPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [isOpen, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  const currentTab = helpTabs.find((t) => t.id === activeTab) ?? helpTabs[0]

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-2xl mx-4 overflow-hidden animate-help-popup">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-purple-400" />
            <h2 className="text-lg font-bold text-white">游戏帮助</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-slate-700/50">
          {helpTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {currentTab.sections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? 'mt-6' : ''}>
              <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full" />
                {section.title}
              </h3>
              <div className="space-y-2.5">
                {section.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
                  >
                    <div className="flex gap-3">
                      {item.label && (
                        <div className="flex-shrink-0">
                          <kbd className="px-2 py-1 bg-slate-700 rounded text-purple-300 text-xs font-mono">
                            {item.label}
                          </kbd>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {item.description && (
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.tip && (
                          <p className="text-xs text-amber-400 mt-1.5 flex items-start gap-1.5">
                            <span className="flex-shrink-0">💡</span>
                            <span>{item.tip}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-700/50 bg-slate-800/30 text-center">
          <p className="text-xs text-slate-500">
            按 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 text-[10px] font-mono">H</kbd> 或{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 text-[10px] font-mono">ESC</kbd> 关闭
          </p>
        </div>
      </div>

      <style>{`
        @keyframes help-popup {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-help-popup {
          animation: help-popup 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
