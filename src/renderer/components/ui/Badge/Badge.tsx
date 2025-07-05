import { forwardRef } from 'react'
import { Badge as RadixBadge } from '@radix-ui/themes'
import type { BadgeProps as RadixBadgeProps } from '@radix-ui/themes'

export interface BadgeProps extends RadixBadgeProps {
  // We can add custom props here if needed
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => {
  return <RadixBadge ref={ref} {...props} />
})

Badge.displayName = 'Badge'
