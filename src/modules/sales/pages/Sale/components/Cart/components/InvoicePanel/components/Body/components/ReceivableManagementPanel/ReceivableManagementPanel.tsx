import type { FormInstance } from 'antd';
import { DateTime } from 'luxon';
import type { Key } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  VmButton,
  VmListBox,
  VmModal,
  VmNumberField,
  VmSelect,
  VmTextArea,
} from '@/components/heroui';
import {
  VmDatePicker,
  type DatePickerValue,
} from '@/components/common/DatePicker';
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
import { getMaxInstallments } from '@/domain/accountsReceivable/getMaxInstallments';
import { toMillis } from '@/utils/date/dateUtils';
import { calculateInvoiceChange } from '@/utils/invoice';
import PaymentDatesOverview from '../PaymentDatesOverview/PaymentDatesOverview';

import usePaymentDates from './usePaymentDates';

const getPositive = (value: number) => (value < 0 ? -value : value);

const toDateTime = (millis: number | null | undefined) => {
  const ms = toMillis(millis);
  return ms ? DateTime.fromMillis(ms) : null;
};

type AccountsReceivableState = {
  paymentFrequency?: string;
  totalInstallments: number;
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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [baseCalculationDate, setBaseCalculationDate] = useState(() =>
    DateTime.now().startOf('day').toMillis(),
  );
  const {
    paymentFrequency = 'monthly',
    totalInstallments = 1,
    currentBalance,
    paymentDate,
    comments,
  } = useSelector(selectAR) as any as AccountsReceivableState;

  const handleModalClose = useCallback(() => {
    // Reset form if it exists
    if (form) {
      form.resetFields();
    }
    // Reset local states
    setUserModifiedDate(false);
    setSubmitAttempted(false);
    // Call the original close panel function
    closePanel();
  }, [form, closePanel]);

  const cartData = useSelector(SelectCartData) as any;
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

  const handleDatePickerChange = useCallback(
    (value: DatePickerValue) => {
      const nextDate = Array.isArray(value) ? value[0] : value;
      if (nextDate && nextDate.toMillis() < DateTime.now().startOf('day').toMillis()) {
        return;
      }

      handleDateChange(nextDate ?? null);
    },
    [handleDateChange],
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

  const handleFrequencySelection = useCallback(
    (key: Key | null) => {
      if (key === null) return;
      setFrequency(String(key));
    },
    [setFrequency],
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
  const effectivePaymentDate = paymentDate ?? nextPaymentDate;
  const selectedPaymentDate = useMemo(
    () => (effectivePaymentDate ? toDateTime(effectivePaymentDate) : null),
    [effectivePaymentDate],
  );
  const fieldErrors = useMemo(
    () => ({
      frequency:
        submitAttempted && !paymentFrequency
          ? 'Seleccione una frecuencia de pago'
          : '',
      installments:
        submitAttempted &&
        (!Number.isFinite(totalInstallments) ||
          totalInstallments < 1 ||
          totalInstallments > maxInstallments)
          ? `Cuotas entre 1 y ${maxInstallments}`
          : '',
      paymentDate:
        submitAttempted && !effectivePaymentDate
          ? 'Seleccione una fecha de pago'
          : '',
    }),
    [
      effectivePaymentDate,
      maxInstallments,
      paymentFrequency,
      submitAttempted,
      totalInstallments,
    ],
  );
  const validateCurrentValues = useCallback(() => {
    setSubmitAttempted(true);

    const hasFrequency = Boolean(paymentFrequency);
    const hasInstallments =
      Number.isFinite(totalInstallments) &&
      totalInstallments >= 1 &&
      totalInstallments <= maxInstallments;
    const hasPaymentDate = Boolean(effectivePaymentDate);

    return hasFrequency && hasInstallments && hasPaymentDate;
  }, [
    effectivePaymentDate,
    maxInstallments,
    paymentFrequency,
    totalInstallments,
  ]);

  const handleConfirm = useCallback(async () => {
    if (!validateCurrentValues()) {
      return;
    }

    if (onConfirm) {
      await onConfirm();
    }
  }, [onConfirm, validateCurrentValues]);

  // Redundant hook removed, using only useGetPendingBalance for better performance
  useGetPendingBalance({
    dependencies: [user?.businessID, client?.id],
    enabled: isOpen,
    onBalanceChange: setCurrentBalance as any,
  });

  // Sync Form with Redux State
  useEffect(() => {
    if (isOpen && form) {
      form.setFieldsValue({
        paymentFrequency,
        totalInstallments,
        paymentDate: selectedPaymentDate as any,
        comments: comments || '',
      });
    }
  }, [
    isOpen,
    form,
    paymentFrequency,
    totalInstallments,
    selectedPaymentDate,
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
    <VmModal
      title="Gestión de Cuentas por Cobrar"
      ariaLabel="Gestión de Cuentas por Cobrar"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose();
      }}
      isDismissable={false}
      size="lg"
      footer={
        showActions ? (
          <>
            <VmButton
              variant="secondary"
              onPress={handleModalClose}
              isDisabled={confirmLoading}
            >
              {cancelText}
            </VmButton>
            <VmButton
              variant="primary"
              isPending={confirmLoading}
              onPress={() => void handleConfirm()}
            >
              {confirmText}
            </VmButton>
          </>
        ) : null
      }
    >
      <PanelContainer>
        <Header>
          <Label>Balance pendiente</Label>
          <Label>{formatPrice(getPositive(currentBalance))}</Label>
        </Header>
        <FormLayout>
          <Group>
            <Field>
              <FieldLabel>
                <RequiredMark>*</RequiredMark> Frecuencia de Pago
              </FieldLabel>
              <VmSelect
                aria-label="Frecuencia de Pago"
                fullWidth
                selectedKey={paymentFrequency || null}
                onSelectionChange={handleFrequencySelection}
              >
                <VmSelect.Trigger>
                  <VmSelect.Value />
                  <VmSelect.Indicator />
                </VmSelect.Trigger>
                <VmSelect.Popover>
                  <VmListBox aria-label="Frecuencias de pago">
                    <VmListBox.Item id="monthly" textValue="Mensual">
                      Mensual
                      <VmListBox.ItemIndicator />
                    </VmListBox.Item>
                    <VmListBox.Item id="weekly" textValue="Semanal">
                      Semanal
                      <VmListBox.ItemIndicator />
                    </VmListBox.Item>
                  </VmListBox>
                </VmSelect.Popover>
              </VmSelect>
              {fieldErrors.frequency ? (
                <FieldError>{fieldErrors.frequency}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>
                <RequiredMark>*</RequiredMark> Cuotas
              </FieldLabel>
              <VmNumberField
                aria-label="Cuotas"
                minValue={1}
                maxValue={maxInstallments}
                step={1}
                value={totalInstallments || 1}
                onChange={setInstallments}
              >
                <VmNumberField.Group>
                  <VmNumberField.Input />
                  <VmNumberField.DecrementButton />
                  <VmNumberField.IncrementButton />
                </VmNumberField.Group>
              </VmNumberField>
              {fieldErrors.installments ? (
                <FieldError>{fieldErrors.installments}</FieldError>
              ) : null}
            </Field>
          </Group>
          <Group>
            <Field>
              <FieldLabel>
                <RequiredMark>*</RequiredMark> Fecha de Primer Pago
              </FieldLabel>
              <VmDatePicker
                mode="single"
                value={selectedPaymentDate}
                placeholder="Seleccionar fecha"
                format="DD/MM/YYYY"
                allowClear
                showPresets={false}
                onChange={handleDatePickerChange}
              />
              {fieldErrors.paymentDate ? (
                <FieldError>{fieldErrors.paymentDate}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>Monto por Cuota</FieldLabel>
              <InstallmentAmount>
                {formatPrice(derivedInstallmentAmount)}
              </InstallmentAmount>
            </Field>
          </Group>
          <Field>
            <FieldLabel>Comentarios</FieldLabel>
            <CommentArea
              aria-label="Comentarios"
              rows={3}
              value={comments || ''}
              onChange={(event) => setComments(event.target.value)}
            />
          </Field>
          {paymentDates.length > 0 && totalInstallments > 0 && (
            <PaymentDatesOverview
              paymentDates={paymentDates}
              nextPaymentDate={nextPaymentDate}
              frequency={paymentFrequency}
              installments={totalInstallments}
            />
          )}
        </FormLayout>
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
    </VmModal>
  );
};

const PanelContainer = styled.div`
  display: grid;
  gap: 14px;
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

const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: 1em;

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormLayout = styled.div`
  display: grid;
  gap: 14px;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
`;

const FieldLabel = styled.label`
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
`;

const RequiredMark = styled.span`
  color: #dc2626;
`;

const FieldError = styled.span`
  color: #dc2626;
  font-size: 12px;
`;

const InstallmentAmount = styled.div`
  min-height: 36px;
  display: flex;
  align-items: center;
  font-weight: 600;
`;

const CommentArea = styled(VmTextArea)`
  min-height: 86px;
`;
