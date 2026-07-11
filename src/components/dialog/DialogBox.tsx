import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, MessageSquare } from 'lucide-react'
import type { DialogNode, DialogChoice } from '../../dialog/dialog'

interface DialogBoxProps {
  node: DialogNode
  onClose: () => void
  onChoice: (choice: DialogChoice) => void
  onNext: () => void
}

export function DialogBox({ node, onClose, onChoice, onNext }: DialogBoxProps) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showChoices, setShowChoices] = useState(false)

  const typeText = useCallback(() => {
    setDisplayText('')
    setIsTyping(true)
    setShowChoices(false)
    
    let index = 0
    const text = node.text
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(timer)
        if (node.choices) {
          setTimeout(() => setShowChoices(true), 300)
        }
      }
    }, 30)
    
    return () => clearInterval(timer)
  }, [node.text, node.choices])

  useEffect(() => {
    const cleanup = typeText()
    return cleanup
  }, [typeText])

  const handleSkip = () => {
    if (isTyping) {
      setDisplayText(node.text)
      setIsTyping(false)
      if (node.choices) {
        setShowChoices(true)
      }
    } else if (!node.choices) {
      onNext()
    }
  }

  const getSpeakerColor = () => {
    switch (node.speaker) {
      case 'narrator': return 'text-purple-300 border-purple-500/30 bg-purple-900/20'
      case 'system': return 'text-cyan-300 border-cyan-500/30 bg-cyan-900/20'
      case 'character': return 'text-amber-300 border-amber-500/30 bg-amber-900/20'
      case 'player': return 'text-green-300 border-green-500/30 bg-green-900/20'
      default: return 'text-white border-slate-600/30 bg-slate-800/50'
    }
  }

  const getSpeakerIcon = () => {
    switch (node.speaker) {
      case 'narrator': return <MessageSquare size={16} className="text-purple-400" />
      case 'system': return <MessageSquare size={16} className="text-cyan-400" />
      case 'character': return <MessageSquare size={16} className="text-amber-400" />
      case 'player': return <MessageSquare size={16} className="text-green-400" />
      default: return null
    }
  }

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 pointer-events-auto">
      <div 
        className={`w-full max-w-lg mx-4 mb-8 p-4 rounded-xl border shadow-2xl animate-dialog-in ${getSpeakerColor()}`}
        onClick={handleSkip}
      >
        <div className="flex items-center gap-2 mb-3">
          {getSpeakerIcon()}
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
            {node.speakerName || node.speaker}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="ml-auto p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="text-sm leading-relaxed min-h-[60px]">
          {displayText}
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
          )}
        </div>

        {!isTyping && !node.choices && (
          <div className="mt-3 flex items-center justify-end">
            <span className="text-xs text-slate-400 flex items-center gap-1 animate-pulse">
              点击继续 <ChevronRight size={12} />
            </span>
          </div>
        )}

        {showChoices && node.choices && (
          <div className="mt-4 space-y-2 animate-choices-in">
            {node.choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onChoice(choice)
                }}
                className={`w-full text-left px-4 py-2 rounded-lg border transition-all hover:scale-[1.02] ${
                  index === 0 
                    ? 'border-purple-500/50 bg-purple-900/30 hover:bg-purple-800/40' 
                    : 'border-slate-600/50 bg-slate-800/30 hover:bg-slate-700/40'
                }`}
              >
                <span className="text-sm">{choice.text}</span>
                {choice.effect && choice.effect.type === 'score' && (
                  <span className="ml-2 text-xs text-green-400">+{choice.effect.value}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dialog-in {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes choices-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-dialog-in {
          animation: dialog-in 0.3s ease-out forwards;
        }
        .animate-choices-in {
          animation: choices-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}