import React from 'react';
import { InfoCard } from '../../../../templates/system/InfoCard/InfoCard';

const paymentMethodLabel = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia'
};

export const PaymentMethodInfoCard = ({ paymentMethod }) => {
  const elements = paymentMethod.map((method) => ({
    label: paymentMethodLabel[method.method],
    value: method.status ? 'Sí' : 'No'
  }));

  return (

    <InfoCard title="Método de Pago" elements={elements} />

  );
};


