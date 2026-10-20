import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { type ColorTheme, lightTheme, MIN_TOUCH_SIZE, radius } from '@sr/tokens';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-heading', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Sr. Casamentos', template: '%s · Sr. Casamentos' },
  description:
    'Assessoria de casamentos: planejamento, convidados, fornecedores e o dia do evento.',
};

/** Tokens de @sr/tokens viram CSS variables: uma única fonte de cores para app e web. */
function themeVars(theme: ColorTheme): CSSProperties {
  const vars: Record<string, string> = {
    '--radius-md': `${radius.md}px`,
    '--radius-lg': `${radius.lg}px`,
    '--touch': `${MIN_TOUCH_SIZE}px`,
  };
  for (const [key, value] of Object.entries(theme)) {
    vars[`--color-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = value;
  }
  return vars as CSSProperties;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${inter.variable}`}
      style={themeVars(lightTheme)}
    >
      <body>{children}</body>
    </html>
  );
}
