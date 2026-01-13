import {
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@/constants/icons/antd';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ActionIcon } from '@/components/common/ActionIcon';
import { useDialog } from '@/Context/Dialog/useDialog';
import { selectUser } from '@/features/auth/userSlice';
import { fbDeleteOrder } from '@/firebase/order/fbDeleteOrder';
import { replacePathParams } from '@/router/routes/replacePathParams';
import { ROUTES } from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import type { Order } from '@/utils/order/types';

interface OrderActionButtonsProps {
  order: Order;
}

export function OrderActionButtons({ order }: OrderActionButtonsProps) {
  const navigate = useNavigate();
  const { setDialogConfirm } = useDialog();
  const user = useSelector(selectUser) as UserIdentity | null;
  const { ORDERS_CONVERT, ORDERS_UPDATE } = ROUTES.ORDER_TERM;

  if (!order?.id || order.status !== 'pending') {
    return null;
  }

  const handleCompletePurchase = () => {
    const path = replacePathParams(ORDERS_CONVERT, order.id as string);
    navigate(path);
  };

  const handleUpdatePurchase = () => {
    const path = replacePathParams(ORDERS_UPDATE, order.id as string);
    navigate(path);
  };

  const handleDeleteOrder = () => {
    if (!user) return;
    setDialogConfirm({
      title: 'Cancelar pedido',
      isOpen: true,
      type: 'error',
      message: '¿Está seguro que desea cancelar este pedido?',
      onConfirm: () => fbDeleteOrder(user, order.id as string),
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
        tooltip="Completar compra"
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
