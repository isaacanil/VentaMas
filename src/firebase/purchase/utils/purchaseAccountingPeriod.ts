import { assertAccountingPeriodOpenForBusiness } from '@/utils/accounting/periodClosures';
import type { Purchase } from '@/utils/purchase/types';

export const resolvePurchaseCompletionEffectiveDate = (
  purchase: Purchase | null | undefined,
): unknown =>
  purchase?.completedAt ??
  purchase?.deliveryAt ??
  purchase?.dates?.deliveryDate ??
  Date.now();

export const assertPurchaseCompletionAccountingPeriodOpen = async ({
  businessId,
  purchase,
}: {
  businessId: string | null | undefined;
  purchase: Purchase | null | undefined;
}): Promise<string | null> =>
  assertAccountingPeriodOpenForBusiness({
    businessId,
    effectiveDate: resolvePurchaseCompletionEffectiveDate(purchase),
    operationLabel: 'completar esta compra',
  });
