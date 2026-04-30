import {
  Alert,
  Modal,
  Input,
  InputNumber,
  Switch,
  Tooltip,
  message,
  notification,
} from 'antd';
import { BankOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useRef } from 'react';
import type { InputNumberRef } from '@rc-component/input-number';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useAccountingBankingSettings } from '@/hooks/useAccountingBankPaymentPolicy';
import { normalizeSupportedDocumentCurrency } from '@/utils/accounting/currencies';
import { getPriceSymbolByCurrency } from '@/utils/format';
import { useActiveBankAccountsState } from '@/modules/expenses/pages/Expenses/ExpensesForm/hooks/useActiveBankAccounts';
import {
  resolveConfiguredBankAccountId,
  resolveEffectiveBankAccountId,
} from '@/utils/payments/bankPaymentPolicy';
import { paymentMethodRequiresBankAccount } from '@/utils/payments/methods';
import {
  selectCart,
  setPaymentMethod,
  SelectCxcAutoRemovalNotification,
  clearCxcAutoRemovalNotification,
  applyPricingPreset,
} from '@/features/cart/cartSlice';
import type { SupportedDocumentCurrency } from '@/types/products';

type PaymentMethodKey = 'cash' | 'card' | 'transfer' | 'creditNote' | string;

type PaymentMethodItem = {
  method: PaymentMethodKey;
  status: boolean;
  value: number;
  reference?: string;
  bankAccountId?: string | null;
};

type CartPaymentData = {
  paymentMethod: PaymentMethodItem[];
  totalPurchase: { value?: number };
  documentCurrency?: SupportedDocumentCurrency;
  products?: Array<{
    pricing?: { cardPrice?: number };
    selectedSaleUnit?: { pricing?: { cardPrice?: number } };
  }>;
  isAddedToReceivables?: boolean;
};

type CartState = {
  data: CartPaymentData;
};

