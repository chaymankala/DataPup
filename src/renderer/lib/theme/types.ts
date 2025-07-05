export type ThemeAppearance = 'light' | 'dark'
export type ThemeRadius = 'none' | 'small' | 'medium' | 'large' | 'full'
export type ThemeScaling = '90%' | '95%' | '100%' | '105%' | '110%'

export type RadixColor = 
  | 'gray' | 'gold' | 'bronze' | 'brown' | 'yellow' | 'amber' | 'orange' | 'tomato' 
  | 'red' | 'ruby' | 'crimson' | 'pink' | 'plum' | 'purple' | 'violet' | 'iris' 
  | 'indigo' | 'blue' | 'cyan' | 'teal' | 'jade' | 'green' | 'grass' | 'lime' 
  | 'mint' | 'sky'

export type RadixGrayColor = 
  | 'gray' | 'mauve' | 'slate' | 'sage' | 'olive' | 'sand'

export interface Theme {
  id: string
  name: string
  appearance: ThemeAppearance
  accentColor: RadixColor
  grayColor: RadixGrayColor
  radius: ThemeRadius
  scaling: ThemeScaling
}

export interface ThemeContextValue {
  theme: Theme
  setTheme: (themeId: string) => void
  themes: Theme[]
}