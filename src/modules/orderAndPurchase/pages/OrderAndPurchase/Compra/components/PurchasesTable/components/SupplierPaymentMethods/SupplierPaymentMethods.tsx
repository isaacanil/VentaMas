import { BankOutlined } from '@ant-design/icons';
import {
  Alert,
  Input,
  InputNumber,
  Switch,
  Tooltip,
  message,
} from 'antd';
import type { InputNumberRef } from '@rc-component/input-number';
import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { Showcase } from '@/components/ui/ShowCase/ShowCase';
import { ShowcaseList } from '@/components/ui/ShowCase/ShowcaseList';
import { icons } from '@/constants/icons/icons';
import type { SupplierCreditNote } from '@/types/payments';
import { formatNumber } from '@/utils/formatNumber';
import type { BankAccountOption } from '@/modules/expenses/pages/Expenses/ExpensesForm/hooks/useActiveBankAccounts';
import type { CashRegisterOption } from '@/modules/expenses/pages/Expenses/ExpensesForm/hooks/useOpenCashRegisters';
import {
  paymentMethodRequiresBankAccount,
  paymentMethodRequiresCashCount,
} from '@/utils/payments/methods';

import type {
  SupplierPaymentMethodCode,
  SupplierPaymentMethodDraft,
} from '../../utils/supplierPaymentMethods';

const amountPlaceholder = '$0.00';
const THRESHOLD = 0.01;

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const PAYMENT_METHOD_INFO: Record<
  SupplierPaymentMethodCode,
  { label: string; icon: ReactNode }
> = {
  cash: { label: 'Efectivo', icon: icons.finances.money },
  card: { label: 'Tarjeta', icon: icons.finances.card },
  transfer: { label: 'Transferencia', icon: icons.finances.transfer },
  supplierCreditNote: {
    label: 'Saldo a favor',
    icon: icons.finances.money,
  },
};

interface SupplierPaymentMethodsProps {
  methods: SupplierPaymentMethodDraft[];
  targetAmount: number;
  bankAccountsEnabled: boolean;
  bankAccounts: BankAccountOption[];
  defaultBankAccountId: string | null;
  defaultBankAccountLabel: string;
  cashRegisters: CashRegisterOption[];
  balance: number;
  totalToRegister: number;
  availableSupplierCreditNotes: SupplierCreditNote[];
  availableSupplierCreditBalance: number;
  onChange: (methods: SupplierPaymentMethodDraft[]) => void;
  disabled?: boolean;
}

