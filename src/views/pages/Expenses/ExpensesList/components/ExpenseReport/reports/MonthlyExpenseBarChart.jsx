import { createChart } from 'lightweight-charts';
import React, { useRef, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import Typography from '../../../../../../templates/system/Typografy/Typografy';

const Container = styled.div`
  position: relative;
  height: 300px;
`;

const MonthlyExpenseBarChart = ({ expenses }) => {
  const chartContainerRef = useRef(null);
  const chart = useRef(null);
  const barSeries = useRef(null);
  const lineSeries = useRef(null);

  const { monthlyData, totalAccumulated } = useMemo(() => {
    const monthlyData = {};
    let total = 0;
    (expenses || []).forEach(({ expense }) => {
      const date = new Date(expense.dates.expenseDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount;
      total += expense.amount;
    });
    return { monthlyData, totalAccumulated: total };
  }, [expenses]);

  const barData = useMemo(
    () => Object.entries(monthlyData).map(([time, value]) => ({ time, value })),
    [monthlyData]
  );
  const lineData = useMemo(
    () =>
      Object.keys(monthlyData).map(time => ({ time, value: totalAccumulated })),
    [monthlyData, totalAccumulated]
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (!chart.current) {
      chart.current = createChart(chartContainerRef.current, {
        layout: { backgroundColor: '#ffffff', textColor: '#333' },
        grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
        rightPriceScale: { scaleMargins: { top: 0.3, bottom: 0.25 } },
        timeScale: { timeVisible: true },
      });

      barSeries.current = chart.current.addHistogramSeries({
        color: 'rgba(54, 162, 235, 0.5)',
        priceFormat: { type: 'volume' },
        scaleMargins: { top: 0.7, bottom: 0 },
      });

      lineSeries.current = chart.current.addLineSeries({
        color: 'rgba(255, 99, 132, 1)',
        lineWidth: 2,
      });
    }

    barSeries.current.setData(barData);
    lineSeries.current.setData(lineData);
    chart.current.timeScale().fitContent();

    return () => {
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, [barData, lineData]);

  return (
    <Container>
      <Typography variant="h3">Gastos Totales Acumulados y por Mes</Typography>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </Container>
  );
};
export { MonthlyExpenseBarChart };
