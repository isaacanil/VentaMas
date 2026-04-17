import { createHash } from 'node:crypto';

const DEFAULT_FUNCTIONAL_CURRENCY = 'DOP';
const SETTINGS_ENTITY_ID = 'accounting_settings';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value, { uppercase = false } = {}) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return null;
  }

  return uppercase ? trimmed.toUpperCase() : trimmed;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toDate === 'function') {
    const dateValue = value.toDate();
    return dateValue instanceof Date ? dateValue.getTime() : null;
  }

  const record = asRecord(value);
  const seconds =
    typeof record.seconds === 'number'
      ? record.seconds
      : typeof record._seconds === 'number'
        ? record._seconds
        : null;
  const nanoseconds =
    typeof record.nanoseconds === 'number'
      ? record.nanoseconds
      : typeof record._nanoseconds === 'number'
        ? record._nanoseconds
        : 0;
  if (seconds == null) return null;
  return seconds * 1000 + Math.floor(nanoseconds / 1e6);
};

const sortKeysDeep = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce((accumulator, key) => {
        accumulator[key] = sortKeysDeep(value[key]);
        return accumulator;
      }, {});
  }
  return value;
};

const stableStringify = (value) => JSON.stringify(sortKeysDeep(value));

const isDeepEqual = (left, right) => stableStringify(left) === stableStringify(right);

const buildSyncId = ({ scope, entityId, changedAt, snapshot }) =>
  createHash('sha1')
    .update(
      stableStringify({
        scope,
        entityId,
        changedAt: toMillis(changedAt) ?? null,
        snapshot,
      }),
    )
    .digest('hex')
    .slice(0, 20);

const normalizeCurrency = (value, fallback = DEFAULT_FUNCTIONAL_CURRENCY) =>
  toCleanString(value, { uppercase: true }) || fallback;

const normalizeDocumentCurrencies = (value, functionalCurrency) => {
  const rawValues = Array.isArray(value) ? value : [];
  const normalized = rawValues
    .map((entry) => normalizeCurrency(entry, functionalCurrency))
    .filter(Boolean);

  return [...new Set([functionalCurrency, ...normalized])];
};

const normalizeManualRatesByCurrency = (value, functionalCurrency, documentCurrencies) => {
  const record = asRecord(value);
  return documentCurrencies
    .filter((currency) => currency !== functionalCurrency)
    .reduce((accumulator, currency) => {
      const nestedRecord = asRecord(record[currency]);
      accumulator[currency] = {
        buyRate: safeNumber(nestedRecord.buyRate),
        sellRate: safeNumber(nestedRecord.sellRate),
      };
      return accumulator;
    }, {});
};

const normalizeCurrentExchangeRateIdsByCurrency = (
  value,
  functionalCurrency,
  documentCurrencies,
) => {
  const record = asRecord(value);
  return documentCurrencies
    .filter((currency) => currency !== functionalCurrency)
    .reduce((accumulator, currency) => {
      accumulator[currency] = toCleanString(record[currency]) ?? null;
      return accumulator;
    }, {});
};

const normalizeBankPaymentPolicy = (value) => {
  const record = asRecord(value);
  const moduleOverrides = asRecord(record.moduleOverrides);

  return {
    defaultBankAccountId: toCleanString(record.defaultBankAccountId),
    moduleOverrides: Object.keys(moduleOverrides)
      .sort((left, right) => left.localeCompare(right))
      .reduce((accumulator, moduleKey) => {
        const overrideRecord = asRecord(moduleOverrides[moduleKey]);
        accumulator[moduleKey] = {
          enabled: overrideRecord.enabled === true,
          bankAccountId: toCleanString(overrideRecord.bankAccountId),
        };
        return accumulator;
      }, {}),
  };
};

