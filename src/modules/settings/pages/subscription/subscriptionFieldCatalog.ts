import { LIMIT_LABELS } from './subscription.constants';
import { ENTITLEMENT_LABELS } from './subscriptionEntitlements';
import type { UnknownRecord } from './subscription.types';
import { asRecord, toCleanString, toFiniteNumber } from './subscription.utils';

export type SubscriptionFieldSection = 'limits' | 'modules' | 'addons';
export type SubscriptionFieldValueType = 'number' | 'boolean';

export interface SubscriptionFieldDefinition {
  key: string;
  label: string;
  type: SubscriptionFieldValueType;
  order: number;
  isActive?: boolean;
  allowUnlimited?: boolean;
  description?: string;
}

interface SubscriptionFieldContractDefinition {
  key: string;
  type: SubscriptionFieldValueType;
  defaultLabel: string;
  defaultOrder: number;
  defaultIsActive?: boolean;
  defaultAllowUnlimited?: boolean;
  description?: string;
}

export interface SubscriptionFieldCatalog {
  limits: Record<string, SubscriptionFieldDefinition>;
  modules: Record<string, SubscriptionFieldDefinition>;
  addons: Record<string, SubscriptionFieldDefinition>;
}

type SubscriptionFieldContractCatalog = Record<
  SubscriptionFieldSection,
  Record<string, SubscriptionFieldContractDefinition>
>;

const createFieldContractDefinition = (
  key: string,
  label: string,
  type: SubscriptionFieldValueType,
  order: number,
  extra: Partial<SubscriptionFieldContractDefinition> = {},
): SubscriptionFieldContractDefinition => ({
  key,
  type,
  defaultLabel: label,
  defaultOrder: order,
  ...extra,
});

