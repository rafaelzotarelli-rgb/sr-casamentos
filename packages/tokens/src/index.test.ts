import { describe, expect, it } from 'vitest';
import { type ColorTheme, contrastRatio, eventDayTheme, lightTheme } from './index';

// WCAG AA: 4,5:1 para texto normal.
const AA = 4.5;

const textPairs: [keyof ColorTheme, keyof ColorTheme][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['onPrimary', 'primary'],
  ['primary', 'background'],
  ['positive', 'background'],
  ['alert', 'background'],
  ['danger', 'background'],
];

describe.each([
  ['claro', lightTheme],
  ['dia do evento', eventDayTheme],
])('contraste do tema %s', (_name, theme) => {
  it.each(textPairs)('%s sobre %s atinge AA', (fg, bg) => {
    expect(contrastRatio(theme[fg], theme[bg])).toBeGreaterThanOrEqual(AA);
  });
});

describe('cores do briefing', () => {
  it('mantém a identidade do protótipo', () => {
    expect(lightTheme.background).toBe('#FAF7F2');
    expect(lightTheme.text).toBe('#221E1B');
    expect(lightTheme.primary).toBe('#7A2E4F');
    expect(lightTheme.positive).toBe('#4E6B5A');
    expect(lightTheme.alert).toBe('#A4501A');
    expect(eventDayTheme.background).toBe('#1C1A18');
    expect(eventDayTheme.primary).toBe('#E3A6BF');
  });

  it('calcula contraste conhecido (preto sobre branco = 21)', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });
});