const buildAccountingSettingsBaseSnapshot = (value) => {
  const record = asRecord(value);
  const functionalCurrency = normalizeCurrency(record.functionalCurrency);
  const documentCurrencies = normalizeDocumentCurrencies(
    record.documentCurrencies,
    functionalCurrency,
  );

  return {
    schemaVersion: 7,
    rolloutMode: 'pilot',
    generalAccountingEnabled: record.generalAccountingEnabled === true,
    functionalCurrency,
    documentCurrencies,
    exchangeRateMode: 'manual',
    manualRatesByCurrency: normalizeManualRatesByCurrency(
      record.manualRatesByCurrency ?? record.manualRates,
      functionalCurrency,
      documentCurrencies,
    ),
    bankAccountsEnabled: record.bankAccountsEnabled !== false,
    bankPaymentPolicy: normalizeBankPaymentPolicy(record.bankPaymentPolicy),
    overridePolicy: 'settings-only',
    updatedBy: toCleanString(record.updatedBy),
  };
};

export const buildAccountingSettingsSnapshot = (value) => {
  const baseSnapshot = buildAccountingSettingsBaseSnapshot(value);
  return {
    ...baseSnapshot,
    currentExchangeRateIdsByCurrency: normalizeCurrentExchangeRateIdsByCurrency(
      asRecord(value).currentExchangeRateIdsByCurrency,
      baseSnapshot.functionalCurrency,
      baseSnapshot.documentCurrencies,
    ),
  };
};

export const buildExchangeRateId = ({
  quoteCurrency,
  baseCurrency,
  historyId,
}) => `fx_${quoteCurrency}_${baseCurrency}_${historyId}`;

export const buildExchangeRateRecordsFromSettingsSnapshot = ({
  businessId,
  snapshot,
  changedAt,
  changedBy,
  historyId,
}) => {
  const records = [];
  const currentExchangeRateIdsByCurrency = {};

  Object.entries(snapshot.manualRatesByCurrency ?? {}).forEach(([currency, rateConfig]) => {
    if (currency === snapshot.functionalCurrency) {
      return;
    }

    const buyRate = safeNumber(rateConfig?.buyRate);
    const sellRate = safeNumber(rateConfig?.sellRate);
    if (buyRate == null && sellRate == null) {
      return;
    }

    const id = buildExchangeRateId({
      quoteCurrency: currency,
      baseCurrency: snapshot.functionalCurrency,
      historyId,
    });

    records.push({
      id,
      businessId,
      quoteCurrency: currency,
      baseCurrency: snapshot.functionalCurrency,
      buyRate,
      sellRate,
      effectiveAt: changedAt,
      source: 'settings_manual',
      status: 'active',
      createdAt: changedAt,
      createdBy: changedBy ?? null,
      historyId,
      metadata: {
        origin: 'settings/accounting',
      },
    });

    currentExchangeRateIdsByCurrency[currency] = id;
  });

  return {
    records,
    currentExchangeRateIdsByCurrency,
  };
};

const buildAuditEntryId = (scope, historyId) => `${scope}:${historyId}`;

const buildAccountingAuditEntry = ({
  businessId,
  scope,
  entityId,
  historyId,
  entityLabel,
  changeType,
  changedAt,
  changedBy,
  before = null,
  after = null,
}) => ({
  id: buildAuditEntryId(scope, historyId),
  businessId,
  scope,
  entityId,
  entityLabel: entityLabel ?? '',
  changeType,
  changedAt,
  changedBy: changedBy ?? null,
  before,
  after,
});

const resolveEntityChangeType = ({ beforeSnapshot, afterSnapshot }) => {
  if (!beforeSnapshot) {
    return afterSnapshot?.metadata?.seededBy ? 'seeded' : 'created';
  }

  if (
    Object.prototype.hasOwnProperty.call(beforeSnapshot, 'status') &&
    Object.prototype.hasOwnProperty.call(afterSnapshot, 'status') &&
    beforeSnapshot.status !== afterSnapshot.status
  ) {
    return 'status_changed';
  }

  return 'updated';
};

const buildSettingsHistoryEntry = ({
  businessId,
  historyId,
  changeType,
  changedAt,
  changedBy,
  before,
  after,
}) => ({
  id: historyId,
  businessId,
  changeType,
  changedAt,
  changedBy: changedBy ?? null,
  previous: before,
  next: after,
  ...after,
});

