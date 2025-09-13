import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components'
import { DatePicker, Input, InputNumber, Select, Form, Modal } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { SelectCartData, toggleReceivableStatus } from '../../../../../../../../../features/cart/cartSlice'
import { calculateInvoiceChange } from '../../../../../../../../../utils/invoice';
import { formatPrice } from '../../../../../../../../../utils/formatPrice';
import { selectAR, setAR, resetAR } from '../../../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import { calculateAmountPerInstallment } from '../../../../../../../../../utils/accountsReceivable/accountsReceivable';
import usePaymentDates from './usePaymentDates';
import { setNumPrecision } from '../../../../../../../../../utils/pricing';
import { getMaxInstallments } from '../../../../../../../../../utils/accountsReceivable/getMaxInstallments';
import { useGetPendingBalance, usePendingBalance } from '../../../../../../../../../firebase/accountsReceivable/fbGetPendingBalance';
import { selectClient } from '../../../../../../../../../features/clientCart/clientCartSlice';
import { selectUser } from '../../../../../../../../../features/auth/userSlice';
import DateUtils from '../../../../../../../../../utils/date/dateUtils';
import PaymentDatesOverview from '../PaymentDatesOverview/PaymentDatesOverbiew';
import { DateTime } from 'luxon';

const { Option } = Select;
const { TextArea } = Input;
const getPositive = (value) => (value < 0 ? -value : value);

