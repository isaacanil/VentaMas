import {
  createChart,
  HistogramSeries,
  LineSeries,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from 'lightweight-charts';
import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';

import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';
import Typography from '@/components/ui/Typografy/Typografy';
import type { Expense, ExpenseDoc } from '@/utils/expenses/types';

const Container = styled.div`
  position: relative;
  height: 300px;
`;

type ExpenseEntry = Expense | ExpenseDoc;

interface MonthlyExpenseBarChartProps {
  expenses?: ExpenseEntry[];
}

interface MonthlyExpenseAccumulation {
  monthlyData: Record<string, number>;
  totalAccumulated: number;
}

const resolveExpenseDate = (dateLike: TimestampLike): Date => {
  if (dateLike === null) {
    return new Date(0);
  }
  if (dateLike === undefined) {
    return new Date(Number.NaN);
  }
  if (dateLike instanceof Date || typeof dateLike === 'string' || typeof dateLike === 'number') {
    return new Date(dateLike);
  }
  const millis = toMillis(dateLike);
  return millis !== undefined ? new Date(millis) : new Date(Number.NaN);
};

const MonthlyExpenseBarChart = ({ expenses }: MonthlyExpenseBarChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chart = useRef<IChartApi | null>(null);
  const barSeries = useRef<ISeriesApi<'Histogram', Time> | null>(null);
  const lineSeries = useRef<ISeriesApi<'Line', Time> | null>(null);

  const normalizedExpenses = useMemo(
    () => (Array.isArray(expenses) ? expenses : []),
    [expenses],
  );

  const { monthlyData, totalAccumulated } = useMemo<MonthlyExpenseAccumulation>(() => {
    const monthlyData: Record<string, number> = {};
    let total = 0;
    normalizedExpenses.forEach((entry) => {
      const expense = 'expense' in entry ? entry.expense : entry;
      const date = resolveExpenseDate(expense?.dates?.expenseDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      const amountRaw = expense?.amount ?? 0;
      const amount =
        typeof amountRaw === 'number' ? amountRaw : Number(amountRaw);
      const normalizedAmount = Number.isFinite(amount) ? amount : 0;
      monthlyData[monthKey] = (monthlyData[monthKey] ?? 0) + normalizedAmount;
      total += normalizedAmount;
    });
    return { monthlyData, totalAccumulated: total };
  }, [normalizedExpenses]);

  const barData = useMemo<HistogramData<Time>[]>(
    () =>
      Object.entries(monthlyData).map(([time, value]) => ({
        time,
        value,
      })),
    [monthlyData]
  );
  const lineData = useMemo<LineData<Time>[]>(
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

      barSeries.current = chart.current.addSeries(HistogramSeries, {
        color: 'rgba(54, 162, 235, 0.5)',
        priceFormat: { type: 'volume' },
        scaleMargins: { top: 0.7, bottom: 0 },
      });

      lineSeries.current = chart.current.addSeries(LineSeries, {
        color: 'rgba(255, 99, 132, 1)',
        lineWidth: 2,
      });
    }

    barSeries.current?.setData(barData);
    lineSeries.current?.setData(lineData);
    chart.current?.timeScale().fitContent();

    return () => {
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
      barSeries.current = null;
      lineSeries.current = null;
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
