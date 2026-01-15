import type { DiscountType } from '@/types/invoice';

const roundToTwoDecimals = (num: number): number => Math.round(num * 100) / 100;

export const applyDiscount = (
  total: number,
  discountValue: number,
  discountType: DiscountType = 'percentage',
): number => {
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safeDiscount = Number.isFinite(discountValue) ? discountValue : 0;

  const discounted =
    discountType === 'percentage'
      ? safeTotal - safeTotal * (safeDiscount / 100)
      : safeTotal - safeDiscount;

  return roundToTwoDecimals(Math.max(0, discounted));
};

export const calculateChange = (total: number, payment: number): number => {
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safePayment = Number.isFinite(payment) ? payment : 0;
  return roundToTwoDecimals(safePayment - safeTotal);
};
