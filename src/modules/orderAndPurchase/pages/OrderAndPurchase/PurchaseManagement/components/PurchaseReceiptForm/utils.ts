import { DateTime } from 'luxon';

import { transactionConditions } from '@/constants/orderAndPurchaseState';
import type { ProviderDocument } from '@/firebase/provider/types';
import type { ProviderInfo } from '@/utils/provider/types';
import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';
import {
  resolvePurchaseLineQuantities,
  resolvePurchaseWorkflowStatus,
} from '@/utils/purchase/workflow';
import { toMillis } from '@/utils/date/toMillis';

export const formatReceiptValue = (
  value: unknown,
  fallback = 'N/A',
): string => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
};

export const formatReceiptDate = (value: unknown): string => {
  const millis = toMillis(value as never);
  if (typeof millis !== 'number' || !Number.isFinite(millis)) {
    return 'N/A';
  }

  return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy');
};

export const resolveReceiptProvider = (
  provider: Purchase['provider'],
  providers: ProviderDocument[],
): ProviderInfo => {
  if (typeof provider === 'string') {
    return (
      providers.find((item) => item.provider.id === provider)?.provider ?? {
        id: provider,
      }
    );
  }

  if (provider && typeof provider === 'object') {
    const providerInfo = provider as ProviderInfo;
    const providerId = typeof providerInfo.id === 'string' ? providerInfo.id : '';
    const matchedProvider = providerId
      ? providers.find((item) => item.provider.id === providerId)?.provider
      : null;

    return {
      ...(matchedProvider ?? {}),
      ...providerInfo,
    };
  }

  return {};
};

export const resolveReceiptConditionLabel = (
  condition: Purchase['condition'],
): string =>
  transactionConditions.find((item) => item.id === condition)?.label ??
  formatReceiptValue(condition, 'Sin definir');

export const resolveReceiptTotals = (
  replenishments: Purchase['replenishments'],
) =>
  (Array.isArray(replenishments) ? replenishments : []).reduce(
    (acc, item) => {
      const quantities = resolvePurchaseLineQuantities(
        item as PurchaseReplenishment,
      );

      return {
        orderedQuantity: acc.orderedQuantity + quantities.orderedQuantity,
        receivedQuantity: acc.receivedQuantity + quantities.receivedQuantity,
        pendingQuantity: acc.pendingQuantity + quantities.pendingQuantity,
      };
    },
    {
      orderedQuantity: 0,
      receivedQuantity: 0,
      pendingQuantity: 0,
    },
  );

export const resolveReceiptWorkflowMeta = (
  purchase: Purchase,
): {
  color: string;
  label: string;
} => {
  const workflowStatus = resolvePurchaseWorkflowStatus(purchase);

  switch (workflowStatus) {
    case 'completed':
      return {
        color: 'success',
        label: 'Completada',
      };
    case 'partial_receipt':
      return {
        color: 'processing',
        label: 'Recepción parcial',
      };
    case 'canceled':
      return {
        color: 'default',
        label: 'Cancelada',
      };
    case 'pending_receipt':
    default:
      return {
        color: 'gold',
        label: 'Pendiente de recepción',
      };
  }
};
