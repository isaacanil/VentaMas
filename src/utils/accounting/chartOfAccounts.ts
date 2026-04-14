import type {
  ChartOfAccount,
  ChartOfAccountCurrencyMode,
  ChartOfAccountNormalSide,
  ChartOfAccountStatus,
  ChartOfAccountType,
} from '@/types/accounting';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const normalizeChartOfAccountType = (
  value: unknown,
  fallback: ChartOfAccountType = 'asset',
): ChartOfAccountType => {
  switch (value) {
    case 'asset':
    case 'liability':
    case 'equity':
    case 'income':
    case 'expense':
      return value;
    default:
      return fallback;
  }
};

export const normalizeChartOfAccountStatus = (
  value: unknown,
): ChartOfAccountStatus => (value === 'inactive' ? 'inactive' : 'active');

export const normalizeChartOfAccountNormalSide = (
  value: unknown,
  fallback: ChartOfAccountNormalSide = 'debit',
): ChartOfAccountNormalSide => (value === 'credit' ? 'credit' : fallback);

export const normalizeChartOfAccountCurrencyMode = (
  value: unknown,
): ChartOfAccountCurrencyMode =>
  value === 'multi_currency_reference'
    ? 'multi_currency_reference'
    : 'functional_only';

export const deriveNormalSideForChartOfAccountType = (
  type: ChartOfAccountType,
): ChartOfAccountNormalSide =>
  type === 'asset' || type === 'expense' ? 'debit' : 'credit';

