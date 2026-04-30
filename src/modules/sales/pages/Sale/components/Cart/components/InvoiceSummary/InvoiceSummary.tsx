import { notification, Spin, message } from 'antd';
import { Button, ButtonGroup, Dropdown, Select, ListBox } from '@heroui/react';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {
  Fragment,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

import { icons } from '@/constants/icons/icons';
import {
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import {
  selectCashRegisterAlertBypass,
} from '@/features/appModes/appModeSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  SelectCartData,
  SelectSettingCart,
  selectCart,
  setCartId,
  setAccountingContext,
  setDocumentCurrency,
  toggleInvoicePanelOpen,
  setCashPaymentToTotal,
  selectProductsWithIndividualDiscounts,
  selectTotalIndividualDiscounts,
  setDiscountAuthorizationContext,
  clearDiscountAuthorizationContext,
} from '@/features/cart/cartSlice';
import {
  selectNcfType,
  selectTaxReceiptEnabled,
} from '@/features/taxReceipt/taxReceiptSlice';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { useAuthorizationModules } from '@/hooks/useAuthorizationModules';
import { useAuthorizationPin } from '@/hooks/useAuthorizationPin';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import useInsuranceFormComplete from '@/hooks/useInsuranceFormComplete';
import type {
  InvoiceBusinessInfo,
  InvoiceData,
  InvoiceProduct,
} from '@/types/invoice';
import { formatPriceByCurrency } from '@/utils/format';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { requiresInvoiceDiscountPinAuthorization } from '@/utils/access/invoiceDiscountAccess';
import { validateInvoiceCart } from '@/utils/invoiceValidation';
import { getTotalDiscount } from '@/utils/pricing';
import { PinAuthorizationModal } from '@/components/modals/PinAuthorizationModal/PinAuthorizationModal';
import { Invoice } from '@/modules/invoice/components/Invoice/components/Invoice/Invoice';
import { handleCancelShipping } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/handleCancelShipping';
import { CashRegisterAlertModal } from '@/modules/sales/pages/Sale/components/modals/CashRegisterAlertModal';
import { usePreorderModal } from '@/modules/sales/pages/Sale/components/usePreorderModal';
import { PreorderModal } from '@/modules/sales/pages/Sale/components/PreorderModal';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber/AnimatedNumber';
import CustomInput from '@/components/ui/Inputs/CustomInput';
import { useDocumentCurrencyConfig } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/DocumentCurrencySelector/useDocumentCurrencyConfig';

import { useInvoiceSummaryUiState } from './hooks/useInvoiceSummaryUiState';
import { useLocalStorageBoolean } from './hooks/useLocalStorageBoolean';

import { Delivery } from './components/Delivery/Delivery';
import { PreorderConfirmation } from './components/Delivery/PreorderConfirmation/PreorderConfirmation';
import WarningPill from './components/WarningPill/WarningPill';
import { resolveAuthorizerName } from './utils/resolveAuthorizerName';
import {
  downloadQuotationAction,
  savePreorderAction,
  updatePreorderAction,
} from './utils/invoiceSummaryActions';
import { triggerPreorderPrint } from './utils/preorderPrint';
import {
  SummaryContainer,
  LineItem,
  DiscountInputContainer,
  AuthorizationNote,
  TotalLine,
  TotalLabel,
  Label,
  CurrencyMenuControl,
  CurrencyMenuLabel,
} from './InvoiceSummary.styles';

import type {
  Authorizer,
  CartSummary,
  DiscountAuthorizationContext,
  InsuranceValidationResult,
  MenuOption,
} from './types';
import type { SupportedDocumentCurrency } from '@/types/products';

const SUMMARY_INPUT_WIDTH = '170px';

const useInvoiceSummaryViewModel = () => {
  const cart = useSelector(selectCart) as CartSummary;
  const user = useSelector(selectUser) as Authorizer | null;
  const [shouldPrintPreorder, setShouldPrintPreorder] = useLocalStorageBoolean(
    'shouldPrintPreorder',
    true,
  );
  const cartData = useSelector(SelectCartData) as unknown as
    | (InvoiceData & { documentCurrency?: SupportedDocumentCurrency })
    | null;
  const insuranceExtra = cartData?.totalInsurance?.value ?? 0;
  const selectedNcfType = useSelector(selectNcfType);
  const isTaxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const authorizationContext = cartData?.authorizationContext as
    | { discount?: DiscountAuthorizationContext | null }
    | null
    | undefined;
  const discountAuthorizationContext = authorizationContext?.discount ?? null;
  const billingSettings = cart?.settings?.billing;
  const rawBusinessData = useSelector(selectBusinessData);
  const business = useMemo(
    () => (rawBusinessData || {}) as InvoiceBusinessInfo,
    [rawBusinessData],
  );
  const {
    enabled: isAccountingPilot,
    config: documentCurrencyConfig,
    loading: documentCurrencyConfigLoading,
  } = useDocumentCurrencyConfig(business?.id ?? null);
  const total = Number(cartData?.totalPurchase?.value ?? 0);
  const subTotal = Number(cartData?.totalPurchaseWithoutTaxes?.value ?? 0);
  const itbis = Number(cartData?.totalTaxes?.value ?? 0);
  const documentCurrency = normalizeSupportedDocumentCurrency(
    cartData?.documentCurrency,
  );
  const hasCartProducts = Array.isArray(cartData?.products)
    ? cartData.products.length > 0
    : false;
  const availableDocumentCurrencies = useMemo<SupportedDocumentCurrency[]>(
    () =>
      isAccountingPilot
        ? documentCurrencyConfig.documentCurrencies
        : [DEFAULT_FUNCTIONAL_CURRENCY, 'USD'],
    [documentCurrencyConfig.documentCurrencies, isAccountingPilot],
  );
  const discountPercent = Number(cartData?.discount?.value ?? 0);
  const preorderPrintRef = useRef<HTMLDivElement | null>(null);
  const discount = getTotalDiscount(subTotal, discountPercent);
  const cartSettings = useSelector(SelectSettingCart) as {
    billing?: BillingSettings;
  };
  const { billing } = cartSettings;
  const { shouldUsePinForModule } = useAuthorizationModules();
  const preorderModalState = usePreorderModal();
  const { openModal: openPreorderModal } = preorderModalState;

  // Nuevos selectores para descuentos individuales
  const productsWithIndividualDiscounts = useSelector(
    selectProductsWithIndividualDiscounts,
  ) as InvoiceProduct[];
  const totalIndividualDiscounts = useSelector(
    selectTotalIndividualDiscounts,
  ) as number;
  const hasIndividualDiscounts = productsWithIndividualDiscounts.length > 0;

  const dispatch = useDispatch<any>();
  const insuranceEnabled = useInsuranceEnabled();
  const { shouldDisableButton: insuranceFormIncomplete } =
    useInsuranceFormComplete();
  const isDeveloperUser = hasDeveloperAccess(user);
  const requiresDiscountPinByRole = requiresInvoiceDiscountPinAuthorization(user);
  // Solo requiere PIN si el módulo de facturación está activo y es cajero
  const shouldRequirePinForDiscount =
    shouldUsePinForModule('invoices') && requiresDiscountPinByRole;
  const cashRegisterAlertBypass = useSelector(
    selectCashRegisterAlertBypass,
  ) as boolean;
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreorderRoute = searchParams.get('mode') === 'preorder';
  const isPreorderCart = cartData?.type === 'preorder';
  const isEditingPreorder = isPreorderRoute && isPreorderCart;
  const defaultMode = billing?.billingMode === 'deferred' ? 'preorder' : 'sale';
  const {
    isOpenPreorderConfirmation,
    preorderConfirmationAction,
    isLoadingQuotation,
    isSavingPreorder,
    preorderPrintData,
    pendingPreorderPrint,
    cashRegisterAlertRequest,
    bypassGeneration,
    openPreorderConfirmation,
    closePreorderConfirmation,
    setQuotationLoading,
    setPreorderSaving,
    setPreorderPrintData,
    setPendingPreorderPrint,
    requestCashRegisterAlert,
    clearCashRegisterAlert,
  } = useInvoiceSummaryUiState(cashRegisterAlertBypass);
  const discountAuthorizer = shouldRequirePinForDiscount
    ? discountAuthorizationContext?.authorizer || null
    : null;
  const isDiscountAuthorized =
    !shouldRequirePinForDiscount || Boolean(discountAuthorizationContext);
  const authorizedByName = discountAuthorizer
    ? resolveAuthorizerName(discountAuthorizer)
    : '';

  const updateMode = useCallback(
    (
      modeValue?: string | null,
      { preorderId }: { preorderId?: string | null } = {},
    ) => {
      const params = new URLSearchParams(searchParams);

      if (modeValue) {
        params.set('mode', modeValue);
      } else {
        params.delete('mode');
      }

      if (preorderId) {
        params.set('preorderId', preorderId);
      } else {
        params.delete('preorderId');
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const activateSaleMode = useCallback(() => {
    updateMode(defaultMode);
  }, [defaultMode, updateMode]);

  const activatePreorderMode = useCallback(() => {
    updateMode('preorder');
  }, [updateMode]);

  const {
    showModal: showDiscountPinModal,
    modalProps: discountPinModalProps,
    isModalOpen: isDiscountPinModalOpen,
  } = useAuthorizationPin({
    onAuthorized: (authorizer: Authorizer) => {
      const authorizedAt = new Date().toISOString();
      const cartId = cartData?.id || cart?.id || '';
      const clientId = cartData?.client?.id || cart?.client?.id || '';
      const clientName = cartData?.client?.name || cart?.client?.name || '';

      const requesterSnapshot = {
        uid: user?.uid || '',
        name: resolveAuthorizerName(user),
        role: user?.role || '',
        email: user?.email || '',
      };

      dispatch(
        setDiscountAuthorizationContext({
          module: 'invoices',
          action: 'invoice-discount-override',
          description: 'Autorización para aplicar descuentos en facturación.',
          authorizer,
          requestedBy: requesterSnapshot,
          targetUser: requesterSnapshot,
          metadata: {
            cartId,
            clientId,
            clientName,
            total: cartData?.totalPurchase?.value ?? null,
            discountPercent: cartData?.discount?.value ?? null,
            hasIndividualDiscounts,
            authorizedAt,
          },
        }),
      );

      message.success(
        `Descuento autorizado por ${resolveAuthorizerName(authorizer)}`,
      );
    },
    module: 'invoices',
    allowedRoles: ['admin', 'owner', 'manager', 'dev'],
    description:
      'Se requiere autorización con PIN para aplicar descuentos en facturas.',
    reasonList: ['Aplicar o modificar descuentos en la factura.'],
    allowPasswordFallback: false,
  });

  useEffect(() => {
    if (shouldRequirePinForDiscount || !discountAuthorizationContext) return;
    dispatch(clearDiscountAuthorizationContext(null));
  }, [shouldRequirePinForDiscount, discountAuthorizationContext, dispatch]);

  const validateInsuranceCoverage = useMemo<InsuranceValidationResult>(() => {
    if (!insuranceEnabled) return { isValid: true, message: null };
    const products = (cartData?.products || []) as InvoiceProduct[];

    const productsWithCoverage = products.filter((product) => {
      const insurance = product?.insurance || {};
      return insurance.mode && (insurance.value ?? 0) > 0;
    });

    if (productsWithCoverage.length === 0) {
      return {
        isValid: false,
        message:
          'Al menos un producto debe tener cobertura de seguro configurada',
      };
    }

    const medicineCategories = [
      'medicamento',
      'medicina',
      'farmacia',
      'recetado',
    ];
    const productsThatShouldHaveInsurance = products.filter((product) => {
      const category =
        typeof product?.category === 'string' ? product.category : '';
      const categoryMatch = medicineCategories.some((cat) =>
        category.toLowerCase().includes(cat),
      );

      const isMarkedForInsurance = product?.requiresInsurance === true;

      return categoryMatch || isMarkedForInsurance;
    });

    // De los productos que deberían tener seguro, verificar cuáles no tienen configuración adecuada
    const invalidProducts = productsThatShouldHaveInsurance.filter(
      (product) => {
        const insurance = product?.insurance || {};
        return !insurance.mode || (insurance.value ?? 0) <= 0;
      },
    );

    if (invalidProducts.length > 0) {
      const productNames = invalidProducts
        .map((p) => p.productName || 'Producto sin nombre')
        .join(', ');
      return {
        isValid: false,
        message: `Los siguientes productos requieren configuración de seguro: ${productNames}`,
        invalidProducts,
      };
    }

    const productsWithInvalidCoverage = products.filter((product) => {
      const insurance = product?.insurance || {};
      const price = product?.pricing?.price ?? 0;

      const rules = [
        () => !insurance.mode,
        () => (insurance.value ?? 0) <= 0,
        () =>
          insurance.mode === 'porcentaje' &&
          ((insurance.value ?? 0) < 1 || (insurance.value ?? 0) > 100),
        () => insurance.mode === 'monto' && (insurance.value ?? 0) > price,
      ];

      return rules.some((rule: () => boolean) => rule());
    });

    if (productsWithInvalidCoverage.length > 0) {
      const productNames = productsWithInvalidCoverage
        .map((p) => p.productName || 'Producto sin nombre')
        .join(', ');
      return {
        isValid: false,
        message: `Valor de cobertura inválido en: ${productNames}`,
        invalidProducts: productsWithInvalidCoverage,
      };
    }

    return { isValid: true, message: null };
  }, [cartData?.products, insuranceEnabled]);

  const cartValidation = useMemo(
    () => validateInvoiceCart(cartData),
    [cartData],
  );
  const isCartValid = cartValidation.isValid;

  const { status: cashRegisterStatus } = useIsOpenCashReconciliation() as {
    status?: string;
  }; // Status check
  const shouldBypassCashRegisterBlocking = cashRegisterAlertBypass;
  const isCashRegisterBlocked =
    !shouldBypassCashRegisterBlocking &&
    cashRegisterStatus !== 'open' &&
    cashRegisterStatus !== 'loading' &&
    typeof cashRegisterStatus === 'string';
  const isCashRegisterModalOpen =
    isCashRegisterBlocked &&
    cashRegisterAlertRequest?.status === cashRegisterStatus &&
    cashRegisterAlertRequest?.bypassGeneration === bypassGeneration;

  const handleInvoicePanelOpen = () => {
    if (isCashRegisterBlocked && cashRegisterStatus) {
      requestCashRegisterAlert(cashRegisterStatus);
      return;
    }

    if (cartValidation.isValid) {
      dispatch(setCashPaymentToTotal(null));
      if (!cart?.settings?.isInvoicePanelOpen) {
        dispatch(toggleInvoicePanelOpen(undefined));
      }
      dispatch(setCartId(null));
    } else {
      notification.error({
        description: cartValidation.message,
      });
    }
  };

  const handleDiscountAccess = useCallback(() => {
    if (!shouldRequirePinForDiscount || isDiscountAuthorized) {
      return true;
    }
    if (!isDiscountPinModalOpen) {
      showDiscountPinModal();
    }
    return false;
  }, [
    shouldRequirePinForDiscount,
    isDiscountAuthorized,
    isDiscountPinModalOpen,
    showDiscountPinModal,
  ]);

  const handlePreorderPrint = useReactToPrint({
    contentRef: preorderPrintRef,
  });

  const handleTriggerPreorderPrint = useCallback(
    (source: InvoiceData) =>
      triggerPreorderPrint({
        business,
        invoiceType: billing?.invoiceType,
        setPendingPreorderPrint,
        setPreorderPrintData,
        source,
      }),
    [business, billing?.invoiceType, setPendingPreorderPrint, setPreorderPrintData],
  );

  useEffect(() => {
    if (!pendingPreorderPrint) return;
    if (!preorderPrintData) return;

    const hasProducts =
      Array.isArray(preorderPrintData?.products) &&
      preorderPrintData.products.length > 0;
    const hasId = !!preorderPrintData?.id;

    if (hasProducts || hasId) {
      const timeout = setTimeout(() => {
        handlePreorderPrint();
        setPendingPreorderPrint(false);
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [
    handlePreorderPrint,
    pendingPreorderPrint,
    preorderPrintData,
    setPendingPreorderPrint,
  ]);

  const handleDownloadQuotation = async () => {
    await downloadQuotationAction({
      billingSettings,
      business,
      cartData,
      dispatch,
      isDeveloperUser,
      setQuotationLoading,
      user,
    });
  };

  const handleSavePreOrder = useCallback(
    async ({
      shouldPrint = false,
    }: {
      shouldPrint?: boolean;
    } = {}) => {
      await savePreorderAction({
        activateSaleMode,
        cartData,
        closePreorderConfirmation,
        dispatch,
        isSavingPreorder,
        isTaxReceiptEnabled,
        selectedNcfType,
        setPreorderSaving,
        shouldPrint,
        triggerPreorderPrint: handleTriggerPreorderPrint,
        user,
      });
    },
    [
      activateSaleMode,
      cartData,
      closePreorderConfirmation,
      dispatch,
      handleTriggerPreorderPrint,
      isSavingPreorder,
      isTaxReceiptEnabled,
      selectedNcfType,
      setPreorderSaving,
      user,
    ],
  );

  const handleUpdatePreOrder = useCallback(
    async ({
      shouldPrint = false,
    }: {
      shouldPrint?: boolean;
    } = {}) => {
      await updatePreorderAction({
        activateSaleMode,
        cartData,
        closePreorderConfirmation,
        dispatch,
        isSavingPreorder,
        isTaxReceiptEnabled,
        selectedNcfType,
        setPreorderSaving,
        shouldPrint,
        triggerPreorderPrint: handleTriggerPreorderPrint,
        user,
      });
    },
    [
      activateSaleMode,
      cartData,
      closePreorderConfirmation,
      dispatch,
      handleTriggerPreorderPrint,
      isSavingPreorder,
      isTaxReceiptEnabled,
      selectedNcfType,
      setPreorderSaving,
      user,
    ],
  );

  const handlePreorderConfirmation = useCallback(() => {
    if (preorderConfirmationAction === 'update') {
      void handleUpdatePreOrder({ shouldPrint: shouldPrintPreorder });
      return;
    }
    void handleSavePreOrder({ shouldPrint: shouldPrintPreorder });
  }, [
    handleSavePreOrder,
    handleUpdatePreOrder,
    preorderConfirmationAction,
    shouldPrintPreorder,
  ]);

  const handleClosePreorderConfirmation = useCallback(() => {
    if (isSavingPreorder) return;
    closePreorderConfirmation();
    if (preorderConfirmationAction === 'complete') {
      activateSaleMode();
    }
  }, [
    activateSaleMode,
    closePreorderConfirmation,
    isSavingPreorder,
    preorderConfirmationAction,
  ]);

  // Calculamos si el botón debe estar deshabilitado combinando las validaciones
  const isButtonDisabled =
    !isCartValid ||
    insuranceFormIncomplete ||
    !validateInsuranceCoverage.isValid ||
    isSavingPreorder;

  // Mensaje de advertencia que incluye ambas validaciones con información más detallada
  const warningMessage = useMemo(() => {
    if (!isCartValid) {
      return cartValidation.message;
    }
    if (insuranceFormIncomplete) {
      return 'Complete todos los datos del formulario de autorización de seguro para continuar.';
    }
    if (!validateInsuranceCoverage.isValid) {
      return validateInsuranceCoverage.message;
    }
    return null;
  }, [
    cartValidation.message,
    insuranceFormIncomplete,
    isCartValid,
    validateInsuranceCoverage,
  ]);

  const billingButtons: Record<
    string,
    { text: string; action?: () => void; disabled: boolean }
  > = {
    direct: {
      text: 'Facturar',
      action: handleInvoicePanelOpen,
      disabled: isButtonDisabled,
    },
    deferred: isEditingPreorder
      ? {
          text: isSavingPreorder ? 'Actualizando...' : 'Actualizar',
          action: () => openPreorderConfirmation('update'),
          disabled: isButtonDisabled,
        }
      : {
          text: 'Preventa',
          action: () => {
            activatePreorderMode();
            openPreorderConfirmation('complete');
          },
          disabled: isButtonDisabled,
        },
    default: {
      text: 'Sin accion',
      action: undefined,
      disabled: true,
    },
  };

  const { text, action, disabled } =
    billingButtons[billing?.billingMode ?? 'default'] || billingButtons.default;

  const tooltipTitle = useMemo(() => {
    if (isSavingPreorder) {
      return 'Guardando preventa...';
    }
    if (disabled) {
      return warningMessage;
    }
    switch (text) {
      case 'Facturar':
        return 'Proceder a facturar';
      case 'Completar preventa':
        return 'Completar la preventa';
      case 'Actualizar':
        return 'Guardar cambios de la preventa';
      case 'Actualizando...':
        return 'Guardando cambios de la preventa';
      case 'Preventa':
        return 'Guardar como preventa';
      default:
        return '';
    }
  }, [disabled, warningMessage, text, isSavingPreorder]);

  const handleCurrencyChange = useCallback(
    (key: React.Key) => {
      dispatch(setDocumentCurrency(key as SupportedDocumentCurrency));
    },
    [dispatch],
  );

  const menuOptions = [
    isEditingPreorder && {
      text: 'Completar preventa',
      action: handleInvoicePanelOpen,
      icon: icons.operationModes.accept,
      disabled: isButtonDisabled,
      theme: {
        background: '#f6ffed',
        backgroundHover: '#d9f7be',
        color: '#389e0d',
        colorHover: '#237804',
        iconColor: '#389e0d',
      },
    },
    billingSettings?.quoteEnabled && {
      text: isLoadingQuotation ? 'Cargando...' : 'Cotización',
      action: handleDownloadQuotation,
      icon: isLoadingQuotation ? <Spin size="small" /> : icons.quotation.quote,
      disabled: isButtonDisabled || isLoadingQuotation,
    },
    billing?.billingMode === 'deferred' && {
      text: 'Cargar Preventa',
      action: openPreorderModal,
      icon: icons.finances.fileInvoiceDollar,
      disabled: false, // Siempre habilitado - no requiere elementos en el carrito
    },
    {
      text: 'Cancelar venta',
      variant: 'danger' as const,
      action: () => {
        activateSaleMode();
        handleCancelShipping({
          dispatch: dispatch as any,
          closeInvoicePanel: false,
        });
      },
      icon: icons.operationModes.close,
      disabled: false, // Siempre habilitado
      theme: {
        background: '#ffe6e6',
        backgroundHover: '#ffd4d4',
        color: '#d32f2f',
        colorHover: '#b71c1c',
        iconColor: '#d32f2f',
      },
    },
  ].filter(Boolean) as MenuOption[];

  useEffect(() => {
    if (!isAccountingPilot || documentCurrencyConfigLoading) return;

    dispatch(
      setAccountingContext({
        functionalCurrency: documentCurrencyConfig.functionalCurrency,
        manualRatesByCurrency: documentCurrencyConfig.manualRatesByCurrency,
      }),
    );
  }, [
    dispatch,
    documentCurrencyConfig.functionalCurrency,
    documentCurrencyConfig.manualRatesByCurrency,
    documentCurrencyConfigLoading,
    isAccountingPilot,
  ]);

  return {
    action,
    authorizedByName,
    billingInvoiceType: billing?.invoiceType ?? null,
    cartData,
    cashRegisterStatus,
    clearCashRegisterAlert,
    discount,
    discountPercent,
    disabled,
    documentCurrency,
    discountPinModalProps,
    handleClosePreorderConfirmation,
    handleDiscountAccess,
    handlePreorderConfirmation,
    insuranceEnabled,
    insuranceExtra,
    isCashRegisterModalOpen,
    isLoadingQuotation,
    isOpenPreorderConfirmation,
    isSavingPreorder,
    isDiscountAuthorized,
    itbis,
    hasIndividualDiscounts,
    menuOptions,
    preorderConfirmationAction,
    preorderModalState,
    preorderPrintData,
    preorderPrintRef,
    setShouldPrintPreorder,
    shouldPrintPreorder,
    shouldRequirePinForDiscount,
    subTotal,
    text,
    tooltipTitle,
    total,
    totalIndividualDiscounts,
    warningMessage,
    availableDocumentCurrencies,
    handleCurrencyChange,
    hasCartProducts,
  };
};

const InvoiceSummary = () => {
  const {
    action,
    authorizedByName,
    billingInvoiceType,
    cartData,
    cashRegisterStatus,
    clearCashRegisterAlert,
    discount,
    discountPercent,
    disabled,
    documentCurrency,
    discountPinModalProps,
    handleClosePreorderConfirmation,
    handleDiscountAccess,
    handlePreorderConfirmation,
    insuranceEnabled,
    insuranceExtra,
    isCashRegisterModalOpen,
    isLoadingQuotation,
    isOpenPreorderConfirmation,
    isSavingPreorder,
    isDiscountAuthorized,
    itbis,
    hasIndividualDiscounts,
    menuOptions,
    preorderConfirmationAction,
    preorderModalState,
    preorderPrintData,
    preorderPrintRef,
    setShouldPrintPreorder,
    shouldPrintPreorder,
    shouldRequirePinForDiscount,
    subTotal,
    text,
    tooltipTitle,
    total,
    totalIndividualDiscounts,
    warningMessage,
    availableDocumentCurrencies,
    handleCurrencyChange,
    hasCartProducts,
  } = useInvoiceSummaryViewModel();

  return (
    <Fragment>
      <PreorderModal
        {...preorderModalState}
        onRetry={preorderModalState.handleRetry}
        onSelect={preorderModalState.setUserSelectedKey}
        onClose={preorderModalState.closeModal}
      />
      {preorderPrintData && (
        <div
          style={{ position: 'absolute', top: -9999, left: -9999 }}
          aria-hidden="true"
        >
          <Invoice
            ref={preorderPrintRef}
            data={preorderPrintData}
            template={billingInvoiceType || undefined}
            ignoreHidden
          />
        </div>
      )}
      {isLoadingQuotation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgb(255 255 255 / 70%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin tip="Cargando cotización..." size="large">
            <div style={{ width: 160, height: 140 }} />
          </Spin>
        </div>
      )}
      <SummaryContainer>
        <LineItem>
          <Label>SubTotal:</Label>
          <Label>{formatPriceByCurrency(subTotal, documentCurrency)}</Label>
        </LineItem>
        <LineItem>
          <Label>ITBIS:</Label>
          <Label>{formatPriceByCurrency(itbis, documentCurrency)}</Label>
        </LineItem>
        <Delivery inputWidth={SUMMARY_INPUT_WIDTH} />
        <LineItem>
          <Label>Descuento:</Label>
          {hasIndividualDiscounts ? (
            <Label style={{ color: '#52c41a', fontWeight: 600 }}>
              -{formatPriceByCurrency(totalIndividualDiscounts, documentCurrency)}
            </Label>
          ) : (
            <DiscountInputContainer>
              <CustomInput
                discount={discount}
                value={discountPercent}
                options={[10, 20, 30, 40, 50]}
                disabled={hasIndividualDiscounts}
                onRequestAccess={handleDiscountAccess}
                width={SUMMARY_INPUT_WIDTH}
              />
              {shouldRequirePinForDiscount && !isDiscountAuthorized && (
                <AuthorizationNote $tone="warning">
                  Requiere autorización con PIN
                </AuthorizationNote>
              )}
              {shouldRequirePinForDiscount &&
                isDiscountAuthorized &&
                authorizedByName && (
                  <AuthorizationNote>
                    Autorizado por {authorizedByName}
                  </AuthorizationNote>
                )}
            </DiscountInputContainer>
          )}
        </LineItem>
        {insuranceEnabled && (
          <LineItem>
            <Label>Cobertura:</Label>
            <Label>{formatPriceByCurrency(insuranceExtra, documentCurrency)}</Label>
          </LineItem>
        )}
        {warningMessage && <WarningPill message={warningMessage} />}
        <TotalLine>
          <ButtonGroup isDisabled={isSavingPreorder}>
            <Button
              variant="primary"
              isDisabled={disabled}
              onPress={action}
            >
              {text}
            </Button>
            <Dropdown>
              <Button variant="primary" isIconOnly aria-label="Más opciones">
                <ButtonGroup.Separator />
                <FontAwesomeIcon icon={faChevronDown} />
              </Button>
              <Dropdown.Popover placement="top end">
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === 'document-currency') return;
                    const opt = menuOptions.find((o) => o.text === key);
                    opt?.action();
                  }}
                >
                  <Dropdown.Item
                    key="document-currency"
                    id="document-currency"
                    textValue="Moneda del documento"
                  >
                    <CurrencyMenuControl
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <CurrencyMenuLabel>Moneda</CurrencyMenuLabel>
                      <Select
                        selectedKey={documentCurrency}
                        onSelectionChange={handleCurrencyChange}
                        isDisabled={hasCartProducts}
                        aria-label="Moneda del documento"
                      >
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {availableDocumentCurrencies.map((currency) => (
                              <ListBox.Item
                                key={currency}
                                id={currency}
                                textValue={currency}
                              >
                                {currency}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </CurrencyMenuControl>
                  </Dropdown.Item>
                  {menuOptions.map((option) => (
                    <Dropdown.Item
                      key={option.text}
                      id={option.text}
                      textValue={option.text}
                      isDisabled={option.disabled}
                      variant={option.variant ?? 'default'}
                    >
                      <span data-slot="label" className="flex items-center gap-2">
                        {option.icon}
                        {option.text}
                      </span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </ButtonGroup>
          <TotalLabel>
            <AnimatedNumber value={formatPriceByCurrency(total, documentCurrency)} />
          </TotalLabel>
        </TotalLine>
      </SummaryContainer>
      <PinAuthorizationModal {...discountPinModalProps} />
      <PreorderConfirmation
        open={isOpenPreorderConfirmation}
        actionType={preorderConfirmationAction}
        onCancel={handleClosePreorderConfirmation}
        onConfirm={handlePreorderConfirmation}
        shouldPrint={shouldPrintPreorder}
        onTogglePrint={setShouldPrintPreorder}
        preorder={{ data: cartData }}
        loading={isSavingPreorder}
      />
      <CashRegisterAlertModal
        open={isCashRegisterModalOpen}
        onClose={clearCashRegisterAlert}
        status={cashRegisterStatus}
      />
    </Fragment>
  );
};

export default InvoiceSummary;
