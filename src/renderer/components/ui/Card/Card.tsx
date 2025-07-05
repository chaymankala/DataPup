import { forwardRef } from 'react'
import { Card as RadixCard } from '@radix-ui/themes'
import type { CardProps as RadixCardProps } from '@radix-ui/themes'

export interface CardProps extends RadixCardProps {
  // We can add custom props here if needed
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => {
    return <RadixCard ref={ref} {...props} />
  }
)

Card.displayName = 'Card'
