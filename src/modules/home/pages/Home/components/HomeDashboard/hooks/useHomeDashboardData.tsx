import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked,
  faCashRegister,
  faChartLine,
  faClipboardCheck,
  faFileInvoiceDollar,
  faReceipt,
  faTriangleExclamation,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';

import { useListenAccountsReceivable } from '@/firebase/accountsReceivable/accountReceivableServices';
import { useLocalFbGetExpenses } from '@/firebase/expenses/Items/useFbGetExpenses';
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
import ROUTES_NAME from '@/router/routes/routesName';
import { getDateRange } from '@/utils/date/getDateRange';
import type { UserIdentity } from '@/types/users';

import type { HomeDashboardData, HomeDashboardMetric } from '../types';
import {
  buildCashActivity,
  buildOperationalAlerts,
  buildPreparedWidgets,
  buildRecentActivities,
  buildSalesTrend,
  buildTopProducts,
  formatDashboardMoney,
  sumExpenses,
  sumInvoices,
  sumPendingInvoices,
  summarizePayables,
  summarizeReceivables,
  summarizeStock,
} from '../utils/homeDashboardMetrics';

const {
  SALES_TERM,
  ACCOUNT_RECEIVABLE,
  ACCOUNT_PAYABLE,
  INVENTORY_TERM,
  CASH_RECONCILIATION_TERM,
  SETTING_TERM,
} = ROUTES_NAME;

const buildDeltaLabel = (current: number, previous: number): string => {
  if (!previous) return 'Sin comparativo anterior';
  const delta = current - previous;
  const percentage = Math.round((delta / Math.abs(previous)) * 100);
  if (percentage === 0) return 'Igual que mes anterior';
  return `${percentage > 0 ? '+' : ''}${percentage}% vs mes anterior`;
};

