import type {
  AccountingPostingProfile,
  BankAccount,
  ChartOfAccount,
} from '@/types/accounting';
import { toMillis } from '@/utils/firebase/toTimestamp';
import type { AccountingSettingsHistoryEntry } from './accountingConfig';

export type AccountingAuditScope =
  | 'settings'
  | 'bank_account'
  | 'chart_of_account'
  | 'posting_profile';

export type AccountingAuditChangeType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'seeded';

export interface AccountingAuditEntry {
  id: string;
  businessId: string;
  scope: AccountingAuditScope;
  entityId: string;
  entityLabel: string;
  changeType: AccountingAuditChangeType;
  changedAt: unknown;
  changedBy: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface AccountingAuditComparisonRow {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

interface BuildAccountingAuditEntryArgs {
  businessId: string;
  scope: AccountingAuditScope;
  entityId: string;
  historyId: string;
  entityLabel?: string | null;
  changeType?: AccountingAuditChangeType | null;
  changedAt: unknown;
  changedBy?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

interface AuditFieldDefinition {
  key: string;
  label: string;
  read: (value: Record<string, unknown>) => string;
}

const EMPTY_VALUE_LABEL = '—';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeAuditChangeType = (
  value: unknown,
): AccountingAuditChangeType => {
  switch (value) {
    case 'created':
    case 'status_changed':
    case 'seeded':
      return value;
    default:
      return 'updated';
  }
};

const formatScalar = (value: unknown): string => {
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : EMPTY_VALUE_LABEL;
  }

  const stringValue = toCleanString(value);
  if (stringValue) {
    return stringValue;
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatScalar(item))
      .filter((item) => item !== EMPTY_VALUE_LABEL);

    return items.length ? items.join(', ') : EMPTY_VALUE_LABEL;
  }

  return EMPTY_VALUE_LABEL;
};

const formatDateValue = (value: unknown): string => {
  const millis = toMillis(value as never);
  if (millis == null) {
    return EMPTY_VALUE_LABEL;
  }

  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
  }).format(new Date(millis));
};

const formatRatesByCurrency = (value: unknown): string => {
  const record = asRecord(value);
  const parts = Object.entries(record)
    .map(([currency, nestedValue]) => {
      const nestedRecord = asRecord(nestedValue);
      const buyRate = toFiniteNumber(nestedRecord.buyRate);
      const sellRate = toFiniteNumber(nestedRecord.sellRate);
      const rates = [
        buyRate != null ? `C ${buyRate}` : null,
        sellRate != null ? `V ${sellRate}` : null,
      ].filter(Boolean);

      return rates.length ? `${currency}: ${rates.join(' / ')}` : null;
    })
    .filter((entry): entry is string => Boolean(entry));

  return parts.length ? parts.join(' | ') : EMPTY_VALUE_LABEL;
};

const formatBankPaymentPolicy = (value: unknown): string => {
  const record = asRecord(value);
  const defaultBankAccountId = toCleanString(record.defaultBankAccountId);
  const moduleOverrides = asRecord(record.moduleOverrides);
  const enabledOverrides = Object.entries(moduleOverrides)
    .map(([moduleKey, overrideValue]) => {
      const overrideRecord = asRecord(overrideValue);
      if (overrideRecord.enabled !== true) {
        return null;
      }

      return `${moduleKey}: ${toCleanString(overrideRecord.bankAccountId) ?? 'sin cuenta'}`;
    })
    .filter((entry): entry is string => Boolean(entry));

  const parts = [
    defaultBankAccountId ? `Predeterminada: ${defaultBankAccountId}` : null,
    enabledOverrides.length ? `Overrides: ${enabledOverrides.join(', ')}` : null,
  ].filter((entry): entry is string => Boolean(entry));

  return parts.length ? parts.join(' | ') : EMPTY_VALUE_LABEL;
};

const formatPostingConditions = (value: unknown): string => {
  const record = asRecord(value);
  const parts = [
    toCleanString(record.paymentTerm),
    toCleanString(record.settlementKind),
    toCleanString(record.taxTreatment),
  ].filter((entry): entry is string => Boolean(entry) && entry !== 'any');

  return parts.length ? parts.join(' · ') : EMPTY_VALUE_LABEL;
};

