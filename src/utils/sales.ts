// @ts-nocheck
import { DateTime } from 'luxon';

/**
 * Calcula ventas para un rango de fechas dado
 * @param {Array} transactions - Array de transacciones
 * @param {number} startDate - Fecha de inicio en milisegundos
 * @param {number} endDate - Fecha de fin en milisegundos
 * @returns {number} Total de ventas en el rango
 */
const calculateSalesForDateRange = (transactions, startDate, endDate) => {
  return transactions.reduce((totalSales, transaction) => {
    const transactionDate = DateTime.fromMillis(
      transaction.data.date.seconds * 1000,
    );
    if (transactionDate >= startDate && transactionDate <= endDate) {
      return totalSales + transaction.data.totalPurchase.value;
    } else {
      return totalSales;
    }
  }, 0);
};

/**
 * Resuelve el valor de transacción de diferentes formatos posibles
 */
const resolveTransactionValue = (transaction) => {
  return Number(
    transaction?.data?.totalPurchase?.value ??
      transaction?.totalPurchase?.value ??
      transaction?.totalPurchase ??
      0,
  );
};

/**
 * Obtiene las ventas del día actual
 * @param {Array} transactions - Array de transacciones
 * @returns {Object} Objeto con salesForCurrentDay y growthPercentage
 */
export const getSalesForCurrentDay = (transactions = []) => {
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
export const getGrowthPercentage = (transactions, daysAgo, today) => {
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
  const growthPercentage =
    ((salesToday - salesYesterday) / salesYesterday) * 100;
  return growthPercentage;
};
