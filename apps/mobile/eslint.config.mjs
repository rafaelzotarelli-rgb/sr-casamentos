import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { baseConfig } from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  { ignores: ['expo-env.d.ts', '.expo/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
];
