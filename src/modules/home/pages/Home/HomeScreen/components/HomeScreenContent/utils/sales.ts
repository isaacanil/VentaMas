type NumericInput = number | string | null | undefined;

type SalesTransaction = {
  data?: {
    totalPurchase?: { value?: NumericInput } | NumericInput;
  };
  totalPurchase?: { value?: NumericInput } | NumericInput;
};

const toFiniteNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const resolveTransactionValue = (transaction: SalesTransaction): number => {
  const nestedTotal = transaction?.data?.totalPurchase;
  const rootTotal = transaction?.totalPurchase;
  const value =
    (typeof nestedTotal === 'object' ? nestedTotal?.value : nestedTotal) ??
    (typeof rootTotal === 'object' ? rootTotal?.value : rootTotal) ??
    0;
  return toFiniteNumber(value);
};

export const getSalesForCurrentDay = (
  transactions: readonly SalesTransaction[] = [],
) => {
  const salesForCurrentDay = transactions.reduce(
    (total, transaction) => total + resolveTransactionValue(transaction),
    0,
  );

  return {
    salesForCurrentDay,
    growthPercentage: 0,
  };
};
