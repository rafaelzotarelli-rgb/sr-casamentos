import { useWindowDimensions } from 'react-native';

/** Tela larga (computador/tablet deitado): menu lateral e conteúdo em colunas. */
export const WIDE_BREAKPOINT = 900;

export function useIsWide(): boolean {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}
