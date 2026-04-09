import { Button, Input, InputNumber, Select, Form, Modal } from 'antd';
import type { FormInstance } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';
import { formatPrice } from '@/utils/format';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

import {
  selectAR,
  setAR,
} from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  SelectCartData,
  toggleReceivableStatus,
} from '@/features/cart/cartSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import {
  useGetPendingBalance,
} from '@/firebase/accountsReceivable/fbGetPendingBalance';
import { calculateAmountPerInstallment } from '@/utils/accountsReceivable/accountsReceivable';
import { getMaxInstallments } from '@/utils/accountsReceivable/getMaxInstallments';
import { toMillis } from '@/utils/date/dateUtils';
import { calculateInvoiceChange } from '@/utils/invoice';
import { setNumPrecision } from '@/utils/pricing';
import { flowTrace } from '@/utils/flowTrace';
import PaymentDatesOverview from '../PaymentDatesOverview/PaymentDatesOverbiew';

import usePaymentDates from './usePaymentDates';

const { Option } = Select;
const { TextArea } = Input;
const getPositive = (value: number) => (value < 0 ? -value : value);

const toDateTime = (millis: number | null | undefined) => {
  const ms = toMillis(millis);
  return ms ? DateTime.fromMillis(ms) : null;
};

type AccountsReceivableState = {
  paymentFrequency?: string;
  totalInstallments: number;
  installmentAmount: number;
  currentBalance: number;
  paymentDate: number | null;
  comments?: string;
};

type UserIdentity = {
  businessID?: string;
  uid?: string;
};

type ClientIdentity = {
  id?: string;
};

type ReceivableManagementPanelProps = {
  isOpen: boolean;
  closePanel: () => void;
  form?: FormInstance;
  creditLimit?: CreditLimitConfig | null;
  isChangeNegative: boolean;
  receivableStatus: boolean;
  showActions?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  onConfirm?: () => void | Promise<void>;
  firstPaymentMode?: 'next_period' | 'today';
};

