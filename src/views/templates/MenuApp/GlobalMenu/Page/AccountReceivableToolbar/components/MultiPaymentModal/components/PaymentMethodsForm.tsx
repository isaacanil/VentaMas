// @ts-nocheck
import { Form, Input, InputNumber, Checkbox, Typography } from 'antd';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const { Title } = Typography;

/**
 * Componente para el formulario de métodos de pago
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.paymentMethods - Array de métodos de pago disponibles
 * @param {Object} props.methodErrors - Errores asociados a cada método de pago
 * @param {Function} props.updatePaymentMethod - Función para actualizar un método de pago
 * @param {boolean} props.printReceipt - Estado de la opción de imprimir recibo
 * @param {Function} props.setPrintReceipt - Función para cambiar el estado de imprimir recibo
 */
const PaymentMethodsForm = ({
  paymentMethods,
  methodErrors,
  updatePaymentMethod,
  printReceipt,
  setPrintReceipt,
}) => {
  // Referencias para los inputs
  const inputRefs = useRef({});

  // Mapping de nombres de métodos de pago a texto legible
  const getMethodDisplayName = (method) => {
    switch (method) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'transfer':
        return 'Transferencia';
      default:
        return method;
    }
  };

  // Efecto para enfocar el primer método activo al cargar
  useEffect(() => {
    const activeMethod = paymentMethods.find((m) => m.status);
    if (activeMethod && inputRefs.current[activeMethod.method]) {
      setTimeout(() => {
        inputRefs.current[activeMethod.method].focus();
        inputRefs.current[activeMethod.method].select();
      }, 100);
    }
  }, [paymentMethods]);

  // Manejar cambio de estado de un método de pago
  const handleMethodStatusChange = (method, checked) => {
    // Al activar un método, establecer un valor predeterminado si está vacío
    if (checked && (!method.value || method.value === 0)) {
      // Al activar, asignar el monto total si es el primer método activo
      const activeMethodsCount = paymentMethods.filter((m) => m.status).length;
      if (activeMethodsCount === 0) {
        // Buscar el valor total a pagar
        const totalField = document.querySelector('input[name="amount"]');
        const totalValue = totalField ? parseFloat(totalField.value || 0) : 0;
        updatePaymentMethod(method.method, 'value', totalValue);
      } else {
        updatePaymentMethod(method.method, 'value', 0);
      }
    }

    // Actualizar el estado del método
    updatePaymentMethod(method.method, 'status', checked);

    // Enfocar el input correspondiente
    if (checked && inputRefs.current[method.method]) {
      setTimeout(() => {
        inputRefs.current[method.method].focus();
        inputRefs.current[method.method].select();
      }, 0);
    }
  };

  return (
    <PaymentSection>
      <Title level={5}>Información del Pago</Title>

      {paymentMethods.map((paymentMethod) => (
        <PaymentRefGroup key={paymentMethod.method}>
          <Form.Item
            name={paymentMethod.method}
            validateStatus={
              paymentMethod.status &&
              methodErrors[`${paymentMethod.method}_value`]
                ? 'error'
                : ''
            }
            help={
              paymentMethod.status
                ? methodErrors[`${paymentMethod.method}_value`]
                : null
            }
          >
            <div className="payment-method-row">
              <Checkbox
                checked={paymentMethod.status}
                onChange={(e) =>
                  handleMethodStatusChange(paymentMethod, e.target.checked)
                }
              >
                {getMethodDisplayName(paymentMethod.method)}
              </Checkbox>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                formatter={(value) =>
                  `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                value={paymentMethod.value}
                disabled={!paymentMethod.status}
                onChange={(value) =>
                  updatePaymentMethod(
                    paymentMethod.method,
                    'value',
                    parseFloat(value || 0),
                  )
                }
                ref={(el) => {
                  if (el) {
                    inputRefs.current[paymentMethod.method] = el;
                  }
                }}
              />
            </div>
          </Form.Item>

          {paymentMethod.method !== 'cash' && (
            <Form.Item
              name={`${paymentMethod.method}Reference`}
              label="Referencia"
              validateStatus={
                paymentMethod.status &&
                methodErrors[`${paymentMethod.method}_reference`]
                  ? 'error'
                  : ''
              }
              help={
                paymentMethod.status
                  ? methodErrors[`${paymentMethod.method}_reference`]
                  : null
              }
            >
              <Input
                placeholder="Referencia"
                value={paymentMethod.reference}
                disabled={!paymentMethod.status}
                onChange={(e) =>
                  updatePaymentMethod(
                    paymentMethod.method,
                    'reference',
                    e.target.value,
                  )
                }
              />
            </Form.Item>
          )}
        </PaymentRefGroup>
      ))}

      <Form.Item name="comments" label="Comentarios">
        <Input.TextArea
          rows={2}
          placeholder="Comentarios sobre el pago (opcional)"
        />
      </Form.Item>

      <Form.Item>
        <Checkbox
          checked={printReceipt}
          onChange={(e) => setPrintReceipt(e.target.checked)}
        >
          Imprimir recibo de pago
        </Checkbox>
      </Form.Item>
    </PaymentSection>
  );
};

// Estilos
const PaymentSection = styled.div`
  margin: 16px 0;
`;

const PaymentRefGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4em;

  .payment-method-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

export default PaymentMethodsForm;
