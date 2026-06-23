import { getThemeById, type ThemeColors } from '../themes';

const CSS_VARS: Record<keyof ThemeColors, string> = {
  primary: '--color-primary',
  primaryDark: '--color-primary-dark',
  secondary: '--color-secondary',
  accent: '--color-accent',
  mutedTeal: '--color-muted-teal',
  gradientFrom: '--gradient-from',
  gradientTo: '--gradient-to',
};

export function applyTheme(themeId: string): void {
  const theme = getThemeById(themeId);
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VARS)) {
    root.style.setProperty(cssVar, theme.colors[key as keyof ThemeColors]);
  }
}
