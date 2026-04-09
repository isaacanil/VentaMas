import { Modal, message, notification } from 'antd';

import { fbAddPreOrder } from '@/firebase/invoices/fbAddPreocer';
import { fbUpdatePreOrder } from '@/firebase/invoices/fbUpdatePreorder';
import { downloadQuotationPdf } from '@/firebase/quotation/downloadQuotationPDF';
import { addQuotation } from '@/firebase/quotation/quotationService';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';
import { validateInvoiceCart } from '@/utils/invoiceValidation';
import { handleCancelShipping } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/handleCancelShipping';

import type { Authorizer, BillingSettings } from '../types';

type DispatchLike = (action: unknown) => void;

interface BuildPreorderPayloadArgs {
  cartData: InvoiceData | null;
  isTaxReceiptEnabled: boolean;
  selectedNcfType: string | null;
}

interface DownloadQuotationArgs {
  billingSettings: BillingSettings | null | undefined;
  business: InvoiceBusinessInfo;
  cartData: InvoiceData | null;
  dispatch: DispatchLike;
  isDeveloperUser: boolean;
  setQuotationLoading: (value: boolean) => void;
  user: Authorizer | null;
}

interface PersistPreorderArgs {
  activateSaleMode: () => void;
  cartData: InvoiceData | null;
  closePreorderConfirmation: () => void;
  dispatch: DispatchLike;
  isSavingPreorder: boolean;
  isTaxReceiptEnabled: boolean;
  selectedNcfType: string | null;
  setPreorderSaving: (value: boolean) => void;
  shouldPrint?: boolean;
  triggerPreorderPrint: (source: InvoiceData) => Promise<void>;
  user: Authorizer | null;
}

export const buildPreorderPayload = ({
  cartData,
  isTaxReceiptEnabled,
  selectedNcfType,
}: BuildPreorderPayloadArgs) => {
  if (!cartData) return cartData;

  const basePreorderDetails = cartData?.preorderDetails ?? {};
  const normalizedSelectedType = isTaxReceiptEnabled
    ? selectedNcfType || null
    : null;

  return {
    ...cartData,
    selectedTaxReceiptType: normalizedSelectedType,
    preorderDetails: {
      ...basePreorderDetails,
      selectedTaxReceiptType: normalizedSelectedType,
    },
  };
};

const showCleanQuotationModal = (dispatch: DispatchLike) => {
  Modal.confirm({
    title: '¿Limpiar cotización?',
    content: '¿Desea limpiar los datos de la cotización?',
    okText: 'Limpiar',
    cancelText: 'Mantener',
    onOk: () => {
      handleCancelShipping({
        dispatch: dispatch as any,
        closeInvoicePanel: false,
      });
      message.success('Se han restablecido los datos');
    },
    onCancel: () => {
      message.success('Se han mantenido los datos de la cotización');
    },
  });
};

export const downloadQuotationAction = async ({
  billingSettings,
  business,
  cartData,
  dispatch,
  isDeveloperUser,
  setQuotationLoading,
  user,
}: DownloadQuotationArgs) => {
  if (!user || !cartData) {
    notification.warning({
      message: 'No se pudo iniciar la cotización',
      description:
        'Faltan datos de la sesión o del carrito. Intenta nuevamente.',
    });
    console.warn('[QuotationDebug][UI] Missing user or cartData', {
      hasUser: Boolean(user),
      hasCartData: Boolean(cartData),
    });
    return;
  }

  try {
    setQuotationLoading(true);
    console.info('[QuotationDebug][UI] Starting quotation flow', {
      userId: user?.uid ?? null,
      businessId: user?.businessID ?? null,
      productsCount: Array.isArray(cartData?.products)
        ? cartData.products.length
        : 0,
      total:
        typeof cartData?.totalPurchase === 'object'
          ? (cartData.totalPurchase as any)?.value ?? null
          : null,
    });

    const data = await addQuotation(user, cartData, billingSettings);
    console.info('[QuotationDebug][UI] Quotation saved', {
      quotationId: (data as any)?.id ?? null,
      quotationNumber: (data as any)?.numberID ?? null,
    });

    await downloadQuotationPdf(business, data, () =>
      showCleanQuotationModal(dispatch),
    );
    console.info('[QuotationDebug][UI] downloadQuotationPdf completed', {
      quotationId: (data as any)?.id ?? null,
    });
  } catch (error) {
    console.error('Error al descargar la cotización:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    console.error('[QuotationDebug][UI] Quotation flow failed', {
      message: errorMessage,
      rawError: error,
    });
    notification.error({
      message: 'No se pudo generar la cotización',
      description: isDeveloperUser
        ? `Detalle técnico: ${errorMessage}`
        : 'Ocurrió un problema al generar o abrir el PDF. Intenta nuevamente en unos segundos. Si persiste, contacta soporte.',
      duration: 7,
    });
  } finally {
    setQuotationLoading(false);
  }
};

const persistPreorder = async (
  {
    activateSaleMode,
    cartData,
    closePreorderConfirmation,
    dispatch,
    isSavingPreorder,
    isTaxReceiptEnabled,
    selectedNcfType,
    setPreorderSaving,
    shouldPrint = false,
    triggerPreorderPrint,
    user,
  }: PersistPreorderArgs,
  {
    errorMessage,
    persist,
    successMessage,
    successDescription,
    validationMessage,
  }: {
    errorMessage: string;
    persist: (user: Authorizer | null, payload: InvoiceData) => Promise<InvoiceData>;
    successDescription?: string;
    successMessage: string;
    validationMessage: string;
  },
) => {
  if (isSavingPreorder) return;

  const { isValid, message: cartValidationMessage } =
    validateInvoiceCart(cartData);

  if (!isValid) {
    notification.warning({
      message: validationMessage,
      description:
        cartValidationMessage ||
        'Verifica los datos del carrito antes de continuar.',
    });
    return;
  }

  try {
    setPreorderSaving(true);

    const preorderPayload =
      buildPreorderPayload({
        cartData,
        isTaxReceiptEnabled,
        selectedNcfType,
      }) || cartData;
    const savedPreorder = await persist(user, preorderPayload as InvoiceData);

    handleCancelShipping({ dispatch: dispatch as any, closeInvoicePanel: false });
    closePreorderConfirmation();
    activateSaleMode();

    if (shouldPrint && savedPreorder) {
      await triggerPreorderPrint(savedPreorder);
    }

    notification.success({
      message: successMessage,
      ...(successDescription ? { description: successDescription } : {}),
      type: 'success',
    });
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    notification.error({
      message: errorMessage,
      description:
        (error as any)?.message || 'Intenta nuevamente en unos segundos.',
    });
  } finally {
    setPreorderSaving(false);
  }
};

export const savePreorderAction = async (args: PersistPreorderArgs) => {
  await persistPreorder(args, {
    errorMessage: 'No se pudo guardar la preorden',
    persist: async (user, payload) => (await fbAddPreOrder(user, payload)) as InvoiceData,
    successMessage: 'Preorden guardada con éxito',
    validationMessage: 'No se puede completar la preorden',
  });
};

export const updatePreorderAction = async (args: PersistPreorderArgs) => {
  await persistPreorder(args, {
    errorMessage: 'No se pudo actualizar la preventa',
    persist: async (user, payload) =>
      (await fbUpdatePreOrder(user, payload)) as InvoiceData,
    successDescription: 'Los cambios han sido guardados.',
    successMessage: 'Preventa actualizada con éxito',
    validationMessage: 'No se puede actualizar la preventa',
  });
};
