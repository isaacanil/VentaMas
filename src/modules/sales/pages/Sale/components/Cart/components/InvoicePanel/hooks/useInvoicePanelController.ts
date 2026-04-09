import {
  Form,
  Modal as AntdModal,
  message,
  notification,
} from 'antd';
import type { FormInstance } from 'antd';
import { nanoid } from 'nanoid';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';

import { selectAR } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectAppMode } from '@/features/appModes/appModeSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  SelectCartData,
  SelectSettingCart,
  toggleInvoicePanelOpen,
} from '@/features/cart/cartSlice';
import type {
  CartData,
  CartSettings,
  PaymentMethod,
} from '@/features/cart/types';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { selectInsuranceAR } from '@/features/insurance/insuranceAccountsReceivableSlice';
import { selectInsuranceAuthData } from '@/features/insurance/insuranceAuthSlice';
import {
  selectNcfType,
  selectTaxReceipt,
  selectTaxReceiptType,
  unlockTaxReceiptType,
} from '@/features/taxReceipt/taxReceiptSlice';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import useInvoice from '@/services/invoice/useInvoice';
import type { InvoiceData } from '@/types/invoice';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

import type { DocumentCurrencyContext } from '../components/Body/components/DocumentCurrencySelector';
import { handleCancelShipping } from '../handleCancelShipping';
import { useInvoicePanelFormSync } from './useInvoicePanelFormSync';
import { useInvoicePanelPaymentBootstrap } from './useInvoicePanelPaymentBootstrap';
import { processInvoicePrint } from '../utils/processInvoicePrint';
import { submitInvoicePanel } from '../utils/submitInvoicePanel';

type BusinessLike = {
  id?: string | null;
  businessID?: string | null;
  businessId?: string | null;
  [key: string]: unknown;
};

type LoadingState = {
  status: boolean;
  message: string;
};

type InvoicePanelUiState = {
  invoice: InvoiceData | null;
  pendingPrint: boolean;
  submitted: boolean;
  taxReceiptModalOpen: boolean;
  loading: LoadingState;
};

type InvoicePanelUiAction =
  | { type: 'setInvoice'; payload: InvoiceData | null }
  | { type: 'setPendingPrint'; payload: boolean }
  | { type: 'setSubmitted'; payload: boolean }
  | { type: 'setTaxReceiptModalOpen'; payload: boolean }
  | { type: 'setLoading'; payload: LoadingState }
  | { type: 'resetPanelUiState' };

const initialInvoicePanelUiState: InvoicePanelUiState = {
  invoice: null,
  pendingPrint: false,
  submitted: false,
  taxReceiptModalOpen: false,
  loading: {
    status: false,
    message: '',
  },
};

const invoicePanelUiReducer = (
  state: InvoicePanelUiState,
  action: InvoicePanelUiAction,
): InvoicePanelUiState => {
  switch (action.type) {
    case 'setInvoice':
      return { ...state, invoice: action.payload };
    case 'setPendingPrint':
      return { ...state, pendingPrint: action.payload };
    case 'setSubmitted':
      return { ...state, submitted: action.payload };
    case 'setTaxReceiptModalOpen':
      return { ...state, taxReceiptModalOpen: action.payload };
    case 'setLoading':
      return { ...state, loading: action.payload };
    case 'resetPanelUiState':
      return {
        ...state,
        submitted: false,
        taxReceiptModalOpen: false,
      };
    default:
      return state;
  }
};

const resolveReceiptName = (
  receipt: TaxReceiptItem | null | undefined,
): string | null => {
  if (!receipt) return null;
  if (typeof receipt === 'object' && 'data' in receipt) {
    return receipt.data?.name ?? null;
  }
  return receipt.name ?? null;
};

const EMPTY_PAYMENT_METHODS: PaymentMethod[] = [];
const EMPTY_CART_PRODUCTS: Array<{ comment?: string; name?: string }> = [];

