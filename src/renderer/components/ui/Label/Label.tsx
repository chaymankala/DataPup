import { forwardRef } from 'react'
import { Text } from '@radix-ui/themes'
import type { TextProps } from '@radix-ui/themes'

export interface LabelProps extends Omit<TextProps, 'as'> {
  htmlFor?: string
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, ...props }, ref) => {
    return (
      <Text ref={ref} as="label" size="2" weight="medium" {...props}>
        {children}
        {required && <Text color="red" ml="1">*</Text>}
      </Text>
    )
  }
)

Label.displayName = 'Label'