export interface ChartOfAccountDraft {
  code: string;
  name: string;
  type: ChartOfAccountType;
  subtype?: string | null;
  parentId?: string | null;
  postingAllowed?: boolean;
  normalSide?: ChartOfAccountNormalSide;
  currencyMode?: ChartOfAccountCurrencyMode;
  systemKey?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ChartOfAccountTemplate extends ChartOfAccountDraft {
  code: string;
  name: string;
  type: ChartOfAccountType;
  postingAllowed: boolean;
  normalSide: ChartOfAccountNormalSide;
  currencyMode: ChartOfAccountCurrencyMode;
  parentCode?: string | null;
}

export const normalizeChartOfAccountDraft = (
  value: Partial<ChartOfAccountDraft> | null | undefined,
): ChartOfAccountDraft => {
  const record = asRecord(value);
  const type = normalizeChartOfAccountType(record.type, 'asset');

  return {
    code: toCleanString(record.code) ?? '',
    name: toCleanString(record.name) ?? '',
    type,
    subtype: toCleanString(record.subtype),
    parentId: toCleanString(record.parentId),
    postingAllowed: record.postingAllowed !== false,
    normalSide: normalizeChartOfAccountNormalSide(
      record.normalSide,
      deriveNormalSideForChartOfAccountType(type),
    ),
    currencyMode: normalizeChartOfAccountCurrencyMode(record.currencyMode),
    systemKey: toCleanString(record.systemKey),
    metadata: asRecord(record.metadata),
  };
};

export const normalizeChartOfAccountRecord = (
  id: string,
  businessId: string,
  value: unknown,
): ChartOfAccount => {
  const record = asRecord(value);
  const type = normalizeChartOfAccountType(record.type, 'asset');

  return {
    id,
    businessId,
    code: toCleanString(record.code) ?? id,
    name: toCleanString(record.name) ?? 'Cuenta contable',
    type,
    subtype: toCleanString(record.subtype),
    parentId: toCleanString(record.parentId),
    postingAllowed: record.postingAllowed !== false,
    status: normalizeChartOfAccountStatus(record.status),
    normalSide: normalizeChartOfAccountNormalSide(
      record.normalSide,
      deriveNormalSideForChartOfAccountType(type),
    ),
    currencyMode: normalizeChartOfAccountCurrencyMode(record.currencyMode),
    systemKey: toCleanString(record.systemKey),
    createdAt: (record.createdAt as ChartOfAccount['createdAt']) ?? null,
    updatedAt: (record.updatedAt as ChartOfAccount['updatedAt']) ?? null,
    createdBy: toCleanString(record.createdBy),
    updatedBy: toCleanString(record.updatedBy),
    lastChangeId: toCleanString(record.lastChangeId),
    lastChangedAt:
      (record.lastChangedAt as ChartOfAccount['lastChangedAt']) ?? null,
    metadata: asRecord(record.metadata),
  };
};

export const buildChartOfAccountLabel = (account: ChartOfAccount): string =>
  `${account.code} · ${account.name}`;

export const collectChartOfAccountDescendantIds = (
  accounts: ChartOfAccount[],
  rootId: string,
): Set<string> => {
  const childrenByParent = accounts.reduce<Map<string, string[]>>(
    (accumulator, account) => {
      if (!account.parentId) {
        return accumulator;
      }

      const current = accumulator.get(account.parentId) ?? [];
      accumulator.set(account.parentId, [...current, account.id]);
      return accumulator;
    },
    new Map(),
  );

  const descendants = new Set<string>();
  const queue = [...(childrenByParent.get(rootId) ?? [])];

  while (queue.length) {
    const currentId = queue.shift();
    if (!currentId || descendants.has(currentId)) {
      continue;
    }

    descendants.add(currentId);
    queue.push(...(childrenByParent.get(currentId) ?? []));
  }

  return descendants;
};

export const sortChartOfAccountsForDisplay = (
  accounts: ChartOfAccount[],
): ChartOfAccount[] => {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const childrenByParent = accounts.reduce<Map<string, ChartOfAccount[]>>(
    (accumulator, account) => {
      if (!account.parentId || !accountsById.has(account.parentId)) {
        return accumulator;
      }

      const currentChildren = accumulator.get(account.parentId) ?? [];
      accumulator.set(account.parentId, [...currentChildren, account]);
      return accumulator;
    },
    new Map(),
  );

  const sortAccounts = (entries: ChartOfAccount[]) =>
    [...entries].sort((left, right) => left.code.localeCompare(right.code));

  const flattenBranch = (account: ChartOfAccount): ChartOfAccount[] => [
    account,
    ...sortAccounts(childrenByParent.get(account.id) ?? []).flatMap(flattenBranch),
  ];

  const rootAccounts = sortAccounts(
    accounts.filter(
      (account) => !account.parentId || !accountsById.has(account.parentId),
    ),
  );

  return rootAccounts.flatMap(flattenBranch);
};

export const CHART_OF_ACCOUNT_TYPE_LABELS: Record<ChartOfAccountType, string> =
  {
    asset: 'Activo',
    liability: 'Pasivo',
    equity: 'Patrimonio',
    income: 'Ingreso',
    expense: 'Gasto',
  };

export const CHART_OF_ACCOUNT_NORMAL_SIDE_LABELS: Record<
  ChartOfAccountNormalSide,
  string
> = {
  debit: 'Débito',
  credit: 'Crédito',
};

export const CHART_OF_ACCOUNT_CURRENCY_MODE_LABELS: Record<
  ChartOfAccountCurrencyMode,
  string
> = {
  functional_only: 'Solo moneda funcional',
  multi_currency_reference: 'Referencia multi-moneda',
};

export const DEFAULT_CHART_OF_ACCOUNTS_TEMPLATE: ChartOfAccountTemplate[] = [
  {
    code: '1000',
    name: 'Activos',
    type: 'asset',
    postingAllowed: false,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'assets_root',
  },
  {
    code: '1100',
    name: 'Caja general',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'cash',
    parentCode: '1000',
  },
  {
    code: '1110',
    name: 'Cuentas bancarias',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'multi_currency_reference',
    systemKey: 'bank',
    parentCode: '1000',
  },
  {
    code: '1120',
    name: 'Cuentas por cobrar',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'multi_currency_reference',
    systemKey: 'accounts_receivable',
    parentCode: '1000',
  },
  {
    code: '1125',
    name: 'Impuestos por recuperar',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'tax_receivable',
    parentCode: '1000',
  },
  {
    code: '1130',
    name: 'Inventario',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'inventory',
    parentCode: '1000',
  },
  {
    code: '1135',
    name: 'Activos fijos',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'fixed_assets',
    parentCode: '1000',
  },
  {
    code: '1138',
    name: 'Gastos pagados por anticipado',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'prepaid_expenses',
    parentCode: '1000',
  },
  {
    code: '1140',
    name: 'Saldo a favor de suplidores',
    type: 'asset',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'supplier_credits',
    parentCode: '1000',
  },
  {
    code: '2000',
    name: 'Pasivos',
    type: 'liability',
    postingAllowed: false,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'liabilities_root',
  },
  {
    code: '2100',
    name: 'Cuentas por pagar',
    type: 'liability',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'multi_currency_reference',
    systemKey: 'accounts_payable',
    parentCode: '2000',
  },
  {
    code: '2200',
    name: 'Impuestos por pagar',
    type: 'liability',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'tax_payable',
    parentCode: '2000',
  },
  {
    code: '2300',
    name: 'Créditos pendientes de clientes',
    type: 'liability',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'customer_credits',
    parentCode: '2000',
  },
  {
    code: '3000',
    name: 'Patrimonio',
    type: 'equity',
    postingAllowed: false,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'equity_root',
  },
  {
    code: '3100',
    name: 'Capital',
    type: 'equity',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'capital',
    parentCode: '3000',
  },
  {
    code: '3200',
    name: 'Resultados acumulados',
    type: 'equity',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'retained_earnings',
    parentCode: '3000',
  },
  {
    code: '4000',
    name: 'Ingresos',
    type: 'income',
    postingAllowed: false,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'income_root',
  },
  {
    code: '4100',
    name: 'Ventas',
    type: 'income',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'multi_currency_reference',
    systemKey: 'sales',
    parentCode: '4000',
  },
  {
    code: '4150',
    name: 'Ingresos por sobrante de caja',
    type: 'income',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'cash_over_short_income',
    parentCode: '4000',
  },
  {
    code: '4200',
    name: 'Ingresos por diferencia cambiaria',
    type: 'income',
    postingAllowed: true,
    normalSide: 'credit',
    currencyMode: 'functional_only',
    systemKey: 'fx_gain',
    parentCode: '4000',
  },
  {
    code: '5000',
    name: 'Costos y gastos',
    type: 'expense',
    postingAllowed: false,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'expense_root',
  },
  {
    code: '5100',
    name: 'Costo de ventas',
    type: 'expense',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'cost_of_sales',
    parentCode: '5000',
  },
  {
    code: '5200',
    name: 'Gastos operativos',
    type: 'expense',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'operating_expenses',
    parentCode: '5000',
  },
  {
    code: '5250',
    name: 'Pérdidas por faltante de caja',
    type: 'expense',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'cash_over_short_expense',
    parentCode: '5000',
  },
  {
    code: '5300',
    name: 'Gastos por diferencia cambiaria',
    type: 'expense',
    postingAllowed: true,
    normalSide: 'debit',
    currencyMode: 'functional_only',
    systemKey: 'fx_loss',
    parentCode: '5000',
  },
];
