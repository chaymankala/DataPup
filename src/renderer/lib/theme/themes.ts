import { Theme } from './types'

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    appearance: 'light',
    accentColor: 'blue',
    grayColor: 'gray',
    radius: 'medium',
    scaling: '100%'
  },
  {
    id: 'dark',
    name: 'Dark',
    appearance: 'dark',
    accentColor: 'blue',
    grayColor: 'gray',
    radius: 'medium',
    scaling: '100%'
  },
  {
    id: 'dark-violet',
    name: 'Dark Violet',
    appearance: 'dark',
    accentColor: 'violet',
    grayColor: 'mauve',
    radius: 'medium',
    scaling: '100%'
  },
  {
    id: 'dark-green',
    name: 'Dark Green',
    appearance: 'dark',
    accentColor: 'green',
    grayColor: 'sage',
    radius: 'medium',
    scaling: '100%'
  },
  {
    id: 'dark-orange',
    name: 'Dark Orange',
    appearance: 'dark',
    accentColor: 'orange',
    grayColor: 'sand',
    radius: 'medium',
    scaling: '100%'
  },
  {
    id: 'light-pink',
    name: 'Light Pink',
    appearance: 'light',
    accentColor: 'pink',
    grayColor: 'mauve',
    radius: 'large',
    scaling: '100%'
  },
  {
    id: 'light-mint',
    name: 'Light Mint',
    appearance: 'light',
    accentColor: 'mint',
    grayColor: 'sage',
    radius: 'small',
    scaling: '100%'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    appearance: 'dark',
    accentColor: 'amber',
    grayColor: 'gray',
    radius: 'none',
    scaling: '105%'
  }
]

export const defaultTheme = themes[1] // Dark theme as default
