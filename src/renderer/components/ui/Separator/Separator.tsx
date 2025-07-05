import { forwardRef } from 'react'
import { Separator as RadixSeparator } from '@radix-ui/themes'
import type { SeparatorProps as RadixSeparatorProps } from '@radix-ui/themes'

export interface SeparatorProps extends RadixSeparatorProps {
  // We can add custom props here if needed
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  (props, ref) => {
    return <RadixSeparator ref={ref} {...props} />
  }
)

Separator.displayName = 'Separator'