export const useHomeDashboardData = (): HomeDashboardData => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const todayRange = useMemo(() => getDateRange('today'), []);
  const monthRange = useMemo(() => getDateRange('thisMonth'), []);
  const previousMonthRange = useMemo(() => getDateRange('lastMonth'), []);

  const { invoices: todayInvoices, loading: todayInvoicesLoading } =
    useFbGetInvoices(todayRange);
  const { invoices: monthInvoices, loading: monthInvoicesLoading } =
    useFbGetInvoices(monthRange);
  const {
    invoices: previousMonthInvoices,
    loading: previousMonthInvoicesLoading,
  } = useFbGetInvoices(previousMonthRange);
  const { expenses: monthExpenses, loading: monthExpensesLoading } =
    useLocalFbGetExpenses(monthRange);
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
    const monthSales = sumInvoices(monthInvoices);
    const previousMonthSales = sumInvoices(previousMonthInvoices);
    const monthExpensesTotal = sumExpenses(monthExpenses);
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
    const fiscalMessage =
      fiscal.mostUrgent?.name && fiscal.mostUrgent?.series
        ? `${fiscal.mostUrgent.name} serie ${fiscal.mostUrgent.series}: ${fiscal.mostUrgent.remainingNumbers} restantes.`
        : fiscal.widgetData?.message || 'Comprobantes fiscales pendientes.';

    const metrics: HomeDashboardMetric[] = [
      {
        id: 'today-sales',
        label: 'Ventas hoy',
        value: formatDashboardMoney(todaySales),
        detail: `${todayInvoices.length} factura${todayInvoices.length === 1 ? '' : 's'} emitida${todayInvoices.length === 1 ? '' : 's'}`,
        supportingValue: 'Tiempo real',
        tone: todaySales > 0 ? 'success' : 'neutral',
        route: SALES_TERM.BILLS,
        loading: todayInvoicesLoading,
        icon: <FontAwesomeIcon icon={faChartLine} />,
      },
      {
        id: 'month-sales',
        label: 'Ventas mes',
        value: formatDashboardMoney(monthSales),
        detail: buildDeltaLabel(monthSales, previousMonthSales),
        supportingValue: `${monthInvoices.length} documentos`,
        tone: monthSales >= previousMonthSales ? 'success' : 'warning',
        route: SALES_TERM.BILLS_ANALYTICS,
        loading: monthInvoicesLoading || previousMonthInvoicesLoading,
        icon: <FontAwesomeIcon icon={faReceipt} />,
      },
      {
        id: 'month-expenses',
        label: 'Gastos mes',
        value: formatDashboardMoney(monthExpensesTotal),
        detail: `${monthExpenses.length} gasto${monthExpenses.length === 1 ? '' : 's'} registrado${monthExpenses.length === 1 ? '' : 's'}`,
        supportingValue: `Neto ${formatDashboardMoney(monthSales - monthExpensesTotal)}`,
        tone: monthExpensesTotal > monthSales ? 'warning' : 'neutral',
        route: ROUTES_NAME.EXPENSES_TERM.EXPENSES_LIST,
        loading: monthExpensesLoading,
        icon: <FontAwesomeIcon icon={faWallet} />,
      },
      {
        id: 'pending-invoices',
        label: 'Facturas pendientes',
        value: formatDashboardMoney(pendingInvoices.amount),
        detail: `${pendingInvoices.count} factura${pendingInvoices.count === 1 ? '' : 's'} del mes con balance`,
        tone: pendingInvoices.amount > 0 ? 'warning' : 'success',
        route: SALES_TERM.BILLS,
        loading: monthInvoicesLoading,
        icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />,
      },
      {
        id: 'receivables',
        label: 'Cuentas por cobrar',
        value: formatDashboardMoney(receivables.amount),
        detail: `${receivables.count} cuenta${receivables.count === 1 ? '' : 's'} activa${receivables.count === 1 ? '' : 's'}`,
        tone: receivables.amount > 0 ? 'info' : 'success',
        route: ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST,
        loading: receivablesLoading,
        icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />,
      },
      {
        id: 'payables',
        label: 'Cuentas por pagar',
        value: formatDashboardMoney(payables.amount),
        detail: `${payables.count} abierta${payables.count === 1 ? '' : 's'} · ${payables.overdueCount} vencida${payables.overdueCount === 1 ? '' : 's'}`,
        tone: payables.overdueCount > 0 ? 'danger' : payables.amount > 0 ? 'warning' : 'success',
        route: ACCOUNT_PAYABLE.ACCOUNT_PAYABLE_LIST,
        loading: vendorBillsLoading,
        icon: <FontAwesomeIcon icon={faFileInvoiceDollar} />,
      },
      {
        id: 'low-stock',
        label: 'Inventario bajo',
        value: String(stockSummary.lowCount),
        detail: `${stockSummary.criticalCount} crítico${stockSummary.criticalCount === 1 ? '' : 's'} · umbral ${lowThreshold}`,
        supportingValue:
          stockSummary.missingStockCount > 0
            ? `${stockSummary.missingStockCount} sin existencia`
            : 'Stock activo',
        tone:
          stockSummary.criticalCount > 0
            ? 'danger'
            : stockSummary.lowCount > 0
              ? 'warning'
              : 'success',
        route: INVENTORY_TERM.INVENTORY_SUMMARY,
        loading: stockLoading || inventoryIdsLoading,
        icon: <FontAwesomeIcon icon={faBoxesStacked} />,
      },
      {
        id: 'cash-state',
        label: 'Estado de caja',
        value:
          cashStatus === 'open'
            ? 'Abierta'
            : cashStatus === 'closing'
              ? 'En cierre'
              : cashStatus === 'loading'
                ? 'Cargando'
                : 'Sin caja',
        detail: cashCount?.incrementNumber
          ? `Cuadre ${cashCount.incrementNumber}`
          : 'Caja del usuario actual',
        supportingValue:
          cashCount?.totalSystem !== undefined
            ? formatDashboardMoney(Number(cashCount.totalSystem))
            : undefined,
        tone:
          cashStatus === 'open'
            ? 'success'
            : cashStatus === 'closing'
              ? 'warning'
              : 'neutral',
        route: CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST,
        loading: cashStatus === 'loading',
        icon: <FontAwesomeIcon icon={faCashRegister} />,
      },
      {
        id: 'fiscal-alerts',
        label: 'Alertas NCF',
        value: String(fiscalIssueCount),
        detail:
          fiscal.widgetData?.seriesInfo ||
          fiscal.widgetData?.message ||
          'Sin alerta fiscal activa',
        tone: fiscalIssueCount > 0 ? 'danger' : 'success',
        route: SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT,
        loading: fiscal.isLoading,
        icon: <FontAwesomeIcon icon={faClipboardCheck} />,
      },
    ];

    const cashActivity = buildCashActivity({
      status: cashStatus,
      cashCount,
    });
    const activities = buildRecentActivities(monthInvoices);
    if (cashActivity) activities.unshift(cashActivity);
    if (fiscalIssueCount > 0) {
      activities.unshift({
        id: 'fiscal-activity',
        title: 'Alerta fiscal activa',
        description: fiscalMessage,
        route: SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT,
        tone: 'danger',
      });
    }

    const alerts = buildOperationalAlerts({
      pendingInvoices,
      receivables,
      payables,
      stockSummary,
      fiscalIssues: fiscalIssueCount,
      fiscalMessage,
    });

    if (!alerts.length) {
      alerts.push({
        id: 'all-clear',
        title: 'Sin alertas críticas',
        description:
          'NCF, caja, inventario y cartera no muestran incidencias críticas con los datos disponibles.',
        tone: 'success',
      });
    }

    return {
      metrics,
      alerts,
      activities: activities.slice(0, 7),
      topProducts: buildTopProducts(monthInvoices),
      trend: buildSalesTrend(monthInvoices),
      preparedWidgets: buildPreparedWidgets(),
      loading:
        todayInvoicesLoading ||
        monthInvoicesLoading ||
        previousMonthInvoicesLoading ||
        monthExpensesLoading ||
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
    monthExpenses,
    monthExpensesLoading,
    monthInvoices,
    monthInvoicesLoading,
    previousMonthInvoices,
    previousMonthInvoicesLoading,
    receivablesLoading,
    stockData,
    stockLoading,
    todayInvoices,
    todayInvoicesLoading,
    vendorBills,
    vendorBillsLoading,
  ]);
};
