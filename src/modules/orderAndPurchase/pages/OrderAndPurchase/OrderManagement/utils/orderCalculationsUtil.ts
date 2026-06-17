import type { PurchaseReplenishment } from '@/utils/purchase/types';
import {
  calculateReplenishmentTotals,
  type ReplenishmentTotals,
} from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/utils/replenishmentTotals';

export const calculateOrderTotals = (
  items: PurchaseReplenishment[] = [],
): ReplenishmentTotals => calculateReplenishmentTotals(items);
