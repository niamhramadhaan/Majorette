export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  mutedTeal: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    colors: {
      primary: '#0E7B35',
      primaryDark: '#0A5E28',
      secondary: '#B9EA38',
      accent: '#FAEF06',
      mutedTeal: '#559D71',
      gradientFrom: '#95D142',
      gradientTo: '#2F8836',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#1B5E20',
      primaryDark: '#145218',
      secondary: '#A8D5BA',
      accent: '#E8F5E9',
      mutedTeal: '#4A7C59',
      gradientFrom: '#66BB6A',
      gradientTo: '#2E7D32',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      primary: '#0369A1',
      primaryDark: '#025988',
      secondary: '#7DD3FC',
      accent: '#BAE6FD',
      mutedTeal: '#4A90A4',
      gradientFrom: '#38BDF8',
      gradientTo: '#0284C7',
    },
  },
  {
    id: 'royal',
    name: 'Royal',
    colors: {
      primary: '#6D28D9',
      primaryDark: '#5B21B6',
      secondary: '#C4B5FD',
      accent: '#DDD6FE',
      mutedTeal: '#7C6DAF',
      gradientFrom: '#A78BFA',
      gradientTo: '#7C3AED',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    colors: {
      primary: '#BE123C',
      primaryDark: '#9F1239',
      secondary: '#FDA4AF',
      accent: '#FFE4E6',
      mutedTeal: '#A4455B',
      gradientFrom: '#FB7185',
      gradientTo: '#E11D48',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      primary: '#EA580C',
      primaryDark: '#C2410C',
      secondary: '#FDBA74',
      accent: '#FED7AA',
      mutedTeal: '#C47A4A',
      gradientFrom: '#FB923C',
      gradientTo: '#F97316',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      primary: '#BE185D',
      primaryDark: '#9D174D',
      secondary: '#F9A8D4',
      accent: '#FBCFE8',
      mutedTeal: '#A44A72',
      gradientFrom: '#F472B6',
      gradientTo: '#DB2777',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    colors: {
      primary: '#475569',
      primaryDark: '#334155',
      secondary: '#CBD5E1',
      accent: '#E2E8F0',
      mutedTeal: '#64748B',
      gradientFrom: '#94A3B8',
      gradientTo: '#64748B',
    },
  },
];

export function getThemeById(id: string): ThemePreset {
  return THEME_PRESETS.find(t => t.id === id) || THEME_PRESETS[0];
}