export const SupplierPaymentMethods = ({
  methods,
  targetAmount,
  bankAccountsEnabled,
  bankAccounts,
  defaultBankAccountId,
  defaultBankAccountLabel,
  cashRegisters,
  balance,
  totalToRegister,
  availableSupplierCreditNotes,
  availableSupplierCreditBalance,
  onChange,
  disabled = false,
}: SupplierPaymentMethodsProps) => {
  const cashInputRef = useRef<InputNumberRef | null>(null);
  const lastCashStatusRef = useRef(false);

  const hasActiveBankMethod = useMemo(
    () =>
      methods.some(
        (method) =>
          bankAccountsEnabled &&
          method.status &&
          paymentMethodRequiresBankAccount(method.method),
      ),
    [bankAccountsEnabled, methods],
  );
  const hasActiveCashMethod = useMemo(
    () =>
      methods.some(
        (method) =>
          method.status && paymentMethodRequiresCashCount(method.method),
      ),
    [methods],
  );
  const hasSupplierCreditBalance = availableSupplierCreditBalance > THRESHOLD;
  const visibleMethods = useMemo(
    () =>
      methods.filter(
        (method) =>
          ((method.method !== 'supplierCreditNote' || hasSupplierCreditBalance) &&
            (bankAccountsEnabled ||
              !paymentMethodRequiresBankAccount(method.method))),
      ),
    [bankAccountsEnabled, hasSupplierCreditBalance, methods],
  );

  useEffect(() => {
    const cashMethod = methods.find((method) => method.method === 'cash');
    const isCashActive = Boolean(cashMethod?.status);
    const wasCashActive = lastCashStatusRef.current;

    lastCashStatusRef.current = isCashActive;

    if (isCashActive && !wasCashActive && cashInputRef.current) {
      cashInputRef.current.focus();
      const nativeInput = cashInputRef.current.nativeElement as
        | HTMLInputElement
        | undefined;
      nativeInput?.select?.();
    }
  }, [methods]);

  const remainingBalance = roundToTwoDecimals(
    Math.max(balance - totalToRegister, 0),
  );

  const updateMethod = (
    methodCode: SupplierPaymentMethodCode,
    updater: (method: SupplierPaymentMethodDraft) => SupplierPaymentMethodDraft,
  ) => {
    onChange(
      methods.map((method) =>
        method.method === methodCode ? updater(method) : method,
      ),
    );
  };

  const resolveSuggestedValue = (
    method: SupplierPaymentMethodDraft,
  ): number => {
    const assignedToOtherMethods = methods.reduce((sum, currentMethod) => {
      if (!currentMethod.status || currentMethod.method === method.method) {
        return sum;
      }

      return sum + Math.max(toFiniteNumber(currentMethod.value) ?? 0, 0);
    }, 0);
    const suggestedValue = roundToTwoDecimals(
      Math.max(targetAmount - assignedToOtherMethods, 0),
    );

    if (method.method === 'supplierCreditNote') {
      return roundToTwoDecimals(
        Math.min(suggestedValue, availableSupplierCreditBalance),
      );
    }

    return suggestedValue;
  };

  const handleStatusChange = (
    method: SupplierPaymentMethodDraft,
    nextStatus: boolean,
  ) => {
    if (disabled) return;

    const requiresBankAccount =
      bankAccountsEnabled && paymentMethodRequiresBankAccount(method.method);
    const requiresCashCount = paymentMethodRequiresCashCount(method.method);

    if (nextStatus && method.method === 'supplierCreditNote') {
      if (!hasSupplierCreditBalance) {
        message.warning(
          'El suplidor no tiene saldo a favor disponible para aplicar.',
        );
        return;
      }
    }

    if (nextStatus && requiresBankAccount) {
      if (!bankAccounts.length) {
        message.warning(
          'Configura al menos una cuenta bancaria activa para usar tarjeta o transferencia.',
        );
        return;
      }

      if (!defaultBankAccountId) {
        message.warning(
          'Configura una cuenta bancaria para los módulos en Ajustes > Contabilidad.',
        );
        return;
      }
    }

    if (nextStatus && requiresCashCount && !cashRegisters.length) {
      message.warning(
        'Debe tener un cuadre abierto para registrar pagos en efectivo.',
      );
      return;
    }

    updateMethod(method.method, (currentMethod) => ({
      ...currentMethod,
      status: nextStatus,
      value: nextStatus
        ? currentMethod.value > 0
          ? currentMethod.value
          : resolveSuggestedValue(currentMethod)
        : 0,
      reference:
        nextStatus && currentMethod.method !== 'supplierCreditNote'
          ? currentMethod.reference
          : '',
      bankAccountId:
        nextStatus && requiresBankAccount ? defaultBankAccountId : null,
      cashCountId:
        nextStatus && requiresCashCount
          ? (currentMethod.cashCountId ?? cashRegisters[0]?.value ?? null)
          : null,
      supplierCreditNoteId: null,
    }));
  };

  const handleValueChange = (
    method: SupplierPaymentMethodDraft,
    rawValue: number | string | null,
  ) => {
    const numericValue =
      typeof rawValue === 'number' ? rawValue : Number(rawValue);
    const safeValue = roundToTwoDecimals(
      Math.max(toFiniteNumber(numericValue) ?? 0, 0),
    );
    const cappedValue =
      method.method === 'supplierCreditNote'
        ? roundToTwoDecimals(
            Math.min(safeValue, availableSupplierCreditBalance),
          )
        : safeValue;

    if (Number.isFinite(numericValue) && numericValue < 0) {
      message.warning(
        'No se permiten montos negativos en los métodos de pago.',
      );
    }

    if (
      method.method === 'supplierCreditNote' &&
      safeValue - cappedValue > THRESHOLD
    ) {
      message.warning(
        'El monto aplicado desde saldo a favor no puede superar el crédito disponible.',
      );
    }

    updateMethod(method.method, (currentMethod) => ({
      ...currentMethod,
      value: cappedValue,
    }));
  };

  const handleReferenceChange = (
    method: SupplierPaymentMethodDraft,
    reference: string,
  ) => {
    updateMethod(method.method, (currentMethod) => ({
      ...currentMethod,
      reference,
    }));
  };

  return (
    <Container>
      <Showcase title="Balance actual" valueType="price" value={balance} />

      {hasSupplierCreditBalance && (
        <Alert
          type="info"
          showIcon
          message="Saldo a favor disponible"
          description={`Hay ${availableSupplierCreditNotes.length} nota(s) de crédito del suplidor con un total disponible de $${availableSupplierCreditBalance.toFixed(2)}.`}
        />
      )}

      {hasActiveCashMethod && !cashRegisters.length && (
        <Alert
          type="warning"
          showIcon
          message="No tienes un cuadre abierto"
          description="Abre tu cuadre de caja para registrar pagos en efectivo."
        />
      )}
      {hasActiveBankMethod && !bankAccounts.length && (
        <Alert
          type="warning"
          showIcon
          message="No hay cuentas bancarias activas"
          description="Configura al menos una cuenta bancaria activa para aceptar tarjeta o transferencia."
        />
      )}
      {hasActiveBankMethod &&
        bankAccounts.length > 1 &&
        !defaultBankAccountId && (
          <Alert
            type="warning"
            showIcon
            message="Falta definir la cuenta bancaria de los módulos"
            description="Selecciona una cuenta en Ajustes > Contabilidad para registrar pagos bancarios cuando tienes varias cuentas activas."
          />
        )}

      <Items>
        {visibleMethods.map((method) => {
          const methodInfo = PAYMENT_METHOD_INFO[method.method];
          const requiresBankAccount =
            paymentMethodRequiresBankAccount(method.method) &&
            bankAccountsEnabled;
          const requiresCashCount = paymentMethodRequiresCashCount(
            method.method,
          );
          const isSupplierCreditMethod = method.method === 'supplierCreditNote';

          return (
            <MethodItem key={method.method}>
              <MethodGrid>
                <div />
                <LabelCell>
                  {methodInfo.label}
                  {requiresBankAccount && defaultBankAccountId != null && (
                    <Tooltip title={defaultBankAccountLabel} placement="top">
                      <BankIcon />
                    </Tooltip>
                  )}
                </LabelCell>
                <div />

                <SwitchCell>
                  <Switch
                    checked={method.status}
                    disabled={disabled}
                    onChange={(checked) => handleStatusChange(method, checked)}
                  />
                </SwitchCell>
                <InputWrapper>
                  <InputNumber
                    placeholder={amountPlaceholder}
                    value={method.value}
                    disabled={disabled || !method.status}
                    onChange={(value) => handleValueChange(method, value)}
                    ref={method.method === 'cash' ? cashInputRef : undefined}
                    min={0}
                    max={
                      isSupplierCreditMethod
                        ? availableSupplierCreditBalance
                        : undefined
                    }
                    size="large"
                    precision={2}
                    step={0.01}
                    formatter={formatNumber}
                    parser={(value) =>
                      value ? value.replace(/[^0-9.]/g, '') : ''
                    }
                    style={{ width: '100%' }}
                  />
                </InputWrapper>
                {!requiresCashCount && (
                  <InputWrapper>
                    {isSupplierCreditMethod ? (
                      <CreditNoteSummary>
                        Disponible: ${availableSupplierCreditBalance.toFixed(2)}
                      </CreditNoteSummary>
                    ) : (
                      <Input
                        placeholder="Referencia"
                        value={method.reference}
                        disabled={disabled || !method.status}
                        size="large"
                        onChange={(event) =>
                          handleReferenceChange(method, event.target.value)
                        }
                        maxLength={120}
                      />
                    )}
                  </InputWrapper>
                )}
              </MethodGrid>
            </MethodItem>
          );
        })}
      </Items>

      <ShowcaseList
        showcases={[
          {
            title: 'Total a registrar',
            valueType: 'price',
            value: totalToRegister,
          },
          {
            title: 'Balance pendiente',
            valueType: 'price',
            value: remainingBalance,
          },
        ]}
      />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  padding: 12px;
`;

const Items = styled.div`
  display: grid;
  gap: 0.5em;
`;

const MethodItem = styled.div`
  display: grid;
  gap: 0.4em;
`;

const MethodGrid = styled.div`
  display: grid;
  grid-template-columns: 45px 1fr 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.4em;
  row-gap: 0.25em;
  align-items: center;
`;

const LabelCell = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  font-size: 0.85em;
  color: #555;
`;

const SwitchCell = styled.div`
  display: flex;
`;

const InputWrapper = styled.div<{ $spanTwo?: boolean }>`
  grid-column: ${({ $spanTwo }) => ($spanTwo ? 'span 2' : 'auto')};
  min-width: 0;
  width: 100%;
`;

const CreditNoteSummary = styled.div`
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  color: #595959;
  font-size: 0.9em;
  background: #fff;
`;

const BankIcon = styled(BankOutlined)`
  margin-left: 5px;
  font-size: 0.8em !important;
  color: #888;
  cursor: help;
  vertical-align: middle;
`;
