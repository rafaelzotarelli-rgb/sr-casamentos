import { fontSize, lightTheme, MIN_TOUCH_SIZE, radius, spacing } from '@sr/tokens';

export const colors = lightTheme;
export { fontSize, MIN_TOUCH_SIZE, radius, spacing };

/** Nomes das fontes carregadas em app/_layout.tsx. */
export const fontFamily = {
  heading: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_600SemiBold',
} as const;

export const siteUrl = process.env.EXPO_PUBLIC_SITE_URL ?? 'http://localhost:3000';
