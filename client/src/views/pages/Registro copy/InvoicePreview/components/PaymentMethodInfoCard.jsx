import React from 'react';
import { InfoCard } from '../../../../templates/system/InfoCard/InfoCard';
// Asegúrate de importar el componente InfoCard desde la ubicación correcta
const paymentmethodLabel = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia'
    };
export const PaymentMethodInfoCard = ({ paymentMethod }) => {
  const elements = paymentMethod.map((method, index) => ({
    label: paymentmethodLabel[method.method],
    value: method.status ? 'Sí' : 'No'
  }));

  return (

      <InfoCard title="Método de Pago" elements={elements} />
 
  );
};


