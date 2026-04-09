import { Alert, Form, message } from 'antd';
import type { InputNumberRef } from '@rc-component/input-number';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { paymentDescriptions } from '@/constants/paymentDescriptions';
import { selectUser } from '@/features/auth/userSlice';
import {
  clearMethodErrors,
  selectAccountsReceivablePayment,
  setMethodError,
  updatePaymentMethod,
} from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useAccountingBankingSettings } from '@/hooks/useAccountingBankPaymentPolicy';
import { useActiveBankAccounts } from '@/modules/expenses/pages/Expenses/ExpensesForm/hooks/useActiveBankAccounts';
import { resolveConfiguredBankAccountId } from '@/utils/payments/bankPaymentPolicy';
import { paymentMethodRequiresBankAccount } from '@/utils/payments/methods';

import { PaymentMethodRow } from './PaymentFields/PaymentMethodRow';
import { Container, Items } from './PaymentFields/styles';

type AccountsReceivablePaymentRootState = Parameters<
  typeof selectAccountsReceivablePayment
>[0];

type AccountsReceivablePaymentMethod = {
  method: string;
  value: number;
  status: boolean;
  reference?: string | null;
  bankAccountId?: string | null;
};

type PaymentInfo = {
  label: string;
  icon: React.ReactNode;
};

type PaymentFieldKey = 'status' | 'value' | 'reference' | 'bankAccountId';

