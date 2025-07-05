import { forwardRef } from 'react'
import { Button as RadixButton } from '@radix-ui/themes'
import type { ButtonProps as RadixButtonProps } from '@radix-ui/themes'

export interface ButtonProps extends RadixButtonProps {
  // We can add custom props here if needed
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return <RadixButton ref={ref} {...props} />
})

Button.displayName = 'Button'
