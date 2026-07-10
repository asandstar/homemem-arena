import type { TaskConfig } from '../../types/task'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: TaskConfig[]
  onStart: (taskId: string) => void
}

export function TaskList({ tasks, onStart }: TaskListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task, index) => (
        <TaskCard key={task.id} task={task} levelNumber={index + 1} onStart={onStart} />
      ))}
    </div>
  )
}
