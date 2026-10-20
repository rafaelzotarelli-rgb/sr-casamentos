// Tokens de design do Sr. Casamentos (briefing, seção 12).
// Consumidos pelo app (React Native) e pelo painel web (CSS variables).

export interface ColorTheme {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  positive: string;
  alert: string;
  danger: string;
}

/** Tema claro (padrão dos noivos e do painel). */
export const lightTheme: ColorTheme = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  border: '#E3DAD0',
  text: '#221E1B',
  textMuted: '#6A6058',
  primary: '#7A2E4F',
  onPrimary: '#FFFFFF',
  positive: '#4E6B5A',
  alert: '#A4501A',
  danger: '#A12A2A',
};

/** Tema escuro do modo "Dia do evento". */
export const eventDayTheme: ColorTheme = {
  background: '#1C1A18',
  surface: '#272421',
  border: '#3B3631',
  text: '#F4EFE9',
  textMuted: '#B8AEA4',
  primary: '#E3A6BF',
  onPrimary: '#1C1A18',
  positive: '#93B9A1',
  alert: '#E8A275',
  danger: '#F08A8A',
};

export const fonts = {
  /** Títulos. */
  heading: 'Fraunces',
  /** Textos. */
  body: 'Inter',
} as const;

/** Tamanhos em px (no app, escalam com a fonte do sistema). */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/** Área mínima de toque (briefing, seção 11). */
export const MIN_TOUCH_SIZE = 44;

/** Contraste WCAG entre duas cores `#RRGGBB`. */
export function contrastRatio(foreground: string, background: string): number {
  const [l1, l2] = [luminance(foreground), luminance(background)].sort((a, b) => b - a) as [
    number,
    number,
  ];
  return (l1 + 0.05) / (l2 + 0.05);
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Cor inválida: ${hex}`);
  const value = parseInt(match[1], 16);
  const channels = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