export const ReceivableManagementPanel = ({
  isOpen,
  closePanel,
  form,
  creditLimit,
  activeAccountsReceivableCount,
  isWithinCreditLimit,
  isWithinInvoiceCount,
  isChangeNegative,
  receivableStatus
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [userModifiedDate, setUserModifiedDate] = useState(false);
  const [forceRecalculate, setForceRecalculate] = useState(false);
  const [baseCalculationDate, setBaseCalculationDate] = useState(
    DateTime.now().startOf("day").toMillis()
  );

  const handleModalClose = useCallback(() => {
    // Reset form if it exists
    if (form) {
      form.resetFields();
    }
    // Reset local states
    setUserModifiedDate(false);
    setForceRecalculate(false);
    // Call the original close panel function
    closePanel();
  }, [form, closePanel]);

  const {
    paymentFrequency,
    totalInstallments,
    installmentAmount,
    currentBalance,
    paymentDate,
    totalReceivable,
    comments
  } = useSelector(selectAR);

  const cartData = useSelector(SelectCartData);
  const client = useSelector(selectClient);
  const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
  const isReceivable = receivableStatus && isChangeNegative;
  const maxInstallments = getMaxInstallments(paymentFrequency);
  const generalBalance = useMemo(() => getPositive(change) + currentBalance, [change, currentBalance]);
  const isInvalidClient = !client.id || client.id === "GC-0000";



  const updatePaymentDateInStore = useCallback(
    (value) => dispatch(setAR({ paymentDate: value })),
    [dispatch]
  );

  const updateARConfig = useCallback((updates) => {
    const newBase = DateTime.now().startOf("day").toMillis();
    setBaseCalculationDate(newBase);
    setUserModifiedDate(false);
    setForceRecalculate(true);
    dispatch(setAR({ ...updates, paymentDate: null }));
  }, [dispatch]);

  const handleDateChange = useCallback(
    (date) => {
      if (date) {
        const newDateMillis = date.valueOf();
        if (newDateMillis !== paymentDate) {
          setUserModifiedDate(true);
          setForceRecalculate(false);
          updatePaymentDateInStore(newDateMillis);
        }
      } else {
        setUserModifiedDate(false);
        updatePaymentDateInStore(null);
        setBaseCalculationDate(DateTime.now().startOf("day").toMillis());
        setForceRecalculate(true);
      }
    },
    [paymentDate, updatePaymentDateInStore]
  );

  const setInstallments = useCallback(
    (value) => {
      const numValue = Number(value) || 1;
      if (numValue !== totalInstallments) {
        updateARConfig({ totalInstallments: numValue });
      } else {
        dispatch(setAR({ totalInstallments: numValue }));
      }
    },
    [dispatch, totalInstallments, updateARConfig]
  );

  const setFrequency = useCallback(
    (value) => {
      if (value !== paymentFrequency) {
        updateARConfig({ paymentFrequency: value });
      } else {
        dispatch(setAR({ paymentFrequency: value }));
      }
    },
    [dispatch, paymentFrequency, updateARConfig]
  );

  const setAmountPerInstallment = useCallback(
    (value) => dispatch(setAR({ installmentAmount: getPositive(setNumPrecision(value)) })),
    [dispatch]
  );
  const setComments = useCallback((value) => dispatch(setAR({ comments: value })), [dispatch]);
  const setCurrentBalance = (value) => dispatch(setAR({ currentBalance: value }));
  const setTotalReceivable = useCallback((value) => dispatch(setAR({ totalReceivable: value })), [dispatch]);

  const { paymentDates, nextPaymentDate } = usePaymentDates(
    paymentFrequency,
    totalInstallments,
    userModifiedDate ? paymentDate : baseCalculationDate,
    forceRecalculate
  );

  useGetPendingBalance({
    dependencies: [user?.businessID, client?.id, isOpen],
    onBalanceChange: setCurrentBalance
  });

  usePendingBalance(user?.businessID, client?.id, setCurrentBalance);

  useEffect(() => {
    const shouldAutoSet =
      (!userModifiedDate || forceRecalculate) &&
      (!paymentDate || forceRecalculate) &&
      paymentFrequency &&
      totalInstallments > 0 &&
      nextPaymentDate &&
      isOpen; // Solo cuando el modal está abierto
      
    if (shouldAutoSet) {
      if (nextPaymentDate !== paymentDate) {
        updatePaymentDateInStore(nextPaymentDate);
        setUserModifiedDate(false);
        if (forceRecalculate) setForceRecalculate(false);
        
        // Actualizar el form también
        if (form) {
          form.setFieldsValue({ 
            paymentDate: DateUtils.convertMillisToDayjs(nextPaymentDate) 
          });
        }
      } else if (forceRecalculate) {
        setForceRecalculate(false);
      }
    } else if (forceRecalculate) {
      setForceRecalculate(false);
    }
  }, [
    nextPaymentDate,
    paymentFrequency,
    totalInstallments,
    paymentDate,
    userModifiedDate,
    forceRecalculate,
    baseCalculationDate,
    updatePaymentDateInStore,
    isOpen,
    form
  ]);

  useEffect(() => {
    const newAmount = calculateAmountPerInstallment(change, totalInstallments);
    const newTotalReceivable = getPositive(change);
    setAmountPerInstallment(newAmount);
    setTotalReceivable(newTotalReceivable);
  }, [change, totalInstallments, setAmountPerInstallment, setTotalReceivable]);

  useEffect(() => {
    if (receivableStatus && (client?.id === "GC-0000" || !client?.id) && isReceivable) {
      dispatch(toggleReceivableStatus(false));
    }
  }, [client?.id, isReceivable, receivableStatus, dispatch]);
  // Detectar cuando se quita automáticamente de CxC y resetear estados
  useEffect(() => {
    if (!receivableStatus && !isReceivable) {
      // Resetear estados locales del modal cuando se quita de CxC
      setUserModifiedDate(false);
      setForceRecalculate(false);
      setBaseCalculationDate(DateTime.now().startOf("day").toMillis());
      
      // Resetear el estado de AR completamente
      // dispatch(resetAR());
      
      // Cerrar el modal si está abierto
      if (isOpen) {
        closePanel();
      }
    }
  }, [receivableStatus, isReceivable, isOpen, closePanel, dispatch]);
  // Reset form and states when modal opens/closes
  useEffect(() => {
    if (isOpen && form) {
      // Inicializar valores por defecto si no existen
      const defaultFrequency = paymentFrequency || 'monthly';
      const defaultInstallments = totalInstallments || 1;
      
      // Si no hay valores en el store, establecer valores por defecto
      if (!paymentFrequency) {
        dispatch(setAR({ paymentFrequency: defaultFrequency }));
      }
      if (!totalInstallments || totalInstallments === 0) {
        dispatch(setAR({ totalInstallments: defaultInstallments }));
      }
      
      // Reset form with current values when opening
      form.setFieldsValue({
        paymentFrequency: defaultFrequency,
        totalInstallments: defaultInstallments,
        paymentDate: paymentDate ? DateUtils.convertMillisToDayjs(paymentDate) : null,
        comments: comments || ''
      });
    }
  }, [isOpen, form, paymentFrequency, totalInstallments, paymentDate, comments, dispatch]);

  useEffect(() => {
    if (form && paymentDate) {
      form.setFieldsValue({ paymentDate: DateUtils.convertMillisToDayjs(paymentDate) });
    }
  }, [form, paymentDate]);

  useEffect(() => {
    if (form) {
      form.setFieldsValue({ paymentFrequency, totalInstallments });
    }
  }, [form, paymentFrequency, totalInstallments]);  // Inicializar fecha base al abrir el modal
  useEffect(() => {
    if (isOpen && !baseCalculationDate) {
      const initialBase = DateTime.now().startOf("day").toMillis();
      setBaseCalculationDate(initialBase);
      setForceRecalculate(true); // Forzar recálculo inicial
    }
  }, [isOpen, baseCalculationDate]);
  // Inicializar valores por defecto cuando se abre el modal por primera vez
  useEffect(() => {
    if (isOpen && isReceivable) {
      // Solo inicializar si los valores están vacíos o son por defecto
      const needsInitialization = 
        !paymentFrequency || 
        !totalInstallments || 
        totalInstallments === 0;
        
      if (needsInitialization) {
        dispatch(setAR({ 
          paymentFrequency: 'monthly',
          totalInstallments: 1,
          paymentDate: null // Se calculará automáticamente
        }));
        setForceRecalculate(true);
      }
    }
  }, [isOpen, isReceivable, paymentFrequency, totalInstallments, dispatch]);

  // No renderizar el modal si el cliente es inválido
  if (isInvalidClient) {
    return null;
  }

  // Siempre renderizar el modal si isOpen es true, independientemente de otros estados
  return (
    <Modal
      title="Gestión de Cuentas por Cobrar"
      open={isOpen}
      onCancel={handleModalClose}
      footer={null}
      destroyOnHidden={true}
      width={600}
      style={{ top: 20 }}
    >
      <PanelContainer>
        <Header>
          <Label>Balance pendiente</Label>
          <Label>{formatPrice(getPositive(currentBalance))}</Label>
        </Header>
          <Form layout="vertical" form={form}>
            <Group>
              <FormItem
                label="Frecuencia de Pago"
                name="paymentFrequency"
                rules={[{ required: true, message: 'Seleccione una frecuencia de pago' }]}
              >
                <Select value={paymentFrequency} style={{ width: '100%' }} onChange={setFrequency}>
                  <Option value="monthly">Mensual</Option>
                  <Option value="weekly">Semanal</Option>
                </Select>
              </FormItem>
              <FormItem
                label="Cuotas"
                name="totalInstallments"
                rules={[
                  { required: true, message: 'Seleccione el número de cuotas' },
                  { type: 'number', min: 1, max: maxInstallments, message: `Cuotas entre 1 y ${maxInstallments}` }
                ]}
              >
                <InputNumber value={totalInstallments} onChange={setInstallments} style={{ width: '100%' }} />
              </FormItem>
            </Group>
            <Group>
              <FormItem
                label="Fecha de Primer Pago"
                name="paymentDate"
                rules={[{ required: true, message: 'Seleccione una fecha de pago' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  value={paymentDate ? DateUtils.convertMillisToDayjs(paymentDate) : null}
                  onChange={handleDateChange}
                  disabledDate={(current) =>
                    current && current < DateUtils.convertMillisToDayjs(Date.now()).startOf('day')
                  }
                />
              </FormItem>
              <FormItem label="Monto por Cuota">
                <div style={{ fontWeight: 600 }}>
                  <span>{formatPrice(installmentAmount)}</span>
                </div>
              </FormItem>
            </Group>
            <FormItem label="Comentarios" name="comments">
              <TextArea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
            </FormItem>
            {paymentDates.length > 0 && totalInstallments > 0 && (
              <PaymentDatesOverview
                paymentDates={paymentDates}
                nextPaymentDate={nextPaymentDate}
                frequency={paymentFrequency}
                installments={totalInstallments}
              />
            )}
          </Form>
          <Footer>
            <Header>
              <Label>Total a Crédito.</Label>
              <Label>{formatPrice(getPositive(change))}</Label>
            </Header>
            <Header>
              <Label>Balance General</Label>
              <Label>{formatPrice(getPositive(generalBalance))} / {formatPrice(creditLimit?.creditLimit?.value || 0)}</Label>
            </Header>
          </Footer>
        </PanelContainer>
    </Modal>
  );
};

const PanelContainer = styled.div`
  padding: 6px 12px;
  background: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  padding: 0.2em 0;
  display: flex;
  justify-content: space-between;
`;

const Footer = styled.div`
  :nth-child(n) {
    div {
      border-bottom: 1px solid #ccc;
      :last-child {
        border-bottom: 0;
      }
    }
  }
`;

const Label = styled.span`
  color: #333;
  font-weight: 600;
  font-size: 1.1em;
  display: block;
  margin-bottom: 5px;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 15px;
`;

const Group = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: 1fr 0.8fr;
`;
