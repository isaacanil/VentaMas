import { DateTime } from 'luxon';
import { useSelector } from 'react-redux';
import { useDialog } from '@/Context/Dialog/useDialog';
import { selectUser } from '@/features/auth/userSlice';
import { fbCancelPurchase } from '@/firebase/purchase/fbCancelPurchase';
import { toMillis } from '@/utils/date/toMillis';
import type { UserIdentity } from '@/types/users';
import type { Purchase } from '@/utils/purchase/types';
import { calculateTotalNewStockFromReplenishments } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Order/components/OrderListTable/orderTableUtils';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { columns } from './tableConfig';

interface PurchaseTableProps {
  purchases?: Purchase[];
  loadingPurchases?: boolean;
}

const formatDateGroup = (createdAt?: Purchase['createdAt']) => {
  const millis = toMillis(createdAt);
  if (!Number.isFinite(millis)) return '';
  return DateTime.fromMillis(millis as number).toLocaleString(DateTime.DATE_FULL);
};

const calculatePurchaseTotal = (purchase?: Purchase): number => {
  const items = purchase?.replenishments || [];
  return items.reduce((acc, item) => {
    const value = Number(item.subtotal ?? item.subTotal ?? 0);
    return acc + (Number.isFinite(value) ? value : 0);
  }, 0);
};

export function PurchaseTable({ purchases, loadingPurchases }: PurchaseTableProps) {
  const { setDialogConfirm } = useDialog();
  const user = useSelector(selectUser) as UserIdentity | null;

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

  const mappedData = data.map((purchase) => ({
    state: purchase?.state,
    condition: purchase?.condition,
    number: purchase?.numberId,
    provider: (purchase?.provider as { name?: string } | undefined)?.name,
    note: purchase?.note,
    deliveryAt: purchase?.deliveryAt,
    status: purchase?.status,
    fileList: purchase?.attachmentUrls || [],
    items: calculateTotalNewStockFromReplenishments(purchase?.replenishments),
    paymentAt: purchase?.paymentAt,
    total: calculatePurchaseTotal(purchase),
    action: {
      ...purchase,
      onCancel: () => handleCancelPurchase(purchase),
    },
    dateGroup: formatDateGroup(purchase?.createdAt),
  }));

  return (
    <AdvancedTable
      tableName={'Lista de Compras'}
      columns={columns}
      data={mappedData}
      loading={loadingPurchases}
      groupBy={'dateGroup'}
    />
  );
}
