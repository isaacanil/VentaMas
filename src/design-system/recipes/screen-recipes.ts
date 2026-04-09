import type { ScreenRecipe } from '@/design-system/contracts/types';

export const screenRecipes = [
  {
    id: 'vm.list-management',
    displayName: 'List Management',
    description:
      'Operational list screen with filters, dense table, and modal-based secondary actions.',
    layout:
      'Dashboard page using PageLayout. MenuApp registers into the dashboard header, then the page stacks FilterBar and a primary results region backed by AdvancedTable or Ant Table.',
    tags: ['list', 'table', 'filters', 'erp'],
    requiredComponents: [
      'vm.pageLayout',
      'vm.menuApp',
      'vm.filterBar',
      'vm.advancedTable',
      'antd.button',
    ],
    optionalComponents: [
      'antd.table',
      'vm.modal',
      'vm.statusBadge',
      'vm.datePicker',
    ],
    forbiddenComponents: ['vm.searchBar'],
    states: ['loading', 'empty', 'hasResults', 'error'],
    compositionRules: [
      'Use PageLayout as the page root inside dashboard flows.',
      'MenuApp owns the toolbar and controlled search state.',
      'Filters live above the main table.',
      'The immediate AdvancedTable wrapper must preserve the flex-height chain.',
      'Primary row actions open a modal instead of navigating away when the task is short.',
      'Status cells should use a badge or text plus a Font Awesome icon, not raw color alone.',
    ],
    slots: [
      {
        key: 'pageChrome',
        description: 'Dashboard page shell and toolbar registration.',
        allowedComponents: ['vm.pageLayout', 'vm.menuApp'],
        required: true,
      },
      {
        key: 'headerActions',
        description: 'Primary page-level actions.',
        allowedComponents: ['antd.button'],
        maxItems: 3,
      },
      {
        key: 'filters',
        description: 'Declarative filter controls and advanced filters.',
        allowedComponents: ['vm.filterBar'],
        required: true,
        maxItems: 1,
      },
      {
        key: 'results',
        description: 'Primary dense result surface.',
        allowedComponents: ['vm.advancedTable', 'antd.table'],
        required: true,
        maxItems: 1,
      },
      {
        key: 'secondaryOverlay',
        description: 'Optional short task overlay.',
        allowedComponents: ['vm.modal'],
        maxItems: 1,
      },
    ],
    examplePlan: {
      id: 'vm.list-management.example',
      recipeId: 'vm.list-management',
      designSystemChecks: [
        'components-from-registry-only',
        'no-raw-colors',
        'spacing-uses-tokens-only',
        'z-index-uses-tokens-only',
      ],
      tree: [
        {
          componentId: 'vm.pageLayout',
          key: 'page-layout',
        },
        {
          componentId: 'vm.menuApp',
          key: 'page-menu',
          props: {
            sectionName: 'Registros',
            displayName: 'registros',
            searchData: '',
            setSearchData: 'setSearchTerm',
          },
        },
        {
          componentId: 'vm.filterBar',
          key: 'filters',
          props: {
            items: ['search', 'status', 'dateRange'],
          },
        },
        {
          componentId: 'antd.button',
          key: 'create-action',
          props: {
            type: 'primary',
            children: 'Nuevo registro',
          },
        },
        {
          componentId: 'vm.advancedTable',
          key: 'results',
          props: {
            searchTerm: 'searchTerm',
            showPagination: true,
          },
        },
        {
          componentId: 'vm.modal',
          key: 'quick-edit-modal',
          props: {
            open: false,
            title: 'Editar registro',
          },
          children: [
            {
              componentId: 'antd.input',
              key: 'modal-name-input',
              props: {
                placeholder: 'Nombre',
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'vm.settings-form',
    displayName: 'Settings Form',
    description:
      'Configuration screen with sectioned form groups and one primary save action.',
    layout:
      'Dashboard page using PageBody or PageShell, with MenuApp for section identity and grouped controlled inputs below it.',
    tags: ['settings', 'form', 'configuration'],
    requiredComponents: [
      'vm.pageBody',
      'vm.menuApp',
      'antd.input',
      'antd.select',
      'antd.switch',
      'antd.button',
    ],
    optionalComponents: ['vm.datePicker', 'vm.statusBadge'],
    states: ['loading', 'pristine', 'dirty', 'saving', 'error'],
    compositionRules: [
      'Use PageBody when a descendant section owns overflow; use PageShell if the entire page scrolls.',
      'MenuApp should provide section identity even when search is disabled.',
      'Use one primary save button for the page.',
      'Inputs should be grouped by section, not by control type.',
      'Badges can annotate state but must not replace helper text.',
    ],
    slots: [
      {
        key: 'identitySection',
        description: 'Basic configuration fields.',
        allowedComponents: ['antd.input', 'antd.select', 'antd.switch', 'vm.datePicker'],
        required: true,
      },
      {
        key: 'actions',
        description: 'Primary and secondary form actions.',
        allowedComponents: ['antd.button'],
        required: true,
        maxItems: 2,
      },
    ],
    examplePlan: {
      id: 'vm.settings-form.example',
      recipeId: 'vm.settings-form',
      designSystemChecks: [
        'components-from-registry-only',
        'no-raw-colors',
        'spacing-uses-tokens-only',
      ],
      tree: [
        {
          componentId: 'vm.pageBody',
          key: 'page-body',
        },
        {
          componentId: 'vm.menuApp',
          key: 'settings-menu',
          props: {
            sectionName: 'Configuración',
          },
        },
        {
          componentId: 'antd.input',
          key: 'company-name',
          props: {
            placeholder: 'Nombre comercial',
          },
        },
        {
          componentId: 'antd.select',
          key: 'default-currency',
          props: {
            placeholder: 'Moneda por defecto',
          },
        },
        {
          componentId: 'antd.switch',
          key: 'notifications-enabled',
          props: {
            checked: true,
            onChange: 'setNotificationsEnabled',
          },
        },
        {
          componentId: 'vm.datePicker',
          key: 'closing-date',
          props: {
            mode: 'single',
            placeholder: 'Fecha de cierre',
          },
        },
        {
          componentId: 'antd.button',
          key: 'save',
          props: {
            type: 'primary',
            children: 'Guardar cambios',
          },
        },
      ],
    },
  },
  {
    id: 'vm.modal-entity-editor',
    displayName: 'Modal Entity Editor',
    description:
      'Short edit flow in a modal shell with compact form content and explicit footer actions.',
    layout:
      'Single modal overlay with vertical body content and bottom action footer.',
    tags: ['modal', 'editor', 'quick-task'],
    requiredComponents: ['vm.modalShell', 'antd.input', 'antd.button'],
    optionalComponents: ['antd.select', 'vm.statusBadge'],
    states: ['closed', 'open', 'saving', 'error'],
    compositionRules: [
      'Use ModalShell when footer actions are mandatory.',
      'Avoid nested modals.',
      'The primary submit action should live in the footer, not inside the body.',
    ],
    slots: [
      {
        key: 'body',
        description: 'Compact form fields.',
        allowedComponents: ['antd.input', 'antd.select', 'vm.statusBadge'],
        required: true,
      },
      {
        key: 'footer',
        description: 'Dialog actions.',
        allowedComponents: ['antd.button'],
        required: true,
        maxItems: 2,
      },
    ],
    examplePlan: {
      id: 'vm.modal-entity-editor.example',
      recipeId: 'vm.modal-entity-editor',
      designSystemChecks: [
        'components-from-registry-only',
        'no-raw-colors',
        'spacing-uses-tokens-only',
      ],
      tree: [
        {
          componentId: 'vm.modalShell',
          key: 'entity-editor',
          props: {
            open: true,
            title: 'Editar entidad',
            footer: 'footer-slot',
          },
          children: [
            {
              componentId: 'antd.input',
              key: 'entity-name',
              props: {
                placeholder: 'Nombre',
              },
            },
            {
              componentId: 'antd.select',
              key: 'entity-status',
              props: {
                placeholder: 'Estado',
              },
            },
            {
              componentId: 'antd.button',
              key: 'save-action',
              props: {
                type: 'primary',
                children: 'Guardar',
              },
            },
          ],
        },
      ],
    },
  },
] as const satisfies readonly ScreenRecipe[];
