import ROUTES_NAME from '@/router/routes/routesName';

import type { AccountingWorkspacePanelKey } from './accountingWorkspace';

export interface AccountingWorkspacePanelItem {
  description: string;
  key: AccountingWorkspacePanelKey;
  label: string;
  route: string;
}

const {
  ACCOUNTING_JOURNAL_BOOK,
  ACCOUNTING_GENERAL_LEDGER,
  ACCOUNTING_MANUAL_ENTRIES,
  ACCOUNTING_PERIOD_CLOSE,
  ACCOUNTING_REPORTS,
} = ROUTES_NAME.ACCOUNTING_TERM;

export const ACCOUNTING_WORKSPACE_PANELS: AccountingWorkspacePanelItem[] = [
  {
    key: 'journal-book',
    label: 'Libro diario',
    description: 'Historial de asientos y detalle por transaccion.',
    route: ACCOUNTING_JOURNAL_BOOK,
  },
  {
    key: 'general-ledger',
    label: 'Libro mayor',
    description: 'Mayor por cuenta con saldo corrido y filtro por periodo.',
    route: ACCOUNTING_GENERAL_LEDGER,
  },
  {
    key: 'manual-entries',
    label: 'Asientos manuales',
    description: 'Registro manual de ajustes y reclasificaciones.',
    route: ACCOUNTING_MANUAL_ENTRIES,
  },
  {
    key: 'financial-reports',
    label: 'Reportes',
    description: 'Balanza, resultado y balance general.',
    route: ACCOUNTING_REPORTS,
  },
  {
    key: 'period-close',
    label: 'Cierre de periodo',
    description: 'Bloqueo y control de meses cerrados.',
    route: ACCOUNTING_PERIOD_CLOSE,
  },
];

export const DEFAULT_ACCOUNTING_WORKSPACE_PANEL: AccountingWorkspacePanelKey =
  'journal-book';

export const getAccountingWorkspacePanel = (
  key: AccountingWorkspacePanelKey,
): AccountingWorkspacePanelItem =>
  ACCOUNTING_WORKSPACE_PANELS.find((panel) => panel.key === key) ??
  ACCOUNTING_WORKSPACE_PANELS[0];

export const resolveAccountingWorkspacePanelKey = (
  pathname: string,
): AccountingWorkspacePanelKey => {
  if (
    pathname.includes('/general-ledger') ||
    pathname.includes('/libro-mayor')
  ) {
    return 'general-ledger';
  }

  if (
    pathname.includes('/manual-entries') ||
    pathname.includes('/asientos-manuales')
  ) {
    return 'manual-entries';
  }

  if (pathname.includes('/reports') || pathname.includes('/reportes')) {
    return 'financial-reports';
  }

  if (
    pathname.includes('/period-close') ||
    pathname.includes('/cierre-periodo')
  ) {
    return 'period-close';
  }

  return 'journal-book';
};
