import {
  Button,
  notification,
  Spin,
  Form,
  Modal as AntdModal,
  message,
} from 'antd';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { selectAR } from '../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import { selectAppMode } from '../../../../../../../features/appModes/appModeSlice';
import { selectBusinessData } from '../../../../../../../features/auth/businessSlice';
import { selectUser } from '../../../../../../../features/auth/userSlice';
import {
  SelectCartData,
  SelectSettingCart,
  toggleInvoicePanelOpen,
  setPaymentMethod,
} from '../../../../../../../features/cart/cartSlice';
import { selectClient } from '../../../../../../../features/clientCart/clientCartSlice';
import { selectInsuranceAR } from '../../../../../../../features/insurance/insuranceAccountsReceivableSlice';
import { selectInsuranceAuthData } from '../../../../../../../features/insurance/insuranceAuthSlice';
import {
  selectNcfType,
  selectTaxReceipt,
  lockTaxReceiptType,
  unlockTaxReceiptType,
  selectTaxReceiptType,
} from '../../../../../../../features/taxReceipt/taxReceiptSlice';
import { downloadInvoiceLetterPdf } from '../../../../../../../firebase/quotation/downloadQuotationPDF';
import useInsuranceEnabled from '../../../../../../../hooks/useInsuranceEnabled';
import useViewportWidth from '../../../../../../../hooks/windows/useViewportWidth';
import logInvoiceAuthorizations from '../../../../../../../services/invoice/logInvoiceAuthorizations';
import useInvoice from '../../../../../../../services/invoice/useInvoice';
import DateUtils from '../../../../../../../utils/date/dateUtils';
import { measure } from '../../../../../../../utils/perf/measure';
import { Invoice } from '../../../../../../component/Invoice/components/Invoice/Invoice';

import { Body } from './components/Body/Body';
import { TaxReceiptDepletedModal } from './components/TaxReceiptDepletedModal/TaxReceiptDepletedModal';
import { modalStyles } from './constants/modalStyles';
import { handleCancelShipping } from './handleCancelShipping';
import { calculateDueDate } from './utils/calculateDueDate';
import { getInvoiceErrorNotification } from './utils/getInvoiceErrorNotification';
import { getTaxReceiptAvailability } from './utils/getTaxReceiptAvailability';
import { isTaxReceiptDepletedError } from './utils/isTaxReceiptDepletedError';

