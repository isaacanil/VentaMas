import {
  EyeOutlined,
  MoreOutlined,
  PrinterOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Tooltip, notification } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

import { icons } from '../../../../../constants/icons/icons';
import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { selectUser } from '../../../../../features/auth/userSlice';
import {
  SelectSettingCart,
  loadCart,
  setCartId,
  toggleInvoicePanelOpen,
} from '../../../../../features/cart/cartSlice';
import { selectClientWithAuth } from '../../../../../features/clientCart/clientCartSlice';
import { selectTaxReceiptType } from '../../../../../features/taxReceipt/taxReceiptSlice';
import { fbCancelPreorder } from '../../../../../firebase/invoices/fbCancelPreorder';
import { downloadInvoiceLetterPdf } from '../../../../../firebase/quotation/downloadQuotationPDF';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import { getTimeElapsed } from '../../../../../hooks/useFormatTime';
import { validateInvoiceCart } from '../../../../../utils/invoiceValidation';
import { Invoice } from '../../../../component/Invoice/components/Invoice/Invoice';
import { ConfirmModal } from '../../../../component/modals/ConfirmModal/ConfirmModal';
import PreorderModal from '../../../../component/modals/PreorderModal/PreorderModal';
import { Tag } from '../../../../templates/system/Tag/Tag';

const resolvePreorderTaxReceiptType = (preorder) =>
  preorder?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.taxReceipt?.type ??
  null;

const getColorByStatus = (status) => {
  const statusColors = {
    pending: 'orange',
    completed: 'green',
    cancelled: 'red',
  };
  return statusColors[status] || 'gray';
};

export const PriceCell = ({ value }) => <span>{useFormatPrice(value)}</span>;

export const DateCell = ({ value }) => {
  const time = value * 1000;
  return <span>{getTimeElapsed(time, 0)}</span>;
};

export const StatusCell = ({ value }) => {
  const statusLabel =
    value === 'pending' ? 'Pendiente' : value === 'completed' ? 'Completada' : 'Cancelada';
  return <Tag color={getColorByStatus(value)}>{statusLabel}</Tag>;
};

