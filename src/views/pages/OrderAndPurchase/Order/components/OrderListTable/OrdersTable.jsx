import { calculateOrderTotals } from '@/views/pages/OrderAndPurchase/OrderManagement/utils/orderCalculationsUtil';
import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';

import {
  calculatePaymentDate,
  calculateTotalNewStockFromReplenishments,
} from './orderTableUtils';
import { columns } from './tableConfig.jsx';

export const OrdersTable = ({ orders = [], loading = true }) => {
  const data = orders.map((data) => {
    const createdAt = data?.createdAt || null;
    const paymentDate = createdAt
      ? calculatePaymentDate(createdAt, data?.condition)
      : null;
    const { grandTotal } = calculateOrderTotals(data.replenishments);

    return {
      number: data?.numberId,
      status: data?.status,
      provider: data?.provider?.name,
      condition: data?.condition,
      note: data?.note,
      createdAt: data?.createdAt,
      paymentDate,
      items: calculateTotalNewStockFromReplenishments(data?.replenishments),
      deliveryDate: data?.deliveryDate,
      fileList: data?.attachmentUrls || [],
      total: grandTotal,
      action: data,
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