export const ReceivableManagementPanel = ({
  isOpen,
  closePanel,
  form,
  creditLimit,
  isChangeNegative,
  receivableStatus,
  showActions = false,
  confirmText = 'Continuar',
  cancelText = 'Cancelar',
  confirmLoading = false,
  onConfirm,
  firstPaymentMode = 'next_period',
}: ReceivableManagementPanelProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity;
  const [userModifiedDate, setUserModifiedDate] = useState(false);
  const [baseCalculationDate, setBaseCalculationDate] = useState(
    DateTime.now().startOf('day').toMillis(),
  );

  const handleModalClose = useCallback(() => {
    // Reset form if it exists
    if (form) {
      form.resetFields();
    }
    // Reset local states
    setUserModifiedDate(false);
    // Call the original close panel function
    closePanel();
  }, [form, closePanel]);

  const handleConfirm = useCallback(async () => {
    if (onConfirm) {
      await onConfirm();
    }
  }, [onConfirm]);

  const {
    paymentFrequency = 'monthly',
    totalInstallments = 1,
    installmentAmount,
    currentBalance,
    paymentDate,
    comments,
  } = useSelector(selectAR) as any as AccountsReceivableState;

  const cartData = useSelector(SelectCartData);
  const client = useSelector(selectClient) as ClientIdentity | null;

  const change = useMemo(() => {
    const rawChange = calculateInvoiceChange(cartData);
    if (Number.isFinite(rawChange)) {
      return rawChange;
    }
    const paymentValue = Number(cartData?.payment?.value ?? 0);
    const totalPurchaseValue = Number(
      cartData?.totalPurchase?.value ??
        cartData?.preorderDetails?.totalPurchase?.value ??
        cartData?.totals?.total ??
        0,
    );
    const fallbackChange = paymentValue - totalPurchaseValue;
    return Number.isFinite(fallbackChange) ? fallbackChange : 0;
  }, [cartData]);
  const canRemainOpen = isChangeNegative || receivableStatus;
  const maxInstallments = getMaxInstallments(paymentFrequency || 'monthly');
  const generalBalance = useMemo(
    () => getPositive(change) + currentBalance,
    [change, currentBalance],
  );
  const isInvalidClient = !client?.id || client.id === 'GC-0000';

  // Derived values for UI and synchronization
  const derivedInstallmentAmount = useMemo(() => {
    return calculateAmountPerInstallment(
      getPositive(change),
      totalInstallments || 1,
    );
  }, [change, totalInstallments]);

  const derivedTotalReceivable = useMemo(() => getPositive(change), [change]);

  const updatePaymentDateInStore = useCallback(
    (value: number | null) => dispatch(setAR({ paymentDate: value })),
    [dispatch],
  );

  const updateARConfig = useCallback(
    (updates: Partial<AccountsReceivableState>) => {
      const newBase = DateTime.now().startOf('day').toMillis();
      setBaseCalculationDate(newBase);
      setUserModifiedDate(false);
      dispatch(setAR({ ...updates, paymentDate: null }));
    },
    [dispatch],
  );

  const handleDateChange = useCallback(
    (date: DateTime | null) => {
      if (date) {
        const newDateMillis = date.toMillis();
        if (newDateMillis !== paymentDate) {
          setUserModifiedDate(true);
          updatePaymentDateInStore(newDateMillis);
        }
      } else {
        setUserModifiedDate(false);
        updatePaymentDateInStore(null);
        setBaseCalculationDate(DateTime.now().startOf('day').toMillis());
      }
    },
    [paymentDate, updatePaymentDateInStore],
  );

  const setInstallments = useCallback(
    (value: number | null) => {
      const numValue = Number(value) || 1;
      updateARConfig({ totalInstallments: numValue });
    },
    [updateARConfig],
  );

  const setFrequency = useCallback(
    (value: string) => {
      updateARConfig({ paymentFrequency: value });
    },
    [updateARConfig],
  );

  const setComments = useCallback(
    (value: string) => dispatch(setAR({ comments: value })),
    [dispatch],
  );

  const setCurrentBalance = useCallback(
    (value: number | null) => dispatch(setAR({ currentBalance: value ?? 0 })),
    [dispatch],
  );

  const includeStartDate = firstPaymentMode === 'today';

  const { paymentDates, nextPaymentDate } = usePaymentDates(
    paymentFrequency || 'monthly',
    totalInstallments,
    userModifiedDate ? paymentDate : baseCalculationDate,
    includeStartDate,
  );

  // Redundant hook removed, using only useGetPendingBalance for better performance
  useGetPendingBalance({
    dependencies: [user?.businessID, client?.id],
    enabled: isOpen,
    onBalanceChange: setCurrentBalance as any,
  });

  // Sync calculations to Redux and trace
  useEffect(() => {
    if (!isOpen) return;

    const shouldUpdateAmount =
      Math.abs(installmentAmount - derivedInstallmentAmount) > 0.01;

    if (shouldUpdateAmount) {
      dispatch(
        setAR({
          installmentAmount: getPositive(
            setNumPrecision(derivedInstallmentAmount),
          ),
          totalReceivable: derivedTotalReceivable,
        }),
      );

      void flowTrace('AR_CALCULATE_INSTALLMENT', {
        change,
        totalInstallments,
        installmentAmount: derivedInstallmentAmount,
        totalReceivable: derivedTotalReceivable,
      });
    }
  }, [
    isOpen,
    derivedInstallmentAmount,
    derivedTotalReceivable,
    installmentAmount,
    dispatch,
    change,
    totalInstallments,
  ]);

  // Automatic payment date selection
  useEffect(() => {
    if (isOpen && !userModifiedDate && !paymentDate && nextPaymentDate) {
      updatePaymentDateInStore(nextPaymentDate);
    }
  }, [
    isOpen,
    nextPaymentDate,
    paymentDate,
    userModifiedDate,
    updatePaymentDateInStore,
  ]);

  // Sync Form with Redux State
  useEffect(() => {
    if (isOpen && form) {
      form.setFieldsValue({
        paymentFrequency,
        totalInstallments,
        paymentDate: paymentDate ? (toDateTime(paymentDate) as any) : null,
        comments: comments || '',
      });
    }
  }, [
    isOpen,
    form,
    paymentFrequency,
    totalInstallments,
    paymentDate,
    comments,
  ]);

  // Logic to handle auto-closing when not receivable
  useEffect(() => {
    if (isOpen && !canRemainOpen) {
      closePanel();
    }
  }, [isOpen, canRemainOpen, closePanel]);

  // Handle invalid client and status change
  useEffect(() => {
    if (isOpen && isChangeNegative && isInvalidClient) {
      dispatch(toggleReceivableStatus(false));
    }
  }, [isOpen, isChangeNegative, isInvalidClient, dispatch]);

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
      footer={
        showActions
          ? [
              <Button
                key="cancel"
                onClick={handleModalClose}
                disabled={confirmLoading}
              >
                {cancelText}
              </Button>,
              <Button
                key="confirm"
                type="primary"
                onClick={handleConfirm}
                loading={confirmLoading}
              >
                {confirmText}
              </Button>,
            ]
          : null
      }
      destroyOnClose={true}
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
              rules={[
                {
                  required: true,
                  message: 'Seleccione una frecuencia de pago',
                },
              ]}
            >
              <Select style={{ width: '100%' }} onChange={setFrequency}>
                <Option value="monthly">Mensual</Option>
                <Option value="weekly">Semanal</Option>
              </Select>
            </FormItem>
            <FormItem
              label="Cuotas"
              name="totalInstallments"
              rules={[
                { required: true, message: 'Seleccione el número de cuotas' },
                {
                  type: 'number',
                  min: 1,
                  max: maxInstallments,
                  message: `Cuotas entre 1 y ${maxInstallments}`,
                },
              ]}
            >
              <InputNumber
                onChange={setInstallments}
                style={{ width: '100%' }}
              />
            </FormItem>
          </Group>
          <Group>
            <FormItem
              label="Fecha de Primer Pago"
              name="paymentDate"
              rules={[
                { required: true, message: 'Seleccione una fecha de pago' },
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                onChange={handleDateChange}
                disabledDate={(current) =>
                  !!current &&
                  current.toMillis() < DateTime.now().startOf('day').toMillis()
                }
              />
            </FormItem>
            <FormItem label="Monto por Cuota">
              <div style={{ fontWeight: 600 }}>
                <span>{formatPrice(derivedInstallmentAmount)}</span>
              </div>
            </FormItem>
          </Group>
          <FormItem label="Comentarios" name="comments">
            <TextArea rows={3} onChange={(e) => setComments(e.target.value)} />
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
            <Label>
              {formatPrice(getPositive(generalBalance))} /{' '}
              {formatPrice(creditLimit?.creditLimit?.value || 0)}
            </Label>
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
  box-shadow: 0 4px 8px rgb(0 0 0 / 10%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.2em 0;
`;

const Footer = styled.div`
  &:nth-child(n) {
    div {
      border-bottom: 1px solid #ccc;

      &:last-child {
        border-bottom: 0;
      }
    }
  }
`;

const Label = styled.span`
  display: block;
  margin-bottom: 5px;
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 15px;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: 1em;
`;
