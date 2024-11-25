import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../../../../../../features/auth/userSlice'
import { fbGetPendingOrders } from '../../../../../../firebase/order/fbGetPedingOrder'
import { convertMillisToDate } from '../../../../../../hooks/useFormatTime'
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice'
import { getOrderConditionByID, getOrderStateByID } from '../../../../../../constants/orderAndPurchaseState'
import { StatusIndicatorDot } from '../StatusIndicatorDot/StatusIndicatorDot'
import { ActionsButtonsGroup } from '../../ListItem/ActionsButtonsGroup'
import { setNote } from '../../../../../../features/noteModal/noteModalSlice'
import { AdvancedTable } from '../../../../../templates/system/AdvancedTable/AdvancedTable'
import { Button, Tag } from 'antd'
import { DateTime } from 'luxon';

const calculatePaymentDate = (createdAt, conditionId) => {
  let daysToAdd = 0;
  switch (conditionId) {
    case 'condition_0001': // Contado, asumimos pago inmediato, así que no se añaden días.
      daysToAdd = 0;
      break;
    case 'condition_0002': // 1 semana
      daysToAdd = 7;
      break;
    case 'condition_0003': // 15 días
      daysToAdd = 15;
      break;
    case 'condition_0004': // 30 días
      daysToAdd = 30;
      break;
    case 'condition_0005': // Otros, necesitarías definir una lógica específica para 'Otros'
      // Por ahora, no añadimos días. Podrías modificar esto según sea necesario.
      daysToAdd = 0;
      break;
    default:
      break;
  }

  const paymentDate = DateTime.fromMillis(createdAt).plus({ days: daysToAdd });
  return paymentDate.toMillis(); 
};
export const calculateTotalNewStockFromReplenishments = (replenishments) => {
  let totalNewStock = 0;
  if (replenishments && Array.isArray(replenishments)) {
    replenishments.forEach(item => {
      if (item.newStock && typeof item.newStock === 'number') {
        totalNewStock += item.newStock;
      }
    });
  }

  return totalNewStock;
};

export const PendingOrdersTable = () => {
  const dispatch = useDispatch();
  
  const columns = [
    {
      Header: '#',
      accessor: 'number',
      minWidth: '50px',
      maxWidth: '50px',
    },
    {
      Header: 'Est',
      accessor: 'state',
      minWidth: '50px',
      maxWidth: '50px',
      cell: ({ value }) => <StatusIndicatorDot color={value ? getOrderStateByID(value)?.color : null} />
    },
    {
      Header: 'Proveedor',
      accessor: 'provider'
    },
    {
      Header: 'Nota',
      accessor: 'note',
      cell: ({ value }) => (
        <Button
          onClick={() => dispatch(setNote({ note: value, isOpen: true }))}
        >
          Ver
        </Button>
      )
    },
    {
      Header: 'F. Pedido',
      accessor: 'createdAt',
      cell: ({ value }) => <div>{convertMillisToDate(value)}</div>
    },
    {
      Header: 'F. Entrega',
      accessor: 'deliveryDate',
      cell: ({ value }) => <div>{convertMillisToDate(value)}</div>
    },
    {
      Header: 'F. Pago',
      accessor: 'paymentDate',
      cell: ({ value }) => {
        const paymentDate = DateTime.fromMillis(value);
        const now = DateTime.now();
        const isDueOrPast = now >= paymentDate;
        return (<Tag style={{fontSize: "16px", padding: "5px"}} color={isDueOrPast ? 'error' : 'success'}>{convertMillisToDate(value)}</Tag>)
    }
    },
    {
      Header: 'Items',
      accessor: 'items',
      align: 'right',
      minWidth: '80px',
      maxWidth: '80px',
      cell: ({ value }) => <div>{value}</div>
    },
    {
      Header: 'Total',
      accessor: 'total',
      align: 'right',
      minWidth: '120px',
      maxWidth: '120px',
      cell: ({ value }) => <div>{useFormatPrice(value)}</div>
    },
    {
      Header: 'Acción',
      accessor: 'action',
      align: 'right',
      cell: ({ value }) => <ActionsButtonsGroup orderData={value} />,
     
    }
  ]
  const filterConfig = [
    {
      label: 'Proveedor',
      accessor: 'provider',
    },
    {
      label: 'Estado',
      accessor: 'state',
      format: (value) => `${getOrderStateByID(value)?.name}`,
      defaultValue: 'state_2'
    },
    {
      label: 'Condición',
      accessor: 'condition',
      format: (value) => `${getOrderConditionByID(value)}`
    }
  ];

  const user = useSelector(selectUser);
  const { pendingOrders } = fbGetPendingOrders(user);

  const data = pendingOrders.map(({ data }) => {
    const paymentDate = calculatePaymentDate(data?.dates?.createdAt, data?.condition);
    return {
      number: data?.numberId,
      state: data?.state,
      provider: data?.provider?.name,
      condition: data?.condition,
      note: data?.note,
      createdAt: data?.dates?.createdAt,
      paymentDate,
      items: calculateTotalNewStockFromReplenishments(data?.replenishments),
      deliveryDate: data?.dates?.deliveryDate,
      total: data?.total,
      action: data
    }
  })

  return (
      <AdvancedTable
        tableName={'Lista de Pedidos Pendientes'}
        columns={columns}
        data={data}
        filterUI
        filterConfig={filterConfig}
      />
  )
}