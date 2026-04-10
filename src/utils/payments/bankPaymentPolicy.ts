import type { PaymentMethodCode } from '@/types/payments';

export const BANK_PAYMENT_METHOD_CODES = ['card', 'transfer'] as const;
export const BANK_PAYMENT_MODULE_KEYS = [
  'sales',
  'expenses',
  'accountsReceivable',
  'purchases',
] as const;

export type BankPaymentMethodCode = (typeof BANK_PAYMENT_METHOD_CODES)[number];
export type BankPaymentModuleKey = (typeof BANK_PAYMENT_MODULE_KEYS)[number];
export type BankPaymentSelectionMode = 'manual' | 'default';
export type BankPaymentModuleAssignments = Record<
  BankPaymentModuleKey,
  string | null
>;
export interface BankPaymentModuleOverrideConfig {
  enabled: boolean;
  bankAccountId: string | null;
}
export type BankPaymentModuleOverrides = Record<
  BankPaymentModuleKey,
  BankPaymentModuleOverrideConfig
>;

export interface BankPaymentMethodConfig {
  selectionMode: BankPaymentSelectionMode;
  defaultBankAccountId: string | null;
}

export type BankPaymentPolicy = Record<
  BankPaymentMethodCode,
  BankPaymentMethodConfig
> & {
  defaultBankAccountId: string | null;
  moduleOverrides: BankPaymentModuleOverrides;
  moduleBankAccountIds: BankPaymentModuleAssignments;
};

const DEFAULT_BANK_PAYMENT_METHOD_CONFIG: BankPaymentMethodConfig = {
  selectionMode: 'manual',
  defaultBankAccountId: null,
};
const DEFAULT_BANK_PAYMENT_MODULE_OVERRIDE_CONFIG: BankPaymentModuleOverrideConfig =
  {
    enabled: false,
    bankAccountId: null,
  };

const defaultModuleBankAccountAssignments =
  (): BankPaymentModuleAssignments => ({
    sales: null,
    expenses: null,
    accountsReceivable: null,
    purchases: null,
  });

const defaultBankPaymentModuleOverrides = (): BankPaymentModuleOverrides => ({
  sales: { ...DEFAULT_BANK_PAYMENT_MODULE_OVERRIDE_CONFIG },
  expenses: { ...DEFAULT_BANK_PAYMENT_MODULE_OVERRIDE_CONFIG },
  accountsReceivable: { ...DEFAULT_BANK_PAYMENT_MODULE_OVERRIDE_CONFIG },
  purchases: { ...DEFAULT_BANK_PAYMENT_MODULE_OVERRIDE_CONFIG },
});

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const isBankPaymentMethodCode = (
  value: unknown,
): value is BankPaymentMethodCode =>
  typeof value === 'string' &&
  BANK_PAYMENT_METHOD_CODES.includes(value as BankPaymentMethodCode);

const normalizeSelectionMode = (value: unknown): BankPaymentSelectionMode =>
  value === 'default' ? 'default' : 'manual';

const normalizeBankPaymentMethodConfig = (
  value: unknown,
): BankPaymentMethodConfig => {
  const record = asRecord(value);

  return {
    selectionMode: normalizeSelectionMode(record.selectionMode),
    defaultBankAccountId: toCleanString(record.defaultBankAccountId),
  };
};

const normalizeBankPaymentModuleOverrideConfig = ({
  value,
  fallbackBankAccountId = null,
}: {
  value: unknown;
  fallbackBankAccountId?: string | null;
}): BankPaymentModuleOverrideConfig => {
  const record = asRecord(value);
  const bankAccountId =
    toCleanString(record.bankAccountId) ?? fallbackBankAccountId;
  const enabled =
    typeof record.enabled === 'boolean'
      ? record.enabled
      : bankAccountId != null;

  return {
    enabled,
    bankAccountId,
  };
};

const buildModuleBankAccountIdsFromOverrides = (
  moduleOverrides: BankPaymentModuleOverrides,
): BankPaymentModuleAssignments =>
  Object.fromEntries(
    BANK_PAYMENT_MODULE_KEYS.map((moduleKey) => [
      moduleKey,
      moduleOverrides[moduleKey].enabled
        ? moduleOverrides[moduleKey].bankAccountId
        : null,
    ]),
  ) as BankPaymentModuleAssignments;

