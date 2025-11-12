import {
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { ActionIcon } from '../../../../../../components/common/ActionIcon';
import { useDialog } from '../../../../../../Context/Dialog';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { fbDeleteOrder } from '../../../../../../firebase/order/fbDeleteOrder';
import { replacePathParams } from '../../../../../../routes/replacePathParams';
import { ROUTES } from '../../../../../../routes/routesName';

export function OrderActionButtons({ order }) {
  const navigate = useNavigate();
  const { setDialogConfirm } = useDialog();
  const user = useSelector(selectUser);
  const { ORDERS_CONVERT, ORDERS_UPDATE } = ROUTES.ORDER_TERM;

  if (order.status !== 'pending') {
    return null;
  }

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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: '8px',
      }}
    >
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
