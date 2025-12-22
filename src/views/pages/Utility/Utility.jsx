import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { designSystemV2 } from '../../../theme/designSystemV2';
import { MenuApp } from '../../templates/MenuApp/MenuApp';

import { BestDayHighlightCard } from './components/BestDayHighlightCard';
import { DailyPerformanceChart } from './components/DailyPerformanceChart';
import { RangeComparisonCard } from './components/RangeComparisonCard';
import { RevenueDistributionChart } from './components/RevenueDistributionChart';
import { TotalSalesCard } from './components/TotalSalesCard';
import { UtilityHeader } from './components/UtilityHeader';
import { UtilityInsightsTabs } from './components/UtilityInsightsTabs';
import { useUtilityDashboard } from './hooks/useUtilityDashboard';
import { exportTransactionsExcel } from './utils/exportTransactionsExcel';
import { buildTransactionRows } from './utils/transactionRows';
import './utils/registerCharts';

const EXPORT_EVENT = 'utility-export-request';
const AVAILABILITY_EVENT = 'utility-export-availability';

const { colors, spacing } = designSystemV2;

export const Utility = () => {
  const {
    rangeComparison,
    dailyChartData,
    dailyChartOptions,
    pieChartData,
    pieChartOptions,
    distributionDetails,
    formatCurrency,
    formatPercentage,
    loading,
    comparisonLoading,
    chartSubtitle,
    rangeLabel,
    rangeDetailLabel,
    presetLabel,
    onPresetSelect,
    selectedRange,
    summary,
    dailyMetrics,
    productsBreakdown,
    salesComparison,
  } = useUtilityDashboard();

  const canExportTransactions = useMemo(
    () => buildTransactionRows(dailyMetrics).length > 0,
    [dailyMetrics],
  );

  const handleExportTransactions = useCallback(async () => {
    if (canExportTransactions) {
      try {
        await exportTransactionsExcel(dailyMetrics);
      } catch (error) {
        console.error('Error al exportar transacciones:', error);
      }
    }
  }, [dailyMetrics, canExportTransactions]);

  useEffect(() => {
    const listener = () => {
      void handleExportTransactions();
    };

    window.addEventListener(EXPORT_EVENT, listener);
    return () => {
      window.removeEventListener(EXPORT_EVENT, listener);
    };
  }, [handleExportTransactions]);

  useEffect(() => {
    const event = new CustomEvent(AVAILABILITY_EVENT, {
      detail: { canExport: canExportTransactions },
    });
    window.dispatchEvent(event);
  }, [canExportTransactions]);

  return (
    <Container>
      <MenuApp sectionName={'Utilidad'} />
      <DashboardWrapper>
        <UtilityHeader
          rangeLabel={rangeLabel}
          rangeDetailLabel={rangeDetailLabel}
          presetLabel={presetLabel}
          selectedRange={selectedRange}
          onPresetSelect={onPresetSelect}
        />
        <ComparisonSection>
          <TotalSalesCard
            loading={comparisonLoading}
            comparison={salesComparison}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
          <RangeComparisonCard
            loading={comparisonLoading}
            comparison={rangeComparison}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
          <BestDayHighlightCard
            loading={loading}
            summary={summary}
            dailyMetrics={dailyMetrics}
            formatCurrency={formatCurrency}
          />
        </ComparisonSection>

        <AnalyticsGrid>
          <DailyPerformanceChart
            loading={loading}
            chartData={dailyChartData}
            chartOptions={dailyChartOptions}
            subtitle={chartSubtitle}
          />
          <RevenueDistributionChart
            loading={loading}
            chartData={pieChartData}
            chartOptions={pieChartOptions}
            distributionDetails={distributionDetails}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            totalSales={summary.totalSales}
          />
        </AnalyticsGrid>

        <UtilityInsightsTabs
          dailyMetrics={dailyMetrics}
          formatCurrency={formatCurrency}
          summary={summary}
          productsBreakdown={productsBreakdown}
        />
      </DashboardWrapper>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  min-height: 100vh;
  color: ${colors.text.primary};
  background: ${colors.background.canvas};
`;

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xxl};
  padding: ${spacing.xxl};
  overflow-y: auto;
`;

const ComparisonSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${spacing.xl};
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${spacing.xxl};
`;