export const useInvoicePanelController = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm() as [FormInstance];
  const [uiState, dispatchUi] = useReducer(
    invoicePanelUiReducer,
    initialInvoicePanelUiState,
  );
  const { invoice, pendingPrint, submitted, taxReceiptModalOpen, loading } =
    uiState;

  const [fallbackIdempotencyKey, setFallbackIdempotencyKey] = useReducer(
    () => `gen:${nanoid()}`,
    `gen:${nanoid()}`,
  );

  const { processInvoice: runInvoice } = useInvoice();
  const viewport = useViewportWidth();
  const componentToPrintRef = useRef<HTMLDivElement | null>(null);

  const monetaryContextRef = useRef<DocumentCurrencyContext | null>(null);

  const handleMonetaryContextChange = useCallback(
    (ctx: DocumentCurrencyContext) => {
      monetaryContextRef.current = ctx;
    },
    [],
  );

  const handleInvoicePanel = useCallback(() => {
    dispatch(toggleInvoicePanelOpen(undefined));
  }, [dispatch]);

  const cart = useSelector(SelectCartData) as CartData;
  const cartSettings = useSelector(SelectSettingCart) as CartSettings;
  const invoicePanel = Boolean(cartSettings?.isInvoicePanelOpen);
  const shouldPrintInvoice = Boolean(cartSettings?.printInvoice);

  const billing = cartSettings?.billing;
  const duePeriod = billing?.duePeriod;
  const hasDueDate = billing?.hasDueDate ?? false;

  const user = useSelector(selectUser) as UserIdentity | null;
  const client = useSelector(selectClient) as Record<string, unknown> | null;
  const ncfType = useSelector(selectNcfType) as string | null;
  const accountsReceivable = useSelector(selectAR) as
    | AccountsReceivableDoc
    | Record<string, unknown>;
  const taxReceiptState = useSelector(selectTaxReceipt) as ReturnType<
    typeof selectTaxReceipt
  >;
  const {
    settings: { taxReceiptEnabled },
  } = taxReceiptState;
  const isAddedToReceivables = cart?.isAddedToReceivables;
  const businessFromStore = useSelector(selectBusinessData) as
    | BusinessLike
    | null
    | undefined;
  const business = useMemo<BusinessLike>(
    () => (businessFromStore ?? {}) as BusinessLike,
    [businessFromStore],
  );
  const insuranceEnabled = useInsuranceEnabled();
  const paymentMethods = Array.isArray(cart?.paymentMethod)
    ? cart.paymentMethod
    : EMPTY_PAYMENT_METHODS;

  const isAnyPaymentEnabled = useMemo(
    () => paymentMethods.some((method) => method.status),
    [paymentMethods],
  );
  const change = Number(cart?.change?.value ?? 0);
  const isChangeNegative = change < 0;
  const insuranceAR = useSelector(selectInsuranceAR) as ReturnType<
    typeof selectInsuranceAR
  >;
  const insuranceAuth = useSelector(selectInsuranceAuthData) || null;
  const invoiceType = cartSettings?.billing?.invoiceType ?? '';
  const isTestMode = useSelector(selectAppMode) as boolean;
  const cartProducts = Array.isArray(cart?.products)
    ? cart.products
    : EMPTY_CART_PRODUCTS;
  const invoiceComment = (() => {
    const comments = cartProducts
      .filter((product) => product.comment)
      .map((product) => `${product.name}: ${product.comment}`);
    return comments.length ? comments.join('; ') : null;
  })();
  const taxReceiptOptions = taxReceiptState.data;

  const resolvedBusinessId = useMemo(() => {
    return (
      business?.id ||
      business?.businessID ||
      business?.businessId ||
      user?.businessID ||
      null
    );
  }, [business, user]);

  const idempotencyKey =
    (cart?.id && `cart:${cart.id}`) ||
    (cart?.cartId && `cart:${cart.cartId}`) ||
    (cart?.cartIdRef && `cart:${cart.cartIdRef}`) ||
    fallbackIdempotencyKey;

  const handleAfterPrint = () => {
    dispatchUi({ type: 'setInvoice', payload: null });
    handleCancelShipping({ dispatch, viewport, clearTaxReceipt: true });

    const defaultReceipt =
      taxReceiptOptions?.find(
        (receipt) =>
          resolveReceiptName(receipt)?.toUpperCase() === 'CONSUMIDOR FINAL',
      ) || taxReceiptOptions?.[0];
    const defaultReceiptName = resolveReceiptName(defaultReceipt);
    if (defaultReceiptName) {
      dispatch(selectTaxReceiptType(defaultReceiptName));
    }

    notification.success({
      message: 'Venta Procesada',
      description: 'La venta ha sido procesada con éxito',
      duration: 4,
    });
    dispatchUi({
      type: 'setLoading',
      payload: { status: false, message: '' },
    });
    dispatchUi({ type: 'setSubmitted', payload: true });
    dispatch(unlockTaxReceiptType());
  };

  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
    onAfterPrint: handleAfterPrint,
  });

  const handleSelectTaxReceiptFromModal = useCallback(
    (value?: string) => {
      if (!value) return;
      dispatch(selectTaxReceiptType(value));
    },
    [dispatch],
  );

  const closeTaxReceiptModal = useCallback(() => {
    dispatchUi({ type: 'setTaxReceiptModalOpen', payload: false });
  }, []);

  const setPanelInvoice = useCallback((nextInvoice: InvoiceData | null) => {
    dispatchUi({ type: 'setInvoice', payload: nextInvoice });
  }, []);

  const setPanelLoading = useCallback((nextLoading: LoadingState) => {
    dispatchUi({ type: 'setLoading', payload: nextLoading });
  }, []);

  const setPanelPendingPrint = useCallback((value: boolean) => {
    dispatchUi({ type: 'setPendingPrint', payload: value });
  }, []);

  const setPanelSubmitted = useCallback((value: boolean) => {
    dispatchUi({ type: 'setSubmitted', payload: value });
  }, []);

  const setPanelTaxReceiptModalOpen = useCallback((value: boolean) => {
    dispatchUi({ type: 'setTaxReceiptModalOpen', payload: value });
  }, []);

  useEffect(() => {
    if (!pendingPrint) return;

    const hasProducts =
      Array.isArray(invoice?.products) && invoice.products.length > 0;
    const hasId = Boolean(invoice?.id);

    if (hasProducts || hasId) {
      const timeout = setTimeout(() => {
        handlePrint();
        dispatchUi({ type: 'setPendingPrint', payload: false });
      }, 80);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [invoice, pendingPrint, handlePrint]);

  const showCancelSaleConfirm = () => {
    AntdModal.confirm({
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

  const handleInvoicePrinting = (nextInvoice: InvoiceData) =>
    processInvoicePrint({
      business,
      handleAfterPrint,
      invoice: nextInvoice,
      invoiceType,
      setPendingPrint: setPanelPendingPrint,
    });

  const handleSubmit = async ({
    bypassTaxReceiptOverride = false,
  }: {
    bypassTaxReceiptOverride?: boolean;
  } = {}) => {
    await submitInvoicePanel({
      accountsReceivable,
      business,
      bypassTaxReceiptOverride,
      cart,
      client,
      monetaryContext: monetaryContextRef.current,
      dispatch,
      duePeriod,
      form,
      handleAfterPrint,
      handleInvoicePrinting,
      hasDueDate,
      idempotencyKey,
      insuranceAR,
      insuranceAuth,
      insuranceEnabled,
      invoiceComment,
      isTestMode,
      ncfType,
      resolvedBusinessId,
      runInvoice,
      setInvoice: setPanelInvoice,
      setLoading: setPanelLoading,
      setSubmitted: setPanelSubmitted,
      setTaxReceiptModalOpen: setPanelTaxReceiptModalOpen,
      shouldPrintInvoice,
      taxReceiptData: taxReceiptOptions,
      taxReceiptEnabled,
      user,
    });
  };

  const handleInvoicePanelClosed = useCallback(() => {
    dispatchUi({ type: 'resetPanelUiState' });
    monetaryContextRef.current = null;
    setFallbackIdempotencyKey();
  }, [setFallbackIdempotencyKey]);

  useInvoicePanelFormSync({
    accountsReceivable,
    form,
    invoicePanel,
    onPanelClosed: handleInvoicePanelClosed,
  });

  useInvoicePanelPaymentBootstrap({
    cart,
    dispatch,
    invoicePanel,
    isAddedToReceivables,
    paymentMethods,
  });

  const retryWithTaxReceipt = () => {
    dispatchUi({ type: 'setTaxReceiptModalOpen', payload: false });
    void handleSubmit();
  };

  const continueWithoutTaxReceipt = () => {
    dispatchUi({ type: 'setTaxReceiptModalOpen', payload: false });
    void handleSubmit({ bypassTaxReceiptOverride: true });
  };

  return {
    componentToPrintRef,
    form,
    handleInvoicePanel,
    handleMonetaryContextChange,
    handleSubmit,
    invoice,
    invoicePanel,
    isAddedToReceivables,
    isAnyPaymentEnabled,
    isChangeNegative,
    loading,
    ncfType,
    resolvedBusinessId,
    retryWithTaxReceipt,
    showCancelSaleConfirm,
    submitted,
    taxReceiptModalOpen,
    taxReceiptState,
    closeTaxReceiptModal,
    continueWithoutTaxReceipt,
    handleSelectTaxReceiptFromModal,
  };
};
