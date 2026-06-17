import { DateTime } from 'luxon';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '@/context/Dialog/useDialog';
import { selectUser } from '@/features/auth/userSlice';
import { fbCancelPurchase } from '@/firebase/purchase/fbCancelPurchase';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useOpenAccountingEntry } from '@/modules/accounting/public';
import { replacePathParams } from '@/router/routes/replacePathParams';
import { ROUTES } from '@/router/routes/routesName';
import { resolvePurchaseDisplayNextPaymentAt } from '@/utils/purchase/financials';
import { toMillis } from '@/utils/date/toMillis';
import { normalizeTransactionMillis } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/utils/transactionDates';
import type { UserIdentity } from '@/types/users';
import type { Purchase } from '@/utils/purchase/types';
import { calculateTotalNewStockFromReplenishments } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Order/components/OrderListTable/orderTableUtils';
import { AdvancedTable } from '@/components/ui/AdvancedTable';
import {
  RegisterSupplierPaymentModal,
  SupplierPaymentHistoryModal,
} from '../../../../../components/supplierPayments';
import { columns } from './tableConfig';

interface PurchaseTableProps {
  purchases?: Purchase[];
  loadingPurchases?: boolean;
  tableName?: string;
  enablePayablesActions?: boolean;
}

const formatDateGroup = (createdAt?: Purchase['createdAt']) => {
  const millis = toMillis(createdAt);
  if (!Number.isFinite(millis)) return '';
  return DateTime.fromMillis(millis as number).toLocaleString(
    DateTime.DATE_FULL,
  );
};

const calculatePurchaseTotal = (purchase?: Purchase): number => {
  const items = purchase?.replenishments || [];
  return items.reduce((acc, item) => {
    const value = Number(item.subtotal ?? item.subTotal ?? 0);
    return acc + (Number.isFinite(value) ? value : 0);
  }, 0);
};

export function PurchaseTable({
  purchases,
  loadingPurchases,
  tableName = 'Lista de Compras',
  enablePayablesActions = true,
}: PurchaseTableProps) {
  const { setDialogConfirm } = useDialog();
  const navigate = useNavigate();
  const openAccountingEntry = useOpenAccountingEntry();
  const user = useSelector(selectUser) as UserIdentity | null;
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null,
  );
  const [historyPurchase, setHistoryPurchase] = useState<Purchase | null>(null);
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId,
  );

  const handleCancelPurchase = (purchase: Purchase) => {
    if (!user) return;
    setDialogConfirm({
      title: 'Cancelar compra',
      isOpen: true,
      type: 'error',
      message: '¿Está seguro que desea cancelar esta compra?',
      onConfirm: async () => {
        await fbCancelPurchase(user, purchase.id || '');
      },
      successMessage: 'Compra cancelada exitosamente',
    });
  };

  const data = purchases || [];

  const handleOpenPurchase = (purchase: Purchase) => {
    if (!purchase.id) return;
    navigate(
      replacePathParams(ROUTES.PURCHASE_TERM.PURCHASES_COMPLETE, purchase.id),
    );
  };

  const handleOpenRegisterPayment = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
  };

  const handleOpenPaymentHistory = (purchase: Purchase) => {
    setHistoryPurchase(purchase);
  };

  const mappedData = data.map((purchase) => ({
    state: purchase?.state,
    condition: purchase?.condition,
    number: purchase?.numberId,
    provider: (purchase?.provider as { name?: string } | undefined)?.name,
    note: purchase?.note,
    deliveryAt: normalizeTransactionMillis(purchase?.deliveryAt),
    status: purchase?.status,
    items: calculateTotalNewStockFromReplenishments(purchase?.replenishments),
    paymentAt: normalizeTransactionMillis(purchase?.paymentAt),
    nextPaymentAt: normalizeTransactionMillis(
      resolvePurchaseDisplayNextPaymentAt(purchase),
    ),
    paymentStatus: purchase?.paymentState?.status || null,
    paymentBalance:
      typeof purchase?.paymentState?.balance === 'number'
        ? purchase.paymentState.balance
        : 0,
    total: calculatePurchaseTotal(purchase),
    action: {
      ...purchase,
      onCancel: () => handleCancelPurchase(purchase),
      onOpenPurchase: enablePayablesActions
        ? () => handleOpenPurchase(purchase)
        : undefined,
      onOpenAccountingEntry: isAccountingRolloutEnabled && purchase.id
        ? () =>
            openAccountingEntry({
              eventType: 'purchase.committed',
              sourceDocumentId: purchase.id,
              sourceDocumentType: 'purchase',
            })
        : undefined,
      onRegisterPayment: enablePayablesActions && isAccountingRolloutEnabled
        ? () => handleOpenRegisterPayment(purchase)
        : undefined,
      onViewPayments: enablePayablesActions && isAccountingRolloutEnabled
        ? () => handleOpenPaymentHistory(purchase)
        : undefined,
    },
    dateGroup: formatDateGroup(purchase?.createdAt),
  }));

  return (
    <>
      <AdvancedTable
        tableName={tableName}
        columns={columns as any}
        data={mappedData as any}
        loading={loadingPurchases}
        groupBy={'dateGroup'}
        rowSize={'large'}
      />
      <RegisterSupplierPaymentModal
        key={selectedPurchase?.id ?? 'register-supplier-payment'}
        open={Boolean(selectedPurchase)}
        purchase={selectedPurchase}
        onCancel={() => setSelectedPurchase(null)}
      />
      <SupplierPaymentHistoryModal
        key={historyPurchase?.id ?? 'supplier-payment-history'}
        open={Boolean(historyPurchase)}
        purchase={historyPurchase}
        onCancel={() => setHistoryPurchase(null)}
      />
    </>
  );
}

