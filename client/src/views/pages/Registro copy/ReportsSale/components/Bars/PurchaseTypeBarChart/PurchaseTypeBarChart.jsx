import { Bar } from 'react-chartjs-2';
import React, { useEffect, useMemo } from 'react';
import { LinearScale, CategoryScale, BarElement, Chart, Tooltip } from "chart.js";
import styled from 'styled-components';
import Typography from '../../../../../../templates/system/Typografy/Typografy';

Chart.register(LinearScale, CategoryScale, BarElement, Tooltip);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Número de Ventas',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Tipo de Compra',
      },
    },
  },
};

const accumulatePurchaseTypeData = (sales) => {
  return sales.reduce((acc, sale) => {
    const type = sale.data.sourceOfPurchase;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
};

export const PurchaseTypeBarChart = ({sales}) => {
  if (!sales || !Array.isArray(sales)) {
      return null;  // or some fallback UI
    }

  const salesByType = useMemo(() => accumulatePurchaseTypeData(sales), [sales]);

  const data = useMemo(() => {
    const labels = Object.keys(salesByType);
    const dataTotals = labels.map(label => salesByType[label]);

    return {
      labels,
      datasets: [{
        label: 'Número de Ventas',
        data: dataTotals,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  }, [salesByType]);

  return (
    <Container>
      <Typography variant='h3'>Ventas por Tipo de Compra</Typography>
      <Bar data={data} options={options} />
    </Container>
  );
};

const Container = styled.div`
    height: 200px;
    display: grid;
    gap: 1em;
`;
