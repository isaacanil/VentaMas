const THRESHOLD = 0.01;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const resolveCurrencyCode = (value) => {
  const record = asRecord(value);
  const rawValue = record.code ?? value;
  if (typeof rawValue !== 'string') {
    return null;
  }
  const normalized = rawValue.trim().toUpperCase();
  return normalized.length ? normalized : null;
};

const resolveTotalsRecord = (monetary, key) => asRecord(asRecord(monetary)[key]);

export const resolveDocumentAmount = (monetary, field) =>
  roundToTwoDecimals(resolveTotalsRecord(monetary, 'documentTotals')[field]);

export const resolveFunctionalAmount = (monetary, field) =>
  roundToTwoDecimals(resolveTotalsRecord(monetary, 'functionalTotals')[field]);

const cloneSnapshot = (sourceMonetary, overrides = {}) => {
  const source = asRecord(sourceMonetary);
  if (!Object.keys(source).length) {
    return null;
  }

  return {
    ...source,
    ...overrides,
  };
};

export const buildReceivableMonetarySnapshotFromSource = ({
  sourceMonetary,
  documentTotal,
}) => {
  const source = asRecord(sourceMonetary);
  if (!Object.keys(source).length) {
    return null;
  }

  const normalizedDocumentTotal = roundToTwoDecimals(documentTotal);
  if (normalizedDocumentTotal <= THRESHOLD) {
    return null;
  }

  const sourceDocumentTotal = roundToTwoDecimals(
    resolveDocumentAmount(source, 'balance') ||
      resolveDocumentAmount(source, 'total'),
  );
  const sourceFunctionalTotal = roundToTwoDecimals(
    resolveFunctionalAmount(source, 'balance') ||
      resolveFunctionalAmount(source, 'total'),
  );
  const functionalTotal =
    sourceDocumentTotal <= THRESHOLD
      ? normalizedDocumentTotal
      : normalizedDocumentTotal + THRESHOLD >= sourceDocumentTotal
        ? sourceFunctionalTotal
        : roundToTwoDecimals(
          (sourceFunctionalTotal * normalizedDocumentTotal) / sourceDocumentTotal,
        );

  return cloneSnapshot(source, {
    documentTotals: {
      subtotal: normalizedDocumentTotal,
      discount: 0,
      taxes: 0,
      total: normalizedDocumentTotal,
      paid: 0,
      balance: normalizedDocumentTotal,
    },
    functionalTotals: {
      subtotal: functionalTotal,
      discount: 0,
      taxes: 0,
      total: functionalTotal,
      paid: 0,
      balance: functionalTotal,
    },
  });
};

export const applyReceivableMonetarySettlement = ({
  accountMonetary,
  appliedDocumentAmount,
}) => {
  const source = asRecord(accountMonetary);
  if (!Object.keys(source).length) {
    return {
      nextMonetary: null,
      historicalFunctionalAmount: 0,
    };
  }

  const documentTotal = roundToTwoDecimals(resolveDocumentAmount(source, 'total'));
  const documentPaid = roundToTwoDecimals(resolveDocumentAmount(source, 'paid'));
  const documentBalance = roundToTwoDecimals(
    resolveDocumentAmount(source, 'balance') ||
      Math.max(documentTotal - documentPaid, 0),
  );
  const functionalTotal = roundToTwoDecimals(
    resolveFunctionalAmount(source, 'total'),
  );
  const functionalPaid = roundToTwoDecimals(resolveFunctionalAmount(source, 'paid'));
  const functionalBalance = roundToTwoDecimals(
    resolveFunctionalAmount(source, 'balance') ||
      Math.max(functionalTotal - functionalPaid, 0),
  );
  const normalizedAppliedDocumentAmount = roundToTwoDecimals(appliedDocumentAmount);
  if (
    normalizedAppliedDocumentAmount <= THRESHOLD ||
    documentBalance <= THRESHOLD
  ) {
    return {
      nextMonetary: source,
      historicalFunctionalAmount: 0,
    };
  }

  const historicalFunctionalAmount =
    normalizedAppliedDocumentAmount + THRESHOLD >= documentBalance
      ? functionalBalance
      : roundToTwoDecimals(
        (functionalBalance * normalizedAppliedDocumentAmount) / documentBalance,
      );
  const nextDocumentBalance = roundToTwoDecimals(
    Math.max(documentBalance - normalizedAppliedDocumentAmount, 0),
  );
  const nextFunctionalBalance = roundToTwoDecimals(
    Math.max(functionalBalance - historicalFunctionalAmount, 0),
  );

  return {
    nextMonetary: cloneSnapshot(source, {
      documentTotals: {
        ...resolveTotalsRecord(source, 'documentTotals'),
        total: documentTotal,
        paid: roundToTwoDecimals(documentPaid + normalizedAppliedDocumentAmount),
        balance: nextDocumentBalance,
      },
      functionalTotals: {
        ...resolveTotalsRecord(source, 'functionalTotals'),
        total: functionalTotal,
        paid: roundToTwoDecimals(functionalPaid + historicalFunctionalAmount),
        balance: nextFunctionalBalance,
      },
    }),
    historicalFunctionalAmount,
  };
};

