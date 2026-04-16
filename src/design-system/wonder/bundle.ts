import { antTheme } from '@/design-system/ant-theme';
import { designSystemContextPack } from '@/design-system/context';
import { tokens } from '@/design-system/tokens';

export const wonderDesignSystemBundle = {
  version: '0.1.0',
  generatedAt: '2026-04-14',
  target: 'wonder',
  product: 'VentaMas',
  stack: {
    framework: 'React 19',
    styling: 'styled-components 6',
    componentLibrary: 'Ant Design 6',
    iconSystem: 'Font Awesome',
  },
  sourceOfTruth: {
    publicApi: '@/design-system',
    files: [
      'src/design-system/index.ts',
      'src/design-system/ant-theme.ts',
      'src/design-system/tokens/index.ts',
      'src/design-system/tokens/semantic.ts',
      'src/design-system/context/context-pack.ts',
      'src/design-system/registry/components.ts',
      'src/design-system/recipes/screen-recipes.ts',
    ],
  },
  guardrails: [
    'Use semantic tokens and --ds-* variables only.',
    'Use only registered components and documented screen recipes.',
    'Prefer Ant Design behavior with VentaMas tokens and styled-components composition.',
    'Do not hardcode colors, spacing, radius, shadows, or z-index values.',
    'Use Font Awesome as the standard icon system for new UI.',
    'Treat legacy components as migration candidates, not fresh source material.',
  ],
  antTheme,
  tokens,
  contextPack: designSystemContextPack,
} as const;

export type WonderDesignSystemBundle = typeof wonderDesignSystemBundle;
