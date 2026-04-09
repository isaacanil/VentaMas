const MIN_VALID_TRANSACTION_MILLIS = 946684800000;
const SETTLED_STATUSES = new Set(['paid', 'overpaid']);
const BANK_METHODS = new Set([
  'card',
  'transfer',
  'bank_transfer',
  'credit_card',
  'debit_card',
  'check',
]);
const CASH_METHODS = new Set(['cash', 'open_cash']);
const IMMEDIATE_PURCHASE_CONDITIONS = new Set(['cash']);
const LEGACY_CONDITION_MAP = Object.freeze({
  condition_0001: 'cash',
  condition_0002: 'one_week',
  condition_0003: 'fifteen_days',
  condition_0004: 'thirty_days',
  condition_0005: 'other',
});
const LEGACY_STATUS_MAP = Object.freeze({
  state_1: 'pending',
  state_2: 'pending',
  state_3: 'completed',
  state_4: 'canceled',
});

const toRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toLowerString = (value) => {
  const normalized = toCleanString(value);
  return normalized ? normalized.toLowerCase() : null;
};

const toUpperString = (value) => {
  const normalized = toCleanString(value);
  return normalized ? normalized.toUpperCase() : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwoDecimals = (value) =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      const parsed = value.toMillis();
      return Number.isFinite(parsed) ? parsed : null;
    }
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    const nanoseconds =
      typeof value.nanoseconds === 'number'
        ? value.nanoseconds
        : typeof value._nanoseconds === 'number'
          ? value._nanoseconds
          : 0;
    if (seconds != null) {
      return seconds * 1000 + Math.floor(nanoseconds / 1e6);
    }
  }
  return null;
};

const toSample = (items, sampleLimit) =>
  items.slice(0, sampleLimit).map((item) => item.id);

const countBy = (items, keyFn) => {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

const formatList = (items) =>
  items.length ? items.map((item) => `- ${item}`).join('\n') : '- none';

const pickFirstDefined = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
};

const normalizePurchaseCondition = (value) => {
  const normalized = toLowerString(value);
  if (!normalized) return null;
  return LEGACY_CONDITION_MAP[normalized] ?? normalized;
};

const normalizePurchaseStatus = (value) => {
  const normalized = toLowerString(value);
  if (!normalized) return null;
  return LEGACY_STATUS_MAP[normalized] ?? normalized;
};

const normalizePurchaseDates = (value) => {
  const record = toRecord(value);
  const next = {};
  const deliveryDate = pickFirstDefined(record.deliveryDate, record.deliveryAt);
  const paymentDate = pickFirstDefined(record.paymentDate, record.paymentAt);

  if (deliveryDate != null) {
    next.deliveryDate = deliveryDate;
  }
  if (paymentDate != null) {
    next.paymentDate = paymentDate;
  }

  return next;
};

const buildLegacyEnvelopePromotionPatch = (purchase) => {
  const rawPurchase = toRecord(purchase);
  const legacyData = toRecord(rawPurchase.data);
  if (!Object.keys(legacyData).length) {
    return null;
  }

  const patch = {};
  const maybeAssign = (key, value) => {
    const currentValue = rawPurchase[key];
    if (
      (currentValue === undefined ||
        currentValue === null ||
        currentValue === '') &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      patch[key] = value;
    }
  };

  maybeAssign('numberId', legacyData.numberId);
  maybeAssign('note', legacyData.note);
  maybeAssign('orderId', legacyData.orderId);
  maybeAssign('invoiceNumber', legacyData.invoiceNumber);
  maybeAssign('proofOfPurchase', legacyData.proofOfPurchase);
  maybeAssign('provider', legacyData.provider);
  maybeAssign('replenishments', legacyData.replenishments);
  maybeAssign('total', legacyData.total);
  maybeAssign('totalAmount', legacyData.totalAmount);
  maybeAssign('amount', legacyData.amount);
  maybeAssign('createdAt', legacyData.createdAt);
  maybeAssign('updatedAt', legacyData.updatedAt);
  maybeAssign('completedAt', legacyData.completedAt);
  maybeAssign('deliveryAt', pickFirstDefined(
    legacyData.deliveryAt,
    toRecord(legacyData.dates).deliveryDate,
  ));
  maybeAssign('paymentAt', pickFirstDefined(
    legacyData.paymentAt,
    toRecord(legacyData.dates).paymentDate,
  ));
  maybeAssign('deletedAt', legacyData.deletedAt);
  maybeAssign('canceledAt', legacyData.canceledAt);
  maybeAssign(
    'attachmentUrls',
    Array.isArray(legacyData.attachmentUrls)
      ? legacyData.attachmentUrls
      : Array.isArray(legacyData.fileList)
        ? legacyData.fileList
        : null,
  );

  if (!Object.keys(normalizePurchaseDates(rawPurchase.dates)).length) {
    const normalizedLegacyDates = normalizePurchaseDates(legacyData.dates);
    if (Object.keys(normalizedLegacyDates).length) {
      patch.dates = normalizedLegacyDates;
    }
  }

  const normalizedCondition = normalizePurchaseCondition(legacyData.condition);
  if (
    (rawPurchase.condition === undefined ||
      rawPurchase.condition === null ||
      rawPurchase.condition === '') &&
    normalizedCondition
  ) {
    patch.condition = normalizedCondition;
  }

  const normalizedStatus = normalizePurchaseStatus(
    pickFirstDefined(legacyData.status, legacyData.state),
  );
  if (
    (rawPurchase.status === undefined ||
      rawPurchase.status === null ||
      rawPurchase.status === '') &&
    normalizedStatus
  ) {
    patch.status = normalizedStatus;
  }

  const normalizedWorkflowStatus = normalizePurchaseStatus(
    legacyData.workflowStatus,
  );
  if (
    (rawPurchase.workflowStatus === undefined ||
      rawPurchase.workflowStatus === null ||
      rawPurchase.workflowStatus === '') &&
    normalizedWorkflowStatus
  ) {
    patch.workflowStatus = normalizedWorkflowStatus;
  }

  return Object.keys(patch).length ? patch : null;
};

