import { DateTime } from 'luxon';

import {
  getThresholdsForReceiptType,
  getAlertMessage,
  FISCAL_RECEIPTS_ALERT_CONFIG,
} from '@/config/fiscalReceiptsAlertConfig';
import type {
  FiscalAlertsConfig,
  FiscalAlertThresholds,
} from '@/firebase/Settings/fiscalAlertsConfig/types';
import type {
  TaxReceiptAuthorizationEntry,
  TaxReceiptData,
  TaxReceiptDocument,
} from '@/types/taxReceipt';

type FiscalAlertLevel = 'critical' | 'warning' | 'normal';
type FiscalAlertReason = 'quantity' | 'expiration';

type FiscalReceiptStatus = {
  id?: string;
  name: string;
  series: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
  totalNumbers: number;
  usedNumbers: number;
  remainingNumbers: number;
  percentageUsed: number;
  percentageRemaining: number;
  alertLevel: FiscalAlertLevel;
  quantityAlertLevel: FiscalAlertLevel;
  expirationAlertLevel: FiscalAlertLevel;
  alertReasons: FiscalAlertReason[];
  primaryAlertReason: FiscalAlertReason | null;
  disabled: boolean;
  isActive: boolean;
  needsAttention: boolean;
  thresholds: FiscalAlertThresholds;
  expirationThresholds: FiscalAlertThresholds;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
};

const ALERT_SEVERITY: Record<FiscalAlertLevel, number> = {
  normal: 0,
  warning: 1,
  critical: 2,
};

const getValidNumber = (
  value: number | string | null | undefined,
  fallback = 0,
) => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeThresholds = (
  value: Partial<FiscalAlertThresholds> | null | undefined,
  fallback: FiscalAlertThresholds,
): FiscalAlertThresholds => {
  const warning = Math.max(1, getValidNumber(value?.warning, fallback.warning));
  const critical = Math.min(
    Math.max(1, getValidNumber(value?.critical, fallback.critical)),
    Math.max(warning - 1, 1),
  );

  return { warning, critical };
};

const resolveExpirationInfo = (
  authorizations?: TaxReceiptAuthorizationEntry[],
): { expirationDate: string | null; daysUntilExpiration: number | null } => {
  if (!Array.isArray(authorizations) || authorizations.length === 0) {
    return {
      expirationDate: null,
      daysUntilExpiration: null,
    };
  }

  const today = DateTime.now().startOf('day');
  const parsedAuthorizations = authorizations
    .map((authorization) => {
      const expiration = DateTime.fromISO(authorization.expirationDate);
      if (!expiration.isValid) return null;

      return {
        expirationDate: authorization.expirationDate,
        expiration,
      };
    })
    .filter(
      (
        item,
      ): item is { expirationDate: string; expiration: DateTime } => item !== null,
    );

  if (parsedAuthorizations.length === 0) {
    return {
      expirationDate: null,
      daysUntilExpiration: null,
    };
  }

  const upcoming = parsedAuthorizations.filter(
    ({ expiration }) => expiration.endOf('day').toMillis() >= today.toMillis(),
  );

  const target = (upcoming.length > 0 ? upcoming : parsedAuthorizations).reduce(
    (closest, current) =>
      current.expiration.toMillis() < closest.expiration.toMillis()
        ? current
        : closest,
  );

  return {
    expirationDate: target.expirationDate,
    daysUntilExpiration: Math.floor(
      target.expiration.endOf('day').diff(today, 'days').days,
    ),
  };
};

const compareReceiptPriority = (
  current: FiscalReceiptStatus,
  candidate: FiscalReceiptStatus,
) => {
  const currentSeverity = ALERT_SEVERITY[current.alertLevel];
  const candidateSeverity = ALERT_SEVERITY[candidate.alertLevel];

  if (candidateSeverity !== currentSeverity) {
    return candidateSeverity > currentSeverity ? candidate : current;
  }

  if (candidate.primaryAlertReason === 'expiration') {
    if (
      current.primaryAlertReason !== 'expiration' ||
      (candidate.daysUntilExpiration ?? Number.POSITIVE_INFINITY) <
        (current.daysUntilExpiration ?? Number.POSITIVE_INFINITY)
    ) {
      return candidate;
    }
  }

  if (
    candidate.remainingNumbers < current.remainingNumbers ||
    current.primaryAlertReason === 'expiration'
  ) {
    return candidate;
  }

  return current;
};

export const resolveFiscalReceiptAlertKey = (receipt: TaxReceiptDocument) => {
  if (!receipt?.data) return null;

  const {
    id: documentId,
    data: { id: dataId, type, serie, series, fiscalSeries, name } = {},
  } = receipt;

  const seriesCode = fiscalSeries || serie || series;

  return (
    [
      documentId,
      dataId,
      type && seriesCode ? `${type}:${seriesCode}` : null,
      name,
    ].find(
      (candidate) =>
        typeof candidate === 'string' && candidate.trim().length > 0,
    ) ?? null
  );
};

