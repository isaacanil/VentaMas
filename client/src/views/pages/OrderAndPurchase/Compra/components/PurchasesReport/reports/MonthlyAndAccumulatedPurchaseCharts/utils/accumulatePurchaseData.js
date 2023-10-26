
export const accumulatePurchaseData = (purchases) => {
    const monthlyData = {};
    let totalAccumulated = 0;
  
    for (let { data } of purchases) {
      const date = new Date(data.dates.createdAt);
      const monthYear = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + data.total;
      totalAccumulated += data.total;
    }
  
    return { monthlyData, totalAccumulated };
  };
  