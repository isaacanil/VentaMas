import React, { Fragment, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import CustomInput from '../../../../templates/system/Inputs/CustomInput';
import { useDispatch, useSelector } from 'react-redux';
import { SelectCartData, SelectSettingCart, selectCart, setCartId, toggleInvoicePanelOpen, setPaymentMethod, recalcTotals, setCashPaymentToTotal, selectProductsWithIndividualDiscounts, selectTotalIndividualDiscounts, setDiscountAuthorizationContext, clearDiscountAuthorizationContext } from '../../../../../features/cart/cartSlice';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import { Delivery } from './components/Delivery/Delivery';
import { validateInvoiceCart } from '../../../../../utils/invoiceValidation';
import { notification, Modal, Spin, message } from 'antd'
import { AnimatedNumber } from '../../../../templates/system/AnimatedNumber/AnimatedNumber';
import { fbAddPreOrder } from '../../../../../firebase/invoices/fbAddPreocer';
import { selectUser } from '../../../../../features/auth/userSlice';
import { PreorderConfirmation } from './components/Delivery/PreorderConfirmation/PreorderConfirmation';
import { getTotalDiscount } from '../../../../../utils/pricing';
import useInsuranceEnabled from '../../../../../hooks/useInsuranceEnabled';
import useInsuranceFormComplete from '../../../../../hooks/useInsuranceFormComplete';
import { ActionMenu } from './components/ActionMenu/Actionmenu';
import { icons } from '../../../../../constants/icons/icons';
import { handleCancelShipping } from '../InvoicePanel/handleCancelShipping';
import { Quotation } from '../../../Quotation/components/Quotation/Quotation';
import { useReactToPrint } from 'react-to-print';
import { addQuotation } from '../../../../../firebase/quotation/quotationService';
import { generateInvoicePDF } from '../../../../../utils/pdf/pdfGenerator';
import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import WarningPill from './components/WarningPill/WarningPill';
import { downloadQuotationPdf } from '../../../../../firebase/quotation/downloadQuotationPDF';
import { useAuthorizationPin } from '../../../../../hooks/useAuthorizationPin';
import { useAuthorizationModules } from '../../../../../hooks/useAuthorizationModules';
import { PinAuthorizationModal } from '../../../modals/PinAuthorizationModal/PinAuthorizationModal';

const resolveAuthorizerName = (authorizer) => (
  authorizer?.displayName ||
  authorizer?.name ||
  authorizer?.username ||
  authorizer?.email ||
  authorizer?.uid ||
  'usuario autorizado'
);

const InvoiceSummary = () => {
  const [isCartValid, setIsCartValid] = useState(false);
  const cart = useSelector(selectCart);
  const user = useSelector(selectUser);
  const [isOpenPreorderConfirmation, setIsOpenPreorderConfirmation] = useState(false);
  const cartData = useSelector(SelectCartData); const insuranceExtra = cartData?.totalInsurance?.value || 0;
  const discountAuthorizationContext = cartData?.authorizationContext?.discount || null;
  const billingSettings = cart?.settings?.billing;
  const business = useSelector(selectBusinessData) || {};
  const total = cartData?.totalPurchase?.value;
  const subTotal = cartData?.totalPurchaseWithoutTaxes?.value;
  const itbis = cartData.totalTaxes.value;
  const discountPercent = cartData.discount.value;
  const quotationPrintRef = useRef();
  const [quotationData, setQuotationData] = useState();
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const discount = getTotalDiscount(subTotal, discountPercent);
  const { billing } = useSelector(SelectSettingCart);
  const { shouldUsePinForModule, isInvoicesModuleEnabled } = useAuthorizationModules();

  // Nuevos selectores para descuentos individuales
  const productsWithIndividualDiscounts = useSelector(selectProductsWithIndividualDiscounts);
  const totalIndividualDiscounts = useSelector(selectTotalIndividualDiscounts);
  const hasIndividualDiscounts = productsWithIndividualDiscounts.length > 0;

  const dispatch = useDispatch();
  const insuranceEnabled = useInsuranceEnabled();
  const { shouldDisableButton: insuranceFormIncomplete } = useInsuranceFormComplete();
  const isCashier = user?.role === 'cashier';
  // Solo requiere PIN si el módulo de facturación está activo y es cajero
  const shouldRequirePinForDiscount = shouldUsePinForModule('invoices') && isCashier;
  const [isDiscountAuthorized, setIsDiscountAuthorized] = useState(!shouldRequirePinForDiscount);
  const [discountAuthorizer, setDiscountAuthorizer] = useState(null);

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

      dispatch(setDiscountAuthorizationContext({
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
      }));

      message.success(`Descuento autorizado por ${resolveAuthorizerName(authorizer)}`);
    },
    module: 'invoices',
    allowedRoles: ['admin', 'owner', 'manager', 'dev'],
    description: 'Se requiere autorización con PIN para aplicar descuentos en facturas.',
    reasonList: ['Aplicar o modificar descuentos en la factura.'],
    allowPasswordFallback: false,
  });

  const authorizedByName = useMemo(
    () => (discountAuthorizer ? resolveAuthorizerName(discountAuthorizer) : ''),
    [discountAuthorizer]
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

    const productsWithCoverage = products.filter(product => {
      const insurance = product?.insurance || {};
      return insurance.mode && insurance.value > 0;
    });

    if (productsWithCoverage.length === 0) {
      return {
        isValid: false,
        message: "Al menos un producto debe tener cobertura de seguro configurada",
      };
    }

    const medicineCategories = ['medicamento', 'medicina', 'farmacia', 'recetado'];
    const productsThatShouldHaveInsurance = products.filter(product => {
      const categoryMatch = product?.category &&
        medicineCategories.some(cat =>
          product.category.toLowerCase().includes(cat)
        );

      const isMarkedForInsurance = product?.requiresInsurance === true;

      return (categoryMatch || isMarkedForInsurance);
    });

    // De los productos que deberían tener seguro, verificar cuáles no tienen configuración adecuada
    const invalidProducts = productsThatShouldHaveInsurance.filter(product => {
      const insurance = product?.insurance || {};
      return !insurance.mode || insurance.value <= 0;
    });

    if (invalidProducts.length > 0) {
      const productNames = invalidProducts.map(p => p.productName || 'Producto sin nombre').join(', ');
      return {
        isValid: false,
        message: `Los siguientes productos requieren configuración de seguro: ${productNames}`,
        invalidProducts
      };
    }

    const productsWithInvalidCoverage = products.filter(product => {
      const insurance = product?.insurance || {};
      const price = product?.pricing?.price ?? 0;

      const rules = [
        () => !insurance.mode,
        () => insurance.value <= 0,
        () => insurance.mode === 'porcentaje' && (insurance.value < 1 || insurance.value > 100),
        () => insurance.mode === 'monto' && insurance.value > price
      ]

      return rules.some(rule => rule());
    });

    if (productsWithInvalidCoverage.length > 0) {
      const productNames = productsWithInvalidCoverage.map(p => p.productName || 'Producto sin nombre').join(', ');
      return {
        isValid: false,
        message: `Valor de cobertura inválido en: ${productNames}`,
        invalidProducts: productsWithInvalidCoverage
      };
    }

    return { isValid: true, message: null };
  }, [cartData?.products, insuranceEnabled]);

  useEffect(() => {
    const { isValid } = validateInvoiceCart(cartData);
    setIsCartValid(isValid);
  }, [cartData]);

  const handleInvoicePanelOpen = () => {
    const { isValid, message } = validateInvoiceCart(cartData)
    if (isValid) {
      dispatch(setCashPaymentToTotal())
      dispatch(toggleInvoicePanelOpen())
      dispatch(setCartId())
    } else {
      notification.error({
        description: message
      })
    }
  }

  const handleDiscountAccess = useCallback(() => {
    if (!shouldRequirePinForDiscount || isDiscountAuthorized) {
      return true;
    }
    if (!isDiscountPinModalOpen) {
      showDiscountPinModal();
    }
    return false;
  }, [shouldRequirePinForDiscount, isDiscountAuthorized, isDiscountPinModalOpen, showDiscountPinModal]);

  const handlePrint = useReactToPrint({
    content: () => quotationPrintRef.current,
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
            duration: 4
          });
        },
        onCancel: () => {
          notification.success({
            message: 'Cotización conservada',
            description: 'Los datos de la cotización se han mantenido.',
            duration: 4
          });
        }
      });
    }
  })

  async function handlePrintQuotation() {
    const data = await addQuotation(user, cartData, billingSettings);

    setQuotationData(data);
    setTimeout(() => handlePrint(), 1000);
  };

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
      }
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
    const { isValid, message } = validateInvoiceCart(cartData);
    try {

      await fbAddPreOrder(user, cartData)
      handleCancelShipping()
      setIsOpenPreorderConfirmation(false)
      notification.success({
        message: 'Preorden guardada con éxito',
        type: 'success'
      })
    } catch (error) {
      console.error('Error al guardar la preorden:', error)
    }
  };

  // Calculamos si el botón debe estar deshabilitado combinando las validaciones
  const isButtonDisabled = !isCartValid || insuranceFormIncomplete || !validateInsuranceCoverage.isValid;

  // Mensaje de advertencia que incluye ambas validaciones con información más detallada
  const warningMessage = useMemo(() => {
    if (insuranceFormIncomplete) {
      return "Complete todos los datos del formulario de autorización de seguro para continuar.";
    }
    if (!validateInsuranceCoverage.isValid) {
      return validateInsuranceCoverage.message;
    }
    return null;
  }, [insuranceFormIncomplete, validateInsuranceCoverage]);

  const billingButtons = {
    direct: {
      text: 'Facturar',
      action: handleInvoicePanelOpen,
      disabled: isButtonDisabled
    },
    deferred: {
      text: 'Preventa',
      action: () => setIsOpenPreorderConfirmation(true),
      disabled: isButtonDisabled
    },
    default: {
      text: 'Sin accion',
      action: undefined,
      disabled: true
    }
  }

  const { text, action, disabled } = billingButtons[billing?.billingMode] || billingButtons.default;

  const menuOptions = [
    billingSettings?.quoteEnabled && {
      text: isLoadingQuotation ? 'Cargando...' : 'Cotización',
      action: handleDownloadQuotation,
      icon: isLoadingQuotation ? <Spin size="small" /> : icons.quotation.quote,
      disabled: isButtonDisabled || isLoadingQuotation
    },
    {
      text: 'Cancelar venta',
      action: () => handleCancelShipping({ dispatch, closeInvoicePanel: false }),
      icon: icons.operationModes.close,
      disabled: !isCartValid && !billing?.isLoading,
    },
  ].filter(Boolean);

  return (
    <Fragment>
      {isLoadingQuotation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Spin tip="Cargando cotización..." size="large" />
        </div>
      )}
      <SummaryContainer>
        <LineItem>
          <Label>SubTotal:</Label>
          <Label>{useFormatPrice(subTotal)}</Label>
        </LineItem>
        <LineItem>
          <Label>ITBIS:</Label>
          <Label>{useFormatPrice(itbis)}</Label>
        </LineItem>
        <Delivery />
        <LineItem>
          <Label>Descuento:</Label>
          {hasIndividualDiscounts ? (
            <Label style={{ color: '#52c41a', fontWeight: 600 }}>
              -{useFormatPrice(totalIndividualDiscounts)}
            </Label>
          ) : (
            <DiscountInputContainer>
              <CustomInput
                discount={discount}
                value={discountPercent}
                options={["10", "20", "30", "40", "50"]}
                disabled={hasIndividualDiscounts}
                onRequestAccess={handleDiscountAccess}
              />
              {shouldRequirePinForDiscount && !isDiscountAuthorized && (
                <AuthorizationNote $tone="warning">Requiere autorización con PIN</AuthorizationNote>
              )}
              {shouldRequirePinForDiscount && isDiscountAuthorized && authorizedByName && (
                <AuthorizationNote>Autorizado por {authorizedByName}</AuthorizationNote>
              )}
            </DiscountInputContainer>
          )}
        </LineItem>
        {insuranceEnabled && (
          <LineItem>
            <Label>Cobertura:</Label>
            <Label>{useFormatPrice(insuranceExtra)}</Label>
          </LineItem>
        )}
        {warningMessage && <WarningPill message={warningMessage} />}
        <TotalLine>
          <Button
            onClick={action}
            disabled={disabled}
            title={warningMessage || ""}
          >
            {text}
          </Button>
          <ActionMenu
            disabled={disabled}
            options={menuOptions}
          />
          <Quotation ref={quotationPrintRef} data={quotationData} />
          <TotalLabel>
            <AnimatedNumber value={useFormatPrice(total)} />
          </TotalLabel>
        </TotalLine>
      </SummaryContainer>
      <PinAuthorizationModal {...discountPinModalProps} />
      <PreorderConfirmation
        open={isOpenPreorderConfirmation}
        onCancel={() => setIsOpenPreorderConfirmation(false)}
        onConfirm={handleSavePreOrder}
        preorder={{ data: cartData }}
      />
    </Fragment>
  );
};

export default InvoiceSummary;

const SummaryContainer = styled.div`
  border-radius: 5px;
  padding: 0px 10px;
  position: relative;
`;

export const LineItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  :first-child {
    border-bottom: 1px solid #ccc;
  }
  :last-child {
    border-top: 1px solid #ccc;
    padding: 0;
  }
 
  align-items: center;
`;

const DiscountInputContainer = styled.div`
  display: grid;
  justify-items: end;
  gap: 4px;
`;

const AuthorizationNote = styled.span`
  font-size: 0.75rem;
  color: ${({ $tone }) => ($tone === 'warning' ? '#d48806' : '#595959')};
`;

const TotalLine = styled(LineItem)`
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 12px;
  cursor: pointer;
  :disabled {
    background-color: #8a8a8a;
    cursor: not-allowed;
    :hover {
      background-color: #585858;
    }
  }
  :not(:disabled):hover {
    background-color: #0056b3;
  }
`;

const TotalLabel = styled.span`
  font-weight: bold;
  font-size: 1.2em;
  height: 2.4em;
  display: grid;
  align-content: center;
`;

export const Label = styled.span`
  font-weight: 500;
  white-space: nowrap;
  font-size: 14px;
 `