const normalizePurchaseRecord = (purchase) => {
  const rawPurchase = toRecord(purchase);
  const legacyData = toRecord(rawPurchase.data);
  const topLevelDates = normalizePurchaseDates(rawPurchase.dates);
  const legacyDates = normalizePurchaseDates(legacyData.dates);
  const paymentTerms = toRecord(rawPurchase.paymentTerms);
  const legacyPaymentTerms = toRecord(legacyData.paymentTerms);
  const paymentState = toRecord(rawPurchase.paymentState);
  const legacyPaymentState = toRecord(legacyData.paymentState);
  const normalizedPurchase = {
    ...rawPurchase,
    id: toCleanString(rawPurchase.id) ?? toCleanString(legacyData.id) ?? null,
    numberId: pickFirstDefined(rawPurchase.numberId, legacyData.numberId),
    replenishments: Array.isArray(rawPurchase.replenishments)
      ? rawPurchase.replenishments
      : Array.isArray(legacyData.replenishments)
        ? legacyData.replenishments
        : [],
    condition: normalizePurchaseCondition(
      pickFirstDefined(
        paymentTerms.condition,
        rawPurchase.condition,
        legacyPaymentTerms.condition,
        legacyData.condition,
      ),
    ),
    status: normalizePurchaseStatus(
      pickFirstDefined(rawPurchase.status, legacyData.status, legacyData.state),
    ),
    workflowStatus: normalizePurchaseStatus(
      pickFirstDefined(rawPurchase.workflowStatus, legacyData.workflowStatus),
    ),
    paymentAt: pickFirstDefined(
      rawPurchase.paymentAt,
      topLevelDates.paymentDate,
      legacyData.paymentAt,
      legacyDates.paymentDate,
    ),
    deliveryAt: pickFirstDefined(
      rawPurchase.deliveryAt,
      topLevelDates.deliveryDate,
      legacyData.deliveryAt,
      legacyDates.deliveryDate,
    ),
    completedAt: pickFirstDefined(rawPurchase.completedAt, legacyData.completedAt),
    createdAt: pickFirstDefined(rawPurchase.createdAt, legacyData.createdAt),
    updatedAt: pickFirstDefined(rawPurchase.updatedAt, legacyData.updatedAt),
    totalAmount: pickFirstDefined(rawPurchase.totalAmount, legacyData.totalAmount),
    total: pickFirstDefined(rawPurchase.total, legacyData.total),
    amount: pickFirstDefined(rawPurchase.amount, legacyData.amount),
    provider: pickFirstDefined(rawPurchase.provider, legacyData.provider),
    dates: Object.keys(topLevelDates).length
      ? topLevelDates
      : legacyDates,
    paymentTerms: Object.keys(paymentTerms).length
      ? paymentTerms
      : legacyPaymentTerms,
    paymentState: Object.keys(paymentState).length
      ? paymentState
      : legacyPaymentState,
    monetary: Object.keys(toRecord(rawPurchase.monetary)).length
      ? rawPurchase.monetary
      : legacyData.monetary ?? null,
    __legacyEnvelopePromotionPatch: buildLegacyEnvelopePromotionPatch(rawPurchase),
  };

  return normalizedPurchase;
};

const resolvePurchaseLifecycleStatus = (purchase) =>
  normalizePurchaseStatus(purchase.workflowStatus) ??
  normalizePurchaseStatus(purchase.status);

const resolveDerivedPurchasePaymentTerms = (purchase) => {
  const paymentTerms = toRecord(purchase.paymentTerms);
  const condition = normalizePurchaseCondition(
    pickFirstDefined(paymentTerms.condition, purchase.condition),
  );
  const expectedPaymentAt = pickFirstDefined(
    paymentTerms.expectedPaymentAt,
    purchase.paymentAt,
    toRecord(purchase.dates).paymentDate,
  );
  const nextPaymentAt = pickFirstDefined(
    paymentTerms.nextPaymentAt,
    expectedPaymentAt,
  );
  const isImmediate = condition
    ? IMMEDIATE_PURCHASE_CONDITIONS.has(condition)
    : false;

  return {
    condition,
    expectedPaymentAt,
    nextPaymentAt,
    isImmediate,
    scheduleType: isImmediate ? 'immediate' : condition ? 'deferred' : 'custom',
  };
};

const resolvePaymentStateStatus = ({ total, paid, balance }) => {
  const safeTotal = roundToTwoDecimals(total);
  const safePaid = roundToTwoDecimals(paid);
  const safeBalance = roundToTwoDecimals(Math.max(balance, 0));

  if (safePaid > safeTotal + 0.01) {
    return 'overpaid';
  }
  if (safeBalance <= 0.01) {
    return 'paid';
  }
  if (safePaid > 0.01) {
    return 'partial';
  }
  return 'unpaid';
};

const buildPaymentStateRecord = (input = {}) => {
  const total = roundToTwoDecimals(input.total);
  const paid = roundToTwoDecimals(input.paid);
  const resolvedBalance =
    input.balance == null
      ? Math.max(roundToTwoDecimals(total - paid), 0)
      : roundToTwoDecimals(Math.max(input.balance, 0));

  const paymentState = {
    status:
      input.status ||
      resolvePaymentStateStatus({ total, paid, balance: resolvedBalance }),
    total,
    paid,
    balance: resolvedBalance,
    lastPaymentAt: input.lastPaymentAt ?? null,
    nextPaymentAt: input.nextPaymentAt ?? null,
    lastPaymentId: input.lastPaymentId ?? null,
  };

  if (input.paymentCount !== undefined) {
    paymentState.paymentCount = input.paymentCount;
  }
  if (input.requiresReview !== undefined) {
    paymentState.requiresReview = input.requiresReview;
  }
  if (input.migratedFromLegacy !== undefined) {
    paymentState.migratedFromLegacy = input.migratedFromLegacy;
  }

  return paymentState;
};

const applyOverduePaymentState = (paymentState, now = Date.now()) => {
  if (!paymentState) return paymentState;

  const dueAt = toMillis(paymentState.nextPaymentAt);
  if (dueAt == null) return paymentState;
  if (roundToTwoDecimals(paymentState.balance) <= 0.01) return paymentState;
  if (dueAt >= now) return paymentState;
  if (!['unpaid', 'partial'].includes(paymentState.status)) {
    return paymentState;
  }

  return {
    ...paymentState,
    status: 'overdue',
  };
};