const buildEntityHistoryEntry = ({
  scope,
  historyId,
  businessId,
  entityId,
  changeType,
  changedAt,
  changedBy,
  previous,
  next,
}) => {
  const entityFieldByScope = {
    bank_account: 'bankAccountId',
    chart_of_account: 'chartOfAccountId',
    posting_profile: 'postingProfileId',
  };

  const entityField = entityFieldByScope[scope];

  return {
    id: historyId,
    businessId,
    [entityField]: entityId,
    changeType,
    changedAt,
    changedBy: changedBy ?? null,
    previous: previous ?? null,
    next,
  };
};

const buildBankAccountSnapshot = ({ businessId, entityId, value }) => {
  const record = asRecord(value);
  return {
    id: entityId,
    businessId,
    name: toCleanString(record.name) ?? 'Cuenta bancaria',
    currency: normalizeCurrency(record.currency),
    status: record.status === 'inactive' ? 'inactive' : 'active',
    type: toCleanString(record.type),
    institutionName: toCleanString(record.institutionName),
    bankCode: toCleanString(record.bankCode),
    countryCode: toCleanString(record.countryCode),
    isCustomBank: record.isCustomBank === true,
    accountNumberLast4: toCleanString(record.accountNumberLast4),
    openingBalance: safeNumber(record.openingBalance),
    openingBalanceDate: record.openingBalanceDate ?? null,
    notes: toCleanString(record.notes),
    metadata: asRecord(record.metadata),
  };
};

const buildChartOfAccountSnapshot = ({ businessId, entityId, value }) => {
  const record = asRecord(value);
  return {
    id: entityId,
    businessId,
    code: toCleanString(record.code) ?? entityId,
    name: toCleanString(record.name) ?? 'Cuenta contable',
    type: toCleanString(record.type) ?? 'asset',
    subtype: toCleanString(record.subtype),
    parentId: toCleanString(record.parentId),
    postingAllowed: record.postingAllowed !== false,
    status: record.status === 'inactive' ? 'inactive' : 'active',
    normalSide: record.normalSide === 'credit' ? 'credit' : 'debit',
    currencyMode:
      record.currencyMode === 'multi_currency_reference'
        ? 'multi_currency_reference'
        : 'functional_only',
    systemKey: toCleanString(record.systemKey),
    metadata: asRecord(record.metadata),
  };
};

const buildPostingProfileSnapshot = ({ businessId, entityId, value }) => {
  const record = asRecord(value);
  return {
    id: entityId,
    businessId,
    name: toCleanString(record.name) ?? 'Perfil contable',
    description: toCleanString(record.description),
    eventType: toCleanString(record.eventType),
    moduleKey: toCleanString(record.moduleKey),
    status: record.status === 'inactive' ? 'inactive' : 'active',
    priority: safeNumber(record.priority) ?? 100,
    conditions: asRecord(record.conditions),
    linesTemplate: Array.isArray(record.linesTemplate)
      ? record.linesTemplate.map((entry) => asRecord(entry))
      : [],
    metadata: asRecord(record.metadata),
  };
};

const buildEntityLabel = (scope, snapshot) => {
  switch (scope) {
    case 'bank_account':
      return snapshot.name ?? 'Cuenta bancaria';
    case 'chart_of_account':
      return [snapshot.code, snapshot.name].filter(Boolean).join(' · ');
    case 'posting_profile':
      return snapshot.name ?? 'Perfil contable';
    default:
      return '';
  }
};

const getChangedAtFromRecord = (record) =>
  record?.updatedAt ?? record?.createdAt ?? new Date();