const formatPostingLinesSummary = (value: unknown): string => {
  if (!Array.isArray(value) || !value.length) {
    return EMPTY_VALUE_LABEL;
  }

  return `${value.length} lineas`;
};

const getSettingsFieldDefinitions = (): AuditFieldDefinition[] => [
  {
    key: 'generalAccountingEnabled',
    label: 'Contabilidad general',
    read: (value) => formatScalar(value.generalAccountingEnabled),
  },
  {
    key: 'functionalCurrency',
    label: 'Moneda base',
    read: (value) => formatScalar(value.functionalCurrency),
  },
  {
    key: 'documentCurrencies',
    label: 'Monedas activas',
    read: (value) => formatScalar(value.documentCurrencies),
  },
  {
    key: 'manualRatesByCurrency',
    label: 'Tasas manuales',
    read: (value) => formatRatesByCurrency(value.manualRatesByCurrency),
  },
  {
    key: 'bankAccountsEnabled',
    label: 'Cuentas bancarias activas',
    read: (value) => formatScalar(value.bankAccountsEnabled),
  },
  {
    key: 'bankPaymentPolicy',
    label: 'Politica bancaria',
    read: (value) => formatBankPaymentPolicy(value.bankPaymentPolicy),
  },
];

const getBankAccountFieldDefinitions = (): AuditFieldDefinition[] => [
  { key: 'name', label: 'Nombre', read: (value) => formatScalar(value.name) },
  {
    key: 'institutionName',
    label: 'Banco',
    read: (value) => formatScalar(value.institutionName),
  },
  {
    key: 'currency',
    label: 'Moneda',
    read: (value) => formatScalar(value.currency),
  },
  { key: 'type', label: 'Tipo', read: (value) => formatScalar(value.type) },
  {
    key: 'accountNumberLast4',
    label: 'Ultimos 4',
    read: (value) => formatScalar(value.accountNumberLast4),
  },
  {
    key: 'openingBalance',
    label: 'Balance inicial',
    read: (value) => formatScalar(value.openingBalance),
  },
  {
    key: 'openingBalanceDate',
    label: 'Fecha inicial',
    read: (value) => formatDateValue(value.openingBalanceDate),
  },
  {
    key: 'status',
    label: 'Estado',
    read: (value) => formatScalar(value.status),
  },
  { key: 'notes', label: 'Notas', read: (value) => formatScalar(value.notes) },
];

const getChartOfAccountFieldDefinitions = (): AuditFieldDefinition[] => [
  { key: 'code', label: 'Codigo', read: (value) => formatScalar(value.code) },
  { key: 'name', label: 'Nombre', read: (value) => formatScalar(value.name) },
  { key: 'type', label: 'Tipo', read: (value) => formatScalar(value.type) },
  {
    key: 'subtype',
    label: 'Subtipo',
    read: (value) => formatScalar(value.subtype),
  },
  {
    key: 'parentId',
    label: 'Cuenta padre',
    read: (value) => formatScalar(value.parentId),
  },
  {
    key: 'postingAllowed',
    label: 'Permite asientos',
    read: (value) => formatScalar(value.postingAllowed),
  },
  {
    key: 'status',
    label: 'Estado',
    read: (value) => formatScalar(value.status),
  },
  {
    key: 'normalSide',
    label: 'Naturaleza',
    read: (value) => formatScalar(value.normalSide),
  },
  {
    key: 'currencyMode',
    label: 'Modo moneda',
    read: (value) => formatScalar(value.currencyMode),
  },
  {
    key: 'systemKey',
    label: 'Clave sistema',
    read: (value) => formatScalar(value.systemKey),
  },
];

