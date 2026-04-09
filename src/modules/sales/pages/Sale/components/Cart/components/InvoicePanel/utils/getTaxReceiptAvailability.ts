import type { TaxReceiptItem } from '@/types/taxReceipt';

type TaxReceiptAvailability = {
  receipt: TaxReceiptItem | null;
  depleted: boolean;
};

const resolveReceiptData = (item: TaxReceiptItem | null | undefined) => {
  if (!item) return null;
  if (typeof item === 'object' && 'data' in item) {
    return item.data ?? null;
  }
  return item ?? null;
};

export const getTaxReceiptAvailability = (
  receipts: TaxReceiptItem[] | null | undefined,
  receiptName: string | null | undefined,
): TaxReceiptAvailability => {
  if (!Array.isArray(receipts) || !receiptName) {
    return {
      receipt: null,
      depleted: true,
    };
  }

  const receipt =
    receipts.find((item) => resolveReceiptData(item)?.name === receiptName) ||
    null;
  if (!receipt) {
    return {
      receipt: null,
      depleted: true,
    };
  }

  const receiptData = resolveReceiptData(receipt);
  const rawQuantity = receiptData?.quantity;
  const rawIncrease = receiptData?.increase;

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