export const PaymentMethods = () => {
  const dispatch = useDispatch();
  const cashInputRef = useRef<InputNumberRef | null>(null);
  // REFERENCIA NUEVA: Para saber si el efectivo YA estaba activo antes
  const lastCashStatusRef = useRef(false);

  const user = useSelector(selectUser) as {
    businessID?: string;
    businessId?: string;
    activeBusinessId?: string;
  } | null;
  const business = useSelector(selectBusinessData) as {
    id?: string;
    businessID?: string;
    businessId?: string;
  } | null;
  const cart = useSelector(selectCart) as CartState;
  const showCxcAutoRemovalNotification = useSelector(
    SelectCxcAutoRemovalNotification,
  ) as boolean;
  const cartData = cart.data;
  const paymentMethods = useMemo(
    () => cartData?.paymentMethod ?? [],
    [cartData?.paymentMethod],
  );
  const totalPurchase = cartData?.totalPurchase?.value ?? 0;
  const businessId =
    business?.id ??
    business?.businessID ??
    business?.businessId ??
    user?.activeBusinessId ??
    user?.businessId ??
    user?.businessID ??
    null;
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(
    businessId,
    Boolean(businessId),
  );
  const { bankAccountsEnabled, bankPaymentPolicy } =
    useAccountingBankingSettings(businessId, isAccountingRolloutEnabled);
  const isBankAccountsModuleEnabled =
    isAccountingRolloutEnabled && bankAccountsEnabled;
  const { loading: bankAccountsLoading, options: bankAccounts } =
    useActiveBankAccountsState(businessId, isBankAccountsModuleEnabled);
  const activeBankAccountIds = useMemo(
    () => new Set(bankAccounts.map((bankAccount) => bankAccount.value)),
    [bankAccounts],
  );
  const configuredBankAccountByMethod = useMemo(() => {
    if (!isBankAccountsModuleEnabled) {
      return new Map<PaymentMethodKey, string | null>();
    }

    return new Map(
      paymentMethods
        .filter((method) => paymentMethodRequiresBankAccount(method.method))
        .map((method) => [
          method.method,
          resolveConfiguredBankAccountId({
            policy: bankPaymentPolicy,
            moduleKey: 'sales',
            method: method.method,
            availableBankAccountIds: activeBankAccountIds,
          }),
        ]),
    );
  }, [
    activeBankAccountIds,
    bankPaymentPolicy,
    isBankAccountsModuleEnabled,
    paymentMethods,
  ]);
  const unresolvedBankAccountMethods = useMemo(
    () =>
      paymentMethods.filter(
        (method) =>
          method.status &&
          isBankAccountsModuleEnabled &&
          paymentMethodRequiresBankAccount(method.method) &&
          !configuredBankAccountByMethod.get(method.method),
      ),
    [configuredBankAccountByMethod, isBankAccountsModuleEnabled, paymentMethods],
  );
  const getConfiguredBankAccountLabel = (bankAccountId: string | null) =>
    bankAccountId != null
      ? (bankAccounts.find((bankAccount) => bankAccount.value === bankAccountId)
          ?.label ?? 'Cuenta bancaria configurada')
      : bankAccounts.length > 1
        ? 'Configura una cuenta bancaria en Ajustes > Contabilidad'
        : 'Sin cuenta bancaria activa configurada';
  const documentCurrency: SupportedDocumentCurrency =
    normalizeSupportedDocumentCurrency(cartData?.documentCurrency);
  const amountPlaceholder = `${getPriceSymbolByCurrency(documentCurrency)}0.00`;

  const paymentInfo: Record<
    PaymentMethodKey,
    { label: string; icon: React.ReactNode }
  > = {
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
      const nativeInput = cashInputRef.current.nativeElement as
        | HTMLInputElement
        | undefined;
      nativeInput?.select?.();
    }
  }, [paymentMethods]);

  // ---------------------------------------------------------
  // CORRECCIÓN 2: ELIMINADO EL useEffect DE AUTO-RELLENADO
  // (El que te impedía borrar el número)
  // ---------------------------------------------------------

  // Auto-selección inicial al añadir a cuentas por cobrar (Esto está bien mantenerlo)
  useEffect(() => {
    if (cartData?.isAddedToReceivables) {
      const anyEnabled = paymentMethods.some((m) => m.status);
      if (!anyEnabled) {
        const defaultMethod =
          paymentMethods.find((m) => m.method === 'cash') || paymentMethods[0];
        if (defaultMethod) {
          dispatch(
            setPaymentMethod({ ...defaultMethod, status: true, value: 0 }),
          );
        }
      }
    }
  }, [cartData?.isAddedToReceivables, paymentMethods, dispatch]);

  // Lógica de Tarjeta (Se mantiene, pero ten cuidado si también causa conflictos)
  useEffect(() => {
    const activeCard = paymentMethods.find(
      (method) => method.method === 'card' && method.status,
    );
    if (!activeCard) return;

    const total = Number(cartData?.totalPurchase?.value || 0);
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
    }
  }, [paymentMethods, cartData?.totalPurchase?.value, dispatch]);

  const handleStatusChange = (method: PaymentMethodItem, status: boolean) => {
    const requiresBankAccount =
      isBankAccountsModuleEnabled &&
      paymentMethodRequiresBankAccount(method.method);
    const resolvedBankAccountId = requiresBankAccount
      ? resolveEffectiveBankAccountId({
          method: method.method,
          moduleKey: 'sales',
          bankAccountId: method.bankAccountId,
          policy: bankPaymentPolicy,
          availableBankAccountIds: activeBankAccountIds,
        })
      : null;

    if (status && requiresBankAccount) {
      if (!bankAccounts.length) {
        message.warning(
          'Configura al menos una cuenta bancaria activa para usar tarjeta o transferencia en este negocio piloto.',
        );
        return;
      }

      if (!resolvedBankAccountId) {
        message.warning(
          'Configura una cuenta bancaria para los módulos en Ajustes > Contabilidad.',
        );
        return;
      }
    }

    let newValue = method.value ?? 0;

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

    const isAddedToReceivables = cartData?.isAddedToReceivables;
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
        setPaymentMethod({
          ...method,
          status,
          value: newValue,
          bankAccountId: requiresBankAccount ? resolvedBankAccountId : null,
        }),
      );
      if (applyCardPrice) {
        applyCardPricingIfNeeded();
      } else if (revertListPrice) {
        revertToListPrice();
      }
    };

    if (method.method === 'card' && status) {
      const hasCardPrices =
        Array.isArray(cartData?.products) &&
        cartData?.products?.some((product) => {
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

  const handleValueChange = (
    method: PaymentMethodItem,
    newValue: number | string | null,
  ) => {
    const numericValue =
      typeof newValue === 'number' ? newValue : Number(newValue);
    const validValue = Math.max(
      0,
      Number.isFinite(numericValue) ? numericValue : 0,
    );

    if (Number.isFinite(numericValue) && numericValue < 0) {
      message.warning('No se permiten montos negativos en los métodos de pago');
    }

    dispatch(setPaymentMethod({ ...method, value: validValue }));
  };

  const handleReferenceChange = (
    method: PaymentMethodItem,
    newReference: string,
  ) => {
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
      {isBankAccountsModuleEnabled &&
      !bankAccountsLoading &&
      !bankAccounts.length ? (
        <Alert
          type="warning"
          showIcon
          message="No hay cuentas bancarias activas"
          description="Configura al menos una cuenta bancaria en Ajustes > Contabilidad para aceptar tarjeta o transferencia en este negocio piloto."
          style={{ marginBottom: 12 }}
        />
      ) : null}
      {isBankAccountsModuleEnabled &&
      !bankAccountsLoading &&
      bankAccounts.length > 1 &&
      unresolvedBankAccountMethods.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Falta definir la cuenta bancaria de los módulos"
          description="Selecciona una cuenta en Ajustes > Contabilidad para usar tarjeta o transferencia cuando tienes varias cuentas activas."
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Items>
        {paymentMethods.map((method) => {
          const methodInfo = paymentInfo[method.method] || {
            label: method.method,
            icon: icons.finances.money,
          };
          const requiresBankAccount =
            isBankAccountsModuleEnabled &&
            paymentMethodRequiresBankAccount(method.method);
          const configuredBankAccountId =
            configuredBankAccountByMethod.get(method.method) ?? null;
          const configuredBankAccountLabel = getConfiguredBankAccountLabel(
            configuredBankAccountId,
          );
          return (
            <MethodGrid key={method.method}>
              {/* Row 1: empty | label | empty */}
              <div />
              <LabelCell>
                <span>{methodInfo.label}</span>
                {requiresBankAccount && configuredBankAccountId != null && (
                  <Tooltip title={configuredBankAccountLabel} placement="top">
                    <BankIcon />
                  </Tooltip>
                )}
              </LabelCell>
              <div />

              {/* Row 2: switch | value input | reference input */}
              <SwitchCell>
                <Switch
                  checked={method.status}
                  onChange={(checked) => handleStatusChange(method, checked)}
                />
              </SwitchCell>
              <InputWrapper>
                {method.method === 'cash' ? (
                  <InputNumber
                    placeholder={amountPlaceholder}
                    value={method.value}
                    disabled={!method.status}
                    onChange={(e) => handleValueChange(method, e)}
                    ref={cashInputRef}
                    min={0}
                    precision={2}
                    size="large"
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                ) : method.method === 'creditNote' ? (
                  <InputNumber
                    placeholder="Gestionado por selector"
                    value={method.value}
                    disabled={true}
                    min={0}
                    precision={2}
                    size="large"
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <InputNumber
                    placeholder={amountPlaceholder}
                    value={method.value}
                    disabled={!method.status}
                    onChange={(e) => handleValueChange(method, e)}
                    min={0}
                    precision={2}
                    size="large"
                    step={0.01}
                    style={{ width: '100%' }}
                  />
                )}
              </InputWrapper>
              <InputWrapper>
                {method.reference !== undefined ? (
                  <Input
                    placeholder="Referencia"
                    disabled={!method.status}
                    size="large"
                    onChange={(e) =>
                      handleReferenceChange(method, e.target.value)
                    }
                  />
                ) : null}
              </InputWrapper>
            </MethodGrid>
          );
        })}
      </Items>
    </Container>
  );
};

const Container = styled.div`
  padding: 0;
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
  font-size: 1em;
  color: #555;

  svg {
    font-size: 1.2em;
    color: #414141;
  }
`;
const SwitchCell = styled.div`
  display: flex;

`;
const InputWrapper = styled.div`
  min-width: 0;
  width: 100%;
`;
const Items = styled.div`
  display: grid;
  gap: 0.5em;
`;
const BankIcon = styled(BankOutlined)`
  margin-left: 5px;
  font-size: 0.8em !important;
  color: #888;
  cursor: help;
  vertical-align: middle;
`;
