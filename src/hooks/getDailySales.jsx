import { DateTime } from "luxon";
import { useEffect, useState } from "react";

const calculateSalesForDateRange = (transactions, startDate, endDate) => {
  return transactions.reduce((totalSales, transaction) => {
    const transactionDate = DateTime.fromMillis(transaction.data.date.seconds * 1000);
    if (transactionDate >= startDate && transactionDate <= endDate) {
      return totalSales + transaction.data.totalPurchase.value;
    } else {
      return totalSales;
    }
  }, 0);
};

const resolveTransactionValue = (transaction) => {
  return Number(
    transaction?.data?.totalPurchase?.value ??
      transaction?.totalPurchase?.value ??
      transaction?.totalPurchase ??
      0
  );
};

export const getSalesForDateRange = (transactions, startDate, endDate) => {
  const [sales, setSales] = useState(0);
  useEffect(() => {
    const totalSales = calculateSalesForDateRange(transactions, startDate, endDate);
    setSales(totalSales);
  }, [transactions, startDate, endDate]);
  return sales;
};

export const getGrowthPercentage = (transactions, daysAgo, today) => {
  const endToday = today.endOf("day").toMillis();
  const startDaysAgo = today.minus({ days: daysAgo }).startOf("day").toMillis();
  const salesToday = calculateSalesForDateRange(transactions, startDaysAgo, endToday);
  const startYesterday = today.minus({ days: daysAgo + 1 }).startOf("day").toMillis();
  const endYesterday = today.minus({ days: 1 }).endOf("day").toMillis();
  const salesYesterday = calculateSalesForDateRange(transactions, startYesterday, endYesterday);
  const growthPercentage = (salesToday - salesYesterday) / salesYesterday * 100;
  return growthPercentage;
};

export const getSalesForCurrentDay = (transactions = []) => {
  const salesForCurrentDay = transactions.reduce(
    (total, transaction) => total + resolveTransactionValue(transaction),
    0
  );
  return {
    salesForCurrentDay,
    growthPercentage: 0,
  };
};
