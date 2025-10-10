import {
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { ActionIcon } from "../../../../../../config/statusActionConfig";
import { getOrderConditionByID, getOrderStateByID } from "../../../../../../constants/orderAndPurchaseState";
import { useDialog } from "../../../../../../Context/Dialog/DialogContext";
import { selectUser } from "../../../../../../features/auth/userSlice";
import { fbDeleteOrder } from "../../../../../../firebase/order/fbDeleteOrder";
import { replacePathParams } from "../../../../../../routes/replacePathParams";
import { ROUTES } from "../../../../../../routes/routesName";

function ActionButtons({ order }) {
  const navigate = useNavigate();
  const { setDialogConfirm } = useDialog();
  const user = useSelector(selectUser);

  const { ORDERS_CONVERT, ORDERS_UPDATE } = ROUTES.ORDER_TERM

  const handleCompletePurchase = () => {
    const path = replacePathParams(ORDERS_CONVERT, order.id);
    navigate(path);
  };

  const handleUpdatePurchase = () => {
    const path = replacePathParams(ORDERS_UPDATE, order.id);
    navigate(path);
  };

  const handleDeleteOrder = () => {
    setDialogConfirm({
      title: 'Cancelar pedido',
      isOpen: true,
      type: 'error',
      message: '¿Está seguro que desea cancelar este pedido?',
      onConfirm: () => fbDeleteOrder(user, order.id),
    });
  };

  if(order.status !== 'pending' ){
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderRadius: '8px',
    }}>
      <ActionIcon
        icon={<ShoppingCartOutlined />}
        tooltip="Completar compra 2"
        color="#555"
        hoverColor="#52c41a"
        onClick={handleCompletePurchase}
      />
      <ActionIcon
        icon={<EditOutlined />}
        tooltip="Editar"
        color="#555"
        hoverColor="#faad14"
        onClick={handleUpdatePurchase}
      />
      <ActionIcon
        icon={<DeleteOutlined />}
        tooltip="Cancelar pedido"
        color="#555"
        hoverColor="#ff4d4f"
        onClick={handleDeleteOrder}
      />
    </div>
  );
}

export const columns = [
  {
    Header: '#',
    accessor: 'number',
    minWidth: '50px',
    maxWidth: '50px',
    keepWidth: true,
    fixed: 'left',
  },
  {
    Header: 'Estado',
    accessor: 'status',
    type: 'status',
    maxWidth: '150px',
    minWidth: '150px',
  },
  {
    Header: 'Proveedor',
    minWidth: '150px',
    accessor: 'provider'
  },
  {
    Header: 'Fecha Pedido',
    accessor: 'createdAt',
    maxWidth: '140px',
    minWidth: '140px',
    type: 'date'
  },
  {
    Header: 'Fecha Pago',
    accessor: 'paymentDate',
    maxWidth: '140px',
    minWidth: '140px',
    type: 'dateStatus'
  },
  {
    Header: 'Evidencia',
    accessor: 'fileList',
    maxWidth: '90px',
    minWidth: '90px',
    align: 'right',
    type: 'file',
  },
  {
    Header: 'Nota',
    accessor: 'note',
    maxWidth: '70px',
    minWidth: '70px',
    keepWidth: true,
    type: 'note',
  },
  {
    Header: 'Items',
    accessor: 'items',
    align: 'right',
    minWidth: '80px',
    maxWidth: '80px',
    type: 'badge'
  },
  {
    Header: 'Total',
    accessor: 'total',
    align: 'right',
    minWidth: '120px',
    maxWidth: '120px',
    format: 'price',
    type: 'badge'
  },

  {
    Header: 'Acción',
    accessor: 'action',
    align: 'right',
    keepWidth: true,
    maxWidth: '120px',
    minWidth: '120px',
    fixed: 'right', // Fijamos las acciones a la derecha
    cell: ({ value }) => <ActionButtons order={value} />,

  }
]
export const filterConfig = [
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



