export type ThemeMode = 'dark' | 'light'

export type MonacoTheme = 'vs-dark' | 'vs'

export interface ThemeConfig {
  mode: ThemeMode
  monaco: MonacoTheme
}

export const themeToMonaco = (mode: ThemeMode): MonacoTheme =>
  mode === 'dark' ? 'vs-dark' : 'vs'
