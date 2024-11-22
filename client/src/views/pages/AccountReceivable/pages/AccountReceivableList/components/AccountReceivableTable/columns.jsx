import { Button } from "antd";
import { useFormatPrice } from "../../../../../../../hooks/useFormatPrice";
import { getTimeElapsed } from "../../../../../../../hooks/useFormatTime";
import { EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { setAccountPayment } from "../../../../../../../features/accountsReceivable/accountsReceivablePaymentSlice";
import { useDispatch } from "react-redux";
import { setARDetailsModal } from "../../../../../../../features/accountsReceivable/accountsReceivableSlice";

const DetailButton = ({ value }) => {
  const dispatch = useDispatch();
  const handleOpenDetail = () => {
    dispatch(setARDetailsModal({ isOpen: true, arId: value.account.id }));
  }
  return (
    <Button
      icon={<EyeOutlined />}
      onClick={handleOpenDetail}
    />
  );
};

const PayButton = ({ value }) => {
  const dispatch = useDispatch();
  const handleOpenPayment = () => {
    console.log('Pagar ', value);
    const account = value.account;
    const client = value.account.client;
    const result = {
      isOpen: true,
      paymentDetails: {
        clientId: client.id,
        arId: account.id,
        paymentScope: 'account',
        totalAmount: account.balance,
      },
      extra: {
        ...account?.account

      }
    }

    dispatch(setAccountPayment(result))
  }
  return (
    <Button
      icon={<DollarOutlined />}
      onClick={handleOpenPayment}
    />
  );
};

export const columns = [
  {
    Header: 'Cliente',
    accessor: 'client',
    sortable: true,
    align: 'left',
    maxWidth: '1.8fr',
    minWidth: '200px',
  },
  {
    Header: 'Cédula/RNC',
    accessor: 'rnc',
    sortable: true,
    align: 'left',
    maxWidth: '1.2fr',
    minWidth: '130px',
  },
  {
    Header: 'Factura',
    accessor: 'invoiceNumber',
    sortable: true,
    align: 'left',
    maxWidth: '1fr',
    minWidth: '120px',
  },
  {
    Header: 'Fecha',
    accessor: 'date',
    sortable: true,
    align: 'left',
    cell: ({ value }) => {
      console.log('value', value);
      const time = value.seconds * 1000;
      return getTimeElapsed(time, 0);
    },
    maxWidth: '1fr',
    minWidth: '160px',
  },
  {
    Header: 'Monto inicial',
    accessor: 'initialAmount',
    align: 'right',
    cell: ({ value }) => useFormatPrice(value),
    maxWidth: '1fr',
    minWidth: '120px',
  },
  {
    Header: 'Último pago',
    accessor: 'lastPaymentDate',
    align: 'left',
    cell: ({ value }) => {
      console.log('value 2', value);
      return value ? getTimeElapsed(value.seconds * 1000, 0) : 'Sin pagos';
    },
    maxWidth: '1fr',
    minWidth: '160px',
  },
  {
    Header: 'Total pagado',
    accessor: 'totalPaid',
    align: 'right',
    cell: ({ value }) => useFormatPrice(value),
    maxWidth: '1fr',
    minWidth: '120px',
  },
  {
    Header: 'Balance',
    accessor: 'balance',
    align: 'right',
    cell: ({ value }) => useFormatPrice(value),
    maxWidth: '1fr',
    minWidth: '120px',
  },
  {
    Header: 'Acciones',
    align: 'center',
    accessor: 'actions',
    maxWidth: '1fr',
    minWidth: '120px',
    cell: ({ value }) => (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <DetailButton value={value} />
        <PayButton value={value} />
      </div>
    )
  }
];