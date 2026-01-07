// @ts-nocheck
const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '0%';
  const rounded = Math.round(value * 10) / 10;
  const formatted = rounded.toFixed(1);
  return `${formatted}%`;
};

export const buildBusinessInsights = ({
  summary,
  dailyMetrics,
  formatCurrency,
}) => {
  const source = Array.isArray(dailyMetrics) ? dailyMetrics : [];
  const totalSales = summary?.totalSales ?? 0;
  const netProfit = summary?.netProfit ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const totalTaxes = summary?.totalTaxes ?? 0;

  if (totalSales <= 0 && source.length === 0) {
    return [];
  }

  const netMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : null;
  const expenseRatio =
    totalSales > 0 ? (totalExpenses / totalSales) * 100 : null;
  const taxRatio = totalSales > 0 ? (totalTaxes / totalSales) * 100 : null;

  const negativeDays = source.filter((day) => (day?.netProfit ?? 0) < 0);
  const bestDay = source.reduce(
    (acc, day) =>
      (day?.netProfit ?? -Infinity) > (acc?.netProfit ?? -Infinity) ? day : acc,
    null,
  );

  const insights = [];

  if (Number.isFinite(netMargin)) {
    if (netMargin < 0) {
      insights.push({
        key: 'netMarginNegative',
        type: 'critical',
        title: 'Margen neto negativo',
        description:
          'La rentabilidad está por debajo de cero; revisa precios o gastos.',
        value: formatPercent(netMargin),
        measurement: 'Margen neto = (utilidad neta / ventas totales) * 100',
      });
    } else if (netMargin < 12) {
      insights.push({
        key: 'netMarginLow',
        type: 'warning',
        title: 'Margen neto bajo',
        description:
          'El margen neto está por debajo del 12%. Considera optimizar precios o reducir costos.',
        value: formatPercent(netMargin),
        measurement: 'Margen neto = (utilidad neta / ventas totales) * 100',
      });
    } else {
      insights.push({
        key: 'netMarginHealthy',
        type: 'success',
        title: 'Margen saludable',
        description: 'Buen desempeño en rentabilidad neta durante el período.',
        value: formatPercent(netMargin),
        measurement: 'Margen neto = (utilidad neta / ventas totales) * 100',
      });
    }
  }

  if (Number.isFinite(expenseRatio)) {
    if (expenseRatio >= 35) {
      insights.push({
        key: 'expenseRatioHigh',
        type: 'warning',
        title: 'Gastos operativos altos',
        description:
          'Los gastos superan el 35% de las ventas. Revisa consumos y contratos.',
        value: formatPercent(expenseRatio),
        measurement:
          'Gastos operativos sobre ventas = (gastos totales / ventas totales) * 100',
      });
    } else {
      insights.push({
        key: 'expenseRatioHealthy',
        type: 'success',
        title: 'Gastos controlados',
        description:
          'Los gastos operativos permanecen dentro de un rango saludable.',
        value: formatPercent(expenseRatio),
        measurement:
          'Gastos operativos sobre ventas = (gastos totales / ventas totales) * 100',
      });
    }
  }

  if (Number.isFinite(taxRatio) && taxRatio >= 18) {
    insights.push({
      key: 'taxRatioHigh',
      type: 'info',
      title: 'Carga impositiva destacada',
      description:
        'Considera si puedes aprovechar créditos fiscales o revisar la facturación.',
      value: formatPercent(taxRatio),
      measurement:
        'Carga impositiva = (impuestos totales / ventas totales) * 100',
    });
  }

  if (negativeDays.length) {
    insights.push({
      key: 'negativeDays',
      type: 'critical',
      title: `${negativeDays.length} ${negativeDays.length === 1 ? 'día' : 'días'} con pérdida`,
      description:
        'Analiza qué factores provocaron pérdidas puntuales y aplica correcciones.',
      value: negativeDays
        .slice(0, 3)
        .map((day) => day.dateLabel)
        .join(', '),
      measurement:
        'Conteo de días con utilidad neta negativa dentro del período analizado.',
      meta: {
        days: negativeDays.map((day) => ({
          dateLabel: day.dateLabel,
          netProfit: day.netProfit,
        })),
      },
    });
  }

  if (bestDay && (bestDay.netProfit ?? 0) > 0) {
    insights.push({
      key: 'bestDay',
      type: 'success',
      title: 'Mejor día del período',
      description: `El ${bestDay.dateLabel} generó la mayor ganancia neta.`,
      value: formatCurrency(bestDay.netProfit),
      measurement:
        'Identificación del día con mayor utilidad neta dentro del rango seleccionado.',
      meta: {
        dateLabel: bestDay.dateLabel,
        timestamp: bestDay.timestamp,
        netProfit: bestDay.netProfit,
        sales: bestDay.sales,
        expenses: bestDay.expenses,
      },
    });
  }

  return insights;
};
