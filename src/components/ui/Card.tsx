import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-bg rounded-md border border-border shadow-[var(--shadow-card)] transition-shadow duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}