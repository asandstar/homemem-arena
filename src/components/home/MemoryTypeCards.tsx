import { Brain, MapPin, Box, ListOrdered } from 'lucide-react'
import type { MemoryType } from '../../types/memory'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface MemoryTypeInfo {
  type: MemoryType
  title: string
  description: string
  icon: React.ReactNode
}

const memoryTypes: MemoryTypeInfo[] = [
  {
    type: 'temporal',
    title: '时序记忆',
    description: '记住事件顺序、计数与状态转移，例如擦桌子擦满 N 次后停止。',
    icon: <Brain size={28} />,
  },
  {
    type: 'spatial',
    title: '空间记忆',
    description: '在遮挡或场景变化下维持物体位置与空间关系，例如找回被遮住的勺子。',
    icon: <MapPin size={28} />,
  },
  {
    type: 'object',
    title: '物体记忆',
    description: '跨时间保持对特定物体的指代一致性，例如“把刚才那个红色杯子放进洗碗机”。',
    icon: <Box size={28} />,
  },
  {
    type: 'procedural',
    title: '程序记忆',
    description: '复现先前演示的操作顺序与模式，例如按同样顺序叠衣服。',
    icon: <ListOrdered size={28} />,
  },
]

const typeColors: Record<MemoryType, string> = {
  temporal: 'text-temporal',
  spatial: 'text-spatial',
  object: 'text-object',
  procedural: 'text-procedural',
}

const bgColors: Record<MemoryType, string> = {
  temporal: 'bg-temporal/10',
  spatial: 'bg-spatial/10',
  object: 'bg-object/10',
  procedural: 'bg-procedural/10',
}

export function MemoryTypeCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {memoryTypes.map((item) => (
        <Card
          key={item.type}
          className="p-5 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 hover:-translate-y-1"
        >
          <div className={`inline-flex p-3 rounded-lg ${bgColors[item.type]} ${typeColors[item.type]} mb-4`}>
            {item.icon}
          </div>
          <h3 className="font-semibold text-text mb-2">{item.title}</h3>
          <p className="text-sm text-text-muted">{item.description}</p>
          <Badge variant={item.type as any} className="mt-3">
            {item.type}
          </Badge>
        </Card>
      ))}
    </div>
  )
}
