import { calculateOrderTotals } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/OrderManagement/utils/orderCalculationsUtil';
import type { Order } from '@/utils/order/types';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import {
  calculatePaymentDate,
  calculateTotalNewStockFromReplenishments,
} from './orderTableUtils';
import { columns } from './tableConfig';

interface OrdersTableProps {
  orders?: Order[];
  loading?: boolean;
}

const EMPTY_ORDERS: Order[] = [];

export const OrdersTable = ({
  orders = EMPTY_ORDERS,
  loading = true,
}: OrdersTableProps) => {
  const data = orders.map((order) => {
    const createdAt = order?.createdAt || null;
    const paymentDate = createdAt
      ? calculatePaymentDate(createdAt, order?.condition)
      : null;
    const { grandTotal } = calculateOrderTotals(order.replenishments || []);

    return {
      number: order?.numberId,
      status: order?.status,
      provider: (order?.provider as { name?: string } | undefined)?.name,
      condition: order?.condition,
      note: order?.note,
      createdAt: order?.createdAt,
      paymentDate,
      items: calculateTotalNewStockFromReplenishments(order?.replenishments),
      deliveryDate: order?.deliveryDate,
      fileList: order?.attachmentUrls || [],
      total: grandTotal,
      action: order,
    };
  });

  return (
    <AdvancedTable
      tableName={'Lista de Pedidos Pendientes'}
      columns={columns}
      data={data}
      loading={loading}
    />
  );
};