const buildDerivedMissingPaymentState = ({ purchase, paymentTerms, total }) => {
  if (total == null) {
    return null;
  }

  const purchaseStatus = resolvePurchaseLifecycleStatus(purchase);
  if (purchaseStatus === 'canceled') {
    return null;
  }

  if (paymentTerms.isImmediate && purchaseStatus === 'completed') {
    return {
      ...buildPaymentStateRecord({
        total,
        paid: total,
        balance: 0,
        lastPaymentAt: pickFirstDefined(
          purchase.completedAt,
          paymentTerms.expectedPaymentAt,
          purchase.deliveryAt,
          purchase.updatedAt,
          purchase.createdAt,
        ),
        nextPaymentAt: null,
        paymentCount: 1,
      }),
      requiresReview: false,
      migratedFromLegacy: true,
    };
  }

  return applyOverduePaymentState(
    buildPaymentStateRecord({
      total,
      paid: 0,
      balance: total,
      nextPaymentAt: pickFirstDefined(
        paymentTerms.nextPaymentAt,
        paymentTerms.expectedPaymentAt,
      ),
      paymentCount: 0,
      requiresReview:
        paymentTerms.isImmediate !== true &&
        paymentTerms.nextPaymentAt == null &&
        paymentTerms.expectedPaymentAt == null,
      migratedFromLegacy: true,
    }),
  );
};

const resolvePurchaseLineSubtotal = (item) => {
  const record = toRecord(item);
  const unitCost = safeNumber(record.unitCost ?? record.baseCost);
  const quantity =
    safeNumber(record.quantity ?? record.purchaseQuantity) ?? 0;
  const subtotal = safeNumber(record.subtotal ?? record.subTotal);

  if (subtotal != null) return roundToTwoDecimals(subtotal);
  if (unitCost == null) return 0;
  return roundToTwoDecimals(unitCost * quantity);
};

const resolvePurchaseTaxes = (purchase) => {
  const replenishments = Array.isArray(purchase.replenishments)
    ? purchase.replenishments
    : [];

  return roundToTwoDecimals(
    replenishments.reduce(
      (sum, item) => sum + (safeNumber(toRecord(item).calculatedITBIS) ?? 0),
      0,
    ),
  );
};

const resolvePurchaseTotal = (purchase) => {
  const directTotal = safeNumber(
    purchase.totalAmount ?? purchase.total ?? purchase.amount,
  );
  if (directTotal != null && directTotal > 0) {
    return roundToTwoDecimals(directTotal);
  }

  const replenishments = Array.isArray(purchase.replenishments)
    ? purchase.replenishments
    : [];
  if (!replenishments.length) {
    return directTotal != null ? roundToTwoDecimals(directTotal) : null;
  }

  const subtotal = roundToTwoDecimals(
    replenishments.reduce(
      (sum, item) => sum + resolvePurchaseLineSubtotal(item),
      0,
    ),
  );
  return roundToTwoDecimals(subtotal + resolvePurchaseTaxes(purchase));
};

const normalizeCurrencyCode = (value) => {
  if (typeof value === 'string') return toUpperString(value);
  const record = toRecord(value);
  return toUpperString(record.code ?? record.currency ?? record.id);
};

const normalizeDocumentCurrencies = (value) =>
  Array.isArray(value)
    ? value.map((entry) => normalizeCurrencyCode(entry)).filter(Boolean)
    : [];

const normalizeBankPaymentPolicy = (value) => {
  if (typeof value === 'string') {
    const raw = toCleanString(value);
    return {
      configured: Boolean(raw),
      mode: raw,
      defaultBankAccountId: null,
      purchasesBankAccountId: null,
    };
  }

  const record = toRecord(value);
  const moduleOverrides = toRecord(
    record.moduleOverrides ?? record.modules ?? record.overrides,
  );
  const purchases = toRecord(
    moduleOverrides.purchases ?? record.purchases ?? record.purchase,
  );

  return {
    configured: Object.keys(record).length > 0,
    mode: toCleanString(record.mode ?? record.strategy ?? record.type),
    defaultBankAccountId: toCleanString(
      record.defaultBankAccountId ??
        record.defaultAccountId ??
        toRecord(record.defaultAccount).bankAccountId,
    ),
    purchasesBankAccountId: toCleanString(
      purchases.defaultBankAccountId ??
        purchases.bankAccountId ??
        toRecord(purchases.defaultAccount).bankAccountId,
    ),
  };
};

const resolveBankingMode = (analysis) => {
  if (!analysis.accountingSettings.exists) return 'unspecified';
  return analysis.accountingSettings.bankAccountsEnabled === false
    ? 'cash-only'
    : 'bank-enabled';
};

const areBankAccountsRequired = (analysis) =>
  resolveBankingMode(analysis) === 'bank-enabled';

const isActiveBankAccount = (bankAccount) => {
  const status = toLowerString(bankAccount.status);
  if (status) return status === 'active';
  if (typeof bankAccount.active === 'boolean') return bankAccount.active;
  return true;
};

const requiresCashCountId = (value) => {
  const record = toRecord(value);
  const method = toLowerString(record.method);
  return record.impactsCashDrawer === true || CASH_METHODS.has(method);
};

const requiresBankAccountId = (value) => {
  const record = toRecord(value);
  const method = toLowerString(record.method);
  return record.impactsBankLedger === true || BANK_METHODS.has(method);
};

