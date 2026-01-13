import { DateTime } from 'luxon';
import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';
import type { PurchaseReplenishment } from '@/utils/purchase/types';

export const calculatePaymentDate = (
  createdAt: TimestampLike,
  conditionId?: string,
): number | null => {
  const baseMillis = toMillis(createdAt);
  if (!Number.isFinite(baseMillis)) return null;

  let daysToAdd = 0;
  switch (conditionId) {
    case 'cash':
      daysToAdd = 0;
      break;
    case 'one_week':
      daysToAdd = 7;
      break;
    case 'fifteen_days':
      daysToAdd = 15;
      break;
    case 'thirty_days':
      daysToAdd = 30;
      break;
    case 'other':
      daysToAdd = 0;
      break;
    default:
      break;
  }

  const paymentDate = DateTime.fromMillis(baseMillis as number).plus({
    days: daysToAdd,
  });
  return paymentDate.toMillis();
};

export const calculateTotalNewStockFromReplenishments = (
  replenishments?: PurchaseReplenishment[] | null,
): number => {
  if (!Array.isArray(replenishments)) return 0;
  return replenishments.reduce((acc, item) => {
    const qty = Number(item.quantity ?? item.purchaseQuantity ?? 0);
    return acc + (Number.isFinite(qty) ? qty : 0);
  }, 0);
};