export const FISCAL_RECEIPTS_CONFIG = {
  DEFAULT_WARNING_THRESHOLD:
    FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_WARNING_THRESHOLD,
  DEFAULT_CRITICAL_THRESHOLD:
    FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_CRITICAL_THRESHOLD,
};

export const calculateReceiptStatus = (
  receipt: TaxReceiptDocument,
  alertConfig: FiscalAlertsConfig | null = null,
) => {
  if (!receipt?.data) return null;

  const { data } = receipt;
  const {
    name = 'N/A',
    series = 'N/A',
    startNumber = 0,
    endNumber = 0,
    currentNumber = 0,
    quantity = 0,
    disabled = false,
  } = data as TaxReceiptData;

  const monitoring = alertConfig?.monitoring ?? {
    quantityEnabled: true,
    expirationEnabled: true,
  };

  const quantityKey = resolveFiscalReceiptAlertKey(receipt);
  const defaultQuantityThresholds = getThresholdsForReceiptType(name);
  const thresholds = normalizeThresholds(
    (quantityKey && alertConfig?.customThresholds?.[quantityKey]) ||
      alertConfig?.customThresholds?.[name] ||
      alertConfig?.globalThresholds,
    defaultQuantityThresholds,
  );

  const expirationThresholds = normalizeThresholds(
    (quantityKey && alertConfig?.customExpirationThresholds?.[quantityKey]) ||
      alertConfig?.customExpirationThresholds?.[name] ||
      alertConfig?.expirationThresholds,
    {
      warning: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_EXPIRATION_WARNING_DAYS,
      critical: FISCAL_RECEIPTS_ALERT_CONFIG.DEFAULT_EXPIRATION_CRITICAL_DAYS,
    },
  );

  const remainingNumbers = getValidNumber(quantity);
  const totalNumbers = Math.max(endNumber - startNumber + 1, 0);
  const usedNumbers = Math.max(totalNumbers - remainingNumbers, 0);
  const percentageUsed =
    totalNumbers > 0 ? Math.round((usedNumbers / totalNumbers) * 100) : 0;
  const percentageRemaining = 100 - percentageUsed;

  let quantityAlertLevel: FiscalAlertLevel = 'normal';

  if (monitoring.quantityEnabled) {
    if (remainingNumbers <= thresholds.critical) {
      quantityAlertLevel = 'critical';
    } else if (remainingNumbers <= thresholds.warning) {
      quantityAlertLevel = 'warning';
    }
  }

  const { expirationDate, daysUntilExpiration } = resolveExpirationInfo(
    data.authorizations,
  );

  let expirationAlertLevel: FiscalAlertLevel = 'normal';

  if (
    monitoring.expirationEnabled &&
    typeof daysUntilExpiration === 'number' &&
    Number.isFinite(daysUntilExpiration)
  ) {
    if (daysUntilExpiration <= expirationThresholds.critical) {
      expirationAlertLevel = 'critical';
    } else if (daysUntilExpiration <= expirationThresholds.warning) {
      expirationAlertLevel = 'warning';
    }
  }

  const alertReasons: FiscalAlertReason[] = [];

  if (quantityAlertLevel !== 'normal') {
    alertReasons.push('quantity');
  }

  if (expirationAlertLevel !== 'normal') {
    alertReasons.push('expiration');
  }

  const alertLevel =
    ALERT_SEVERITY[quantityAlertLevel] >= ALERT_SEVERITY[expirationAlertLevel]
      ? quantityAlertLevel
      : expirationAlertLevel;

  const primaryAlertReason =
    expirationAlertLevel === 'critical' ||
    (expirationAlertLevel === 'warning' && quantityAlertLevel === 'normal')
      ? 'expiration'
      : quantityAlertLevel !== 'normal'
        ? 'quantity'
        : expirationAlertLevel !== 'normal'
          ? 'expiration'
          : null;

  return {
    id: receipt.id ?? data.id,
    name,
    series: data.fiscalSeries || data.serie || data.series || series,
    startNumber: getValidNumber(startNumber),
    endNumber: getValidNumber(endNumber),
    currentNumber: getValidNumber(currentNumber),
    totalNumbers,
    usedNumbers,
    remainingNumbers,
    percentageUsed,
    percentageRemaining,
    alertLevel,
    quantityAlertLevel,
    expirationAlertLevel,
    alertReasons,
    primaryAlertReason,
    disabled,
    isActive: !disabled,
    needsAttention: !disabled && alertLevel !== 'normal',
    thresholds,
    expirationThresholds,
    expirationDate,
    daysUntilExpiration,
  } satisfies FiscalReceiptStatus;
};

