import {
  EyeOutlined,
  MoreOutlined,
  PrinterOutlined,
  ShoppingCartOutlined,
} from '@/constants/icons/antd';
import { Button, Dropdown, Form, Modal, Tooltip, notification } from 'antd';
import type { MenuProps } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';


import { icons } from '@/constants/icons/icons';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  SelectCartData,
  SelectSettingCart,
  changePaymentValue,
  loadCart,
  setCartId,
  toggleInvoicePanelOpen,
  toggleReceivableStatus,
} from '@/features/cart/cartSlice';
import {
  resetAR,
  selectAR,
  setAR,
} from '@/features/accountsReceivable/accountsReceivableSlice';
import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { fbAddAR } from '@/firebase/accountsReceivable/fbAddAR';
import { fbAddInstallmentAR } from '@/firebase/accountsReceivable/fbAddInstallmentAR';
import { fbGetAccountReceivableByInvoiceOnce } from '@/firebase/accountsReceivable/fbGetAccountReceivableByInvoiceOnce';
import { selectClient, selectClientWithAuth } from '@/features/clientCart/clientCartSlice';
import { selectTaxReceiptType } from '@/features/taxReceipt/taxReceiptSlice';
import { fbCancelPreorder } from '@/firebase/invoices/fbCancelPreorder';
import { downloadInvoiceLetterPdf } from '@/firebase/quotation/downloadQuotationPDF';
import { getTimeElapsed } from '@/hooks/useFormatTime';
import { formatPrice } from '@/utils/format';
import { calculateInvoiceChange } from '@/utils/invoice';
import { validateInvoiceCart } from '@/utils/invoiceValidation';
import { Invoice } from '@/modules/invoice/components/Invoice/components/Invoice/Invoice';
import { ReceivableManagementPanel } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel';
import { MiniClientSelector } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/MarkAsReceivableButton/components/ARValidateMessage/components/MiniClientSelector/MiniClientSelector';
import { ConfirmModal } from '@/components/modals/ConfirmModal/ConfirmModal';
import PreorderModal from '@/components/modals/PreorderModal/PreorderModal';
import { Tag } from '@/components/ui/Tag/Tag';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';

export type PreorderActionCellValue = {
  data?: InvoiceData | null;
};

type TimestampRecord = {
  seconds?: number;
  nanoseconds?: number;
  toMillis?: () => number;
};

type AccountsReceivableState = {
  paymentFrequency?: string;
  totalInstallments?: number;
  installmentAmount?: number;
  paymentDate?: number | null;
  comments?: string;
  totalReceivable?: number;
  currentBalance?: number;
};

const resolvePreorderTaxReceiptType = (preorder: InvoiceData | null | undefined) =>
  preorder?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.taxReceipt?.type ??
  null;

const getColorByStatus = (status: string | null | undefined) => {
  const statusColors = {
    pending: 'orange',
    completed: 'green',
    cancelled: 'red',
  };
  return statusColors[status] || 'gray';
};

export const PriceCell = ({ value }: { value: number | string | null | undefined }) => (
  <span>{formatPrice(value)}</span>
);

export const DateCell = ({ value }: { value: number | null | undefined }) => {
  if (!value || !Number.isFinite(value)) {
    return <span>Sin fecha</span>;
  }
  const time = value * 1000;
  return <span>{getTimeElapsed(time, 0)}</span>;
};

export const StatusCell = ({ value }: { value: string | null | undefined }) => {
  const statusLabel =
    value === 'pending'
      ? 'Pendiente'
      : value === 'completed'
        ? 'Completada'
        : 'Cancelada';
  return <Tag color={getColorByStatus(value)}>{statusLabel}</Tag>;
};

