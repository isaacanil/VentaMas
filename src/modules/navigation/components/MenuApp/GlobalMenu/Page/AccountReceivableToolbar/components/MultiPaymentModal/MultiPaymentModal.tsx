import { Modal, Button, Form, message, notification, Steps } from 'antd';
import React, { useMemo, useReducer, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

import { selectUser } from '@/features/auth/userSlice';
import { fbProcessMultiplePaymentsAR } from '@/firebase/proccessAccountsReceivablePayments/insurance/fbProcessMultiplePaymentsAR';
import { formatDate as formatDateUtil } from '@/utils/date/dateUtils';
import { formatMoney } from '@/utils/formatters';
import { ShowcaseList } from '@/components/ui/ShowCase/ShowcaseList';
import type { UserIdentity } from '@/types/users';

import AccountsTable from './components/AccountsTable';
import FilterBar from './components/FilterBar';
import PaymentMethodsForm from './components/PaymentMethodsForm';
import PaymentReceipt from './components/PaymentReceipt';
import type {
  InsuranceOption,
  PaymentMethod,
  PaymentMethodKey,
  PaymentMethodType,
  PaymentMethodValue,
  PaymentReceiptData,
  ProcessedAccountRow,
  UpdatePaymentMethod,
} from '../../types';

/**
 * Componente principal para el Modal de Pagos Múltiples
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.visible - Estado de visibilidad del modal
 * @param {Function} props.onCancel - Función para cancelar/cerrar el modal
 * @param {Array} props.accounts - Lista de cuentas disponibles para pago
 */
type PaymentMethodChangeValue = PaymentMethodValue | boolean;

interface MultiPaymentModalProps {
  visible: boolean;
  onCancel: () => void;
  accounts?: ProcessedAccountRow[];
}

const EMPTY_PROCESSED_ACCOUNTS: ProcessedAccountRow[] = [];

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { method: 'cash', value: 0, status: true },
  { method: 'card', value: 0, reference: '', status: false },
  { method: 'transfer', value: 0, reference: '', status: false },
];

interface MultiPaymentModalState {
  selectedAccounts: string[];
  loading: boolean;
  submitted: boolean;
  receipt: PaymentReceiptData | null;
  insuranceFilter: string;
  paymentMethods: PaymentMethod[];
  printReceipt: boolean;
  methodErrors: Record<string, string>;
  currentStep: number;
}

type MultiPaymentModalStateUpdate =
  | Partial<MultiPaymentModalState>
  | ((state: MultiPaymentModalState) => Partial<MultiPaymentModalState>);

const initialMultiPaymentModalState: MultiPaymentModalState = {
  selectedAccounts: [],
  loading: false,
  submitted: false,
  receipt: null,
  insuranceFilter: 'none',
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  printReceipt: true,
  methodErrors: {},
  currentStep: 0,
};

const multiPaymentModalStateReducer = (
  state: MultiPaymentModalState,
  update: MultiPaymentModalStateUpdate,
): MultiPaymentModalState => ({
  ...state,
  ...(typeof update === 'function' ? update(state) : update),
});