export const processFiscalReceipts = (
  taxReceipts: TaxReceiptDocument[] = [],
  alertConfig: FiscalAlertsConfig | null = null,
) => {
  if (!Array.isArray(taxReceipts) || taxReceipts.length === 0) {
    return {
      receipts: [],
      summary: {
        totalReceipts: 0,
        activeReceipts: 0,
        receiptsNeedingAttention: 0,
        criticalReceipts: 0,
        warningReceipts: 0,
        totalRemaining: 0,
        lowestRemaining: null,
        mostCritical: null,
      },
    };
  }

  const processedReceipts = taxReceipts
    .map((receipt) => calculateReceiptStatus(receipt, alertConfig))
    .filter((receipt): receipt is FiscalReceiptStatus => receipt !== null);

  const activeReceipts = processedReceipts.filter((receipt) => receipt.isActive);
  const receiptsNeedingAttention = processedReceipts.filter(
    (receipt) => receipt.needsAttention,
  );
  const criticalReceipts = processedReceipts.filter(
    (receipt) => receipt.alertLevel === 'critical' && receipt.isActive,
  );
  const warningReceipts = processedReceipts.filter(
    (receipt) => receipt.alertLevel === 'warning' && receipt.isActive,
  );

  const totalRemaining = activeReceipts.reduce(
    (sum, receipt) => sum + receipt.remainingNumbers,
    0,
  );

  const lowestRemaining =
    activeReceipts.length > 0
      ? activeReceipts.reduce((min, receipt) =>
          receipt.remainingNumbers < min.remainingNumbers ? receipt : min,
        )
      : null;

  const mostCritical =
    receiptsNeedingAttention.length > 0
      ? receiptsNeedingAttention.reduce((current, candidate) =>
          compareReceiptPriority(current, candidate),
        )
      : null;

  return {
    receipts: processedReceipts,
    summary: {
      totalReceipts: processedReceipts.length,
      activeReceipts: activeReceipts.length,
      receiptsNeedingAttention: receiptsNeedingAttention.length,
      criticalReceipts: criticalReceipts.length,
      warningReceipts: warningReceipts.length,
      totalRemaining,
      lowestRemaining,
      mostCritical,
    },
  };
};

export const generateFiscalReceiptsWidgetData = (
  taxReceipts: TaxReceiptDocument[] = [],
  alertConfig: FiscalAlertsConfig | null = null,
) => {
  const { summary, receipts } = processFiscalReceipts(taxReceipts, alertConfig);

  if (summary.activeReceipts === 0) {
    const alertData = getAlertMessage('info');

    return {
      title: 'Comprobantes Fiscales',
      alertType: 'info',
      message: alertData.message,
      percentage: 0,
      seriesInfo: 'Sin configurar',
      hasIssues: false,
      receipts: [],
      actionText: alertData.action,
      summary,
    };
  }

  if (alertConfig && !alertConfig.channels.notificationCenter) {
    return {
      title: 'Comprobantes Fiscales',
      alertType: 'info',
      message: 'Las notificaciones internas de comprobantes están desactivadas.',
      percentage: 0,
      seriesInfo: 'Canal interno desactivado',
      hasIssues: false,
      receipts: [],
      actionText: 'Configurar alertas',
      summary,
    };
  }

  if (summary.mostCritical) {
    const target = summary.mostCritical;
    const messageKey =
      target.primaryAlertReason === 'expiration'
        ? target.alertLevel === 'critical'
          ? 'critical_expiration'
          : 'warning_expiration'
        : target.alertLevel === 'critical'
          ? 'critical_quantity'
          : 'warning_quantity';
    const alertData = getAlertMessage(messageKey, target);

    return {
      title: 'Comprobantes Fiscales',
      alertType: target.alertLevel === 'critical' ? 'error' : 'warning',
      message: alertData.message,
      percentage:
        target.primaryAlertReason === 'expiration'
          ? 0
          : target.percentageRemaining,
      seriesInfo: `${target.name} - Serie ${target.series}`,
      hasIssues: true,
      receipts: receipts.filter((receipt) => receipt.needsAttention),
      remaining: target.remainingNumbers,
      total: target.totalNumbers,
      current: target.currentNumber,
      summary,
      actionText: alertData.action,
      thresholds: target.thresholds,
      expirationThresholds: target.expirationThresholds,
      primaryAlertReason: target.primaryAlertReason,
      expirationDate: target.expirationDate,
      daysUntilExpiration: target.daysUntilExpiration,
    };
  }

  const lowestReceipt = summary.lowestRemaining;
  const alertData = getAlertMessage('success', lowestReceipt ?? {});

  return {
    title: 'Comprobantes Fiscales',
    alertType: 'success',
    message: alertData.message,
    percentage: lowestReceipt?.percentageRemaining ?? 0,
    seriesInfo: lowestReceipt
      ? `${lowestReceipt.name} - Serie ${lowestReceipt.series}`
      : 'Sin alertas',
    hasIssues: false,
    receipts: receipts.filter((receipt) => receipt.isActive),
    remaining: lowestReceipt?.remainingNumbers ?? 0,
    total: lowestReceipt?.totalNumbers ?? 0,
    current: lowestReceipt?.currentNumber ?? 0,
    summary,
    actionText: alertData.action,
    thresholds: lowestReceipt?.thresholds,
    expirationThresholds: lowestReceipt?.expirationThresholds,
  };
};