const buildReadiness = (analysis) => {
  const blockers = [];
  const warnings = [];
  const bankAccountsRequired = areBankAccountsRequired(analysis);

  if (!analysis.accountingSettings.exists) {
    blockers.push(
      'No existe businesses/{businessId}/settings/accounting para este negocio.',
    );
  }
  if (bankAccountsRequired && analysis.bankAccounts.activeCount === 0) {
    blockers.push('No hay bankAccounts activas para operar pagos bancarios/tarjeta.');
  }
  if (analysis.purchases.missingPaymentStateOperational.count > 0) {
    blockers.push(
      `${analysis.purchases.missingPaymentStateOperational.count} compras operativas no tienen paymentState.`,
    );
  }
  if (analysis.purchases.missingPaymentTerms.count > 0) {
    blockers.push(
      `${analysis.purchases.missingPaymentTerms.count} compras no tienen paymentTerms.`,
    );
  }
  if (analysis.purchases.invalidPaymentAt.count > 0) {
    blockers.push(
      `${analysis.purchases.invalidPaymentAt.count} compras tienen paymentAt sospechoso/anomalo.`,
    );
  }
  if (analysis.purchases.baseCurrencyRateTypeMismatch.count > 0) {
    blockers.push(
      `${analysis.purchases.baseCurrencyRateTypeMismatch.count} compras en moneda base tienen rateType distinto de buy.`,
    );
  }
  if (analysis.accountsPayable.baseCurrencyRateTypeMismatch.count > 0) {
    blockers.push(
      `${analysis.accountsPayable.baseCurrencyRateTypeMismatch.count} pagos CxP en moneda base tienen rateType distinto de buy.`,
    );
  }
  if (analysis.accountsPayable.bankLikeMissingBankAccount.count > 0) {
    blockers.push(
      `${analysis.accountsPayable.bankLikeMissingBankAccount.count} pagos CxP bancarios/tarjeta no tienen bankAccountId.`,
    );
  }
  if (analysis.accountsPayable.bankLikeUnknownBankAccount.count > 0) {
    blockers.push(
      `${analysis.accountsPayable.bankLikeUnknownBankAccount.count} pagos CxP bancarios/tarjeta apuntan a bankAccountId inexistente.`,
    );
  }
  if (analysis.cashMovements.supplierPayment.missingCashCountId.count > 0) {
    blockers.push(
      `${analysis.cashMovements.supplierPayment.missingCashCountId.count} cashMovements de supplier_payment requieren cashCountId y no lo tienen.`,
    );
  }
  if (analysis.cashMovements.supplierPayment.missingBankAccountId.count > 0) {
    blockers.push(
      `${analysis.cashMovements.supplierPayment.missingBankAccountId.count} cashMovements de supplier_payment requieren bankAccountId y no lo tienen.`,
    );
  }
  if (analysis.cashMovements.supplierPayment.unknownBankAccountId.count > 0) {
    blockers.push(
      `${analysis.cashMovements.supplierPayment.unknownBankAccountId.count} cashMovements de supplier_payment usan bankAccountId inexistente.`,
    );
  }
  if (analysis.cashMovements.supplierPayment.postedPaymentsMissingMovement.count > 0) {
    blockers.push(
      `${analysis.cashMovements.supplierPayment.postedPaymentsMissingMovement.count} pagos CxP posteados no tienen supplier_payment en cashMovements.`,
    );
  }

  if (analysis.purchases.missingPaymentStateCanceled.count > 0) {
    warnings.push(
      `${analysis.purchases.missingPaymentStateCanceled.count} compras canceladas siguen sin paymentState.`,
    );
  }
  if (analysis.accountingSettings.bankAccountsEnabled === false) {
    warnings.push(
      'El negocio esta configurado como cash-only: tarjeta y transferencia seguiran deshabilitadas hasta activar bankAccounts.',
    );
  }
  if (analysis.purchases.missingMonetary.count > 0) {
    warnings.push(
      `${analysis.purchases.missingMonetary.count} compras no tienen monetary historico.`,
    );
  }
  if (analysis.purchases.settledWithPaymentStateNextPaymentAt.count > 0) {
    warnings.push(
      `${analysis.purchases.settledWithPaymentStateNextPaymentAt.count} compras liquidadas conservan paymentState.nextPaymentAt.`,
    );
  }
  if (analysis.purchases.settledWithPaymentTermsNextPaymentAt.count > 0) {
    warnings.push(
      `${analysis.purchases.settledWithPaymentTermsNextPaymentAt.count} compras liquidadas conservan paymentTerms.nextPaymentAt.`,
    );
  }
  if (
    bankAccountsRequired &&
    analysis.accountsPayable.total > 0 &&
    analysis.accountsPayable.bankLikePayments.count === 0
  ) {
    warnings.push(
      'No hay evidencia real de pagos CxP con cuenta bancaria o tarjeta en este negocio.',
    );
  }
  if (
    analysis.accountsPayable.total > 0 &&
    analysis.cashMovements.supplierPayment.total === 0
  ) {
    warnings.push(
      'No hay supplier_payment en cashMovements a pesar de existir pagos CxP.',
    );
  }
  if (analysis.cashMovements.supplierPayment.orphanMovements.count > 0) {
    warnings.push(
      `${analysis.cashMovements.supplierPayment.orphanMovements.count} cashMovements de supplier_payment no apuntan a un accountsPayablePayment actual.`,
    );
  }
  if (analysis.cashMovements.supplierPayment.repairCandidates.count > 0) {
    warnings.push(
      `${analysis.cashMovements.supplierPayment.repairCandidates.count} cashMovements de supplier_payment pueden repararse automaticamente desde su pago origen.`,
    );
  }

  return {
    blockers,
    warnings,
    isReady: blockers.length === 0,
  };
};

const buildMigrationRiskScore = (analysis) =>
  (analysis.accountingSettings.exists ? 0 : 50) +
  (areBankAccountsRequired(analysis) && analysis.bankAccounts.activeCount === 0
    ? 25
    : 0) +
  analysis.purchases.missingPaymentStateOperational.count * 5 +
  analysis.purchases.missingPaymentTerms.count * 4 +
  analysis.purchases.invalidPaymentAt.count * 6 +
  analysis.purchases.baseCurrencyRateTypeMismatch.count * 4 +
  analysis.accountsPayable.baseCurrencyRateTypeMismatch.count * 6 +
  analysis.accountsPayable.bankLikeMissingBankAccount.count * 8 +
  analysis.accountsPayable.bankLikeUnknownBankAccount.count * 8 +
  analysis.cashMovements.supplierPayment.postedPaymentsMissingMovement.count * 12 +
  analysis.purchases.total;

