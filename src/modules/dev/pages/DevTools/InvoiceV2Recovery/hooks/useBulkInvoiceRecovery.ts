import { message } from 'antd';
import { useCallback, useState } from 'react';

import { autoRepairInvoiceV2 } from '@/services/invoice/invoiceV2Admin.service';

const AUTO_INVOICE_LIMIT = 50;
const AUTO_BUSINESS_LIMIT = 50;

interface BulkOptions {
  runForAllBusinesses: boolean;
  dryRun: boolean;
  startAfterBusinessId: string;
  startAfterInvoiceId: string;
}

interface BulkRepair {
  invoiceId?: string;
  needsCanonical?: boolean;
  needsReceivable?: boolean;
  tasks?: string[];
  status?: string;
}

interface BulkBusinessResult {
  businessId: string;
  invoicesScanned?: number;
  repairs?: BulkRepair[];
  nextInvoiceCursor?: string;
}

interface BulkMetrics {
  businessesProcessed?: number;
  invoicesScanned?: number;
  invoicesWithIssues?: number;
  tasksScheduled?: number;
}

interface BulkResult {
  dryRun?: boolean;
  metrics?: BulkMetrics;
  businesses?: BulkBusinessResult[];
  nextPage?: {
    startAfterBusinessId?: string;
  };
}

interface AutoRepairPayload {
  runForAllBusinesses: boolean;
  dryRun: boolean;
  invoicesLimit: number;
  businessLimit?: number;
  startAfterBusinessId?: string;
  businessId?: string;
  startAfterInvoiceId?: string;
}

const DEFAULT_OPTIONS: BulkOptions = {
  runForAllBusinesses: true,
  dryRun: false,
  startAfterBusinessId: '',
  startAfterInvoiceId: '',
};

const mergeBatchResults = (
  current: BulkResult | null,
  incoming: BulkResult,
  runForAllBusinesses: boolean,
): BulkResult => {
  if (!current) {
    return incoming;
  }
  const prevMetrics = current.metrics || {};
  const nextMetrics = incoming.metrics || {};
  const mergedMetrics = {
    businessesProcessed:
      (prevMetrics.businessesProcessed ?? 0) +
      (nextMetrics.businessesProcessed ?? 0),
    invoicesScanned:
      (prevMetrics.invoicesScanned ?? 0) + (nextMetrics.invoicesScanned ?? 0),
    invoicesWithIssues:
      (prevMetrics.invoicesWithIssues ?? 0) +
      (nextMetrics.invoicesWithIssues ?? 0),
    tasksScheduled:
      (prevMetrics.tasksScheduled ?? 0) + (nextMetrics.tasksScheduled ?? 0),
  };

  const mergedResult: BulkResult = {
    dryRun: incoming.dryRun,
    metrics: mergedMetrics,
    businesses: [],
    nextPage: incoming.nextPage,
  };

  if (runForAllBusinesses) {
    mergedResult.businesses = [
      ...(current.businesses || []),
      ...(incoming.businesses || []),
    ];
    return mergedResult;
  }

  const previousBusiness = current.businesses?.[0] || null;
  const incomingBusiness = incoming.businesses?.[0] || null;
  if (!previousBusiness && !incomingBusiness) {
    mergedResult.businesses = [];
    return mergedResult;
  }

  const mergedBusiness: BulkBusinessResult = {
    businessId:
      incomingBusiness?.businessId || previousBusiness?.businessId || '',
    invoicesScanned:
      (previousBusiness?.invoicesScanned ?? 0) +
      (incomingBusiness?.invoicesScanned ?? 0),
    repairs: [
      ...(previousBusiness?.repairs || []),
      ...(incomingBusiness?.repairs || []),
    ],
  };

  if (incomingBusiness && 'nextInvoiceCursor' in incomingBusiness) {
    mergedBusiness.nextInvoiceCursor = incomingBusiness.nextInvoiceCursor;
  }

  mergedResult.businesses = [mergedBusiness];
  return mergedResult;
};

interface UseBulkInvoiceRecoveryProps {
  getSelectedBusinessId?: () => string | null | undefined;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'No se pudo ejecutar la recuperación automática.';
};

export const useBulkInvoiceRecovery = ({
  getSelectedBusinessId,
}: UseBulkInvoiceRecoveryProps) => {
  const [bulkOptions, setBulkOptions] = useState<BulkOptions>(DEFAULT_OPTIONS);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const updateBulkOption = useCallback(
    <K extends keyof BulkOptions>(key: K, value: BulkOptions[K]) => {
    setBulkOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
    },
    [],
  );

  const handleBulkAutoRecovery = useCallback(async () => {
    const selectedBusinessId = getSelectedBusinessId?.();
    if (!bulkOptions.runForAllBusinesses && !selectedBusinessId) {
      message.warning('Selecciona un negocio para ejecutar la recuperación automática.');
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    try {
      let aggregatedResult: BulkResult | null = null;
      let continueRunning = true;
      let currentBusinessCursor = bulkOptions.startAfterBusinessId?.trim() || null;
      let currentInvoiceCursor = bulkOptions.startAfterInvoiceId?.trim() || null;

      while (continueRunning) {
        const payload: AutoRepairPayload = {
          runForAllBusinesses: bulkOptions.runForAllBusinesses,
          dryRun: bulkOptions.dryRun,
          invoicesLimit: AUTO_INVOICE_LIMIT,
        };
        if (bulkOptions.runForAllBusinesses) {
          payload.businessLimit = AUTO_BUSINESS_LIMIT;
          if (currentBusinessCursor) {
            payload.startAfterBusinessId = currentBusinessCursor;
          }
        } else {
          payload.businessId = selectedBusinessId;
          if (currentInvoiceCursor) {
            payload.startAfterInvoiceId = currentInvoiceCursor;
          }
        }

        const response = (await autoRepairInvoiceV2(payload)) as BulkResult;
        aggregatedResult = mergeBatchResults(
          aggregatedResult,
          response,
          bulkOptions.runForAllBusinesses,
        );
        setBulkResult(aggregatedResult);

        if (bulkOptions.runForAllBusinesses) {
          const nextCursor = response.nextPage?.startAfterBusinessId || null;
          if (nextCursor) {
            currentBusinessCursor = nextCursor;
          } else {
            continueRunning = false;
          }
        } else {
          const summary = response.businesses?.find(
            (business) => business.businessId === selectedBusinessId,
          );
          const nextCursor = summary?.nextInvoiceCursor || null;
          if (nextCursor) {
            currentInvoiceCursor = nextCursor;
          } else {
            continueRunning = false;
          }
        }
      }

      message.success(
        bulkOptions.dryRun
          ? 'Análisis automático completado.'
          : 'Recuperación automática ejecutada.',
      );
    } catch (err: unknown) {
      console.error('[useBulkInvoiceRecovery] bulk auto-repair error', err);
      message.error(getErrorMessage(err));
    } finally {
      setBulkLoading(false);
    }
  }, [bulkOptions, getSelectedBusinessId]);

  return {
    bulkOptions,
    bulkResult,
    bulkLoading,
    updateBulkOption,
    setBulkResult,
    handleBulkAutoRecovery,
  };
};
