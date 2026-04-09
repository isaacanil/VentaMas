import type { DesignSystemContextPack } from '@/design-system/contracts/types';
import { componentRegistry } from '@/design-system/registry/components';
import { screenRecipes } from '@/design-system/recipes/screen-recipes';

export const designSystemContextPack = {
  version: '0.1.0',
  generatedAt: '2026-04-03',
  iconPolicy: {
    library: 'font-awesome',
    importSources: [
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/react-fontawesome',
    ],
    guidance: [
      'Use Font Awesome as the default icon library for new UI contracts.',
      'Pass icons through React nodes or wrapper components instead of custom inline SVG strings.',
      'When a component exposes an icon prop, prefer Font Awesome icons from the approved packages.',
    ],
    antiExamples: [
      'Do not introduce a second general-purpose icon library for feature code.',
      'Do not communicate critical state using color alone without label or icon support.',
    ],
  },
  generationWorkflow: [
    'Read component registry and choose only registered components.',
    'Select a screen recipe before writing JSX.',
    'Produce a UI plan with design-system checks.',
    'Validate the plan against registry and recipe constraints.',
    'Translate the validated plan into React using controlled Ant components, MenuApp and layout primitives when applicable.',
  ],
  rules: [
    'Use semantic tokens and --ds-* CSS variables only.',
    'Use Font Awesome as the standard icon system for new contracts and generated UI.',
    'Prefer controlled Ant primitives for base controls: Button, Switch, Select and sometimes Table.',
    'Do not invent component APIs outside the registry.',
    'Do not hardcode colors, spacing, border radii or z-index values in feature code.',
    'For dashboard pages, respect the PageShell/PageBody/PageLayout contract and MenuApp registration behavior.',
    'AdvancedTable requires a parent that preserves the flex-height chain: flex growth, min-height: 0 and overflow containment.',
    'Use one recipe per screen and extend it incrementally instead of improvising layouts from scratch.',
  ],
  tokenFamilies: [
    {
      family: 'semantic.color',
      prefix: '--ds-color-',
      guidance: 'Use semantic colors for background, text, border, action and state.',
      examples: [
        '--ds-color-bg-surface',
        '--ds-color-text-primary',
        '--ds-color-action-primary',
      ],
    },
    {
      family: 'spacing',
      prefix: '--ds-space-',
      guidance: 'All layout spacing should map to the spacing scale.',
      examples: ['--ds-space-3', '--ds-space-4', '--ds-space-6'],
    },
    {
      family: 'radius',
      prefix: '--ds-radius-',
      guidance: 'Use shared corner radii for cards, controls and overlays.',
      examples: ['--ds-radius-md', '--ds-radius-lg', '--ds-radius-xl'],
    },
    {
      family: 'shadow',
      prefix: '--ds-shadow-',
      guidance: 'Use elevation tokens instead of ad hoc box-shadow values.',
      examples: ['--ds-shadow-sm', '--ds-shadow-md', '--ds-shadow-lg'],
    },
    {
      family: 'typography',
      prefix: '--ds-font-',
      guidance: 'Use font family, size, weight and line-height tokens.',
      examples: [
        '--ds-font-size-base',
        '--ds-font-weight-medium',
        '--ds-line-height-normal',
      ],
    },
    {
      family: 'border',
      prefix: '--ds-color-border-',
      guidance: 'Use semantic border and focus colors with shared border styles.',
      examples: [
        '--ds-color-border-default',
        '--ds-color-border-subtle',
        '--ds-color-border-focus',
      ],
    },
    {
      family: 'zIndex',
      prefix: '--ds-z-',
      guidance: 'Use shared stacking values for sticky regions and overlays.',
      examples: ['--ds-z-sticky', '--ds-z-drawer', '--ds-z-modal'],
    },
  ],
  componentRegistry,
  screenRecipes,
} as const satisfies DesignSystemContextPack;
