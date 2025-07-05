import { forwardRef } from 'react'
import { TextField, Text, Flex } from '@radix-ui/themes'
import type { TextFieldRootProps } from '@radix-ui/themes'

export interface InputProps extends TextFieldRootProps {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, ...props }, ref) => {
    return (
      <Flex direction="column" gap="1">
        {label && (
          <Text as="label" size="2" weight="medium">
            {label}
          </Text>
        )}
        <TextField.Root ref={ref} {...props} />
        {(error || helperText) && (
          <Text size="1" color={error ? 'red' : 'gray'}>
            {error || helperText}
          </Text>
        )}
      </Flex>
    )
  }
)

Input.displayName = 'Input'
