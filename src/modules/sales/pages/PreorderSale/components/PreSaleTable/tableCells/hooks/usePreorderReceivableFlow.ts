import { useCallback, useState } from 'react';
import { Form, notification } from 'antd';

import {
  resetAR,
  setAR,
} from '@/features/accountsReceivable/accountsReceivableSlice';
import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import {
  changePaymentValue,
  toggleInvoicePanelOpen,
  toggleReceivableStatus,
} from '@/features/cart/cartSlice';
import { selectClientWithAuth } from '@/features/clientCart/clientCartSlice';
import { selectTaxReceiptType } from '@/features/taxReceipt/taxReceiptSlice';
import { fbAddAR } from '@/firebase/accountsReceivable/fbAddAR';
import { fbAddInstallmentAR } from '@/firebase/accountsReceivable/fbAddInstallmentAR';
import { fbGetAccountReceivableByInvoiceOnce } from '@/firebase/accountsReceivable/fbGetAccountReceivableByInvoiceOnce';
import { getTaxReceiptAvailability } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/getTaxReceiptAvailability';
import { autoCompletePreorderInvoice } from '@/services/invoice/autoCompletePreorderInvoice';
import type { InvoiceData } from '@/types/invoice';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import { flowTrace } from '@/utils/flowTrace';
import { validateInvoiceCart } from '@/utils/invoiceValidation';

import type { AccountsReceivableState, ClientLike } from '../types';
import { normalizeClientForCart, resolveClientId } from '../utils';

type UsePreorderReceivableFlowParams = {
  accountsReceivable: AccountsReceivableState;
  change: number;
  convertToCart: (source: InvoiceData) => InvoiceData;
  data: InvoiceData | null;
  dispatch: any;
  effectiveClient: ClientLike | null;
  handleInvoicePanelOpen: () => void;
  invoiceTiming: string;
  isTestMode: boolean;
  isValidClient: (client?: ClientLike | null) => boolean;
  ncfType: string | null;
  taxReceiptData: TaxReceiptItem[];
  taxReceiptEnabled: boolean;
  user: UserIdentity | null;
};

type AutoCompleteOverrides = {
  ncfType?: string | null;
  taxReceiptEnabled?: boolean;
  allowInvoicePanelFallback?: boolean;
};