const inspectPurchaseRolloutReadiness = ({
  businessId,
  purchases = [],
  accountsPayablePayments = [],
  accountingSettings = null,
  bankAccounts = [],
  cashMovements = [],
  sampleLimit = 25,
  generatedAt = new Date().toISOString(),
}) => {
  const normalizedPurchases = purchases.map((purchase) =>
    normalizePurchaseRecord(purchase),
  );
  const bankAccountIds = new Set(
    bankAccounts.map((account) => account.id).filter(Boolean),
  );
  const supplierPaymentCashMovements = cashMovements.filter(
    (movement) => toLowerString(movement.sourceType) === 'supplier_payment',
  );

  const missingPaymentState = [];
  const missingPaymentStateOperational = [];
  const missingPaymentStateCanceled = [];
  const missingPaymentTerms = [];
  const missingMonetary = [];
  const settledWithPaymentStateNextPaymentAt = [];
  const settledWithPaymentTermsNextPaymentAt = [];
  const baseCurrencyRateTypeMismatch = [];
  const invalidPaymentAt = [];
  const completedImmediateCashBackfillCandidates = [];
  const canceledLegacyTerminalStateCandidates = [];
  const invalidImmediateCashPaymentDateCandidates = [];
  const derivedPaymentTermsBackfillCandidates = [];
  const derivedPaymentStateBackfillCandidates = [];
  const legacyEnvelopePromotionCandidates = [];

  for (const purchase of normalizedPurchases) {
    const paymentState = toRecord(purchase.paymentState);
    const paymentTerms = toRecord(purchase.paymentTerms);
    const monetary = toRecord(purchase.monetary);
    const exchangeRateSnapshot = toRecord(monetary.exchangeRateSnapshot);
    const documentCurrency = normalizeCurrencyCode(monetary.documentCurrency);
    const functionalCurrency = normalizeCurrencyCode(monetary.functionalCurrency);
    const paymentStatus = toLowerString(paymentState.status);
    const purchaseStatus = toLowerString(purchase.status);
    const purchaseCondition =
      toLowerString(paymentTerms.condition) ?? toLowerString(purchase.condition);
    const paymentAtMillis = toMillis(
      purchase.paymentAt ?? toRecord(purchase.dates).paymentDate,
    );
    const completedAtMillis = toMillis(purchase.completedAt);
    const hasPayablePayments = accountsPayablePayments.some(
      (payment) => toCleanString(payment.purchaseId) === purchase.id,
    );
    const resolvedTotal = resolvePurchaseTotal(purchase);
    const derivedPaymentTerms = resolveDerivedPurchasePaymentTerms(purchase);
    const legacyEnvelopePromotionPatch = toRecord(
      purchase.__legacyEnvelopePromotionPatch,
    );

    if (Object.keys(legacyEnvelopePromotionPatch).length) {
      legacyEnvelopePromotionCandidates.push({
        id: purchase.id,
        updates: legacyEnvelopePromotionPatch,
      });
    }

    if (!Object.keys(paymentState).length) {
      missingPaymentState.push({ id: purchase.id });
      if (purchaseStatus === 'canceled') {
        missingPaymentStateCanceled.push({ id: purchase.id });
      } else {
        missingPaymentStateOperational.push({ id: purchase.id });
      }

      if (
        purchaseStatus === 'completed' &&
        purchaseCondition === 'cash' &&
        !hasPayablePayments &&
        resolvedTotal != null &&
        (paymentAtMillis != null || completedAtMillis != null)
      ) {
        completedImmediateCashBackfillCandidates.push({
          id: purchase.id,
          resolvedTotal,
          effectivePaymentAt: paymentAtMillis ?? completedAtMillis,
        });
      }

      if (
        purchaseStatus === 'canceled' &&
        purchaseCondition === 'cash' &&
        !hasPayablePayments &&
        !Object.keys(paymentTerms).length
      ) {
        canceledLegacyTerminalStateCandidates.push({ id: purchase.id });
      }

      const derivedPaymentState = buildDerivedMissingPaymentState({
        purchase,
        paymentTerms: derivedPaymentTerms,
        total: resolvedTotal,
      });
      if (
        derivedPaymentState &&
        !(
          purchaseStatus === 'completed' &&
          purchaseCondition === 'cash' &&
          !hasPayablePayments &&
          resolvedTotal != null &&
          (paymentAtMillis != null || completedAtMillis != null)
        ) &&
        !(
          purchaseStatus === 'canceled' &&
          purchaseCondition === 'cash' &&
          !hasPayablePayments &&
          !Object.keys(paymentTerms).length
        )
      ) {
        derivedPaymentStateBackfillCandidates.push({
          id: purchase.id,
          paymentState: derivedPaymentState,
        });
      }
    }

    if (!Object.keys(paymentTerms).length) {
      missingPaymentTerms.push({ id: purchase.id });
      if (
        derivedPaymentTerms.condition != null ||
        derivedPaymentTerms.expectedPaymentAt != null
      ) {
        derivedPaymentTermsBackfillCandidates.push({
          id: purchase.id,
          paymentTerms: derivedPaymentTerms,
        });
      }
    }

    if (!Object.keys(monetary).length) {
      missingMonetary.push({ id: purchase.id });
    }

    if (paymentStatus && SETTLED_STATUSES.has(paymentStatus)) {
      if (paymentState.nextPaymentAt != null) {
        settledWithPaymentStateNextPaymentAt.push({ id: purchase.id });
      }
      if (paymentTerms.nextPaymentAt != null) {
        settledWithPaymentTermsNextPaymentAt.push({ id: purchase.id });
      }
    }

    if (
      documentCurrency &&
      functionalCurrency &&
      documentCurrency === functionalCurrency &&
      exchangeRateSnapshot.rate != null &&
      toLowerString(exchangeRateSnapshot.rateType) !== 'buy'
    ) {
      baseCurrencyRateTypeMismatch.push({ id: purchase.id });
    }

    if (paymentAtMillis != null && paymentAtMillis < MIN_VALID_TRANSACTION_MILLIS) {
      invalidPaymentAt.push({ id: purchase.id });
      if (
        purchaseCondition === 'cash' &&
        purchaseStatus === 'pending' &&
        Object.keys(paymentState).length > 0
      ) {
        invalidImmediateCashPaymentDateCandidates.push({ id: purchase.id });
      }
    }
  }

  const cashMissingCashCountId = [];
  const bankLikeMissingBankAccount = [];
  const bankLikeUnknownBankAccount = [];
  const baseCurrencyRateTypeMismatchPayments = [];
  const bankLikePayments = [];
  const methodCountEntries = [];
  let voidCount = 0;

  for (const payment of accountsPayablePayments) {
    const status = toLowerString(payment.status);
    const exchangeRateSnapshot = toRecord(payment.exchangeRateSnapshot);
    const quoteCurrency = normalizeCurrencyCode(exchangeRateSnapshot.quoteCurrency);
    const baseCurrency = normalizeCurrencyCode(exchangeRateSnapshot.baseCurrency);
    const paymentRateType = toLowerString(exchangeRateSnapshot.rateType);
    if (status === 'void') voidCount += 1;
    if (
      quoteCurrency &&
      baseCurrency &&
      quoteCurrency === baseCurrency &&
      paymentRateType &&
      paymentRateType !== 'buy'
    ) {
      baseCurrencyRateTypeMismatchPayments.push({ id: payment.id });
    }

    const methodEntries =
      Array.isArray(payment.paymentMethods) && payment.paymentMethods.length
        ? payment.paymentMethods
        : [payment];

    for (const entry of methodEntries) {
      const method =
        toLowerString(toRecord(entry).method ?? payment.method) || 'unknown';
      methodCountEntries.push(method);
      const cashCountId =
        toCleanString(toRecord(entry).cashCountId) ??
        toCleanString(payment.cashCountId);
      const bankAccountId =
        toCleanString(toRecord(entry).bankAccountId) ??
        toCleanString(payment.bankAccountId);

      if (method === 'cash' && !cashCountId) {
        cashMissingCashCountId.push({ id: payment.id });
      }
      if (BANK_METHODS.has(method)) {
        bankLikePayments.push({ id: payment.id });
        if (!bankAccountId) {
          bankLikeMissingBankAccount.push({ id: payment.id });
        } else if (!bankAccountIds.has(bankAccountId)) {
          bankLikeUnknownBankAccount.push({ id: payment.id });
        }
      }
    }
  }

  const supplierPaymentMovementMethodEntries = [];
  const supplierPaymentMovementMissingCashCountId = [];
  const supplierPaymentMovementMissingBankAccountId = [];
  const supplierPaymentMovementUnknownBankAccountId = [];
  const supplierPaymentMovementOrphans = [];
  const supplierPaymentMovementRepairCandidates = [];
  const movementSourceIds = new Set();
  const validPaymentIds = new Set(
    accountsPayablePayments.map((payment) => payment.id).filter(Boolean),
  );
  const paymentById = new Map(
    accountsPayablePayments.map((payment) => [payment.id, payment]),
  );

  for (const movement of supplierPaymentCashMovements) {
    const method = toLowerString(movement.method) || 'unknown';
    supplierPaymentMovementMethodEntries.push(method);
    const cashCountId = toCleanString(movement.cashCountId);
    const bankAccountId = toCleanString(movement.bankAccountId);
    const sourceId = toCleanString(movement.sourceId);

    if (requiresCashCountId(movement) && !cashCountId) {
      supplierPaymentMovementMissingCashCountId.push({ id: movement.id });
    }
    if (requiresBankAccountId(movement)) {
      if (!bankAccountId) {
        supplierPaymentMovementMissingBankAccountId.push({ id: movement.id });
      } else if (!bankAccountIds.has(bankAccountId)) {
        supplierPaymentMovementUnknownBankAccountId.push({ id: movement.id });
      }
    }
    if (sourceId) {
      movementSourceIds.add(sourceId);
      if (!validPaymentIds.has(sourceId)) {
        supplierPaymentMovementOrphans.push({ id: movement.id });
      }
    }

    const sourcePayment = sourceId ? paymentById.get(sourceId) : null;
    const paymentMethods =
      Array.isArray(sourcePayment?.paymentMethods) && sourcePayment.paymentMethods.length
        ? sourcePayment.paymentMethods
        : [];
    const methodIndex = Number(toRecord(movement.metadata).paymentMethodIndex);
    const sourceMethod = Number.isInteger(methodIndex)
      ? toRecord(paymentMethods[methodIndex])
      : {};
    const repairPatch = {};

    if (requiresCashCountId(movement) && !cashCountId) {
      const repairedCashCountId =
        toCleanString(sourceMethod.cashCountId) ??
        toCleanString(sourcePayment?.cashCountId);
      if (repairedCashCountId) {
        repairPatch.cashCountId = repairedCashCountId;
      }
    }

    if (requiresBankAccountId(movement) && !bankAccountId) {
      const repairedBankAccountId =
        toCleanString(sourceMethod.bankAccountId) ??
        toCleanString(sourcePayment?.bankAccountId);
      if (repairedBankAccountId) {
        repairPatch.bankAccountId = repairedBankAccountId;
      }
    }

    if (Object.keys(repairPatch).length > 0) {
      supplierPaymentMovementRepairCandidates.push({
        id: movement.id,
        updates: repairPatch,
      });
    }
  }

  const postedPaymentsMissingMovement = accountsPayablePayments
    .filter((payment) => {
      const status = toLowerString(payment.status);
      return !status || status === 'posted';
    })
    .filter((payment) => !movementSourceIds.has(payment.id))
    .map((payment) => ({ id: payment.id }));

  const accountingSettingsRecord = toRecord(accountingSettings);
  const activeBankAccounts = bankAccounts.filter(isActiveBankAccount);
  const analysis = {
    businessId,
    generatedAt,
    accountingSettings: {
      exists: Object.keys(accountingSettingsRecord).length > 0,
      functionalCurrency: normalizeCurrencyCode(
        accountingSettingsRecord.functionalCurrency,
      ),
      documentCurrencies: normalizeDocumentCurrencies(
        accountingSettingsRecord.documentCurrencies,
      ),
      bankAccountsEnabled:
        typeof accountingSettingsRecord.bankAccountsEnabled === 'boolean'
          ? accountingSettingsRecord.bankAccountsEnabled
          : null,
      bankPaymentPolicy: normalizeBankPaymentPolicy(
        accountingSettingsRecord.bankPaymentPolicy,
      ),
    },
    bankAccounts: {
      total: bankAccounts.length,
      activeCount: activeBankAccounts.length,
      inactiveCount: bankAccounts.length - activeBankAccounts.length,
    },
    purchases: {
      total: normalizedPurchases.length,
      missingPaymentState: {
        count: missingPaymentState.length,
        sampleIds: toSample(missingPaymentState, sampleLimit),
      },
      missingPaymentStateOperational: {
        count: missingPaymentStateOperational.length,
        sampleIds: toSample(missingPaymentStateOperational, sampleLimit),
      },
      missingPaymentStateCanceled: {
        count: missingPaymentStateCanceled.length,
        sampleIds: toSample(missingPaymentStateCanceled, sampleLimit),
      },
      completedImmediateCashBackfillCandidates: {
        count: completedImmediateCashBackfillCandidates.length,
        sampleIds: toSample(
          completedImmediateCashBackfillCandidates,
          sampleLimit,
        ),
      },
      canceledLegacyTerminalStateCandidates: {
        count: canceledLegacyTerminalStateCandidates.length,
        sampleIds: toSample(
          canceledLegacyTerminalStateCandidates,
          sampleLimit,
        ),
      },
      missingPaymentTerms: {
        count: missingPaymentTerms.length,
        sampleIds: toSample(missingPaymentTerms, sampleLimit),
      },
      missingMonetary: {
        count: missingMonetary.length,
        sampleIds: toSample(missingMonetary, sampleLimit),
      },
      settledWithPaymentStateNextPaymentAt: {
        count: settledWithPaymentStateNextPaymentAt.length,
        sampleIds: toSample(settledWithPaymentStateNextPaymentAt, sampleLimit),
      },
      settledWithPaymentTermsNextPaymentAt: {
        count: settledWithPaymentTermsNextPaymentAt.length,
        sampleIds: toSample(settledWithPaymentTermsNextPaymentAt, sampleLimit),
      },
      baseCurrencyRateTypeMismatch: {
        count: baseCurrencyRateTypeMismatch.length,
        sampleIds: toSample(baseCurrencyRateTypeMismatch, sampleLimit),
      },
      invalidPaymentAt: {
        count: invalidPaymentAt.length,
        sampleIds: toSample(invalidPaymentAt, sampleLimit),
      },
      invalidImmediateCashPaymentDateCandidates: {
        count: invalidImmediateCashPaymentDateCandidates.length,
        sampleIds: toSample(
          invalidImmediateCashPaymentDateCandidates,
          sampleLimit,
        ),
      },
    },
    accountsPayable: {
      total: accountsPayablePayments.length,
      methodCounts: countBy(methodCountEntries, (item) => item),
      bankLikePayments: {
        count: bankLikePayments.length,
        sampleIds: toSample(bankLikePayments, sampleLimit),
      },
      cashMissingCashCountId: {
        count: cashMissingCashCountId.length,
        sampleIds: toSample(cashMissingCashCountId, sampleLimit),
      },
      bankLikeMissingBankAccount: {
        count: bankLikeMissingBankAccount.length,
        sampleIds: toSample(bankLikeMissingBankAccount, sampleLimit),
      },
      bankLikeUnknownBankAccount: {
        count: bankLikeUnknownBankAccount.length,
        sampleIds: toSample(bankLikeUnknownBankAccount, sampleLimit),
      },
      baseCurrencyRateTypeMismatch: {
        count: baseCurrencyRateTypeMismatchPayments.length,
        sampleIds: toSample(baseCurrencyRateTypeMismatchPayments, sampleLimit),
      },
      voidCount,
    },
    cashMovements: {
      supplierPayment: {
        total: supplierPaymentCashMovements.length,
        methodCounts: countBy(
          supplierPaymentMovementMethodEntries,
          (item) => item,
        ),
        missingCashCountId: {
          count: supplierPaymentMovementMissingCashCountId.length,
          sampleIds: toSample(
            supplierPaymentMovementMissingCashCountId,
            sampleLimit,
          ),
        },
        missingBankAccountId: {
          count: supplierPaymentMovementMissingBankAccountId.length,
          sampleIds: toSample(
            supplierPaymentMovementMissingBankAccountId,
            sampleLimit,
          ),
        },
        unknownBankAccountId: {
          count: supplierPaymentMovementUnknownBankAccountId.length,
          sampleIds: toSample(
            supplierPaymentMovementUnknownBankAccountId,
            sampleLimit,
          ),
        },
        postedPaymentsMissingMovement: {
          count: postedPaymentsMissingMovement.length,
          sampleIds: toSample(postedPaymentsMissingMovement, sampleLimit),
        },
        orphanMovements: {
          count: supplierPaymentMovementOrphans.length,
          sampleIds: toSample(supplierPaymentMovementOrphans, sampleLimit),
        },
        repairCandidates: {
          count: supplierPaymentMovementRepairCandidates.length,
          sampleIds: toSample(
            supplierPaymentMovementRepairCandidates,
            sampleLimit,
          ),
        },
      },
    },
  };

  analysis.accountingSettings.bankingMode = resolveBankingMode(analysis);
  analysis.accountingSettings.bankAccountsRequired =
    areBankAccountsRequired(analysis);

  const readiness = buildReadiness(analysis);
  analysis.readiness = readiness;

  return {
    analysis,
    findings: {
      settledWithPaymentStateNextPaymentAt,
      settledWithPaymentTermsNextPaymentAt,
      baseCurrencyRateTypeMismatch,
      baseCurrencyRateTypeMismatchPayments,
      derivedPaymentTermsBackfillCandidates,
      derivedPaymentStateBackfillCandidates,
      legacyEnvelopePromotionCandidates,
      completedImmediateCashBackfillCandidates,
      canceledLegacyTerminalStateCandidates,
      invalidImmediateCashPaymentDateCandidates,
      supplierPaymentMovementRepairCandidates,
    },
    riskScore: buildMigrationRiskScore(analysis),
  };
};

