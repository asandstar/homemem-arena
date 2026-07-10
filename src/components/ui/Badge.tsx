import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'temporal' | 'spatial' | 'object' | 'procedural' | 'observation' | 'action' | 'memory' | 'progress' | 'scripted' | 'probe'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium'
  
  const variantStyles = {
    default: 'bg-surface text-text-muted border border-border',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    temporal: 'bg-temporal/10 text-temporal',
    spatial: 'bg-spatial/10 text-spatial',
    object: 'bg-object/10 text-object',
    procedural: 'bg-procedural/10 text-procedural',
    observation: 'bg-secondary/10 text-secondary',
    action: 'bg-gray-100 text-text-muted',
    memory: 'bg-accent/10 text-accent',
    progress: 'bg-success/10 text-success',
    scripted: 'bg-warning/10 text-warning',
    probe: 'bg-object/10 text-object',
  }

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}