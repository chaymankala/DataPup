import { DropdownMenu, Button, Flex, Text, Badge, Box } from '@radix-ui/themes'
import { useTheme } from '../../hooks/useTheme'
import { Tooltip } from '../ui'

interface ThemeSwitcherProps {
  size?: '1' | '2' | '3'
}

export function ThemeSwitcher({ size = '2' }: ThemeSwitcherProps = {}) {
  const { theme, setTheme, themes } = useTheme()

  const getThemeIcon = (appearance: string) => {
    return appearance === 'light' ? '☀️' : '🌙'
  }

  return (
    <DropdownMenu.Root>
      <Tooltip content="Change theme">
        <DropdownMenu.Trigger>
          <Button variant="soft" size={size}>
            <Flex align="center" gap="1">
              <Text size={size}>{getThemeIcon(theme.appearance)}</Text>
              <Text size={size}>{theme.name}</Text>
            </Flex>
          </Button>
        </DropdownMenu.Trigger>
      </Tooltip>

      <DropdownMenu.Content align="end" sideOffset={5}>
        <DropdownMenu.Label>
          <Text size="2" weight="medium">
            Choose Theme
          </Text>
        </DropdownMenu.Label>

        <DropdownMenu.Separator />

        {themes.map((t) => (
          <DropdownMenu.Item key={t.id} onSelect={() => setTheme(t.id)}>
            <Text size="2">
              {getThemeIcon(t.appearance)} {t.name}
              {t.id === theme.id && ' ✓'}
            </Text>
          </DropdownMenu.Item>
        ))}

        <DropdownMenu.Separator />

        <DropdownMenu.Item disabled>
          <Text size="1" color="gray">
            More themes coming soon...
          </Text>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