export const PaymentFields = () => {
  const cashInputRef = useRef<InputNumberRef | null>(null);
  const {
    methodErrors: errors,
    paymentDetails,
    isOpen,
  } = useSelector<
    AccountsReceivablePaymentRootState,
    ReturnType<typeof selectAccountsReceivablePayment>
  >(selectAccountsReceivablePayment);
  const user = useSelector(selectUser) as {
    businessID?: string;
    businessId?: string;
    activeBusinessId?: string;
  } | null;
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(
    businessId,
    Boolean(isOpen && businessId),
  );
  const shouldUseBankAccounts = Boolean(isOpen && isAccountingRolloutEnabled);
  const { bankAccountsEnabled, bankPaymentPolicy } =
    useAccountingBankingSettings(businessId, shouldUseBankAccounts);
  const isBankAccountsModuleEnabled =
    shouldUseBankAccounts && bankAccountsEnabled;
  const bankAccounts = useActiveBankAccounts(
    businessId,
    isBankAccountsModuleEnabled,
  );
  const activeBankAccountIds = useMemo(
    () => new Set(bankAccounts.map((bankAccount) => bankAccount.value)),
    [bankAccounts],
  );
  const configuredBankAccountId = isBankAccountsModuleEnabled
    ? resolveConfiguredBankAccountId({
        policy: bankPaymentPolicy,
        moduleKey: 'accountsReceivable',
        availableBankAccountIds: activeBankAccountIds,
      })
    : null;
  const configuredBankAccountLabel =
    configuredBankAccountId != null
      ? (bankAccounts.find(
          (bankAccount) => bankAccount.value === configuredBankAccountId,
        )?.label ?? 'Cuenta bancaria configurada')
      : bankAccounts.length > 1
        ? 'Configura una cuenta bancaria en Ajustes > Contabilidad'
        : 'Sin cuenta bancaria activa configurada';
  const paymentMethods = useMemo(
    () =>
      (paymentDetails.paymentMethods ??
        []) as AccountsReceivablePaymentMethod[],
    [paymentDetails.paymentMethods],
  );
  // Filtrar creditNote de la interfaz (se maneja por separado con CreditSelector)
  const visiblePaymentMethods = useMemo(
    () => paymentMethods.filter((method) => method.method !== 'creditNote'),
    [paymentMethods],
  );
  const dispatch = useDispatch();

  const paymentInfo: Record<string, PaymentInfo> = {
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
  }; // Auto-focus en efectivo y auto-rellenar al abrir modal
  useEffect(() => {
    if (!cashInputRef.current) return;
    const nativeInput = cashInputRef.current.nativeElement as
      | HTMLInputElement
      | undefined;
    if (nativeInput && document.activeElement === nativeInput) return;

    const cashMethod = visiblePaymentMethods.find(
      (method) => method.method === 'cash' && method.status,
    );
    if (cashMethod) {
      cashInputRef.current.focus();
      nativeInput?.select?.();
    }
  }, [visiblePaymentMethods]);

  // Auto-rellenar efectivo si no hay ningún método de pago seleccionado
  useEffect(() => {
    const totalPaymentValue = visiblePaymentMethods.reduce((total, method) => {
      return method.status ? total + (Number(method.value) || 0) : total;
    }, 0);

    const totalAmount = paymentDetails.totalAmount || 0;

    // Solo auto-activar si no hay ningún método activo y hay un monto a pagar
    if (totalPaymentValue === 0 && totalAmount > 0) {
      const cashMethod = visiblePaymentMethods.find(
        (method) => method.method === 'cash',
      );
      if (cashMethod && !cashMethod.status) {
        // Activar efectivo automáticamente y asignar el monto total
        dispatch(
          updatePaymentMethod({
            method: cashMethod.method,
            key: 'status',
            value: true,
          }),
        );
        dispatch(
          updatePaymentMethod({
            method: cashMethod.method,
            key: 'value',
            value: totalAmount,
          }),
        );
      } else if (cashMethod && cashMethod.status && cashMethod.value === 0) {
        // Si ya está activo pero sin valor, asignar el monto total
        dispatch(
          updatePaymentMethod({
            method: cashMethod.method,
            key: 'value',
            value: totalAmount,
          }),
        );
      }
    }
  }, [dispatch, paymentDetails.totalAmount, visiblePaymentMethods]); // Usar visiblePaymentMethods

  const setErrors = (
    method: string,
    key: PaymentFieldKey,
    error: string | null,
  ) => {
    dispatch(setMethodError({ method, key, error }));
  };

  const clearErrors = (method: string) => {
    dispatch(clearMethodErrors({ method }));
  };

  const validateField = (
    method: string,
    key: PaymentFieldKey,
    value: number | string | null,
    status: boolean,
  ) => {
    let error: string | null = null;

    if (status) {
      if (key === 'value' && Number(value) <= 0) {
        error = 'El valor debe ser mayor a cero';
      } else if (
        key === 'reference' &&
        !(method === 'cash' || method === 'creditNote')
      ) {
        const referenceValue = typeof value === 'string' ? value : '';
        if (!referenceValue.trim()) {
          error = 'La referencia es obligatoria';
        }
      } else if (
        key === 'bankAccountId' &&
        isBankAccountsModuleEnabled &&
        paymentMethodRequiresBankAccount(method)
      ) {
        const bankAccountIdValue = typeof value === 'string' ? value : '';
        if (!bankAccountIdValue.trim()) {
          error = 'La cuenta bancaria es obligatoria';
        }
      }
    }

    setErrors(method, key, error);
    return error;
  };

  function handleStatusChange(
    method: AccountsReceivablePaymentMethod,
    status: boolean,
    autoValue: number | null = null,
  ) {
    const requiresBankAccount =
      isBankAccountsModuleEnabled &&
      paymentMethodRequiresBankAccount(method.method);
    if (status && requiresBankAccount) {
      if (!bankAccounts.length) {
        message.warning(
          'Configura al menos una cuenta bancaria activa para usar tarjeta o transferencia en este negocio piloto.',
        );
        return;
      }

      if (!configuredBankAccountId) {
        message.warning(
          'Configura una cuenta bancaria para los módulos en Ajustes > Contabilidad.',
        );
        return;
      }
    }

    let newValue = method.value;

    if (status && (!newValue || newValue === 0 || autoValue)) {
      const currentTotal = visiblePaymentMethods.reduce((total, m) => {
        if (m.status && m.method !== method.method) {
          return total + (Number(m.value) || 0);
        }
        return total;
      }, 0);

      const remaining = (paymentDetails.totalAmount || 0) - currentTotal;
      newValue = autoValue || (remaining > 0 ? remaining : 0);
    }

    // Validar que al menos un método esté seleccionado
    if (!status) {
      const enabledCount = visiblePaymentMethods.filter((m) => m.status).length;
      if (enabledCount === 1) {
        message.warning('Debe seleccionar al menos un método de pago');
        return;
      }
    }

    dispatch(
      updatePaymentMethod({
        method: method.method,
        key: 'status',
        value: status,
      }),
    );
    dispatch(
      updatePaymentMethod({
        method: method.method,
        key: 'value',
        value: status ? newValue : 0,
      }),
    );
    if (requiresBankAccount) {
      dispatch(
        updatePaymentMethod({
          method: method.method,
          key: 'bankAccountId',
          value: status ? configuredBankAccountId : null,
        }),
      );
    }

    if (status) {
      validateField(method.method, 'value', newValue, status);
    } else {
      clearErrors(method.method);
      if (!(method.method === 'cash' || method.method === 'creditNote')) {
        dispatch(
          updatePaymentMethod({
            method: method.method,
            key: 'reference',
            value: '',
          }),
        );
      }
    }
  }

  function handleValueChange(
    method: AccountsReceivablePaymentMethod,
    newValue: number | null,
  ) {
    // Validar que el valor no sea negativo
    const validValue = Math.max(0, Number(newValue) || 0);

    // Si el usuario intentó ingresar un valor negativo, mostrar advertencia
    if (typeof newValue === 'number' && newValue < 0) {
      message.warning('No se permiten montos negativos en los métodos de pago');
    }

    dispatch(
      updatePaymentMethod({
        method: method.method,
        key: 'value',
        value: validValue,
      }),
    );

    if (method.status) {
      validateField(method.method, 'value', validValue, method.status);
    }
  }

  const handleReferenceChange = (
    method: AccountsReceivablePaymentMethod,
    newReference: string,
  ) => {
    dispatch(
      updatePaymentMethod({
        method: method.method,
        key: 'reference',
        value: newReference,
      }),
    );

    if (method.status) {
      validateField(method.method, 'reference', newReference, method.status);
    }
  };

  const handleInputChange = (
    method: string,
    key: PaymentFieldKey,
    value: boolean | number | string | null,
  ) => {
    const targetMethod = visiblePaymentMethods.find((m) => m.method === method);
    if (!targetMethod) return;
    if (key === 'status') {
      if (typeof value !== 'boolean') return;
      handleStatusChange(targetMethod, value);
    } else if (key === 'value') {
      handleValueChange(
        targetMethod,
        typeof value === 'number' ? value : Number(value),
      );
    } else if (key === 'reference') {
      handleReferenceChange(targetMethod, String(value ?? ''));
    }
  };

  return (
    <Container>
      {isBankAccountsModuleEnabled && !bankAccounts.length ? (
        <Alert
          type="warning"
          showIcon
          message="No hay cuentas bancarias activas"
          description="Configura al menos una cuenta bancaria en Ajustes > Contabilidad para registrar pagos con tarjeta o transferencia en este negocio piloto."
          style={{ marginBottom: 12 }}
        />
      ) : null}
      {isBankAccountsModuleEnabled &&
      bankAccounts.length > 1 &&
      !configuredBankAccountId ? (
        <Alert
          type="warning"
          showIcon
          message="Falta definir la cuenta bancaria de los módulos"
          description="Selecciona una cuenta en Ajustes > Contabilidad para registrar pagos con tarjeta o transferencia cuando tienes varias cuentas activas."
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Form layout="vertical">
        <Items>
          {visiblePaymentMethods.map((paymentMethod) => (
            <PaymentMethodRow
              key={paymentMethod.method}
              paymentMethod={paymentMethod}
              paymentInfo={{
                ...paymentInfo,
                [paymentMethod.method]: {
                  label:
                    paymentInfo[paymentMethod.method]?.label ||
                    paymentDescriptions[paymentMethod.method],
                  icon: paymentInfo[paymentMethod.method]?.icon,
                },
              }}
              errors={errors}
              cashInputRef={cashInputRef}
              showBankAccountField={
                isBankAccountsModuleEnabled &&
                paymentMethodRequiresBankAccount(paymentMethod.method)
              }
              bankAccountLabel={configuredBankAccountLabel}
              onInputChange={handleInputChange}
            />
          ))}
        </Items>
      </Form>
    </Container>
  );
};
