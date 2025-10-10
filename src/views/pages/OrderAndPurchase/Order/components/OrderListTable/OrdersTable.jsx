import { DateTime } from 'luxon';

import { AdvancedTable } from '../../../../../templates/system/AdvancedTable/AdvancedTable'
import { calculateOrderTotals } from '../../../OrderManagement/utils/orderCalculationsUtil';

import { columns } from './tableConfig'


const calculatePaymentDate = (createdAt, conditionId) => {
  if (!createdAt) return null;

  let daysToAdd = 0;
  switch (conditionId) {
    case 'cash': // Contado, asumimos pago inmediato, así que no se añaden días.
      daysToAdd = 0;
      break;
    case 'one_week': // 1 semana
      daysToAdd = 7;
      break;
    case 'fifteen_days': // 15 días
      daysToAdd = 15;
      break;
    case 'thirty_days': // 30 días
      daysToAdd = 30;
      break;
    case 'other':
      daysToAdd = 0;
      break;
    default:
      break;
  }

  const paymentDate = DateTime.fromMillis(createdAt).plus({ days: daysToAdd });
  return paymentDate.toMillis();
};
export const calculateTotalNewStockFromReplenishments = (replenishments) => {
  let totalQuantity = 0;
  if (replenishments && Array.isArray(replenishments)) {
    replenishments.forEach(item => {
      if (item.quantity && typeof item.quantity === 'number') {
        totalQuantity += item.quantity;
      }
    });
  }

  return totalQuantity;
};

export const OrdersTable = ({ orders = [], loading = true }) => {

  const data = orders.map((data) => {
    const createdAt = data?.createdAt || null;
    const paymentDate = createdAt ? calculatePaymentDate(createdAt, data?.condition) : null;
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
      action: data
    }
  })

  return (
    <AdvancedTable
      tableName={'Lista de Pedidos Pendientes'}
      columns={columns}
      data={data}
      loading={loading}
    />
  )
}