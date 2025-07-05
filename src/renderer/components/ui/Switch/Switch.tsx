import { forwardRef } from 'react'
import { Switch as RadixSwitch, Flex, Text } from '@radix-ui/themes'
import type { SwitchProps as RadixSwitchProps } from '@radix-ui/themes'

export interface SwitchProps extends RadixSwitchProps {
  label?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, ...props }, ref) => {
    if (label) {
      return (
        <Text as="label" size="2">
          <Flex gap="2" align="center">
            <RadixSwitch ref={ref} {...props} />
            {label}
          </Flex>
        </Text>
      )
    }
    
    return <RadixSwitch ref={ref} {...props} />
  }
)

Switch.displayName = 'Switch'
