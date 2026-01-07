import {
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ActionIcon } from '@/components/common/ActionIcon';
import { replacePathParams } from '@/router/routes/replacePathParams';
import { ROUTES } from '@/router/routes/routesName';
import type { Purchase } from '@/utils/purchase/types';
import TextCell from '@/views/templates/system/AdvancedTable/components/Cells/Text/TextCerll';

interface ProviderCellProps {
  value?: string | null;
}

export function ProviderCell({ value }: ProviderCellProps) {
  if (!value) return null;
  return <TextCell value={value} />;
}

type PurchaseActionData = Purchase & {
  onCancel?: () => void;
};

interface PurchaseActionButtonsProps {
  purchaseData: PurchaseActionData;
}

export function PurchaseActionButtons({ purchaseData }: PurchaseActionButtonsProps) {
  const navigate = useNavigate();
  const { PURCHASES_UPDATE, PURCHASES_COMPLETE } = ROUTES.PURCHASE_TERM;

  if (!purchaseData?.id || purchaseData.status === 'completed') {
    return null;
  }

  const handleCompletePurchase = () => {
    const path = replacePathParams(PURCHASES_COMPLETE, purchaseData.id as string);
    navigate(path);
  };

  const handleUpdatePurchase = () => {
    const path = replacePathParams(PURCHASES_UPDATE, purchaseData.id as string);
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
