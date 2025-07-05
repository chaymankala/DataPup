import { Box } from '@radix-ui/themes'
import './Skeleton.css'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  animation?: 'pulse' | 'wave'
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '20px',
  variant = 'rectangular',
  animation = 'pulse',
  className = ''
}: SkeletonProps) {
  const classes = `skeleton skeleton-${variant} skeleton-${animation} ${className}`

  return (
    <Box
      className={classes}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  )
}
