import type { PurchaseReplenishment } from '@/utils/purchase/types';

export interface ReplenishmentTotals {
  totalProducts: number;
  totalBaseCost: number;
  totalItbis: number;
  totalShipping: number;
  totalOtherCosts: number;
  grandTotal: number;
}

export const calculateReplenishmentTotals = (
  items: PurchaseReplenishment[] = [],
): ReplenishmentTotals => {
  return items.reduce(
    (acc, item) => {
      const quantity = Number(item.purchaseQuantity ?? item.quantity ?? 0);
      const baseCost = Number(item.baseCost) || 0;
      const baseCostTotal = baseCost * quantity;
      const taxPercentage = Number(item.taxPercentage) || 0;
      const taxRate = taxPercentage > 1 ? taxPercentage / 100 : taxPercentage;
      const itemITBIS = baseCostTotal * taxRate;
      const shippingCost = Number(item.freight) || 0;
      const otherCosts = Number(item.otherCosts) || 0;
      const subTotal = baseCostTotal + itemITBIS + shippingCost + otherCosts;

      return {
        totalProducts: acc.totalProducts + quantity,
        totalBaseCost: acc.totalBaseCost + baseCostTotal,
        totalItbis: acc.totalItbis + itemITBIS,
        totalShipping: acc.totalShipping + shippingCost,
        totalOtherCosts: acc.totalOtherCosts + otherCosts,
        grandTotal: acc.grandTotal + subTotal,
      };
    },
    {
      totalProducts: 0,
      totalBaseCost: 0,
      totalItbis: 0,
      totalShipping: 0,
      totalOtherCosts: 0,
      grandTotal: 0,
    },
  );
};
