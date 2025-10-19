import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { MenuApp } from '../../templates/MenuApp/MenuApp';
import { designSystemV2 } from '../../../theme/designSystemV2';
import { DailyPerformanceChart } from './components/DailyPerformanceChart';
import { RevenueDistributionChart } from './components/RevenueDistributionChart';
import { UtilityHeader } from './components/UtilityHeader';
import { RangeComparisonCard } from './components/RangeComparisonCard';
import { UtilityInsightsTabs } from './components/UtilityInsightsTabs';
import { exportTransactionsExcel } from './utils/exportTransactionsExcel';
import { buildTransactionRows } from './utils/transactionRows';
import { useUtilityDashboard } from './hooks/useUtilityDashboard';
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
        selectedPreset,
        rangeLabel,
        onPresetSelect,
        quickRanges,
        summary,
        dailyMetrics,
        productsBreakdown,
    } = useUtilityDashboard();

    const canExportTransactions = useMemo(
        () => buildTransactionRows(dailyMetrics).length > 0,
        [dailyMetrics]
    );

    const handleExportTransactions = useCallback(async () => {
        if (canExportTransactions) {
            try {
                await exportTransactionsExcel(dailyMetrics);
            } catch (error) {
                // eslint-disable-next-line no-console
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
                    selectedPreset={selectedPreset}
                    quickRanges={quickRanges}
                    onPresetSelect={onPresetSelect}
                />
                <ComparisonSection>
                    <RangeComparisonCard
                        loading={comparisonLoading}
                        comparison={rangeComparison}
                        formatCurrency={formatCurrency}
                        formatPercentage={formatPercentage}
                    />
                </ComparisonSection>

                <AnalyticsGrid>
                    <DailyPerformanceChart
                        loading={loading}
                        chartData={dailyChartData}
                        chartOptions={dailyChartOptions}
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
    min-height: 100vh;
    height: 100vh;
    background: ${colors.background.canvas};
    color: ${colors.text.primary};
`;

const DashboardWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacing.xxl};
    overflow-y: auto;
    padding: ${spacing.xxl};
`;

const ComparisonSection = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: ${spacing.xl};
`;

const AnalyticsGrid = styled.div`
    display: grid;
    gap: ${spacing.xxl};
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
`;
