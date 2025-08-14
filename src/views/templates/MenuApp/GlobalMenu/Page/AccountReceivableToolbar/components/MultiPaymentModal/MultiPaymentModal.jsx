import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Typography, Divider, message, notification, Steps } from 'antd';
import { useReactToPrint } from 'react-to-print';
import { ShowcaseList } from '../../../../../../../templates/system/ShowCase/ShowcaseList';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../../../../features/auth/userSlice';
import styled from 'styled-components';
import { formatMoney } from '../../../../../../../../utils/formatters';
import DateUtils from '../../../../../../../../utils/date/dateUtils';
import { FilterBar, AccountsTable, PaymentMethodsForm, PaymentReceipt } from './components';
import { fbProcessMultiplePaymentsAR } from '../../../../../../../../firebase/proccessAccountsReceivablePayments/insurance/fbProcessMultiplePaymentsAR';

/**
 * Componente principal para el Modal de Pagos Múltiples
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.visible - Estado de visibilidad del modal
 * @param {Function} props.onCancel - Función para cancelar/cerrar el modal
 * @param {Array} props.accounts - Lista de cuentas disponibles para pago
 */
export const MultiPaymentModal = ({ visible, onCancel, accounts = [] }) => {
  // Estado local
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const componentToPrintRef = useRef();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [insuranceFilter, setInsuranceFilter] = useState('none');
  const [insuranceOptions, setInsuranceOptions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentMethods, setPaymentMethods] = useState([
    { method: 'cash', value: 0, status: true },
    { method: 'card', value: 0, reference: '', status: false },
    { method: 'transfer', value: 0, reference: '', status: false },
  ]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [methodErrors, setMethodErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  // Funciones de formato
  const formatCurrency = (amount) => formatMoney(amount);
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return DateUtils.convertMillisToFriendlyDate(date).split(' ')[0];
  };

  // Extraer las aseguradoras únicas al cargar los datos
  useEffect(() => {
    const uniqueInsurances = accounts
      .filter(account => account.ver?.account?.account?.insurance?.name)
      .map(account => ({
        name: account.ver.account.account.insurance.name,
        id: account.ver.account.account.insurance.insuranceId
      }))
      .reduce((unique, item) => {
        if (!unique.some(i => i.id === item.id)) {
          unique.push(item);
        }
        return unique;
      }, []);

    uniqueInsurances.sort((a, b) => a.name.localeCompare(b.name));
    setInsuranceOptions(uniqueInsurances);

    if (uniqueInsurances.length > 0) {
      const firstInsuranceId = uniqueInsurances[0].id;
      setInsuranceFilter(firstInsuranceId);

      const firstInsuranceAccounts = accounts.filter(account => 
        account.ver?.account?.account?.insurance?.insuranceId === firstInsuranceId
      );

      if (firstInsuranceAccounts.length > 0) {
        const initialSelectedAccounts = firstInsuranceAccounts.map(account => account.ver.account.id);
        setSelectedAccounts(initialSelectedAccounts);
      }
    }
  }, [accounts]);

  useEffect(() => {
    const total = selectedAccounts.reduce((sum, accountId) => {
      const account = accounts.find(acc => acc.ver.account.id === accountId);
      return sum + (account?.balance || 0);
    }, 0);

    form.setFieldsValue({ amount: total });
    updatePaymentMethod('cash', 'value', total);
  }, [selectedAccounts, accounts, form]);

  useEffect(() => {
    const total = paymentMethods.reduce((sum, method) => {
      if (method.status) {
        return sum + (parseFloat(method.value) || 0);
      }
      return sum;
    }, 0);
    setTotalPaid(total);
  }, [paymentMethods]);  const updatePaymentMethod = (method, key, value) => {
    // Si estamos actualizando el valor de un método de pago
    if (key === 'value') {
      // Si el campo está vacío, mantenerlo vacío (no convertir a 0)
      if (value === '' || value === null || value === undefined) {
        setPaymentMethods(prevMethods => 
          prevMethods.map(pm => 
            pm.method === method ? { ...pm, value: '', status: pm.status } : pm
          )
        );
      } 
      // Si es el método de efectivo y tiene un valor numérico
      else if (method === 'cash' && !isNaN(parseFloat(value))) {
        const numericValue = parseFloat(value).toFixed(2);
        
        setPaymentMethods(prevMethods => 
          prevMethods.map(pm => 
            pm.method === 'cash' ? { ...pm, value: parseFloat(numericValue), status: true } : pm
          )
        );
      } 
      // Para otros métodos de pago o valores no numéricos
      else {
        setPaymentMethods(prevMethods => 
          prevMethods.map(pm => 
            pm.method === method ? { ...pm, [key]: value } : pm
          )
        );
      }
    } else {
      // Para otras propiedades que no son 'value'
      setPaymentMethods(prevMethods => 
        prevMethods.map(pm => 
          pm.method === method ? { ...pm, [key]: value } : pm
        )
      );
    }

    if (key === 'status' || key === 'value') {
      validatePaymentMethod(method, key, value);
    }
  };

  const validatePaymentMethod = (method, key, value) => {
    const updatedErrors = { ...methodErrors };

    Object.keys(updatedErrors).forEach(errorKey => {
      if (errorKey.startsWith(`${method}_`)) {
        delete updatedErrors[errorKey];
      }
    });

    const paymentMethod = paymentMethods.find(pm => pm.method === method);

    if ((key === 'status' && value === true) || paymentMethod.status) {
      if ((key === 'value' && (!value || parseFloat(value) <= 0)) || 
          (key !== 'value' && paymentMethod.value <= 0)) {
        updatedErrors[`${method}_value`] = 'El valor debe ser mayor a cero';
      }

      if (method !== 'cash') {
        const reference = key === 'reference' ? value : paymentMethod.reference;
        if (!reference || reference.trim() === '') {
          updatedErrors[`${method}_reference`] = 'La referencia es obligatoria';
        }
      }
    }

    setMethodErrors(updatedErrors);
    return Object.keys(updatedErrors).length === 0;  };

  const validatePaymentForm = () => {
    let isValid = true;
    const newErrors = {};

    if (selectedAccounts.length === 0) {
      message.error('Debe seleccionar al menos una cuenta para pagar');
      return false;
    }

    const totalAmount = form.getFieldValue('amount');
    if (!totalAmount || totalAmount <= 0) {
      message.error('El monto total debe ser mayor a cero');
      return false;
    }

    const activeMethods = paymentMethods.filter(method => method.status);
    if (activeMethods.length === 0) {
      message.error('Debe seleccionar al menos un método de pago');
      return false;
    }

    for (const method of paymentMethods) {
      if (method.status) {
        if (!method.value || method.value <= 0) {
          newErrors[`${method.method}_value`] = 'El valor debe ser mayor a cero';
          isValid = false;
        }

        if (method.method !== 'cash') {
          if (!method.reference || method.reference.trim() === '') {
            newErrors[`${method.method}_reference`] = 'La referencia es obligatoria';
            isValid = false;
          }
        }
      }
    }    // Usar el mismo umbral de tolerancia EPSILON para comparar valores
    const EPSILON = 0.001;
    if (totalPaid < totalAmount && Math.abs(totalPaid - totalAmount) >= EPSILON) {
      message.error('El monto pagado debe ser igual o mayor al monto total');
      return false;
    }

    setMethodErrors(newErrors);
    return isValid;
  };

  const getFilteredAccounts = () => {
    if (insuranceFilter === 'none') return [];
    if (insuranceFilter === 'all') return accounts;

    return accounts.filter(account => 
      account.ver?.account?.account?.insurance?.insuranceId === insuranceFilter
    );
  };

  const handleSelectAccount = (e, accountId) => {
    if (e.target.checked) {
      setSelectedAccounts([...selectedAccounts, accountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    }
  };

  const areAllVisibleSelected = () => {
    const filteredAccounts = getFilteredAccounts();
    if (filteredAccounts.length === 0) return false;

    return filteredAccounts.every(account => 
      selectedAccounts.includes(account.ver.account.id)
    );
  };

  const areSomeVisibleSelected = () => {
    const filteredAccounts = getFilteredAccounts();
    return filteredAccounts.some(account => 
      selectedAccounts.includes(account.ver.account.id)
    );
  };

  const handleSelectAll = (e) => {
    const filteredAccounts = getFilteredAccounts();
    if (e.target.checked) {
      const filteredIds = filteredAccounts.map(account => account.ver.account.id);
      const otherSelected = selectedAccounts.filter(id => 
        !filteredAccounts.some(account => account.ver.account.id === id)
      );
      setSelectedAccounts([...otherSelected, ...filteredIds]);
    } else {
      const filteredIds = filteredAccounts.map(account => account.ver.account.id);
      setSelectedAccounts(selectedAccounts.filter(id => !filteredIds.includes(id)));
    }
  };

  const handleInsuranceFilterChange = (value) => {
    setInsuranceFilter(value);

    const filteredAccounts = accounts.filter(account => 
      account.ver?.account?.account?.insurance?.insuranceId === value
    );

    if (filteredAccounts.length > 0) {
      const newSelectedAccounts = filteredAccounts.map(account => account.ver.account.id);
      setSelectedAccounts(newSelectedAccounts);
    } else {
      setSelectedAccounts([]);
    }
  };
  const handleDateRangeChange = (dates) => {
    // Handle date range change
  };

  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    onAfterPrint: () => {
      notification.success({
        message: 'Pago Procesado',
        description: 'Pago de Aseguradora Registrado con éxito',
        duration: 4
      });
      handleCancel();
    }
  });

  const handlePayment = async () => {
    try {
      await form.validateFields();

      if (!validatePaymentForm()) {
        return;
      }

      setLoading(true);

      const values = form.getFieldsValue();      // Preparar datos de pago para el procesamiento
      const paymentData = {
        accounts: selectedAccounts.map(id => {
          // Buscar la cuenta usando la estructura correcta (ver.account.id en lugar de id)
          const account = accounts.find(acc => acc.ver?.account?.id === id);
          if (!account) {
            console.warn(`No se encontró la cuenta con ID: ${id}`);
            return null;
          }
            // Acceder al balance correctamente - puede estar en account.balance o account.ver.account
          
          return {
            id: account.ver.account.id,
            // Usamos el balance de la ubicación correcta, con fallbacks
            balance: account.balance || account.ver.account.arBalance || account.ver.account.balance || 0,
            // Incluir datos adicionales que puedan ser necesarios
            accountData: account.ver.account
          };
        }).filter(Boolean), // Filtrar cualquier cuenta null
        paymentDetails: {
          totalAmount: form.getFieldValue('amount'),
          totalPaid,
          paymentMethods: paymentMethods.filter(pm => pm.status),
          comments: values.comments || '',
          printReceipt,
          paymentScope: 'insurance', // Especificar un scope similar a los que usa fbProcessClientPaymentAR
          paymentOption: 'balance'   // Indicar que queremos pagar el balance completo
        },
        insuranceId: insuranceFilter,
        date: new Date().getTime(),
        clientId: accounts[0]?.client?.id || '',
        user
      };

      try {
        // Procesar el pago utilizando el método adecuado
        const result = await fbProcessMultiplePaymentsAR(user, paymentData, setReceipt);

        setSubmitted(true);

        if (printReceipt) {
          setTimeout(() => handlePrint(), 1000);
        } else {
          notification.success({
            message: 'Pago Procesado',
            description: 'Pago de Aseguradora Registrado con éxito',
            duration: 4
          });
          handleCancel();
        }
      } catch (error) {
        console.error('Error al procesar pagos múltiples:', error);
        notification.error({
          message: 'Error en el procesamiento',
          description: error.message || 'No se pudo procesar el pago múltiple',
          duration: 4
        });
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      notification.error({
        message: 'Error en el pago',
        description: error.message || 'No se pudo procesar el pago',
        duration: 4
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
      )
    },
    {
      title: 'Procesar Pago',
      content: (
        <>
          <ShowcaseList
            showcases={[
              {
                title: "Total a pagar",
                valueType: "price",
                description: "Total de las cuentas seleccionadas",
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
                title: "Total pagado",
                valueType: "price",
                value: totalPaid,
              },
              {
                title: change >= 0 ? "Devuelta" : "Faltante",
                valueType: "price",
                value: change,
                description: "Debe pagar completamente el monto total",
                color: change < 0 ? "error" : undefined
              },
            ]}
          />
        </>
      )
    }
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
          <Button key="next" type="primary" onClick={nextStep} disabled={selectedAccounts.length === 0}>
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
          </Button>        ),
      ]}
      destroyOnHidden
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
          items={steps.map(item => ({ title: item.title }))}
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