import React from 'react';
import { InfoCard } from '../../../../templates/system/InfoCard/InfoCard';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';

const SummaryInfoCard = ({ summaryData }) => {
  const {
    sourceOfPurchase,
    totalShoppingItems,
    totalPurchaseWithoutTaxes,
    totalTaxes,
    payment
  } = summaryData;

  const elements = [
    { label: 'Método de Compra', value: sourceOfPurchase ?? 'N/A' },
    { label: 'Total de Artículos', value: totalShoppingItems.value ?? 'N/A' },
    { label: 'Subtotal', value: useFormatPrice(totalPurchaseWithoutTaxes.value) ?? 'N/A' },
    { label: 'Impuestos', value: useFormatPrice(totalTaxes.value) ?? 'N/A' },
    { label: 'Total Pagado', value: useFormatPrice(payment.value) ?? 'N/A' }
  ];

  return (
  
      <InfoCard title="Resumen" elements={elements} />
  
  );
};

export default SummaryInfoCard;