export const reverseReceivableMonetarySettlement = ({
  accountMonetary,
  restoredDocumentAmount,
  restoredHistoricalFunctionalAmount,
}) => {
  const source = asRecord(accountMonetary);
  if (!Object.keys(source).length) {
    return {
      nextMonetary: null,
    };
  }

  const documentTotal = roundToTwoDecimals(resolveDocumentAmount(source, 'total'));
  const documentPaid = roundToTwoDecimals(resolveDocumentAmount(source, 'paid'));
  const documentBalance = roundToTwoDecimals(resolveDocumentAmount(source, 'balance'));
  const functionalTotal = roundToTwoDecimals(
    resolveFunctionalAmount(source, 'total'),
  );
  const functionalPaid = roundToTwoDecimals(resolveFunctionalAmount(source, 'paid'));
  const functionalBalance = roundToTwoDecimals(resolveFunctionalAmount(source, 'balance'));

  const normalizedRestoredDocumentAmount = roundToTwoDecimals(restoredDocumentAmount);
  const normalizedRestoredHistoricalFunctionalAmount = roundToTwoDecimals(
    restoredHistoricalFunctionalAmount,
  );

  return {
    nextMonetary: cloneSnapshot(source, {
      documentTotals: {
        ...resolveTotalsRecord(source, 'documentTotals'),
        total: documentTotal,
        paid: roundToTwoDecimals(
          Math.max(documentPaid - normalizedRestoredDocumentAmount, 0),
        ),
        balance: roundToTwoDecimals(
          Math.min(documentBalance + normalizedRestoredDocumentAmount, documentTotal),
        ),
      },
      functionalTotals: {
        ...resolveTotalsRecord(source, 'functionalTotals'),
        total: functionalTotal,
        paid: roundToTwoDecimals(
          Math.max(functionalPaid - normalizedRestoredHistoricalFunctionalAmount, 0),
        ),
        balance: roundToTwoDecimals(
          Math.min(
            functionalBalance + normalizedRestoredHistoricalFunctionalAmount,
            functionalTotal,
          ),
        ),
      },
    }),
  };
};

export const resolvePaymentAppliedDocumentAmount = ({
  pilotMonetarySnapshot,
  fallbackAmount,
}) => {
  const monetary = asRecord(pilotMonetarySnapshot);
  const documentAmount = roundToTwoDecimals(resolveDocumentAmount(monetary, 'total'));
  return documentAmount > THRESHOLD
    ? documentAmount
    : roundToTwoDecimals(fallbackAmount);
};

export const resolvePaymentCollectedFunctionalAmount = ({
  pilotMonetarySnapshot,
  fallbackAmount,
}) => {
  const monetary = asRecord(pilotMonetarySnapshot);
  const functionalAmount = roundToTwoDecimals(
    resolveFunctionalAmount(monetary, 'total'),
  );
  if (functionalAmount > THRESHOLD) {
    return functionalAmount;
  }

  const documentAmount = roundToTwoDecimals(resolveDocumentAmount(monetary, 'total'));
  return documentAmount > THRESHOLD
    ? documentAmount
    : roundToTwoDecimals(fallbackAmount);
};

