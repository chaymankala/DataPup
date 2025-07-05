import { ReactNode } from 'react'
import { Tooltip as RadixTooltip } from '@radix-ui/themes'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
}

export function Tooltip({ 
  content, 
  children, 
  side = 'top',
  align = 'center',
  delayDuration = 200 
}: TooltipProps) {
  return (
    <RadixTooltip 
      content={content}
      side={side}
      align={align}
      delayDuration={delayDuration}
    >
      {children}
    </RadixTooltip>
  )
}