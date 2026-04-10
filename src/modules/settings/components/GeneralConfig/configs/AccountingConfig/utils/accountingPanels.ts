import ROUTES_NAME from '@/router/routes/routesName';

export type AccountingPanelKey =
  | 'chart-of-accounts'
  | 'posting-profiles'
  | 'bank-accounts'
  | 'exchange-rates';

export interface AccountingPanelItem {
  key: AccountingPanelKey;
  label: string;
  description: string;
  route: string;
}

const {
  GENERAL_CONFIG_ACCOUNTING,
  GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  GENERAL_CONFIG_ACCOUNTING_BANK_ACCOUNTS,
  GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
  GENERAL_CONFIG_EXCHANGE_RATES,
} = ROUTES_NAME.SETTING_TERM;
const { TREASURY_BANK_ACCOUNTS } = ROUTES_NAME.TREASURY_TERM;

export const DEFAULT_ACCOUNTING_PANEL_KEY: AccountingPanelKey =
  'chart-of-accounts';

export const ACCOUNTING_PANEL_ITEMS: AccountingPanelItem[] = [
  {
    key: 'chart-of-accounts',
    label: 'Catálogo de cuentas',
    description: 'Estructura, jerarquía y cuentas posteables.',
    route: GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  },
  {
    key: 'posting-profiles',
    label: 'Perfiles contables',
    description: 'Cobertura por evento y reglas.',
    route: GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
  },
  {
    key: 'bank-accounts',
    label: 'Cuentas bancarias',
    description: 'Cuentas activas y resolución por módulo.',
    route: GENERAL_CONFIG_ACCOUNTING_BANK_ACCOUNTS,
  },
  {
    key: 'exchange-rates',
    label: 'Tipos de cambio',
    description: 'Consulta y ajusta las tasas activas frente a la referencia del mercado.',
    route: GENERAL_CONFIG_EXCHANGE_RATES,
  },
];

export const getAccountingPanelItem = (
  key: AccountingPanelKey,
): AccountingPanelItem =>
  ACCOUNTING_PANEL_ITEMS.find((item) => item.key === key) ??
  ACCOUNTING_PANEL_ITEMS[0];

export const resolveAccountingPanelKey = (
  pathname: string,
): AccountingPanelKey => {
  if (pathname.startsWith(TREASURY_BANK_ACCOUNTS)) {
    return 'bank-accounts';
  }

  if (pathname.startsWith(GENERAL_CONFIG_EXCHANGE_RATES)) {
    return 'exchange-rates';
  }

  if (
    pathname === GENERAL_CONFIG_ACCOUNTING ||
    pathname === `${GENERAL_CONFIG_ACCOUNTING}/`
  ) {
    return DEFAULT_ACCOUNTING_PANEL_KEY;
  }

  const matchedItem = ACCOUNTING_PANEL_ITEMS.find((item) =>
    pathname.startsWith(item.route),
  );

  return matchedItem?.key ?? DEFAULT_ACCOUNTING_PANEL_KEY;
};