export const PreorderActionsCell = ({ value }: { value: PreorderActionCellValue }) => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const data = value.data ?? null;
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessData = useSelector(selectBusinessData) as InvoiceBusinessInfo | null;
  const business = useMemo<InvoiceBusinessInfo>(() => businessData || {}, [businessData]);
  const cartSettings = useSelector(SelectSettingCart) as ReturnType<
    typeof SelectSettingCart
  >;
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isPreorderModalOpen, setIsPreorderModalOpen] = useState(false);
  const [isReceivableDecisionOpen, setIsReceivableDecisionOpen] = useState(false);
  const [isReceivableConfigOpen, setIsReceivableConfigOpen] = useState(false);
  const [isReceivableLoading, setIsReceivableLoading] = useState(false);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [receivableForm] = Form.useForm();
  const cartData = useSelector(SelectCartData);
  const accountsReceivable = useSelector(selectAR) as AccountsReceivableState;
  const selectedClient = useSelector(selectClient);
  const printRef = useRef<HTMLDivElement | null>(null);

  const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
  const isChangeNegative = change < 0;
  const receivableStatus = Boolean(cartData?.isAddedToReceivables);
  const invoiceTiming = useMemo(
    () =>
      (cartSettings as { billing?: { invoiceGenerationTiming?: string | null } } | null)
        ?.billing?.invoiceGenerationTiming ?? 'always-ask',
    [cartSettings],
  );

  const printablePreorder = useMemo<InvoiceData | null>(() => {
    if (!data) return null;
    return {
      ...data,
      numberID: data?.numberID || data?.preorderDetails?.numberID,
      date: data?.date || data?.preorderDetails?.date || null,
      copyType: data?.copyType || 'PREVENTA',
      type: data?.type || 'preorder',
    };
  }, [data]);

  const isValidClient = (client?: { id?: string | null } | null) =>
    Boolean(client?.id && client.id !== 'GC-0000');

  const effectiveClient = useMemo(() => {
    if (isValidClient(selectedClient)) return selectedClient;
    if (isValidClient(data?.client)) return data?.client ?? null;
    return null;
  }, [data?.client, isValidClient, selectedClient]);

  const resolvedInvoiceType = useMemo(() => {
    const invoiceTypeFromSettings = (
      cartSettings as { billing?: { invoiceType?: string | null } } | null
    )?.billing?.invoiceType;
    const printableBilling = printablePreorder as
      | (InvoiceData & {
          billing?: { invoiceType?: string | null };
          invoiceType?: string | null;
        })
      | null;
    const type =
      invoiceTypeFromSettings ||
      printableBilling?.billing?.invoiceType ||
      printableBilling?.invoiceType ||
      null;
    return typeof type === 'string' && type ? type.toLowerCase() : null;
  }, [cartSettings, printablePreorder]);

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
  });

  const isTimestampRecord = (value: unknown): value is TimestampRecord =>
    !!value &&
    typeof value === 'object' &&
    typeof (value as TimestampRecord).seconds === 'number' &&
    typeof (value as TimestampRecord).nanoseconds === 'number';

  const convertTimestampsToMillis = useCallback(
    function convertTimestampsToMillis(obj: unknown): unknown {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map((item) => convertTimestampsToMillis(item));
      }
      const converted: Record<string, unknown> = {};
      Object.keys(obj).forEach((key) => {
        const value = (obj as Record<string, unknown>)[key];
        if (isTimestampRecord(value)) {
          converted[key] =
            value.seconds * 1000 + Math.floor(value.nanoseconds / 1000000);
        } else if (value && typeof value === 'object') {
          converted[key] = convertTimestampsToMillis(value);
        } else {
          converted[key] = value;
        }
      });
      return converted;
    },
    [],
  );

  const printableInvoiceData = useMemo<InvoiceData | null>(() => {
    const source = printablePreorder || data;
    if (!source) return null;
    return (convertTimestampsToMillis(source) as InvoiceData) ?? source;
  }, [convertTimestampsToMillis, data, printablePreorder]);

  const handlePrintPreorder = useCallback(async () => {
    if (!printablePreorder) {
      notification.warning({
        message: 'No se puede imprimir la preventa',
        description:
          'Los datos de la preventa no están disponibles para imprimir.',
      });
      return;
    }

    const printableData =
      (printableInvoiceData ??
        (convertTimestampsToMillis(printablePreorder) as InvoiceData) ??
        printablePreorder) as InvoiceData;

    if (resolvedInvoiceType === 'template2') {
      try {
        await downloadInvoiceLetterPdf(business, printableData);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF de la preventa.';
        console.error('[PreSaleTable] downloadInvoiceLetterPdf failed', error);
        notification.error({
          message: 'Error al imprimir',
          description: errorMessage,
        });
      }
      return;
    }

    triggerPrint();
  }, [
    business,
    convertTimestampsToMillis,
    printableInvoiceData,
    printablePreorder,
    resolvedInvoiceType,
    triggerPrint,
  ]);

  const convertToCart = useCallback(
    (source: InvoiceData) => {
      const serializedPreorder = convertTimestampsToMillis(
        source,
      ) as InvoiceData;
      dispatch(loadCart(serializedPreorder));
      dispatch(setCartId());
      const storedTaxReceiptType =
        resolvePreorderTaxReceiptType(serializedPreorder);
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
      params.set('preorderId', String(serializedPreorder.id));
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


  const buildOriginMeta = useCallback(
    (preorderId?: string, account?: AccountsReceivableDoc | null) => ({
      originType: account?.originType ?? 'preorder',
      originId: account?.originId ?? preorderId ?? null,
      preorderId: account?.preorderId ?? preorderId ?? null,
      originStage: account?.originStage ?? 'preorder',
      createdFrom: account?.createdFrom ?? 'preorders',
    }),
    [],
  );

  const openReceivablePayment = useCallback(
    (account: AccountsReceivableDoc, preorderId?: string) => {
      if (!account?.id) {
        notification.error({
          message: 'No se pudo abrir el pago',
          description: 'La cuenta por cobrar no tiene un identificador válido.',
        });
        return;
      }

      const arBalance = Number(
        account?.arBalance ??
          account?.currentBalance ??
          account?.totalReceivable ??
          0,
      );
      const installmentAmount = Number(
        account?.installmentAmount ?? arBalance,
      );
      const originMeta = buildOriginMeta(preorderId, account);

      dispatch(
        setAccountPayment({
          isOpen: true,
          paymentDetails: {
            clientId: account?.clientId || data?.client?.id || '',
            arId: account.id,
            paymentScope: 'account',
            paymentOption: 'installment',
            totalAmount: installmentAmount,
            ...originMeta,
          },
          extra: {
            ...account,
            arBalance,
            installmentAmount,
          },
        }),
      );
    },
    [buildOriginMeta, data?.client?.id, dispatch],
  );

  const fetchExistingReceivable = useCallback(
    async (preorderId?: string) => {
      if (!user?.businessID || !preorderId) return null;
      const accounts = await fbGetAccountReceivableByInvoiceOnce(
        user.businessID,
        preorderId,
      );
      return (accounts?.[0] ?? null) as AccountsReceivableDoc | null;
    },
    [user?.businessID],
  );

  const handleExistingReceivable = useCallback(
    (account: AccountsReceivableDoc | null, preorderId?: string) => {
      if (!account) return false;

      const arBalance = Number(
        account?.arBalance ??
          account?.currentBalance ??
          account?.totalReceivable ??
          0,
      );

      if (arBalance <= 0) {
        notification.info({
          message: 'Saldo completado',
          description:
            'La cuenta por cobrar está saldada. Puedes convertir la preventa en factura.',
        });
        handleInvoicePanelOpen();
        return true;
      }

      openReceivablePayment(account, preorderId);
      return true;
    },
    [handleInvoicePanelOpen, openReceivablePayment],
  );

  const closeReceivableConfig = useCallback(() => {
    setIsReceivableConfigOpen(false);
    dispatch(toggleReceivableStatus(false));
    dispatch(resetAR());
  }, [dispatch]);

  const handleUseReceivable = useCallback(async () => {
    if (!data) return;

    const { isValid, message } = validateInvoiceCart(data);
    if (!isValid) {
      notification.warning({
        message: 'No se pudo iniciar CxC',
        description: message || 'Verifica el contenido antes de continuar.',
      });
      return;
    }

    const serializedPreorder = convertToCart(data);
    const preorderId = serializedPreorder?.id;
    const client =
      effectiveClient ||
      (isValidClient(serializedPreorder?.client)
        ? serializedPreorder?.client
        : null);
    const clientId = client?.id;

    if (!clientId || clientId === 'GC-0000') {
      notification.error({
        message: 'Cliente inv?lido',
        description: 'Selecciona un cliente espec?fico para usar CxC.',
      });
      setIsClientSelectorOpen(true);
      return;
    }

    if (client && clientId !== serializedPreorder?.client?.id) {
      dispatch(selectClientWithAuth(client));
    }

    if (!preorderId) {
      notification.error({
        message: 'Preventa sin ID',
        description: 'No se pudo identificar la preventa para CxC.',
      });
      return;
    }

    try {
      const existing = await fetchExistingReceivable(preorderId);
      if (existing && handleExistingReceivable(existing, preorderId)) {
        setIsReceivableDecisionOpen(false);
        return;
      }
    } catch (error) {
      notification.error({
        message: 'No se pudo validar CxC',
        description:
          error instanceof Error ? error.message : 'Intenta nuevamente.',
      });
    }

    dispatch(resetAR());
    dispatch(
      setAR({
        clientId,
        invoiceId: preorderId,
        paymentFrequency: 'monthly',
        totalInstallments: 1,
        paymentDate: null,
        originType: 'preorder',
        originId: preorderId,
        preorderId,
        originStage: 'preorder',
        createdFrom: 'preorders',
      }),
    );
    dispatch(changePaymentValue(0));
    dispatch(toggleReceivableStatus(true));
    setIsReceivableDecisionOpen(false);
    setIsReceivableConfigOpen(true);
  }, [
    convertToCart,
    data,
    dispatch,
    effectiveClient,
    fetchExistingReceivable,
    handleExistingReceivable,
    isValidClient,
  ]);

  const handleConfirmReceivable = useCallback(async () => {
    if (!data) return;

    setIsReceivableLoading(true);
    try {
      await receivableForm.validateFields();

      if (!user?.businessID) {
        notification.error({
          message: 'No se pudo crear CxC',
          description: 'No se pudo identificar el negocio.',
        });
        return;
      }

      const preorderId = data?.id;
      const client = effectiveClient || (isValidClient(data?.client) ? data?.client : null);
      const clientId = client?.id;

      if (!clientId || clientId === 'GC-0000') {
        notification.error({
          message: 'Cliente inv?lido',
          description: 'Selecciona un cliente espec?fico para usar CxC.',
        });
        setIsClientSelectorOpen(true);
        return;
      }

      if (!preorderId) {
        notification.error({
          message: 'Preventa sin ID',
          description: 'No se pudo identificar la preventa para CxC.',
        });
        return;
      }

      const totalReceivable = Number(
        accountsReceivable?.totalReceivable ?? Math.abs(change),
      );
      const totalInstallments = Number(
        accountsReceivable?.totalInstallments ?? 1,
      );
      const installmentAmount = Number(
        accountsReceivable?.installmentAmount ??
          (totalInstallments > 0
            ? totalReceivable / totalInstallments
            : totalReceivable),
      );

      const originMeta = buildOriginMeta(preorderId, null);

      const arPayload: AccountsReceivableDoc = {
        ...accountsReceivable,
        clientId,
        invoiceId: preorderId,
        paymentFrequency: accountsReceivable?.paymentFrequency || 'monthly',
        totalInstallments,
        installmentAmount,
        totalReceivable,
        arBalance: totalReceivable,
        isActive: true,
        isClosed: false,
        ...originMeta,
      };

      const created = await fbAddAR({ user, accountsReceivable: arPayload });
      if (!created?.id) {
        notification.error({
          message: 'No se pudo crear CxC',
          description: 'Intenta nuevamente.',
        });
        return;
      }

      await fbAddInstallmentAR({ user, ar: created });

      closeReceivableConfig();
      openReceivablePayment({ ...created, ...arPayload }, preorderId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Intenta nuevamente.';
      notification.error({
        message: 'No se pudo crear la cuenta por cobrar',
        description: errorMessage,
      });
    } finally {
      setIsReceivableLoading(false);
    }
  }, [
    accountsReceivable,
    buildOriginMeta,
    change,
    closeReceivableConfig,
    data,
    effectiveClient,
    isValidClient,
    openReceivablePayment,
    receivableForm,
    user,
  ]);

  const handleCompletePreorder = useCallback(async () => {
    if (!data) return;

    const { isValid, message } = validateInvoiceCart(data);
    if (!isValid) {
      notification.warning({
        message: 'No se pudo completar la preventa',
        description: message || 'Verifica el contenido antes de continuar.',
      });
      return;
    }

    const serializedPreorder = convertToCart(data);
    const preorderId = serializedPreorder?.id;

    if (invoiceTiming === 'manual') {
      await handleUseReceivable();
      return;
    }

    if (invoiceTiming !== 'full-payment' && invoiceTiming !== 'always-ask') {
      dispatch(toggleInvoicePanelOpen());
      return;
    }

    try {
      const existing = await fetchExistingReceivable(preorderId);
      if (existing && handleExistingReceivable(existing, preorderId)) {
        return;
      }
    } catch (error) {
      notification.error({
        message: 'No se pudo validar CxC',
        description:
          error instanceof Error ? error.message : 'Intenta nuevamente.',
      });
    }

    setIsReceivableDecisionOpen(true);
  }, [
    convertToCart,
    data,
    dispatch,
    fetchExistingReceivable,
    handleExistingReceivable,
    handleUseReceivable,
    invoiceTiming,
  ]);

  const handleCancelPreorder = async () => {
    try {
      await fbCancelPreorder(user, data);
      setIsCancelConfirmOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Intenta nuevamente.';
      notification.error({
        message: 'No se pudo cancelar la preventa',
        description: errorMessage,
      });
    }
  };

  const menuItems: MenuProps['items'] = [
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
      onClick: handleCompletePreorder,
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
      <div
        style={{ position: 'absolute', top: -9999, left: -9999 }}
        aria-hidden="true"
      >
        <Invoice
          ref={printRef}
          data={printableInvoiceData || printablePreorder || data}
          ignoreHidden
        />
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
            handleCompletePreorder();
          }}
        />
      </Tooltip>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
      </Dropdown>
      <PreorderModal
        preorder={data}
        open={isPreorderModalOpen}
        onCancel={() => setIsPreorderModalOpen(false)}
      />
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

      <Modal
        title="Completar preventa"
        open={isReceivableDecisionOpen}
        onCancel={() => setIsReceivableDecisionOpen(false)}
        footer={[
          <Button
            key="invoice"
            type="primary"
            onClick={() => {
              setIsReceivableDecisionOpen(false);
              handleInvoicePanelOpen();
            }}
          >
            Pagar todo y facturar
          </Button>,
          <Button key="cxc" onClick={handleUseReceivable}>
            Usar CxC (primer pago)
          </Button>,
        ]}
      >
        <p>
          Selecciona cómo deseas completar la preventa. Si usas CxC, se
          configurará la cuenta por cobrar y se registrará el primer pago.
        </p>
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 8 }}>
            <strong>Cliente:</strong>{' '}
            {effectiveClient?.name?.trim()
              ? effectiveClient.name
              : 'Sin cliente seleccionado'}
          </p>
          <Button size="small" onClick={() => setIsClientSelectorOpen(true)}>
            Seleccionar cliente
          </Button>
        </div>
      </Modal>
      <ReceivableManagementPanel
        form={receivableForm}
        creditLimit={null}
        isChangeNegative={isChangeNegative}
        receivableStatus={receivableStatus}
        isOpen={isReceivableConfigOpen}
        closePanel={closeReceivableConfig}
        showActions
        confirmText="Crear CxC y cobrar"
        cancelText="Cancelar"
        confirmLoading={isReceivableLoading}
        onConfirm={handleConfirmReceivable}
      />
      <MiniClientSelector
        isOpen={isClientSelectorOpen}
        onClose={() => setIsClientSelectorOpen(false)}
      />
    </div>
  );
};