export const buildAccountingSettingsDerivedPlan = ({
  businessId,
  beforeData,
  afterData,
}) => {
  if (!afterData) {
    return null;
  }

  const beforeBaseSnapshot = beforeData
    ? buildAccountingSettingsBaseSnapshot(beforeData)
    : null;
  const afterBaseSnapshot = buildAccountingSettingsBaseSnapshot(afterData);
  const changedAt = getChangedAtFromRecord(afterData);
  const changedBy = toCleanString(afterData.updatedBy ?? afterData.createdBy);
  const historyId = buildSyncId({
    scope: 'settings',
    entityId: SETTINGS_ENTITY_ID,
    changedAt,
    snapshot: afterBaseSnapshot,
  });
  const { records, currentExchangeRateIdsByCurrency } =
    buildExchangeRateRecordsFromSettingsSnapshot({
      businessId,
      snapshot: afterBaseSnapshot,
      changedAt,
      changedBy,
      historyId,
    });
  const afterSnapshot = {
    ...afterBaseSnapshot,
    currentExchangeRateIdsByCurrency,
  };
  const currentSnapshot = buildAccountingSettingsSnapshot(afterData);
  const staleExchangeRateIds = [...new Set([
    ...Object.values(currentSnapshot.currentExchangeRateIdsByCurrency ?? {}),
    ...(beforeData
      ? Object.values(buildAccountingSettingsSnapshot(beforeData).currentExchangeRateIdsByCurrency ?? {})
      : []),
  ])]
    .filter((entry) => typeof entry === 'string' && entry.length > 0)
    .filter(
      (entry) => !Object.values(currentExchangeRateIdsByCurrency).includes(entry),
    );

  const onlyDerivedChanged =
    beforeBaseSnapshot != null && isDeepEqual(beforeBaseSnapshot, afterBaseSnapshot);
  const shouldUpdateCurrentIds = !isDeepEqual(
    currentSnapshot.currentExchangeRateIdsByCurrency,
    currentExchangeRateIdsByCurrency,
  );

  if (onlyDerivedChanged && !shouldUpdateCurrentIds) {
    return null;
  }

  return {
    historyId,
    changeType: beforeData ? 'updated' : 'created',
    changedAt,
    changedBy,
    historyEntry:
      onlyDerivedChanged
        ? null
        : buildSettingsHistoryEntry({
            businessId,
            historyId,
            changeType: beforeData ? 'updated' : 'created',
            changedAt,
            changedBy,
            before: beforeData ? buildAccountingSettingsSnapshot(beforeData) : null,
            after: afterSnapshot,
          }),
    auditEntry:
      onlyDerivedChanged
        ? null
        : buildAccountingAuditEntry({
            businessId,
            scope: 'settings',
            entityId: SETTINGS_ENTITY_ID,
            historyId,
            entityLabel: 'Configuración contable',
            changeType: beforeData ? 'updated' : 'created',
            changedAt,
            changedBy,
            before: beforeData ? buildAccountingSettingsSnapshot(beforeData) : null,
            after: afterSnapshot,
          }),
    exchangeRateRecords: records,
    currentExchangeRateIdsByCurrency,
    shouldUpdateCurrentIds,
    staleExchangeRateIds,
  };
};

export const buildEntityDerivedPlan = ({
  scope,
  businessId,
  entityId,
  beforeData,
  afterData,
}) => {
  if (!afterData) {
    return null;
  }

  const snapshotBuilderByScope = {
    bank_account: buildBankAccountSnapshot,
    chart_of_account: buildChartOfAccountSnapshot,
    posting_profile: buildPostingProfileSnapshot,
  };

  const snapshotBuilder = snapshotBuilderByScope[scope];
  const beforeSnapshot = beforeData
    ? snapshotBuilder({ businessId, entityId, value: beforeData })
    : null;
  const afterSnapshot = snapshotBuilder({ businessId, entityId, value: afterData });

  if (beforeSnapshot && isDeepEqual(beforeSnapshot, afterSnapshot)) {
    return null;
  }

  const changedAt = getChangedAtFromRecord(afterData);
  const changedBy = toCleanString(afterData.updatedBy ?? afterData.createdBy);
  const historyId = buildSyncId({
    scope,
    entityId,
    changedAt,
    snapshot: afterSnapshot,
  });
  const changeType = resolveEntityChangeType({
    beforeSnapshot,
    afterSnapshot,
  });
  const entityLabel = buildEntityLabel(scope, afterSnapshot);

  return {
    historyId,
    changeType,
    changedAt,
    changedBy,
    historyEntry: buildEntityHistoryEntry({
      scope,
      historyId,
      businessId,
      entityId,
      changeType,
      changedAt,
      changedBy,
      previous: beforeSnapshot,
      next: afterSnapshot,
    }),
    auditEntry: buildAccountingAuditEntry({
      businessId,
      scope,
      entityId,
      historyId,
      entityLabel,
      changeType,
      changedAt,
      changedBy,
      before: beforeSnapshot,
      after: afterSnapshot,
    }),
  };
};
