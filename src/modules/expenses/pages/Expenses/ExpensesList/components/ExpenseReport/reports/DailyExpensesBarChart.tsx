import {
  createChart,
  HistogramSeries,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';
import Typography from '@/components/ui/Typografy/Typografy';
import type { Expense, ExpenseDoc } from '@/utils/expenses/types';

type ExpenseEntry = Expense | ExpenseDoc;

interface DailyExpenseBarChartProps {
  expenses?: ExpenseEntry[];
}

// Helper to format a date-like value to YYYY-MM-DD (Business Day format)
const formatDate = (dateLike: TimestampLike): string | null => {
  const millis = toMillis(dateLike);
  if (millis === undefined || !Number.isFinite(millis)) {
    return null;
  }

  const date = new Date(millis);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Accumulate expenses by date
const accumulateExpenseData = (expenses: ExpenseEntry[]): Record<string, number> => {
  return expenses.reduce<Record<string, number>>((acc, entry) => {
    const expense = 'expense' in entry ? entry.expense : entry;
    const dateKey = formatDate(expense?.dates?.expenseDate);

    if (!dateKey) {
      return acc;
    }

    const amountRaw = expense?.amount ?? 0;
    const amount =
      typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);
    acc[dateKey] = (acc[dateKey] ?? 0) + (Number.isFinite(amount) ? amount : 0);
    return acc;
  }, {});
};

export const DailyExpenseBarChart = ({ expenses }: DailyExpenseBarChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Histogram', Time> | null>(null);

  const normalizedExpenses = useMemo(
    () => (Array.isArray(expenses) ? expenses : []),
    [expenses],
  );
  const expensesByDay = useMemo(
    () => accumulateExpenseData(normalizedExpenses),
    [normalizedExpenses],
  );
  const barData = useMemo<HistogramData<Time>[]>(() => {
    return Object.entries(expensesByDay)
      .map(([date, total]) => ({ time: date, value: total }))
      .sort((a, b) => (a.time > b.time ? 1 : -1));
  }, [expensesByDay]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'white' },
        textColor: 'black',
      },
      rightPriceScale: { visible: false },
      timeScale: { timeVisible: true, secondsVisible: false },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
    });
    chartRef.current = chart;

    // Add a histogram series via addSeries
    const series = chart.addSeries(HistogramSeries, {
      color: 'rgba(41, 98, 255, 0.5)',
      priceFormat: { type: 'volume' },
      overlay: false,
      scaleMargins: { top: 0.2, bottom: 0.1 },
    });
    seriesRef.current = series;

    // Set initial data
    series.setData(barData);

    // Adjust visible range
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
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