export const defaultBankPaymentPolicy = (): BankPaymentPolicy => ({
  defaultBankAccountId: null,
  moduleOverrides: defaultBankPaymentModuleOverrides(),
  moduleBankAccountIds: defaultModuleBankAccountAssignments(),
  card: { ...DEFAULT_BANK_PAYMENT_METHOD_CONFIG },
  transfer: { ...DEFAULT_BANK_PAYMENT_METHOD_CONFIG },
});

export const normalizeBankPaymentPolicy = (
  value: unknown,
): BankPaymentPolicy => {
  const record = asRecord(value);
  const defaults = defaultBankPaymentPolicy();
  const card = normalizeBankPaymentMethodConfig(record.card ?? defaults.card);
  const transfer = normalizeBankPaymentMethodConfig(
    record.transfer ?? defaults.transfer,
  );
  const moduleOverridesRecord = asRecord(record.moduleOverrides);
  const moduleRecord = asRecord(record.moduleBankAccountIds);
  const defaultModuleOverrides = defaultBankPaymentModuleOverrides();
  const moduleOverrides = Object.fromEntries(
    BANK_PAYMENT_MODULE_KEYS.map((moduleKey) => [
      moduleKey,
      normalizeBankPaymentModuleOverrideConfig({
        value: moduleOverridesRecord[moduleKey],
        fallbackBankAccountId:
          toCleanString(moduleRecord[moduleKey]) ??
          defaultModuleOverrides[moduleKey].bankAccountId,
      }),
    ]),
  ) as BankPaymentModuleOverrides;
  const moduleBankAccountIds =
    buildModuleBankAccountIdsFromOverrides(moduleOverrides);

  return {
    defaultBankAccountId: toCleanString(record.defaultBankAccountId),
    moduleOverrides,
    moduleBankAccountIds,
    card,
    transfer,
  };
};

export const getBankPaymentModuleOverride = (
  policy: BankPaymentPolicy | null | undefined,
  moduleKey: BankPaymentModuleKey,
): BankPaymentModuleOverrideConfig =>
  normalizeBankPaymentModuleOverrideConfig({
    value: policy?.moduleOverrides?.[moduleKey],
    fallbackBankAccountId: toCleanString(
      policy?.moduleBankAccountIds?.[moduleKey],
    ),
  });

export const updateBankPaymentModuleOverride = ({
  policy,
  moduleKey,
  patch,
}: {
  policy: BankPaymentPolicy | null | undefined;
  moduleKey: BankPaymentModuleKey;
  patch: Partial<BankPaymentModuleOverrideConfig>;
}): BankPaymentPolicy => {
  const normalizedPolicy = normalizeBankPaymentPolicy(policy);
  const nextModuleOverrides: BankPaymentModuleOverrides = {
    ...normalizedPolicy.moduleOverrides,
    [moduleKey]: {
      ...normalizedPolicy.moduleOverrides[moduleKey],
      ...patch,
      bankAccountId:
        patch.bankAccountId === undefined
          ? normalizedPolicy.moduleOverrides[moduleKey].bankAccountId
          : patch.bankAccountId,
    },
  };

  return {
    ...normalizedPolicy,
    moduleOverrides: nextModuleOverrides,
    moduleBankAccountIds:
      buildModuleBankAccountIdsFromOverrides(nextModuleOverrides),
  };
};

export const getBankPaymentMethodConfig = (
  policy: BankPaymentPolicy | null | undefined,
  method: unknown,
): BankPaymentMethodConfig | null => {
  if (!isBankPaymentMethodCode(method)) {
    return null;
  }

  return policy?.[method] ?? defaultBankPaymentPolicy()[method];
};

const hasAvailableBankAccountId = (
  bankAccountId: string | null,
  availableBankAccountIds?: ReadonlySet<string> | readonly string[],
): boolean => {
  if (!bankAccountId) {
    return false;
  }

  if (!availableBankAccountIds) {
    return true;
  }

  return availableBankAccountIds instanceof Set
    ? availableBankAccountIds.has(bankAccountId)
    : availableBankAccountIds.includes(bankAccountId);
};

const getSoleAvailableBankAccountId = (
  availableBankAccountIds?: ReadonlySet<string> | readonly string[],
): string | null => {
  if (!availableBankAccountIds) {
    return null;
  }

  if (availableBankAccountIds instanceof Set) {
    if (availableBankAccountIds.size !== 1) {
      return null;
    }

    const [onlyBankAccountId] = Array.from(availableBankAccountIds);
    return onlyBankAccountId ?? null;
  }

  return availableBankAccountIds.length === 1
    ? (availableBankAccountIds[0] ?? null)
    : null;
};

