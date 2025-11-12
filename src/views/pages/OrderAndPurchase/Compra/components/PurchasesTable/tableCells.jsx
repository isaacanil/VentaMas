import {
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { ActionIcon } from '../../../../../../components/common/ActionIcon';
import { replacePathParams } from '../../../../../../routes/replacePathParams';
import { ROUTES } from '../../../../../../routes/routesName';
import TextCell from '../../../../../templates/system/AdvancedTable/components/Cells/Text/TextCerll';

export function ProviderCell({ value }) {
  if (!value) return null;
  return <TextCell value={value} />;
}

export function PurchaseActionButtons({ purchaseData }) {
  const navigate = useNavigate();
  const { PURCHASES_UPDATE, PURCHASES_COMPLETE } = ROUTES.PURCHASE_TERM;

  if (purchaseData.status === 'completed') {
    return null;
  }

  const handleCompletePurchase = () => {
    const path = replacePathParams(PURCHASES_COMPLETE, purchaseData.id);
    navigate(path);
  };

  const handleUpdatePurchase = () => {
    const path = replacePathParams(PURCHASES_UPDATE, purchaseData.id);
    navigate(path);
  };

  if (purchaseData.status !== 'pending') {
    return null;
  }

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
        tooltip="Cancelar compra"
        color="#555"
        hoverColor="#ff4d4f"
        onClick={purchaseData.onCancel}
      />
    </div>
  );
}
