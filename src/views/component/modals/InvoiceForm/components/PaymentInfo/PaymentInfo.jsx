import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
} from 'antd';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { icons } from '@/constants/icons/icons';
import {
  changeValueInvoiceForm,
  selectInvoice,
} from '@/features/invoice/invoiceFormSlice';


const PAYMENT_METHOD_META = {
  cash: {
    label: 'Efectivo',
    icon: icons.finances.money,
  },
  card: {
    label: 'Tarjeta',
    icon: icons.finances.card,
  },
  transfer: {
    label: 'Transferencia',
    icon: icons.finances.transfer,
  },
  creditNote: {
    label: 'Nota de Crédito',
    icon: icons.finances.money,
  },
};

export const PaymentInfo = ({ isEditLocked = false, onContinue = null }) => {
  const dispatch = useDispatch();
  const { invoice } = useSelector(selectInvoice);

  const paymentMethods = useMemo(() => invoice?.paymentMethod ?? [], [invoice?.paymentMethod]);
  const totalPurchase = Number(invoice?.totalPurchase?.value) || 0;
  const readOnly = isEditLocked;

  const discountType = useMemo(() => {
    const type = invoice?.discount?.type;
    return type === 'fixed' || type === 'percentage' ? type : 'percentage';
  }, [invoice?.discount?.type]);

  // Obtener el subtotal sin impuestos para validaciones
  const subtotal = Number(invoice?.totalPurchaseWithoutTaxes?.value) || 0;

  const totalPayment = useMemo(
    () =>
      paymentMethods.reduce((sum, method) => {
        if (!method?.status) return sum;
        const value = Number(method?.value);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [paymentMethods],
  );

  const rawChange = invoice?.change?.value;
  const changeAmount = useMemo(() => {
    if (rawChange === 0 || rawChange) {
      const parsed = Number(rawChange);
      if (Number.isFinite(parsed)) return parsed;
    }
    return totalPayment - totalPurchase;
  }, [rawChange, totalPayment, totalPurchase]);

  const updatePaymentMethods = useCallback(
    (methods) => {
      if (readOnly) return;
      const sanitized = methods.map((method) => {
        const nextValue = Number(method.value);
        const normalizedValue = Number.isFinite(nextValue) ? nextValue : 0;
        const next = {
          ...method,
          value: normalizedValue,
        };

        if (next.reference === undefined) {
          delete next.reference;
        } else {
          next.reference = next.reference ?? '';
        }

        return next;
      });

      const total = sanitized.reduce((sum, method) => {
        if (!method.status) return sum;
        const value = Number(method.value);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);

      dispatch(
        changeValueInvoiceForm({
          invoice: {
            paymentMethod: sanitized,
            payment: {
              value: total,
            },
          },
        }),
      );
    },
    [dispatch, readOnly],
  );

  useEffect(() => {
    if (readOnly) return;
    if (totalPurchase <= 0) return;
    const cashMethod = paymentMethods.find(
      (method) => method.method === 'cash' && method.status,
    );
    if (!cashMethod) return;

    const cashValue = Number(cashMethod.value) || 0;
    const totalPaymentValue = paymentMethods.reduce((sum, method) => {
      if (!method.status) return sum;
      const value = Number(method.value);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    if (cashValue === 0 && totalPaymentValue === 0) {
      const updated = paymentMethods.map((method) => {
        if (method.method !== 'cash') return method;
        return {
          ...method,
          value: totalPurchase,
        };
      });

      updatePaymentMethods(updated);
    }
  }, [paymentMethods, totalPurchase, updatePaymentMethods, readOnly]);

  const handleStatusChange = useCallback(
    (method, status) => {
      if (readOnly) return;
      const updated = paymentMethods.map((item) => {
        if (item.method !== method.method) return item;
        return {
          ...item,
          status,
          value: status ? item.value : 0,
        };
      });

      if (status) {
        const otherTotal = updated.reduce((sum, item) => {
          if (!item.status || item.method === method.method) return sum;
          const value = Number(item.value);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        const remaining = Math.max(0, totalPurchase - otherTotal);

        const adjusted = updated.map((item) => {
          if (item.method !== method.method) return item;
          const value = Number(item.value);
          if (Number.isFinite(value) && value > 0) {
            return item;
          }
          return {
            ...item,
            value: remaining,
          };
        });

        updatePaymentMethods(adjusted);
        return;
      }

      updatePaymentMethods(updated);
    },
    [paymentMethods, totalPurchase, updatePaymentMethods, readOnly],
  );

  const handleValueChange = useCallback(
    (method, value) => {
      if (readOnly) return;
      const numericValue =
        value === null || value === undefined ? 0 : Number(value);

      if (numericValue < 0) {
        message.warning(
          'No se permiten montos negativos en los métodos de pago',
        );
      }

      const sanitizedValue = Math.max(
        0,
        Number.isFinite(numericValue) ? numericValue : 0,
      );

      const updated = paymentMethods.map((item) => {
        if (item.method !== method.method) return item;
        return {
          ...item,
          value: sanitizedValue,
        };
      });

      updatePaymentMethods(updated);
    },
    [paymentMethods, updatePaymentMethods, readOnly],
  );

  const handleReferenceChange = useCallback(
    (method, newReference) => {
      if (readOnly) return;
      const updated = paymentMethods.map((item) => {
        if (item.method !== method.method) return item;
        return {
          ...item,
          reference: newReference,
        };
      });

      updatePaymentMethods(updated);
    },
    [paymentMethods, updatePaymentMethods, readOnly],
  );

  const handleDiscountTypeChange = useCallback(
    (newType) => {
      if (readOnly) return;

      // Resetear el valor del descuento al cambiar de tipo
      dispatch(
        changeValueInvoiceForm({
          invoice: {
            discount: {
              type: newType,
              value: 0,
            },
          },
        }),
      );
    },
    [dispatch, readOnly],
  );

  const handleDiscountValueChange = useCallback(
    (value) => {
      if (readOnly) return;

      const numericValue =
        value === null || value === undefined ? 0 : Number(value);

      // Validaciones según el tipo de descuento
      if (discountType === 'percentage') {
        if (numericValue < 0 || numericValue > 100) {
          message.warning('El descuento porcentual debe estar entre 0 y 100');
          return;
        }
      } else if (discountType === 'fixed') {
        if (numericValue < 0) {
          message.warning('El descuento no puede ser negativo');
          return;
        }
        if (numericValue > subtotal) {
          message.warning('El descuento no puede ser mayor al subtotal');
          return;
        }
      }

      const sanitizedValue = Math.max(
        0,
        Number.isFinite(numericValue) ? numericValue : 0,
      );

      dispatch(
        changeValueInvoiceForm({
          invoice: {
            discount: {
              type: discountType,
              value: sanitizedValue,
            },
          },
        }),
      );
    },
    [dispatch, discountType, subtotal, readOnly],
  );

  const formattedTotalPayment = useMemo(
    () => formatPrice(totalPayment),
    [totalPayment],
  );

  const formattedTotalPurchase = useMemo(
    () => formatPrice(totalPurchase),
    [totalPurchase],
  );

  const balanceIsPositive = changeAmount >= 0;
  const balanceVariant = balanceIsPositive ? 'positive' : 'negative';
  const balanceLabel = balanceIsPositive ? 'Cambio' : 'Pendiente';
  const formattedBalance = useMemo(
    () => formatPrice(Math.abs(changeAmount)),
    [changeAmount],
  );

  return (
    <Container>
      <DiscountContainer>
        <DiscountSection>
          <SectionTitle>Descuento</SectionTitle>
          <DiscountControls>
            <DiscountTypeSelect
              value={discountType}
              onChange={handleDiscountTypeChange}
              disabled={readOnly}
              options={[
                {
                  label: '% Porcentaje',
                  value: 'percentage',
                },
                {
                  label: '$ Monto Fijo',
                  value: 'fixed',
                },
              ]}
            />
            <InputNumber
              value={invoice?.discount?.value || 0}
              onChange={handleDiscountValueChange}
              min={0}
              max={discountType === 'percentage' ? 100 : subtotal}
              precision={discountType === 'percentage' ? 0 : 2}
              step={discountType === 'percentage' ? 1 : 0.01}
              placeholder={discountType === 'percentage' ? '0' : '0.00'}
              addonBefore={discountType === 'percentage' ? '%' : '$'}
              style={{ flex: 1, maxWidth: 220 }}
              disabled={readOnly}
            />
          </DiscountControls>
          <DiscountHelp>
            {discountType === 'percentage'
              ? 'Ingrese el porcentaje de descuento (0-100)'
              : `Ingrese el monto fijo de descuento (máx: ${formatPrice(subtotal)})`}
          </DiscountHelp>
        </DiscountSection>
      </DiscountContainer>
      <PaymentCard>
        <CardContent>
          <MethodsContainer>
            <SectionTitle>Métodos de pago</SectionTitle>
            {paymentMethods.length === 0 ? (
              <EmptyMessage>
                No hay métodos de pago configurados para esta factura.
              </EmptyMessage>
            ) : (
              <MethodsWrapper>
                {paymentMethods.map((method) => {
                  const meta = PAYMENT_METHOD_META[method.method] ?? {
                    label: method.name || method.method,
                    icon: icons.finances.money,
                  };

                  const isCreditNote = method.method === 'creditNote';

                  return (
                    <MethodRow key={method.method}>
                      <MethodControls>
                        <ControlGroup>
                          <MethodHeader>
                            <Checkbox
                              checked={method.status}
                              onChange={(event) =>
                                handleStatusChange(method, event.target.checked)
                              }
                              disabled={readOnly}
                            />
                            <MethodLabel>
                              <IconWrapper>{meta.icon}</IconWrapper>
                              <span>{meta.label}</span>
                            </MethodLabel>
                          </MethodHeader>
                          <InputNumber
                            addonBefore={<AddonIcon>{meta.icon}</AddonIcon>}
                            placeholder="$$$"
                            value={Number(method.value) || 0}
                            disabled={
                              readOnly || !method.status || isCreditNote
                            }
                            min={0}
                            precision={2}
                            step={0.01}
                            onChange={(value) =>
                              handleValueChange(method, value)
                            }
                            style={{ width: '100%' }}
                          />
                        </ControlGroup>

                        {method.reference !== undefined && (
                          <ControlGroup>
                            <ControlLabel>Referencia</ControlLabel>
                            <Input
                              placeholder="Referencia"
                              value={method.reference || ''}
                              disabled={readOnly || !method.status}
                              onChange={(event) =>
                                handleReferenceChange(
                                  method,
                                  event.target.value,
                                )
                              }
                              addonBefore={<AddonIcon>{meta.icon}</AddonIcon>}
                              style={{ width: '100%' }}
                            />
                          </ControlGroup>
                        )}
                      </MethodControls>
                    </MethodRow>
                  );
                })}
              </MethodsWrapper>
            )}
          </MethodsContainer>

          <Summary>
            <SummaryItem>
              <SummaryLabel>Total compra</SummaryLabel>
              <SummaryValue>{formattedTotalPurchase}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Total pagado</SummaryLabel>
              <SummaryValue>{formattedTotalPayment}</SummaryValue>
            </SummaryItem>
            <SummaryItem $variant={balanceVariant}>
              <SummaryLabel $variant={balanceVariant}>
                {balanceLabel}
              </SummaryLabel>
              <SummaryValue $variant={balanceVariant}>
                {formattedBalance}
              </SummaryValue>
            </SummaryItem>
          </Summary>
        </CardContent>
      </PaymentCard>

      {onContinue && (
        <ContinueButtonContainer>
          <ContinueButton
            type="primary"
            size="large"
            onClick={onContinue}
            block
          >
            Continuar
          </ContinueButton>
        </ContinueButtonContainer>
      )}
    </Container>
  );
};
export const PaymentInfoModal = ({
  isOpen,
  handleClose,
  isEditLocked = false,
}) => (
  <Modal
    open={isOpen}
    footer={null}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onCancel={() => {}} // Deshabilitar cierre por X o escape
    closable={false} // Ocultar botón de cerrar
    maskClosable={false} // Deshabilitar cierre al hacer click fuera
    keyboard={false} // Deshabilitar cierre con tecla Escape
    destroyOnHidden
    style={{ top: '10px' }}
    title="Información de Pago"
    width={620}
  >
    <PaymentInfo isEditLocked={isEditLocked} onContinue={handleClose} />
  </Modal>
);

const Container = styled.div`
  display: grid;
  gap: 1rem;
  width: 100%;
`;

const PaymentCard = styled.div`
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
`;

const CardContent = styled.div`
  display: grid;
  gap: 1.25rem;
  padding: 16px;
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #434343;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const MethodsWrapper = styled.div`
  display: grid;
  gap: 1rem;
  width: 100%;
`;

const MethodsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`;

const DiscountContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0 auto;
`;

const DiscountSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
`;

const DiscountControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;

  @media (width <= 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DiscountTypeSelect = styled(Select)`
  min-width: 140px;

  @media (width <= 600px) {
    width: 100%;
  }
`;

const DiscountHelp = styled.span`
  font-size: 12px;
  line-height: 1.4;
  color: #8c8c8c;
`;

const ContinueButtonContainer = styled.div`
  padding-top: 1rem;
  margin-top: 1.5rem;
  border-top: 1px solid #e8e8e8;
`;

const ContinueButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(24 144 255 / 20%);

  &:hover {
    box-shadow: 0 4px 12px rgb(24 144 255 / 30%);
    transform: translateY(-1px);
    transition: all 0.3s ease;
  }
`;

const MethodRow = styled.div`
  display: grid;
  gap: 0.75rem;
  background: #fff;
  border-radius: 10px;
`;

const MethodHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const MethodLabel = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 500;
  color: #262626;
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #434343;
`;

const AddonIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  color: #434343;
`;

const MethodControls = styled.div`
  display: grid;
  gap: 0.75rem;
  width: 100%;

  @media (width >= 768px) {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    align-items: flex-start;
  }
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
`;

const ControlLabel = styled.span`
  font-size: 12px;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  text-align: center;
  background: ${({ $variant }) => {
    if ($variant === 'positive') return '#d3faacff';
    if ($variant === 'negative') return '#ffc8deff';
    return '#f3f3f3';
  }};
  border-radius: 8px;
`;

const SummaryLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $variant }) => {
    if ($variant === 'positive') return '#237804';
    if ($variant === 'negative') return '#d4380d';
    return '#3a3a3a';
  }};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const SummaryValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ $variant }) => {
    if ($variant === 'positive') return '#237804';
    if ($variant === 'negative') return '#d4380d';
    return '#262626';
  }};
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  font-size: 13px;
  color: #8c8c8c;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
`;
