import type { PurchaseReplenishment } from '@/utils/purchase/types';
import {
  calculateReplenishmentTotals,
  type ReplenishmentTotals,
} from '@/utils/order/totals';

export const calculateOrderTotals = (
  items: PurchaseReplenishment[] = [],
): ReplenishmentTotals => calculateReplenishmentTotals(items);
