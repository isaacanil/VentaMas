import { DateTime } from 'luxon';
import {
  ShoppingCartOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  FileOutlined,
} from '@/constants/icons/antd';
import {
  DollarCircleOutlined,
  HistoryOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { Dropdown, type MenuProps } from 'antd';
import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { ActionIcon } from '@/components/common/ActionIcon';
import { openFileCenter } from '@/features/files/fileSlice';
import { setNote } from '@/features/noteModal/noteModalSlice';
import { replacePathParams } from '@/router/routes/replacePathParams';
import { ROUTES } from '@/router/routes/routesName';
import type { Purchase } from '@/utils/purchase/types';
import {
  canCancelPurchase,
  canCompletePurchase,
  canEditPurchase,
  resolvePurchaseWorkflowStatus,
} from '@/utils/purchase/workflow';
import TextCell from '@/components/ui/AdvancedTable/components/Cells/Text/TextCerll';
import { Badge } from '@/components/common/Badge/Badge';
import { formatPrice } from '@/utils/format/formatPrice';

interface ProviderCellProps {
  value?: string | null;
}

export function ProviderCell({ value }: ProviderCellProps) {
  if (!value) return null;
  return <TextCell value={value} />;
}

type PurchaseActionData = Purchase & {
  onCancel?: () => void;
  onOpenAccountingEntry?: () => void;
  onOpenPurchase?: () => void;
  onRegisterPayment?: () => void;
  onViewPayments?: () => void;
};

interface PurchaseActionButtonsProps {
  purchaseData: PurchaseActionData;
}

export function PurchaseActionButtons({
  purchaseData,
}: PurchaseActionButtonsProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { PURCHASES_UPDATE, PURCHASES_COMPLETE } = ROUTES.PURCHASE_TERM;

  const workflowStatus = resolvePurchaseWorkflowStatus(purchaseData);
  const canOperationalEdit = canEditPurchase(purchaseData);
  const canOpenReceipt = canCompletePurchase(purchaseData);
  const canCancelOperational =
    typeof purchaseData.onCancel === 'function' &&
    canCancelPurchase(purchaseData);
  const canOpenPurchase = typeof purchaseData.onOpenPurchase === 'function';
  const canOpenAccountingEntry =
    typeof purchaseData.onOpenAccountingEntry === 'function';
  const paymentBalance = Number(purchaseData.paymentState?.balance ?? 0);
  const canRegisterPayment =
    workflowStatus !== 'canceled' &&
    typeof purchaseData.onRegisterPayment === 'function' &&
    Number.isFinite(paymentBalance) &&
    paymentBalance > 0.01;
  const canViewPayments =
    workflowStatus !== 'canceled' &&
    typeof purchaseData.onViewPayments === 'function';

  const handleCompletePurchase = useCallback(() => {
    const path = replacePathParams(
      PURCHASES_COMPLETE,
      purchaseData.id as string,
    );
    navigate(path);
  }, [PURCHASES_COMPLETE, navigate, purchaseData.id]);

  const handleUpdatePurchase = useCallback(() => {
    const path = replacePathParams(PURCHASES_UPDATE, purchaseData.id as string);
    navigate(path);
  }, [PURCHASES_UPDATE, navigate, purchaseData.id]);

  const items = useMemo<MenuProps['items']>(() => {
    const menuItems: NonNullable<MenuProps['items']> = [];

    if (canOpenPurchase) {
      menuItems.push({
        key: 'open_purchase',
        icon: <ShoppingCartOutlined />,
        label: 'Ver compra',
        onClick: () => purchaseData.onOpenPurchase?.(),
      });
    }

    if (canOpenAccountingEntry) {
      menuItems.push({
        key: 'open_accounting_entry',
        icon: <ProfileOutlined />,
        label: 'Ver asiento contable',
        onClick: () => purchaseData.onOpenAccountingEntry?.(),
      });
    }

    if (canViewPayments) {
      menuItems.push({
        key: 'view_payments',
        icon: <HistoryOutlined />,
        label: 'Ver pagos',
        onClick: () => purchaseData.onViewPayments?.(),
      });
    }

    if (canRegisterPayment) {
      menuItems.push({
        key: 'register_payment',
        icon: <DollarCircleOutlined />,
        label: 'Registrar pago',
        onClick: () => purchaseData.onRegisterPayment?.(),
      });
    }

    if (canOpenReceipt) {
      menuItems.push({
        key: 'receive',
        icon: <ShoppingCartOutlined />,
        label:
          workflowStatus === 'partial_receipt'
            ? 'Continuar recepción'
            : 'Registrar recepción',
        onClick: handleCompletePurchase,
      });
    }

    if (canOperationalEdit) {
      menuItems.push({
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Editar',
        onClick: handleUpdatePurchase,
      });
    }

    menuItems.push({
      key: 'note',
      icon: <FileTextOutlined />,
      label: 'Ver nota',
      disabled: !purchaseData.note,
      onClick: (info) => {
        info.domEvent.stopPropagation();
        dispatch(setNote({ note: purchaseData.note, isOpen: true }));
      },
    });

    menuItems.push({
      key: 'files',
      icon: <FileOutlined />,
      label: 'Ver evidencia',
      disabled: !(
        purchaseData.attachmentUrls && purchaseData.attachmentUrls.length > 0
      ),
      onClick: (info) => {
        info.domEvent.stopPropagation();
        dispatch(openFileCenter(purchaseData.attachmentUrls as any));
      },
    });

    if (canCancelOperational) {
      if (menuItems.length > 0) {
        menuItems.push({ type: 'divider' });
      }
      menuItems.push({
        key: 'cancel',
        icon: <DeleteOutlined />,
        label: 'Cancelar compra',
        danger: true,
        onClick: purchaseData.onCancel,
      });
    }

    return menuItems;
  }, [
    canOpenAccountingEntry,
    canOpenPurchase,
    canViewPayments,
    canRegisterPayment,
    canOpenReceipt,
    canOperationalEdit,
    canCancelOperational,
    purchaseData,
    workflowStatus,
    handleCompletePurchase,
    handleUpdatePurchase,
    dispatch,
  ]);

  if (!purchaseData?.id || items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <ActionIcon
          icon={<MoreOutlined />}
          tooltip="Acciones"
          color="#555"
          hoverColor="#1677ff"
        />
      </Dropdown>
    </div>
  );
}

interface PaymentStatusCellProps {
  value?: string | null;
}

export function PaymentStatusCell({ value }: PaymentStatusCellProps) {
  if (!value) return null;
  const label = value.replace(/_/g, ' ');
  return <TextCell value={label} />;
}

interface TotalPaymentCellProps {
  total: number;
  paymentStatus?: string | null;
}

export function TotalPaymentCell({
  total,
  paymentStatus,
}: TotalPaymentCellProps) {
  const getPaymentStatusStyles = (status?: string | null) => {
    switch (status) {
      case 'paid':
        return { bgColor: '#f6ffed', color: '#52c41a', label: 'Pagado' };
      case 'partially_paid':
      case 'partial':
        return { bgColor: '#fff7e6', color: '#faad14', label: 'Parcial' };
      case 'unpaid':
        return { bgColor: '#fff1f0', color: '#ff4d4f', label: 'Sin pagar' };
      default:
        return { bgColor: '#f5f5f5', color: '#555', label: status || '---' };
    }
  };

  const { bgColor, color, label } = getPaymentStatusStyles(paymentStatus);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '2px',
      }}
    >
      <Badge
        text={formatPrice(total)}
        bgColor={bgColor}
        color={color}
        size="medium"
      />
      <span
        style={{
          fontSize: '10px',
          color: '#888',
          textTransform: 'uppercase',
          fontWeight: '600',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function DatePaymentCell({
  paymentAt,
  nextPaymentAt,
}: {
  paymentAt: number | null;
  nextPaymentAt: number | null;
}) {
  const formatDate = (millis: number | null) => {
    if (!millis) return null;
    return DateTime.fromMillis(millis).toLocaleString(DateTime.DATE_SHORT);
  };

  const paymentAtStr = formatDate(paymentAt);
  const nextPaymentAtStr = formatDate(nextPaymentAt);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13px', fontWeight: '500' }}>
          Último: {paymentAtStr || '---'}
        </span>
        <span style={{ fontSize: '11px', color: '#888' }}>
          Próximo: {nextPaymentAtStr || '---'}
        </span>
      </div>
    </div>
  );
}
