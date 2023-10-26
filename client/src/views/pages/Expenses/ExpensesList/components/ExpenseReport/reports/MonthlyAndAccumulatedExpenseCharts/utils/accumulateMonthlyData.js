export const accumulateMonthlyData = (expenses) => {
    const monthlyData = {};
    let totalAccumulated = 0;

    for (let { expense } of expenses) {
        const date = new Date(expense.dates.expenseDate);
        const monthYear = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + expense.amount;
        totalAccumulated += expense.amount;
    }

    return { monthlyData, totalAccumulated };
};
