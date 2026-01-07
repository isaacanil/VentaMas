// @ts-nocheck
export const getTaxReceiptAvailability = (receipts, receiptName) => {
  if (!Array.isArray(receipts) || !receiptName) {
    return {
      receipt: null,
      depleted: true,
    };
  }

  const receipt =
    receipts.find((item) => item?.data?.name === receiptName) || null;
  if (!receipt) {
    return {
      receipt: null,
      depleted: true,
    };
  }

  const rawQuantity = receipt?.data?.quantity;
  const rawIncrease = receipt?.data?.increase;

  const quantity = Number(rawQuantity);
  const increase = Number(rawIncrease);

  const normalizedIncrease =
    Number.isFinite(increase) && increase > 0 ? increase : 1;
  const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;

  return {
    receipt,
    depleted: normalizedQuantity < normalizedIncrease,
  };
};
