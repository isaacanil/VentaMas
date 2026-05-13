import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useListenAccountsReceivable } from '@/firebase/accountsReceivable/accountReceivableServices';
import { useFbGetInvoices } from '@/firebase/invoices/fbGetInvoices';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { selectUser } from '@/features/auth/userSlice';
import { useFiscalReceiptsAlerts } from '@/hooks/useFiscalReceiptsAlerts';
import {
  useInventoryProductIds,
  useListenAllActiveProductsStock,
} from '@/hooks/useProductStock';
import { useStockAlertThresholds } from '@/hooks/useStockAlertThresholds';
import { useListenVendorBills } from '@/hooks/useVendorBills';
import { getDateRange } from '@/utils/date/getDateRange';
import type { UserIdentity } from '@/types/users';

import type { HomeDashboardData } from '../types';
import {
  buildCashActivity,
  buildOperationalAlerts,
  buildRecentActivities,
  buildSalesTrend,
  buildTopProducts,
  formatDashboardMoney,
  sumInvoices,
  sumPendingInvoices,
  summarizePayables,
  summarizeReceivables,
  summarizeStock,
} from '../utils/homeDashboardMetrics';

export const useHomeDashboardData = (): HomeDashboardData => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const todayRange = useMemo(() => getDateRange('today'), []);
  const monthRange = useMemo(() => getDateRange('thisMonth'), []);

  const { invoices: todayInvoices, loading: todayInvoicesLoading } =
    useFbGetInvoices(todayRange);
  const { invoices: monthInvoices, loading: monthInvoicesLoading } =
    useFbGetInvoices(monthRange);
  const { accountsReceivable, loading: receivablesLoading } =
    useListenAccountsReceivable(user, null, 'active');
  const { vendorBills, isLoading: vendorBillsLoading } = useListenVendorBills();
  const { data: stockData, loading: stockLoading } =
    useListenAllActiveProductsStock();
  const { data: inventoriedProductIds, loading: inventoryIdsLoading } =
    useInventoryProductIds();
  const { lowThreshold, criticalThreshold } = useStockAlertThresholds();
  const { status: cashStatus, cashCount } = useIsOpenCashReconciliation();
  const fiscal = useFiscalReceiptsAlerts();

  return useMemo<HomeDashboardData>(() => {
    const todaySales = sumInvoices(todayInvoices);
    const pendingInvoices = sumPendingInvoices(monthInvoices);
    const receivables = summarizeReceivables(accountsReceivable);
    const payables = summarizePayables(vendorBills);
    const stockSummary = summarizeStock({
      stock: stockData,
      inventoriedProductIds,
      lowThreshold,
      criticalThreshold,
    });
    const fiscalIssueCount = fiscal.alertSummary?.needingAttention ?? 0;
    const fiscalRemainingNumbers =
      typeof fiscal.mostUrgent?.remainingNumbers === 'number'
        ? fiscal.mostUrgent.remainingNumbers
        : undefined;
    const fiscalMessage =
      fiscal.mostUrgent?.name && fiscal.mostUrgent?.series
        ? `${fiscal.mostUrgent.name} serie ${fiscal.mostUrgent.series}: ${fiscal.mostUrgent.remainingNumbers} restantes.`
        : fiscal.widgetData?.message || 'Comprobantes fiscales pendientes.';
    const cashStatusLabel =
      cashStatus === 'open'
        ? 'Abierta'
        : cashStatus === 'closing'
          ? 'En cierre'
          : cashStatus === 'loading'
            ? 'Cargando'
            : 'Sin caja';
    const cashDetail = cashCount?.incrementNumber
      ? `Cuadre ${cashCount.incrementNumber}`
      : 'Caja del usuario actual';
    const cashTone =
      cashStatus === 'open'
        ? 'success'
        : cashStatus === 'closing'
          ? 'warning'
          : 'neutral';

    const cashActivity = buildCashActivity({
      status: cashStatus,
      cashCount,
    });
    const activities = buildRecentActivities(monthInvoices);
    if (cashActivity) activities.unshift(cashActivity);

    const alerts = buildOperationalAlerts({
      pendingInvoices,
      payables,
      stockSummary,
      fiscalIssues: fiscalIssueCount,
      fiscalMessage,
    });

    return {
      alerts,
      activities: activities.slice(0, 7),
      topProducts: buildTopProducts(monthInvoices),
      trend: buildSalesTrend(monthInvoices),
      summary: {
        today: {
          salesAmount: todaySales,
          salesLabel: formatDashboardMoney(todaySales),
          invoiceCount: todayInvoices.length,
          invoiceLabel: `${todayInvoices.length} ticket${todayInvoices.length === 1 ? '' : 's'} emitido${todayInvoices.length === 1 ? '' : 's'}`,
        },
        cash: {
          statusLabel: cashStatusLabel,
          detail: cashDetail,
          amountLabel:
            cashCount?.totalSystem !== undefined
              ? formatDashboardMoney(Number(cashCount.totalSystem))
              : undefined,
          tone: cashTone,
        },
        finance: {
          receivableAmount: receivables.amount,
          receivableLabel: formatDashboardMoney(receivables.amount),
          receivableCount: receivables.count,
          payableAmount: payables.amount,
          payableLabel: formatDashboardMoney(payables.amount),
          payableCount: payables.count,
          payableOverdueCount: payables.overdueCount,
          netAmount: receivables.amount - payables.amount,
          netLabel: formatDashboardMoney(receivables.amount - payables.amount),
        },
        inventory: {
          criticalCount: stockSummary.criticalCount,
          lowCount: stockSummary.lowCount,
          missingStockCount: stockSummary.missingStockCount,
          lowThreshold,
        },
        fiscal: {
          issueCount: fiscalIssueCount,
          message: fiscalMessage,
          name: fiscal.mostUrgent?.name,
          series: fiscal.mostUrgent?.series,
          remainingNumbers: fiscalRemainingNumbers,
        },
      },
      loading:
        todayInvoicesLoading ||
        monthInvoicesLoading ||
        receivablesLoading ||
        vendorBillsLoading ||
        stockLoading ||
        inventoryIdsLoading ||
        cashStatus === 'loading' ||
        fiscal.isLoading,
      updatedAtLabel: `Actualizado ${new Date().toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    };
  }, [
    accountsReceivable,
    cashCount,
    cashStatus,
    criticalThreshold,
    fiscal,
    inventoryIdsLoading,
    inventoriedProductIds,
    lowThreshold,
    monthInvoices,
    monthInvoicesLoading,
    receivablesLoading,
    stockData,
    stockLoading,
    todayInvoices,
    todayInvoicesLoading,
    vendorBills,
    vendorBillsLoading,
  ]);
};
