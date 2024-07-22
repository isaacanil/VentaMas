import { Bar } from 'react-chartjs-2';
import React, { useEffect, useMemo, useRef } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

const translatePaymentMethod = (method) => {
    switch (method) {
      case 'card':
        return 'Tarjeta';
      case 'cash':
        return 'Efectivo';
      case 'transfer':
        return 'Transferencia';
      default:
        return method;
    }
  };

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Ventas ($)',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Método de Pago',
      },
    },
  },
};

const accumulatePaymentMethodData = (sales) => {
  return sales.reduce((acc, sale) => {
    sale.data.paymentMethod.forEach(method => {
      if (method.status) {
        const methodType = translatePaymentMethod(method.method)
        acc[methodType] = (acc[methodType] || 0) + method.value;
      }
    });
    return acc;
  }, {});
};

export const PaymentMethodBarChart = ({sales}) => {
  if (!sales || !Array.isArray(sales)) {
      return null;  // or some fallback UI
    }

  const salesByPaymentMethod = useMemo(() => accumulatePaymentMethodData(sales), [sales]);

  const data = useMemo(() => {
    const labels = Object.keys(salesByPaymentMethod);
    const dataTotals = labels.map(label => salesByPaymentMethod[label]);

    return {
      labels,
      datasets: [{
        label: 'Ventas ($)',
        data: dataTotals,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  }, [salesByPaymentMethod]);

  return (
    <Container>
      <Typography variant='h3'>Ventas por Método de Pago</Typography>
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
