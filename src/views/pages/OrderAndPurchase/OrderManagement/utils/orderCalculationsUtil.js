export const calculateOrderTotals = (items) => {
  return items.reduce(
    (acc, item) => {
      const baseCostTotal = Number(item.baseCost) * Number(item.quantity);
      const taxPercentage = Number(item.taxPercentage) || 0;
      const itemITBIS = (baseCostTotal * taxPercentage) / 100;
      const shippingCost = Number(item.freight) || 0;
      const otherCosts = Number(item.otherCosts) || 0;
      const subTotal = baseCostTotal + itemITBIS + shippingCost + otherCosts;

      return {
        totalProducts: acc.totalProducts + Number(item.quantity),
        totalBaseCost: acc.totalBaseCost + baseCostTotal,
        totalShipping: acc.totalShipping + shippingCost,
        totalOtherCosts: acc.totalOtherCosts + otherCosts,
        totalTax: acc.totalTax + itemITBIS,
        grandTotal: acc.grandTotal + subTotal,
      };
    },
    {
      totalProducts: 0,
      totalBaseCost: 0,
      totalShipping: 0,
      totalOtherCosts: 0,
      totalTax: 0,
      grandTotal: 0,
    },
  );
};
