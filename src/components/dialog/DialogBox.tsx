import { useEffect, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { CharacterAvatar } from './CharacterAvatar'
import type { DialogNode, DialogChoice } from '../../dialog/dialog'

interface DialogBoxProps {
  node: DialogNode
  onChoice: (choice: DialogChoice) => void
  onNext: () => void
  onClose: () => void
}

export function DialogBox({ node, onChoice, onNext, onClose }: DialogBoxProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)

    let index = 0
    const text = node.text
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [node.text])

  const handleSkip = () => {
    if (isTyping) {
      setDisplayedText(node.text)
      setIsTyping(false)
    }
  }

  const hasChoices = node.choices && node.choices.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={handleSkip}
      />

      <div 
        className="relative w-full max-w-4xl mx-4 mb-6 pointer-events-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-8 right-0 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex gap-4">
            <CharacterAvatar
              speaker={node.speaker}
              speakerName={node.speakerName || '???'}
              size="md"
              isSpeaking={isTyping}
            />

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">
                  {node.speakerName}
                </h3>
                {isTyping && (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              <div 
                className="text-slate-200 text-base leading-relaxed min-h-[60px] mb-4"
                onClick={handleSkip}
              >
                {displayedText}
                {isTyping && <span className="inline-block w-2 h-4 bg-purple-400 ml-0.5 animate-pulse" />}
              </div>

              {hasChoices ? (
                <div className="flex flex-wrap gap-3">
                  {node.choices!.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => onChoice(choice)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-white text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 active:scale-95"
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={onNext}
                  disabled={isTyping}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>继续</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  )
}