const buildPurchaseRolloutMarkdown = ({
  businessId,
  analysis,
  outputDir,
  writeSummary,
  analysisBeforeWrite = null,
}) => {
  const readiness = analysis.readiness ?? buildReadiness(analysis);
  const beforeReadiness =
    analysisBeforeWrite?.readiness ??
    (analysisBeforeWrite ? buildReadiness(analysisBeforeWrite) : null);
  const reaudited =
    Boolean(writeSummary?.reaudited) && Boolean(analysisBeforeWrite);

  return `# Purchase Rollout Readiness\n\n` +
    `- Business ID: ${businessId}\n` +
    `- Output dir: ${outputDir}\n` +
    `- Purchases scanned: ${analysis.purchases.total}\n` +
    `- Accounts payable payments scanned: ${analysis.accountsPayable.total}\n` +
    `- Supplier-payment cashMovements scanned: ${analysis.cashMovements.supplierPayment.total}\n` +
    `- Ready to migrate: ${readiness.isReady}\n\n` +
    `## Blockers\n${formatList(readiness.blockers)}\n\n` +
    `## Warnings\n${formatList(readiness.warnings)}\n\n` +
    `## Purchases\n` +
    `- Missing paymentState operational: ${analysis.purchases.missingPaymentStateOperational.count}\n` +
    `- Missing paymentTerms: ${analysis.purchases.missingPaymentTerms.count}\n` +
    `- Missing monetary: ${analysis.purchases.missingMonetary.count}\n` +
    `- Invalid paymentAt values: ${analysis.purchases.invalidPaymentAt.count}\n` +
    `- Settled with paymentState.nextPaymentAt: ${analysis.purchases.settledWithPaymentStateNextPaymentAt.count}\n` +
    `- Settled with paymentTerms.nextPaymentAt: ${analysis.purchases.settledWithPaymentTermsNextPaymentAt.count}\n` +
    `- Base-currency rateType mismatches: ${analysis.purchases.baseCurrencyRateTypeMismatch.count}\n\n` +
    `## Accounts Payable\n` +
    `- Total payments: ${analysis.accountsPayable.total}\n` +
    `- Method counts: ${JSON.stringify(analysis.accountsPayable.methodCounts)}\n` +
    `- Base-currency rateType mismatches: ${analysis.accountsPayable.baseCurrencyRateTypeMismatch.count}\n` +
    `- Bank-like payments missing bankAccountId: ${analysis.accountsPayable.bankLikeMissingBankAccount.count}\n` +
    `- Bank-like payments with unknown bankAccountId: ${analysis.accountsPayable.bankLikeUnknownBankAccount.count}\n\n` +
    `## Bank Accounts\n` +
    `- Total bankAccounts: ${analysis.bankAccounts.total}\n` +
    `- Active bankAccounts: ${analysis.bankAccounts.activeCount}\n` +
    `- Bank accounts required: ${analysis.accountingSettings.bankAccountsRequired}\n\n` +
    `## Cash Movements\n` +
    `- supplier_payment total: ${analysis.cashMovements.supplierPayment.total}\n` +
    `- supplier_payment posted payments without movement: ${analysis.cashMovements.supplierPayment.postedPaymentsMissingMovement.count}\n` +
    `- supplier_payment missing bankAccountId: ${analysis.cashMovements.supplierPayment.missingBankAccountId.count}\n` +
    `- supplier_payment missing cashCountId: ${analysis.cashMovements.supplierPayment.missingCashCountId.count}\n` +
    `- supplier_payment repair candidates: ${analysis.cashMovements.supplierPayment.repairCandidates.count}\n\n` +
    `## Accounting settings\n` +
    `- Exists: ${analysis.accountingSettings.exists}\n` +
    `- Functional currency: ${analysis.accountingSettings.functionalCurrency || 'n/a'}\n` +
    `- Document currencies: ${analysis.accountingSettings.documentCurrencies.join(', ') || 'n/a'}\n` +
    `- Banking mode: ${analysis.accountingSettings.bankingMode}\n` +
    `- Bank accounts enabled: ${analysis.accountingSettings.bankAccountsEnabled}\n` +
    `- Bank payment policy configured: ${analysis.accountingSettings.bankPaymentPolicy.configured}\n` +
    `- Bank payment policy mode: ${analysis.accountingSettings.bankPaymentPolicy.mode || 'n/a'}\n\n` +
    `## Samples\n` +
    `- Missing paymentState operational: ${JSON.stringify(analysis.purchases.missingPaymentStateOperational.sampleIds)}\n` +
    `- Missing paymentTerms: ${JSON.stringify(analysis.purchases.missingPaymentTerms.sampleIds)}\n` +
    `- Invalid paymentAt values: ${JSON.stringify(analysis.purchases.invalidPaymentAt.sampleIds)}\n` +
    `- Accounts payable rateType mismatches: ${JSON.stringify(analysis.accountsPayable.baseCurrencyRateTypeMismatch.sampleIds)}\n` +
    `- supplier_payment posted payments without movement: ${JSON.stringify(analysis.cashMovements.supplierPayment.postedPaymentsMissingMovement.sampleIds)}\n` +
    `- supplier_payment repair candidates: ${JSON.stringify(analysis.cashMovements.supplierPayment.repairCandidates.sampleIds)}\n\n` +
    (reaudited
      ? `## Re-audit\n` +
        `- Reaudited after write: true\n` +
        `- Blockers before write: ${beforeReadiness.blockers.length}\n` +
        `- Blockers after write: ${readiness.blockers.length}\n\n`
      : '') +
    `## Write summary\n` +
    `- Enabled: ${writeSummary.enabled}\n` +
    `- Reaudited after write: ${writeSummary.reaudited}\n` +
    `- Updated docs: ${writeSummary.updatedCount}\n` +
    `- Targeted docs: ${writeSummary.targetCount}\n` +
    `- paymentState.nextPaymentAt targets: ${writeSummary.fixPaidNextPaymentAt.targetCount}\n` +
    `- paymentState.nextPaymentAt updates: ${writeSummary.fixPaidNextPaymentAt.updatedCount}\n` +
    `- paymentTerms.nextPaymentAt targets: ${writeSummary.fixSettledPaymentTermsNextPaymentAt.targetCount}\n` +
    `- paymentTerms.nextPaymentAt updates: ${writeSummary.fixSettledPaymentTermsNextPaymentAt.updatedCount}\n` +
    `- base-currency rateType targets: ${writeSummary.fixBaseCurrencyRateType.targetCount}\n` +
    `- base-currency rateType updates: ${writeSummary.fixBaseCurrencyRateType.updatedCount}\n` +
    `- legacy envelope normalization targets: ${writeSummary.normalizeLegacyPurchaseEnvelope.targetCount}\n` +
    `- legacy envelope normalization updates: ${writeSummary.normalizeLegacyPurchaseEnvelope.updatedCount}\n` +
    `- derived paymentTerms targets: ${writeSummary.backfillDerivedPaymentTerms.targetCount}\n` +
    `- derived paymentTerms updates: ${writeSummary.backfillDerivedPaymentTerms.updatedCount}\n` +
    `- derived paymentState targets: ${writeSummary.backfillDerivedPaymentState.targetCount}\n` +
    `- derived paymentState updates: ${writeSummary.backfillDerivedPaymentState.updatedCount}\n` +
    `- completed immediate-cash paymentState targets: ${writeSummary.backfillCompletedImmediateCashPaymentState.targetCount}\n` +
    `- completed immediate-cash paymentState updates: ${writeSummary.backfillCompletedImmediateCashPaymentState.updatedCount}\n` +
    `- canceled legacy terminal-state targets: ${writeSummary.backfillCanceledLegacyTerminalState.targetCount}\n` +
    `- canceled legacy terminal-state updates: ${writeSummary.backfillCanceledLegacyTerminalState.updatedCount}\n` +
    `- invalid immediate-cash date targets: ${writeSummary.fixInvalidImmediateCashPaymentDates.targetCount}\n` +
    `- invalid immediate-cash date updates: ${writeSummary.fixInvalidImmediateCashPaymentDates.updatedCount}\n` +
    `- accountsPayable rateType targets: ${writeSummary.fixAccountsPayableBaseCurrencyRateType.targetCount}\n` +
    `- accountsPayable rateType updates: ${writeSummary.fixAccountsPayableBaseCurrencyRateType.updatedCount}\n` +
    `- supplier_payment cashMovement refs targets: ${writeSummary.fixSupplierPaymentCashMovementRefs.targetCount}\n` +
    `- supplier_payment cashMovement refs updates: ${writeSummary.fixSupplierPaymentCashMovementRefs.updatedCount}\n`;
};

export {
  buildMigrationRiskScore,
  buildPurchaseRolloutMarkdown,
  inspectPurchaseRolloutReadiness,
};
