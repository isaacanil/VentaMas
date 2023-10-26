import { DateTime } from "luxon";

// Calcular el total de ventas por mes
export const getTotalSalesPerMonth = (invoices) => {
  const salesPerMonth = {};
  console.log(invoices)
  invoices.forEach(invoice => {
    const date = DateTime.fromMillis(invoice.data.date.seconds * 1000);
    const monthYearStr = date.toFormat('yyyy-MM');
    salesPerMonth[monthYearStr] = (salesPerMonth[monthYearStr] || 0) + invoice.data.totalPurchase.value;
  });

  return salesPerMonth;
};

// Calcular el total de gastos por mes
export const getTotalExpensesPerMonth = (expenses) => {
    const expensesPerMonth = {};
    
    expenses.forEach(exp => {
      const date = DateTime.fromMillis(exp.expense.dates.expenseDate);
      const monthYearStr = date.toFormat('yyyy-MM');
      expensesPerMonth[monthYearStr] = (expensesPerMonth[monthYearStr] || 0) + exp.expense.amount;
    });
    
    return expensesPerMonth;
  };