const getPostingProfileFieldDefinitions = (): AuditFieldDefinition[] => [
  { key: 'name', label: 'Nombre', read: (value) => formatScalar(value.name) },
  {
    key: 'eventType',
    label: 'Evento',
    read: (value) => formatScalar(value.eventType),
  },
  {
    key: 'moduleKey',
    label: 'Modulo',
    read: (value) => formatScalar(value.moduleKey),
  },
  {
    key: 'priority',
    label: 'Prioridad',
    read: (value) => formatScalar(value.priority),
  },
  {
    key: 'status',
    label: 'Estado',
    read: (value) => formatScalar(value.status),
  },
  {
    key: 'conditions',
    label: 'Condiciones',
    read: (value) => formatPostingConditions(value.conditions),
  },
  {
    key: 'linesTemplate',
    label: 'Lineas',
    read: (value) => formatPostingLinesSummary(value.linesTemplate),
  },
];

const getAuditFieldDefinitions = (
  scope: AccountingAuditScope,
): AuditFieldDefinition[] => {
  switch (scope) {
    case 'bank_account':
      return getBankAccountFieldDefinitions();
    case 'chart_of_account':
      return getChartOfAccountFieldDefinitions();
    case 'posting_profile':
      return getPostingProfileFieldDefinitions();
    default:
      return getSettingsFieldDefinitions();
  }
};

const buildEntityLabelFromSnapshots = ({
  scope,
  entityLabel,
  before,
  after,
}: Pick<
  BuildAccountingAuditEntryArgs,
  'scope' | 'entityLabel' | 'before' | 'after'
>): string => {
  const normalizedEntityLabel = toCleanString(entityLabel);
  if (normalizedEntityLabel) {
    return normalizedEntityLabel;
  }

  const source = after ?? before ?? {};

  switch (scope) {
    case 'bank_account': {
      const bank = toCleanString(source.name);
      const institutionName = toCleanString(source.institutionName);
      if (institutionName && bank) {
        return `${institutionName} · ${bank}`;
      }
      return bank ?? 'Cuenta bancaria';
    }
    case 'chart_of_account': {
      const code = toCleanString(source.code);
      const name = toCleanString(source.name);
      if (code && name) {
        return `${code} · ${name}`;
      }
      return name ?? 'Cuenta contable';
    }
    case 'posting_profile':
      return toCleanString(source.name) ?? 'Perfil contable';
    default:
      return 'Configuracion contable';
  }
};

const byNewestChangedAt = (left: AccountingAuditEntry, right: AccountingAuditEntry) =>
  (toMillis(right.changedAt as never) ?? 0) - (toMillis(left.changedAt as never) ?? 0);

export const buildAccountingAuditEntryId = (
  scope: AccountingAuditScope,
  historyId: string,
): string => `${scope}:${historyId}`;

export const buildAccountingAuditEntryRecord = ({
  businessId,
  scope,
  entityId,
  historyId,
  entityLabel,
  changeType,
  changedAt,
  changedBy,
  before,
  after,
}: BuildAccountingAuditEntryArgs): AccountingAuditEntry => ({
  id: buildAccountingAuditEntryId(scope, historyId),
  businessId,
  scope,
  entityId,
  entityLabel: buildEntityLabelFromSnapshots({
    scope,
    entityLabel,
    before: before ?? null,
    after: after ?? null,
  }),
  changeType: normalizeAuditChangeType(changeType),
  changedAt,
  changedBy: toCleanString(changedBy) ?? null,
  before: before ?? null,
  after: after ?? null,
});

export const normalizeAccountingAuditEntry = (
  value: unknown,
): AccountingAuditEntry | null => {
  const record = asRecord(value);
  const id = toCleanString(record.id);
  const businessId = toCleanString(record.businessId);
  const entityId = toCleanString(record.entityId);
  const scope = toCleanString(record.scope) as AccountingAuditScope | null;

  if (!id || !businessId || !entityId || !scope) {
    return null;
  }

  if (
    scope !== 'settings' &&
    scope !== 'bank_account' &&
    scope !== 'chart_of_account' &&
    scope !== 'posting_profile'
  ) {
    return null;
  }

  return {
    id,
    businessId,
    scope,
    entityId,
    entityLabel:
      toCleanString(record.entityLabel) ??
      buildEntityLabelFromSnapshots({
        scope,
        before: asRecord(record.before),
        after: asRecord(record.after),
      }),
    changeType: normalizeAuditChangeType(record.changeType),
    changedAt: record.changedAt ?? null,
    changedBy: toCleanString(record.changedBy) ?? null,
    before: record.before ? asRecord(record.before) : null,
    after: record.after ? asRecord(record.after) : null,
  };
};

