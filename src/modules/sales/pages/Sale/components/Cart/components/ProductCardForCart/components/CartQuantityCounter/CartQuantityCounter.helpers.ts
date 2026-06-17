export const MIN_COUNTER_AMOUNT = 1;

export const normalizeCounterAmount = (amountToBuy: number) =>
  amountToBuy || MIN_COUNTER_AMOUNT;

export const parseCounterInputValue = (value: string): number | null => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const exceedsRestrictedStock = ({
  value,
  stock,
  restrictSaleWithoutStock,
}: {
  value: number;
  stock?: number;
  restrictSaleWithoutStock?: boolean;
}) =>
  Boolean(
    restrictSaleWithoutStock && typeof stock === 'number' && value > stock,
  );
