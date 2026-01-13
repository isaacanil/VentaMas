import { Modal, Button, Form, message, notification, Steps } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
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

export const MultiPaymentModal = ({
  visible,
  onCancel,
  accounts = [],
}: MultiPaymentModalProps) => {
  // Estado local
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [form] = Form.useForm();
  const user = useSelector(selectUser) as UserIdentity | null;
  const componentToPrintRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);
  const [insuranceFilter, setInsuranceFilter] = useState('none');
  const [insuranceOptions, setInsuranceOptions] = useState<InsuranceOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState([
    { method: 'cash', value: 0, status: true },
    { method: 'card', value: 0, reference: '', status: false },
    { method: 'transfer', value: 0, reference: '', status: false },
  ] as PaymentMethod[]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [methodErrors, setMethodErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  // Funciones de formato
  const formatCurrency = (amount?: number | string | null) => formatMoney(amount);
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
              (key === 'value' && (!value || !Number.isFinite(numericValue) || numericValue <= 0)) ||
              (key !== 'value' && Number(selectedMethod?.value) <= 0)
            ) {
              updatedErrors[`${method}_value`] =
                'El valor debe ser mayor a cero';
            }

            if (method !== 'cash') {
              const referenceValue =
                key === 'reference' ? value : selectedMethod?.reference;
              const referenceText =
                typeof referenceValue === 'string'
                  ? referenceValue.trim()
                  : '';
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

  // Extraer las aseguradoras únicas al cargar los datos
  useEffect(() => {
    const uniqueInsurances = accounts
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
      }, []);

    uniqueInsurances.sort((a, b) => a.name.localeCompare(b.name));
    setInsuranceOptions(uniqueInsurances);

    if (uniqueInsurances.length > 0) {
      const firstInsuranceId = uniqueInsurances[0].id;
      setInsuranceFilter(firstInsuranceId);

      const firstInsuranceAccounts = accounts.filter(
        (account) =>
          account.ver?.account?.account?.insurance?.insuranceId ===
          firstInsuranceId,
      );

      if (firstInsuranceAccounts.length > 0) {
        const initialSelectedAccounts = firstInsuranceAccounts.map(
          (account) => account.ver.account.id,
        );
        setSelectedAccounts(initialSelectedAccounts);
      }
    }
  }, [accounts]);

  useEffect(() => {
    const total = selectedAccounts.reduce((sum, accountId) => {
      const account = accounts.find((acc) => acc.ver.account.id === accountId);
      return sum + (account?.balance || 0);
    }, 0);

    form.setFieldsValue({ amount: total });
    updatePaymentMethod('cash', 'value', total);
  }, [selectedAccounts, accounts, form, updatePaymentMethod]);

  useEffect(() => {
    const total = paymentMethods.reduce((sum, method) => {
      if (method.status) {
        return sum + (Number(method.value) || 0);
      }
      return sum;
    }, 0);
    setTotalPaid(total);
  }, [paymentMethods]);

  

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

  const handleSelectAccount = (
    e: CheckboxChangeEvent,
    accountId: string,  ) => {
    setSelectedAccounts((prevSelected) =>
      e.target.checked
        ? [...prevSelected, accountId]
        : prevSelected.filter((id) => id !== accountId),
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
        return [...otherSelected, ...filteredIds];
      }

      return prevSelected.filter((id) => !filteredIds.includes(id));
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
    } else {
      setSelectedAccounts([]);
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
    try {
      await form.validateFields();

      if (!validatePaymentForm()) {
        return;
      }

      setLoading(true);

      const values = form.getFieldsValue(); // Preparar datos de pago para el procesamiento
      const primaryAccount =
        accounts.find((account) =>
          selectedAccounts.includes(account.ver.account.id),
        ) ?? accounts[0];
      const clientId = primaryAccount?.ver?.account?.client?.id ?? '';
      const paymentData = {
        accounts: selectedAccounts
          .map((id) => {
            // Buscar la cuenta usando la estructura correcta (ver.account.id en lugar de id)
            const account = accounts.find((acc) => acc.ver?.account?.id === id);
            if (!account) {
              console.warn(`No se encontró la cuenta con ID: ${id}`);
              return null;
            }
            // Acceder al balance correctamente - puede estar en account.balance o account.ver.account

            return {
              id: account.ver.account.id,
              // Usamos el balance de la ubicación correcta, con fallbacks
              balance:
                account.balance ??
                account.ver.account.balance ??
                account.ver.account.account?.arBalance ??
                account.ver.account.account?.currentBalance ??
                0,
              // Incluir datos adicionales que puedan ser necesarios
              accountData: account.ver.account,
            };
          })
            .filter((accountItem): accountItem is NonNullable<typeof accountItem> => accountItem !== null), // Filtrar cualquier cuenta null
        paymentDetails: {
          totalAmount: form.getFieldValue('amount'),
          totalPaid,
          paymentMethods: paymentMethods.filter((pm) => pm.status),
          comments: values.comments || '',
          printReceipt,
          paymentScope: 'insurance', // Especificar un scope similar a los que usa fbProcessClientPaymentAR
          paymentOption: 'balance', // Indicar que queremos pagar el balance completo
        },
        insuranceId: insuranceFilter,
        date: new Date().getTime(),
        clientId,
        user,
      };

      try {
        // Procesar el pago utilizando el método adecuado
        await fbProcessMultiplePaymentsAR(user, paymentData, setReceipt);

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
      } catch (error) {
        console.error('Error al procesar pagos múltiples:', error);
      notification.error({
        message: 'Error en el procesamiento',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo procesar el pago múltiple',
        duration: 4,
      });
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      notification.error({
        message: 'Error en el pago',
        description:
          error instanceof Error ? error.message : 'No se pudo procesar el pago',
        duration: 4,
      });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedAccounts([]);
    setInsuranceFilter('none');
    setPaymentMethods([
      { method: 'cash', value: 0, status: true },
      { method: 'card', value: 0, reference: '', status: false },
      { method: 'transfer', value: 0, reference: '', status: false },
    ]);
    setTotalPaid(0);
    setPrintReceipt(true);
    setMethodErrors({});
    setSubmitted(false);
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
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Modal
      title="Pago Múltiple de Aseguradora"
      open={visible}
      onCancel={handleCancel}
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
