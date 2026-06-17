import { DateTime } from 'luxon';

import { getInvoicePaymentInfo } from '@/utils/invoice';
import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format';
import { getInvoiceProductQuantity, type InvoiceDoc } from '@/firebase/invoices/types';
import type { ExpenseDoc } from '@/utils/expenses/types';
import type { AccountsReceivableRecord } from '@/utils/accountsReceivable/types';
import type { AggregatedProductStock } from '@/utils/inventory/types';
import type { VendorBill } from '@/domain/accountsPayable/vendorBills/types';
import { isOpenVendorBill } from '@/domain/accountsPayable/vendorBills/fromPurchase';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';

import type {
  HomeDashboardActivity,
  HomeDashboardAlert,
  HomeDashboardProduct,
  HomeDashboardTrendPoint,
} from '../types';

const DOP_SYMBOL = 'rd';
const DAY_KEY_FORMAT = 'yyyy-MM-dd';

export const formatDashboardMoney = (value: number): string =>
  formatPrice(Number.isFinite(value) ? value : 0, DOP_SYMBOL);

const toNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const invoiceMillis = (invoice: InvoiceDoc): number | null => {
  const millis = toMillis(invoice?.data?.date ?? null);
  return typeof millis === 'number' ? millis : null;
};

const invoiceNumber = (invoice: InvoiceDoc): string =>
  String(invoice?.data?.numberID ?? invoice?.data?.id ?? 'sin numero');

const invoiceClientName = (invoice: InvoiceDoc): string =>
  invoice?.data?.client?.name?.trim() || 'Cliente sin nombre';

export const sumInvoices = (invoices: InvoiceDoc[]): number =>
  invoices.reduce(
    (total, invoice) => total + getInvoicePaymentInfo(invoice.data).total,
    0,
  );

export const sumPendingInvoices = (
  invoices: InvoiceDoc[],
): { count: number; amount: number } =>
  invoices.reduce(
    (summary, invoice) => {
      const payment = getInvoicePaymentInfo(invoice.data);
      if (payment.pending <= 0.01) return summary;
      return {
        count: summary.count + 1,
        amount: summary.amount + payment.pending,
      };
    },
    { count: 0, amount: 0 },
  );

export const sumExpenses = (expenses: ExpenseDoc[]): number =>
  expenses.reduce(
    (total, expense) => total + toNumber(expense?.expense?.amount),
    0,
  );

export const summarizeReceivables = (
  accounts: AccountsReceivableRecord[],
): { count: number; amount: number } =>
  accounts.reduce(
    (summary, record) => {
      const balance =
        toNumber(record.balance, NaN) ||
        toNumber(record.account?.arBalance, NaN) ||
        toNumber(record.account?.currentBalance, NaN) ||
        Math.max(
          toNumber(record.account?.totalReceivable) -
            toNumber(record.account?.totalPaid),
          0,
        );
      return {
        count: summary.count + 1,
        amount: summary.amount + (Number.isFinite(balance) ? balance : 0),
      };
    },
    { count: 0, amount: 0 },
  );

export const summarizePayables = (
  vendorBills: VendorBill[],
): { count: number; amount: number; overdueCount: number } => {
  const openBills = vendorBills.filter(isOpenVendorBill);
  const now = Date.now();
  return openBills.reduce(
    (summary, bill) => {
      const dueAt = toMillis(bill.dueAt ?? null);
      const balance =
        toNumber(bill.paymentState?.balance, NaN) ||
        toNumber(bill.totals?.balance, NaN);
      return {
        count: summary.count + 1,
        amount: summary.amount + (Number.isFinite(balance) ? balance : 0),
        overdueCount:
          summary.overdueCount +
          (typeof dueAt === 'number' && dueAt < now ? 1 : 0),
      };
    },
    { count: 0, amount: 0, overdueCount: 0 },
  );
};