export const shouldTrackFxSettlement = ({
  accountMonetary,
  paymentMonetary,
}) => {
  const accountDocumentCurrency = resolveCurrencyCode(
    asRecord(accountMonetary).documentCurrency,
  );
  const accountFunctionalCurrency = resolveCurrencyCode(
    asRecord(accountMonetary).functionalCurrency,
  );
  const paymentDocumentCurrency = resolveCurrencyCode(
    asRecord(paymentMonetary).documentCurrency,
  );
  const paymentFunctionalCurrency = resolveCurrencyCode(
    asRecord(paymentMonetary).functionalCurrency,
  );

  return (
    (accountDocumentCurrency &&
      accountFunctionalCurrency &&
      accountDocumentCurrency !== accountFunctionalCurrency) ||
    (paymentDocumentCurrency &&
      paymentFunctionalCurrency &&
      paymentDocumentCurrency !== paymentFunctionalCurrency)
  );
};

export const allocateFunctionalAmountsByDocument = ({
  entries,
  totalFunctionalAmount,
  amountField = 'totalPaid',
}) => {
  const normalizedEntries = Array.isArray(entries)
    ? entries.map((entry) => asRecord(entry))
    : [];
  const totalDocumentAmount = roundToTwoDecimals(
    normalizedEntries.reduce(
      (sum, entry) => sum + roundToTwoDecimals(entry[amountField]),
      0,
    ),
  );
  const normalizedTotalFunctionalAmount = roundToTwoDecimals(totalFunctionalAmount);
  if (
    normalizedTotalFunctionalAmount <= THRESHOLD ||
    totalDocumentAmount <= THRESHOLD ||
    !normalizedEntries.length
  ) {
    return normalizedEntries.map(() => 0);
  }

  let remainingFunctionalAmount = normalizedTotalFunctionalAmount;
  return normalizedEntries.map((entry, index) => {
    if (index === normalizedEntries.length - 1) {
      return roundToTwoDecimals(Math.max(remainingFunctionalAmount, 0));
    }

    const documentAmount = roundToTwoDecimals(entry[amountField]);
    const allocatedAmount = roundToTwoDecimals(
      (normalizedTotalFunctionalAmount * documentAmount) / totalDocumentAmount,
    );
    remainingFunctionalAmount = roundToTwoDecimals(
      remainingFunctionalAmount - allocatedAmount,
    );
    return allocatedAmount;
  });
};

export const buildReceivableFxSettlementRecord = ({
  businessId,
  paymentId,
  arId,
  invoiceId = null,
  clientId = null,
  accountMonetaryBefore,
  accountMonetaryAfter,
  paymentMonetary,
  appliedDocumentAmount,
  historicalFunctionalAmount,
  settlementFunctionalAmount,
  occurredAt,
  createdAt,
  createdBy,
}) => {
  const fxGainLossAmount = roundToTwoDecimals(
    settlementFunctionalAmount - historicalFunctionalAmount,
  );
  return {
    id: `${paymentId}_${arId}`,
    businessId,
    paymentId,
    arId,
    invoiceId,
    clientId,
    status: 'posted',
    documentCurrency: resolveCurrencyCode(asRecord(accountMonetaryBefore).documentCurrency),
    functionalCurrency: resolveCurrencyCode(
      asRecord(accountMonetaryBefore).functionalCurrency,
    ),
    appliedDocumentAmount: roundToTwoDecimals(appliedDocumentAmount),
    historicalFunctionalAmount: roundToTwoDecimals(historicalFunctionalAmount),
    settlementFunctionalAmount: roundToTwoDecimals(settlementFunctionalAmount),
    fxGainLossAmount,
    fxDirection:
      fxGainLossAmount > THRESHOLD
        ? 'gain'
        : fxGainLossAmount < -THRESHOLD
          ? 'loss'
          : 'none',
    accountMonetaryBefore,
    accountMonetaryAfter,
    paymentMonetary,
    occurredAt,
    createdAt,
    updatedAt: createdAt,
    createdBy,
    updatedBy: createdBy,
  };
};
