interface CharacterAvatarProps {
  speaker: string
  speakerName: string
  size?: 'sm' | 'md' | 'lg'
  isSpeaking?: boolean
}

const characterConfig: Record<string, { emoji: string; gradient: string; glow: string; bg: string }> = {
  '餐盘精': {
    emoji: '🥏',
    gradient: 'from-yellow-400 to-orange-500',
    glow: 'shadow-[0_0_20px_rgba(255,200,0,0.6)]',
    bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
  },
  '钥匙猫': {
    emoji: '🐱',
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
  },
  '袜子幽灵': {
    emoji: '👻',
    gradient: 'from-white to-blue-300',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.5)]',
    bg: 'bg-gradient-to-br from-white/10 to-blue-300/20',
  },
  '早餐闹钟': {
    emoji: '⏰',
    gradient: 'from-cyan-400 to-blue-500',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.6)]',
    bg: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20',
  },
  '记忆宅邸': {
    emoji: '🏠',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-[0_0_25px_rgba(139,92,246,0.5)]',
    bg: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20',
  },
  'MEM-07 系统': {
    emoji: '🤖',
    gradient: 'from-emerald-400 to-cyan-500',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
    bg: 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20',
  },
  default: {
    emoji: '✨',
    gradient: 'from-slate-400 to-slate-500',
    glow: '',
    bg: 'bg-gradient-to-br from-slate-500/20 to-slate-600/20',
  },
}

export function CharacterAvatar({ speakerName, size = 'md', isSpeaking = false }: CharacterAvatarProps) {
  const config = characterConfig[speakerName] || characterConfig.default

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-3xl',
    lg: 'w-20 h-20 text-4xl',
  }

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div
        className={`
          absolute inset-0 rounded-full bg-gradient-to-br ${config.bg}
          ${isSpeaking ? 'animate-pulse' : ''}
        `}
      />
      
      <div
        className={`
          absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient}
          p-[2px]
          ${isSpeaking ? config.glow : ''}
          transition-all duration-300
        `}
      >
        <div className="absolute inset-[2px] rounded-full bg-slate-900 flex items-center justify-center">
          <span className="drop-shadow-lg">{config.emoji}</span>
        </div>
      </div>

      <div
        className={`
          absolute -bottom-1 left-1/2 -translate-x-1/2
          bg-gradient-to-r ${config.gradient}
          rounded-full px-2 py-0.5
          text-[10px] font-bold text-white
          whitespace-nowrap
        `}
      >
        {speakerName}
      </div>
    </div>
  )
}
