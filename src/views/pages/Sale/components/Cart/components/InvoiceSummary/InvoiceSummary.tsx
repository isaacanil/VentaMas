// @ts-nocheck
import { notification, Modal, Spin, message, Tooltip } from 'antd';
import React, {
  Fragment,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

import { icons } from '@/constants/icons/icons';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  SelectCartData,
  SelectSettingCart,
  selectCart,
  setCartId,
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
import { fbAddPreOrder } from '@/firebase/invoices/fbAddPreocer';
import { fbUpdatePreOrder } from '@/firebase/invoices/fbUpdatePreorder';
import { downloadQuotationPdf } from '@/firebase/quotation/downloadQuotationPDF';
import { addQuotation } from '@/firebase/quotation/quotationService';
import { useAuthorizationModules } from '@/hooks/useAuthorizationModules';
import { useAuthorizationPin } from '@/hooks/useAuthorizationPin';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import useInsuranceFormComplete from '@/hooks/useInsuranceFormComplete';
import { formatPrice } from '@/utils/format';
import { validateInvoiceCart } from '@/utils/invoiceValidation';
import { getTotalDiscount } from '@/utils/pricing';
import { PinAuthorizationModal } from '@/views/component/modals/PinAuthorizationModal/PinAuthorizationModal';
import { Quotation } from '@/views/component/Quotation/components/Quotation/Quotation';
import { handleCancelShipping } from '@/views/pages/Sale/components/Cart/components/InvoicePanel/handleCancelShipping';
import { CashRegisterAlertModal } from '@/views/pages/Sale/components/modals/CashRegisterAlertModal';
import { usePreorderModal } from '@/views/pages/Sale/components/usePreorderModal';
import { AnimatedNumber } from '@/views/templates/system/AnimatedNumber/AnimatedNumber';
import CustomInput from '@/views/templates/system/Inputs/CustomInput';

import { ActionMenu } from './components/ActionMenu/Actionmenu';
import { Delivery } from './components/Delivery/Delivery';
import { PreorderConfirmation } from './components/Delivery/PreorderConfirmation/PreorderConfirmation';
import WarningPill from './components/WarningPill/WarningPill';
import {
  SummaryContainer,
  LineItem,
  DiscountInputContainer,
  AuthorizationNote,
  TotalLine,
  TotalLabel,
  Label,
  ActionButton,
} from './InvoiceSummary.styles';


const resolveAuthorizerName = (authorizer) =>
  authorizer?.displayName ||
  authorizer?.name ||
  authorizer?.username ||
  authorizer?.email ||
  authorizer?.uid ||
  'usuario autorizado';

const SUMMARY_INPUT_WIDTH = '170px';

const InvoiceSummary = () => {
  const [isCartValid, setIsCartValid] = useState(false);
  const cart = useSelector(selectCart);
  const user = useSelector(selectUser);
  const [isOpenPreorderConfirmation, setIsOpenPreorderConfirmation] =
    useState(false);
  const cartData = useSelector(SelectCartData);
  const insuranceExtra = cartData?.totalInsurance?.value || 0;
  const selectedNcfType = useSelector(selectNcfType);
  const isTaxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const discountAuthorizationContext =
    cartData?.authorizationContext?.discount || null;
  const billingSettings = cart?.settings?.billing;
  const business = useSelector(selectBusinessData) || {};
  const total = cartData?.totalPurchase?.value;
  const subTotal = cartData?.totalPurchaseWithoutTaxes?.value;
  const itbis = cartData.totalTaxes.value;
  const discountPercent = cartData.discount.value;
  const quotationPrintRef = useRef(null);
  const [quotationData, _setQuotationData] = useState();
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [isSavingPreorder, setIsSavingPreorder] = useState(false);
  const discount = getTotalDiscount(subTotal, discountPercent);
  const { billing } = useSelector(SelectSettingCart);
  const { shouldUsePinForModule } = useAuthorizationModules();
  const { openModal: openPreorderModal, Modal: PreorderModal } =
    usePreorderModal();

  // Nuevos selectores para descuentos individuales
  const productsWithIndividualDiscounts = useSelector(
    selectProductsWithIndividualDiscounts,
  );
  const totalIndividualDiscounts = useSelector(selectTotalIndividualDiscounts);
  const hasIndividualDiscounts = productsWithIndividualDiscounts.length > 0;

  const dispatch = useDispatch();
  const insuranceEnabled = useInsuranceEnabled();
  const { shouldDisableButton: insuranceFormIncomplete } =
    useInsuranceFormComplete();
  const isCashier = user?.role === 'cashier';
  // Solo requiere PIN si el módulo de facturación está activo y es cajero
  const shouldRequirePinForDiscount =
    shouldUsePinForModule('invoices') && isCashier;
  const [isDiscountAuthorized, setIsDiscountAuthorized] = useState(
    !shouldRequirePinForDiscount,
  );
  const [discountAuthorizer, setDiscountAuthorizer] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreorderRoute = searchParams.get('mode') === 'preorder';
  const isPreorderCart = cartData?.type === 'preorder';
  const isEditingPreorder = isPreorderRoute && isPreorderCart;
  const defaultMode = billing?.billingMode === 'deferred' ? 'preorder' : 'sale';

  const updateMode = useCallback(
    (modeValue, { preorderId } = {}) => {
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
    onAuthorized: (authorizer) => {
      setIsDiscountAuthorized(true);
      setDiscountAuthorizer(authorizer);

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

  const authorizedByName = useMemo(
    () => (discountAuthorizer ? resolveAuthorizerName(discountAuthorizer) : ''),
    [discountAuthorizer],
  );

  useEffect(() => {
    if (!shouldRequirePinForDiscount) {
      setIsDiscountAuthorized(true);
      setDiscountAuthorizer(null);
      dispatch(clearDiscountAuthorizationContext());
      return;
    }

    if (discountAuthorizationContext) {
      setIsDiscountAuthorized(true);
      setDiscountAuthorizer(discountAuthorizationContext.authorizer || null);
    } else {
      setIsDiscountAuthorized(false);
      setDiscountAuthorizer(null);
    }
  }, [shouldRequirePinForDiscount, discountAuthorizationContext, dispatch]);

  const validateInsuranceCoverage = useMemo(() => {
    if (!insuranceEnabled) return { isValid: true, message: null };
    const products = cartData?.products || [];

    const productsWithCoverage = products.filter((product) => {
      const insurance = product?.insurance || {};
      return insurance.mode && insurance.value > 0;
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
      const categoryMatch =
        product?.category &&
        medicineCategories.some((cat) =>
          product.category.toLowerCase().includes(cat),
        );

      const isMarkedForInsurance = product?.requiresInsurance === true;

      return categoryMatch || isMarkedForInsurance;
    });

    // De los productos que deberían tener seguro, verificar cuáles no tienen configuración adecuada
    const invalidProducts = productsThatShouldHaveInsurance.filter(
      (product) => {
        const insurance = product?.insurance || {};
        return !insurance.mode || insurance.value <= 0;
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
        () => insurance.value <= 0,
        () =>
          insurance.mode === 'porcentaje' &&
          (insurance.value < 1 || insurance.value > 100),
        () => insurance.mode === 'monto' && insurance.value > price,
      ];

      return rules.some((rule) => rule());
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

  useEffect(() => {
    const { isValid } = validateInvoiceCart(cartData);
    setIsCartValid(isValid);
  }, [cartData]);

  const { status: cashRegisterStatus } = useIsOpenCashReconciliation(); // Status check
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  const handleInvoicePanelOpen = () => {
    if (cashRegisterStatus !== 'open' && typeof cashRegisterStatus === 'string') {
      setIsCashRegisterModalOpen(true);
      return;
    }

    const { isValid, message } = validateInvoiceCart(cartData);
    if (isValid) {
      dispatch(setCashPaymentToTotal());
      if (!cart?.settings?.isInvoicePanelOpen) {
        dispatch(toggleInvoicePanelOpen());
      }
      dispatch(setCartId());
    } else {
      notification.error({
        description: message,
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

  const _handlePrint = useReactToPrint({
    contentRef: quotationPrintRef,
    onAfterPrint: () => {
      Modal.confirm({
        title: '¿Limpiar cotización?',
        content: '¿Desea limpiar los datos de la cotización?',
        okText: 'Limpiar',
        cancelText: 'Mantener',
        onOk: () => {
          handleCancelShipping({ dispatch, closeInvoicePanel: false });
          notification.success({
            message: 'Cotización eliminada',
            description: 'Los datos de la cotización han sido eliminados.',
            duration: 4,
          });
        },
        onCancel: () => {
          notification.success({
            message: 'Cotización conservada',
            description: 'Los datos de la cotización se han mantenido.',
            duration: 4,
          });
        },
      });
    },
  });

  function showCleanQuotationModal() {
    Modal.confirm({
      title: '¿Limpiar cotización?',
      content: '¿Desea limpiar los datos de la cotización?',
      okText: 'Limpiar',
      cancelText: 'Mantener',
      onOk: () => {
        handleCancelShipping({ dispatch, closeInvoicePanel: false });
        message.success('Se han restablecido los datos');
      },
      onCancel: () => {
        message.success('Se han mantenido los datos de la cotización');
      },
    });
  }

  async function handleDownloadQuotation() {
    try {
      setIsLoadingQuotation(true);

      const data = await addQuotation(user, cartData, billingSettings);

      await downloadQuotationPdf(business, data, showCleanQuotationModal);
    } catch (error) {
      console.error('Error al descargar la cotización:', error);
    } finally {
      setIsLoadingQuotation(false);
    }
  }

  const handleSavePreOrder = async () => {
    if (isSavingPreorder) return;

    const { isValid, message: validationMessage } =
      validateInvoiceCart(cartData);

    if (!isValid) {
      notification.warning({
        message: 'No se puede completar la preorden',
        description:
          validationMessage ||
          'Verifica los datos del carrito antes de continuar.',
      });
      return;
    }

    try {
      setIsSavingPreorder(true);

      const preorderPayload = buildPreorderPayload() || cartData;
      await fbAddPreOrder(user, preorderPayload);
      handleCancelShipping({ dispatch, closeInvoicePanel: false });
      setIsOpenPreorderConfirmation(false);
      activateSaleMode();
      notification.success({
        message: 'Preorden guardada con éxito',
        type: 'success',
      });
    } catch (error) {
      console.error('Error al guardar la preorden:', error);
      notification.error({
        message: 'No se pudo guardar la preorden',
        description: error?.message || 'Intenta nuevamente en unos segundos.',
      });
    } finally {
      setIsSavingPreorder(false);
    }
  };

  const handleUpdatePreOrder = async () => {
    if (isSavingPreorder) return;

    const { isValid, message: validationMessage } =
      validateInvoiceCart(cartData);

    if (!isValid) {
      notification.warning({
        message: 'No se puede actualizar la preventa',
        description:
          validationMessage ||
          'Verifica los datos del carrito antes de continuar.',
      });
      return;
    }

    try {
      setIsSavingPreorder(true);

      const preorderPayload = buildPreorderPayload() || cartData;
      await fbUpdatePreOrder(user, preorderPayload);

      handleCancelShipping({ dispatch, closeInvoicePanel: false });
      activateSaleMode();

      notification.success({
        message: 'Preventa actualizada con éxito',
        description: 'Los cambios han sido guardados.',
      });
    } catch (error) {
      console.error('Error al actualizar la preorden:', error);
      notification.error({
        message: 'No se pudo actualizar la preventa',
        description: error?.message || 'Intenta nuevamente en unos segundos.',
      });
    } finally {
      setIsSavingPreorder(false);
    }
  };

  // Calculamos si el botón debe estar deshabilitado combinando las validaciones
  const isButtonDisabled =
    !isCartValid ||
    insuranceFormIncomplete ||
    !validateInsuranceCoverage.isValid ||
    isSavingPreorder;

  // Mensaje de advertencia que incluye ambas validaciones con información más detallada
  const warningMessage = useMemo(() => {
    if (insuranceFormIncomplete) {
      return 'Complete todos los datos del formulario de autorización de seguro para continuar.';
    }
    if (!validateInsuranceCoverage.isValid) {
      return validateInsuranceCoverage.message;
    }
    return null;
  }, [insuranceFormIncomplete, validateInsuranceCoverage]);

  const buildPreorderPayload = useCallback(() => {
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
  }, [cartData, isTaxReceiptEnabled, selectedNcfType]);

  const billingButtons = {
    direct: {
      text: 'Facturar',
      action: handleInvoicePanelOpen,
      disabled: isButtonDisabled,
    },
    deferred: isEditingPreorder
      ? {
        text: isSavingPreorder ? 'Actualizando...' : 'Actualizar',
        action: handleUpdatePreOrder,
        disabled: isButtonDisabled,
      }
      : {
        text: 'Preventa',
        action: () => {
          activatePreorderMode();
          setIsOpenPreorderConfirmation(true);
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
    billingButtons[billing?.billingMode] || billingButtons.default;

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
      action: () => {
        activateSaleMode();
        handleCancelShipping({ dispatch, closeInvoicePanel: false });
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
  ].filter(Boolean);

  return (
    <Fragment>
      {PreorderModal}
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
          <Label>{formatPrice(subTotal)}</Label>
        </LineItem>
        <LineItem>
          <Label>ITBIS:</Label>
          <Label>{formatPrice(itbis)}</Label>
        </LineItem>
        <Delivery
          inputWidth={SUMMARY_INPUT_WIDTH}
        />
        <LineItem>
          <Label>Descuento:</Label>
          {hasIndividualDiscounts ? (
            <Label style={{ color: '#52c41a', fontWeight: 600 }}>
              -{formatPrice(totalIndividualDiscounts)}
            </Label>
          ) : (
            <DiscountInputContainer>
              <CustomInput
                discount={discount}
                value={discountPercent}
                options={['10', '20', '30', '40', '50']}
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
            <Label>{formatPrice(insuranceExtra)}</Label>
          </LineItem>
        )}
        {warningMessage && <WarningPill message={warningMessage} />}
        <TotalLine>
          <Tooltip title={tooltipTitle}>
            <ActionButton onClick={action} disabled={disabled}>
              {text}
            </ActionButton>
          </Tooltip>
          <ActionMenu disabled={isSavingPreorder} options={menuOptions} />
          <Quotation ref={quotationPrintRef} data={quotationData} />
          <TotalLabel>
            <AnimatedNumber value={formatPrice(total)} />
          </TotalLabel>
        </TotalLine>
      </SummaryContainer>
      <PinAuthorizationModal {...discountPinModalProps} />
      <PreorderConfirmation
        open={isOpenPreorderConfirmation}
        onCancel={() => {
          setIsOpenPreorderConfirmation(false);
          activateSaleMode();
        }}
        onConfirm={handleSavePreOrder}
        preorder={{ data: cartData }}
        loading={isSavingPreorder}
      />
      <CashRegisterAlertModal
        open={isCashRegisterModalOpen}
        onClose={() => setIsCashRegisterModalOpen(false)}
        status={cashRegisterStatus}
      />
    </Fragment>
  );
};

export default InvoiceSummary;