export const InvoicePanel = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [invoice, setInvoice] = useState({});
  // Flag para coordinar la impresión una vez que el estado de invoice se haya renderizado con productos
  const [pendingPrint, setPendingPrint] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [taxReceiptModalOpen, setTaxReceiptModalOpen] = useState(false);

  const fallbackIdempotencyKeyRef = useRef(null);

  const { processInvoice: runInvoice } = useInvoice();

  const [loading, setLoading] = useState({
    status: false,
    message: '',
  });

  const viewport = useViewportWidth();

  const handleInvoicePanel = useCallback(() => {
    dispatch(toggleInvoicePanelOpen());
  }, [dispatch]);

  const cart = useSelector(SelectCartData);
  const cartSettings = useSelector(SelectSettingCart);
  const invoicePanel = cartSettings.isInvoicePanelOpen;
  const shouldPrintInvoice = cartSettings.printInvoice;

  const billing = cartSettings?.billing ?? {};
  const { duePeriod, hasDueDate } = billing;

  const componentToPrintRef = useRef(null);
  const user = useSelector(selectUser);
  const client = useSelector(selectClient);
  const ncfType = useSelector(selectNcfType);
  const accountsReceivable = useSelector(selectAR);
  const taxReceiptState = useSelector(selectTaxReceipt);
  const {
    settings: { taxReceiptEnabled },
  } = taxReceiptState;
  const isAddedToReceivables = cart?.isAddedToReceivables;
  const business = useSelector(selectBusinessData) || {};
  const insuranceEnabled = useInsuranceEnabled();
  const paymentMethods = cart?.paymentMethod ?? [];

  const isAnyPaymentEnabled = useMemo(
    () => paymentMethods.some((method) => method.status),
    [paymentMethods],
  );
  const change = Number(cart?.change?.value ?? 0);
  const isChangeNegative = change < 0;
  const insuranceAR = useSelector(selectInsuranceAR);
  const insuranceAuth = useSelector(selectInsuranceAuthData) || null;
  const invoiceType = cartSettings.billing.invoiceType;
  const isTestMode = useSelector(selectAppMode);

  const invoiceComment = useMemo(() => {
    if (!Array.isArray(cart?.products)) return null;
    const comments = cart.products
      .filter((product) => product.comment)
      .map((product) => `${product.name}: ${product.comment}`);
    return comments.length ? comments.join('; ') : null;
  }, [cart?.products]);

  const resolvedBusinessId = useMemo(() => {
    return (
      business?.id ||
      business?.businessID ||
      business?.businessId ||
      user?.businessID ||
      user?.businessId ||
      null
    );
  }, [business, user]);

  const idempotencyKey = useMemo(() => {
    const derived =
      (cart?.id && `cart:${cart.id}`) ||
      (cart?.cartId && `cart:${cart.cartId}`) ||
      (cart?.cartIdRef && `cart:${cart.cartIdRef}`);
    if (derived) {
      fallbackIdempotencyKeyRef.current = null;
      return derived;
    }
    if (!fallbackIdempotencyKeyRef.current) {
      fallbackIdempotencyKeyRef.current = `gen:${nanoid()}`;
    }
    return fallbackIdempotencyKeyRef.current;
  }, [cart?.id, cart?.cartId, cart?.cartIdRef]);

  //function para despues de imprimir la factura
  const handleAfterPrint = () => {
    setInvoice({});
    // Limpiamos el carrito y opcionalmente el comprobante, luego volvemos a default
    handleCancelShipping({ dispatch, viewport, clearTaxReceipt: true });
    // Seleccionar comprobante por defecto (CONSUMIDOR FINAL si existe, si no el primero)
    const defaultReceipt =
      taxReceiptState?.data?.find(
        (r) => r?.data?.name?.toUpperCase() === 'CONSUMIDOR FINAL',
      ) || taxReceiptState?.data?.[0];
    if (defaultReceipt?.data?.name) {
      dispatch(selectTaxReceiptType(defaultReceipt.data.name));
    }
    notification.success({
      message: 'Venta Procesada',
      description: 'La venta ha sido procesada con éxito',
      duration: 4,
    });
    setLoading({ status: false, message: '' });
    setSubmitted(true);
    // Liberamos el tipo de comprobante una vez finalizado todo el flujo
    dispatch(unlockTaxReceiptType());
  };

  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
    onAfterPrint: () => handleAfterPrint(),
  });

  const handleSelectTaxReceiptFromModal = useCallback(
    (value) => {
      dispatch(selectTaxReceiptType(value));
    },
    [dispatch],
  );

  const closeTaxReceiptModal = useCallback(() => {
    setTaxReceiptModalOpen(false);
  }, []);

  // Efecto: cuando invoice se llena (tiene id o productos) y hay una impresión pendiente, ejecutar impresión.
  useEffect(() => {
    if (!pendingPrint) return;
    // Verificamos que haya productos o al menos un identificador antes de imprimir
    const hasProducts =
      Array.isArray(invoice?.products) && invoice.products.length > 0;
    const hasId = !!invoice?.id;
    if (hasProducts || hasId) {
      // Damos un pequeño margen para asegurar el layout (sobre todo en modo concurrent/render estricto)
      const timeout = setTimeout(() => {
        handlePrint();
        setPendingPrint(false);
      }, 80); // 2 frames aprox (~16ms * 2) + margen
      return () => clearTimeout(timeout);
    }
  }, [invoice, pendingPrint, handlePrint]);

  // Reinstate the showCancelSaleConfirm function
  const showCancelSaleConfirm = () => {
    AntdModal.confirm({
      // Use AntdModal directly to avoid conflict with styled Modal
      title: '¿Cancelar Venta?',
      content: 'Si cancelas, se perderán los datos de la venta actual.',
      okText: 'Cancelar',
      zIndex: 999999999999,
      okType: 'danger',
      cancelText: 'NO',
      onOk() {
        message.success('Venta cancelada', 2.5);
        handleCancelShipping({ dispatch, viewport, clearTaxReceipt: false });
        dispatch(unlockTaxReceiptType());
      },
      onCancel() {
        message.info('Continuando con la venta', 2.5);
      },
    });
  };

  const handleInvoicePrinting = useCallback(
    async (inv) => {
      if (invoiceType === 'template2') {
        try {
          await measure('downloadInvoiceLetterPdf', () =>
            downloadInvoiceLetterPdf(business, inv, handleAfterPrint),
          );
        } catch (e) {
          notification.error({
            message: 'Error al imprimir',
            description: `No se pudo generar el PDF: ${e.message}`,
            duration: 4,
          });
          handleAfterPrint();
        }
      } else {
        // Para plantillas térmicas/compactas esperamos a que el estado se hydrate antes de imprimir
        setPendingPrint(true);
      }
    },
    [invoiceType, business, handleAfterPrint],
  );

  async function handleSubmit({ bypassTaxReceiptOverride = false } = {}) {
    try {
      const effectiveTaxReceiptEnabled =
        !bypassTaxReceiptOverride && taxReceiptEnabled;

      if (effectiveTaxReceiptEnabled) {
        const { depleted } = getTaxReceiptAvailability(
          taxReceiptState?.data,
          ncfType,
        );
        if (depleted) {
          setTaxReceiptModalOpen(true);
          dispatch(unlockTaxReceiptType());
          return;
        }
        // Bloqueamos el tipo de comprobante para que no cambie durante el proceso
        dispatch(lockTaxReceiptType());
      } else {
        dispatch(unlockTaxReceiptType());
      }

      setLoading({ status: true, message: '' });
      if (cart?.isAddedToReceivables) {
        await form.validateFields();
      }

      const dueDate = calculateDueDate(duePeriod, hasDueDate);

      if (!resolvedBusinessId) {
        throw new Error(
          'No se encontró el negocio asociado para procesar la factura.',
        );
      }
      console.info('[InvoicePanel] processInvoice -> started', {
        cartId: cart?.id ?? cart?.cartId ?? cart?.cartIdRef ?? null,
        businessId: resolvedBusinessId,
        userId: user?.uid ?? null,
        testMode: Boolean(isTestMode),
        taxReceiptEnabled: effectiveTaxReceiptEnabled,
        idempotencyKey,
        invoice: cart,
      });
      const invoiceResult = await measure('processInvoice', () =>
        runInvoice({
          cart,
          user,
          client,
          accountsReceivable,
          taxReceiptEnabled: effectiveTaxReceiptEnabled,
          ncfType: effectiveTaxReceiptEnabled ? ncfType : null,
          dueDate,
          insuranceEnabled,
          insuranceAR,
          insuranceAuth,
          invoiceComment, // Comentarios agregados desde los productos
          isTestMode,
          businessId: resolvedBusinessId,
          business,
          idempotencyKey,
        }),
      );
      const createdInvoice = invoiceResult?.invoice;
      if (!createdInvoice) {
        throw new Error(
          'No se pudo recuperar la factura generada desde el backend.',
        );
      }

      if (invoiceResult?.status !== 'test-preview') {
        await logInvoiceAuthorizations({
          user,
          invoice: createdInvoice,
          authorizationContext: cart?.authorizationContext,
          cart,
        });
      }

      const invoiceStatus = invoiceResult?.status ?? null;
      const invoiceReused = Boolean(invoiceResult?.reused);

      if (invoiceReused) {
        notification.info({
          message: 'Factura reutilizada',
          description:
            'Detectamos que esta venta ya estaba en proceso y reutilizamos la factura existente para evitar duplicados.',
          duration: 6,
        });
      }

      if (invoiceStatus && invoiceStatus !== 'committed') {
        const statusMessages = {
          frontend_ready: {
            message: 'Factura en proceso',
            description:
              'Seguimos finalizando la factura en segundo plano. Los totales se actualizarán en breve.',
          },
          'test-preview': {
            message: 'Modo prueba activo',
            description:
              'Generamos una vista previa de la factura, pero no se guardó en la base de datos.',
          },
        };

        const info = statusMessages[invoiceStatus];
        notification.info({
          message: info?.message ?? 'Estado de factura',
          description:
            info?.description ??
            `La factura quedó en estado "${invoiceStatus}".`,
          duration: 6,
        });
      }

      console.info('[InvoicePanel] processInvoice -> completed', {
        invoiceId: createdInvoice?.id ?? invoiceResult?.invoiceId ?? null,
        status: invoiceResult?.status ?? null,
        reused: Boolean(invoiceResult?.reused),
        invoice: createdInvoice,
      });

      if (shouldPrintInvoice) {
        setInvoice(createdInvoice); // Actualizamos estado primero
        void measure('handleInvoicePrinting', () =>
          handleInvoicePrinting(createdInvoice),
        );
      }
      if (!shouldPrintInvoice) {
        setInvoice({});
        handleAfterPrint();
      }
    } catch (error) {
      const taxReceiptDepleted = isTaxReceiptDepletedError(error);
      if (!taxReceiptDepleted) {
        const errorNotification = getInvoiceErrorNotification(error);
        notification.error({
          message: errorNotification.message,
          description: errorNotification.description,
          duration: errorNotification.duration ?? 6,
        });
      }
      setLoading({ status: false, message: '' });
      setSubmitted(false);
      console.error(
        '[InvoicePanel] processInvoice -> failed',
        {
          message: error?.message,
          code: error?.code,
          invoiceId: error?.invoiceId ?? error?.invoice?.id ?? null,
          idempotencyKey: error?.idempotencyKey ?? null,
          reused: error?.reused ?? null,
          failedTask: error?.failedTask ?? null,
          invoiceMeta: error?.invoiceMeta ?? null,
        },
        error,
      );
      // En caso de error liberamos el bloqueo para que el usuario pueda cambiar el comprobante
      dispatch(unlockTaxReceiptType());
      if (taxReceiptDepleted) {
        setTaxReceiptModalOpen(true);
      }
    }
  }

  // const installments = generateInstallments({ ar: accountsReceivable, user })

  useEffect(() => {
    if (invoicePanel) {
      form.setFieldsValue({
        frequency: 'monthly',
        totalInstallments: 1,
        paymentDate: DateUtils.convertMillisToDayjs(Date.now()),
      });
    }
  }, [invoicePanel, form]);
  useEffect(() => {
    if (invoicePanel) {
      form.setFieldsValue({
        ...accountsReceivable,
        paymentDate: DateUtils.convertMillisToDayjs(
          accountsReceivable?.paymentDate,
        ),
      });
    }
  }, [accountsReceivable, invoicePanel, form]);
  useEffect(() => {
    if (!invoicePanel) {
      setSubmitted(false);
      fallbackIdempotencyKeyRef.current = null;
      setTaxReceiptModalOpen(false);
    }
  }, [invoicePanel]); // Efecto para inicializar el método de pago cuando se abre el panel
  useEffect(() => {
    // Solo se ejecuta cuando se abre el panel de factura, no en cada actualización
    if (invoicePanel) {
      // Asegurar al menos un método habilitado (incluso si el monto es 0 para CxC)
      const methods = cart?.paymentMethod || [];
      const anyEnabled = methods.some((m) => m.status);
      const purchaseTotal = cart?.totalPurchase?.value || 0;
      if (!anyEnabled) {
        // Seleccionar método cash o el primero disponible
        const defaultMethod =
          methods.find((m) => m.method === 'cash') || methods[0];
        if (defaultMethod) {
          dispatch(
            setPaymentMethod({
              ...defaultMethod,
              status: true,
              value: isAddedToReceivables ? 0 : purchaseTotal,
            }),
          );
        }
      } else {
        // Para ventas normales, si el pago total es 0 y hay un total de compra, inicializar valor
        const totalPaymentValue = methods.reduce(
          (sum, m) => (m.status ? sum + (Number(m.value) || 0) : sum),
          0,
        );
        if (
          !isAddedToReceivables &&
          totalPaymentValue === 0 &&
          purchaseTotal > 0
        ) {
          const cashMethod = methods.find((m) => m.method === 'cash');
          if (cashMethod) {
            dispatch(
              setPaymentMethod({
                ...cashMethod,
                status: true,
                value: purchaseTotal,
              }),
            );
          }
        }
      }
    }
  }, [invoicePanel]);

  const retryWithTaxReceipt = () => {
    setTaxReceiptModalOpen(false);
    void handleSubmit();
  };

  const continueWithoutTaxReceipt = () => {
    setTaxReceiptModalOpen(false);
    void handleSubmit({ bypassTaxReceiptOverride: true });
  };

  return (
    <>
      <Modal
        style={{ top: 10 }}
        open={invoicePanel}
        title="Pago de Factura"
        onCancel={handleInvoicePanel}
        styles={modalStyles}
        footer={[
          <Button
            key="close"
            type="default"
            disabled={loading.status || submitted}
            onClick={handleInvoicePanel}
          >
            Atrás
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading.status}
            disabled={
              submitted ||
              !isAnyPaymentEnabled ||
              (isChangeNegative && !isAddedToReceivables)
            }
            onClick={handleSubmit}
          >
            Facturar
          </Button>,
        ]}
      >
        <Invoice ref={componentToPrintRef} data={invoice} />
        <Spin spinning={loading.status}>
          <Body form={form} />
          <br />
          <Button
            key="cancel"
            type="default"
            danger
            style={{ width: '100%' }}
            disabled={loading.status || submitted}
            onClick={showCancelSaleConfirm} // Use confirmation modal
          >
            Cancelar venta
          </Button>
        </Spin>
      </Modal>
      <TaxReceiptDepletedModal
        open={taxReceiptModalOpen}
        receipts={taxReceiptState?.data}
        currentReceipt={ncfType}
        loading={loading.status}
        onSelectReceipt={handleSelectTaxReceiptFromModal}
        onRetry={retryWithTaxReceipt}
        onContinueWithout={continueWithoutTaxReceipt}
        onCancel={closeTaxReceiptModal}
      />
    </>
  );
};

export const Modal = styled(AntdModal)`
  /* stylelint-disable-next-line block-no-empty -- overridden by Antd defaults */
  .ant-modal-content {
  }

  .ant-modal-header {
    padding: 1em 1em 0;
  }

  .ant-modal-body {
    padding: 1em;

    /* overflow-y: scroll;    */
  }

  .ant-modal-footer {
    padding: 0 1em 1em;
  }

  padding: 0;
`;