export const usePreorderReceivableFlow = ({
  accountsReceivable,
  change,
  convertToCart,
  data,
  dispatch,
  effectiveClient,
  handleInvoicePanelOpen,
  invoiceTiming,
  isTestMode,
  isValidClient,
  ncfType,
  taxReceiptData,
  taxReceiptEnabled,
  user,
}: UsePreorderReceivableFlowParams) => {
  const [receivableForm] = Form.useForm();
  const [isReceivableDecisionOpen, setIsReceivableDecisionOpen] =
    useState(false);
  const [isReceivableConfigOpen, setIsReceivableConfigOpen] = useState(false);
  const [isReceivableLoading, setIsReceivableLoading] = useState(false);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isDecisionLoading, setIsDecisionLoading] =
    useState<'invoice' | 'cxc' | null>(null);
  const [isCompletingPreorder, setIsCompletingPreorder] = useState(false);
  const [isAutoCompletingPreorder, setIsAutoCompletingPreorder] = useState(false);
  const [isTaxReceiptModalOpen, setIsTaxReceiptModalOpen] = useState(false);
  const [pendingAutoCompletePreorderId, setPendingAutoCompletePreorderId] =
    useState<string | null>(null);

  const openTaxReceiptModalForPreorder = useCallback((preorderId: string) => {
    setPendingAutoCompletePreorderId(preorderId);
    setIsTaxReceiptModalOpen(true);
  }, []);

  const closeTaxReceiptModal = useCallback(() => {
    setIsTaxReceiptModalOpen(false);
    setPendingAutoCompletePreorderId(null);
  }, []);

  const handleSelectTaxReceiptFromModal = useCallback(
    (value: string) => {
      dispatch(selectTaxReceiptType(value));
    },
    [dispatch],
  );

  const isTaxReceiptDepletedForAutoComplete = useCallback(
    ({
      effectiveTaxReceiptEnabled,
      effectiveNcfType,
    }: {
      effectiveTaxReceiptEnabled: boolean;
      effectiveNcfType: string | null;
    }) => {
      if (!effectiveTaxReceiptEnabled) return false;
      const { depleted } = getTaxReceiptAvailability(
        taxReceiptData,
        effectiveNcfType,
      );
      return depleted;
    },
    [taxReceiptData],
  );

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

      void flowTrace('PREORDER_OPEN_AR_PAYMENT', {
        preorderId,
        arId: account.id,
        clientId: account?.clientId,
      });

      const arBalance = Number(
        account?.arBalance ??
          account?.currentBalance ??
          account?.totalReceivable ??
          0,
      );
      const installmentAmount = Number(account?.installmentAmount ?? arBalance);
      const originMeta = buildOriginMeta(preorderId, account);
      const preorderNumber =
        data?.preorderDetails?.numberID ??
        data?.preorderDetails?.number ??
        data?.numberID ??
        data?.number ??
        null;
      const invoiceNumber = data?.numberID ?? data?.number ?? null;

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
            clientName: data?.client?.name,
            clientCode: data?.client?.numberId ?? data?.client?.id,
            documentLabel: 'Preventa',
            documentNumber: preorderNumber ?? invoiceNumber,
            preorderNumber,
            invoiceNumber,
          },
        }),
      );
    },
    [
      buildOriginMeta,
      data?.client?.id,
      data?.client?.name,
      data?.client?.numberId,
      data?.number,
      data?.numberID,
      data?.preorderDetails?.number,
      data?.preorderDetails?.numberID,
      dispatch,
    ],
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

  const handleAutoCompletePreorder = useCallback(
    async (
      preorderId: string,
      overrides: AutoCompleteOverrides = {},
    ) => {
      if (!user?.businessID || !user?.uid) return;

      const effectiveTaxReceiptEnabled =
        overrides.taxReceiptEnabled ?? Boolean(taxReceiptEnabled);
      const effectiveNcfType = overrides.ncfType ?? ncfType;
      const allowInvoicePanelFallback =
        overrides.allowInvoicePanelFallback ?? true;

      if (
        isTaxReceiptDepletedForAutoComplete({
          effectiveTaxReceiptEnabled,
          effectiveNcfType,
        })
      ) {
        openTaxReceiptModalForPreorder(preorderId);
        return;
      }

      setPendingAutoCompletePreorderId(preorderId);
      setIsAutoCompletingPreorder(true);
      notification.info({
        key: 'auto-complete-preorder',
        message: 'Generando factura...',
        description:
          'La preventa se está convirtiendo en factura automáticamente.',
        duration: 0,
      });

      try {
        const result = await autoCompletePreorderInvoice({
          businessId: user.businessID,
          userId: user.uid,
          preorderId,
          taxReceiptEnabled: effectiveTaxReceiptEnabled,
          ncfType: effectiveNcfType,
          isTestMode: Boolean(isTestMode),
        });

        if (result.success) {
          setIsTaxReceiptModalOpen(false);
          setPendingAutoCompletePreorderId(null);
          notification.success({
            key: 'auto-complete-preorder',
            message: 'Factura generada',
            description: 'La preventa fue convertida en factura exitosamente.',
            duration: 6,
          });
          return;
        }

        if (result.errorCode === 'ncf-unavailable') {
          openTaxReceiptModalForPreorder(preorderId);
          notification.warning({
            key: 'auto-complete-preorder',
            message: 'Comprobante fiscal agotado',
            description:
              result.error ||
              'No hay comprobantes suficientes. Selecciona otro comprobante o continúa sin comprobante.',
            duration: 8,
          });
          return;
        }

        notification.warning({
          key: 'auto-complete-preorder',
          message: 'No se pudo generar la factura automáticamente',
          description: result.error || 'Puedes completar la preventa manualmente.',
          duration: 8,
        });
        if (allowInvoicePanelFallback) {
          handleInvoicePanelOpen();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';

        notification.warning({
            key: 'auto-complete-preorder',
            message: 'No se pudo generar la factura automáticamente',
            description: allowInvoicePanelFallback
              ? `${errorMessage}. Abriendo panel de factura...`
              : errorMessage,
            duration: 8,
          });
        if (allowInvoicePanelFallback) {
          handleInvoicePanelOpen();
        }
      } finally {
        setIsAutoCompletingPreorder(false);
      }
    },
    [
      handleInvoicePanelOpen,
      isTaxReceiptDepletedForAutoComplete,
      isTestMode,
      ncfType,
      openTaxReceiptModalForPreorder,
      taxReceiptEnabled,
      user,
    ],
  );

  const handleRetryAutoCompleteWithSelectedReceipt = useCallback(async () => {
    const preorderId = pendingAutoCompletePreorderId;
    const selectedReceipt = typeof ncfType === 'string' ? ncfType.trim() : '';

    if (!preorderId) return;
    if (!selectedReceipt) {
      notification.warning({
        message: 'Selecciona un comprobante',
        description: 'Debes elegir un comprobante para continuar.',
      });
      return;
    }

    setIsTaxReceiptModalOpen(false);
    await handleAutoCompletePreorder(preorderId, {
      ncfType: selectedReceipt,
      taxReceiptEnabled: true,
      allowInvoicePanelFallback: true,
    });
  }, [handleAutoCompletePreorder, ncfType, pendingAutoCompletePreorderId]);

  const handleContinueAutoCompleteWithoutReceipt = useCallback(async () => {
    const preorderId = pendingAutoCompletePreorderId;
    if (!preorderId) return;

    setIsTaxReceiptModalOpen(false);
    await handleAutoCompletePreorder(preorderId, {
      ncfType: null,
      taxReceiptEnabled: false,
      allowInvoicePanelFallback: true,
    });
  }, [handleAutoCompletePreorder, pendingAutoCompletePreorderId]);

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
        void flowTrace('PREORDER_AR_PAID', { preorderId, arId: account.id });

        if (preorderId) {
          void handleAutoCompletePreorder(preorderId);
        } else {
          notification.info({
            message: 'Saldo completado',
            description:
              'La cuenta por cobrar está saldada. Puedes convertir la preventa en factura.',
          });
          handleInvoicePanelOpen();
        }
        return true;
      }

      void flowTrace('PREORDER_AR_EXISTS', { preorderId, arId: account.id });
      openReceivablePayment(account, preorderId);
      return true;
    },
    [handleAutoCompletePreorder, handleInvoicePanelOpen, openReceivablePayment],
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
      void flowTrace('PREORDER_AR_VALIDATE_FAIL', {
        preorderId: data?.id,
        message,
      });
      notification.warning({
        message: 'No se pudo iniciar CxC',
        description: message || 'Verifica el contenido antes de continuar.',
      });
      return;
    }

    const serializedPreorder = convertToCart(data);
    const preorderId = serializedPreorder?.id;
    void flowTrace('PREORDER_COMPLETE_START', { preorderId, invoiceTiming });

    const client =
      effectiveClient ||
      (isValidClient(serializedPreorder?.client)
        ? (serializedPreorder?.client as ClientLike)
        : null);
    const clientId = resolveClientId(client);

    if (!clientId || clientId === 'GC-0000') {
      void flowTrace('PREORDER_AR_INVALID_CLIENT', { preorderId, clientId });
      notification.error({
        message: 'Cliente invalido',
        description: 'Selecciona un cliente especifico para usar CxC.',
      });
      setIsClientSelectorOpen(true);
      return;
    }

    const normalizedClient = normalizeClientForCart(client);
    if (
      normalizedClient &&
      clientId !== resolveClientId(serializedPreorder?.client as ClientLike)
    ) {
      dispatch(selectClientWithAuth(normalizedClient));
    }

    if (!preorderId) {
      void flowTrace('PREORDER_AR_MISSING_ID', { preorderId });
      notification.error({
        message: 'Preventa sin ID',
        description: 'No se pudo identificar la preventa para CxC.',
      });
      return;
    }

    try {
      void flowTrace('PREORDER_AR_CHECK_EXISTING', { preorderId });
      void flowTrace('PREORDER_COMPLETE_CHECK_EXISTING', { preorderId });
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
    void flowTrace('PREORDER_AR_CONFIG_OPEN', {
      preorderId,
      clientId,
      paymentFrequency: 'monthly',
      totalInstallments: 1,
    });
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
    invoiceTiming,
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
      const client =
        effectiveClient ||
        (isValidClient(data?.client) ? (data?.client as ClientLike) : null);
      const clientId = resolveClientId(client);

      if (!clientId || clientId === 'GC-0000') {
        void flowTrace('PREORDER_AR_CONFIRM_INVALID_CLIENT', {
          preorderId,
          clientId,
        });
        notification.error({
          message: 'Cliente invalido',
          description: 'Selecciona un cliente especifico para usar CxC.',
        });
        setIsClientSelectorOpen(true);
        return;
      }

      if (!preorderId) {
        void flowTrace('PREORDER_AR_CONFIRM_MISSING_ID', { preorderId });
        notification.error({
          message: 'Preventa sin ID',
          description: 'No se pudo identificar la preventa para CxC.',
        });
        return;
      }

      const totalReceivable = Number(
        accountsReceivable?.totalReceivable ?? Math.abs(change),
      );
      const totalInstallments = Number(accountsReceivable?.totalInstallments ?? 1);
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

      void flowTrace('PREORDER_AR_CREATE', {
        preorderId,
        clientId,
        totalReceivable,
        totalInstallments,
        installmentAmount,
      });
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
      void flowTrace('PREORDER_AR_CREATE_SUCCESS', {
        preorderId,
        arId: created.id,
      });
      openReceivablePayment({ ...arPayload, ...created }, preorderId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Intenta nuevamente.';
      void flowTrace('PREORDER_AR_CREATE_ERROR', {
        preorderId: data?.id,
        message: errorMessage,
      });
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

    setIsCompletingPreorder(true);
    try {
      const { isValid, message } = validateInvoiceCart(data);
      if (!isValid) {
        void flowTrace('PREORDER_COMPLETE_VALIDATE_FAIL', {
          preorderId: data?.id,
          message,
        });
        notification.warning({
          message: 'No se pudo completar la preventa',
          description: message || 'Verifica el contenido antes de continuar.',
        });
        return;
      }

      const serializedPreorder = convertToCart(data);
      const preorderId = serializedPreorder?.id;

      const effectiveTiming =
        invoiceTiming === 'manual' || invoiceTiming === 'always-ask'
          ? 'full-payment'
          : invoiceTiming;

      if (effectiveTiming !== 'full-payment') {
        dispatch(toggleInvoicePanelOpen(undefined));
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
    } finally {
      setIsCompletingPreorder(false);
    }
  }, [
    convertToCart,
    data,
    dispatch,
    fetchExistingReceivable,
    handleExistingReceivable,
    invoiceTiming,
  ]);

  const handleSelectInvoiceDecision = useCallback(async () => {
    setIsDecisionLoading('invoice');
    try {
      setIsReceivableDecisionOpen(false);
      handleInvoicePanelOpen();
    } finally {
      setIsDecisionLoading(null);
    }
  }, [handleInvoicePanelOpen]);

  const handleSelectReceivableDecision = useCallback(async () => {
    setIsDecisionLoading('cxc');
    try {
      await handleUseReceivable();
    } finally {
      setIsDecisionLoading(null);
    }
  }, [handleUseReceivable]);

  return {
    closeTaxReceiptModal,
    closeClientSelector: () => setIsClientSelectorOpen(false),
    closeReceivableConfig,
    closeReceivableDecision: () => setIsReceivableDecisionOpen(false),
    handleCompletePreorder,
    handleConfirmReceivable,
    handleContinueAutoCompleteWithoutReceipt,
    handleRetryAutoCompleteWithSelectedReceipt,
    handleSelectInvoiceDecision,
    handleSelectTaxReceiptFromModal,
    handleSelectReceivableDecision,
    isAutoCompletingPreorder,
    isClientSelectorOpen,
    isCompletingPreorder,
    isDecisionLoading,
    isReceivableConfigOpen,
    isReceivableDecisionOpen,
    isReceivableLoading,
    isTaxReceiptModalOpen,
    openClientSelector: () => setIsClientSelectorOpen(true),
    receivableForm,
  };
};
