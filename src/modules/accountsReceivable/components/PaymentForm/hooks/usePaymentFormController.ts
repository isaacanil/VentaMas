import { Form, notification } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';

import type { AppDispatch } from '@/app/store';
import {
  closePaymentModal,
  fetchLastInstallmentAmount,
  selectAccountsReceivablePayment,
  setCreditNotePayment,
  setPaymentDetails,
  setPaymentOption,
} from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectAppMode } from '@/features/appModes/appModeSlice';
import { selectUser } from '@/features/auth/userSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { openInvoicePreviewModal } from '@/features/invoice/invoicePreviewSlice';
import {
  selectNcfType,
  selectTaxReceiptData,
  selectTaxReceiptEnabled,
  selectTaxReceiptType,
} from '@/features/taxReceipt/taxReceiptSlice';
import { getTaxReceiptAvailability } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/getTaxReceiptAvailability';
import type { CreditNoteSelection } from '@/types/creditNote';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import {
  PAYMENT_OPTIONS,
  PAYMENT_SCOPE,
} from '@/utils/accountsReceivable/accountsReceivable';

import { useAutoCompletePreorder } from './useAutoCompletePreorder';
import { usePaymentFormUiState } from './usePaymentFormUiState';
import { isPrintableReceipt } from '../utils/paymentFormHelpers';
import type {
  AutoCompleteClient,
  AutoCompleteModalState,
  AutoCompleteTarget,
  ClientSummary,
  FormValidationError,
  PaymentDetails,
} from '../utils/paymentFormTypes';
import {
  isPaymentFormValidationError,
  submitPaymentForm,
} from '../utils/submitPaymentForm';

type AccountsReceivablePaymentRootState = Parameters<
  typeof selectAccountsReceivablePayment
>[0];
type UserRootState = Parameters<typeof selectUser>[0];
type ClientRootState = Parameters<typeof selectClient>[0];

type AccountsReceivablePaymentState = ReturnType<
  typeof selectAccountsReceivablePayment
> & {
  paymentDetails: PaymentDetails;
};

const toAutoCompleteTargetFromModalState = (
  state: AutoCompleteModalState | null,
): AutoCompleteTarget | null => {
  if (!state?.preorderId) return null;

  return {
    preorderId: state.preorderId,
    arNumber: state.arNumber,
    sourceDocumentLabel: state.sourceDocumentLabel,
    sourceDocumentNumber: state.sourceDocumentNumber,
    paidAmount: state.paidAmount,
  };
};