export const PreorderActionsCell = ({ value }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const data = value.data;
  const user = useSelector(selectUser);
  const business = useSelector(selectBusinessData) || {};
  const cartSettings = useSelector(SelectSettingCart);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isPreorderModalOpen, setIsPreorderModalOpen] = useState(false);
  const printRef = useRef(null);

  const printablePreorder = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      numberID: data?.numberID || data?.preorderDetails?.numberID,
      date: data?.date || data?.preorderDetails?.date || null,
      copyType: data?.copyType || 'PREVENTA',
      type: data?.type || 'preorder',
    };
  }, [data]);

  const resolvedInvoiceType = useMemo(() => {
    const type =
      cartSettings?.billing?.invoiceType ||
      printablePreorder?.billing?.invoiceType ||
      printablePreorder?.invoiceType ||
      null;
    return type ? type.toLowerCase() : null;
  }, [cartSettings?.billing?.invoiceType, printablePreorder]);

  const triggerPrint = useReactToPrint({
    content: () => printRef.current,
  });

  const convertTimestampsToMillis = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => convertTimestampsToMillis(item));
    }
    const converted = {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
        converted[key] = value.seconds * 1000 + Math.floor(value.nanoseconds / 1000000);
      } else if (value && typeof value === 'object') {
        converted[key] = convertTimestampsToMillis(value);
      } else {
        converted[key] = value;
      }
    });
    return converted;
  }, []);

  const printableInvoiceData = useMemo(() => {
    const source = printablePreorder || data;
    if (!source) return null;
    return convertTimestampsToMillis(source) ?? source;
  }, [convertTimestampsToMillis, data, printablePreorder]);

  const handlePrintPreorder = useCallback(async () => {
    if (!printablePreorder) {
      notification.warning({
        message: 'No se puede imprimir la preventa',
        description: 'Los datos de la preventa no están disponibles para imprimir.',
      });
      return;
    }

    const printableData = printableInvoiceData ?? convertTimestampsToMillis(printablePreorder) ?? printablePreorder;

    if (resolvedInvoiceType === 'template2') {
      try {
        await downloadInvoiceLetterPdf(business, printableData);
      } catch (error) {
        console.error('[PreSaleTable] downloadInvoiceLetterPdf failed', error);
        notification.error({
          message: 'Error al imprimir',
          description: error?.message || 'No se pudo generar el PDF de la preventa.',
        });
      }
      return;
    }

    triggerPrint();
  }, [business, convertTimestampsToMillis, printableInvoiceData, printablePreorder, resolvedInvoiceType, triggerPrint]);

  const convertToCart = useCallback(
    (source) => {
      const serializedPreorder = convertTimestampsToMillis(source);
      dispatch(loadCart(serializedPreorder));
      dispatch(setCartId());
      const storedTaxReceiptType = resolvePreorderTaxReceiptType(serializedPreorder);
      if (storedTaxReceiptType) {
        dispatch(selectTaxReceiptType(storedTaxReceiptType));
      }
      if (serializedPreorder?.client) {
        dispatch(selectClientWithAuth(serializedPreorder.client));
      }
      return serializedPreorder;
    },
    [convertTimestampsToMillis, dispatch],
  );

  const handlePreloadPreorder = useCallback(() => {
    if (!data) return;

    const { isValid, message } = validateInvoiceCart(data);
    if (!isValid) {
      notification.warning({
        message: 'No se pudo precargar la preventa',
        description: message || 'Verifica el contenido antes de continuar.',
      });
      return;
    }

    const serializedPreorder = convertToCart(data);
    const params = new URLSearchParams();
    params.set('mode', 'preorder');
    if (serializedPreorder?.id) {
      params.set('preorderId', serializedPreorder.id);
    }
    params.set('preserveCart', '1');

    navigate({ pathname: '/sales', search: `?${params.toString()}` });

    notification.success({
      message: 'Preventa precargada',
      description: `Se cargó la preventa ${serializedPreorder?.preorderDetails?.numberID || ''} en ventas.`,
    });
  }, [convertToCart, data, navigate]);

  const handleInvoicePanelOpen = useCallback(() => {
    if (!data) return;

    const { isValid, message } = validateInvoiceCart(data);
    if (isValid) {
      convertToCart(data);
      dispatch(toggleInvoicePanelOpen());
    } else {
      notification.error({
        description: message,
      });
    }
  }, [convertToCart, data, dispatch]);

  const handleCancelPreorder = async () => {
    try {
      await fbCancelPreorder(user, data);
      setIsCancelConfirmOpen(false);
    } catch (error) {
      notification.error({
        message: 'No se pudo cancelar la preventa',
        description: error?.message || 'Intenta nuevamente.',
      });
    }
  };

  const menuItems = [
    {
      key: 'view',
      label: 'Ver',
      onClick: () => setIsPreorderModalOpen(true),
      icon: <EyeOutlined />,
    },
    {
      key: 'preload',
      label: 'Precargar en Ventas',
      onClick: handlePreloadPreorder,
      icon: <ShoppingCartOutlined />,
    },
    {
      key: 'complete',
      label: 'Completar preventa',
      onClick: handleInvoicePanelOpen,
      icon: icons.editingActions.complete,
    },
    {
      key: 'print',
      label: 'Imprimir',
      onClick: handlePrintPreorder,
      icon: <PrinterOutlined />,
    },
    {
      key: 'cancel',
      label: 'Cancelar',
      onClick: () => setIsCancelConfirmOpen(true),
      icon: icons.editingActions.cancel,
      danger: true,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ position: 'absolute', top: -9999, left: -9999 }} aria-hidden="true">
        <Invoice ref={printRef} data={printableInvoiceData || printablePreorder || data} ignoreHidden />
      </div>
      <Tooltip title="Precargar en Ventas">
        <Button
          icon={<ShoppingCartOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handlePreloadPreorder();
          }}
        />
      </Tooltip>
      <Tooltip title="Completar preventa">
        <Button
          icon={icons.editingActions.complete}
          onClick={(e) => {
            e.stopPropagation();
            handleInvoicePanelOpen();
          }}
        />
      </Tooltip>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
      </Dropdown>
      <PreorderModal preorder={data} open={isPreorderModalOpen} onCancel={() => setIsPreorderModalOpen(false)} />
      <ConfirmModal
        open={isCancelConfirmOpen}
        onConfirm={handleCancelPreorder}
        onCancel={() => setIsCancelConfirmOpen(false)}
        title="Cancelar Preorden"
        message={`¿Estás seguro de que deseas cancelar la preorden ${data?.preorderDetails?.numberID} para el cliente ${data?.client?.name}?`}
        confirmText="Cancelar Preorden"
        cancelText="Volver"
        danger
        data={data?.preorderDetails?.numberID}
      />
    </div>
  );
};
