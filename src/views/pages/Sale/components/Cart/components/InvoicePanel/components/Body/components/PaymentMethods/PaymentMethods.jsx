import {
  Modal,
  Input,
  Form,
  Checkbox,
  InputNumber,
  message,
  notification,
} from 'antd';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import {
  selectCart,
  setPaymentMethod,
  recalcTotals,
  SelectCxcAutoRemovalNotification,
  clearCxcAutoRemovalNotification,
  applyPricingPreset,
} from '@/features/cart/cartSlice';

export const PaymentMethods = () => {
  const dispatch = useDispatch();
  const cashInputRef = useRef(null);
  // REFERENCIA NUEVA: Para saber si el efectivo YA estaba activo antes
  const lastCashStatusRef = useRef(false);

  const cart = useSelector(selectCart);
  const showCxcAutoRemovalNotification = useSelector(
    SelectCxcAutoRemovalNotification,
  );
  const cartData = cart.data;
  const paymentMethods = cartData.paymentMethod;
  const totalPurchase = cartData.totalPurchase.value;

  const paymentInfo = {
    cash: { label: 'Efectivo', icon: icons.finances.money },
    card: { label: 'Tarjeta', icon: icons.finances.card },
    transfer: { label: 'Transferencia', icon: icons.finances.transfer },
    creditNote: { label: 'Nota de Crédito', icon: icons.finances.money },
  };

  // ---------------------------------------------------------
  // CORRECCIÓN 1: Lógica de Foco "Educada"
  // Solo roba el foco si el usuario ACABA de activar el checkbox.
  // Si ya estaba activo, no molesta.
  // ---------------------------------------------------------
  useEffect(() => {
    const cashMethod = paymentMethods.find((m) => m.method === 'cash');
    const isCashActive = Boolean(cashMethod?.status);
    const wasCashActive = lastCashStatusRef.current;
    
    // Actualizamos la referencia
    lastCashStatusRef.current = isCashActive;

    // Solo enfocamos si pasamos de APAGADO -> ENCENDIDO
    if (isCashActive && !wasCashActive && cashInputRef.current) {
      cashInputRef.current.focus();
      cashInputRef.current.select();
    }
  }, [paymentMethods]);

  // ---------------------------------------------------------
  // CORRECCIÓN 2: ELIMINADO EL useEffect DE AUTO-RELLENADO
  // (El que te impedía borrar el número)
  // ---------------------------------------------------------

  // Auto-selección inicial al añadir a cuentas por cobrar (Esto está bien mantenerlo)
  useEffect(() => {
    if (cartData.isAddedToReceivables) {
      const anyEnabled = paymentMethods.some((m) => m.status);
      if (!anyEnabled) {
        const defaultMethod =
          paymentMethods.find((m) => m.method === 'cash') || paymentMethods[0];
        if (defaultMethod) {
          dispatch(
            setPaymentMethod({ ...defaultMethod, status: true, value: 0 }),
          );
          dispatch(recalcTotals());
        }
      }
    }
  }, [cartData.isAddedToReceivables, paymentMethods, dispatch]);

  // Lógica de Tarjeta (Se mantiene, pero ten cuidado si también causa conflictos)
  useEffect(() => {
    const activeCard = paymentMethods.find(
      (method) => method.method === 'card' && method.status,
    );
    if (!activeCard) return;

    const total = Number(cartData.totalPurchase?.value || 0);
    const current = Number(activeCard.value || 0);
    const hasOtherMethodWithAmount = paymentMethods.some(
      (method) =>
        method.method !== 'card' &&
        method.status &&
        Number(method.value || 0) > 0,
    );

    // Solo actualizamos si hay diferencia significativa para evitar bucles
    if (!hasOtherMethodWithAmount && Math.abs(current - total) > 0.01) {
      dispatch(setPaymentMethod({ ...activeCard, value: total }));
      dispatch(recalcTotals());
    }
  }, [paymentMethods, cartData.totalPurchase?.value, dispatch]);

  const handleStatusChange = (method, status) => {
    let newValue = method.value;

    // CÁLCULO DE RESTANTE:
    // Al activar (status=true), calculamos cuánto falta y lo ponemos en este método.
    if (status) {
      const currentTotal = paymentMethods.reduce((total, m) => {
        // Sumamos los OTROS métodos activos
        if (m.status && m.method !== method.method) {
          return total + (Number(m.value) || 0);
        }
        return total;
      }, 0);

      const remaining = totalPurchase - currentTotal;
      // Si el usuario activa el check, le ponemos lo que falta. Si sobra, 0.
      newValue = remaining > 0 ? remaining : 0;
    } else {
        // Si desactiva, reseteamos a 0
        newValue = 0;
    }

    const isAddedToReceivables = cartData.isAddedToReceivables;
    if (!status && isAddedToReceivables) {
      const enabledCount = paymentMethods.filter((m) => m.status).length;
      // Validación: impedir desmarcar el último si es obligatorio
      if (enabledCount === 1 && method.status) {
        message.warning('Debe seleccionar al menos un método de pago');
        return;
      }
    }
    const otherCardEnabled = paymentMethods.some(
      (m) => m.method === 'card' && m !== method && m.status,
    );
    const shouldRevertToListPrice =
      method.method === 'card' && !status && !otherCardEnabled;

    const applyCardPricingIfNeeded = () => {
      dispatch(applyPricingPreset({ priceKey: 'cardPrice' }));
      message.success('Precios actualizados al precio tarjeta.');
    };

    const revertToListPrice = () => {
      dispatch(applyPricingPreset({ priceKey: 'listPrice' }));
      message.info('Precios restaurados al precio de lista.');
    };

    const proceed = ({
      applyCardPrice = false,
      revertListPrice = false,
    } = {}) => {
      dispatch(
        setPaymentMethod({ ...method, status, value: newValue }),
      );
      dispatch(recalcTotals());
      if (applyCardPrice) {
        applyCardPricingIfNeeded();
      } else if (revertListPrice) {
        revertToListPrice();
      }
    };

    if (method.method === 'card' && status) {
      const hasCardPrices =
        Array.isArray(cartData.products) &&
        cartData.products.some((product) => {
          if (!product) return false;
          const baseCard = Number(product?.pricing?.cardPrice);
          const saleUnitCard = Number(
            product?.selectedSaleUnit?.pricing?.cardPrice,
          );
          return (
            (Number.isFinite(baseCard) && baseCard > 0) ||
            (Number.isFinite(saleUnitCard) && saleUnitCard > 0)
          );
        });

      if (hasCardPrices) {
        Modal.confirm({
          title: '¿Aplicar precio de tarjeta?',
          content:
            'Se detectaron precios de tarjeta para algunos productos. ¿Deseas actualizar la venta con esos precios?',
          okText: 'Sí, aplicar',
          cancelText: 'No',
          onOk: () => {
            proceed({ applyCardPrice: true });
          },
          onCancel: () => {
            proceed();
          },
        });
        return;
      }
    }

    proceed({ revertListPrice: shouldRevertToListPrice });
  };

  const handleValueChange = (method, newValue) => {
    const validValue = Math.max(0, Number(newValue) || 0);

    if (newValue < 0) {
      message.warning('No se permiten montos negativos en los métodos de pago');
    }

    dispatch(setPaymentMethod({ ...method, value: validValue }));
    dispatch(recalcTotals());
  };

  const handleReferenceChange = (method, newReference) => {
    dispatch(setPaymentMethod({ ...method, reference: newReference }));
  };

  useEffect(() => {
    if (showCxcAutoRemovalNotification) {
      notification.success({
        message: 'Cuenta por Cobrar Actualizada',
        description:
          'La venta se removió automáticamente de Cuentas por Cobrar porque el pago cubre el total de la compra.',
        duration: 6,
        placement: 'topRight',
      });

      dispatch(clearCxcAutoRemovalNotification());
    }
  }, [showCxcAutoRemovalNotification, dispatch]);

  return (
    <Container>
      <Items>
        {paymentMethods.map((method) => {
          return (
            <Row key={method.method}>
              <Checkbox
                checked={method.status}
                onChange={(e) => handleStatusChange(method, e.target.checked)}
              />
              <FormItem
                placeholder="Método de pago"
                label={paymentInfo[method.method].label}
              >
                {' '}
                {method.method === 'cash' ? (
                  <InputNumber
                    addonBefore={paymentInfo[method.method].icon}
                    placeholder="$$$"
                    value={method.value}
                    disabled={!method.status}
                    onChange={(e) => handleValueChange(method, e)}
                    ref={cashInputRef} 
                    min={0}
                    precision={2}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                ) : method.method === 'creditNote' ? (
                  <InputNumber
                    addonBefore={paymentInfo[method.method].icon}
                    placeholder="Gestionado por selector"
                    value={method.value}
                    disabled={true}
                    min={0}
                    precision={2}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <InputNumber
                    addonBefore={paymentInfo[method.method].icon}
                    placeholder="$$$"
                    value={method.value}
                    disabled={!method.status}
                    onChange={(e) => handleValueChange(method, e)}
                    min={0}
                    precision={2}
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                )}
              </FormItem>
              {method.reference !== undefined && (
                <FormItem placeholder="Método de pago" label="Referencia">
                  <Input
                    placeholder="Referencia"
                    disabled={!method.status}
                    onChange={(e) =>
                      handleReferenceChange(method, e.target.value)
                    }
                  />
                </FormItem>
              )}
            </Row>
          );
        })}
      </Items>
    </Container>
  );
};

const Container = styled.div` padding: 0; `;
const Row = styled.div` display: grid; grid-template-columns: min-content 0.8fr 1fr; gap: 0.6em; `;
const Items = styled.div` display: grid; gap: 1em; `;
const FormItem = styled(Form.Item)` .ant-form-item-label { padding: 0; } margin: 0; svg { font-size: 1.2em; color: #414141; } `;