const normalizeAvailableBankAccountIds = (
  availableBankAccountIds?: ReadonlySet<string> | readonly string[],
): string[] => {
  if (!availableBankAccountIds) {
    return [];
  }

  return availableBankAccountIds instanceof Set
    ? Array.from(availableBankAccountIds)
    : [...availableBankAccountIds];
};

export const syncBankPaymentPolicyDefaultAccount = ({
  policy,
  availableBankAccountIds,
  preferredDefaultBankAccountId = null,
}: {
  policy: BankPaymentPolicy | null | undefined;
  availableBankAccountIds?: ReadonlySet<string> | readonly string[];
  preferredDefaultBankAccountId?: string | null;
}): BankPaymentPolicy => {
  const normalizedPolicy = normalizeBankPaymentPolicy(policy);
  const normalizedAvailableBankAccountIds = normalizeAvailableBankAccountIds(
    availableBankAccountIds,
  );
  const availableBankAccountIdSet = new Set(normalizedAvailableBankAccountIds);
  const preferredAvailableBankAccountId = hasAvailableBankAccountId(
    preferredDefaultBankAccountId,
    availableBankAccountIdSet,
  )
    ? preferredDefaultBankAccountId
    : null;
  const currentDefaultBankAccountId = hasAvailableBankAccountId(
    normalizedPolicy.defaultBankAccountId,
    availableBankAccountIdSet,
  )
    ? normalizedPolicy.defaultBankAccountId
    : null;
  const nextDefaultBankAccountId =
    preferredAvailableBankAccountId ??
    currentDefaultBankAccountId;

  return {
    ...normalizedPolicy,
    defaultBankAccountId: nextDefaultBankAccountId,
  };
};

export const resolveConfiguredBankAccountId = ({
  policy,
  method,
  availableBankAccountIds,
}: {
  policy: BankPaymentPolicy | null | undefined;
  moduleKey?: BankPaymentModuleKey | null;
  method?: BankPaymentMethodCode | null | unknown;
  availableBankAccountIds?: ReadonlySet<string> | readonly string[];
}): string | null => {
  const methodConfig = getBankPaymentMethodConfig(policy, method);
  const methodBankAccountId =
    methodConfig?.selectionMode === 'default'
      ? methodConfig.defaultBankAccountId
      : null;

  if (hasAvailableBankAccountId(methodBankAccountId, availableBankAccountIds)) {
    return methodBankAccountId;
  }

  const configuredBankAccountId = toCleanString(policy?.defaultBankAccountId);

  if (
    hasAvailableBankAccountId(configuredBankAccountId, availableBankAccountIds)
  ) {
    return configuredBankAccountId;
  }

  return getSoleAvailableBankAccountId(availableBankAccountIds);
};

export const requiresManualBankAccountSelection = ({
  method,
  policy,
  moduleKey,
  availableBankAccountIds,
}: {
  method: unknown;
  policy: BankPaymentPolicy | null | undefined;
  moduleKey?: BankPaymentModuleKey | null;
  availableBankAccountIds?: ReadonlySet<string> | readonly string[];
}): boolean => {
  const config = getBankPaymentMethodConfig(policy, method);
  return Boolean(
    config &&
    config.selectionMode === 'manual' &&
    !resolveConfiguredBankAccountId({
      policy,
      moduleKey,
      method,
      availableBankAccountIds,
    }),
  );
};

export const resolveEffectiveBankAccountId = ({
  method,
  moduleKey,
  bankAccountId,
  policy,
  availableBankAccountIds,
}: {
  method: PaymentMethodCode | string | unknown;
  moduleKey?: BankPaymentModuleKey | null;
  bankAccountId: unknown;
  policy: BankPaymentPolicy | null | undefined;
  availableBankAccountIds?: ReadonlySet<string> | readonly string[];
}): string | null => {
  if (!isBankPaymentMethodCode(method)) {
    return null;
  }

  const config = getBankPaymentMethodConfig(policy, method);
  const currentBankAccountId = toCleanString(bankAccountId);
  const configuredBankAccountId = resolveConfiguredBankAccountId({
    policy,
    moduleKey,
    method,
    availableBankAccountIds,
  });

  if (!config) {
    return currentBankAccountId;
  }

  if (configuredBankAccountId) {
    return configuredBankAccountId;
  }

  return hasAvailableBankAccountId(
    currentBankAccountId,
    availableBankAccountIds,
  )
    ? currentBankAccountId
    : null;
};
