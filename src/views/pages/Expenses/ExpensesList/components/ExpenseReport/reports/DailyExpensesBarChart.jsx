import { createChart, HistogramSeries } from 'lightweight-charts';
import React, { useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';

import Typography from '../../../../../../templates/system/Typografy/Typografy';

// Helper to format UNIX seconds to date string YYYY-MM-DD
const formatDate = (seconds) => {
  const date = new Date(seconds * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Accumulate expenses by date
const accumulateExpenseData = (expenses) => {
  return expenses.reduce((acc, { expense }) => {
    const dateKey = formatDate(expense.dates.expenseDate);
    acc[dateKey] = (acc[dateKey] || 0) + expense.amount;
    return acc;
  }, {});
};

export const DailyExpenseBarChart = ({ expenses }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const expensesByDay = useMemo(() => accumulateExpenseData(expenses), [expenses]);
  const barData = useMemo(
    () => Object.entries(expensesByDay).map(([date, total]) => ({ time: date, value: total })),
    [expensesByDay]
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'white' },
        textColor: 'black',
      },
      rightPriceScale: { visible: false },
      timeScale: { timeVisible: true, secondsVisible: false },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
    });

    // Add a histogram series via addSeries
    seriesRef.current = chartRef.current.addSeries(HistogramSeries, {
      color: 'rgba(41, 98, 255, 0.5)',
      priceFormat: { type: 'volume' },
      overlay: false,
      scaleMargins: { top: 0.2, bottom: 0.1 },
    });

    // Set initial data
    seriesRef.current.setData(barData);

    // Adjust visible range
    chartRef.current.timeScale().fitContent();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [barData]);

  return (
    <Container>
      <Typography variant="h3">Gastos Totales por Día</Typography>
      <ChartWrapper ref={chartContainerRef} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 200px;
`;
