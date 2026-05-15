import { DateTime } from 'luxon';

type NumericInput = number | string | null | undefined;
type TransactionDateInput =
  | number
  | string
  | Date
  | { seconds?: NumericInput; toMillis?: () => number }
  | null
  | undefined;
type SalesTransaction = {
  data?: {
    date?: TransactionDateInput;
    totalPurchase?: { value?: NumericInput } | NumericInput;
  };
  totalPurchase?: { value?: NumericInput } | NumericInput;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const resolveTransactionMillis = (
  value: TransactionDateInput,
): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value > 1e12 ? value : value * 1000;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric > 1e12 ? numeric : numeric * 1000;
    const parsed = DateTime.fromISO(value);
    return parsed.isValid ? parsed.toMillis() : null;
  }
  if (typeof value.toMillis === 'function') {
    const millis = value.toMillis();
    return Number.isFinite(millis) ? millis : null;
  }
  if (value.seconds !== undefined) {
    return toFiniteNumber(value.seconds) * 1000;
  }
  return null;
};

/**
 * Calcula ventas para un rango de fechas dado
 * @param {Array} transactions - Array de transacciones
 * @param {number} startDate - Fecha de inicio en milisegundos
 * @param {number} endDate - Fecha de fin en milisegundos
 * @returns {number} Total de ventas en el rango
 */
const calculateSalesForDateRange = (
  transactions: readonly SalesTransaction[],
  startDate: number,
  endDate: number,
): number => {
  return transactions.reduce((totalSales, transaction) => {
    const transactionDate = resolveTransactionMillis(transaction.data?.date);
    if (
      transactionDate !== null &&
      transactionDate >= startDate &&
      transactionDate <= endDate
    ) {
      return totalSales + resolveTransactionValue(transaction);
    } else {
      return totalSales;
    }
  }, 0);
};

/**
 * Resuelve el valor de transacción de diferentes formatos posibles
 */
const resolveTransactionValue = (transaction: SalesTransaction): number => {
  const nestedTotal = transaction?.data?.totalPurchase;
  const rootTotal = transaction?.totalPurchase;
  return Number(
    (typeof nestedTotal === 'object' ? nestedTotal?.value : nestedTotal) ??
      (typeof rootTotal === 'object' ? rootTotal?.value : rootTotal) ??
      0,
  );
};

/**
 * Obtiene las ventas del día actual
 * @param {Array} transactions - Array de transacciones
 * @returns {Object} Objeto con salesForCurrentDay y growthPercentage
 */
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

/**
 * Calcula el porcentaje de crecimiento comparando períodos
 * @param {Array} transactions - Array de transacciones
 * @param {number} daysAgo - Número de días atrás
 * @param {DateTime} today - Fecha de hoy (luxon DateTime)
 * @returns {number} Porcentaje de crecimiento
 */
export const getGrowthPercentage = (
  transactions: readonly SalesTransaction[],
  daysAgo: number,
  today: DateTime,
): number => {
  const endToday = today.endOf('day').toMillis();
  const startDaysAgo = today.minus({ days: daysAgo }).startOf('day').toMillis();
  const salesToday = calculateSalesForDateRange(
    transactions,
    startDaysAgo,
    endToday,
  );
  const startYesterday = today
    .minus({ days: daysAgo + 1 })
    .startOf('day')
    .toMillis();
  const endYesterday = today.minus({ days: 1 }).endOf('day').toMillis();
  const salesYesterday = calculateSalesForDateRange(
    transactions,
    startYesterday,
    endYesterday,
  );
  if (salesYesterday === 0) return salesToday > 0 ? 100 : 0;
  const growthPercentage =
    ((salesToday - salesYesterday) / salesYesterday) * 100;
  return growthPercentage;
};
