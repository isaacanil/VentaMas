import type { ComponentContract } from '@/design-system/contracts/types';

export const componentRegistry = [
  {
    id: 'antd.button',
    displayName: 'Ant Button',
    importPath: 'antd',
    namedExport: 'Button',
    category: 'action',
    status: 'ready',
    description:
      'Controlled action primitive. Prefer this when no VentaMas wrapper exists.',
    sourcePath: 'node_modules/antd',
    tags: ['action', 'cta', 'form'],
    props: [
      {
        name: 'type',
        kind: 'enum',
        description: 'Visual emphasis defined by Ant Design.',
        values: ['primary', 'default', 'link', 'text'],
      },
      {
        name: 'size',
        kind: 'enum',
        description: 'Density variant.',
        values: ['small', 'middle', 'large'],
      },
      {
        name: 'loading',
        kind: 'boolean',
        description: 'Shows pending feedback during async actions.',
      },
      {
        name: 'disabled',
        kind: 'boolean',
        description: 'Disables interaction.',
      },
      {
        name: 'children',
        kind: 'node',
        description: 'Visible label and optional icon.',
        required: true,
      },
    ],
    variants: [
      {
        name: 'emphasis',
        prop: 'type',
        values: ['primary', 'default', 'link', 'text'],
        defaultValue: 'default',
      },
      {
        name: 'density',
        prop: 'size',
        values: ['small', 'middle', 'large'],
        defaultValue: 'middle',
      },
    ],
    states: ['default', 'hover', 'active', 'disabled', 'loading'],
    layoutRules: [
      'Use one primary action per region.',
      'Pair with semantic action tokens through the Ant theme only.',
    ],
    antiExamples: [
      'Do not hardcode color props to bypass the global Ant theme.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'action.primary',
        cssVar: '--ds-color-action-primary',
        role: 'Primary fill',
      },
      {
        family: 'radius',
        path: 'md',
        cssVar: '--ds-radius-md',
        role: 'Default control radius',
      },
    ],
  },
  {
    id: 'antd.input',
    displayName: 'Ant Input',
    importPath: 'antd',
    namedExport: 'Input',
    category: 'form',
    status: 'ready',
    description: 'Default text input for dense ERP forms.',
    sourcePath: 'node_modules/antd',
    tags: ['input', 'form', 'text'],
    props: [
      {
        name: 'placeholder',
        kind: 'string',
        description: 'Hint shown when the field is empty.',
      },
      {
        name: 'allowClear',
        kind: 'boolean',
        description: 'Enables explicit clear affordance.',
      },
      {
        name: 'disabled',
        kind: 'boolean',
        description: 'Disables interaction.',
      },
      {
        name: 'status',
        kind: 'enum',
        description: 'Validation status.',
        values: ['error', 'warning'],
      },
    ],
    states: ['default', 'focus', 'error', 'warning', 'disabled'],
    layoutRules: [
      'Group inside forms or filter bars.',
      'Labels and helper text must live outside the field when reusable.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'border.default',
        cssVar: '--ds-color-border-default',
        role: 'Default stroke',
      },
      {
        family: 'semantic.color',
        path: 'border.focus',
        cssVar: '--ds-color-border-focus',
        role: 'Focus ring',
      },
    ],
  },
  {
    id: 'antd.switch',
    displayName: 'Ant Switch',
    importPath: 'antd',
    namedExport: 'Switch',
    category: 'form',
    status: 'ready',
    description:
      'Controlled boolean toggle for settings and lightweight state changes.',
    sourcePath: 'node_modules/antd',
    tags: ['switch', 'toggle', 'form'],
    props: [
      {
        name: 'checked',
        kind: 'boolean',
        description: 'Controlled checked state.',
        required: true,
      },
      {
        name: 'onChange',
        kind: 'callback',
        description: 'Controlled state change handler.',
        required: true,
      },
      {
        name: 'disabled',
        kind: 'boolean',
        description: 'Disables interaction.',
      },
      {
        name: 'size',
        kind: 'enum',
        description: 'Density variant.',
        values: ['small', 'default'],
      },
    ],
    states: ['checked', 'unchecked', 'disabled', 'loading'],
    layoutRules: [
      'Use as a controlled component.',
      'Pair with visible labels so meaning does not depend only on position or color.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'action.primary',
        cssVar: '--ds-color-action-primary',
        role: 'Checked state accent',
      },
    ],
  },
  {
    id: 'antd.select',
    displayName: 'Ant Select',
    importPath: 'antd',
    namedExport: 'Select',
    category: 'form',
    status: 'ready',
    description: 'Choice control for option-driven filters and forms.',
    sourcePath: 'node_modules/antd',
    tags: ['select', 'filter', 'form'],
    props: [
      {
        name: 'options',
        kind: 'array',
        description: 'List of selectable options.',
        required: true,
      },
      {
        name: 'mode',
        kind: 'enum',
        description: 'Selection mode.',
        values: ['multiple', 'tags'],
      },
      {
        name: 'allowClear',
        kind: 'boolean',
        description: 'Enables explicit clear affordance.',
      },
      {
        name: 'placeholder',
        kind: 'string',
        description: 'Hint shown when no option is selected.',
      },
    ],
    states: ['default', 'open', 'selected', 'disabled'],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'bg.surface',
        cssVar: '--ds-color-bg-surface',
        role: 'Field background',
      },
    ],
  },
  {
    id: 'antd.table',
    displayName: 'Ant Table',
    importPath: 'antd',
    namedExport: 'Table',
    category: 'display',
    status: 'ready',
    description:
      'Controlled dense data grid primitive. Use directly when AdvancedTable is unnecessary.',
    sourcePath: 'node_modules/antd',
    tags: ['table', 'grid', 'data'],
    props: [
      {
        name: 'columns',
        kind: 'array',
        description: 'Column definitions.',
        required: true,
      },
      {
        name: 'dataSource',
        kind: 'array',
        description: 'Rendered rows.',
        required: true,
      },
      {
        name: 'rowKey',
        kind: 'string',
        description: 'Stable identity key.',
      },
      {
        name: 'pagination',
        kind: 'object',
        description: 'Pagination strategy.',
      },
      {
        name: 'loading',
        kind: 'boolean',
        description: 'Pending state.',
      },
    ],
    states: ['default', 'loading', 'empty', 'rowSelected', 'rowHover'],
    layoutRules: [
      'Tables should be paired with filters or contextual actions.',
      'Use zebra row token and state row tokens instead of ad hoc row colors.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'bg.tableRowAlt',
        cssVar: '--ds-color-bg-table-row-alt',
        role: 'Alternate row background',
      },
      {
        family: 'semantic.color',
        path: 'interactive.table.rowSelected.bg',
        cssVar: '--ds-color-interactive-table-row-selected-bg',
        role: 'Selected row feedback',
      },
    ],
  },
  {
    id: 'vm.pageShell',
    displayName: 'PageShell',
    importPath: '@/components/layout/PageShell',
    namedExport: 'PageShell',
    category: 'layout',
    status: 'ready',
    description:
      'Base page container for dashboard pages. Provides flex growth and min-height contract.',
    sourcePath: 'src/components/layout/PageShell.tsx',
    tags: ['layout', 'page', 'shell'],
    props: [
      {
        name: 'children',
        kind: 'node',
        description: 'Page content.',
        required: true,
      },
    ],
    layoutRules: [
      'Use as the base when extending page layout with styled-components.',
      'Every level between dashboard content and the scrollable region must preserve flex growth and min-height: 0.',
    ],
  },
  {
    id: 'vm.pageBody',
    displayName: 'PageBody',
    importPath: '@/components/layout/PageShell',
    namedExport: 'PageBody',
    category: 'layout',
    status: 'ready',
    description:
      'PageShell plus overflow containment. Use for scrolleable pages without the standard page background.',
    sourcePath: 'src/components/layout/PageShell.tsx',
    tags: ['layout', 'page', 'overflow'],
    props: [
      {
        name: 'children',
        kind: 'node',
        description: 'Page content.',
        required: true,
      },
    ],
    layoutRules: [
      'Use when a descendant owns scrolling.',
      'Avoid adding viewport-height styles inside dashboard pages.',
    ],
  },
  {
    id: 'vm.pageLayout',
    displayName: 'PageLayout',
    importPath: '@/components/layout/PageShell',
    namedExport: 'PageLayout',
    category: 'layout',
    status: 'ready',
    description:
      'Default dashboard page layout for MenuApp + filters + table/list screens.',
    sourcePath: 'src/components/layout/PageShell.tsx',
    tags: ['layout', 'page', 'dashboard'],
    props: [
      {
        name: 'children',
        kind: 'node',
        description: 'Page content.',
        required: true,
      },
    ],
    layoutRules: [
      'Prefer this for dashboard pages with MenuApp and scrolleable results.',
      'Do not duplicate its flex and overflow CSS in ad hoc wrappers.',
      'Use standard page background instead of custom neutral backgrounds.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'bg.page',
        cssVar: '--ds-color-bg-page',
        role: 'Default page background',
      },
    ],
  },
  {
    id: 'vm.appIcon',
    displayName: 'AppIcon',
    importPath: '@/components/ui/AppIcon',
    namedExport: 'AppIcon',
    category: 'display',
    status: 'ready',
    description:
      'Single entrypoint for Font Awesome icons in VentaMas. Resolves glyphs by name and applies semantic sizing and tone.',
    sourcePath: 'src/components/ui/AppIcon/AppIcon.tsx',
    tags: ['icon', 'font-awesome', 'display'],
    props: [
      {
        name: 'name',
        kind: 'string',
        description: 'Registered Font Awesome glyph name.',
      },
      {
        name: 'tone',
        kind: 'enum',
        description: 'Semantic icon tone.',
        values: [
          'default',
          'muted',
          'primary',
          'success',
          'warning',
          'danger',
          'info',
          'inverse',
        ],
      },
      {
        name: 'sizeToken',
        kind: 'enum',
        description: 'Token-based icon size.',
        values: ['xs', 'sm', 'md', 'lg', 'xl'],
      },
      {
        name: 'spin',
        kind: 'boolean',
        description: 'Spin animation for progress or syncing states.',
      },
    ],
    layoutRules: [
      'Use this instead of importing FontAwesomeIcon directly in new code.',
      'Resolve icons by registry name whenever possible.',
    ],
  },
  {
    id: 'vm.badge',
    displayName: 'Badge',
    importPath: '@/components/common/Badge/Badge',
    namedExport: 'Badge',
    category: 'feedback',
    status: 'legacy',
    description:
      'Compact status marker. Current implementation still allows raw colors and should be tokenized next.',
    sourcePath: 'src/components/common/Badge/Badge.tsx',
    tags: ['badge', 'status', 'metadata'],
    props: [
      {
        name: 'text',
        kind: 'string',
        description: 'Visible label.',
        required: true,
      },
      {
        name: 'variant',
        kind: 'enum',
        description: 'Visual style.',
        values: ['filled', 'outlined', 'text', 'light'],
      },
      {
        name: 'size',
        kind: 'enum',
        description: 'Density variant.',
        values: ['small', 'medium', 'large'],
      },
      {
        name: 'icon',
        kind: 'node',
        description: 'Optional leading icon.',
      },
      {
        name: 'color',
        kind: 'string',
        description:
          'Legacy escape hatch. Replace with semantic status props in future iterations.',
      },
      {
        name: 'bgColor',
        kind: 'string',
        description:
          'Legacy escape hatch. Replace with semantic status props in future iterations.',
      },
    ],
    variants: [
      {
        name: 'variant',
        prop: 'variant',
        values: ['filled', 'outlined', 'text', 'light'],
        defaultValue: 'filled',
      },
      {
        name: 'size',
        prop: 'size',
        values: ['small', 'medium', 'large'],
        defaultValue: 'medium',
      },
    ],
    states: ['default', 'hover'],
    antiExamples: [
      'Do not pass arbitrary hex values from feature code.',
      'Do not use as the only status signal when the state is critical.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'state.success',
        cssVar: '--ds-color-state-success',
        role: 'Success foreground candidate',
      },
      {
        family: 'semantic.color',
        path: 'state.successSubtle',
        cssVar: '--ds-color-state-success-subtle',
        role: 'Success background candidate',
      },
    ],
  },
  {
    id: 'vm.statusBadge',
    displayName: 'StatusBadge',
    importPath: '@/components/ui/StatusBadge',
    namedExport: 'StatusBadge',
    category: 'feedback',
    status: 'ready',
    description:
      'Semantic status badge with token-driven tones and Font Awesome icons.',
    sourcePath: 'src/components/ui/StatusBadge/StatusBadge.tsx',
    tags: ['badge', 'status', 'feedback'],
    props: [
      {
        name: 'status',
        kind: 'string',
        description: 'Known status key resolved to semantic tone and label.',
      },
      {
        name: 'label',
        kind: 'node',
        description: 'Custom badge label.',
      },
      {
        name: 'tone',
        kind: 'enum',
        description: 'Semantic tone override.',
        values: ['neutral', 'success', 'warning', 'danger', 'info'],
      },
      {
        name: 'variant',
        kind: 'enum',
        description: 'Badge emphasis style.',
        values: ['subtle', 'solid', 'outline'],
      },
      {
        name: 'size',
        kind: 'enum',
        description: 'Density variant.',
        values: ['sm', 'md'],
      },
      {
        name: 'icon',
        kind: 'node',
        description: 'Optional icon override.',
      },
    ],
    variants: [
      {
        name: 'variant',
        prop: 'variant',
        values: ['subtle', 'solid', 'outline'],
        defaultValue: 'subtle',
      },
      {
        name: 'size',
        prop: 'size',
        values: ['sm', 'md'],
        defaultValue: 'md',
      },
    ],
    states: ['default'],
    layoutRules: [
      'Prefer this over the legacy Badge for semantic status communication.',
      'Pair status color with icon or label, not color alone.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'state.successSubtle',
        cssVar: '--ds-color-state-success-subtle',
        role: 'Success badge background',
      },
      {
        family: 'radius',
        path: 'pill',
        cssVar: '--ds-radius-pill',
        role: 'Badge radius',
      },
    ],
  },
  {
    id: 'vm.datePicker',
    displayName: 'DatePicker',
    importPath: '@/components/common/DatePicker/DatePicker',
    namedExport: 'DatePicker',
    category: 'form',
    status: 'legacy',
    description:
      'Custom date and date-range picker with presets and mobile modal. Needs tokenization before broad AI generation.',
    sourcePath: 'src/components/common/DatePicker/DatePicker.tsx',
    tags: ['date', 'range', 'filter', 'form'],
    props: [
      {
        name: 'mode',
        kind: 'enum',
        description: 'Selection mode.',
        values: ['single', 'range'],
      },
      {
        name: 'value',
        kind: 'object',
        description: 'Selected date or date range.',
      },
      {
        name: 'onChange',
        kind: 'callback',
        description: 'Change handler.',
        required: true,
      },
      {
        name: 'placeholder',
        kind: 'string',
        description: 'Empty-state hint.',
      },
      {
        name: 'allowClear',
        kind: 'boolean',
        description: 'Enables explicit clear affordance.',
      },
      {
        name: 'presets',
        kind: 'array',
        description: 'Quick range shortcuts.',
      },
    ],
    variants: [
      {
        name: 'mode',
        prop: 'mode',
        values: ['single', 'range'],
        defaultValue: 'single',
      },
    ],
    states: ['default', 'open', 'rangeSelecting', 'disabled'],
    layoutRules: [
      'Prefer inside filters and forms, not free-floating in dashboards.',
      'On mobile it must open in a modal, not a popover.',
    ],
    designTokens: [
      {
        family: 'spacing',
        path: '3',
        cssVar: '--ds-space-3',
        role: 'Gap between calendar regions',
      },
      {
        family: 'semantic.color',
        path: 'border.default',
        cssVar: '--ds-color-border-default',
        role: 'Divider stroke',
      },
    ],
  },
  {
    id: 'vm.filterBar',
    displayName: 'FilterBar',
    importPath: '@/components/common/FilterBar/FilterBar',
    namedExport: 'FilterBar',
    category: 'form',
    status: 'ready',
    description:
      'VentaMas filter orchestration component for list screens, with responsive drawer and overflow collapse.',
    sourcePath: 'src/components/common/FilterBar/FilterBar.tsx',
    tags: ['filter', 'toolbar', 'search', 'list'],
    props: [
      {
        name: 'items',
        kind: 'array',
        description: 'Declarative filter definitions.',
        required: true,
      },
      {
        name: 'labels',
        kind: 'object',
        description: 'Optional UI labels for responsive affordances.',
      },
      {
        name: 'breakpoints',
        kind: 'object',
        description: 'Viewport thresholds for responsive behavior.',
      },
      {
        name: 'drawerProps',
        kind: 'object',
        description: 'Pass-through configuration for the mobile drawer.',
      },
      {
        name: 'buttonProps',
        kind: 'object',
        description: 'Pass-through configuration for trigger buttons.',
      },
    ],
    states: ['default', 'collapsed', 'mobileDrawerOpen', 'hasActiveFilters'],
    layoutRules: [
      'Use one FilterBar per list screen.',
      'Place above the primary table or result list.',
      'Avoid nesting inside cards with duplicated actions.',
    ],
    examples: [
      'Entity list screens with search, status, date range and advanced filters.',
    ],
    antiExamples: [
      'Do not use as a general-purpose form builder for settings pages.',
    ],
    designTokens: [
      {
        family: 'spacing',
        path: '4',
        cssVar: '--ds-space-4',
        role: 'Toolbar spacing',
      },
      {
        family: 'semantic.color',
        path: 'bg.surface',
        cssVar: '--ds-color-bg-surface',
        role: 'Toolbar background',
      },
    ],
  },
  {
    id: 'vm.advancedTable',
    displayName: 'AdvancedTable',
    importPath: '@/components/ui/AdvancedTable/AdvancedTable',
    namedExport: 'AdvancedTable',
    category: 'display',
    status: 'ready',
    description:
      'VentaMas table abstraction with sorting, filtering, pagination, optional virtualization and dense operational layout.',
    sourcePath: 'src/components/ui/AdvancedTable/AdvancedTable.tsx',
    tags: ['table', 'advanced', 'virtualization', 'list'],
    props: [
      {
        name: 'columns',
        kind: 'array',
        description: 'Column configuration.',
        required: true,
      },
      {
        name: 'data',
        kind: 'array',
        description: 'Rendered rows.',
        required: true,
      },
      {
        name: 'searchTerm',
        kind: 'string',
        description: 'Controlled search term, usually sourced from MenuApp.',
      },
      {
        name: 'filterConfig',
        kind: 'array',
        description: 'Filter metadata for built-in filter UI.',
      },
      {
        name: 'enableVirtualization',
        kind: 'boolean',
        description: 'Enables virtualized body rendering.',
      },
      {
        name: 'showPagination',
        kind: 'boolean',
        description: 'Controls footer pagination visibility.',
      },
    ],
    states: ['loading', 'empty', 'sorted', 'filtered', 'virtualized'],
    layoutRules: [
      'Its immediate parent must provide flex: 1 1 auto, min-height: 0 and overflow: hidden.',
      'Use in list pages that need richer UX than plain Ant Table.',
      'Prefer pairing with MenuApp and FilterBar in dashboard flows.',
    ],
    antiExamples: [
      'Do not mount directly under a fragment without a flex container.',
      'Do not wrap with extra containers that break the flex-height chain.',
    ],
  },
  {
    id: 'vm.modal',
    displayName: 'Modal',
    importPath: '@/components/common/Modal/Modal',
    namedExport: 'Modal',
    category: 'overlay',
    status: 'ready',
    description:
      'VentaMas modal wrapper around Ant Modal with viewport-aware body and footer behavior.',
    sourcePath: 'src/components/common/Modal/Modal.tsx',
    tags: ['modal', 'overlay', 'dialog'],
    props: [
      {
        name: 'open',
        kind: 'boolean',
        description: 'Visibility flag.',
        required: true,
      },
      {
        name: 'title',
        kind: 'node',
        description: 'Modal title content.',
      },
      {
        name: 'footer',
        kind: 'node',
        description: 'Footer actions. Empty arrays are normalized away.',
      },
      {
        name: 'styles',
        kind: 'object',
        description: 'Scoped style overrides for modal regions.',
      },
      {
        name: 'children',
        kind: 'node',
        description: 'Dialog content.',
        required: true,
      },
    ],
    states: ['closed', 'open', 'scrollingBody'],
    layoutRules: [
      'Use for focused tasks, not page-level navigation.',
      'The body should own scrolling instead of the viewport when content is long.',
    ],
    designTokens: [
      {
        family: 'semantic.color',
        path: 'overlay.mask',
        cssVar: '--ds-color-overlay-mask',
        role: 'Backdrop',
      },
      {
        family: 'radius',
        path: 'xl',
        cssVar: '--ds-radius-xl',
        role: 'Dialog radius',
      },
    ],
  },
  {
    id: 'vm.menuApp',
    displayName: 'MenuApp',
    importPath: '@/modules/navigation/components/MenuApp/MenuApp',
    namedExport: 'MenuApp',
    category: 'navigation',
    status: 'ready',
    description:
      'Dashboard page toolbar that registers into the layout when used inside DashboardLayout and renders inline otherwise.',
    sourcePath: 'src/modules/navigation/components/MenuApp/MenuApp.tsx',
    tags: ['menu', 'toolbar', 'search', 'navigation'],
    props: [
      {
        name: 'sectionName',
        kind: 'string',
        description: 'Section label shown in the toolbar.',
      },
      {
        name: 'sectionNameIcon',
        kind: 'node',
        description: 'Optional leading icon. Use Font Awesome icons.',
      },
      {
        name: 'searchData',
        kind: 'string',
        description: 'Controlled search value.',
      },
      {
        name: 'setSearchData',
        kind: 'callback',
        description: 'Controlled search setter. Its presence enables search UI.',
      },
      {
        name: 'displayName',
        kind: 'string',
        description: 'Entity name used in search placeholders.',
      },
      {
        name: 'showBackButton',
        kind: 'boolean',
        description: 'Shows back affordance.',
      },
      {
        name: 'showNotificationButton',
        kind: 'boolean',
        description: 'Shows notification affordance.',
      },
      {
        name: 'forceRender',
        kind: 'boolean',
        description: 'Forces inline rendering outside dashboard context rules.',
      },
    ],
    states: ['registered', 'inline', 'searchEnabled', 'menuOpen'],
    layoutRules: [
      'Inside DashboardLayout it should be placed in page JSX for config registration, but it renders above content via context.',
      'Use controlled search props when the page exposes a search term.',
      'Toolbar icons should come from Font Awesome, not ad hoc SVG sources.',
    ],
    examples: [
      'PageLayout + MenuApp + FilterBar + AdvancedTable is the standard list-screen composition.',
    ],
  },
  {
    id: 'vm.modalShell',
    displayName: 'ModalShell',
    importPath: '@/components/common/Modal/ModalShell',
    namedExport: 'ModalShell',
    category: 'overlay',
    status: 'ready',
    description:
      'Higher-level modal composition with a padded body and explicit footer contract.',
    sourcePath: 'src/components/common/Modal/ModalShell.tsx',
    tags: ['modal', 'shell', 'overlay'],
    props: [
      {
        name: 'open',
        kind: 'boolean',
        description: 'Visibility flag.',
        required: true,
      },
      {
        name: 'footer',
        kind: 'node',
        description: 'Required footer action region.',
        required: true,
      },
      {
        name: 'children',
        kind: 'node',
        description: 'Dialog body.',
        required: true,
      },
    ],
    states: ['closed', 'open'],
    layoutRules: [
      'Prefer for modal flows that always need bottom actions.',
    ],
    designTokens: [
      {
        family: 'spacing',
        path: '4',
        cssVar: '--ds-space-4',
        role: 'Body padding',
      },
    ],
  },
  {
    id: 'vm.searchBar',
    displayName: 'SearchBar',
    importPath: '@/components/common/SearchBar/Container',
    namedExport: 'SearchBar',
    category: 'layout',
    status: 'planned',
    description:
      'Placeholder container. It exists in code but still lacks a real reusable contract.',
    sourcePath: 'src/components/common/SearchBar/Container.tsx',
    tags: ['search', 'placeholder'],
    props: [],
    antiExamples: [
      'Do not use directly for new screens until a real implementation exists.',
    ],
  },
] as const satisfies readonly ComponentContract[];