export const usePaymentFormController = () => {
  const [form] = Form.useForm() as [FormInstance];
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const componentToPrintRef = useRef<HTMLDivElement | null>(null);
  const invoiceToPrintRef = useRef<HTMLDivElement | null>(null);
  const client = useSelector<ClientRootState, ClientSummary>(selectClient);
  const {
    loading,
    pendingAutoCompleteFlow,
    pendingAutoCompleteTarget,
    printPending,
    receipt,
    resetModalFlow,
    setLoading,
    setPendingAutoCompleteFlow,
    setPendingAutoCompleteTarget,
    setPrintPending,
    setReceipt,
    setSubmitted,
    submitted,
    setTaxReceiptModalRequested,
    taxReceiptModalRequested,
  } = usePaymentFormUiState();

  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const ncfType = useSelector(selectNcfType) as string | null;
  const taxReceiptData = useSelector(selectTaxReceiptData) as TaxReceiptItem[];
  const isTestMode = useSelector(selectAppMode) as boolean;
  const {
    autoCompleting,
    autoCompleteModalState,
    resetAutoCompleteState,
    triggerAutoCompletePreorder,
  } = useAutoCompletePreorder({
    user,
    taxReceiptEnabled,
    ncfType,
    isTestMode,
  });

  const { isOpen, paymentDetails } = useSelector<
    AccountsReceivablePaymentRootState,
    AccountsReceivablePaymentState
  >(selectAccountsReceivablePayment);
  const extra = useSelector<
    AccountsReceivablePaymentRootState,
    Record<string, unknown> | null
  >(
    (state) =>
      selectAccountsReceivablePayment(state).extra as Record<string, unknown> | null,
  );

  const selectedCreditNotes: CreditNoteSelection[] =
    paymentDetails.creditNotePayment || [];

  const resolvedAutoCompleteClient = useMemo<AutoCompleteClient | null>(() => {
    const baseClient =
      client && typeof client === 'object' ? (client as AutoCompleteClient) : null;
    const extraClient =
      extra?.client && typeof extra.client === 'object'
        ? (extra.client as AutoCompleteClient)
        : null;

    const baseName =
      typeof baseClient?.name === 'string' ? baseClient.name.trim() : '';
    const extraName =
      typeof extraClient?.name === 'string' ? extraClient.name.trim() : '';
    const modalExtraName =
      typeof extra?.clientName === 'string' ? extra.clientName.trim() : '';

    const baseIsGeneric =
      /generic client|cliente gen[ée]rico/i.test(baseName);

    const resolvedName =
      (!baseIsGeneric && baseName) || extraName || modalExtraName || baseName || null;
    const resolvedId =
      (typeof paymentDetails.clientId === 'string' && paymentDetails.clientId.trim()) ||
      (typeof baseClient?.id === 'string' && baseClient.id.trim()) ||
      (typeof extraClient?.id === 'string' && extraClient.id.trim()) ||
      null;

    if (!resolvedName && !resolvedId && !baseClient && !extraClient) {
      return null;
    }

    return {
      ...(extraClient ?? {}),
      ...(baseClient ?? {}),
      id: resolvedId,
      name: resolvedName,
    };
  }, [client, extra, paymentDetails.clientId]);

  const fallbackAutoCompleteTarget = useMemo(
    () => toAutoCompleteTargetFromModalState(autoCompleteModalState),
    [autoCompleteModalState],
  );

  const activeAutoCompleteTarget =
    pendingAutoCompleteTarget ?? fallbackAutoCompleteTarget;
  const isTaxReceiptUnavailable = autoCompleteModalState?.errorCode === 'ncf-unavailable';
  const taxReceiptModalOpen = taxReceiptModalRequested || isTaxReceiptUnavailable;
  const shouldShowAutoCompleteResultModal = Boolean(
    autoCompleteModalState && !isTaxReceiptUnavailable,
  );

  const handleClear = useCallback(() => {
    resetModalFlow();
    resetAutoCompleteState();
    dispatch(closePaymentModal());
    form.resetFields();
  }, [dispatch, form, resetAutoCompleteState, resetModalFlow]);

  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
    onAfterPrint: () => {
      notification.success({
        message: 'Pago Procesada',
        description: 'Pago registrado e impreso con éxito',
        duration: 4,
      });

      if (!pendingAutoCompleteFlow) {
        handleClear();
      }
    },
    onPrintError: (_errorLocation, error) => {
      notification.warning({
        message: 'Pago procesado sin impresión',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo completar la impresión del recibo.',
      });

      if (!pendingAutoCompleteFlow) {
        handleClear();
      }
    },
  });

  const handlePrintGeneratedInvoice = useReactToPrint({
    contentRef: invoiceToPrintRef,
  });

  useEffect(() => {
    if (!printPending || !receipt) return;

    if (!isPrintableReceipt(receipt)) {
      notification.warning({
        message: 'Pago procesado sin impresión',
        description:
          'No se pudo preparar el recibo para imprimir. El pago fue registrado.',
      });
      if (!pendingAutoCompleteFlow) {
        handleClear();
      }
      setPrintPending(false);
      return;
    }

    handlePrint();
    setPrintPending(false);
  }, [
    receipt,
    printPending,
    handlePrint,
    pendingAutoCompleteFlow,
    handleClear,
    setPrintPending,
  ]);

  useEffect(() => {
    if (isOpen && paymentDetails.arId && user) {
      dispatch(
        fetchLastInstallmentAmount({
          user,
          arId: paymentDetails.arId,
        }),
      );
    }
  }, [isOpen, user, paymentDetails.arId, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      resetModalFlow();
      resetAutoCompleteState();
    }
  }, [isOpen, resetAutoCompleteState, resetModalFlow]);

  const handlePaymentConceptChange = (value: string) =>
    dispatch(setPaymentOption({ paymentOption: value }));

  const handleCreditNoteSelect = (
    creditNoteSelections: CreditNoteSelection[],
  ) => {
    dispatch(setCreditNotePayment(creditNoteSelections));
  };

  const handleOpenGeneratedInvoicePreview = useCallback(() => {
    if (!autoCompleteModalState?.invoice) return;
    dispatch(openInvoicePreviewModal(autoCompleteModalState.invoice));
  }, [dispatch, autoCompleteModalState]);

  const runAutoCompletePreorder = useCallback(
    async (
      target: AutoCompleteTarget,
      options?: {
        ncfType?: string | null;
        taxReceiptEnabled?: boolean;
      },
    ) => {
      await triggerAutoCompletePreorder(target, {
        client: resolvedAutoCompleteClient,
        ncfType: options?.ncfType,
        taxReceiptEnabled: options?.taxReceiptEnabled,
      });
    },
    [resolvedAutoCompleteClient, triggerAutoCompletePreorder],
  );

  const handleSelectTaxReceiptFromModal = useCallback(
    (value: string) => {
      dispatch(selectTaxReceiptType(value));
    },
    [dispatch],
  );

  const handleRetryAutoCompleteWithReceipt = useCallback(
    async (receiptType: string) => {
      if (!activeAutoCompleteTarget) return;
      const normalizedReceiptType = receiptType.trim();
      if (!normalizedReceiptType) return;

      setTaxReceiptModalRequested(false);
      resetAutoCompleteState();
      await runAutoCompletePreorder(activeAutoCompleteTarget, {
        ncfType: normalizedReceiptType,
        taxReceiptEnabled: true,
      });
    },
    [
      activeAutoCompleteTarget,
      resetAutoCompleteState,
      runAutoCompletePreorder,
      setTaxReceiptModalRequested,
    ],
  );

  const handleContinueAutoCompleteWithoutReceipt = useCallback(async () => {
    if (!activeAutoCompleteTarget) return;

    setTaxReceiptModalRequested(false);
    resetAutoCompleteState();
    await runAutoCompletePreorder(activeAutoCompleteTarget, {
      ncfType: null,
      taxReceiptEnabled: false,
    });
  }, [
    activeAutoCompleteTarget,
    resetAutoCompleteState,
    runAutoCompletePreorder,
    setTaxReceiptModalRequested,
  ]);

  const handleRetryAutoCompleteWithSelectedReceipt = useCallback(async () => {
    const selectedReceipt = typeof ncfType === 'string' ? ncfType.trim() : '';
    if (!selectedReceipt) {
      notification.warning({
        message: 'Selecciona un comprobante',
        description: 'Debes elegir un comprobante para continuar.',
      });
      return;
    }

    await handleRetryAutoCompleteWithReceipt(selectedReceipt);
  }, [handleRetryAutoCompleteWithReceipt, ncfType]);

  const handleCloseTaxReceiptModal = useCallback(() => {
    handleClear();
  }, [handleClear]);

  const shouldBlockAutoCompleteByTaxReceipt = useCallback(() => {
    if (!taxReceiptEnabled) return false;
    const { depleted } = getTaxReceiptAvailability(taxReceiptData, ncfType);
    return depleted;
  }, [taxReceiptData, ncfType, taxReceiptEnabled]);

  const runAutoCompleteWithTaxReceiptValidation = useCallback(
    async (target: AutoCompleteTarget) => {
      setPendingAutoCompleteTarget(target);

      if (shouldBlockAutoCompleteByTaxReceipt()) {
        setTaxReceiptModalRequested(true);
        return;
      }

      await runAutoCompletePreorder(target);
    },
    [
      runAutoCompletePreorder,
      setPendingAutoCompleteTarget,
      setTaxReceiptModalRequested,
      shouldBlockAutoCompleteByTaxReceipt,
    ],
  );

  const handleSubmitSuccess = useCallback(
    async ({
      autoCompleteTarget,
      shouldAutoComplete,
    }: {
      autoCompleteTarget: AutoCompleteTarget | null;
      shouldAutoComplete: boolean;
    }) => {
      setPendingAutoCompleteFlow(shouldAutoComplete);
      setSubmitted(true);

      if (paymentDetails.printReceipt) {
        setPrintPending(true);
      } else if (!shouldAutoComplete) {
        notification.success({
          message: 'Pago Procesado',
          description: 'Pago registrado con éxito',
        });
        handleClear();
      }

      if (autoCompleteTarget) {
        await runAutoCompleteWithTaxReceiptValidation(autoCompleteTarget);
      }
    },
    [
      handleClear,
      paymentDetails.printReceipt,
      runAutoCompleteWithTaxReceiptValidation,
      setPendingAutoCompleteFlow,
      setPrintPending,
      setSubmitted,
    ],
  );

  const handleSubmitError = useCallback(
    (error: unknown) => {
      resetModalFlow();
      const typedError = error as FormValidationError | Error;

      if (isPaymentFormValidationError(typedError)) {
        console.error('Payment form validation failed:', typedError);
        notification.warning({
          message: 'Campos requeridos',
          description:
            'Por favor complete los campos obligatorios marcados en rojo.',
        });
        return;
      }

      const errorMessage =
        typedError instanceof Error
          ? typedError.message
          : typedError?.message || 'Ocurrió un error desconocido';
      notification.error({
        message: 'Error al procesar el pago',
        description: errorMessage,
      });
    },
    [resetModalFlow],
  );

  const handleSubmit = useCallback(() => {
    setLoading(true);

    void submitPaymentForm({
      form,
      onReceipt: setReceipt,
      paymentDetails,
      user,
    })
      .then(handleSubmitSuccess)
      .catch(handleSubmitError)
      .then(() => {
        setLoading(false);
      });
  }, [
    form,
    handleSubmitError,
    handleSubmitSuccess,
    paymentDetails,
    setLoading,
    setReceipt,
    user,
  ]);

  const paymentOptions = Object.values(PAYMENT_OPTIONS);
  const rawChange =
    (Number(paymentDetails.totalPaid) || 0) -
    (Number(paymentDetails.totalAmount) || 0);
  const change = Math.abs(rawChange) < 0.001 ? 0 : rawChange;
  const modalTitle =
    PAYMENT_SCOPE[
      paymentDetails.paymentScope as keyof typeof PAYMENT_SCOPE
    ] ?? paymentDetails.paymentScope;

  const handlePrintReceiptChange = (checked: boolean) => {
    dispatch(setPaymentDetails({ printReceipt: checked }));
  };

  const handleThirdPartyWithholdingChange = useCallback(
    (
      field: 'retentionDate' | 'itbisWithheld' | 'incomeTaxWithheld',
      value: string | number | null,
    ) => {
      const current = paymentDetails.thirdPartyWithholding ?? {
        retentionDate: '',
        itbisWithheld: 0,
        incomeTaxWithheld: 0,
      };
      const nextValue =
        field === 'retentionDate' ? (typeof value === 'string' ? value : '') : Number(value) || 0;

      dispatch(
        setPaymentDetails({
          thirdPartyWithholding: {
            ...current,
            [field]: nextValue,
          },
        }),
      );
    },
    [dispatch, paymentDetails.thirdPartyWithholding],
  );

  return {
    autoCompleteModalState,
    autoCompleting,
    change,
    client,
    componentToPrintRef,
    extra,
    form,
    handleClear,
    handleCloseTaxReceiptModal,
    handleContinueAutoCompleteWithoutReceipt,
    handleCreditNoteSelect,
    handleOpenGeneratedInvoicePreview,
    handlePaymentConceptChange,
    handlePrintGeneratedInvoice,
    handlePrintReceiptChange,
    handleRetryAutoCompleteWithSelectedReceipt,
    handleSelectTaxReceiptFromModal,
    handleSubmit,
    handleThirdPartyWithholdingChange,
    invoiceToPrintRef,
    isOpen,
    isPrintableReceipt,
    loading,
    modalTitle,
    ncfType,
    paymentDetails,
    paymentOptions,
    receipt,
    resolvedAutoCompleteClient,
    selectedCreditNotes,
    shouldShowAutoCompleteResultModal,
    submitted,
    taxReceiptData,
    taxReceiptModalOpen,
  };
};