export const summarizeStock = ({
  stock,
  inventoriedProductIds,
  lowThreshold,
  criticalThreshold,
}: {
  stock: AggregatedProductStock[];
  inventoriedProductIds: ReadonlySet<string>;
  lowThreshold: number;
  criticalThreshold: number;
}): {
  lowCount: number;
  criticalCount: number;
  missingStockCount: number;
  lowestProducts: AggregatedProductStock[];
} => {
  const stockProductIds = new Set(
    stock.map((item) => item.id).filter(Boolean) as string[],
  );
  const missingStockCount = Array.from(inventoriedProductIds).filter(
    (productId) => !stockProductIds.has(productId),
  ).length;
  const lowProducts = stock.filter((item) => {
    const totalStock = toNumber(item.totalStock);
    return totalStock <= lowThreshold;
  });

  return {
    lowCount: lowProducts.length + missingStockCount,
    criticalCount:
      lowProducts.filter((item) => toNumber(item.totalStock) <= criticalThreshold)
        .length + missingStockCount,
    missingStockCount,
    lowestProducts: [...lowProducts]
      .sort((left, right) => toNumber(left.totalStock) - toNumber(right.totalStock))
      .slice(0, 4),
  };
};

export const buildTopProducts = (
  invoices: InvoiceDoc[],
): HomeDashboardProduct[] => {
  const byProduct = new Map<
    string,
    { id: string; name: string; quantity: number; revenue: number }
  >();

  invoices.forEach((invoice) => {
    invoice.data.products?.forEach((product, index) => {
      const id = String(product.id ?? product.productId ?? product.cid ?? index);
      const name =
        product.name?.trim() ||
        product.productName?.trim() ||
        `Producto ${index + 1}`;
      const quantity = getInvoiceProductQuantity(product);
      const explicitTotal = toNumber(product.price?.total, NaN);
      const unitPrice =
        toNumber(product.price?.unit, NaN) ||
        toNumber(product.selectedSaleUnit?.pricing?.price, NaN) ||
        toNumber(product.pricing?.price, 0);
      const revenue = Number.isFinite(explicitTotal)
        ? explicitTotal
        : unitPrice * quantity;
      const current = byProduct.get(id) ?? {
        id,
        name,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += quantity;
      current.revenue += Number.isFinite(revenue) ? revenue : 0;
      byProduct.set(id, current);
    });
  });

  return Array.from(byProduct.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5)
    .map((product) => ({
      ...product,
      revenueLabel: formatDashboardMoney(product.revenue),
    }));
};

export const buildSalesTrend = (
  invoices: InvoiceDoc[],
): HomeDashboardTrendPoint[] => {
  const now = DateTime.local();
  const points = Array.from({ length: 7 }, (_, index) => {
    const day = now.minus({ days: 6 - index });
    return {
      key: day.toFormat(DAY_KEY_FORMAT),
      label: day.toFormat('dd/LL'),
      total: 0,
      valueLabel: formatDashboardMoney(0),
    };
  });
  const byKey = new Map(points.map((point) => [point.key, point]));

  invoices.forEach((invoice) => {
    const millis = invoiceMillis(invoice);
    if (millis === null) return;
    const key = DateTime.fromMillis(millis).toFormat(DAY_KEY_FORMAT);
    const point = byKey.get(key);
    if (!point) return;
    point.total += getInvoicePaymentInfo(invoice.data).total;
    point.valueLabel = formatDashboardMoney(point.total);
  });

  return points;
};

export const buildRecentActivities = (
  invoices: InvoiceDoc[],
): HomeDashboardActivity[] =>
  [...invoices]
    .sort((left, right) => (invoiceMillis(right) ?? 0) - (invoiceMillis(left) ?? 0))
    .slice(0, 6)
    .map((invoice) => {
      const millis = invoiceMillis(invoice);
      const payment = getInvoicePaymentInfo(invoice.data);
      return {
        id: String(invoice.data.id ?? invoiceNumber(invoice)),
        title: `Factura ${invoiceNumber(invoice)}`,
        description: invoiceClientName(invoice),
        amount: formatDashboardMoney(payment.total),
        timestampLabel:
          millis === null
            ? 'Sin fecha'
            : DateTime.fromMillis(millis).toFormat('dd/LL HH:mm'),
        route: '/bills',
        tone: payment.pending > 0.01 ? 'warning' : 'success',
      };
    });

export const buildCashActivity = ({
  status,
  cashCount,
}: {
  status: CashCountState | 'loading';
  cashCount: CashCountRecord | null;
}): HomeDashboardActivity | null => {
  if (status === 'loading' || status === 'none') return null;
  if (!cashCount) {
    return {
      id: `cash-${status}`,
      title: 'Caja sin apertura propia',
      description: 'Hay caja activa de otro usuario o contexto cerrado.',
      route: '/cash-reconciliation',
      timestampLabel: 'Ahora',
      tone: 'neutral',
    };
  }

  return {
    id: `cash-${cashCount.id ?? status}`,
    title: status === 'open' ? 'Caja abierta' : 'Caja en cierre',
    description: `Cuadre ${cashCount.incrementNumber ?? cashCount.id ?? ''}`.trim(),
    amount: formatDashboardMoney(
      toNumber(cashCount.totalSystem ?? cashCount.totalSales ?? cashCount.total),
    ),
    route: '/cash-reconciliation',
    timestampLabel: 'Ahora',
    tone: status === 'open' ? 'success' : 'warning',
  };
};

export const buildOperationalAlerts = ({
  pendingInvoices,
  payables,
  stockSummary,
  fiscalIssues,
  fiscalMessage,
}: {
  pendingInvoices: { count: number; amount: number };
  payables: { count: number; amount: number; overdueCount: number };
  stockSummary: {
    lowCount: number;
    criticalCount: number;
    missingStockCount: number;
  };
  fiscalIssues: number;
  fiscalMessage: string;
}): HomeDashboardAlert[] => {
  const alerts: HomeDashboardAlert[] = [];

  if (fiscalIssues > 0) {
    alerts.push({
      id: 'fiscal-receipts',
      title: 'NCF requiere atención',
      description: fiscalMessage,
      tone: 'danger',
      route: '/settings/tax-receipt',
      meta: fiscalMessage,
    });
  }

  if (stockSummary.criticalCount > 0) {
    alerts.push({
      id: 'critical-stock',
      title: 'Inventario crítico',
      description:
        stockSummary.missingStockCount > 0
          ? `${stockSummary.criticalCount} productos críticos, ${stockSummary.missingStockCount} sin existencia registrada.`
          : `${stockSummary.criticalCount} productos en nivel crítico.`,
      tone: 'danger',
      route: '/inventory/summary',
      meta:
        stockSummary.missingStockCount > 0
          ? `${stockSummary.criticalCount} críticos · ${stockSummary.missingStockCount} sin existencia`
          : `${stockSummary.criticalCount} críticos`,
    });
  }

  if (payables.overdueCount > 0) {
    alerts.push({
      id: 'payables-overdue',
      title: 'Cuentas por pagar vencidas',
      description: `${payables.overdueCount} documento${payables.overdueCount === 1 ? '' : 's'} vencido${payables.overdueCount === 1 ? '' : 's'}.`,
      tone: 'warning',
      route: '/accounts-payable/list',
      meta: formatDashboardMoney(payables.amount),
    });
  }

  if (pendingInvoices.count > 0) {
    alerts.push({
      id: 'pending-invoices',
      title: 'Facturas pendientes del mes',
      description: `${pendingInvoices.count} factura${pendingInvoices.count === 1 ? '' : 's'} con balance pendiente.`,
      tone: 'warning',
      route: '/bills',
      meta: formatDashboardMoney(pendingInvoices.amount),
    });
  }

  return alerts.slice(0, 5);
};
