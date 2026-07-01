export const MIN_COUNTER_AMOUNT = 1;

export const normalizeCounterAmount = (amountToBuy: number) =>
  amountToBuy || MIN_COUNTER_AMOUNT;

const roundCounterAmount = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

export const parseCounterInputValue = (
  value: string,
  allowFractional = false,
): number | null => {
  const normalizedValue = allowFractional ? value.replace(',', '.') : value;
  const parsedValue = allowFractional
    ? Number.parseFloat(normalizedValue)
    : Number.parseInt(normalizedValue, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const normalizeSaleUnitConversionFactor = (value?: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export const resolveCounterBaseQuantity = ({
  value,
  saleUnitConversionFactor,
}: {
  value: number;
  saleUnitConversionFactor?: number;
}) =>
  roundCounterAmount(
    value * normalizeSaleUnitConversionFactor(saleUnitConversionFactor),
  );

export const resolveMaxCounterAmountForStock = ({
  stock,
  saleUnitConversionFactor,
  allowFractional = false,
}: {
  stock?: number;
  saleUnitConversionFactor?: number;
  allowFractional?: boolean;
}) => {
  if (typeof stock !== 'number' || !Number.isFinite(stock)) return null;
  const factor = normalizeSaleUnitConversionFactor(saleUnitConversionFactor);
  const maxAmount = stock / factor;
  return allowFractional ? roundCounterAmount(maxAmount) : Math.floor(maxAmount);
};

export const exceedsRestrictedStock = ({
  value,
  stock,
  restrictSaleWithoutStock,
  saleUnitConversionFactor,
}: {
  value: number;
  stock?: number;
  restrictSaleWithoutStock?: boolean;
  saleUnitConversionFactor?: number;
}) =>
  Boolean(
    restrictSaleWithoutStock &&
    typeof stock === 'number' &&
    resolveCounterBaseQuantity({ value, saleUnitConversionFactor }) > stock,
  );