export const MultiPaymentModal = ({
  visible,
  onCancel,
  accounts = EMPTY_PROCESSED_ACCOUNTS,
}: MultiPaymentModalProps) => {
  // Estado local
  const [state, setState] = useReducer(
    multiPaymentModalStateReducer,
    initialMultiPaymentModalState,
  );
  const [form] = Form.useForm();
  const user = useSelector(selectUser) as UserIdentity | null;
  const componentToPrintRef = useRef<HTMLDivElement | null>(null);
  const {
    selectedAccounts,
    loading,
    submitted,
    receipt,
    insuranceFilter,
    paymentMethods,
    printReceipt,
    methodErrors,
    currentStep,
  } = state;
  const setSelectedAccounts: React.Dispatch<React.SetStateAction<string[]>> = (
    update,
  ) =>
    setState((prev) => ({
      selectedAccounts:
        typeof update === 'function' ? update(prev.selectedAccounts) : update,
    }));
  const setLoading = (value: boolean) => setState({ loading: value });
  const setSubmitted = (value: boolean) => setState({ submitted: value });
  const setReceipt: React.Dispatch<
    React.SetStateAction<PaymentReceiptData | null>
  > = (update) =>
    setState((prev) => ({
      receipt: typeof update === 'function' ? update(prev.receipt) : update,
    }));
  const setInsuranceFilter = (value: string) => setState({ insuranceFilter: value });
  const setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>> = (
    update,
  ) =>
    setState((prev) => ({
      paymentMethods:
        typeof update === 'function' ? update(prev.paymentMethods) : update,
    }));
  const setPrintReceipt: React.Dispatch<React.SetStateAction<boolean>> = (
    update,
  ) =>
    setState((prev) => ({
      printReceipt:
        typeof update === 'function' ? update(prev.printReceipt) : update,
    }));
  const setMethodErrors: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  > = (update) =>
    setState((prev) => ({
      methodErrors:
        typeof update === 'function' ? update(prev.methodErrors) : update,
    }));
  const setCurrentStep: React.Dispatch<React.SetStateAction<number>> = (
    update,
  ) =>
    setState((prev) => ({
      currentStep:
        typeof update === 'function' ? update(prev.currentStep) : update,
    }));

  // Funciones de formato
  const formatCurrency = (amount?: number | string | null) =>
    formatMoney(amount);
  const formatDate = (date?: number | null) => {
    if (!date) return 'N/A';
    return formatDateUtil(date);
  };

  const validatePaymentMethod = React.useCallback(
    (
      method: PaymentMethodType,
      key: PaymentMethodKey,
      value: PaymentMethodChangeValue,
    ) => {
      setMethodErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };

        Object.keys(updatedErrors).forEach((errorKey) => {
          if (errorKey.startsWith(`${method}_`)) {
            delete updatedErrors[errorKey];
          }
        });

        setPaymentMethods((currentMethods) => {
          const selectedMethod = currentMethods.find(
            (pm) => pm.method === method,
          );

          if ((key === 'status' && value === true) || selectedMethod?.status) {
            const numericValue = Number(value);
            if (
              (key === 'value' &&
                (!value ||
                  !Number.isFinite(numericValue) ||
                  numericValue <= 0)) ||
              (key !== 'value' && Number(selectedMethod?.value) <= 0)
            ) {
              updatedErrors[`${method}_value`] =
                'El valor debe ser mayor a cero';
            }

            if (method !== 'cash') {
              const referenceValue =
                key === 'reference' ? value : selectedMethod?.reference;
              const referenceText =
                typeof referenceValue === 'string' ? referenceValue.trim() : '';
              if (!referenceText) {
                updatedErrors[`${method}_reference`] =
                  'La referencia es obligatoria';
              }
            }
          }

          return currentMethods; // No modificar, solo leer
        });

        return updatedErrors;
      });
    },
    [],
  );

  const updatePaymentMethod = React.useCallback(
    (
      method: PaymentMethodType,
      key: PaymentMethodKey,
      value: PaymentMethodChangeValue,
    ) => {
      if (key === 'value') {
        const nextValue = value as PaymentMethodValue;
        // Si el campo está vacío, mantenerlo vacío (no convertir a 0)
        if (nextValue === '' || nextValue === null || nextValue === undefined) {
          setPaymentMethods((prevMethods) =>
            prevMethods.map((pm) =>
              pm.method === method
                ? { ...pm, value: '', status: pm.status }
                : pm,
            ),
          );
        }
        // Si es el método de efectivo y tiene un valor numérico
        else if (method === 'cash' && !Number.isNaN(Number(nextValue))) {
          const numericValue = Number(nextValue).toFixed(2);

          setPaymentMethods((prevMethods) =>
            prevMethods.map((pm) =>
              pm.method === 'cash'
                ? { ...pm, value: Number(numericValue), status: true }
                : pm,
            ),
          );
        }
        // Para otros métodos de pago o valores no numéricos
        else {
          setPaymentMethods((prevMethods) =>
            prevMethods.map((pm) =>
              pm.method === method ? { ...pm, value: nextValue } : pm,
            ),
          );
        }
      } else if (key === 'status') {
        const nextStatus = Boolean(value);
        setPaymentMethods((prevMethods) =>
          prevMethods.map((pm) =>
            pm.method === method ? { ...pm, status: nextStatus } : pm,
          ),
        );
      } else {
        const nextReference = typeof value === 'string' ? value : '';
        setPaymentMethods((prevMethods) =>
          prevMethods.map((pm) =>
            pm.method === method ? { ...pm, reference: nextReference } : pm,
          ),
        );
      }

      if (key === 'status' || key === 'value') {
        validatePaymentMethod(method, key, value);
      }
    },
    [validatePaymentMethod],
  ) as UpdatePaymentMethod;

  const insuranceOptions = useMemo(
    () =>
      accounts
        .map((account) => {
          const insurance = account.ver?.account?.account?.insurance;
          if (!insurance?.name || !insurance?.insuranceId) {
            return null;
          }
          return { name: insurance.name, id: insurance.insuranceId };
        })
        .filter((item): item is InsuranceOption => item !== null)
        .reduce<InsuranceOption[]>((unique, item) => {
          if (!unique.some((i) => i.id === item.id)) {
            unique.push(item);
          }
          return unique;
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [accounts],
  );

  const defaultInsuranceFilter = insuranceOptions[0]?.id ?? 'none';

  const defaultSelectedAccounts = useMemo(() => {
    if (defaultInsuranceFilter === 'none') {
      return [];
    }

    return accounts
      .filter(
        (account) =>
          account.ver?.account?.account?.insurance?.insuranceId ===
          defaultInsuranceFilter,
      )
      .map((account) => account.ver.account.id);
  }, [accounts, defaultInsuranceFilter]);

  const syncSelectionAmount = React.useCallback(
    (accountIds: string[]) => {
      const total = accountIds.reduce((sum, accountId) => {
        const account = accounts.find((acc) => acc.ver.account.id === accountId);
        return sum + (account?.balance || 0);
      }, 0);

      form.setFieldsValue({ amount: total });
      updatePaymentMethod('cash', 'value', total);
    },
    [accounts, form, updatePaymentMethod],
  );

  const totalPaid = useMemo(
    () =>
      paymentMethods.reduce((sum, method) => {
        if (method.status) {
          return sum + (Number(method.value) || 0);
        }
        return sum;
      }, 0),
    [paymentMethods],
  );

  const validatePaymentForm = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (selectedAccounts.length === 0) {
      message.error('Debe seleccionar al menos una cuenta para pagar');
      return false;
    }

    const totalAmount = form.getFieldValue('amount');
    if (!totalAmount || totalAmount <= 0) {
      message.error('El monto total debe ser mayor a cero');
      return false;
    }

    const activeMethods = paymentMethods.filter((method) => method.status);
    if (activeMethods.length === 0) {
      message.error('Debe seleccionar al menos un método de pago');
      return false;
    }

    for (const method of paymentMethods) {
      if (method.status) {
        if (!method.value || Number(method.value) <= 0) {
          newErrors[`${method.method}_value`] =
            'El valor debe ser mayor a cero';
          isValid = false;
        }

        if (method.method !== 'cash') {
          if (!method.reference || method.reference.trim() === '') {
            newErrors[`${method.method}_reference`] =
              'La referencia es obligatoria';
            isValid = false;
          }
        }
      }
    } // Usar el mismo umbral de tolerancia EPSILON para comparar valores
    const EPSILON = 0.001;
    if (
      totalPaid < totalAmount &&
      Math.abs(totalPaid - totalAmount) >= EPSILON
    ) {
      message.error('El monto pagado debe ser igual o mayor al monto total');
      return false;
    }

    setMethodErrors(newErrors);
    return isValid;
  };

  const getFilteredAccounts = () => {
    if (insuranceFilter === 'none') return [];
    if (insuranceFilter === 'all') return accounts;

    return accounts.filter(
      (account) =>
        account.ver?.account?.account?.insurance?.insuranceId ===
        insuranceFilter,
    );
  };

  const handleSelectAccount = (e: CheckboxChangeEvent, accountId: string) => {
    setSelectedAccounts((prevSelected) =>
      {
        const nextSelected = e.target.checked
        ? [...prevSelected, accountId]
        : prevSelected.filter((id) => id !== accountId);

        syncSelectionAmount(nextSelected);
        return nextSelected;
      },
    );
  };

  const areAllVisibleSelected = () => {
    const filteredAccounts = getFilteredAccounts();
    if (filteredAccounts.length === 0) return false;

    return filteredAccounts.every((account) =>
      selectedAccounts.includes(account.ver.account.id),
    );
  };

  const areSomeVisibleSelected = () => {
    const filteredAccounts = getFilteredAccounts();
    return filteredAccounts.some((account) =>
      selectedAccounts.includes(account.ver.account.id),
    );
  };

  const handleSelectAll = (e: CheckboxChangeEvent) => {
    const filteredAccounts = getFilteredAccounts();
    const filteredIds = filteredAccounts.map(
      (account) => account.ver.account.id,
    );

    setSelectedAccounts((prevSelected) => {
      if (e.target.checked) {
        const otherSelected = prevSelected.filter(
          (id) =>
            !filteredAccounts.some((account) => account.ver.account.id === id),
        );
        const nextSelected = [...otherSelected, ...filteredIds];
        syncSelectionAmount(nextSelected);
        return nextSelected;
      }

      const nextSelected = prevSelected.filter(
        (id) => !filteredIds.includes(id),
      );
      syncSelectionAmount(nextSelected);
      return nextSelected;
    });
  };

  const handleInsuranceFilterChange = (value: string) => {
    setInsuranceFilter(value);

    const filteredAccounts = accounts.filter(
      (account) =>
        account.ver?.account?.account?.insurance?.insuranceId === value,
    );

    if (filteredAccounts.length > 0) {
      const newSelectedAccounts = filteredAccounts.map(
        (account) => account.ver.account.id,
      );
      setSelectedAccounts(newSelectedAccounts);
      syncSelectionAmount(newSelectedAccounts);
    } else {
      setSelectedAccounts([]);
      syncSelectionAmount([]);
    }
  };
  const handleDateRangeChange = (_dates: unknown) => {
    // TODO: aplicar filtro por rango de fechas si se requiere
  };

  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
    onAfterPrint: () => {
      notification.success({
        message: 'Pago Procesado',
        description: 'Pago de Aseguradora Registrado con éxito',
        duration: 4,
      });
      handleCancel();
    },
  });

  const handlePayment = async () => {
    const validationError = await form
      .validateFields()
      .then(() => null)
      .catch((error) => error);

    if (validationError) {
      console.error('Error al procesar el pago:', validationError);
      notification.error({
        message: 'Error en el pago',
        description:
          validationError instanceof Error
            ? validationError.message
            : 'No se pudo procesar el pago',
        duration: 4,
      });
      return;
    }

    if (!validatePaymentForm()) {
      return;
    }

    setLoading(true);

    const values = form.getFieldsValue();
    const primaryAccount =
      accounts.find((account) => selectedAccounts.includes(account.ver.account.id)) ??
      accounts[0];
    const clientId = primaryAccount?.ver?.account?.client?.id ?? '';
    const paymentData = {
      accounts: selectedAccounts
        .map((id) => {
          const account = accounts.find((acc) => acc.ver?.account?.id === id);
          if (!account) {
            console.warn(`No se encontró la cuenta con ID: ${id}`);
            return null;
          }

          return {
            id: account.ver.account.id,
            balance:
              account.balance ??
              account.ver.account.balance ??
              account.ver.account.account?.arBalance ??
              account.ver.account.account?.currentBalance ??
              0,
            accountData: account.ver.account,
          };
        })
        .filter(
          (accountItem): accountItem is NonNullable<typeof accountItem> =>
            accountItem !== null,
        ),
      paymentDetails: {
        totalAmount: form.getFieldValue('amount'),
        totalPaid,
        paymentMethods: paymentMethods.filter((pm) => pm.status),
        comments: values.comments || '',
        printReceipt,
        paymentScope: 'insurance',
        paymentOption: 'balance',
      },
      insuranceId: insuranceFilter,
      date: new Date().getTime(),
      clientId,
      user,
    };

    const processingError = await fbProcessMultiplePaymentsAR(
      user,
      paymentData,
      setReceipt,
    )
      .then(() => null)
      .catch((error) => error);

    if (processingError) {
      console.error('Error al procesar pagos múltiples:', processingError);
      notification.error({
        message: 'Error en el procesamiento',
        description:
          processingError instanceof Error
            ? processingError.message
            : 'No se pudo procesar el pago múltiple',
        duration: 4,
      });
      setLoading(false);
      return;
    }

    setSubmitted(true);

    if (printReceipt) {
      setTimeout(() => handlePrint(), 1000);
    } else {
      notification.success({
        message: 'Pago Procesado',
        description: 'Pago de Aseguradora Registrado con éxito',
        duration: 4,
      });
      handleCancel();
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setSelectedAccounts([]);
    setInsuranceFilter('none');
    setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    setPrintReceipt(true);
    setMethodErrors({});
    setSubmitted(false);
    setCurrentStep(0);
    form.resetFields();
    onCancel();
  };
  const totalAmount = form.getFieldValue('amount') || 0;
  // Usar una tolerancia pequeña para evitar problemas de punto flotante
  const EPSILON = 0.001; // Umbral de 0,001
  let change = totalPaid - totalAmount;

  // Si la diferencia es muy pequeña (positiva o negativa), considerarla como cero exacto
  if (Math.abs(change) < EPSILON) {
    change = 0;
  }

  const filteredAccounts = getFilteredAccounts();

  const steps = [
    {
      title: 'Seleccionar Cuentas',
      content: (
        <TableSection>
          <FilterBar
            insuranceFilter={insuranceFilter}
            insuranceOptions={insuranceOptions}
            onInsuranceFilterChange={handleInsuranceFilterChange}
            onDateRangeChange={handleDateRangeChange}
          />

          <AccountsTable
            accounts={filteredAccounts}
            allSelected={areAllVisibleSelected()}
            someSelected={areSomeVisibleSelected()}
            selectedAccounts={selectedAccounts}
            onSelectAll={handleSelectAll}
            onSelectAccount={handleSelectAccount}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            insuranceFilter={insuranceFilter}
          />
        </TableSection>
      ),
    },
    {
      title: 'Procesar Pago',
      content: (
        <>
          <ShowcaseList
            showcases={[
              {
                title: 'Total a pagar',
                valueType: 'price',
                description: 'Total de las cuentas seleccionadas',
                value: totalAmount,
              },
            ]}
          />

          <PaymentMethodsForm
            paymentMethods={paymentMethods}
            methodErrors={methodErrors}
            updatePaymentMethod={updatePaymentMethod}
            printReceipt={printReceipt}
            setPrintReceipt={setPrintReceipt}
          />

          <ShowcaseList
            showcases={[
              {
                title: 'Total pagado',
                valueType: 'price',
                value: totalPaid,
              },
              {
                title: change >= 0 ? 'Devuelta' : 'Faltante',
                valueType: 'price',
                value: change,
                description: 'Debe pagar completamente el monto total',
                color: change < 0 ? 'error' : undefined,
              },
            ]}
          />
        </>
      ),
    },
  ];

  const nextStep = () => {
    if (selectedAccounts.length === 0) {
      message.error('Debe seleccionar al menos una cuenta para continuar');
      return;
    }
    setCurrentStep((step) => step + 1);
  };

  const prevStep = () => {
    setCurrentStep((step) => step - 1);
  };

  return (
    <Modal
      title="Pago Múltiple de Aseguradora"
      open={visible}
      onCancel={handleCancel}
      afterOpenChange={(open) => {
        if (!open) {
          return;
        }

        setInsuranceFilter(defaultInsuranceFilter);
        setSelectedAccounts(defaultSelectedAccounts);
        syncSelectionAmount(defaultSelectedAccounts);
      }}
      width={800}
      style={{ top: 10 }}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancelar
        </Button>,
        currentStep > 0 && (
          <Button key="previous" onClick={prevStep}>
            Anterior
          </Button>
        ),
        currentStep < steps.length - 1 ? (
          <Button
            key="next"
            type="primary"
            onClick={nextStep}
            disabled={selectedAccounts.length === 0}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            key="submit"
            type="primary"
            onClick={handlePayment}
            loading={loading}
            disabled={submitted || selectedAccounts.length === 0}
          >
            Procesar Pago
          </Button>
        ),
      ]}
      forceRender
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          amount: 0,
        }}
      >
        <Steps
          current={currentStep}
          items={steps.map((item) => ({ title: item.title }))}
          style={{ marginBottom: 24 }}
        />

        <div>{steps[currentStep].content}</div>

        <div style={{ display: 'none' }}>
          <PaymentReceipt
            receipt={receipt}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            ref={componentToPrintRef}
          />
        </div>
      </Form>
    </Modal>
  );
};

// Estilos
const TableSection = styled.div`
  margin-bottom: 16px;
`;