export const SUBSCRIPTION_FIELD_CONTRACT: SubscriptionFieldContractCatalog = {
  limits: {
    maxBusinesses: createFieldContractDefinition(
      'maxBusinesses',
      LIMIT_LABELS.maxBusinesses,
      'number',
      10,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
    maxUsers: createFieldContractDefinition(
      'maxUsers',
      LIMIT_LABELS.maxUsers,
      'number',
      20,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
    maxProducts: createFieldContractDefinition(
      'maxProducts',
      LIMIT_LABELS.maxProducts,
      'number',
      30,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
    maxMonthlyInvoices: createFieldContractDefinition(
      'maxMonthlyInvoices',
      LIMIT_LABELS.maxMonthlyInvoices,
      'number',
      40,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
    maxClients: createFieldContractDefinition(
      'maxClients',
      LIMIT_LABELS.maxClients,
      'number',
      50,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
    maxSuppliers: createFieldContractDefinition(
      'maxSuppliers',
      LIMIT_LABELS.maxSuppliers,
      'number',
      60,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
    maxWarehouses: createFieldContractDefinition(
      'maxWarehouses',
      LIMIT_LABELS.maxWarehouses,
      'number',
      70,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
    maxOpenCashRegisters: createFieldContractDefinition(
      'maxOpenCashRegisters',
      LIMIT_LABELS.maxOpenCashRegisters,
      'number',
      80,
      { defaultAllowUnlimited: true, defaultIsActive: true },
    ),
  },
  modules: {
    sales: createFieldContractDefinition('sales', ENTITLEMENT_LABELS.sales, 'boolean', 10, {
      defaultIsActive: true,
    }),
    preorders: createFieldContractDefinition(
      'preorders',
      ENTITLEMENT_LABELS.preorders,
      'boolean',
      20,
      { defaultIsActive: true },
    ),
    inventory: createFieldContractDefinition(
      'inventory',
      ENTITLEMENT_LABELS.inventory,
      'boolean',
      30,
      { defaultIsActive: true },
    ),
    orders: createFieldContractDefinition('orders', ENTITLEMENT_LABELS.orders, 'boolean', 40, {
      defaultIsActive: true,
    }),
    purchases: createFieldContractDefinition(
      'purchases',
      ENTITLEMENT_LABELS.purchases,
      'boolean',
      50,
      { defaultIsActive: true },
    ),
    expenses: createFieldContractDefinition(
      'expenses',
      ENTITLEMENT_LABELS.expenses,
      'boolean',
      60,
      { defaultIsActive: true },
    ),
    cashReconciliation: createFieldContractDefinition(
      'cashReconciliation',
      ENTITLEMENT_LABELS.cashReconciliation,
      'boolean',
      70,
      { defaultIsActive: true },
    ),
    accountsReceivable: createFieldContractDefinition(
      'accountsReceivable',
      ENTITLEMENT_LABELS.accountsReceivable,
      'boolean',
      80,
      { defaultIsActive: true },
    ),
    creditNote: createFieldContractDefinition(
      'creditNote',
      ENTITLEMENT_LABELS.creditNote,
      'boolean',
      90,
      { defaultIsActive: true },
    ),
    utility: createFieldContractDefinition('utility', ENTITLEMENT_LABELS.utility, 'boolean', 100, {
      defaultIsActive: true,
    }),
    authorizations: createFieldContractDefinition(
      'authorizations',
      ENTITLEMENT_LABELS.authorizations,
      'boolean',
      110,
      { defaultIsActive: true },
    ),
    taxReceipt: createFieldContractDefinition(
      'taxReceipt',
      ENTITLEMENT_LABELS.taxReceipt,
      'boolean',
      120,
      { defaultIsActive: true },
    ),
    insurance: createFieldContractDefinition(
      'insurance',
      ENTITLEMENT_LABELS.insurance,
      'boolean',
      130,
      { defaultIsActive: true },
    ),
  },
  addons: {
    advancedReports: createFieldContractDefinition(
      'advancedReports',
      ENTITLEMENT_LABELS.advancedReports,
      'boolean',
      10,
      { defaultIsActive: true },
    ),
    salesAnalyticsPanel: createFieldContractDefinition(
      'salesAnalyticsPanel',
      ENTITLEMENT_LABELS.salesAnalyticsPanel,
      'boolean',
      20,
      { defaultIsActive: true },
    ),
    api: createFieldContractDefinition('api', ENTITLEMENT_LABELS.api, 'boolean', 30, {
      defaultIsActive: true,
    }),
    ai: createFieldContractDefinition('ai', ENTITLEMENT_LABELS.ai, 'boolean', 40, {
      defaultIsActive: true,
    }),
  },
};

const createCatalogDefinitionFromContract = (
  contract: SubscriptionFieldContractDefinition,
  overrides: Partial<SubscriptionFieldDefinition> = {},
): SubscriptionFieldDefinition => ({
  key: contract.key,
  label: contract.defaultLabel,
  type: contract.type,
  order: contract.defaultOrder,
  isActive: contract.defaultIsActive,
  ...(contract.type === 'number'
    ? { allowUnlimited: contract.defaultAllowUnlimited }
    : {}),
  description: contract.description,
  ...overrides,
});

export const createEmptySubscriptionFieldCatalog = (): SubscriptionFieldCatalog => ({
  limits: {},
  modules: {},
  addons: {},
});

const normalizeStoredFieldDefinition = (
  section: SubscriptionFieldSection,
  key: string,
  value: unknown,
): SubscriptionFieldDefinition | null => {
  const contract = SUBSCRIPTION_FIELD_CONTRACT[section][key];
  if (!contract) return null;

  const source = asRecord(value);
  const label = toCleanString(source.label) || contract.defaultLabel;
  const order = toFiniteNumber(source.order) ?? contract.defaultOrder;
  const isActive =
    typeof source.isActive === 'boolean'
      ? source.isActive
      : contract.defaultIsActive ?? true;
  const description = toCleanString(source.description) || contract.description;
  const allowUnlimited =
    contract.type === 'number'
      ? typeof source.allowUnlimited === 'boolean'
        ? source.allowUnlimited
        : contract.defaultAllowUnlimited
      : undefined;

  return {
    key,
    label,
    type: contract.type,
    order,
    isActive,
    ...(contract.type === 'number' ? { allowUnlimited } : {}),
    description,
  };
};

const normalizeStoredFieldGroup = (
  section: SubscriptionFieldSection,
  value: unknown,
): Record<string, SubscriptionFieldDefinition> =>
  Object.entries(asRecord(value)).reduce<Record<string, SubscriptionFieldDefinition>>(
    (result, [key, rawField]) => {
      const normalized = normalizeStoredFieldDefinition(section, key, rawField);
      if (normalized) {
        result[key] = normalized;
      }
      return result;
    },
    {},
  );

export const normalizeSubscriptionFieldCatalog = (
  input: unknown,
): SubscriptionFieldCatalog => {
  const root = asRecord(input);
  return {
    limits: normalizeStoredFieldGroup('limits', root.limits),
    modules: normalizeStoredFieldGroup('modules', root.modules),
    addons: normalizeStoredFieldGroup('addons', root.addons),
  };
};

const buildEditableFieldGroup = (
  section: SubscriptionFieldSection,
  catalog: SubscriptionFieldCatalog,
): Record<string, SubscriptionFieldDefinition> =>
  Object.values(SUBSCRIPTION_FIELD_CONTRACT[section]).reduce<
    Record<string, SubscriptionFieldDefinition>
  >((result, contract) => {
    result[contract.key] =
      catalog[section][contract.key] ||
      createCatalogDefinitionFromContract(contract, {
        isActive: false,
      });
    return result;
  }, {});

export const buildEditableSubscriptionFieldCatalog = (
  catalog: SubscriptionFieldCatalog,
): SubscriptionFieldCatalog => ({
  limits: buildEditableFieldGroup('limits', catalog),
  modules: buildEditableFieldGroup('modules', catalog),
  addons: buildEditableFieldGroup('addons', catalog),
});

const sanitizeFieldDefinitionForSave = (
  section: SubscriptionFieldSection,
  key: string,
  value: unknown,
): SubscriptionFieldDefinition | null => {
  const normalized = normalizeStoredFieldDefinition(section, key, value);
  if (!normalized) return null;

  return {
    ...normalized,
    isActive:
      typeof normalized.isActive === 'boolean'
        ? normalized.isActive
        : SUBSCRIPTION_FIELD_CONTRACT[section][key].defaultIsActive ?? true,
  };
};

const sanitizeFieldGroupForSave = (
  section: SubscriptionFieldSection,
  value: unknown,
): Record<string, SubscriptionFieldDefinition> =>
  Object.entries(asRecord(value)).reduce<Record<string, SubscriptionFieldDefinition>>(
    (result, [key, rawField]) => {
      const normalized = sanitizeFieldDefinitionForSave(section, key, rawField);
      if (normalized) {
        result[key] = normalized;
      }
      return result;
    },
    {},
  );

export const sanitizeSubscriptionFieldCatalogForSave = (
  catalog: SubscriptionFieldCatalog,
): SubscriptionFieldCatalog => ({
  limits: sanitizeFieldGroupForSave('limits', catalog.limits),
  modules: sanitizeFieldGroupForSave('modules', catalog.modules),
  addons: sanitizeFieldGroupForSave('addons', catalog.addons),
});

export const serializeSubscriptionFieldCatalog = (
  catalog: SubscriptionFieldCatalog,
): UnknownRecord => {
  const sanitized = sanitizeSubscriptionFieldCatalogForSave(catalog);
  return {
    limits: sanitized.limits,
    modules: sanitized.modules,
    addons: sanitized.addons,
  };
};

export const getSubscriptionFieldLabel = (
  catalog: SubscriptionFieldCatalog,
  section: SubscriptionFieldSection,
  key: string,
): string => catalog[section][key]?.label || key;