export const buildLegacySettingsAuditEntries = ({
  businessId,
  entries,
}: {
  businessId: string;
  entries: AccountingSettingsHistoryEntry[];
}): AccountingAuditEntry[] =>
  entries
    .map((entry, index) =>
      buildAccountingAuditEntryRecord({
        businessId,
        scope: 'settings',
        entityId: 'accounting_settings',
        historyId: entry.id,
        changeType: 'updated',
        changedAt: entry.changedAt,
        changedBy: entry.changedBy,
        before:
          index + 1 < entries.length
            ? (entries[index + 1] as unknown as Record<string, unknown>)
            : null,
        after: entry as unknown as Record<string, unknown>,
      }),
    );

export const mergeAccountingAuditEntries = (
  ...groups: AccountingAuditEntry[][]
): AccountingAuditEntry[] => {
  const deduped = new Map<string, AccountingAuditEntry>();

  groups.forEach((group) => {
    group.forEach((entry) => {
      if (!deduped.has(entry.id)) {
        deduped.set(entry.id, entry);
      }
    });
  });

  return [...deduped.values()].sort(byNewestChangedAt);
};

export const buildAccountingAuditComparisonRows = (
  entry: AccountingAuditEntry,
): AccountingAuditComparisonRow[] => {
  const before = asRecord(entry.before);
  const after = asRecord(entry.after);

  return getAuditFieldDefinitions(entry.scope)
    .map((field) => {
      const beforeValue = field.read(before);
      const afterValue = field.read(after);

      return {
        key: field.key,
        label: field.label,
        before: beforeValue,
        after: afterValue,
        changed: beforeValue !== afterValue,
      };
    })
    .filter(
      (row) =>
        row.changed ||
        row.before !== EMPTY_VALUE_LABEL ||
        row.after !== EMPTY_VALUE_LABEL,
    );
};

export const ACCOUNTING_AUDIT_SCOPE_LABELS: Record<
  AccountingAuditScope,
  string
> = {
  settings: 'Settings',
  bank_account: 'Cuentas bancarias',
  chart_of_account: 'Catalogo',
  posting_profile: 'Perfiles',
};

export const ACCOUNTING_AUDIT_CHANGE_TYPE_LABELS: Record<
  AccountingAuditChangeType,
  string
> = {
  created: 'Creacion',
  updated: 'Actualizacion',
  status_changed: 'Cambio de estado',
  seeded: 'Semilla',
};

export const buildLegacyAuditFetchCandidates = ({
  bankAccounts,
  chartOfAccounts,
  postingProfiles,
}: {
  bankAccounts: BankAccount[];
  chartOfAccounts: ChartOfAccount[];
  postingProfiles: AccountingPostingProfile[];
}) => {
  const candidates = [
    ...bankAccounts
      .filter((account) => account.lastChangeId)
      .map((account) => ({
        scope: 'bank_account' as const,
        collectionName: 'bankAccounts',
        entityId: account.id,
        historyId: account.lastChangeId as string,
        entityLabel: account.name,
        lastChangedAt: account.lastChangedAt,
      })),
    ...chartOfAccounts
      .filter((account) => account.lastChangeId)
      .map((account) => ({
        scope: 'chart_of_account' as const,
        collectionName: 'chartOfAccounts',
        entityId: account.id,
        historyId: account.lastChangeId as string,
        entityLabel: `${account.code} · ${account.name}`,
        lastChangedAt: account.lastChangedAt,
      })),
    ...postingProfiles
      .filter((profile) => profile.lastChangeId)
      .map((profile) => ({
        scope: 'posting_profile' as const,
        collectionName: 'accountingPostingProfiles',
        entityId: profile.id,
        historyId: profile.lastChangeId as string,
        entityLabel: profile.name,
        lastChangedAt: profile.lastChangedAt,
      })),
  ];

  return candidates
    .sort(
      (left, right) =>
        (toMillis(right.lastChangedAt as never) ?? 0) -
        (toMillis(left.lastChangedAt as never) ?? 0),
    )
    .slice(0, 24);
};
